/**
 * Daily Recap Service (I-NEW-2026-04-29-H)
 *
 * End-of-business-day email summarizing the org's last-24-hour activity:
 * new leads, customer replies, appointments, calls, unanswered conversations,
 * trigger sends, and outbound counts.
 *
 * Per-org enable flag: settings.dailyRecapEnabled === true (default OFF).
 * Optional hour override: settings.dailyRecapHour (number, 0-23, default 18).
 *
 * Idempotency: scheduler_locks row keyed by `daily_recap_${orgId}_${YYYY-MM-DD}`,
 * 1500-minute TTL (>24h so the lock outlives its day across restarts).
 *
 * Pattern mirrors the weekly executive report (TRG-RPT-001) but simpler:
 * no AI narrative, no halt checks, no per-row tier validation. Just counts.
 */

import { storage } from "../storage";
import { sendDailyRecapEmail } from "./notificationService";
import { decideDailyRecapFire as _decideDailyRecapFire, dailyRecapLockKey, type DailyRecapDecision } from "./dailyRecapDecision";
import type { Organization } from "@shared/schema";

const DAILY_RECAP_LOCK_TTL_MIN = 1500;

// ---------------------------------------------------------------------------
// Data assembly
// ---------------------------------------------------------------------------

export interface DailyRecapData {
  orgId: string;
  orgName: string;
  /** Local YYYY-MM-DD of the day being recapped */
  date: string;
  /** Count of warehouse_leads synced in the window with non-SERVICE/non-BAD/non-LOST/non-SOLD/non-DUPLICATE vin_status */
  newSalesLeads: number;
  /** Count of warehouse_leads synced in the window with vin_status LIKE 'SERVICE%' */
  newServiceLeads: number;
  /** Count of inbound customer messages (role='user') in the window */
  customerReplies: number;
  /** Count of appointments rows created in the window */
  appointmentsCreated: number;
  /** Count of conversations on channel='voice' created in the window */
  callsReceived: number;
  /** Count of conversations currently unanswered for >30min */
  unansweredConversations: number;
  /** Counts of trigger sends in the window, by triggerType */
  triggerSends: {
    afterHoursDeferred: number;
    checkIn: number;
    immediate: number;
  };
  /** Outbound SMS counts in window: sent vs blocked */
  smsOutSent: number;
  smsBlocked: number;
  /** Outbound email counts in window: sent (notification + ADF + report) */
  emailSent: number;
}

/**
 * Storage surface used by buildDailyRecap. Narrowed for testability — pass a
 * fixture object in unit tests; production code uses the real `storage`.
 */
export interface DailyRecapStorage {
  getOrganization: typeof storage.getOrganization;
  getWarehouseLeads: typeof storage.getWarehouseLeads;
  getConversations: typeof storage.getConversations;
  getMessages: typeof storage.getMessages;
  getAppointments: typeof storage.getAppointments;
  getUnansweredConversations: typeof storage.getUnansweredConversations;
  getActivityLogs: typeof storage.getActivityLogs;
  getOutboundLogs: typeof storage.getOutboundLogs;
}

/**
 * Build the daily-recap data block for a single org over the given day window.
 * Pure-ish: only reads from storage; never sends, never writes.
 *
 * `dayStart` and `dayEnd` are UTC Dates representing the local-day boundaries
 * for the org's timezone. Caller resolves the timezone math.
 */
export async function buildDailyRecap(
  orgId: string,
  dayStart: Date,
  dayEnd: Date,
  localDate: string,
  store: DailyRecapStorage = storage,
): Promise<DailyRecapData | null> {
  const org = await store.getOrganization(orgId);
  if (!org) return null;

  // Warehouse leads — split sales vs service via vin_status prefix
  const allLeadsInWindow = await store.getWarehouseLeads(orgId, {
    syncedAfter: dayStart,
    limit: 5000,
  });
  const leadsInWindow = allLeadsInWindow.filter((l) => {
    const synced = l.syncedAt ? new Date(l.syncedAt).getTime() : 0;
    return synced >= dayStart.getTime() && synced <= dayEnd.getTime();
  });
  let newSalesLeads = 0;
  let newServiceLeads = 0;
  for (const l of leadsInWindow) {
    const vs = (l.vinStatus || "").toString();
    if (vs.startsWith("SERVICE")) {
      newServiceLeads++;
    } else if (
      vs &&
      !vs.startsWith("LOST") &&
      vs !== "lost" &&
      !vs.startsWith("SOLD") &&
      vs !== "sold" &&
      vs !== "closed-won" &&
      !vs.startsWith("BAD") &&
      !vs.includes("DUPLICATE") &&
      vs !== "NON_CUSTOMER_INITIATED_LEAD"
    ) {
      newSalesLeads++;
    }
  }

  // Conversations + messages — count inbound customer replies + calls received
  const conversations = await store.getConversations(orgId);
  let customerReplies = 0;
  let callsReceived = 0;
  for (const c of conversations) {
    const created = new Date(c.createdAt).getTime();
    if (c.channel === "voice" && created >= dayStart.getTime() && created <= dayEnd.getTime()) {
      callsReceived++;
    }
    // Only fetch messages if conversation could plausibly contain a reply in window
    const lastMsg = c.lastMessageAt ? new Date(c.lastMessageAt).getTime() : 0;
    if (lastMsg < dayStart.getTime()) continue;
    try {
      const msgs = await store.getMessages(c.id);
      for (const m of msgs) {
        if (m.role !== "user") continue;
        const t = new Date(m.createdAt).getTime();
        if (t >= dayStart.getTime() && t <= dayEnd.getTime()) {
          customerReplies++;
        }
      }
    } catch {
      // skip — non-fatal
    }
  }

  // Appointments created in window
  const appts = await store.getAppointments(orgId, {});
  let appointmentsCreated = 0;
  for (const a of appts) {
    const t = new Date(a.createdAt).getTime();
    if (t >= dayStart.getTime() && t <= dayEnd.getTime()) appointmentsCreated++;
  }

  // Unanswered conversations (point-in-time, not window-bound)
  const unanswered = await store.getUnansweredConversations(30);
  const unansweredConversations = unanswered.filter((c) => c.organizationId === orgId).length;

  // Trigger activity in window
  const recentLogs = await store.getActivityLogs(orgId, 500);
  const triggerSends = { afterHoursDeferred: 0, checkIn: 0, immediate: 0 };
  for (const entry of recentLogs) {
    const t = new Date(entry.createdAt).getTime();
    if (t < dayStart.getTime() || t > dayEnd.getTime()) continue;
    if (entry.action === "trigger_after_hours_deferred") triggerSends.afterHoursDeferred++;
    else if (entry.action === "trigger_checkin_sent") triggerSends.checkIn++;
    else if (entry.action === "trigger_immediate_sent" || entry.action === "trigger_immediate_queued") triggerSends.immediate++;
  }

  // Outbound counts in window
  const outboundLogs = await store.getOutboundLogs(orgId, {});
  let smsOutSent = 0;
  let smsBlocked = 0;
  let emailSent = 0;
  for (const o of outboundLogs) {
    const t = new Date(o.createdAt).getTime();
    if (t < dayStart.getTime() || t > dayEnd.getTime()) continue;
    if (o.channel === "sms" && o.status === "sent") smsOutSent++;
    else if (o.channel === "sms" && o.status === "blocked") smsBlocked++;
    else if (o.channel === "email" && o.status === "sent") emailSent++;
  }

  return {
    orgId,
    orgName: org.name,
    date: localDate,
    newSalesLeads,
    newServiceLeads,
    customerReplies,
    appointmentsCreated,
    callsReceived,
    unansweredConversations,
    triggerSends,
    smsOutSent,
    smsBlocked,
    emailSent,
  };
}

// ---------------------------------------------------------------------------
// Production send — wired to scheduler
// ---------------------------------------------------------------------------

export interface SendDailyRecapResult {
  sent: boolean;
  skipReason?: string;
  recipientCount?: number;
  data?: DailyRecapData;
  error?: string;
}

export async function sendDailyRecapProduction(
  orgId: string,
  opts: { localDate: string; dayStart: Date; dayEnd: Date; testLaneSessionId?: string } = {
    localDate: "",
    dayStart: new Date(0),
    dayEnd: new Date(),
  },
): Promise<SendDailyRecapResult> {
  try {
    const data = await buildDailyRecap(orgId, opts.dayStart, opts.dayEnd, opts.localDate);
    if (!data) return { sent: false, skipReason: "org_not_found" };

    const result = await sendDailyRecapEmail({
      orgId,
      data,
      testLaneSessionId: opts.testLaneSessionId,
    });
    if (!result.ok) return { sent: false, skipReason: result.reason, data };

    return { sent: true, recipientCount: result.recipientCount, data };
  } catch (err: any) {
    return { sent: false, error: err?.message || String(err) };
  }
}

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

const _instanceId = `daily-recap-${process.pid}-${Date.now()}`;

interface RunDailyRecapDeps {
  listOrgs?: () => Promise<Organization[]>;
  getLock?: (key: string) => Promise<{ lockedAt: Date | null } | undefined>;
  acquireLock?: (key: string) => Promise<boolean>;
  send?: typeof sendDailyRecapProduction;
  writeActivityLog?: (entry: {
    organizationId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata: Record<string, unknown>;
  }) => Promise<void>;
  now?: Date;
}

export async function runDailyRecapScheduler(deps: RunDailyRecapDeps = {}): Promise<void> {
  const {
    listOrgs = () => storage.getOrganizations(),
    getLock = (k) => storage.getSchedulerLock(k),
    acquireLock = (k) => storage.acquireSchedulerLock(k, _instanceId, DAILY_RECAP_LOCK_TTL_MIN),
    send = sendDailyRecapProduction,
    writeActivityLog = (e) => storage.createActivityLog(e).then(() => undefined),
    now = new Date(),
  } = deps;

  let orgs: Organization[];
  try {
    orgs = await listOrgs();
  } catch (err) {
    console.error(`[DailyRecapScheduler] org list failed: ${err}`);
    return;
  }

  for (const org of orgs) {
    let lockRow: { lockedAt: Date | null } | undefined;
    let decision: DailyRecapDecision;
    try {
      // Peek the lock without acquiring.
      const peekDecision = _decideDailyRecapFire(org, false, now);
      if (!peekDecision.fire) continue; // outside window or feature disabled
      lockRow = await getLock(peekDecision.lockKey);
      const lockHeld = !!lockRow && !!lockRow.lockedAt;
      decision = _decideDailyRecapFire(org, lockHeld, now);
    } catch (err) {
      console.error(`[DailyRecapScheduler] decision/lock-read failed for ${org.name}: ${err}`);
      continue;
    }

    if (!decision.fire) continue;

    let acquired: boolean;
    try {
      acquired = await acquireLock(decision.lockKey);
    } catch (err) {
      console.error(`[DailyRecapScheduler] lock acquire failed for ${org.name}: ${err}`);
      continue;
    }
    if (!acquired) continue;

    // Build day window in the org's local tz.
    const dayStart = localDayStartUtc(decision.local.tzUsed, decision.calendarYear, decision.calendarMonth, decision.calendarDay);
    const dayEnd = now; // up to "now" — we're firing at end-of-day

    console.log(
      `[DailyRecapScheduler] firing for ${org.name} (${org.id}) — reason=${decision.reason} local=${decision.local.localTimestamp} tz=${decision.local.tzUsed} window=${dayStart.toISOString()}..${dayEnd.toISOString()}`,
    );

    try {
      const result = await send(org.id, {
        localDate: decision.localDate,
        dayStart,
        dayEnd,
      });
      try {
        await writeActivityLog({
          organizationId: org.id,
          action: result.sent ? "daily_recap_sent" : "daily_recap_skipped",
          entityType: "organization",
          entityId: org.id,
          metadata: {
            trigger: "scheduler",
            reason: decision.reason,
            localDate: decision.localDate,
            localTimestamp: decision.local.localTimestamp,
            tz: decision.local.tzUsed,
            tzFellBack: decision.local.tzFellBack,
            lockKey: decision.lockKey,
            recipientCount: result.recipientCount ?? 0,
            skipReason: result.skipReason ?? null,
            error: result.error ?? null,
          },
        });
      } catch (logErr) {
        console.error(`[DailyRecapScheduler] activity_log write failed for ${org.name}: ${logErr}`);
      }
    } catch (err) {
      console.error(`[DailyRecapScheduler] ${org.name}: unexpected error: ${err}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the UTC Date that corresponds to the start of the given local
 * calendar day in the given IANA timezone (00:00:00 local).
 *
 * Strategy: format the candidate-UTC instant in the target tz, read back the
 * tz offset for that instant, and adjust. This handles DST correctly.
 */
export function localDayStartUtc(tz: string, year: number, month: number, day: number): Date {
  // Best-effort: compose Date.UTC(...) at 00:00:00 then read back the tz offset
  // at that instant and shift. One extra read handles the boundary case where
  // the offset changes between UTC and the local moment (e.g., DST 1h shift).
  const candidate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const tzMs = tzOffsetMsAt(tz, candidate);
  return new Date(candidate.getTime() - tzMs);
}

function tzOffsetMsAt(tz: string, instant: Date): number {
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
  const parts = fmt.formatToParts(instant);
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value || "0", 10);
  // Some Node versions emit hour="24" for midnight in hour12:false mode.
  // Normalize to 0 (same day, not next day — the rest of the date is from
  // formatToParts itself and already reflects the local instant).
  let hour = get("hour");
  if (hour === 24) hour = 0;
  const localUtcMs = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  return localUtcMs - instant.getTime();
}
