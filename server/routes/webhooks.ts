import type { Express } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { storage } from "../storage";
import { billingService } from "../services/billingService";
import { callMCP } from "../vendorProxy";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

function getNextBusinessDay10am(): Date {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }
  next.setHours(10, 0, 0, 0);
  return next;
}

function parsePreferredDateTime(preferredDate: string | null, preferredTime: string | null): Date {
  if (!preferredDate) return getNextBusinessDay10am();
  try {
    const dateStr = preferredTime ? `${preferredDate} ${preferredTime}` : preferredDate;
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;
  } catch {}
  return getNextBusinessDay10am();
}

async function analyzeTranscriptWithClaude(params: {
  transcript: string;
  organizationId: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail?: string | null;
  source: "vapi" | "tavus";
  conversationId: string;
}): Promise<void> {
  try {
    const aiResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Analyze this dealership call transcript and extract the following as JSON:
{
  "appointmentIntent": boolean,
  "preferredDate": string | null,
  "preferredTime": string | null,
  "customerName": string | null,
  "vehicleOfInterest": string | null,
  "leadQualityScore": number,
  "summary": string
}

appointmentIntent: did the customer express interest in scheduling a visit or appointment?
preferredDate: any mentioned date/time preference
preferredTime: any mentioned time preference
customerName: if mentioned
vehicleOfInterest: make/model/year if mentioned
leadQualityScore: 1-10 based on purchase intent, urgency, budget signals
summary: 2-sentence summary of the call

Return ONLY the JSON object, no other text.

Transcript:
${params.transcript}`,
      }],
    });

    let analysisData: any = null;
    const textBlock = aiResponse.content.find(b => b.type === "text");
    if (textBlock && textBlock.type === "text") {
      let rawText = textBlock.text.trim();
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) rawText = jsonMatch[1].trim();
      analysisData = JSON.parse(rawText);
    }

    if (!analysisData) {
      console.warn("[AI-Analysis] No analysis data returned from Claude");
      return;
    }

    console.log(`[AI-Analysis] Result for ${params.source} conversation ${params.conversationId}:`, JSON.stringify(analysisData));

    if (analysisData.appointmentIntent) {
      const startTime = parsePreferredDateTime(analysisData.preferredDate, analysisData.preferredTime);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      const resolvedName = analysisData.customerName || params.customerName;

      await storage.createAppointment({
        title: `${params.source === "vapi" ? "Call" : "Video"} Appointment — ${resolvedName}`,
        customerName: resolvedName,
        customerPhone: params.customerPhone,
        customerEmail: params.customerEmail || null,
        appointmentType: "sales",
        department: "sales",
        organizationId: params.organizationId,
        startTime,
        endTime,
        status: "pending",
        source: params.source,
        notes: analysisData.summary || null,
      });
      console.log(`[AI-Analysis] Appointment created for ${resolvedName} (source: ${params.source})`);

      try {
        const matchingLeads = await storage.findWarehouseLeadsByContact(
          params.organizationId,
          params.customerPhone,
          params.customerEmail || null
        );
        for (const lead of matchingLeads) {
          if ((lead.followupStep || 0) < 999) {
            await storage.suppressLeadFollowup(lead.id, `Appointment booked via ${params.source}: ${resolvedName}`);
            console.log(`[Conversion] AI appointment — suppressed follow-up for lead ${lead.id} (${lead.customerName})`);
          }
        }
      } catch (suppressErr: any) {
        console.error("[Conversion] Error suppressing follow-ups after AI appointment:", suppressErr.message);
      }
    }

    if (analysisData.leadQualityScore && params.customerPhone) {
      const leads = await storage.getWarehouseLeads(params.organizationId, { limit: 50 });
      const normalizePhone = (p: string) => p.replace(/[^0-9]/g, "").slice(-10);
      const targetPhone = normalizePhone(params.customerPhone);
      const matchingLead = leads.find(l => l.customerPhone && normalizePhone(l.customerPhone) === targetPhone);
      if (matchingLead) {
        await storage.updateWarehouseLeadScore(matchingLead.id, analysisData.leadQualityScore);
        console.log(`[AI-Analysis] Updated lead ${matchingLead.id} with score ${analysisData.leadQualityScore}`);
      }
    }
  } catch (analysisErr: any) {
    console.error(`[AI-Analysis] Failed for ${params.source} conversation ${params.conversationId}:`, analysisErr.message);
  }
}

/**
 * Send a lead notification email to all admins for an organization.
 * Uses callMCP with resend_send_email. Non-blocking — callers should .catch() errors.
 *
 * Recipient hierarchy:
 *   Level 3 — Org admins: users whose organizationId matches the call's org
 *   Level 2 — Partner admins: walk UP via partner_id to find parent org, get its level-2 users
 *   Level 1 — Super admins: level-1 users from ALL orgs
 *   Additional — Any user (level <= 3) who has this orgId in their additional_org_ids
 *   Exclusion — admin@ test email addresses are always excluded
 */
async function sendLeadNotificationEmail(
  orgId: string,
  subject: string,
  htmlBody: string,
  idempotencyKey: string
): Promise<{ sent: number; skipped: boolean }> {
  // CommGate check: respect the org's outbound_enabled flag
  const org = await storage.getOrganization(orgId);
  if (!org || !org.outboundEnabled || !org.emailEnabled) {
    console.log(`[LeadNotify] CommGate blocked — org ${org?.name || orgId} outbound=${org?.outboundEnabled} email=${org?.emailEnabled}. Skipping ${idempotencyKey}`);
    return { sent: 0, skipped: true };
  }

  // Idempotency check: look for an existing outbound_log entry with this key in messageContent
  const existingLogs = await storage.getOutboundLogs(orgId, {});
  const alreadySent = existingLogs.some(
    (log) =>
      log.channel === "email" &&
      log.status === "sent" &&
      log.messageContent?.includes(`[notification:${idempotencyKey}]`)
  );
  if (alreadySent) {
    console.log(`[LeadNotify] Skipping duplicate notification for ${idempotencyKey}`);
    return { sent: 0, skipped: true };
  }

  // ---- Recipient resolution: walk the org hierarchy ----
  const recipientEmails = new Set<string>();

  // Level 3 — Org admins: users whose organizationId matches the call's org
  const orgUsers = await storage.getUsers(orgId);
  for (const u of orgUsers) {
    if (u.role && u.role.level === 3 && u.email && u.isActive !== false) {
      recipientEmails.add(u.email);
    }
  }

  // Level 2 — Partner admins: walk UP via partner_id to find parent org
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

  // Additional — users (level <= 3) who have this orgId in their additional_org_ids
  for (const anyOrg of allOrgs) {
    if (anyOrg.id === orgId) continue; // already handled above
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

  // Exclusion — remove test/seed accounts (belt-and-suspenders alongside isActive check)
  const testPatterns = ['@nexxus.com', '@test.com'];
  for (const email of recipientEmails) {
    if (email.startsWith("admin@") || testPatterns.some(p => email.endsWith(p))) {
      recipientEmails.delete(email);
    }
  }

  const recipients = Array.from(recipientEmails);
  if (recipients.length === 0) {
    console.warn(`[LeadNotify] No recipients found for org ${org.name} (${orgId}). Skipping ${idempotencyKey}`);
    return { sent: 0, skipped: false };
  }

  console.log(`[LeadNotify] Resolved ${recipients.length} recipient(s) for org "${org.name}": ${recipients.join(", ")}`);

  let sentCount = 0;
  const FROM_ADDRESS = "Nexxus Connect <notifications@huminic.ai>";

  for (const email of recipients) {
    try {
      await callMCP("resend_send_email", {
        from: FROM_ADDRESS,
        to: email,
        subject,
        html: htmlBody,
      });
      sentCount++;
    } catch (emailErr: any) {
      console.error(`[LeadNotify] Failed to send to ${email}:`, emailErr.message);
    }
  }

  // Log the notification for idempotency tracking
  try {
    await storage.createOutboundLog({
      organizationId: orgId,
      campaignId: null,
      recipientId: null,
      channel: "email",
      status: "sent",
      blockedReason: null,
      messageContent: `[notification:${idempotencyKey}] ${subject} — sent to ${sentCount} admin(s)`,
      sentAt: new Date(),
    });
  } catch (logErr: any) {
    console.error(`[LeadNotify] Failed to log notification:`, logErr.message);
  }

  console.log(`[LeadNotify] Sent "${subject}" to ${sentCount} admin(s) for org ${orgId}`);
  return { sent: sentCount, skipped: false };
}

/**
 * Generate lead notification email HTML.
 * Template ported from v1 notificationEmailService.ts (generateEmailHTML).
 * Supports both voice (VAPI) and video (Tavus) notifications.
 */
function generateLeadEmailHTML(params: {
  orgName: string;
  assistantName: string;
  customerPhone?: string | null;
  callType?: string;
  duration: string;
  endedReason?: string;
  /** VIN Solutions insertion status */
  vinStatus?: string;
  summary: string;
  transcript?: string;
  recordingUrl?: string | null;
  callId: string;
  startTime?: string;
  /** "voice" or "video" — controls gradient color and wording */
  channel: "voice" | "video";
}): string {
  const isVideo = params.channel === "video";
  const gradientStart = isVideo ? "#7c3aed" : "#667eea";
  const gradientEnd = isVideo ? "#a855f7" : "#764ba2";
  const accentColor = isVideo ? "#7c3aed" : "#667eea";
  const headerEmoji = isVideo ? "&#127916;" : "&#127919;";
  const headerSubtitle = isVideo ? "Has a New Video Session Lead!" : "Has a New AI Voice Lead!";
  const introText = isVideo
    ? "A visitor just completed a video session with your AI assistant."
    : `Congratulations! Your AI assistant <strong>${params.assistantName}</strong> just completed a call with a potential customer.`;

  const summaryBlock = params.summary && params.summary !== "No summary available"
    ? `
          <tr>
            <td style="padding: 0 40px 20px;">
              <div style="background: #f8f9fa; border-left: 4px solid ${accentColor}; padding: 16px 20px; border-radius: 4px;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
                  Lead Summary
                </h3>
                <p style="margin: 0; font-size: 15px; color: #333; line-height: 1.6;">
                  ${params.summary}
                </p>
              </div>
            </td>
          </tr>`
    : "";

  // Build detail rows
  let detailRows = `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666; width: 40%;">Assistant:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: 500;">${params.assistantName}</td>
                </tr>`;

  if (params.customerPhone) {
    detailRows += `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666;">Customer Phone:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: 500;">${params.customerPhone}</td>
                </tr>`;
  }

  if (params.callType) {
    detailRows += `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666;">Call Type:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: 500;">${params.callType}</td>
                </tr>`;
  }

  detailRows += `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666;">Duration:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: 500;">${params.duration}</td>
                </tr>`;

  if (params.startTime) {
    detailRows += `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666;">Timestamp:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: 500;">${params.startTime}</td>
                </tr>`;
  }

  if (params.endedReason) {
    detailRows += `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666;">Ended Reason:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: 500;">${params.endedReason}</td>
                </tr>`;
  }

  if (params.vinStatus) {
    detailRows += `
                <tr>
                  <td style="padding: 8px 0; font-size: 14px; color: #666;">VIN Solutions:</td>
                  <td style="padding: 8px 0; font-size: 14px; color: #333; font-weight: 500;">${params.vinStatus}</td>
                </tr>`;
  }

  const recordingBlock = params.recordingUrl
    ? `
          <tr>
            <td style="padding: 0 40px 30px; text-align: center;">
              <a href="${params.recordingUrl}" style="display: inline-block; background: ${accentColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                &#127911; Listen to Recording
              </a>
            </td>
          </tr>`
    : "";

  const transcriptBlock = params.transcript
    ? `
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #333; font-weight: 600;">
                Full Transcript
              </h3>
              <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 20px; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.8; color: #495057; white-space: pre-wrap; max-height: 400px; overflow-y: auto;">
${params.transcript}
              </div>
            </td>
          </tr>`
    : "";

  const supportEmail = process.env.SUPPORT_EMAIL || "support@huminic.ai";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New AI ${isVideo ? "Video" : "Voice"} Lead</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 600;">
                ${headerEmoji} ${params.orgName}
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                ${headerSubtitle}
              </p>
            </td>
          </tr>

          <!-- Intro Section -->
          <tr>
            <td style="padding: 30px 40px 20px;">
              <p style="margin: 0; font-size: 16px; color: #333; line-height: 1.5;">
                ${introText}
              </p>
            </td>
          </tr>

          <!-- Lead Summary Box -->
          ${summaryBlock}

          <!-- Details Grid -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                ${detailRows}
              </table>
            </td>
          </tr>

          <!-- Recording Link Button -->
          ${recordingBlock}

          <!-- Transcript Section -->
          ${transcriptBlock}

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 30px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #666; line-height: 1.5;">
                <strong>Call ID:</strong> ${params.callId}<br>
                <strong>Questions or issues?</strong> Contact <a href="mailto:${supportEmail}" style="color: ${accentColor}; text-decoration: none;">${supportEmail}</a>
              </p>
              <p style="margin: 15px 0 0 0; font-size: 11px; color: #999;">
                Powered by Nexxus AI Voice Platform
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

// VAPI webhook call object schema (shared between wrapped and flat formats)
const vapiCallSchema = z.object({
  id: z.string().optional(),
  orgId: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  phoneNumber: z.object({
    number: z.string().optional(),
  }).optional(),
  customer: z.object({
    number: z.string().optional(),
    name: z.string().optional(),
  }).optional(),
  transcript: z.string().optional(),
  summary: z.string().optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  assistantId: z.string().optional(),
  recordingUrl: z.string().optional(),
  artifact: z.object({
    transcript: z.string().optional(),
    messages: z.array(z.object({
      role: z.string().optional(),
      message: z.string().optional(),
      content: z.string().optional(),
    })).optional(),
    recordingUrl: z.string().optional(),
  }).optional(),
  messages: z.array(z.object({
    role: z.string().optional(),
    message: z.string().optional(),
    content: z.string().optional(),
  })).optional(),
});

// Accept BOTH old format (wrapped in `message`) and new flat format
const vapiWebhookPayloadSchema = z.union([
  // Old format: { message: { type, call, ... } }
  z.object({
    message: z.object({
      type: z.string(),
      call: vapiCallSchema.optional(),
      recordingUrl: z.string().optional(),
    }),
  }),
  // New/flat format: { type, call, ... } (no message wrapper)
  z.object({
    type: z.string(),
    call: vapiCallSchema.optional(),
    recordingUrl: z.string().optional(),
    // VAPI sometimes sends artifact at top level in flat format
    artifact: z.object({
      transcript: z.string().optional(),
      messages: z.array(z.object({
        role: z.string().optional(),
        message: z.string().optional(),
        content: z.string().optional(),
      })).optional(),
      recordingUrl: z.string().optional(),
    }).optional(),
    messages: z.array(z.object({
      role: z.string().optional(),
      message: z.string().optional(),
      content: z.string().optional(),
    })).optional(),
  }),
]);

// Track processed VAPI call IDs to prevent duplicate conversations (I-177)
const processedVapiCalls = new Map<string, { conversationId: string; timestamp: number }>();
// Clean up old entries every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [key, val] of processedVapiCalls) {
    if (val.timestamp < cutoff) processedVapiCalls.delete(key);
  }
}, 10 * 60 * 1000);

export function registerWebhookRoutes(app: Express) {
  app.post("/api/webhooks/vapi", async (req, res) => {
    try {
      const vapiSecret = process.env.VAPI_WEBHOOK_SECRET;
      if (vapiSecret) {
        const headerSecret = req.headers["x-vapi-secret"] || req.headers["authorization"];
        const providedSecret = typeof headerSecret === "string" ? headerSecret.replace(/^Bearer\s+/i, "") : "";
        if (providedSecret !== vapiSecret) {
          console.warn("[VAPI Webhook] Invalid secret — rejecting request");
          return res.status(401).json({ message: "Unauthorized" });
        }
      }

      const parsed = vapiWebhookPayloadSchema.safeParse(req.body);
      if (!parsed.success) {
        console.warn("[VAPI Webhook] Invalid payload:", JSON.stringify(parsed.error.flatten()));
        console.warn("[VAPI Webhook] Raw body keys:", Object.keys(req.body || {}));
        return res.status(400).json({ message: "Invalid webhook payload" });
      }

      // Normalize: extract message-like shape from both old and flat formats
      const data = parsed.data;
      const message = "message" in data ? data.message : data;
      const eventType = message.type;

      if (eventType !== "end-of-call-report" && eventType !== "call-ended") {
        return res.json({ message: "Event type ignored", type: eventType });
      }

      const call = message.call;
      if (!call) {
        return res.status(400).json({ message: "Missing call data in payload" });
      }

      const vapiCallId = call.id || null;
      const customerName = call.customer?.name || "Unknown Caller";
      const customerPhone = call.customer?.number || call.phoneNumber?.number || null;
      const assistantId = call.assistantId || null;

      // Extract transcript from multiple possible locations in VAPI payload:
      // 1. call.transcript (old format)
      // 2. call.artifact.transcript (new format)
      // 3. call.artifact.messages or call.messages array (structured transcript)
      // 4. Top-level artifact/messages (flat format)
      let transcript = call.transcript || "";
      let summary = call.summary || "";

      // Check artifact.transcript (new VAPI format)
      const artifact = call.artifact || ("artifact" in data ? (data as any).artifact : null);
      if (!transcript && artifact?.transcript) {
        transcript = artifact.transcript;
      }

      // Check messages array (structured transcript from VAPI)
      const messagesArray = call.messages || ("messages" in data ? (data as any).messages : null) || artifact?.messages;
      if (!transcript && messagesArray && Array.isArray(messagesArray) && messagesArray.length > 0) {
        transcript = messagesArray
          .map((m: any) => `${m.role || "unknown"}: ${m.message || m.content || ""}`)
          .filter((line: string) => line.length > 10)
          .join("\n");
      }

      // Check artifact.recordingUrl as fallback
      const recordingUrl = call.recordingUrl || message.recordingUrl || artifact?.recordingUrl || null;

      let organizationId: string | null = null;
      let agentId: string | null = null;

      if (assistantId) {
        const allOrgs = await storage.getOrganizations();
        for (const org of allOrgs) {
          const orgAgents = await storage.getAgents(org.id);
          const matchingAgent = orgAgents.find(a => a.vapiAssistantId === assistantId);
          if (matchingAgent) {
            organizationId = org.id;
            agentId = matchingAgent.id;
            break;
          }
        }
      }

      if (!organizationId) {
        // Fallback: try to find an org with an active voice agent and assign the call there
        console.warn(`[VAPI Webhook] Could not resolve organization from assistantId "${assistantId}" — attempting fallback lookup.`);
        const allOrgs = assistantId ? [] : await storage.getOrganizations(); // already fetched above if assistantId was set
        const fallbackOrgs = assistantId ? await storage.getOrganizations() : allOrgs;
        for (const org of fallbackOrgs) {
          const orgAgents = await storage.getAgents(org.id);
          const voiceAgent = orgAgents.find(a => a.channels?.includes("voice") && a.status === "active");
          if (voiceAgent) {
            organizationId = org.id;
            // Don't assign agentId — we can't confirm which agent handled the call
            console.warn(`[VAPI Webhook] Fallback: assigning call to org "${org.name}" (${org.id}), agentId left null.`);
            break;
          }
        }
        if (!organizationId) {
          console.error("[VAPI Webhook] Fallback failed — no org with an active voice agent found. Rejecting.");
          return res.status(422).json({ message: "No organization found to associate call with. Configure agent's VAPI assistant ID." });
        }
      }

      // Dedup: if we already processed this VAPI call, update transcript if available instead of creating duplicate (I-177, I-176)
      if (vapiCallId && processedVapiCalls.has(vapiCallId)) {
        const existing = processedVapiCalls.get(vapiCallId)!;
        // If this event has a transcript and the previous one may not have stored it, add it now (I-176)
        if (transcript || summary) {
          const messageContent = summary
            ? `**Call Summary:**\n${summary}\n\n**Transcript:**\n${transcript}`
            : transcript;
          const existingMessages = await storage.getMessages(existing.conversationId);
          const hasTranscript = existingMessages.some(m => m.senderName === "VAPI");
          if (!hasTranscript) {
            await storage.createMessage({
              conversationId: existing.conversationId,
              role: "system",
              content: messageContent,
              senderName: "VAPI",
            });
            console.log(`[VAPI Webhook] Added transcript to existing conversation ${existing.conversationId} from duplicate event`);
          }
        }
        console.log(`[VAPI Webhook] Duplicate call ID ${vapiCallId} — skipping conversation creation`);
        return res.json({ success: true, conversationId: existing.conversationId, deduplicated: true });
      }

      const conversation = await storage.createConversation({
        customerName,
        customerPhone,
        channel: "voice",
        status: "open",
        agentId,
        organizationId,
        unreadCount: 1,
        lastMessageAt: new Date(),
      });

      // Track this call to prevent duplicates
      if (vapiCallId) {
        processedVapiCalls.set(vapiCallId, { conversationId: conversation.id, timestamp: Date.now() });
      }

      if (transcript || summary) {
        const messageContent = summary
          ? `**Call Summary:**\n${summary}\n\n**Transcript:**\n${transcript}`
          : transcript;

        await storage.createMessage({
          conversationId: conversation.id,
          role: "system",
          content: messageContent,
          senderName: "VAPI",
        });
      }

      let vinContactHref: string | null = null;
      let vinLeadCreated = false;
      const vapiPayloadSnapshot = {
        callId: call.id,
        assistantId,
        customerName,
        customerPhone,
        callStatus: call.status,
        transcriptLength: transcript.length,
        summaryLength: summary.length,
      };

      // VIN lead creation — re-enabled (I-194 fix, T-010a)
      // Per-dealer vinLeadSourceName configured in org.settings.
      // Safety: reject test phone numbers (555-prefix) and require transcript.
      const vinPhone = customerPhone ? customerPhone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1") : undefined;
      const isTestPhone = vinPhone && (vinPhone.startsWith("555") || vinPhone.startsWith("5550"));
      const hasTranscript = !!(transcript && transcript.trim().length > 0);

      if (!isTestPhone && vinPhone && hasTranscript) {
      try {
        // VIN lead creation via vin-safe-mcp REST API (port 4003)
        // Per-dealer userId and leadSourceName resolved from integrations table
        const integration = await storage.getIntegrations(organizationId, { provider: "vinsolutions" });
        const vinUserId = integration?.[0]?.defaultVinUserId || null;

        // Use "AI" / "Lead" when caller name is unknown or generic
        const isUnknownName = !customerName || customerName === "Unknown Caller" || customerName.trim() === "";
        const nameParts = isUnknownName ? ["AI", "Lead"] : customerName.split(" ");
        const firstName = nameParts[0] || "AI";
        const lastName = nameParts.slice(1).join(" ") || "Lead";

        const VIN_SAFE_URL = process.env.VIN_SAFE_MCP_URL || "http://0.0.0.0:4003";
        const VIN_SAFE_TOKEN = process.env.VIN_SAFE_MCP_TOKEN || "8NCVZ8ZCgHtab6A+FxHsgOKcgir89KvOR+wMIpYFLp4=";

        // Resolve lead source name from org settings (configured per-dealer in T-010a).
        // Fallback to "Dealers WebSite" which is correct for Serra Honda, Serra Nissan, Tony Serra Ford.
        const orgForVin = await storage.getOrganization(organizationId);
        const orgSettings = (orgForVin?.settings || {}) as Record<string, any>;
        const vinLeadSourceName = orgSettings.vinLeadSourceName || "Dealers WebSite";

        const prepareBody: Record<string, any> = {
          orgId: organizationId,
          firstName,
          lastName,
          phone: vinPhone,
          leadType: "PHONE",
          leadSourceName: vinLeadSourceName,
          description: `${summary || `Inbound VAPI call from ${customerName}`}\n\nRecording: ${recordingUrl || "N/A"}`,
        };
        if (vinUserId) prepareBody.userId = vinUserId;

        const prepareRes = await fetch(`${VIN_SAFE_URL}/api/tool/vin_safe_prepare_lead`, {
          method: "POST",
          headers: { Authorization: `Bearer ${VIN_SAFE_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify(prepareBody),
        });
        const prepareData = await prepareRes.json();

        if (prepareData.status === "READY" && prepareData.approval_token) {
          console.log(`[VAPI→VIN] Prepare OK: assigned to ${prepareData.resolution?.assignedTo?.name}, source=${prepareData.resolution?.leadSource?.name}`);

          const executeRes = await fetch(`${VIN_SAFE_URL}/api/tool/vin_safe_execute_lead`, {
            method: "POST",
            headers: { Authorization: `Bearer ${VIN_SAFE_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ approval_token: prepareData.approval_token, user_confirmed: true }),
          });
          const executeData = await executeRes.json();

          if (executeData.status === "EXECUTED" && executeData.verification?.status === "VERIFIED_CORRECT") {
            vinContactHref = String(executeData.contactId);
            vinLeadCreated = true;
            console.log(`[VAPI→VIN] Lead created: contact=${executeData.contactId}, lead=${executeData.leadId}, assigned=${executeData.verification.assignedTo?.name}`);
          } else {
            console.error(`[VAPI→VIN] Execute failed or verification mismatch:`, JSON.stringify(executeData).slice(0, 500));
            await storage.createTask({
              type: "escalation",
              title: "VIN Lead Creation Failed (Execute/Verify)",
              description: `Prepare succeeded but execute/verify failed.\n\nResult: ${JSON.stringify(executeData).slice(0, 1000)}`,
              status: "todo",
              priority: "critical",
              organizationId,
              tags: ["escalation", "vin-integration", "vapi", "auto-generated"],
              metadata: JSON.stringify({ trigger_id: `vapi-vin-${Date.now()}`, org_id: organizationId, execute_result: executeData, conversation_id: conversation.id }),
            });
          }
        } else {
          console.error(`[VAPI→VIN] Prepare failed:`, JSON.stringify(prepareData).slice(0, 500));
          await storage.createTask({
            type: "escalation",
            title: "VIN Lead Prepare Failed",
            description: `vin_safe_prepare_lead returned: ${JSON.stringify(prepareData).slice(0, 1000)}`,
            status: "todo",
            priority: "critical",
            organizationId,
            tags: ["escalation", "vin-integration", "vapi", "auto-generated"],
            metadata: JSON.stringify({ trigger_id: `vapi-vin-${Date.now()}`, org_id: organizationId, prepare_result: prepareData, conversation_id: conversation.id }),
          });
        }
      } catch (vinErr: any) {
        console.error(`[VAPI→VIN] FAILED:`, vinErr.message);
        await storage.createTask({
          type: "escalation",
          title: "VIN Lead Creation Failed",
          description: `Failed to create VIN Solutions lead for VAPI call.\n\nCaller: ${customerName} (${customerPhone || "no phone"})\nError: ${vinErr.message}`,
          status: "todo",
          priority: "critical",
          organizationId,
          tags: ["escalation", "vin-integration", "vapi", "auto-generated"],
          metadata: JSON.stringify({
            trigger_id: `vapi-vin-${Date.now()}`,
            org_id: organizationId,
            failed_step: 1,
            error_response: vinErr.message,
            timestamp: new Date().toISOString(),
            original_vapi_data: vapiPayloadSnapshot,
            conversation_id: conversation.id,
          }),
        });
        storage.createActivityLog({
          organizationId,
          action: "vin_lead_creation_failed",
          entityType: "conversation",
          entityId: conversation.id,
          metadata: { error: vinErr.message, customerName, customerPhone },
        }).catch(() => {});
      }
      } else {
        // Skip VIN lead creation: test phone, missing phone, or no transcript
        if (isTestPhone) console.log(`[VAPI→VIN] Skipped: test phone number ${vinPhone}`);
        else if (!vinPhone) console.log(`[VAPI→VIN] Skipped: no phone number`);
        else if (!hasTranscript) console.log(`[VAPI→VIN] Skipped: no transcript (ringing-only or failed call)`);
      }

      const users = await storage.getUsers(organizationId);
      const adminUsers = users.filter(u => u.role && u.role.level <= 3);
      for (const user of adminUsers) {
        storage.createNotification({
          userId: user.id,
          organizationId,
          type: "call",
          title: "New Inbound Call Completed",
          message: `Call from ${customerName}${customerPhone ? ` (${customerPhone})` : ""} has been completed and added to TeamBox.${vinLeadCreated ? " VIN lead created." : ""}`,
          relatedEntityType: "conversation",
          relatedEntityId: conversation.id,
        }).catch(() => {});
      }

      storage.createActivityLog({
        organizationId,
        action: "vapi_call_received",
        entityType: "conversation",
        entityId: conversation.id,
        metadata: {
          customerName,
          customerPhone,
          assistantId,
          callId: call.id,
          callStatus: call.status,
          agentId,
          vinContactHref,
          vinLeadCreated,
        },
      }).catch(() => {});

      console.log(`[VAPI Webhook] Created conversation ${conversation.id} from call ${call.id || "unknown"}, VIN lead: ${vinLeadCreated}`);

      // Send email notification to admins — only if transcript exists (I-230: no notification for ringing-only calls)
      if (hasTranscript) {
        const org = await storage.getOrganization(organizationId);
        const orgName = org?.name || "Dealership";
        let callDurationStr = "Unknown";
        if (call.startedAt && call.endedAt) {
          const secs = Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000);
          const mins = Math.floor(secs / 60);
          const remSecs = secs % 60;
          callDurationStr = mins > 0 ? `${mins}m ${remSecs}s` : `${secs}s`;
        }

        // Look up assistant name
        let assistantName = "AI Voice Assistant";
        if (agentId) {
          try {
            const agents = await storage.getAgents(organizationId);
            const agent = agents.find(a => a.id === agentId);
            if (agent?.name) assistantName = agent.name;
          } catch {}
        }

        let vinStatusText = "";
        if (vinLeadCreated) {
          vinStatusText = "\u2705 Lead created in VIN Solutions";
        } else if (!hasTranscript) {
          vinStatusText = "\u26A0\uFE0F Not inserted — no transcript (ringing-only or failed call)";
        } else if (isTestPhone) {
          vinStatusText = "\u26A0\uFE0F Not inserted — test phone number";
        } else if (!vinPhone) {
          vinStatusText = "\u26A0\uFE0F Not inserted — no phone number captured";
        } else {
          vinStatusText = "\u274C Not inserted — VIN integration error (check logs)";
        }

        const emailHtml = generateLeadEmailHTML({
          orgName,
          assistantName,
          customerPhone,
          callType: call.type || "inbound",
          duration: callDurationStr,
          endedReason: call.status || "completed",
          vinStatus: vinStatusText,
          summary: summary || transcript.substring(0, 300),
          transcript: transcript || "",
          recordingUrl: recordingUrl,
          callId: call.id || "unknown",
          startTime: call.startedAt ? new Date(call.startedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Unknown",
          channel: "voice",
        });

        const idempotencyKey = `vapi-${call.id || conversation.id}`;
        sendLeadNotificationEmail(
          organizationId,
          `\u{1F3AF} ${orgName} Has a New AI Voice Lead!`,
          emailHtml,
          idempotencyKey
        ).catch((err) => {
          console.error("[VAPI Webhook] Email notification failed (non-blocking):", err.message);
        });
      }
      if (!hasTranscript) {
        console.log(`[VAPI Webhook] Skipped email notification — no transcript (ringing-only or failed call)`);
      }

      if (transcript && transcript.length > 0) {
        let callDurationSeconds = 0;
        if (call.startedAt && call.endedAt) {
          callDurationSeconds = (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000;
        } else {
          callDurationSeconds = transcript.length > 100 ? 30 : 0;
        }

        if (callDurationSeconds > 15) {
          analyzeTranscriptWithClaude({
            transcript,
            organizationId,
            customerName,
            customerPhone,
            source: "vapi",
            conversationId: conversation.id,
          }).catch(err => {
            console.error("[AI-Analysis] Fire-and-forget VAPI analysis error:", err.message);
          });
        }

        const callDurationMinutes = Math.ceil(callDurationSeconds / 60);
        if (callDurationMinutes > 0 && organizationId) {
          try { billingService.emitUsageEvent(organizationId, 'voice_minute', { minutes: callDurationMinutes, provider: 'vapi' }); } catch(e) {}
        }
      }

      return res.json({
        message: "Webhook processed successfully",
        conversationId: conversation.id,
        vinLeadCreated,
      });
    } catch (err) {
      console.error("[VAPI Webhook] Error processing webhook:", err);
      return res.status(500).json({ message: "Failed to process webhook" });
    }
  });

  app.get("/api/webhooks/vapi", async (_req, res) => {
    return res.json({ status: "ok", service: "nexxus-connect-vapi-webhook" });
  });

  app.post("/api/webhooks/tavus", async (req, res) => {
    try {
      const tavusWebhookSecret = process.env.TAVUS_WEBHOOK_SECRET;
      if (tavusWebhookSecret) {
        const headerSecret = req.headers["x-tavus-secret"] || req.headers["x-webhook-secret"];
        if (headerSecret !== tavusWebhookSecret) {
          return res.status(401).json({ message: "Invalid webhook secret" });
        }
      }

      const body = req.body;
      if (!body || typeof body !== "object") {
        return res.status(400).json({ message: "Invalid request body" });
      }

      const { event, conversation_id, status } = body;

      if (typeof event !== "string" && typeof status !== "string") {
        return res.status(400).json({ message: "Missing required field: event or status" });
      }

      if (event !== "conversation.end" && status !== "ended" && event !== "conversation_ended") {
        return res.json({ message: "Event type ignored", event });
      }

      const tavusConversationId = conversation_id || body.conversationId;
      if (!tavusConversationId || typeof tavusConversationId !== "string") {
        return res.status(400).json({ message: "Missing or invalid conversation_id" });
      }

      console.log(`[Tavus Webhook] Processing ended conversation: ${tavusConversationId}`);

      let tavusData: any = null;
      try {
        const { callMCP: callMCPTavus } = await import("../vendorProxy");
        tavusData = await callMCPTavus("tavus_get_conversation", { conversationId: tavusConversationId });
      } catch (fetchErr: any) {
        console.warn(`[Tavus Webhook] MCP fetch error:`, fetchErr.message);
      }

      const transcript = tavusData?.transcript || tavusData?.conversation_transcript || body.transcript || "";
      const summary = tavusData?.summary || body.summary || "";
      const visitorName = tavusData?.conversation_name?.replace("Session with ", "") || "Video Visitor";
      const personaId = tavusData?.persona_id || body.persona_id;

      let organizationId: string | null = null;
      let agentId: string | null = null;

      if (personaId) {
        const allOrgs = await storage.getOrganizations();
        for (const org of allOrgs) {
          const orgAgents = await storage.getAgents(org.id);
          const matchingAgent = orgAgents.find(a => a.tavusPersonaId === personaId);
          if (matchingAgent) {
            organizationId = org.id;
            agentId = matchingAgent.id;
            break;
          }
        }
      }

      if (!organizationId) {
        console.error(`[Tavus Webhook] Could not resolve organization from persona_id: ${personaId}`);
        return res.status(400).json({ message: "Unable to resolve organization from persona. Webhook rejected to prevent tenant data leak." });
      }

      const conversation = await storage.createConversation({
        customerName: visitorName,
        channel: "video",
        status: "open",
        agentId,
        organizationId,
        unreadCount: 1,
        lastMessageAt: new Date(),
      });

      if (transcript || summary) {
        const messageContent = summary
          ? `**Video Call Summary:**\n${summary}\n\n**Transcript:**\n${transcript}`
          : `**Video Call Transcript:**\n${transcript}`;

        await storage.createMessage({
          conversationId: conversation.id,
          role: "system",
          content: messageContent,
          senderName: "Tavus",
        });
      }

      let vinLeadCreated = false;
      // Safety: same guards as VAPI path (T-010a)
      const hasTavusTranscript = !!(summary && summary.trim().length > 0);
      if (hasTavusTranscript) {
      try {
        // VIN lead creation via vin-safe-mcp REST API (port 4003)
        const integration = await storage.getIntegrations(organizationId, { provider: "vinsolutions" });
        const vinUserId = integration?.[0]?.defaultVinUserId || null;

        // Use "AI" / "Lead" when visitor name is unknown or generic
        const isUnknownVisitor = !visitorName || visitorName === "Unknown" || visitorName.trim() === "";
        const nameParts = isUnknownVisitor ? ["AI", "Lead"] : visitorName.split(" ");
        const firstName = nameParts[0] || "AI";
        const lastName = nameParts.slice(1).join(" ") || "Lead";

        const VIN_SAFE_URL = process.env.VIN_SAFE_MCP_URL || "http://0.0.0.0:4003";
        const VIN_SAFE_TOKEN = process.env.VIN_SAFE_MCP_TOKEN || "8NCVZ8ZCgHtab6A+FxHsgOKcgir89KvOR+wMIpYFLp4=";

        // Resolve lead source name from org settings (same logic as VAPI handler)
        const orgForTavusVin = await storage.getOrganization(organizationId);
        const tavusOrgSettings = (orgForTavusVin?.settings || {}) as Record<string, any>;
        const tavusVinLeadSourceName = tavusOrgSettings.vinLeadSourceName || "Dealers WebSite";

        const prepareBody: Record<string, any> = {
          orgId: organizationId,
          firstName,
          lastName,
          leadType: "PHONE",
          leadSourceName: tavusVinLeadSourceName,
          description: `${summary || `Tavus video session with ${visitorName}`}\n\nSession ID: ${tavusConversationId}`,
        };
        if (vinUserId) prepareBody.userId = vinUserId;

        const prepareRes = await fetch(`${VIN_SAFE_URL}/api/tool/vin_safe_prepare_lead`, {
          method: "POST",
          headers: { Authorization: `Bearer ${VIN_SAFE_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify(prepareBody),
        });
        const prepareData = await prepareRes.json();

        if (prepareData.status === "READY" && prepareData.approval_token) {
          console.log(`[Tavus→VIN] Prepare OK: assigned to ${prepareData.resolution?.assignedTo?.name}`);

          const executeRes = await fetch(`${VIN_SAFE_URL}/api/tool/vin_safe_execute_lead`, {
            method: "POST",
            headers: { Authorization: `Bearer ${VIN_SAFE_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ approval_token: prepareData.approval_token, user_confirmed: true }),
          });
          const executeData = await executeRes.json();

          if (executeData.status === "EXECUTED" && executeData.verification?.status === "VERIFIED_CORRECT") {
            vinLeadCreated = true;
            console.log(`[Tavus→VIN] Lead created: contact=${executeData.contactId}, lead=${executeData.leadId}`);
          } else {
            console.error(`[Tavus→VIN] Execute failed:`, JSON.stringify(executeData).slice(0, 500));
            await storage.createTask({
              type: "escalation",
              title: "VIN Lead Creation Failed — Tavus Video",
              description: `Prepare succeeded but execute failed.\n\nResult: ${JSON.stringify(executeData).slice(0, 1000)}`,
              status: "todo",
              priority: "critical",
              organizationId,
              tags: ["escalation", "vin-integration", "tavus", "auto-generated"],
              metadata: JSON.stringify({ trigger_id: `tavus-vin-${Date.now()}`, execute_result: executeData, conversation_id: conversation.id }),
            });
          }
        } else {
          console.error(`[Tavus→VIN] Prepare failed:`, JSON.stringify(prepareData).slice(0, 500));
          await storage.createTask({
            type: "escalation",
            title: "VIN Lead Prepare Failed — Tavus Video",
            description: `vin_safe_prepare_lead returned: ${JSON.stringify(prepareData).slice(0, 1000)}`,
            status: "todo",
            priority: "critical",
            organizationId,
            tags: ["escalation", "vin-integration", "tavus", "auto-generated"],
            metadata: JSON.stringify({ trigger_id: `tavus-vin-${Date.now()}`, prepare_result: prepareData, conversation_id: conversation.id }),
          });
        }
      } catch (vinErr: any) {
        console.error(`[Tavus→VIN] FAILED:`, vinErr.message);
        await storage.createTask({
          type: "escalation",
          title: "VIN Lead Creation Failed — Tavus Video",
          description: `Failed to create VIN Solutions lead.\n\nVisitor: ${visitorName}\nError: ${vinErr.message}`,
          status: "todo",
          priority: "critical",
          organizationId,
          tags: ["escalation", "vin-integration", "tavus", "auto-generated"],
          metadata: JSON.stringify({ trigger_id: `tavus-vin-${Date.now()}`, error: vinErr.message, conversation_id: conversation.id }),
        });
      }
      } else {
        console.log(`[Tavus→VIN] Skipped: no transcript/summary for video session`);
      }

      const users = await storage.getUsers(organizationId);
      const adminUsers = users.filter(u => u.role && u.role.level <= 3);
      for (const user of adminUsers) {
        storage.createNotification({
          userId: user.id,
          organizationId,
          type: "call",
          title: "Video Conversation Completed",
          message: `Video conversation with ${visitorName} has been completed and added to TeamBox.${vinLeadCreated ? " VIN lead created." : ""}`,
          relatedEntityType: "conversation",
          relatedEntityId: conversation.id,
        }).catch(() => {});
      }

      storage.createActivityLog({
        organizationId,
        action: "tavus_video_completed",
        entityType: "conversation",
        entityId: conversation.id,
        metadata: { visitorName, personaId, tavusConversationId, agentId, vinLeadCreated },
      }).catch(() => {});

      console.log(`[Tavus Webhook] Created conversation ${conversation.id} from video ${tavusConversationId}, VIN lead: ${vinLeadCreated}`);

      // Send email notification to admins (non-blocking)
      {
        const org = await storage.getOrganization(organizationId);
        const orgName = org?.name || "Dealership";
        let sessionDurationStr = "Unknown";
        if (tavusData?.started_at && tavusData?.ended_at) {
          const secs = Math.round((new Date(tavusData.ended_at).getTime() - new Date(tavusData.started_at).getTime()) / 1000);
          const mins = Math.floor(secs / 60);
          const remSecs = secs % 60;
          sessionDurationStr = mins > 0 ? `${mins}m ${remSecs}s` : `${secs}s`;
        } else if (tavusData?.duration) {
          const mins = Math.floor(tavusData.duration / 60);
          const remSecs = Math.round(tavusData.duration % 60);
          sessionDurationStr = mins > 0 ? `${mins}m ${remSecs}s` : `${tavusData.duration}s`;
        }

        const emailHtml = generateLeadEmailHTML({
          orgName,
          assistantName: visitorName,
          duration: sessionDurationStr,
          summary: summary || transcript.substring(0, 300),
          callId: tavusConversationId,
          channel: "video",
        });

        const idempotencyKey = `tavus-${tavusConversationId}`;
        sendLeadNotificationEmail(
          organizationId,
          `\u{1F3AF} ${orgName} Has a New Video Session Lead!`,
          emailHtml,
          idempotencyKey
        ).catch((err) => {
          console.error("[Tavus Webhook] Email notification failed (non-blocking):", err.message);
        });
      }

      if (transcript && transcript.length > 0) {
        let sessionDurationSeconds = 0;
        if (tavusData?.started_at && tavusData?.ended_at) {
          sessionDurationSeconds = (new Date(tavusData.ended_at).getTime() - new Date(tavusData.started_at).getTime()) / 1000;
        } else if (tavusData?.duration) {
          sessionDurationSeconds = tavusData.duration;
        } else {
          sessionDurationSeconds = transcript.length > 100 ? 30 : 0;
        }

        if (sessionDurationSeconds > 15) {
          analyzeTranscriptWithClaude({
            transcript,
            organizationId,
            customerName: visitorName,
            customerPhone: null,
            source: "tavus",
            conversationId: conversation.id,
          }).catch(err => {
            console.error("[AI-Analysis] Fire-and-forget Tavus analysis error:", err.message);
          });
        }

        const sessionDurationMinutes = Math.ceil(sessionDurationSeconds / 60);
        if (sessionDurationMinutes > 0 && organizationId) {
          try { billingService.emitUsageEvent(organizationId, 'video_minute', { minutes: sessionDurationMinutes, type: 'cvi' }); } catch(e) {}
        }
      }

      return res.json({
        message: "Webhook processed successfully",
        conversationId: conversation.id,
        vinLeadCreated,
      });
    } catch (err) {
      console.error("[Tavus Webhook] Error processing webhook:", err);
      return res.status(500).json({ message: "Failed to process webhook" });
    }
  });
}
