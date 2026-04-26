/**
 * Pure test-lane guard helpers.
 *
 * These functions read process.env at call time and perform no IO. They are
 * extracted from larger callers (server/outbound.ts:processOutboundSend,
 * server/routes/webhooks.ts:submitAdfLead, server/services/notificationService
 * .ts:sendAIFollowUpNotification + sendWeeklyReportEmail) so they can be
 * unit-tested without DB / storage / provider mocks.
 *
 * Two-way fail-closed contract (uniform across guards):
 *   TESTLANE_MODE=true  + no marker present -> blocked
 *   TESTLANE_MODE!=true + marker present    -> blocked (defensive)
 *   TESTLANE_MODE=true  + marker + missing TESTLANE_*_TO -> blocked
 *   TESTLANE_MODE=true  + marker + env set  -> override / hard-route
 *   else                                    -> pass-through
 *
 * The ADF guard has a different contract because ADF_MODE (not a TESTLANE_*_TO
 * recipient) is the operator-controlled outlet. See evaluateAdfTestLaneGuard.
 */

// ---------------------------------------------------------------------------
// ADF (VIN dealer-intake email) guard
// ---------------------------------------------------------------------------

export interface AdfGuardInput {
  customerName?: string | null;
  transcript?: string | null;
  summary?: string | null;
  callId?: string | null;
}

export type AdfGuardResult =
  | { kind: "pass" }
  | { kind: "blocked"; mode: string; reason: string };

/**
 * Pure ADF test-lane guard. Refuses to emit an ADF when:
 *   1) TESTLANE_MODE=true but ADF_MODE != 'test'  (mode misconfig)
 *   2) lead-is-[TESTLANE] but ADF_MODE == 'live'  (would leak to real dealer)
 *   3) lead-is-[TESTLANE] but TESTLANE_MODE != 'true' (decoupled)
 * Otherwise returns pass.
 *
 * Note the asymmetry vs. the recipient-side guards: TESTLANE_MODE=true with no
 * lead-is-[TESTLANE] marker is allowed AS LONG AS ADF_MODE='test'. Rationale:
 * test-lane sessions may legitimately exercise non-TESTLANE-marked code paths
 * to verify guard rejection itself. The fail-closed posture comes from
 * ADF_MODE — when TESTLANE_MODE is on, ADF_MODE MUST be 'test'.
 */
export function evaluateAdfTestLaneGuard(input: AdfGuardInput): AdfGuardResult {
  const adfMode = (process.env.ADF_MODE || "live").toLowerCase();
  const testLaneEnv = process.env.TESTLANE_MODE === "true";
  const leadIsTestLane =
    (input.customerName || "").includes("[TESTLANE]") ||
    (input.transcript || "").includes("[TESTLANE]") ||
    (input.summary || "").includes("[TESTLANE]") ||
    (input.callId || "").toLowerCase().startsWith("testlane-");

  if (testLaneEnv && adfMode !== "test") {
    return {
      kind: "blocked",
      mode: `testlane-adf-misconfig-${adfMode}`,
      reason: `TESTLANE_MODE=true but ADF_MODE=${adfMode} — refusing to send (fail-closed)`,
    };
  }
  if (leadIsTestLane && adfMode === "live") {
    return {
      kind: "blocked",
      mode: "testlane-lead-but-live-adf",
      reason:
        "Lead is [TESTLANE]-marked but ADF_MODE=live — refusing to emit ADF to real dealer intake (fail-closed)",
    };
  }
  if (leadIsTestLane && !testLaneEnv) {
    return {
      kind: "blocked",
      mode: "testlane-lead-but-mode-off",
      reason:
        "Lead is [TESTLANE]-marked but TESTLANE_MODE!=true — refusing (fail-closed)",
    };
  }
  return { kind: "pass" };
}
