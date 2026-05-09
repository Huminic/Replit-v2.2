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

(CLOSING to follow after S1+S2+S3 + 4 verifier verdicts.)
