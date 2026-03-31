# Test Agent Conventions

## Directory Layout

```
tests/agents/
  plans/         # Markdown test plans produced by the Planner agent
  generated/     # Playwright spec files produced by the Generator agent
  healer/        # Healer logs and patch records
  README.md      # This file — agent conventions
  architecture.md # Architecture and workflow documentation
```

## Agent Roles

### Planner
Explores the live UI via MCP Playwright (browser navigation, snapshots, element inspection) and produces structured markdown test plans. Each plan describes what to test, which pages and roles are involved, and the expected behaviors.

- **Input:** A domain or feature area to cover (e.g., "settings", "teambox")
- **Tool:** MCP Playwright for live UI exploration
- **Output:** `plans/{domain}-plan.md`

### Generator
Reads a plan from `plans/` and converts it into a runnable Playwright spec file. The generator follows the seed pattern established in `tests/e2e/seed.spec.ts` for authentication, tour dismissal, and navigation setup.

- **Input:** A plan file from `plans/`
- **Output:** `generated/{domain}.agent.spec.ts`

### Healer
Monitors test runs for failures in agent-generated specs and applies targeted fixes. The healer operates under strict constraints — it fixes test-side issues only.

- **Input:** Failing test output from agent-generated specs
- **Output:** Patched spec file in `generated/`, log entry in `healer/`

## Naming Conventions

| Artifact | Pattern | Example |
|----------|---------|---------|
| Test plan | `{domain}-plan.md` | `settings-plan.md` |
| Generated spec | `{domain}.agent.spec.ts` | `settings.agent.spec.ts` |
| Healer log | `{domain}-heal-{date}.md` | `settings-heal-2026-03-31.md` |

## Rules

1. **Agent specs use `.agent.spec.ts` suffix.** This distinguishes them from hand-authored tests and allows separate Playwright project targeting.

2. **Healer fixes test-side issues only.** Allowed: locator updates, wait adjustments, assertion corrections, selector changes. Forbidden: modifying application code, changing app behavior, altering API responses.

3. **Hand-authored tests are untouchable.** Nothing in `tests/e2e/` is ever modified by any agent. Agent-generated tests live exclusively in `tests/agents/generated/`.

4. **Plans reference MCP exploration.** The Planner uses MCP Playwright (`tests/e2e/helpers/mcp.ts`) during the exploration phase to call tools on the live app at `https://mcp.huminicdev.com/dax/mcp`. Plans should note which MCP tools were used and what was discovered.

## Playwright Config Integration

Agent-generated tests are picked up by a dedicated project in `playwright.config.ts` that targets the `tests/agents/generated/` directory with a match pattern for `*.agent.spec.ts` files. This keeps agent tests isolated from hand-authored test runs while sharing the same base configuration (base URL, timeouts, viewport).
