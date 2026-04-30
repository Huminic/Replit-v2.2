/**
 * Daily Recap fire decision (pure function, separated for testability).
 *
 * Mirrors the weekly-report decision shape but uses a per-day lock key and
 * a per-org configurable hour-of-day. Default hour: 18 (6 PM local).
 */

import { getLocalTimeInTz, type LocalTimeInfo } from "./scheduler";
import type { Organization } from "@shared/schema";

const DEFAULT_RECAP_HOUR = 18;

export interface DailyRecapDecision {
  fire: boolean;
  reason:
    | "feature_disabled"
    | "lock_held"
    | "primary_window"
    | "catchup_window"
    | "outside_window"
    | "hour_invalid";
  local: LocalTimeInfo;
  /** local calendar year/month/day in the org's tz (separate from LocalTimeInfo.day = weekday) */
  calendarYear: number;
  calendarMonth: number;
  calendarDay: number;
  /** "YYYY-MM-DD" in the org's local tz */
  localDate: string;
  lockKey: string;
}

export function dailyRecapLockKey(orgId: string, year: number, month: number, day: number): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `daily_recap_${orgId}_${year}-${pad(month)}-${pad(day)}`;
}

/**
 * Pure decision: should the recap fire for this org on this tick?
 *
 * Fires when:
 *   - settings.dailyRecapEnabled === true
 *   - lock not held
 *   - local hour matches recap hour (primary), or is past the recap hour same day (catch-up)
 */
export function decideDailyRecapFire(
  org: Pick<Organization, "id" | "settings">,
  lockHeld: boolean,
  now: Date = new Date(),
): DailyRecapDecision {
  const settings = (org.settings as Record<string, unknown>) || {};
  const tz = typeof settings.timezone === "string" ? (settings.timezone as string) : null;
  const local = getLocalTimeInTz(tz, now);

  // Extract calendar year/month/day from the localTimestamp ("YYYY-MM-DD HH:MM").
  const dateMatch = local.localTimestamp.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const calendarYear = dateMatch ? parseInt(dateMatch[1], 10) : 0;
  const calendarMonth = dateMatch ? parseInt(dateMatch[2], 10) : 0;
  const calendarDay = dateMatch ? parseInt(dateMatch[3], 10) : 0;
  const pad = (n: number) => n.toString().padStart(2, "0");
  const localDate = `${calendarYear}-${pad(calendarMonth)}-${pad(calendarDay)}`;
  const lockKey = dailyRecapLockKey(org.id, calendarYear, calendarMonth, calendarDay);
  const baseDecision = { local, calendarYear, calendarMonth, calendarDay, localDate, lockKey };

  if (settings.dailyRecapEnabled !== true) {
    return { fire: false, reason: "feature_disabled", ...baseDecision };
  }

  // Allow per-org override of recap hour. Validate 0-23.
  const rawHour = (settings as Record<string, unknown>).dailyRecapHour;
  let recapHour = DEFAULT_RECAP_HOUR;
  if (typeof rawHour === "number" && Number.isInteger(rawHour) && rawHour >= 0 && rawHour <= 23) {
    recapHour = rawHour;
  } else if (rawHour !== undefined) {
    return { fire: false, reason: "hour_invalid", ...baseDecision };
  }

  if (lockHeld) {
    return { fire: false, reason: "lock_held", ...baseDecision };
  }

  if (local.hour === recapHour) {
    return { fire: true, reason: "primary_window", ...baseDecision };
  }

  // Catch-up: same local day, hour past the configured recap hour.
  if (local.hour > recapHour) {
    return { fire: true, reason: "catchup_window", ...baseDecision };
  }

  return { fire: false, reason: "outside_window", ...baseDecision };
}
