import { storage } from "../storage";
import { startCampaignExecution, processOutboundSend } from "../outbound";
import { generateHunchesForOrg } from "./hunchService";
import { sendWeeklyReportProduction } from "./weeklyReportService";
import { runDailyRecapScheduler } from "./dailyRecapService";
import { log } from "../index";
import type { Organization, Agent } from "@shared/schema";

const instanceId = `instance-${process.pid}-${Date.now()}`;

async function initDevDefaults() {
  if (process.env.NODE_ENV === 'production') return;
  try {
    const defaultTmPhone = process.env.DEFAULT_TEXTMAGIC_PHONE || "18338096836";
    const orgs = await storage.getOrganizations();
    const serraHonda = orgs.find(o => o.name === "Serra Honda");
    if (serraHonda) {
      const settings = (serraHonda.settings || {}) as Record<string, any>;
      if (!settings.textmagicPhone) {
        await storage.updateOrganization(serraHonda.id, {
          settings: { ...settings, textmagicPhone: defaultTmPhone }
        });
        log(`Set textmagicPhone for Serra Honda: ${defaultTmPhone}`);
      }
    }
  } catch (err) {
    log(`Failed to set default textmagicPhone: ${err}`);
  }
}

async function runActivityLogPurge() {
  try {
    const deleted = await storage.purgeOldActivityLogs(90);
    if (deleted > 0) {
      log(`Purged ${deleted} activity log entries older than 90 days`, "purge");
    }
  } catch (err) {
    log(`Activity log purge failed: ${err}`, "purge");
  }
}

async function checkScheduledCampaigns() {
  try {
    const locked = await storage.acquireSchedulerLock('campaign_scheduler', instanceId, 5);
    if (!locked) {
      log(`Campaign scheduler lock held by another instance, skipping`, "scheduler");
      return;
    }
    try {
      const due = await storage.getScheduledCampaigns();
      for (const campaign of due) {
        log(`Executing scheduled campaign: ${campaign.name} (${campaign.id})`, "scheduler");
        const result = await startCampaignExecution(campaign.id, campaign.organizationId, false);
        if (!result.success) {
          log(`Scheduled campaign ${campaign.id} failed to start: ${result.message}`, "scheduler");
        }
      }
    } finally {
      await storage.releaseSchedulerLock('campaign_scheduler');
    }
  } catch (err) {
    log(`Campaign scheduler check failed: ${err}`, "scheduler");
  }
}

async function processScheduledActions() {
  try {
    const dueActions = await storage.getDueScheduledActions();
    for (const action of dueActions) {
      try {
        if (action.actionType === 'trigger_action') {
          const p = action.payload as any;
          const org = await storage.getOrganization(p.orgId);
          const agent = await storage.getAgent(p.agentId);
          if (org && agent) {
            await executeTriggerAction(p.type, p.phone, p.email, p.customerName, org, agent);
            log(`Executed scheduled trigger action: ${p.type} for ${p.customerName}`, "scheduler");
          }
        }

        if (action.actionType === 'queued_sms') {
          const p = action.payload as any;
          try {
            const { processOutboundSend } = await import("../outbound");
            await processOutboundSend({
              organizationId: action.organizationId,
              channel: p.channel || "sms",
              to: p.to,
              messageContent: `Follow-up: You messaged us after hours. A team member will be reaching out shortly.`,
            });
            log(`Processed queued SMS to ${p.to}`, "scheduler");
          } catch (qErr: any) {
            log(`Queued SMS to ${p.to} failed: ${qErr.message}`, "scheduler");
          }
        }

        if (action.actionType === 'queued_immediate_trigger_sms') {
          const p = action.payload as any;
          try {
            const { processOutboundSend } = await import("../outbound");
            const result = await processOutboundSend({
              organizationId: action.organizationId,
              channel: p.channel || "sms",
              to: p.to,
              messageContent: p.messageContent,
              recipientName: p.recipientName,
            });
            log(`Processed queued immediate trigger SMS to ${p.to}: ${result.status}${result.blockedReason ? ' — ' + result.blockedReason : ''}`, "scheduler");
            if (result.status === 'sent') {
              await storage.createActivityLog({
                organizationId: action.organizationId,
                action: "trigger_immediate_sent",
                entityType: "warehouse_lead",
                entityId: p.leadId,
                metadata: {
                  triggerType: "immediate_new_lead",
                  phone: p.to,
                  customerName: p.customerName,
                  source: "scheduled_morning_send",
                },
              }).catch(() => {});
            }
          } catch (qErr: any) {
            log(`Queued immediate trigger SMS to ${p.to} failed: ${qErr.message}`, "scheduler");
          }
        }
        await storage.markScheduledActionExecuted(action.id);
      } catch (actErr: any) {
        log(`Scheduled action ${action.id} failed: ${actErr.message}`, "scheduler");
        await storage.markScheduledActionExecuted(action.id);
      }
    }
  } catch (err) {
    log(`Scheduled actions check failed: ${err}`, "scheduler");
  }
}

async function runWeeklyHunches() {
  const now = new Date();
  if (now.getDay() !== 1) return;
  if (now.getHours() !== 6) return;

  try {
    const lockState = await storage.getSchedulerLock('hunch_scheduler');
    const lastRunAt = lockState?.lastRunAt;

    if (lastRunAt) {
      const timeSinceLastRun = now.getTime() - lastRunAt.getTime();
      if (timeSinceLastRun < 6 * 60 * 60 * 1000) return;
    }

    const orgs = await storage.getOrganizations();
    for (const org of orgs) {
      const settings = (org.settings as Record<string, any>) || {};
      if (settings.hunchesEnabled === false) continue;
      log(`Generating weekly hunches for org: ${org.name} (${org.id})`, "hunches");
      try {
        const hunches = await generateHunchesForOrg(org.id);
        log(`Generated ${hunches.length} hunches for ${org.name}`, "hunches");
      } catch (err) {
        log(`Hunch generation failed for ${org.name}: ${err}`, "hunches");
      }
    }

    await storage.updateSchedulerLastRunAt('hunch_scheduler');
  } catch (err) {
    log(`Weekly hunch scheduler failed: ${err}`, "hunches");
  }
}

// ---------------------------------------------------------------------------
// Weekly Executive Report Scheduler (TRG-RPT-001 — Phase D final step)
// ---------------------------------------------------------------------------
//
// Per-store Monday 7am local send. The runner checks each of the 5 dealer
// orgs (orgs whose partner points at Cage Automotive), computes the local
// time in that store's configured timezone (settings.timezone, fallback
// "America/Chicago" with a warning log), and fires the production send if:
//   - local day is Monday
//   - local hour is 7 (7:00 to 7:59 inclusive)
//   - no scheduler_locks row exists for this org's weekly key
// OR a catch-up condition (Monday past 7am through Tuesday 7am local, still
// within ~24h of target, lock missing) — covers container-restart cases.
//
// Idempotency key format: `weekly_report_{orgId}_{isoWeekYear}-W{isoWeek}`.
// Each week creates its own row — old rows accumulate but are harmless; a
// separate purge sprint can clean them if needed.
//
// The send itself is handled by `sendWeeklyReportProduction` in
// weeklyReportService — same function the integration test uses.
//
// Safety Bcc: by default, every send includes `duane.wells@huminic.ai` on
// Bcc for operator observability. Operator will flip
// `WEEKLY_REPORT_SAFETY_BCC_DISABLED=1` after confidence is built.

export interface LocalTimeInfo {
  day: string; // "Monday", "Tuesday", ...
  hour: number; // 0–23
  isoWeekYear: number;
  isoWeekNumber: number;
  tzUsed: string;
  tzFellBack: boolean;
  nowMs: number; // ms since epoch (same for every TZ — reference)
  localTimestamp: string; // "YYYY-MM-DD HH:MM" in the chosen TZ, for logs
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Compute the local day / hour / ISO-week information for a given timezone.
 *
 * `now` defaults to `new Date()` — accept an override for deterministic tests.
 * If the `tz` string is invalid (throws inside Intl), we fall back to
 * "America/Chicago" and flag `tzFellBack = true`.
 */
export function getLocalTimeInTz(
  tz: string | null | undefined,
  now: Date = new Date(),
): LocalTimeInfo {
  const FALLBACK = "America/Chicago";
  let effectiveTz = tz && tz.trim().length > 0 ? tz.trim() : FALLBACK;
  let tzFellBack = !tz || tz.trim().length === 0;

  // Validate by running a cheap format — throws for bad TZ strings.
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: effectiveTz }).format(now);
  } catch {
    effectiveTz = FALLBACK;
    tzFellBack = true;
  }

  // Extract parts in the target TZ.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: effectiveTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "long",
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const year = parseInt(get("year"), 10);
  const month = parseInt(get("month"), 10);
  const day = parseInt(get("day"), 10);
  // Intl uses "24" for midnight hour in hour12:false — normalize to 0.
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(get("minute"), 10);
  const weekday = get("weekday") || DAY_NAMES[0];

  // Compute ISO week using the local calendar date (year/month/day) in TZ.
  const { isoWeekYear, isoWeekNumber } = isoWeekFromCalendar(year, month, day);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const localTimestamp = `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}`;

  return {
    day: weekday,
    hour,
    isoWeekYear,
    isoWeekNumber,
    tzUsed: effectiveTz,
    tzFellBack,
    nowMs: now.getTime(),
    localTimestamp,
  };
}

/**
 * ISO-8601 week number from a local calendar date (Y-M-D).
 *
 * Implements the standard algorithm: the ISO week-year of a date is the
 * calendar year of its Thursday; week 1 is the week containing the year's
 * first Thursday.
 */
export function isoWeekFromCalendar(
  year: number,
  month: number,
  day: number,
): { isoWeekYear: number; isoWeekNumber: number } {
  // Build a UTC date at noon to avoid DST boundary drift.
  const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const dayOfWeek = d.getUTCDay() || 7; // Monday=1..Sunday=7
  d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek); // shift to Thursday of same week
  const isoWeekYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoWeekYear, 0, 1));
  const isoWeekNumber = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { isoWeekYear, isoWeekNumber };
}

/**
 * Returns the lock key for a given org + local-week.
 */
export function weeklyReportLockKey(
  orgId: string,
  isoWeekYear: number,
  isoWeekNumber: number,
): string {
  const weekPart = `W${isoWeekNumber.toString().padStart(2, "0")}`;
  return `weekly_report_${orgId}_${isoWeekYear}-${weekPart}`;
}

export interface WeeklyReportDecision {
  fire: boolean;
  reason: string;
  local: LocalTimeInfo;
  lockKey: string;
}

/**
 * Pure decision function — given the org, the current time, and whether a
 * lock already exists, return whether the scheduler should fire for this org
 * on this tick. Extracted so unit tests can exercise it without hitting the
 * DB or sending anything.
 *
 *   fire = (local.day === "Monday" && local.hour === 7 && !lockHeld)
 *          OR (catch-up) local time is Monday past 7am through Tuesday before
 *          7am AND lockHeld === false
 */
export function decideWeeklyReportFire(
  orgId: string,
  tz: string | null | undefined,
  lockHeld: boolean,
  now: Date = new Date(),
): WeeklyReportDecision {
  const local = getLocalTimeInTz(tz, now);
  const lockKey = weeklyReportLockKey(orgId, local.isoWeekYear, local.isoWeekNumber);

  if (lockHeld) {
    return { fire: false, reason: "lock_held", local, lockKey };
  }

  // Primary window: Monday 7:00–7:59 local.
  if (local.day === "Monday" && local.hour === 7) {
    return { fire: true, reason: "primary_window", local, lockKey };
  }

  // Catch-up window: Monday 8am through Tuesday 6:59am local, ≤24h from 7am.
  // Covers: container restart during the send window → missed-and-recover.
  const isMondayAfter7 = local.day === "Monday" && local.hour >= 8;
  const isTuesdayBefore7 = local.day === "Tuesday" && local.hour < 7;
  if (isMondayAfter7 || isTuesdayBefore7) {
    return { fire: true, reason: "catchup_window", local, lockKey };
  }

  return { fire: false, reason: "outside_window", local, lockKey };
}

/**
 * Main scheduler job. Runs every 5 minutes — checks each dealer org, fires
 * the production weekly-report send for any store whose local time is inside
 * the Monday 7am window (or catch-up) and which hasn't already fired this
 * week.
 *
 * Exported so it can be unit-tested. Accepts injectable dependencies —
 * production callers should use the default arguments.
 */
export async function runWeeklyReportScheduler(deps: {
  listProductionOrgs?: () => Promise<Array<Pick<Organization, "id" | "name" | "settings">>>;
  getLock?: (key: string) => Promise<{ lockedAt: Date | null } | undefined>;
  acquireLock?: (key: string) => Promise<boolean>;
  send?: typeof sendWeeklyReportProduction;
  writeActivityLog?: (entry: {
    organizationId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata: Record<string, unknown>;
  }) => Promise<void>;
  now?: Date;
} = {}): Promise<void> {
  const {
    listProductionOrgs = defaultListProductionOrgs,
    getLock = (k) => storage.getSchedulerLock(k),
    // 7-day TTL: the weekly-report lock must outlive its week. Short TTLs
    // like the default 5-minute campaign-scheduler lock would let the row
    // "age out" and re-fire within the same week. 10080 minutes = 7 days.
    acquireLock = (k) => storage.acquireSchedulerLock(k, instanceId, 10080),
    send = sendWeeklyReportProduction,
    writeActivityLog = (e) => storage.createActivityLog(e).then(() => undefined),
    now = new Date(),
  } = deps;

  let orgs: Array<Pick<Organization, "id" | "name" | "settings">>;
  try {
    orgs = await listProductionOrgs();
  } catch (err) {
    log(`Weekly report scheduler — org list failed: ${err}`, "weekly-report");
    return;
  }

  const safetyBccDisabled = process.env.WEEKLY_REPORT_SAFETY_BCC_DISABLED === "1";
  const safetyBcc: string | null = safetyBccDisabled ? null : "duane.wells@huminic.ai";

  for (const org of orgs) {
    const tz = ((org.settings as Record<string, unknown> | null)?.timezone as string | undefined) || null;
    const localPeek = getLocalTimeInTz(tz, now);
    const lockKey = weeklyReportLockKey(org.id, localPeek.isoWeekYear, localPeek.isoWeekNumber);

    let lockRow: { lockedAt: Date | null } | undefined;
    try {
      lockRow = await getLock(lockKey);
    } catch (err) {
      log(
        `[WeeklyReportScheduler] lock read failed for ${org.name} (${org.id}): ${err}`,
        "weekly-report",
      );
      continue;
    }
    const lockHeld = !!lockRow && !!lockRow.lockedAt;

    const decision = decideWeeklyReportFire(org.id, tz, lockHeld, now);

    if (decision.local.tzFellBack) {
      log(
        `[WeeklyReportScheduler] ${org.name} has no valid settings.timezone — falling back to ${decision.local.tzUsed}`,
        "weekly-report",
      );
    }

    if (!decision.fire) {
      // Quiet log — we hit this every 5 minutes for every org.
      continue;
    }

    // Acquire lock first — race-safe. If another instance beat us to it,
    // skip.
    let acquired: boolean;
    try {
      acquired = await acquireLock(decision.lockKey);
    } catch (err) {
      log(
        `[WeeklyReportScheduler] lock acquire failed for ${org.name}: ${err}`,
        "weekly-report",
      );
      continue;
    }
    if (!acquired) {
      log(
        `[WeeklyReportScheduler] lock race — another instance holds ${decision.lockKey}`,
        "weekly-report",
      );
      continue;
    }

    log(
      `[WeeklyReportScheduler] firing for ${org.name} (${org.id}) — reason=${decision.reason} local=${decision.local.localTimestamp} tz=${decision.local.tzUsed}`,
      "weekly-report",
    );

    try {
      const result = await send(org.id, { safetyBcc });
      try {
        await writeActivityLog({
          organizationId: org.id,
          action: result.sent ? "weekly_report_sent" : "weekly_report_skipped",
          entityType: "org",
          entityId: org.id,
          metadata: {
            trigger: "scheduler",
            reason: decision.reason,
            localTimestamp: decision.local.localTimestamp,
            tz: decision.local.tzUsed,
            tzFellBack: decision.local.tzFellBack,
            lockKey: decision.lockKey,
            messageId: result.messageId ?? null,
            to: result.to,
            cc: result.cc,
            bcc: result.bcc,
            skipReason: result.skipReason ?? null,
            validationFailures: result.validationFailures ?? null,
            haltFailures: result.haltFailures ?? null,
            error: result.error ?? null,
            narrativeWordCount: result.narrativeWordCount ?? null,
          },
        });
      } catch (logErr) {
        log(
          `[WeeklyReportScheduler] activity_log write failed for ${org.name}: ${logErr}`,
          "weekly-report",
        );
      }

      if (result.sent) {
        log(
          `[WeeklyReportScheduler] ${org.name}: SENT messageId=${result.messageId ?? "(none)"} to=${result.to.length} cc=${result.cc.length} bcc=${result.bcc.length}`,
          "weekly-report",
        );
      } else {
        log(
          `[WeeklyReportScheduler] ${org.name}: SKIPPED reason=${result.skipReason ?? "(unknown)"} error=${result.error ?? "(none)"}`,
          "weekly-report",
        );
      }
    } catch (err) {
      // Isolate — one org's failure must not break the loop for the other 4.
      log(
        `[WeeklyReportScheduler] ${org.name}: unexpected error: ${err}`,
        "weekly-report",
      );
      try {
        await writeActivityLog({
          organizationId: org.id,
          action: "weekly_report_error",
          entityType: "org",
          entityId: org.id,
          metadata: {
            trigger: "scheduler",
            reason: decision.reason,
            localTimestamp: decision.local.localTimestamp,
            tz: decision.local.tzUsed,
            lockKey: decision.lockKey,
            error: String(err),
          },
        });
      } catch (logErr) {
        log(
          `[WeeklyReportScheduler] error-log write also failed for ${org.name}: ${logErr}`,
          "weekly-report",
        );
      }
    }
  }
}

/**
 * Default org list — every org whose partner is Cage Automotive (the 5
 * dealer stores). Kept as a function so tests can inject a stub without
 * touching storage.
 */
async function defaultListProductionOrgs(): Promise<
  Array<Pick<Organization, "id" | "name" | "settings">>
> {
  const allOrgs = await storage.getOrganizations();
  const cage = allOrgs.find((o) => o.slug === "cage-automotive");
  if (!cage) {
    log(
      `[WeeklyReportScheduler] Cage Automotive org not found — weekly report scheduler is idle`,
      "weekly-report",
    );
    return [];
  }
  const dealers = allOrgs.filter((o) => o.partnerId === cage.id);
  return dealers.map((o) => ({ id: o.id, name: o.name, settings: o.settings }));
}

async function executeTriggerAction(actionType: string, phone: string | null, email: string | null, customerName: string, org: Organization, agent: Agent) {
  const agentName = agent.name;
  const dealershipName = org.name;

  if (actionType === 'sms' && phone) {
    const msg = `Hi ${customerName}, this is ${agentName} from ${dealershipName}. We noticed you might still be looking — is there anything we can help with? Reply or call us anytime!`;
    log(`Trigger action: sending SMS to ${phone} for ${customerName}`, "triggers");
    await processOutboundSend({
      organizationId: org.id,
      channel: 'sms',
      to: phone,
      messageContent: msg,
    });
  } else if (actionType === 'call' && phone) {
    log(`Trigger action: initiating call to ${phone} for ${customerName}`, "triggers");
    await processOutboundSend({
      organizationId: org.id,
      channel: 'phone',
      to: phone,
      messageContent: `Follow-up call for ${customerName} from ${dealershipName}`,
    });
  } else if (actionType === 'email' && email) {
    const msg = `Subject: Following up from ${dealershipName}\n\nHi ${customerName},\n\nThis is ${agentName} from ${dealershipName}. I wanted to follow up and see if you're still interested. We'd love to help you find what you're looking for.\n\nFeel free to reply to this email or give us a call anytime.\n\nBest regards,\n${agentName}\n${dealershipName}`;
    log(`Trigger action: sending email to ${email} for ${customerName}`, "triggers");
    await processOutboundSend({
      organizationId: org.id,
      channel: 'email',
      to: email,
      messageContent: msg,
    });
  } else {
    log(`Trigger action: skipping ${actionType} — no ${actionType === 'email' ? 'email' : 'phone'} for ${customerName}`, "triggers");
  }
}

async function checkTriggerConditions() {
  try {
    const orgs = await storage.getOrganizations();
    for (const org of orgs) {
      const orgAgents = await storage.getAgents(org.id);
      const orgUsers = await storage.getUsers(org.id);
      const adminUser = orgUsers.find(u => (u.role as any)?.name === 'org_admin' || (u.role as any)?.name === 'partner_admin' || (u.role as any)?.name === 'super_admin') || orgUsers[0];

      for (const agent of orgAgents) {
        const triggers = (agent.triggers as any[]) || [];
        const enabledTriggers = triggers.filter((t: any) => t.enabled);
        if (enabledTriggers.length === 0) continue;

        for (const trigger of enabledTriggers) {
          if (trigger.type === 'new_lead_followup') {
            const delayHours = trigger.config?.delayHours || 48;
            const messageTemplate = trigger.config?.messageTemplate || 'Hi {customerFirstName}, this is {agentName} from {dealerStoreName}. I just wanted to follow up with you to see if you had any questions and if your experience with our dealer so far has been a good one. Please let me know if I can be of any assistance or if you have any feedback.';
            const conversionStatuses: string[] = trigger.config?.conversionStatuses || ['SOLD'];

            const businessHoursSeq: Array<{ channel: string; waitMinutes: number; messageTemplate?: string }> = trigger.config?.businessHoursSequence || [];
            const afterHoursSeq: Array<{ channel: string; waitMinutes: number; messageTemplate?: string }> = trigger.config?.afterHoursSequence || [];
            const storeHours = trigger.config?.storeHours as { openTime?: string; closeTime?: string; closedDays?: number[] } | undefined;

            const hasMultiStep = businessHoursSeq.length > 0 || afterHoursSeq.length > 0;

            const isWithinBusinessHours = (): boolean => {
              if (!storeHours?.openTime || !storeHours?.closeTime) return true;
              const now = new Date();
              const dayOfWeek = now.getDay();
              if (storeHours.closedDays && storeHours.closedDays.includes(dayOfWeek)) return false;
              const [openH, openM] = storeHours.openTime.split(':').map(Number);
              const [closeH, closeM] = storeHours.closeTime.split(':').map(Number);
              const currentMinutes = now.getHours() * 60 + now.getMinutes();
              const openMinutes = (openH || 0) * 60 + (openM || 0);
              const closeMinutes = (closeH || 0) * 60 + (closeM || 0);
              return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
            };

            if (!hasMultiStep) {
              const dueLeads = await storage.getLeadsDueForFollowup(org.id, delayHours, 10);
              if (dueLeads.length > 0) {
                log(`Trigger "${trigger.name}": ${dueLeads.length} leads due for ${delayHours}h follow-up for agent ${agent.name}`, "triggers");
                for (const lead of dueLeads) {
                  if (conversionStatuses.includes(lead.vinStatus || '')) continue;
                  const customerFirstName = (lead.customerName || 'there').split(' ')[0];
                  const msg = messageTemplate
                    .replace(/\{customerFirstName\}/g, customerFirstName)
                    .replace(/\{agentName\}/g, agent.name)
                    .replace(/\{dealerStoreName\}/g, org.name);

                  log(`Trigger "${trigger.name}": sending follow-up SMS to ${lead.customerPhone} for ${lead.customerName || 'Unknown'}`, "triggers");
                  try {
                    await processOutboundSend({
                      organizationId: org.id,
                      channel: 'sms',
                      to: lead.customerPhone!,
                      messageContent: msg,
                    });
                    await storage.markFollowupSent(lead.id);
                    log(`Trigger "${trigger.name}": follow-up sent and marked for lead ${lead.sourceId || lead.id}`, "triggers");

                    if (adminUser) {
                      await storage.createNotification({
                        userId: adminUser.id,
                        organizationId: org.id,
                        type: 'trigger_alert',
                        title: `Follow-up Sent: ${lead.customerName || 'Customer'}`,
                        message: `${trigger.name} — Follow-up SMS sent to ${lead.customerPhone} for ${lead.customerName || 'Unknown'} (${delayHours}h after lead created)`,
                        relatedEntityId: lead.id,
                      });
                    }
                  } catch (sendErr: any) {
                    log(`Trigger "${trigger.name}": failed to send follow-up for ${lead.customerName}: ${sendErr.message}`, "triggers");
                  }
                }
              }
            } else {
              const duringBusiness = isWithinBusinessHours();
              const activeSequence = duringBusiness
                ? (businessHoursSeq.length > 0 ? businessHoursSeq : afterHoursSeq)
                : (afterHoursSeq.length > 0 ? afterHoursSeq : businessHoursSeq);

              if (activeSequence.length === 0) continue;

              const dueLeads = await storage.getLeadsDueForMultiStepFollowup(org.id, activeSequence.length, conversionStatuses, 20);
              if (dueLeads.length > 0) {
                log(`Trigger "${trigger.name}": ${dueLeads.length} leads in multi-step pipeline (${duringBusiness ? 'business' : 'after'} hours, ${activeSequence.length} steps) for agent ${agent.name}`, "triggers");
              }

              for (const lead of dueLeads) {
                const currentStep = lead.followupStep ?? 0;
                if (currentStep >= activeSequence.length) continue;

                const step = activeSequence[currentStep];
                const now = Date.now();

                let referenceTime: number;
                if (currentStep === 0) {
                  referenceTime = (lead.vinCreatedAt || lead.createdAt).getTime();
                  const firstWait = step.waitMinutes > 0 ? step.waitMinutes : delayHours * 60;
                  if (now - referenceTime < firstWait * 60 * 1000) continue;
                } else {
                  if (!lead.followupSentAt) continue;
                  referenceTime = lead.followupSentAt.getTime();
                  if (now - referenceTime < step.waitMinutes * 60 * 1000) continue;
                }

                const customerFirstName = (lead.customerName || 'there').split(' ')[0];
                const stepTemplate = step.messageTemplate || messageTemplate;
                const msg = stepTemplate
                  .replace(/\{customerFirstName\}/g, customerFirstName)
                  .replace(/\{agentName\}/g, agent.name)
                  .replace(/\{dealerStoreName\}/g, org.name);

                const channel = step.channel as 'sms' | 'phone' | 'email';
                let to: string | null = null;
                let effectiveMsg = msg;

                if (channel === 'sms') {
                  to = lead.customerPhone;
                } else if (channel === 'phone') {
                  to = lead.customerPhone;
                  if (!step.messageTemplate) effectiveMsg = 'Automated follow-up call';
                } else if (channel === 'email') {
                  to = lead.customerEmail;
                }

                if (!to) {
                  log(`Trigger "${trigger.name}": advancing past step ${currentStep} (${channel}) for ${lead.customerName || 'Unknown'} — no ${channel === 'email' ? 'email' : 'phone'} available`, "triggers");
                  await storage.updateFollowupStep(lead.id, currentStep + 1);
                  continue;
                }

                log(`Trigger "${trigger.name}": executing step ${currentStep + 1}/${activeSequence.length} (${channel}) for ${lead.customerName || 'Unknown'}`, "triggers");
                try {
                  await processOutboundSend({
                    organizationId: org.id,
                    channel,
                    to,
                    messageContent: effectiveMsg,
                  });
                  await storage.updateFollowupStep(lead.id, currentStep + 1);
                  log(`Trigger "${trigger.name}": step ${currentStep + 1} complete for lead ${lead.sourceId || lead.id}`, "triggers");

                  if (adminUser) {
                    await storage.createNotification({
                      userId: adminUser.id,
                      organizationId: org.id,
                      type: 'trigger_alert',
                      title: `Follow-up Step ${currentStep + 1}: ${lead.customerName || 'Customer'}`,
                      message: `${trigger.name} — Step ${currentStep + 1}/${activeSequence.length} (${channel.toUpperCase()}) sent to ${to} for ${lead.customerName || 'Unknown'}`,
                      relatedEntityId: lead.id,
                    });
                  }
                } catch (sendErr: any) {
                  log(`Trigger "${trigger.name}": step ${currentStep + 1} failed for ${lead.customerName}: ${sendErr.message}`, "triggers");
                }
              }
            }
          }

          if (trigger.type === 'stale_lead') {
            const thresholdHours = trigger.config?.thresholdHours || 24;
            const cutoff = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);
            const triggerCooldownMs = 15 * 60 * 1000;
            const convs = await storage.getConversations(org.id, { agentId: agent.id });
            const staleConvs = convs.filter(c => {
              if (c.status !== 'open' || !c.lastMessageAt || new Date(c.lastMessageAt) >= cutoff) return false;
              if ((c as any).staleTriggerProcessedAt) {
                const processedAt = new Date((c as any).staleTriggerProcessedAt).getTime();
                if (Date.now() - processedAt < triggerCooldownMs) return false;
              }
              return true;
            });
            if (staleConvs.length > 0) {
              log(`Trigger "${trigger.name}": ${staleConvs.length} stale leads for agent ${agent.name}`, "triggers");
              const actions = trigger.config?.actions || [];

              for (const conv of staleConvs.slice(0, 5)) {
                await storage.updateConversation(conv.id, { staleTriggerProcessedAt: new Date() } as any);
                if (adminUser) {
                  await storage.createNotification({
                    userId: adminUser.id,
                    organizationId: org.id,
                    type: 'trigger_alert',
                    title: `Stale Lead: ${conv.customerName}`,
                    message: `${trigger.name} — ${conv.customerName} has had no activity for ${thresholdHours}+ hours. Actions: ${actions.map((a: any) => a.type).join(' → ')}`,
                    relatedEntityId: conv.id,
                  });
                }

                const customerPhone = conv.customerPhone;
                const customerEmail = conv.customerEmail;
                const customerName = conv.customerName || 'Customer';

                for (const action of actions) {
                  const waitMs = (action.waitMinutes || 0) * 60 * 1000;
                  if (waitMs > 0) {
                    log(`Trigger "${trigger.name}": scheduling ${action.type} for ${customerName} in ${action.waitMinutes}m`, "triggers");
                    await storage.createScheduledAction({
                      organizationId: org.id,
                      actionType: 'trigger_action',
                      payload: {
                        type: action.type,
                        phone: customerPhone,
                        email: customerEmail,
                        customerName,
                        orgId: org.id,
                        agentId: agent.id,
                        triggerName: trigger.name,
                      },
                      executeAt: new Date(Date.now() + waitMs),
                    });
                  } else {
                    try {
                      await executeTriggerAction(action.type, customerPhone, customerEmail, customerName, org, agent);
                    } catch (actErr: any) {
                      log(`Trigger action ${action.type} failed for ${customerName}: ${actErr.message}`, "triggers");
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    log(`Trigger condition check failed: ${err}`, "triggers");
  }
}

/**
 * Start all scheduler tasks. Call once after server is listening.
 */
export function startSchedulers() {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // Dev-only defaults
  initDevDefaults();

  // Activity log purge (daily)
  runActivityLogPurge();
  setInterval(runActivityLogPurge, ONE_DAY_MS);

  // Campaign scheduler (every 60s)
  setInterval(checkScheduledCampaigns, 60000);

  // Scheduled actions (every 30s)
  setInterval(processScheduledActions, 30000);

  // Weekly hunches (check every 5min, runs Monday at 6am)
  setInterval(runWeeklyHunches, 5 * 60 * 1000);

  // Weekly executive report (TRG-RPT-001) — check every 5min, runs per store
  // when local time hits Monday 7:00–7:59 (with Monday-after / Tuesday-before
  // catch-up window). Protected by per-org per-week scheduler_locks row.
  setInterval(() => {
    runWeeklyReportScheduler().catch((err) => {
      log(`Weekly report scheduler tick failed: ${err}`, "weekly-report");
    });
  }, 5 * 60 * 1000);

  // Daily recap (I-NEW-2026-04-29-H) — check every 5min, runs per store at
  // settings.dailyRecapHour local (default 18 / 6 PM) when settings.dailyRecapEnabled === true.
  // Default OFF per-org. Protected by per-org per-day scheduler_locks row.
  setInterval(() => {
    runDailyRecapScheduler().catch((err) => {
      log(`Daily recap scheduler tick failed: ${err}`, "daily-recap");
    });
  }, 5 * 60 * 1000);

  // Trigger conditions (every 15min)
  setInterval(checkTriggerConditions, 15 * 60 * 1000);

  // Escalation scheduler: check for unanswered conversations every 5 minutes
  setInterval(checkUnansweredEscalations, 5 * 60 * 1000);

  log("All schedulers started", "scheduler");
}

async function checkUnansweredEscalations() {
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
          log(`Escalation email sent to ${orgAdmin.email} for conversation ${conv.id} (${contactName})`, "escalation");
        } else {
          log(`No RESEND_API_KEY — would email ${orgAdmin.email} for conversation ${conv.id}`, "escalation");
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
        log(`Error processing escalation for conversation ${conv.id}: ${convErr}`, "escalation");
      }
    }
  } catch (err) {
    log(`Escalation scheduler error: ${err}`, "escalation");
  }
}
