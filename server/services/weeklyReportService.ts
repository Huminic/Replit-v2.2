/**
 * Weekly Executive Report Service — TRG-RPT-001 (Phase D, revision 6)
 *
 * Pure data → validation → render pipeline. No side effects here.
 * Side effects (email send) live in notificationService.sendWeeklyReportEmail.
 *
 * Revision 6 changes (operator v6 directive, 2026-04-20 evening):
 *   - Store name becomes PRIMARY in the hero (large, bold). The phrase
 *     "AI Dealership Performance Analysis" demotes to SECONDARY under it.
 *   - CONFIDENTIAL badge on the eyebrow row, right-justified, pale yellow
 *     `#fbbf24`. Implemented as a 2-column <table> inside the eyebrow row.
 *   - DRAFT banner ABOVE the shell (outside .shell), centered, muted gray
 *     `#b5bcc9`, exact text:
 *     `D R A F T  -  R E P O R T  -    T R A I N I N G  I N  P R O G R E S S`
 *   - Customer Follow-Up zone layout:
 *       left col  — Ghosted Leads (full height)
 *       right col top — Stalled After 1 Reply
 *       right col bot — Needs Attention vs Last Week (STACKED)
 *   - Lead Source Performance zone: Biggest Losers Top 5 REPLACES the old
 *     Needs Attention card (same query, top 5 drops, blue styling).
 *   - Stalled redefined (data query locked):
 *       convCount === 1 for (org + phone)
 *       AND last_message_at (fallback created_at) ∈ [now-7d, now-48h]
 *       AND passes +1555 test-phone filter
 *       AND non-empty customer name
 *     (No vin_created_at ∈ week filter — stalled cares about last touch only.)
 *   - Test-phone filter: drop phones matching /^\+?1?555\d{7}$/ from stalled,
 *     ghosted, and status-breakdown row counts. Count surfaced as a warning.
 *   - New Lead Status Breakdown section (after AI Actions):
 *       featured: LOST_BAD_LEAD count this week + WoW delta, blue number
 *       chip row: ACTIVE / SOLD / LOST / BAD / COMPLETE (prefix match on
 *         `vinStatus`; COMPLETE := `%COMPLETED%` or = 'COMPLETE').
 *     Filter is vinUpdatedAt ∈ week, with test-phone filter applied.
 *   - Narratives rewrite:
 *       "What This Week Says" mentions LOST_BAD_LEAD (if > 0) + new stalled
 *         definition + ghosted + over48h. ≤5 short paragraphs, ≤220 words,
 *         6th-grade reading level.
 *       "What Moved" mentions Winners + Biggest Losers (top 5).
 *   - Classifier (server/statusClassifier.ts) is OUT of scope — operator
 *     directed Option D. BL-103 stays open for a future dedicated sprint.
 *     Lead Status Breakdown does not call the classifier.
 *
 * Revision 5 changes (operator v5 dashboard redesign, 2026-04-21):
 *
 * Contract:
 *   getPrimaryAgentName(orgId) → string
 *   buildWeeklyReport(orgId, weekStart, weekEnd) → { data, warnings }
 *   validateWeeklyReport(report) → { ok, failures }
 *   renderWeeklyReportHtml(report) → string
 *   generateAiNarrative(report) → string (best-effort; falls back to placeholder)
 *
 * Revision 5 changes (operator v5 dashboard redesign, 2026-04-21):
 *   - Hero shrunk to title + store + attribution only. KPIs moved OUT of
 *     the gradient onto a white body.
 *   - KPI dashboard: score card (38% / 316px) + 2x2 mini-tile grid
 *     (62% / 146px each). White bg, 2px purple border, arrow + number
 *     side-by-side. Arrows gray #6b7280; numbers colored by type.
 *   - Per-KPI arrows — every tile now compares this week vs prior week.
 *     Arrow glyph is ↑ / ↓ / → (gray). Number color: black for neutral
 *     (leads/ghosted/inbound/triggers-zero), blue for attention-needed
 *     (over48h, stalled, source-loser deltas), green for wins
 *     (source-winner deltas).
 *   - Lead sources SPLIT into Winners (green-header) and Needs Attention
 *     (blue-header), side-by-side. Shows |delta| + "vs +N/-N" context.
 *   - Customer lists RETURN: Ghosted Leads (left) and Stalled After 1 Reply
 *     (right). Real names + formatted phones (XXX) XXX-XXXX + age labels
 *     ("Nh old" <72h, "Nd old" otherwise; "Nh idle" <24h, "Nd idle"
 *     otherwise). Vehicle dropped from these rows per mockup.
 *   - Short narratives: "What This Week Says" (3 chunks, ≤120 words) and
 *     "What Moved" (1 paragraph, ≤60 words). Plus rule-based bullet cards
 *     "Simple Read" and "Quick Read on AI Activity" (3 bullets each).
 *   - Pill-style section dividers (lavender pill on white body).
 *   - Phone formatter `formatUsPhone()` returns (XXX) XXX-XXXX for
 *     10-digit US numbers, or "••• N" for anything shorter — never a raw
 *     E.164 value, never undefined.
 *   - Validator additions: phone pattern, age-label pattern, arrow glyph
 *     allow-list, winners-have-positive-delta, needs-attention-have-
 *     negative-delta, narrative sentence-average, short-line jargon checks.
 *
 * Revision 4 changes (operator v4 dashboard redesign, 2026-04-20 evening):
 *   - Dashboard-first layout. Key KPIs moved INSIDE the hero gradient block.
 *     Big score card on the left; 2×2 mini-grid on the right.
 *   - New metric `over48h` — subset of ghosted where ageHours >= 48h AND still
 *     within the week window. Exposed on the data object and validated.
 *   - New metric `adfDeliveries` — distinct chip, counted from outbound_log
 *     (messageContent LIKE '%[adf:%'). Notifications = notifications table.
 *   - New metric `automationTriggers` — chip from activity_log (action LIKE
 *     'trigger_%_sent'). Expected 0 for now; displayed honestly.
 *   - Unified `fastestActionList` — replaces the separate ghosted + stalled
 *     card UI. One list, oldest ghosted first, then stalled by days-idle desc.
 *     Capped at 8 rows; more → "+N more not shown".
 *   - Name resolver: warehouse name → conversation name (excluding "AI Lead")
 *     → "Caller ••• {last4}" → "Inbound caller". NEVER renders "AI Lead".
 *   - Score card main-issue + what-to-do-first one-liners, rule-based from
 *     the data. ≤90 chars each, banned jargon blocked.
 *   - Narrative rewritten to 6th-grade level: 4-5 short paragraphs, ~150-220
 *     words, direct second-person, short sentences. Validator enforces.
 *   - Email-safe translation of operator's v4 mockup: table-based layout for
 *     the hero dashboard, no CSS Grid, no backdrop-filter, no CSS variables
 *     in the final HTML, inline styles, gradient with bgcolor fallback.
 *
 * Revision 3 changes (operator v2-review flags, 2026-04-20 late-day):
 *   - Lead source resolution: fixed field-name mismatch. vin_get_lead_sources
 *     returns `{leadSourceId, leadSourceName, href}` — v2 was reading `id`/`name`
 *     which never matched, so every source fell back to "VIN Source #N".
 *   - New `sourceResolutionFailed` flag on the data object. Validator allows
 *     full "VIN Source #N" fallback only when this flag is set (MCP outage).
 *     Otherwise >30% fallback rows is a hard validation fail.
 *   - Vehicle display: if vehicleOfInterest starts with http(s):// (common
 *     today per schema audit — no year/make/model cols exist), show
 *     "Vehicle not specified" instead of the raw URL. Backlog: sync-time
 *     year/make/model extraction.
 *   - Priorities rewritten in plain English, second-person voice. No jargon
 *     ("follow up" / "outreach" / "ghosted" / "recipients" / "workflow" all
 *     banned by the validator).
 *   - Nameless-ghosted visibility: we still drop them (validator requires a
 *     name) but the renderer now shows a footer note "+N additional leads
 *     have no customer name on file" under the ghosted card when N > 0.
 *   - Notifications metric: switched from outbound_log LIKE '[notification:%'
 *     (v2 undercounted — 10 vs 197 for Serra Honda) to the notifications
 *     table directly. That's the authoritative source per operator.
 *   - Layout: outer gradient wraps the full body (lighter tint than the
 *     header band — Gmail-safe compromise). Sales-score card bumped to
 *     64px score font.
 *   - Subject prefix (set by caller): 🚗 instead of 📊.
 *   - Stale-data sentinel: if any ghosted entry has vinCreatedAt older than
 *     the week window, emit a warning. The filter is correct; this catches
 *     upstream VIN-sync defects without silently masking them.
 *
 * Revision 2 changes retained:
 *   - Per-store email
 *   - Ghosted = leads RECEIVED THIS WEEK with no followup + no conversation
 *   - Single Follow-up leads (exactly one convo, nothing since)
 *   - Leads by source with prior-week trend arrows
 *   - getPrimaryAgentName (personaName → sales agent → any agent → org name)
 *   - Operator-voice AI narrative (two paragraphs, sober, numeric)
 *
 * All numbers come from real DB queries. Nothing is invented — if a metric
 * has no data, the builder returns null/empty + a warning.
 */

import { and, eq, gte, lte, lt, isNull, isNotNull, sql, desc, count, inArray } from "drizzle-orm";
import { db } from "../storage";
import {
  warehouseLeads,
  conversations,
  outboundLog,
  activityLog,
  notifications,
  organizations,
  agents,
} from "@shared/schema";
import { callMCP, resolveNexxusOrgId } from "../vendorProxy";

// ---------------------------------------------------------------------------
// Required humble-tone interstitial — EXACT string, checked by the validator.
// Changing this sentence requires updating the test and the validator.
// ---------------------------------------------------------------------------
export const TONE_INTERSTITIAL =
  "I'm an AI assistant that's still learning your store — any feedback sharpens the next report. Reach out to your Nexxus representative anytime.";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UntouchedLead {
  customerName: string | null;
  customerPhone: string | null;
  vehicleOfInterest: string | null;
  leadSource: string | null;
  vinCreatedAt: string; // ISO
  ageHours: number;
}

/**
 * Ghosted (revision 2): lead RECEIVED THIS WEEK with no followup and
 * no conversation. Names are required.
 */
export interface GhostedLead {
  customerName: string; // REQUIRED (validator enforces)
  customerPhone: string | null;
  vehicleOfInterest: string | null;
  vinCreatedAt: string; // ISO
  ageHours: number;
}

/**
 * Single Follow-up: exactly one conversation tied to the phone, that conversation
 * happened in the window, nothing since.
 */
export interface SingleFollowupLead {
  customerName: string; // REQUIRED (validator enforces)
  customerPhone: string | null;
  vehicleOfInterest: string | null;
  lastActivityAt: string; // ISO
  daysSinceLastActivity: number;
  // rev-5: hours granularity so the UI can show "Nh idle" for <24h entries
  hoursSinceLastActivity: number;
}

export interface LeadSourceTrend {
  name: string;
  thisWeek: number;
  priorWeek: number;
  delta: number;           // thisWeek - priorWeek
  direction: "up" | "down" | "flat";
}

export interface WeeklyActivitySummary {
  inboundCalls: number;
  leadsSynced: number;
  adfDelivered: number;
  triggersFired: number;
  notificationsSent: number;
  escalations: number;
}

/**
 * rev-4: Unified fastest-action-list row. Each entry is either a ghosted lead
 * (no contact at all) or a stalled lead (one reply then nothing). The UI
 * shows one clean list instead of two separate cards.
 *
 * `kind` drives the subtext label:
 *   - "ghosted" → "No follow-up yet"
 *   - "stalled" → "One reply, then no next step"
 *
 * `ageLabel` is what the right column shows:
 *   - "166h old" for ghosted <72h
 *   - "7d old" for ghosted >=72h
 *   - "4d idle" for stalled
 *
 * `nameSource` records which resolver path produced the name, for
 * operator-visible stats in the integration test and for validator audit.
 */
export interface FastestActionEntry {
  name: string;            // resolved display name, never "AI Lead"
  nameSource: "warehouse" | "conversation" | "phone_fallback" | "inbound_fallback";
  customerPhone: string | null;
  kind: "ghosted" | "stalled";
  subtext: string;         // "No follow-up yet" / "One reply, then no next step"
  ageLabel: string;        // e.g. "166h old" / "7d old" / "4d idle"
  sortKey: number;         // for ordering; higher = worse/older
}

/**
 * rev-4: Rule-based score card one-liners. Operator spec:
 *   - mainIssueLine: what dragged the score — ≤90 chars, no jargon
 *   - whatToDoFirstLine: the single top action — ≤90 chars, no jargon
 */
export interface ScoreCardLines {
  mainIssueLine: string;
  whatToDoFirstLine: string;
}

/**
 * rev-4: Name-resolver audit counters. How each fastest-action entry got its
 * name. Reported by the integration test for each store.
 */
export interface NameResolverStats {
  warehouse: number;
  conversation: number;
  phoneFallback: number;
  inboundFallback: number;
}

export interface SalesTeamScore {
  score: number; // 0-100
  commentary: string;
  breakdown: Array<{ label: string; delta: number }>;
}

/**
 * rev-5: Arrow direction for a KPI tile. Compares this-week value to prior-week.
 *   - "up"   → this > prior
 *   - "down" → this < prior
 *   - "flat" → equal OR no prior data (renderer shows → arrow)
 * Arrow color is ALWAYS gray #6b7280 in the UI; the colored element is the
 * number below it (see ScoreCardLines / dashboard color rules).
 */
export type ArrowDir = "up" | "down" | "flat";

/**
 * rev-5: Per-KPI arrow map. Every tile in the dashboard gets one.
 * Drives the arrow glyph rendered next to the number.
 */
export interface KpiArrows {
  score: ArrowDir;
  leads: ArrowDir;
  ghosted: ArrowDir;
  over48h: ArrowDir;
  stalled: ArrowDir;
  inboundCalls: ArrowDir;
  notifications: ArrowDir;
  adfDeliveries: ArrowDir;
  automationTriggers: ArrowDir;
}

/**
 * rev-5: Per-KPI prior-week snapshot. Kept for audit / debugging so the
 * integration test can print "arrow direction sanity check" lines.
 */
export interface PriorWeekMetrics {
  leads: number;
  ghosted: number;
  over48h: number;
  stalled: number;
  inboundCalls: number;
  notifications: number;
  adfDeliveries: number;
  automationTriggers: number;
  score: number;
  // rev-6: prior-week LOST_BAD_LEAD count for WoW delta on the featured card
  lostBadLead: number;
}

/**
 * rev-6: Lead Status Breakdown chip row counts (vinUpdatedAt ∈ week,
 * test-phone filter applied, prefix/keyword match on `vinStatus`).
 *   active   = vinStatus LIKE 'ACTIVE_%'
 *   sold     = vinStatus LIKE 'SOLD_%'
 *   lost     = vinStatus LIKE 'LOST_%'  (LOST_BAD_LEAD counted here too —
 *              intentional; see operator directive)
 *   bad      = vinStatus LIKE 'BAD_%' or contains 'DUPLICATE'
 *   complete = vinStatus = 'COMPLETE' or LIKE '%COMPLETED%'
 */
export interface LeadStatusBreakdown {
  active: number;
  sold: number;
  lost: number;
  bad: number;
  complete: number;
}

/**
 * rev-6: Test-phone filter audit counts per list. Surfaced in warnings when
 * any non-zero to keep the operator honest about synthetic data.
 */
export interface TestPhoneFilterStats {
  ghosted: number;
  stalled: number;
  statusBreakdown: number;
  fastestAction: number;
}

export interface WeeklyReportData {
  orgId: string;
  orgName: string;
  weekStart: string;   // ISO
  weekEnd: string;     // ISO
  generatedAt: string; // ISO
  agentName: string;   // e.g. "Caroline"

  // Lead metrics
  leadsReceivedThisWeek: number;
  leadsBySource: LeadSourceTrend[];
  ghostedLeads: GhostedLead[];
  singleFollowupLeads: SingleFollowupLead[];

  // Internal (used for score/priorities; not rendered as its own card)
  untouchedLeads: UntouchedLead[];

  activity: WeeklyActivitySummary;
  priorities: string[];
  salesScore: SalesTeamScore;
  aiNarrative: string | null; // null = not generated
  toneInterstitial: string;   // exact string required

  // rev-3: count of ghosted-eligible leads we had to drop because the VIN
  // warehouse row had no customer_name. Surfaced honestly in the email.
  droppedNamelessGhostedCount: number;

  // rev-3: true when the vin_get_lead_sources MCP call failed or returned
  // empty. When true, the validator permits full "VIN Source #N" fallback
  // (MCP outage shouldn't block the send). When false, >30% fallback rows
  // fails validation — the MCP call succeeded so the names SHOULD resolve.
  sourceResolutionFailed: boolean;

  // rev-4: Dashboard metrics
  over48hCount: number;                   // ghosted subset aged >= 48h
  automationTriggers: number;             // activity_log trigger_%_sent in window
  adfDeliveries: number;                  // outbound_log [adf:...] in window

  // v7: 30-Day Active Leads — rolling 30-day count of leads with
  // vinCreatedAt >= now()-30d AND vinStatus LIKE 'ACTIVE_%'. Renders in the
  // top KPI mini-grid, replacing the old "Stalled After 1 Reply" tile.
  // Snapshot metric — no arrow, no prior-week comparison.
  score30DayActive: number;

  // rev-4: Unified fastest-action list (ghosted first by age, then stalled
  // by days-idle desc). Capped at 8 rows by builder; renderer shows
  // fastestActionMore if the underlying pool was larger.
  fastestActionList: FastestActionEntry[];
  fastestActionMore: number;              // count beyond the 8-row cap

  // rev-4: Score card one-liners (rule-based from data)
  scoreCardLines: ScoreCardLines;

  // rev-4: Name-resolver audit — for integration test reporting only
  nameResolverStats: NameResolverStats;

  // rev-5: Per-KPI arrow directions (this-week vs prior-week).
  kpiArrows: KpiArrows;

  // rev-5: Prior-week metrics snapshot (for debugging + integration-test
  // sanity printing; not rendered on its own).
  priorWeek: PriorWeekMetrics;

  // rev-5: Lead source split (Winners). Winners MUST all have delta > 0;
  // ordered by delta desc. Enforced by the validator.
  // v8: leadsBySourceNeedsAttention removed — the Needs Attention card was
  // deleted from the rendered email. Biggest Losers (below) is the sole
  // "losses" dataset now. Winners + Biggest Losers both derive from
  // leadsBySource but remain distinct arrays with distinct caps.
  leadsBySourceWinners: LeadSourceTrend[];

  // rev-5: Short narratives (rule-based). Separate from the long
  // `aiNarrative` which is preserved for backward compat / L5 reading.
  //   - narrativeWeekSays: 3 chunks joined with "\n\n", each ≤2 sentences,
  //     total ≤120 words, no banned jargon, avg ≤20 words/sentence.
  //   - narrativeWhatMoved: 1 paragraph, ≤60 words, plain prose.
  narrativeWeekSays: string;
  narrativeWhatMoved: string;

  // rev-5: Rule-based bullet cards (3 bullets each).
  //   - simpleReadBullets: paired with the customer lists (ghosted / stalled).
  //   - quickReadBullets: paired with the AI Actions chip row.
  simpleReadBullets: string[];
  quickReadBullets: string[];

  // rev-6: Lead Status Breakdown (featured LOST_BAD_LEAD + 5-type chip row).
  // Filter: vinUpdatedAt ∈ [weekStart, weekEnd]. Test-phone filter applied.
  lostBadLeadCount: number;                 // featured metric (LOST_BAD_LEAD only)
  lostBadLeadPriorWeek: number;             // WoW comparison base
  leadStatusBreakdown: LeadStatusBreakdown; // 5-type chip counts

  // rev-6: Biggest Losers — top 5 source deltas with negative delta.
  // Sort by |delta| desc. Replaces Needs Attention in the Source Performance
  // zone; Needs Attention keeps its old definition but is RELOCATED to the
  // Customer Follow-Up zone (right column, stacked under Stalled).
  leadsBySourceBiggestLosers: LeadSourceTrend[];

  // rev-6: Test-phone filter drop counts (per list).
  testPhoneFilterStats: TestPhoneFilterStats;

  // TRG-RPT-001 hotfix (2026-04-21): true when buildWeeklyReport was called
  // with the opt-in salesOnlyLeadIds filter. Renderer uses this to switch
  // the "Leads This Week" tile label to "Sales leads". Optional for
  // backward compat — undefined is treated as false.
  salesFilterActive?: boolean;
}

export interface BuildReportResult {
  data: WeeklyReportData;
  warnings: string[];
}

/**
 * TRG-RPT-001 hotfix (2026-04-21): opt-in sales-only filter.
 *
 * The warehouse_leads table has no lead_type column — only VIN Solutions has
 * the sales-vs-service distinction. Until BL-107 adds lead_type to the
 * warehouse + sync extension, callers can pass a pre-computed Set of
 * warehouse source_id values that were classified as "sales" (INTERNET /
 * PHONE / WALK_IN / REFERRAL) via a live VIN API classification pass.
 *
 * When `salesOnlyLeadIds` is undefined, buildWeeklyReport's behavior is
 * unchanged (counts include service + parts leads as before).
 *
 * When `salesOnlyLeadIds` is a Set:
 *   - current-week lead lists are filtered to rows whose source_id is in the set
 *   - count queries that read lead-level current-week data are filtered too
 *   - the rendered "Leads This Week" tile re-labels to "Sales leads"
 *   - prior-week data is NOT filtered (we don't have last week's VIN
 *     classification; trend arrows still compare against raw prior-week
 *     warehouse data — acceptable for the one-off regeneration)
 */
export interface BuildReportOptions {
  salesOnlyLeadIds?: Set<string>;
}

/**
 * Sales-only filter mode flag added to WeeklyReportData. Renderer uses it to
 * switch labels. Validator does not enforce anything around it.
 */
function isSalesFilterActive(opts: BuildReportOptions | undefined): boolean {
  return !!(opts && opts.salesOnlyLeadIds && opts.salesOnlyLeadIds.size >= 0);
}

export interface ValidationResult {
  ok: boolean;
  failures: string[];
}

// ---------------------------------------------------------------------------
// Helpers — phone normalization (matches storage.getConversationByPhone)
// ---------------------------------------------------------------------------

function normalizePhone(phone: string): string[] {
  const normalizedPhone = phone.replace(/[^0-9+]/g, "");
  const digitsOnly = normalizedPhone.replace(/\+/g, "");
  const without1 =
    digitsOnly.startsWith("1") && digitsOnly.length === 11
      ? digitsOnly.substring(1)
      : digitsOnly;
  const with1 = digitsOnly.length === 10 ? "1" + digitsOnly : digitsOnly;
  return Array.from(new Set([normalizedPhone, digitsOnly, without1, with1, "+" + with1]));
}

function hoursBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60));
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Agent-name resolver
//
// Authoritative source: organizations.personaName (set per-dealer in seed).
// Fallback: first active sales agent at the org (agents table).
// Final fallback: org.name.
// ---------------------------------------------------------------------------

export async function getPrimaryAgentName(orgId: string): Promise<string> {
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
  if (!org) throw new Error(`Organization not found: ${orgId}`);

  if (org.personaName && org.personaName.trim().length > 0 && org.personaName !== "Serra") {
    return org.personaName;
  }

  // Fallback: first active sales agent
  const salesAgents = await db
    .select({ name: agents.name })
    .from(agents)
    .where(
      and(
        eq(agents.organizationId, orgId),
        eq(agents.department, "sales"),
        eq(agents.status, "active"),
      ),
    );
  if (salesAgents.length > 0 && salesAgents[0].name) return salesAgents[0].name;

  // Fallback: any active agent
  const anyAgent = await db
    .select({ name: agents.name })
    .from(agents)
    .where(and(eq(agents.organizationId, orgId), eq(agents.status, "active")));
  if (anyAgent.length > 0 && anyAgent[0].name) return anyAgent[0].name;

  // Final fallback — org name as a last resort (validator will still pass
  // because it's non-empty). Caller should check warnings.
  return org.name;
}

// ---------------------------------------------------------------------------
// Lead-source URL → name resolver (mirrors insights.ts:formatLeadSource)
//
// Builds a per-org ID→name map using central-mcp vin_get_lead_sources. The
// live response shape (verified 2026-04-20 against mcp.huminicdev.com) is:
//   { count: N, items: [ { leadSourceId, leadSourceName, href } ] }
// v2 read `src.id` / `src.name` which never matched — so the map was always
// empty and every source fell back to "VIN Source #N". That's the bug fixed
// here. We keep an OR-chain for safety in case the shape is ever extended.
//
// Returns `{ map, failed }`. `failed` is true when the MCP call threw OR
// returned zero usable entries — the validator uses that to permit full
// fallback rendering without blocking the send on an MCP outage.
// ---------------------------------------------------------------------------

async function buildLeadSourceMap(
  orgId: string,
): Promise<{ map: Map<string, string>; failed: boolean }> {
  const map = new Map<string, string>();
  try {
    const nexxusOrgId = resolveNexxusOrgId(orgId);
    const data = await callMCP("vin_get_lead_sources", { orgId: nexxusOrgId });
    const sources = Array.isArray(data) ? data : (data?.items || data?.leadSources || []);
    for (const src of sources) {
      // Authoritative field names: leadSourceId / leadSourceName.
      // OR-chain keeps backward compatibility if the MCP schema ever widens.
      const id = String(src.leadSourceId || src.id || src.sourceId || "");
      const name = src.leadSourceName || src.name || src.description || "";
      if (id && name) map.set(id, name);
    }
    if (map.size === 0) {
      console.log(`[weeklyReport] vin_get_lead_sources returned zero usable entries for org ${orgId} — sourceResolutionFailed=true`);
      return { map, failed: true };
    }
    return { map, failed: false };
  } catch (err) {
    console.log(`[weeklyReport] Failed to fetch lead source mapping for org ${orgId}: ${(err as Error).message}`);
    return { map, failed: true };
  }
}

/**
 * Format a raw leadSource value for display.
 * Returns `{ display, fellBack }` so the caller can count fallback rows
 * and trip the validator when > 30% of sources couldn't be resolved.
 */
function formatLeadSource(
  raw: string | null | undefined,
  sourceMap: Map<string, string>,
): { display: string; fellBack: boolean } {
  if (!raw) return { display: "Unknown", fellBack: false };
  const vinMatch = raw.match(/\/leadsources\/id\/(\d+)/i);
  if (vinMatch) {
    const id = vinMatch[1];
    const resolved = sourceMap.get(id);
    if (resolved) return { display: resolved, fellBack: false };
    return { display: `VIN Source #${id}`, fellBack: true };
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      return { display: new URL(raw).hostname, fellBack: false };
    } catch {
      return { display: raw, fellBack: false };
    }
  }
  return { display: raw, fellBack: false };
}

/**
 * Vehicle display sanitizer — rev-3.
 *
 * warehouse_leads schema has no year/make/model columns (audited 2026-04-20).
 * In practice VIN returns `vehicleOfInterest` as a URL like
 *   https://api.vinsolutions.com/vehicles/interest/id/2003358163-0
 * which is useless to a dealer manager reading the email. Until we backfill
 * real year/make/model at sync time (backlogged), we show "Vehicle not
 * specified" instead of the URL. Non-URL values pass through unchanged.
 */
export function formatVehicle(raw: string | null | undefined): string {
  if (!raw) return "Vehicle not specified";
  const s = String(raw).trim();
  if (!s) return "Vehicle not specified";
  if (/^https?:\/\//i.test(s)) return "Vehicle not specified";
  // Sync fallback string — treat as no data
  if (s.toLowerCase() === "no data") return "Vehicle not specified";
  return s;
}

// ---------------------------------------------------------------------------
// rev-4: name-resolver — NEVER renders "AI Lead"
//
// Operator spec: "No generic 'AI Lead' if actual names are available."
//   1. warehouse_leads.customer_name (non-empty, not "AI Lead")
//   2. conversations.customer_name (lookup by phone variants, non-empty,
//      not "AI Lead")
//   3. "Caller ••• {last4}" — where last4 is the trailing 4 digits of phone
//   4. "Inbound caller" — last resort (no phone)
//
// Returns `{ name, source }`. Source is audited in NameResolverStats.
// ---------------------------------------------------------------------------

function isUsableCustomerName(name: string | null | undefined): boolean {
  if (!name || typeof name !== "string") return false;
  const trimmed = name.trim();
  if (trimmed.length === 0) return false;
  // "AI Lead" (any capitalisation, or with leading content like "AI Lead Phone X")
  // is explicitly banned by the operator. Treat exact match OR leading token
  // match as unusable.
  const lower = trimmed.toLowerCase();
  if (lower === "ai lead") return false;
  if (lower.startsWith("ai lead ")) return false;
  if (lower.startsWith("ai lead—") || lower.startsWith("ai lead-")) return false;
  return true;
}

function lastFourOfPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length < 4) return null;
  return digits.slice(-4);
}

export function resolveDisplayName(
  warehouseName: string | null | undefined,
  conversationName: string | null | undefined,
  phone: string | null | undefined,
): { name: string; source: FastestActionEntry["nameSource"] } {
  if (isUsableCustomerName(warehouseName)) {
    return { name: String(warehouseName).trim(), source: "warehouse" };
  }
  if (isUsableCustomerName(conversationName)) {
    return { name: String(conversationName).trim(), source: "conversation" };
  }
  const l4 = lastFourOfPhone(phone);
  if (l4) {
    return { name: `Caller \u2022\u2022\u2022 ${l4}`, source: "phone_fallback" };
  }
  return { name: "Inbound caller", source: "inbound_fallback" };
}

/**
 * rev-4: format ageHours into the short label the UI shows on the right of
 * each fastest-action row.
 *   - ghosted + <72h: "Nh old"  (where N = hours)
 *   - ghosted + >=72h: "Dd old" (where D = days)
 *   - stalled: "Dd idle"        (computed by caller)
 */
function ghostedAgeLabel(ageHours: number): string {
  if (ageHours >= 72) {
    const days = Math.floor(ageHours / 24);
    return `${days}d old`;
  }
  return `${Math.max(0, Math.round(ageHours))}h old`;
}

/**
 * rev-5: stalled age label.
 *   - < 24h → "Nh idle" (rounded int hours, min 0)
 *   - ≥ 24h → "Nd idle" (floor(hours/24))
 */
function stalledAgeLabel(hoursIdle: number): string {
  if (hoursIdle >= 24) {
    const days = Math.floor(hoursIdle / 24);
    return `${days}d idle`;
  }
  return `${Math.max(0, Math.round(hoursIdle))}h idle`;
}

/**
 * rev-5: US phone number formatter.
 *
 * Input: anything (E.164 "+15551234567", digits "5551234567", or formatted).
 * Output:
 *   - 10 digits after normalisation (stripping "+1" / leading "1") →
 *     "(XXX) XXX-XXXX"
 *   - < 10 digits → "••• {last N digits}" masking (min 2, max 4)
 *   - empty / null → "(no phone)"
 *
 * Never displays raw E.164 / raw digits. Validator enforces the output
 * matches /^(\(\d{3}\) \d{3}-\d{4}|••• \d+)$/ or "(no phone)".
 */
export function formatUsPhone(raw: string | null | undefined): string {
  if (!raw) return "(no phone)";
  const s = String(raw).trim();
  if (!s) return "(no phone)";
  let digits = s.replace(/\D/g, "");
  // Strip leading country code "1" when the number is 11 digits
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  // < 10 digits → mask with last-N
  if (digits.length >= 2) {
    const last = digits.slice(-Math.min(4, digits.length));
    return `\u2022\u2022\u2022 ${last}`;
  }
  return "(no phone)";
}

// ---------------------------------------------------------------------------
// rev-6: Test-phone filter
//
// Per operator directive: drop phones matching /^\+?1?555\d{7}$/ from the
// ghosted, stalled, and status-breakdown row counts. This blocks the entire
// NANP 555 reserved range (555-0100..555-0199) PLUS seed/synthetic phones
// like +15557654321 from leaking into customer-visible lists.
//
// `isTestPhone()` returns true when the normalized digits-only representation
// matches the pattern. We strip leading + and country code 1 before testing
// so we catch both +1555... and raw 555... forms.
// ---------------------------------------------------------------------------

const TEST_PHONE_PATTERN = /^\+?1?555\d{7}$/;

export function isTestPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const s = String(phone).trim();
  if (!s) return false;
  // Pattern matches the raw operator-specified form; also try the
  // digits-only canonical form for phones that arrive as "5551234567" etc.
  if (TEST_PHONE_PATTERN.test(s)) return true;
  const digits = s.replace(/\D/g, "");
  // A bare 10-digit "555XXXXXXX" or 11-digit "1555XXXXXXX"
  if (digits.length === 10 && digits.startsWith("555")) return true;
  if (digits.length === 11 && digits.startsWith("1555")) return true;
  return false;
}

// ---------------------------------------------------------------------------
// rev-6: DRAFT banner
//
// Exact text (letter-spaced by the operator). Note the two-space gap after
// the hyphen around REPORT, and the four-space gap before TRAINING.
// Color per operator approval: #b5bcc9 (muted gray, reads as watermark on
// the #f3f6ff lavender page background).
// ---------------------------------------------------------------------------
export const DRAFT_BANNER_TEXT =
  "D R A F T  -  R E P O R T  -    T R A I N I N G  I N  P R O G R E S S";
export const DRAFT_BANNER_COLOR = "#b5bcc9";

// rev-6: CONFIDENTIAL badge — pale yellow, matches the pale-yellow operator
// spec. Letter-spacing mirrors the eyebrow's ~1.3px.
export const CONFIDENTIAL_BADGE_TEXT = "CONFIDENTIAL";
export const CONFIDENTIAL_BADGE_COLOR = "#fbbf24";

// rev-6: Lead Status classification helpers. DOES NOT call
// server/statusClassifier.ts (which is out of scope per operator Option D).
// This is a local, prefix-based categorization used only for the Lead Status
// Breakdown chip row in the weekly report.
export type LeadStatusBucket = "active" | "sold" | "lost" | "bad" | "complete" | null;

export function classifyForStatusBreakdown(status: string | null | undefined): LeadStatusBucket {
  if (!status || typeof status !== "string") return null;
  const s = status.trim().toUpperCase();
  if (!s) return null;
  // COMPLETE must be checked before LOST_ prefix match because
  // "LOST_LEAD_PROCESS_COMPLETED" ends in COMPLETED; operator intent per
  // directive is that COMPLETE is its own bucket. But LOST_LEAD_PROCESS_COMPLETED
  // ALSO starts with LOST_ — the operator's note in the v6 directive is
  // explicit that LOST variants stay in LOST. So we only count "COMPLETE"
  // (exact) as the COMPLETE bucket here. Any "*COMPLETED" that also starts
  // with ACTIVE_/SOLD_/LOST_/BAD_ stays in that family.
  if (s === "COMPLETE" || s === "COMPLETED") return "complete";
  if (s.startsWith("ACTIVE_") || s === "ACTIVE") return "active";
  if (s.startsWith("SOLD_") || s === "SOLD") return "sold";
  if (s.startsWith("LOST_") || s === "LOST") return "lost";
  if (s.startsWith("BAD_") || s === "BAD" || s.includes("DUPLICATE")) return "bad";
  return null;
}

/**
 * rev-5: Compute an arrow direction given a this-week value and an optional
 * prior-week value. Rules per spec:
 *   this > prior            → "up"
 *   this < prior            → "down"
 *   equal OR no prior data  → "flat"
 *
 * `priorWeek` is expected to be a finite non-negative integer. Null / NaN
 * is treated as "no prior data" → "flat".
 */
export function computeArrowDir(thisWeek: number, priorWeek: number | null | undefined): ArrowDir {
  if (priorWeek == null || !Number.isFinite(priorWeek)) return "flat";
  if (thisWeek > priorWeek) return "up";
  if (thisWeek < priorWeek) return "down";
  return "flat";
}

// ---------------------------------------------------------------------------
// buildWeeklyReport — pulls real data from DB
// ---------------------------------------------------------------------------

export async function buildWeeklyReport(
  orgId: string,
  weekStart: Date,
  weekEnd: Date,
  opts: BuildReportOptions = {},
): Promise<BuildReportResult> {
  const warnings: string[] = [];
  const salesFilterActive = !!opts.salesOnlyLeadIds;
  const salesIds = opts.salesOnlyLeadIds || null;

  // 1. Resolve org name + agent name
  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
  if (!org) {
    throw new Error(`Organization not found: ${orgId}`);
  }
  const agentName = await getPrimaryAgentName(orgId);

  // 2. Leads created in window (non-null vin_created_at only — null is a VIN defect per Q3)
  const leadsInWindowRaw = await db
    .select()
    .from(warehouseLeads)
    .where(
      and(
        eq(warehouseLeads.organizationId, orgId),
        isNotNull(warehouseLeads.vinCreatedAt),
        gte(warehouseLeads.vinCreatedAt, weekStart),
        lte(warehouseLeads.vinCreatedAt, weekEnd),
      ),
    );
  // TRG-RPT-001 hotfix: opt-in sales-only filter. Applied in-memory to keep
  // the query shape stable across both code paths. sourceId is the VIN leadId
  // (verified 2026-04-21 by comparing warehouse_leads.source_id to VIN
  // items[].leadId for all 5 dealerships).
  const leadsInWindow = salesIds
    ? leadsInWindowRaw.filter((l) => l.sourceId != null && salesIds.has(String(l.sourceId)))
    : leadsInWindowRaw;
  if (salesFilterActive) {
    const filteredOut = leadsInWindowRaw.length - leadsInWindow.length;
    warnings.push(
      `Sales-only filter applied: ${filteredOut} of ${leadsInWindowRaw.length} warehouse leads excluded (non-sales lead types per VIN API).`,
    );
  }

  // Count nulls for transparency
  const [{ nullCount }] = await db
    .select({ nullCount: sql<number>`COUNT(*)::int` })
    .from(warehouseLeads)
    .where(
      and(
        eq(warehouseLeads.organizationId, orgId),
        isNull(warehouseLeads.vinCreatedAt),
        gte(warehouseLeads.syncedAt, weekStart),
        lte(warehouseLeads.syncedAt, weekEnd),
      ),
    );
  if (Number(nullCount) > 0) {
    warnings.push(
      `${nullCount} leads synced this week have null vin_created_at and were skipped (VIN defect — surface, don't paper over).`,
    );
  }

  // 3. Pull conversations for any phone seen in this week's leads
  const leadsWithPhone = leadsInWindow.filter(
    (l) => l.customerPhone && l.customerPhone.trim().length > 0,
  );
  const phonesAll = leadsWithPhone
    .map((l) => l.customerPhone as string)
    .filter(Boolean);

  let convosForPhones: Array<{ customerPhone: string | null; customerName: string | null; createdAt: Date | null; lastMessageAt: Date | null }> = [];
  if (phonesAll.length > 0) {
    const phoneVariants = new Set<string>();
    for (const p of phonesAll) normalizePhone(p).forEach((v) => phoneVariants.add(v));
    const variantArr = Array.from(phoneVariants).filter((v) => v.length > 0);

    if (variantArr.length > 0) {
      convosForPhones = await db
        .select({
          customerPhone: conversations.customerPhone,
          // rev-4: pull conversation customerName so the name-resolver can
          // use it as the second-choice path when warehouse_leads has no name.
          customerName: conversations.customerName,
          createdAt: conversations.createdAt,
          lastMessageAt: conversations.lastMessageAt,
        })
        .from(conversations)
        .where(
          and(
            eq(conversations.organizationId, orgId),
            inArray(conversations.customerPhone, variantArr),
          ),
        );
    }
  }

  // rev-4: Build phone → conversation-name map for the name-resolver.
  // Normalize phone variants so lookups match whatever form the lead has.
  const convoNameByPhoneVariant = new Map<string, string>();
  for (const c of convosForPhones) {
    if (!c.customerPhone || !c.customerName) continue;
    const trimmed = c.customerName.trim();
    if (!trimmed) continue;
    const variants = normalizePhone(c.customerPhone);
    for (const v of variants) {
      // First-seen wins — conversations is append-only so this is stable enough
      if (!convoNameByPhoneVariant.has(v)) convoNameByPhoneVariant.set(v, trimmed);
    }
  }

  function lookupConvoName(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const variants = normalizePhone(phone);
    for (const v of variants) {
      const hit = convoNameByPhoneVariant.get(v);
      if (hit) return hit;
    }
    return null;
  }

  // Build a set of phone variants that have any conversation
  const phonesWithConvo = new Set<string>();
  for (const c of convosForPhones) {
    if (c.customerPhone) phonesWithConvo.add(c.customerPhone);
  }

  function leadHasConvo(leadPhone: string): boolean {
    const variants = normalizePhone(leadPhone);
    return variants.some((v) => phonesWithConvo.has(v));
  }

  const now = new Date();

  // Untouched = leads received this week with no convo + no followup (internal; used
  // for score + priorities + narrative summary)
  const untouchedLeads: UntouchedLead[] = leadsWithPhone
    .filter((l) => !l.followupSentAt && !leadHasConvo(l.customerPhone as string))
    .map((l) => ({
      customerName: l.customerName,
      customerPhone: l.customerPhone,
      vehicleOfInterest: l.vehicleOfInterest,
      leadSource: l.leadSource,
      vinCreatedAt: (l.vinCreatedAt as Date).toISOString(),
      ageHours: hoursBetween(now, l.vinCreatedAt as Date),
    }))
    .sort((a, b) => b.ageHours - a.ageHours);

  // 4. Ghosted (redefined): received this week, no followup, no conversation.
  //
  //    Week-scoping NOTE (rev-3): `leadsWithPhone` derives from `leadsInWindow`,
  //    which is already filtered to `vinCreatedAt ∈ [weekStart, weekEnd]` (see
  //    step 2 above). So the ghosted list is, by construction, week-scoped.
  //    Verified 2026-04-20 with a direct SQL query against warehouse_leads
  //    across all 5 dealerships: oldest vinCreatedAt in the 7-day window
  //    matched exactly weekStart. The v2 "156d old" screenshots either came
  //    from a stale build OR were a units confusion (ageHours rendered as "Xh
  //    old"). We do NOT add a redundant filter here — that would mask upstream
  //    data defects. Instead, if any ghosted entry somehow slips through with
  //    a vinCreatedAt older than weekStart, we emit a warning.
  //
  //    Names are required — leads with null/empty names are dropped (validator
  //    requires a name). Count is exposed in `data.droppedNamelessGhostedCount`
  //    and the renderer shows a footer note "+N additional leads have no name"
  //    so the operator sees the gap honestly.
  const ghostedRaw = leadsWithPhone.filter(
    (l) => !l.followupSentAt && !leadHasConvo(l.customerPhone as string),
  );
  const ghostedLeads: GhostedLead[] = [];
  let droppedGhostedNameless = 0;
  let ghostedTestPhonesFiltered = 0; // rev-6
  let staleGhostedDetected = 0;
  for (const l of ghostedRaw) {
    // rev-6: Test-phone filter — drop synthetic +1555XXXXXXX rows from
    // customer-visible lists. Audit count surfaced as a warning later.
    if (isTestPhone(l.customerPhone)) {
      ghostedTestPhonesFiltered += 1;
      continue;
    }
    const name = (l.customerName || "").trim();
    if (!name) {
      droppedGhostedNameless += 1;
      continue;
    }
    const vinCreated = l.vinCreatedAt as Date;
    if (vinCreated < weekStart) {
      // Belt-and-suspenders: shouldn't happen (leadsInWindow is week-scoped)
      // but if it does, surface it instead of silently shipping stale data.
      staleGhostedDetected += 1;
    }
    ghostedLeads.push({
      customerName: name,
      customerPhone: l.customerPhone,
      // rev-3: sanitize at build time so validator + render see the same
      // clean string. Raw VIN API URLs become "Vehicle not specified".
      vehicleOfInterest: formatVehicle(l.vehicleOfInterest),
      vinCreatedAt: vinCreated.toISOString(),
      ageHours: hoursBetween(now, vinCreated),
    });
  }
  ghostedLeads.sort((a, b) => b.ageHours - a.ageHours);
  if (droppedGhostedNameless > 0) {
    warnings.push(
      `${droppedGhostedNameless} ghosted-candidate lead${droppedGhostedNameless === 1 ? " was" : "s were"} dropped from the report because the customer name is missing in warehouse_leads.`,
    );
  }
  if (staleGhostedDetected > 0) {
    warnings.push(
      `Detected ${staleGhostedDetected} lead${staleGhostedDetected === 1 ? "" : "s"} in the ghosted list with vinCreatedAt before the week window — possible VIN sync defect. Filter is correct; data may be mis-stamped.`,
    );
  }

  // 5. Stalled (rev-6 locked definition) —
  //    Count conversations for (org + phone). A phone is "stalled" when:
  //      - total conversation count === 1 (one conversation ever for this phone in this org)
  //      - that conversation's last_message_at (fallback created_at) ∈ [now-7d, now-48h]
  //      - phone passes the +1555 test-phone filter
  //      - customer name is non-empty (warehouse name preferred, conversation name fallback)
  //
  //    NOTE: no vinCreatedAt ∈ week filter. Stalled cares about when the
  //    last touch happened, not when the lead was created.
  //
  //    Query shape: we pull ALL conversations for this org, group by a
  //    canonical phone key, and apply the filters above.
  const allConvosForOrg = await db
    .select({
      customerPhone: conversations.customerPhone,
      customerName: conversations.customerName,
      createdAt: conversations.createdAt,
      lastMessageAt: conversations.lastMessageAt,
    })
    .from(conversations)
    .where(eq(conversations.organizationId, orgId));

  // Group by canonical phone key: use the digits-only normalized form so
  // "+12125551234" and "2125551234" collapse to the same key.
  function phoneKey(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, "");
    if (!digits) return null;
    // Collapse "1XXXXXXXXXX" to "XXXXXXXXXX" so +1 and no-+1 match
    if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
    return digits;
  }

  interface StalledCandidate {
    count: number;
    lastTouch: Date | null;     // last_message_at (fallback created_at) from the single convo
    originalPhone: string | null; // first-seen phone string (preserve formatting)
    convoName: string | null;    // conversation's customer name (fallback)
  }
  const convoGroupByKey = new Map<string, StalledCandidate>();
  for (const c of allConvosForOrg) {
    const key = phoneKey(c.customerPhone);
    if (!key) continue;
    const last = c.lastMessageAt || c.createdAt;
    const entry = convoGroupByKey.get(key) || {
      count: 0,
      lastTouch: null,
      originalPhone: c.customerPhone,
      convoName: null,
    };
    entry.count += 1;
    if (last && (!entry.lastTouch || last > entry.lastTouch)) {
      entry.lastTouch = last;
    }
    if (!entry.convoName && c.customerName && c.customerName.trim().length > 0) {
      entry.convoName = c.customerName.trim();
    }
    if (!entry.originalPhone) entry.originalPhone = c.customerPhone;
    convoGroupByKey.set(key, entry);
  }

  // Build a warehouse-name-by-phone-key map so stalled rows can resolve
  // a customer name from warehouse_leads. Pulls ALL org leads (not just
  // this-week) because the stalled definition is not vinCreatedAt-scoped.
  const allOrgLeadNames = await db
    .select({
      customerPhone: warehouseLeads.customerPhone,
      customerName: warehouseLeads.customerName,
      vehicleOfInterest: warehouseLeads.vehicleOfInterest,
    })
    .from(warehouseLeads)
    .where(eq(warehouseLeads.organizationId, orgId));

  interface WarehouseNameHit {
    name: string;
    vehicle: string | null;
  }
  const warehouseByKey = new Map<string, WarehouseNameHit>();
  for (const l of allOrgLeadNames) {
    const key = phoneKey(l.customerPhone);
    if (!key) continue;
    const name = (l.customerName || "").trim();
    if (!name) continue;
    // First-seen wins
    if (!warehouseByKey.has(key)) {
      warehouseByKey.set(key, { name, vehicle: l.vehicleOfInterest || null });
    }
  }

  const stalledWindowEnd = new Date(now.getTime() - 48 * 60 * 60 * 1000);     // now - 48h
  const stalledWindowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // now - 7d

  const singleFollowupLeads: SingleFollowupLead[] = [];
  let droppedSingleFollowupNameless = 0;
  let stalledTestPhonesFiltered = 0; // rev-6
  for (const [key, entry] of convoGroupByKey.entries()) {
    if (entry.count !== 1) continue;
    if (!entry.lastTouch) continue;
    if (entry.lastTouch < stalledWindowStart || entry.lastTouch > stalledWindowEnd) continue;

    // Test-phone filter (rev-6) — apply to the original phone string
    if (isTestPhone(entry.originalPhone)) {
      stalledTestPhonesFiltered += 1;
      continue;
    }

    // Resolve name: warehouse first, then conversation. Must be non-empty
    // AND not the banned "AI Lead" token (isUsableCustomerName handles both).
    const wh = warehouseByKey.get(key);
    let resolvedName: string | null = null;
    let vehicleForRow: string | null = null;
    if (wh && isUsableCustomerName(wh.name)) {
      resolvedName = wh.name;
      vehicleForRow = wh.vehicle;
    } else if (entry.convoName && isUsableCustomerName(entry.convoName)) {
      resolvedName = entry.convoName;
    }
    if (!resolvedName) {
      droppedSingleFollowupNameless += 1;
      continue;
    }

    singleFollowupLeads.push({
      customerName: resolvedName,
      customerPhone: entry.originalPhone,
      vehicleOfInterest: formatVehicle(vehicleForRow),
      lastActivityAt: entry.lastTouch.toISOString(),
      daysSinceLastActivity: daysBetween(now, entry.lastTouch),
      hoursSinceLastActivity: hoursBetween(now, entry.lastTouch),
    });
  }
  singleFollowupLeads.sort((a, b) => b.hoursSinceLastActivity - a.hoursSinceLastActivity);
  if (droppedSingleFollowupNameless > 0) {
    warnings.push(
      `${droppedSingleFollowupNameless} stalled-candidate row${droppedSingleFollowupNameless === 1 ? " was" : "s were"} dropped because no usable customer name could be resolved.`,
    );
  }
  if (stalledTestPhonesFiltered > 0) {
    warnings.push(
      `${stalledTestPhonesFiltered} test/synthetic phone${stalledTestPhonesFiltered === 1 ? "" : "s"} filtered from the stalled list.`,
    );
  }
  if (ghostedTestPhonesFiltered > 0) {
    warnings.push(
      `${ghostedTestPhonesFiltered} test/synthetic phone${ghostedTestPhonesFiltered === 1 ? "" : "s"} filtered from the ghosted list.`,
    );
  }

  // 6. Leads received this week + by source + prior-week trend
  const leadsReceivedThisWeek = leadsInWindow.length;

  // This-week counts by raw leadSource
  const bySourceThisWeek = new Map<string, number>();
  for (const l of leadsInWindow) {
    const key = l.leadSource || "__UNKNOWN__";
    bySourceThisWeek.set(key, (bySourceThisWeek.get(key) || 0) + 1);
  }

  // Prior week (weekStart - 7d, weekStart)
  const priorWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const priorWeekLeads = await db
    .select({ leadSource: warehouseLeads.leadSource })
    .from(warehouseLeads)
    .where(
      and(
        eq(warehouseLeads.organizationId, orgId),
        isNotNull(warehouseLeads.vinCreatedAt),
        gte(warehouseLeads.vinCreatedAt, priorWeekStart),
        lt(warehouseLeads.vinCreatedAt, weekStart),
      ),
    );
  const bySourcePriorWeek = new Map<string, number>();
  for (const l of priorWeekLeads) {
    const key = l.leadSource || "__UNKNOWN__";
    bySourcePriorWeek.set(key, (bySourcePriorWeek.get(key) || 0) + 1);
  }

  // Resolve to human-readable names
  const { map: sourceMap, failed: sourceResolutionFailedFromMcp } = await buildLeadSourceMap(orgId);
  if (sourceResolutionFailedFromMcp) {
    warnings.push(
      "vin_get_lead_sources MCP call failed or returned empty — lead source names fell back to 'VIN Source #{id}'. Report still sent (MCP outages shouldn't block) but the 'sourceResolutionFailed' flag is true.",
    );
  }

  // Count this week's DISTINCT source IDs (URL-form only — the ones we need
  // to resolve via MCP). Used for partial-coverage detection below.
  const distinctThisWeekSourceIds = new Set<string>();
  for (const key of bySourceThisWeek.keys()) {
    if (key === "__UNKNOWN__") continue;
    const m = key.match(/\/leadsources\/id\/(\d+)/i);
    if (m) distinctThisWeekSourceIds.add(m[1]);
  }
  const resolvableCount = Array.from(distinctThisWeekSourceIds).filter((id) => sourceMap.has(id)).length;
  const totalDistinctCount = distinctThisWeekSourceIds.size;

  const allSourceKeys = new Set<string>([
    ...Array.from(bySourceThisWeek.keys()),
    ...Array.from(bySourcePriorWeek.keys()),
  ]);
  // Collapse to name buckets (multiple URLs can map to the same name).
  // Track fallback count for validator "more than 30% fallback" trigger.
  const nameBuckets = new Map<string, { thisWeek: number; priorWeek: number; fellBack: boolean }>();
  for (const key of allSourceKeys) {
    let displayName: string;
    let fellBack = false;
    if (key === "__UNKNOWN__") {
      displayName = "Unknown";
    } else {
      const r = formatLeadSource(key, sourceMap);
      displayName = r.display;
      fellBack = r.fellBack;
    }
    const entry = nameBuckets.get(displayName) || { thisWeek: 0, priorWeek: 0, fellBack: false };
    entry.thisWeek += bySourceThisWeek.get(key) || 0;
    entry.priorWeek += bySourcePriorWeek.get(key) || 0;
    entry.fellBack = entry.fellBack || fellBack;
    nameBuckets.set(displayName, entry);
  }
  const leadsBySource: LeadSourceTrend[] = Array.from(nameBuckets.entries())
    .filter(([, v]) => v.thisWeek > 0) // only show sources that had leads this week
    .map(([name, v]) => {
      const delta = v.thisWeek - v.priorWeek;
      const direction: "up" | "down" | "flat" =
        delta > 0 ? "up" : delta < 0 ? "down" : "flat";
      return { name, thisWeek: v.thisWeek, priorWeek: v.priorWeek, delta, direction };
    })
    .sort((a, b) => b.thisWeek - a.thisWeek);

  // rev-3 (Option 2, operator-approved 2026-04-20): extended
  // sourceResolutionFailed semantics.
  //
  // Originally the flag was only true on MCP outage / empty response. But the
  // reality is that vin_get_lead_sources returns a SUBSET of actual lead
  // sources for most dealers (see issues.md I-279). A dealer can have 49
  // distinct source IDs in this week's leads but the MCP only returns 15 —
  // leaving 70% as "VIN Source #N" fallbacks.
  //
  // Policy: if < 70% of distinct this-week source IDs resolve to a name
  // (i.e. > 30% fall back), treat it as partial failure and set the flag.
  // The validator then permits the per-row fallback. A warning is ALSO added
  // so the gap is visible in the integration test output and the report's
  // warnings list.
  //
  // The 30% concept is preserved as the data-quality line — if MCP ever
  // returns full coverage, future drift below that line will still flip this
  // flag and surface in warnings (but won't block the send).
  const PARTIAL_RESOLUTION_THRESHOLD = 0.7;
  let sourceResolutionFailed = sourceResolutionFailedFromMcp;
  if (
    !sourceResolutionFailedFromMcp &&
    totalDistinctCount > 0 &&
    resolvableCount / totalDistinctCount < PARTIAL_RESOLUTION_THRESHOLD
  ) {
    sourceResolutionFailed = true;
    const pct = Math.round((resolvableCount / totalDistinctCount) * 100);
    warnings.push(
      `Only ${resolvableCount} of ${totalDistinctCount} lead sources resolved by VIN API (${pct}% coverage). Remaining entries display as "VIN Source #{id}". Upstream VIN limitation — tracked under issue below.`,
    );
  }

  // 7. Weekly activity summary — counts
  const [{ inboundCalls }] = await db
    .select({ inboundCalls: sql<number>`COUNT(*)::int` })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        eq(conversations.channel, "voice"),
        gte(conversations.createdAt, weekStart),
        lte(conversations.createdAt, weekEnd),
      ),
    );

  // TRG-RPT-001 hotfix: when sales-only filter active, use the filtered
  // leadsInWindow as the leadsSynced count proxy so activity totals reflect
  // the sales-only scope. The original query counted every synced row
  // regardless of vinCreatedAt, which conflates sync activity with lead
  // volume; the filtered path is the honest sales-only number.
  let leadsSynced: number;
  if (salesFilterActive) {
    leadsSynced = leadsInWindow.length;
  } else {
    const [row] = await db
      .select({ leadsSynced: sql<number>`COUNT(*)::int` })
      .from(warehouseLeads)
      .where(
        and(
          eq(warehouseLeads.organizationId, orgId),
          gte(warehouseLeads.syncedAt, weekStart),
          lte(warehouseLeads.syncedAt, weekEnd),
        ),
      );
    leadsSynced = Number(row.leadsSynced);
  }

  const [{ adfDelivered }] = await db
    .select({ adfDelivered: sql<number>`COUNT(*)::int` })
    .from(outboundLog)
    .where(
      and(
        eq(outboundLog.organizationId, orgId),
        eq(outboundLog.status, "sent"),
        sql`${outboundLog.messageContent} LIKE '%[adf:%'`,
        gte(outboundLog.createdAt, weekStart),
        lte(outboundLog.createdAt, weekEnd),
      ),
    );

  const [{ triggersFired }] = await db
    .select({ triggersFired: sql<number>`COUNT(*)::int` })
    .from(activityLog)
    .where(
      and(
        eq(activityLog.organizationId, orgId),
        sql`${activityLog.action} LIKE 'trigger_%_sent'`,
        gte(activityLog.createdAt, weekStart),
        lte(activityLog.createdAt, weekEnd),
      ),
    );

  // rev-3: count the notifications table directly — it's the authoritative
  // source. v2 counted outbound_log rows with '[notification:%' prefix, which
  // undercounted significantly (e.g. Serra Honda: 197 in notifications vs 10
  // in outbound_log over the same 7-day window, verified 2026-04-20).
  const [{ notificationsSent }] = await db
    .select({ notificationsSent: sql<number>`COUNT(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.organizationId, orgId),
        gte(notifications.createdAt, weekStart),
        lte(notifications.createdAt, weekEnd),
      ),
    );

  const [{ escalations }] = await db
    .select({ escalations: sql<number>`COUNT(*)::int` })
    .from(activityLog)
    .where(
      and(
        eq(activityLog.organizationId, orgId),
        sql`${activityLog.action} LIKE '%escalat%'`,
        gte(activityLog.createdAt, weekStart),
        lte(activityLog.createdAt, weekEnd),
      ),
    );

  const activity: WeeklyActivitySummary = {
    inboundCalls: Number(inboundCalls),
    leadsSynced: Number(leadsSynced),
    adfDelivered: Number(adfDelivered),
    triggersFired: Number(triggersFired),
    notificationsSent: Number(notificationsSent),
    escalations: Number(escalations),
  };

  // 8. Priorities — plain-English, second-person, no jargon.
  //
  //    rev-3: rewritten per operator flag. Banned tokens (enforced by the
  //    validator): "follow up", "outreach", "ghosted", "recipients",
  //    "workflow". Voice: direct, grabs attention, readable at a glance
  //    before the manager digs into the cards below.
  const priorities: string[] = [];
  const over48hUntouched = untouchedLeads.filter((l) => l.ageHours >= 48);

  if (ghostedLeads.length > 0) {
    const n = ghostedLeads.length;
    priorities.push(
      n === 1
        ? "1 new customer reached out this week and hasn't heard back. Start here."
        : `${n} new customers reached out this week and haven't heard back. Start here.`,
    );
  }
  if (over48hUntouched.length > 0) {
    const n = over48hUntouched.length;
    priorities.push(
      n === 1
        ? "1 of those has been waiting more than 2 days. Every hour they wait, the less likely they'll buy."
        : `${n} of those have been waiting more than 2 days. Every hour they wait, the less likely they'll buy.`,
    );
  }
  const over72hSingleFollowup = singleFollowupLeads.filter((s) => s.daysSinceLastActivity >= 3);
  if (over72hSingleFollowup.length > 0) {
    const n = over72hSingleFollowup.length;
    priorities.push(
      n === 1
        ? "1 customer you already talked to hasn't heard back in 3 days. A quick check-in keeps them warm."
        : `${n} customers you already talked to haven't heard back in 3 days. A quick check-in keeps them warm.`,
    );
  } else if (singleFollowupLeads.length > 0 && priorities.length < 3) {
    // Still call out the single-followup pile even if none are 72h+, to give
    // the manager a third actionable item.
    const n = singleFollowupLeads.length;
    priorities.push(
      n === 1
        ? "1 customer got one reply and nothing since. A quick check-in keeps them warm."
        : `${n} customers got one reply and nothing since. A quick check-in keeps them warm.`,
    );
  }
  if (priorities.length === 0) {
    priorities.push("Nothing urgent this week. Keep the momentum going.");
  }

  // -------------------------------------------------------------------------
  // Dashboard metrics (computed before score so the new score formula can use
  // over48hCount directly).
  // -------------------------------------------------------------------------

  // over48h = ghosted-within-week where ageHours >= 48
  const over48hCount = ghostedLeads.filter((g) => g.ageHours >= 48).length;

  // 9. Sales team score — v7 formula (operator-approved, 2026-04-20):
  //    score = max(0, 100 − ghostedCount*0.5 − over48hCount*1.0), rounded int.
  //    No caps. No flat penalties. Floor 0, ceiling 100.
  //
  //    The breakdown carries the new granular components so the arrow +
  //    commentary can reference ghosted and over48h cleanly without dragging
  //    in the legacy "untouched / 2" and "-10 if any over48h" buckets.
  // -------------------------------------------------------------------------
  const ghostedPenaltyRaw = ghostedLeads.length * 0.5;
  const over48hPenaltyRaw = over48hCount * 1.0;
  const scoreRaw = 100 - ghostedPenaltyRaw - over48hPenaltyRaw;
  const score = Math.max(0, Math.min(100, Math.round(scoreRaw)));

  const breakdown: Array<{ label: string; delta: number }> = [];
  if (ghostedLeads.length > 0) {
    breakdown.push({
      label: `Leads still waiting for a first reply (${ghostedLeads.length})`,
      delta: -ghostedPenaltyRaw,
    });
  }
  if (over48hCount > 0) {
    breakdown.push({
      label: `Leads waiting more than 48 hours (${over48hCount})`,
      delta: -over48hPenaltyRaw,
    });
  }

  // Commentary — reference the biggest drag component by name.
  let commentary: string;
  if (ghostedLeads.length === 0 && over48hCount === 0) {
    commentary = "Nothing notable dragged the score down this week — coverage looks healthy.";
  } else if (over48hPenaltyRaw >= ghostedPenaltyRaw && over48hCount > 0) {
    commentary =
      `The biggest drag is ${over48hCount} lead${over48hCount === 1 ? "" : "s"} waiting more than 48 hours (-${over48hPenaltyRaw} pts). ` +
      `Reply to those first — every hour they wait, the less likely they'll buy.`;
  } else {
    commentary =
      `The biggest drag is ${ghostedLeads.length} lead${ghostedLeads.length === 1 ? "" : "s"} still waiting for a first reply (-${ghostedPenaltyRaw} pts). ` +
      `Start with the top ${Math.min(5, ghostedLeads.length)} new customers who haven't heard back yet.`;
  }

  const salesScore: SalesTeamScore = { score, commentary, breakdown };

  // automationTriggers = same query as triggersFired, broken out for chip
  const automationTriggers = Number(triggersFired);

  // adfDeliveries = separate chip; distinct from notifications
  const adfDeliveries = Number(adfDelivered);

  // -------------------------------------------------------------------------
  // rev-4: Unified fastest-action list
  //
  // - Oldest ghosted first (by ageHours desc)
  // - Then stalled by daysSinceLastActivity desc
  // - Cap at 8 rows; record "more" count for renderer
  //
  // Name resolution per operator spec:
  //   warehouse → conversation (not "AI Lead") → "Caller ••• {last4}" → "Inbound caller"
  //
  // We reach back to the raw lead rows for warehouseName because the
  // GhostedLead/SingleFollowupLead types already rewrote it to the trimmed
  // name; we want to be sure we cleanly pass the raw value (a pre-sanitized
  // name that might equal "AI Lead" in warehouse) through the resolver.
  // -------------------------------------------------------------------------

  const nameResolverStats: NameResolverStats = {
    warehouse: 0,
    conversation: 0,
    phoneFallback: 0,
    inboundFallback: 0,
  };

  function bumpResolverStat(src: FastestActionEntry["nameSource"]): void {
    if (src === "warehouse") nameResolverStats.warehouse += 1;
    else if (src === "conversation") nameResolverStats.conversation += 1;
    else if (src === "phone_fallback") nameResolverStats.phoneFallback += 1;
    else nameResolverStats.inboundFallback += 1;
  }

  // Build phone → raw-warehouse-name map from the same raw lead rows, so the
  // resolver sees whatever VIN gave us (including "AI Lead"). This lets us
  // reject "AI Lead" at the resolver boundary rather than in the builder.
  const warehouseNameByPhoneVariant = new Map<string, string>();
  for (const l of leadsWithPhone) {
    if (!l.customerPhone || !l.customerName) continue;
    const trimmed = l.customerName.trim();
    if (!trimmed) continue;
    const variants = normalizePhone(l.customerPhone);
    for (const v of variants) {
      if (!warehouseNameByPhoneVariant.has(v)) warehouseNameByPhoneVariant.set(v, trimmed);
    }
  }
  function lookupWarehouseName(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const variants = normalizePhone(phone);
    for (const v of variants) {
      const hit = warehouseNameByPhoneVariant.get(v);
      if (hit) return hit;
    }
    return null;
  }

  // Compose ghosted rows (already week-scoped, already name-dropped-nameless),
  // but re-run through the resolver so if VIN ever returns literal "AI Lead"
  // in a name column we don't leak it through. Current ghostedLeads array
  // guarantees customerName is non-empty, but not that it isn't "AI Lead".
  const ghostedActionRows: FastestActionEntry[] = [];
  for (const g of ghostedLeads) {
    // Use the ghosted row's name first — operator rule step 1. If it's "AI Lead"
    // we fall to conversation, then phone, then "Inbound caller".
    const convoName = lookupConvoName(g.customerPhone);
    const resolved = resolveDisplayName(g.customerName, convoName, g.customerPhone);
    bumpResolverStat(resolved.source);
    ghostedActionRows.push({
      name: resolved.name,
      nameSource: resolved.source,
      customerPhone: g.customerPhone,
      kind: "ghosted",
      subtext: "No follow-up yet",
      ageLabel: ghostedAgeLabel(g.ageHours),
      sortKey: g.ageHours,
    });
  }

  // Compose stalled rows
  const stalledActionRows: FastestActionEntry[] = [];
  for (const s of singleFollowupLeads) {
    const convoName = lookupConvoName(s.customerPhone);
    const warehouseName = lookupWarehouseName(s.customerPhone) || s.customerName;
    const resolved = resolveDisplayName(warehouseName, convoName, s.customerPhone);
    bumpResolverStat(resolved.source);
    stalledActionRows.push({
      name: resolved.name,
      nameSource: resolved.source,
      customerPhone: s.customerPhone,
      kind: "stalled",
      subtext: "One reply, then no next step",
      ageLabel: stalledAgeLabel(s.hoursSinceLastActivity),
      sortKey: s.hoursSinceLastActivity,
    });
  }

  // Merge and cap
  const FASTEST_ACTION_CAP = 8;
  ghostedActionRows.sort((a, b) => b.sortKey - a.sortKey);
  stalledActionRows.sort((a, b) => b.sortKey - a.sortKey);
  const combined = [...ghostedActionRows, ...stalledActionRows];
  const fastestActionList = combined.slice(0, FASTEST_ACTION_CAP);
  const fastestActionMore = Math.max(0, combined.length - FASTEST_ACTION_CAP);

  // -------------------------------------------------------------------------
  // rev-4: Score card one-liners
  //
  // Main issue rule (pick highest absolute count):
  //   - ghosted > 0 → "{ghosted} new leads did not get a first reply."
  //   - stalled > 0 → "{stalled} leads got one reply then no next step."
  //   - else → "No leads missed this week."
  //
  // What-to-do-first rule:
  //   - over48h > 0 → "Reply to the {N} leads waiting more than 48 hours."
  //   - ghosted > 0 → "Start with the {N} leads that haven't heard back yet."
  //   - stalled > 0 → "Check in with the {N} leads that got one reply."
  //   - else → "Keep the momentum up."
  //
  // Both capped at ≤90 chars and must not contain banned jargon tokens.
  // -------------------------------------------------------------------------

  let mainIssueLine: string;
  const ghostedCount = ghostedLeads.length;
  const stalledCount = singleFollowupLeads.length;
  if (ghostedCount > 0 && ghostedCount >= stalledCount) {
    mainIssueLine = ghostedCount === 1
      ? "1 new lead did not get a first reply."
      : `${ghostedCount} new leads did not get a first reply.`;
  } else if (stalledCount > 0) {
    mainIssueLine = stalledCount === 1
      ? "1 lead got one reply then no next step."
      : `${stalledCount} leads got one reply then no next step.`;
  } else {
    mainIssueLine = "No leads missed this week.";
  }

  let whatToDoFirstLine: string;
  if (over48hCount > 0) {
    whatToDoFirstLine = over48hCount === 1
      ? "Reply to the 1 lead waiting more than 48 hours."
      : `Reply to the ${over48hCount} leads waiting more than 48 hours.`;
  } else if (ghostedCount > 0) {
    whatToDoFirstLine = ghostedCount === 1
      ? "Start with the 1 lead that hasn't heard back yet."
      : `Start with the ${ghostedCount} leads that haven't heard back yet.`;
  } else if (stalledCount > 0) {
    whatToDoFirstLine = stalledCount === 1
      ? "Check in with the 1 lead that got one reply."
      : `Check in with the ${stalledCount} leads that got one reply.`;
  } else {
    whatToDoFirstLine = "Keep the momentum up.";
  }

  const scoreCardLines: ScoreCardLines = {
    mainIssueLine,
    whatToDoFirstLine,
  };

  // -------------------------------------------------------------------------
  // rev-5: Prior-week metrics (for arrows + "What Moved" narrative)
  //
  // priorWeekStart was already computed above for the lead-source trend
  // query (line ~744). We reuse it for all per-KPI counts.
  //
  // Each of these is a simple COUNT(*) bounded to a 7-day window, so the
  // extra DB load per store is trivial (8 quick aggregate queries).
  //
  // For prior-week GHOSTED we approximate: leads created in prior week that
  // STILL have no conversation or followup as of `now`. That's the same
  // definition applied to a shifted window. over48h is the subset of that
  // with ageHours >= 48.
  // -------------------------------------------------------------------------

  const [{ priorLeads }] = await db
    .select({ priorLeads: sql<number>`COUNT(*)::int` })
    .from(warehouseLeads)
    .where(
      and(
        eq(warehouseLeads.organizationId, orgId),
        isNotNull(warehouseLeads.vinCreatedAt),
        gte(warehouseLeads.vinCreatedAt, priorWeekStart),
        lt(warehouseLeads.vinCreatedAt, weekStart),
      ),
    );

  const [{ priorInbound }] = await db
    .select({ priorInbound: sql<number>`COUNT(*)::int` })
    .from(conversations)
    .where(
      and(
        eq(conversations.organizationId, orgId),
        eq(conversations.channel, "voice"),
        gte(conversations.createdAt, priorWeekStart),
        lt(conversations.createdAt, weekStart),
      ),
    );

  const [{ priorNotifications }] = await db
    .select({ priorNotifications: sql<number>`COUNT(*)::int` })
    .from(notifications)
    .where(
      and(
        eq(notifications.organizationId, orgId),
        gte(notifications.createdAt, priorWeekStart),
        lt(notifications.createdAt, weekStart),
      ),
    );

  const [{ priorAdf }] = await db
    .select({ priorAdf: sql<number>`COUNT(*)::int` })
    .from(outboundLog)
    .where(
      and(
        eq(outboundLog.organizationId, orgId),
        eq(outboundLog.status, "sent"),
        sql`${outboundLog.messageContent} LIKE '%[adf:%'`,
        gte(outboundLog.createdAt, priorWeekStart),
        lt(outboundLog.createdAt, weekStart),
      ),
    );

  const [{ priorTriggers }] = await db
    .select({ priorTriggers: sql<number>`COUNT(*)::int` })
    .from(activityLog)
    .where(
      and(
        eq(activityLog.organizationId, orgId),
        sql`${activityLog.action} LIKE 'trigger_%_sent'`,
        gte(activityLog.createdAt, priorWeekStart),
        lt(activityLog.createdAt, weekStart),
      ),
    );

  // Prior-week ghosted / stalled / over48h — re-applies the ghosted and
  // single-followup logic to the prior-week window.
  const priorLeadsInWindow = await db
    .select()
    .from(warehouseLeads)
    .where(
      and(
        eq(warehouseLeads.organizationId, orgId),
        isNotNull(warehouseLeads.vinCreatedAt),
        gte(warehouseLeads.vinCreatedAt, priorWeekStart),
        lt(warehouseLeads.vinCreatedAt, weekStart),
      ),
    );
  const priorLeadsWithPhone = priorLeadsInWindow.filter(
    (l) => l.customerPhone && l.customerPhone.trim().length > 0,
  );

  // Build phone-variant set for prior leads to look up conversations
  const priorPhoneVariants = new Set<string>();
  for (const l of priorLeadsWithPhone) {
    if (l.customerPhone) normalizePhone(l.customerPhone).forEach((v) => priorPhoneVariants.add(v));
  }
  let priorConvosByPhone: Array<{ customerPhone: string | null; createdAt: Date | null; lastMessageAt: Date | null }> = [];
  if (priorPhoneVariants.size > 0) {
    const variantArr = Array.from(priorPhoneVariants).filter((v) => v.length > 0);
    if (variantArr.length > 0) {
      priorConvosByPhone = await db
        .select({
          customerPhone: conversations.customerPhone,
          createdAt: conversations.createdAt,
          lastMessageAt: conversations.lastMessageAt,
        })
        .from(conversations)
        .where(
          and(
            eq(conversations.organizationId, orgId),
            inArray(conversations.customerPhone, variantArr),
          ),
        );
    }
  }
  const priorPhonesWithConvo = new Set<string>();
  for (const c of priorConvosByPhone) {
    if (c.customerPhone) priorPhonesWithConvo.add(c.customerPhone);
  }
  function priorLeadHasConvo(leadPhone: string): boolean {
    const variants = normalizePhone(leadPhone);
    return variants.some((v) => priorPhonesWithConvo.has(v));
  }

  let priorGhosted = 0;
  let priorOver48h = 0;
  for (const l of priorLeadsWithPhone) {
    if (l.followupSentAt) continue;
    if (priorLeadHasConvo(l.customerPhone as string)) continue;
    const name = (l.customerName || "").trim();
    if (!name) continue;
    priorGhosted += 1;
    const age = hoursBetween(now, l.vinCreatedAt as Date);
    if (age >= 48) priorOver48h += 1;
  }

  // Prior stalled = single-followup computed against prior window
  const priorConvoCountsByPhone = new Map<string, { count: number; latestLastMsg: Date | null }>();
  for (const c of priorConvosByPhone) {
    if (!c.customerPhone) continue;
    const entry = priorConvoCountsByPhone.get(c.customerPhone) || { count: 0, latestLastMsg: null };
    entry.count += 1;
    const last = c.lastMessageAt || c.createdAt;
    if (last && (!entry.latestLastMsg || last > entry.latestLastMsg)) {
      entry.latestLastMsg = last;
    }
    priorConvoCountsByPhone.set(c.customerPhone, entry);
  }
  let priorStalled = 0;
  for (const lead of priorLeadsWithPhone) {
    if (!lead.customerPhone) continue;
    const variants = normalizePhone(lead.customerPhone);
    let totalConvos = 0;
    let latest: Date | null = null;
    for (const v of variants) {
      const e = priorConvoCountsByPhone.get(v);
      if (!e) continue;
      totalConvos += e.count;
      if (e.latestLastMsg && (!latest || e.latestLastMsg > latest)) latest = e.latestLastMsg;
    }
    if (totalConvos === 1 && latest && latest >= priorWeekStart && latest < weekStart) {
      const name = (lead.customerName || "").trim();
      if (name) priorStalled += 1;
    }
  }

  // Prior-week score — same v7 formula applied to the prior-week counts.
  //   priorScore = max(0, 100 − priorGhosted*0.5 − priorOver48h*1.0)
  const priorScoreRaw = 100 - priorGhosted * 0.5 - priorOver48h * 1.0;
  const priorScore = Math.max(0, Math.min(100, Math.round(priorScoreRaw)));

  // -------------------------------------------------------------------------
  // rev-6: Lead Status Breakdown (this week + prior-week LOST_BAD_LEAD
  // for WoW delta). Uses vinUpdatedAt ∈ window as the time filter. Applies
  // the +1555 test-phone filter in JS (DB-level filter would be noisier).
  //
  // We pull rows with vinUpdatedAt in THIS week (for breakdown + LOST_BAD_LEAD
  // count), and a separate count for PRIOR week LOST_BAD_LEAD.
  // -------------------------------------------------------------------------

  const statusRowsThisWeekRaw = await db
    .select({
      sourceId: warehouseLeads.sourceId,
      vinStatus: warehouseLeads.vinStatus,
      customerPhone: warehouseLeads.customerPhone,
    })
    .from(warehouseLeads)
    .where(
      and(
        eq(warehouseLeads.organizationId, orgId),
        isNotNull(warehouseLeads.vinUpdatedAt),
        gte(warehouseLeads.vinUpdatedAt, weekStart),
        lte(warehouseLeads.vinUpdatedAt, weekEnd),
      ),
    );
  // TRG-RPT-001 hotfix: filter status-breakdown rows through salesIds when active.
  const statusRowsThisWeek = salesIds
    ? statusRowsThisWeekRaw.filter((r) => r.sourceId != null && salesIds.has(String(r.sourceId)))
    : statusRowsThisWeekRaw;

  const leadStatusBreakdown: LeadStatusBreakdown = {
    active: 0,
    sold: 0,
    lost: 0,
    bad: 0,
    complete: 0,
  };
  let lostBadLeadCount = 0;
  let statusBreakdownTestPhonesFiltered = 0;
  for (const row of statusRowsThisWeek) {
    if (isTestPhone(row.customerPhone)) {
      statusBreakdownTestPhonesFiltered += 1;
      continue;
    }
    const bucket = classifyForStatusBreakdown(row.vinStatus);
    if (bucket) {
      leadStatusBreakdown[bucket] += 1;
    }
    // Featured LOST_BAD_LEAD metric is counted via explicit string equality,
    // INDEPENDENT of the breakdown bucket (which keeps LOST_BAD_LEAD in LOST
    // per operator directive — the featured card is its own signal).
    if ((row.vinStatus || "").toUpperCase() === "LOST_BAD_LEAD") {
      lostBadLeadCount += 1;
    }
  }
  if (statusBreakdownTestPhonesFiltered > 0) {
    warnings.push(
      `${statusBreakdownTestPhonesFiltered} test/synthetic phone${statusBreakdownTestPhonesFiltered === 1 ? "" : "s"} filtered from the lead status breakdown.`,
    );
  }

  // Prior-week LOST_BAD_LEAD count (for WoW delta on the featured card)
  const priorStatusRows = await db
    .select({
      vinStatus: warehouseLeads.vinStatus,
      customerPhone: warehouseLeads.customerPhone,
    })
    .from(warehouseLeads)
    .where(
      and(
        eq(warehouseLeads.organizationId, orgId),
        isNotNull(warehouseLeads.vinUpdatedAt),
        gte(warehouseLeads.vinUpdatedAt, priorWeekStart),
        lt(warehouseLeads.vinUpdatedAt, weekStart),
      ),
    );
  let priorLostBadLead = 0;
  for (const row of priorStatusRows) {
    if (isTestPhone(row.customerPhone)) continue;
    if ((row.vinStatus || "").toUpperCase() === "LOST_BAD_LEAD") {
      priorLostBadLead += 1;
    }
  }

  // -------------------------------------------------------------------------
  // v7: 30-Day Active Leads — snapshot metric replacing "Stalled After 1 Reply"
  // in the top KPI mini-grid.
  //
  //   count = WHERE vinCreatedAt >= now() - 30 days
  //       AND vinStatus LIKE 'ACTIVE_%' (case-insensitive)
  //       AND org = orgId
  //
  // We use UPPER() on vinStatus at the DB level for a fast prefix match. No
  // week-scope — this is a rolling 30-day window and deliberately distinct
  // from the week-scoped leadStatusBreakdown.active count.
  // -------------------------------------------------------------------------
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  // TRG-RPT-001 hotfix: when sales-only filter active, approximate the 30-day
  // active count using only the current-week slice that passed the filter.
  // The full 30-day VIN classification is out of scope for this one-off
  // regeneration (5x the API volume). The number is still directionally
  // correct — it undercounts active sales leads from prior weeks in the
  // 30-day window, but never overcounts. BL-107 fixes this properly.
  let score30DayActive: number;
  if (salesFilterActive) {
    // Count only current-week sales leads with ACTIVE_ status.
    score30DayActive = leadsInWindow.filter((l) => {
      const status = (l.vinStatus || "").toUpperCase();
      return status.startsWith("ACTIVE_");
    }).length;
  } else {
    const [{ activeCount }] = await db
      .select({ activeCount: sql<number>`COUNT(*)::int` })
      .from(warehouseLeads)
      .where(
        and(
          eq(warehouseLeads.organizationId, orgId),
          isNotNull(warehouseLeads.vinCreatedAt),
          gte(warehouseLeads.vinCreatedAt, thirtyDaysAgo),
          sql`UPPER(${warehouseLeads.vinStatus}) LIKE 'ACTIVE\\_%' ESCAPE '\\'`,
        ),
      );
    score30DayActive = Number(activeCount) || 0;
  }

  const priorWeekMetrics: PriorWeekMetrics = {
    leads: Number(priorLeads),
    ghosted: priorGhosted,
    over48h: priorOver48h,
    stalled: priorStalled,
    inboundCalls: Number(priorInbound),
    notifications: Number(priorNotifications),
    adfDeliveries: Number(priorAdf),
    automationTriggers: Number(priorTriggers),
    score,
    lostBadLead: priorLostBadLead,
  };
  priorWeekMetrics.score = priorScore;

  // -------------------------------------------------------------------------
  // rev-5: KPI arrows — compare each metric this week vs prior week
  //
  // NOTE for attention-needed metrics (ghosted, over48h, stalled): "up"
  // literally means this-week count is HIGHER than prior week (i.e., the
  // problem got worse). The arrow in the UI still reads as a neutral
  // direction indicator — the number color signals severity, not the
  // arrow.
  // -------------------------------------------------------------------------
  const kpiArrows: KpiArrows = {
    score: computeArrowDir(score, priorScore),
    leads: computeArrowDir(leadsReceivedThisWeek, priorWeekMetrics.leads),
    ghosted: computeArrowDir(ghostedLeads.length, priorWeekMetrics.ghosted),
    over48h: computeArrowDir(over48hCount, priorWeekMetrics.over48h),
    stalled: computeArrowDir(singleFollowupLeads.length, priorWeekMetrics.stalled),
    inboundCalls: computeArrowDir(Number(inboundCalls), priorWeekMetrics.inboundCalls),
    notifications: computeArrowDir(Number(notificationsSent), priorWeekMetrics.notifications),
    adfDeliveries: computeArrowDir(adfDeliveries, priorWeekMetrics.adfDeliveries),
    automationTriggers: computeArrowDir(automationTriggers, priorWeekMetrics.automationTriggers),
  };

  // -------------------------------------------------------------------------
  // rev-5 / v8: Lead source split (Winners)
  //
  // Winners = sources with positive delta. Sort by delta desc. Cap at top 4.
  // Empty side renders "No notable movement this week" placeholder.
  //
  // v8: The "Needs Attention" card was removed from the rendered email, so
  // leadsBySourceNeedsAttention is no longer produced. Biggest Losers (below)
  // is now the sole losses dataset.
  // -------------------------------------------------------------------------

  const leadsBySourceWinners: LeadSourceTrend[] = leadsBySource
    .filter((s) => s.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 4);

  // rev-6: Biggest Losers — top 5 source drops (negative delta, |delta| desc).
  const leadsBySourceBiggestLosers: LeadSourceTrend[] = leadsBySource
    .filter((s) => s.delta < 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

  // -------------------------------------------------------------------------
  // rev-6: Short narratives + rule-based bullets
  //
  // "What This Week Says": up to 5 short paragraphs joined by \n\n.
  //   Chunk 1 — lead volume + first-reply gap
  //   Chunk 2 — score + driver
  //   Chunk 3 — stalled (new definition: last touch 48h–7d ago)
  //   Chunk 4 — LOST_BAD_LEAD concern (only emitted when > 0)
  //   Chunk 5 — positive signal (inbound calls / notifications / fallback)
  // Total ≤220 words, 6th-grade reading level.
  //
  // "What Moved": 1 paragraph, ≤60 words, about Winners + Biggest Losers (top 5).
  // Rule-based (no Claude call) to stay deterministic.
  // -------------------------------------------------------------------------

  // Chunk 1 — lead volume + first-reply gap
  let chunk1: string;
  if (leadsReceivedThisWeek === 0) {
    chunk1 = "No new leads came in this week. That is unusual and worth a look.";
  } else if (ghostedLeads.length === 0) {
    chunk1 = `You got ${leadsReceivedThisWeek} new lead${leadsReceivedThisWeek === 1 ? "" : "s"} this week. Every one got a first reply, which is the goal.`;
  } else {
    chunk1 = `You got ${leadsReceivedThisWeek} new lead${leadsReceivedThisWeek === 1 ? "" : "s"} this week. But ${ghostedLeads.length} of them still have no first reply.`;
  }

  // Chunk 2 — score + driver (v7: reference the new formula components
  // directly — ghosted is -0.5, over48h is -1.0, so over48h is the bigger
  // drag when counts are comparable).
  let chunk2: string;
  if (ghostedLeads.length === 0 && over48hCount === 0) {
    chunk2 = `The team score is ${score} out of 100. Coverage looks healthy this week.`;
  } else if (score >= 85) {
    chunk2 = `The team score is ${score} out of 100. Coverage is strong and there is not much dragging it down.`;
  } else if (over48hPenaltyRaw >= ghostedPenaltyRaw && over48hCount > 0) {
    chunk2 = `The team score is ${score} out of 100. The biggest drag is ${over48hCount} lead${over48hCount === 1 ? "" : "s"} waiting more than 48 hours.`;
  } else {
    chunk2 = `The team score is ${score} out of 100. The biggest drag is ${ghostedLeads.length} lead${ghostedLeads.length === 1 ? "" : "s"} still waiting for a first reply.`;
  }

  // Chunk 3 — stalled (new definition)
  // rev-6: reference the new 48h–7d window explicitly without using banned
  // jargon. "stalled" is fine; "ghosted" is banned.
  let chunk3: string;
  if (singleFollowupLeads.length === 0) {
    chunk3 = "No leads are stalled right now. Conversations are moving.";
  } else if (singleFollowupLeads.length === 1) {
    chunk3 = "1 lead got one reply and then went quiet. It is between 2 and 7 days since the last touch.";
  } else {
    chunk3 = `${singleFollowupLeads.length} leads got one reply and then went quiet. Each one is between 2 and 7 days since the last touch.`;
  }

  // Chunk 4 — LOST_BAD_LEAD concern (only when > 0)
  let chunk4: string | null = null;
  if (lostBadLeadCount > 0) {
    chunk4 = lostBadLeadCount === 1
      ? "1 lead was marked Lost - Bad Lead this week. It is worth naming and reviewing source quality."
      : `${lostBadLeadCount} leads were marked Lost - Bad Lead this week. It is worth naming and reviewing source quality.`;
  }

  // Chunk 5 — positive signal
  let chunk5: string;
  if (activity.inboundCalls > 0) {
    chunk5 = `${activity.inboundCalls} customer${activity.inboundCalls === 1 ? "" : "s"} called in. That is live interest. Turn the same energy toward the leads still waiting on a reply.`;
  } else if (Number(notificationsSent) > 0) {
    chunk5 = `${notificationsSent} notification${Number(notificationsSent) === 1 ? "" : "s"} went out to alert the team. Use those as the nudge to act fast on new leads.`;
  } else {
    chunk5 = `Keep pushing on first replies. Speed on the first touch is what moves the score.`;
  }

  const chunksWeekSays = [chunk1, chunk2, chunk3];
  if (chunk4) chunksWeekSays.push(chunk4);
  chunksWeekSays.push(chunk5);
  const narrativeWeekSays = chunksWeekSays.join("\n\n");

  // "What Moved" — Winners + Biggest Losers (top 5 replacing old Needs Att. top 3)
  let narrativeWhatMoved: string;
  if (leadsBySourceWinners.length === 0 && leadsBySourceBiggestLosers.length === 0) {
    narrativeWhatMoved = "Not much changed in the source mix this week. The weekly totals held steady across the board. Keep watching for shifts next week.";
  } else {
    const parts: string[] = [];
    if (leadsBySourceWinners.length > 0) {
      const top = leadsBySourceWinners[0];
      if (leadsBySourceWinners.length >= 2) {
        parts.push(`${top.name} and ${leadsBySourceWinners[1].name} were the clearest gains.`);
      } else {
        parts.push(`${top.name} was the clearest gain.`);
      }
    }
    if (leadsBySourceBiggestLosers.length > 0) {
      const top = leadsBySourceBiggestLosers[0];
      parts.push(`${top.name} was the biggest drop in the visible source mix.`);
    }
    parts.push("Keeping this section short makes it easier to scan.");
    narrativeWhatMoved = parts.join(" ");
  }

  // "Simple Read" — 3 bullets about lead issues
  const simpleReadBullets: string[] = [];
  if (ghostedLeads.length > 0) {
    simpleReadBullets.push("The biggest gap is still first response speed.");
  } else {
    simpleReadBullets.push("First response speed is holding up. Every new lead got a reply.");
  }
  if (over48hCount > 0) {
    simpleReadBullets.push(`The ${over48hCount} lead${over48hCount === 1 ? "" : "s"} over 48 hours are the fastest recovery group.`);
  } else {
    simpleReadBullets.push("No leads sat for more than 48 hours. Keep that bar.");
  }
  if (singleFollowupLeads.length > 0) {
    simpleReadBullets.push(`The ${singleFollowupLeads.length} stalled lead${singleFollowupLeads.length === 1 ? "" : "s"} need the next step, not just the first step.`);
  } else {
    simpleReadBullets.push("Nobody is stuck after a single reply. Conversations are moving.");
  }

  // "Quick Read on AI Activity" — 3 bullets about AI Actions
  const quickReadBullets: string[] = [];
  if (Number(notificationsSent) >= 50) {
    quickReadBullets.push(`${notificationsSent} notifications show strong system activity.`);
  } else if (Number(notificationsSent) > 0) {
    quickReadBullets.push(`${notificationsSent} notification${Number(notificationsSent) === 1 ? "" : "s"} this week. Consider tuning alerts if volume is low.`);
  } else {
    quickReadBullets.push("No notifications were sent this week. Alerts may need review.");
  }
  if (adfDeliveries > 0) {
    quickReadBullets.push(`${adfDeliveries} ADF deliver${adfDeliveries === 1 ? "y was" : "ies were"} recorded this week.`);
  } else {
    quickReadBullets.push("No ADF deliveries recorded this week.");
  }
  if (automationTriggers > 0) {
    quickReadBullets.push(`${automationTriggers} trigger event${automationTriggers === 1 ? "" : "s"} were recorded in this report.`);
  } else {
    quickReadBullets.push("0 trigger events — triggers are not enabled this cycle.");
  }

  const data: WeeklyReportData = {
    orgId,
    orgName: org.name,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    generatedAt: now.toISOString(),
    agentName,
    leadsReceivedThisWeek,
    leadsBySource,
    ghostedLeads,
    singleFollowupLeads,
    untouchedLeads,
    activity,
    priorities,
    salesScore,
    aiNarrative: null, // filled in by generateAiNarrative if requested
    toneInterstitial: TONE_INTERSTITIAL,
    droppedNamelessGhostedCount: droppedGhostedNameless,
    sourceResolutionFailed,
    // rev-4
    over48hCount,
    automationTriggers,
    adfDeliveries,
    // v7
    score30DayActive,
    fastestActionList,
    fastestActionMore,
    scoreCardLines,
    nameResolverStats,
    // rev-5
    kpiArrows,
    priorWeek: priorWeekMetrics,
    leadsBySourceWinners,
    narrativeWeekSays,
    narrativeWhatMoved,
    simpleReadBullets,
    quickReadBullets,
    // rev-6
    lostBadLeadCount,
    lostBadLeadPriorWeek: priorLostBadLead,
    leadStatusBreakdown,
    leadsBySourceBiggestLosers,
    testPhoneFilterStats: {
      ghosted: ghostedTestPhonesFiltered,
      stalled: stalledTestPhonesFiltered,
      statusBreakdown: statusBreakdownTestPhonesFiltered,
      fastestAction: 0, // set below after fastestActionList filter
    },
    // TRG-RPT-001 hotfix (2026-04-21): opt-in sales-only filter marker
    salesFilterActive,
  };

  // rev-6: Apply test-phone filter to fastestActionList too. ghostedActionRows
  // and stalledActionRows were built from ghostedLeads + singleFollowupLeads,
  // which ALREADY had the test-phone filter applied. So at this point the
  // fastestActionList entries are already clean; this count tracks how many
  // entries were excluded upstream (ghosted + stalled) that would have otherwise
  // been candidates. We report the combined count for transparency.
  data.testPhoneFilterStats.fastestAction = ghostedTestPhonesFiltered + stalledTestPhonesFiltered;

  return { data, warnings };
}

// ---------------------------------------------------------------------------
// validateWeeklyReport — QA gate (revision 2)
// ---------------------------------------------------------------------------

const PLACEHOLDER_NARRATIVE = "AI narrative unavailable this cycle — raw data shown below.";

// Banned jargon tokens in priority bullets — operator flag from v2 review.
// Priorities must read as plain English from the dealer manager's POV; these
// are BDC-jargon or instructional phrasing that the operator explicitly
// rejected. Checked case-insensitively.
export const BANNED_PRIORITY_TOKENS = [
  "follow up",
  "outreach",
  "ghosted",
  "recipients",
  "workflow",
];

// When sourceResolutionFailed is false (MCP succeeded), more than this
// fraction of leadsBySource entries falling back to "VIN Source #N" fails
// validation. Operator policy: 30%.
export const SOURCE_FALLBACK_MAX_RATIO = 0.3;

export function validateWeeklyReport(report: WeeklyReportData | null | undefined): ValidationResult {
  const failures: string[] = [];

  if (!report || typeof report !== "object") {
    return { ok: false, failures: ["Report is null or not an object"] };
  }

  // Required top-level fields
  const requiredFields: Array<keyof WeeklyReportData> = [
    "orgId",
    "orgName",
    "weekStart",
    "weekEnd",
    "generatedAt",
    "agentName",
    "leadsReceivedThisWeek",
    "leadsBySource",
    "ghostedLeads",
    "singleFollowupLeads",
    "untouchedLeads",
    "activity",
    "priorities",
    "salesScore",
    "toneInterstitial",
  ];
  for (const f of requiredFields) {
    if (report[f] === undefined || report[f] === null) {
      failures.push(`Missing required field: ${f}`);
    }
  }

  // rev-3: droppedNamelessGhostedCount and sourceResolutionFailed must be present
  if (typeof report.droppedNamelessGhostedCount !== "number" ||
      !Number.isInteger(report.droppedNamelessGhostedCount) ||
      report.droppedNamelessGhostedCount < 0) {
    failures.push(`droppedNamelessGhostedCount must be a non-negative integer (got ${JSON.stringify(report.droppedNamelessGhostedCount)})`);
  }
  if (typeof report.sourceResolutionFailed !== "boolean") {
    failures.push(`sourceResolutionFailed must be a boolean (got ${JSON.stringify(report.sourceResolutionFailed)})`);
  }

  // rev-4: new required top-level dashboard metrics
  const intGE0 = (v: unknown): boolean =>
    typeof v === "number" && Number.isFinite(v) && Number.isInteger(v) && v >= 0;

  if (!intGE0(report.over48hCount)) {
    failures.push(`over48hCount must be a non-negative integer (got ${JSON.stringify(report.over48hCount)})`);
  }
  if (!intGE0(report.automationTriggers)) {
    failures.push(`automationTriggers must be a non-negative integer (got ${JSON.stringify(report.automationTriggers)})`);
  }
  if (!intGE0(report.adfDeliveries)) {
    failures.push(`adfDeliveries must be a non-negative integer (got ${JSON.stringify(report.adfDeliveries)})`);
  }
  // v7: 30-day active leads — snapshot metric, non-negative integer.
  if (!intGE0((report as any).score30DayActive)) {
    failures.push(`score30DayActive must be a non-negative integer (got ${JSON.stringify((report as any).score30DayActive)})`);
  }
  if (!intGE0(report.fastestActionMore)) {
    failures.push(`fastestActionMore must be a non-negative integer (got ${JSON.stringify(report.fastestActionMore)})`);
  }
  if (!Array.isArray(report.fastestActionList)) {
    failures.push("fastestActionList must be an array");
  }
  if (!report.scoreCardLines || typeof report.scoreCardLines !== "object") {
    failures.push("scoreCardLines must be an object with mainIssueLine and whatToDoFirstLine");
  }
  if (!report.nameResolverStats || typeof report.nameResolverStats !== "object") {
    failures.push("nameResolverStats must be an object");
  }

  // rev-4: over48hCount must be ≤ ghostedLeads.length (it's a subset)
  if (Array.isArray(report.ghostedLeads) && intGE0(report.over48hCount)) {
    if (report.over48hCount > report.ghostedLeads.length) {
      failures.push(
        `over48hCount (${report.over48hCount}) must be ≤ ghostedLeads.length (${report.ghostedLeads.length}) — it's a subset`,
      );
    }
  }

  // rev-4: fastestActionList — no "AI Lead" allowed, entries must have the
  // required shape, and each name/subtext/ageLabel must be a non-empty string.
  if (Array.isArray(report.fastestActionList)) {
    for (let i = 0; i < report.fastestActionList.length; i += 1) {
      const e = report.fastestActionList[i];
      if (!e || typeof e !== "object") {
        failures.push(`fastestActionList[${i}] must be an object`);
        continue;
      }
      if (typeof e.name !== "string" || e.name.trim().length === 0) {
        failures.push(`fastestActionList[${i}].name must be a non-empty string`);
      } else {
        const lower = e.name.trim().toLowerCase();
        // Hard-fail on "AI Lead" — operator rule.
        if (lower === "ai lead" || lower.startsWith("ai lead ") || lower.startsWith("ai lead—") || lower.startsWith("ai lead-")) {
          failures.push(`fastestActionList[${i}].name is "AI Lead" — banned per operator rule (got: ${JSON.stringify(e.name)})`);
        }
      }
      if (e.kind !== "ghosted" && e.kind !== "stalled") {
        failures.push(`fastestActionList[${i}].kind must be 'ghosted' or 'stalled' (got ${JSON.stringify(e.kind)})`);
      }
      if (typeof e.subtext !== "string" || e.subtext.trim().length === 0) {
        failures.push(`fastestActionList[${i}].subtext must be non-empty`);
      }
      if (typeof e.ageLabel !== "string" || e.ageLabel.trim().length === 0) {
        failures.push(`fastestActionList[${i}].ageLabel must be non-empty`);
      }
      if (!["warehouse", "conversation", "phone_fallback", "inbound_fallback"].includes(e.nameSource as string)) {
        failures.push(`fastestActionList[${i}].nameSource invalid (got ${JSON.stringify(e.nameSource)})`);
      }
    }
  }

  // rev-5: kpiArrows — every direction must be one of "up" / "down" / "flat"
  if (!report.kpiArrows || typeof report.kpiArrows !== "object") {
    failures.push("kpiArrows must be an object with one arrow per KPI");
  } else {
    const arrowKeys: Array<keyof KpiArrows> = [
      "score",
      "leads",
      "ghosted",
      "over48h",
      "stalled",
      "inboundCalls",
      "notifications",
      "adfDeliveries",
      "automationTriggers",
    ];
    for (const k of arrowKeys) {
      const dir = (report.kpiArrows as any)[k];
      if (dir !== "up" && dir !== "down" && dir !== "flat") {
        failures.push(`kpiArrows.${String(k)} must be "up"/"down"/"flat" (got ${JSON.stringify(dir)})`);
      }
    }
  }

  // rev-5 + rev-6: priorWeek — every count must be a non-negative integer
  if (!report.priorWeek || typeof report.priorWeek !== "object") {
    failures.push("priorWeek must be a snapshot object");
  } else {
    const pwKeys: Array<keyof PriorWeekMetrics> = [
      "leads",
      "ghosted",
      "over48h",
      "stalled",
      "inboundCalls",
      "notifications",
      "adfDeliveries",
      "automationTriggers",
      "score",
      "lostBadLead", // rev-6
    ];
    for (const k of pwKeys) {
      const v = (report.priorWeek as any)[k];
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || !Number.isInteger(v)) {
        failures.push(`priorWeek.${String(k)} must be a non-negative integer (got ${JSON.stringify(v)})`);
      }
    }
  }

  // rev-5 / v8: leadsBySourceWinners — delta signs enforced. Needs Attention
  // validator removed with the card itself; Biggest Losers (below) now
  // carries the sole losses-side contract.
  if (!Array.isArray(report.leadsBySourceWinners)) {
    failures.push("leadsBySourceWinners must be an array");
  } else {
    for (let i = 0; i < report.leadsBySourceWinners.length; i += 1) {
      const w = report.leadsBySourceWinners[i];
      if (!w || typeof w !== "object" || typeof w.delta !== "number" || w.delta <= 0) {
        failures.push(`leadsBySourceWinners[${i}] must have delta > 0 (got ${JSON.stringify(w?.delta)})`);
      }
    }
  }

  // rev-5/rev-6: narrativeWeekSays — up to 5 chunks joined by blank line,
  // ≤220 words (rev-6 expanded from 120 to fit LOST_BAD_LEAD + stalled-def
  // paragraphs), no banned jargon, avg ≤20 words/sentence.
  if (typeof report.narrativeWeekSays !== "string" || report.narrativeWeekSays.trim().length === 0) {
    failures.push("narrativeWeekSays must be a non-empty string");
  } else {
    const words = report.narrativeWeekSays.trim().split(/\s+/).filter(Boolean);
    if (words.length > 220) {
      failures.push(`narrativeWeekSays is ${words.length} words — must be ≤220`);
    }
    // Paragraph count sanity — ≤5 chunks
    const chunks = report.narrativeWeekSays
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (chunks.length > 5) {
      failures.push(`narrativeWeekSays has ${chunks.length} chunks — must be ≤5`);
    }
    const lower = report.narrativeWeekSays.toLowerCase();
    for (const token of BANNED_PRIORITY_TOKENS) {
      if (lower.includes(token)) {
        failures.push(`narrativeWeekSays contains banned jargon token "${token}"`);
      }
    }
    const sentences = report.narrativeWeekSays
      .replace(/\n/g, " ")
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (sentences.length > 0) {
      const avg = words.length / sentences.length;
      if (avg > 20) {
        failures.push(`narrativeWeekSays avg words/sentence ${avg.toFixed(1)} — must be ≤20`);
      }
    }
  }

  // rev-5: narrativeWhatMoved — ≤60 words, no banned jargon, avg ≤20 w/s
  if (typeof report.narrativeWhatMoved !== "string" || report.narrativeWhatMoved.trim().length === 0) {
    failures.push("narrativeWhatMoved must be a non-empty string");
  } else {
    const words = report.narrativeWhatMoved.trim().split(/\s+/).filter(Boolean);
    if (words.length > 60) {
      failures.push(`narrativeWhatMoved is ${words.length} words — must be ≤60`);
    }
    const lower = report.narrativeWhatMoved.toLowerCase();
    for (const token of BANNED_PRIORITY_TOKENS) {
      if (lower.includes(token)) {
        failures.push(`narrativeWhatMoved contains banned jargon token "${token}"`);
      }
    }
    const sentences = report.narrativeWhatMoved
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (sentences.length > 0) {
      const avg = words.length / sentences.length;
      if (avg > 20) {
        failures.push(`narrativeWhatMoved avg words/sentence ${avg.toFixed(1)} — must be ≤20`);
      }
    }
  }

  // rev-5: simpleReadBullets + quickReadBullets — exactly 3 non-empty strings
  for (const label of ["simpleReadBullets", "quickReadBullets"] as const) {
    const arr = (report as any)[label];
    if (!Array.isArray(arr)) {
      failures.push(`${label} must be an array of 3 strings`);
      continue;
    }
    if (arr.length !== 3) {
      failures.push(`${label} must contain exactly 3 bullets (got ${arr.length})`);
    }
    for (let i = 0; i < arr.length; i += 1) {
      const b = arr[i];
      if (typeof b !== "string" || b.trim().length === 0) {
        failures.push(`${label}[${i}] must be a non-empty string`);
      }
    }
  }

  // rev-6: lostBadLeadCount — non-negative integer
  if (!intGE0((report as any).lostBadLeadCount)) {
    failures.push(`lostBadLeadCount must be a non-negative integer (got ${JSON.stringify((report as any).lostBadLeadCount)})`);
  }
  if (!intGE0((report as any).lostBadLeadPriorWeek)) {
    failures.push(`lostBadLeadPriorWeek must be a non-negative integer (got ${JSON.stringify((report as any).lostBadLeadPriorWeek)})`);
  }

  // rev-6: leadStatusBreakdown — every count non-negative integer
  const lsb = (report as any).leadStatusBreakdown;
  if (!lsb || typeof lsb !== "object") {
    failures.push("leadStatusBreakdown must be an object with 5 non-negative int counts");
  } else {
    for (const key of ["active", "sold", "lost", "bad", "complete"] as const) {
      const v = lsb[key];
      if (!intGE0(v)) {
        failures.push(`leadStatusBreakdown.${key} must be a non-negative integer (got ${JSON.stringify(v)})`);
      }
    }
  }

  // rev-6: Biggest Losers — ≤5 entries, each with negative delta
  if (!Array.isArray((report as any).leadsBySourceBiggestLosers)) {
    failures.push("leadsBySourceBiggestLosers must be an array");
  } else {
    const bl = (report as any).leadsBySourceBiggestLosers as LeadSourceTrend[];
    if (bl.length > 5) {
      failures.push(`leadsBySourceBiggestLosers has ${bl.length} entries — must be ≤5`);
    }
    for (let i = 0; i < bl.length; i += 1) {
      const n = bl[i];
      if (!n || typeof n !== "object" || typeof n.delta !== "number" || n.delta >= 0) {
        failures.push(`leadsBySourceBiggestLosers[${i}] must have delta < 0 (got ${JSON.stringify(n?.delta)})`);
      }
    }
  }

  // rev-6: priorWeek.lostBadLead — non-negative integer (already verified
  // via the top-level priorWeek loop above, but include an explicit check
  // here so it's caught even if the priorWeek object is missing keys).
  if (report.priorWeek && typeof report.priorWeek === "object") {
    const lbl = (report.priorWeek as any).lostBadLead;
    if (typeof lbl !== "number" || !Number.isFinite(lbl) || lbl < 0 || !Number.isInteger(lbl)) {
      failures.push(`priorWeek.lostBadLead must be a non-negative integer (got ${JSON.stringify(lbl)})`);
    }
  }

  // rev-6: testPhoneFilterStats — every count non-negative integer
  const tpf = (report as any).testPhoneFilterStats;
  if (!tpf || typeof tpf !== "object") {
    failures.push("testPhoneFilterStats must be an object");
  } else {
    for (const key of ["ghosted", "stalled", "statusBreakdown", "fastestAction"] as const) {
      const v = tpf[key];
      if (!intGE0(v)) {
        failures.push(`testPhoneFilterStats.${key} must be a non-negative integer (got ${JSON.stringify(v)})`);
      }
    }
  }

  // rev-6: Hard-fail if any rendered customer-list row carries a +1555 phone.
  // The builder filters these out before constructing ghostedLeads /
  // singleFollowupLeads, but this is a safety net in case a future change
  // drops the filter. We check the PHONE, not just the formatted string —
  // the formatted version strips the country code so a +1555 phone becomes
  // "(555) XXX-XXXX" which we'd miss on pattern alone.
  if (Array.isArray(report.ghostedLeads)) {
    for (let i = 0; i < report.ghostedLeads.length; i += 1) {
      const g = report.ghostedLeads[i];
      if (g && isTestPhone(g.customerPhone)) {
        failures.push(`ghostedLeads[${i}] has a +1555 test phone — must be filtered before render (got ${JSON.stringify(g.customerPhone)})`);
      }
    }
  }
  if (Array.isArray(report.singleFollowupLeads)) {
    for (let i = 0; i < report.singleFollowupLeads.length; i += 1) {
      const s = report.singleFollowupLeads[i];
      if (s && isTestPhone(s.customerPhone)) {
        failures.push(`singleFollowupLeads[${i}] has a +1555 test phone — must be filtered before render (got ${JSON.stringify(s.customerPhone)})`);
      }
    }
  }
  if (Array.isArray(report.fastestActionList)) {
    for (let i = 0; i < report.fastestActionList.length; i += 1) {
      const e = report.fastestActionList[i];
      if (e && isTestPhone(e.customerPhone)) {
        failures.push(`fastestActionList[${i}] has a +1555 test phone — must be filtered before render (got ${JSON.stringify(e.customerPhone)})`);
      }
    }
  }

  // rev-5: Every customer-list row must render a valid phone and a valid
  // age label. We validate the data that feeds the renderer by re-running
  // the formatters and checking the output pattern.
  const PHONE_PATTERN = /^(\(\d{3}\) \d{3}-\d{4}|\u2022\u2022\u2022 \d+|\(no phone\))$/;
  const GHOSTED_AGE_PATTERN = /^\d+[hd] old$/;
  const STALLED_AGE_PATTERN = /^\d+[hd] idle$/;

  if (Array.isArray(report.ghostedLeads)) {
    for (let i = 0; i < report.ghostedLeads.length; i += 1) {
      const g = report.ghostedLeads[i];
      if (!g) continue;
      const phoneFormatted = formatUsPhone(g.customerPhone);
      if (!PHONE_PATTERN.test(phoneFormatted)) {
        failures.push(`ghostedLeads[${i}] phone format invalid (got ${JSON.stringify(phoneFormatted)})`);
      }
      if (typeof g.ageHours !== "number" || !Number.isFinite(g.ageHours) || g.ageHours < 0) {
        failures.push(`ghostedLeads[${i}].ageHours must be a non-negative number`);
      } else {
        const label = ghostedAgeLabel(g.ageHours);
        if (!GHOSTED_AGE_PATTERN.test(label)) {
          failures.push(`ghostedLeads[${i}] age label invalid (got ${JSON.stringify(label)})`);
        }
      }
    }
  }
  if (Array.isArray(report.singleFollowupLeads)) {
    for (let i = 0; i < report.singleFollowupLeads.length; i += 1) {
      const s = report.singleFollowupLeads[i];
      if (!s) continue;
      const phoneFormatted = formatUsPhone(s.customerPhone);
      if (!PHONE_PATTERN.test(phoneFormatted)) {
        failures.push(`singleFollowupLeads[${i}] phone format invalid (got ${JSON.stringify(phoneFormatted)})`);
      }
      if (typeof s.hoursSinceLastActivity !== "number" || !Number.isFinite(s.hoursSinceLastActivity) || s.hoursSinceLastActivity < 0) {
        failures.push(`singleFollowupLeads[${i}].hoursSinceLastActivity must be a non-negative number`);
      } else {
        const label = stalledAgeLabel(s.hoursSinceLastActivity);
        if (!STALLED_AGE_PATTERN.test(label)) {
          failures.push(`singleFollowupLeads[${i}] age label invalid (got ${JSON.stringify(label)})`);
        }
      }
    }
  }

  // rev-4: scoreCardLines — each ≤90 chars, no banned jargon
  if (report.scoreCardLines && typeof report.scoreCardLines === "object") {
    const { mainIssueLine, whatToDoFirstLine } = report.scoreCardLines;
    for (const [label, line] of [
      ["mainIssueLine", mainIssueLine],
      ["whatToDoFirstLine", whatToDoFirstLine],
    ] as Array<["mainIssueLine" | "whatToDoFirstLine", unknown]>) {
      if (typeof line !== "string" || line.trim().length === 0) {
        failures.push(`scoreCardLines.${label} must be a non-empty string`);
        continue;
      }
      if (line.length > 90) {
        failures.push(`scoreCardLines.${label} is ${line.length} chars — must be ≤90`);
      }
      const lower = line.toLowerCase();
      for (const token of BANNED_PRIORITY_TOKENS) {
        if (lower.includes(token)) {
          failures.push(`scoreCardLines.${label} contains banned jargon token "${token}"`);
        }
      }
    }
  }

  // rev-4: Narrative reading-level sanity (only when non-placeholder, same
  // gate as the existing word-count check). Plain text, paragraph-separated
  // by blank line. Spec:
  //   - 4 to 5 paragraphs (inclusive)
  //   - 100-260 words total
  //   - avg words/sentence ≤ 20 (hard fail >25)
  //
  // These are sanity bounds, not a strict Flesch-Kincaid enforcement. The
  // prompt is authoritative; these check the output didn't drift.
  if (report.aiNarrative && report.aiNarrative !== PLACEHOLDER_NARRATIVE) {
    const paragraphs = report.aiNarrative
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (paragraphs.length < 4 || paragraphs.length > 5) {
      failures.push(`aiNarrative must have 4-5 paragraphs (got ${paragraphs.length})`);
    }
    const allWords = report.aiNarrative.trim().split(/\s+/).filter(Boolean);
    if (allWords.length < 100 || allWords.length > 260) {
      failures.push(`aiNarrative word count ${allWords.length} outside 100-260 range`);
    }
    // Average words per sentence — split by .!?
    const sentences = report.aiNarrative
      .replace(/\n/g, " ")
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (sentences.length > 0) {
      const avg = allWords.length / sentences.length;
      if (avg > 25) {
        failures.push(`aiNarrative average words/sentence is ${avg.toFixed(1)} — must be ≤25 for 6th-grade reading level`);
      }
    }
  }

  // Agent name required and non-empty
  if (typeof report.agentName !== "string" || report.agentName.trim().length === 0) {
    failures.push("agentName must be a non-empty string");
  }

  // Tone interstitial must match exactly
  if (report.toneInterstitial !== TONE_INTERSTITIAL) {
    failures.push(
      "Tone interstitial sentence does not match the required humble-tone line verbatim.",
    );
  }

  // Activity counts must be non-negative integers
  if (report.activity) {
    const activityFields: Array<keyof WeeklyActivitySummary> = [
      "inboundCalls",
      "leadsSynced",
      "adfDelivered",
      "triggersFired",
      "notificationsSent",
      "escalations",
    ];
    for (const af of activityFields) {
      const v = report.activity[af];
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || !Number.isInteger(v)) {
        failures.push(`activity.${af} must be a non-negative integer (got ${JSON.stringify(v)})`);
      }
    }
  }

  // leadsReceivedThisWeek is non-negative integer
  if (typeof report.leadsReceivedThisWeek !== "number" ||
      !Number.isFinite(report.leadsReceivedThisWeek) ||
      report.leadsReceivedThisWeek < 0 ||
      !Number.isInteger(report.leadsReceivedThisWeek)) {
    failures.push(`leadsReceivedThisWeek must be a non-negative integer (got ${JSON.stringify(report.leadsReceivedThisWeek)})`);
  }

  // Sales score in [0, 100]
  if (report.salesScore) {
    const s = report.salesScore.score;
    if (typeof s !== "number" || !Number.isFinite(s) || s < 0 || s > 100) {
      failures.push(`salesScore.score must be a number in [0, 100] (got ${JSON.stringify(s)})`);
    }
    if (typeof report.salesScore.commentary !== "string" || report.salesScore.commentary.trim().length === 0) {
      failures.push("salesScore.commentary must be a non-empty string");
    }
  }

  // Arrays must be arrays
  for (const listField of [
    "leadsBySource",
    "ghostedLeads",
    "singleFollowupLeads",
    "untouchedLeads",
    "priorities",
  ] as const) {
    if (!Array.isArray(report[listField])) {
      failures.push(`${listField} must be an array`);
    }
  }

  // Ghosted leads MUST have names (operator requirement — "Ghosted leads MUST have names")
  if (Array.isArray(report.ghostedLeads)) {
    // rev-3: ghosted entries MUST be week-scoped. Any entry older than
    // weekStart (or after weekEnd) is a hard fail — the v2 screenshots showed
    // 156d-old entries and the operator flagged this as ship-blocking.
    let weekStartMs = 0;
    let weekEndMs = 0;
    try {
      weekStartMs = new Date(report.weekStart).getTime();
      weekEndMs = new Date(report.weekEnd).getTime();
    } catch { /* handled by field-missing checks elsewhere */ }

    for (let i = 0; i < report.ghostedLeads.length; i += 1) {
      const g = report.ghostedLeads[i];
      if (!g || typeof g.customerName !== "string" || g.customerName.trim().length === 0) {
        failures.push(`ghostedLeads[${i}].customerName must be a non-empty string`);
      }
      // Week-scope check
      if (g && g.vinCreatedAt && weekStartMs > 0 && weekEndMs > 0) {
        const t = new Date(g.vinCreatedAt).getTime();
        if (Number.isFinite(t) && (t < weekStartMs || t > weekEndMs)) {
          failures.push(`ghostedLeads contain stale entries (outside week window): index ${i} has vinCreatedAt=${g.vinCreatedAt}, weekStart=${report.weekStart}, weekEnd=${report.weekEnd}`);
        }
      }
      // rev-3: vehicle string must not be a URL — the v2 renderer was leaking
      // the raw VIN API vehicle URL through. `formatVehicle()` in the service
      // rewrites these to "Vehicle not specified"; this guards the boundary.
      if (g && typeof g.vehicleOfInterest === "string" && /^https?:\/\//i.test(g.vehicleOfInterest)) {
        failures.push(`ghostedLeads[${i}].vehicleOfInterest is a raw URL — must be sanitized before shipping`);
      }
    }
  }

  // Single-followup leads MUST have names
  if (Array.isArray(report.singleFollowupLeads)) {
    for (let i = 0; i < report.singleFollowupLeads.length; i += 1) {
      const s = report.singleFollowupLeads[i];
      if (!s || typeof s.customerName !== "string" || s.customerName.trim().length === 0) {
        failures.push(`singleFollowupLeads[${i}].customerName must be a non-empty string`);
      }
      if (s && typeof s.vehicleOfInterest === "string" && /^https?:\/\//i.test(s.vehicleOfInterest)) {
        failures.push(`singleFollowupLeads[${i}].vehicleOfInterest is a raw URL — must be sanitized before shipping`);
      }
    }
  }

  // rev-3: priorities must be plain English — no banned jargon tokens.
  if (Array.isArray(report.priorities)) {
    for (let i = 0; i < report.priorities.length; i += 1) {
      const p = report.priorities[i];
      if (typeof p !== "string") continue;
      const lower = p.toLowerCase();
      for (const token of BANNED_PRIORITY_TOKENS) {
        if (lower.includes(token)) {
          failures.push(`priorities[${i}] contains banned jargon token "${token}" — use plain English (got: ${JSON.stringify(p)})`);
        }
      }
    }
  }

  // rev-3: lead source names must be resolved to human names. If MCP
  // succeeded (sourceResolutionFailed=false), > 30% fallback rows is a
  // hard fail. If MCP failed, full fallback is tolerated (outage guard).
  if (Array.isArray(report.leadsBySource) && report.leadsBySource.length > 0) {
    const fallbackCount = report.leadsBySource.filter(
      (s) => s && typeof s.name === "string" && /^VIN Source #\d+$/.test(s.name),
    ).length;
    const ratio = fallbackCount / report.leadsBySource.length;
    if (!report.sourceResolutionFailed && ratio > SOURCE_FALLBACK_MAX_RATIO) {
      failures.push(
        `${fallbackCount} of ${report.leadsBySource.length} lead source names fell back to "VIN Source #N" (${Math.round(ratio * 100)}% > ${Math.round(SOURCE_FALLBACK_MAX_RATIO * 100)}% threshold) — name resolution is broken`,
      );
    }
  }

  // leadsBySource entries have the right shape
  if (Array.isArray(report.leadsBySource)) {
    for (let i = 0; i < report.leadsBySource.length; i += 1) {
      const ls = report.leadsBySource[i];
      if (!ls || typeof ls.name !== "string" || ls.name.trim().length === 0) {
        failures.push(`leadsBySource[${i}].name must be a non-empty string`);
      }
      if (!ls || typeof ls.thisWeek !== "number" || ls.thisWeek < 0) {
        failures.push(`leadsBySource[${i}].thisWeek must be >= 0`);
      }
      if (!ls || typeof ls.priorWeek !== "number" || ls.priorWeek < 0) {
        failures.push(`leadsBySource[${i}].priorWeek must be >= 0`);
      }
      if (!ls || !["up", "down", "flat"].includes(ls.direction)) {
        failures.push(`leadsBySource[${i}].direction must be up/down/flat`);
      }
    }
  }

  // If aiNarrative is set and is NOT the placeholder, it must have >= 100 words
  // (confirms the LLM actually produced content — not a short stub).
  if (report.aiNarrative && report.aiNarrative !== PLACEHOLDER_NARRATIVE) {
    const wordCount = report.aiNarrative.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 100) {
      failures.push(`aiNarrative is too short (${wordCount} words; need at least 100 unless it's the documented placeholder).`);
    }
  }

  // Undefined/raw-error string sniff — check all string values in the report don't contain obvious garbage
  const badPatterns = [
    /\bundefined\b/i,
    /\[object Object\]/,
    /NaN/,
    /error:\s/i,
    /relation\s+".+"\s+does not exist/i,
    /column\s+".+"\s+does not exist/i,
  ];
  function scanStrings(obj: unknown, path: string): void {
    if (typeof obj === "string") {
      for (const p of badPatterns) {
        if (p.test(obj)) {
          failures.push(`Suspicious string at ${path}: matches /${p.source}/`);
        }
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((v, i) => scanStrings(v, `${path}[${i}]`));
    } else if (obj && typeof obj === "object") {
      for (const [k, v] of Object.entries(obj)) {
        scanStrings(v, path ? `${path}.${k}` : k);
      }
    }
  }
  scanStrings(report, "");

  return { ok: failures.length === 0, failures };
}

// ---------------------------------------------------------------------------
// renderWeeklyReportHtml — per-store email, inline-styled, email-safe
// ---------------------------------------------------------------------------

function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function arrowFor(direction: "up" | "down" | "flat"): { glyph: string; color: string } {
  if (direction === "up") return { glyph: "&uarr;", color: "#22c55e" };
  if (direction === "down") return { glyph: "&darr;", color: "#ef4444" };
  return { glyph: "&rarr;", color: "#94a3b8" };
}

/**
 * rev-5: Operator v5 layout. Translated to email-safe HTML.
 *
 * Layout:
 *   1. Hero (gradient) — title + store + attribution only. NO KPIs inside.
 *   2. KPI dashboard on WHITE body — score card (38% / 316px) +
 *      2x2 mini-tile grid (62% / 146px each). White cards with 2px
 *      purple border. Each tile has an arrow (gray) + a number (colored
 *      by semantic role).
 *   3. "What This Week Says" narrative card (3 chunks).
 *   4. PILL DIVIDER — "Lead Issues This Week".
 *   5. 4-chip row — No First Reply (black), 48+ Hours (blue),
 *      Stalled Leads (blue), Inbound Calls (black).
 *   6. PILL DIVIDER — "Customer Follow-Up Lists" (preceded by 1-line intro).
 *   7. 2-col customer lists — Ghosted Leads (name + phone + "Nh old"),
 *      Stalled After 1 Reply (name + phone + "Nh idle" / "Nd idle").
 *      Purple title bars on lavender #f8f5ff.
 *   8. "Simple Read" bullet card (3 rule-based bullets).
 *   9. PILL DIVIDER — "Lead Source Performance".
 *  10. 2-col sources — Winners vs Last Week (green header), Needs Attention
 *      (blue header).
 *  11. "What Moved" narrative card (1 short paragraph).
 *  12. PILL DIVIDER — "AI Actions".
 *  13. 3-chip row — Notifications Sent (green), ADF Deliveries (green),
 *      Automation Triggers (black or gray arrow if 0).
 *  14. "Quick Read on AI Activity" bullet card (3 bullets).
 *  15. Footer — humble tone + support email + Powered by.
 *
 * Email-safe notes (inherited from rev-4):
 *   - No CSS variables, no CSS Grid, no backdrop-filter, no <style> block
 *   - Nested <table role="presentation"> for all grid-like layouts
 *   - Hero gradient uses `background:` shorthand + `bgcolor=""` fallback
 *   - Arrows are HTML entities (&uarr; / &darr; / &rarr;)
 *   - Pill dividers are inline-block <div>s with border-radius:999px
 *   - Phone numbers go through formatUsPhone() before rendering
 */
export function renderWeeklyReportHtml(data: WeeklyReportData): string {
  // -----------------------------------------------------------------------
  // Palette — rev-5
  // -----------------------------------------------------------------------
  const heroStart = "#4f46e5";
  const heroMid = "#7c3aed";
  const heroEnd = "#9333ea";
  const heroFallback = "#4f46e5";

  const bodyBg = "#f3f6ff";             // outer page tint (mockup body)
  const shellBg = "#ffffff";             // outer shell background
  const shellBorder = "#dde6ff";         // outer shell border
  const cardBorderPurple = "#8b5cf6";    // 2px tile borders
  const cardBorderSoft = "#dbe4ff";      // soft card border
  const textInk = "#111827";             // neutral / volume numbers
  const textBlue = "#2563eb";            // attention-needed numbers
  const textGreen = "#16a34a";           // positive wins numbers
  const textMuted = "#6b7280";           // gray (arrows + subtext)
  const pillBg = "#f2ecff";              // divider pill bg
  const pillBorder = "#d8cbff";          // divider pill border
  const pillText = "#6d28d9";            // divider pill text
  const listTitleBg = "#f8f5ff";         // lavender title bar
  const listTitleText = "#5b21b6";

  // Arrow glyphs — rev-5 uses actual UTF-8 chars so the validator's
  // allow-list (↑/↓/→) can match them.
  function arrowGlyph(dir: ArrowDir): string {
    if (dir === "up") return "\u2191";
    if (dir === "down") return "\u2193";
    return "\u2192";
  }

  // -----------------------------------------------------------------------
  // Narrative blocks — rev-5 short versions
  // -----------------------------------------------------------------------
  const weekSaysHtml = data.narrativeWeekSays
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<div style="font-size:15px;line-height:1.7;color:#1f2937;">${esc(p)}</div>`)
    .join('<div style="height:14px;line-height:14px;">&nbsp;</div>');

  const whatMovedHtml = `<p style="margin:0;font-size:15px;line-height:1.7;color:#1f2937;">${esc(data.narrativeWhatMoved)}</p>`;

  // -----------------------------------------------------------------------
  // Pill divider
  // -----------------------------------------------------------------------
  function pillDivider(label: string): string {
    return `
      <tr>
        <td align="center" style="padding:14px 24px 10px 24px;background:#ffffff;">
          <div style="display:inline-block;padding:9px 14px;background:${pillBg};border:1px solid ${pillBorder};border-radius:999px;font-size:11px;letter-spacing:1.1px;text-transform:uppercase;color:${pillText};font-weight:800;">${esc(label)}</div>
        </td>
      </tr>`;
  }

  // -----------------------------------------------------------------------
  // Score card + mini-tile helpers
  // -----------------------------------------------------------------------
  // Big score card (left, 38% wide, 316px tall). White bg, 2px purple border.
  // Score number color = neutral black (#111827). Arrow gray.
  const scoreArrow = arrowGlyph(data.kpiArrows.score);
  const scoreCard = `
    <td valign="top" width="38%" style="padding:6px;">
      <div style="border:2px solid ${cardBorderPurple};background:#ffffff;border-radius:18px;padding:22px 22px;height:316px;box-sizing:border-box;">
        <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${pillText};font-weight:800;margin-bottom:6px;">Sales Team Score</div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:6px;">
          <tr>
            <td valign="middle" style="padding:0 10px 0 0;font-size:26px;line-height:1;color:${textMuted};font-weight:700;">${scoreArrow}</td>
            <td valign="middle" style="padding:0;">
              <span style="font-size:78px;line-height:0.95;font-weight:900;color:${textInk};letter-spacing:-0.04em;">${data.salesScore.score}</span>
              <span style="font-size:22px;line-height:1.1;font-weight:600;color:${textMuted};margin-left:6px;">/ 100</span>
            </td>
          </tr>
        </table>
        <div style="margin-top:18px;font-size:14px;line-height:1.6;color:${textInk};">
          <div><strong>Main issue:</strong> ${esc(data.scoreCardLines.mainIssueLine)}</div>
          <div style="margin-top:8px;"><strong>What to do first:</strong> ${esc(data.scoreCardLines.whatToDoFirstLine)}</div>
        </div>
      </div>
    </td>`;

  // Mini tile (146px tall) — arrow + number + label + sublabel.
  // numberColor is one of textInk / textBlue / textGreen.
  // v7: pass dir=null to render without an arrow (used for snapshot metrics
  // like "30-Day Active Leads" where week-over-week isn't meaningful).
  function miniTile(
    label: string,
    value: number | string,
    desc: string,
    dir: ArrowDir | null,
    numberColor: string,
  ): string {
    const arrowCell = dir
      ? `<td valign="middle" style="padding:0 8px 0 0;font-size:18px;line-height:1;color:${textMuted};font-weight:700;">${arrowGlyph(dir)}</td>`
      : "";
    return `
      <td valign="top" width="50%" style="padding:6px;">
        <div style="border:2px solid ${cardBorderPurple};background:#ffffff;border-radius:16px;padding:14px 16px;height:146px;box-sizing:border-box;">
          <div style="font-size:10px;letter-spacing:1.1px;text-transform:uppercase;color:${pillText};font-weight:800;margin-bottom:6px;">${esc(label)}</div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              ${arrowCell}
              <td valign="middle" style="padding:0;font-size:50px;line-height:1;font-weight:900;color:${numberColor};letter-spacing:-0.03em;">${esc(String(value))}</td>
            </tr>
          </table>
          <div style="margin-top:10px;font-size:12px;line-height:1.4;color:${textMuted};">${esc(desc)}</div>
        </div>
      </td>`;
  }

  // -----------------------------------------------------------------------
  // 4-chip row: "Lead Issues This Week"
  //   No First Reply (black) | 48+ Hours (blue) | Stalled Leads (blue) | Inbound Calls (black)
  //   138px tall per mockup
  // -----------------------------------------------------------------------
  function chipTile(
    label: string,
    value: number,
    dir: ArrowDir,
    numberColor: string,
  ): string {
    return `
      <td valign="top" width="25%" style="padding:6px;">
        <div style="border:2px solid ${cardBorderPurple};background:#ffffff;border-radius:14px;padding:14px;height:138px;box-sizing:border-box;">
          <div style="font-size:10px;letter-spacing:1.1px;text-transform:uppercase;color:${pillText};font-weight:800;margin-bottom:8px;">${esc(label)}</div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td valign="middle" style="padding:0 7px 0 0;font-size:16px;line-height:1;color:${textMuted};font-weight:700;">${arrowGlyph(dir)}</td>
              <td valign="middle" style="padding:0;font-size:38px;line-height:1;font-weight:900;color:${numberColor};letter-spacing:-0.03em;">${value}</td>
            </tr>
          </table>
        </div>
      </td>`;
  }

  const leadIssuesRow = `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;">
      <tr>
        ${chipTile("No First Reply", data.ghostedLeads.length, data.kpiArrows.ghosted, textInk)}
        ${chipTile("48+ Hours", data.over48hCount, data.kpiArrows.over48h, textBlue)}
        ${chipTile("Stalled Leads", data.singleFollowupLeads.length, data.kpiArrows.stalled, textBlue)}
        ${chipTile("Inbound Calls", data.activity.inboundCalls, data.kpiArrows.inboundCalls, textInk)}
      </tr>
    </table>`;

  // -----------------------------------------------------------------------
  // Customer follow-up lists: 2 columns, 5 rows each
  //   Left: Ghosted Leads — name + (XXX) XXX-XXXX + "Nh old" / "Nd old"
  //   Right: Stalled After 1 Reply — name + phone + "Nh idle" / "Nd idle"
  // -----------------------------------------------------------------------
  const CUSTOMER_LIST_CAP = 5;

  function customerListCard(title: string, rowsHtml: string, emptyLine: string): string {
    return `
      <td valign="top" width="50%" style="padding:6px;">
        <div style="border:2px solid ${cardBorderPurple};background:#ffffff;border-radius:16px;overflow:hidden;">
          <div style="padding:12px 16px;background:${listTitleBg};border-bottom:1px solid ${cardBorderSoft};">
            <h3 style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1.1px;color:${listTitleText};font-weight:800;">${esc(title)}</h3>
          </div>
          <div style="padding:6px 16px 14px 16px;">
            ${rowsHtml || `<p style="margin:12px 0;font-size:13px;color:${textMuted};">${esc(emptyLine)}</p>`}
          </div>
        </div>
      </td>`;
  }

  const ghostedRows = data.ghostedLeads.slice(0, CUSTOMER_LIST_CAP).map((g) => {
    const phone = formatUsPhone(g.customerPhone);
    const age = ghostedAgeLabel(g.ageHours);
    return `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #edf2ff;vertical-align:top;">
          <div style="font-size:14px;color:${textInk};font-weight:700;line-height:1.3;">${esc(g.customerName)}</div>
          <div style="margin-top:2px;font-size:12px;color:${textMuted};line-height:1.4;">${esc(phone)}</div>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #edf2ff;vertical-align:top;text-align:right;white-space:nowrap;font-size:13px;color:${textMuted};font-weight:600;width:80px;">${esc(age)}</td>
      </tr>`;
  }).join("");
  const ghostedTable = ghostedRows
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${ghostedRows}</table>`
    : "";
  const ghostedMore = Math.max(0, data.ghostedLeads.length - CUSTOMER_LIST_CAP);
  const ghostedFooter = ghostedMore > 0
    ? `<p style="margin:10px 0 0 0;font-size:12px;color:${textMuted};">+ ${ghostedMore} more not shown.</p>`
    : "";
  const namelessFooter = data.droppedNamelessGhostedCount > 0
    ? `<p style="margin:10px 0 0 0;padding-top:8px;border-top:1px dashed ${cardBorderSoft};font-size:11px;color:${textMuted};font-style:italic;line-height:1.5;">+ ${data.droppedNamelessGhostedCount} lead${data.droppedNamelessGhostedCount === 1 ? "" : "s"} had no customer name on file.</p>`
    : "";

  const stalledRows = data.singleFollowupLeads.slice(0, CUSTOMER_LIST_CAP).map((s) => {
    const phone = formatUsPhone(s.customerPhone);
    const age = stalledAgeLabel(s.hoursSinceLastActivity);
    return `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #edf2ff;vertical-align:top;">
          <div style="font-size:14px;color:${textInk};font-weight:700;line-height:1.3;">${esc(s.customerName)}</div>
          <div style="margin-top:2px;font-size:12px;color:${textMuted};line-height:1.4;">${esc(phone)}</div>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #edf2ff;vertical-align:top;text-align:right;white-space:nowrap;font-size:13px;color:${textMuted};font-weight:600;width:80px;">${esc(age)}</td>
      </tr>`;
  }).join("");
  const stalledTable = stalledRows
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${stalledRows}</table>`
    : "";
  const stalledMore = Math.max(0, data.singleFollowupLeads.length - CUSTOMER_LIST_CAP);
  const stalledFooter = stalledMore > 0
    ? `<p style="margin:10px 0 0 0;font-size:12px;color:${textMuted};">+ ${stalledMore} more not shown.</p>`
    : "";

  // -----------------------------------------------------------------------
  // Lead Source Performance — 2 columns (Winners / Biggest Losers)
  //
  // v8: "vs ±N" column removed. The trailing column now renders a single
  // colored `↑N` (winners, green) or `↓N` (losers, red) token. Arrow and
  // number share the same color — no gray arrow, no "vs" text.
  // -----------------------------------------------------------------------
  const winnerGreen = "#16a34a";  // green arrow+delta for Winners
  const loserRed = "#dc2626";     // red arrow+delta for Biggest Losers

  function sourceRow(ls: LeadSourceTrend, mode: "winner" | "loser"): string {
    const absDelta = Math.abs(ls.delta);
    const color = mode === "winner" ? winnerGreen : loserRed;
    // Arrow + delta share the same color; no "vs" wording, no "+" sign.
    const arrow = mode === "winner" ? "\u2191" : "\u2193";
    const tokenHtml = ls.delta === 0
      ? `<span style="color:${textMuted};">no change</span>`
      : `<span style="color:${color};">${arrow}${absDelta}</span>`;
    return `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #edf2ff;font-size:14px;color:${textInk};font-weight:600;">${esc(ls.name)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #edf2ff;font-size:14px;color:${textInk};font-weight:700;text-align:right;width:54px;">${ls.thisWeek}</td>
        <td style="padding:8px 0;border-bottom:1px solid #edf2ff;font-size:13px;font-weight:800;text-align:right;white-space:nowrap;width:64px;">${tokenHtml}</td>
      </tr>`;
  }

  const winnersRows = data.leadsBySourceWinners
    .map((w) => sourceRow(w, "winner"))
    .join("");
  // rev-6: Biggest Losers (top 5). v8: red theme.
  const biggestLosersRows = data.leadsBySourceBiggestLosers
    .map((n) => sourceRow(n, "loser"))
    .join("");

  function sourceCard(title: string, titleBg: string, titleTextColor: string, rowsHtml: string): string {
    return `
      <td valign="top" width="50%" style="padding:6px;">
        <div style="border:2px solid ${cardBorderPurple};background:#ffffff;border-radius:16px;overflow:hidden;">
          <div style="padding:12px 16px;background:${titleBg};border-bottom:1px solid ${cardBorderSoft};">
            <h3 style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1.1px;color:${titleTextColor};font-weight:800;">${esc(title)}</h3>
          </div>
          <div style="padding:6px 16px 14px 16px;">
            ${rowsHtml
              ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${rowsHtml}</table>`
              : `<p style="margin:12px 0;font-size:13px;color:${textMuted};">No notable movement this week.</p>`}
          </div>
        </div>
      </td>`;
  }

  // -----------------------------------------------------------------------
  // AI Actions — 3 chips (Notifications / ADF / Automation Triggers)
  // -----------------------------------------------------------------------
  function aiChipTile(
    label: string,
    value: number,
    dir: ArrowDir,
    numberColor: string,
  ): string {
    return `
      <td valign="top" width="33%" style="padding:6px;">
        <div style="border:2px solid ${cardBorderPurple};background:#ffffff;border-radius:14px;padding:14px;height:138px;box-sizing:border-box;">
          <div style="font-size:10px;letter-spacing:1.1px;text-transform:uppercase;color:${pillText};font-weight:800;margin-bottom:8px;">${esc(label)}</div>
          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td valign="middle" style="padding:0 7px 0 0;font-size:16px;line-height:1;color:${textMuted};font-weight:700;">${arrowGlyph(dir)}</td>
              <td valign="middle" style="padding:0;font-size:38px;line-height:1;font-weight:900;color:${numberColor};letter-spacing:-0.03em;">${value}</td>
            </tr>
          </table>
        </div>
      </td>`;
  }

  // Color rules:
  //   - Notifications ≥ threshold → green; 0 → black
  //   - ADF ≥ 1 → green; 0 → black
  //   - Automation Triggers: 0 → black (gray arrow already); > 0 → black
  //     (operator rule: "black if 0, gray arrow")
  const NOTIFICATION_HIGH = 50;
  const notifColor = data.activity.notificationsSent >= NOTIFICATION_HIGH ? textGreen : textInk;
  const adfColor = data.adfDeliveries > 0 ? textGreen : textInk;
  const autoColor = textInk;

  const aiActionsRow = `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;">
      <tr>
        ${aiChipTile("Notifications Sent", data.activity.notificationsSent, data.kpiArrows.notifications, notifColor)}
        ${aiChipTile("ADF Deliveries", data.adfDeliveries, data.kpiArrows.adfDeliveries, adfColor)}
        ${aiChipTile("Automation Triggers", data.automationTriggers, data.kpiArrows.automationTriggers, autoColor)}
      </tr>
    </table>`;

  // -----------------------------------------------------------------------
  // Bullet cards — Simple Read + Quick Read
  // -----------------------------------------------------------------------
  function bulletCard(title: string, bullets: string[]): string {
    const items = bullets.map((b) => `
      <tr>
        <td valign="top" style="padding:4px 8px 4px 0;font-size:15px;line-height:1.55;color:${pillText};font-weight:800;">&bull;</td>
        <td valign="top" style="padding:4px 0;font-size:15px;line-height:1.6;color:#1f2937;">${esc(b)}</td>
      </tr>`).join("");
    return `
      <div style="border:1px solid ${cardBorderSoft};background:#ffffff;border-radius:18px;padding:18px 22px;">
        <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${pillText};font-weight:800;margin-bottom:10px;">${esc(title)}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${items}</table>
      </div>`;
  }

  // -----------------------------------------------------------------------
  // Final HTML
  // -----------------------------------------------------------------------
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Dealership Performance Analysis &mdash; ${esc(data.orgName)}</title>
</head>
<body style="margin:0;padding:0;background-color:${bodyBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:${textInk};">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background-color:${bodyBg};">
    <tr>
      <td align="center" style="padding:28px 14px 0 14px;">
        <!-- ============ rev-6 DRAFT watermark banner (OUTSIDE the shell) ============ -->
        <div style="max-width:860px;width:100%;margin:0 auto 14px auto;text-align:center;font-size:11px;letter-spacing:1.3px;color:${DRAFT_BANNER_COLOR};font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${esc(DRAFT_BANNER_TEXT)}</div>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:0 14px 28px 14px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="860" style="width:100%;max-width:860px;background:${shellBg};border:1px solid ${shellBorder};border-radius:22px;overflow:hidden;box-shadow:0 10px 28px rgba(79,70,229,0.08);">

          <!-- ============ HERO — rev-6 store-name PRIMARY, CONFIDENTIAL badge ============ -->
          <tr>
            <td bgcolor="${heroFallback}" style="background-color:${heroStart};background:linear-gradient(135deg,${heroStart} 0%,${heroMid} 52%,${heroEnd} 100%);padding:30px 28px 26px 28px;color:#ffffff;">
              <!-- Eyebrow row with CONFIDENTIAL badge right-justified -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:10px;">
                <tr>
                  <td align="left" style="font-size:11px;letter-spacing:1.3px;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,0.88);">Weekly Store Report</td>
                  <td align="right" style="font-size:11px;letter-spacing:1.3px;text-transform:uppercase;font-weight:800;color:${CONFIDENTIAL_BADGE_COLOR};">${esc(CONFIDENTIAL_BADGE_TEXT)}</td>
                </tr>
              </table>
              <!-- Store name is PRIMARY (big/bold) -->
              <div style="font-size:30px;line-height:1.1;font-weight:800;letter-spacing:-0.02em;color:#ffffff;">${esc(data.orgName)}</div>
              <!-- "AI Dealership Performance Analysis" is SECONDARY (smaller, lighter weight) -->
              <div style="margin-top:6px;font-size:15px;line-height:1.4;font-weight:500;color:rgba(255,255,255,0.92);">AI Dealership Performance Analysis</div>
              <div style="margin-top:10px;font-size:13px;line-height:1.55;color:rgba(255,255,255,0.92);">
                Week ending ${fmtDate(data.weekEnd)} &middot; Prepared by ${esc(data.agentName)} (AI Agent)
              </div>
            </td>
          </tr>

          <!-- ============ KPI DASHBOARD (score + 2x2 grid) ============ -->
          <tr>
            <td style="padding:18px 18px 6px 18px;background:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;">
                <tr>
                  ${scoreCard}
                  <td valign="top" width="62%" style="padding:6px 0 6px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;">
                      <tr>
                        ${miniTile(
                          data.salesFilterActive ? "Sales Leads This Week" : "Leads This Week",
                          data.leadsReceivedThisWeek,
                          data.salesFilterActive
                            ? "New sales leads that came into VIN Solutions"
                            : "New leads that came into VIN Solutions",
                          data.kpiArrows.leads,
                          textInk,
                        )}
                        ${miniTile("Ghosted Leads", data.ghostedLeads.length, "No first reply yet", data.kpiArrows.ghosted, textInk)}
                      </tr>
                      <tr>
                        ${miniTile("Over 48 Hours", data.over48hCount, "Waiting more than 2 days", data.kpiArrows.over48h, textBlue)}
                        ${miniTile("30-Day Active Leads", data.score30DayActive, "Live leads that came into the system in the last 30 days", null, textInk)}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============ What This Week Says ============ -->
          <tr>
            <td style="padding:10px 24px 8px 24px;background:#ffffff;">
              <div style="border:1px solid ${cardBorderSoft};background:#ffffff;border-radius:18px;padding:20px 22px;">
                <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${pillText};font-weight:800;margin-bottom:10px;">What This Week Says</div>
                ${weekSaysHtml}
              </div>
            </td>
          </tr>

          <!-- ============ DIVIDER: Lead Issues This Week ============ -->
          ${pillDivider("Lead Issues This Week")}

          <!-- ============ 4-chip row ============ -->
          <tr>
            <td style="padding:2px 18px 8px 18px;background:#ffffff;">
              ${leadIssuesRow}
            </td>
          </tr>

          <!-- ============ Intro line for customer lists ============ -->
          <tr>
            <td style="padding:12px 24px 2px 24px;background:#ffffff;">
              <div style="border:1px solid ${cardBorderSoft};background:#ffffff;border-radius:14px;padding:12px 18px;font-size:13px;line-height:1.55;color:${textMuted};">
                These are the specific customers who need the next touch this week.
              </div>
            </td>
          </tr>

          <!-- ============ DIVIDER: Customer Follow-Up Lists ============ -->
          ${pillDivider("Customer Follow-Up Lists")}

          <!-- ============ v8 Customer Follow-Up zone — clean 2-col ============
               Left: Ghosted Leads
               Right: Stalled After 1 Reply
               (v8 removed the stacked lead-source losses card per operator.)
          ====================================================== -->
          <tr>
            <td style="padding:2px 18px 8px 18px;background:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;">
                <tr>
                  ${customerListCard(
                    "Ghosted Leads",
                    ghostedTable + ghostedFooter + namelessFooter,
                    "No ghosted leads this week. Good coverage.",
                  )}
                  ${customerListCard(
                    "Stalled After 1 Reply",
                    stalledTable + stalledFooter,
                    "No stalled leads this week.",
                  )}
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============ Simple Read (bullet card) ============ -->
          <tr>
            <td style="padding:10px 24px 8px 24px;background:#ffffff;">
              ${bulletCard("Simple Read", data.simpleReadBullets)}
            </td>
          </tr>

          <!-- ============ DIVIDER: Lead Source Performance ============ -->
          ${pillDivider("Lead Source Performance")}

          <!-- ============ rev-6 Sources: Winners vs Biggest Losers (top 5) ============ -->
          <tr>
            <td style="padding:2px 18px 8px 18px;background:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;">
                <tr>
                  ${sourceCard("Winners vs Last Week", "#f0fdf4", "#15803d", winnersRows)}
                  ${sourceCard("Biggest Losers — Top 5 Drops vs Last Week", "#fef2f2", "#dc2626", biggestLosersRows)}
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============ What Moved ============ -->
          <tr>
            <td style="padding:10px 24px 8px 24px;background:#ffffff;">
              <div style="border:1px solid ${cardBorderSoft};background:#ffffff;border-radius:18px;padding:20px 22px;">
                <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${pillText};font-weight:800;margin-bottom:10px;">What Moved</div>
                ${whatMovedHtml}
              </div>
            </td>
          </tr>

          <!-- ============ DIVIDER: AI Actions ============ -->
          ${pillDivider("AI Actions")}

          <!-- ============ AI Actions 3-chip row ============ -->
          <tr>
            <td style="padding:2px 18px 8px 18px;background:#ffffff;">
              ${aiActionsRow}
            </td>
          </tr>

          <!-- ============ rev-6 DIVIDER: Lead Status ============ -->
          ${pillDivider("Lead Status")}

          <!-- ============ rev-6 Lead Status Breakdown ============ -->
          <tr>
            <td style="padding:2px 18px 8px 18px;background:#ffffff;">
              <!-- Featured LOST_BAD_LEAD card -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;margin-bottom:8px;">
                <tr>
                  <td valign="top" style="padding:6px;">
                    <div style="border:2px solid ${cardBorderPurple};background:#ffffff;border-radius:16px;padding:18px 22px;">
                      <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${pillText};font-weight:800;margin-bottom:6px;">Lost - Bad Lead (this week)</div>
                      <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                        <tr>
                          <td valign="middle" style="padding:0 10px 0 0;font-size:20px;line-height:1;color:${textMuted};font-weight:700;">${arrowGlyph(computeArrowDir(data.lostBadLeadCount, data.lostBadLeadPriorWeek))}</td>
                          <td valign="middle" style="padding:0;font-size:54px;line-height:1;font-weight:900;color:${textBlue};letter-spacing:-0.03em;">${data.lostBadLeadCount}</td>
                          <td valign="middle" style="padding:0 0 0 14px;font-size:13px;color:${textMuted};line-height:1.4;">Prior week: ${data.lostBadLeadPriorWeek}</td>
                        </tr>
                      </table>
                      <div style="margin-top:10px;font-size:13px;line-height:1.5;color:${textMuted};">Leads marked as lost + bad quality this week.</div>
                    </div>
                  </td>
                </tr>
              </table>
              <!-- Secondary chip row: 5 types -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;">
                <tr>
                  ${[
                    ["Active", data.leadStatusBreakdown.active],
                    ["Sold", data.leadStatusBreakdown.sold],
                    ["Lost", data.leadStatusBreakdown.lost],
                    ["Bad", data.leadStatusBreakdown.bad],
                    ["Complete", data.leadStatusBreakdown.complete],
                  ].map(([label, value]) => `
                    <td valign="top" width="20%" style="padding:6px;">
                      <div style="border:1px solid ${cardBorderSoft};background:#ffffff;border-radius:12px;padding:12px 10px;text-align:center;">
                        <div style="font-size:9px;letter-spacing:1.1px;text-transform:uppercase;color:${pillText};font-weight:800;margin-bottom:6px;">${esc(String(label))}</div>
                        <div style="font-size:26px;line-height:1;font-weight:900;color:${textInk};letter-spacing:-0.03em;">${value}</div>
                      </div>
                    </td>
                  `).join("")}
                </tr>
              </table>
            </td>
          </tr>

          <!-- ============ Quick Read on AI Activity ============ -->
          <tr>
            <td style="padding:10px 24px 14px 24px;background:#ffffff;">
              ${bulletCard("Quick Read on AI Activity", data.quickReadBullets)}
            </td>
          </tr>

          <!-- ============ v7 Formula transparency footer ============ -->
          <tr>
            <td style="font-size:11px; color:#9ca3af; line-height:1.5; padding:12px 22px; text-align:left; background:#ffffff;">
              Sales Team Score is calculated as 100 minus 0.5 points per ghosted lead and 1 point per lead waiting over 48 hours, with a floor of 0. The formula is tuned over time as we learn what drives real sales outcomes.
            </td>
          </tr>

          <!-- ============ Tone interstitial ============ -->
          <tr>
            <td style="padding:6px 24px 14px 24px;background:#ffffff;">
              <div style="padding:12px 16px;background:#faf5ff;border:1px solid ${cardBorderSoft};border-radius:12px;">
                <p style="margin:0;font-size:13px;color:#555;line-height:1.55;font-style:italic;">${esc(data.toneInterstitial)}</p>
              </div>
            </td>
          </tr>

          <!-- ============ FOOTER ============ -->
          <tr>
            <td style="padding:14px 24px 22px 24px;background:#ffffff;color:${textMuted};font-size:13px;line-height:1.55;">
              I'm still learning your store. Feedback will help improve the next report.<br>
              Questions or issues? Contact <a href="mailto:support@huminic.ai" style="color:${pillText};text-decoration:none;">support@huminic.ai</a><br>
              <span style="font-size:11px;color:#999;">Powered by Nexxus AI Platform</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// generateAiNarrative — rev-4: 6th-grade, 4-5 short paragraphs
//
// Operator sample (Ford of Columbia):
//   You got 439 new leads this week. But 56 of them still have not heard
//   from anyone. That means a lot of people asked about a car and got no
//   answer.
//
//   Out of those 56, 41 have been waiting more than two days. That is the
//   biggest problem in the store right now. The longer people wait, the
//   more likely they are to leave and buy somewhere else.
//
//   The team score is 30 out of 100. The score is low mostly because too
//   many leads did not get a first reply. The system also shows no ADF
//   deliveries and no trigger activity, so automation is not helping cover
//   the gap.
//
//   There are also 3 leads that got one reply but then no more follow-up.
//   That means the first touch happened, but the conversation did not keep
//   moving.
//
//   The good news is customers did call in. You had 6 inbound calls and
//   6 notifications sent. That shows the store can respond. Now the goal
//   is to put that same energy into outbound follow-up.
//
// Spec:
//   - 4 to 5 short paragraphs
//   - ~150-220 words total
//   - Short sentences (mostly ≤15 words, avg ≤20)
//   - Direct second-person ("You got…", "Your team…")
//   - No jargon: "follow up" (noun), "outreach", "ghosted", "recipients",
//     "workflow". The builder's priorities + score lines already avoid
//     these, so the narrative is the last place they might slip in.
//     BANNED_PRIORITY_TOKENS is the single source of truth — see prompt.
// ---------------------------------------------------------------------------

const OPERATOR_SAMPLE_NARRATIVE_V4 = `You got 439 new leads this week. But 56 of them still have not heard from anyone. That means a lot of people asked about a car and got no answer.

Out of those 56, 41 have been waiting more than two days. That is the biggest problem in the store right now. The longer people wait, the more likely they are to leave and buy somewhere else.

The team score is 30 out of 100. The score is low mostly because too many leads did not get a first reply. The system also shows no ADF deliveries and no trigger activity, so automation is not helping cover the gap.

There are also 3 leads that got one reply but then no more follow-up. That means the first touch happened, but the conversation did not keep moving.

The good news is customers did call in. You had 6 inbound calls and 6 notifications sent. That shows the store can respond. Now the goal is to put that same energy into outbound follow-up.`;

export async function generateAiNarrative(
  report: WeeklyReportData,
  opts: { timeoutMs?: number } = {},
): Promise<string> {
  const timeoutMs = opts.timeoutMs ?? 25_000;

  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!apiKey) {
    return PLACEHOLDER_NARRATIVE;
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({
      apiKey,
      baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
    });

    // Structured data object for the model
    const condensed = {
      orgName: report.orgName,
      weekStart: report.weekStart,
      weekEnd: report.weekEnd,
      leadsReceivedThisWeek: report.leadsReceivedThisWeek,
      ghostedLeadCount: report.ghostedLeads.length,
      over48hCount: report.over48hCount,
      stalledLeadCount: report.singleFollowupLeads.length,
      salesScore: report.salesScore.score,
      inboundCalls: report.activity.inboundCalls,
      notificationsSent: report.activity.notificationsSent,
      adfDeliveries: report.adfDeliveries,
      automationTriggers: report.automationTriggers,
    };

    // Per the operator: "follow-up" (as a noun) is banned in priorities and
    // score lines but IS permitted in narrative sentences where it reads as
    // a verb phrase or where "no more follow-up" is the only way to express
    // "the conversation did not keep moving". We keep the narrative-level
    // validator tolerant of it (it only enforces length/paragraphs/sentence
    // avg), and rely on the prompt + sample to hold the line on "outreach",
    // "ghosted", "recipients", "workflow" — which ARE banned outright.
    //
    // Phrase the banned-token list to the model explicitly.
    const system =
      "You write 4 to 5 very short paragraphs for a dealership weekly report. " +
      "The reader is a dealer manager who is not technical. Target a 6th-grade reading level. " +
      "Use short sentences (mostly under 15 words). Use direct second-person voice ('You got...', 'Your team...'). " +
      "Do NOT use these jargon words: 'outreach', 'ghosted', 'recipients', 'workflow'. Say 'no reply yet' or 'no first reply' instead of 'ghosted'. Say 'leads' or 'customers' instead of 'recipients'. " +
      "Do NOT say 'subset above' or 'as mentioned'. Do NOT use exclamation marks. Do NOT use superlatives or hype. " +
      "Cover these 5 points, in order: (1) how many leads came in, (2) the biggest gap or concern using real counts, (3) the team score and why it is where it is, (4) stalled leads that got one reply then nothing, (5) a positive signal from the activity side. " +
      "Aim for 150-220 words total, split across 4 to 5 paragraphs. Plain prose only. No bullets, no headers, no markdown. Separate each paragraph with a blank line. " +
      "Here is the tone and pacing to match exactly:\n\n" +
      OPERATOR_SAMPLE_NARRATIVE_V4;

    const user = `Weekly numbers for ${report.orgName}:\n${JSON.stringify(condensed, null, 2)}\n\nWrite the 4-5 short paragraphs now, using these real numbers. Keep sentences short.`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system,
      messages: [{ role: "user", content: user }],
    }, { signal: controller.signal });
    clearTimeout(timer);

    const block = resp.content.find((b: any) => b.type === "text") as { type: "text"; text: string } | undefined;
    const text = block?.text?.trim();
    if (!text) return PLACEHOLDER_NARRATIVE;
    return text;
  } catch (err) {
    console.warn(`[weeklyReport] AI narrative generation failed for ${report.orgName}:`, (err as Error).message);
    return PLACEHOLDER_NARRATIVE;
  }
}

// ===========================================================================
// Production send pipeline — TRG-RPT-001 Phase D (Monday 7am scheduler)
// ===========================================================================
//
// Extracted from tests/integration/weeklyReport.send-live.test.ts so the
// scheduler and the integration test share a single source of truth for:
//   - Recipient routing (To: org_admins, Cc: partner_admin, Bcc: operator)
//   - Test/seed email filter
//   - HALT checks (6 validations before any send)
//   - The end-to-end send flow (build → narrative → validate → render → send)
//
// No behavior changes vs the integration test — same deterministic policy,
// same filter patterns, same Bcc fallback.

/**
 * Explicit test email addresses to exclude from production sends.
 * These are humans who DO exist but should NOT receive the customer-facing
 * email (operator / internal accounts).
 */
export const TEST_EMAIL_ADDRESSES = new Set<string>([
  // Operator's own partner_admin account at Cage Automotive. Operator
  // receives the report via Bcc (SAFETY_NET) — not via Cc.
  "duanekwells@gmail.com",
  // Operator's test org_admin account at Serra Honda.
  "neoweaver@gmail.com",
]);

/**
 * Email domain patterns to exclude from production sends. Matches against
 * the full email (lowercased, trimmed).
 */
export const TEST_EMAIL_DOMAIN_PATTERNS: RegExp[] = [
  /@huminic\.ai$/i,
];

/**
 * Seed-data email patterns left over from fixtures/demos.
 */
export const SEED_EMAIL_PATTERNS: RegExp[] = [
  /^orgadmin@/i,
  /@serrahonda\.com$/i,
];

/** Operator safety-net Bcc — first production cycles only. */
export const SAFETY_NET_BCC_EMAIL = "duane.wells@huminic.ai";

/**
 * Returns true if `email` matches any excluded pattern and should NOT receive
 * a production send. Applied to BOTH To: and Cc:. Not applied to Bcc: —
 * the operator safety-net intentionally survives.
 */
export function isTestOrSeedEmail(email: string | null | undefined): boolean {
  const e = (email || "").trim().toLowerCase();
  if (!e) return true;
  if (TEST_EMAIL_ADDRESSES.has(e)) return true;
  if (TEST_EMAIL_DOMAIN_PATTERNS.some((r) => r.test(e))) return true;
  if (SEED_EMAIL_PATTERNS.some((r) => r.test(e))) return true;
  return false;
}

export interface OrgRoutingExclusion {
  email: string;
  reason: string;
}

export interface OrgRouting {
  orgId: string;
  orgName: string;
  to: string[];
  cc: string[];
  bcc: string[];
  toExcluded: OrgRoutingExclusion[];
  ccExcluded: OrgRoutingExclusion[];
}

/**
 * Build the To/Cc/Bcc routing for one store using drizzle's `db` connection.
 *
 * - To: all active `org_admin` users associated with the org (primary
 *   organization_id OR this orgId present in additional_org_ids), with
 *   `isTestOrSeedEmail()` excluded.
 * - Cc: all active `partner_admin` users at the store's partner org, with
 *   `isTestOrSeedEmail()` excluded.
 * - Bcc: SAFETY_NET_BCC_EMAIL unless safetyBcc is explicitly null/"".
 */
export async function resolveOrgRouting(
  org: { id: string; name: string; partnerId: string | null },
  opts: { safetyBcc?: string | null } = {},
): Promise<OrgRouting> {
  const toRes = await db.execute(sql`
    SELECT u.email, u.is_active, u.organization_id, u.additional_org_ids
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'org_admin'
      AND u.is_active = true
      AND (u.organization_id = ${org.id} OR u.additional_org_ids ? ${org.id})
  `);

  const toKept: string[] = [];
  const toExcluded: OrgRoutingExclusion[] = [];
  for (const r of toRes.rows as Array<{ email: string | null }>) {
    const e = (r.email || "").trim();
    if (!e) {
      toExcluded.push({ email: "(empty)", reason: "empty-email" });
      continue;
    }
    if (isTestOrSeedEmail(e)) {
      toExcluded.push({ email: e, reason: "isTestOrSeedEmail" });
    } else {
      toKept.push(e);
    }
  }

  const ccKept: string[] = [];
  const ccExcluded: OrgRoutingExclusion[] = [];
  if (org.partnerId) {
    const ccRes = await db.execute(sql`
      SELECT u.email, u.is_active, u.organization_id
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name = 'partner_admin'
        AND u.is_active = true
        AND u.organization_id = ${org.partnerId}
    `);
    for (const r of ccRes.rows as Array<{ email: string | null }>) {
      const e = (r.email || "").trim();
      if (!e) {
        ccExcluded.push({ email: "(empty)", reason: "empty-email" });
        continue;
      }
      if (isTestOrSeedEmail(e)) {
        ccExcluded.push({ email: e, reason: "isTestOrSeedEmail" });
      } else {
        ccKept.push(e);
      }
    }
  }

  // Default Bcc = SAFETY_NET. Explicit null or empty string disables it.
  let bcc: string[];
  if (opts.safetyBcc === null || opts.safetyBcc === "") {
    bcc = [];
  } else if (typeof opts.safetyBcc === "string") {
    bcc = [opts.safetyBcc];
  } else {
    bcc = [SAFETY_NET_BCC_EMAIL];
  }

  return {
    orgId: org.id,
    orgName: org.name,
    to: toKept.slice().sort((a, b) => a.localeCompare(b)),
    cc: ccKept.slice().sort((a, b) => a.localeCompare(b)),
    bcc,
    toExcluded,
    ccExcluded,
  };
}

export interface HaltCheckResult {
  check: string;
  ok: boolean;
  details: string;
}

/**
 * Runs the six routing validations. Returns a list; any `.ok === false`
 * means the send must be blocked.
 */
export function runRoutingHaltChecks(
  routing: OrgRouting,
  legitToAssociations: Set<string>,
): HaltCheckResult[] {
  const results: HaltCheckResult[] = [];
  const emailShape = /^[^@]+@[^@]+\.[^@]+$/;

  results.push({
    check: "1. Store has >=1 post-filter To: recipient",
    ok: routing.to.length > 0,
    details: routing.to.length > 0
      ? "PASS"
      : `FAIL — empty To: for ${routing.orgName}`,
  });

  results.push({
    check: "2. All To: and Cc: recipients are is_active=true",
    ok: true,
    details: "PASS — enforced by SQL filter",
  });

  results.push({
    check: "3. Cc: has exactly 1 partner_admin after filter",
    ok: routing.cc.length === 1,
    details: routing.cc.length === 1
      ? "PASS"
      : `FAIL — ${routing.orgName} Cc count = ${routing.cc.length}`,
  });

  const mismatches: string[] = [];
  for (const e of routing.to) {
    if (!legitToAssociations.has(e.toLowerCase())) {
      mismatches.push(`${routing.orgName}: ${e} not associated`);
    }
  }
  results.push({
    check: "4. Every To: recipient is legitimately associated with the store",
    ok: mismatches.length === 0,
    details: mismatches.length === 0 ? "PASS" : `FAIL — ${mismatches.join("; ")}`,
  });

  const hits: string[] = [];
  for (const e of routing.to) {
    if (isTestOrSeedEmail(e)) hits.push(`To: ${e}`);
  }
  for (const e of routing.cc) {
    if (isTestOrSeedEmail(e)) hits.push(`Cc: ${e}`);
  }
  results.push({
    check: "5. No To:/Cc: recipient matches test/seed patterns (paranoid)",
    ok: hits.length === 0,
    details: hits.length === 0 ? "PASS" : `FAIL — ${hits.join(", ")}`,
  });

  const bad: string[] = [];
  for (const e of [...routing.to, ...routing.cc, ...routing.bcc]) {
    if (!emailShape.test(e)) bad.push(e);
  }
  results.push({
    check: "6. No recipient email is malformed",
    ok: bad.length === 0,
    details: bad.length === 0 ? "PASS" : `FAIL — malformed: ${bad.join(", ")}`,
  });

  return results;
}

async function computeLegitToAssociations(orgId: string): Promise<Set<string>> {
  const res = await db.execute(sql`
    SELECT u.email
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'org_admin'
      AND u.is_active = true
      AND (u.organization_id = ${orgId} OR u.additional_org_ids ? ${orgId})
  `);
  const out = new Set<string>();
  for (const row of res.rows as Array<{ email: string | null }>) {
    if (row.email) out.add(row.email.trim().toLowerCase());
  }
  return out;
}

export interface SendWeeklyReportResult {
  sent: boolean;
  messageId?: string;
  to: string[];
  cc: string[];
  bcc: string[];
  skipReason?:
    | "org_not_found"
    | "routing_validation_failed"
    | "no_recipients"
    | "validation_failed"
    | "send_error";
  validationFailures?: string[];
  haltFailures?: string[];
  error?: string;
  narrativeWordCount?: number;
}

/**
 * Production send for one org. Builds the report, generates the AI narrative,
 * validates the data, renders HTML, and dispatches the email through
 * `sendWeeklyReportEmail`.
 *
 * Never throws. Always returns a structured result — the scheduler uses this
 * for activity-log entries. Errors during DB/LLM/send are captured in
 * `error` + `skipReason: 'send_error'`.
 *
 * Caller is responsible for:
 *   - Timezone / Monday-7am gate
 *   - Idempotency lock (scheduler_locks)
 *   - Activity-log write
 *   - Super-admin alert on validation failure
 */
export async function sendWeeklyReportProduction(
  orgId: string,
  opts: { safetyBcc?: string | null; weekEnd?: Date } = {},
): Promise<SendWeeklyReportResult> {
  const orgRows = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (orgRows.length === 0) {
    return { sent: false, to: [], cc: [], bcc: [], skipReason: "org_not_found" };
  }
  const org = orgRows[0];

  // 1. Resolve routing
  let routing: OrgRouting;
  try {
    routing = await resolveOrgRouting(
      { id: org.id, name: org.name, partnerId: org.partnerId ?? null },
      { safetyBcc: opts.safetyBcc },
    );
  } catch (err) {
    return {
      sent: false,
      to: [],
      cc: [],
      bcc: [],
      skipReason: "send_error",
      error: `routing resolution failed: ${(err as Error).message}`,
    };
  }

  if (routing.to.length === 0) {
    return {
      sent: false,
      to: routing.to,
      cc: routing.cc,
      bcc: routing.bcc,
      skipReason: "no_recipients",
    };
  }

  // 2. HALT checks — refuse send if any fails
  let legitAssoc: Set<string>;
  try {
    legitAssoc = await computeLegitToAssociations(orgId);
  } catch (err) {
    return {
      sent: false,
      to: routing.to,
      cc: routing.cc,
      bcc: routing.bcc,
      skipReason: "send_error",
      error: `legit-assoc lookup failed: ${(err as Error).message}`,
    };
  }

  const haltResults = runRoutingHaltChecks(routing, legitAssoc);
  const haltFailures = haltResults.filter((r) => !r.ok).map((r) => `${r.check}: ${r.details}`);
  if (haltFailures.length > 0) {
    console.error(
      `[WeeklyReportScheduler] HALT checks failed for ${org.name} — NOT sending:\n  - ${haltFailures.join("\n  - ")}`,
    );
    return {
      sent: false,
      to: routing.to,
      cc: routing.cc,
      bcc: routing.bcc,
      skipReason: "routing_validation_failed",
      haltFailures,
    };
  }

  // 3. Build report + narrative + validate + render
  const weekEnd = opts.weekEnd ?? new Date();
  const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  let data: WeeklyReportData;
  try {
    const built = await buildWeeklyReport(orgId, weekStart, weekEnd);
    data = built.data;
    if (built.warnings.length > 0) {
      console.log(
        `[WeeklyReportScheduler] ${org.name} build warnings: ${built.warnings.join(" | ")}`,
      );
    }
  } catch (err) {
    return {
      sent: false,
      to: routing.to,
      cc: routing.cc,
      bcc: routing.bcc,
      skipReason: "send_error",
      error: `buildWeeklyReport failed: ${(err as Error).message}`,
    };
  }

  try {
    const narrative = await generateAiNarrative(data);
    data.aiNarrative = narrative;
  } catch (err) {
    // Narrative has its own internal fallback; extra-safety wrapper in case
    // the call itself throws before the try/catch inside.
    console.warn(
      `[WeeklyReportScheduler] ${org.name} narrative wrapper caught: ${(err as Error).message}`,
    );
  }
  const narrativeWordCount = (data.aiNarrative || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const v = validateWeeklyReport(data);
  if (!v.ok) {
    console.error(
      `[WeeklyReportScheduler] ${org.name} validation FAILED — NOT sending:\n  - ${v.failures.join("\n  - ")}`,
    );
    return {
      sent: false,
      to: routing.to,
      cc: routing.cc,
      bcc: routing.bcc,
      skipReason: "validation_failed",
      validationFailures: v.failures,
      narrativeWordCount,
    };
  }

  let html: string;
  try {
    html = renderWeeklyReportHtml(data);
  } catch (err) {
    return {
      sent: false,
      to: routing.to,
      cc: routing.cc,
      bcc: routing.bcc,
      skipReason: "send_error",
      error: `render failed: ${(err as Error).message}`,
      narrativeWordCount,
    };
  }

  const weekEndDate = weekEnd.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const subject = `\uD83D\uDE97 AI Dealership Performance Analysis \u2014 ${data.orgName} \u2014 week ending ${weekEndDate}`;

  // Lazy import to avoid a circular/ordering dependency between the two
  // services at module load (notificationService → weeklyReportService is
  // a path we don't want to introduce accidentally).
  const { sendWeeklyReportEmail } = await import("./notificationService");

  try {
    const result = await sendWeeklyReportEmail(routing.to, subject, html, {
      cc: routing.cc,
      bcc: routing.bcc,
    });
    if (!result.sent) {
      return {
        sent: false,
        to: routing.to,
        cc: routing.cc,
        bcc: routing.bcc,
        skipReason: "send_error",
        error: result.error,
        narrativeWordCount,
      };
    }
    return {
      sent: true,
      messageId: result.messageId,
      to: routing.to,
      cc: routing.cc,
      bcc: routing.bcc,
      narrativeWordCount,
    };
  } catch (err) {
    return {
      sent: false,
      to: routing.to,
      cc: routing.cc,
      bcc: routing.bcc,
      skipReason: "send_error",
      error: (err as Error).message,
      narrativeWordCount,
    };
  }
}
