import type { Express } from "express";
import { type Server } from "http";
import Anthropic from "@anthropic-ai/sdk";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { registerVendorRoutes } from "./vendorProxy";
import { startSyncScheduler } from "./sync";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

/**
 * Generate AI-powered business insights ("hunches") for an organization.
 * Exported because it is used by server/services/scheduler.ts and server/routes/hunches.ts.
 */
export async function generateHunchesForOrg(orgId: string, userId?: string) {
  const [convos, campaignList, agentList] = await Promise.all([
    storage.getConversations(orgId),
    storage.getCampaigns(orgId),
    storage.getAgents(orgId),
  ]);

  const orgDataSummary = JSON.stringify({
    conversations: {
      total: convos.length,
      open: convos.filter(c => c.status === "open").length,
      closed: convos.filter(c => c.status === "closed").length,
      channels: convos.reduce((acc, c) => { acc[c.channel] = (acc[c.channel] || 0) + 1; return acc; }, {} as Record<string, number>),
    },
    campaigns: await Promise.all(campaignList.map(async c => {
      const recipients = await storage.getRecipients(c.id);
      const sent = recipients.filter(r => r.status === "sent" || r.status === "delivered").length;
      const campaignConvos = convos.filter(cv => cv.campaignId === c.id);
      const replied = campaignConvos.length;
      return {
        name: c.name, department: c.department, status: c.status,
        sent, replied,
        replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0,
      };
    })),
    agents: agentList.map(a => ({
      name: a.name, department: a.department, status: a.status, channels: a.channels,
    })),
  });

  const aiResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{
      role: "user",
      content: `You are an AI business analyst. Analyze the following organization data and generate 3-5 actionable business insights ("hunches"). Each hunch should identify a pattern in the data and provide a specific recommendation.

Organization Data:
${orgDataSummary}

Respond with a JSON array of objects, each with:
- type: "pattern" | "recommendation" | "alert"
- title: short descriptive title (max 60 chars)
- description: detailed explanation of the insight (2-3 sentences)
- confidence: number 50-100 representing certainty
- department: relevant department (sales, service, marketing, or null for cross-department)
- dataSource: what data this insight is based on

Return ONLY the JSON array, no other text.`,
    }],
  });

  let hunchData: any[] = [];
  const textBlock = aiResponse.content.find(b => b.type === "text");
  if (textBlock && textBlock.type === "text") {
    let rawText = textBlock.text.trim();
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) rawText = jsonMatch[1].trim();
    hunchData = JSON.parse(rawText);
    if (!Array.isArray(hunchData)) hunchData = [hunchData];
  }

  const batchId = crypto.randomUUID();
  const created = [];
  for (const h of hunchData) {
    const hunch = await storage.createHunch({
      organizationId: orgId,
      type: h.type || "pattern",
      title: h.title,
      description: h.description,
      confidence: Math.min(100, Math.max(0, h.confidence || 50)),
      status: "new",
      department: h.department || null,
      dataSource: h.dataSource || null,
      batchId,
    });
    created.push(hunch);
  }

  storage.createActivityLog({
    userId: userId || orgId,
    organizationId: orgId,
    action: "hunches_generated",
    entityType: "hunch",
    metadata: { count: created.length, automated: !userId },
  }).catch(() => {});

  return created;
}

/**
 * Bootstrap function called from server/index.ts.
 * Seeds the database, registers vendor routes, starts background schedulers,
 * and sets up the file-size error handler.
 *
 * All API endpoint handlers have been extracted to server/routes/*.ts
 * and are registered via registerDomainRoutes() in server/routes/index.ts.
 */
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedDatabase();

  // Vendor routes are dynamically registered and must stay here
  registerVendorRoutes(app);

  // Start the VIN Solutions sync scheduler
  startSyncScheduler().catch(err => {
    console.error("[Sync] Failed to start scheduler:", err);
  });

  // File upload size error handler
  app.use((err: any, req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File too large. Maximum upload size is 5MB." });
    }
    next(err);
  });

  // Escalation scheduler: check for unanswered conversations every 5 minutes
  setInterval(async () => {
    try {
      const unanswered = await storage.getUnansweredConversations(30);
      if (unanswered.length === 0) return;

      for (const conv of unanswered) {
        try {
          const org = await storage.getOrganization(conv.organizationId);
          if (!org || !org.emailEnabled) continue;

          const orgAdminRole = await storage.getRoleByName("org_admin");
          if (!orgAdminRole) continue;

          const orgUsers = await storage.getUsers(conv.organizationId);
          const orgAdmin = orgUsers.find(u => u.roleId === orgAdminRole.id && u.isActive);
          if (!orgAdmin) continue;

          const msgs = await storage.getMessages(conv.id);
          const latestMessage = msgs.length > 0 ? msgs[msgs.length - 1] : null;
          const messagePreview = latestMessage ? latestMessage.content.substring(0, 200) : "No message content";

          const contactName = conv.customerName || "Unknown";
          const contactPhone = conv.customerPhone || "Unknown";
          const waitingMinutes = conv.lastMessageAt
            ? Math.round((Date.now() - new Date(conv.lastMessageAt).getTime()) / 60000)
            : 0;

          const escapeHtml = (str: string): string =>
            str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

          if (process.env.RESEND_API_KEY) {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from: "Nexxus Connect <no-reply@huminic.app>",
              to: orgAdmin.email,
              subject: `Unanswered message from ${contactName !== "Unknown" ? contactName : contactPhone} — ${org.name}`,
              html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1a1a;">Unanswered Message Alert</h2>
                <p>A customer message has been waiting for a response.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                  <tr><td style="padding: 8px; font-weight: bold; color: #555;">Contact Name</td><td style="padding: 8px;">${escapeHtml(contactName)}</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold; color: #555;">Phone</td><td style="padding: 8px;">${escapeHtml(contactPhone)}</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold; color: #555;">Channel</td><td style="padding: 8px;">${escapeHtml(conv.channel)}</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold; color: #555;">Waiting</td><td style="padding: 8px;">${waitingMinutes} minutes</td></tr>
                </table>
                <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; margin: 16px 0;">
                  <p style="margin: 0 0 4px 0; font-weight: bold; color: #555;">Latest Message:</p>
                  <p style="margin: 0; color: #333;">${escapeHtml(messagePreview)}${latestMessage && latestMessage.content.length > 200 ? "..." : ""}</p>
                </div>
                <p><a href="${process.env.APP_BASE_URL || "https://app.nexxusconnect.com"}/teambox" style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">Open TeamBox</a></p>
                <p style="color: #888; font-size: 12px;">This is an automated escalation from Nexxus Connect for ${escapeHtml(org.name)}.</p>
              </div>`,
            });
            console.log(`[ESCALATION] Email sent to ${orgAdmin.email} for conversation ${conv.id} (${contactName})`);
          } else {
            console.log(`[ESCALATION] No RESEND_API_KEY — would email ${orgAdmin.email} for conversation ${conv.id}`);
          }

          await storage.markEscalationSent(conv.id);

          await storage.createNotification({
            userId: orgAdmin.id,
            organizationId: conv.organizationId,
            type: "escalation",
            title: `Unanswered message from ${contactName}`,
            message: `${contactName} (${contactPhone}) has been waiting ${waitingMinutes} minutes for a response on ${conv.channel}.`,
            relatedEntityType: "conversation",
            relatedEntityId: conv.id,
          });

          await storage.createActivityLog({
            userId: orgAdmin.id,
            organizationId: conv.organizationId,
            action: "escalation_email_sent",
            entityType: "conversation",
            entityId: conv.id,
            metadata: { contactName, contactPhone, waitingMinutes, channel: conv.channel },
          });
        } catch (convErr) {
          console.error(`[ESCALATION] Error processing conversation ${conv.id}:`, convErr);
        }
      }
    } catch (err) {
      console.error("[ESCALATION] Scheduler error:", err);
    }
  }, 5 * 60 * 1000);

  return httpServer;
}
