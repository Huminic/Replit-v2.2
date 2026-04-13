# Independent Evaluation: AI Chat & Dashboard
**Evaluator:** Independent Verifier (Track 2)
**Date:** 2026-04-07
**Target:** https://dev.huminicdev.com
**Account:** duane.wells@huminic.ai / serra_honda@huminic.ai (see AUTH-01)
**Approach:** Blind evaluation using Playwright MCP browser tools. No fix logs or bug categorization consulted.

---

## Verdict: FAIL

The AI Chat page is non-functional due to two compounding critical issues: (1) authentication session instability that causes repeated logouts and random page redirects during normal use, and (2) the AI chat itself fails to produce any response when a message is submitted. These are not cosmetic issues — they prevent a real user from completing any workflow on the AI Chat page.

---

## Critical Findings

### AUTH-01: Authentication session instability — repeated logouts and random redirects
**Severity: CRITICAL**

The authenticated session drops every 10-30 seconds, cycling through:
1. User is on a page (e.g., AI Chat at `/`)
2. Page briefly shows "Loading..." state
3. Redirects to `/login`
4. Auto-recovers via refresh token to a random page (`/service`, `/teambox`, `/insights`, `/sales`)
5. Cycle repeats

This was observed consistently across 10+ navigation attempts during the evaluation. The user cannot stay on any page long enough to complete a meaningful interaction.

**Evidence:** Screenshots 01-17 in `evidence/SNP-001/eval-screenshots/` document repeated session drops. Console error: `ERR_FAILED @ /api/auth/refresh`.

**False-pass class:** Assertion-only. The login API returns 200 and valid tokens, but the frontend session management fails to maintain the authenticated state.

---

### AUTH-02: Login as super_admin stores wrong role in localStorage
**Severity: CRITICAL**

When logging in as `duane.wells@huminic.ai`:
- API response confirms: `role: super_admin, level: 1, organization: Huminic`
- localStorage stores: `nexxus-current-role: "org_admin"`
- UI shows: "Serra Honda Admin" / "serra_honda@huminic.ai" in the avatar dropdown
- No "Manage" nav item visible (super_admin feature)

The super_admin user's identity is being replaced by the serra_honda org_admin identity in the frontend. This is either a session collision issue or a role-mapping bug during login.

**Evidence:** Screenshot 07 (avatar dropdown showing serra_honda@huminic.ai). API response captured showing correct super_admin data contrasted with localStorage showing org_admin.

**False-pass class:** DOM-only. The login API returns correct data, but the rendered UI shows wrong user identity and permissions.

---

### CHAT-01: AI Chat does not respond to user messages
**Severity: CRITICAL**

After typing "What is our active pipeline count?" in the chat input and pressing Enter:
- The message appeared to be submitted (input cleared)
- No response appeared after 20 seconds of waiting
- The page remained showing the "Try asking..." suggested prompts
- No chat conversation thread was rendered
- No loading indicator appeared
- No error message was shown

The AI Chat is non-functional as an interactive feature.

**Evidence:** Screenshot 17 shows the page identical before and after message submission. Main content text captured confirms only metrics and suggested prompts — no chat response.

**False-pass class:** Partial-workflow. The chat input exists and accepts text, but the end-to-end flow (submit message -> get AI response -> display in thread) does not complete.

---

## High Findings

### NAV-01: Post-login landing page is unpredictable
**Severity: HIGH**

After login, the user lands on different pages each time:
- Attempt 1: `/sales/leads`
- Attempt 2: `/service`
- Attempt 3: `/teambox`
- Attempt 4: `/insights`
- Attempt 5: `/settings/system`

There is no consistent default landing page. The AI Chat page (`/`) was never the initial destination after login despite being the first nav item.

**Evidence:** Multiple login attempts documented in screenshots 03-05, 13-14.

---

### METRICS-01: AI Key Metrics show inconsistent data
**Severity: HIGH**

The 4 metric cards on the AI Chat page show different values depending on which session context loads:
- **Session A (Serra Honda with data):** Active Pipeline: 107, Appointments Today: 0, Open Escalations: 249, Outbound Sent 24h: 1
- **Session B (unknown/empty context):** All four metrics show 0

The same user viewing the same page sees fundamentally different data across page loads.

**Evidence:** Screenshots 10 (values 107/0/249/1) vs screenshots 16-17 (all zeros).

---

### METRICS-02: Open Escalations drill-down count contradicts card count
**Severity: HIGH**

- Metric card shows: "Open Escalations: 249"
- Clicking the card opens a modal showing: "0 live" and "showing first 100 of 0 records"
- Despite the "0 records" label, the table renders 6+ rows of "Unsent SMS - blocked" entries

Three numbers disagree: the card (249), the modal header (0), and the visible rows (6+).

**Evidence:** Screenshot 08 shows the modal with contradictory data.

---

## Medium Findings

### UI-01: Sidebar navigation labels truncated/missing
**Severity: MEDIUM**

When the sidebar is collapsed, one nav item between "Service" and "System" shows only an icon with no label — it appears to be "Insights" but the text is not rendered in the collapsed state.

**Evidence:** Screenshots 10, 16-17 show the collapsed sidebar with an unlabeled icon.

---

### UI-02: Header inconsistencies
**Severity: MEDIUM**

- Sometimes the org name ("Serra Honda") is displayed in the header center
- Other times the org name is completely absent
- The notification badge shows "591" which is an implausibly high number for a single dealership

**Evidence:** Compare screenshots 10 (org name present) vs screenshot showing no org name.

---

### UI-03: Suggested prompts rotate without user action
**Severity: LOW**

The 4 suggested prompt buttons change their text on each page load. Observed variations:
- "Which agents need review?", "Show KPIs for this month", "Compare store performance across locations", "What are the top escalations right now?"
- "Give me a dealership performance overview", "What hunches need my attention?", "How are we tracking against targets?", "Compare store performance across locations"
- "How are we tracking against targets?", "What hunches need my attention?", "What are the top escalations right now?", "Give me a dealership performance overview"

This is cosmetic and possibly by design, but noted for completeness.

---

## 8-Question Commentary

### What does this element show?
The AI Chat page shows a dashboard-like top section with 4 "AI Key Metrics" cards (Active Pipeline, Appointments Today, Open Escalations, Outbound Sent 24h), a set of 4 suggested prompt buttons labeled "Try asking...", and a chat input textbox at the bottom. There is no visible chat history, conversation thread, or AI response area on the default view.

### Is the data plausible and realistic?
Partially. When metrics load with data (107 pipeline, 249 escalations), the numbers are plausible for a dealership. However, the same user seeing all zeros on the next load undermines data trust. The 591 notification count is implausibly high.

### Does it respond to user interaction?
The metric cards are clickable and open drill-down modals (partial functionality — modal data contradicts card data). The chat input accepts text but does not produce an AI response. Suggested prompt buttons are clickable but their effect could not be reliably tested due to session instability.

### Are there any visual glitches or broken layouts?
The layout itself is clean and well-structured when it renders. No obvious CSS issues, overlapping elements, or broken responsive behavior. The primary issue is functional, not visual.

### Do loading states work correctly?
A "Loading..." state with a spinner is shown during session recovery, which is appropriate. However, there is no loading state for the AI chat response — after submitting a message, there is no spinner, progress indicator, or "thinking" state. The user has no feedback that anything is happening.

### Are error states handled?
No. When the AI chat fails to respond, no error message is shown. When the session drops, no "session expired" notification appears — the page just silently redirects. The "Invalid email or password" error on the login page was the only error state observed.

### Is the navigation intuitive?
The sidebar navigation is clear with labeled icons. However, the actual navigation behavior is broken — clicking nav items or loading pages causes unpredictable redirects. The AI Chat being at the root URL (`/`) rather than `/ai-chat` is noted but not necessarily a problem.

### Does this element agree with data shown elsewhere?
No. The Open Escalations metric (249 on the AI Chat card) contradicts the drill-down modal (0 records). The metric values on AI Chat (107 pipeline) do not match the Sales Dashboard (0 pipeline) seen when navigated there, suggesting different org contexts or data scoping issues.

---

## False-Pass Analysis

| Class | Element | Verdict |
|-------|---------|---------|
| Assertion-only | Login form | Exists and authenticates via API, but session drops repeatedly |
| DOM-only | Metric cards | Rendered with values, but values are inconsistent and drill-downs contradict |
| Data-render | AI Key Metrics | Real data when it loads, but fluctuates between populated and all-zeros |
| Partial-workflow | AI Chat send message | Input accepts text and submits, but no AI response is ever displayed |
| Partial-workflow | Login -> AI Chat | Login succeeds but lands on random pages, not AI Chat |

---

## Screenshots Reference

| File | Description |
|------|-------------|
| 01-initial-load.png | Initial page load (previous session, Marketing 404) |
| 02-dashboard-dkw.png | Login page after logout |
| 03-dashboard-after-login.png | Insights page after first login |
| 04-after-login-duane.png | Login page (stale session) |
| 05-clean-login-landing.png | Login page with autofill issue |
| 06-login-attempt.png | Clean login page |
| 07-ai-chat-page.png | AI Chat with Serra Honda identity leak in avatar dropdown |
| 08-ai-chat-main.png | Open Escalations drill-down modal with contradictory data |
| 09-ai-chat-clean.png | TeamBox page (navigated away from AI Chat) |
| 10-ai-chat-proper.png | **Best view of AI Chat page** with metrics and prompts |
| 11-ai-chat-response.png | Insights page (redirected during chat attempt) |
| 13-login-fail.png | TeamBox with skeleton loading state |
| 14-ai-chat-final.png | Insights page (redirected again) |
| 16-session-state.png | AI Chat page after stable login |
| 17-chat-response.png | AI Chat page after message submit — no response |

---

## Summary

Three critical issues prevent the AI Chat and Dashboard from being usable:

1. **AUTH-01:** Session instability causes logouts every 10-30 seconds with random page redirects
2. **AUTH-02:** Super_admin login resolves to wrong user identity (serra_honda org_admin)
3. **CHAT-01:** AI Chat accepts messages but never produces a response

Until AUTH-01 is resolved, no page in the application can be reliably evaluated or used. AUTH-02 affects access control integrity. CHAT-01 means the AI Chat feature is non-functional even when the session is momentarily stable.
