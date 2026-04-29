/**
 * Pre-launch SMS fail-closed guard.
 *
 * Sits at the SMS provider chokepoint (`server/outbound.ts:sendSmsRaw`),
 * the only function that calls the SMS provider via
 * `callMCP("tm_send_message", ...)`. Phase 1 investigation
 * (evidence/sms-guard-investigation-2026-04-27.md, commit fc59c1c) found
 * that two existing callers (sendStopConfirmation, direct sendSms) reach
 * sendSmsRaw without going through processOutboundSend's CommGate +
 * test-lane chain. Anything higher than sendSmsRaw therefore leaves at
 * least one provider-reachable path uncovered.
 *
 * Behavior (matches operator spec 2026-04-27):
 *
 *   PRELAUNCH_SMS_LOCK=true (default) OR TESTLANE_MODE=true:
 *     - Recipient is on .claude/state/test-recipients.txt allowlist
 *       (any category) → ALLOW (continue to provider call).
 *     - Otherwise → BLOCK before provider call.
 *
 *   PRELAUNCH_SMS_LOCK=false AND TESTLANE_MODE=false:
 *     - Guard inert; no behavior change.
 *
 * Critical safety properties (every test in
 * tests/unit/preLaunchSmsGuard.test.ts asserts at least one of these):
 *
 *   - bypassBusinessHours=true does NOT bypass this guard. The guard
 *     does not consult bypassBusinessHours at all; that flag lives on
 *     SendRequest at a higher layer.
 *   - Missing/empty allowlist file → fail-closed (BLOCK all).
 *   - Empty/null/whitespace recipient → fail-closed (BLOCK).
 *   - Phone normalization handles +1XXXXXXXXXX ↔ XXXXXXXXXX equivalence
 *     so allowlist entries in either format match the same recipient.
 *
 * Scope: SMS only. The guard is invoked exclusively from sendSmsRaw.
 * No impact on VAPI voice, ADF email, weekly reports, VIN sync, Tavus,
 * or dashboard.
 *
 * Pure-function design: the export `evaluatePreLaunchSmsGuard` takes
 * (recipient, env, loadAllowlist) so unit tests can drive it without
 * touching the filesystem. The production wrapper
 * `evaluatePreLaunchSmsGuardWithDefaults` provides a default loader
 * that reads `.claude/state/test-recipients.txt`.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Subset of process.env consulted by the guard. */
export interface PreLaunchSmsGuardEnv {
  PRELAUNCH_SMS_LOCK?: string | undefined;
  TESTLANE_MODE?: string | undefined;
}

/** Decision returned by the guard. */
export interface PreLaunchSmsGuardResult {
  /** true → upstream caller may proceed to the provider; false → BLOCK. */
  allow: boolean;
  /** Human-readable reason. Always populated. */
  reason: string;
  /**
   * Why the guard is engaged or not. `inert` means PRELAUNCH_SMS_LOCK and
   * TESTLANE_MODE were both off; the guard returned allow=true without
   * inspecting the allowlist or recipient at all.
   */
  mode: "inert" | "allow_allowlisted" | "block_no_recipient" | "block_allowlist_missing" | "block_allowlist_empty" | "block_not_on_allowlist";
}

// ---------------------------------------------------------------------------
// Allowlist loader
// ---------------------------------------------------------------------------

/**
 * Default allowlist path — `.claude/state/test-recipients.txt` resolved
 * relative to the project root. Honors CLAUDE_PROJECT_DIR if set so this
 * remains robust under PM2, dev, and build invocations.
 */
export function defaultAllowlistPath(): string {
  const root = process.env.CLAUDE_PROJECT_DIR && process.env.CLAUDE_PROJECT_DIR.length > 0
    ? process.env.CLAUDE_PROJECT_DIR
    : process.cwd();
  return resolve(root, ".claude/state/test-recipients.txt");
}

/**
 * Default loader: reads the allowlist file and returns the parsed
 * normalized entries. Throws on file-missing / unreadable; the guard
 * treats throw + empty array equivalently as fail-closed BLOCK.
 *
 * Caller-injected loaders (in tests) skip this and provide entries
 * directly.
 */
export function loadAllowlistDefault(path: string = defaultAllowlistPath()): string[] {
  const text = readFileSync(path, "utf-8");
  return parseAllowlist(text);
}

/**
 * Parse the allowlist text format. The file uses lines of the form:
 *
 *   <entry>                       — bare entry, treated as approved
 *   <category>:<entry>            — categorized entry; only the value
 *                                   after the FIRST colon counts
 *   # comment                     — ignored
 *   (blank lines)                 — ignored
 *
 * Each surviving entry is normalized:
 *   - phone-shaped values → digits-only (e.g. +14126546500 → 14126546500)
 *   - everything else (emails, symbolic names) → trimmed lowercase
 *
 * The guard match function emits BOTH a 10-digit and an 11-digit-with-1
 * variant for any 10/11-digit phone candidate, so allowlist entries in
 * either form match the same recipient.
 */
export function parseAllowlist(text: string): string[] {
  const out: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) continue;
    if (line.startsWith("#")) continue;
    // Strip an inline comment if any: "value  # comment".
    const valuePart = line.split("#", 1)[0].trim();
    if (valuePart.length === 0) continue;
    // If a colon is present, take the part after the FIRST colon as the
    // value (everything before is the category label).
    const colonIdx = valuePart.indexOf(":");
    const value = colonIdx >= 0 ? valuePart.slice(colonIdx + 1).trim() : valuePart;
    if (value.length === 0) continue;
    const norm = normalizeAllowlistEntry(value);
    if (norm.length > 0) out.push(norm);
  }
  return out;
}

/**
 * Normalize a single allowlist entry. Phone-shaped inputs become digits-
 * only; everything else becomes trimmed lowercase.
 */
function normalizeAllowlistEntry(v: string): string {
  const trimmed = v.trim();
  // If it looks like a phone (any leading +, then digits/space/dashes/parens
  // and at least 7 digits total), normalize to digits-only.
  const digits = trimmed.replace(/[^\d]/g, "");
  if (digits.length >= 7 && /^[+\d\s\-().]+$/.test(trimmed)) {
    return digits;
  }
  return trimmed.toLowerCase();
}

// ---------------------------------------------------------------------------
// Recipient normalization
// ---------------------------------------------------------------------------

/**
 * Generate the equivalent normalized forms of a phone-shaped recipient.
 * For a 10-digit local NANP number (e.g. 4126546500) we emit BOTH the
 * 10-digit and the 1-prefixed 11-digit form so that allowlist entries in
 * either format match.
 */
function recipientPhoneVariants(recipient: string): string[] {
  const digits = recipient.replace(/[^\d]/g, "");
  const variants = new Set<string>();
  if (digits.length > 0) variants.add(digits);
  if (digits.length === 10) variants.add("1" + digits);
  if (digits.length === 11 && digits.startsWith("1")) variants.add(digits.slice(1));
  return [...variants];
}

// ---------------------------------------------------------------------------
// Guard
// ---------------------------------------------------------------------------

/**
 * True iff the guard is engaged (PRELAUNCH_SMS_LOCK on OR TESTLANE_MODE on).
 * Defaults: PRELAUNCH_SMS_LOCK is treated as "true" when unset (operator
 * instruction 2026-04-27: "default true for safety until operator
 * explicitly clears it"). TESTLANE_MODE defaults to off.
 */
export function isPreLaunchSmsGuardEngaged(env: PreLaunchSmsGuardEnv): boolean {
  const lock = env.PRELAUNCH_SMS_LOCK;
  // "true" or unset/empty → on. Only an explicit "false" turns it off.
  const lockOn = lock === undefined || lock === "" || lock.toLowerCase() === "true";
  const testLaneOn = env.TESTLANE_MODE === "true";
  return lockOn || testLaneOn;
}

/**
 * Pure decision function. The injected `loadAllowlist` callable is invoked
 * lazily — only when the guard is engaged AND the recipient is non-empty.
 * If the loader throws, the guard treats that as a missing allowlist and
 * fails closed.
 */
export function evaluatePreLaunchSmsGuard(
  recipient: string | null | undefined,
  env: PreLaunchSmsGuardEnv,
  loadAllowlist: () => string[],
): PreLaunchSmsGuardResult {
  if (!isPreLaunchSmsGuardEngaged(env)) {
    return {
      allow: true,
      mode: "inert",
      reason: "prelaunch-sms-lock: guard inert (PRELAUNCH_SMS_LOCK and TESTLANE_MODE both off)",
    };
  }

  // Empty / null / whitespace recipient → fail-closed BLOCK.
  if (!recipient || String(recipient).trim().length === 0) {
    return {
      allow: false,
      mode: "block_no_recipient",
      reason: "prelaunch-sms-lock: empty recipient",
    };
  }

  // Load allowlist. Loader throw → BLOCK (fail-closed on missing file).
  let entries: string[];
  try {
    entries = loadAllowlist();
  } catch (err: any) {
    return {
      allow: false,
      mode: "block_allowlist_missing",
      reason: `prelaunch-sms-lock: allowlist file unreadable (${err?.message ?? "unknown error"})`,
    };
  }

  if (!entries || entries.length === 0) {
    return {
      allow: false,
      mode: "block_allowlist_empty",
      reason: "prelaunch-sms-lock: allowlist empty (fail-closed)",
    };
  }

  // Build the variant set the recipient could match. We accept any
  // form: phone-shaped → digits + 10/11 reciprocal; otherwise → trimmed
  // lowercase string match against the allowlist's lowercase normalized
  // entries.
  const trimmed = String(recipient).trim();
  const candidates = new Set<string>();
  candidates.add(trimmed.toLowerCase());
  for (const v of recipientPhoneVariants(trimmed)) candidates.add(v);

  const allowed = entries.find((e) => candidates.has(e));
  if (allowed) {
    return {
      allow: true,
      mode: "allow_allowlisted",
      reason: `prelaunch-sms-lock: recipient on allowlist (matched '${allowed}')`,
    };
  }

  return {
    allow: false,
    mode: "block_not_on_allowlist",
    reason: `prelaunch-sms-lock: recipient not on allowlist`,
  };
}

/**
 * Production wrapper — uses the default file-system loader. Callers in
 * server code should use this; tests should call evaluatePreLaunchSmsGuard
 * directly with an injected loadAllowlist.
 */
export function evaluatePreLaunchSmsGuardWithDefaults(
  recipient: string | null | undefined,
): PreLaunchSmsGuardResult {
  return evaluatePreLaunchSmsGuard(
    recipient,
    {
      PRELAUNCH_SMS_LOCK: process.env.PRELAUNCH_SMS_LOCK,
      TESTLANE_MODE: process.env.TESTLANE_MODE,
    },
    () => loadAllowlistDefault(),
  );
}
