/**
 * TRG-RPT-001 Phase D — weekly report scheduler unit tests.
 *
 * Covers the decision logic (TZ-aware window, idempotency, catch-up) and
 * the orchestration behavior (validation-skip, send-success, error
 * isolation) of `runWeeklyReportScheduler`.
 *
 * Deliberately does NOT hit the DB or send email. The scheduler exposes
 * injectable dependencies for this exact purpose — unit-level, fast, no
 * external I/O. Integration coverage lives in
 * tests/integration/weeklyReport.send-live.test.ts.
 *
 * No mocks of the app layer — only the narrow dependency surface the
 * scheduler exposes.
 */

import { describe, it, expect } from "vitest";
import {
  decideWeeklyReportFire,
  getLocalTimeInTz,
  isoWeekFromCalendar,
  runWeeklyReportScheduler,
  weeklyReportLockKey,
} from "@server/services/scheduler";
import type { SendWeeklyReportResult } from "@server/services/weeklyReportService";

type Org = { id: string; name: string; settings: Record<string, unknown> | null };

function makeOrg(id: string, name: string, tz: string | null): Org {
  return {
    id,
    name,
    settings: tz ? { timezone: tz } : {},
  };
}

/**
 * Build a Date representing a specific wall-clock time in a specific
 * timezone. Uses a trial-and-error UTC offset search — for a small number
 * of test dates this is simpler than carrying a full TZ library.
 */
function dateAtLocalTimeInTz(
  tz: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number = 0,
): Date {
  // Start from an arbitrary UTC timestamp with the requested Y/M/D/H/M, then
  // correct by comparing Intl formatting of that instant back against the
  // requested local time.
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
    const actual = new Date(
      Date.UTC(get("year"), get("month") - 1, get("day"), actualHour, get("minute"), 0),
    );
    const desired = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    const diff = desired.getTime() - actual.getTime();
    if (diff === 0) return candidate;
    candidate = new Date(candidate.getTime() + diff);
  }
  return candidate;
}

// ---------------------------------------------------------------------------
// getLocalTimeInTz
// ---------------------------------------------------------------------------

describe("getLocalTimeInTz", () => {
  it("returns Monday / hour 7 for a Chicago Monday 7:15am", () => {
    // 2026-04-20 is a Monday.
    const now = dateAtLocalTimeInTz("America/Chicago", 2026, 4, 20, 7, 15);
    const info = getLocalTimeInTz("America/Chicago", now);
    expect(info.day).toBe("Monday");
    expect(info.hour).toBe(7);
    expect(info.tzUsed).toBe("America/Chicago");
    expect(info.tzFellBack).toBe(false);
  });

  it("falls back to America/Chicago when tz is missing", () => {
    const now = dateAtLocalTimeInTz("America/Chicago", 2026, 4, 20, 7, 0);
    const info = getLocalTimeInTz(null, now);
    expect(info.tzUsed).toBe("America/Chicago");
    expect(info.tzFellBack).toBe(true);
    expect(info.day).toBe("Monday");
    expect(info.hour).toBe(7);
  });

  it("falls back to America/Chicago when tz is bogus", () => {
    const now = dateAtLocalTimeInTz("America/Chicago", 2026, 4, 20, 7, 0);
    const info = getLocalTimeInTz("Not/A_Real_Timezone", now);
    expect(info.tzUsed).toBe("America/Chicago");
    expect(info.tzFellBack).toBe(true);
    expect(info.hour).toBe(7);
  });

  it("differs between TZs at the same instant", () => {
    const now = dateAtLocalTimeInTz("America/Chicago", 2026, 4, 20, 7, 0);
    const chi = getLocalTimeInTz("America/Chicago", now);
    const ny = getLocalTimeInTz("America/New_York", now);
    expect(chi.hour).toBe(7);
    expect(ny.hour).toBe(8); // Eastern is one hour ahead of Central
  });
});

// ---------------------------------------------------------------------------
// isoWeekFromCalendar
// ---------------------------------------------------------------------------

describe("isoWeekFromCalendar", () => {
  it("computes ISO week for a known Monday", () => {
    // 2026-04-20 — week 17 of 2026 per ISO (Mondays anchor weeks).
    const w = isoWeekFromCalendar(2026, 4, 20);
    expect(w.isoWeekYear).toBe(2026);
    expect(w.isoWeekNumber).toBe(17);
  });

  it("handles year boundaries — 2025-12-29 is ISO 2026-W01", () => {
    const w = isoWeekFromCalendar(2025, 12, 29);
    expect(w.isoWeekYear).toBe(2026);
    expect(w.isoWeekNumber).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// weeklyReportLockKey
// ---------------------------------------------------------------------------

describe("weeklyReportLockKey", () => {
  it("zero-pads the week number", () => {
    expect(weeklyReportLockKey("abc", 2026, 17)).toBe("weekly_report_abc_2026-W17");
    expect(weeklyReportLockKey("abc", 2026, 1)).toBe("weekly_report_abc_2026-W01");
  });
});

// ---------------------------------------------------------------------------
// decideWeeklyReportFire
// ---------------------------------------------------------------------------

describe("decideWeeklyReportFire", () => {
  const tz = "America/Chicago";

  it("fires at Monday 7:00 local — primary window", () => {
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 20, 7, 0);
    const d = decideWeeklyReportFire("org-1", tz, false, now);
    expect(d.fire).toBe(true);
    expect(d.reason).toBe("primary_window");
  });

  it("fires at Monday 7:59 local — still primary window", () => {
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 20, 7, 59);
    const d = decideWeeklyReportFire("org-1", tz, false, now);
    expect(d.fire).toBe(true);
    expect(d.reason).toBe("primary_window");
  });

  it("does NOT fire at Monday 6:59 local — before window", () => {
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 20, 6, 59);
    const d = decideWeeklyReportFire("org-1", tz, false, now);
    expect(d.fire).toBe(false);
    expect(d.reason).toBe("outside_window");
  });

  it("fires at Monday 10am (catch-up) if lock is missing", () => {
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 20, 10, 0);
    const d = decideWeeklyReportFire("org-1", tz, false, now);
    expect(d.fire).toBe(true);
    expect(d.reason).toBe("catchup_window");
  });

  it("does NOT fire Monday 10am when lock is already held (idempotency)", () => {
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 20, 10, 0);
    const d = decideWeeklyReportFire("org-1", tz, true, now);
    expect(d.fire).toBe(false);
    expect(d.reason).toBe("lock_held");
  });

  it("fires Tuesday 6:59am (catch-up trailing edge) when lock missing", () => {
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 21, 6, 59);
    const d = decideWeeklyReportFire("org-1", tz, false, now);
    expect(d.fire).toBe(true);
    expect(d.reason).toBe("catchup_window");
  });

  it("does NOT fire Tuesday 7:00am — outside window", () => {
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 21, 7, 0);
    const d = decideWeeklyReportFire("org-1", tz, false, now);
    expect(d.fire).toBe(false);
    expect(d.reason).toBe("outside_window");
  });

  it("does NOT fire Wednesday even when lock is missing", () => {
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 22, 10, 0);
    const d = decideWeeklyReportFire("org-1", tz, false, now);
    expect(d.fire).toBe(false);
    expect(d.reason).toBe("outside_window");
  });

  it("lock_held wins over primary window", () => {
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 20, 7, 30);
    const d = decideWeeklyReportFire("org-1", tz, true, now);
    expect(d.fire).toBe(false);
    expect(d.reason).toBe("lock_held");
  });

  it("produces a stable lock key tied to the local ISO week", () => {
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 20, 7, 0);
    const d = decideWeeklyReportFire("org-1", tz, false, now);
    expect(d.lockKey).toBe("weekly_report_org-1_2026-W17");
  });
});

// ---------------------------------------------------------------------------
// runWeeklyReportScheduler — orchestration tests (injectable deps)
// ---------------------------------------------------------------------------

describe("runWeeklyReportScheduler (orchestration)", () => {
  const tz = "America/Chicago";

  function makeRecorder() {
    const activityLogs: Array<Record<string, unknown>> = [];
    const writeActivityLog = async (e: {
      organizationId: string;
      action: string;
      entityType: string;
      entityId: string;
      metadata: Record<string, unknown>;
    }) => {
      activityLogs.push(e);
    };
    return { activityLogs, writeActivityLog };
  }

  const noLock = async () => undefined;
  const acquireOk = async () => true;

  it("calls send for an org in the window and records weekly_report_sent", async () => {
    const org = makeOrg("org-1", "Serra Honda", tz);
    const sendCalls: string[] = [];
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 20, 7, 15);
    const { activityLogs, writeActivityLog } = makeRecorder();

    const result: SendWeeklyReportResult = {
      sent: true,
      messageId: "msg-abc",
      to: ["admin@dealer.com"],
      cc: ["partner@group.com"],
      bcc: ["duane.wells@huminic.ai"],
      narrativeWordCount: 180,
    };

    await runWeeklyReportScheduler({
      listProductionOrgs: async () => [org],
      getLock: noLock,
      acquireLock: acquireOk,
      send: async (orgId) => {
        sendCalls.push(orgId);
        return result;
      },
      writeActivityLog,
      now,
    });

    expect(sendCalls).toEqual(["org-1"]);
    expect(activityLogs.length).toBe(1);
    expect(activityLogs[0].action).toBe("weekly_report_sent");
    expect(activityLogs[0].organizationId).toBe("org-1");
    const meta = activityLogs[0].metadata as Record<string, unknown>;
    expect(meta.messageId).toBe("msg-abc");
    expect(meta.to).toEqual(["admin@dealer.com"]);
    expect(meta.cc).toEqual(["partner@group.com"]);
    expect(meta.reason).toBe("primary_window");
    expect(meta.lockKey).toBe("weekly_report_org-1_2026-W17");
  });

  it("skips send when lock is already held — idempotency", async () => {
    const org = makeOrg("org-1", "Serra Honda", tz);
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 20, 7, 15);
    const sendCalls: string[] = [];
    const { activityLogs, writeActivityLog } = makeRecorder();

    await runWeeklyReportScheduler({
      listProductionOrgs: async () => [org],
      getLock: async () => ({ lockedAt: new Date() }),
      acquireLock: acquireOk,
      send: async (orgId) => {
        sendCalls.push(orgId);
        return {
          sent: true,
          to: [],
          cc: [],
          bcc: [],
        };
      },
      writeActivityLog,
      now,
    });

    expect(sendCalls).toEqual([]); // send never invoked
    expect(activityLogs.length).toBe(0); // nothing to log
  });

  it("logs weekly_report_skipped with validationFailures when validation fails", async () => {
    const org = makeOrg("org-1", "Serra Honda", tz);
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 20, 7, 0);
    const { activityLogs, writeActivityLog } = makeRecorder();

    const result: SendWeeklyReportResult = {
      sent: false,
      to: ["admin@dealer.com"],
      cc: ["partner@group.com"],
      bcc: ["duane.wells@huminic.ai"],
      skipReason: "validation_failed",
      validationFailures: [
        "aiNarrative missing",
        "toneInterstitial missing",
      ],
    };

    let sendCalled = false;
    await runWeeklyReportScheduler({
      listProductionOrgs: async () => [org],
      getLock: noLock,
      acquireLock: acquireOk,
      send: async () => {
        sendCalled = true;
        return result;
      },
      writeActivityLog,
      now,
    });

    expect(sendCalled).toBe(true);
    expect(activityLogs.length).toBe(1);
    expect(activityLogs[0].action).toBe("weekly_report_skipped");
    const meta = activityLogs[0].metadata as Record<string, unknown>;
    expect(meta.skipReason).toBe("validation_failed");
    expect(meta.validationFailures).toEqual([
      "aiNarrative missing",
      "toneInterstitial missing",
    ]);
    expect(meta.messageId).toBe(null);
  });

  it("continues processing remaining orgs when one throws — error isolation", async () => {
    const orgs = [
      makeOrg("org-1", "Serra Honda", tz),
      makeOrg("org-2", "Serra Nissan", tz),
      makeOrg("org-3", "Tony Serra Ford", tz),
    ];
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 20, 7, 10);
    const sendCalls: string[] = [];
    const { activityLogs, writeActivityLog } = makeRecorder();

    await runWeeklyReportScheduler({
      listProductionOrgs: async () => orgs,
      getLock: noLock,
      acquireLock: acquireOk,
      send: async (orgId) => {
        sendCalls.push(orgId);
        if (orgId === "org-2") {
          throw new Error("simulated send explosion");
        }
        return {
          sent: true,
          messageId: `msg-${orgId}`,
          to: [`admin-${orgId}@dealer.com`],
          cc: ["partner@group.com"],
          bcc: ["duane.wells@huminic.ai"],
          narrativeWordCount: 150,
        };
      },
      writeActivityLog,
      now,
    });

    // All three orgs attempted — loop didn't break.
    expect(sendCalls).toEqual(["org-1", "org-2", "org-3"]);

    const actions = activityLogs.map((a) => a.action);
    expect(actions).toContain("weekly_report_sent");
    expect(actions).toContain("weekly_report_error");
    expect(actions.filter((a) => a === "weekly_report_sent")).toHaveLength(2);

    const errLog = activityLogs.find((a) => a.organizationId === "org-2")!;
    expect(errLog.action).toBe("weekly_report_error");
    const errMeta = errLog.metadata as Record<string, unknown>;
    expect(String(errMeta.error)).toContain("simulated send explosion");
  });

  it("passes safetyBcc=null when WEEKLY_REPORT_SAFETY_BCC_DISABLED=1, otherwise the operator email", async () => {
    const org = makeOrg("org-1", "Serra Honda", tz);
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 20, 7, 0);
    const observed: Array<string | null | undefined> = [];
    const { writeActivityLog } = makeRecorder();

    const scenario = async (envValue: string | undefined) => {
      const prior = process.env.WEEKLY_REPORT_SAFETY_BCC_DISABLED;
      if (envValue === undefined) {
        delete process.env.WEEKLY_REPORT_SAFETY_BCC_DISABLED;
      } else {
        process.env.WEEKLY_REPORT_SAFETY_BCC_DISABLED = envValue;
      }
      try {
        await runWeeklyReportScheduler({
          listProductionOrgs: async () => [org],
          getLock: noLock,
          acquireLock: acquireOk,
          send: async (_orgId, opts) => {
            observed.push(opts?.safetyBcc);
            return {
              sent: true,
              messageId: "m",
              to: ["admin@dealer.com"],
              cc: ["partner@group.com"],
              bcc: [],
            };
          },
          writeActivityLog,
          now,
        });
      } finally {
        if (prior === undefined) {
          delete process.env.WEEKLY_REPORT_SAFETY_BCC_DISABLED;
        } else {
          process.env.WEEKLY_REPORT_SAFETY_BCC_DISABLED = prior;
        }
      }
    };

    await scenario(undefined);
    await scenario("1");

    expect(observed).toEqual(["duane.wells@huminic.ai", null]);
  });

  it("outside-window orgs are silently skipped (no send, no log)", async () => {
    const org = makeOrg("org-1", "Serra Honda", tz);
    // Wednesday 10am local
    const now = dateAtLocalTimeInTz(tz, 2026, 4, 22, 10, 0);
    const sendCalls: string[] = [];
    const { activityLogs, writeActivityLog } = makeRecorder();

    await runWeeklyReportScheduler({
      listProductionOrgs: async () => [org],
      getLock: noLock,
      acquireLock: acquireOk,
      send: async (orgId) => {
        sendCalls.push(orgId);
        return {
          sent: true,
          to: [],
          cc: [],
          bcc: [],
        };
      },
      writeActivityLog,
      now,
    });

    expect(sendCalls).toEqual([]);
    expect(activityLogs.length).toBe(0);
  });
});
