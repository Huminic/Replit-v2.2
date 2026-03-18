import type { Express } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { storage } from "../storage";
import { billingService } from "../services/billingService";

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
    }).optional(),
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

        const contactResult = await callMCP("vin_create_contact", {
          orgId: nexxusOrgId,
          firstName,
          lastName,
          phone: customerPhone || undefined,
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
