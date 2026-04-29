/**
 * Outbound Trigger Scheduler Service
 *
 * Evaluates trigger conditions on a 15-minute interval and fires outbound
 * SMS actions for leads that match specific criteria. Two hardcoded triggers:
 *
 *   1. After-Hours Sales Lead Follow-Up — detects new EXTERNAL leads
 *      that arrived outside business hours. Defers sending until business
 *      hours (TCPA compliance). The check-in trigger picks them up.
 *
 *   2. 24-Hour Lead Check-In — sends SMS to ALL leads ~24 hours (configurable)
 *      after creation if no outbound trigger has already been sent for them.
 *
 * Per-org enable/disable via org.settings.triggersEnabled,
 * org.settings.afterHoursTriggerEnabled, org.settings.checkInTriggerEnabled.
 * All default to false (opt-in).
 */

import { storage } from "../storage";
import { processOutboundSend } from "../outbound";
import type { Organization, WarehouseLead } from "@shared/schema";
import { sendAIFollowUpNotification, sendCheckInDeliveredNotification } from "./notificationService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TriggerRunSummary {
  orgsEvaluated: number;
  afterHoursTriggered: number;
  checkInTriggered: number;
  immediateTriggered: number;
  errors: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRIGGER_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const AFTER_HOURS_WINDOW_MINUTES = 30; // look back 30 min for recently-synced leads
const AFTER_HOURS_MAX_AGE_HOURS = 4; // ignore leads older than 4h (avoids re-sync false positives)
const DEFAULT_CHECKIN_DELAY_MINUTES = 1440; // 24 hours
const CONVERSATION_RECENCY_HOURS = 2; // skip leads with a conversation in the last 2h
const IMMEDIATE_WINDOW_MINUTES = 30; // sweep direct-VIN leads synced in the last 30 min
const IMMEDIATE_MAX_AGE_HOURS = 4; // ignore leads older than 4h
const IMMEDIATE_MORNING_HOUR = 7; // queue after-hours immediate sends to next-day 7 AM local

const TRIGGER_TYPE_AFTER_HOURS = "after_hours_followup";
const TRIGGER_TYPE_CHECKIN = "24h_checkin";
const TRIGGER_TYPE_IMMEDIATE = "immediate_new_lead";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return business-hours state for a given org using its timezone + settings.
 * Mirrors the pattern in outbound.ts isWithinBusinessHours().
 */
function getBusinessHoursInfo(org: Organization): { within: boolean; currentHour: number; start: number; end: number; tz: string } {
  const settings = (org.settings as Record<string, any>) || {};
  const tz = settings.timezone || "America/New_York";
  const start = parseInt(settings.businessHoursStart || "8", 10);
  const end = parseInt(settings.businessHoursEnd || "21", 10);

  // Use Intl.DateTimeFormat with hour12=false to avoid the "24:xx" midnight artifact some
  // Node versions emit via toLocaleString, which produced NaN when re-parsed.
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).formatToParts(new Date());
  const hourPart = parts.find(p => p.type === "hour");
  let currentHour = hourPart ? parseInt(hourPart.value, 10) : NaN;
  if (Number.isNaN(currentHour) || currentHour === 24) currentHour = 0;

  return { within: currentHour >= start && currentHour < end, currentHour, start, end, tz };
}

/**
 * Check whether a trigger action (sent or deferred) already exists for a given
 * phone + trigger type within a time window. Uses activity_log metadata
 * instead of outbound_log message content (I-273: tags removed from customer messages).
 */
async function hasRecentTriggerSend(
  organizationId: string,
  phone: string,
  triggerType: string,
  windowHours: number
): Promise<boolean> {
  const logs = await storage.getActivityLogs(organizationId, 200);
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  const triggerActions = [
    "trigger_after_hours_sent",
    "trigger_after_hours_deferred",
    "trigger_checkin_sent",
    "trigger_immediate_sent",
    "trigger_immediate_queued",
  ];

  for (const entry of logs) {
    if (new Date(entry.createdAt) < cutoff) continue;
    if (!triggerActions.includes(entry.action)) continue;

    const meta = entry.metadata as Record<string, any> | null;
    if (!meta) continue;
    if (meta.triggerType !== triggerType) continue;

    // Match on phone (normalize digits for comparison)
    const entryPhone = ((meta.phone as string) || "").replace(/[^0-9]/g, "");
    const targetPhone = phone.replace(/[^0-9]/g, "");
    if (!entryPhone || !targetPhone) continue;
    if (entryPhone.endsWith(targetPhone) || targetPhone.endsWith(entryPhone)) {
      return true;
    }
  }
  return false;
}

/**
 * Extract the first name from a full name string. Returns "there" as fallback.
 */
function firstName(fullName: string | null | undefined): string {
  if (!fullName) return "there";
  const first = fullName.trim().split(/\s+/)[0];
  return first || "there";
}

/**
 * Find the org's active SMS-capable agent. Used to link conversations.
 */
async function findSmsAgent(organizationId: string) {
  const agents = await storage.getAgents(organizationId, {});
  return agents.find(
    a => a.status === "active" && a.channels?.includes("sms")
  ) || agents.find(a => a.status === "active") || null;
}

/**
 * Check whether a conversation already exists for a phone number in a given
 * org within the last N hours. Used to skip leads we already engaged via
 * VAPI, widget, or SMS campaigns.
 */
async function hasRecentConversation(
  organizationId: string,
  phone: string,
  windowHours: number
): Promise<boolean> {
  const conv = await storage.getConversationByPhone(phone, undefined, organizationId);
  if (!conv) return false;
  // Check if conversation had activity within the window
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  const convTime = conv.lastMessageAt || conv.createdAt;
  return new Date(convTime).getTime() >= cutoff.getTime();
}

/**
 * Determine whether a lead originated from Nexxus's own system (VAPI, widget,
 * SMS campaigns) vs. an external channel (AutoTrader, Cars.com, etc.).
 *
 * Nexxus-originated leads are pushed BY us into VIN Solutions using the org's
 * configured vinLeadSourceName (defaults to "Dealers WebSite"). External leads
 * have any OTHER lead source value.
 */
function isNexxusOriginatedLead(lead: WarehouseLead, org: Organization): boolean {
  const settings = (org.settings as Record<string, any>) || {};
  const vinLeadSourceName = (settings.vinLeadSourceName || "").toLowerCase().trim();

  if (!lead.leadSource || !vinLeadSourceName) return false;

  const leadSource = lead.leadSource.toLowerCase().trim();

  // Match against the org's configured Nexxus lead source name
  if (leadSource === vinLeadSourceName) return true;

  // Also match common Nexxus lead source name variants
  const nexxusSourceVariants = [
    "dealers website",
    "dealer website",
    "dealer .com (our website)",
  ];
  // Only match these variants if the org's vinLeadSourceName is one of them
  // (prevents false positives if org uses a different name entirely)
  if (nexxusSourceVariants.includes(vinLeadSourceName)) {
    if (nexxusSourceVariants.includes(leadSource)) return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Trigger 1: After-Hours Sales Lead Follow-Up (EXTERNAL leads only)
// ---------------------------------------------------------------------------

async function evaluateAfterHoursTrigger(org: Organization): Promise<number> {
  const settings = (org.settings as Record<string, any>) || {};

  // Per-org enable check
  if (!settings.afterHoursTriggerEnabled) {
    console.log("[TriggerService] Org " + org.name + ": afterHoursTriggerEnabled is false, skipping after-hours trigger");
    return 0;
  }

  // Must be OUTSIDE business hours right now
  const bh = getBusinessHoursInfo(org);
  if (bh.within) {
    console.log("[TriggerService] Org " + org.name + ": within business hours (" + bh.currentHour + ":00 " + bh.tz + "), skipping after-hours trigger");
    return 0;
  }

  console.log("[TriggerService] Org " + org.name + ": outside business hours (" + bh.currentHour + ":00 " + bh.tz + ", window " + bh.start + "-" + bh.end + "), evaluating after-hours trigger");

  // Get leads synced in the last 30 minutes.
  // Use activityAfter (maps to COALESCE(vinUpdatedAt, syncedAt)) to catch recently-synced leads,
  // then filter by vinCreatedAt to ensure the lead is actually new (not a re-synced old lead).
  const syncWindow = new Date(Date.now() - AFTER_HOURS_WINDOW_MINUTES * 60 * 1000);
  const maxAgeWindow = new Date(Date.now() - AFTER_HOURS_MAX_AGE_HOURS * 60 * 60 * 1000);

  const recentLeads = await storage.getWarehouseLeads(org.id, {
    activityAfter: syncWindow,
    limit: 50,
  });

  // Filter: lead must have been created within the last 4 hours (vinCreatedAt or syncedAt)
  // to avoid triggering on old leads that were merely re-synced.
  const freshLeads = recentLeads.filter(lead => {
    const createdTime = lead.vinCreatedAt || lead.syncedAt || lead.createdAt;
    if (!createdTime) return false;
    return new Date(createdTime).getTime() >= maxAgeWindow.getTime();
  });

  if (freshLeads.length === 0) {
    console.log("[TriggerService] Org " + org.name + ": no fresh leads in last " + AFTER_HOURS_WINDOW_MINUTES + " minutes (max age " + AFTER_HOURS_MAX_AGE_HOURS + "h)");
    return 0;
  }

  // Skip Nexxus-originated leads — we already engaged them via VAPI/widget/SMS.
  // Only fire the after-hours instant follow-up for EXTERNAL channel leads
  // (AutoTrader, Cars.com, Walk-in, Phone Up, Facebook, etc.).
  const externalLeads = freshLeads.filter(lead => {
    if (isNexxusOriginatedLead(lead, org)) {
      console.log("[TriggerService] Skipping lead " + lead.id + " (" + (lead.customerName || "unknown") + ") — Nexxus-originated (leadSource: " + lead.leadSource + ")");
      return false;
    }
    return true;
  });

  if (externalLeads.length === 0) {
    console.log("[TriggerService] Org " + org.name + ": " + freshLeads.length + " fresh lead(s) found but all are Nexxus-originated, skipping");
    return 0;
  }

  console.log("[TriggerService] Org " + org.name + ": " + externalLeads.length + " external lead(s) of " + freshLeads.length + " fresh, evaluating after-hours trigger");

  let triggered = 0;

  for (const lead of externalLeads) {
    try {
      // Must have a phone number
      if (!lead.customerPhone) {
        console.log("[TriggerService] Skipping lead " + lead.id + " — no phone number");
        continue;
      }

      // Test whitelist: if triggerTestPhones is set, only process those numbers (I-274)
      const testPhones = settings.triggerTestPhones as string[] | undefined;
      if (testPhones && testPhones.length > 0) {
        if (!testPhones.includes(lead.customerPhone)) {
          console.log(`[TriggerService] Skipping ${lead.customerPhone} — not in test whitelist`);
          continue;
        }
      }

      // Skip leads where a conversation already exists for that phone in the same org
      // within the last 2 hours — we already engaged them via VAPI/widget/SMS
      const recentConv = await hasRecentConversation(org.id, lead.customerPhone, CONVERSATION_RECENCY_HOURS);
      if (recentConv) {
        console.log("[TriggerService] Skipping lead " + lead.id + " (" + lead.customerPhone + ") — conversation exists within last " + CONVERSATION_RECENCY_HOURS + "h (already engaged)");
        continue;
      }

      // Deduplication: check if we already sent an after-hours trigger for this phone recently (last 4 hours)
      const alreadySent = await hasRecentTriggerSend(org.id, lead.customerPhone, TRIGGER_TYPE_AFTER_HOURS, 4);
      if (alreadySent) {
        console.log("[TriggerService] Skipping lead " + lead.id + " (" + lead.customerPhone + ") — after-hours trigger already sent recently");
        continue;
      }

      // Defer send — outside business hours, do NOT send now (TCPA compliance).
      // The check-in trigger will pick this lead up during business hours.
      console.log(`[TriggerService] After-hours trigger: deferring send to ${lead.customerPhone} — outside business hours. Will be picked up by check-in trigger during business hours.`);

      // Log the detection so we have an audit trail
      storage.createActivityLog({
        organizationId: org.id,
        action: "trigger_after_hours_deferred",
        entityType: "warehouse_lead",
        entityId: lead.id,
        metadata: {
          triggerType: TRIGGER_TYPE_AFTER_HOURS,
          phone: lead.customerPhone,
          customerName: lead.customerName,
          leadSource: lead.leadSource,
          reason: "outside_business_hours",
        },
      }).catch(() => {});

      triggered++;
    } catch (leadErr: any) {
      console.error("[TriggerService] Error processing after-hours trigger for lead " + lead.id + ":", leadErr.message);
    }
  }

  return triggered;
}

// ---------------------------------------------------------------------------
// Trigger 2: 24-Hour Lead Check-In (ALL leads, configurable delay)
// ---------------------------------------------------------------------------

async function evaluateCheckInTrigger(org: Organization): Promise<number> {
  const settings = (org.settings as Record<string, any>) || {};

  // Per-org enable check
  if (!settings.checkInTriggerEnabled) {
    console.log("[TriggerService] Org " + org.name + ": checkInTriggerEnabled is false, skipping check-in trigger");
    return 0;
  }

  // Check-in should only send during business hours (TCPA compliance)
  const bh = getBusinessHoursInfo(org);
  if (!bh.within) {
    console.log("[TriggerService] Org " + org.name + ": outside business hours (" + bh.currentHour + ":00 " + bh.tz + "), deferring check-in");
    return 0;
  }

  // Configurable check-in delay: org.settings.checkInDelayMinutes (default 1440 = 24h)
  const delayMinutes = typeof settings.checkInDelayMinutes === "number"
    ? settings.checkInDelayMinutes
    : DEFAULT_CHECKIN_DELAY_MINUTES;

  // Window sizing:
  // - For short delays (<=60 min): use flexible window of 0.5x to 1.5x delay
  //   (e.g., 10 min delay → look for leads 5-15 min old)
  // - For long delays (>60 min): fixed 30-minute window centered on target
  //   (e.g., 1440 min delay → look for leads 1410-1470 min old)
  let windowMinMinutes: number;
  let windowMaxMinutes: number;
  if (delayMinutes <= 60) {
    windowMinMinutes = Math.floor(delayMinutes * 0.5);
    windowMaxMinutes = Math.ceil(delayMinutes * 1.5);
  } else {
    windowMinMinutes = delayMinutes - 30;
    windowMaxMinutes = delayMinutes + 30;
  }

  console.log("[TriggerService] Org " + org.name + ": evaluating check-in trigger (delay: " + delayMinutes + " min, window: " + windowMinMinutes + "-" + windowMaxMinutes + " min)");

  // maxAgo = the more recent boundary (shorter time ago)
  // minAgo = the older boundary (longer time ago)
  const maxAgo = new Date(Date.now() - windowMinMinutes * 60 * 1000);
  const minAgo = new Date(Date.now() - windowMaxMinutes * 60 * 1000);

  // Get all warehouse leads for the org synced after minAgo, then filter by syncedAt window.
  // We use syncedAt (not vinCreatedAt) so leads from the most recent delta sync are caught
  // on the SAME trigger eval pass, avoiding the race where the trigger fires before sync completes.
  const candidateLeads = await storage.getWarehouseLeads(org.id, {
    syncedAfter: minAgo,
    limit: 100,
  });

  // Filter to leads whose syncedAt is within the check-in window.
  // Using syncedAt ensures newly-synced leads are evaluated immediately rather than
  // waiting for the next cycle (by which time vinCreatedAt may be outside the window).
  // Deduplication still uses vinCreatedAt via hasRecentTriggerSend().
  const leadsInWindow = candidateLeads.filter(lead => {
    const syncTime = lead.syncedAt;
    if (!syncTime) return false;
    const ts = new Date(syncTime).getTime();
    return ts >= minAgo.getTime() && ts <= maxAgo.getTime();
  });

  if (leadsInWindow.length === 0) {
    console.log("[TriggerService] Org " + org.name + ": no leads in check-in window (" + windowMinMinutes + "-" + windowMaxMinutes + " min ago)");
    return 0;
  }

  console.log("[TriggerService] Org " + org.name + ": " + leadsInWindow.length + " lead(s) in check-in window");

  const smsAgent = await findSmsAgent(org.id);
  let triggered = 0;

  for (const lead of leadsInWindow) {
    try {
      if (!lead.customerPhone) {
        console.log("[TriggerService] Skipping lead " + lead.id + " — no phone number");
        continue;
      }

      // Test whitelist: if triggerTestPhones is set, only send to those numbers (I-274)
      const testPhones = settings.triggerTestPhones as string[] | undefined;
      if (testPhones && testPhones.length > 0) {
        if (!testPhones.includes(lead.customerPhone)) {
          console.log(`[TriggerService] Skipping ${lead.customerPhone} — not in test whitelist`);
          continue;
        }
      }

      // Deduplication: check if check-in already sent for this phone (48h window to be safe)
      const alreadySent = await hasRecentTriggerSend(org.id, lead.customerPhone, TRIGGER_TYPE_CHECKIN, 48);
      if (alreadySent) {
        console.log("[TriggerService] Skipping lead " + lead.id + " (" + lead.customerPhone + ") — check-in already sent");
        continue;
      }

      // Build message — clean text, no internal tags (I-273)
      const custFirstName = firstName(lead.customerName);
      const vehicleInfo = lead.vehicleOfInterest && lead.vehicleOfInterest !== "No data"
        ? " regarding your " + lead.vehicleOfInterest
        : "";
      const message = "Hi " + custFirstName + ", this is " + org.name + ". We wanted to check in — are you being taken care of? Is there anything we can help with" + vehicleInfo + "?";

      console.log("[TriggerService] Sending check-in SMS to " + lead.customerPhone + " for lead " + (lead.customerName || lead.id));

      const result = await processOutboundSend({
        organizationId: org.id,
        channel: "sms",
        to: lead.customerPhone,
        messageContent: message,
        recipientName: lead.customerName || undefined,
      });

      if (result.status === "sent") {
        triggered++;
        console.log("[TriggerService] Check-in SMS sent to " + lead.customerPhone + " (status: sent)");

        // Create conversation so inbound replies route correctly
        await createTriggerConversation(org, lead, smsAgent, message);

        // Notify org admins (non-blocking)
        sendCheckInDeliveredNotification({
          orgId: org.id,
          customerName: lead.customerName || lead.customerPhone!,
          customerPhone: lead.customerPhone!,
          triggerType: "24h_checkin",
          messageSent: message,
          vehicleOfInterest: lead.vehicleOfInterest,
        }).catch(err => console.error("[TriggerService] Check-in notification failed:", err.message));

        // Log activity with triggerType in metadata for dedup (I-273)
        storage.createActivityLog({
          organizationId: org.id,
          action: "trigger_checkin_sent",
          entityType: "warehouse_lead",
          entityId: lead.id,
          metadata: {
            triggerType: TRIGGER_TYPE_CHECKIN,
            phone: lead.customerPhone,
            customerName: lead.customerName,
            vehicleOfInterest: lead.vehicleOfInterest,
          },
        }).catch(() => {});
      } else {
        console.log("[TriggerService] Check-in SMS to " + lead.customerPhone + " was " + result.status + ": " + (result.blockedReason || "no reason"));
      }
    } catch (leadErr: any) {
      console.error("[TriggerService] Error processing check-in trigger for lead " + lead.id + ":", leadErr.message);
    }
  }

  return triggered;
}

// ---------------------------------------------------------------------------
// Trigger 3: Immediate VIN-Lead Follow-Up (default OFF; per-org enabled)
// ---------------------------------------------------------------------------

/**
 * Compute the next 7 AM moment in the org's local timezone, expressed as a UTC Date.
 * If we are currently before 7 AM local, that's today; otherwise tomorrow.
 */
function nextLocalMorningSendAt(tz: string, hour: number = IMMEDIATE_MORNING_HOUR): Date {
  // Resolve current local hour without engine-specific toLocaleString quirks.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value || "0", 10);
  const localY = get("year");
  const localM = get("month");
  const localD = get("day");
  const localH = get("hour") === 24 ? 0 : get("hour");

  // Build a UTC Date that represents <localY>-<localM>-<localD> hour:00 in tz.
  // Approach: compute the offset between UTC and tz at "now," then compose.
  const nowMs = Date.now();
  const tzOffsetMin = (() => {
    // localTimeAsUtc - actualUtcNow → offset from UTC to tz in minutes (signed)
    const composed = Date.UTC(localY, localM - 1, localD, localH, get("minute"), get("second"));
    return Math.round((composed - nowMs) / 60000);
  })();

  let targetDay = localD;
  if (localH >= hour) targetDay = localD + 1; // already past the morning hour today → tomorrow
  const targetUtcMs = Date.UTC(localY, localM - 1, targetDay, hour, 0, 0) - tzOffsetMin * 60000;
  return new Date(targetUtcMs);
}

async function evaluateImmediateNewLeadTrigger(org: Organization): Promise<number> {
  const settings = (org.settings as Record<string, any>) || {};

  // Per-org enable check — default OFF. Operator must explicitly opt in per-org.
  if (!settings.immediateTriggerEnabled) {
    console.log("[TriggerService] Org " + org.name + ": immediateTriggerEnabled is false, skipping immediate trigger");
    return 0;
  }

  const bh = getBusinessHoursInfo(org);
  console.log("[TriggerService] Org " + org.name + ": evaluating immediate trigger (currentHour=" + bh.currentHour + " window " + bh.start + "-" + bh.end + " " + bh.tz + ")");

  // Pull recently-synced leads (same window pattern as after-hours).
  const syncWindow = new Date(Date.now() - IMMEDIATE_WINDOW_MINUTES * 60 * 1000);
  const maxAgeWindow = new Date(Date.now() - IMMEDIATE_MAX_AGE_HOURS * 60 * 60 * 1000);

  const recentLeads = await storage.getWarehouseLeads(org.id, {
    activityAfter: syncWindow,
    limit: 50,
  });

  // Filter: direct VIN data source AND recently created (not just re-synced).
  const eligibleLeads = recentLeads.filter(lead => {
    if (lead.dataSource && lead.dataSource !== "vin_solutions") return false;
    const createdTime = lead.vinCreatedAt || lead.syncedAt || lead.createdAt;
    if (!createdTime) return false;
    return new Date(createdTime).getTime() >= maxAgeWindow.getTime();
  });

  if (eligibleLeads.length === 0) {
    console.log("[TriggerService] Org " + org.name + ": no eligible direct-VIN leads in last " + IMMEDIATE_WINDOW_MINUTES + " minutes for immediate trigger");
    return 0;
  }

  console.log("[TriggerService] Org " + org.name + ": " + eligibleLeads.length + " eligible direct-VIN lead(s), evaluating immediate trigger");

  const smsAgent = await findSmsAgent(org.id);
  let triggered = 0;

  for (const lead of eligibleLeads) {
    try {
      if (!lead.customerPhone) {
        console.log("[TriggerService] Skipping immediate-trigger lead " + lead.id + " — no phone number");
        continue;
      }

      // Test whitelist (mirrors check-in/after-hours behavior)
      const testPhones = settings.triggerTestPhones as string[] | undefined;
      if (testPhones && testPhones.length > 0 && !testPhones.includes(lead.customerPhone)) {
        console.log("[TriggerService] Skipping " + lead.customerPhone + " — not in test whitelist (immediate trigger)");
        continue;
      }

      // Skip if a conversation already exists in the last 2h (already engaged)
      const recentConv = await hasRecentConversation(org.id, lead.customerPhone, CONVERSATION_RECENCY_HOURS);
      if (recentConv) {
        console.log("[TriggerService] Skipping immediate-trigger lead " + lead.id + " (" + lead.customerPhone + ") — recent conversation exists");
        continue;
      }

      // Dedup: don't fire immediate trigger twice for the same phone in 24h
      const alreadySent = await hasRecentTriggerSend(org.id, lead.customerPhone, TRIGGER_TYPE_IMMEDIATE, 24);
      if (alreadySent) {
        console.log("[TriggerService] Skipping immediate-trigger lead " + lead.id + " (" + lead.customerPhone + ") — already triggered in last 24h");
        continue;
      }

      const custFirstName = firstName(lead.customerName);
      const vehicleInfo = lead.vehicleOfInterest && lead.vehicleOfInterest !== "No data"
        ? " regarding your " + lead.vehicleOfInterest
        : "";
      const message = "Hi " + custFirstName + ", this is " + org.name + ". Thanks for your interest" + vehicleInfo + ". Is there a day or time that works for you to swing by? Happy to help line that up.";

      if (bh.within) {
        // Inside business hours — send immediately
        console.log("[TriggerService] Immediate trigger: sending now to " + lead.customerPhone);
        const result = await processOutboundSend({
          organizationId: org.id,
          channel: "sms",
          to: lead.customerPhone,
          messageContent: message,
          recipientName: lead.customerName || undefined,
        });
        if (result.status === "sent") {
          triggered++;
          // Activity log is awaited so the next 15-minute cron pass sees the dedup row.
          await storage.createActivityLog({
            organizationId: org.id,
            action: "trigger_immediate_sent",
            entityType: "warehouse_lead",
            entityId: lead.id,
            metadata: {
              triggerType: TRIGGER_TYPE_IMMEDIATE,
              phone: lead.customerPhone,
              customerName: lead.customerName,
              leadSource: lead.leadSource,
            },
          });
          await createTriggerConversation(org, lead, smsAgent, message);
          console.log("[TriggerService] Immediate trigger SENT to " + lead.customerPhone);
        } else {
          console.log("[TriggerService] Immediate trigger to " + lead.customerPhone + " was " + result.status + ": " + (result.blockedReason || "no reason"));
        }
      } else {
        // Outside business hours — queue for next 7 AM local TZ. The check-in
        // trigger does NOT cover direct-VIN immediate leads with the same urgency,
        // so we explicitly schedule a send rather than rely on the check-in window.
        const executeAt = nextLocalMorningSendAt(bh.tz, IMMEDIATE_MORNING_HOUR);
        await storage.createScheduledAction({
          organizationId: org.id,
          actionType: "queued_immediate_trigger_sms",
          payload: {
            channel: "sms",
            to: lead.customerPhone,
            leadId: lead.id,
            customerName: lead.customerName,
            messageContent: message,
            recipientName: lead.customerName,
          },
          executeAt,
        });
        // Activity log is awaited BEFORE incrementing the counter so the next
        // 15-minute cron pass sees the dedup row and won't re-enqueue.
        await storage.createActivityLog({
          organizationId: org.id,
          action: "trigger_immediate_queued",
          entityType: "warehouse_lead",
          entityId: lead.id,
          metadata: {
            triggerType: TRIGGER_TYPE_IMMEDIATE,
            phone: lead.customerPhone,
            customerName: lead.customerName,
            leadSource: lead.leadSource,
            executeAt: executeAt.toISOString(),
            reason: "after_hours_deferred_to_morning",
          },
        });
        triggered++;
        console.log("[TriggerService] Immediate trigger DEFERRED to " + lead.customerPhone + " — queued for " + executeAt.toISOString());
      }
    } catch (leadErr: any) {
      console.error("[TriggerService] Error processing immediate trigger for lead " + lead.id + ":", leadErr.message);
    }
  }

  return triggered;
}

// ---------------------------------------------------------------------------
// Conversation creation helper
// ---------------------------------------------------------------------------

/**
 * Create (or reuse) a conversation record for a trigger-originated SMS so that
 * when the customer replies, the inbound webhook can attach the reply to a
 * conversation and an agent can pick it up.
 */
async function createTriggerConversation(
  org: Organization,
  lead: WarehouseLead,
  smsAgent: { id: string; name: string } | null,
  messageContent: string
): Promise<void> {
  try {
    // Check if an open conversation already exists for this phone + org
    const existing = await storage.getConversationByPhone(lead.customerPhone!, "sms", org.id);
    if (existing) {
      // Conversation exists — just add the outbound message to it
      await storage.createMessage({
        conversationId: existing.id,
        role: "agent",
        content: messageContent,
        senderName: smsAgent?.name || org.name,
      });
      await storage.updateConversation(existing.id, { lastMessageAt: new Date() });
      console.log("[TriggerService] Added trigger message to existing conversation " + existing.id);
      return;
    }

    // Create new conversation
    const conv = await storage.createConversation({
      customerName: lead.customerName || lead.customerPhone!,
      customerPhone: lead.customerPhone!,
      channel: "sms",
      status: "open",
      organizationId: org.id,
      agentId: smsAgent?.id || null,
      unreadCount: 0,
      lastMessageAt: new Date(),
    });

    // Store the outbound message in the conversation
    await storage.createMessage({
      conversationId: conv.id,
      role: "agent",
      content: messageContent,
      senderName: smsAgent?.name || org.name,
    });

    console.log("[TriggerService] Created conversation " + conv.id + " for " + lead.customerPhone + " (agent: " + (smsAgent?.name || "none") + ")");
  } catch (convErr: any) {
    console.error("[TriggerService] Failed to create/update conversation for " + lead.customerPhone + ":", convErr.message);
  }
}

// ---------------------------------------------------------------------------
// Main scheduler run
// ---------------------------------------------------------------------------

/**
 * Single evaluation pass across all organizations. Called by the interval.
 */
export async function runTriggerEvaluation(): Promise<TriggerRunSummary> {
  const summary: TriggerRunSummary = {
    orgsEvaluated: 0,
    afterHoursTriggered: 0,
    checkInTriggered: 0,
    immediateTriggered: 0,
    errors: 0,
  };

  console.log("[TriggerService] Starting trigger evaluation pass...");

  let orgs: Organization[];
  try {
    orgs = await storage.getOrganizations();
  } catch (err: any) {
    console.error("[TriggerService] Failed to fetch organizations:", err.message);
    summary.errors++;
    return summary;
  }

  for (const org of orgs) {
    try {
      const settings = (org.settings as Record<string, any>) || {};

      // Master per-org toggle
      if (!settings.triggersEnabled) {
        console.log("[TriggerService] Org " + org.name + ": triggersEnabled is false, skipping");
        continue;
      }

      // Org must have outbound + SMS enabled
      if (!org.outboundEnabled) {
        console.log("[TriggerService] Org " + org.name + ": outboundEnabled is false, skipping");
        continue;
      }
      if (!org.smsEnabled) {
        console.log("[TriggerService] Org " + org.name + ": smsEnabled is false, skipping");
        continue;
      }

      summary.orgsEvaluated++;
      console.log("[TriggerService] Evaluating triggers for org: " + org.name + " (" + org.id + ")");

      // Trigger 1: After-Hours Follow-Up (external leads only)
      try {
        const afterHoursCount = await evaluateAfterHoursTrigger(org);
        summary.afterHoursTriggered += afterHoursCount;
      } catch (err: any) {
        console.error("[TriggerService] After-hours trigger failed for org " + org.name + ":", err.message);
        summary.errors++;
      }

      // Trigger 2: Check-In (all leads, configurable delay)
      try {
        const checkInCount = await evaluateCheckInTrigger(org);
        summary.checkInTriggered += checkInCount;
      } catch (err: any) {
        console.error("[TriggerService] Check-in trigger failed for org " + org.name + ":", err.message);
        summary.errors++;
      }

      // Trigger 3: Immediate VIN-Lead Follow-Up (default OFF; per-org enabled)
      try {
        const immediateCount = await evaluateImmediateNewLeadTrigger(org);
        summary.immediateTriggered += immediateCount;
      } catch (err: any) {
        console.error("[TriggerService] Immediate trigger failed for org " + org.name + ":", err.message);
        summary.errors++;
      }
    } catch (orgErr: any) {
      console.error("[TriggerService] Error evaluating org " + org.name + ":", orgErr.message);
      summary.errors++;
    }
  }

  console.log(
    "[TriggerService] Evaluation complete — " +
    "orgs: " + summary.orgsEvaluated + ", " +
    "after-hours: " + summary.afterHoursTriggered + ", " +
    "check-ins: " + summary.checkInTriggered + ", " +
    "immediate: " + summary.immediateTriggered + ", " +
    "errors: " + summary.errors
  );

  return summary;
}

// ---------------------------------------------------------------------------
// Scheduler lifecycle
// ---------------------------------------------------------------------------

let triggerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the trigger scheduler. Runs every 15 minutes.
 * Export this function — caller wires it into server/index.ts.
 */
export function startTriggerScheduler(): void {
  if (triggerInterval) {
    console.log("[TriggerService] Trigger scheduler already running, skipping duplicate start");
    return;
  }

  console.log("[TriggerService] Starting trigger scheduler (interval: " + (TRIGGER_INTERVAL_MS / 1000) + "s)");

  // Run once immediately (after a small delay to let the server finish starting)
  setTimeout(() => {
    runTriggerEvaluation().catch(err => {
      console.error("[TriggerService] Initial evaluation failed:", err.message || err);
    });
  }, 10_000);

  // Then run on interval
  triggerInterval = setInterval(() => {
    runTriggerEvaluation().catch(err => {
      console.error("[TriggerService] Scheduled evaluation failed:", err.message || err);
    });
  }, TRIGGER_INTERVAL_MS);
}

/**
 * Stop the trigger scheduler.
 */
export function stopTriggerScheduler(): void {
  if (triggerInterval) {
    clearInterval(triggerInterval);
    triggerInterval = null;
    console.log("[TriggerService] Trigger scheduler stopped");
  }
}
