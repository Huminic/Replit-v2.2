import type { Express } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { authenticateToken } from "../auth";
import { storage } from "../storage";
import { braveWebSearch } from "../braveSearch";
import { callMCP, resolveNexxusOrgId } from "../vendorProxy";
import { billingService } from "../services/billingService";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

function formatSyncAge(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

const webSearchTool: Anthropic.Tool = {
  name: "web_search",
  description: "Search the web for current information. Use this when the user asks about current events, recent news, real-time data, locations/businesses near a place, or anything that requires up-to-date information beyond your training data. Also use for questions about specific people, places, or facts you are uncertain about.",
  input_schema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description: "The search query. Be specific and include relevant context.",
      },
    },
    required: ["query"],
  },
};

const vinQueryLeadsTool: Anthropic.Tool = {
  name: "vin_query_leads",
  description: "Query VinSolutions CRM lead data. Use this when the user asks about sales leads, pipeline, lead counts, lead statuses, conversion rates, or any CRM-related question. Returns lead data from the dealership's VinSolutions CRM system.",
  input_schema: {
    type: "object" as const,
    properties: {
      startDate: {
        type: "string",
        description: "Start date in YYYY-MM-DD format. Defaults to 30 days ago if not specified.",
      },
      endDate: {
        type: "string",
        description: "End date in YYYY-MM-DD format. Defaults to today if not specified.",
      },
      status: {
        type: "string",
        description: "Lead status filter. Common values: ACTIVE_NEW_LEAD, ACTIVE_ACTIVE_LEAD, ACTIVE_SET_APPOINTMENT, ACTIVE_WAITING_FOR_PROSPECT_RESPONSE, SOLD_DELIVERED, SOLD_PENDING_FINANCE, SOLD_ON_ORDER, LOST_DID_NOT_RESPOND, LOST_NO_AGREEMENT_REACHED, LOST_BAD_CREDIT, LOST_LEAD_PROCESS_COMPLETED.",
      },
      limit: {
        type: "number",
        description: "Maximum number of leads to return (1-100). Default: 20.",
      },
    },
    required: [],
  },
};

const vinLeadSummaryTool: Anthropic.Tool = {
  name: "vin_lead_summary",
  description: "Get a summary of VinSolutions CRM lead metrics including total leads, new leads, active pipeline, sold leads, conversion rate, and period-over-period changes. Use this when the user asks about overall sales performance, KPIs, metrics, or dashboard-level data.",
  input_schema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
};

const campaignQueryTool: Anthropic.Tool = {
  name: "query_campaigns",
  description: "Query campaign data for the organization including status, send counts, reply rates, and execution status. Use this when the user asks about campaigns, outreach, messaging performance, or service campaigns.",
  input_schema: {
    type: "object" as const,
    properties: {
      department: {
        type: "string",
        description: "Optional department filter: 'sales', 'service', or 'marketing'",
      },
    },
    required: [],
  },
};

const chatTools: Anthropic.Tool[] = [webSearchTool, vinQueryLeadsTool, vinLeadSummaryTool, campaignQueryTool];

export function registerChatRoutes(app: Express) {
  app.post("/api/chat/:conversationId/stream", authenticateToken, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });

      const conversationId = req.params.conversationId as string;
      const { content, agentId, mode, pageContext } = req.body;
      const isCrmGuru = mode === "crm_guru";

      if (!content || typeof content !== "string") {
        return res.status(400).json({ message: "Message content is required" });
      }

      const conversation = await storage.getConversation(conversationId);
      if (!conversation) return res.status(404).json({ message: "Conversation not found" });
      if (conversation.organizationId !== req.user.organizationId && req.user.roleLevel > 2) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.createMessage({
        conversationId,
        role: "user",
        content,
        senderName: `${req.user.firstName} ${req.user.lastName}`,
      });
      await storage.updateConversation(conversationId, { lastMessageAt: new Date() });

      const history = await storage.getMessages(conversationId);
      const recentMessages = history.slice(-20);

      const [org, orgUsers, orgAgents, orgDocuments, acceptedHunches, latestMetricsSync, latestLeadSync, activityLogs, orgCampaigns] = await Promise.all([
        storage.getOrganization(req.user.organizationId),
        storage.getUsers(req.user.organizationId),
        storage.getAgents(req.user.organizationId, {}),
        storage.getDocuments(req.user.organizationId),
        storage.getAcceptedHunches(req.user.organizationId),
        storage.getLatestSync(req.user.organizationId, "metrics_refresh"),
        storage.getLatestSync(req.user.organizationId, "backfill").then(b =>
          b || storage.getLatestSync(req.user!.organizationId, "daily_delta")
        ),
        storage.getActivityLogs(req.user.organizationId, 15),
        storage.getCampaigns(req.user.organizationId),
      ]);
      const orgName = org?.name || "Nexxus Connect";
      const personaName = org?.personaName || "Automa";
      const orgSettings = (org?.settings || {}) as Record<string, any>;
      const chatInstructions = orgSettings.chatInstructions || "";
      const orgSystemPrompt = orgSettings.systemPrompt || "";

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "America/New_York" });
      const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/New_York" });

      const activeUsers = orgUsers.filter(u => u.isActive !== false);
      const teamSummary = activeUsers.map(u => `${u.firstName} ${u.lastName} (${u.role?.name || "unknown"})`).join(", ");
      const agentSummary = orgAgents.map(a => `${a.name} [${a.department}]`).join(", ");

      let agentContext = "";
      let agentName: string | null = null;
      if (agentId) {
        const agent = await storage.getAgent(agentId);
        if (agent && agent.organizationId === req.user.organizationId) {
          agentName = agent.name;
          agentContext = `\n\nYou are specifically acting as the agent "${agent.name}" in the ${agent.department} department.`;
          if (agent.description) agentContext += ` Agent description: ${agent.description}`;
          if (agent.instructions) agentContext += `\n\nAgent-specific instructions:\n${agent.instructions}`;
        }
      }

      let hunchContext = "";
      if (acceptedHunches.length > 0) {
        const hunchSections = acceptedHunches.map(h => {
          const source = h.dataSource ? ` [Source: ${h.dataSource}]` : " [Source: computed]";
          const age = h.generatedAt ? `, generated ${formatSyncAge(h.generatedAt)}` : "";
          return `- [${h.type}${h.department ? `/${h.department}` : ""}] ${h.title}: ${h.description} (confidence: ${h.confidence}%${age}${source})`;
        }).join("\n");
        hunchContext = `\n\nActive AI Insights (accepted hunches — use these to inform your responses when relevant):\n${hunchSections}`;
      }

      let knowledgeContext = "";
      const relevantDocs = agentId
        ? orgDocuments.filter(d => d.agentId === agentId || !d.agentId)
        : orgDocuments.filter(d => !d.agentId);
      const docsWithContent = relevantDocs.filter(d => d.content && d.content.trim().length > 0);
      if (docsWithContent.length > 0) {
        const maxTotalChars = 32000;
        let totalChars = 0;
        const docSections: string[] = [];
        for (const d of docsWithContent) {
          const remaining = maxTotalChars - totalChars;
          if (remaining <= 0) break;
          const maxPerDoc = Math.min(8000, remaining);
          const truncated = d.content!.length > maxPerDoc ? d.content!.slice(0, maxPerDoc) + "\n...(truncated)" : d.content!;
          const section = `--- ${d.name} (${d.type}) ---\n${truncated}`;
          docSections.push(section);
          totalChars += section.length;
        }
        knowledgeContext = `\n\nKnowledge Base Documents (use this information to answer questions when relevant):\n${docSections.join("\n\n")}`;
      }

      let syncFreshnessContext = "";
      if (latestMetricsSync || latestLeadSync) {
        const parts: string[] = [];
        if (latestMetricsSync?.completedAt) {
          parts.push(`VinSolutions metrics last refreshed ${formatSyncAge(latestMetricsSync.completedAt)}`);
        }
        if (latestLeadSync?.completedAt) {
          parts.push(`VinSolutions lead data last synced ${formatSyncAge(latestLeadSync.completedAt)}`);
        }
        if (parts.length > 0) {
          syncFreshnessContext = `\n\nData freshness:\n- ${parts.join("\n- ")}`;
        }
      }

      let activityContext = "";
      if (activityLogs.length > 0) {
        const activityLines = activityLogs.slice(0, 10).map((log: any) => {
          const time = log.createdAt ? new Date(log.createdAt).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "unknown";
          return `- [${time}] ${log.action}${log.entityType ? ` on ${log.entityType}` : ""}${log.metadata?.details ? `: ${log.metadata.details}` : ""}`;
        }).join("\n");
        activityContext = `\n\nRecent organization activity (last ${activityLogs.length} events):\n${activityLines}`;
      }

      let campaignContext = "";
      if (orgCampaigns.length > 0) {
        const campaignLines = orgCampaigns.slice(0, 10).map((c: any) => {
          return `- ${c.name} [${c.department}/${c.status}] sent:${c.sentCount || 0} replied:${c.repliedCount || 0}${c.executionStatus ? ` exec:${c.executionStatus}` : ""}`;
        }).join("\n");
        campaignContext = `\n\nCampaigns (${orgCampaigns.length} total):\n${campaignLines}`;
      }

      const systemPrompt = `You are ${personaName}, an AI assistant powering Nexxus Connect for ${orgName} — an automotive dealership management platform.

Current date and time: ${dateStr}, ${timeStr} (Eastern Time)

User context:
- Name: ${req.user.firstName} ${req.user.lastName}
- Role: ${req.user.roleName}
- Organization: ${orgName}

Organization data you have access to:
- Current organization: ${orgName}
- Team members (${activeUsers.length}): ${teamSummary}
- AI agents (${orgAgents.length}): ${agentSummary}${req.user.roleLevel <= 2 ? `\n- You are a ${req.user.roleName} with access to multiple organizations. The user is currently viewing ${orgName}. If they ask about "all companies" or "all stores," acknowledge that they manage multiple locations but you can only show data for the currently selected organization. They can switch organizations using the org switcher in the top navigation.` : ''}

Your personality and rules:
- Be conversational and concise — answer like a knowledgeable colleague, not a report generator
- Keep responses SHORT by default (2-4 sentences for simple questions). Only use detailed formatting when the user asks for analysis, reports, or breakdowns
- Do NOT use headers, tables, or bullet points for simple answers. Save structured formatting for when it genuinely helps (lists of items, comparisons, multi-part data)
- You understand automotive dealership operations deeply: sales pipelines, BDC, F&I, service scheduling, marketing campaigns, lead management, CRM workflows, inventory
- Never say "as an AI", "Pro tip:", or use onboarding-style language. Talk naturally.
- Never apologize unnecessarily
- If you don't have specific data, say so clearly — never fabricate dealership numbers, customer records, or metrics
- Never share or request PII (SSN, full credit card numbers, etc.)
- When you are unsure about current events, facts, people, locations, or anything time-sensitive, use the web_search tool to look it up — do not guess
- When the user asks about nearby businesses, competitors, local information, or anything geographic, use web_search
- When citing search results, be natural — incorporate the information conversationally, don't just dump raw results

Data provenance rules (CRITICAL):
- When referencing CRM/vendor data, attribute it as "from our records" — NEVER name the vendor or say "VinSolutions" to the user. Say things like "Based on our records from 2 hours ago..." or "According to our CRM data..."
- When referencing knowledge base documents uploaded by the organization, say "from our knowledge base" and mention the document name
- When referencing AI insights/hunches, mention they are AI-generated with their confidence level
- If data is stale (last synced > 6 hours ago), proactively note this: "Note: this data was last synced X hours ago and may not reflect the latest changes"
- If no CRM data is available or CRM tools return all zeros, do NOT display raw zeros. Instead, explain that no data was found for the period and suggest checking CRM integration status in Settings > Integrations
- Use the vin_query_leads tool to look up specific lead data and the vin_lead_summary tool to get overall metrics
- Use the query_campaigns tool when asked about campaigns, outreach, messaging performance, or service campaigns
- You have access to recent organization activity and campaign data provided in your context — reference it when users ask about recent activity or what's happening
- When web search results are used, cite them naturally
- Always make it clear whether information comes "from our records" (CRM/vendor data) or "from our knowledge base" (uploaded org documents)${orgSystemPrompt ? `\n\nOrganization-specific prompt:\n${orgSystemPrompt}` : ''}${chatInstructions ? `\n\nChat quality instructions (follow these carefully):\n${chatInstructions}` : ''}${isCrmGuru ? `

CRM GURU MODE (ACTIVE):
You are operating as the CRM Guru — the dedicated CRM intelligence agent. Follow these rules strictly:
1. ALWAYS query VinSolutions data FIRST for any CRM-related question using vin_query_leads or vin_lead_summary tools
2. If VinSolutions data is insufficient, supplement with internal data warehouse — but ALWAYS explicitly state: "I found additional data in your internal data warehouse" when using warehouse data
3. VinSolutions data is the primary source of truth for all CRM operations: leads, contacts, deals, activities
4. When presenting data, always attribute sources clearly: "[VinSolutions]" or "[Data Warehouse]"
5. If data conflicts exist between sources, prefer VinSolutions and note the discrepancy` : `

When the user asks a question that requires deep CRM data (specific lead details, deal histories, contact records, pipeline specifics):
- First try to answer from available internal data warehouse
- If the data is insufficient or the question requires real-time CRM data, suggest: "For detailed CRM data, I recommend switching to CRM Guru mode which has deeper CRM integration. You can activate it from the agent selector."`}${agentContext}${pageContext ? `\n\nPage context — the user is currently viewing: ${typeof pageContext === 'string' ? pageContext : JSON.stringify(pageContext)}. Tailor your responses to be relevant to what they're looking at.` : ''}${syncFreshnessContext}${activityContext}${campaignContext}${hunchContext}${knowledgeContext}`;

      const chatMessages: Array<{ role: "user" | "assistant"; content: string }> = recentMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      let fullResponse = "";
      let currentMessages: Anthropic.MessageParam[] = chatMessages;
      const MAX_TOOL_ROUNDS = 3;

      const nexxusOrgId = resolveNexxusOrgId(req.user.organizationId);

      const firstResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemPrompt,
        messages: currentMessages,
        tools: chatTools,
      });

      try {
        billingService.emitUsageEvent(req.user.organizationId, 'llm_input_tokens', { tokens: firstResponse.usage.input_tokens, model: 'claude' });
        billingService.emitUsageEvent(req.user.organizationId, 'llm_output_tokens', { tokens: firstResponse.usage.output_tokens, model: 'claude' });
      } catch(e) {}

      const needsToolUse = firstResponse.content.some(b => b.type === "tool_use");

      if (!needsToolUse) {
        for (const block of firstResponse.content) {
          if (block.type === "text" && block.text) {
            fullResponse += block.text;
            res.write(`data: ${JSON.stringify({ type: "content", text: block.text })}\n\n`);
          }
        }
      } else {
        let response = firstResponse;

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          let hasToolUse = false;
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          let intermediateText = "";

          for (const block of response.content) {
            if (block.type === "text") {
              intermediateText += block.text;
            } else if (block.type === "tool_use") {
              hasToolUse = true;
              if (intermediateText) {
                res.write(`data: ${JSON.stringify({ type: "content", text: intermediateText })}\n\n`);
                fullResponse += intermediateText;
                intermediateText = "";
              }

              let resultText: string;

              if (block.name === "web_search") {
                res.write(`data: ${JSON.stringify({ type: "status", text: "Searching the web..." })}\n\n`);
                try {
                  const results = await braveWebSearch((block.input as { query: string }).query, 3);
                  resultText = results.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.description}`).join("\n\n");
                } catch (searchErr) {
                  resultText = "Web search temporarily unavailable. Answer from your existing knowledge.";
                }
              } else if (block.name === "vin_query_leads") {
                res.write(`data: ${JSON.stringify({ type: "status", text: "Querying VinSolutions CRM..." })}\n\n`);
                try {
                  const input = block.input as { startDate?: string; endDate?: string; status?: string; limit?: number };
                  const args: Record<string, unknown> = { orgId: nexxusOrgId, limit: Math.min(input.limit || 20, 100) };
                  if (input.startDate) args.startDate = input.startDate;
                  if (input.endDate) args.endDate = input.endDate;
                  if (input.status) args.status = input.status;
                  if (!input.startDate) {
                    const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
                    args.startDate = thirtyAgo.toISOString().split("T")[0];
                  }
                  if (!input.endDate) {
                    args.endDate = new Date().toISOString().split("T")[0];
                  }
                  const data = await callMCP("vin_query_leads", args);
                  const leadCount = data?.count ?? data?.items?.length ?? 0;
                  const items = (data?.items || []).slice(0, 10);
                  const summary = items.map((l: any) => {
                    const name = [l.contact?.firstName, l.contact?.lastName].filter(Boolean).join(" ") || "Unknown";
                    return `- ${name} | Status: ${l.status || "N/A"} | Source: ${l.source?.name || "N/A"} | Vehicle: ${l.vehicle?.description || "N/A"}`;
                  }).join("\n");
                  resultText = `[Source: VinSolutions CRM, queried just now]\nTotal leads matching: ${leadCount}\n${summary || "No individual lead details available."}`;
                } catch (err: any) {
                  resultText = `VinSolutions query failed: ${err.message}. Unable to retrieve CRM data at this time.`;
                }
              } else if (block.name === "vin_lead_summary") {
                res.write(`data: ${JSON.stringify({ type: "status", text: "Fetching sales metrics from VinSolutions..." })}\n\n`);
                try {
                  const now = new Date();
                  const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                  const sixtyDaysAgo = new Date(now); sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
                  const fmt = (d: Date) => d.toISOString().split("T")[0];
                  const curStart = fmt(thirtyDaysAgo);
                  const curEnd = fmt(now);
                  const prevStart = fmt(sixtyDaysAgo);
                  const prevEnd = fmt(thirtyDaysAgo);

                  const qc = (s: string, e: string, st?: string) =>
                    callMCP("vin_query_leads", { orgId: nexxusOrgId, startDate: s, endDate: e, limit: 1, ...(st ? { status: st } : {}) })
                      .then((r: any) => r.count ?? r.totalItems ?? r.total ?? 0).catch(() => 0);

                  const [curTotal, prevTotal, curSold, prevSold, curNew, prevNew, curActive, curAppt, curWaiting] = await Promise.all([
                    qc(curStart, curEnd), qc(prevStart, prevEnd),
                    qc(curStart, curEnd, "SOLD_DELIVERED"), qc(prevStart, prevEnd, "SOLD_DELIVERED"),
                    qc(curStart, curEnd, "ACTIVE_NEW_LEAD"), qc(prevStart, prevEnd, "ACTIVE_NEW_LEAD"),
                    qc(curStart, curEnd, "ACTIVE_ACTIVE_LEAD"),
                    qc(curStart, curEnd, "ACTIVE_SET_APPOINTMENT"),
                    qc(curStart, curEnd, "ACTIVE_WAITING_FOR_PROSPECT_RESPONSE"),
                  ]);

                  const pct = (c: number, p: number) => p === 0 ? (c > 0 ? "+100%" : "0%") : `${((c - p) / p * 100).toFixed(0)}%`;
                  const convRate = curTotal > 0 ? `${Math.round((curSold / curTotal) * 100)}%` : "N/A";

                  if (curTotal === 0 && prevTotal === 0) {
                    resultText = `[Source: CRM, queried just now]\nNo lead data found for ${curStart} to ${curEnd}. ` +
                      `This could mean the CRM integration is still syncing initial data, no leads were created in this period, ` +
                      `or the CRM connection needs to be verified in Settings > Integrations.`;
                  } else {
                    resultText = `[Source: CRM, queried just now]\nPeriod: ${curStart} to ${curEnd}\n` +
                      `Total Leads: ${curTotal} (${pct(curTotal, prevTotal)} vs prior 30d)\n` +
                      `New Leads: ${curNew} (${pct(curNew, prevNew)} vs prior 30d)\n` +
                      `Active Pipeline: ${curActive}\n` +
                      `Appointments Set: ${curAppt}\n` +
                      `Waiting for Response: ${curWaiting}\n` +
                      `Sold/Delivered: ${curSold} (${pct(curSold, prevSold)} vs prior 30d)\n` +
                      `Conversion Rate: ${convRate}`;
                  }
                } catch (err: any) {
                  resultText = `CRM summary failed: ${err.message}. Unable to retrieve metrics at this time.`;
                }
              } else if (block.name === "query_campaigns") {
                res.write(`data: ${JSON.stringify({ type: "status", text: "Checking campaign data..." })}\n\n`);
                try {
                  const dept = (block.input as any).department;
                  const campaigns = await storage.getCampaigns(req.user!.organizationId, dept ? { department: dept } : undefined);
                  if (campaigns.length === 0) {
                    resultText = `No campaigns found${dept ? ` for ${dept} department` : ""}. Campaigns can be created in the Service section.`;
                  } else {
                    resultText = `[Campaign data, ${campaigns.length} total${dept ? ` (filtered: ${dept})` : ""}]\n` +
                      campaigns.map(c => `- ${c.name} [${c.department}/${c.status}] channel:${c.channel || "sms"} sent:${(c as any).sentCount || 0} replied:${(c as any).repliedCount || 0}${(c as any).executionStatus ? ` execution:${(c as any).executionStatus}` : ""}`).join("\n");
                  }
                } catch (err: any) {
                  resultText = `Campaign query failed: ${err.message}`;
                }
              } else {
                resultText = "Unknown tool.";
              }

              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: resultText || "No results found.",
              });
            }
          }

          if (intermediateText) {
            fullResponse += intermediateText;
            res.write(`data: ${JSON.stringify({ type: "content", text: intermediateText })}\n\n`);
          }

          if (!hasToolUse) break;

          currentMessages = [
            ...currentMessages,
            { role: "assistant", content: response.content },
            { role: "user", content: toolResults },
          ];

          if (round === MAX_TOOL_ROUNDS - 1) break;

          response = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: systemPrompt,
            messages: currentMessages,
            tools: chatTools,
          });

          try {
            billingService.emitUsageEvent(req.user.organizationId, 'llm_input_tokens', { tokens: response.usage.input_tokens, model: 'claude' });
            billingService.emitUsageEvent(req.user.organizationId, 'llm_output_tokens', { tokens: response.usage.output_tokens, model: 'claude' });
          } catch(e) {}
        }

        const stream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: systemPrompt,
          messages: currentMessages,
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            const text = event.delta.text;
            if (text) {
              fullResponse += text;
              res.write(`data: ${JSON.stringify({ type: "content", text })}\n\n`);
            }
          }
        }
      }

      await storage.createMessage({
        conversationId,
        role: "assistant",
        content: fullResponse,
        senderName: agentName || personaName,
      });
      await storage.updateConversation(conversationId, { lastMessageAt: new Date() });

      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      res.end();
    } catch (err: any) {
      console.error("Chat stream error:", err);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", message: err.message || "Stream failed" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Failed to stream chat response" });
      }
    }
  });
}
