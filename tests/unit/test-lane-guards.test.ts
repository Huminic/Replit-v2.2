/**
 * Test-lane fail-closed guard unit tests.
 *
 * Covers four pure helpers:
 *   1. evaluateOutboundTestLaneGuard   (server/outbound.ts)
 *   2. applyTestLaneRecipientOverride  (server/services/notificationService.ts)
 *   3. applyWeeklyReportTestLaneOverride (server/services/notificationService.ts)
 *   4. evaluateAdfTestLaneGuard        (server/services/testLaneGuards.ts)
 *
 * Per guard: four scenarios (a-d) per the test-lane fail-closed contract.
 * ADF guard semantics differ slightly (uses ADF_MODE, not TESTLANE_*_TO);
 * its scenarios are adapted accordingly.
 *
 * No real provider calls. No DB. process.env is mutated per test and
 * restored in afterEach.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  evaluateOutboundTestLaneGuard,
  type OutboundTestLaneGuardInput,
} from "@server/outbound";
import {
  applyTestLaneRecipientOverride,
  applyWeeklyReportTestLaneOverride,
  type TriggerNotificationParams,
  type WeeklyReportEmailOpts,
} from "@server/services/notificationService";
import { evaluateAdfTestLaneGuard } from "@server/services/testLaneGuards";

// ---------------------------------------------------------------------------
// Env management — snapshot + restore the test-lane env vars between tests
// ---------------------------------------------------------------------------

const ENV_KEYS = [
  "TESTLANE_MODE",
  "TESTLANE_SMS_TO",
  "TESTLANE_EMAIL_TO",
  "TESTLANE_VOICE_TO",
  "ADF_MODE",
] as const;

let envSnapshot: Record<string, string | undefined> = {};

function clearTestLaneEnv() {
  for (const k of ENV_KEYS) {
    delete process.env[k];
  }
}

beforeEach(() => {
  envSnapshot = {};
  for (const k of ENV_KEYS) {
    envSnapshot[k] = process.env[k];
  }
  clearTestLaneEnv();
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (envSnapshot[k] === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = envSnapshot[k];
    }
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOutboundInput(
  over: Partial<OutboundTestLaneGuardInput> = {},
): OutboundTestLaneGuardInput {
  return {
    channel: "sms",
    to: "+15551234567",
    messageContent: "Hello from Serra Honda.",
    recipientName: "Real Customer",
    testLaneSessionId: undefined,
    campaignName: null,
    recipientFirstName: null,
    ...over,
  };
}

function makeTriggerParams(
  over: Partial<TriggerNotificationParams> = {},
): TriggerNotificationParams {
  return {
    orgId: "00000000-0000-0000-0000-000000000001",
    customerName: "Jane Real",
    customerPhone: "+15551234567",
    triggerType: "after_hours_followup",
    messageSent: "Thanks for reaching out, we will follow up soon.",
    vehicleOfInterest: null,
    testLaneSessionId: undefined,
    ...over,
  };
}

function makeWeeklySubject() {
  return "Weekly executive report — Serra Honda — week ending Apr 27";
}
function makeWeeklyHtml() {
  return "<html><body>Report content</body></html>";
}

// ---------------------------------------------------------------------------
// Guard 1: evaluateOutboundTestLaneGuard
// ---------------------------------------------------------------------------

describe("evaluateOutboundTestLaneGuard (server/outbound.ts)", () => {
  it("[1a] env=true + marker present (testLaneSessionId) -> hard-route SMS to TESTLANE_SMS_TO", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.TESTLANE_SMS_TO = "+14126546500";
    const result = evaluateOutboundTestLaneGuard(
      makeOutboundInput({
        channel: "sms",
        testLaneSessionId: "sid-123",
      }),
    );
    expect(result.kind).toBe("override");
    if (result.kind !== "override") return;
    expect(result.to).toBe("+14126546500");
    expect(result.sid).toBe("sid-123");
    expect(result.messageContent).toContain("[testlane:sid-123]");
    expect(result.recipientName).toContain("[TESTLANE]");
  });

  it("[1a-email] env=true + marker present -> hard-route EMAIL to TESTLANE_EMAIL_TO", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.TESTLANE_EMAIL_TO = "duanewells@icloud.com";
    const result = evaluateOutboundTestLaneGuard(
      makeOutboundInput({
        channel: "email",
        to: "real@dealer.com",
        testLaneSessionId: "sid-email",
      }),
    );
    expect(result.kind).toBe("override");
    if (result.kind !== "override") return;
    expect(result.to).toBe("duanewells@icloud.com");
  });

  it("[1a-phone] env=true + marker present -> hard-route PHONE to TESTLANE_VOICE_TO", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.TESTLANE_VOICE_TO = "+14126546500";
    const result = evaluateOutboundTestLaneGuard(
      makeOutboundInput({
        channel: "phone",
        to: "+15559999999",
        testLaneSessionId: "sid-voice",
      }),
    );
    expect(result.kind).toBe("override");
    if (result.kind !== "override") return;
    expect(result.to).toBe("+14126546500");
  });

  it("[1a-marker-content] env=true + marker present (via [testlane:] in messageContent) -> hard-route", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.TESTLANE_SMS_TO = "+14126546500";
    const result = evaluateOutboundTestLaneGuard(
      makeOutboundInput({
        messageContent: "[testlane:s1] Hi from test",
      }),
    );
    expect(result.kind).toBe("override");
  });

  it("[1a-marker-campaign] env=true + marker via campaignName starting with [TESTLANE] -> hard-route", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.TESTLANE_SMS_TO = "+14126546500";
    const result = evaluateOutboundTestLaneGuard(
      makeOutboundInput({ campaignName: "[TESTLANE] cold-service-day1" }),
    );
    expect(result.kind).toBe("override");
  });

  it("[1a-marker-recipient] env=true + recipientFirstName=TestLane -> hard-route", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.TESTLANE_SMS_TO = "+14126546500";
    const result = evaluateOutboundTestLaneGuard(
      makeOutboundInput({ recipientFirstName: "TestLane" }),
    );
    expect(result.kind).toBe("override");
  });

  it("[1b] env=true + no marker -> blocked", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.TESTLANE_SMS_TO = "+14126546500";
    const result = evaluateOutboundTestLaneGuard(makeOutboundInput());
    expect(result.kind).toBe("blocked");
    if (result.kind !== "blocked") return;
    expect(result.reason).toContain("TESTLANE_MODE=true");
    expect(result.reason).toContain("lacks test-lane marker");
  });

  it("[1c] env=false + marker present -> blocked (defensive)", () => {
    // env not set
    const result = evaluateOutboundTestLaneGuard(
      makeOutboundInput({ testLaneSessionId: "sid-defensive" }),
    );
    expect(result.kind).toBe("blocked");
    if (result.kind !== "blocked") return;
    expect(result.reason).toContain("TESTLANE_MODE is not");
  });

  it("[1d] env=true + marker + missing TESTLANE_SMS_TO -> blocked", () => {
    process.env.TESTLANE_MODE = "true";
    // TESTLANE_SMS_TO unset
    const result = evaluateOutboundTestLaneGuard(
      makeOutboundInput({ channel: "sms", testLaneSessionId: "sid-x" }),
    );
    expect(result.kind).toBe("blocked");
    if (result.kind !== "blocked") return;
    expect(result.reason).toContain("TESTLANE_SMS_TO unset");
  });

  it("[1d-email] env=true + marker + missing TESTLANE_EMAIL_TO -> blocked", () => {
    process.env.TESTLANE_MODE = "true";
    const result = evaluateOutboundTestLaneGuard(
      makeOutboundInput({ channel: "email", testLaneSessionId: "sid-x" }),
    );
    expect(result.kind).toBe("blocked");
    if (result.kind !== "blocked") return;
    expect(result.reason).toContain("TESTLANE_EMAIL_TO unset");
  });

  it("[1d-phone] env=true + marker + missing TESTLANE_VOICE_TO -> blocked", () => {
    process.env.TESTLANE_MODE = "true";
    const result = evaluateOutboundTestLaneGuard(
      makeOutboundInput({ channel: "phone", testLaneSessionId: "sid-x" }),
    );
    expect(result.kind).toBe("blocked");
    if (result.kind !== "blocked") return;
    expect(result.reason).toContain("TESTLANE_VOICE_TO unset");
  });

  it("[1-pass] env=false + no marker -> pass (production posture)", () => {
    const result = evaluateOutboundTestLaneGuard(makeOutboundInput());
    expect(result.kind).toBe("pass");
  });

  it("[1-idempotent-tag] env=true + marker + content already tagged -> does not double-tag", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.TESTLANE_SMS_TO = "+14126546500";
    const result = evaluateOutboundTestLaneGuard(
      makeOutboundInput({
        testLaneSessionId: "sid-dup",
        messageContent: "[testlane:sid-dup] already tagged",
      }),
    );
    expect(result.kind).toBe("override");
    if (result.kind !== "override") return;
    // Ensure exactly one occurrence of the tag
    const matches = result.messageContent.match(/\[testlane:sid-dup\]/g) || [];
    expect(matches.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Guard 2: applyTestLaneRecipientOverride
// ---------------------------------------------------------------------------

describe("applyTestLaneRecipientOverride (notificationService.ts)", () => {
  const adminRecipients = ["admin1@dealer.com", "admin2@dealer.com"];

  it("[2a] env=true + marker (testLaneSessionId) -> override to [TESTLANE_EMAIL_TO]", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.TESTLANE_EMAIL_TO = "duanewells@icloud.com";
    const result = applyTestLaneRecipientOverride(
      makeTriggerParams({ testLaneSessionId: "sid-trig" }),
      adminRecipients,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipients).toEqual(["duanewells@icloud.com"]);
    expect(result.overridden).toBe(true);
    expect(result.sid).toBe("sid-trig");
  });

  it("[2a-marker-customer] env=true + customerName has [TESTLANE] -> override", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.TESTLANE_EMAIL_TO = "duanewells@icloud.com";
    const result = applyTestLaneRecipientOverride(
      makeTriggerParams({ customerName: "[TESTLANE] sid-9" }),
      adminRecipients,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.overridden).toBe(true);
  });

  it("[2b] env=true + no marker -> blocked", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.TESTLANE_EMAIL_TO = "duanewells@icloud.com";
    const result = applyTestLaneRecipientOverride(
      makeTriggerParams(),
      adminRecipients,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("TESTLANE_MODE=true");
    expect(result.reason).toContain("lacks test-lane marker");
  });

  it("[2c] env=false + marker -> blocked (defensive)", () => {
    const result = applyTestLaneRecipientOverride(
      makeTriggerParams({ testLaneSessionId: "sid-defensive" }),
      adminRecipients,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("TESTLANE_MODE is not");
  });

  it("[2d] env=true + marker + missing TESTLANE_EMAIL_TO -> blocked", () => {
    process.env.TESTLANE_MODE = "true";
    // TESTLANE_EMAIL_TO unset
    const result = applyTestLaneRecipientOverride(
      makeTriggerParams({ testLaneSessionId: "sid-x" }),
      adminRecipients,
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("TESTLANE_EMAIL_TO unset");
  });

  it("[2-pass] env=false + no marker -> pass-through (recipients unchanged)", () => {
    const result = applyTestLaneRecipientOverride(
      makeTriggerParams(),
      adminRecipients,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipients).toEqual(adminRecipients);
    expect(result.overridden).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Guard 3: applyWeeklyReportTestLaneOverride
// ---------------------------------------------------------------------------

describe("applyWeeklyReportTestLaneOverride (notificationService.ts)", () => {
  const toArr = ["admin1@dealer.com", "admin2@dealer.com"];
  const ccArr = ["partner@cage.com"];
  const bccArr = ["audit@huminic.ai"];

  it("[3a] env=true + marker (testLaneSessionId) -> override to=[TESTLANE_EMAIL_TO], cc=[], bcc=[], tags subject + html", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.TESTLANE_EMAIL_TO = "duanewells@icloud.com";
    const opts: WeeklyReportEmailOpts = { testLaneSessionId: "sid-weekly" };
    const result = applyWeeklyReportTestLaneOverride(
      makeWeeklySubject(),
      makeWeeklyHtml(),
      toArr,
      ccArr,
      bccArr,
      opts,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.toArr).toEqual(["duanewells@icloud.com"]);
    expect(result.ccArr).toEqual([]);
    expect(result.bccArr).toEqual([]);
    expect(result.subject).toContain("[testlane:sid-weekly]");
    expect(result.html).toContain("[testlane:sid-weekly]");
    expect(result.overridden).toBe(true);
    expect(result.sid).toBe("sid-weekly");
  });

  it("[3a-marker-subject] env=true + marker via [TESTLANE] in subject -> override", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.TESTLANE_EMAIL_TO = "duanewells@icloud.com";
    const result = applyWeeklyReportTestLaneOverride(
      "[TESTLANE] " + makeWeeklySubject(),
      makeWeeklyHtml(),
      toArr,
      ccArr,
      bccArr,
      {},
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.overridden).toBe(true);
  });

  it("[3b] env=true + no marker -> blocked", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.TESTLANE_EMAIL_TO = "duanewells@icloud.com";
    const result = applyWeeklyReportTestLaneOverride(
      makeWeeklySubject(),
      makeWeeklyHtml(),
      toArr,
      ccArr,
      bccArr,
      {},
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("TESTLANE_MODE=true");
    expect(result.reason).toContain("lacks test-lane marker");
  });

  it("[3c] env=false + marker -> blocked (defensive)", () => {
    const result = applyWeeklyReportTestLaneOverride(
      makeWeeklySubject(),
      makeWeeklyHtml(),
      toArr,
      ccArr,
      bccArr,
      { testLaneSessionId: "sid-defensive" },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("TESTLANE_MODE is not");
  });

  it("[3d] env=true + marker + missing TESTLANE_EMAIL_TO -> blocked", () => {
    process.env.TESTLANE_MODE = "true";
    // TESTLANE_EMAIL_TO unset
    const result = applyWeeklyReportTestLaneOverride(
      makeWeeklySubject(),
      makeWeeklyHtml(),
      toArr,
      ccArr,
      bccArr,
      { testLaneSessionId: "sid-x" },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("TESTLANE_EMAIL_TO unset");
  });

  it("[3-pass] env=false + no marker -> pass-through, all fields unchanged", () => {
    const subject = makeWeeklySubject();
    const html = makeWeeklyHtml();
    const result = applyWeeklyReportTestLaneOverride(
      subject,
      html,
      toArr,
      ccArr,
      bccArr,
      {},
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.toArr).toEqual(toArr);
    expect(result.ccArr).toEqual(ccArr);
    expect(result.bccArr).toEqual(bccArr);
    expect(result.subject).toBe(subject);
    expect(result.html).toBe(html);
    expect(result.overridden).toBeUndefined();
  });

  it("[3-idempotent-tag] env=true + marker + subject already tagged -> does not double-tag", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.TESTLANE_EMAIL_TO = "duanewells@icloud.com";
    const taggedSubject = "[testlane:sid-dup] already tagged";
    const result = applyWeeklyReportTestLaneOverride(
      taggedSubject,
      makeWeeklyHtml(),
      toArr,
      ccArr,
      bccArr,
      { testLaneSessionId: "sid-dup" },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const matches = result.subject.match(/\[testlane:sid-dup\]/g) || [];
    expect(matches.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Guard 4: evaluateAdfTestLaneGuard
// ---------------------------------------------------------------------------
//
// Note: ADF semantics differ slightly. The guard cares about ADF_MODE
// alongside TESTLANE_MODE. The four-scenario template is adapted:
//   (a) TESTLANE_MODE=true + lead-is-[TESTLANE] + ADF_MODE=test  -> pass
//   (b) TESTLANE_MODE=true + ADF_MODE != 'test'                  -> blocked (mode misconfig)
//   (c) lead-is-[TESTLANE] + TESTLANE_MODE != 'true'             -> blocked (decoupled)
//   (d) lead-is-[TESTLANE] + ADF_MODE='live'                     -> blocked (would leak)
// Plus the production pass-through and the secondary marker detection paths.
//

describe("evaluateAdfTestLaneGuard (services/testLaneGuards.ts)", () => {
  it("[4a] TESTLANE_MODE=true + lead-is-[TESTLANE] + ADF_MODE=test -> pass", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.ADF_MODE = "test";
    const result = evaluateAdfTestLaneGuard({
      customerName: "[TESTLANE] Probe Customer",
      transcript: "Hi this is a test call",
      summary: null,
      callId: "testlane-vapi-001",
    });
    expect(result.kind).toBe("pass");
  });

  it("[4b] TESTLANE_MODE=true + ADF_MODE='live' -> blocked (testlane-adf-misconfig-live)", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.ADF_MODE = "live";
    const result = evaluateAdfTestLaneGuard({
      customerName: "Real Customer", // lead NOT marked
      transcript: null,
      summary: null,
      callId: "real-vapi-001",
    });
    expect(result.kind).toBe("blocked");
    if (result.kind !== "blocked") return;
    expect(result.mode).toBe("testlane-adf-misconfig-live");
    expect(result.reason).toContain("ADF_MODE=live");
  });

  it("[4b-default] TESTLANE_MODE=true + ADF_MODE unset -> blocked (defaults to live)", () => {
    process.env.TESTLANE_MODE = "true";
    // ADF_MODE not set -> defaults to 'live' inside helper
    const result = evaluateAdfTestLaneGuard({
      customerName: "Real Customer",
      transcript: null,
      summary: null,
      callId: "real-001",
    });
    expect(result.kind).toBe("blocked");
    if (result.kind !== "blocked") return;
    expect(result.mode).toBe("testlane-adf-misconfig-live");
  });

  it("[4c] lead-is-[TESTLANE] + TESTLANE_MODE!=true -> blocked (testlane-lead-but-mode-off)", () => {
    process.env.ADF_MODE = "test"; // even with mode=test, env=false makes it suspicious
    const result = evaluateAdfTestLaneGuard({
      customerName: "[TESTLANE] suspicious",
      transcript: null,
      summary: null,
      callId: "x",
    });
    expect(result.kind).toBe("blocked");
    if (result.kind !== "blocked") return;
    expect(result.mode).toBe("testlane-lead-but-mode-off");
  });

  it("[4d] lead-is-[TESTLANE] + ADF_MODE=live -> blocked (testlane-lead-but-live-adf)", () => {
    // TESTLANE_MODE not set, ADF_MODE explicit live, lead-is-[TESTLANE]
    process.env.ADF_MODE = "live";
    const result = evaluateAdfTestLaneGuard({
      customerName: "[TESTLANE] leak risk",
      transcript: null,
      summary: null,
      callId: "x",
    });
    expect(result.kind).toBe("blocked");
    if (result.kind !== "blocked") return;
    // both [4c] and [4d] would match (lead-is-testlane + mode-off) AND
    // (lead-is-testlane + live). The helper's branch order returns
    // 'testlane-lead-but-live-adf' first when adfMode='live', because that
    // branch is checked BEFORE the mode-off branch.
    expect(result.mode).toBe("testlane-lead-but-live-adf");
  });

  it("[4-pass] TESTLANE_MODE=false + lead-not-marked + ADF_MODE=live -> pass (production posture)", () => {
    process.env.ADF_MODE = "live";
    const result = evaluateAdfTestLaneGuard({
      customerName: "Real Customer",
      transcript: "Real transcript text",
      summary: "Real summary",
      callId: "real-vapi-prod-1",
    });
    expect(result.kind).toBe("pass");
  });

  it("[4-marker-transcript] lead-is-[TESTLANE] via transcript -> caught", () => {
    process.env.ADF_MODE = "live";
    const result = evaluateAdfTestLaneGuard({
      customerName: "Real Customer",
      transcript: "[TESTLANE] sid-3 transcript text",
      summary: null,
      callId: "x",
    });
    expect(result.kind).toBe("blocked");
  });

  it("[4-marker-summary] lead-is-[TESTLANE] via summary -> caught", () => {
    process.env.ADF_MODE = "live";
    const result = evaluateAdfTestLaneGuard({
      customerName: "Real Customer",
      transcript: null,
      summary: "[TESTLANE] sid-4 summary",
      callId: "x",
    });
    expect(result.kind).toBe("blocked");
  });

  it("[4-marker-callId] callId starting with testlane- -> caught", () => {
    process.env.ADF_MODE = "live";
    const result = evaluateAdfTestLaneGuard({
      customerName: "Real Customer",
      transcript: null,
      summary: null,
      callId: "testlane-vapi-007",
    });
    expect(result.kind).toBe("blocked");
  });

  it("[4-test-mode-no-marker] TESTLANE_MODE=true + lead-not-marked + ADF_MODE=test -> pass (asymmetry)", () => {
    process.env.TESTLANE_MODE = "true";
    process.env.ADF_MODE = "test";
    const result = evaluateAdfTestLaneGuard({
      customerName: "Real Customer",
      transcript: null,
      summary: null,
      callId: "x",
    });
    expect(result.kind).toBe("pass");
  });
});
