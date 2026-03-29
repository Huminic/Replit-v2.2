# Workflow Notes — nexxus2.2_replit

<!-- Process improvement observations about the governance workflow. -->
<!-- Reviewed periodically by operator and Captain. -->

## Active Rules

### Multi-App Isolation (2026-03-26)
One app per conversation. No exceptions. When operator wants a different app, start a new Claude session from the governor root.

### Three Anchors Principle (2026-03-27)
Recursive governance resolves by anchoring, not by adding layers.
- **Anchor 1: Observable State.** Verification chains terminate in observations (DOM, API, grep, screenshot), not judgments.
- **Anchor 2: Divergence Detection.** Compare two independent methods. Disagreement = investigate.
- **Anchor 3: Operator as Circuit Breaker.** Operator resolves specific flagged divergences, not general reviews.

## Deferred — Multi-Head Dragon Protocol (2026-03-27)

Central governance knowledge base at `~/.claude/governor/` shared across all app Captains. "Dragon with many heads, one body." Deferred until after nexxus reaches production. Full spec in hardwonknowledge.md git history at commit 48bdd43.

## Deferred — V3 Artifacts Not Yet Implemented

These items from the V3 specification have not been built yet. Full spec at `.governor/evidence/E-013/harness-v3-specification.md`.

- Data Observability Map (D-series sprints)
- Cluster Registry (CL-series sprints)
- Coverage Verification (CV-series sprints)
- Phase transition artifact checks (requiredArtifacts array per phase)
- Data map tiering (T1/T2/T3)
- B12 bidirectional coverage gate (under-coverage + over-coverage)
- Scripted sprint registration
- Sprint dependency graph (parallel when possible)
- Lessons-learned gate every N sprints
- Auto-close issues from commit messages

## Gaps to Patch

### Inter-Phase Ghost Verifications Need Evidence Files (2026-03-27)
Entry gates write to pre-execution-report.md. Exit gates write to post-sprint-report.md. But inter-phase Ghost verifications (the checks between Dev phases) only exist in agent conversation output — no file artifact. The only proof they ran is the executionSteps timestamp in sprints.json.

**Fix:** Ghost inter-phase verifications should write to `evidence/{sprint}/phase-{N}-verification.md`. The pre-tool hook should check these files exist before allowing the next Dev phase to start. Add to harness.md §4 (Ghost Protocol, Inter-Phase Verification section).

### Sprint Execution Must Run From App Directory (2026-03-27)
The pre-tool hook (context-check.sh) is configured in the app's `.claude/settings.json`. When Captain runs from the governor root, the hook doesn't fire — no audit log, no sequence enforcement. U-001 and G-004 had no audit logs because of this.

**Rule:** Always run sprints from the app directory, not the governor root. This is an operator decision, not a cross-project hook.

## Lessons Learned

- 2026-03-25: Global CLAUDE.md at 825 lines caused adherence problems. Trimmed to 77. Rule: keep under 200 lines.
- 2026-03-25: Files not in declared structure end up as orphans. If it's not in GOVERNOR_REFERENCE.md, it doesn't belong.
- 2026-03-25: Devil's advocate review found 22 issues before code was written. Worth doing every time the harness changes.
- 2026-03-25: Agents hallucinate completion claims. Verification step caught two material inaccuracies. Never skip verification.
- 2026-03-27: If a hook doesn't touch a file, the file doesn't govern anything. Voluntary compliance fails.
- 2026-03-27: Captain composing Ghost prompts from memory instead of reading from sprints.json is the core failure mode. The sprint IS the dispatch template.
