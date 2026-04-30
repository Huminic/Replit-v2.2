/**
 * Daily Recap (I-NEW-2026-04-29-H) — unit tests.
 *
 * Covers:
 *   - decideDailyRecapFire: feature-disabled / lock-held / primary-window /
 *     catch-up / outside-window / hour-invalid
 *   - dailyRecapLockKey: stable formatting
 *   - runDailyRecapScheduler: skips when feature off; fires when in window;
 *     uses lock key matching local-day; isolates per-org failures
 *
 * Like weeklyReport.scheduler.test.ts, this never touches the DB or sends
 * email — the scheduler exposes injectable deps for this purpose.
 */

import { describe, it, expect, vi } from "vitest";
import { decideDailyRecapFire, dailyRecapLockKey } from "@server/services/dailyRecapDecision";
import {
  runDailyRecapScheduler,
  buildDailyRecap,
  localDayStartUtc,
  type DailyRecapStorage,
} from "@server/services/dailyRecapService";

type Org = { id: string; name: string; settings: Record<string, unknown> | null };

function makeOrg(id: string, name: string, settings: Record<string, unknown>): Org {
  return { id, name, settings };
}

/**
 * Build a Date representing a specific wall-clock time in a specific timezone.
 * Borrowed from weeklyReport.scheduler.test.ts.
 */
function dateAtLocalTimeInTz(
  tz: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number = 0,
): Date {
  let candidate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  for (let i = 0; i < 3; i++) {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(candidate);
    const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value || "0", 10);
    let actualHour = get("hour");
    if (actualHour === 24) actualHour = 0;
    const actual = new Date(Date.UTC(get("year"), get("month") - 1, get("day"), actualHour, get("minute"), 0));
    const desired = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    const diff = desired.getTime() - actual.getTime();
    if (diff === 0) return candidate;
    candidate = new Date(candidate.getTime() + diff);
  }
  return candidate;
}

describe("dailyRecapLockKey", () => {
  it("formats month and day with leading zeros", () => {
    expect(dailyRecapLockKey("org-1", 2026, 4, 5)).toBe("daily_recap_org-1_2026-04-05");
    expect(dailyRecapLockKey("org-1", 2026, 12, 31)).toBe("daily_recap_org-1_2026-12-31");
  });
});

describe("decideDailyRecapFire", () => {
  it("does not fire when dailyRecapEnabled is missing (default OFF)", () => {
    const org = makeOrg("o1", "Acme", { timezone: "America/Chicago" });
    const now = dateAtLocalTimeInTz("America/Chicago", 2026, 4, 30, 18, 0);
    const d = decideDailyRecapFire(org, false, now);
    expect(d.fire).toBe(false);
    expect(d.reason).toBe("feature_disabled");
  });

  it("does not fire when dailyRecapEnabled is explicitly false", () => {
    const org = makeOrg("o1", "Acme", { timezone: "America/Chicago", dailyRecapEnabled: false });
    const now = dateAtLocalTimeInTz("America/Chicago", 2026, 4, 30, 18, 0);
    expect(decideDailyRecapFire(org, false, now).fire).toBe(false);
  });

  it("fires at the default 18:00 local hour when enabled", () => {
    const org = makeOrg("o1", "Acme", { timezone: "America/Chicago", dailyRecapEnabled: true });
    const now = dateAtLocalTimeInTz("America/Chicago", 2026, 4, 30, 18, 0);
    const d = decideDailyRecapFire(org, false, now);
    expect(d.fire).toBe(true);
    expect(d.reason).toBe("primary_window");
    expect(d.localDate).toBe("2026-04-30");
    expect(d.lockKey).toBe("daily_recap_o1_2026-04-30");
  });

  it("respects per-org dailyRecapHour override (e.g. 17 = 5 PM)", () => {
    const org = makeOrg("o1", "Acme", { timezone: "America/Chicago", dailyRecapEnabled: true, dailyRecapHour: 17 });
    const at1700 = dateAtLocalTimeInTz("America/Chicago", 2026, 4, 30, 17, 0);
    const at1800 = dateAtLocalTimeInTz("America/Chicago", 2026, 4, 30, 18, 0);
    expect(decideDailyRecapFire(org, false, at1700).fire).toBe(true);
    expect(decideDailyRecapFire(org, false, at1700).reason).toBe("primary_window");
    // Past the configured hour, same day -> catch-up
    expect(decideDailyRecapFire(org, false, at1800).fire).toBe(true);
    expect(decideDailyRecapFire(org, false, at1800).reason).toBe("catchup_window");
  });

  it("rejects an out-of-range dailyRecapHour", () => {
    const org = makeOrg("o1", "Acme", { timezone: "America/Chicago", dailyRecapEnabled: true, dailyRecapHour: 99 });
    const now = dateAtLocalTimeInTz("America/Chicago", 2026, 4, 30, 18, 0);
    const d = decideDailyRecapFire(org, false, now);
    expect(d.fire).toBe(false);
    expect(d.reason).toBe("hour_invalid");
  });

  it("rejects a non-integer dailyRecapHour", () => {
    const org = makeOrg("o1", "Acme", { timezone: "America/Chicago", dailyRecapEnabled: true, dailyRecapHour: "18" });
    const now = dateAtLocalTimeInTz("America/Chicago", 2026, 4, 30, 18, 0);
    const d = decideDailyRecapFire(org, false, now);
    expect(d.fire).toBe(false);
    expect(d.reason).toBe("hour_invalid");
  });

  it("does not fire before the recap hour", () => {
    const org = makeOrg("o1", "Acme", { timezone: "America/Chicago", dailyRecapEnabled: true });
    const morning = dateAtLocalTimeInTz("America/Chicago", 2026, 4, 30, 9, 0);
    const d = decideDailyRecapFire(org, false, morning);
    expect(d.fire).toBe(false);
    expect(d.reason).toBe("outside_window");
  });

  it("does not fire when lock is held", () => {
    const org = makeOrg("o1", "Acme", { timezone: "America/Chicago", dailyRecapEnabled: true });
    const now = dateAtLocalTimeInTz("America/Chicago", 2026, 4, 30, 18, 0);
    const d = decideDailyRecapFire(org, true, now);
    expect(d.fire).toBe(false);
    expect(d.reason).toBe("lock_held");
  });

  it("uses Eastern timezone correctly", () => {
    const org = makeOrg("o1", "Acme", { timezone: "America/New_York", dailyRecapEnabled: true });
    const at1800ET = dateAtLocalTimeInTz("America/New_York", 2026, 4, 30, 18, 0);
    expect(decideDailyRecapFire(org, false, at1800ET).fire).toBe(true);
    expect(decideDailyRecapFire(org, false, at1800ET).localDate).toBe("2026-04-30");
  });

  it("falls back gracefully when timezone is invalid", () => {
    const org = makeOrg("o1", "Acme", { timezone: "Not/Real", dailyRecapEnabled: true });
    const at1800Central = dateAtLocalTimeInTz("America/Chicago", 2026, 4, 30, 18, 0);
    const d = decideDailyRecapFire(org, false, at1800Central);
    expect(d.fire).toBe(true); // fallback is America/Chicago
    expect(d.local.tzFellBack).toBe(true);
  });
});

describe("runDailyRecapScheduler", () => {
  it("skips when feature is disabled (no send, no lock acquire)", async () => {
    const org = makeOrg("o1", "Acme", { timezone: "America/Chicago" });
    const send = vi.fn();
    const acquireLock = vi.fn();
    const writeActivityLog = vi.fn().mockResolvedValue(undefined);
    await runDailyRecapScheduler({
      listOrgs: async () => [org as any],
      getLock: async () => undefined,
      acquireLock,
      send,
      writeActivityLog,
      now: dateAtLocalTimeInTz("America/Chicago", 2026, 4, 30, 18, 0),
    });
    expect(send).not.toHaveBeenCalled();
    expect(acquireLock).not.toHaveBeenCalled();
    expect(writeActivityLog).not.toHaveBeenCalled();
  });

  it("fires for an enabled org at the recap hour", async () => {
    const org = makeOrg("o1", "Acme", {
      timezone: "America/Chicago",
      dailyRecapEnabled: true,
    });
    const send = vi.fn().mockResolvedValue({ sent: true, recipientCount: 2 });
    const acquireLock = vi.fn().mockResolvedValue(true);
    const writeActivityLog = vi.fn().mockResolvedValue(undefined);
    await runDailyRecapScheduler({
      listOrgs: async () => [org as any],
      getLock: async () => undefined,
      acquireLock,
      send,
      writeActivityLog,
      now: dateAtLocalTimeInTz("America/Chicago", 2026, 4, 30, 18, 0),
    });
    expect(acquireLock).toHaveBeenCalledTimes(1);
    expect(acquireLock.mock.calls[0][0]).toBe("daily_recap_o1_2026-04-30");
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBe("o1");
    expect(send.mock.calls[0][1].localDate).toBe("2026-04-30");
    expect(writeActivityLog).toHaveBeenCalledTimes(1);
    expect(writeActivityLog.mock.calls[0][0].action).toBe("daily_recap_sent");
  });

  it("skips when lock is already held (idempotent re-tick)", async () => {
    const org = makeOrg("o1", "Acme", {
      timezone: "America/Chicago",
      dailyRecapEnabled: true,
    });
    const send = vi.fn();
    const acquireLock = vi.fn();
    await runDailyRecapScheduler({
      listOrgs: async () => [org as any],
      getLock: async () => ({ lockedAt: new Date() }), // lock held
      acquireLock,
      send,
      now: dateAtLocalTimeInTz("America/Chicago", 2026, 4, 30, 18, 0),
    });
    expect(send).not.toHaveBeenCalled();
    expect(acquireLock).not.toHaveBeenCalled();
  });

  it("skips when another instance acquires the lock first", async () => {
    const org = makeOrg("o1", "Acme", {
      timezone: "America/Chicago",
      dailyRecapEnabled: true,
    });
    const send = vi.fn();
    const acquireLock = vi.fn().mockResolvedValue(false);
    const writeActivityLog = vi.fn();
    await runDailyRecapScheduler({
      listOrgs: async () => [org as any],
      getLock: async () => undefined,
      acquireLock,
      send,
      writeActivityLog,
      now: dateAtLocalTimeInTz("America/Chicago", 2026, 4, 30, 18, 0),
    });
    expect(send).not.toHaveBeenCalled();
    expect(writeActivityLog).not.toHaveBeenCalled();
  });

  it("isolates failure of one org so others still run", async () => {
    const orgA = makeOrg("oA", "AcmeA", {
      timezone: "America/Chicago",
      dailyRecapEnabled: true,
    });
    const orgB = makeOrg("oB", "AcmeB", {
      timezone: "America/Chicago",
      dailyRecapEnabled: true,
    });
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ sent: true, recipientCount: 1 });
    const acquireLock = vi.fn().mockResolvedValue(true);
    const writeActivityLog = vi.fn().mockResolvedValue(undefined);
    await runDailyRecapScheduler({
      listOrgs: async () => [orgA as any, orgB as any],
      getLock: async () => undefined,
      acquireLock,
      send,
      writeActivityLog,
      now: dateAtLocalTimeInTz("America/Chicago", 2026, 4, 30, 18, 0),
    });
    expect(send).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// localDayStartUtc — DST + non-DST coverage
// ---------------------------------------------------------------------------

describe("localDayStartUtc", () => {
  it("returns the correct UTC instant for midnight in America/Chicago (CST, no DST)", () => {
    // 2026-01-15 00:00:00 CST = 2026-01-15 06:00:00 UTC
    const dayStart = localDayStartUtc("America/Chicago", 2026, 1, 15);
    expect(dayStart.toISOString()).toBe("2026-01-15T06:00:00.000Z");
  });

  it("returns the correct UTC instant for midnight in America/Chicago (CDT, after DST)", () => {
    // 2026-04-30 00:00:00 CDT = 2026-04-30 05:00:00 UTC
    const dayStart = localDayStartUtc("America/Chicago", 2026, 4, 30);
    expect(dayStart.toISOString()).toBe("2026-04-30T05:00:00.000Z");
  });

  it("handles a DST-spring-forward day (2026-03-08 in America/Chicago)", () => {
    // The day on which clocks jumped from 02:00 CST to 03:00 CDT.
    // Midnight at the start of the day is still 06:00 UTC (pre-DST).
    const dayStart = localDayStartUtc("America/Chicago", 2026, 3, 8);
    expect(dayStart.toISOString()).toBe("2026-03-08T06:00:00.000Z");
  });

  it("handles a DST-fall-back day (2026-11-01 in America/Chicago)", () => {
    // The day on which clocks fell back from 02:00 CDT to 01:00 CST.
    // Midnight at the start of the day is still 05:00 UTC (CDT).
    const dayStart = localDayStartUtc("America/Chicago", 2026, 11, 1);
    expect(dayStart.toISOString()).toBe("2026-11-01T05:00:00.000Z");
  });

  it("handles a fixed-offset (no-DST) timezone (Asia/Tokyo, UTC+9)", () => {
    // 2026-04-30 00:00:00 JST = 2026-04-29 15:00:00 UTC
    const dayStart = localDayStartUtc("Asia/Tokyo", 2026, 4, 30);
    expect(dayStart.toISOString()).toBe("2026-04-29T15:00:00.000Z");
  });

  it("handles UTC itself", () => {
    const dayStart = localDayStartUtc("UTC", 2026, 4, 30);
    expect(dayStart.toISOString()).toBe("2026-04-30T00:00:00.000Z");
  });
});

// ---------------------------------------------------------------------------
// buildDailyRecap — data assembly with injected fixture storage
// ---------------------------------------------------------------------------

function makeFixtureStorage(overrides: Partial<DailyRecapStorage> = {}): DailyRecapStorage {
  const empty = async () => [];
  const def: DailyRecapStorage = {
    getOrganization: (async () => ({ id: "o1", name: "Acme" })) as any,
    getWarehouseLeads: empty as any,
    getConversations: empty as any,
    getMessages: empty as any,
    getAppointments: empty as any,
    getUnansweredConversations: empty as any,
    getActivityLogs: empty as any,
    getOutboundLogs: empty as any,
  };
  return { ...def, ...overrides };
}

describe("buildDailyRecap", () => {
  const dayStart = new Date("2026-04-30T05:00:00.000Z"); // midnight CDT
  const dayEnd = new Date("2026-05-01T00:00:00.000Z"); // late evening UTC, still local-day

  it("returns null if org does not exist", async () => {
    const store = makeFixtureStorage({
      getOrganization: (async () => null) as any,
    });
    const result = await buildDailyRecap("missing", dayStart, dayEnd, "2026-04-30", store);
    expect(result).toBeNull();
  });

  it("zero-activity day produces all zeros", async () => {
    const store = makeFixtureStorage();
    const result = await buildDailyRecap("o1", dayStart, dayEnd, "2026-04-30", store);
    expect(result).not.toBeNull();
    expect(result!.newSalesLeads).toBe(0);
    expect(result!.newServiceLeads).toBe(0);
    expect(result!.customerReplies).toBe(0);
    expect(result!.appointmentsCreated).toBe(0);
    expect(result!.callsReceived).toBe(0);
    expect(result!.unansweredConversations).toBe(0);
    expect(result!.smsOutSent).toBe(0);
    expect(result!.smsBlocked).toBe(0);
    expect(result!.emailSent).toBe(0);
    expect(result!.triggerSends).toEqual({ afterHoursDeferred: 0, checkIn: 0, immediate: 0 });
  });

  it("classifies leads by vin_status (sales vs service vs excluded)", async () => {
    const inWindow = new Date("2026-04-30T15:00:00.000Z").toISOString();
    const leads = [
      { id: "l1", customerName: "A", vinStatus: "ACTIVE_NEW_LEAD", syncedAt: inWindow },
      { id: "l2", customerName: "B", vinStatus: "ACTIVE_ACTIVE_LEAD", syncedAt: inWindow },
      { id: "l3", customerName: "C", vinStatus: "SERVICE_APPOINTMENT_SCHEDULED", syncedAt: inWindow },
      { id: "l4", customerName: "D", vinStatus: "SERVICE_COMPLETE", syncedAt: inWindow },
      { id: "l5", customerName: "E", vinStatus: "LOST_DID_NOT_RESPOND", syncedAt: inWindow },
      { id: "l6", customerName: "F", vinStatus: "SOLD_DELIVERED", syncedAt: inWindow },
      { id: "l7", customerName: "G", vinStatus: "BAD_DUPLICATE_LEAD", syncedAt: inWindow },
      { id: "l8", customerName: "H", vinStatus: "BAD_DEALER_TEST_LEAD", syncedAt: inWindow },
      { id: "l9", customerName: "I", vinStatus: "NON_CUSTOMER_INITIATED_LEAD", syncedAt: inWindow },
      { id: "l10", customerName: "J", vinStatus: "closed-won", syncedAt: inWindow },
    ];
    const store = makeFixtureStorage({
      getWarehouseLeads: (async () => leads) as any,
    });
    const r = await buildDailyRecap("o1", dayStart, dayEnd, "2026-04-30", store);
    expect(r!.newSalesLeads).toBe(2); // l1, l2
    expect(r!.newServiceLeads).toBe(2); // l3, l4
  });

  it("excludes leads outside the day window", async () => {
    const beforeWindow = new Date("2026-04-29T20:00:00.000Z").toISOString();
    const afterWindow = new Date("2026-05-01T06:00:00.000Z").toISOString();
    const inWindow = new Date("2026-04-30T15:00:00.000Z").toISOString();
    const leads = [
      { id: "l1", customerName: "A", vinStatus: "ACTIVE_NEW_LEAD", syncedAt: beforeWindow },
      { id: "l2", customerName: "B", vinStatus: "ACTIVE_NEW_LEAD", syncedAt: inWindow },
      { id: "l3", customerName: "C", vinStatus: "ACTIVE_NEW_LEAD", syncedAt: afterWindow },
    ];
    const store = makeFixtureStorage({
      getWarehouseLeads: (async () => leads) as any,
    });
    const r = await buildDailyRecap("o1", dayStart, dayEnd, "2026-04-30", store);
    expect(r!.newSalesLeads).toBe(1);
  });

  it("counts voice conversations created in window as calls received", async () => {
    const inWindow = new Date("2026-04-30T15:00:00.000Z");
    const beforeWindow = new Date("2026-04-29T20:00:00.000Z");
    const conversations = [
      { id: "c1", channel: "voice", createdAt: inWindow, lastMessageAt: inWindow, organizationId: "o1" },
      { id: "c2", channel: "voice", createdAt: beforeWindow, lastMessageAt: beforeWindow, organizationId: "o1" },
      { id: "c3", channel: "sms", createdAt: inWindow, lastMessageAt: inWindow, organizationId: "o1" },
    ];
    const store = makeFixtureStorage({
      getConversations: (async () => conversations) as any,
    });
    const r = await buildDailyRecap("o1", dayStart, dayEnd, "2026-04-30", store);
    expect(r!.callsReceived).toBe(1);
  });

  it("counts user-role messages within window as customer replies", async () => {
    const inWindow = new Date("2026-04-30T15:00:00.000Z");
    const conversations = [
      { id: "c1", channel: "sms", createdAt: dayStart, lastMessageAt: inWindow, organizationId: "o1" },
    ];
    const messages = [
      { id: "m1", conversationId: "c1", role: "user", content: "hi", createdAt: inWindow },
      { id: "m2", conversationId: "c1", role: "agent", content: "hello", createdAt: inWindow },
      { id: "m3", conversationId: "c1", role: "user", content: "more", createdAt: inWindow },
    ];
    const store = makeFixtureStorage({
      getConversations: (async () => conversations) as any,
      getMessages: (async () => messages) as any,
    });
    const r = await buildDailyRecap("o1", dayStart, dayEnd, "2026-04-30", store);
    expect(r!.customerReplies).toBe(2); // only role==='user' counted
  });

  it("counts outbound_log SMS sent / blocked separately and emails sent", async () => {
    const inWindow = new Date("2026-04-30T15:00:00.000Z");
    const beforeWindow = new Date("2026-04-29T20:00:00.000Z");
    const logs = [
      { channel: "sms", status: "sent", createdAt: inWindow },
      { channel: "sms", status: "sent", createdAt: inWindow },
      { channel: "sms", status: "blocked", createdAt: inWindow },
      { channel: "sms", status: "sent", createdAt: beforeWindow }, // outside window
      { channel: "email", status: "sent", createdAt: inWindow },
      { channel: "email", status: "blocked", createdAt: inWindow }, // not counted
    ];
    const store = makeFixtureStorage({
      getOutboundLogs: (async () => logs) as any,
    });
    const r = await buildDailyRecap("o1", dayStart, dayEnd, "2026-04-30", store);
    expect(r!.smsOutSent).toBe(2);
    expect(r!.smsBlocked).toBe(1);
    expect(r!.emailSent).toBe(1);
  });

  it("aggregates trigger activity by action prefix", async () => {
    const inWindow = new Date("2026-04-30T15:00:00.000Z");
    const logs = [
      { action: "trigger_after_hours_deferred", createdAt: inWindow },
      { action: "trigger_after_hours_deferred", createdAt: inWindow },
      { action: "trigger_checkin_sent", createdAt: inWindow },
      { action: "trigger_immediate_sent", createdAt: inWindow },
      { action: "trigger_immediate_queued", createdAt: inWindow },
      { action: "weekly_report_sent", createdAt: inWindow }, // ignored — not a trigger
    ];
    const store = makeFixtureStorage({
      getActivityLogs: (async () => logs) as any,
    });
    const r = await buildDailyRecap("o1", dayStart, dayEnd, "2026-04-30", store);
    expect(r!.triggerSends.afterHoursDeferred).toBe(2);
    expect(r!.triggerSends.checkIn).toBe(1);
    expect(r!.triggerSends.immediate).toBe(2); // sent + queued
  });

  it("filters unanswered conversations to the target org", async () => {
    const unanswered = [
      { id: "c1", organizationId: "o1" },
      { id: "c2", organizationId: "o2" },
      { id: "c3", organizationId: "o1" },
    ];
    const store = makeFixtureStorage({
      getUnansweredConversations: (async () => unanswered) as any,
    });
    const r = await buildDailyRecap("o1", dayStart, dayEnd, "2026-04-30", store);
    expect(r!.unansweredConversations).toBe(2);
  });
});
