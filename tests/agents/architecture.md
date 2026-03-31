# Test Agent Architecture

## Three-Agent Workflow

```
  +------------+       +-------------+       +-----------+
  |  PLANNER   | ----> |  GENERATOR  | ----> |  HEALER   |
  | (explore)  |       | (codegen)   |       | (repair)  |
  +------------+       +-------------+       +-----------+
       |                     |                     |
       v                     v                     v
  plans/{domain}-plan.md   generated/{domain}    healer/{domain}
                           .agent.spec.ts        -heal-{date}.md
```

### Phase 1: Plan

The Planner agent receives a domain or feature area and explores the live application using MCP Playwright. It navigates pages, takes snapshots, inspects elements, and documents what it finds.

**MCP Playwright role:** The Planner connects to the MCP endpoint (`https://mcp.huminicdev.com/dax/mcp`) via the helper at `tests/e2e/helpers/mcp.ts`. MCP provides browser automation tools — navigate, click, snapshot, evaluate — that let the Planner interact with the running app without writing test code. The Planner uses these tools to:
- Discover page structure and available UI elements
- Identify interactive flows (forms, modals, navigation)
- Determine role-based visibility (which elements appear for which user roles)
- Map data dependencies (what data must exist for a page to render correctly)

The output is a markdown plan documenting testable scenarios, required roles, page routes, and expected behaviors.

### Phase 2: Generate

The Generator agent reads a plan and produces a Playwright spec file. It follows established patterns:
- Authentication via API login (POST `/api/auth/login`)
- Tour dismissal via `localStorage` initialization
- Navigation with `domcontentloaded` wait strategy
- Assertions against visible content, URLs, and element states

Generated specs are self-contained — each file includes its own setup and teardown.

### Phase 3: Heal

When agent-generated tests fail, the Healer agent analyzes the failure output and applies targeted repairs.

**Allowed fixes:**
- Update CSS/role/text selectors when the UI changes
- Adjust `waitForTimeout` or `waitForSelector` durations
- Correct assertion values that reflect legitimate UI changes
- Fix test logic errors (wrong page, wrong role, race conditions)

**Forbidden:**
- Modifying application source code
- Changing API endpoints or responses
- Altering test infrastructure or shared helpers
- Removing tests to make suites pass

Each heal operation produces a log entry in `healer/` documenting what failed, why, and what was changed.

## Coexistence with Hand-Authored Tests

```
tests/
  e2e/                    # Hand-authored (NEVER modified by agents)
    seed.spec.ts
    domain-01-*.spec.ts
    domain-02-*.spec.ts
    ...
    helpers/
      mcp.ts
      auth.ts
  agents/                  # Agent-managed
    plans/
    generated/             # *.agent.spec.ts files
    healer/
```

The two test directories are completely independent:
- **`tests/e2e/`** — Owned by human developers. 409 tests across 25 spec files. Agents never read from or write to this directory during execution.
- **`tests/agents/generated/`** — Owned by agents. The `.agent.spec.ts` suffix makes these instantly identifiable.

Both directories can share the same Playwright config, helpers, and base URL. The separation is enforced by convention and by distinct Playwright project configurations.

## Playwright Config Integration

Agent tests run as a separate Playwright project. The config entry targets the `tests/agents/generated/` directory:

```
{
  name: "agent-tests",
  testDir: "./tests/agents/generated",
  testMatch: /\.agent\.spec\.ts$/,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5000",
    viewport: { width: 1280, height: 720 },
  },
  timeout: 120_000,
}
```

This allows running agent tests independently (`npx playwright test --project=agent-tests`) or alongside hand-authored tests in a full suite run.

## Seed Strategy

Agent-generated tests replicate the seed pattern from `tests/e2e/seed.spec.ts`:

1. **API login** — POST to `/api/auth/login` with test credentials to establish the session cookie
2. **Tour dismissal** — Inject `localStorage` entries via `addInitScript` to suppress product tour overlays
3. **Navigation** — `page.goto()` with `waitUntil: 'domcontentloaded'` and a short stabilization wait
4. **Verification** — Confirm the page loaded (URL check, content length check)

Available test roles and credentials are documented in `seed.spec.ts`. The standard test password is shared across all test accounts. Each generated spec declares which role it needs and performs its own login — no shared state between spec files.

## Quality Gates

Generated tests must clear these gates before they can be considered valid:

1. **Syntax** — The spec file must be valid TypeScript that Playwright can parse
2. **Execution** — All tests in the spec must pass on a clean run (`npx playwright test --project=agent-tests`)
3. **Isolation** — Tests must not depend on execution order or state from other spec files
4. **Stability** — Tests must pass on 3 consecutive runs without flakes
5. **Review** — A human or Ghost agent reviews the spec for correctness and coverage value before merge

No agent-generated test is merged into the main branch until all five gates pass.
