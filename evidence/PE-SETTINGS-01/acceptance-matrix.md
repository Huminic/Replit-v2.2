# Acceptance Matrix: PE-SETTINGS-01

**Date:** 2026-04-06

---

## Acceptance Criteria to Use Case Mapping

| AC-ID | Criterion | Use Cases | Test Approach | Risk |
|-------|-----------|-----------|---------------|------|
| AC1 | Function map exists for selected Settings subsections in interface terms | ALL | Document all sections, UI elements, backend routes, and data flow per section | LOW |
| AC2 | User invite / add-user flow evaluated for visible outcome truth and missing email-configuration behavior | UC-01, UC-02, UC-05, UC-06 | Navigate to User Management, attempt Add User and Invite User flows, verify user creation and email behavior, check CommGate and RESEND_API_KEY interaction | HIGH |
| AC3 | Notification and tool-configuration surfaces evaluated for usefulness, clarity, and downstream implications | UC-08, UC-09, UC-10, UC-11, UC-12 | Navigate each config surface, toggle settings, verify persistence, check if settings have real downstream effect | MEDIUM |
| AC4 | Route-vs-inline navigation behavior that affects operator expectations documented | ALL | Document how tile grid -> section drill-down navigation works, check for URL-based routing vs inline state, note any confusing patterns | LOW |
| AC5 | Every executed flow has evidence, commentary, and result status | ALL | Screenshot every flow, document findings, assign PASS/PARTIAL/FAIL | LOW |
| AC6 | Bugs logged with severity, type, and false-pass classification where applicable | ALL | Every defect gets severity, integration source, false-pass flag if relevant | LOW |

---

## Known Issues Entering This Sprint

| Source | Issue | Relevant ACs |
|--------|-------|-------------|
| Operator report | Adding/inviting a user sends no email ("no email configured" shown for invite) | AC2 |
| I-235 | User creation emails bypass OUTBOUND_LIVE_ENABLED global kill switch | AC2 |
| Code analysis | CommGate check uses `org.outboundEnabled && org.emailEnabled` but NOT `OUTBOUND_LIVE_ENABLED` | AC2 |
| Code analysis | Notification preferences stored in org settings jsonb -- no per-user prefs | AC3 |
| Code analysis | Appearance prefs are localStorage only -- no cross-device persistence | AC3 |

---

## Risk Assessment

| Risk Level | ACs | Notes |
|------------|-----|-------|
| HIGH | AC2 | Invite/add-user email flow has known issues. CommGate interaction is complex. Real email send is IRREVERSIBLE. |
| MEDIUM | AC3 | Need to verify if notification toggles have real backend enforcement or are UI-only |
| LOW | AC1, AC4, AC5, AC6 | Standard documentation and evidence collection |

---

## Action Boundary Review

| Action | Classification | Approval Required |
|--------|---------------|-------------------|
| Navigate Settings sections, read configuration | SAFE | No |
| Open Add User / Invite User dialogs, fill fields | SAFE | No |
| Submit Add User (creates real user in DB) | GATED | Committed sprint required -- but observation-only eval may defer |
| Submit Invite User (creates user + may send email) | IRREVERSIBLE (if email sent) | Explicit operator approval |
| Toggle Communication Gate | GATED | Affects all outbound sends for org |
| Toggle individual channels | GATED | Affects channel-specific outbound |
| Save notification preferences | SAFE | Persists to DB but does not trigger external actions |
| Save appearance preferences | SAFE | localStorage only |

---

## Evaluation Mode

Default: **Observation + limited interaction.** User creation and invite flows will be evaluated by:
1. Reading the code to understand the flow (completed in function map)
2. Navigating the UI to verify dialog behavior, field validation, RBAC gates
3. Checking existing users in the list for evidence of prior invites
4. If operator approves: attempting a test invite to verify email delivery (IRREVERSIBLE)
