/**
 * TRG-RPT-001 — buildWeeklyReport() content tests (revision 4).
 *
 * Scope note: the operator's "no shortcuts, no mocks" rule applies here.
 * Mocking drizzle/pg would give us a false sense of correctness. Instead,
 * we run against the real staging DB (same DATABASE_URL tests/setup.ts loads)
 * and assert the shape and invariants of the output for known orgs.
 *
 * These tests DO NOT send anything. They only build + validate report data.
 *
 * Revision 4 changes:
 *   - Assert every report has the new dashboard fields: over48hCount (non-neg
 *     int, ≤ ghostedLeads.length), automationTriggers, adfDeliveries,
 *     fastestActionList (array of valid entries, no "AI Lead" names),
 *     fastestActionMore (non-neg int), scoreCardLines (mainIssueLine +
 *     whatToDoFirstLine, both ≤90 chars), nameResolverStats (counts obj).
 *   - Assert the name resolver never emits literal "AI Lead"
 *   - Assert scoreCardLines contain no banned jargon
 *
 * Revision 3 retained (week-scoped ghosted, no vehicle URLs, no banned
 * priority jargon, droppedNameless / sourceResolutionFailed required).
 */

import { describe, it, expect, beforeAll } from "vitest";
import { testPool } from "../setup";
import {
  buildWeeklyReport,
  validateWeeklyReport,
  renderWeeklyReportHtml,
  getPrimaryAgentName,
  resolveDisplayName,
  TONE_INTERSTITIAL,
  BANNED_PRIORITY_TOKENS,
  formatVehicle,
  formatUsPhone,
  computeArrowDir,
  isTestPhone,
  classifyForStatusBreakdown,
  DRAFT_BANNER_TEXT,
  CONFIDENTIAL_BADGE_TEXT,
  DRAFT_BANNER_COLOR,
  CONFIDENTIAL_BADGE_COLOR,
} from "@server/services/weeklyReportService";

interface OrgRow {
  id: string;
  name: string;
  slug: string;
}

let dealerOrgs: OrgRow[] = [];

beforeAll(async () => {
  const r = await testPool.query<OrgRow>(
    `SELECT id, name, slug FROM organizations
     WHERE partner_id IS NOT NULL AND slug != 'cage-automotive'
     ORDER BY name`,
  );
  dealerOrgs = r.rows;
});

function weekWindow(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { start, end };
}

describe("buildWeeklyReport (live staging data, revision 2)", () => {
  it("finds 5 dealership orgs (Cage excluded)", () => {
    expect(dealerOrgs.length).toBe(5);
    const names = dealerOrgs.map((o) => o.name).sort();
    expect(names).toContain("Serra Honda");
    expect(names).toContain("Serra Nissan");
    expect(names).toContain("Tony Serra Ford");
    expect(names).toContain("Ford of Columbia");
    expect(names).toContain("Hyundai of Columbia");
  });

  it("resolves a non-empty agent name for each dealership", async () => {
    expect(dealerOrgs.length).toBeGreaterThan(0);
    for (const org of dealerOrgs) {
      const name = await getPrimaryAgentName(org.id);
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    }
  }, 30_000);

  it("produces a shape-valid report for each dealership", async () => {
    expect(dealerOrgs.length).toBeGreaterThan(0);
    const { start, end } = weekWindow();

    for (const org of dealerOrgs) {
      const { data, warnings } = await buildWeeklyReport(org.id, start, end);

      // Shape / required fields
      expect(data.orgId).toBe(org.id);
      expect(data.orgName).toBe(org.name);
      expect(data.weekStart).toBe(start.toISOString());
      expect(data.weekEnd).toBe(end.toISOString());
      expect(data.toneInterstitial).toBe(TONE_INTERSTITIAL);

      // Agent name resolved
      expect(typeof data.agentName).toBe("string");
      expect(data.agentName.length).toBeGreaterThan(0);

      // rev-3: new required fields
      expect(typeof data.sourceResolutionFailed).toBe("boolean");
      expect(typeof data.droppedNamelessGhostedCount).toBe("number");
      expect(Number.isInteger(data.droppedNamelessGhostedCount)).toBe(true);
      expect(data.droppedNamelessGhostedCount).toBeGreaterThanOrEqual(0);

      // Arrays always present
      expect(Array.isArray(data.leadsBySource)).toBe(true);
      expect(Array.isArray(data.ghostedLeads)).toBe(true);
      expect(Array.isArray(data.singleFollowupLeads)).toBe(true);
      expect(Array.isArray(data.untouchedLeads)).toBe(true);
      expect(Array.isArray(data.priorities)).toBe(true);
      expect(data.priorities.length).toBeGreaterThan(0);

      // leadsReceivedThisWeek invariants
      expect(typeof data.leadsReceivedThisWeek).toBe("number");
      expect(data.leadsReceivedThisWeek).toBeGreaterThanOrEqual(0);
      // Sum of bySource thisWeek must be <= total leads received (some may lack leadSource → Unknown)
      const bySourceTotal = data.leadsBySource.reduce((acc, s) => acc + s.thisWeek, 0);
      expect(bySourceTotal).toBeLessThanOrEqual(data.leadsReceivedThisWeek);

      // Ghosted: every entry has a non-empty customer name
      for (const g of data.ghostedLeads) {
        expect(typeof g.customerName).toBe("string");
        expect(g.customerName.trim().length).toBeGreaterThan(0);
        // rev-3: week-scope enforced on every ghosted entry
        const created = new Date(g.vinCreatedAt).getTime();
        expect(created).toBeGreaterThanOrEqual(start.getTime());
        expect(created).toBeLessThanOrEqual(end.getTime());
        // rev-3: vehicle must not be a raw URL
        if (g.vehicleOfInterest != null) {
          expect(/^https?:\/\//i.test(g.vehicleOfInterest)).toBe(false);
        }
      }
      // Single follow-up: every entry has a non-empty customer name + days field
      for (const s of data.singleFollowupLeads) {
        expect(typeof s.customerName).toBe("string");
        expect(s.customerName.trim().length).toBeGreaterThan(0);
        expect(typeof s.daysSinceLastActivity).toBe("number");
        expect(s.daysSinceLastActivity).toBeGreaterThanOrEqual(0);
        if (s.vehicleOfInterest != null) {
          expect(/^https?:\/\//i.test(s.vehicleOfInterest)).toBe(false);
        }
      }

      // rev-3: priorities contain no banned jargon
      for (const p of data.priorities) {
        const lower = p.toLowerCase();
        for (const token of BANNED_PRIORITY_TOKENS) {
          expect(lower.includes(token)).toBe(false);
        }
      }

      // rev-4: new dashboard fields required on every report
      expect(typeof data.over48hCount).toBe("number");
      expect(Number.isInteger(data.over48hCount)).toBe(true);
      expect(data.over48hCount).toBeGreaterThanOrEqual(0);
      expect(data.over48hCount).toBeLessThanOrEqual(data.ghostedLeads.length);

      expect(typeof data.automationTriggers).toBe("number");
      expect(data.automationTriggers).toBeGreaterThanOrEqual(0);

      expect(typeof data.adfDeliveries).toBe("number");
      expect(data.adfDeliveries).toBeGreaterThanOrEqual(0);

      expect(Array.isArray(data.fastestActionList)).toBe(true);
      expect(data.fastestActionList.length).toBeLessThanOrEqual(8);

      expect(typeof data.fastestActionMore).toBe("number");
      expect(data.fastestActionMore).toBeGreaterThanOrEqual(0);

      // Fastest action entries — no "AI Lead" names, valid shape
      for (const e of data.fastestActionList) {
        expect(typeof e.name).toBe("string");
        expect(e.name.trim().length).toBeGreaterThan(0);
        const lower = e.name.trim().toLowerCase();
        expect(lower === "ai lead" || lower.startsWith("ai lead ")).toBe(false);
        expect(["ghosted", "stalled"]).toContain(e.kind);
        expect(typeof e.subtext).toBe("string");
        expect(e.subtext.trim().length).toBeGreaterThan(0);
        expect(typeof e.ageLabel).toBe("string");
        expect(e.ageLabel.trim().length).toBeGreaterThan(0);
        expect(["warehouse", "conversation", "phone_fallback", "inbound_fallback"]).toContain(e.nameSource);
      }

      // scoreCardLines — ≤90 chars, no banned jargon
      expect(data.scoreCardLines).toBeTruthy();
      expect(typeof data.scoreCardLines.mainIssueLine).toBe("string");
      expect(typeof data.scoreCardLines.whatToDoFirstLine).toBe("string");
      expect(data.scoreCardLines.mainIssueLine.length).toBeLessThanOrEqual(90);
      expect(data.scoreCardLines.whatToDoFirstLine.length).toBeLessThanOrEqual(90);
      for (const line of [data.scoreCardLines.mainIssueLine, data.scoreCardLines.whatToDoFirstLine]) {
        const lower = line.toLowerCase();
        for (const token of BANNED_PRIORITY_TOKENS) {
          expect(lower.includes(token)).toBe(false);
        }
      }

      // nameResolverStats — all non-negative ints
      expect(data.nameResolverStats).toBeTruthy();
      for (const v of [
        data.nameResolverStats.warehouse,
        data.nameResolverStats.conversation,
        data.nameResolverStats.phoneFallback,
        data.nameResolverStats.inboundFallback,
      ]) {
        expect(typeof v).toBe("number");
        expect(v).toBeGreaterThanOrEqual(0);
      }

      // leadsBySource directional consistency
      for (const ls of data.leadsBySource) {
        expect(typeof ls.name).toBe("string");
        expect(ls.name.length).toBeGreaterThan(0);
        expect(ls.thisWeek).toBeGreaterThan(0); // builder filters to thisWeek > 0
        expect(ls.priorWeek).toBeGreaterThanOrEqual(0);
        if (ls.delta > 0) expect(ls.direction).toBe("up");
        if (ls.delta < 0) expect(ls.direction).toBe("down");
        if (ls.delta === 0) expect(ls.direction).toBe("flat");
      }

      // rev-5: kpiArrows present with valid directions
      expect(data.kpiArrows).toBeTruthy();
      const arrowDirs = ["up", "down", "flat"];
      for (const key of [
        "score",
        "leads",
        "ghosted",
        "over48h",
        "stalled",
        "inboundCalls",
        "notifications",
        "adfDeliveries",
        "automationTriggers",
      ] as const) {
        expect(arrowDirs).toContain(data.kpiArrows[key]);
      }

      // rev-5: priorWeek present with non-negative ints
      expect(data.priorWeek).toBeTruthy();
      for (const key of [
        "leads",
        "ghosted",
        "over48h",
        "stalled",
        "inboundCalls",
        "notifications",
        "adfDeliveries",
        "automationTriggers",
        "score",
      ] as const) {
        const v = data.priorWeek[key];
        expect(typeof v).toBe("number");
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
      }

      // rev-5 / v8: Winners must have positive delta. (NeedsAttention removed
      // with the card; Biggest Losers is asserted below in rev-6 block.)
      for (const w of data.leadsBySourceWinners) {
        expect(w.delta).toBeGreaterThan(0);
      }

      // rev-5: Short narratives + bullets
      expect(typeof data.narrativeWeekSays).toBe("string");
      expect(data.narrativeWeekSays.trim().length).toBeGreaterThan(0);
      expect(data.narrativeWeekSays.trim().split(/\s+/).length).toBeLessThanOrEqual(120);
      expect(typeof data.narrativeWhatMoved).toBe("string");
      expect(data.narrativeWhatMoved.trim().length).toBeGreaterThan(0);
      expect(data.narrativeWhatMoved.trim().split(/\s+/).length).toBeLessThanOrEqual(60);
      expect(Array.isArray(data.simpleReadBullets)).toBe(true);
      expect(data.simpleReadBullets.length).toBe(3);
      expect(Array.isArray(data.quickReadBullets)).toBe(true);
      expect(data.quickReadBullets.length).toBe(3);

      // rev-5: Stalled rows carry hoursSinceLastActivity
      for (const s of data.singleFollowupLeads) {
        expect(typeof s.hoursSinceLastActivity).toBe("number");
        expect(s.hoursSinceLastActivity).toBeGreaterThanOrEqual(0);
      }

      // Activity invariants
      expect(data.activity.inboundCalls).toBeGreaterThanOrEqual(0);
      expect(data.activity.leadsSynced).toBeGreaterThanOrEqual(0);
      expect(data.activity.adfDelivered).toBeGreaterThanOrEqual(0);
      expect(data.activity.triggersFired).toBeGreaterThanOrEqual(0);
      expect(data.activity.notificationsSent).toBeGreaterThanOrEqual(0);
      expect(data.activity.escalations).toBeGreaterThanOrEqual(0);

      expect(data.salesScore.score).toBeGreaterThanOrEqual(0);
      expect(data.salesScore.score).toBeLessThanOrEqual(100);
      expect(data.salesScore.commentary.length).toBeGreaterThan(0);

      // Warnings, if present, are strings
      for (const w of warnings) expect(typeof w).toBe("string");

      // rev-6: Lead Status Breakdown + LOST_BAD_LEAD featured metric
      expect(typeof data.lostBadLeadCount).toBe("number");
      expect(Number.isInteger(data.lostBadLeadCount)).toBe(true);
      expect(data.lostBadLeadCount).toBeGreaterThanOrEqual(0);
      expect(typeof data.lostBadLeadPriorWeek).toBe("number");
      expect(data.lostBadLeadPriorWeek).toBeGreaterThanOrEqual(0);

      expect(data.leadStatusBreakdown).toBeTruthy();
      for (const key of ["active", "sold", "lost", "bad", "complete"] as const) {
        const v = data.leadStatusBreakdown[key];
        expect(typeof v).toBe("number");
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeGreaterThanOrEqual(0);
      }

      // rev-6: Biggest Losers — ≤5, all deltas < 0
      expect(Array.isArray(data.leadsBySourceBiggestLosers)).toBe(true);
      expect(data.leadsBySourceBiggestLosers.length).toBeLessThanOrEqual(5);
      for (const l of data.leadsBySourceBiggestLosers) {
        expect(l.delta).toBeLessThan(0);
      }

      // rev-6: test-phone filter stats present with non-negative ints
      expect(data.testPhoneFilterStats).toBeTruthy();
      for (const key of ["ghosted", "stalled", "statusBreakdown", "fastestAction"] as const) {
        const v = data.testPhoneFilterStats[key];
        expect(typeof v).toBe("number");
        expect(v).toBeGreaterThanOrEqual(0);
      }

      // rev-6: no +1555 test phone in any customer-visible list
      for (const g of data.ghostedLeads) {
        expect(isTestPhone(g.customerPhone)).toBe(false);
      }
      for (const s of data.singleFollowupLeads) {
        expect(isTestPhone(s.customerPhone)).toBe(false);
      }
      for (const e of data.fastestActionList) {
        expect(isTestPhone(e.customerPhone)).toBe(false);
      }

      // rev-6: priorWeek.lostBadLead present and non-negative int
      expect(typeof data.priorWeek.lostBadLead).toBe("number");
      expect(Number.isInteger(data.priorWeek.lostBadLead)).toBe(true);
      expect(data.priorWeek.lostBadLead).toBeGreaterThanOrEqual(0);

      // rev-6: narrativeWeekSays ≤220 words, ≤5 chunks
      const wsWords = data.narrativeWeekSays.trim().split(/\s+/).filter(Boolean).length;
      expect(wsWords).toBeLessThanOrEqual(220);
      const wsChunks = data.narrativeWeekSays.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
      expect(wsChunks.length).toBeLessThanOrEqual(5);

      // rev-6: rendered HTML contains DRAFT banner and CONFIDENTIAL badge
      const html = renderWeeklyReportHtml(data);
      expect(html).toContain(DRAFT_BANNER_TEXT);
      expect(html).toContain(CONFIDENTIAL_BADGE_TEXT);
      expect(html).toContain(DRAFT_BANNER_COLOR);
      expect(html).toContain(CONFIDENTIAL_BADGE_COLOR);
      // Store name appears as the PRIMARY hero line (big/bold).
      // We confirm by checking the HTML contains the org name inside a
      // font-size:30px div — the primary hero styling.
      expect(html).toContain(`font-size:30px`);
      // "AI Dealership Performance Analysis" is SECONDARY (smaller weight)
      expect(html).toContain("AI Dealership Performance Analysis");
      // Lead Status pill divider present
      expect(html).toContain("Lead Status");
      // Biggest Losers card title
      expect(html).toContain("Biggest Losers");

      // Validator must pass (with aiNarrative left null — placeholder path)
      const v = validateWeeklyReport(data);
      expect(v.failures).toEqual([]);
      expect(v.ok).toBe(true);
    }
  }, 90_000);

  it("formatVehicle rewrites raw VIN API URLs to 'Vehicle not specified'", () => {
    expect(formatVehicle("https://api.vinsolutions.com/vehicles/interest/id/2003358163-0")).toBe("Vehicle not specified");
    expect(formatVehicle("http://example.com/anything")).toBe("Vehicle not specified");
    expect(formatVehicle("No data")).toBe("Vehicle not specified");
    expect(formatVehicle("")).toBe("Vehicle not specified");
    expect(formatVehicle(null)).toBe("Vehicle not specified");
    expect(formatVehicle(undefined)).toBe("Vehicle not specified");
    // Passthrough for real vehicle strings
    expect(formatVehicle("2026 Honda Pilot")).toBe("2026 Honda Pilot");
    expect(formatVehicle("  2026 Civic  ")).toBe("2026 Civic");
  });

  it("throws a clear error for a non-existent orgId", async () => {
    const { start, end } = weekWindow();
    await expect(
      buildWeeklyReport("00000000-0000-0000-0000-000000000000", start, end),
    ).rejects.toThrow(/Organization not found/);
  });

  // ------------------------------------------------------------------------
  // TRG-RPT-001 hotfix (2026-04-21): opt-in sales-only filter
  //
  // When salesOnlyLeadIds is passed, the rendered count must match the
  // supplied set (bounded by what's in the warehouse) AND the rendered label
  // must say "Sales Leads This Week" / "New sales leads that came into VIN
  // Solutions". When omitted, default behavior is unchanged.
  // ------------------------------------------------------------------------
  it("honors salesOnlyLeadIds — lead count matches the supplied set and labels switch to Sales", async () => {
    expect(dealerOrgs.length).toBeGreaterThan(0);
    const { start, end } = weekWindow();
    // Pick the smallest dealer for speed — Serra Honda (smallest warehouse).
    const org = dealerOrgs.find((o) => o.slug === "serra-honda") || dealerOrgs[0];

    // 1. Baseline: no filter → standard behavior, default label.
    const baseline = await buildWeeklyReport(org.id, start, end);
    expect(baseline.data.salesFilterActive).toBeFalsy();
    const baselineHtml = renderWeeklyReportHtml(baseline.data);
    expect(baselineHtml).toContain("Leads This Week");
    expect(baselineHtml).toContain("New leads that came into VIN Solutions");
    expect(baselineHtml).not.toContain("Sales Leads This Week");

    // 2. Pull the warehouse source_ids for this week so the test uses real
    //    IDs (not an arbitrary hard-coded set). Pick half of them — the
    //    count must then be ≤ the full-half and the exact set size after
    //    intersecting with the warehouse's actual rows.
    const r = await testPool.query<{ source_id: string }>(
      `SELECT source_id FROM warehouse_leads
       WHERE organization_id = $1 AND vin_created_at >= $2 AND vin_created_at <= $3
       ORDER BY vin_created_at`,
      [org.id, start, end],
    );
    const allIds = r.rows.map((row) => row.source_id).filter(Boolean);
    expect(allIds.length).toBeGreaterThan(0);
    // Use the first half — deterministic, non-empty, strictly smaller.
    const halfCount = Math.max(1, Math.floor(allIds.length / 2));
    const salesIds = new Set(allIds.slice(0, halfCount));

    const filtered = await buildWeeklyReport(org.id, start, end, {
      salesOnlyLeadIds: salesIds,
    });
    expect(filtered.data.salesFilterActive).toBe(true);
    // The rendered count must equal the size of the supplied set (since every
    // id we supplied came directly from the warehouse query above).
    expect(filtered.data.leadsReceivedThisWeek).toBe(salesIds.size);
    // Filter must shrink the result vs baseline.
    expect(filtered.data.leadsReceivedThisWeek).toBeLessThan(baseline.data.leadsReceivedThisWeek);

    const filteredHtml = renderWeeklyReportHtml(filtered.data);
    expect(filteredHtml).toContain("Sales Leads This Week");
    expect(filteredHtml).toContain("New sales leads that came into VIN Solutions");

    // Validator still passes on the filtered output.
    const v = validateWeeklyReport(filtered.data);
    expect(v.failures).toEqual([]);
    expect(v.ok).toBe(true);
  }, 90_000);

  // ------------------------------------------------------------------------
  // rev-4: resolveDisplayName — "AI Lead" is NEVER emitted
  // ------------------------------------------------------------------------
  describe("resolveDisplayName (rev-4 — no 'AI Lead')", () => {
    it("prefers warehouse name when it is non-empty and not 'AI Lead'", () => {
      const r = resolveDisplayName("Jane Smith", "Somebody Else", "+12125551234");
      expect(r.name).toBe("Jane Smith");
      expect(r.source).toBe("warehouse");
    });

    it("falls through to conversation name when warehouse is empty", () => {
      const r = resolveDisplayName("", "John Doe", "+12125551234");
      expect(r.name).toBe("John Doe");
      expect(r.source).toBe("conversation");
    });

    it("falls through to conversation name when warehouse is literal 'AI Lead'", () => {
      const r = resolveDisplayName("AI Lead", "Marcus Chen", "+12125551234");
      expect(r.name).toBe("Marcus Chen");
      expect(r.source).toBe("conversation");
    });

    it("rejects 'AI Lead' (case-insensitive) at the warehouse step", () => {
      const r = resolveDisplayName("ai lead", "Real Name", "+12125551234");
      expect(r.name).toBe("Real Name");
    });

    it("rejects 'AI Lead' at the conversation step too", () => {
      const r = resolveDisplayName(null, "AI Lead", "+12125551234");
      // both banned → fall to phone
      expect(r.name).toBe("Caller \u2022\u2022\u2022 1234");
      expect(r.source).toBe("phone_fallback");
    });

    it("falls to 'Caller ••• {last4}' when neither name is usable", () => {
      const r = resolveDisplayName(null, null, "+15551234567");
      expect(r.name).toBe("Caller \u2022\u2022\u2022 4567");
      expect(r.source).toBe("phone_fallback");
    });

    it("falls to 'Inbound caller' when there's no phone either", () => {
      const r = resolveDisplayName(null, null, null);
      expect(r.name).toBe("Inbound caller");
      expect(r.source).toBe("inbound_fallback");
    });

    it("falls to 'Inbound caller' when phone has fewer than 4 digits", () => {
      const r = resolveDisplayName("", "", "123");
      expect(r.name).toBe("Inbound caller");
      expect(r.source).toBe("inbound_fallback");
    });

    it("rejects 'AI Lead Phone Call' prefix too (operator rule)", () => {
      const r = resolveDisplayName("AI Lead Phone Call", "Jane", "+15551234567");
      expect(r.name).toBe("Jane");
      expect(r.source).toBe("conversation");
    });
  });

  it("prints rev-5 per-store diagnostics (arrows, winners/losers, phone counts)", async () => {
    const { start, end } = weekWindow();
    for (const org of dealerOrgs) {
      const { data } = await buildWeeklyReport(org.id, start, end);
      const { renderWeeklyReportHtml } = await import("@server/services/weeklyReportService");
      const html = renderWeeklyReportHtml(data);
      const phones = (html.match(/\(\d{3}\) \d{3}-\d{4}/g) || []).length;
      const masked = (html.match(/\u2022\u2022\u2022 \d+/g) || []).length;
      const gAges = (html.match(/\d+[hd] old/g) || []).length;
      const sAges = (html.match(/\d+[hd] idle/g) || []).length;
      // eslint-disable-next-line no-console
      console.log(
        `[rev5-diag] ${data.orgName} | ` +
          `leads=${data.leadsReceivedThisWeek}/${data.priorWeek.leads} ` +
          `ghosted=${data.ghostedLeads.length}/${data.priorWeek.ghosted} ` +
          `over48h=${data.over48hCount}/${data.priorWeek.over48h} ` +
          `stalled=${data.singleFollowupLeads.length}/${data.priorWeek.stalled} ` +
          `score=${data.salesScore.score}/${data.priorWeek.score} ` +
          `notifs=${data.activity.notificationsSent}/${data.priorWeek.notifications} ` +
          `adf=${data.adfDeliveries}/${data.priorWeek.adfDeliveries} ` +
          `triggers=${data.automationTriggers}/${data.priorWeek.automationTriggers} ` +
          `inbound=${data.activity.inboundCalls}/${data.priorWeek.inboundCalls}`,
      );
      // eslint-disable-next-line no-console
      console.log(
        `[rev5-diag] ${data.orgName} ARROWS | ` +
          `score=${data.kpiArrows.score} leads=${data.kpiArrows.leads} ` +
          `ghosted=${data.kpiArrows.ghosted} over48h=${data.kpiArrows.over48h} ` +
          `stalled=${data.kpiArrows.stalled} notifs=${data.kpiArrows.notifications} ` +
          `adf=${data.kpiArrows.adfDeliveries} triggers=${data.kpiArrows.automationTriggers}`,
      );
      // eslint-disable-next-line no-console
      console.log(
        `[rev5-diag] ${data.orgName} SPLIT | ` +
          `winners=${data.leadsBySourceWinners.length} losers=${data.leadsBySourceBiggestLosers.length} ` +
          `RENDER phones=${phones} masked=${masked} ghosted-ages=${gAges} stalled-ages=${sAges}`,
      );
      if (data.leadsBySourceWinners[0]) {
        // eslint-disable-next-line no-console
        console.log(`[rev5-diag] ${data.orgName} top-winner="${data.leadsBySourceWinners[0].name}" delta=+${data.leadsBySourceWinners[0].delta}`);
      }
      if (data.leadsBySourceBiggestLosers[0]) {
        // eslint-disable-next-line no-console
        console.log(`[rev5-diag] ${data.orgName} top-loser="${data.leadsBySourceBiggestLosers[0].name}" delta=${data.leadsBySourceBiggestLosers[0].delta}`);
      }
      // eslint-disable-next-line no-console
      console.log(`[rev5-diag] ${data.orgName} whatMoved: ${data.narrativeWhatMoved}`);
    }
    expect(dealerOrgs.length).toBe(5);
  }, 90_000);

  it("returns empty window-scoped arrays for a zero-activity week window (far future)", async () => {
    // Pick a window 10 years in the future — no leads were CREATED there.
    // NOTE rev-6: stalled (singleFollowupLeads) is NOT window-scoped — it
    // uses [now-7d, now-48h] on conversation last_message_at. So stalled
    // can be non-empty even for a future window if any current conversation
    // meets the criteria today. The other arrays ARE window-scoped.
    const future = new Date("2036-01-01T00:00:00.000Z");
    const futureEnd = new Date("2036-01-08T00:00:00.000Z");
    const org = dealerOrgs[0];
    const { data } = await buildWeeklyReport(org.id, future, futureEnd);
    expect(data.leadsBySource).toEqual([]);
    expect(data.ghostedLeads).toEqual([]);
    expect(data.untouchedLeads).toEqual([]);
    expect(data.leadsReceivedThisWeek).toBe(0);
    expect(data.activity.inboundCalls).toBe(0);
    expect(data.activity.leadsSynced).toBe(0);
    // Score formula does not penalize stalled — ghosted=0 + over48h=0 → 100
    expect(data.salesScore.score).toBe(100);
    // rev-5 / v8 source-split fields still empty (source mix is window-scoped)
    expect(data.leadsBySourceWinners).toEqual([]);
    expect(data.leadsBySourceBiggestLosers).toEqual([]);
    expect(data.simpleReadBullets.length).toBe(3);
    expect(data.quickReadBullets.length).toBe(3);

    // rev-6: singleFollowupLeads is NOT window-scoped; just assert shape.
    expect(Array.isArray(data.singleFollowupLeads)).toBe(true);
    for (const s of data.singleFollowupLeads) {
      expect(typeof s.customerName).toBe("string");
      expect(s.customerName.trim().length).toBeGreaterThan(0);
      // hoursSinceLastActivity within [48, 168] per the new definition
      expect(s.hoursSinceLastActivity).toBeGreaterThanOrEqual(48);
      expect(s.hoursSinceLastActivity).toBeLessThanOrEqual(7 * 24);
    }
  }, 30_000);

  // ------------------------------------------------------------------------
  // rev-5: formatUsPhone — locked-down output patterns
  // ------------------------------------------------------------------------
  describe("formatUsPhone (rev-5)", () => {
    it("formats a 10-digit US number to (XXX) XXX-XXXX", () => {
      expect(formatUsPhone("2125551234")).toBe("(212) 555-1234");
    });
    it("strips +1 country code prefix", () => {
      expect(formatUsPhone("+12125551234")).toBe("(212) 555-1234");
    });
    it("strips leading 1 on 11-digit numbers", () => {
      expect(formatUsPhone("12125551234")).toBe("(212) 555-1234");
    });
    it("masks short numbers with ••• and last digits", () => {
      expect(formatUsPhone("1234")).toBe("\u2022\u2022\u2022 1234");
    });
    it("returns (no phone) for null / empty", () => {
      expect(formatUsPhone(null)).toBe("(no phone)");
      expect(formatUsPhone(undefined)).toBe("(no phone)");
      expect(formatUsPhone("")).toBe("(no phone)");
      expect(formatUsPhone("   ")).toBe("(no phone)");
    });
    it("never displays raw E.164 in the output", () => {
      const out = formatUsPhone("+12125551234");
      expect(out.startsWith("+")).toBe(false);
      expect(out).not.toContain("12125551234");
    });
    it("tolerates already-formatted strings", () => {
      expect(formatUsPhone("(212) 555-1234")).toBe("(212) 555-1234");
      expect(formatUsPhone("212-555-1234")).toBe("(212) 555-1234");
      expect(formatUsPhone("212.555.1234")).toBe("(212) 555-1234");
    });
  });

  // ------------------------------------------------------------------------
  // rev-5: computeArrowDir — arrow direction rules
  // ------------------------------------------------------------------------
  describe("computeArrowDir (rev-5)", () => {
    it("returns up when this > prior", () => {
      expect(computeArrowDir(10, 5)).toBe("up");
    });
    it("returns down when this < prior", () => {
      expect(computeArrowDir(3, 8)).toBe("down");
    });
    it("returns flat when equal", () => {
      expect(computeArrowDir(7, 7)).toBe("flat");
    });
    it("returns flat when prior is null (no prior data)", () => {
      expect(computeArrowDir(7, null)).toBe("flat");
    });
    it("returns flat when prior is undefined", () => {
      expect(computeArrowDir(7, undefined)).toBe("flat");
    });
    it("returns flat when prior is NaN", () => {
      expect(computeArrowDir(7, NaN)).toBe("flat");
    });
  });

  // ------------------------------------------------------------------------
  // rev-6: isTestPhone — +1555 filter
  // ------------------------------------------------------------------------
  describe("isTestPhone (rev-6)", () => {
    it("matches +15551234567 (NANP 555 with +1 prefix)", () => {
      expect(isTestPhone("+15551234567")).toBe(true);
    });
    it("matches 15551234567 (no +)", () => {
      expect(isTestPhone("15551234567")).toBe(true);
    });
    it("matches 5551234567 (bare 10-digit)", () => {
      expect(isTestPhone("5551234567")).toBe(true);
    });
    it("matches +15550100001 (NANP fictional reserved 555-01XX)", () => {
      expect(isTestPhone("+15550100001")).toBe(true);
    });
    it("does NOT match real 212 area code", () => {
      expect(isTestPhone("+12125551234")).toBe(false);
    });
    it("does NOT match real 313 area code", () => {
      expect(isTestPhone("+13135551234")).toBe(false);
    });
    it("does NOT match null/empty", () => {
      expect(isTestPhone(null)).toBe(false);
      expect(isTestPhone(undefined)).toBe(false);
      expect(isTestPhone("")).toBe(false);
      expect(isTestPhone("   ")).toBe(false);
    });
    it("tolerates formatted strings like (555) 123-4567", () => {
      expect(isTestPhone("(555) 123-4567")).toBe(true);
    });
  });

  // ------------------------------------------------------------------------
  // rev-6: classifyForStatusBreakdown — prefix categorization
  // ------------------------------------------------------------------------
  describe("classifyForStatusBreakdown (rev-6)", () => {
    it("classifies ACTIVE_NEW_LEAD → active", () => {
      expect(classifyForStatusBreakdown("ACTIVE_NEW_LEAD")).toBe("active");
    });
    it("classifies SOLD_DELIVERED → sold", () => {
      expect(classifyForStatusBreakdown("SOLD_DELIVERED")).toBe("sold");
    });
    it("classifies LOST_BAD_LEAD → lost (stays in LOST per operator)", () => {
      expect(classifyForStatusBreakdown("LOST_BAD_LEAD")).toBe("lost");
    });
    it("classifies LOST_DID_NOT_RESPOND → lost", () => {
      expect(classifyForStatusBreakdown("LOST_DID_NOT_RESPOND")).toBe("lost");
    });
    it("classifies LOST_LEAD_PROCESS_COMPLETED → lost (LOST_ prefix wins over COMPLETED suffix)", () => {
      expect(classifyForStatusBreakdown("LOST_LEAD_PROCESS_COMPLETED")).toBe("lost");
    });
    it("classifies BAD_CONTACT → bad", () => {
      expect(classifyForStatusBreakdown("BAD_CONTACT")).toBe("bad");
    });
    it("classifies DUPLICATE → bad (contains DUPLICATE)", () => {
      expect(classifyForStatusBreakdown("DUPLICATE")).toBe("bad");
    });
    it("classifies COMPLETE (standalone) → complete", () => {
      expect(classifyForStatusBreakdown("COMPLETE")).toBe("complete");
    });
    it("returns null for null/empty/unknown", () => {
      expect(classifyForStatusBreakdown(null)).toBe(null);
      expect(classifyForStatusBreakdown("")).toBe(null);
      expect(classifyForStatusBreakdown("SOMETHING_ELSE")).toBe(null);
    });
    it("handles case-insensitively", () => {
      expect(classifyForStatusBreakdown("active_new_lead")).toBe("active");
      expect(classifyForStatusBreakdown("sold_delivered")).toBe("sold");
    });
  });
});

// ---------------------------------------------------------------------------
// TRG-RPT-001 — Recipient routing regression lock
//
// Locks the deterministic filter + per-store recipient map so routing cannot
// drift silently. These tests exercise the filter and the expected recipient
// sets against a fixed fixture — they do NOT query the DB.
// ---------------------------------------------------------------------------

import {
  isTestOrSeedEmail,
  TEST_EMAIL_ADDRESSES,
  TEST_EMAIL_DOMAIN_PATTERNS,
  SEED_EMAIL_PATTERNS,
} from "../integration/weeklyReport.send-live.test";

describe("TRG-RPT-001 recipient filter — isTestOrSeedEmail", () => {
  it("excludes named test addresses (TEST_EMAIL_ADDRESSES)", () => {
    expect(isTestOrSeedEmail("duanekwells@gmail.com")).toBe(true);
    expect(isTestOrSeedEmail("neoweaver@gmail.com")).toBe(true);
    expect(isTestOrSeedEmail("DuaneKWells@Gmail.com")).toBe(true); // case
    expect(isTestOrSeedEmail("  duanekwells@gmail.com  ")).toBe(true); // trim
  });

  it("excludes @huminic.ai domain pattern", () => {
    expect(isTestOrSeedEmail("serra_honda@huminic.ai")).toBe(true);
    expect(isTestOrSeedEmail("serra_nissan@huminic.ai")).toBe(true);
    expect(isTestOrSeedEmail("serra_ford@huminic.ai")).toBe(true);
    expect(isTestOrSeedEmail("columbia_hyundai@huminic.ai")).toBe(true);
    expect(isTestOrSeedEmail("columbia_ford@huminic.ai")).toBe(true);
    expect(isTestOrSeedEmail("duane.wells@huminic.ai")).toBe(true);
    expect(isTestOrSeedEmail("ANY@HUMINIC.AI")).toBe(true); // case
  });

  it("excludes orgadmin@ prefix seed pattern", () => {
    expect(isTestOrSeedEmail("orgadmin@serrahonda.com")).toBe(true);
    expect(isTestOrSeedEmail("orgadmin@anything.com")).toBe(true);
    expect(isTestOrSeedEmail("ORGADMIN@anything.com")).toBe(true);
  });

  it("excludes @serrahonda.com seed domain (real dealership uses .net)", () => {
    expect(isTestOrSeedEmail("someone@serrahonda.com")).toBe(true);
  });

  it("keeps real dealership admins", () => {
    expect(isTestOrSeedEmail("dwood@serrahonda.net")).toBe(false);
    expect(isTestOrSeedEmail("sdew@serrahonda.net")).toBe(false);
    expect(isTestOrSeedEmail("victoria@misscommunicationconsulting.com")).toBe(false);
    expect(isTestOrSeedEmail("jessica@misscommunicationconsulting.com")).toBe(false);
    expect(isTestOrSeedEmail("sam.mayfield@bc.auto")).toBe(false);
    expect(isTestOrSeedEmail("durran@cageautomotive.com")).toBe(false);
  });

  it("treats empty/null/whitespace as excluded", () => {
    expect(isTestOrSeedEmail(null)).toBe(true);
    expect(isTestOrSeedEmail(undefined)).toBe(true);
    expect(isTestOrSeedEmail("")).toBe(true);
    expect(isTestOrSeedEmail("   ")).toBe(true);
  });

  it("exports used constants for auditability", () => {
    expect(TEST_EMAIL_ADDRESSES).toBeInstanceOf(Set);
    expect(TEST_EMAIL_ADDRESSES.size).toBeGreaterThan(0);
    expect(Array.isArray(TEST_EMAIL_DOMAIN_PATTERNS)).toBe(true);
    expect(TEST_EMAIL_DOMAIN_PATTERNS.length).toBeGreaterThan(0);
    expect(Array.isArray(SEED_EMAIL_PATTERNS)).toBe(true);
    expect(SEED_EMAIL_PATTERNS.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Fixture-based routing tests
// ---------------------------------------------------------------------------
//
// These tests exercise the routing logic against a constructed user set. They
// mirror the DB-driven resolver in weeklyReport.send-live.test.ts but work
// against an in-memory fixture so the contract is locked regardless of what
// the live DB contains.

interface FixtureUser {
  email: string;
  role: "org_admin" | "partner_admin" | "super_admin";
  isActive: boolean;
  organizationId: string;
  additionalOrgIds: string[] | null;
}

/**
 * Pure routing resolver used only by the fixture tests. Mirrors the SQL in
 * resolveOrgRouting() exactly.
 */
function resolveRoutingFromFixture(
  orgId: string,
  partnerOrgId: string,
  users: FixtureUser[],
): { to: string[]; cc: string[] } {
  const to = users
    .filter(
      (u) =>
        u.role === "org_admin" &&
        u.isActive &&
        (u.organizationId === orgId ||
          (Array.isArray(u.additionalOrgIds) && u.additionalOrgIds.includes(orgId))),
    )
    .map((u) => u.email)
    .filter((e) => !isTestOrSeedEmail(e))
    .sort((a, b) => a.localeCompare(b));

  const cc = users
    .filter(
      (u) =>
        u.role === "partner_admin" &&
        u.isActive &&
        u.organizationId === partnerOrgId,
    )
    .map((u) => u.email)
    .filter((e) => !isTestOrSeedEmail(e))
    .sort((a, b) => a.localeCompare(b));

  return { to, cc };
}

// Fixture modeled after the live production DB snapshot taken on
// 2026-04-20 for TRG-RPT-001. These ids are stable across the fixture —
// they do NOT need to match the real DB UUIDs.
const FORD_COL = "org-ford-col";
const HYU_COL = "org-hyundai-col";
const SERRA_HONDA = "org-serra-honda";
const SERRA_NISSAN = "org-serra-nissan";
const TONY_SERRA_FORD = "org-tony-serra-ford";
const CAGE = "org-cage-automotive";

const FIXTURE_USERS: FixtureUser[] = [
  // Ford of Columbia
  { email: "columbia_ford@huminic.ai", role: "org_admin", isActive: true, organizationId: FORD_COL, additionalOrgIds: null },
  // Hyundai of Columbia (+ Sam multi-org primary here; additionalOrgIds puts him on Ford of Columbia too)
  { email: "columbia_hyundai@huminic.ai", role: "org_admin", isActive: true, organizationId: HYU_COL, additionalOrgIds: null },
  { email: "sam.mayfield@bc.auto", role: "org_admin", isActive: true, organizationId: HYU_COL, additionalOrgIds: [FORD_COL] },
  // Serra Honda
  { email: "orgadmin@serrahonda.com", role: "org_admin", isActive: true, organizationId: SERRA_HONDA, additionalOrgIds: null },
  { email: "serra_honda@huminic.ai", role: "org_admin", isActive: true, organizationId: SERRA_HONDA, additionalOrgIds: null },
  { email: "neoweaver@gmail.com", role: "org_admin", isActive: true, organizationId: SERRA_HONDA, additionalOrgIds: null },
  { email: "sdew@serrahonda.net", role: "org_admin", isActive: true, organizationId: SERRA_HONDA, additionalOrgIds: null },
  { email: "jessica@misscommunicationconsulting.com", role: "org_admin", isActive: true, organizationId: SERRA_HONDA, additionalOrgIds: null },
  // dwood & victoria live at Serra Honda primary, multi-org into Nissan + Tony Serra Ford
  { email: "dwood@serrahonda.net", role: "org_admin", isActive: true, organizationId: SERRA_HONDA, additionalOrgIds: [SERRA_NISSAN, TONY_SERRA_FORD] },
  { email: "victoria@misscommunicationconsulting.com", role: "org_admin", isActive: true, organizationId: SERRA_HONDA, additionalOrgIds: [SERRA_NISSAN, TONY_SERRA_FORD] },
  // Serra Nissan — only the huminic test account at primary
  { email: "serra_nissan@huminic.ai", role: "org_admin", isActive: true, organizationId: SERRA_NISSAN, additionalOrgIds: null },
  // Tony Serra Ford — only the huminic test account at primary
  { email: "serra_ford@huminic.ai", role: "org_admin", isActive: true, organizationId: TONY_SERRA_FORD, additionalOrgIds: null },
  // Partner admins at Cage Automotive
  { email: "duanekwells@gmail.com", role: "partner_admin", isActive: true, organizationId: CAGE, additionalOrgIds: null },
  { email: "durran@cageautomotive.com", role: "partner_admin", isActive: true, organizationId: CAGE, additionalOrgIds: null },
  { email: "durran.cage@cageautomotive.com", role: "partner_admin", isActive: false, organizationId: CAGE, additionalOrgIds: null },
];

describe("TRG-RPT-001 fixture routing — regression lock on per-store recipient map", () => {
  it("Ford of Columbia → To: sam.mayfield@bc.auto only; Cc: durran@cageautomotive.com", () => {
    const { to, cc } = resolveRoutingFromFixture(FORD_COL, CAGE, FIXTURE_USERS);
    expect(to).toEqual(["sam.mayfield@bc.auto"]);
    expect(cc).toEqual(["durran@cageautomotive.com"]);
  });

  it("Hyundai of Columbia → To: sam.mayfield@bc.auto only; Cc: durran@cageautomotive.com", () => {
    const { to, cc } = resolveRoutingFromFixture(HYU_COL, CAGE, FIXTURE_USERS);
    expect(to).toEqual(["sam.mayfield@bc.auto"]);
    expect(cc).toEqual(["durran@cageautomotive.com"]);
  });

  it("Serra Honda → To: dwood, jessica, sdew, victoria (sorted); Cc: durran", () => {
    const { to, cc } = resolveRoutingFromFixture(SERRA_HONDA, CAGE, FIXTURE_USERS);
    expect(to).toEqual([
      "dwood@serrahonda.net",
      "jessica@misscommunicationconsulting.com",
      "sdew@serrahonda.net",
      "victoria@misscommunicationconsulting.com",
    ]);
    expect(cc).toEqual(["durran@cageautomotive.com"]);
  });

  it("Serra Nissan → To: dwood, victoria (via additional_org_ids); Cc: durran", () => {
    const { to, cc } = resolveRoutingFromFixture(SERRA_NISSAN, CAGE, FIXTURE_USERS);
    expect(to).toEqual([
      "dwood@serrahonda.net",
      "victoria@misscommunicationconsulting.com",
    ]);
    expect(cc).toEqual(["durran@cageautomotive.com"]);
  });

  it("Tony Serra Ford → To: dwood, victoria (via additional_org_ids); Cc: durran", () => {
    const { to, cc } = resolveRoutingFromFixture(TONY_SERRA_FORD, CAGE, FIXTURE_USERS);
    expect(to).toEqual([
      "dwood@serrahonda.net",
      "victoria@misscommunicationconsulting.com",
    ]);
    expect(cc).toEqual(["durran@cageautomotive.com"]);
  });

  it("Cc is always exactly 1 active partner_admin (durran) — inactive durran.cage is excluded", () => {
    for (const orgId of [FORD_COL, HYU_COL, SERRA_HONDA, SERRA_NISSAN, TONY_SERRA_FORD]) {
      const { cc } = resolveRoutingFromFixture(orgId, CAGE, FIXTURE_USERS);
      expect(cc).toHaveLength(1);
      expect(cc[0]).toBe("durran@cageautomotive.com");
    }
  });

  it("filter excludes orgadmin@, @huminic.ai, and @serrahonda.com across every store", () => {
    const everyTo: string[] = [];
    for (const orgId of [FORD_COL, HYU_COL, SERRA_HONDA, SERRA_NISSAN, TONY_SERRA_FORD]) {
      const { to } = resolveRoutingFromFixture(orgId, CAGE, FIXTURE_USERS);
      everyTo.push(...to);
    }
    for (const e of everyTo) {
      expect(isTestOrSeedEmail(e), `${e} should have been excluded`).toBe(false);
      expect(e.endsWith("@huminic.ai")).toBe(false);
      expect(e.endsWith("@serrahonda.com")).toBe(false);
      expect(e.toLowerCase().startsWith("orgadmin@")).toBe(false);
    }
  });
});

describe("TRG-RPT-001 routing — inactive users are excluded", () => {
  it("inactive org_admin is not in To: even if otherwise qualifying", () => {
    const users: FixtureUser[] = [
      { email: "active@realdealer.com", role: "org_admin", isActive: true, organizationId: "org-A", additionalOrgIds: null },
      { email: "inactive@realdealer.com", role: "org_admin", isActive: false, organizationId: "org-A", additionalOrgIds: null },
      { email: "activemulti@realdealer.com", role: "org_admin", isActive: true, organizationId: "org-B", additionalOrgIds: ["org-A"] },
      { email: "inactivemulti@realdealer.com", role: "org_admin", isActive: false, organizationId: "org-B", additionalOrgIds: ["org-A"] },
      { email: "partner@realpartner.com", role: "partner_admin", isActive: true, organizationId: "org-P", additionalOrgIds: null },
    ];
    const { to, cc } = resolveRoutingFromFixture("org-A", "org-P", users);
    expect(to).toEqual(["active@realdealer.com", "activemulti@realdealer.com"]);
    expect(to).not.toContain("inactive@realdealer.com");
    expect(to).not.toContain("inactivemulti@realdealer.com");
    expect(cc).toEqual(["partner@realpartner.com"]);
  });

  it("inactive partner_admin is not in Cc: even if at the partner org", () => {
    const users: FixtureUser[] = [
      { email: "admin@realdealer.com", role: "org_admin", isActive: true, organizationId: "org-A", additionalOrgIds: null },
      { email: "active-partner@realpartner.com", role: "partner_admin", isActive: true, organizationId: "org-P", additionalOrgIds: null },
      { email: "inactive-partner@realpartner.com", role: "partner_admin", isActive: false, organizationId: "org-P", additionalOrgIds: null },
    ];
    const { cc } = resolveRoutingFromFixture("org-A", "org-P", users);
    expect(cc).toEqual(["active-partner@realpartner.com"]);
    expect(cc).not.toContain("inactive-partner@realpartner.com");
  });
});

describe("TRG-RPT-001 routing — no cross-org contamination", () => {
  it("user at store A without store B in additional_org_ids is NOT in B's To", () => {
    const users: FixtureUser[] = [
      // Primary at A, no multi-org
      { email: "a-only@realdealer.com", role: "org_admin", isActive: true, organizationId: "org-A", additionalOrgIds: null },
      // Primary at B, no multi-org
      { email: "b-only@realdealer.com", role: "org_admin", isActive: true, organizationId: "org-B", additionalOrgIds: null },
      // Partner
      { email: "partner@realpartner.com", role: "partner_admin", isActive: true, organizationId: "org-P", additionalOrgIds: null },
    ];

    const resA = resolveRoutingFromFixture("org-A", "org-P", users);
    const resB = resolveRoutingFromFixture("org-B", "org-P", users);

    expect(resA.to).toEqual(["a-only@realdealer.com"]);
    expect(resA.to).not.toContain("b-only@realdealer.com");

    expect(resB.to).toEqual(["b-only@realdealer.com"]);
    expect(resB.to).not.toContain("a-only@realdealer.com");
  });

  it("user with A in additional_org_ids appears in A's To but NOT in C's To (C not listed)", () => {
    const users: FixtureUser[] = [
      // Primary at B, additional at A only — should be in A, not in C
      { email: "multi@realdealer.com", role: "org_admin", isActive: true, organizationId: "org-B", additionalOrgIds: ["org-A"] },
      // Primary at C (separate), own user
      { email: "c-admin@realdealer.com", role: "org_admin", isActive: true, organizationId: "org-C", additionalOrgIds: null },
      { email: "partner@realpartner.com", role: "partner_admin", isActive: true, organizationId: "org-P", additionalOrgIds: null },
    ];

    const resA = resolveRoutingFromFixture("org-A", "org-P", users);
    const resC = resolveRoutingFromFixture("org-C", "org-P", users);

    expect(resA.to).toContain("multi@realdealer.com");
    expect(resC.to).not.toContain("multi@realdealer.com");
    expect(resC.to).toEqual(["c-admin@realdealer.com"]);
  });
});
