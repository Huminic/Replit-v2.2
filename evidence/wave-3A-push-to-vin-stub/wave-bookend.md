# Wave 3A — Push-to-VIN STUB (UI hide + backlog the route-removal decision)

**Phase:** 3 (TeamBox)
**Branch:** `wave/3-teambox/3A-push-to-vin-stub` off `batch-1-finish-line` @ `d96d80a`
**Plan reference:** plan.md row 9 ("TeamBox Push-to-VIN button + route REMOVAL"), re-scoped 2026-05-09 per operator: STUB only, route preserved.

---

## OPENING (2026-05-09T17:24Z)

### Operator scope decision (verbatim, 2026-05-09)

> "I would like you to stub it and remove evidence from the UI and put notes in the code that this was backlogged. Nobody is in process in that route. This will reduce the blast radius and also allow me to think it through before we remove the route. please add a note in the backlog about this as well."

Plan title said "+ route REMOVAL". Operator pivoted to STUB-only. Route stays alive. Removal decision deferred.

### Scope (canonical chunks, no A/B/C suffixes)

| Chunk | What | File(s) | User-visible? |
|---|---|---|---|
| **S1** | Hide "Push to VIN" button in TeamBox + soften the error toast string | `client/src/pages/teambox.tsx` (lines 272, 782-792, 979-998) | **YES** — operator approved |
| **S2** | Add BACKLOGGED comment at top of `POST /api/conversations/:id/push-to-vin` handler | `server/routes/conversations.ts` (line 280 area) | NO — internal comment only |
| **S3** | Add Push-to-VIN-deferral entry in backlog.md | `backlog.md` | NO — governance doc |

### Reconnaissance summary (read-only Explore subagent, 2026-05-09T17:23Z)

- **Frontend exposure:** primary button at `client/src/pages/teambox.tsx:791` (`data-testid="button-push-to-vin"`). Confirmation dialog at lines 979-998 (only opens if button clicked → dies with button). Error toast at line 272.
- **Backend route:** `server/routes/conversations.ts:280-381` — `POST /api/conversations/:id/push-to-vin` calls vin-safe-mcp `vin_safe_prepare_lead` then `vin_safe_execute_lead`. Active. Operator says: **leave alive**.
- **Tests:** no E2E spec references Push-to-VIN. The data-testid will dangle but won't break anything.
- **Existing backlog/issues:** no current backlog entry. issues.md EDR-04 + EDR-11 reference Push-to-VIN; will reference these from new backlog entry.

### Out of scope (deferred)

- Removing the route (`server/routes/conversations.ts:280-381`) — operator wants to think it through.
- Deleting the dialog code or mutation hook (lines 262-275, 979-998) — they go dead with the button hidden, no need to delete.
- Removing tests / `data-testid` — no breakage, hygiene later.

### Two deltas of proof

| Delta | What | Path |
|---|---|---|
| **Delta 1** | Playwright MCP screenshot of TeamBox conversation pane (logged in as serra_honda admin) showing **no** Push-to-VIN button + console-clean confirmation | `evidence/wave-3A-push-to-vin-stub/delta-1-playwright/` |
| **Delta 2** | Code diff snapshot showing exact lines changed + grep proof: `grep -n "Push to VIN" client/src/pages/teambox.tsx` returns zero user-visible matches (only test-id or comment, if any) | `evidence/wave-3A-push-to-vin-stub/delta-2-diff/` |

### Testing level

`sprint` per `~/Claude-store/sysadmin/harness/TESTING_DOCTRINE.md`. UI removal + code change + governance doc update.

### Verifier roster (4 at gate, parallel)

1. **blind-verifier** — cold-read evidence vs claims
2. **scope-guardian** — changed files match S1/S2/S3 only; no other code changes
3. **drift-detector** — process discipline (governance corrections in force)
4. **integration-safety** — verifies the vin-safe-mcp call site at `server/routes/conversations.ts:280-381` is BYTE-UNCHANGED except for the BACKLOGGED comment; no behavior modification

### Risk profile

| Risk | Mitigation |
|---|---|
| Real provider send | NONE — no provider call made by S1/S2/S3 |
| DB write | NONE — no DB writes |
| UI breakage in unrelated TeamBox flows | Builder verifies `npx tsc --noEmit` clean + Playwright MCP renders TeamBox without console errors |
| Removing the route by accident | scope-guardian verifies `server/routes/conversations.ts` lines 280-381 byte-unchanged except for one comment line |
| Cross-project edits | None — all changes within `nexxus2.2_replit/` |
| Live deploy | NO — wave merges to `batch-1-finish-line`; live deploy gate is Wave 11A |

### Builder constraints

- Touch ONLY: `client/src/pages/teambox.tsx`, `server/routes/conversations.ts`, `backlog.md`. No other files.
- Approach for S1: wrap the button in a constant guard (`const PUSH_TO_VIN_ENABLED = false;` with explanatory comment) so the route is preserved AND a future re-enable is one-line. Soften the error toast wording to "Push to VIN currently unavailable" but leave the toast wired (since it's dead path now anyway, this is cosmetic future-proofing).
- Approach for S2: prepend exactly ONE comment block above the route handler explaining the BACKLOGGED status, link to backlog.md entry id. NO behavior change. NO logic edits.
- Approach for S3: append a backlog entry per the four-field format in `~/Claude-store/sysadmin/governance-framework/file-standards.md`. Reference issues.md EDR-04 and EDR-11.
- Run `npx tsc --noEmit` after edits to confirm no TS errors introduced.
- Operator must approve `pm2 reload nexxus-app --update-env # APPROVED: <reason>` BEFORE running it (orchestrator gates the reload after builder commits).

### UI scope markers required

Operator-authorized in chat 2026-05-09. Markers will be issued one-shot before each protected edit.

### Posture at OPENING

- pm2 `nexxus-app` running on dev (build from prior wave merge).
- Working tree dirty entries unchanged from session start (auto log + 5 untracked unrelated).
- No untracked files in scope of this wave.

---

## CLOSING (2026-05-10T05:25Z)

### Chunk results

| Chunk | Verdict | Commit | Files |
|---|---|---|---|
| **S1 — UI stub** | PASS | `42cef31` | `client/src/pages/teambox.tsx` (+25/-16, net +9) — const guard `PUSH_TO_VIN_UI_ENABLED = false` at line 92, button wrapped at line 785, toast wording softened at line 279 |
| **S2 — Backend BACKLOGGED comment** | PASS | `67140e5` | `server/routes/conversations.ts` (+7/-0) — 7-line comment block above the route handler at line 281; handler body byte-identical (zero deletions) |
| **S3 — Backlog entry** | PASS | `67140e5` | `backlog.md` (+30/-0) — `BL-001 — Push-to-VIN UI deferred (Wave 3A 2026-05-09)` in new `## Deferred Items (carry-over)` section at line 213 |

TS check: `npx tsc --noEmit` exit 0. No new compile errors.

### Two deltas of proof

| Delta | What | Result |
|---|---|---|
| **Delta 1** (Playwright UI) | `evidence/wave-3A-push-to-vin-stub/delta-1-playwright/` | PASS — full-page screenshot of TeamBox post-build/reload as `serra_honda@huminic.ai`; programmatic DOM check returned `0` `[data-testid="button-push-to-vin"]` rendered, `0` strings matching Push-to-VIN/PUSH_TO_VIN/etc. across 72 total buttons; Quick Actions = Call/Email/SMS only |
| **Delta 2** (code diff + grep + tsc) | `evidence/wave-3A-push-to-vin-stub/delta-2-diff/` | PASS — git diff `592f3b5..HEAD` shows 3 source files + evidence; route handler body byte-identical to pre-edit; tsc clean |

### Verifier verdicts (4 at gate, parallel)

| Verifier | Verdict | Notable |
|---|---|---|
| blind-verifier | **AGREE** | claims-vs-evidence cross-check 8/8 verified at exact line numbers cited |
| scope-guardian | **PASS** | only 3 source files + evidence dir; UI scope marker correctly one-shot-cleared after S1 commit |
| drift-detector | **NO DRIFT** | all 8 governance-correction checks pass (no A/B/C, 3-category boundaries, no options menus, two deltas, no echo-rerun, no backdating, route preserved, no hidden operator-action items) |
| integration-safety | **PASS** | `git diff` confirms zero deletions on `server/routes/conversations.ts`; vin-safe-mcp prepare/execute calls untouched; CommGate untouched; zero provider sends |

### Operator scope honored exactly

Verbatim 2026-05-09 instruction: "stub it and remove evidence from the UI and put notes in the code that this was backlogged. Nobody is in process in that route. This will reduce the blast radius and also allow me to think it through before we remove the route. please add a note in the backlog about this as well."

| Operator ask | Delivered |
|---|---|
| Stub UI | ✅ const guard hides button + dialog (dialog is dead path now) |
| Remove visible UI evidence | ✅ Playwright DOM check: 0 Push-to-VIN buttons rendered, 0 strings in DOM |
| Code notes that this was backlogged | ✅ Comment block at top of teambox.tsx (line 87-91) + above route handler (line 281-287) |
| Don't remove the route | ✅ Handler body byte-identical; vin-safe-mcp prepare/execute calls intact |
| Add note in backlog | ✅ BL-001 entry with full four-field format |

### Posture at CLOSING

- Branch HEAD: `db9057b` on `wave/3-teambox/3A-push-to-vin-stub`
- Provider sends this wave: 0
- DB writes this wave: 0
- pm2 restarts this wave: 1 (dev `pm2 reload nexxus-app --update-env` to surface UI stub for Playwright proof; live Coolify untouched)
- Builds this wave: 1 (`npm run build` for the Playwright proof bundle)
- Live deploys: 0

Ready for ff-merge to `batch-1-finish-line`.

---

**Wave 3A status: DONE.**

