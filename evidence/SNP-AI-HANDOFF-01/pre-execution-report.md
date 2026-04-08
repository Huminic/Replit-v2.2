# Pre-Execution Report — SNP-AI-HANDOFF-01

**Sprint:** SNP-AI-HANDOFF-01
**Title:** AI handoff fixes — race condition, return-to-AI button, deleted agent handling
**Branch:** wave-pe3
**Priority:** P1
**Date:** 2026-04-08
**Author:** Scribe Agent

---

## Objective

Fix three related bugs in the AI/human handoff system for SMS conversations:

1. **B07 — AI race condition in `server/routes/sms.ts`.**
   The current code checks `freshConversation.assignedTo` at line ~469 to guard the AI path. However, the gap between that check and the actual SMS send via `processOutboundSend` (~line 526) is wide enough for a human takeover to happen in the interim. The AI fires anyway.
   Fix: add a second `assignedTo` check immediately before calling `processOutboundSend`. If `assignedTo` is now set, abort the send silently.

2. **B08 — No "Return to AI" button in `client/src/pages/teambox.tsx`.**
   Once a conversation is assigned to a human (`assignedTo` is set), there is no UI affordance to restore AI auto-response. Operators must find the assignment dropdown.
   Fix: add a clearly labeled "Return to AI" button on conversations where `assignedTo` is non-null. Clicking it calls the assignment API with `assignedTo: null`, restoring the AI path.

3. **B09 — Deleted agent with active conversations in `server/routes/agents.ts`.**
   When an agent is deleted, the code does nothing to notify operators that AI has gone offline for that channel. Conversations silently stop receiving AI responses.
   Fix: on agent deletion, check if the deleted agent was the only active SMS agent for that org. If so, create a task/alert record that surfaces in TeamBox, alerting operators that AI is offline for SMS.

---

## Declared Files

Application code files to be modified:

| File | Location | Change |
|------|----------|--------|
| `server/routes/sms.ts` | ~line 526 (before `processOutboundSend`) | Add second `assignedTo` re-check immediately before send |
| `client/src/pages/teambox.tsx` | Conversation detail / action area | Add "Return to AI" button that sets `assignedTo=null` |
| `server/routes/agents.ts` | `DELETE /api/agents/:id` handler (~line 164) | After deletion, check if last active SMS agent; create alert task if so |

Evidence files to be created:

| File | Purpose |
|------|---------|
| `evidence/SNP-AI-HANDOFF-01/pre-execution-report.md` | This file |
| `evidence/SNP-AI-HANDOFF-01/post-sprint-report.md` | AC results + test execution output |

---

## Acceptance Criteria

Copied verbatim from sprint specification:

| ID | Criterion |
|----|-----------|
| AC1 | After human takeover, even if a brief delay occurs, the AI does NOT send a message — the second `assignedTo` check before send prevents it |
| AC2 | TeamBox shows a "Return to AI" button on conversations with `assignedTo` set. Clicking it sets `assignedTo=null` and restores AI auto-response. |
| AC3 | Deleting the last active SMS agent for an org creates a task/alert visible in TeamBox alerting operators that AI is offline for SMS |
| AC4 | Conversations with deleted agents continue to receive and store customer messages — no data loss |
| AC5 | No regression on normal AI auto-response behavior |

---

## Test Plan

### F1 — Race condition guard (AC1)
- Set up a test conversation for a test org (e.g., Serra Honda) with inbound SMS processing active.
- Simulate the race: trigger an inbound SMS, then immediately take over the conversation (set `assignedTo` via API) before AI processing completes.
- Verify in PM2 logs and `outbound_log` that no AI SMS was sent after the takeover.
- For deterministic verification, add a short artificial delay in the SMS processing path during test, or inspect the guard directly in code.
- Evidence: PM2 log excerpt showing "AI paused — human takeover active" at the second check point (or no outbound send log entry after takeover).

### F2 — Return to AI button (AC2)
- In TeamBox, navigate to a conversation that has `assignedTo` set (human-taken-over).
- Verify the "Return to AI" button is visible in the conversation action area.
- Click the button.
- Verify the conversation's `assignedTo` is now null (confirmed via API or UI state refresh).
- Send a new inbound SMS to that conversation. Verify the AI responds.
- Evidence: screenshots showing (a) button visible, (b) button clicked / assignment cleared, (c) AI response received.

### F3 — Deleted agent alert (AC3)
- Log in as `serra_honda@huminic.ai` (org_admin).
- Navigate to Settings > Agents for Serra Honda.
- Identify the only active SMS agent.
- Delete it.
- Navigate to TeamBox.
- Verify a task or alert of type "agent_offline" (or equivalent) is visible, indicating AI is offline for SMS.
- Evidence: screenshot of the alert/task in TeamBox.

### F4 — Message continuity after agent deletion (AC4)
- After completing F3 (deleted SMS agent), send an inbound SMS to the Serra Honda test number.
- Verify the message is stored and appears in TeamBox (conversation and message records exist).
- Verify no server error is thrown during inbound processing.
- Evidence: TeamBox screenshot showing the new message; PM2 logs showing clean processing.

### F5 — Normal AI auto-response regression (AC5)
- On a test org that still has an active SMS agent (e.g., Serra Nissan or Columbia Hyundai), send an inbound SMS to a conversation with `assignedTo=null`.
- Verify the AI responds automatically within normal processing time.
- Evidence: PM2 log showing AI processing and send; TeamBox screenshot showing AI message.

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Second `assignedTo` check adds a DB query on every AI SMS processing path | Medium | Low | One additional `getConversation` call is negligible; current code already does this at line ~464 |
| "Return to AI" button appears on all conversations regardless of channel | Low | Low | Button should be conditionally rendered only on conversations with `assignedTo !== null` |
| Agent deletion alert creation fails silently and AC3 is not met | Low | High | Alert creation must not be fire-and-forget; wrap in try/catch and log failure explicitly |
| Checking "last active SMS agent" requires a storage query that does not yet exist | Medium | Medium | Builder must verify `storage.getAgents()` supports filtering by channel and status; if not, a direct query may be needed |
| "Return to AI" button in teambox.tsx conflicts with existing assignment UI | Low | Medium | Builder must read the current teambox.tsx assignment area before implementing to avoid layout conflicts |
| The race condition fix changes timing-sensitive code in the critical SMS inbound path | Medium | High | Must test F5 regression thoroughly. The second check must only abort if `assignedTo` is set — must not abort for any other reason |

Overall risk: **Medium**. The race condition fix touches the core SMS inbound path. The UI button and agent deletion alert are lower risk. Careful testing of F5 is essential.

---

## Implementation Constraints

### sms.ts — Second assignedTo check
- The second check must be placed immediately before the `processOutboundSend` call (after the Anthropic API call returns but before the send).
- Re-query `storage.getConversation(conversation.id)` again at that point and check `assignedTo`.
- If set: log "[SMS AI] Aborting send — human takeover detected at pre-send check" and return without sending.
- If not set: proceed to send as normal.

### teambox.tsx — Return to AI button
- Render only when `conversation.assignedTo !== null`.
- On click: call `PATCH /api/conversations/:id` with `{ assignedTo: null }` (or equivalent existing endpoint).
- After successful call: refresh conversation state so the button disappears and the assignment indicator clears.
- Button label: "Return to AI" (exact per sprint spec).
- Do not modify the existing assignment dropdown — this is an additive UI element only.

### agents.ts — Deleted agent alert
- After `storage.deleteAgent(...)` succeeds, run:
  1. Get all agents for the org: `storage.getAgents(organizationId)`.
  2. Check if any remaining agent is `status === 'active' && type === 'ai' && channels includes 'sms'`.
  3. If none: create a task record with type `agent_offline` (or `alert`), linked to the org, with a message indicating SMS AI is offline.
- The task creation must use the existing task/alert storage method. Builder must verify which method to use.
- This check is SMS-specific per the sprint spec. Email channel is out of scope for this sprint.

---

## Entry Gates

| Gate | Check | Status |
|------|-------|--------|
| A1 | No blocking dependency declared | PASS — no `dependsOn` specified in sprint specification |
| A2 | Source files verified to exist at declared paths | PASS — `sms.ts` (619 lines), `teambox.tsx` (present), `agents.ts` (188 lines) all confirmed |
| A3 | Race condition location verified in source | PASS — `assignedTo` check confirmed at ~line 469; `processOutboundSend` call confirmed at ~line 526; the gap is real and spans 57 lines including the Anthropic API call |
| A4 | Agent delete handler verified in source | PASS — `DELETE /api/agents/:id` handler confirmed at line 164; currently does NOT check for last-agent condition |
| A5 | ACs are testable | PASS — each AC maps to a concrete, executable test |
| A6 | No undeclared files in scope | PASS — 3 app files, 2 evidence files only |
| A7 | UI change in teambox.tsx is permitted | NOTE — uiPermissions not yet registered in sprints.json (sprint object not yet created). Operator's explicit file declaration in sprint specification constitutes authorization. Builder should confirm before touching teambox.tsx. |
| A8 | Risk level acceptable for P1 sniper sprint | PASS — Medium risk is appropriate and acknowledged; F5 regression test is mandatory |

---

## Ghost Entry Gate

**Reviewed by:** Ghost Agent
**Date:** 2026-04-08

### Verification Checklist

1. **Objective present and accurate?** YES — Objective section describes all three bugs (B07, B08, B09) and the exact fix for each, with file and approximate line references.

2. **Declared files match sprint specification?** YES — Three application files declared match the sprint specification exactly. All three files confirmed present and read at correct paths.

3. **ACs copied accurately?** YES — All five ACs (AC1–AC5) are present and match the sprint specification verbatim.

4. **Test plan covers every AC?** YES — F1→AC1, F2→AC2, F3→AC3, F4→AC4, F5→AC5. Each test is concrete and executable.

5. **No undeclared files in scope?** YES — Only the three declared application files and two evidence files are in scope.

6. **Risk analysis present and credible?** YES — Six risks identified; the most significant (race condition touching critical SMS path) is correctly rated High impact and the F5 regression is explicitly flagged as mandatory. Overall Medium risk assessment is appropriate and well-reasoned.

7. **Entry gates evaluated?** YES — Eight gates evaluated; one carries a legitimate NOTE about uiPermissions registration that does not block execution.

8. **Source file line numbers verified against actual source?** YES:
   - `sms.ts`: `assignedTo` guard confirmed at line 469; `processOutboundSend` confirmed at line 526. The 57-line gap (spanning the Anthropic API call) confirms B07 is a real, exploitable race condition.
   - `agents.ts`: `DELETE` handler confirmed at line 164; no last-agent check present — B09 is confirmed real.
   - `teambox.tsx`: file exists; "Return to AI" button confirmed absent — B08 is confirmed real.

9. **No irreversible actions in scope?** YES — No external SMS sends to real numbers, no production deployments, no DB migrations in scope. Test F2 sends an inbound SMS via test mechanism only.

10. **Scope is appropriate for a P1 sniper sprint?** YES — Three targeted fixes addressing confirmed bugs. Implementation constraints are specific and limit drift. No scope creep.

11. **Any blockers or ambiguities requiring escalation?**
    - ADVISORY: Builder must verify what storage method creates task/alert records for B09. If no such method exists, this is a blocker that must be escalated before implementation.
    - ADVISORY: Builder must verify the `PATCH /api/conversations/:id` endpoint accepts `assignedTo: null` before implementing the "Return to AI" button.
    - Neither advisory blocks entry gate approval — they are pre-implementation research steps the builder must complete before writing code.

### Verdict

**ENTRY GATE: APPROVED**

All required sections are present. All declared files verified at correct paths and line numbers. The bugs (B07, B08, B09) are confirmed real by source inspection. Test plan covers all ACs. Risk is Medium with appropriate safeguards documented. The two advisories are research tasks for the builder, not gate blockers. Builder may proceed, with mandatory verification of the storage/API methods before writing code for AC3 and AC2 respectively.
