/**
 * Unit tests for the VAPI inbound webhook content-presence guard
 * (server/lib/vapiInboundGuard.ts).
 *
 * Bug being fixed: `I-NEW-2026-04-26-D` — VAPI inbound was creating
 * voice-channel conversation rows for end-of-call events that arrived
 * with no transcript / no summary / no messages array (ringing-only,
 * hangup-before-pickup, failed-connect). Those rows surfaced as orphan
 * voice conversations in TeamBox.
 *
 * Test coverage required by parent dispatch:
 *   (a) no-transcript / no-summary / placeholder VAPI event
 *       → IGNORE (no row created)
 *   (b) legitimate VAPI event with transcript/summary
 *       → CREATE (extract fields)
 *   (c) duplicate / replayed VAPI events with the same call id
 *       → idempotency is the route's existing dedup map's job, not
 *         this guard's; the guard returns CREATE for both calls and
 *         the route's `processedVapiCalls` then deduplicates. Tested
 *         here at the guard level (both events produce CREATE with the
 *         same vapiCallId so the route's dedup keys line up).
 *
 * The guard is a pure function. These tests inject the parsed payload
 * directly — no DB, no filesystem, no network.
 */

import { describe, it, expect } from "vitest";
import {
  evaluateVapiInboundGuard,
  type VapiInboundGuardInput,
} from "@server/lib/vapiInboundGuard";

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

const TEST_TRANSCRIPT = [
  "Assistant: Hello, this is Serra Honda. How can I help you?",
  "User: Hi, I'm calling about the 2026 Accord.",
  "Assistant: Great, we have several in stock.",
].join("\n");

const TEST_SUMMARY = "Customer interested in 2026 Honda Accord.";

function makeEndOfCallPayload(overrides: {
  callId?: string;
  customerName?: string;
  customerPhone?: string;
  assistantId?: string;
  transcript?: string;
  summary?: string;
  recordingUrl?: string;
  messages?: Array<{ role?: string; message?: string; content?: string }>;
} = {}): VapiInboundGuardInput {
  return {
    eventType: "end-of-call-report",
    call: {
      id: overrides.callId ?? "call-test-123",
      type: "inboundPhoneCall",
      status: "ended",
      assistantId: overrides.assistantId ?? "asst-honda-001",
      customer: {
        number: overrides.customerPhone ?? "+14805550199",
        name: overrides.customerName ?? "Real Caller",
      },
      phoneNumber: { number: "+18005551234" },
      transcript: overrides.transcript,
      summary: overrides.summary,
      recordingUrl: overrides.recordingUrl,
      messages: overrides.messages,
    },
  };
}

function makeCallEndedPayload(overrides: {
  callId?: string;
  customerName?: string;
  customerPhone?: string;
  assistantId?: string;
} = {}): VapiInboundGuardInput {
  // call-ended typically carries no transcript content. This is the
  // shape that produced the orphan rows.
  return {
    eventType: "call-ended",
    call: {
      id: overrides.callId ?? "call-ringing-456",
      type: "inboundPhoneCall",
      status: "ended",
      assistantId: overrides.assistantId ?? "asst-honda-001",
      customer: {
        number: overrides.customerPhone ?? "+14805550199",
        name: overrides.customerName ?? "Unknown Caller",
      },
      phoneNumber: { number: "+18005551234" },
    },
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("evaluateVapiInboundGuard", () => {
  // ── Required scenario (a): no-content events ────────────────────────────
  describe("no-content events → IGNORE (orphan-prevention)", () => {
    it("call-ended with no transcript / summary / messages → IGNORE", () => {
      const decision = evaluateVapiInboundGuard(makeCallEndedPayload());
      expect(decision.action).toBe("ignore");
      if (decision.action === "ignore") {
        expect(decision.ignoredByEventType).toBe(false);
        expect(decision.reason).toMatch(/I-NEW-2026-04-26-D/);
      }
    });

    it("end-of-call-report with no transcript / summary / messages → IGNORE", () => {
      const decision = evaluateVapiInboundGuard(
        makeEndOfCallPayload({
          transcript: undefined,
          summary: undefined,
          messages: undefined,
        }),
      );
      expect(decision.action).toBe("ignore");
      if (decision.action === "ignore") {
        expect(decision.ignoredByEventType).toBe(false);
      }
    });

    it("empty-string transcript and empty-string summary → IGNORE", () => {
      const decision = evaluateVapiInboundGuard(
        makeEndOfCallPayload({ transcript: "", summary: "" }),
      );
      expect(decision.action).toBe("ignore");
    });

    it("whitespace-only transcript → IGNORE (treated as no content)", () => {
      const decision = evaluateVapiInboundGuard(
        makeEndOfCallPayload({ transcript: "   \n\t  ", summary: "" }),
      );
      expect(decision.action).toBe("ignore");
    });

    it("empty messages array → IGNORE", () => {
      const decision = evaluateVapiInboundGuard(
        makeEndOfCallPayload({ messages: [] }),
      );
      expect(decision.action).toBe("ignore");
    });

    it("messages array with all-empty entries → IGNORE", () => {
      const decision = evaluateVapiInboundGuard(
        makeEndOfCallPayload({
          messages: [{ role: "user" }, { role: "assistant", message: "" }],
        }),
      );
      expect(decision.action).toBe("ignore");
    });

    it("non-conversation event type (status-update) → IGNORE by event type", () => {
      const decision = evaluateVapiInboundGuard({
        eventType: "status-update",
        call: { id: "call-1", status: "in-progress" },
      });
      expect(decision.action).toBe("ignore");
      if (decision.action === "ignore") {
        expect(decision.ignoredByEventType).toBe(true);
      }
    });

    it("non-conversation event type with content → still IGNORE by event type", () => {
      // Even if a status-update somehow carries transcript text, we do
      // not create rows from it. Only end-of-call-report / call-ended
      // are conversation-creating events.
      const decision = evaluateVapiInboundGuard({
        eventType: "speech-update",
        call: {
          id: "call-1",
          status: "in-progress",
          transcript: "partial transcript fragment",
        },
      });
      expect(decision.action).toBe("ignore");
      if (decision.action === "ignore") {
        expect(decision.ignoredByEventType).toBe(true);
      }
    });
  });

  // ── Required scenario (b): legitimate content → CREATE ──────────────────
  describe("legitimate end-of-call events → CREATE", () => {
    it("transcript only → CREATE with content-present reason", () => {
      const decision = evaluateVapiInboundGuard(
        makeEndOfCallPayload({ transcript: TEST_TRANSCRIPT }),
      );
      expect(decision.action).toBe("create");
      if (decision.action === "create") {
        expect(decision.reason).toBe("content-present");
        expect(decision.transcript).toBe(TEST_TRANSCRIPT);
        expect(decision.summary).toBe("");
        expect(decision.hasTranscript).toBe(true);
        expect(decision.hasSummary).toBe(false);
        expect(decision.customerName).toBe("Real Caller");
        expect(decision.customerPhone).toBe("+14805550199");
        expect(decision.vapiCallId).toBe("call-test-123");
        expect(decision.assistantId).toBe("asst-honda-001");
      }
    });

    it("summary only → CREATE", () => {
      const decision = evaluateVapiInboundGuard(
        makeEndOfCallPayload({ summary: TEST_SUMMARY }),
      );
      expect(decision.action).toBe("create");
      if (decision.action === "create") {
        expect(decision.transcript).toBe("");
        expect(decision.summary).toBe(TEST_SUMMARY);
        expect(decision.hasSummary).toBe(true);
      }
    });

    it("transcript + summary → CREATE with both extracted", () => {
      const decision = evaluateVapiInboundGuard(
        makeEndOfCallPayload({
          transcript: TEST_TRANSCRIPT,
          summary: TEST_SUMMARY,
        }),
      );
      expect(decision.action).toBe("create");
      if (decision.action === "create") {
        expect(decision.transcript).toBe(TEST_TRANSCRIPT);
        expect(decision.summary).toBe(TEST_SUMMARY);
      }
    });

    it("messages array (structured transcript) → CREATE; transcript folded from array", () => {
      const decision = evaluateVapiInboundGuard(
        makeEndOfCallPayload({
          messages: [
            { role: "assistant", message: "Hello, welcome to the dealership." },
            { role: "user", message: "I want to schedule a test drive please." },
          ],
        }),
      );
      expect(decision.action).toBe("create");
      if (decision.action === "create") {
        expect(decision.transcript).toContain("assistant: Hello, welcome");
        expect(decision.transcript).toContain("user: I want to schedule");
      }
    });

    it("transcript at message level (end-of-call-report wrapper) → CREATE", () => {
      // VAPI sometimes places transcript at the wrapper level rather
      // than on call. The guard accepts it via topLevelTranscript.
      const input: VapiInboundGuardInput = {
        eventType: "end-of-call-report",
        call: {
          id: "call-wrapper-1",
          status: "ended",
          customer: { number: "+14805550199", name: "Real Caller" },
        },
        topLevelTranscript: TEST_TRANSCRIPT,
        topLevelSummary: TEST_SUMMARY,
      };
      const decision = evaluateVapiInboundGuard(input);
      expect(decision.action).toBe("create");
      if (decision.action === "create") {
        expect(decision.transcript).toBe(TEST_TRANSCRIPT);
        expect(decision.summary).toBe(TEST_SUMMARY);
      }
    });

    it("transcript inside artifact → CREATE", () => {
      const input: VapiInboundGuardInput = {
        eventType: "end-of-call-report",
        call: {
          id: "call-artifact-1",
          status: "ended",
          customer: { number: "+14805550199", name: "Real Caller" },
          artifact: {
            transcript: TEST_TRANSCRIPT,
            recordingUrl: "https://example.com/r.mp3",
          },
        },
      };
      const decision = evaluateVapiInboundGuard(input);
      expect(decision.action).toBe("create");
      if (decision.action === "create") {
        expect(decision.transcript).toBe(TEST_TRANSCRIPT);
        expect(decision.recordingUrl).toBe("https://example.com/r.mp3");
      }
    });
  });

  // ── Required scenario (c): duplicate/replayed events ────────────────────
  describe("duplicate / replayed events with same call id", () => {
    it("two identical events both decide CREATE; idempotency is the route's job", () => {
      // The guard is stateless. Same call id, same content → both
      // events resolve to CREATE with the same vapiCallId. The route's
      // existing `processedVapiCalls` dedup map then short-circuits the
      // second one. This test pins the contract: the guard does NOT
      // attempt cross-event memory.
      const event1 = makeEndOfCallPayload({
        callId: "call-replay-001",
        transcript: TEST_TRANSCRIPT,
        summary: TEST_SUMMARY,
      });
      const event2 = makeEndOfCallPayload({
        callId: "call-replay-001",
        transcript: TEST_TRANSCRIPT,
        summary: TEST_SUMMARY,
      });

      const d1 = evaluateVapiInboundGuard(event1);
      const d2 = evaluateVapiInboundGuard(event2);

      expect(d1.action).toBe("create");
      expect(d2.action).toBe("create");
      if (d1.action === "create" && d2.action === "create") {
        // Stable extraction → route's dedup map will see the same key.
        expect(d1.vapiCallId).toBe(d2.vapiCallId);
        expect(d1.vapiCallId).toBe("call-replay-001");
        expect(d1.customerPhone).toBe(d2.customerPhone);
      }
    });

    it("first event is no-content (ignored), second event has transcript → second creates", () => {
      // VAPI sometimes emits a content-less call-ended followed by an
      // end-of-call-report carrying the transcript. Under the guard,
      // the first event is suppressed (no row), the second creates the
      // row with full content. This is the desired ordering: no orphan
      // row from the first event.
      const event1 = makeCallEndedPayload({ callId: "call-ordering-001" });
      const event2 = makeEndOfCallPayload({
        callId: "call-ordering-001",
        transcript: TEST_TRANSCRIPT,
        summary: TEST_SUMMARY,
      });

      const d1 = evaluateVapiInboundGuard(event1);
      const d2 = evaluateVapiInboundGuard(event2);

      expect(d1.action).toBe("ignore");
      expect(d2.action).toBe("create");
      if (d2.action === "create") {
        expect(d2.transcript).toBe(TEST_TRANSCRIPT);
      }
    });

    it("two no-content events with same call id both ignore; no row ever created", () => {
      const event1 = makeCallEndedPayload({ callId: "call-double-ringing" });
      const event2 = makeCallEndedPayload({ callId: "call-double-ringing" });

      expect(evaluateVapiInboundGuard(event1).action).toBe("ignore");
      expect(evaluateVapiInboundGuard(event2).action).toBe("ignore");
    });
  });

  // ── TestLane bypass ────────────────────────────────────────────────────
  describe("TestLane marker bypass", () => {
    it("[TESTLANE] in customer name + no content → CREATE (testlane-marker)", () => {
      const decision = evaluateVapiInboundGuard(
        makeCallEndedPayload({
          callId: "call-tl-001",
          customerName: "[TESTLANE] Probe-001",
        }),
      );
      expect(decision.action).toBe("create");
      if (decision.action === "create") {
        expect(decision.reason).toBe("testlane-marker");
        expect(decision.hasTranscript).toBe(false);
        expect(decision.hasSummary).toBe(false);
      }
    });

    it("[testlane:<sid>] marker + no content → CREATE", () => {
      const decision = evaluateVapiInboundGuard(
        makeCallEndedPayload({
          customerName: "Real Person [testlane:abc123]",
        }),
      );
      expect(decision.action).toBe("create");
      if (decision.action === "create") {
        expect(decision.reason).toBe("testlane-marker");
      }
    });

    it("firstName 'TestLane' + no content → CREATE", () => {
      const decision = evaluateVapiInboundGuard(
        makeCallEndedPayload({ customerName: "TestLane Probe" }),
      );
      expect(decision.action).toBe("create");
      if (decision.action === "create") {
        expect(decision.reason).toBe("testlane-marker");
      }
    });

    it("normal customer name + no content → IGNORE (TestLane bypass not triggered)", () => {
      const decision = evaluateVapiInboundGuard(
        makeCallEndedPayload({ customerName: "John Smith" }),
      );
      expect(decision.action).toBe("ignore");
    });

    it("TestLane marker WITH transcript → CREATE with content-present reason (not testlane)", () => {
      // Content takes precedence over the marker reason — the create
      // path is the same either way, but the reason field reflects why
      // the create was permitted. Real content always wins.
      const decision = evaluateVapiInboundGuard(
        makeEndOfCallPayload({
          customerName: "[TESTLANE] Real Convo",
          transcript: TEST_TRANSCRIPT,
        }),
      );
      expect(decision.action).toBe("create");
      if (decision.action === "create") {
        expect(decision.reason).toBe("content-present");
      }
    });
  });

  // ── Defensive shape handling ───────────────────────────────────────────
  describe("defensive payload handling", () => {
    it("missing call object on conversation-creating event → IGNORE (no content)", () => {
      // The route catches `if (!call)` separately with a 400 before
      // calling the guard, but the guard handles it defensively: no
      // call → no content → IGNORE.
      const decision = evaluateVapiInboundGuard({
        eventType: "end-of-call-report",
      });
      expect(decision.action).toBe("ignore");
    });

    it("call without customer name → CREATE uses 'Unknown Caller' default", () => {
      const decision = evaluateVapiInboundGuard({
        eventType: "end-of-call-report",
        call: {
          id: "call-anon",
          status: "ended",
          transcript: TEST_TRANSCRIPT,
        },
      });
      expect(decision.action).toBe("create");
      if (decision.action === "create") {
        expect(decision.customerName).toBe("Unknown Caller");
      }
    });

    it("call without phone → customerPhone is null", () => {
      const decision = evaluateVapiInboundGuard({
        eventType: "end-of-call-report",
        call: {
          id: "call-nophone",
          status: "ended",
          customer: { name: "Caller With No Phone" },
          transcript: TEST_TRANSCRIPT,
        },
      });
      expect(decision.action).toBe("create");
      if (decision.action === "create") {
        expect(decision.customerPhone).toBe(null);
      }
    });

    it("phone falls back to phoneNumber.number when customer.number missing", () => {
      const decision = evaluateVapiInboundGuard({
        eventType: "end-of-call-report",
        call: {
          id: "call-fallback-phone",
          status: "ended",
          customer: { name: "Caller" },
          phoneNumber: { number: "+18005551234" },
          transcript: TEST_TRANSCRIPT,
        },
      });
      expect(decision.action).toBe("create");
      if (decision.action === "create") {
        expect(decision.customerPhone).toBe("+18005551234");
      }
    });

    it("recordingUrl falls back to artifact.recordingUrl", () => {
      const decision = evaluateVapiInboundGuard({
        eventType: "end-of-call-report",
        call: {
          id: "call-rec-fallback",
          status: "ended",
          customer: { number: "+14805550199", name: "Caller" },
          transcript: TEST_TRANSCRIPT,
          artifact: { recordingUrl: "https://example.com/artifact.mp3" },
        },
      });
      expect(decision.action).toBe("create");
      if (decision.action === "create") {
        expect(decision.recordingUrl).toBe("https://example.com/artifact.mp3");
      }
    });
  });
});
