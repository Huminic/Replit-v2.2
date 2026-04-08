# Pre-Execution Report — SNP-UI-MISC-01

**Date:** 2026-04-08
**Sprint:** SNP-UI-MISC-01
**Branch:** wave-pe3
**Priority:** P3
**Author:** Scribe Agent

---

## Objective

Deliver six isolated bug fixes targeting: `{{dealershipName}}` substitution in agent system prompts (B23), server-side self-deactivation guard (B31), invalid-timezone silent failure in outbound gate (B30), phantom `recipientCount` on campaigns with no recipients (B26), Insights modal title mismatch (B27), and removal of five empty TCTest Customer entries from the conversations table (B25).

No new features. No UI changes beyond the Insights modal title text correction. All fixes are scoped to the exact files declared below.

---

## Declared Files

| # | File | Change |
|---|------|--------|
| 1 | `server/routes/chat.ts` | Add `{{dealershipName}}` substitution when building agent system prompt |
| 2 | `server/routes/users.ts` | Add server-side check: reject `isActive=false` when `req.params.id === req.user.id` |
| 3 | `server/outbound.ts` | Validate IANA timezone string in `isWithinBusinessHours`; fall back to UTC + warn on invalid |
| 4 | `server/storage.ts` | Fix `recipientCount` to return 0 (not phantom 234) when no recipients uploaded for a campaign |
| 5 | `client/src/pages/insights.tsx` | Fix modal title to match "Hot Leads Going Cold" section heading |
| 6 | DB (SQL) | Remove 5 empty TCTest Customer entries from `conversations` table |

---

## UI Changes

`uiPermissions` for this sprint: SCOPED — only `client/src/pages/insights.tsx` modal title text.

Permitted change: The modal opened from the "Hot Leads Going Cold" section must display the title "Hot Leads Going Cold" (or the exact section heading string). No other UI elements may be modified.

---

## Acceptance Criteria

Copied verbatim from sprint definition:

| ID | Criterion |
|----|-----------|
| AC1 | When an agent with instructions containing `{{dealershipName}}` is used in chat, the Claude system prompt contains the actual dealership name, not the literal `{{dealershipName}}` |
| AC2 | `POST /api/users/:id` with `{isActive: false}` where `id === req.user.id` returns 400 or 403 |
| AC3 | If an org has an invalid timezone string (e.g., `"America/BadCity"`), `isWithinBusinessHours` does not return `false` silently — it falls back to UTC and logs a warning |
| AC4 | Oil Change campaign shows correct `recipientCount` (0 if no recipients, not 234) |
| AC5 | "Hot Leads Going Cold" modal title matches the section heading |
| AC6 | TeamBox does not show empty TCTest Customer conversation entries |

---

## Test Plan

### F1 — {{dealershipName}} substitution (AC1)
- Pre-condition: An agent for Serra Honda org has `{{dealershipName}}` in its instructions.
- Action: Send a chat message via the AI Chat interface authenticated as `serra_honda@huminic.ai`.
- Verification: Inspect server logs for the outbound request to Anthropic. The `system` field must contain "Serra Honda", not the literal string `{{dealershipName}}`.
- Pass condition: Zero occurrences of `{{dealershipName}}` in the logged system prompt.

### F2 — Self-deactivation guard (AC2)
- Pre-condition: Authenticated as any org_admin user.
- Action: Issue `PATCH /api/users/:id` (or equivalent) with `{ isActive: false }` where `:id` is the authenticated user's own ID.
- Verification: Response status is 400 or 403. Response body contains an error message indicating self-deactivation is not permitted.
- Pass condition: No 2xx response; user account remains active in the database.

### F3 — Invalid timezone fallback (AC3)
- Pre-condition: Set Serra Honda's timezone to `"INVALID_TIMEZONE"` in the database or org settings.
- Action: Trigger an outbound campaign send or call `isWithinBusinessHours` for that org.
- Verification: System does not silently reject all sends. Server logs contain a warning message referencing the invalid timezone and UTC fallback.
- Pass condition: Warning logged; no silent NaN comparison; sends proceed using UTC window.

### F4 — Phantom recipientCount (AC4)
- Pre-condition: Open Service > Campaigns > Oil Change campaign (known to display 234).
- Action: Inspect the campaign detail view or API response for `recipientCount`.
- Verification: Value is 0 (or the actual number of uploaded recipients if any exist — but must not be 234 if none are present).
- Pass condition: `recipientCount` matches actual recipient rows in DB.

### F5 — Insights modal title (AC5)
- Pre-condition: Authenticated as any user with Insights access.
- Action: Navigate to Insights. Locate the "Hot Leads Going Cold" section. Click the element that opens the modal.
- Verification: Modal header/title text reads "Hot Leads Going Cold".
- Pass condition: Visual confirmation that modal title matches section heading exactly.

### F6 — TCTest entries removed (AC6)
- Pre-condition: DB cleanup SQL has been run (targeted by contact name and/or phone pattern matching "TCTest Customer").
- Action: Open TeamBox > Conversations (chat tab).
- Verification: No conversations with contact name "TCTest Customer" or matching pattern appear.
- Pass condition: Zero TCTest Customer entries visible in TeamBox.

---

## Risk Analysis

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| `{{dealershipName}}` substitution applied in wrong location (after prompt sent) | Medium | Low | Read chat.ts carefully before patching; add unit-level log check |
| Self-deactivation guard breaks legitimate admin deactivation of other users | Medium | Low | Guard must only trigger when `req.params.id === req.user.id` |
| Timezone fallback causes campaigns to send outside intended hours for valid orgs | Low | Very Low | Fallback only activates on IANA parse failure; valid strings unaffected |
| DB cleanup targets wrong rows (deletes real conversations) | High | Low | SQL must use both `contact_name LIKE 'TCTest%'` AND phone pattern; run SELECT first, DELETE second |
| `recipientCount` fix breaks count for campaigns that do have recipients | Medium | Low | Fix must query actual recipient table; confirm with a campaign that has known recipients |
| Insights modal title change affects other modals sharing the same component | Low | Low | Confirm the title is passed as a prop, not hardcoded in the shared component |

**DB cleanup note:** The SQL cleanup for TCTest entries is an irreversible action. It must use a SELECT first to confirm exactly 5 rows match before the DELETE is executed. If more than 5 rows match, STOP and report.

---

## Entry Gates

- [ ] sprints.json entry for SNP-UI-MISC-01 exists with status `pending`
- [ ] All 6 declared files exist at the paths listed above
- [ ] No other sprint is currently `in_progress`
- [ ] Git worktree is on branch `wave-pe3` or it will be created
- [ ] DB cleanup SQL prepared as SELECT before DELETE
- [ ] No AC references an undefined external value or unknown API

---

## Ghost Entry Gate

**Ghost Agent Review — 2026-04-08**

**Checklist:**

1. Sprint ID registered in sprints.json: CONFIRMED — SNP-UI-MISC-01 present, status `pending`
2. Declared files match sprint definition: CONFIRMED — all 6 files listed match the sprint specification exactly
3. Acceptance criteria copied accurately: CONFIRMED — all 6 ACs reproduced verbatim from the sprint definition
4. Test plan covers every AC: CONFIRMED — F1→AC1, F2→AC2, F3→AC3, F4→AC4, F5→AC5, F6→AC6
5. UI change scope respected: CONFIRMED — only `insights.tsx` modal title text permitted and declared
6. Risk analysis present and plausible: CONFIRMED
7. DB cleanup is gated as irreversible with SELECT-first protocol: CONFIRMED
8. No AC references undefined external values: CONFIRMED — all values are resolvable (dealership names, org IDs, campaign names are known)
9. No scope creep — no files declared beyond the sprint definition: CONFIRMED
10. Branch declared: CONFIRMED — wave-pe3
11. Pre-flight checklist complete: CONFIRMED

**Verdict:**

ENTRY GATE: APPROVED

All components, acceptance criteria, declared files, and test plan are consistent with the sprint definition in sprints.json. The DB cleanup irreversibility risk is acknowledged and gated. No ambiguous ACs. No scope issues. Implementation may proceed.
