# First-Wave Production Eval Sprint Order

Use this order unless the operator explicitly selects a different sprint.

## Recommended start sequence

1. **PE-AI-CHAT-01** — catches visible trust failures fastest
   - auto-scroll behavior
   - metric plausibility by store
   - drill-down usefulness
   - contact detail truth

2. **PE-TEAMBOX-01** — validates operator messaging workspace
   - thread pane population
   - sub-category refresh behavior
   - SMS filter truth
   - service-campaign visibility
   - escalation correctness

3. **PE-SALES-01** — validates management-facing trust surfaces
   - wrong zeros / impossible metrics
   - unwanted COST visibility
   - popout truth
   - trigger configuration visibility

4. **PE-INSIGHTS-01** — validates analytics and actionability
   - graph population
   - modal usefulness
   - contact-action buttons
   - library/report-card truth

5. **PE-SERVICE-CAMPAIGNS-01** — validates real service workflow continuity
   - outbound SMS execution
   - inbound response routing
   - TeamBox continuity
   - missing text-message responses
   - no service-campaign filter defects

6. **PE-INTEGRATIONS-01** — validates provider truth vs Nexxus truth
   - TextMagic send/receive
   - VAPI phone flows
   - Tavus popup/initiation
   - Resend outbound notifications
   - VIN Solutions lead verification

7. **PE-SETTINGS-01** — validates admin and invite/configuration flow
   - user invite email missing
   - trigger config edge cases
   - settings state and modal behaviors

## Why this order works

- It starts with the highest-visibility, highest-false-pass surfaces.
- It validates operator trust before lower-level admin polish.
- It forces cross-screen proof before provider-side proof is used to justify acceptance.
- It keeps the program in a strict one-sprint-at-a-time cadence.

## Suggested sprint-selection rules

- If a defect is **operator-visible and trust-breaking**, start with the owning UI section first.
- If a defect is **provider-visible but app-unproven**, do the owning UI sprint before the integration sprint.
- If a defect spans multiple sections, keep the sprint anchored in the initiating section and treat downstream screens as evidence surfaces only.
