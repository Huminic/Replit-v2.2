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

    const recipients = await resolveAdminRecipients(params.orgId);
    if (recipients.length === 0) {
      console.log(`[TriggerNotify] No admin recipients found for org ${org.name}, skipping AI follow-up notification`);
      return;
    }

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const subject = `\u{1F916} ${org.name} \u2014 AI Follow-Up Initiated for ${params.customerName}`;

    const htmlBody = generateAIFollowUpHTML({
      orgName: org.name,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      triggerType: params.triggerType,
      messageSent: params.messageSent,
      timestamp,
    });

    console.log(`[TriggerNotify] Sending AI follow-up notification to ${recipients.length} admin(s) for org "${org.name}"`);

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
      messageContent: `[notification:${idempotencyKey}] ${subject} \u2014 sent to ${recipients.length} admin(s)`,
      recipientEmail: recipients.join(", "),
      recipientName: `${recipients.length} admin(s)`,
      sentAt: new Date(),
    });

    console.log(`[TriggerNotify] AI follow-up notification sent to ${recipients.length} admin(s) for org "${org.name}"`);
  } catch (err: any) {
    console.error(`[TriggerNotify] Failed to send AI follow-up notification for org ${params.orgId}:`, err.message);
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

    const recipients = await resolveAdminRecipients(params.orgId);
    if (recipients.length === 0) {
      console.log(`[TriggerNotify] No admin recipients found for org ${org.name}, skipping check-in notification`);
      return;
    }

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const subject = `\u2705 ${org.name} \u2014 24-Hour Lead Check-In Delivered to ${params.customerName}`;

    const htmlBody = generateCheckInDeliveredHTML({
      orgName: org.name,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      messageSent: params.messageSent,
      vehicleOfInterest: params.vehicleOfInterest,
      timestamp,
    });

    console.log(`[TriggerNotify] Sending check-in notification to ${recipients.length} admin(s) for org "${org.name}"`);

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
      messageContent: `[notification:${idempotencyKey}] ${subject} \u2014 sent to ${recipients.length} admin(s)`,
      recipientEmail: recipients.join(", "),
      recipientName: `${recipients.length} admin(s)`,
      sentAt: new Date(),
    });

    console.log(`[TriggerNotify] Check-in notification sent to ${recipients.length} admin(s) for org "${org.name}"`);
  } catch (err: any) {
    console.error(`[TriggerNotify] Failed to send check-in notification for org ${params.orgId}:`, err.message);
  }
}
