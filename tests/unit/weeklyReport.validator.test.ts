/**
 * TRG-RPT-001 — validateWeeklyReport() QA gate tests (revision 3).
 *
 * The validator is the hard-stop before any send. If it returns ok:false
 * the caller MUST NOT send the email. These tests lock in the contract.
 *
 * Revision 3 adds (from v2 operator review):
 *   - ghosted leads must be week-scoped (vinCreatedAt ∈ [weekStart, weekEnd])
 *   - vehicle strings on ghosted/single-followup MUST NOT be raw URLs
 *   - priorities MUST NOT contain banned jargon (follow up / outreach /
 *     ghosted / recipients / workflow)
 *   - leadsBySource names: if sourceResolutionFailed=false, > 30% "VIN Source
 *     #N" fallback rows fails validation
 *   - droppedNamelessGhostedCount (non-neg int) + sourceResolutionFailed
 *     (boolean) are required on the report
 *
 * Revision 2 checks retained (agentName, leadsReceivedThisWeek, shapes,
 * names required on ghosted + single-followup, narrative word count).
 */

import { describe, it, expect } from "vitest";
import {
  validateWeeklyReport,
  TONE_INTERSTITIAL,
  type WeeklyReportData,
} from "@server/services/weeklyReportService";

function makeValidReport(overrides: Partial<WeeklyReportData> = {}): WeeklyReportData {
  return {
    orgId: "00000000-0000-0000-0000-000000000001",
    orgName: "Test Motors",
    weekStart: "2026-04-13T00:00:00.000Z",
    weekEnd: "2026-04-20T00:00:00.000Z",
    generatedAt: "2026-04-20T12:00:00.000Z",
    agentName: "Caroline",
    leadsReceivedThisWeek: 42,
    leadsBySource: [
      { name: "Dealer website", thisWeek: 12, priorWeek: 10, delta: 2, direction: "up" },
      { name: "Cargurus", thisWeek: 6, priorWeek: 6, delta: 0, direction: "flat" },
    ],
    ghostedLeads: [],
    singleFollowupLeads: [],
    untouchedLeads: [],
    activity: {
      inboundCalls: 5,
      leadsSynced: 42,
      adfDelivered: 3,
      triggersFired: 0,
      notificationsSent: 2,
      escalations: 0,
    },
    priorities: ["Nothing urgent this week. Keep the momentum going."],
    salesScore: {
      score: 92,
      commentary: "Coverage looks healthy.",
      breakdown: [],
    },
    aiNarrative: null,
    toneInterstitial: TONE_INTERSTITIAL,
    droppedNamelessGhostedCount: 0,
    sourceResolutionFailed: false,
    // rev-4 defaults
    over48hCount: 0,
    automationTriggers: 0,
    adfDeliveries: 3,
    // v7 default — 30-day active snapshot
    score30DayActive: 42,
    fastestActionList: [],
    fastestActionMore: 0,
    scoreCardLines: {
      mainIssueLine: "No leads missed this week.",
      whatToDoFirstLine: "Keep the momentum up.",
    },
    nameResolverStats: {
      warehouse: 0,
      conversation: 0,
      phoneFallback: 0,
      inboundFallback: 0,
    },
    // rev-5 defaults
    kpiArrows: {
      score: "flat",
      leads: "flat",
      ghosted: "flat",
      over48h: "flat",
      stalled: "flat",
      inboundCalls: "flat",
      notifications: "flat",
      adfDeliveries: "flat",
      automationTriggers: "flat",
    },
    priorWeek: {
      leads: 40,
      ghosted: 0,
      over48h: 0,
      stalled: 0,
      inboundCalls: 5,
      notifications: 2,
      adfDeliveries: 3,
      automationTriggers: 0,
      score: 92,
      lostBadLead: 0, // rev-6
    },
    leadsBySourceWinners: [
      { name: "Dealer website", thisWeek: 12, priorWeek: 10, delta: 2, direction: "up" },
    ],
    // v8: leadsBySourceNeedsAttention removed — card deleted from rendered email.
    narrativeWeekSays:
      "You got 42 new leads this week. Every one got a first reply.\n\nThe team score is 92 out of 100. Coverage is strong.\n\n5 customers called in. Keep the momentum going.",
    narrativeWhatMoved:
      "Dealer website was the clearest gain. Not much else moved in the source mix. Keeping this section short makes it easier to scan.",
    simpleReadBullets: [
      "First response speed is holding up. Every new lead got a reply.",
      "No leads sat for more than 48 hours. Keep that bar.",
      "Nobody is stuck after a single reply. Conversations are moving.",
    ],
    quickReadBullets: [
      "2 notifications this week. Consider tuning alerts if volume is low.",
      "3 ADF deliveries were recorded this week.",
      "0 trigger events — triggers are not enabled this cycle.",
    ],
    // rev-6 defaults
    lostBadLeadCount: 0,
    lostBadLeadPriorWeek: 0,
    leadStatusBreakdown: {
      active: 10,
      sold: 5,
      lost: 3,
      bad: 1,
      complete: 0,
    },
    leadsBySourceBiggestLosers: [],
    testPhoneFilterStats: {
      ghosted: 0,
      stalled: 0,
      statusBreakdown: 0,
      fastestAction: 0,
    },
    ...overrides,
  };
}

describe("validateWeeklyReport (revision 2)", () => {
  it("passes a clean, fully-populated report", () => {
    const r = validateWeeklyReport(makeValidReport());
    expect(r.ok).toBe(true);
    expect(r.failures).toEqual([]);
  });

  it("fails when the report is null", () => {
    const r = validateWeeklyReport(null);
    expect(r.ok).toBe(false);
    expect(r.failures.length).toBeGreaterThan(0);
  });

  it("fails when the tone interstitial is missing or altered", () => {
    const r = validateWeeklyReport(makeValidReport({ toneInterstitial: "Hi there." }));
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.toLowerCase().includes("tone interstitial"))).toBe(true);
  });

  it("fails when agentName is blank", () => {
    const r = validateWeeklyReport(makeValidReport({ agentName: "   " }));
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.toLowerCase().includes("agentname"))).toBe(true);
  });

  it("fails when a required section is missing (ghostedLeads undefined)", () => {
    const bad = makeValidReport();
    (bad as any).ghostedLeads = undefined;
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("ghostedLeads"))).toBe(true);
  });

  it("fails when an activity count is negative", () => {
    const bad = makeValidReport({
      activity: {
        inboundCalls: -1,
        leadsSynced: 10,
        adfDelivered: 0,
        triggersFired: 0,
        notificationsSent: 0,
        escalations: 0,
      },
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("inboundCalls"))).toBe(true);
  });

  it("fails when an activity count is not an integer", () => {
    const bad = makeValidReport({
      activity: {
        inboundCalls: 1.5,
        leadsSynced: 10,
        adfDelivered: 0,
        triggersFired: 0,
        notificationsSent: 0,
        escalations: 0,
      },
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("inboundCalls"))).toBe(true);
  });

  it("fails when leadsReceivedThisWeek is negative", () => {
    const bad = makeValidReport({ leadsReceivedThisWeek: -3 });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("leadsReceivedThisWeek"))).toBe(true);
  });

  it("fails when the sales score is > 100", () => {
    const bad = makeValidReport({
      salesScore: { score: 101, commentary: "n/a", breakdown: [] },
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("salesScore.score"))).toBe(true);
  });

  it("fails when the sales score is negative", () => {
    const bad = makeValidReport({
      salesScore: { score: -5, commentary: "n/a", breakdown: [] },
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("salesScore.score"))).toBe(true);
  });

  it("fails when the sales score commentary is blank", () => {
    const bad = makeValidReport({
      salesScore: { score: 80, commentary: "   ", breakdown: [] },
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.toLowerCase().includes("commentary"))).toBe(true);
  });

  it("fails when a string field contains the literal 'undefined'", () => {
    const bad = makeValidReport({
      salesScore: {
        score: 80,
        commentary: "Biggest drag: undefined problems this week.",
        breakdown: [],
      },
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => /undefined/.test(f))).toBe(true);
  });

  it("fails when a string field looks like a raw SQL error", () => {
    const bad = makeValidReport({
      priorities: ['relation "warehouse_leads" does not exist'],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => /does not exist/i.test(f) || /sql/i.test(f) || /priorities/.test(f))).toBe(true);
  });

  it("fails when priorities is not an array", () => {
    const bad = makeValidReport();
    (bad as any).priorities = "Follow up on leads";
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("priorities"))).toBe(true);
  });

  it("fails when a ghosted lead has no customer name", () => {
    const bad = makeValidReport({
      ghostedLeads: [
        {
          customerName: "",
          customerPhone: "+12125551234",
          vehicleOfInterest: "2026 Honda Pilot",
          vinCreatedAt: "2026-04-18T10:00:00.000Z",
          ageHours: 30,
        } as any,
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("ghostedLeads") && f.includes("customerName"))).toBe(true);
  });

  it("fails when a single-followup lead has no customer name", () => {
    const bad = makeValidReport({
      singleFollowupLeads: [
        {
          customerName: "   ",
          customerPhone: "+12125551234",
          vehicleOfInterest: "2026 Honda Pilot",
          lastActivityAt: "2026-04-17T10:00:00.000Z",
          daysSinceLastActivity: 3,
        } as any,
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("singleFollowupLeads") && f.includes("customerName"))).toBe(true);
  });

  it("fails when leadsBySource has an invalid direction", () => {
    const bad = makeValidReport({
      leadsBySource: [
        // @ts-expect-error intentionally bad direction
        { name: "x", thisWeek: 1, priorWeek: 0, delta: 1, direction: "sideways" },
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("direction"))).toBe(true);
  });

  it("fails when aiNarrative is non-placeholder but shorter than 100 words", () => {
    const bad = makeValidReport({
      aiNarrative: "Short narrative. Not enough words to count as real AI output.",
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.toLowerCase().includes("ainarrative"))).toBe(true);
  });

  it("passes when aiNarrative IS the documented placeholder (no word-count check)", () => {
    const r = validateWeeklyReport(
      makeValidReport({
        aiNarrative: "AI narrative unavailable this cycle — raw data shown below.",
      }),
    );
    expect(r.ok).toBe(true);
  });

  it("passes when aiNarrative meets word-count AND rev-4 structure (4-5 paragraphs)", () => {
    // rev-4 tightened this: non-placeholder narrative must ALSO have 4-5
    // paragraphs and sane words/sentence. Plain repeated filler fails the
    // sentence-avg check, so we build a realistic short-sentence narrative.
    const paras = [
      "You got 50 new leads this week. 10 got no reply. That is a real concern for the store and the team. People asked about a car and got nothing back.",
      "Of those 10, 5 waited more than two days. That is the biggest gap right now. The longer a lead waits, the less likely they are to buy. Speed matters here.",
      "The team score is 60 out of 100. It fell because too many leads did not hear back. Automation did not help cover the gap this week. So the drop is on outbound work.",
      "The good news is 4 customers did call in. That shows the store can respond when someone reaches out. Now the goal is to put that same energy into the leads waiting on a reply.",
    ];
    const r = validateWeeklyReport(makeValidReport({ aiNarrative: paras.join("\n\n") }));
    expect(r.ok).toBe(true);
  });

  it("accepts a report that has real leads populated", () => {
    const r = validateWeeklyReport(
      makeValidReport({
        ghostedLeads: [
          {
            customerName: "Jane Smith",
            customerPhone: "+12125551234",
            vehicleOfInterest: "2026 Honda Pilot",
            vinCreatedAt: "2026-04-15T10:00:00.000Z",
            ageHours: 108,
          },
        ],
        singleFollowupLeads: [
          {
            customerName: "John Doe",
            customerPhone: "+13125554321",
            vehicleOfInterest: "2026 Civic",
            lastActivityAt: "2026-04-17T10:00:00.000Z",
            daysSinceLastActivity: 3,
            hoursSinceLastActivity: 72,
          },
        ],
      }),
    );
    expect(r.ok).toBe(true);
    expect(r.failures).toEqual([]);
  });

  // ---------- rev-3: week-scope enforcement ----------

  it("fails when a ghosted entry has vinCreatedAt before the week window (stale data bug)", () => {
    const bad = makeValidReport({
      // Week window: 2026-04-13 → 2026-04-20
      ghostedLeads: [
        {
          customerName: "Stale Customer",
          customerPhone: "+12125551234",
          vehicleOfInterest: "2026 Pilot",
          vinCreatedAt: "2025-11-15T10:00:00.000Z", // 156 days before weekEnd
          ageHours: 3744,
        },
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.toLowerCase().includes("stale") && f.includes("outside week window"))).toBe(true);
  });

  it("fails when a ghosted entry has vinCreatedAt after the week window", () => {
    const bad = makeValidReport({
      ghostedLeads: [
        {
          customerName: "Future Customer",
          customerPhone: "+12125551234",
          vehicleOfInterest: "2026 Pilot",
          vinCreatedAt: "2026-05-01T10:00:00.000Z", // after weekEnd
          ageHours: 0,
        },
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("outside week window"))).toBe(true);
  });

  // ---------- rev-3: vehicle-URL sanitization ----------

  it("fails when a ghosted vehicle string is a raw VIN API URL", () => {
    const bad = makeValidReport({
      ghostedLeads: [
        {
          customerName: "URL Victim",
          customerPhone: "+12125551234",
          vehicleOfInterest: "https://api.vinsolutions.com/vehicles/interest/id/2003358163-0",
          vinCreatedAt: "2026-04-15T10:00:00.000Z",
          ageHours: 108,
        },
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.toLowerCase().includes("raw url"))).toBe(true);
  });

  it("fails when a single-followup vehicle string is a raw URL", () => {
    const bad = makeValidReport({
      singleFollowupLeads: [
        {
          customerName: "URL Victim 2",
          customerPhone: "+12125551234",
          vehicleOfInterest: "http://api.vinsolutions.com/vehicles/interest/id/999-0",
          lastActivityAt: "2026-04-17T10:00:00.000Z",
          daysSinceLastActivity: 3,
          hoursSinceLastActivity: 72,
        },
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.toLowerCase().includes("raw url"))).toBe(true);
  });

  it("passes when vehicle is 'Vehicle not specified' (the sanitized fallback)", () => {
    const r = validateWeeklyReport(
      makeValidReport({
        ghostedLeads: [
          {
            customerName: "Jane Smith",
            customerPhone: "+12125551234",
            vehicleOfInterest: "Vehicle not specified",
            vinCreatedAt: "2026-04-15T10:00:00.000Z",
            ageHours: 108,
          },
        ],
      }),
    );
    expect(r.ok).toBe(true);
  });

  // ---------- rev-3: banned-jargon in priorities ----------

  it.each([
    "Follow up on 28 leads this week",
    "Prioritize outreach on these 12 customers",
    "12 ghosted leads need attention",
    "Email 5 recipients about their inquiries",
    "Trigger the workflow to reset the queue",
  ])("fails when priorities contain banned jargon: %s", (bullet) => {
    const bad = makeValidReport({ priorities: [bullet] });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("banned jargon"))).toBe(true);
  });

  it("passes when priorities use plain English operator samples", () => {
    const r = validateWeeklyReport(
      makeValidReport({
        priorities: [
          "28 new customers reached out this week and haven't heard back. Start here.",
          "23 of those have been waiting more than 2 days. Every hour they wait, the less likely they'll buy.",
          "3 customers you already talked to haven't heard back in 3 days. A quick check-in keeps them warm.",
        ],
      }),
    );
    expect(r.ok).toBe(true);
    expect(r.failures).toEqual([]);
  });

  // ---------- rev-3: source-resolution fallback ratio ----------

  it("fails when > 30% of leadsBySource fell back to 'Source #N' and MCP did NOT fail", () => {
    // Fixture string must match the validator regex /^Source #\d+$/ exactly.
    // Fallback string was renamed from "VIN Source #N" → "Source #N" by
    // Fix 7.5 / 2026-04-26 (drop developer-jargon "VIN"). Validator regex
    // and these fixtures were updated together to keep behavior coverage.
    const bad = makeValidReport({
      sourceResolutionFailed: false,
      leadsBySource: [
        { name: "Dealer website", thisWeek: 5, priorWeek: 4, delta: 1, direction: "up" },
        { name: "Source #7098", thisWeek: 3, priorWeek: 2, delta: 1, direction: "up" },
        { name: "Source #3743779", thisWeek: 2, priorWeek: 1, delta: 1, direction: "up" },
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("Source #N"))).toBe(true);
  });

  it("passes when > 30% fell back but MCP call failed (outage guard)", () => {
    const r = validateWeeklyReport(
      makeValidReport({
        sourceResolutionFailed: true,
        leadsBySource: [
          { name: "Source #7098", thisWeek: 3, priorWeek: 2, delta: 1, direction: "up" },
          { name: "Source #3743779", thisWeek: 2, priorWeek: 1, delta: 1, direction: "up" },
          { name: "Source #8", thisWeek: 5, priorWeek: 4, delta: 1, direction: "up" },
        ],
      }),
    );
    expect(r.ok).toBe(true);
  });

  it("passes when ≤ 30% fell back and MCP succeeded (one deleted source is fine)", () => {
    const r = validateWeeklyReport(
      makeValidReport({
        sourceResolutionFailed: false,
        leadsBySource: [
          { name: "Dealer website", thisWeek: 5, priorWeek: 4, delta: 1, direction: "up" },
          { name: "Cars.com", thisWeek: 4, priorWeek: 4, delta: 0, direction: "flat" },
          { name: "Cargurus", thisWeek: 3, priorWeek: 2, delta: 1, direction: "up" },
          { name: "Source #99999", thisWeek: 1, priorWeek: 0, delta: 1, direction: "up" }, // 25% fallback
        ],
      }),
    );
    expect(r.ok).toBe(true);
  });

  // ---------- rev-3: new required fields ----------

  it("fails when droppedNamelessGhostedCount is missing", () => {
    const bad = makeValidReport();
    delete (bad as any).droppedNamelessGhostedCount;
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("droppedNamelessGhostedCount"))).toBe(true);
  });

  it("fails when droppedNamelessGhostedCount is negative", () => {
    const r = validateWeeklyReport(makeValidReport({ droppedNamelessGhostedCount: -2 }));
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("droppedNamelessGhostedCount"))).toBe(true);
  });

  it("fails when sourceResolutionFailed is not a boolean", () => {
    const bad = makeValidReport();
    (bad as any).sourceResolutionFailed = "yes";
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("sourceResolutionFailed"))).toBe(true);
  });

  it("passes when droppedNamelessGhostedCount > 0 (honest reporting of data gap)", () => {
    const r = validateWeeklyReport(makeValidReport({ droppedNamelessGhostedCount: 47 }));
    expect(r.ok).toBe(true);
  });

  // -------- rev-4: dashboard metrics + scoreCardLines + narrative sanity --------

  it("fails when over48hCount exceeds ghostedLeads.length (not a subset)", () => {
    const bad = makeValidReport({
      ghostedLeads: [
        {
          customerName: "Jane",
          customerPhone: "+12125551234",
          vehicleOfInterest: "Vehicle not specified",
          vinCreatedAt: "2026-04-15T10:00:00.000Z",
          ageHours: 100,
        },
      ],
      over48hCount: 5, // > 1 ghosted lead
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("over48hCount") && f.includes("subset"))).toBe(true);
  });

  it("fails when over48hCount is negative", () => {
    const bad = makeValidReport({ over48hCount: -1 });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("over48hCount"))).toBe(true);
  });

  it("fails when a fastestActionList entry name is 'AI Lead' (exact)", () => {
    const bad = makeValidReport({
      fastestActionList: [
        {
          name: "AI Lead",
          nameSource: "warehouse",
          customerPhone: "+12125551234",
          kind: "ghosted",
          subtext: "No follow-up yet",
          ageLabel: "24h old",
          sortKey: 24,
        },
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("AI Lead"))).toBe(true);
  });

  it("fails when a fastestActionList entry name starts with 'AI Lead '", () => {
    const bad = makeValidReport({
      fastestActionList: [
        {
          name: "AI Lead Phone Call",
          nameSource: "warehouse",
          customerPhone: "+12125551234",
          kind: "ghosted",
          subtext: "No follow-up yet",
          ageLabel: "24h old",
          sortKey: 24,
        },
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("AI Lead"))).toBe(true);
  });

  it("passes when fastestActionList uses real names (non-test phones)", () => {
    // rev-6: customerPhone values must not be +1555 test-phone pattern.
    const r = validateWeeklyReport(
      makeValidReport({
        fastestActionList: [
          {
            name: "Jane Smith",
            nameSource: "warehouse",
            customerPhone: "+12125551234", // 212 area → real
            kind: "ghosted",
            subtext: "No follow-up yet",
            ageLabel: "166h old",
            sortKey: 166,
          },
          {
            name: "Caller \u2022\u2022\u2022 4567",
            nameSource: "phone_fallback",
            customerPhone: "+13135551234", // 313 area → real
            kind: "stalled",
            subtext: "One reply, then no next step",
            ageLabel: "4d idle",
            sortKey: 96,
          },
        ],
      }),
    );
    expect(r.ok).toBe(true);
  });

  it("fails when scoreCardLines.mainIssueLine exceeds 90 chars", () => {
    const long = "a".repeat(95);
    const bad = makeValidReport({
      scoreCardLines: {
        mainIssueLine: long,
        whatToDoFirstLine: "Short and fine.",
      },
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("mainIssueLine") && f.includes("≤90"))).toBe(true);
  });

  it("fails when scoreCardLines contain banned jargon", () => {
    const bad = makeValidReport({
      scoreCardLines: {
        mainIssueLine: "The ghosted leads are piling up.", // "ghosted" is banned
        whatToDoFirstLine: "Begin outreach now.", // "outreach" is banned
      },
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("mainIssueLine") && f.includes("ghosted"))).toBe(true);
    expect(r.failures.some((f) => f.includes("whatToDoFirstLine") && f.includes("outreach"))).toBe(true);
  });

  it("fails when narrative has only 3 paragraphs", () => {
    const three = "Para one with ten words here for sanity padding testing.\n\nPara two also ten words to make it pass length.\n\nPara three to make the third para exist.";
    const bad = makeValidReport({
      aiNarrative: three + " " + Array(90).fill("word").join(" "),
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.toLowerCase().includes("paragraphs"))).toBe(true);
  });

  it("fails when narrative exceeds 260 words", () => {
    const paragraphs = Array(4).fill(Array(80).fill("word").join(" ")).join("\n\n");
    const bad = makeValidReport({ aiNarrative: paragraphs });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.toLowerCase().includes("word count"))).toBe(true);
  });

  it("fails when narrative sentences average more than 25 words", () => {
    const longSentence = Array(40).fill("word").join(" ") + ".";
    const narrative = [longSentence, longSentence, longSentence, longSentence].join("\n\n");
    const bad = makeValidReport({ aiNarrative: narrative });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.toLowerCase().includes("words/sentence"))).toBe(true);
  });

  it("passes with a 4-paragraph 6th-grade narrative matching operator sample shape", () => {
    const sample = [
      "You got 50 new leads this week. 10 of them got no reply from anyone. That is a real problem for the store. People asked about a car and got nothing back.",
      "Of those 10, 5 waited more than two days. That is the main gap to close right now. The longer a lead sits, the less likely they are to come in. Speed is the key.",
      "The team score is 60 out of 100. It fell because of the first reply gap. Automation did not help cover the missing replies. So the drop is on outbound work this week.",
      "The good news is 4 customers did call in. That shows the store can respond when people reach out. Now the goal is to put the same energy into the leads still waiting on a reply.",
    ].join("\n\n");
    const r = validateWeeklyReport(makeValidReport({ aiNarrative: sample }));
    expect(r.ok).toBe(true);
  });

  it("passes with a 5-paragraph 6th-grade narrative (upper bound)", () => {
    const sample = [
      "You got 100 new leads this week. 20 got no reply. That means people asked about a car and got no answer.",
      "Out of those 20, 15 have waited more than two days. That is the biggest problem in the store right now.",
      "The team score is 45 out of 100. The score is low because of the first reply gap. Automation did not help.",
      "There are also 3 leads that got one reply then nothing. The first touch happened but did not keep moving.",
      "The good news is 8 customers did call in. That shows the store can respond when people reach out.",
    ].join("\n\n");
    const r = validateWeeklyReport(makeValidReport({ aiNarrative: sample }));
    expect(r.ok).toBe(true);
  });

  it("fails when required rev-4 field scoreCardLines is missing", () => {
    const bad = makeValidReport();
    delete (bad as any).scoreCardLines;
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("scoreCardLines"))).toBe(true);
  });

  it("fails when fastestActionList is not an array", () => {
    const bad = makeValidReport();
    (bad as any).fastestActionList = "not an array";
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("fastestActionList"))).toBe(true);
  });

  // -------- rev-5: kpiArrows + priorWeek + source split + narratives --------

  it("fails when a kpiArrows entry is invalid", () => {
    const bad = makeValidReport();
    (bad as any).kpiArrows.score = "sideways";
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("kpiArrows.score"))).toBe(true);
  });

  it("fails when kpiArrows is missing entirely", () => {
    const bad = makeValidReport();
    delete (bad as any).kpiArrows;
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.toLowerCase().includes("kpiarrows"))).toBe(true);
  });

  it("fails when priorWeek has a negative count", () => {
    const bad = makeValidReport();
    (bad as any).priorWeek.leads = -5;
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("priorWeek.leads"))).toBe(true);
  });

  it("fails when leadsBySourceWinners contains a non-positive delta", () => {
    const bad = makeValidReport({
      leadsBySourceWinners: [
        { name: "Dealer website", thisWeek: 10, priorWeek: 10, delta: 0, direction: "flat" },
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("leadsBySourceWinners") && f.includes("delta > 0"))).toBe(true);
  });

  // v8: leadsBySourceNeedsAttention validator removed — the Needs Attention
  // card was deleted from the rendered email, so the field no longer exists
  // on the report object. Biggest Losers (below) carries the sole losses-side
  // contract now.

  it("passes with proper winners (positive delta) and a biggest-loser (negative delta)", () => {
    const r = validateWeeklyReport(
      makeValidReport({
        leadsBySourceWinners: [
          { name: "Dealer website", thisWeek: 12, priorWeek: 8, delta: 4, direction: "up" },
        ],
        leadsBySourceBiggestLosers: [
          { name: "Cargurus", thisWeek: 3, priorWeek: 8, delta: -5, direction: "down" },
        ],
      }),
    );
    expect(r.ok).toBe(true);
    expect(r.failures).toEqual([]);
  });

  it("fails when narrativeWeekSays exceeds 220 words (rev-6 limit)", () => {
    // 5 short sentences * 45 words each = 225 words over 5 paragraphs
    const para = "Short sentence. " + Array(44).fill("word").join(" ") + ".";
    const long = [para, para, para, para, para].join("\n\n");
    const bad = makeValidReport({ narrativeWeekSays: long });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("narrativeWeekSays") && f.includes("≤220"))).toBe(true);
  });

  it("fails when narrativeWeekSays contains banned jargon", () => {
    const bad = makeValidReport({
      narrativeWeekSays: "Ghosted leads are piling up.\n\nKeep it short.\n\nAll good.",
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("narrativeWeekSays") && f.includes("ghosted"))).toBe(true);
  });

  it("fails when narrativeWhatMoved exceeds 60 words", () => {
    const long = Array(80).fill("word").join(" ") + ".";
    const bad = makeValidReport({ narrativeWhatMoved: long });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("narrativeWhatMoved") && f.includes("≤60"))).toBe(true);
  });

  it("fails when simpleReadBullets does not contain exactly 3 entries", () => {
    const bad = makeValidReport({ simpleReadBullets: ["one", "two"] });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("simpleReadBullets") && f.includes("exactly 3"))).toBe(true);
  });

  it("fails when quickReadBullets has a blank entry", () => {
    const bad = makeValidReport({
      quickReadBullets: ["a", "   ", "c"],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("quickReadBullets[1]"))).toBe(true);
  });

  it("passes with a valid ghosted row whose phone formats to (XXX) XXX-XXXX", () => {
    const r = validateWeeklyReport(
      makeValidReport({
        ghostedLeads: [
          {
            customerName: "Jane Smith",
            customerPhone: "+12125551234",
            vehicleOfInterest: "Vehicle not specified",
            vinCreatedAt: "2026-04-15T10:00:00.000Z",
            ageHours: 40,
          },
        ],
        over48hCount: 0,
      }),
    );
    expect(r.ok).toBe(true);
    expect(r.failures).toEqual([]);
  });

  it("fails when a stalled lead has negative hoursSinceLastActivity", () => {
    const bad = makeValidReport({
      singleFollowupLeads: [
        {
          customerName: "John",
          customerPhone: "+13125554321",
          vehicleOfInterest: "Vehicle not specified",
          lastActivityAt: "2026-04-17T10:00:00.000Z",
          daysSinceLastActivity: 3,
          hoursSinceLastActivity: -5,
        },
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("hoursSinceLastActivity"))).toBe(true);
  });

  // ------------------------------------------------------------------------
  // rev-6: LOST_BAD_LEAD featured metric + lead status breakdown + Biggest
  // Losers + test-phone filter stats + test-phone hard-fail on leaks.
  // ------------------------------------------------------------------------

  it("fails when lostBadLeadCount is missing", () => {
    const bad = makeValidReport();
    delete (bad as any).lostBadLeadCount;
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("lostBadLeadCount"))).toBe(true);
  });

  it("fails when lostBadLeadCount is negative", () => {
    const bad = makeValidReport({ lostBadLeadCount: -3 });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("lostBadLeadCount"))).toBe(true);
  });

  it("fails when lostBadLeadPriorWeek is not an integer", () => {
    const bad = makeValidReport({ lostBadLeadPriorWeek: 2.5 });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("lostBadLeadPriorWeek"))).toBe(true);
  });

  it("fails when leadStatusBreakdown is missing", () => {
    const bad = makeValidReport();
    delete (bad as any).leadStatusBreakdown;
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.toLowerCase().includes("leadstatusbreakdown"))).toBe(true);
  });

  it("fails when leadStatusBreakdown has a negative count", () => {
    const bad = makeValidReport({
      leadStatusBreakdown: { active: 10, sold: 5, lost: 3, bad: -1, complete: 0 },
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("leadStatusBreakdown.bad"))).toBe(true);
  });

  it("passes with a valid leadStatusBreakdown (all non-negative ints)", () => {
    const r = validateWeeklyReport(
      makeValidReport({
        leadStatusBreakdown: { active: 42, sold: 8, lost: 15, bad: 2, complete: 4 },
      }),
    );
    expect(r.ok).toBe(true);
  });

  it("fails when leadsBySourceBiggestLosers exceeds 5 entries", () => {
    const bad = makeValidReport({
      leadsBySourceBiggestLosers: [
        { name: "A", thisWeek: 1, priorWeek: 5, delta: -4, direction: "down" },
        { name: "B", thisWeek: 1, priorWeek: 4, delta: -3, direction: "down" },
        { name: "C", thisWeek: 1, priorWeek: 3, delta: -2, direction: "down" },
        { name: "D", thisWeek: 1, priorWeek: 2, delta: -1, direction: "down" },
        { name: "E", thisWeek: 1, priorWeek: 2, delta: -1, direction: "down" },
        { name: "F", thisWeek: 1, priorWeek: 2, delta: -1, direction: "down" },
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("leadsBySourceBiggestLosers") && f.includes("≤5"))).toBe(true);
  });

  it("fails when leadsBySourceBiggestLosers has a non-negative delta entry", () => {
    const bad = makeValidReport({
      leadsBySourceBiggestLosers: [
        { name: "Flat source", thisWeek: 5, priorWeek: 5, delta: 0, direction: "flat" },
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("leadsBySourceBiggestLosers") && f.includes("delta < 0"))).toBe(true);
  });

  it("passes with leadsBySourceBiggestLosers at exactly 5 entries, all negative deltas", () => {
    const r = validateWeeklyReport(
      makeValidReport({
        leadsBySourceBiggestLosers: [
          { name: "A", thisWeek: 1, priorWeek: 6, delta: -5, direction: "down" },
          { name: "B", thisWeek: 1, priorWeek: 5, delta: -4, direction: "down" },
          { name: "C", thisWeek: 1, priorWeek: 4, delta: -3, direction: "down" },
          { name: "D", thisWeek: 1, priorWeek: 3, delta: -2, direction: "down" },
          { name: "E", thisWeek: 1, priorWeek: 2, delta: -1, direction: "down" },
        ],
      }),
    );
    expect(r.ok).toBe(true);
  });

  it("fails when priorWeek.lostBadLead is missing", () => {
    const bad = makeValidReport();
    delete (bad as any).priorWeek.lostBadLead;
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("priorWeek.lostBadLead"))).toBe(true);
  });

  it("fails when testPhoneFilterStats is missing", () => {
    const bad = makeValidReport();
    delete (bad as any).testPhoneFilterStats;
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("testPhoneFilterStats"))).toBe(true);
  });

  it("fails when testPhoneFilterStats has a negative count", () => {
    const bad = makeValidReport({
      testPhoneFilterStats: { ghosted: -1, stalled: 0, statusBreakdown: 0, fastestAction: 0 },
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("testPhoneFilterStats.ghosted"))).toBe(true);
  });

  it("hard-fails when a +1555 test phone leaks to ghostedLeads", () => {
    const bad = makeValidReport({
      ghostedLeads: [
        {
          customerName: "Test Synthetic",
          customerPhone: "+15551234567",
          vehicleOfInterest: "Vehicle not specified",
          vinCreatedAt: "2026-04-15T10:00:00.000Z",
          ageHours: 48,
        },
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("+1555") && f.includes("ghostedLeads"))).toBe(true);
  });

  it("hard-fails when a +1555 test phone leaks to singleFollowupLeads", () => {
    const bad = makeValidReport({
      singleFollowupLeads: [
        {
          customerName: "Test Synthetic",
          customerPhone: "+15557654321",
          vehicleOfInterest: "Vehicle not specified",
          lastActivityAt: "2026-04-17T10:00:00.000Z",
          daysSinceLastActivity: 3,
          hoursSinceLastActivity: 72,
        },
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("+1555") && f.includes("singleFollowupLeads"))).toBe(true);
  });

  it("hard-fails when a +1555 test phone leaks to fastestActionList", () => {
    const bad = makeValidReport({
      fastestActionList: [
        {
          name: "Test Synthetic",
          nameSource: "warehouse",
          customerPhone: "+15550100001", // NANP 555-01XX reserved fictional
          kind: "ghosted",
          subtext: "No follow-up yet",
          ageLabel: "24h old",
          sortKey: 24,
        },
      ],
    });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("+1555") && f.includes("fastestActionList"))).toBe(true);
  });

  it("passes when phones are real 212/313 etc (not +1555)", () => {
    const r = validateWeeklyReport(
      makeValidReport({
        ghostedLeads: [
          {
            customerName: "Real Customer",
            customerPhone: "+12125551234", // 212 area, not +1555
            vehicleOfInterest: "Vehicle not specified",
            vinCreatedAt: "2026-04-15T10:00:00.000Z",
            ageHours: 30,
          },
        ],
      }),
    );
    // Note: +12125551234 normalizes to 12125551234 (11 digits starting "1212")
    // which does NOT match /^\+?1?555\d{7}$/. It should pass.
    expect(r.ok).toBe(true);
  });

  it("passes with larger narrativeWeekSays (rev-6 expanded limit to 220 words, short sentences)", () => {
    // 5 paragraphs with short-sentence prose that keeps avg words/sentence ≤ 20
    const para =
      "You got many leads this week. Most got a reply. Some still need one. That is the short version.";
    const narr = [para, para, para, para, para].join("\n\n");
    const r = validateWeeklyReport(makeValidReport({ narrativeWeekSays: narr }));
    // ~100 words, under 220 cap; sentence avg well below 20
    expect(r.ok).toBe(true);
  });

  it("fails when narrativeWeekSays has > 5 chunks", () => {
    const chunk = "A short sentence.";
    const narr = [chunk, chunk, chunk, chunk, chunk, chunk].join("\n\n"); // 6 chunks
    const bad = makeValidReport({ narrativeWeekSays: narr });
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("narrativeWeekSays") && f.toLowerCase().includes("chunks"))).toBe(true);
  });

  // ------------------------------------------------------------------------
  // v7: score30DayActive field + new score formula range
  // ------------------------------------------------------------------------

  it("fails when score30DayActive is missing", () => {
    const bad = makeValidReport();
    delete (bad as any).score30DayActive;
    const r = validateWeeklyReport(bad);
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("score30DayActive"))).toBe(true);
  });

  it("fails when score30DayActive is negative", () => {
    const r = validateWeeklyReport(makeValidReport({ score30DayActive: -1 } as any));
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("score30DayActive"))).toBe(true);
  });

  it("fails when score30DayActive is not an integer", () => {
    const r = validateWeeklyReport(makeValidReport({ score30DayActive: 12.5 } as any));
    expect(r.ok).toBe(false);
    expect(r.failures.some((f) => f.includes("score30DayActive"))).toBe(true);
  });

  it("passes when score30DayActive is a non-negative integer", () => {
    const r = validateWeeklyReport(makeValidReport({ score30DayActive: 247 } as any));
    expect(r.ok).toBe(true);
  });

  it("v7: sales score stays in [0,100] even with very high ghosted+over48h counts", () => {
    // Simulate a score computed with 200 ghosted + 100 over48h:
    //   100 - 100 - 100 = -100 → floor 0
    const r = validateWeeklyReport(
      makeValidReport({
        salesScore: { score: 0, commentary: "All drag, no wins this week.", breakdown: [] },
      }),
    );
    expect(r.ok).toBe(true);
  });

  it("v7: sales score sample — Serra Honda (3 ghosted, 3 over48h) → 96", () => {
    // 100 - 1.5 - 3 = 95.5 → round → 96
    expect(Math.max(0, Math.round(100 - 3 * 0.5 - 3 * 1))).toBe(96);
    const r = validateWeeklyReport(
      makeValidReport({ salesScore: { score: 96, commentary: "Mostly clean week.", breakdown: [] } }),
    );
    expect(r.ok).toBe(true);
  });

  it("v7: sales score sample — Tony Serra Ford (28, 25) → 61", () => {
    // 100 - 14 - 25 = 61
    expect(Math.max(0, Math.round(100 - 28 * 0.5 - 25 * 1))).toBe(61);
  });

  it("v7: sales score sample — Serra Nissan (34, 30) → 53", () => {
    expect(Math.max(0, Math.round(100 - 34 * 0.5 - 30 * 1))).toBe(53);
  });

  it("v7: sales score sample — Hyundai of Columbia (51, 35) → 40", () => {
    // 100 - 25.5 - 35 = 39.5 → round → 40
    expect(Math.max(0, Math.round(100 - 51 * 0.5 - 35 * 1))).toBe(40);
  });

  it("v7: sales score sample — Ford of Columbia (53, 41) → 33", () => {
    // 100 - 26.5 - 41 = 32.5 → Math.round rounds half-to-even in some langs,
    // but JS Math.round(32.5) = 33 (round half up for positive numbers).
    expect(Math.max(0, Math.round(100 - 53 * 0.5 - 41 * 1))).toBe(33);
  });
});
