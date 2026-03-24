# Pre-Execution Report: S-2 — TeamBox

**Sprint:** S-2
**Type:** UI rebuild + backend verification + functional tests
**Date:** 2026-03-24
**Status:** READY

## Objective

Rebuild the TeamBox popout menu (SMS/Email/Phone/Video/Tasks), add top horizontal menu bar matching department pages, add Phone and Video tabs with VAPI/Tavus logs, restyle filter chips, add polling for near-real-time updates, and verify manual send, STOP handling, and human takeover.

## Declared Files

- `client/src/pages/teambox.tsx` — popout rebuild, top menu bar, Phone/Video tabs, filter restyle, polling
- `client/src/components/layout/SubMenuManager.tsx` — popout items changed to SMS/Email/Phone/Video/Tasks
- `tests/e2e/s2-teambox.spec.ts` — new test file

## UI Changes

DECLARED:
- Popout menu items changed from Conversations/Tasks/Workflows to SMS/Email/Phone/Video/Tasks
- "Conversations" removed from popout
- Top horizontal menu bar added (matching Sales/Service/Marketing pages)
- Filter chip colors changed from light blue to different accent
- Phone tab added (VAPI call logs table)
- Video tab added (Tavus session logs table)

## Acceptance Criteria (from sprints.json)

| ID | Criterion | Component | Evidence |
|----|-----------|-----------|----------|
| S-2.AC1 | Top horizontal menu bar present | S-2.1 | Screenshot |
| S-2.AC2 | Popout contains exactly: SMS, Email, Phone, Video, Tasks | S-2.2 | Screenshot |
| S-2.AC3 | "Conversations" NOT in popout | S-2.2 | Screenshot (negative) |
| S-2.AC4 | Each popout item opens filtered list of that channel only | S-2.2 | Screenshot per channel |
| S-2.AC5 | Phone tab shows VAPI call logs for current store | S-2.3 | Screenshot |
| S-2.AC6 | Phone tab has transcript links that work | S-2.3 | Screenshot |
| S-2.AC7 | Video tab shows Tavus session logs for current store | S-2.4 | Screenshot |
| S-2.AC8 | Video tab has transcript/recording links | S-2.4 | Screenshot |
| S-2.AC9 | Filter chips are NOT light blue | S-2.5 | CSS assertion |
| S-2.AC10 | Manual message: select → type → send → appears in thread | S-2.7 | Screenshot sequence |
| S-2.AC11 | Manual message delivered to recipient (outbound_log) | S-2.7 | Query proof |
| S-2.AC12 | STOP/opt-out: "STOP" adds phone to blacklist | S-2.8 | API + query proof |
| S-2.AC13 | STOP/opt-out: no further messages sent to blacklisted phone | S-2.8 | API proof |
| S-2.AC14 | Near-real-time: new message appears within 10s via polling | S-2.9 | Screenshot timing |
| S-2.AC15 | Human takeover: assign user → AI stops auto-responding | S-2.10 | API proof |
| S-2.AC16 | Human takeover: un-assign → AI resumes | S-2.10 | API proof |
| S-2.AC17 | API supports channel-based conversation filtering | S-2.6 | API response per channel |

## Test Plan

### New test file to write:
- `tests/e2e/s2-teambox.spec.ts`

### Test sections in s2-teambox.spec.ts:

1. **Channel filter API (AC17)** — GET /api/conversations?channel=sms, assert all results have channel=sms. Repeat for email, voice, video.
2. **VAPI calls endpoint (AC5/AC6)** — GET /api/vapi/calls (NOTE: path is /api/vapi/calls, NOT /api/vendor/vapi/calls). Assert 200, array response, entries have date/caller/assistant/duration fields. Verify at least one call exists for Serra Honda.
3. **Tavus sessions endpoint (AC7/AC8)** — GET /api/tavus/conversations. Assert 200, array response.
4. **Manual message send (AC10/AC11)** — POST /api/conversations/:id/messages with role=agent, content=test. Assert 201. Check outbound_log or verify via conversation messages.
5. **STOP handling (AC12/AC13)** — POST simulated STOP inbound to /api/webhooks/textmagic. Query sms_blacklist. Then attempt send to blacklisted number, assert blocked. Clean up: remove from blacklist after test.
6. **Polling config (AC14)** — grep teambox.tsx for refetchInterval, assert value <= 10000 (10s). This is a code review check — actual polling tested via browser.
7. **Human takeover (AC15/AC16)** — PATCH conversation assignedTo to a user ID. POST inbound SMS to that conversation's phone. Check logs for "AI paused". Then PATCH assignedTo=null, POST another inbound, check for AI response.
8. **UI structure (AC1/AC2/AC3/AC5/AC7/AC9)** — These require browser inspection. Tests will:
   - Login as serra_honda@huminic.ai via browser
   - Navigate to /teambox
   - Snapshot DOM for: top menu bar presence, popout items, filter chip styles
   - Verify Phone/Video tabs render content
   - Assert "Conversations" text NOT in popout area

### Existing test files to run:
- `tests/e2e/domain-05-teambox.spec.ts` — existing TeamBox tests (may fail on localhost baseURL)
- `tests/e2e/e2e-flows.spec.ts` — FLOW-1, FLOW-2, FLOW-10 (may fail on localhost baseURL)

### Cross-tests:
- None for S-2

### Exact commands:
```
npx playwright test tests/e2e/s2-teambox.spec.ts --project=sprint --reporter=list --workers=1
npx playwright test tests/e2e/domain-05-teambox.spec.ts --project=api --reporter=list --workers=1
```

### Known risks:
- AC10/AC11 (manual send): Sends real SMS to a real phone — IRREVERSIBLE. Test will use the existing conversation with owner's number and verify via outbound_log, not by triggering a new send.
- AC12/AC13 (STOP): Will temporarily blacklist a test number. Must clean up after.
- AC14 (polling): Requires browser-level test. API test can only verify the code has refetchInterval set.
- AC5-AC8 (Phone/Video tabs): These are NEW UI features being built in this sprint. The builder agent creates the code, then the test verifies it.
- VAPI/Tavus API paths: Plan says /api/vendor/vapi/calls but actual endpoint is /api/vapi/calls. Tests will use correct path.

### Implementation approach:
1. Dispatch builder sub-agent for UI changes (S-2.1 through S-2.5 + S-2.9 polling)
2. Write s2-teambox.spec.ts covering all 17 ACs
3. Run tests
4. Owner visual inspection required (new UI features)

## Visual Inspection Required
YES — S-2 has new UI features (Phone tab, Video tab, popout rebuild). Owner spot-check after commit per plan.md line 672.

## Ghost Entry Gate
**Reviewed by:** ghost-agent
**Timestamp:** 2026-03-24T07:26:40Z
**Sprint:** S-2
**A1 Previous cleared:** PASS (S-1 EXIT GATE: CLEARED)
**A2 Worktree:** clean (no application files dirty — evidence and governance only)
**A3 Session state:** PASS (references S-2)
**A4 Pre-exec exists:** PASS
**A5 Objective:** PASS
**A6 Test Plan:** PASS (2 npx commands, s2-teambox.spec.ts + domain-05-teambox.spec.ts)
**A7 Declared Files:** PASS (teambox.tsx, SubMenuManager.tsx, test file)
**A8 Match check:** MATCH (files match sprints.json, 10 components, 17 ACs. Note: e2e-flows.spec.ts in sprints.json testFiles but not in pre-exec — acceptable as cross-test)
**A9 UI permissions:** PASS (DECLARED — UI Changes section present with specific items)
**A10 Ghost messages:** PASS (clear)
**ENTRY GATE: APPROVED**
