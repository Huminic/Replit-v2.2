import type { Express } from "express";
import Anthropic from "@anthropic-ai/sdk";
import rateLimit from "express-rate-limit";
import { storage } from "../storage";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const widgetLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Rate limit exceeded' } });

const publicRateLimits = new Map<string, { count: number; resetAt: number }>();
const checkPublicRate = (ip: string, limit = 60, windowMs = 60000): boolean => {
  const now = Date.now();
  const entry = publicRateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    publicRateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
};
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of publicRateLimits) {
    if (now > val.resetAt) publicRateLimits.delete(key);
  }
}, 60000);

async function resolveOrgBySlug(slug: string) {
  let org = await storage.getOrganizationBySlug(slug);
  if (!org && slug === "demo") {
    const allOrgs = await storage.getOrganizations();
    if (allOrgs.length > 0) org = allOrgs[0];
  }
  return org;
}

export function registerPublicRoutes(app: Express) {
  app.get("/api/public/landing/:slug", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkPublicRate(ip)) return res.status(429).json({ message: "Too many requests" });
    try {
      const slug = req.params.slug;
      let org = await resolveOrgBySlug(slug);
      if (!org) {
        const redirect = await storage.getSlugRedirect(slug);
        if (redirect) {
          return res.json({ redirect: true, newSlug: redirect.newSlug });
        }
        return res.status(404).json({ message: "Organization not found" });
      }
      return res.json({
        id: org.id,
        name: org.name,
        slug: org.slug,
        personaName: org.personaName,
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to load landing page" });
    }
  });

  app.post("/api/widget/contact", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkPublicRate(ip)) return res.status(429).json({ message: "Too many requests" });
    try {
      const { widgetCode, slug, name, email, phone, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ message: "Name, email, and message are required" });
      }

      let org;
      if (widgetCode) {
        const allOrgs = await storage.getOrganizations();
        for (const o of allOrgs) {
          const orgWidgets = await storage.getWidgets(o.id);
          if (orgWidgets.find(w => w.widgetCode === widgetCode)) {
            org = o;
            break;
          }
        }
      } else if (slug) {
        org = await resolveOrgBySlug(slug);
      }

      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const conversation = await storage.createConversation({
        customerName: name,
        customerEmail: email,
        customerPhone: phone || null,
        channel: "form",
        status: "open",
        organizationId: org.id,
        unreadCount: 1,
        lastMessageAt: new Date(),
      });

      const formContent = `Contact Form Submission\n\nName: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ""}\n\nMessage:\n${message}`;

      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: formContent,
        senderName: name,
      });

      return res.json({ success: true, conversationId: conversation.id });
    } catch (err) {
      console.error("Widget contact error:", err);
      return res.status(500).json({ message: "Failed to submit contact form" });
    }
  });

  app.get("/api/widget/voice-config/:slug", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkPublicRate(ip)) return res.status(429).json({ message: "Too many requests" });
    try {
      const org = await resolveOrgBySlug(req.params.slug);
      if (!org) return res.status(404).json({ message: "Organization not found" });

      const agents = await storage.getAgents(org.id);
      const voiceAgent = agents.find(a => a.vapiAssistantId && a.status === "active");
      const videoAgent = agents.find(a => (a as any).tavusPersonaId && a.status === "active");

      return res.json({
        vapiAssistantId: voiceAgent?.vapiAssistantId || null,
        tavusPersonaId: (videoAgent as any)?.tavusPersonaId || null,
        orgName: org.name,
        personaName: org.personaName,
      });
    } catch (err) {
      return res.status(500).json({ message: "Failed to load voice config" });
    }
  });

  app.get("/api/widgets/public/:widgetCode", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkPublicRate(ip)) return res.status(429).json({ message: "Too many requests" });
    try {
      const allOrgs = await storage.getOrganizations();
      for (const org of allOrgs) {
        const widgets = await storage.getWidgets(org.id);
        const widget = widgets.find(w => w.widgetCode === req.params.widgetCode);
        if (widget) {
          const config = (widget.config || {}) as Record<string, any>;
          return res.json({
            widgetCode: widget.widgetCode,
            type: widget.type,
            name: widget.name,
            orgName: org.name,
            personaName: org.personaName,
            appearance: config.appearance || {},
            channels: {
              chat: true,
              video: true,
              voice: true,
            },
          });
        }
      }
      return res.status(404).json({ message: "Widget not found" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to load widget config" });
    }
  });

  app.post("/api/widget/chat", widgetLimiter, async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkPublicRate(ip, 30)) return res.status(429).json({ message: "Too many requests" });
    try {
      const { slug, message, conversationId } = req.body;
      if (!slug || !message) {
        return res.status(400).json({ message: "slug and message are required" });
      }

      const org = await resolveOrgBySlug(slug);
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }

      let conversation;
      let isNewConversation = false;
      if (conversationId) {
        conversation = await storage.getConversation(conversationId);
        if (!conversation || conversation.organizationId !== org.id) {
          return res.status(404).json({ message: "Conversation not found" });
        }
      } else {
        conversation = await storage.createConversation({
          customerName: "Website Visitor",
          channel: "chat",
          status: "open",
          organizationId: org.id,
          unreadCount: 1,
          lastMessageAt: new Date(),
        });
        isNewConversation = true;
      }

      let autoGreetingMessage: string | null = null;
      if (isNewConversation) {
        try {
          const orgAgents = await storage.getAgents(org.id);
          const greetingAgent = orgAgents.find(a => a.autoGreeting && a.status === "active");
          if (greetingAgent && greetingAgent.autoGreeting) {
            autoGreetingMessage = greetingAgent.autoGreeting
              .replace(/\{\{customerName\}\}/g, "there")
              .replace(/\{\{dealershipName\}\}/g, org.name || "our dealership")
              .replace(/\{\{agentName\}\}/g, greetingAgent.name || "your assistant");

            await storage.createMessage({
              conversationId: conversation.id,
              role: "assistant",
              content: autoGreetingMessage,
              senderName: greetingAgent.name,
            });

            storage.createActivityLog({
              organizationId: org.id,
              action: "auto_greeting_sent",
              entityType: "conversation",
              entityId: conversation.id,
              metadata: { agentName: greetingAgent.name, channel: "chat" },
            }).catch(() => {});
          }
        } catch (greetErr: any) {
          console.error(`[AutoGreeting] Webchat greeting failed:`, greetErr.message);
        }
      }

      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: message,
        senderName: "Website Visitor",
      });

      const existingMessages = await storage.getMessages(conversation.id);
      const claudeMessages = existingMessages.map(m => ({
        role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      }));

      let aiResponse = "I'm sorry, I'm unable to respond right now. Please try again later.";
      try {
        const orgDocuments = await storage.getDocuments(org.id);
        const docsWithContent = orgDocuments.filter(d => d.content && d.content.trim().length > 0 && !d.agentId);
        let widgetKnowledgeContext = "";
        if (docsWithContent.length > 0) {
          const maxTotalChars = 16000;
          let totalChars = 0;
          const docSections: string[] = [];
          for (const d of docsWithContent) {
            const remaining = maxTotalChars - totalChars;
            if (remaining <= 0) break;
            const maxPerDoc = Math.min(4000, remaining);
            const truncated = d.content!.length > maxPerDoc ? d.content!.slice(0, maxPerDoc) + "\n...(truncated)" : d.content!;
            const section = `--- ${d.name} (${d.type}) ---\n${truncated}`;
            docSections.push(section);
            totalChars += section.length;
          }
          widgetKnowledgeContext = `\n\nKnowledge Base Documents (use this information to answer questions when relevant):\n${docSections.join("\n\n")}`;
        }
        const systemPrompt = `You are ${org.personaName}, an AI concierge for ${org.name}. You are helpful, friendly, and professional. Help website visitors with their questions about the dealership, vehicles, services, and appointments. Keep responses concise and conversational.${widgetKnowledgeContext}`;
        const claudeResult = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 300,
          system: systemPrompt,
          messages: claudeMessages,
        });
        const textBlock = claudeResult.content.find(b => b.type === "text");
        if (textBlock && textBlock.type === "text") {
          aiResponse = textBlock.text;
        }
      } catch (aiErr) {
        console.error("[WidgetChat] Claude API error:", aiErr);
      }

      await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: aiResponse,
        senderName: org.personaName,
      });

      await storage.updateConversation(conversation.id, {
        lastMessageAt: new Date(),
        unreadCount: (conversation.unreadCount || 0) + 1,
      });

      return res.json({
        conversationId: conversation.id,
        response: aiResponse,
        autoGreeting: autoGreetingMessage,
      });
    } catch (err) {
      console.error("[WidgetChat] Error:", err);
      return res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get("/widget/test", async (req, res) => {
    const proto = req.get("x-forwarded-proto") || req.protocol;
    const host = (process.env.APP_BASE_URL || `${proto}://${req.get("host")}`).replace(/\/+$/, '');
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Dealer.com / Huminic AI — Partnership Portal</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#1e293b}
.header{background:linear-gradient(135deg,#1e40af,#2563eb,#3b82f6);color:#fff;padding:52px 24px 44px;text-align:center}
.header h1{font-size:26px;font-weight:700;margin-bottom:6px;letter-spacing:-0.3px}
.header p{opacity:0.85;font-size:15px;font-weight:400}
.container{max-width:900px;margin:0 auto;padding:32px 24px 48px}
.section-label{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#6366f1;margin-bottom:16px}
.stores{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px;margin-bottom:0}
.store-btn{display:block;padding:20px 22px;background:#fff;border:2px solid #e2e8f0;border-radius:12px;cursor:pointer;text-align:left;transition:all 0.2s;font-size:16px;font-weight:600;color:#334155;box-shadow:0 1px 3px rgba(0,0,0,0.06);text-decoration:none}
.store-btn:hover{border-color:#6366f1;background:#eef2ff;transform:translateY(-2px);box-shadow:0 4px 12px rgba(99,102,241,0.15)}
.store-btn .slug{font-size:12px;color:#94a3b8;font-weight:400;margin-top:6px}
.store-btn .persona{font-size:12px;color:#6366f1;font-weight:500;margin-top:4px;font-style:italic}
.divider{border:none;border-top:2px solid #e2e8f0;margin:40px 0}
.zip-card{display:flex;align-items:center;gap:20px;background:#fff;border:2px solid #e2e8f0;border-radius:12px;padding:24px 28px;box-shadow:0 1px 3px rgba(0,0,0,0.06);transition:all 0.2s;text-decoration:none;color:#334155;max-width:560px}
.zip-card:hover{border-color:#6366f1;background:#eef2ff;transform:translateY(-2px);box-shadow:0 4px 12px rgba(99,102,241,0.15)}
.zip-icon{flex-shrink:0;width:56px;height:56px;background:linear-gradient(135deg,#6366f1,#818cf8);border-radius:12px;display:flex;align-items:center;justify-content:center}
.zip-icon svg{width:28px;height:28px;color:#fff;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.zip-info h3{font-size:16px;font-weight:600;margin-bottom:4px;color:#1e293b}
.zip-info p{font-size:13px;color:#64748b;line-height:1.5}
</style>
</head>
<body>
<div class="header">
<h1>Dealer.com / Huminic AI Partnership Portal</h1>
<p>File and Configuration Handoff Portal</p>
</div>
<div class="container">
<div class="section-label">Video Widget JavaScript Demonstration</div>
<div class="stores">
<a class="store-btn" href="${host}/p/serra-honda?mode=video" target="_blank" data-testid="btn-serra-honda">Serra Honda<div class="slug">serra-honda</div><div class="persona">Caroline</div></a>
<a class="store-btn" href="${host}/p/serra-nissan?mode=video" target="_blank" data-testid="btn-serra-nissan">Serra Nissan<div class="slug">serra-nissan</div><div class="persona">Magnolia</div></a>
<a class="store-btn" href="${host}/p/tony-serra-ford?mode=video" target="_blank" data-testid="btn-tony-serra-ford">Tony Serra Ford<div class="slug">tony-serra-ford</div><div class="persona">Georgia</div></a>
<a class="store-btn" href="${host}/p/hyundai-of-columbia?mode=video" target="_blank" data-testid="btn-hyundai-of-columbia">Hyundai of Columbia<div class="slug">hyundai-of-columbia</div><div class="persona">Elizabeth</div></a>
<a class="store-btn" href="${host}/p/ford-of-columbia?mode=video" target="_blank" data-testid="btn-ford-of-columbia">Ford of Columbia<div class="slug">ford-of-columbia</div><div class="persona">Savannah</div></a>
</div>
<hr class="divider">
<div class="section-label">Dealer.com Files &amp; Instructions</div>
<a class="zip-card" href="/dealer-handoff/Nexxus_Connect_Dealer.com_Integration.zip" download data-testid="link-download-zip">
<div class="zip-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></div>
<div class="zip-info">
<h3>Nexxus_Connect_Dealer.com_Integration.zip</h3>
<p>Contains integration instructions and JavaScript widget links for all 5 stores. Ready for Dealer.com team handoff.</p>
</div>
</a>
</div>
</body></html>`;
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });

  app.get("/widget/dealer/:slug.js", async (req, res) => {
    const slug = req.params.slug;
    const org = await resolveOrgBySlug(slug);
    if (!org) return res.status(404).send("// dealer not found");
    const proto = req.get("x-forwarded-proto") || req.protocol;
    const host = (process.env.APP_BASE_URL || `${proto}://${req.get("host")}`).replace(/\/+$/, '');
    const color = "#6366f1";
    const name = org.name;
    const js = `(function(){var H="${host}",S="${slug}",N="${name}",C="${color}";if(document.getElementById("nexxus-widget-"+S))return;var btn=document.createElement("a");btn.id="nexxus-widget-"+S;btn.href=H+"/p/"+S+"?mode=video";btn.target="_blank";btn.rel="noopener";btn.setAttribute("role","button");btn.setAttribute("aria-label","Chat with "+N);btn.style.cssText="position:fixed;bottom:20px;right:20px;z-index:2147483647;cursor:pointer;display:flex;align-items:center;gap:8px;background:"+C+";color:#fff;border-radius:28px;padding:12px 20px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:14px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,0.18);transition:transform 0.2s,box-shadow 0.2s;text-decoration:none;";btn.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>Chat with us</span>';btn.onmouseenter=function(){btn.style.transform="scale(1.05)";btn.style.boxShadow="0 6px 24px rgba(0,0,0,0.25)";};btn.onmouseleave=function(){btn.style.transform="scale(1)";btn.style.boxShadow="0 4px 16px rgba(0,0,0,0.18)";};document.body.appendChild(btn);})();`;
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(js);
  });

  app.get("/widget/nexxus-widget.js", (_req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(`
(function() {
  var cfg = window.nexxusConfig || {};
  if (!cfg.widgetId) { console.error('Nexxus Widget: missing widgetId in nexxusConfig'); return; }
  var host = cfg.host || window.location.origin;
  var iframe = document.createElement('iframe');
  iframe.src = host + '/w/demo?widget=' + encodeURIComponent(cfg.widgetId);
  iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:380px;height:600px;border:none;z-index:999999;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.12);';
  iframe.allow = 'microphone;camera';
  document.body.appendChild(iframe);
})();
    `.trim());
  });
}
