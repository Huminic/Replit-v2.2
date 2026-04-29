# Marketing v2.3 narrow gate/banner — implementation evidence

Date: 2026-04-27
Priority: #4 in operator queue (launch-readiness closeout 2026-04-27)
Spec asserted: `tests/e2e/s99-codex-launch-readiness-readonly.spec.ts` line 117

## Scope

Narrow client-side banner on `/marketing*` indicating v2.3 preview status.
No redesign. Existing dashboard / agents / studio / insights surfaces remain
visible and read-only browsable. Outbound campaign sends remain governed by
existing CommGate / outbound governance — no server-side changes.

## Files changed

- `client/src/pages/marketing.tsx` — added inline `<div>` banner above the
  conditional AgentChatView / tabbed view; added `Info` icon to the existing
  lucide-react import.

## Files NOT changed (out of scope, deliberately untouched)

- `client/src/App.tsx` (route registration)
- `client/src/components/layout/Sidebar.tsx` (Marketing nav link still visible)
- `client/src/components/marketing/*.tsx` (sub-components untouched)
- Server-side files (no API gate added — banner-only is sufficient)
- `shared/schema.ts`
- `decisions.md`, `.claude/session.md`

## Banner copy (visible body text)

```
Marketing is in v2.3 preview. Campaign sends are not yet enabled in this
release. Browsing is read-only — outbound actions are disabled.
```

This contains three of the spec's six required keyword alternatives:
`v2.3`, `preview`, `disabled` (regex: `/coming soon|v2\.3|beta|not available|disabled|preview/i`).

## Delta 1 — TypeScript compilation

```
$ npx tsc --noEmit
(no output, exit 0)
```

## Delta 2 — Unit test suite

```
$ npm run test:unit
Test Files  13 passed | 1 skipped (14)
Tests  392 passed | 4 skipped (396)
Duration  35.81s
```

Matches the 392-passed baseline. No regressions.

## Pending verification (deferred to post-rebuild)

- Playwright spec `tests/e2e/s99-codex-launch-readiness-readonly.spec.ts`
  test "Marketing surface is either gated or clearly marked not launch-ready"
  cannot be run until the next batched rebuild. Static analysis confirms
  the spec's regex now matches the visible body text.

## Scope marker

`.claude/state/scope/marketing.tsx.ok` — written before each Edit, auto-cleared
on use.
