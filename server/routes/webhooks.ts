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
 * Send a lead notification email to all admins (role levels 1-3) for an organization.
 * Uses callMCP with resend_send_email. Non-blocking — callers should .catch() errors.
 */
async function sendLeadNotificationEmail(
  orgId: string,
  subject: string,
  htmlBody: string,
  idempotencyKey: string
): Promise<{ sent: number; skipped: boolean }> {
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

  // Query admin users for this org (role levels 1, 2, 3)
  const users = await storage.getUsers(orgId);
  const adminUsers = users.filter((u) => u.role && u.role.level <= 3 && u.email);

  // Also include super_admins (level 1) from all orgs
  const allOrgs = await storage.getOrganizations();
  for (const otherOrg of allOrgs) {
    if (otherOrg.id === orgId) continue;
    const otherUsers = await storage.getUsers(otherOrg.id);
    const superAdmins = otherUsers.filter((u) => u.role && u.role.level === 1 && u.email);
    for (const sa of superAdmins) {
      if (!adminUsers.some((au) => au.email === sa.email)) {
        adminUsers.push(sa);
      }
    }
    // Include partner_admins (level 2) whose org is a parent of the target org
    const partnerAdmins = otherUsers.filter((u) => u.role && u.role.level === 2 && u.email);
    for (const pa of partnerAdmins) {
      if (!adminUsers.some((au) => au.email === pa.email)) {
        adminUsers.push(pa);
      }
    }
  }

  let sentCount = 0;
  const FROM_ADDRESS = "Nexxus Connect <notifications@huminic.ai>";

  for (const user of adminUsers) {
    if (!user.email) continue;
    try {
      await callMCP("resend_send_email", {
        from: FROM_ADDRESS,
        to: user.email,
        subject,
        html: htmlBody,
      });
      sentCount++;
    } catch (emailErr: any) {
      console.error(`[LeadNotify] Failed to send to ${user.email}:`, emailErr.message);
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
 * Build HTML email body for a VAPI end-of-call notification.
 */
function buildVapiEmailHtml(params: {
  orgName: string;
  assistantName: string;
  customerPhone: string | null;
  callType: string;
  duration: string;
  endedReason: string;
  summary: string;
  transcript: string;
  recordingUrl: string | null;
  callId: string;
  startTime: string;
}): string {
  const recordingButton = params.recordingUrl
    ? `<tr><td style="padding:0 40px 30px;text-align:center;"><a href="${params.recordingUrl}" style="display:inline-block;background:#667eea;color:white;padding:12px 30px;text-decoration:none;border-radius:6px;font-weight:500;font-size:14px;">&#127911; Listen to Recording</a></td></tr>`
    : "";

  const summarySection = params.summary && params.summary !== "No summary available"
    ? `<tr><td style="padding:0 40px 20px;"><div style="background:#f8f9fa;border-left:4px solid #667eea;padding:16px 20px;border-radius:4px;"><h3 style="margin:0 0 10px;font-size:14px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Lead Summary</h3><p style="margin:0;font-size:15px;color:#333;line-height:1.6;">${params.summary}</p></div></td></tr>`
    : "";

  const transcriptSection = params.transcript
    ? `<tr><td style="padding:0 40px 30px;"><h3 style="margin:0 0 15px;font-size:16px;color:#333;font-weight:600;">Full Transcript</h3><div style="background:#f8f9fa;border:1px solid #e9ecef;border-radius:6px;padding:20px;font-family:'Courier New',monospace;font-size:13px;line-height:1.8;color:#495057;white-space:pre-wrap;max-height:400px;overflow-y:auto;">${params.transcript}</div></td></tr>`
    : "";

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f5f5f5;"><table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td style="padding:40px 20px;"><table role="presentation" style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px 40px;text-align:center;"><h1 style="margin:0;color:white;font-size:24px;font-weight:600;">&#127919; ${params.orgName}</h1><p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:16px;">Has a New AI Voice Lead!</p></td></tr>
<tr><td style="padding:30px 40px 20px;"><p style="margin:0;font-size:16px;color:#333;line-height:1.5;">Congratulations! Your AI assistant <strong>${params.assistantName}</strong> just completed a call with a potential customer.</p></td></tr>
${summarySection}
<tr><td style="padding:0 40px 30px;"><table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td style="padding:8px 0;font-size:14px;color:#666;width:40%;">Assistant:</td><td style="padding:8px 0;font-size:14px;color:#333;font-weight:500;">${params.assistantName}</td></tr>
<tr><td style="padding:8px 0;font-size:14px;color:#666;">Customer Phone:</td><td style="padding:8px 0;font-size:14px;color:#333;font-weight:500;">${params.customerPhone || "Unknown"}</td></tr>
<tr><td style="padding:8px 0;font-size:14px;color:#666;">Call Type:</td><td style="padding:8px 0;font-size:14px;color:#333;font-weight:500;">${params.callType}</td></tr>
<tr><td style="padding:8px 0;font-size:14px;color:#666;">Duration:</td><td style="padding:8px 0;font-size:14px;color:#333;font-weight:500;">${params.duration}</td></tr>
<tr><td style="padding:8px 0;font-size:14px;color:#666;">Timestamp:</td><td style="padding:8px 0;font-size:14px;color:#333;font-weight:500;">${params.startTime}</td></tr>
<tr><td style="padding:8px 0;font-size:14px;color:#666;">Ended Reason:</td><td style="padding:8px 0;font-size:14px;color:#333;font-weight:500;">${params.endedReason}</td></tr>
</table></td></tr>
${recordingButton}
${transcriptSection}
<tr><td style="padding:20px 40px 30px;border-top:1px solid #e9ecef;"><p style="margin:0;font-size:12px;color:#666;line-height:1.5;"><strong>Call ID:</strong> ${params.callId}<br><strong>Questions or issues?</strong> Contact <a href="mailto:support@huminic.ai" style="color:#667eea;text-decoration:none;">support@huminic.ai</a></p><p style="margin:15px 0 0;font-size:11px;color:#999;">Powered by Nexxus AI Voice Platform</p></td></tr>
</table></td></tr></table></body></html>`;
}

/**
 * Build HTML email body for a Tavus conversation-ended notification.
 */
function buildTavusEmailHtml(params: {
  orgName: string;
  visitorName: string;
  duration: string;
  summary: string;
  conversationId: string;
}): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f5f5f5;"><table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td style="padding:40px 20px;"><table role="presentation" style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 100%);padding:30px 40px;text-align:center;"><h1 style="margin:0;color:white;font-size:24px;font-weight:600;">&#127916; ${params.orgName}</h1><p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:16px;">Has a New Video Session Lead!</p></td></tr>
<tr><td style="padding:30px 40px 20px;"><p style="margin:0;font-size:16px;color:#333;line-height:1.5;">A visitor just completed a video session with your AI assistant.</p></td></tr>
<tr><td style="padding:0 40px 30px;"><table role="presentation" style="width:100%;border-collapse:collapse;">
<tr><td style="padding:8px 0;font-size:14px;color:#666;width:40%;">Visitor:</td><td style="padding:8px 0;font-size:14px;color:#333;font-weight:500;">${params.visitorName}</td></tr>
<tr><td style="padding:8px 0;font-size:14px;color:#666;">Session Duration:</td><td style="padding:8px 0;font-size:14px;color:#333;font-weight:500;">${params.duration}</td></tr>
</table></td></tr>
${params.summary ? `<tr><td style="padding:0 40px 20px;"><div style="background:#f8f9fa;border-left:4px solid #7c3aed;padding:16px 20px;border-radius:4px;"><h3 style="margin:0 0 10px;font-size:14px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Engagement Summary</h3><p style="margin:0;font-size:15px;color:#333;line-height:1.6;">${params.summary}</p></div></td></tr>` : ""}
<tr><td style="padding:20px 40px 30px;border-top:1px solid #e9ecef;"><p style="margin:0;font-size:12px;color:#666;line-height:1.5;"><strong>Session ID:</strong> ${params.conversationId}<br><strong>Questions or issues?</strong> Contact <a href="mailto:support@huminic.ai" style="color:#7c3aed;text-decoration:none;">support@huminic.ai</a></p><p style="margin:15px 0 0;font-size:11px;color:#999;">Powered by Nexxus AI Voice Platform</p></td></tr>
</table></td></tr></table></body></html>`;
}

const vapiWebhookPayloadSchema = z.object({
  message: z.object({
    type: z.string(),
    call: z.object({
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
    }).optional(),
    recordingUrl: z.string().optional(),
  }),
});

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
        console.warn("[VAPI Webhook] Invalid payload:", parsed.error.flatten());
        return res.status(400).json({ message: "Invalid webhook payload" });
      }

      const { message } = parsed.data;

      if (message.type !== "end-of-call-report" && message.type !== "call-ended") {
        return res.json({ message: "Event type ignored", type: message.type });
      }

      const call = message.call;
      if (!call) {
        return res.status(400).json({ message: "Missing call data in payload" });
      }

      const customerName = call.customer?.name || "Unknown Caller";
      const customerPhone = call.customer?.number || call.phoneNumber?.number || null;
      const assistantId = call.assistantId || null;
      const transcript = call.transcript || "";
      const summary = call.summary || "";

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
        console.error("[VAPI Webhook] Could not resolve organization from assistantId — rejecting. No fallback to arbitrary org.");
        return res.status(422).json({ message: "No organization found to associate call with. Configure agent's VAPI assistant ID." });
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

      try {
        const { callMCP, resolveNexxusOrgId } = await import("../vendorProxy");
        const nexxusOrgId = resolveNexxusOrgId(organizationId);

        const nameParts = customerName.split(" ");
        const firstName = nameParts[0] || "Unknown";
        const lastName = nameParts.slice(1).join(" ") || "Caller";

        // Strip +1 prefix — VIN Solutions requires 10-digit phone
        const vinPhone = customerPhone ? customerPhone.replace(/\D/g, "").replace(/^1(\d{10})$/, "$1") : undefined;
        const contactResult = await callMCP("vin_create_contact", {
          orgId: nexxusOrgId,
          firstName,
          lastName,
          phone: vinPhone,
          leadSourceName: "Phone - AI Voice Agent",
        });
        vinContactHref = contactResult?.href || contactResult?.contactHref || contactResult?.id || null;
        console.log(`[VAPI→VIN] Step 1 success: contact created, href=${vinContactHref}`);

        try {
          await callMCP("vin_create_lead", {
            orgId: nexxusOrgId,
            contactHref: vinContactHref,
            source: "VAPI Inbound Call",
            description: summary || `Inbound call from ${customerName}`,
            transcript: transcript.substring(0, 5000),
          });
          vinLeadCreated = true;
          console.log(`[VAPI→VIN] Step 2 success: lead created for contact ${vinContactHref}`);
        } catch (step2Err: any) {
          console.error(`[VAPI→VIN] Step 2 FAILED (lead creation):`, step2Err.message);
          await storage.createTask({
            type: "escalation",
            title: "VIN Lead Creation Failed (Step 2)",
            description: `Contact was created (href: ${vinContactHref}) but lead creation failed.\n\nError: ${step2Err.message}`,
            status: "todo",
            priority: "critical",
            organizationId,
            tags: ["escalation", "vin-integration", "vapi", "auto-generated"],
            metadata: JSON.stringify({
              trigger_id: `vapi-vin-${Date.now()}`,
              org_id: organizationId,
              failed_step: 2,
              contact_href: vinContactHref,
              error_response: step2Err.message,
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
            metadata: { failed_step: 2, contact_href: vinContactHref, error: step2Err.message },
          }).catch(() => {});
        }
      } catch (step1Err: any) {
        console.error(`[VAPI→VIN] Step 1 FAILED (contact creation):`, step1Err.message);
        await storage.createTask({
          type: "escalation",
          title: "VIN Contact Creation Failed (Step 1)",
          description: `Failed to create VIN Solutions contact for VAPI call.\n\nCaller: ${customerName} (${customerPhone || "no phone"})\nError: ${step1Err.message}`,
          status: "todo",
          priority: "critical",
          organizationId,
          tags: ["escalation", "vin-integration", "vapi", "auto-generated"],
          metadata: JSON.stringify({
            trigger_id: `vapi-vin-${Date.now()}`,
            org_id: organizationId,
            failed_step: 1,
            error_response: step1Err.message,
            timestamp: new Date().toISOString(),
            original_vapi_data: vapiPayloadSnapshot,
            conversation_id: conversation.id,
          }),
        });
        storage.createActivityLog({
          organizationId,
          action: "vin_contact_creation_failed",
          entityType: "conversation",
          entityId: conversation.id,
          metadata: { failed_step: 1, error: step1Err.message, customerName, customerPhone },
        }).catch(() => {});
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

      // Send email notification to admins (non-blocking)
      {
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

        const emailHtml = buildVapiEmailHtml({
          orgName,
          assistantName,
          customerPhone,
          callType: call.type || "inbound",
          duration: callDurationStr,
          endedReason: call.status || "completed",
          summary: summary || transcript.substring(0, 300),
          transcript: transcript || "",
          recordingUrl: call.recordingUrl || message.recordingUrl || null,
          callId: call.id || "unknown",
          startTime: call.startedAt ? new Date(call.startedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "Unknown",
        });

        const idempotencyKey = `vapi-${call.id || conversation.id}`;
        sendLeadNotificationEmail(
          organizationId,
          `${orgName} Has a New AI Voice Lead!`,
          emailHtml,
          idempotencyKey
        ).catch((err) => {
          console.error("[VAPI Webhook] Email notification failed (non-blocking):", err.message);
        });
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
      try {
        const { callMCP, resolveNexxusOrgId } = await import("../vendorProxy");
        const nexxusOrgId = resolveNexxusOrgId(organizationId);

        const nameParts = visitorName.split(" ");
        const firstName = nameParts[0] || "Video";
        const lastName = nameParts.slice(1).join(" ") || "Visitor";

        const contactResult = await callMCP("vin_create_contact", {
          orgId: nexxusOrgId,
          firstName,
          lastName,
        });
        const vinContactHref = contactResult?.href || contactResult?.contactHref || contactResult?.id || null;
        console.log(`[Tavus→VIN] Step 1 success: contact created, href=${vinContactHref}`);

        try {
          await callMCP("vin_create_lead", {
            orgId: nexxusOrgId,
            contactHref: vinContactHref,
            source: "Tavus Video Conversation",
            description: summary || `Video conversation with ${visitorName}`,
            transcript: transcript.substring(0, 5000),
          });
          vinLeadCreated = true;
          console.log(`[Tavus→VIN] Step 2 success: lead created for contact ${vinContactHref}`);
        } catch (step2Err: any) {
          console.error(`[Tavus→VIN] Step 2 FAILED (lead creation):`, step2Err.message);
          await storage.createTask({
            type: "escalation",
            title: "VIN Lead Creation Failed — Tavus Video (Step 2)",
            description: `Contact was created (href: ${vinContactHref}) but lead creation failed.\n\nError: ${step2Err.message}`,
            status: "todo",
            priority: "critical",
            organizationId,
            tags: ["escalation", "vin-integration", "tavus", "auto-generated"],
            metadata: JSON.stringify({
              trigger_id: `tavus-vin-${Date.now()}`,
              org_id: organizationId,
              failed_step: 2,
              contact_href: vinContactHref,
              error_response: step2Err.message,
              tavus_conversation_id: tavusConversationId,
              conversation_id: conversation.id,
            }),
          });
        }
      } catch (step1Err: any) {
        console.error(`[Tavus→VIN] Step 1 FAILED (contact creation):`, step1Err.message);
        await storage.createTask({
          type: "escalation",
          title: "VIN Contact Creation Failed — Tavus Video (Step 1)",
          description: `Failed to create VIN Solutions contact for Tavus video.\n\nVisitor: ${visitorName}\nError: ${step1Err.message}`,
          status: "todo",
          priority: "critical",
          organizationId,
          tags: ["escalation", "vin-integration", "tavus", "auto-generated"],
          metadata: JSON.stringify({
            trigger_id: `tavus-vin-${Date.now()}`,
            org_id: organizationId,
            failed_step: 1,
            error_response: step1Err.message,
            tavus_conversation_id: tavusConversationId,
            conversation_id: conversation.id,
          }),
        });
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

        const emailHtml = buildTavusEmailHtml({
          orgName,
          visitorName,
          duration: sessionDurationStr,
          summary: summary || transcript.substring(0, 300),
          conversationId: tavusConversationId,
        });

        const idempotencyKey = `tavus-${tavusConversationId}`;
        sendLeadNotificationEmail(
          organizationId,
          `${orgName} Has a New Video Session Lead!`,
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
