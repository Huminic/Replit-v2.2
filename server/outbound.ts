import { storage } from "./storage";
import { Resend } from "resend";
import { callMCP } from "./vendorProxy";
import { billingService } from "./services/billingService";
import type { Organization, Campaign, CampaignRecipient } from "@shared/schema";
import { evaluatePreLaunchSmsGuardWithDefaults } from "./lib/preLaunchSmsGuard";

const DEFAULT_RATE_LIMIT_MAX = 100;
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
  recipientName?: string;
  /** When true, skip the business-hours TCPA check in CommGate.
   *  Used by the after-hours trigger which is explicitly designed to send outside business hours. */
  bypassBusinessHours?: boolean;
  /** Test-lane session id. When set together with TESTLANE_MODE=true, the
   *  recipient is hard-routed to operator-controlled test addresses
   *  (TESTLANE_SMS_TO / TESTLANE_EMAIL_TO / TESTLANE_VOICE_TO). The session
   *  id is embedded in messageContent as [testlane:<sid>] for audit. Two-way
   *  fail-closed: TESTLANE_MODE without a marker is blocked, and a marker
   *  without TESTLANE_MODE is blocked. */
  testLaneSessionId?: string;
}

export interface SendResult {
  status: "sent" | "blocked" | "failed" | "dry_run";
  blockedReason?: string;
}

// ---------------------------------------------------------------------------
// Test-lane guard (pure helper, exported for unit tests)
// ---------------------------------------------------------------------------

/**
 * Inputs the test-lane guard reads from request/campaign/recipient.
 * Subset of the full SendRequest + minimal storage shapes — kept narrow so the
 * guard is unit-testable without mocking storage / DB.
 */
export interface OutboundTestLaneGuardInput {
  channel: "sms" | "email" | "phone";
  to: string;
  messageContent: string;
  recipientName?: string;
  testLaneSessionId?: string;
  campaignName?: string | null;
  recipientFirstName?: string | null;
}

/**
 * Pure result from the outbound test-lane guard.
 *
 * - `pass`: nothing to override; the caller proceeds with original recipient.
 * - `override`: hard-route the request to TESTLANE_*_TO; replace
 *   `messageContent` and `recipientName` with the patched values.
 * - `blocked`: caller MUST NOT send; log reason via existing logAttempt path.
 *
 * Two-way fail-closed:
 *   TESTLANE_MODE=true + no marker         -> blocked
 *   TESTLANE_MODE!=true + marker present   -> blocked (defensive)
 *   TESTLANE_MODE=true + marker + missing TESTLANE_*_TO for channel -> blocked
 *   TESTLANE_MODE=true + marker + env set  -> override
 *   else                                   -> pass
 */
export type OutboundTestLaneGuardResult =
  | { kind: "pass" }
  | {
      kind: "override";
      sid: string;
      to: string;
      messageContent: string;
      recipientName: string;
    }
  | { kind: "blocked"; reason: string };

/**
 * Pure evaluation of the outbound test-lane guard. Reads process.env at call
 * time (so tests can mutate process.env around the call); does no IO.
 */
export function evaluateOutboundTestLaneGuard(
  input: OutboundTestLaneGuardInput,
): OutboundTestLaneGuardResult {
  const testLaneEnv = process.env.TESTLANE_MODE === "true";
  const requestHasMarker =
    !!input.testLaneSessionId ||
    (input.messageContent || "").includes("[TESTLANE]") ||
    (input.messageContent || "").includes("[testlane:") ||
    (input.campaignName || "").startsWith("[TESTLANE]") ||
    (input.recipientFirstName || "").toLowerCase() === "testlane";

  if (testLaneEnv && !requestHasMarker) {
    return {
      kind: "blocked",
      reason:
        "TESTLANE_MODE=true but request lacks test-lane marker (no testLaneSessionId, no [TESTLANE]/[testlane:] in content/campaign/recipient)",
    };
  }
  if (!testLaneEnv && requestHasMarker) {
    return {
      kind: "blocked",
      reason:
        "Request has test-lane marker but TESTLANE_MODE is not 'true' (fail-closed)",
    };
  }
  if (!testLaneEnv && !requestHasMarker) {
    return { kind: "pass" };
  }
  // testLaneEnv && requestHasMarker -> override
  const sid = input.testLaneSessionId || "unknown";
  let envVar: string | undefined;
  let envName: string;
  if (input.channel === "sms") {
    envVar = process.env.TESTLANE_SMS_TO;
    envName = "TESTLANE_SMS_TO";
  } else if (input.channel === "email") {
    envVar = process.env.TESTLANE_EMAIL_TO;
    envName = "TESTLANE_EMAIL_TO";
  } else if (input.channel === "phone") {
    envVar = process.env.TESTLANE_VOICE_TO;
    envName = "TESTLANE_VOICE_TO";
  } else {
    return {
      kind: "blocked",
      reason: `TESTLANE_MODE on but unsupported channel "${input.channel as string}" (fail-closed)`,
    };
  }
  if (!envVar) {
    return {
      kind: "blocked",
      reason: `TESTLANE_MODE on but ${envName} unset (fail-closed)`,
    };
  }
  const sidTag = `[testlane:${sid}]`;
  const newMessageContent = input.messageContent.includes(sidTag)
    ? input.messageContent
    : `${sidTag} ${input.messageContent}`;
  const newRecipientName = `[TESTLANE] ${input.recipientName || "test"}`.trim();
  return {
    kind: "override",
    sid,
    to: envVar,
    messageContent: newMessageContent,
    recipientName: newRecipientName,
  };
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
    await sendSmsRaw(phone, `You have been unsubscribed from ${orgName} messages. Reply START to re-subscribe.`, undefined, organizationId);
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
        recipientPhone: phone,
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

export async function sendSmsRaw(
  to: string,
  content: string,
  fromNumber?: string,
  organizationId?: string,
): Promise<void> {
  const phone = to.replace(/[^0-9+]/g, "");
  const formattedPhone = phone.startsWith("+") ? phone : phone.startsWith("1") ? `+${phone}` : `+1${phone}`;

  // ── PRE-LAUNCH SMS GUARD ────────────────────────────────────────────────
  // Fail-closed allowlist check. Phase 1 investigation
  // (evidence/sms-guard-investigation-2026-04-27.md, commit fc59c1c)
  // identified sendSmsRaw as the only function that calls the SMS provider.
  // Anything higher (processOutboundSend / sendSms / sendStopConfirmation)
  // leaves at least one provider-reachable path uncovered — so the guard
  // sits here. bypassBusinessHours has no effect on this guard.
  const guardDecision = evaluatePreLaunchSmsGuardWithDefaults(to);
  if (!guardDecision.allow) {
    console.warn(
      `[PreLaunchSmsGuard] BLOCK to=${formattedPhone} mode=${guardDecision.mode} reason=${guardDecision.reason}`,
    );
    // Best-effort outbound_log row so the block is visible in audit trail.
    // Requires organizationId; when the caller didn't supply one, log a
    // warning but still throw — the throw is the load-bearing safety
    // signal regardless of audit-row completeness.
    if (organizationId) {
      try {
        await storage.createOutboundLog({
          organizationId,
          campaignId: null,
          recipientId: null,
          channel: "sms",
          status: "blocked",
          blockedReason: guardDecision.reason,
          messageContent: content,
          recipientPhone: formattedPhone,
          sentAt: null,
        });
      } catch (logErr: any) {
        console.error(
          `[PreLaunchSmsGuard] Failed to write blocked outbound_log row for ${formattedPhone}: ${logErr.message}`,
        );
      }
    } else {
      console.warn(
        `[PreLaunchSmsGuard] No organizationId available — block will not be recorded in outbound_log (caller: review sendSmsRaw call site)`,
      );
    }
    throw new Error(guardDecision.reason);
  }
  // ── END PRE-LAUNCH SMS GUARD ────────────────────────────────────────────

  const mcpParams: Record<string, string> = {
    text: content,
    phones: formattedPhone,
  };
  if (fromNumber) {
    mcpParams.from = fromNumber;
  }

  try {
    const result = await callMCP("tm_send_message", mcpParams);
    console.log(`[TextMagic/MCP] SMS sent to ${formattedPhone}${fromNumber ? ` from ${fromNumber}` : ""}, messageId: ${result.id}`);
  } catch (err: any) {
    console.error(`[Outbound] TextMagic MCP send failed for ${formattedPhone}: ${err.message}`);
    throw err;
  }
}

export async function sendSms(to: string, content: string, organizationId?: string, fromNumber?: string): Promise<void> {
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

  await sendSmsRaw(to, content, fromNumber, organizationId);
}

export async function sendEmail(to: string, content: string): Promise<void> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    console.warn(`[Resend] Email rejected — invalid email format: ${to}`);
    return;
  }

  try {
    const result = await callMCP("resend_send_email", {
      from: RESEND_FROM,
      to,
      subject: "Message from Nexxus Connect",
      html: content,
    });
    console.log(`[Resend/MCP] Email sent to ${to}`);
  } catch (err: any) {
    console.error(`[Outbound] Resend MCP send failed for ${to}: ${err.message}`);
    throw err;
  }
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

  try {
    const result = await callMCP("vapi_create_call", callArgs);
    console.log(`[VAPI/MCP] Outbound call initiated to ${to}, callId: ${result.id}`);
  } catch (err: any) {
    console.error(`[Outbound] VAPI MCP call failed for ${to}: ${err.message}`);
    throw err;
  }
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

/**
 * Check if the current time is within the org's configured business hours.
 * Uses the org's timezone setting (defaults to America/New_York).
 * Business hours default to 08:00–21:00 (TCPA safe window).
 */
function isWithinBusinessHours(org: Organization): { within: boolean; currentHour: number; start: number; end: number; tz: string } {
  const settings = (org.settings as Record<string, any>) || {};
  const tz = settings.timezone || "America/New_York";
  const start = parseInt(settings.businessHoursStart || "8", 10);
  const end = parseInt(settings.businessHoursEnd || "21", 10);

  // Get current hour in the org's timezone
  const nowStr = new Date().toLocaleString("en-US", { timeZone: tz, hour12: false });
  const currentHour = new Date(nowStr).getHours();

  return { within: currentHour >= start && currentHour < end, currentHour, start, end, tz };
}

async function checkCommGate(
  org: Organization,
  campaign: Campaign | undefined,
  recipient: CampaignRecipient | undefined,
  channel: "sms" | "email" | "phone" | "video",
  customerContact: string,
  bypassBusinessHours: boolean = false
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

  // TCPA compliance: block outbound SMS and phone outside business hours
  if (channel === "sms" || channel === "phone") {
    if (bypassBusinessHours) {
      // Skip business hours check — caller explicitly authorized after-hours send
      console.log(`[CommGate] Business hours check bypassed (trigger-authorized)`);
    } else {
      const bh = isWithinBusinessHours(org);
      if (!bh.within) {
        return {
          allowed: false,
          reason: `Outside business hours (${bh.currentHour}:00 ${bh.tz}, allowed ${bh.start}:00-${bh.end}:00)`,
        };
      }
    }
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

  // Blacklist check — block sends to contacts on the org's blacklist (all channels)
  if (customerContact) {
    const blacklisted = await storage.getBlacklistEntry(customerContact, org.id);
    if (blacklisted) {
      return {
        allowed: false,
        reason: `Recipient blacklisted (reason: ${blacklisted.reason || "opt-out"})`,
      };
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

  // ── TEST LANE GUARD ─────────────────────────────────────────────────────────
  // Two-way fail-closed: TESTLANE_MODE and per-request marker must agree.
  // If both are present, hard-route the recipient to operator-controlled test
  // addresses and tag messageContent with [testlane:<sid>].
  // If only one is present, BLOCK the send (do not rewrite, do not pass through).
  // Pure logic lives in evaluateOutboundTestLaneGuard() above; this branch
  // only handles IO (logAttempt) and request mutation.
  const _tlGuard = evaluateOutboundTestLaneGuard({
    channel: request.channel,
    to: request.to,
    messageContent: request.messageContent,
    recipientName: request.recipientName,
    testLaneSessionId: request.testLaneSessionId,
    campaignName: campaign?.name ?? null,
    recipientFirstName: recipient?.firstName ?? null,
  });
  if (_tlGuard.kind === "blocked") {
    await logAttempt(request, "blocked", _tlGuard.reason);
    return { status: "blocked", blockedReason: _tlGuard.reason };
  }
  if (_tlGuard.kind === "override") {
    request.to = _tlGuard.to;
    request.messageContent = _tlGuard.messageContent;
    request.recipientName = _tlGuard.recipientName;
    console.log(`[TestLane] processOutboundSend hard-routed channel=${request.channel} to=${request.to} sid=${_tlGuard.sid}`);
  }
  // ── END TEST LANE GUARD ─────────────────────────────────────────────────────

  const gateResult = await checkCommGate(org, campaign, recipient, request.channel, request.to, request.bypassBusinessHours || false);

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
      case "sms": {
        let fromNumber: string | undefined;
        try {
          const integrations = await storage.getIntegrations(request.organizationId, { provider: "vinsolutions" });
          if (integrations.length > 0 && integrations[0].smsCampaignNumber) {
            fromNumber = integrations[0].smsCampaignNumber;
          }
        } catch {}
        await sendSms(request.to, request.messageContent, request.organizationId, fromNumber);
        break;
      }
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
      recipientName: request.recipientName || null,
      recipientPhone: request.channel === "email" ? null : request.to,
      recipientEmail: request.channel === "email" ? request.to : null,
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
    .replace(/\{\{dealershipName\}\}/g, dealershipName || "our dealership")
    .replace(/\{\{vehicleYear\}\}/g, recipient.vehicleYear || "")
    .replace(/\{\{vehicleModel\}\}/g, recipient.vehicleModel || "")
    .replace(/\{\{vin\}\}/g, recipient.vin || "");
}

export async function startCampaignExecution(
  campaignId: string,
  organizationId: string,
  dryRun: boolean = false
): Promise<{ success: boolean; message: string; execution?: Omit<CampaignExecution, "intervalHandle"> }> {
  try {
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
      recipientName: customerName !== "valued customer" ? customerName : undefined,
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

        // Create a conversation record so the thread appears in TeamBox
        // and inbound replies can attach to it by phone number
        if (contactChannel === "sms" && to) {
          try {
            const conv = await storage.createConversation({
              customerName: customerName !== "valued customer" ? customerName : to,
              customerPhone: to,
              channel: "sms",
              status: "open",
              organizationId,
              unreadCount: 0,
              lastMessageAt: new Date(),
              campaignId,
            });

            await storage.createMessage({
              conversationId: conv.id,
              role: "agent",
              content: messageContent,
              senderName: dealershipName,
            });

            console.log(`[Campaign ${campaignId}] Conversation created for ${to} (convId: ${conv.id})`);
          } catch (convErr: any) {
            console.warn(`[Campaign] WARNING: SMS sent to ${to} but conversation creation failed — replies may not route. Error: ${convErr.message}`);
            // Create escalation task so admin knows about the orphaned send
            try {
              await storage.createTask({
                type: "orphaned_send",
                title: `Orphaned SMS — conversation creation failed for ${to}`,
                description: `Campaign ${campaignId}: SMS was sent to ${to} but conversation creation failed. Inbound replies from this number may not route correctly. Error: ${convErr.message}`,
                status: "todo",
                priority: "high",
                organizationId,
                tags: ["orphaned-send", "campaign", "auto-generated"],
                metadata: JSON.stringify({
                  trigger_id: `orphan-${Date.now()}`,
                  campaign_id: campaignId,
                  recipient_phone: to,
                  error: convErr.message,
                  timestamp: new Date().toISOString(),
                }),
              });
            } catch (taskErr: any) {
              console.error(`[Campaign ${campaignId}] Failed to create escalation task for orphaned send to ${to}:`, taskErr.message);
            }
          }
        }
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
  } catch (err: any) {
    console.error(`[Campaign ${campaignId}] startCampaignExecution error:`, err?.message || err);
    activeExecutions.delete(campaignId);
    return { success: false, message: err?.message || "Campaign execution failed unexpectedly" };
  }
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
