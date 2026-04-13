import type { Express } from "express";
import multer from "multer";
import { authenticateToken, requireRole } from "../auth";
import { storage } from "../storage";

const upload = multer({ storage: multer.memoryStorage() });

const publicRateLimits = new Map<string, { count: number; resetAt: number }>();

// Mutex map to prevent duplicate conversation creation from concurrent webhooks (I-175)
const conversationLocks = new Map<string, Promise<void>>();
async function withConversationLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  while (conversationLocks.has(key)) {
    await conversationLocks.get(key);
  }
  let resolve: () => void;
  const lock = new Promise<void>(r => { resolve = r; });
  conversationLocks.set(key, lock);
  try {
    return await fn();
  } finally {
    conversationLocks.delete(key);
    resolve!();
  }
}

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

/**
 * Check if a string looks like a phone number rather than a real name.
 * Used to avoid greeting customers with "Hi +18392729080!".
 */
function looksLikePhoneNumber(name: string): boolean {
  const stripped = name.replace(/[\s\-().+]/g, "");
  return /^\d{7,15}$/.test(stripped);
}

export function registerSmsRoutes(app: Express) {
  app.post("/api/webhooks/textmagic", upload.none(), async (req, res) => {
    const textmagicSecret = process.env.TEXTMAGIC_WEBHOOK_SECRET;
    if (textmagicSecret) {
      const headerSecret = req.headers["x-textmagic-secret"] || req.headers["x-tm-signature"] || "";
      const providedSecret = typeof headerSecret === "string" ? headerSecret : "";
      if (providedSecret !== textmagicSecret) {
        console.warn("[TextMagic Webhook] Invalid secret — rejecting request");
        return res.status(401).json({ message: "Unauthorized" });
      }
    }

    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkPublicRate(ip, 30)) return res.status(429).json({ message: "Too many requests" });
    try {
      // Detect delivery notification (DLR) payloads — these have status/messageId but no sender/text
      const body = req.body;
      const isDeliveryNotification = body.status || body.messageId || body.id;
      if (isDeliveryNotification && !body.sender && !body.text) {
        // Log the delivery status for debugging
        console.log(`[TextMagic] Delivery notification received: messageId=${body.messageId || body.id}, status=${body.status}`);
        // Return 200 to acknowledge — TextMagic will stop retrying
        return res.status(200).json({ received: true, type: "delivery_notification" });
      }

      const { sender, text: messageText, receiver } = req.body;
      const phone = typeof sender === "string" ? sender : String(sender || "");
      const content = typeof messageText === "string" ? messageText : String(messageText || "");
      const receiverPhone = typeof receiver === "string" ? receiver : String(receiver || "");
      let timestamp = new Date();
      if (req.body.timestamp) {
        const ts = Number(req.body.timestamp);
        timestamp = !isNaN(ts) ? new Date(ts * 1000) : new Date(req.body.timestamp);
        if (isNaN(timestamp.getTime())) timestamp = new Date();
      }

      if (!phone || !content) {
        return res.status(400).json({ message: "Missing sender or text in webhook payload" });
      }

      const normalizedPhone = phone.replace(/[^0-9+]/g, "");
      const normalizedReceiver = receiverPhone.replace(/[^0-9+]/g, "");

      console.log(`[TextMagic Webhook] Inbound SMS from ${normalizedPhone} to ${normalizedReceiver}: "${content.substring(0, 80)}"`);

      const receiverOrg = normalizedReceiver ? await storage.getOrganizationByTextmagicPhone(normalizedReceiver) : undefined;
      if (receiverOrg) {
        const receiverSettings = (receiverOrg.settings || {}) as Record<string, any>;
        const orgTmPhone = (receiverSettings.textmagicPhone || "").replace(/[^0-9+]/g, "");
        const senderDigits = normalizedPhone.replace(/\+/g, "");
        const orgTmDigits = orgTmPhone.replace(/\+/g, "");
        if (senderDigits === orgTmDigits || normalizedPhone === orgTmPhone) {
          console.log(`[TextMagic Webhook] Ignoring outbound echo — sender ${normalizedPhone} matches org TextMagic number`);
          return res.json({ success: true, skipped: true, reason: "outbound_echo" });
        }
      }

      let resolvedOrg: string | null = null;

      if (receiverOrg) {
        resolvedOrg = receiverOrg.id;
        console.log(`[TextMagic Webhook] Resolved org via receiver TextMagic number: ${resolvedOrg} (${receiverOrg.name})`);
      }

      if (!resolvedOrg) {
        const lastOutbound = await storage.findLastOutboundForPhone(normalizedPhone, "sms");
        if (lastOutbound?.organizationId) {
          resolvedOrg = lastOutbound.organizationId;
          console.log(`[TextMagic Webhook] Resolved org via outbound history: ${resolvedOrg}`);
        }
      }

      if (!resolvedOrg) {
        const contactOrg = await storage.findOrganizationByPhone(normalizedPhone);
        if (contactOrg) {
          resolvedOrg = contactOrg.id;
        }
      }

      if (!resolvedOrg) {
        const allOrgs = await storage.getOrganizations();
        if (allOrgs.length === 1) {
          resolvedOrg = allOrgs[0].id;
        } else {
          console.warn("[TextMagic Webhook] Cannot resolve organization for unknown phone — multiple orgs exist, no fallback to arbitrary org");
          return res.status(200).json({ message: "Received — unresolvable sender, no action taken" });
        }
      }

      const organizationId = resolvedOrg;

      const STOP_KEYWORDS = ["STOP", "UNSUBSCRIBE", "QUIT", "CANCEL", "END", "OPTOUT"];
      const normalizedContent = content.trim().toUpperCase();
      if (STOP_KEYWORDS.includes(normalizedContent)) {
        const org = await storage.getOrganization(organizationId);
        const orgName = org?.name || "this organization";

        await storage.createBlacklistEntry({
          phoneNumber: normalizedPhone,
          organizationId,
          reason: normalizedContent,
        });

        const openConvos = await storage.getConversations(organizationId, { status: "open", channel: "sms" });
        for (const conv of openConvos) {
          if (conv.customerPhone === normalizedPhone) {
            await storage.updateConversation(conv.id, { status: "closed" });
          }
        }

        try {
          const { sendStopConfirmation } = await import("../outbound");
          await sendStopConfirmation(normalizedPhone, orgName, organizationId);
        } catch (confirmErr: any) {
          console.error(`[TextMagic Webhook] Failed to send STOP confirmation to ${normalizedPhone}:`, confirmErr.message);
        }

        storage.createActivityLog({
          organizationId,
          action: "sms_stop_received",
          entityType: "sms_blacklist",
          metadata: {
            senderPhone: normalizedPhone,
            keyword: normalizedContent,
            orgName,
          },
        }).catch(() => {});

        console.log(`[TextMagic Webhook] STOP keyword "${normalizedContent}" received from ${normalizedPhone} — blacklisted for org ${organizationId}`);
        return res.json({ success: true, action: "blacklisted", keyword: normalizedContent });
      }

      // After-hours auto-response check
      let isAfterHours = false;
      try {
        const org = await storage.getOrganization(organizationId);
        if (org) {
          const settings = (org.settings || {}) as Record<string, any>;
          const tz = settings.timezone || "America/New_York";
          const startHour = parseInt(settings.businessHoursStart || "08", 10);
          const endHour = parseInt(settings.businessHoursEnd || "21", 10);

          // Get current hour in the org's timezone
          const nowStr = new Date().toLocaleString("en-US", { timeZone: tz, hour12: false });
          const currentHour = new Date(nowStr).getHours();

          if (currentHour < startHour || currentHour >= endHour) {
            isAfterHours = true;
            console.log(`[TextMagic Webhook] After-hours detected (${currentHour}:00 ${tz}, hours: ${startHour}-${endHour})`);

            // Build after-hours auto-response from configurable template
            const defaultAfterHoursMsg = "Thank you for reaching out to {orgName}. Our team is available from {businessHoursStart}:00 to {businessHoursEnd}:00. We'll follow up first thing in the morning.";
            const afterHoursTemplate = settings.afterHoursMessage || defaultAfterHoursMsg;
            const afterHoursMessage = afterHoursTemplate
              .replace(/\{orgName\}/g, org.name || "our team")
              .replace(/\{businessHoursStart\}/g, String(startHour).padStart(2, "0"))
              .replace(/\{businessHoursEnd\}/g, String(endHour).padStart(2, "0"));

            // Send auto-response
            try {
              const { processOutboundSend } = await import("../outbound");
              await processOutboundSend({
                organizationId,
                channel: "sms",
                to: normalizedPhone,
                messageContent: afterHoursMessage,
              });
              console.log(`[TextMagic Webhook] After-hours auto-response sent to ${normalizedPhone}`);
            } catch (autoErr: any) {
              console.error(`[TextMagic Webhook] After-hours auto-response failed:`, autoErr.message);
            }

            // Queue follow-up for next business hours opening
            try {
              const tomorrow7am = new Date();
              tomorrow7am.setDate(tomorrow7am.getDate() + (currentHour >= startHour ? 1 : 0));
              tomorrow7am.setHours(startHour, 0, 0, 0);

              await storage.createScheduledAction({
                organizationId,
                actionType: "queued_sms",
                payload: {
                  channel: "sms",
                  to: normalizedPhone,
                  conversationId: null, // conversation not yet resolved at this point; handler can look up by phone
                  originalMessage: normalizedContent,
                },
                executeAt: tomorrow7am,
              });
              console.log(`[TextMagic Webhook] Queued follow-up SMS for ${normalizedPhone} at ${tomorrow7am.toISOString()}`);
            } catch (queueErr: any) {
              console.error(`[TextMagic Webhook] Failed to queue follow-up:`, queueErr.message);
            }
          }
        }
      } catch (hoursErr: any) {
        console.error(`[TextMagic Webhook] After-hours check failed:`, hoursErr.message);
      }

      const lockKey = `sms:${normalizedPhone}:${organizationId}`;
      const { conversation, isNew } = await withConversationLock(lockKey, async () => {
        let conv = await storage.getConversationByPhone(normalizedPhone, "sms", organizationId);

        if (conv) {
          await storage.updateConversation(conv.id, {
            lastMessageAt: timestamp,
            unreadCount: (conv.unreadCount || 0) + 1,
          });
          return { conversation: conv, isNew: false };
        }

        let sourceConversationId: string | null = null;
        let linkedCampaignId: string | null = null;

        try {
          const outboundForLink = await storage.findLastOutboundForPhone(normalizedPhone, "sms");
          if (outboundForLink) {
            linkedCampaignId = outboundForLink.campaignId ?? null;
            if (linkedCampaignId) {
              const existingConvs = await storage.getConversations(organizationId, { channel: "sms" });
              const sourceConv = existingConvs.find(
                c => c.campaignId === linkedCampaignId && c.customerPhone === normalizedPhone
              );
              if (sourceConv) {
                sourceConversationId = sourceConv.id;
              }
            }
          }
        } catch (lookupErr) {
          console.warn("[TextMagic Webhook] Could not resolve outbound context:", lookupErr);
        }

        conv = await storage.createConversation({
          customerName: normalizedPhone,
          customerPhone: normalizedPhone,
          channel: "sms",
          status: "open",
          organizationId,
          unreadCount: 1,
          lastMessageAt: timestamp,
          campaignId: linkedCampaignId,
          sourceConversationId,
        });

        if (linkedCampaignId) {
          try {
            const campaign = await storage.getCampaign(linkedCampaignId);
            console.log(`[TextMagic Webhook] SMS reply labeled — campaign: "${campaign?.name || linkedCampaignId}", sourceConversationId: ${sourceConversationId || "none"}`);

            // Inject vehicle context from campaign recipient into conversation (I-192)
            const recipients = await storage.getRecipients(linkedCampaignId);
            const matchedRecipient = recipients.find(r =>
              r.phone && normalizedPhone.includes(r.phone.replace(/\D/g, ""))
            );
            if (matchedRecipient?.vehicleYear || matchedRecipient?.vehicleModel || matchedRecipient?.vin) {
              const vehicleInfo = [
                matchedRecipient.vehicleYear,
                matchedRecipient.vehicleModel,
              ].filter(Boolean).join(" ");
              const vinInfo = matchedRecipient.vin ? ` (VIN: ${matchedRecipient.vin})` : "";
              await storage.createMessage({
                conversationId: conv.id,
                role: "system",
                content: `Campaign context: This customer was contacted about their ${vehicleInfo}${vinInfo}. Campaign: "${campaign?.name || "Unknown"}"`,
                senderName: "System",
              });
              console.log(`[TextMagic Webhook] Vehicle context injected — ${vehicleInfo}${vinInfo}`);
            }
          } catch {}
        }

        return { conversation: conv, isNew: true };
      });

      if (isNew) {
        (async () => {
          try {
            const org = await storage.getOrganization(organizationId);
            if (!org || !org.outboundEnabled || !org.smsEnabled) return;
            if (process.env.OUTBOUND_LIVE_ENABLED !== "true") return;

            const orgAgents = await storage.getAgents(organizationId);
            const greetingAgent = orgAgents.find(a => a.autoGreeting && a.status === "active");
            if (!greetingAgent || !greetingAgent.autoGreeting) return;

            // Check if current time is within business hours (G-7.4)
            const orgSettings = (org.settings as Record<string, any>) || {};
            const timezone = orgSettings.timezone || "America/New_York";
            const bhStart = orgSettings.businessHoursStart || "08:00";
            const bhEnd = orgSettings.businessHoursEnd || "21:00";

            const nowInTz = new Date().toLocaleString("en-US", { timeZone: timezone });
            const localNow = new Date(nowInTz);
            const currentHour = localNow.getHours();
            const currentMinute = localNow.getMinutes();
            const currentTime = currentHour * 60 + currentMinute;

            const [startH, startM] = bhStart.split(":").map(Number);
            const [endH, endM] = bhEnd.split(":").map(Number);
            const startTime = startH * 60 + startM;
            const endTime = endH * 60 + endM;

            const isAfterHours = currentTime < startTime || currentTime >= endTime;

            // If after hours, tag conversation for morning followup
            if (isAfterHours) {
              try {
                const existingTags = (conversation as any).tags || [];
                const combined = [...existingTags, "after-hours", "morning-followup"];
                const afterHoursTags = combined.filter((tag: string, idx: number) => combined.indexOf(tag) === idx);
                await storage.updateConversation(conversation!.id, { tags: afterHoursTags } as any);
                console.log(`[AutoGreeting] After-hours SMS — tagged conversation ${conversation!.id} for morning followup`);
              } catch (tagErr: any) {
                console.error(`[AutoGreeting] Failed to tag conversation for morning followup:`, tagErr.message);
              }
            }

            // Use after-hours response template if configured, otherwise regular greeting
            const agentSettings = (greetingAgent.settings as Record<string, any>) || {};
            const afterHoursTemplate = agentSettings.afterHoursResponse as string | undefined;

            let messageToSend: string;
            let messageSource: string;

            if (isAfterHours && afterHoursTemplate) {
              messageToSend = afterHoursTemplate
                .replace(/\{\{customerName\}\}/g, looksLikePhoneNumber(normalizedPhone) ? "there" : normalizedPhone)
                .replace(/\{\{dealershipName\}\}/g, org.name || "our dealership")
                .replace(/\{\{agentName\}\}/g, greetingAgent.name || "your assistant");
              messageSource = "after_hours_response";
              console.log(`[AutoGreeting] Using after-hours template for ${normalizedPhone}`);
            } else {
              messageToSend = greetingAgent.autoGreeting
                .replace(/\{\{customerName\}\}/g, looksLikePhoneNumber(normalizedPhone) ? "there" : normalizedPhone)
                .replace(/\{\{dealershipName\}\}/g, org.name || "our dealership")
                .replace(/\{\{agentName\}\}/g, greetingAgent.name || "your assistant");
              messageSource = "auto_greeting";
            }

            const { processOutboundSend } = await import("../outbound");
            const greetResult = await processOutboundSend({
              organizationId,
              channel: "sms",
              to: normalizedPhone,
              messageContent: messageToSend,
            });
            if (greetResult.status !== "sent") {
              console.log(`[AutoGreeting] SMS blocked for ${normalizedPhone}: ${greetResult.blockedReason}`);
              return;
            }
            console.log(`[AutoGreeting] SMS sent to ${normalizedPhone} via agent ${greetingAgent.name} (${messageSource})`);

            await storage.createMessage({
              conversationId: conversation!.id,
              role: "agent",
              content: messageToSend,
              senderName: greetingAgent.name,
            });

            storage.logUsageEvent({
              organizationId,
              eventType: "outbound_sms",
              channel: "sms",
              quantity: 1,
              metadata: { recipient: normalizedPhone, source: messageSource, agentId: greetingAgent.id },
            }).catch(() => {});

            storage.createActivityLog({
              organizationId,
              action: isAfterHours ? "after_hours_response_sent" : "auto_greeting_sent",
              entityType: "conversation",
              entityId: conversation!.id,
              metadata: { agentName: greetingAgent.name, customerPhone: normalizedPhone, channel: "sms", isAfterHours },
            }).catch(() => {});
          } catch (greetErr: any) {
            console.error(`[AutoGreeting] SMS failed for inbound lead ${normalizedPhone}:`, greetErr.message);
          }
        })();
      }

      // Message-level dedup — skip if same content from same phone within 30s (BUG-AG-01)
      const recentMessages = await storage.getMessages(conversation.id);
      const thirtySecondsAgo = new Date(Date.now() - 30000);
      const isDuplicate = recentMessages.some(m =>
        m.role === "user" &&
        m.content === content &&
        m.senderName === normalizedPhone &&
        new Date(m.createdAt) > thirtySecondsAgo
      );
      if (isDuplicate) {
        console.log(`[TextMagic Webhook] Duplicate message detected from ${normalizedPhone} — skipping`);
        return res.json({ success: true, skipped: true, reason: "duplicate_message" });
      }

      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content,
        senderName: normalizedPhone,
      });

      // Tag conversation for follow-up if after hours
      if (isAfterHours && conversation) {
        try {
          const convTags = ((conversation as any).tags || []) as string[];
          if (!convTags.includes("Followup")) {
            await storage.updateConversation(conversation.id, {
              tags: [...convTags, "Followup"],
            } as any);
          }
        } catch (tagErr: any) {
          console.error(`[TextMagic Webhook] Failed to tag conversation for follow-up:`, tagErr.message);
        }
      }

      // AI agent processing for inbound SMS (fire-and-forget)
      // Skip if after-hours — the auto-response already handled it
      if (!isAfterHours && !isNew) (async () => {
        try {
          // Re-query conversation to get fresh assignedTo state
          const freshConversation = await storage.getConversation(conversation!.id);
          if (!freshConversation) {
            console.log(`[SMS AI] Conversation ${conversation!.id} no longer exists — skipping AI response`);
            return;
          }
          if (freshConversation.assignedTo) {
            console.log(`[SMS AI] AI paused — human takeover active (conversation ${freshConversation.id}, assignedTo: ${freshConversation.assignedTo})`);
            return;
          }

          const org = await storage.getOrganization(organizationId);
          if (!org || !org.outboundEnabled || !org.smsEnabled) return;
          if (process.env.OUTBOUND_LIVE_ENABLED !== "true") return;

          // Find an active AI agent with SMS channel
          const orgAgents = await storage.getAgents(organizationId);
          const smsAgent = orgAgents.find(
            a => a.status === "active" && a.type === "ai" &&
              (a.channels?.includes("sms") || a.channels?.includes("voice"))
          );
          if (!smsAgent) return;

          // Build message context from conversation history
          const history = await storage.getMessages(conversation.id);
          const recentMessages = history.slice(-10);

          const orgName = org.name || "our dealership";
          const agentName = smsAgent.name || "Assistant";
          const agentInstructions = smsAgent.instructions || "";

          const systemPrompt = `You are ${agentName}, an AI assistant for ${orgName} (automotive dealership). You are responding to an inbound SMS from a customer.

Keep your responses SHORT (1-3 sentences max) since this is an SMS conversation. Be conversational, helpful, and professional.
${agentInstructions ? `\nSpecific instructions:\n${agentInstructions}` : ""}

Do NOT mention that you are an AI unless directly asked. Do not use markdown formatting.`;

          const chatMessages = recentMessages.map(m => ({
            role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
            content: m.content,
          }));

          const Anthropic = (await import("@anthropic-ai/sdk")).default;
          const anthropic = new Anthropic({
            apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
            baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
          });

          const aiResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 256,
            system: systemPrompt,
            messages: chatMessages,
          });

          const textBlock = aiResponse.content.find(b => b.type === "text");
          if (!textBlock || textBlock.type !== "text" || !textBlock.text.trim()) return;

          const responseText = textBlock.text.trim();

          // Send the AI response via SMS
          const { processOutboundSend } = await import("../outbound");
          const sendResult = await processOutboundSend({
            organizationId,
            channel: "sms",
            to: normalizedPhone,
            messageContent: responseText,
          });

          if (sendResult.status === "sent") {
            // Store the AI response as a message in the conversation
            await storage.createMessage({
              conversationId: conversation.id,
              role: "agent",
              content: responseText,
              senderName: agentName,
            });
            await storage.updateConversation(conversation.id, { lastMessageAt: new Date() });
            console.log(`[SMS AI] Response sent to ${normalizedPhone} via agent ${agentName}`);
          } else {
            console.log(`[SMS AI] Response blocked for ${normalizedPhone}: ${sendResult.blockedReason}`);
          }
        } catch (aiErr: any) {
          console.error(`[SMS AI] Failed to process AI response for ${normalizedPhone}:`, aiErr.message);
        }
      })();

      const orgUsers = await storage.getUsers(organizationId);
      const adminUsers = orgUsers.filter(u => {
        const roleLevel = u.role?.level;
        return roleLevel !== undefined && roleLevel <= 3;
      });

      const isReply = !!(conversation.campaignId || conversation.sourceConversationId);
      const notificationTitle = isReply
        ? `SMS reply${conversation.campaignId ? " (campaign)" : ""}`
        : "New inbound SMS";

      for (const admin of adminUsers) {
        storage.createNotification({
          userId: admin.id,
          organizationId,
          type: "sms_inbound",
          title: notificationTitle,
          message: `SMS from ${normalizedPhone}: "${content.substring(0, 100)}"`,
          relatedEntityType: "conversation",
          relatedEntityId: conversation.id,
        }).catch(() => {});
      }

      storage.createActivityLog({
        organizationId,
        action: "sms_inbound_received",
        entityType: "conversation",
        entityId: conversation.id,
        metadata: {
          senderPhone: normalizedPhone,
          messagePreview: content.substring(0, 100),
          sourceConversationId: conversation.sourceConversationId || null,
          campaignId: conversation.campaignId || null,
          contextLabel: isReply ? "campaign_reply" : "new_contact",
        },
      }).catch(() => {});

      return res.json({ success: true, conversationId: conversation.id });
    } catch (err) {
      console.error("[TextMagic Webhook] Error processing inbound SMS:", err);
      return res.status(500).json({ message: "Failed to process inbound SMS" });
    }
  });

  app.get("/api/sms-blacklist", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const entries = await storage.getBlacklistByOrg(req.user.organizationId);
      return res.json(entries);
    } catch (err) {
      return res.status(500).json({ message: "Failed to fetch SMS blacklist" });
    }
  });

  app.delete("/api/sms-blacklist/:id", authenticateToken, requireRole(3), async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Not authenticated" });
      const entries = await storage.getBlacklistByOrg(req.user.organizationId);
      const entry = entries.find(e => e.id === req.params.id as string);
      if (!entry) {
        return res.status(404).json({ message: "Blacklist entry not found" });
      }
      await storage.removeBlacklistEntry(req.params.id as string);
      return res.json({ message: "Blacklist entry removed" });
    } catch (err) {
      return res.status(500).json({ message: "Failed to remove blacklist entry" });
    }
  });
}
