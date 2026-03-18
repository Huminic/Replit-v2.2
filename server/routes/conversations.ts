import type { Express } from "express";
import { z } from "zod";
import { authenticateToken, requireRole } from "../auth";
import { storage } from "../storage";
import { insertConversationSchema, insertMessageSchema } from "@shared/schema";

const updateConversationSchema = z.object({
  status: z.string().optional(),
  campaignDisconnected: z.boolean().optional(),
  unreadCount: z.number().optional(),
  assignedTo: z.string().nullable().optional(),
});

export function registerConversationRoutes(app: Express) {
  app.get("/api/conversations", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const filters: { status?: string; channel?: string; agentId?: string } = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.channel) filters.channel = req.query.channel as string;
      if (req.query.agentId) filters.agentId = req.query.agentId as string;

      const convs = await storage.getConversations(req.user.organizationId, filters);
      return res.json(convs);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const parsed = insertConversationSchema.safeParse({
        ...req.body,
        organizationId: req.user.organizationId,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid conversation data", errors: parsed.error.flatten() });
      }
      const conv = await storage.createConversation(parsed.data);

      if (parsed.data.channel === "ai-chat" && parsed.data.customerEmail) {
        const allConvs = await storage.getConversations(req.user.organizationId, { channel: "ai-chat" });
        const staleConvs = allConvs.filter(
          (c) => c.id !== conv.id && c.customerEmail === parsed.data.customerEmail
        );
        for (const stale of staleConvs) {
          const msgs = await storage.getMessages(stale.id);
          if (msgs.length <= 1) {
            await storage.deleteConversation(stale.id);
          }
        }
      }

      if (conv.customerPhone && parsed.data.channel !== "ai-chat") {
        (async () => {
          try {
            const orgAgents = await storage.getAgents(req.user!.organizationId);
            const greetingAgent = orgAgents.find(a => a.autoGreeting && a.status === "active");
            if (!greetingAgent || !greetingAgent.autoGreeting) return;

            const org = await storage.getOrganization(req.user!.organizationId);
            const greeting = greetingAgent.autoGreeting
              .replace(/\{\{customerName\}\}/g, conv.customerName || "there")
              .replace(/\{\{dealershipName\}\}/g, org?.name || "our dealership")
              .replace(/\{\{agentName\}\}/g, greetingAgent.name || "your assistant");

            const { processOutboundSend } = await import("../outbound");
            const result = await processOutboundSend({
              organizationId: req.user!.organizationId,
              channel: "sms",
              to: conv.customerPhone!,
              messageContent: greeting,
            });

            if (result.status === "sent") {
              console.log(`[AutoGreeting] Sent to ${conv.customerPhone} via agent ${greetingAgent.name}`);

              await storage.createMessage({
                conversationId: conv.id,
                role: "agent",
                content: greeting,
                senderName: greetingAgent.name,
              });

              storage.createActivityLog({
                organizationId: req.user!.organizationId,
                action: "auto_greeting_sent",
                entityType: "conversation",
                entityId: conv.id,
                metadata: { agentName: greetingAgent.name, customerPhone: conv.customerPhone },
              }).catch(() => {});
            } else {
              console.log(`[AutoGreeting] Blocked for ${conv.customerPhone}: ${result.blockedReason}`);
            }
          } catch (greetErr: any) {
            console.error(`[AutoGreeting] Failed:`, greetErr.message);
          }
        })();
      }

      return res.status(201).json(conv);
    } catch (err) {
      return res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get("/api/conversations/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const conversation = await storage.getConversation(req.params.id as string);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });
      if (conversation.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      return res.json(conversation);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.patch("/api/conversations/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getConversation(req.params.id as string);
      if (!existing) return res.status(404).json({ message: "Conversation not found" });
      if (existing.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const parsed = updateConversationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid conversation data", errors: parsed.error.flatten() });
      }
      const conv = await storage.updateConversation(req.params.id as string, parsed.data);
      // Compute aiPaused: AI is paused when a human has taken over the conversation
      const aiPaused = !!(conv as any)?.assignedTo;
      return res.json({ ...conv, aiPaused });
    } catch (err) {
      return res.status(500).json({ message: "Failed to update conversation" });
    }
  });

  app.delete("/api/conversations/:id", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const existing = await storage.getConversation(req.params.id as string);
      if (!existing) return res.status(404).json({ message: "Conversation not found" });
      if (existing.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteConversation(req.params.id as string);
      return res.json({ message: "Conversation deleted" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  app.get("/api/conversations/:id/messages", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const conversation = await storage.getConversation(req.params.id as string);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });
      if (conversation.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const msgs = await storage.getMessages(req.params.id as string);
      return res.json(msgs);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // POST /api/conversations/:id/email — send outbound email via Resend
  app.post("/api/conversations/:id/email", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const conversation = await storage.getConversation(req.params.id as string);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });
      if (conversation.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { to, subject, body } = req.body;
      if (!to || !subject || !body) {
        return res.status(400).json({ message: "Missing required fields: to, subject, body" });
      }

      if (!process.env.RESEND_API_KEY) {
        return res.status(503).json({ message: "Email service not configured — RESEND_API_KEY missing" });
      }

      const org = await storage.getOrganization(req.user.organizationId);
      const orgName = org?.name || "Nexxus Connect";
      const fromAddress = `${orgName} <notifications@huminic.ai>`;

      const { callMCP } = await import("../vendorProxy");
      await callMCP("resend_send_email", {
        from: fromAddress,
        to,
        subject,
        html: body,
      });

      const messageContent = `**Email sent to ${to}**\n**Subject:** ${subject}\n\n${body}`;
      await storage.createMessage({
        conversationId: req.params.id as string,
        role: "agent",
        content: messageContent,
        senderName: `${req.user.firstName} ${req.user.lastName}`,
      });
      await storage.updateConversation(req.params.id as string, { lastMessageAt: new Date() });

      storage.createActivityLog({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: "email_sent",
        entityType: "conversation",
        entityId: req.params.id as string,
        metadata: { to, subject },
      }).catch(() => {});

      return res.json({ success: true, message: "Email sent successfully" });
    } catch (err: any) {
      console.error("[Email Send] Error:", err.message);
      return res.status(500).json({ message: "Failed to send email" });
    }
  });

  app.post("/api/conversations/:id/messages", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const conversation = await storage.getConversation(req.params.id as string);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });
      if (conversation.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }
      const parsed = insertMessageSchema.safeParse({
        ...req.body,
        conversationId: req.params.id,
      });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid message data", errors: parsed.error.flatten() });
      }
      const msg = await storage.createMessage(parsed.data);
      await storage.updateConversation(req.params.id as string, { lastMessageAt: new Date() });

      const isAgentReply = parsed.data.role === "agent" || parsed.data.role === "system";
      const content = parsed.data.content || "";
      const isSmsChannel = conversation.channel === "sms";
      const hasSmsPrefix = content.startsWith("[SMS] ");
      const shouldSendSms = isAgentReply && (isSmsChannel || hasSmsPrefix) && conversation.customerPhone;

      if (shouldSendSms && conversation.customerPhone) {
        const smsContent = hasSmsPrefix ? content.replace("[SMS] ", "") : content;
        try {
          const { processOutboundSend } = await import("../outbound");
          const result = await processOutboundSend({
            organizationId: conversation.organizationId,
            channel: "sms",
            to: conversation.customerPhone,
            messageContent: smsContent,
          });

          if (result.status === "sent") {
            console.log(`[TeamBox SMS] Delivered reply to ${conversation.customerPhone}`);
          } else {
            console.warn(`[TeamBox SMS] Blocked for ${conversation.customerPhone}: ${result.blockedReason}`);
          }
        } catch (smsErr: any) {
          console.error(`[TeamBox SMS] Delivery failed:`, smsErr.message);
        }
      }

      return res.status(201).json(msg);
    } catch (err) {
      return res.status(500).json({ message: "Failed to create message" });
    }
  });
}
