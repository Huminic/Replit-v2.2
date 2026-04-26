# Operator Decision Log — nexxus2.2_replit

| Date | Decision | Rationale | Who |
|------|----------|-----------|-----|
| 2026-03-27 | I-147 deferred | TeamBox tab restructure needs design work, not just code fix | Operator |
| 2026-03-27 | BL-075 deferred | File upload not in MVP scope | Operator |
| 2026-03-27 | No video for service | Business decision — service dept doesn't use video | Operator |
| 2026-03-27 | Each comms agent needs own number | TextMagic number per agent for routing | Operator |
| 2026-03-27 | Personabox deferred | Rethinking strategy after nexxus completes | Operator |
| 2026-03-27 | Multi-head dragon deferred | Build central governance after nexxus reaches production | Operator |
| 2026-04-24 | UI is the truth for v2.2 finish planning | Visible app behavior must drive preflight, scope, fixes, and verification; code-only inventory is not enough | Operator |
| 2026-04-24 | No broad UI redesign in current finish plan | UI changes are limited to TeamBox section access and useful metric revision unless explicitly approved later | Operator |
| 2026-04-24 | TeamBox may be surfaced inside department sections | Users should access relevant messages from their working section if preflight confirms the data/model supports it | Operator |
| 2026-04-24 | Metrics must answer dealership questions | Metrics that are meaningless, unsupported, or misleading should be revised, removed, hidden, or gated | Operator |
| 2026-04-24 | Preflight before execution | The next step is verification and validation of UI/workflows/metrics/governance before finishing implementation sprints | Operator |
| 2026-04-26 | `nexxus-integrations` MCP server entry migrated from `.claude/settings.json` to `.claude/settings.local.json` (gitignored) | The bearer token in `settings.json` was checked into git history pre-rotation. New token (post-rotation) lives only in the gitignored per-machine file. Functional impact: none — Claude Code loads both files; central-mcp on port 4002 stays reachable for VAPI/TextMagic/Tavus/Resend/FlexPrice and VIN-read operations. Disposition record so that an auditor reading the committed diff (commit `73c7088`) sees the deletion and can find this rationale. | Operator (set in prior session); recorded by harness-orchestrator 2026-04-26 |
| 2026-04-26 | `.claude/settings.json` `env` block requires Claude Code session restart to take effect | Adding `env: { CLAUDE_PROJECT_DIR: "..." }` at the top of `settings.json` (commit `73c7088`) makes new Claude Code sessions inherit `CLAUDE_PROJECT_DIR` automatically, so harness scripts (`test-safety-check.sh`, `mark-complete.sh`, hooks via `common.sh project_root()`) work unprefixed. The currently-running session does NOT auto-pick the var up; it must continue to use explicit `CLAUDE_PROJECT_DIR=...` prefix when invoking harness scripts. Operator action: restart Claude Code in this project directory at next opportunity. | Operator authorized; recorded by harness-orchestrator 2026-04-26 |
