import { storage } from "./storage";
import { Resend } from "resend";
import { vapiPost } from "./vendorProxy";
import type { Organization, Campaign, CampaignRecipient } from "@shared/schema";

const DEFAULT_RATE_LIMIT_MAX = 3;
const RATE_LIMIT_HOURS = 24;

const resend = new Resend(process.env.RESEND_API_KEY);

const TEXTMAGIC_API_KEY_RAW = process.env.TEXTMAGIC_API_KEY || "";
const TEXTMAGIC_API_KEY = TEXTMAGIC_API_KEY_RAW.length === 60 ? TEXTMAGIC_API_KEY_RAW.substring(0, 30) : TEXTMAGIC_API_KEY_RAW;
const TEXTMAGIC_USERNAME = process.env.TEXTMAGIC_USERNAME || "";
const TEXTMAGIC_BASE_URL = "https://rest.textmagic.com/api/v2";
const RESEND_FROM = "Nexxus Connect <notifications@huminic.ai>";

export interface SendRequest {
  organizationId: string;
  campaignId?: string;
  recipientId?: string;
  channel: "sms" | "email" | "phone";
  to: string;
  messageContent: string;
  dryRun?: boolean;
}

export interface SendResult {
  status: "sent" | "blocked" | "failed";
  blockedReason?: string;
}

export async function sendSmsRaw(to: string, content: string): Promise<void> {
  if (!TEXTMAGIC_API_KEY) {
    throw new Error("TEXTMAGIC_API_KEY is not configured");
  }
  if (!TEXTMAGIC_USERNAME) {
    throw new Error("TEXTMAGIC_USERNAME is not configured");
  }

  const phone = to.replace(/[^0-9+]/g, "");
  const formattedPhone = phone.startsWith("+") ? phone : phone.startsWith("1") ? `+${phone}` : `+1${phone}`;

  const response = await fetch(`${TEXTMAGIC_BASE_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TM-Username": TEXTMAGIC_USERNAME,
      "X-TM-Key": TEXTMAGIC_API_KEY,
    },
    body: JSON.stringify({
      text: content,
      phones: formattedPhone,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[TextMagic] SMS send failed (${response.status}):`, errorBody);
    throw new Error(`TextMagic SMS failed: ${response.status} — ${errorBody}`);
  }

  const result = await response.json();
  console.log(`[TextMagic] SMS sent to ${formattedPhone}, messageId: ${result.id}`);
}

export async function sendSms(to: string, content: string, organizationId?: string): Promise<void> {
  if (organizationId) {
    const blacklisted = await storage.getBlacklistEntry(to, organizationId);
    if (blacklisted) {
      console.log(`[TextMagic] SMS to ${to} blocked — phone is blacklisted for org ${organizationId} (reason: ${blacklisted.reason})`);
      return;
    }
  }

  if (!TEXTMAGIC_API_KEY) {
    throw new Error("TEXTMAGIC_API_KEY is not configured");
  }
  if (!TEXTMAGIC_USERNAME) {
    throw new Error("TEXTMAGIC_USERNAME is not configured");
  }

  const phone = to.replace(/[^0-9+]/g, "");
  const formattedPhone = phone.startsWith("+") ? phone : phone.startsWith("1") ? `+${phone}` : `+1${phone}`;

  const response = await fetch(`${TEXTMAGIC_BASE_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-TM-Username": TEXTMAGIC_USERNAME,
      "X-TM-Key": TEXTMAGIC_API_KEY,
    },
    body: JSON.stringify({
      text: content,
      phones: formattedPhone,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`[TextMagic] SMS send failed (${response.status}):`, errorBody);
    throw new Error(`TextMagic SMS failed: ${response.status} — ${errorBody}`);
  }

  const result = await response.json();
  console.log(`[TextMagic] SMS sent to ${to}, messageId: ${result.id}`);
}

export async function sendEmail(to: string, content: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const subjectMatch = content.match(/^Subject:\s*(.+?)[\r\n]/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : "Message from Nexxus Connect";
  const body = subjectMatch ? content.replace(/^Subject:\s*.+?[\r\n]+/i, "").trim() : content;

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to: [to],
    subject,
    html: body.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>"),
  });

  if (error) {
    console.error(`[Resend] Email send failed:`, error);
    throw new Error(`Resend email failed: ${error.message}`);
  }

  console.log(`[Resend] Email sent to ${to}, id: ${data?.id}`);
}

export async function sendPhone(to: string, content: string, organizationId?: string): Promise<void> {
  if (!process.env.VAPI_PRIVATE_KEY) {
    throw new Error("VAPI_PRIVATE_KEY is not configured — cannot initiate outbound call");
  }

  let assistantId: string | undefined;

  if (organizationId) {
    const agents = await storage.getAgents(organizationId, {});
    const voiceAgent = agents.find(
      (a) => a.vapiAssistantId && a.channels?.includes("voice") && a.status === "active"
    );
    if (voiceAgent?.vapiAssistantId) {
      assistantId = voiceAgent.vapiAssistantId;
    }
  }

  if (!assistantId) {
    throw new Error("No VAPI assistant configured for this organization — cannot initiate outbound call");
  }

  const callPayload = {
    assistantId,
    customer: {
      number: to.replace(/[^0-9+]/g, ""),
    },
  };

  const result = await vapiPost("/call", callPayload);
  console.log(`[VAPI] Outbound call initiated to ${to}, callId: ${result.id}`);
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
        await sendPhone(request.to, request.messageContent, request.organizationId);
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
  const customerName = [recipient.firstName, recipient.lastName].filter(Boolean).join(" ") || "Customer";
  return template
    .replace(/\{\{customerName\}\}/g, customerName)
    .replace(/\{\{firstName\}\}/g, recipient.firstName || "")
    .replace(/\{\{lastName\}\}/g, recipient.lastName || "")
    .replace(/\{\{dealershipName\}\}/g, dealershipName);
}

export async function startCampaignExecution(
  campaignId: string,
  organizationId: string,
  dryRun: boolean = false
): Promise<{ success: boolean; message: string; execution?: Omit<CampaignExecution, "intervalHandle"> }> {
  if (activeExecutions.has(campaignId)) {
    return { success: false, message: "Campaign is already executing" };
  }

  const campaign = await storage.getCampaign(campaignId);
  if (!campaign) {
    return { success: false, message: "Campaign not found" };
  }

  if (campaign.organizationId !== organizationId) {
    return { success: false, message: "Access denied" };
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

    const result = await processOutboundSend({
      organizationId,
      campaignId,
      recipientId: recipient.id,
      channel: contactChannel,
      to,
      messageContent,
      dryRun,
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

  setTimeout(() => {
    activeExecutions.delete(campaignId);
  }, 60000);
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
