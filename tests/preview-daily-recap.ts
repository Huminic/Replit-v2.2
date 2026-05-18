/**
 * Preview Daily Recap email — one-shot, allowlisted-recipient.
 *
 * Renders the PRODUCTION daily-recap template (no re-implementation) with
 * REAL data for a chosen org + date window, then sends via Resend to the
 * recipient defined by TESTLANE_EMAIL_TO env var.
 *
 * Operator usage:
 *   TESTLANE_EMAIL_TO=duane.wells@huminic.ai npx tsx tests/preview-daily-recap.ts
 *
 * Notes:
 *   - TESTLANE_MODE=true required (taken from dev .env)
 *   - Recipient override is per-invocation; .env is not modified
 *   - sendDailyRecapEmail logs to outbound_log with [testlane:preview-...] tag
 *   - One email per org per date, idempotency on by default — if a preview
 *     was already sent for the same org+date, repeat invocations are
 *     suppressed (change the date below if iterating)
 */
import "dotenv/config";
import { buildDailyRecap } from "../server/services/dailyRecapService";
import { sendDailyRecapEmail } from "../server/services/notificationService";
import { storage } from "../server/storage";

const ORG_SLUG = process.env.PREVIEW_ORG_SLUG || "serra-honda";
const PREVIEW_DATE = process.env.PREVIEW_DATE || "2026-04-29"; // day with real trigger activity
const TZ_OFFSET_HOURS = -5; // approximation for AL/TN (operator can override via PREVIEW_TZ_OFFSET)

async function main() {
  const overrideTo = process.env.TESTLANE_EMAIL_TO;
  if (!overrideTo) {
    console.error("[Preview] TESTLANE_EMAIL_TO must be set for this invocation");
    process.exit(2);
  }
  if (process.env.TESTLANE_MODE !== "true") {
    console.error("[Preview] TESTLANE_MODE must be 'true' for the override to fire");
    process.exit(2);
  }

  // Resolve org slug → orgId
  const orgs = await storage.getOrganizations();
  const org = orgs.find((o) => o.slug === ORG_SLUG);
  if (!org) {
    console.error(`[Preview] Org slug '${ORG_SLUG}' not found`);
    process.exit(2);
  }

  // Compute day boundaries (UTC) for the chosen local date
  const offsetMs = TZ_OFFSET_HOURS * 60 * 60 * 1000;
  const dayStart = new Date(`${PREVIEW_DATE}T00:00:00.000Z`).getTime() - offsetMs;
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;

  console.log(`[Preview] Building daily-recap data for ${org.name} (${ORG_SLUG}) on ${PREVIEW_DATE}`);
  console.log(`[Preview] Day window UTC: ${new Date(dayStart).toISOString()} → ${new Date(dayEnd).toISOString()}`);
  console.log(`[Preview] Recipient (override): ${overrideTo}`);

  const data = await buildDailyRecap(org.id, new Date(dayStart), new Date(dayEnd), PREVIEW_DATE);
  if (!data) {
    console.error("[Preview] buildDailyRecap returned no data");
    process.exit(3);
  }

  console.log(`[Preview] Data block:`);
  console.log(JSON.stringify(data, null, 2));

  const result = await sendDailyRecapEmail({
    orgId: org.id,
    data,
    testLaneSessionId: `preview-2026-05-12-${ORG_SLUG}-${PREVIEW_DATE}`,
  });

  console.log(`[Preview] Send result:`, JSON.stringify(result, null, 2));
  if (result.ok) {
    console.log(`[Preview] ✓ Email sent to ${overrideTo} (recipient count: ${result.recipientCount})`);
  } else {
    console.error(`[Preview] ✗ Send failed: ${result.reason}`);
    process.exit(4);
  }
}

main().catch((err) => {
  console.error("[Preview] Crash:", err);
  process.exit(99);
});
