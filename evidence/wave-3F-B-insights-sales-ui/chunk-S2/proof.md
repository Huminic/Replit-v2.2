# Wave 3F-B Chunk S2 — Add `/work-center` route

**Commit SHA:** `0b0405a97d60a7ac71bc4be7ff5f3f0875c7ef9d`
**Date:** 2026-05-07

## Scope

Single-line route addition to `client/src/App.tsx`. Adds `/work-center` mapped to `MyWorkPage` so mobile-nav sublinks (`/work-center?tab=calendar|leads|inbox`, `/work-center/tasks`) stop 404'ing.

## Diff

```diff
                 <Route path="/my-work" component={MyWorkPage} />
+                <Route path="/work-center" component={MyWorkPage} />
                 <Route path="/sales" component={SalesPage} />
```

Inserted at line 70 (between `/my-work` line 69 and `/sales` line 71). Adjacent to `/my-work` for readability and because the two routes are semantically equivalent in this wave's mapping.

## Component-choice rationale

**Picked:** `MyWorkPage`

- Already imported at App.tsx:18 (no new import needed — wave-bookend confirmed).
- The 4 mobile-nav sublinks target `/work-center?tab=calendar|leads|inbox` and `/work-center/tasks`. `MyWorkPage` is the closest semantic match for a tabbed personal-work hub (calendar/leads/inbox/tasks).
- Per `MobileSidebar.tsx:25` and `settings.tsx:3418`, `/work-center` is labeled "Hub" — a top-level concept. `MyWorkPage` naturally embodies a hub of personal work artifacts.
- Alternative considered: `TeamboxPage` — rejected because Teambox has a different conceptual scope (team-level views, multi-user channels) and the sublinks `?tab=calendar|leads|inbox` are personal-scope, matching MyWorkPage.

The page already ignores unknown `?tab=*` query params (acceptable per wave-bookend). This wave's only requirement is that the route returns 200 — full per-tab rendering is out of scope.

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASS (silent) |
| `npx vitest run tests/unit/` | PASS — 452 passed / 2 skipped (matches worktree baseline) |

## Files touched

- `client/src/App.tsx` (1 inserted line)

## Scope markers

- `.claude/state/scope/App.tsx.ok`

## Out-of-scope confirmations

- `MobileNavDropdown.tsx`, `MobileSidebar.tsx`, `settings.tsx`, `notification-utils.ts` — NOT modified per explicit wave-bookend rule. They already correctly reference `/work-center`; only the route needed to exist.
- No new imports added.
