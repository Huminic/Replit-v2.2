# Hard-Won Knowledge — nexxus2.2_replit

## Decisions

- dev.huminicdev.com runs from dist/index.cjs (production build), NOT live TypeScript. Watch mode is OFF. Code changes require `npm run build && pm2 restart nexxus-app` to go live. Build takes ~12s. This is NOT a hot-reload setup.

## Multi-App Isolation Protocol (2026-03-26)

**Rule: One app per conversation. No exceptions.**

When operator wants to work on a different app, start a new Claude session from the governor root. No mid-conversation app switching.

**Enforcement mechanisms:**
- Active app declaration in session-state.md — Captain checks before every dispatch
- Explicit context switch protocol — operator says "Switch to X", Captain saves/loads state, confirms
- App prefix validation on all file operations — dispatching to wrong app root is a hard stop
- Separate knowledge namespaces — app-specific lessons stay in app's hardwonknowledge.md

## Multi-Head Dragon Protocol (2026-03-27) — BACKLOG

Deferred until after nexxus reaches production. Build when complexity demands it.

**Core Concept:** Central governance knowledge base at `~/.claude/governor/` shared across all app Captains. Each Captain reads from the same body of knowledge but operates one app per session. "Dragon with many heads, one body."

**Proposed Structure:**
```
~/.claude/governor/
  registry.json              — All enrolled apps, status, cross-app dependencies
  workflow/                  — Master workflow standards (sprint system, ghost gates, evidence reqs, templates)
  infrastructure/            — Server context, Caddy/Coolify rules, deployment patterns, sysadmin protocol
  standards/                 — Development standards, decision authority tiers, learning system
  hardwonknowledge.md        — Cross-app technical lessons (app-specific stays in app file)
```

**What Moves There:** GOVERNOR_REFERENCE.md splits into workflow/ files. ~/.claude/references/*.md moves to infrastructure/ and standards/. governed-apps.json becomes registry.json. Templates move to workflow/templates/.

**Registration Model:** registry.json holds all enrolled apps with path, phase, stack, deploy method, last active date. Cross-app dependencies tracked explicitly. Any Captain reads; only operator authorizes changes.

**Captain Cold Start:** Auto-load global CLAUDE.md → auto-load app CLAUDE.md → read registry.json → read workflow/ → read infrastructure/ → read app state files → ready.

**Solves:** Shared workflow knowledge, shared infra knowledge, cross-app learning, dependency awareness.
**Doesn't solve:** Real-time coordination (operator serializes), automatic propagation (next session reads latest), concurrent infrastructure changes (operator arbitrates).
**Why deferred:** 2 apps today. Simple dependency log sufficient. We'll know more after running harness through nexxus production.

## Harness V3 — Implemented Process Changes (2026-03-27)

### New Additions

**1. Agent mistake registry.** `agent-mistakes.md` read by every subagent on cold start. Grows organically. Sprint template includes "common mistakes" section. Stops same format errors repeating every sprint.

**2. B12 bidirectional coverage gate.** Checks both under-coverage (sprint has fewer ACs than cluster requires) AND over-coverage (sprint claims ACs from wrong cluster = scope creep).

**3. UI delta section in post-sprint template.** Any sprint touching FE files: "Elements added/removed/modified." Next inventory focuses on deltas instead of full recrawl.

**4. Operator decision log.** `decisions.md` in app root. One line: date | decision | rationale | who. Agents check before escalating known-deferred items.

**5. Phase transition artifact checks.** Each phase gets `requiredArtifacts` array. Transition blocked if artifacts missing/empty.

**6. State enumeration before Playwright crawl.** Explicit list: every route, tab, modal trigger, conditional view, permission gate, empty state. Crawl visits states, not pages.

**7. Data map tiering.** T1 (system boundaries — full trace every wave), T2 (business logic — per-section), T3 (static/config — on-touch only).

**8. Function names over line numbers in clusters.** Stable references: function names, API routes, table names. Line numbers resolved at sprint time via grep. Greppable = verifiable.

**9. Artifacts improve through use.** Each artifact has "good enough" threshold. Testing proceeds with confirmed set. Discoveries feed back. Living documents.

### Cuts and Simplifications

**10. Remove Halo role.** Three roles: Captain (orchestrates), Dev (executes), Ghost (verifies). Halo never became a real agent. Bus was Halo's mechanism; bus is deprecated. Remove bus directories, Halo references.

**11. Remove file bus infrastructure.** Delete .governor/bus/ directories and 5 deprecated scripts (enqueue.sh, ack.sh, route.sh, stall-detect.sh, tmux-queue.sh).

**12. Move tmux scripts to appendix.** Convenience tools, not quality gates. Keep reference focused on enforcement.

**13. Consolidate EF checks with Ghost gates.** Hook = structural rules (file scope, chain-of-custody, evidence exists). Ghost = content rules (line counts, schema validation). Reduces cascade failures.

### Still-Relevant Workflownotes Items

**14. CommGate as Ghost check (C20).** R-017 added isWithinBusinessHours() but Ghost doesn't verify it exists.

**15. Stale test detection.** Ghost should flag test results older than last commit.

### Earlier Improvement Items (1-13, still valid)

Timing gate content timestamps, canonical evidence location, Ghost writes cross-sign, scripted sprint registration, Ghost reads own knowledge file, watchdog persistent exceptions, post-commit smoke, sprint dependency graph, lessons-learned gate, structured operator intake, sprint "not in scope" section, post-sprint regression delta, auto-close issues from commits. Full details in `.governor/evidence/E-013/harness-v3-specification.md`.

## Three Anchors Principle (2026-03-27)

Recursive governance resolves by anchoring the chain, not by adding more layers.

**Anchor 1: Observable State.** Every verification chain terminates in an observation (DOM value, API response, grep result, screenshot), not a judgment.

**Anchor 2: Divergence Detection.** Don't ask "is this correct?" Ask "do these two independent methods agree?" Disagreement = investigate. DOM crawl + screenshot = V3 implementation.

**Anchor 3: Operator as Circuit Breaker.** Operator resolves specific, evidence-backed divergences and makes product judgment calls. System surfaces questions; operator doesn't review everything generally.

**Rule:** The harness needs to make drift visible before it becomes coverage gaps.

## Failures

- 2026-03-19: Builder rewrote central-mcp VIN connector without authorization (REM-8-DT)
- 2026-03-20: Builder wrote production email during testing sprint (REM-8-BE)
- 2026-03-20: Orchestrator edited sync.ts directly — governance boundary violation (REM-9)
- 2026-03-20: CommGate deployed without governance approval (emergency)
- 2026-03-24: Ghost agent edited sprints.json — instructed by Halo, content accepted
- 2026-03-26: Captain executed 8 SEC sprints without Ghost gates (attempt 1) — operator caught it, full revert

## Watch For

- VIN Solutions writes ONLY via vin-safe-mcp (port 4003), never central-mcp
- All role test accounts currently aliased to org_admin — RBAC is untested with real roles
- Agent instructions seeded at runtime — do not manual-edit
- Warehouse sync depends on all 5 dealer orgs in seed.ts
- Marketing agents are CLIENT-SIDE definitions (marketing-agents.ts MARKETING_AGENTS constant), NOT from /api/agents
- Service and Marketing metric trends are hardcoded to zero — only Sales has real change data
- Sales buildSalesMetrics() has 7 tiles, not 6
- Sales Conversion Rate "change" field uses absolute rate as delta — bug
- Sales Recent Activity feed is hardcoded static array — not from API
- Sub-menu labels and page tabs are independent — can be out of sync
- Settings page uses tile grid, NOT tabs. 7 tiles (no Billing tile).
- Widget landing pages use hardcoded colors, not org config
- Nancy Gaston is the correct service agent name
