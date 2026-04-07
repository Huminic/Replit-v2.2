# PE-AI-CHAT-03 Pre-Execution Report

**Sprint:** PE-AI-CHAT-03
**Date:** 2026-04-07
**Operator Authorization:** Operator directed full production eval cycle with real workflow testing (2026-04-07)

## Objective

PE-AI-CHAT-03: Baseline production eval of the AI Chat / Main Dashboard section. Evaluate chat behavior, metric tiles, drill-downs, contact detail actionability, store switching, and data plausibility using the 8-question commentary methodology with false-pass detection. This is an observation eval — discover what's broken before fixing.

## Scope

**Section:** AI Chat / Main Dashboard (route: `/`, file: `client/src/pages/main.tsx`)
**Subsections:** Chat area, metric tiles (4), drill-down dialogs, contact detail view, chat history sidebar, suggestion buttons, store/org context

**Included flows:** 14 use cases (UC-CHAT-01 through UC-CHAT-14) as documented in section-function-map.md
**Excluded:** Other pages (Sales, Insights, TeamBox, Service, Settings) — evaluated in subsequent sprints

## Declared Files

- evidence/PE-AI-CHAT-03/pre-execution-report.md
- evidence/PE-AI-CHAT-03/section-function-map.md
- evidence/PE-AI-CHAT-03/use-case-inventory.md
- evidence/PE-AI-CHAT-03/acceptance-matrix.md
- evidence/PE-AI-CHAT-03/evidence-index.md
- evidence/PE-AI-CHAT-03/bug-log.md
- evidence/PE-AI-CHAT-03/post-sprint-report.md
- evidence/PE-AI-CHAT-03/enforcer-checklist.txt
- evidence/PE-AI-CHAT-03/cross-sign.md
- evidence/PE-AI-CHAT-03/workflow-audit.log

## Section / Page Function Map

See: evidence/PE-AI-CHAT-03/section-function-map.md (22KB, 14 use cases, full element inventory)

Key elements:
- 4 metric tiles (Active Pipeline, Appointments Today, Open Escalations, Outbound Sent 24h)
- Metric drill-down dialogs with tables and pagination
- Contact detail view (from Active Pipeline drill-down) with Call/Text actions
- Chat thread with streaming AI responses, Markdown rendering, copy/regenerate
- Chat input with suggestions, new conversation button, stop button
- Chat history sidebar (in SubMenuManager)
- Store/org context scoping all data

## Use Case Inventory

| UC-ID | Flow Name | Steps | Expected Outcome |
|-------|-----------|-------|-----------------|
| UC-CHAT-01 | Send message + AI response | Type → Enter → observe stream | Streaming response renders progressively |
| UC-CHAT-02 | Auto-scroll | Send message → scroll follows | Latest message visible without manual scroll |
| UC-CHAT-03 | Store switching | Switch org → metrics update | Tile values change to new org's data |
| UC-CHAT-04 | Drill-down opens | Click tile → dialog with table | Dialog shows records matching tile count |
| UC-CHAT-05 | Contact detail actionable | Drill-down → View Contact | Name, phone, email, Call/Text buttons |
| UC-CHAT-06 | Chat history | Navigate away → return | Previous conversations listed, resumable |
| UC-CHAT-07 | Suggestion buttons | Click suggestion → input populated | Text fills textarea, focused |
| UC-CHAT-08 | Data plausibility | Compare all 4 tiles | Values non-negative, reasonable, consistent |
| UC-CHAT-09 | New conversation | Click + → state resets | Messages cleared, tiles expand |
| UC-CHAT-10 | Stream abort | Send → click Stop | Streaming stops, partial content preserved |
| UC-CHAT-11 | Error handling | Trigger error → retry | Error banner shows, retry re-sends |
| UC-CHAT-12 | Phone click-to-call | Click phone in drill-down | Opens tel: URI, toast confirms |
| UC-CHAT-13 | Markdown rendering | Ask complex question | Bold, lists, tables render correctly |
| UC-CHAT-14 | Copy + Regenerate | Hover message → actions | Copy to clipboard, regenerate re-sends |

## Acceptance Criteria

(from sprints.json PE-AI-CHAT-03)

| AC-ID | Criterion | Verification Method |
|-------|-----------|-------------------|
| AC1 | Section function map in interface terms | section-function-map.md exists with all elements documented |
| AC2 | Chat response evaluated with evidence + commentary | UC-CHAT-01, UC-CHAT-02, UC-CHAT-13, UC-CHAT-14 |
| AC3 | Store switching evaluated for metric plausibility | UC-CHAT-03, UC-CHAT-08 |
| AC4 | Metric tiles + drill-downs evaluated for truth | UC-CHAT-04 (all 4 tiles), UC-CHAT-08 |
| AC5 | Contact details evaluated for actionability | UC-CHAT-05, UC-CHAT-12 |
| AC6 | Every flow has evidence, commentary, and result | All 14 UCs get 8-question commentary |
| AC7 | Bugs logged with severity + false-pass classification | bug-log.md maintained per flow |
| AC8 | Post-sprint confidence assessment | post-sprint-report.md with Go/No-Go |

## Test Plan

- Execute 14 use cases (UC-CHAT-01 through UC-CHAT-14) sequentially using Playwright MCP
- Single browser session per test account to avoid cookie contamination
- Per-flow: navigate → interact → screenshot → 8-question commentary → result status
- Cross-check: tile values vs drill-down row counts for all 4 metrics
- Cross-check: metric values before/after org switch (serra_honda → serra_ford)
- False-pass detection on every flow (assertion-only, DOM-only, data-render, partial-workflow)
- Bug logging to bug-log.md with severity + false-pass class
- No automated Playwright test files — this is manual eval via Playwright MCP

## Evidence Plan

Per flow:
- Before-action screenshot
- After-action screenshot
- Network/console observations
- 8-question commentary
- Result status (Accepted / Accepted with risk / Rejected / Blocked / Ambiguous)
- False-pass class if applicable

Cross-checks:
- Tile value vs drill-down row count (all 4 metrics)
- Metric values across org switches
- Contact detail fields vs VIN/CRM data

## Bug Handling Plan

- Bug ID prefix: BUG-CHAT-R3-
- Severity: critical / high / medium / low
- Type: from bug-taxonomy.md
- False-pass class: assertion-only / DOM-only / data-render / provider-only / partial-workflow
- Remediation: OBSERVATION ONLY for baseline. Fixes deferred to remediation sprint unless operator authorizes inline.
- Retest rule: if fix authorized, rerun exact failing flow + adjacent risk flows

## Action Boundary Review

| Action Type | Examples | Classification |
|-------------|----------|---------------|
| Navigate app, screenshot, read DOM | All flows | SAFE |
| Write to evidence/PE-AI-CHAT-03/ | All artifacts | SAFE |
| Read database (SELECT) | Metric verification | SAFE |
| Modify application code | Not planned | GATED (requires authorization) |
| npm run build / pm2 restart | Not planned | GATED |
| External API calls | Not planned | IRREVERSIBLE (requires approval) |

## Test Accounts

| Email | Role | Org | Use For |
|-------|------|-----|---------|
| duane.wells@huminic.ai | super_admin | Huminic | AC3 (store switching), AC4/AC5 (drill-downs) |
| serra_honda@huminic.ai | org_admin | Serra Honda | Primary eval (most data: 456 leads) |
| serra_ford@huminic.ai | org_admin | Tony Serra Ford | AC3 (cross-org metric comparison) |

## Not In Scope

- Other pages (Sales, Insights, TeamBox, Service, Settings)
- Code modifications (observation only)
- External service triggers (VAPI, TextMagic, VIN Solutions)
- Production deployment

---

**STATUS: Pre-execution report complete. STOPPED for Ghost Entry Gate (Step 2).**
