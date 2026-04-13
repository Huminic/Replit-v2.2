# SNP-COMMS-FIX-01 — Pre-Execution Report

**Date:** 2026-04-08
**Sprint:** CommGate silent drop fix + VIN lead source name fix
**Branch:** wave-pe3
**Priority:** P0
**Scope:** 3 files — conversations.ts, webhooks.ts, storage.ts (read-only verification)

---

## Objective

Fix two production-blocking communications bugs:

- **B03 (CommGate silent drop):** When `outboundEnabled=false` on an org, a human agent sending an SMS reply from TeamBox receives HTTP 201 and sees the message as sent in the UI. In reality the message is never delivered — `processOutboundSend` returns `status: "blocked"` and logs a warning to console, but the 201 response and message storage proceed identically to a successful send. The customer receives nothing. The agent has no indication of failure. Fix: surface the blocked status to the caller so the frontend can show a warning.

- **B04 (VIN lead source mismatch):** The VAPI webhook handler uses `orgSettings.vinLeadSourceName || "Dealers WebSite"` as the default lead source name when creating VIN Solutions leads. The configured strings for Ford of Columbia and Hyundai of Columbia are either missing or wrong — VIN Solutions for Ford of Columbia expects "Dealer Website" (no trailing 's') and for Hyundai of Columbia expects "Dealer .Com (Our Website)". Every inbound VAPI call for these two stores fails VIN lead creation silently. Fix: ensure the correct per-org `vinLeadSourceName` is stored in `org.settings` for both Columbia stores.

---

## Declared Files

| # | File | Change |
|---|------|--------|
| 1 | `server/routes/conversations.ts` | Lines 253–278: after `processOutboundSend`, check `result.status === "blocked"` and return a 4xx response (or a 201 with `blocked: true` flag) instead of proceeding silently; update message stored in DB with `status: "blocked"` |
| 2 | `server/routes/webhooks.ts` | Confirm or correct lead source name resolution for Ford of Columbia (dealer 13398) and Hyundai of Columbia (dealer 13399); if per-org config is the fix path, this file may only need a log/comment clarification and the fix lives in a DB seed or migration |
| 3 | `server/storage.ts` | Read-only verification: check whether `createMessage` or `updateMessage` accepts a `status` field; if not, assess what schema change is needed |

---

## Acceptance Criteria

| AC | Description | Pass Criteria |
|----|-------------|---------------|
| AC1 | CommGate blocked returns non-200 or blocked flag | POST `/api/conversations/:id/messages` when `outboundEnabled=false` returns 4xx OR returns 201 with `{blocked: true}` in response body — frontend must be able to detect and display warning |
| AC2 | Blocked message stored with status | Message record in DB has `status: "blocked"`, not `status: "sent"` or no status |
| AC3 | Ford of Columbia VIN lead creation succeeds | Inbound VAPI call routed to Ford of Columbia org creates a VIN lead with source "Dealer Website" without error |
| AC4 | Hyundai of Columbia VIN lead creation succeeds | Inbound VAPI call routed to Hyundai of Columbia org creates a VIN lead with source "Dealer .Com (Our Website)" without error |
| AC5 | Lead source fix is per-org | Fix uses `org.settings.vinLeadSourceName` per-org — no global rename that alters other orgs |

---

## Test Plan

| Flow | What to Test | Classification |
|------|-------------|----------------|
| F1 | Set `outboundEnabled=false` for Serra Honda via DB or API. POST a message to a TeamBox SMS conversation as org_admin. Verify: API returns error or blocked flag, UI shows warning, message record has `status: "blocked"`. | L2 authenticated — CommGate block flow |
| F2 | Restore `outboundEnabled=true` for Serra Honda. POST another message. Verify: API returns 201, no blocked flag, message delivered normally. | L2 regression — CommGate unblocked flow |
| F3 | Query `org.settings.vinLeadSourceName` for Ford of Columbia and Hyundai of Columbia orgs. Verify "Dealer Website" and "Dealer .Com (Our Website)" respectively. | L2 data verification — lead source config present |
| F4 | Run `replay-leads.ts --dry-run` for a Columbia store call (if script exists). Verify lead source resolves without mismatch error. | L2 dry-run verification |
| F5 | Confirm other orgs (Serra Honda, Serra Nissan, Tony Serra Ford) still use "Dealers WebSite" as lead source — no regression from per-org fix. | L2 regression — other orgs unaffected |

---

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| Changing 201 → 4xx for CommGate block may break frontend clients that assume any message POST succeeds | Medium | Option A: return 201 with `{...msg, blocked: true, blockedReason: "CommGate disabled"}` — softer change, frontend detects via field. Option B: return 422 with body describing block. Option A is lower risk; Option B is more RESTful. Decision needed from owner before implementation. |
| `messages` table may not have a `status` column (schema verification needed) | High | Read `server/storage.ts` and `shared/schema.ts` before writing code. If column absent, a migration is required — this is a GATED action. Do not add migration without confirming it is in scope. |
| Columbia org `vinLeadSourceName` may not be stored at all — if the `settings` JSONB field is null or missing the key, the fix is a data patch (DB update), not a code change | Medium | Read org records for both Columbia stores before implementing. If it's a data patch, document as an IRREVERSIBLE action (DB write) and get approval before executing. |
| `replay-leads.ts` may not exist | Low | Test F4 is advisory — skip if script absent, note in test results |

---

## Entry Gates

| Gate | Status |
|------|--------|
| A1: Pre-exec written | THIS FILE |
| A2: Files declared | LISTED ABOVE — 3 files (storage.ts read-only) |
| A3: No in-progress sprint | CONFIRMED — no sprint marked in_progress in sprints.json for this branch |
| A4: Branch wave-pe3 | CONFIRMED |
| A5: Irreversible actions | CONDITIONAL — if Columbia org lead source fix requires a DB update, that is an IRREVERSIBLE action requiring explicit owner approval before execution |

---

## Ghost Entry Gate

**Reviewed by:** Ghost Agent (Enforcer)
**Date:** 2026-04-08

### Scope Verification

Declared files match the bug descriptions:

- `conversations.ts` lines 253–278: Code read confirms `processOutboundSend` result is checked — `result.status === "sent"` logs success, otherwise logs warning — but in both cases the function proceeds to `return res.status(201).json(msg)` (line 274). The blocked status is swallowed. B03 is confirmed real by code inspection.
- `webhooks.ts` line 857: `const vinLeadSourceName = orgSettings.vinLeadSourceName || "Dealers WebSite"` — the fallback hardcodes the string used by Serra stores. If Ford of Columbia and Hyundai of Columbia do not have `vinLeadSourceName` set in their `org.settings`, every VAPI call to these orgs falls back to "Dealers WebSite" which does not match the VIN Solutions lead source names for those dealers. B04 is confirmed real by code inspection.
- `storage.ts` declared as read-only verification — appropriate, given the schema dependency risk identified in Risk Analysis.

### AC Verification

| AC | Verdict | Notes |
|----|---------|-------|
| AC1 | Plausible and testable | Code path confirmed. Two implementation options (4xx vs 201+flag) are documented; decision needed before coding. |
| AC2 | Plausible — schema check required | `createMessage` and message schema must be verified for a `status` field before implementation. Risk Analysis correctly flags this. |
| AC3 | Plausible and testable | Contingent on Columbia org settings being populated with correct value. |
| AC4 | Plausible and testable | Same as AC3. |
| AC5 | Plausible and testable | Fix path uses `org.settings.vinLeadSourceName` which is per-org — AC5 is structurally guaranteed by design. |

### Test Plan Assessment

F1–F5 cover all ACs plus regressions. F4 is correctly marked advisory. F5 is a valuable regression guard for the lead source fix. The plan is complete and honest about the dry-run dependency.

### Risk Analysis Assessment

Three risks are well-founded and non-trivial:
1. The 4xx vs 201+flag decision is correctly identified as requiring owner input. Builder must not proceed past this decision point without explicit instruction.
2. The schema verification requirement for the `status` column is correctly flagged. If a migration is needed, it must be declared explicitly before any schema change is made.
3. The Columbia org data patch path is correctly classified as potentially IRREVERSIBLE. The gate entry correctly notes conditional irreversibility.

### Findings

No scope overreach. ACs are testable. Three open decisions are honestly declared (CommGate response format, message status schema, DB data patch approval). No undeclared files.

The conditional IRREVERSIBLE flag in A5 is correct and must be respected during implementation: if the Columbia fix requires a DB write to `org.settings`, the builder must STOP and present the exact SQL/update to the owner before executing.

ENTRY GATE: APPROVED
