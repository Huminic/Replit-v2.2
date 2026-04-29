/**
 * Unit tests for the campaign-recipient conversation matcher
 * (`findConversationForRecipient` + `phoneVariantsForRecipientMatch`)
 * in server/outbound.ts.
 *
 * Bug being fixed: Priority #2 — campaign disconnect false-block.
 *
 *   Pre-fix `getConversationForRecipient` ignored its `recipient`
 *   parameter and returned the first conversation in the campaign.
 *   `checkCommGate` then read `conversation?.campaignDisconnected`
 *   on whatever conversation came first. If recipient-A's row in a
 *   campaign had `campaignDisconnected=true`, recipient-B in the same
 *   campaign was wrongly blocked with "Recipient disconnected from
 *   campaign" — even though recipient-B had never had a conversation
 *   in that campaign.
 *
 * Post-fix: matching is scoped by (campaignId AND recipient phone OR
 * recipient email). Phone variants mirror `storage.getConversationByPhone`
 * (`server/storage.ts:431-435`) so a recipient typed as
 * `"(480) 555-0199"` matches a stored row of `"+14805550199"`.
 *
 * The matcher is a pure function. These tests inject (conversations,
 * recipient, campaignId) directly — no DB, no filesystem, no network.
 */

import { describe, it, expect } from "vitest";
import {
  findConversationForRecipient,
  phoneVariantsForRecipientMatch,
} from "@server/outbound";
import type { Conversation, CampaignRecipient } from "@shared/schema";

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

function makeConversation(overrides: Partial<Conversation>): Conversation {
  return {
    id: overrides.id ?? "conv-" + Math.random().toString(36).slice(2, 8),
    customerName: overrides.customerName ?? "Test Customer",
    customerEmail: overrides.customerEmail ?? null,
    customerPhone: overrides.customerPhone ?? null,
    channel: overrides.channel ?? "sms",
    status: overrides.status ?? "open",
    agentId: overrides.agentId ?? null,
    assignedTo: overrides.assignedTo ?? null,
    organizationId: overrides.organizationId ?? "org-test",
    campaignId: overrides.campaignId ?? null,
    sourceConversationId: overrides.sourceConversationId ?? null,
    campaignDisconnected: overrides.campaignDisconnected ?? false,
    unreadCount: overrides.unreadCount ?? 0,
    lastMessageAt: overrides.lastMessageAt ?? null,
    escalationSentAt: overrides.escalationSentAt ?? null,
    staleTriggerProcessedAt: overrides.staleTriggerProcessedAt ?? null,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  } as Conversation;
}

function makeRecipient(
  overrides: Partial<CampaignRecipient>,
): CampaignRecipient {
  return {
    id: overrides.id ?? "rcpt-" + Math.random().toString(36).slice(2, 8),
    campaignId: overrides.campaignId ?? "camp-test",
    firstName: overrides.firstName ?? null,
    lastName: overrides.lastName ?? null,
    phone: overrides.phone ?? null,
    email: overrides.email ?? null,
    vin: overrides.vin ?? null,
    vehicleModel: overrides.vehicleModel ?? null,
    vehicleYear: overrides.vehicleYear ?? null,
    status: overrides.status ?? "pending",
    sentAt: overrides.sentAt ?? null,
    deliveredAt: overrides.deliveredAt ?? null,
    createdAt: overrides.createdAt ?? new Date(),
  } as CampaignRecipient;
}

// ---------------------------------------------------------------------------
// phoneVariantsForRecipientMatch
// ---------------------------------------------------------------------------

describe("phoneVariantsForRecipientMatch", () => {
  it("E.164 with leading 1 → variants include both +1XXX, 1XXX, and XXX forms", () => {
    const variants = phoneVariantsForRecipientMatch("+14805550199");
    expect(variants).toContain("+14805550199");
    expect(variants).toContain("14805550199");
    expect(variants).toContain("4805550199");
  });

  it("10-digit bare → variants include with-1 and +1 forms", () => {
    const variants = phoneVariantsForRecipientMatch("4805550199");
    expect(variants).toContain("4805550199");
    expect(variants).toContain("14805550199");
    expect(variants).toContain("+14805550199");
  });

  it("11-digit with leading 1, no plus → variants include 10-digit form", () => {
    const variants = phoneVariantsForRecipientMatch("14805550199");
    expect(variants).toContain("14805550199");
    expect(variants).toContain("4805550199");
    expect(variants).toContain("+14805550199");
  });

  it("formatted human-readable → strips formatting and includes all variants", () => {
    const variants = phoneVariantsForRecipientMatch("(480) 555-0199");
    // Formatting stripped → "4805550199" → variants computed from there.
    expect(variants).toContain("4805550199");
    expect(variants).toContain("14805550199");
    expect(variants).toContain("+14805550199");
  });

  it("null / undefined / empty / non-digit → empty variant list", () => {
    expect(phoneVariantsForRecipientMatch(null)).toEqual([]);
    expect(phoneVariantsForRecipientMatch(undefined)).toEqual([]);
    expect(phoneVariantsForRecipientMatch("")).toEqual([]);
    expect(phoneVariantsForRecipientMatch("---")).toEqual([]);
  });

  it("variant list is de-duplicated", () => {
    // For an already-canonical 11-digit input, several derived forms
    // collapse to the same string. The output must not contain
    // duplicates.
    const variants = phoneVariantsForRecipientMatch("14805550199");
    const unique = new Set(variants);
    expect(unique.size).toBe(variants.length);
  });
});

// ---------------------------------------------------------------------------
// findConversationForRecipient — required scenarios
// ---------------------------------------------------------------------------

describe("findConversationForRecipient", () => {
  // ── Required (1): the actual bug — recipient-A disconnected,
  //    recipient-B not blocked ──────────────────────────────────────────────
  describe("the bug — recipient-A disconnected does NOT block recipient-B", () => {
    it("two recipients in the same campaign; A's row is disconnected; B has no row → undefined for B (NOT A's row)", () => {
      const recipientA = makeRecipient({
        id: "rcpt-A",
        phone: "+14805550101",
        firstName: "Alice",
      });
      const recipientB = makeRecipient({
        id: "rcpt-B",
        phone: "+14805550202",
        firstName: "Bob",
      });
      const conversations: Conversation[] = [
        // A's conversation in this campaign — disconnected.
        makeConversation({
          id: "conv-A",
          campaignId: "camp-1",
          customerPhone: "+14805550101",
          customerName: "Alice",
          campaignDisconnected: true,
        }),
        // B has no row in this campaign yet.
      ];

      const matchA = findConversationForRecipient(
        conversations,
        recipientA,
        "camp-1",
      );
      const matchB = findConversationForRecipient(
        conversations,
        recipientB,
        "camp-1",
      );

      expect(matchA?.id).toBe("conv-A");
      expect(matchA?.campaignDisconnected).toBe(true);
      // The fix: B does NOT pick up A's row. Pre-fix this returned conv-A
      // and the caller would block B with "Recipient disconnected from
      // campaign".
      expect(matchB).toBeUndefined();
    });

    it("A's row disconnected; B has its own row in same campaign (not disconnected) → B gets B's row", () => {
      const recipientA = makeRecipient({
        id: "rcpt-A",
        phone: "+14805550101",
      });
      const recipientB = makeRecipient({
        id: "rcpt-B",
        phone: "+14805550202",
      });
      const conversations: Conversation[] = [
        makeConversation({
          id: "conv-A",
          campaignId: "camp-1",
          customerPhone: "+14805550101",
          campaignDisconnected: true,
        }),
        makeConversation({
          id: "conv-B",
          campaignId: "camp-1",
          customerPhone: "+14805550202",
          campaignDisconnected: false,
        }),
      ];

      const matchA = findConversationForRecipient(
        conversations,
        recipientA,
        "camp-1",
      );
      const matchB = findConversationForRecipient(
        conversations,
        recipientB,
        "camp-1",
      );

      expect(matchA?.id).toBe("conv-A");
      expect(matchB?.id).toBe("conv-B");
      expect(matchB?.campaignDisconnected).toBe(false);
    });
  });

  // ── Required (2): phone variant matches across formats ──────────────────
  describe("phone-variant matching", () => {
    it("recipient phone '4805550199' matches stored '+14805550199'", () => {
      const recipient = makeRecipient({ phone: "4805550199" });
      const conversations: Conversation[] = [
        makeConversation({
          id: "conv-1",
          campaignId: "camp-1",
          customerPhone: "+14805550199",
        }),
      ];
      const match = findConversationForRecipient(
        conversations,
        recipient,
        "camp-1",
      );
      expect(match?.id).toBe("conv-1");
    });

    it("recipient phone '+14805550199' matches stored '4805550199'", () => {
      const recipient = makeRecipient({ phone: "+14805550199" });
      const conversations: Conversation[] = [
        makeConversation({
          id: "conv-1",
          campaignId: "camp-1",
          customerPhone: "4805550199",
        }),
      ];
      const match = findConversationForRecipient(
        conversations,
        recipient,
        "camp-1",
      );
      expect(match?.id).toBe("conv-1");
    });

    it("recipient phone '14805550199' matches stored '4805550199'", () => {
      const recipient = makeRecipient({ phone: "14805550199" });
      const conversations: Conversation[] = [
        makeConversation({
          id: "conv-1",
          campaignId: "camp-1",
          customerPhone: "4805550199",
        }),
      ];
      const match = findConversationForRecipient(
        conversations,
        recipient,
        "camp-1",
      );
      expect(match?.id).toBe("conv-1");
    });

    it("recipient phone '(480) 555-0199' matches stored '+14805550199'", () => {
      const recipient = makeRecipient({ phone: "(480) 555-0199" });
      const conversations: Conversation[] = [
        makeConversation({
          id: "conv-1",
          campaignId: "camp-1",
          customerPhone: "+14805550199",
        }),
      ];
      const match = findConversationForRecipient(
        conversations,
        recipient,
        "camp-1",
      );
      expect(match?.id).toBe("conv-1");
    });

    it("different phone numbers do NOT cross-match (4805550199 vs 4805550101)", () => {
      const recipient = makeRecipient({ phone: "+14805550199" });
      const conversations: Conversation[] = [
        makeConversation({
          id: "conv-other",
          campaignId: "camp-1",
          customerPhone: "+14805550101",
        }),
      ];
      const match = findConversationForRecipient(
        conversations,
        recipient,
        "camp-1",
      );
      expect(match).toBeUndefined();
    });
  });

  // ── Required (3): email match for email-channel recipient ───────────────
  describe("email matching", () => {
    it("email-only recipient matches stored customerEmail", () => {
      const recipient = makeRecipient({
        phone: null,
        email: "alice@example.com",
      });
      const conversations: Conversation[] = [
        makeConversation({
          id: "conv-email",
          campaignId: "camp-1",
          customerEmail: "alice@example.com",
          channel: "email",
        }),
      ];
      const match = findConversationForRecipient(
        conversations,
        recipient,
        "camp-1",
      );
      expect(match?.id).toBe("conv-email");
    });

    it("email match is case-insensitive on both sides", () => {
      const recipient = makeRecipient({
        phone: null,
        email: "Alice@Example.com",
      });
      const conversations: Conversation[] = [
        makeConversation({
          id: "conv-email",
          campaignId: "camp-1",
          customerEmail: "ALICE@example.COM",
          channel: "email",
        }),
      ];
      const match = findConversationForRecipient(
        conversations,
        recipient,
        "camp-1",
      );
      expect(match?.id).toBe("conv-email");
    });

    it("email match is whitespace-trimmed on both sides", () => {
      const recipient = makeRecipient({
        phone: null,
        email: "  alice@example.com  ",
      });
      const conversations: Conversation[] = [
        makeConversation({
          id: "conv-email",
          campaignId: "camp-1",
          customerEmail: "alice@example.com",
          channel: "email",
        }),
      ];
      const match = findConversationForRecipient(
        conversations,
        recipient,
        "camp-1",
      );
      expect(match?.id).toBe("conv-email");
    });

    it("different emails do NOT cross-match (alice vs bob)", () => {
      const recipient = makeRecipient({
        phone: null,
        email: "alice@example.com",
      });
      const conversations: Conversation[] = [
        makeConversation({
          id: "conv-bob",
          campaignId: "camp-1",
          customerEmail: "bob@example.com",
        }),
      ];
      const match = findConversationForRecipient(
        conversations,
        recipient,
        "camp-1",
      );
      expect(match).toBeUndefined();
    });

    it("recipient with phone AND email matches if EITHER matches", () => {
      const recipient = makeRecipient({
        phone: "+14805550199",
        email: "alice@example.com",
      });
      // Conversation matches by email only (phone differs).
      const conversations: Conversation[] = [
        makeConversation({
          id: "conv-email-only",
          campaignId: "camp-1",
          customerPhone: "+14805550999",
          customerEmail: "alice@example.com",
        }),
      ];
      const match = findConversationForRecipient(
        conversations,
        recipient,
        "camp-1",
      );
      expect(match?.id).toBe("conv-email-only");
    });
  });

  // ── Required (4): no-match returns undefined; recipient with neither
  //    phone nor email returns undefined (not first-in-campaign) ────────────
  describe("no-match returns undefined", () => {
    it("recipient has neither phone nor email → undefined (not the first campaign-matching conversation)", () => {
      // This is the crux of the original bug. The pre-fix function
      // returned the first conversation matching the campaign even when
      // the recipient had no identity. The fix: if we can't identify
      // the recipient, return undefined and let the caller treat it as
      // a first-time send. Crucially, we do NOT return some other
      // recipient's conversation just because it shares a campaignId.
      const recipient = makeRecipient({ phone: null, email: null });
      const conversations: Conversation[] = [
        makeConversation({
          id: "conv-other",
          campaignId: "camp-1",
          customerPhone: "+14805550101",
          campaignDisconnected: true,
        }),
      ];
      const match = findConversationForRecipient(
        conversations,
        recipient,
        "camp-1",
      );
      expect(match).toBeUndefined();
    });

    it("recipient phone is whitespace-only → treated as no phone → undefined", () => {
      const recipient = makeRecipient({ phone: "   ", email: null });
      const conversations: Conversation[] = [
        makeConversation({
          id: "conv-other",
          campaignId: "camp-1",
          customerPhone: "+14805550101",
        }),
      ];
      const match = findConversationForRecipient(
        conversations,
        recipient,
        "camp-1",
      );
      expect(match).toBeUndefined();
    });

    it("conversations array empty → undefined", () => {
      const recipient = makeRecipient({ phone: "+14805550101" });
      const match = findConversationForRecipient(
        [],
        recipient,
        "camp-1",
      );
      expect(match).toBeUndefined();
    });

    it("recipient phone matches a conversation in a DIFFERENT campaign → undefined", () => {
      const recipient = makeRecipient({ phone: "+14805550101" });
      const conversations: Conversation[] = [
        makeConversation({
          id: "conv-other-campaign",
          campaignId: "camp-OTHER",
          customerPhone: "+14805550101",
          campaignDisconnected: true,
        }),
      ];
      const match = findConversationForRecipient(
        conversations,
        recipient,
        "camp-1",
      );
      expect(match).toBeUndefined();
    });
  });

  // ── Larger scenarios ──────────────────────────────────────────────────────
  describe("end-to-end scenarios mirroring the bug report", () => {
    it("five-recipient campaign; recipient #2 disconnected; #1, #3, #4, #5 each get only their own row (or undefined)", () => {
      const campaignId = "camp-multi";
      const recipients: CampaignRecipient[] = [
        makeRecipient({ id: "rcpt-1", phone: "+14805550001" }),
        makeRecipient({ id: "rcpt-2", phone: "+14805550002" }),
        makeRecipient({ id: "rcpt-3", phone: "+14805550003" }),
        makeRecipient({ id: "rcpt-4", phone: "+14805550004" }),
        makeRecipient({ id: "rcpt-5", phone: "+14805550005" }),
      ];
      const conversations: Conversation[] = [
        // Only recipient #2 has a disconnected conversation.
        makeConversation({
          id: "conv-rcpt-2",
          campaignId,
          customerPhone: "+14805550002",
          campaignDisconnected: true,
        }),
        // Recipient #4 has a normal active conversation (not disconnected).
        makeConversation({
          id: "conv-rcpt-4",
          campaignId,
          customerPhone: "+14805550004",
          campaignDisconnected: false,
        }),
      ];

      const results = recipients.map((r) =>
        findConversationForRecipient(conversations, r, campaignId),
      );

      expect(results[0]).toBeUndefined(); // #1: no row, NOT blocked
      expect(results[1]?.id).toBe("conv-rcpt-2"); // #2: disconnected row
      expect(results[1]?.campaignDisconnected).toBe(true);
      expect(results[2]).toBeUndefined(); // #3: no row, NOT blocked
      expect(results[3]?.id).toBe("conv-rcpt-4"); // #4: own row
      expect(results[3]?.campaignDisconnected).toBe(false);
      expect(results[4]).toBeUndefined(); // #5: no row, NOT blocked

      // Bug-shape contract: only ONE recipient picks up the disconnected
      // row (the one it actually belongs to). Pre-fix all five would
      // have returned conv-rcpt-2 (or conv-rcpt-4, whichever sorted
      // first) and at least four would have been wrongly blocked.
      const blockedCount = results.filter(
        (r) => r?.campaignDisconnected === true,
      ).length;
      expect(blockedCount).toBe(1);
    });

    it("same recipient phone in TWO different campaigns → only the matching campaign's row returned", () => {
      const recipient = makeRecipient({ phone: "+14805550199" });
      const conversations: Conversation[] = [
        makeConversation({
          id: "conv-camp-A",
          campaignId: "camp-A",
          customerPhone: "+14805550199",
          campaignDisconnected: true,
        }),
        makeConversation({
          id: "conv-camp-B",
          campaignId: "camp-B",
          customerPhone: "+14805550199",
          campaignDisconnected: false,
        }),
      ];

      const matchA = findConversationForRecipient(
        conversations,
        recipient,
        "camp-A",
      );
      const matchB = findConversationForRecipient(
        conversations,
        recipient,
        "camp-B",
      );

      expect(matchA?.id).toBe("conv-camp-A");
      expect(matchA?.campaignDisconnected).toBe(true);
      expect(matchB?.id).toBe("conv-camp-B");
      expect(matchB?.campaignDisconnected).toBe(false);
      // Disconnect on camp-A must NOT cross over to camp-B.
    });
  });
});
