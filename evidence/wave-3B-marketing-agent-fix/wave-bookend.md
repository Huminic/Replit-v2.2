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

(Phase 2 amendment + CLOSING to follow.)
