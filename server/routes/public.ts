import type { Express } from "express";
import Anthropic from "@anthropic-ai/sdk";
import rateLimit from "express-rate-limit";
import { storage } from "../storage";
import { callMCP } from "../vendorProxy";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const widgetLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded' },
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return ip.replace(/:\d+$/, '');
  },
});

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

  app.post("/api/widget/voice-callback", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkPublicRate(ip)) return res.status(429).json({ message: "Too many requests" });
    try {
      const { slug, phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const org = slug ? await resolveOrgBySlug(slug) : null;
      if (!org) {
        return res.status(404).json({ message: "Organization not found" });
      }

      const agents = await storage.getAgents(org.id);
      const voiceAgent = agents.find(a => a.vapiAssistantId && a.channels?.includes("voice") && a.status === "active");
      if (!voiceAgent?.vapiAssistantId) {
        return res.status(400).json({ message: "No voice agent configured for this organization" });
      }

      const customerNumber = phoneNumber.replace(/[^0-9+]/g, "");
      const formattedNumber = customerNumber.startsWith("+") ? customerNumber : `+1${customerNumber}`;

      const settings = (org.settings || {}) as Record<string, any>;
      const callArgs: Record<string, unknown> = {
        assistantId: voiceAgent.vapiAssistantId,
        customerNumber: formattedNumber,
      };
      if (settings.vapiPhoneNumberId) {
        callArgs.phoneNumberId = settings.vapiPhoneNumberId;
      }

      let result: any;
      try {
        result = await callMCP("vapi_create_call", callArgs);
      } catch (vapiErr: any) {
        console.error(`[Widget Callback] VAPI call failed for ${formattedNumber} at ${org.name}:`, vapiErr?.message || vapiErr);
        return res.status(503).json({ error: "Voice callback service temporarily unavailable", details: vapiErr?.message || "Unknown VAPI error" });
      }
      console.log(`[Widget Callback] Outbound call initiated to ${formattedNumber} for ${org.name}, callId: ${result.id}`);

      const conversation = await storage.createConversation({
        customerName: "Callback Request",
        customerEmail: "",
        customerPhone: formattedNumber,
        channel: "voice",
        status: "open",
        organizationId: org.id,
        unreadCount: 1,
        lastMessageAt: new Date(),
      });

      return res.json({ success: true, callId: result.id, conversationId: conversation.id });
    } catch (err: any) {
      console.error("Widget voice-callback error:", err?.message || err);
      return res.status(500).json({ message: "Failed to initiate callback" });
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
      const videoAgent = agents.find(a => a.tavusPersonaId && a.status === "active");

      return res.json({
        vapiAssistantId: voiceAgent?.vapiAssistantId || null,
        tavusPersonaId: videoAgent?.tavusPersonaId || null,
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

      // I-252: bound the message history sent to Claude to the last 20 entries
      // to avoid context-window overflow on long widget conversations. Matches
      // the slice(-20) pattern in chat.ts:124. The user's just-stored message
      // is always at the tail, so the cap covers ~10 turns of recent history.
      const existingMessages = (await storage.getMessages(conversation.id)).slice(-20);
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
.instructions{background:#fff;border:2px solid #e2e8f0;border-radius:12px;padding:28px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
.instructions h3{font-size:16px;font-weight:700;color:#1e293b;margin:24px 0 8px;padding-top:16px;border-top:1px solid #f1f5f9}
.instructions h3:first-child{margin-top:0;padding-top:0;border-top:none}
.instructions p{font-size:14px;color:#475569;line-height:1.7;margin-bottom:12px}
.instructions ul{font-size:14px;color:#475569;line-height:1.8;padding-left:20px;margin-bottom:12px}
.instructions pre{background:#1e293b;color:#e2e8f0;padding:16px 20px;border-radius:8px;font-size:13px;overflow-x:auto;margin:12px 0}
.instructions code{background:#f1f5f9;color:#6366f1;padding:2px 6px;border-radius:4px;font-size:13px}
.instructions pre code{background:none;color:inherit;padding:0}
.url-list{display:flex;flex-direction:column;gap:8px;margin:12px 0 20px}
.url-item{display:flex;align-items:center;gap:12px;padding:10px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;font-size:13px}
.url-item strong{min-width:160px;color:#334155;font-size:14px}
.url-item code{background:#fff;flex:1;word-break:break-all}
</style>
</head>
<body>
<div class="header">
<h1>Dealer.com / Huminic AI Partnership Portal</h1>
<p>File and Configuration Handoff Portal</p>
</div>
<div class="container">
<div class="section-label">Video Widget Links</div>
<div class="stores">
<a class="store-btn" href="${host}/widget/dealer/serra-honda.js" target="_blank" data-testid="btn-serra-honda">Serra Honda<div class="slug">serra-honda</div><div class="persona">Caroline</div></a>
<a class="store-btn" href="${host}/widget/dealer/serra-nissan.js" target="_blank" data-testid="btn-serra-nissan">Serra Nissan<div class="slug">serra-nissan</div><div class="persona">Magnolia</div></a>
<a class="store-btn" href="${host}/widget/dealer/tony-serra-ford.js" target="_blank" data-testid="btn-tony-serra-ford">Tony Serra Ford<div class="slug">tony-serra-ford</div><div class="persona">Georgia</div></a>
<a class="store-btn" href="${host}/widget/dealer/hyundai-of-columbia.js" target="_blank" data-testid="btn-hyundai-of-columbia">Hyundai of Columbia<div class="slug">hyundai-of-columbia</div><div class="persona">Elizabeth</div></a>
<a class="store-btn" href="${host}/widget/dealer/ford-of-columbia.js" target="_blank" data-testid="btn-ford-of-columbia">Ford of Columbia<div class="slug">ford-of-columbia</div><div class="persona">Savannah</div></a>
</div>
<hr class="divider">
<div class="section-label">Integration Instructions</div>
<div class="instructions">
<h3>Self-Hosted JavaScript Widget URLs</h3>
<p>Each dealer has a unique video chat widget delivered as a self-hosted JavaScript file. Click any link above to preview the experience, or use the URLs below for integration.</p>
<div class="url-list">
<div class="url-item"><strong>Serra Honda</strong><code>${host}/widget/dealer/serra-honda.js</code></div>
<div class="url-item"><strong>Serra Nissan</strong><code>${host}/widget/dealer/serra-nissan.js</code></div>
<div class="url-item"><strong>Tony Serra Ford</strong><code>${host}/widget/dealer/tony-serra-ford.js</code></div>
<div class="url-item"><strong>Hyundai of Columbia</strong><code>${host}/widget/dealer/hyundai-of-columbia.js</code></div>
<div class="url-item"><strong>Ford of Columbia</strong><code>${host}/widget/dealer/ford-of-columbia.js</code></div>
</div>
<h3>Embed Code</h3>
<p>To embed on a dealer website, add a script tag to the page:</p>
<pre>&lt;script src="${host}/widget/dealer/{dealer-slug}.js"&gt;&lt;/script&gt;</pre>
<p>The widget loads automatically on page load. No additional configuration required. Each script is self-contained with the dealer name, branding, and AI persona pre-configured.</p>
<h3>Direct Links</h3>
<p>Each URL can also be opened directly in a browser to launch the video chat experience. When accessed directly, the widget renders a full-page name prompt followed by a live Tavus AI video session.</p>
<h3>Technical Details</h3>
<ul>
<li>Hosted at: <code>${host}</code></li>
<li>Video AI: Tavus (two-way conversational video)</li>
<li>Requires: Camera and microphone permissions</li>
<li>Compatible: All modern browsers (Chrome, Firefox, Safari, Edge)</li>
<li>Mobile: Responsive layout, works on mobile devices</li>
</ul>
</div>
</div>
</body></html>`;
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });

  app.get("/widget/dealer/:slug.js", async (req, res) => {
    const slug = req.params.slug;
    let org = await resolveOrgBySlug(slug);
    if (!org) {
      const redirect = await storage.getSlugRedirect(slug);
      if (redirect) {
        org = await resolveOrgBySlug(redirect.newSlug);
      }
      if (!org) return res.status(404).send("// dealer not found");
    }
    const proto = req.get("x-forwarded-proto") || req.protocol;
    const host = (process.env.APP_BASE_URL || `${proto}://${req.get("host")}`).replace(/\/+$/, '');
    const color = "#6366f1";
    const name = org.name;

    // If accessed directly in a browser, create a Tavus session and redirect to it
    const acceptHeader = req.get("Accept") || "";
    if (acceptHeader.includes("text/html") && !acceptHeader.includes("application/javascript")) {
      try {
        const agents = await storage.getAgents(org.id);
        const videoAgent = agents.find((a: any) => a.tavusPersonaId && a.status === "active");
        if (!videoAgent?.tavusPersonaId) {
          return res.status(503).send("<html><body><p>Video chat is not currently available for " + name + ".</p></body></html>");
        }
        const result = await callMCP("tavus_create_conversation", {
          persona_id: videoAgent.tavusPersonaId,
          conversation_name: name + " Visitor",
          callback_url: "https://live.huminic.app/api/webhooks/tavus",
        });
        if (result?.conversation_url) {
          return res.redirect(result.conversation_url);
        }
        return res.status(503).send("<html><body><p>Video chat is temporarily unavailable. Please try again later.</p></body></html>");
      } catch (err: any) {
        return res.status(503).send("<html><body><p>Video chat is temporarily unavailable. Please try again later.</p></body></html>");
      }
    }

    // When loaded as a <script> tag, create a Tavus session and fullscreen iframe it
    const js = `(function(){
var H="${host}",S="${slug}",N="${name}";
if(document.getElementById("nexxus-vw-"+S))return;
var d=document.createElement("div");d.id="nexxus-vw-"+S;
d.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;background:#000;";
d.innerHTML='<p style="color:#fff;text-align:center;padding:40px;font-family:sans-serif;">Connecting to video chat...</p>';
document.body.appendChild(d);
fetch(H+"/api/widget/video-session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug:S})})
.then(function(r){if(!r.ok)throw new Error("Failed");return r.json();})
.then(function(data){
  if(!data.conversationUrl)throw new Error("No URL");
  d.innerHTML='<iframe src="'+data.conversationUrl+'" style="width:100%;height:100%;border:none;" allow="microphone;camera;autoplay;display-capture"></iframe>';
})
.catch(function(){
  d.innerHTML='<p style="color:#fff;text-align:center;padding:40px;font-family:sans-serif;">Video chat is temporarily unavailable.</p>';
});
})();`;
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Vary", "Accept");
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
