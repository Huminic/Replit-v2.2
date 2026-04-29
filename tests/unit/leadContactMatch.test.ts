/**
 * Unit tests for server/lib/leadContactMatch.ts (I-260).
 *
 * Covers:
 *   - conversationMatchesLead: phone last-10-digits + email case-insensitive
 *   - findEarliestMatchingConversation: picks the earliest createdAt among matches
 *   - computeAvgDaysToFirstContact: correct math, null on zero matches,
 *     negative-duration clamping, vinCreatedAt -> createdAt fallback
 *   - formatAvgDaysToFirstContact: days, hours, sub-hour edge
 */

import { describe, it, expect } from "vitest";
import {
  conversationMatchesLead,
  findEarliestMatchingConversation,
  computeAvgDaysToFirstContact,
  formatAvgDaysToFirstContact,
  type LeadForContactMatch,
  type ConversationForContactMatch,
} from "@server/lib/leadContactMatch";

// ---------------------------------------------------------------------------
// conversationMatchesLead
// ---------------------------------------------------------------------------

describe("conversationMatchesLead", () => {
  it("matches by phone last 10 digits", () => {
    expect(
      conversationMatchesLead(
        { customerPhone: "+1 (412) 654-6500", customerEmail: null },
        { customerPhone: "4126546500", customerEmail: null, createdAt: new Date() },
      ),
    ).toBe(true);
  });

  it("matches by phone with extra leading digits in conversation", () => {
    // Conversation phone has 11 digits "14126546500"; lead has "4126546500".
    // The helper takes last 10 digits of each: "4126546500" === "4126546500".
    expect(
      conversationMatchesLead(
        { customerPhone: "(412) 654-6500", customerEmail: null },
        { customerPhone: "+14126546500", customerEmail: null, createdAt: new Date() },
      ),
    ).toBe(true);
  });

  it("matches by email case-insensitive", () => {
    expect(
      conversationMatchesLead(
        { customerPhone: null, customerEmail: "Jane.Doe@DEALER.com" },
        { customerPhone: null, customerEmail: "jane.doe@dealer.com", createdAt: new Date() },
      ),
    ).toBe(true);
  });

  it("matches by either phone OR email (phone wins, email irrelevant)", () => {
    expect(
      conversationMatchesLead(
        { customerPhone: "4126546500", customerEmail: "a@b.com" },
        { customerPhone: "4126546500", customerEmail: "different@dealer.com", createdAt: new Date() },
      ),
    ).toBe(true);
  });

  it("does not match when both phone and email differ", () => {
    expect(
      conversationMatchesLead(
        { customerPhone: "4126546500", customerEmail: "a@b.com" },
        { customerPhone: "5555551234", customerEmail: "c@d.com", createdAt: new Date() },
      ),
    ).toBe(false);
  });

  it("does not match when both sides are missing the relevant field", () => {
    expect(
      conversationMatchesLead(
        { customerPhone: null, customerEmail: null },
        { customerPhone: null, customerEmail: null, createdAt: new Date() },
      ),
    ).toBe(false);
  });

  it("does not match when phones are too short (<10 digits each)", () => {
    expect(
      conversationMatchesLead(
        { customerPhone: "12345", customerEmail: null },
        { customerPhone: "12345", customerEmail: null, createdAt: new Date() },
      ),
    ).toBe(true); // last-10 digits substring match — short numbers still match exactly
  });

  it("empty phone strings on both sides do not falsely match", () => {
    expect(
      conversationMatchesLead(
        { customerPhone: "", customerEmail: null },
        { customerPhone: "", customerEmail: null, createdAt: new Date() },
      ),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// findEarliestMatchingConversation
// ---------------------------------------------------------------------------

describe("findEarliestMatchingConversation", () => {
  const lead: LeadForContactMatch = {
    customerPhone: "4126546500",
    customerEmail: "jane@dealer.com",
    vinCreatedAt: new Date("2026-04-20T10:00:00Z"),
  };

  it("returns null when no conversations match", () => {
    expect(
      findEarliestMatchingConversation(lead, [
        { customerPhone: "5551234567", customerEmail: null, createdAt: new Date() },
      ]),
    ).toBeNull();
  });

  it("returns the only match when there is one", () => {
    const conv: ConversationForContactMatch = {
      customerPhone: "4126546500",
      customerEmail: null,
      createdAt: new Date("2026-04-21T10:00:00Z"),
    };
    expect(findEarliestMatchingConversation(lead, [conv])).toBe(conv);
  });

  it("returns the earliest among multiple matches", () => {
    const earliest: ConversationForContactMatch = {
      customerPhone: "4126546500",
      customerEmail: null,
      createdAt: new Date("2026-04-21T08:00:00Z"),
    };
    const later: ConversationForContactMatch = {
      customerPhone: "4126546500",
      customerEmail: null,
      createdAt: new Date("2026-04-22T08:00:00Z"),
    };
    expect(findEarliestMatchingConversation(lead, [later, earliest])).toBe(earliest);
  });

  it("ignores conversations with invalid createdAt", () => {
    const invalid: ConversationForContactMatch = {
      customerPhone: "4126546500",
      customerEmail: null,
      createdAt: "not-a-date",
    };
    const valid: ConversationForContactMatch = {
      customerPhone: "4126546500",
      customerEmail: null,
      createdAt: new Date("2026-04-21T10:00:00Z"),
    };
    expect(findEarliestMatchingConversation(lead, [invalid, valid])).toBe(valid);
  });
});

// ---------------------------------------------------------------------------
// computeAvgDaysToFirstContact
// ---------------------------------------------------------------------------

describe("computeAvgDaysToFirstContact", () => {
  it("returns null when no leads have matched conversations", () => {
    const leads: LeadForContactMatch[] = [
      { customerPhone: "5551234567", vinCreatedAt: new Date() },
    ];
    const conversations: ConversationForContactMatch[] = [
      { customerPhone: "9999999999", customerEmail: null, createdAt: new Date() },
    ];
    expect(computeAvgDaysToFirstContact(leads, conversations)).toBeNull();
  });

  it("returns avgDays=2 when one lead is contacted 2 days after vinCreatedAt", () => {
    const leads: LeadForContactMatch[] = [
      { customerPhone: "4126546500", vinCreatedAt: "2026-04-20T10:00:00Z" },
    ];
    const conversations: ConversationForContactMatch[] = [
      { customerPhone: "4126546500", customerEmail: null, createdAt: "2026-04-22T10:00:00Z" },
    ];
    const result = computeAvgDaysToFirstContact(leads, conversations);
    expect(result).not.toBeNull();
    expect(result!.avgDays).toBeCloseTo(2, 5);
    expect(result!.sampleSize).toBe(1);
  });

  it("averages across multiple matched leads", () => {
    const leads: LeadForContactMatch[] = [
      { customerPhone: "4126546500", vinCreatedAt: "2026-04-20T10:00:00Z" }, // contact 2 days later
      { customerPhone: "5551111111", vinCreatedAt: "2026-04-20T10:00:00Z" }, // contact 4 days later
    ];
    const conversations: ConversationForContactMatch[] = [
      { customerPhone: "4126546500", customerEmail: null, createdAt: "2026-04-22T10:00:00Z" },
      { customerPhone: "5551111111", customerEmail: null, createdAt: "2026-04-24T10:00:00Z" },
    ];
    const result = computeAvgDaysToFirstContact(leads, conversations);
    expect(result).not.toBeNull();
    expect(result!.avgDays).toBeCloseTo(3, 5); // (2 + 4) / 2 = 3
    expect(result!.sampleSize).toBe(2);
  });

  it("excludes leads with no matched conversation from the average", () => {
    const leads: LeadForContactMatch[] = [
      { customerPhone: "4126546500", vinCreatedAt: "2026-04-20T10:00:00Z" }, // matched
      { customerPhone: "9999999999", vinCreatedAt: "2026-04-20T10:00:00Z" }, // unmatched
    ];
    const conversations: ConversationForContactMatch[] = [
      { customerPhone: "4126546500", customerEmail: null, createdAt: "2026-04-22T10:00:00Z" },
    ];
    const result = computeAvgDaysToFirstContact(leads, conversations);
    expect(result).not.toBeNull();
    expect(result!.avgDays).toBeCloseTo(2, 5); // only the matched lead counts
    expect(result!.sampleSize).toBe(1);
  });

  it("clamps negative durations to zero (conversation predates lead creation)", () => {
    const leads: LeadForContactMatch[] = [
      { customerPhone: "4126546500", vinCreatedAt: "2026-04-22T10:00:00Z" },
    ];
    // Conversation created 1 day BEFORE the lead — possible when an inbound chat
    // creates the lead retroactively, or when timestamps are skewed.
    const conversations: ConversationForContactMatch[] = [
      { customerPhone: "4126546500", customerEmail: null, createdAt: "2026-04-21T10:00:00Z" },
    ];
    const result = computeAvgDaysToFirstContact(leads, conversations);
    expect(result).not.toBeNull();
    expect(result!.avgDays).toBe(0);
    expect(result!.sampleSize).toBe(1);
  });

  it("falls back to lead.createdAt when vinCreatedAt is null", () => {
    const leads: LeadForContactMatch[] = [
      { customerPhone: "4126546500", vinCreatedAt: null, createdAt: "2026-04-20T10:00:00Z" },
    ];
    const conversations: ConversationForContactMatch[] = [
      { customerPhone: "4126546500", customerEmail: null, createdAt: "2026-04-22T10:00:00Z" },
    ];
    const result = computeAvgDaysToFirstContact(leads, conversations);
    expect(result).not.toBeNull();
    expect(result!.avgDays).toBeCloseTo(2, 5);
  });

  it("skips leads with no usable creation timestamp at all", () => {
    const leads: LeadForContactMatch[] = [
      { customerPhone: "4126546500", vinCreatedAt: null, createdAt: null },
    ];
    const conversations: ConversationForContactMatch[] = [
      { customerPhone: "4126546500", customerEmail: null, createdAt: "2026-04-22T10:00:00Z" },
    ];
    expect(computeAvgDaysToFirstContact(leads, conversations)).toBeNull();
  });

  it("uses the EARLIEST matching conversation when multiple exist for the same lead", () => {
    const leads: LeadForContactMatch[] = [
      { customerPhone: "4126546500", vinCreatedAt: "2026-04-20T10:00:00Z" },
    ];
    const conversations: ConversationForContactMatch[] = [
      { customerPhone: "4126546500", customerEmail: null, createdAt: "2026-04-25T10:00:00Z" },
      { customerPhone: "4126546500", customerEmail: null, createdAt: "2026-04-21T10:00:00Z" }, // earliest
    ];
    const result = computeAvgDaysToFirstContact(leads, conversations);
    expect(result).not.toBeNull();
    expect(result!.avgDays).toBeCloseTo(1, 5); // earliest match: 1 day
  });
});

// ---------------------------------------------------------------------------
// formatAvgDaysToFirstContact
// ---------------------------------------------------------------------------

describe("formatAvgDaysToFirstContact", () => {
  it("formats whole days", () => {
    expect(formatAvgDaysToFirstContact(2)).toBe("2 days");
  });

  it("formats fractional days with one decimal", () => {
    expect(formatAvgDaysToFirstContact(2.345)).toBe("2.3 days");
  });

  it("formats sub-day values in hours", () => {
    expect(formatAvgDaysToFirstContact(0.5)).toBe("12h");
  });

  it("formats very-small values as <1 hour", () => {
    expect(formatAvgDaysToFirstContact(0)).toBe("<1 hour");
    expect(formatAvgDaysToFirstContact(0.001)).toBe("<1 hour");
  });

  it("rounds days to 1 decimal cleanly", () => {
    expect(formatAvgDaysToFirstContact(1.05)).toBe("1.1 days");
    expect(formatAvgDaysToFirstContact(1.04)).toBe("1 days");
  });
});
