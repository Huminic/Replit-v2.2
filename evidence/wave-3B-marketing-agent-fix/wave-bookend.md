# Wave 3B — Marketing agent functionality fix (re-scoped per operator 2026-05-10)

**Phase:** 6 (Marketing)
**Branch:** `wave/6-marketing/3B-agent-fix` off `batch-1-finish-line` @ `c5c3321`
**Plan reference:** plan.md row 10 ("Marketing tab routing fix"). Re-scoped per operator's clarification 2026-05-10.

---

## OPENING (2026-05-10T05:40Z)

### Operator scope clarification (verbatim, 2026-05-10)

> "There is no UI change. The marketing agent has a UI, it doesn't need a UI change, it needs to work as it is. Technically I've seen most of it working but there are errors now. It might not be setup properly."

**Translation:** The marketing AGENT (not the marketing TAB) has visible errors when in use. The operator has used it before and seen it work. This is a regression / configuration / setup issue. Fix it without changing the UI.

### Initial drift correction (mid-wave revision documented per protocol)

The first scout pass treated "Marketing tab routing fix" as adding the missing Agents nav link to the sidebar submenu (parity with Sales/Service). The orchestrator presented that as a UI change requiring approval. Operator pushed back: not a UI change. The actual problem is the marketing agent itself has errors. Wave 3B is RE-SCOPED to functionality investigation + fix.

**No UI files** are in scope. **No client/src/pages/marketing.tsx**, no `client/src/components/marketing/**`, no `client/src/components/layout/SubMenuManager.tsx`.

### Phase 1 — Investigation (read-only)

Owner: **qa-evaluator** subagent.

Goal: surface the actual user-visible errors when exercising the marketing agent on dev. Capture concrete diagnostics:
- Browser console errors (full stack)
- Network request failures (HTTP status, response body)
- Server pm2 logs (`pm2 logs nexxus-app --lines 200` during the reproduction)
- DB state (does the org have a configured marketing agent? does the agent have required config fields? does the org have outbound flags consistent with the agent's needs?)
- Provider boundary signals (Anthropic / Brave / OpenAI calls succeeding or failing)

Output to `evidence/wave-3B-marketing-agent-fix/investigation/`:
- `repro-steps.md` — exact path to surface the error (login → navigate → action)
- `console-errors.txt` — browser console capture
- `network-failures.json` — failed request capture
- `server-logs.txt` — relevant pm2 log slice
- `db-state.md` — relevant DB select(s) on agents/orgs/config tables
- `root-cause-hypothesis.md` — synthesis with file:line citation if code-related, or env-var/config-row if setup-related

### Phase 2 — Fix (after investigation lands)

Owner: depends on root cause:
- Server-side bug → **harness-backend**
- Config / env / DB row missing → orchestrator may issue config change directly (no code) OR escalate to operator if it requires real-customer-touching writes
- Architectural design needed → **technical-architect** (rare for a single-bug wave)
- Cross-component interaction → **Plan** subagent for strategy

OPENING bookend WILL BE AMENDED with the concrete file targets after investigation completes. (Per Wave 2A precedent: mid-wave revisions are documented, not silent.)

### Two deltas of proof — contract

| Delta | What |
|---|---|
| **Delta 1** | qa-evaluator captures FAILING reproduction (pre-fix) AND PASSING reproduction (post-fix) of the same Playwright MCP path; both saved with timestamps and artifacts |
| **Delta 2** | Independent observation: server log / network / DB SELECT showing the previously-failing path now succeeds (or, if env/config fix, the configuration line that changed and what it now reads) |

### Testing level

`sprint` per `~/Claude-store/sysadmin/harness/TESTING_DOCTRINE.md`. User-facing AI agent behavior + provider boundary touched.

### Verifier roster (4 at gate)

1. **code-reviewer** (blind verifier) — cold-read evidence vs claims
2. **scope-guardian** — changed files match declared (post-investigation) scope; NO UI files; NO unauthorized cross-project edits
3. **general-purpose** (drift detector) — process discipline, governance corrections still in force
4. **integration-safety** — Anthropic / Brave / OpenAI provider boundary; CommGate untouched; no real-customer recipient

### Operator-decision boundaries reaffirmed

- Functionality changes that BREAK existing visible behavior → operator consult
- This wave: operator-authorized "make existing agent work as it is" — meaning fix-without-changing-behavior is pre-authorized, but if investigation reveals the agent's design is broken (not just its setup), I will pause and present findings to operator before proposing a redesign

### Hard out-of-scope

- ANY UI file under `client/src/pages/**`, `client/src/components/**`, `client/src/styles/**`, `client/src/layouts/**`
- ANY schema migration
- ANY new external provider
- ANY real-customer-touching write
- ANY change to live Coolify

### Posture at OPENING

- pm2 `nexxus-app` running on dev with current main-branch code (Wave 3A merged + reloaded earlier)
- Working tree dirty entries: 6 (auto + 5 untracked unrelated)
- Branch `wave/6-marketing/3B-agent-fix` created at `c5c3321`

---

## Phase 2 amendment (2026-05-10T17:14Z) — concrete scope after investigation

### Investigation summary (qa-evaluator commit `a2aa655`)

**Verdict:** ERROR REPRODUCED. Two-deltas captured:
- Delta 1 (Playwright UI): every marketing agent shows "Sorry, I encountered an error connecting to the AI service" on first chat send. Screenshot at `evidence/wave-3B-marketing-agent-fix/investigation/screenshot-error.png`.
- Delta 2 (independent boundary probe): `curl POST /api/openai-proxy` with valid Nexxus token returns HTTP 401 with verbatim OpenAI body `{"code":"invalid_api_key","message":"Incorrect API key provided: sk-proj-...OxMA"}`. pm2 server log slice corroborates.

**Root cause:** dev `.env` `OPENAI_API_KEY` was rejected by OpenAI as invalid (key rotated/revoked since operator last used the marketing agent successfully). UI is fine. Server route is fine. DB has 6 active marketing-agent rows for serra-honda. Refresh-token retry logic at `client/src/components/marketing/AgentChatView.tsx:438` works.

### Phase 2 concrete scope

**Owner:** orchestrator (config-only, no code change, no builder dispatch needed)

**Action taken:**
1. Operator provided new `OPENAI_API_KEY` in chat 2026-05-10T17:13Z.
2. Orchestrator wrote new key to `/home/ubuntu/Claude-store/nexxus2.2_replit/.env` via atomic Python replace (only the `OPENAI_API_KEY=` line touched; 60 other env-var lines unchanged; file mode preserved at 0600).
3. `pm2 reload nexxus-app --update-env` at 2026-05-10T17:14Z. Health check OK at uptime 3s.
4. **Old key:** `sk-proj-...OxMA` (164 chars). **New key:** `sk-proj-...mE0A` (164 chars). Same project-key format.

**Out of scope for Wave 3B (filed for follow-up):**
- `GOOGLE_MAPS_API_KEY` missing → `/api/maps-proxy` 503 → Market Intel agent silently uses mock fallback. Not the operator-reported regression. Will file as new issue.
- `/api/maps-proxy` body-shape mismatch. Same scope rationale. Will file as new issue.

**Files touched in Phase 2:** ONLY `.env` (gitignored; not committed). Zero source-code changes. The wave bookend documentation is committed; the rotation itself leaves no git trace.

### Phase 3 post-fix re-verification (qa-evaluator)

Re-run the SAME Playwright MCP path that produced the FAIL in Phase 1: login → Marketing → Agents → Copywriter → send chat message. Expected outcome: assistant returns a coherent response (no error toast). Captures saved as Delta 1 (post-fix).

Independent boundary probe: `curl POST /api/openai-proxy` with same Nexxus token. Expected: HTTP 200 (or 4xx for the test payload itself, but NOT 401-from-OpenAI). Captures saved as Delta 2 (post-fix).

### Verifier roster unchanged

(code-reviewer / scope-guardian / general-purpose drift / integration-safety)

---

## CLOSING (2026-05-10T17:25Z)

### Phase results

| Phase | Owner | Result | Commit |
|---|---|---|---|
| Phase 1 — investigation (qa-evaluator) | qa-evaluator | PASS — error reproduced; root cause `OPENAI_API_KEY` rejected by OpenAI as invalid (verbatim 401: `Incorrect API key provided: sk-proj-...OxMA`) | `a2aa655` |
| Phase 2 — fix (config-only) | orchestrator (no builder needed) | PASS — `.env` `OPENAI_API_KEY` rotated by atomic Python replace; `pm2 reload nexxus-app --update-env`; uptime 3s health check OK | `ea08fd2` (bookend amendment only; .env never committed) |
| Phase 3 — re-verification (qa-evaluator) | qa-evaluator | PASS — `/api/openai-proxy` 401→200; coherent `gpt-4o-mini-2024-07-18` reply; UI no longer shows error toast | `46de9f6` |

### Two deltas of proof (per phase, satisfying both directions of the Phase 1 vs Phase 3 contract)

| | Phase 1 (FAIL) | Phase 3 (PASS) |
|---|---|---|
| Delta 1 (Playwright UI) | Error toast: "Sorry, I encountered an error connecting to the AI service" | Coherent assistant reply (clarifying question about Civic offer) — `screenshot-success.png` |
| Delta 2 (curl boundary probe) | HTTP 401 with verbatim `{"code":"invalid_api_key","message":"Incorrect API key provided: sk-proj-...OxMA"}` | HTTP 200 with valid `chat.completion` body, 29 tokens, `chatcmpl-De251IyE` id |

Same login, same path, same payload shape, same provider boundary — only `.env` `OPENAI_API_KEY` differs.

### Verifier verdicts (4 at gate, parallel)

| Verifier | Verdict | Notable |
|---|---|---|
| blind-verifier (code-reviewer) | **AGREE** | Phase 1 evidence ↔ root-cause-hypothesis ↔ Phase 2 amendment ↔ Phase 3 evidence cross-check verified at file:line; secret hygiene confirmed (only masked `...OxMA` / `...mE0A` forms in committed evidence) |
| scope-guardian | **PASS** | 15 changed files, ALL under `evidence/wave-3B-marketing-agent-fix/**`; zero source-code; .env gitignored; zero secret leaks |
| drift-detector (general-purpose) | **NO DRIFT** | All 10 governance + wave-specific checks pass (no A/B/C, 3-category boundaries, no options menu, mid-wave revision documented, two deltas per phase, no echo-rerun, no backdating, zero UI files, no harness-frontend dispatch, qa-evaluator as primary investigator) |
| integration-safety | **PASS** | dev-only key rotation; live Coolify untouched; vin-safe-mcp + CommGate untouched; no real-customer recipient; OpenAI boundary healthy post-rotation |

### Operator scope honored exactly

| Operator ask | Delivered |
|---|---|
| "needs to work as it is" | ✅ marketing agent now responds (gpt-4o-mini) |
| No UI change | ✅ zero edits to `client/src/{pages,components,styles,layouts}/**` |
| Investigate the errors | ✅ qa-evaluator captured 2 distinct error signatures (UI toast + 401 boundary) |
| Use proper subagent roles incl. qa-evaluator | ✅ qa-evaluator drove Phase 1 + Phase 3; no harness-frontend involved; 4 verifiers at gate |
| Avoid drift | ✅ initial sub-menu-add scope was pulled back when operator clarified; mid-wave revision documented in OPENING |

### Carry-forward issues filed

- `I-NEW-2026-05-10-A` — `GOOGLE_MAPS_API_KEY` missing on dev (Market Intel agent silently uses mock fallback). Out of Wave 3B scope.
- `I-NEW-2026-05-10-B` — `/api/maps-proxy` body-shape mismatch. Out of Wave 3B scope.

### Posture at CLOSING

- Branch HEAD: `46de9f6` on `wave/6-marketing/3B-agent-fix` (CLOSING commit will advance)
- Provider sends this wave: 0 customer-facing (Anthropic/OpenAI server-side AI calls only — both read-only)
- DB writes this wave: 0
- Builds this wave: 0 (no source code changed)
- pm2 restarts this wave: 1 (`pm2 reload nexxus-app --update-env` to pick up new `OPENAI_API_KEY`)
- Live deploys: 0 (Coolify untouched on `becb739`)

### Post-CLOSING actions (orchestrator-autonomous)

- File 2 carry-forward issues in `issues.md` (DONE)
- Update `plan.md` to mark Wave 3B DONE + add changelog entry
- Write handoff to `.claude/session.md` and `memory/session-output.md`
- ff-merge `wave/6-marketing/3B-agent-fix` to `batch-1-finish-line`
- Push origin

---

**Wave 3B status: DONE.**



