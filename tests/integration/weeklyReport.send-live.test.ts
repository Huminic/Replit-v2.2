/**
 * TRG-RPT-001 — LIVE send test (revision 4, production-recipient routing).
 *
 * Sends REAL weekly executive report emails — one per dealership — to the
 * org's real `org_admin` users, with the partner_admin on Cc and the operator
 * on Bcc. Skipped by default — only runs when LIVE_SEND=1 is set on the
 * command line:
 *
 *   LIVE_SEND=1 npx vitest run tests/integration/weeklyReport.send-live.test.ts
 *
 * Routing modes (env-gated):
 *   RECIPIENTS_MODE=operator     (default) — To: is hardcoded to
 *                                  duane.wells@huminic.ai, no Cc, no Bcc.
 *                                  Used for iteration testing.
 *   RECIPIENTS_MODE=production   — To/Cc resolved from the DB per store with
 *                                  the named exclusion filter applied.
 *                                  Bcc: always duane.wells@huminic.ai
 *                                  (SAFETY_NET_BCC_EMAIL — first production
 *                                  cycle only; future cycles will drop this).
 *
 * Routing policy (deterministic, documented, unit-tested):
 *   To:  every active user where role='org_admin' AND
 *          (organization_id = orgId OR additional_org_ids contains orgId) AND
 *          email passes isTestOrSeedEmail() filter (false = keep).
 *   Cc:  every active user where role='partner_admin' AND
 *          organization_id = <parent org id / Cage Automotive> AND
 *          email passes isTestOrSeedEmail() filter.
 *   Bcc: operator safety-net (hardcoded).
 *
 * Hard guardrails:
 *   - Routing map is printed BEFORE any send, with exclusions logged per
 *     recipient (email + reason).
 *   - Six HALT checks run before any send fires. Any failure aborts the
 *     entire run — no partial sends.
 *   - Every org's report passes validateWeeklyReport before that org's send.
 *     If an org's report FAILS validation, ONLY that org is skipped — the
 *     other stores still send.
 *   - No retry on send failure.
 *   - Subject is prefixed with 🚗 to distinguish from lead-notification 🎯.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { testPool } from "../setup";
import {
  buildWeeklyReport,
  validateWeeklyReport,
  renderWeeklyReportHtml,
  generateAiNarrative,
  getPrimaryAgentName,
  // Production-recipient routing helpers — extracted from this test in the
  // Phase D scheduler cycle (TRG-RPT-001). Single source of truth lives
  // with the service now.
  resolveOrgRouting as serviceResolveOrgRouting,
  runRoutingHaltChecks as serviceRunRoutingHaltChecks,
  isTestOrSeedEmail as serviceIsTestOrSeedEmail,
  SAFETY_NET_BCC_EMAIL as SERVICE_SAFETY_NET_BCC_EMAIL,
  type OrgRouting as ServiceOrgRouting,
  type HaltCheckResult as ServiceHaltCheckResult,
} from "@server/services/weeklyReportService";
import { sendWeeklyReportEmail } from "@server/services/notificationService";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LIVE = process.env.LIVE_SEND === "1";
const RECIPIENTS_MODE: "operator" | "production" =
  (process.env.RECIPIENTS_MODE === "production" ? "production" : "operator");

// Operator safety-net Bcc — single source of truth is the service export.
// Re-aliased locally so the rest of the test reads unchanged.
const SAFETY_NET_BCC_EMAIL = SERVICE_SAFETY_NET_BCC_EMAIL;

// Operator-mode fallback recipient.
const OPERATOR_RECIPIENT = "duane.wells@huminic.ai";

// TRG-RPT-001 iteration 9 (production cycle): empty array = send to ALL
// dealer orgs. Non-empty = restrict to the listed org ids (used during
// single-store iteration cycles).
const LIVE_SEND_ORGS: string[] = [];

// ---------------------------------------------------------------------------
// Named exclusion filter — extracted to the service. Re-exported here for
// backward compatibility with any consumer that imported these symbols from
// this test file. Single source of truth lives in weeklyReportService.ts.
// ---------------------------------------------------------------------------

export {
  TEST_EMAIL_ADDRESSES,
  TEST_EMAIL_DOMAIN_PATTERNS,
  SEED_EMAIL_PATTERNS,
} from "@server/services/weeklyReportService";

export const isTestOrSeedEmail = serviceIsTestOrSeedEmail;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrgRow {
  id: string;
  name: string;
  slug: string;
  partner_id: string;
}

interface RawRecipient {
  email: string;
  is_active: boolean;
  organization_id: string;
  additional_org_ids: string[] | null;
}

// Local aliases preserve the old shapes used throughout the rest of the
// file — OrgRouting now lives in the service.
type OrgRouting = ServiceOrgRouting;
type HaltCheckResult = ServiceHaltCheckResult;

interface StoreOutcome {
  org: string;
  toCount: number;
  ccCount: number;
  bccCount: number;
  validationOk: boolean;
  validationFailures: string[];
  narrativeGenerated: boolean;
  narrativeWordCount: number;
  sent: boolean;
  messageId: string | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// DB-driven routing resolver — delegated to the service.
//
// The service uses drizzle's `db`; this test traditionally used `testPool`.
// Since both point at the same DATABASE_URL, the service version is the
// authoritative implementation going forward. Kept as a re-exported wrapper
// so callers that imported `resolveOrgRouting` from this file still work.
// ---------------------------------------------------------------------------

export async function resolveOrgRouting(
  org: Pick<OrgRow, "id" | "name" | "partner_id">,
): Promise<OrgRouting> {
  return serviceResolveOrgRouting({
    id: org.id,
    name: org.name,
    partnerId: org.partner_id ?? null,
  });
}

// ---------------------------------------------------------------------------
// Routing-map print + HALT checks
// ---------------------------------------------------------------------------

function printRoutingMap(routings: OrgRouting[]): void {
  // eslint-disable-next-line no-console
  console.log("\n===== FINAL ROUTING MAP =====\n");
  for (const r of routings) {
    // eslint-disable-next-line no-console
    console.log(`${r.orgName}`);
    // eslint-disable-next-line no-console
    console.log(`  To:  ${r.to.join(", ") || "(none)"}`);
    // eslint-disable-next-line no-console
    console.log(`  Cc:  ${r.cc.join(", ") || "(none)"}`);
    // eslint-disable-next-line no-console
    console.log(`  Bcc: ${r.bcc.join(", ")}`);
    if (r.toExcluded.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `  To-excluded: ${r.toExcluded.map((x) => `${x.email} [${x.reason}]`).join(", ")}`,
      );
    }
    if (r.ccExcluded.length > 0) {
      // eslint-disable-next-line no-console
      console.log(
        `  Cc-excluded: ${r.ccExcluded.map((x) => `${x.email} [${x.reason}]`).join(", ")}`,
      );
    }
    // eslint-disable-next-line no-console
    console.log("");
  }
  // eslint-disable-next-line no-console
  console.log("===== END ROUTING MAP =====\n");
}

/**
 * Runs the six routing validations described in the sprint spec. Delegates
 * to the service's per-org variant and then aggregates across all orgs.
 * Any `.ok === false` must abort the run BEFORE any send.
 */
export function runRoutingHaltChecks(
  routings: OrgRouting[],
  allRawToAssociations: Map<string, Set<string>>,
): HaltCheckResult[] {
  // Aggregate: fold the per-org checks from the service into one list per
  // check name. Each aggregated entry is PASS iff every per-org check passed.
  const perOrgChecks: HaltCheckResult[][] = routings.map((r) =>
    serviceRunRoutingHaltChecks(
      r,
      allRawToAssociations.get(r.orgId) || new Set<string>(),
    ),
  );

  if (perOrgChecks.length === 0) return [];

  const checkCount = perOrgChecks[0].length;
  const aggregated: HaltCheckResult[] = [];
  for (let i = 0; i < checkCount; i++) {
    const checksForThisIndex = perOrgChecks.map((pc) => pc[i]);
    const allOk = checksForThisIndex.every((c) => c.ok);
    const title = checksForThisIndex[0].check.replace(
      /^\s*\d+\.\s*/,
      (m) => m, // keep the numeric prefix
    );
    aggregated.push({
      check: title,
      ok: allOk,
      details: allOk
        ? "PASS — all stores"
        : `FAIL — ${checksForThisIndex
            .filter((c) => !c.ok)
            .map((c, idx) => {
              const r = routings.filter((_, j) => !perOrgChecks[j][i].ok)[idx];
              return `${r?.orgName ?? "?"}: ${c.details}`;
            })
            .join(" | ")}`,
    });
  }
  return aggregated;
}

function printHaltChecks(results: HaltCheckResult[]): void {
  // eslint-disable-next-line no-console
  console.log("===== ROUTING VALIDATION (HALT CHECKS) =====");
  for (const r of results) {
    // eslint-disable-next-line no-console
    console.log(`  ${r.ok ? "[PASS]" : "[HALT]"} ${r.check}`);
    // eslint-disable-next-line no-console
    console.log(`         ${r.details}`);
  }
  // eslint-disable-next-line no-console
  console.log("===== END HALT CHECKS =====\n");
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe.skipIf(!LIVE)("weekly report — LIVE send (per store, production routing)", () => {
  let dealerOrgs: OrgRow[] = [];
  let targetOrgs: OrgRow[] = [];
  let routings: OrgRouting[] = [];
  let haltResults: HaltCheckResult[] = [];

  beforeAll(async () => {
    const r = await testPool.query<OrgRow>(
      `SELECT id, name, slug, partner_id FROM organizations
       WHERE partner_id IS NOT NULL AND slug != 'cage-automotive'
       ORDER BY name`,
    );
    dealerOrgs = r.rows;
    expect(dealerOrgs.length).toBe(5);

    if (LIVE_SEND_ORGS.length === 0) {
      targetOrgs = dealerOrgs;
    } else {
      targetOrgs = dealerOrgs.filter((o) => LIVE_SEND_ORGS.includes(o.id));
      expect(targetOrgs.length).toBeGreaterThan(0);
      // eslint-disable-next-line no-console
      console.log(
        `[live-send] LIVE_SEND_ORGS filter — ${targetOrgs.length} of ${dealerOrgs.length} orgs: ${targetOrgs.map((o) => o.name).join(", ")}`,
      );
    }

    // eslint-disable-next-line no-console
    console.log(`[live-send] RECIPIENTS_MODE=${RECIPIENTS_MODE}`);

    if (RECIPIENTS_MODE === "production") {
      routings = [];
      const allRawToAssociations = new Map<string, Set<string>>();

      for (const org of targetOrgs) {
        const routing = await resolveOrgRouting(org);
        routings.push(routing);

        // Capture legit-association set used by HALT check 4.
        const assoc = new Set<string>();
        const assocRes = await testPool.query<RawRecipient>(
          `SELECT u.email FROM users u JOIN roles r ON u.role_id = r.id
           WHERE r.name = 'org_admin' AND u.is_active = true
             AND (u.organization_id = $1 OR u.additional_org_ids ? $2)`,
          [org.id, org.id],
        );
        for (const row of assocRes.rows) {
          if (row.email) assoc.add(row.email.trim().toLowerCase());
        }
        allRawToAssociations.set(org.id, assoc);
      }

      printRoutingMap(routings);
      haltResults = runRoutingHaltChecks(routings, allRawToAssociations);
      printHaltChecks(haltResults);
    }
  });

  it("routing map passes all 6 HALT checks (production mode only)", () => {
    if (RECIPIENTS_MODE !== "production") {
      // eslint-disable-next-line no-console
      console.log("[live-send] skipping HALT checks — not in production mode");
      return;
    }
    const failures = haltResults.filter((r) => !r.ok);
    expect(
      failures,
      `HALT — routing validation failed:\n  - ${failures.map((f) => `${f.check}: ${f.details}`).join("\n  - ")}`,
    ).toEqual([]);
  });

  it("builds, validates, renders, and sends one email per store", async () => {
    // Safety gate — refuse to send if HALT checks failed (production mode)
    if (RECIPIENTS_MODE === "production") {
      const failures = haltResults.filter((r) => !r.ok);
      expect(failures.length, "refusing to send — HALT checks did not pass").toBe(0);
    }

    const end = new Date();
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    const outcomes: StoreOutcome[] = [];

    for (const org of targetOrgs) {
      const routing = routings.find((r) => r.orgId === org.id);

      let toList: string[];
      let ccList: string[];
      let bccList: string[];
      if (RECIPIENTS_MODE === "production") {
        if (!routing) {
          throw new Error(`Routing not computed for ${org.name} — bug in beforeAll`);
        }
        toList = routing.to;
        ccList = routing.cc;
        bccList = routing.bcc;
      } else {
        // operator mode — legacy behavior
        toList = [OPERATOR_RECIPIENT];
        ccList = [];
        bccList = [];
      }

      const outcome: StoreOutcome = {
        org: org.name,
        toCount: toList.length,
        ccCount: ccList.length,
        bccCount: bccList.length,
        validationOk: false,
        validationFailures: [],
        narrativeGenerated: false,
        narrativeWordCount: 0,
        sent: false,
        messageId: null,
        error: null,
      };

      try {
        await getPrimaryAgentName(org.id);

        const { data, warnings } = await buildWeeklyReport(org.id, start, end);

        // Generate AI narrative (live call)
        const narrative = await generateAiNarrative(data);
        data.aiNarrative = narrative;
        const placeholder = "AI narrative unavailable this cycle — raw data shown below.";
        outcome.narrativeGenerated = narrative !== placeholder;
        outcome.narrativeWordCount = narrative.trim().split(/\s+/).filter(Boolean).length;

        if (warnings.length > 0) {
          // eslint-disable-next-line no-console
          console.log(`[live-send] ${org.name} warnings: ${warnings.join(" | ")}`);
        }

        const v = validateWeeklyReport(data);
        outcome.validationOk = v.ok;
        outcome.validationFailures = v.failures;
        if (!v.ok) {
          // eslint-disable-next-line no-console
          console.error(
            `[live-send] ${org.name} FAILED validation — NOT sending:\n  - ${v.failures.join("\n  - ")}`,
          );
          outcomes.push(outcome);
          continue;
        }

        const html = renderWeeklyReportHtml(data);

        const escapedTone = data.toneInterstitial.replace(/'/g, "&#39;");
        expect(
          html.includes(data.toneInterstitial) || html.includes(escapedTone),
        ).toBe(true);
        expect(html).toContain(data.orgName);
        expect(html).toContain(data.agentName);
        expect(html).not.toMatch(/\bundefined\b/);
        expect(html).not.toMatch(/\[object Object\]/);
        // Never display "AI Lead"
        expect(html).not.toMatch(/\bAI Lead\b/);

        const weekEndDate = end.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        const subject = `\uD83D\uDE97 AI Dealership Performance Analysis \u2014 ${data.orgName} \u2014 week ending ${weekEndDate}`;

        const result = await sendWeeklyReportEmail(toList, subject, html, {
          cc: ccList,
          bcc: bccList,
        });
        outcome.sent = result.sent;
        outcome.messageId = result.messageId ?? null;
        outcome.error = result.error ?? null;

        // eslint-disable-next-line no-console
        console.log(
          `[live-send] ${org.name}: sent=${outcome.sent} ` +
            `messageId=${outcome.messageId ?? "(none)"} ` +
            `to=${outcome.toCount} cc=${outcome.ccCount} bcc=${outcome.bccCount} ` +
            `narrativeWords=${outcome.narrativeWordCount} ` +
            `error=${outcome.error ?? "(none)"}`,
        );
      } catch (err: any) {
        outcome.error = err?.message || String(err);
        // eslint-disable-next-line no-console
        console.error(`[live-send] ${org.name} threw:`, outcome.error);
      }

      outcomes.push(outcome);
    }

    const sentCount = outcomes.filter((o) => o.sent).length;
    const failedCount = outcomes.length - sentCount;
    // eslint-disable-next-line no-console
    console.log(
      `[live-send] SUMMARY — ${sentCount}/${outcomes.length} sent, ${failedCount} failed. ` +
        `Stores: ${outcomes
          .map((o) => `${o.org}[${o.sent ? "OK" : o.validationOk ? "send-fail" : "validation-fail"}]`)
          .join(", ")}`,
    );

    expect(outcomes.length).toBe(targetOrgs.length);
    if (RECIPIENTS_MODE === "production") {
      // Production cycle: every targeted store must send successfully.
      expect(sentCount).toBe(targetOrgs.length);
    } else if (LIVE_SEND_ORGS.length === 0) {
      // Operator full-fanout: legacy tolerance (>=4 of 5).
      expect(sentCount).toBeGreaterThanOrEqual(4);
    } else {
      expect(sentCount).toBe(targetOrgs.length);
    }
    for (const o of outcomes.filter((x) => x.sent)) {
      expect(o.messageId).toBeTruthy();
    }
  }, 600_000);
});
