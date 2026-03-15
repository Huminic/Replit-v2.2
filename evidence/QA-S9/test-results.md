# QA-S9 Test Results: Authenticated Auth Flows (L2/L3)

Timestamp: 2026-03-15
Method: Dual independent agents (A and B), results compared by orchestrator

## Test Results

| # | Test | Agent A | Agent B | Concordance |
|---|------|---------|---------|-------------|
| T1 | Login landing page (all roles → main chat) | PASS | PASS | Agree |
| T2 | Wrong creds message + reset link | PASS | PASS (different message) | Disagree on detail |
| T3 | Logout returns to login | DEFECT | PASS | Disagree |
| T4 | RBAC: Sales/Marketing no Manage/System | PASS | PASS | Agree |
| T5 | RBAC: Admin has Manage + System | PASS | PASS | Agree |
| T6 | Org switch Super Admin (6 orgs) | PASS | PASS | Agree |
| T7 | Sales can't switch orgs | PASS | PASS | Agree |

**Result: 5/7 PASS, 2 DEFECT**

## Defects

| # | Defect | Severity | Evidence |
|---|--------|----------|----------|
| 1 | Logout triggers intermittent React DOM error: "Failed to execute 'removeChild' on 'Node'" — error boundary fires, dashboard partially visible behind error modal | MAJOR | Agent A screenshot: qa-s9-agent-a-logout.png. Agent B did not reproduce (race condition). |
| 2 | Frontend shows "Login failed" instead of API's "Invalid email or password" on wrong credentials — generic catch-all in AuthContext.tsx:135 swallows specific error | MINOR | Agent B code review confirmed. Agent A saw the API message directly. |

## Observations

| # | Observation | Found By |
|---|-------------|----------|
| 1 | Menu labels are "Manage" and "System" (not "Management" and "Settings" as user described) — naming confirmation needed | Both |
| 2 | Auth rate limiter (5 req/15 min) caused significant test friction — both agents hit it multiple times | Both |
| 3 | Executive role sees Manage but NOT System — different from other admin roles | Agent A |
| 4 | Sales accessibleOrganizations is null (Agent B) or array of 1 (Agent A) — inconsistent but functionally same | Both |

## Authenticated Screenshots Captured

| Role | Agent A | Agent B |
|------|---------|---------|
| Super Admin | qa-s9-agent-a-super-admin.png | qa-s9-agent-b-super-admin.png |
| Partner Admin | qa-s9-agent-a-partner-admin.png | — |
| Org Admin | qa-s9-agent-a-org-admin.png | — |
| Sales | qa-s9-agent-a-sales.png | qa-s9-agent-b-sales.png |
| Marketing | qa-s9-agent-a-marketing.png | qa-s9-agent-b-marketing.png |
| Executive | qa-s9-agent-a-executive.png | — |
| Login Error | qa-s9-agent-a-login-error.png | qa-s9-agent-b-login-error.png |
| Logout | qa-s9-agent-a-logout.png | qa-s9-agent-b-logout.png |
| Org Switch | qa-s9-agent-a-org-switch.png | qa-s9-agent-b-org-switch.png |

## RBAC Menu Verification

| Role | Menu Items | Manage | System |
|------|-----------|--------|--------|
| Super Admin | AI Chat, TeamBox, My Work, Sales, Service, Marketing, Manage, Billing, System, Logout | YES | YES |
| Partner Admin | AI Chat, TeamBox, My Work, Sales, Service, Marketing, Manage, Billing, System, Logout | YES | YES |
| Org Admin | AI Chat, TeamBox, My Work, Sales, Service, Marketing, Manage, Billing, System, Logout | YES | YES |
| Executive | AI Chat, TeamBox, My Work, Sales, Service, Marketing, Manage, Billing, Logout | YES | NO |
| Sales | AI Chat, TeamBox, My Work, Sales, Billing, Logout | NO | NO |
| Marketing | AI Chat, TeamBox, My Work, Marketing, Billing, Logout | NO | NO |

## Domain Status

| Domain | L1 | L2 | L3 | Status |
|--------|:--:|:--:|:--:|--------|
| Authentication | PASS | DEFECT (logout bug, error message) | PASS (screenshots captured) | 2 defects found |
