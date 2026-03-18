import { storage } from "./storage";
import { Resend } from "resend";
import { callMCP } from "./vendorProxy";
import { billingService } from "./services/billingService";
import type { Organization, Campaign, CampaignRecipient } from "@shared/schema";

const DEFAULT_RATE_LIMIT_MAX = 3;
const RATE_LIMIT_HOURS = 24;

let _resendInstance: Resend | null = null;
function getResendClient(): Resend {
  if (!_resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    _resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return _resendInstance;
}

const RESEND_FROM = "Nexxus Connect <notifications@huminic.ai>";

export interface SendRequest {
  organizationId: string;
  campaignId?: string;
  recipientId?: string;
  channel: "sms" | "email" | "phone";
  to: string;
  messageContent: string;
  dryRun?: boolean;
  callContext?: OutboundCallContext;
}

export interface SendResult {
  status: "sent" | "blocked" | "failed" | "dry_run";
  blockedReason?: string;
}

const stopConfirmationCache = new Map<string, number>();

export async function sendStopConfirmation(phone: string, orgName: string, organizationId: string): Promise<void> {
  const cacheKey = `${phone}:${organizationId}`;
  const lastSent = stopConfirmationCache.get(cacheKey);
  const oneHourMs = 60 * 60 * 1000;

  if (lastSent && Date.now() - lastSent < oneHourMs) {
    console.log(`[STOP] Rate-limited: STOP confirmation already sent to ${phone} within the last hour`);
    return;
  }

  if (process.env.OUTBOUND_LIVE_ENABLED !== "true") {
    console.log(`[STOP] Global outbound disabled — skipping STOP confirmation to ${phone}`);
    return;
  }

  try {
    await sendSmsRaw(phone, `You have been unsubscribed from ${orgName} messages. Reply START to re-subscribe.`);
    stopConfirmationCache.set(cacheKey, Date.now());
    console.log(`[STOP] Confirmation sent to ${phone} for org ${organizationId}`);

    try {
      await storage.createOutboundLog({
        organizationId,
        campaignId: null,
        recipientId: null,
        channel: "sms",
        status: "sent",
        blockedReason: null,
        messageContent: `STOP confirmation to ${phone}`,
        sentAt: new Date(),
      });
    } catch (logErr) {
      console.error("[STOP] Failed to log STOP confirmation:", logErr);
    }
  } catch (err: any) {
    console.error(`[STOP] Failed to send STOP confirmation to ${phone}:`, err.message);
    throw err;
  }
}

export async function sendSmsRaw(to: string, content: string): Promise<void> {
  const phone = to.replace(/[^0-9+]/g, "");
  const formattedPhone = phone.startsWith("+") ? phone : phone.startsWith("1") ? `+${phone}` : `+1${phone}`;

  const result = await callMCP("tm_send_message", {
    text: content,
    phones: formattedPhone,
  });
  console.log(`[TextMagic/MCP] SMS sent to ${formattedPhone}, messageId: ${result.id}`);
}

export async function sendSms(to: string, content: string, organizationId?: string): Promise<void> {
  if (organizationId) {
    const blacklisted = await storage.getBlacklistEntry(to, organizationId);
    if (blacklisted) {
      console.log(`[TextMagic] SMS to ${to} blocked — phone is blacklisted for org ${organizationId} (reason: ${blacklisted.reason})`);
      return;
    }
  }

  const digitsOnly = to.replace(/[^0-9]/g, "");
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    console.warn(`[TextMagic] SMS rejected — invalid phone number length (${digitsOnly.length} digits): ${to}`);
    return;
  }
  if (/^0{10,}$/.test(digitsOnly) || /^1{10,}$/.test(digitsOnly)) {
    console.warn(`[TextMagic] SMS rejected — obviously invalid phone number: ${to}`);
    return;
  }

  const phone = to.replace(/[^0-9+]/g, "");
  const formattedPhone = phone.startsWith("+") ? phone : phone.startsWith("1") ? `+${phone}` : `+1${phone}`;

  const result = await callMCP("tm_send_message", {
    text: content,
    phones: formattedPhone,
  });
  console.log(`[TextMagic/MCP] SMS sent to ${to}, messageId: ${result.id}`);
}

export async function sendEmail(to: string, content: string): Promise<void> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    console.warn(`[Resend] Email rejected — invalid email format: ${to}`);
    return;
  }

  const result = await callMCP("resend_send_email", {
    from: RESEND_FROM,
    to,
    subject: "Message from Nexxus Connect",
    html: content,
  });
  console.log(`[Resend/MCP] Email sent to ${to}`);
}

export interface OutboundCallContext {
  customerName?: string;
  campaignName?: string;
  dealershipName?: string;
  goal?: string;
}

export async function sendPhone(to: string, content: string, organizationId?: string, callContext?: OutboundCallContext): Promise<void> {
  let assistantId: string | undefined;
  let phoneNumberId: string | undefined;

  if (organizationId) {
    const agents = await storage.getAgents(organizationId, {});
    const voiceAgent = agents.find(
      (a) => a.vapiAssistantId && a.channels?.includes("voice") && a.status === "active"
    );
    if (voiceAgent?.vapiAssistantId) {
      assistantId = voiceAgent.vapiAssistantId;
    }

    // Look up org's VAPI phone number ID from settings
    const org = await storage.getOrganization(organizationId);
    const settings = (org?.settings || {}) as Record<string, any>;
    if (settings.vapiPhoneNumberId) {
      phoneNumberId = settings.vapiPhoneNumberId;
    }
  }

  if (!assistantId) {
    throw new Error("No VAPI assistant configured for this organization — cannot initiate outbound call");
  }

  const customerNumber = to.replace(/[^0-9+]/g, "");
  const formattedNumber = customerNumber.startsWith("+") ? customerNumber : `+${customerNumber}`;

  const callArgs: Record<string, unknown> = {
    assistantId,
    customerNumber: formattedNumber,
  };

  if (phoneNumberId) {
    callArgs.phoneNumberId = phoneNumberId;
  }

  // Apply context overrides for outbound campaign calls
  if (callContext) {
    const customerName = callContext.customerName || "customer";
    if (content) {
      callArgs.firstMessageOverride = content.replace(/\{\{customerName\}\}/g, customerName);
    }
    if (callContext.dealershipName || callContext.campaignName) {
      const dealershipName = callContext.dealershipName || "our dealership";
      const campaignName = callContext.campaignName || "follow-up";
      const goal = callContext.goal || "connect with the customer";
      callArgs.assistantOverrides = {
        firstMessage: callArgs.firstMessageOverride || content || undefined,
        model: {
          messages: [{
            role: "system",
            content: `You are making an OUTBOUND call on behalf of ${dealershipName}. Campaign: ${campaignName}. Goal: ${goal}. The customer's name is ${customerName}.`,
          }],
        },
      };
    }
  } else if (content) {
    callArgs.firstMessageOverride = content;
  }

  const result = await callMCP("vapi_create_call", callArgs);
  console.log(`[VAPI/MCP] Outbound call initiated to ${to}, callId: ${result.id}`);
}

function isGlobalOutboundEnabled(): boolean {
  return process.env.OUTBOUND_LIVE_ENABLED === "true";
}

function getOrgRateLimit(org: Organization): number {
  const settings = org.settings as Record<string, any> | null;
  if (settings?.rateLimitMax && typeof settings.rateLimitMax === "number" && settings.rateLimitMax > 0) {
    return settings.rateLimitMax;
  }
  return DEFAULT_RATE_LIMIT_MAX;
}

async function checkCommGate(
  org: Organization,
  campaign: Campaign | undefined,
  recipient: CampaignRecipient | undefined,
  channel: "sms" | "email" | "phone" | "video",
  customerContact: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!isGlobalOutboundEnabled()) {
    return { allowed: false, reason: "Global outbound kill switch is OFF (OUTBOUND_LIVE_ENABLED != true)" };
  }

  if (!org.outboundEnabled) {
    return { allowed: false, reason: "Organization outbound communications disabled" };
  }

  if (channel === "sms" && !org.smsEnabled) {
    return { allowed: false, reason: "SMS channel disabled for organization" };
  }
  if (channel === "phone" && !org.phoneEnabled) {
    return { allowed: false, reason: "Phone channel disabled for organization" };
  }
  if (channel === "email" && !org.emailEnabled) {
    return { allowed: false, reason: "Email channel disabled for organization" };
  }
  if (channel === "video" && !org.videoEnabled) {
    return { allowed: false, reason: "Video channel disabled for organization" };
  }

  if (campaign?.killSwitch) {
    return { allowed: false, reason: "Campaign kill switch is active" };
  }

  if (recipient) {
    const conversation = await getConversationForRecipient(org.id, recipient, campaign?.id);
    if (conversation?.campaignDisconnected) {
      return { allowed: false, reason: "Recipient disconnected from campaign" };
    }
  }

  const rateLimitMax = getOrgRateLimit(org);
  const recentCount = await storage.getRecentOutboundCount(
    org.id,
    customerContact,
    RATE_LIMIT_HOURS
  );
  if (recentCount >= rateLimitMax) {
    return { allowed: false, reason: `Rate limit exceeded: ${recentCount}/${rateLimitMax} messages in ${RATE_LIMIT_HOURS}h` };
  }

  return { allowed: true };
}

async function getConversationForRecipient(
  organizationId: string,
  recipient: CampaignRecipient,
  campaignId?: string
) {
  if (!campaignId) return undefined;
  const conversations = await storage.getConversations(organizationId, {});
  return conversations.find(
    c => c.campaignId === campaignId
  );
}

export async function processOutboundSend(request: SendRequest): Promise<SendResult> {
  const org = await storage.getOrganization(request.organizationId);
  if (!org) {
    await logAttempt(request, "failed", "Organization not found");
    return { status: "failed", blockedReason: "Organization not found" };
  }

  const campaign = request.campaignId
    ? await storage.getCampaign(request.campaignId)
    : undefined;

  const recipient = request.recipientId
    ? await storage.getRecipient(request.recipientId)
    : undefined;

  const gateResult = await checkCommGate(org, campaign, recipient, request.channel, request.to);

  if (!gateResult.allowed) {
    await logAttempt(request, "blocked", gateResult.reason);
    try {
      await storage.createTask({
        type: "unsent_message",
        title: `Unsent ${request.channel.toUpperCase()} — blocked`,
        description: `Outbound ${request.channel} to ${request.to} was blocked. Reason: ${gateResult.reason}`,
        status: "todo",
        priority: gateResult.reason?.includes("Rate limit") ? "high" : "medium",
        organizationId: request.organizationId,
        tags: ["unsent", request.channel, "auto-generated"],
        metadata: JSON.stringify({
          trigger_id: `out-${Date.now()}`,
          org_id: request.organizationId,
          customer_id: request.to,
          channel: request.channel,
          status: "blocked",
          blocked_reason: gateResult.reason,
          timestamp: new Date().toISOString(),
          campaign_id: request.campaignId || null,
        }),
      });
    } catch (escErr) {
      console.error("[Outbound] Failed to create unsent message escalation:", escErr);
    }
    try {
      await storage.logUsageEvent({
        organizationId: request.organizationId,
        eventType: `outbound_${request.channel}_blocked`,
        channel: request.channel,
        quantity: 0,
        metadata: { recipient: request.to, reason: gateResult.reason, status: "blocked" },
      });
    } catch (usageErr) {
      console.error("[Outbound] Failed to log blocked usage event:", usageErr);
    }
    return { status: "blocked", blockedReason: gateResult.reason };
  }

  if (request.dryRun) {
    console.log(`[DRY RUN] Would send ${request.channel} to ${request.to}: "${request.messageContent.substring(0, 80)}..."`);
    await logAttempt(request, "dry_run");
    return { status: "dry_run" };
  }

  try {
    switch (request.channel) {
      case "sms":
        await sendSms(request.to, request.messageContent, request.organizationId);
        break;
      case "email":
        await sendEmail(request.to, request.messageContent);
        break;
      case "phone":
        await sendPhone(request.to, request.messageContent, request.organizationId, request.callContext);
        break;
    }

    await logAttempt(request, "sent");
    try {
      await storage.logUsageEvent({
        organizationId: request.organizationId,
        eventType: `outbound_${request.channel}`,
        channel: request.channel,
        quantity: 1,
        metadata: { recipient: request.to, campaignId: request.campaignId || null },
      });
    } catch (usageErr) {
      console.error("[Outbound] Failed to log usage event:", usageErr);
    }
    if (request.channel === "sms") {
      try { billingService.emitUsageEvent(request.organizationId, 'sms_sent', { direction: 'outbound' }); } catch(e) {}
    }
    return { status: "sent" };
  } catch (err: any) {
    const reason = err.message || "Send failed";
    await logAttempt(request, "failed", reason);
    try {
      await storage.logUsageEvent({
        organizationId: request.organizationId,
        eventType: `outbound_${request.channel}_failed`,
        channel: request.channel,
        quantity: 0,
        metadata: { recipient: request.to, reason, status: "failed" },
      });
    } catch (usageErr) {
      console.error("[Outbound] Failed to log failed usage event:", usageErr);
    }
    return { status: "failed", blockedReason: reason };
  }
}

async function logAttempt(
  request: SendRequest,
  status: string,
  blockedReason?: string
): Promise<void> {
  try {
    await storage.createOutboundLog({
      organizationId: request.organizationId,
      campaignId: request.campaignId || null,
      recipientId: request.recipientId || null,
      channel: request.channel,
      status,
      blockedReason: blockedReason || null,
      messageContent: request.messageContent,
      sentAt: status === "sent" ? new Date() : null,
    });
  } catch (logErr) {
    console.error("Failed to log outbound attempt:", logErr);
  }
}

export interface CampaignExecution {
  campaignId: string;
  organizationId: string;
  status: "executing" | "completed" | "stopped";
  totalRecipients: number;
  processed: number;
  sent: number;
  blocked: number;
  failed: number;
  dryRun: boolean;
  intervalHandle: ReturnType<typeof setInterval> | null;
  startedAt: Date;
  completedAt: Date | null;
}

const activeExecutions = new Map<string, CampaignExecution>();

export function getExecutionStatus(campaignId: string): CampaignExecution | undefined {
  return activeExecutions.get(campaignId);
}

export function getAllExecutionStatuses(): Record<string, Omit<CampaignExecution, "intervalHandle">> {
  const result: Record<string, Omit<CampaignExecution, "intervalHandle">> = {};
  activeExecutions.forEach((exec, id) => {
    const { intervalHandle, ...rest } = exec;
    result[id] = rest;
  });
  return result;
}

function substituteTemplate(template: string, recipient: CampaignRecipient, dealershipName: string): string {
  const customerName = [recipient.firstName, recipient.lastName].filter(Boolean).join(" ") || "valued customer";
  return template
    .replace(/\{\{customerName\}\}/g, customerName)
    .replace(/\{\{firstName\}\}/g, recipient.firstName || "valued customer")
    .replace(/\{\{lastName\}\}/g, recipient.lastName || "")
    .replace(/\{\{dealershipName\}\}/g, dealershipName || "our dealership");
}

export async function startCampaignExecution(
  campaignId: string,
  organizationId: string,
  dryRun: boolean = false
): Promise<{ success: boolean; message: string; execution?: Omit<CampaignExecution, "intervalHandle"> }> {
  if (activeExecutions.has(campaignId)) {
    const existing = activeExecutions.get(campaignId)!;
    if (existing.status === "executing") {
      return { success: false, message: "Campaign is already executing" };
    }
  }

  const campaign = await storage.getCampaign(campaignId);
  if (!campaign) {
    return { success: false, message: "Campaign not found" };
  }

  if (campaign.organizationId !== organizationId) {
    return { success: false, message: "Access denied" };
  }

  if ((campaign as any).executionStatus === "executing") {
    return { success: false, message: "Campaign is already executing (DB status)" };
  }

  const org = await storage.getOrganization(organizationId);
  if (!org) {
    return { success: false, message: "Organization not found" };
  }

  const pendingRecipients = await storage.getPendingRecipients(campaignId);
  if (pendingRecipients.length === 0) {
    return { success: false, message: "No pending recipients to process" };
  }

  const execution: CampaignExecution = {
    campaignId,
    organizationId,
    status: "executing",
    totalRecipients: pendingRecipients.length,
    processed: 0,
    sent: 0,
    blocked: 0,
    failed: 0,
    dryRun,
    intervalHandle: null,
    startedAt: new Date(),
    completedAt: null,
  };

  activeExecutions.set(campaignId, execution);

  if (!dryRun) {
    await storage.updateCampaign(campaignId, {
      status: "active",
      executionStatus: "executing",
      executionTotal: pendingRecipients.length,
      executionProcessed: 0,
      executionSent: 0,
      executionFailed: 0,
      executionStartedAt: new Date(),
    } as any);
  }

  const recipientQueue = [...pendingRecipients];
  let currentIndex = 0;
  const intervalMs = (campaign.sendIntervalSeconds || 60) * 1000;
  const template = campaign.messageTemplate || "Hello {{customerName}}, this is a message from {{dealershipName}}.";
  const dealershipName = org.name;

  const processNext = async () => {
    try {
    const latestCampaign = await storage.getCampaign(campaignId);
    if (latestCampaign?.killSwitch) {
      await finishExecution(campaignId, "stopped");
      return;
    }

    const exec = activeExecutions.get(campaignId);
    if (!exec || exec.status !== "executing") {
      return;
    }

    if (currentIndex >= recipientQueue.length) {
      await finishExecution(campaignId, "completed");
      return;
    }

    const recipient = recipientQueue[currentIndex];
    currentIndex++;

    const contactChannel = campaign.channel as "sms" | "email" | "phone";
    const to = contactChannel === "email" ? recipient.email : recipient.phone;

    if (!to) {
      exec.processed++;
      exec.failed++;
      await storage.updateRecipient(recipient.id, { status: "failed" } as any);
      return;
    }

    const messageContent = substituteTemplate(template, recipient, dealershipName);

    const customerName = [recipient.firstName, recipient.lastName].filter(Boolean).join(" ") || "valued customer";
    const result = await processOutboundSend({
      organizationId,
      campaignId,
      recipientId: recipient.id,
      channel: contactChannel,
      to,
      messageContent,
      dryRun,
      callContext: contactChannel === "phone" ? {
        customerName,
        campaignName: campaign.name,
        dealershipName,
        goal: (campaign as any).goal || "connect with the customer",
      } : undefined,
    });

    exec.processed++;
    if (result.status === "sent" || result.status === "dry_run") {
      exec.sent++;
      if (!dryRun) {
        await storage.updateRecipient(recipient.id, { status: "sent", sentAt: new Date() } as any);
        await storage.updateCampaign(campaignId, {
          sentCount: (latestCampaign?.sentCount || 0) + 1,
          executionProcessed: exec.processed,
          executionSent: exec.sent,
          executionFailed: exec.failed,
        } as any);
      }
    } else if (result.status === "blocked") {
      exec.blocked++;
      if (!dryRun) {
        await storage.updateRecipient(recipient.id, { status: "blocked" } as any);
        await storage.updateCampaign(campaignId, {
          executionProcessed: exec.processed,
          executionFailed: exec.failed,
        } as any);
      }
    } else {
      exec.failed++;
      if (!dryRun) {
        await storage.updateRecipient(recipient.id, { status: "failed" } as any);
        await storage.updateCampaign(campaignId, {
          executionProcessed: exec.processed,
          executionFailed: exec.failed,
        } as any);
      }
    }

    if (currentIndex >= recipientQueue.length) {
      await finishExecution(campaignId, "completed");
    }
    } catch (processErr: any) {
      console.error(`[Campaign ${campaignId}] processNext error:`, processErr.message);
      const exec = activeExecutions.get(campaignId);
      if (exec) {
        exec.processed++;
        exec.failed++;
      }
    }
  };

  await processNext();

  if (execution.status === "executing" && recipientQueue.length > 1) {
    execution.intervalHandle = setInterval(processNext, intervalMs);
  }

  const { intervalHandle, ...publicExec } = execution;
  return { success: true, message: dryRun ? "Dry run started" : "Campaign execution started", execution: publicExec };
}

async function finishExecution(campaignId: string, finalStatus: "completed" | "stopped"): Promise<void> {
  const exec = activeExecutions.get(campaignId);
  if (!exec) return;

  if (exec.intervalHandle) {
    clearInterval(exec.intervalHandle);
    exec.intervalHandle = null;
  }

  exec.status = finalStatus;
  exec.completedAt = new Date();

  if (!exec.dryRun) {
    const newStatus = finalStatus === "completed" ? "completed" : "paused";
    await storage.updateCampaign(campaignId, {
      status: newStatus,
      executionStatus: finalStatus,
      executionProcessed: exec.processed,
      executionSent: exec.sent,
      executionFailed: exec.failed,
    } as any);
  }
}

export async function stopCampaignExecution(campaignId: string): Promise<{ success: boolean; message: string }> {
  const exec = activeExecutions.get(campaignId);
  if (!exec) {
    return { success: false, message: "No active execution found for this campaign" };
  }

  if (exec.status !== "executing") {
    return { success: false, message: `Campaign execution is already ${exec.status}` };
  }

  await finishExecution(campaignId, "stopped");
  return { success: true, message: "Campaign execution stopped" };
}
