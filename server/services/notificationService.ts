/**
 * Trigger Notification Service
 *
 * Sends email notifications to org admins when outbound triggers fire.
 * Two notification types:
 *   1. AI Follow-Up Initiated — after-hours follow-up or AI-initiated outbound
 *   2. 24-Hour Follow-Up Delivered — check-in SMS delivered
 *
 * Uses the same recipient resolution and sending pattern as
 * sendLeadNotificationEmail() in webhooks.ts. All sends are non-blocking.
 */

import { storage } from "../storage";
import { callMCP } from "../vendorProxy";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TriggerNotificationParams {
  orgId: string;
  customerName: string;
  customerPhone: string;
  triggerType: "after_hours_followup" | "24h_checkin";
  messageSent: string;
  vehicleOfInterest?: string | null;
  /** Optional test-lane session id. When set together with TESTLANE_MODE=true,
   *  admin recipients are replaced with TESTLANE_EMAIL_TO. Detection also
   *  fires automatically if customerName starts with [TESTLANE] or messageSent
   *  contains [testlane:] / [TESTLANE]. Two-way fail-closed enforced here. */
  testLaneSessionId?: string;
}

// ---------------------------------------------------------------------------
// Test-lane recipient enforcement
// ---------------------------------------------------------------------------

/**
 * Compute admin recipient override for the test lane.
 * Returns:
 *   { ok: true, recipients: [...] } — pass-through (no test-lane involvement)
 *   { ok: true, recipients: [TESTLANE_EMAIL_TO], overridden: true, sid }
 *   { ok: false, reason: "..." } — fail-closed; caller must skip the send
 *
 * Two-way fail-closed: TESTLANE_MODE without a marker is blocked; a marker
 * without TESTLANE_MODE is blocked. Mirrors the guard in
 * server/outbound.ts:processOutboundSend.
 */
function applyTestLaneRecipientOverride(
  params: TriggerNotificationParams,
  recipients: string[]
): { ok: true; recipients: string[]; overridden?: boolean; sid?: string } | { ok: false; reason: string } {
  const testLaneEnv = process.env.TESTLANE_MODE === "true";
  const requestHasMarker =
    !!params.testLaneSessionId ||
    (params.customerName || "").includes("[TESTLANE]") ||
    (params.messageSent || "").includes("[TESTLANE]") ||
    (params.messageSent || "").includes("[testlane:");

  if (!testLaneEnv && !requestHasMarker) {
    return { ok: true, recipients };
  }
  if (testLaneEnv && !requestHasMarker) {
    return { ok: false, reason: "TESTLANE_MODE=true but notification request lacks test-lane marker (fail-closed)" };
  }
  if (!testLaneEnv && requestHasMarker) {
    return { ok: false, reason: "Notification request has test-lane marker but TESTLANE_MODE is not 'true' (fail-closed)" };
  }
  // testLaneEnv && requestHasMarker -> override
  const t = process.env.TESTLANE_EMAIL_TO;
  if (!t) {
    return { ok: false, reason: "TESTLANE_MODE on but TESTLANE_EMAIL_TO unset (fail-closed)" };
  }
  const sid = params.testLaneSessionId || "unknown";
  return { ok: true, recipients: [t], overridden: true, sid };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FROM_ADDRESS = "Nexxus Connect <notifications@huminic.ai>";

// ---------------------------------------------------------------------------
// Recipient resolution (mirrors webhooks.ts sendLeadNotificationEmail)
// ---------------------------------------------------------------------------

/**
 * Resolve all admin recipients for an org using the same hierarchy as the
 * lead notification: org admins (L3), partner admins (L2), super admins (L1),
 * and additional-org users. Excludes seed/test accounts.
 */
async function resolveAdminRecipients(orgId: string): Promise<string[]> {
  const org = await storage.getOrganization(orgId);
  if (!org) return [];

  const recipientEmails = new Set<string>();

  // Level 3 — Org admins
  const orgUsers = await storage.getUsers(orgId);
  for (const u of orgUsers) {
    if (u.role && u.role.level === 3 && u.email && u.isActive !== false) {
      recipientEmails.add(u.email);
    }
  }

  // Level 2 — Partner admins (walk up via partnerId)
  if (org.partnerId) {
    const parentUsers = await storage.getUsers(org.partnerId);
    for (const u of parentUsers) {
      if (u.role && u.role.level === 2 && u.email && u.isActive !== false) {
        recipientEmails.add(u.email);
      }
    }
  }

  // Level 1 — Super admins from ALL orgs
  const allOrgs = await storage.getOrganizations();
  for (const anyOrg of allOrgs) {
    const anyOrgUsers = await storage.getUsers(anyOrg.id);
    for (const u of anyOrgUsers) {
      if (u.role && u.role.level === 1 && u.email && u.isActive !== false) {
        recipientEmails.add(u.email);
      }
    }
  }

  // Additional — users (level <= 3) who have this orgId in additional_org_ids
  for (const anyOrg of allOrgs) {
    if (anyOrg.id === orgId) continue;
    const otherUsers = await storage.getUsers(anyOrg.id);
    for (const u of otherUsers) {
      if (
        u.role &&
        u.role.level <= 3 &&
        u.email &&
        u.isActive !== false &&
        Array.isArray(u.additionalOrgIds) &&
        u.additionalOrgIds.includes(orgId)
      ) {
        recipientEmails.add(u.email);
      }
    }
  }

  // Exclusion — remove test/seed accounts
  const testDomainPatterns = ["@nexxus.com", "@test.com"];
  const seedDomains = [
    "@serrahonda.com", "@serranissan.com", "@tonyserraford.com",
    "@hyundaiofcolumbia.com", "@fordofcolumbia.com",
  ];
  const seedPrefixes = ["orgadmin@", "salesmanager@", "bdcmanager@", "servicemanager@", "fimanager@"];
  for (const email of recipientEmails) {
    const lower = email.toLowerCase();
    const isSeed =
      lower.startsWith("admin@") ||
      testDomainPatterns.some(p => lower.endsWith(p)) ||
      seedDomains.some(d => lower.endsWith(d)) ||
      seedPrefixes.some(p => lower.startsWith(p));
    if (isSeed) {
      recipientEmails.delete(email);
    }
  }

  return Array.from(recipientEmails);
}

// ---------------------------------------------------------------------------
// Shared email template — mirrors generateLeadEmailHTML() in webhooks.ts
// ---------------------------------------------------------------------------

interface NotificationEmailParams {
  gradientStart: string;
  gradientEnd: string;
  headerEmoji: string;   // HTML entity e.g. "&#129302;"
  headerTitle: string;
  orgName: string;
  summaryText: string;
  /** Optional highlighted box (e.g. message preview) shown above the details grid */
  highlightBox?: { label: string; content: string } | null;
  details: Array<{ label: string; value: string }>;
  footerNote?: string;
}

/**
 * Shared notification email template.
 *
 * Produces HTML structurally identical to generateLeadEmailHTML() in
 * webhooks.ts — same fonts, spacing, shadow, gradient header, details grid,
 * and footer. Only the slot content differs.
 */
function generateNotificationEmailHTML(params: NotificationEmailParams): string {
  const accentColor = params.gradientStart;
  const supportEmail = process.env.SUPPORT_EMAIL || "support@huminic.ai";

  // Build highlight box (message preview)
  const highlightBlock = params.highlightBox
    ? `
          <tr>
            <td style="padding: 0 40px 20px;">
              <div style="background: #f8f9fa; border-left: 4px solid ${accentColor}; padding: 16px 20px; border-radius: 4px;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${params.highlightBox.label}
                </h3>
                <p style="margin: 0; font-size: 15px; color: #333; line-height: 1.6;">
                  ${params.highlightBox.content}
                </p>
              </div>
            </td>
          </tr>`
    : "";

  // Build detail rows
  const detailRows = params.details
    .map((d, i) => {
      const widthAttr = i === 0 ? ' width: 40%;' : '';
      return `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666;${widthAttr}">${d.label}:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: 500;">${d.value}</td>
                </tr>`;
    })
    .join("");

  // Build footer note callout
  const footerNoteBlock = params.footerNote
    ? `
          <tr>
            <td style="padding: 0 40px 30px;">
              <div style="background: #f8f9fa; border-radius: 6px; padding: 14px 18px;">
                <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.5;">
                  ${params.footerNote}
                </p>
              </div>
            </td>
          </tr>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.headerTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, ${params.gradientStart} 0%, ${params.gradientEnd} 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">
                ${params.headerEmoji} ${params.orgName}
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                ${params.headerTitle}
              </p>
            </td>
          </tr>

          <!-- Intro / Summary Section -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <p style="margin: 0; font-size: 16px; color: #333; line-height: 1.5;">
                ${params.summaryText}
              </p>
            </td>
          </tr>

          <!-- Highlight Box (message preview) -->
          ${highlightBlock}

          <!-- Details Grid -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                ${detailRows}
              </table>
            </td>
          </tr>

          <!-- Footer Note -->
          ${footerNoteBlock}

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 30px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.5;">
                <strong>Questions or issues?</strong> Contact <a href="mailto:${supportEmail}" style="color: ${accentColor}; text-decoration: none;">${supportEmail}</a>
              </p>
              <p style="margin: 15px 0 0 0; font-size: 11px; color: #999;">
                Powered by Nexxus AI Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ---------------------------------------------------------------------------
// Per-notification-type HTML wrappers (use shared template)
// ---------------------------------------------------------------------------

function generateAIFollowUpHTML(params: {
  orgName: string;
  customerName: string;
  customerPhone: string;
  triggerType: string;
  messageSent: string;
  timestamp: string;
}): string {
  const triggerLabel = params.triggerType === "after_hours_followup"
    ? "After-Hours Follow-Up"
    : "24-Hour Check-In";

  const cleanMessage = params.messageSent.replace(/\[trigger:[^\]]+\]/g, "").trim();

  return generateNotificationEmailHTML({
    gradientStart: "#667eea",
    gradientEnd: "#764ba2",
    headerEmoji: "&#129302;",
    headerTitle: "AI Follow-Up Initiated",
    orgName: params.orgName,
    summaryText: `Our AI assistant has initiated an outbound follow-up with <strong>${params.customerName}</strong> (${params.customerPhone}). Here\u2019s the message that was sent:`,
    highlightBox: { label: "Message Sent", content: cleanMessage },
    details: [
      { label: "Customer Name", value: params.customerName },
      { label: "Phone", value: params.customerPhone },
      { label: "Trigger Type", value: triggerLabel },
      { label: "Timestamp", value: params.timestamp },
    ],
    footerNote: "The AI agent will handle any responses automatically. Conversations appear in your TeamBox inbox.",
  });
}

function generateCheckInDeliveredHTML(params: {
  orgName: string;
  customerName: string;
  customerPhone: string;
  messageSent: string;
  vehicleOfInterest?: string | null;
  timestamp: string;
}): string {
  const cleanMessage = params.messageSent.replace(/\[trigger:[^\]]+\]/g, "").trim();

  const details: Array<{ label: string; value: string }> = [
    { label: "Customer Name", value: params.customerName },
    { label: "Phone", value: params.customerPhone },
  ];
  if (params.vehicleOfInterest && params.vehicleOfInterest !== "No data") {
    details.push({ label: "Vehicle", value: params.vehicleOfInterest });
  }
  details.push({ label: "Timestamp", value: params.timestamp });

  return generateNotificationEmailHTML({
    gradientStart: "#667eea",
    gradientEnd: "#764ba2",
    headerEmoji: "&#9989;",
    headerTitle: "24-Hour Lead Check-In Delivered",
    orgName: params.orgName,
    summaryText: `A 24-hour check-in message has been delivered to <strong>${params.customerName}</strong> (${params.customerPhone}).`,
    highlightBox: { label: "Check-In Message", content: cleanMessage },
    details,
    footerNote: "The customer can reply directly and our AI agent will respond.",
  });
}

// ---------------------------------------------------------------------------
// Exported notification functions
// ---------------------------------------------------------------------------

/**
 * Send "AI Follow-Up Initiated" notification to org admins.
 * Non-blocking — errors are logged but never thrown to caller.
 */
export async function sendAIFollowUpNotification(params: TriggerNotificationParams): Promise<void> {
  try {
    const org = await storage.getOrganization(params.orgId);
    if (!org) {
      console.log(`[TriggerNotify] Org not found: ${params.orgId}, skipping AI follow-up notification`);
      return;
    }

    // CommGate: respect org email settings
    if (!org.outboundEnabled || !org.emailEnabled) {
      console.log(`[TriggerNotify] CommGate blocked — org ${org.name} outbound=${org.outboundEnabled} email=${org.emailEnabled}. Skipping AI follow-up notification`);
      return;
    }

    // Idempotency key — scoped to phone + hour to prevent duplicates
    const idempotencyKey = `trigger-followup-${params.customerPhone}-${new Date().toISOString().slice(0, 13)}`;

    // Check for duplicate
    const existingLogs = await storage.getOutboundLogs(params.orgId, {});
    const alreadySent = existingLogs.some(
      log => log.channel === "email" && log.status === "sent" && log.messageContent?.includes(`[notification:${idempotencyKey}]`)
    );
    if (alreadySent) {
      console.log(`[TriggerNotify] Skipping duplicate AI follow-up notification for ${idempotencyKey}`);
      return;
    }

    const adminRecipients = await resolveAdminRecipients(params.orgId);
    if (adminRecipients.length === 0) {
      console.log(`[TriggerNotify] No admin recipients found for org ${org.name}, skipping AI follow-up notification`);
      return;
    }

    // \u2500\u2500 TEST LANE: override admin recipients when this notification is part of
    // a test-lane session. Two-way fail-closed (see helper).
    const tl = applyTestLaneRecipientOverride(params, adminRecipients);
    if (!tl.ok) {
      console.log(`[TriggerNotify] Test-lane gate BLOCKED notification for org ${org.name}: ${tl.reason}`);
      return;
    }
    const recipients = tl.recipients;
    const tlTag = tl.overridden ? `[testlane:${tl.sid}] ` : "";

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const subject = `${tlTag}\u{1F916} ${org.name} \u2014 AI Follow-Up Initiated for ${params.customerName}`;

    const htmlBody = generateAIFollowUpHTML({
      orgName: org.name,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      triggerType: params.triggerType,
      messageSent: params.messageSent,
      timestamp,
    });

    console.log(`[TriggerNotify] Sending AI follow-up notification to ${recipients.length} admin(s) for org "${org.name}"${tl.overridden ? ` (TEST LANE override -> ${recipients.join(",")})` : ""}`);

    await callMCP("resend_send_email", {
      from: FROM_ADDRESS,
      to: recipients.join(","),
      subject,
      html: htmlBody,
    });

    // Log for idempotency tracking
    await storage.createOutboundLog({
      organizationId: params.orgId,
      campaignId: null,
      recipientId: null,
      channel: "email",
      status: "sent",
      blockedReason: null,
      messageContent: `${tlTag}[notification:${idempotencyKey}] ${subject} \u2014 sent to ${recipients.length} admin(s)`,
      recipientEmail: recipients.join(", "),
      recipientName: `${tl.overridden ? "[TESTLANE] " : ""}${recipients.length} admin(s)`,
      sentAt: new Date(),
    });

    console.log(`[TriggerNotify] AI follow-up notification sent to ${recipients.length} admin(s) for org "${org.name}"`);
  } catch (err: any) {
    console.error(`[TriggerNotify] Failed to send AI follow-up notification for org ${params.orgId}:`, err.message);
  }
}

// ---------------------------------------------------------------------------
// Weekly Executive Report sender — TRG-RPT-001 Phase D
// ---------------------------------------------------------------------------

/**
 * Send a weekly executive report email.
 *
 * Accepts either a single recipient (string) or an array of recipients, plus
 * optional cc/bcc lists via `opts`. When cc/bcc are present, this function
 * calls Resend directly via fetch (POST https://api.resend.com/emails)
 * because the central-mcp `resend_send_email` tool does not currently forward
 * cc/bcc fields (its schema only accepts from/to/subject/html/replyTo). This
 * is consistent with the existing direct-Resend pattern used by ADF sends in
 * server/routes/webhooks.ts and is tracked under BL-062 (route remaining
 * direct Resend usage through MCP once the MCP tool supports cc/bcc).
 *
 * When cc/bcc are NOT provided, this function continues to route through
 * callMCP("resend_send_email") for backward-compat with earlier callers.
 *
 * Unlike the trigger notifications above, this is NOT non-blocking: callers
 * (the integration test, the future scheduler) need to know the outcome so
 * they can surface failures. Returns a structured result instead of throwing.
 *
 * The `from:` domain follows the operator's explicit spec for TRG-RPT-001
 * ("Nexxus Connect <leads@huminic.ai>"). That domain is verified in Resend
 * per the project .env / central-mcp resend configuration.
 *
 * TRG-RPT-001 (production-send cycle): signature extended from
 *   sendWeeklyReportEmail(toEmail, subject, html)
 * to
 *   sendWeeklyReportEmail(to, subject, html, opts?)
 * where `to` may be a single email or an array, and `opts` may include
 * `{ cc?: string[]; bcc?: string[] }`. The old single-string To: form still
 * works unchanged.
 */
export interface WeeklyReportEmailOpts {
  cc?: string[];
  bcc?: string[];
  /** Optional test-lane session id. When set together with TESTLANE_MODE=true,
   *  to/cc/bcc are hard-routed to TESTLANE_EMAIL_TO and the subject + html are
   *  tagged with [testlane:<sid>]. Detection also fires automatically if
   *  subject or html contains [TESTLANE] or [testlane:]. Two-way fail-closed:
   *  TESTLANE_MODE without a marker BLOCKS the send (returns sent:false);
   *  a marker without TESTLANE_MODE BLOCKS (defensive). */
  testLaneSessionId?: string;
}

/**
 * Compute test-lane recipient override for sendWeeklyReportEmail.
 *
 * Mirrors applyTestLaneRecipientOverride() but operates on the weekly-report
 * to/cc/bcc tuple and additionally tags subject + html when the override
 * fires. Two-way fail-closed (see helper above).
 */
function applyWeeklyReportTestLaneOverride(
  subject: string,
  html: string,
  toArr: string[],
  ccArr: string[],
  bccArr: string[],
  opts: WeeklyReportEmailOpts,
):
  | { ok: true; toArr: string[]; ccArr: string[]; bccArr: string[]; subject: string; html: string; overridden?: boolean; sid?: string }
  | { ok: false; reason: string } {
  const testLaneEnv = process.env.TESTLANE_MODE === "true";
  const requestHasMarker =
    !!opts.testLaneSessionId ||
    (subject || "").includes("[TESTLANE]") ||
    (subject || "").includes("[testlane:") ||
    (html || "").includes("[TESTLANE]") ||
    (html || "").includes("[testlane:");

  if (!testLaneEnv && !requestHasMarker) {
    return { ok: true, toArr, ccArr, bccArr, subject, html };
  }
  if (testLaneEnv && !requestHasMarker) {
    return {
      ok: false,
      reason:
        "TESTLANE_MODE=true but weekly-report send lacks test-lane marker (no opts.testLaneSessionId, no [TESTLANE]/[testlane:] in subject/html) — fail-closed",
    };
  }
  if (!testLaneEnv && requestHasMarker) {
    return {
      ok: false,
      reason:
        "Weekly-report send has test-lane marker but TESTLANE_MODE is not 'true' (fail-closed)",
    };
  }
  // testLaneEnv && requestHasMarker -> override
  const t = process.env.TESTLANE_EMAIL_TO;
  if (!t) {
    return {
      ok: false,
      reason: "TESTLANE_MODE on but TESTLANE_EMAIL_TO unset (fail-closed)",
    };
  }
  const sid = opts.testLaneSessionId || "unknown";
  const tag = `[testlane:${sid}]`;
  const taggedSubject = subject.includes(tag) ? subject : `${tag} ${subject}`;
  const taggedHtml = html.includes(tag)
    ? html
    : `<!-- ${tag} TEST LANE OVERRIDE: original to=${toArr.length} cc=${ccArr.length} bcc=${bccArr.length} -->\n${html}`;
  return {
    ok: true,
    toArr: [t],
    ccArr: [],
    bccArr: [],
    subject: taggedSubject,
    html: taggedHtml,
    overridden: true,
    sid,
  };
}

export async function sendWeeklyReportEmail(
  to: string | string[],
  subject: string,
  html: string,
  opts: WeeklyReportEmailOpts = {},
): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  const FROM = "Nexxus Connect <leads@huminic.ai>";

  // Normalize `to` → array of trimmed non-empty emails. A legacy single
  // comma-separated string is also accepted and split.
  // (declared with `let` so the test-lane guard below can hard-route to/cc/bcc.)
  let toArr: string[] = Array.isArray(to)
    ? to.map((e) => (typeof e === "string" ? e.trim() : "")).filter(Boolean)
    : typeof to === "string"
      ? to.split(",").map((e) => e.trim()).filter(Boolean)
      : [];

  let ccArr: string[] = Array.isArray(opts.cc)
    ? opts.cc.map((e) => (typeof e === "string" ? e.trim() : "")).filter(Boolean)
    : [];
  let bccArr: string[] = Array.isArray(opts.bcc)
    ? opts.bcc.map((e) => (typeof e === "string" ? e.trim() : "")).filter(Boolean)
    : [];

  // Guards — basic email shape check on every address in every list
  const emailShape = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (toArr.length === 0) {
    return { sent: false, error: "At least one To: recipient is required." };
  }
  for (const e of [...toArr, ...ccArr, ...bccArr]) {
    if (!emailShape.test(e)) {
      return { sent: false, error: `Recipient email looks invalid: ${e}` };
    }
  }
  if (!subject || !html) {
    return { sent: false, error: "Subject and html are required." };
  }

  // ── TEST LANE GUARD ─────────────────────────────────────────────────────────
  // Two-way fail-closed. Mirrors processOutboundSend in server/outbound.ts and
  // applyTestLaneRecipientOverride above. When TESTLANE_MODE=true with no
  // marker, BLOCK; when a marker is present without TESTLANE_MODE, BLOCK; when
  // both, hard-route to TESTLANE_EMAIL_TO and tag subject + html.
  const tl = applyWeeklyReportTestLaneOverride(subject, html, toArr, ccArr, bccArr, opts);
  if (!tl.ok) {
    console.log(`[WeeklyReport] Test-lane gate BLOCKED weekly-report send: ${tl.reason}`);
    return { sent: false, error: `test-lane gate blocked: ${tl.reason}` };
  }
  if (tl.overridden) {
    console.log(
      `[WeeklyReport] Test-lane override ACTIVE sid=${tl.sid} — original to=${toArr.length} cc=${ccArr.length} bcc=${bccArr.length} -> hard-routed to ${tl.toArr.join(",")}`,
    );
  }
  toArr = tl.toArr;
  ccArr = tl.ccArr;
  bccArr = tl.bccArr;
  subject = tl.subject;
  html = tl.html;
  // ── END TEST LANE GUARD ─────────────────────────────────────────────────────

  const hasExtras = ccArr.length > 0 || bccArr.length > 0;

  try {
    // Path A: no cc/bcc → route through callMCP for backward-compat.
    if (!hasExtras) {
      console.log(
        `[WeeklyReport] Sending report "${subject}" to ${toArr.join(", ")} (via MCP)`,
      );
      const resp = await callMCP("resend_send_email", {
        from: FROM,
        to: toArr.join(","),
        subject,
        html,
      });
      const messageId: string | undefined =
        (resp && typeof resp === "object" && (resp as any).id) ||
        (resp && typeof resp === "object" && (resp as any).data?.id) ||
        undefined;
      console.log(`[WeeklyReport] Sent. messageId=${messageId ?? "(not returned)"}`);
      return { sent: true, messageId };
    }

    // Path B: cc/bcc present → call Resend REST API directly (same pattern as
    // the ADF sender in server/routes/webhooks.ts).
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return {
        sent: false,
        error: "RESEND_API_KEY is not configured — cannot send with cc/bcc.",
      };
    }
    console.log(
      `[WeeklyReport] Sending report "${subject}" to=${toArr.length} cc=${ccArr.length} bcc=${bccArr.length} (via Resend direct)`,
    );
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: toArr,
        cc: ccArr.length > 0 ? ccArr : undefined,
        bcc: bccArr.length > 0 ? bccArr : undefined,
        subject,
        html,
      }),
    });
    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      const msg = `Resend API error ${emailRes.status}: ${errBody}`;
      console.error(`[WeeklyReport] ${msg}`);
      return { sent: false, error: msg };
    }
    const data = (await emailRes.json()) as { id?: string };
    console.log(`[WeeklyReport] Sent. messageId=${data.id ?? "(not returned)"}`);
    return { sent: true, messageId: data.id };
  } catch (err: any) {
    const msg = err?.message || String(err);
    console.error(`[WeeklyReport] Send failed: ${msg}`);
    return { sent: false, error: msg };
  }
}

/**
 * Send "24-Hour Check-In Delivered" notification to org admins.
 * Non-blocking — errors are logged but never thrown to caller.
 */
export async function sendCheckInDeliveredNotification(params: TriggerNotificationParams): Promise<void> {
  try {
    const org = await storage.getOrganization(params.orgId);
    if (!org) {
      console.log(`[TriggerNotify] Org not found: ${params.orgId}, skipping check-in notification`);
      return;
    }

    // CommGate: respect org email settings
    if (!org.outboundEnabled || !org.emailEnabled) {
      console.log(`[TriggerNotify] CommGate blocked — org ${org.name} outbound=${org.outboundEnabled} email=${org.emailEnabled}. Skipping check-in notification`);
      return;
    }

    // Idempotency key — scoped to phone + hour to prevent duplicates
    const idempotencyKey = `trigger-checkin-${params.customerPhone}-${new Date().toISOString().slice(0, 13)}`;

    // Check for duplicate
    const existingLogs = await storage.getOutboundLogs(params.orgId, {});
    const alreadySent = existingLogs.some(
      log => log.channel === "email" && log.status === "sent" && log.messageContent?.includes(`[notification:${idempotencyKey}]`)
    );
    if (alreadySent) {
      console.log(`[TriggerNotify] Skipping duplicate check-in notification for ${idempotencyKey}`);
      return;
    }

    const adminRecipients = await resolveAdminRecipients(params.orgId);
    if (adminRecipients.length === 0) {
      console.log(`[TriggerNotify] No admin recipients found for org ${org.name}, skipping check-in notification`);
      return;
    }

    // \u2500\u2500 TEST LANE: override admin recipients when this notification is part of
    // a test-lane session. Two-way fail-closed (see helper).
    const tl = applyTestLaneRecipientOverride(params, adminRecipients);
    if (!tl.ok) {
      console.log(`[TriggerNotify] Test-lane gate BLOCKED notification for org ${org.name}: ${tl.reason}`);
      return;
    }
    const recipients = tl.recipients;
    const tlTag = tl.overridden ? `[testlane:${tl.sid}] ` : "";

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const subject = `${tlTag}\u2705 ${org.name} \u2014 24-Hour Lead Check-In Delivered to ${params.customerName}`;

    const htmlBody = generateCheckInDeliveredHTML({
      orgName: org.name,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      messageSent: params.messageSent,
      vehicleOfInterest: params.vehicleOfInterest,
      timestamp,
    });

    console.log(`[TriggerNotify] Sending check-in notification to ${recipients.length} admin(s) for org "${org.name}"${tl.overridden ? ` (TEST LANE override -> ${recipients.join(",")})` : ""}`);

    await callMCP("resend_send_email", {
      from: FROM_ADDRESS,
      to: recipients.join(","),
      subject,
      html: htmlBody,
    });

    // Log for idempotency tracking
    await storage.createOutboundLog({
      organizationId: params.orgId,
      campaignId: null,
      recipientId: null,
      channel: "email",
      status: "sent",
      blockedReason: null,
      messageContent: `${tlTag}[notification:${idempotencyKey}] ${subject} \u2014 sent to ${recipients.length} admin(s)`,
      recipientEmail: recipients.join(", "),
      recipientName: `${tl.overridden ? "[TESTLANE] " : ""}${recipients.length} admin(s)`,
      sentAt: new Date(),
    });

    console.log(`[TriggerNotify] Check-in notification sent to ${recipients.length} admin(s) for org "${org.name}"`);
  } catch (err: any) {
    console.error(`[TriggerNotify] Failed to send check-in notification for org ${params.orgId}:`, err.message);
  }
}
