/**
 * Chunk 1A end-to-end fire — test-lane verification.
 *
 * Sets TESTLANE_MODE + TESTLANE_EMAIL_TO inline (BEFORE module imports) so
 * the recipient-override fail-closed gate routes both emails to the operator's
 * allowlisted inbox.
 *
 * Usage:
 *   set -a; source .env; set +a;
 *   npx tsx evidence/stabilization-sprint-2026-04-30/1A/e2e-fire.ts
 *
 * Verification: outbound_log rows with [testlane:1A-2026-04-30] markers and
 * recipient = duanewells@icloud.com.
 */

// MUST run before module imports below.
process.env.TESTLANE_MODE = "true";
process.env.TESTLANE_EMAIL_TO = "duanewells@icloud.com";

(async () => {
  const sid = "1A-2026-04-30";

  // Resolve serra-honda
  const { db } = await import("../../../server/storage");
  const { sql } = await import("drizzle-orm");
  const orgRow: any = (await db.execute(sql`
    SELECT id, name FROM organizations WHERE slug = 'serra-honda' LIMIT 1
  `)).rows[0];
  if (!orgRow) {
    console.error("serra-honda org not found");
    process.exit(1);
  }
  console.log(`Target org: ${orgRow.name} (${orgRow.id})`);

  // ─── Test 1: daily recap email ──────────────────────────────────────────
  const { sendDailyRecapEmail } = await import("../../../server/services/notificationService");
  console.log("\n--- Test 1: daily recap (test-lane) ---");
  const recapResult = await sendDailyRecapEmail({
    orgId: orgRow.id,
    data: {
      orgId: orgRow.id,
      orgName: orgRow.name,
      date: "2026-04-30",
      newSalesLeads: 17,
      newServiceLeads: 4,
      customerReplies: 6,
      appointmentsCreated: 2,
      callsReceived: 9,
      unansweredConversations: 1,
      triggerSends: { afterHoursDeferred: 3, checkIn: 2, immediate: 1 },
      smsOutSent: 12,
      smsBlocked: 0,
      emailSent: 4,
    },
    testLaneSessionId: sid,
  });
  console.log("daily recap result:", recapResult);

  // ─── Test 2: SMS appt-intent email ─────────────────────────────────────
  const { sendSmsAppointmentIntentNotification } = await import("../../../server/services/notificationService");
  console.log("\n--- Test 2: SMS appointment-intent (test-lane) ---");
  const apptResult = await sendSmsAppointmentIntentNotification({
    orgId: orgRow.id,
    customerName: "[TESTLANE] Sarah Tester",
    customerPhone: "+14126546500",
    conversationId: `[testlane:${sid}]-conv-fixture`,
    messagePreview: "Can I come in Saturday at 2pm to test drive the Pilot? Thanks!",
    summary: "Customer wants to book a Saturday 2 PM test drive for the Honda Pilot.",
    preferredDate: "Saturday",
    preferredTime: "2 PM",
    vehicleOfInterest: "Honda Pilot",
    testLaneSessionId: sid,
  });
  console.log("sms appt-intent result:", apptResult);

  // ─── Verify outbound_log rows ──────────────────────────────────────────
  console.log("\n--- Verification: outbound_log rows ---");
  const logs: any = await db.execute(sql`
    SELECT created_at, channel, status, message_content, recipient_email
    FROM outbound_log
    WHERE organization_id = ${orgRow.id}
      AND channel = 'email'
      AND status = 'sent'
      AND message_content LIKE ${"%[testlane:" + sid + "]%"}
    ORDER BY created_at DESC
    LIMIT 5
  `);
  console.log(JSON.stringify(logs.rows, null, 2));

  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
