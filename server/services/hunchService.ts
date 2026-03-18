import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { storage } from "../storage";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

/**
 * Generate AI-powered business insights ("hunches") for an organization.
 * Extracted from the former routes.ts monolith.
 * Used by server/services/scheduler.ts and server/routes/hunches.ts.
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
