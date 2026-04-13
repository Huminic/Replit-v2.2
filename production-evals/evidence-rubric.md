# Evidence Rubric for Production Evals

## Core rule

No flow is accepted without evidence and commentary.

## Minimum evidence set by flow class

### 1. UI-only flow
Use when evaluating visible layout, selection state, tab switching, or modal behavior.

Required:
- before-action screenshot
- after-action screenshot
- route / URL capture
- visible text or state proof
- commentary

### 2. Metric / data-heavy flow
Use when tiles, charts, counts, lists, or summaries are being evaluated.

Required:
- before-action screenshot
- after-action screenshot
- drill-down screenshot or equivalent detail proof
- route / URL capture
- visible data proof
- commentary on plausibility and contradictions
- at least one corroborating comparison (adjacent tile, activity feed, list, store context, or source record)

### 3. Cross-screen workflow flow
Use when a task starts in one area and should show up in another.

Required:
- source-screen evidence
- downstream-screen evidence
- route / URL captures for both
- persisted or refreshed state check where relevant
- commentary on continuity

### 4. External / provider-integrated flow
Use when SMS, calls, video, email, webhook, or CRM activity is involved.

Required:
- source-screen evidence
- downstream Nexxus UI evidence
- provider/log evidence when approved and available
- commentary on whether provider truth matches app truth
- explicit note on whether the action was sent, attempted, blocked, or unproven

## Evidence tiers

| Tier | Description | When acceptable |
|---|---|---|
| Bronze | Single-surface proof with screenshots and commentary | Low-risk UI-only spot checks |
| Silver | Multi-state proof with route/state evidence and commentary | Standard section eval flows |
| Gold | Cross-screen or cross-system proof with corroboration and persistence checks | Core workflows, metrics, TeamBox continuity, campaign flows |
| Platinum | Gold plus provider/source-system corroboration and retest delta proof | High-risk production claims and remediation signoff |

## Required tier by outcome type

| Outcome Type | Minimum Tier |
|---|---|
| Cosmetic / low-risk UI issue | Bronze |
| Standard section acceptance | Silver |
| Metric credibility claim | Gold |
| TeamBox / conversation continuity claim | Gold |
| Campaign / SMS / phone / video workflow claim | Gold |
| External provider + UI alignment claim | Platinum preferred |
| Fix verification for critical defect | Platinum |

## Commentary requirements tied to evidence

Evidence is incomplete unless commentary answers:
1. What was under evaluation?
2. What should have happened?
3. What actually happened?
4. What proves it?
5. Does the data look believable?
6. What result status follows from that?

## Evidence index standard

Every sprint should maintain an evidence index with:
- use case ID
- artifact type
- file/reference
- what it proves
- tier level

## Acceptance blockers

A flow is automatically blocked from acceptance if any of the following are true:
- screenshots exist but no commentary exists
- commentary exists but artifacts do not support it
- provider/log success exists but UI evidence is missing for UI-visible workflow claims
- data is shown but no plausibility or contradiction check was performed on a data-heavy flow
- a fix was applied but the exact failing flow was not rerun
- downstream continuity is claimed but downstream evidence is missing

## Red flags that require escalation

- All-green automation with obvious operator-visible breakage
- Metrics that contradict visible records or store context
- Blank or stale panes after selection actions
- Filters that contradict the visible dataset
- Modals that technically load but are operationally meaningless
- Any core flow accepted on assertion output alone
