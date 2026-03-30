# Post-Reconciliation UI Walkthrough

**Date:** 2026-03-29 08:45-08:55 UTC
**Tester:** Dev (Playwright MCP automated walkthrough)
**Environment:** https://dev.huminicdev.com
**User:** serra_honda@huminic.ai (Organization Admin)

## Page Results

| Page | Loads | Visual Issues | Screenshot |
|------|-------|--------------|------------|
| / (AI Chat) | YES | None. 4 metric tiles, chat input, 4 suggestion chips all render correctly. | `walkthrough-2026-03-29/01-ai-chat.png` |
| /teambox | YES | None. Conversation list (272 items), channel sidebar (SMS/Email/Phone/Video/Tasks), customer info panel all render. | `walkthrough-2026-03-29/02-teambox.png` |
| /sales | YES | None. 7 metric tiles, 4 agents in sidebar, Dashboard/Agents/Insights/Calendar tabs, Top Performing Agents, Recent Activity all render. | `walkthrough-2026-03-29/03-sales.png` |
| /service | YES | None. Campaign table with data, New Campaign button, Upload CSV button, Kill Switch toggles all functional. | `walkthrough-2026-03-29/04-service.png` |
| /service (Insights) | YES | None. 6 service metrics (Active Campaigns 12, Messages Sent 10, etc.), full insights dashboard below. No fake trends. | `walkthrough-2026-03-29/04b-service-insights.png` |
| /marketing | YES | Only 3 metric tiles visible in viewport (Campaigns Active 0, Messages Sent 0, Replies Received 0). Campaign Performance 0% partially hidden behind sidebar. 5 agents listed. | `walkthrough-2026-03-29/05-marketing.png` |
| /management | YES (redirect) | Correctly redirects to / (AI Chat) for org_admin user. No Management nav item in sidebar. | `walkthrough-2026-03-29/06-management-redirect.png` |
| /insights | YES | Full insights dashboard: Immediate Action Required, Watch List, Today's Performance, Pipeline Health, Performance Scorecard, Leads This Week, Conversions by Day. Tabs: Dashboard/Reports/Library/Hunches. | `walkthrough-2026-03-29/07-insights.png` |
| /settings/system | YES | 6 settings tiles: User Management, Organization, Tools & Integrations, Knowledge Base, Notifications, Appearance. | `walkthrough-2026-03-29/08-settings-system.png` |
| /settings/system (Users) | YES | User list with 2 users (Serra Honda Admin, T022e Test Updated). Add User and Invite User buttons present. | `walkthrough-2026-03-29/08a-settings-users.png` |
| /settings/system (Organization) | YES | Organization settings, Business Hours, Communication Gate, Channel Controls all render. CommGate toggle visible. | `walkthrough-2026-03-29/08b-settings-organization.png` |
| /agents | YES | Empty state: "Select an Agent" with "Create New Agent" button. No agent list visible on this page (agents are accessed through zone pages). | `walkthrough-2026-03-29/09-agents.png` |
| /login | YES | Clean login form with Email/Password fields, Sign in button, Forgot password link. Dark themed background. | `walkthrough-2026-03-29/10-login.png` |
| /forgot-password | YES | Reset form with Email field, "Send reset instructions" button, "Back to login" link. Different background from login. | `walkthrough-2026-03-29/11-forgot-password.png` |
| /p/serra-honda (Landing) | YES | Full landing page: lead capture form (First/Last Name, Phone, Email, Interest), video chat section with agent avatar, stats (500+ Vehicles, 4.9 Rating, 24/7 Available), chat widget. | `walkthrough-2026-03-29/12-landing-page.png` |

## S4 Verification: Campaign Dialog
- **Checkboxes present:** YES
- **Channels available:** SMS (checked by default), Email (checkbox), Phone Call (checkbox)
- **No dropdown:** Confirmed -- all channels are individual checkboxes
- **Dialog fields:** Campaign Name (text input), Channels (checkboxes), Message Template (textarea)
- **Buttons:** Cancel, Create Campaign
- **Screenshot:** `walkthrough-2026-03-29/04a-service-new-campaign-dialog.png`

## S9 Verification: Management Redirect
- **Redirected for org_admin:** YES
- **Redirect target:** / (AI Chat homepage)
- **Management nav item visible:** NO (correctly removed from sidebar)

## S3 Verification: TeamBox Filters
- **Channels present:** SMS (14), Email (2), Phone (39), Video, Tasks
- **WhatsApp removed:** YES -- not present anywhere on page
- **Web Chat removed:** YES -- not present anywhere on page
- **Note:** Channel filters are in the sidebar, not as filter pills/tabs above the conversation list. "Voice" label shows as "Phone" instead.

## S10 Verification: Unauthorized Agent
- **Sales agents count:** 4 (Caroline, Data Guru, Sales Coach, Communication Writer)
- **"Unauthorized Agent" visible:** NO -- correctly removed

## Marketing Agents Verification
- **Agent count:** 5
- **Agent names:** Photo Studio, Video Producer, Copywriter, Creative Director, Market Intel
- **Note:** Names differ from spec expectations (Ad Copywriter -> Copywriter, Score Card -> Creative Director, Competitor Radar -> Market Intel). This may be intentional renaming.

## Console Errors Observed
- `Failed to load resource: 404` on conversation message endpoints (non-blocking, appears to be stale conversation references)
- `Query error: 404: Conversation not found` (non-blocking)
- `Each child in a list should have a unique "key" prop` React warning (non-blocking)
- `validateDOMNesting` warning on forgot-password page (non-blocking)

## Session Behavior Note
- Direct URL navigation (page.goto) causes session loss, redirecting to /login
- SPA navigation via sidebar buttons maintains session correctly
- This suggests the auth token refresh mechanism may have an issue with full page reloads, or the token has a very short TTL

## Issues Found
1. **Marketing Dashboard tile count:** Only 3 metric tiles visible (Campaigns Active, Messages Sent, Replies Received). The 4th tile (Campaign Performance) is partially hidden behind the sidebar panel. Scrolling or closing the sidebar would reveal it. Minor layout issue.
2. **/agents page empty state:** The /agents route shows an empty "Select an Agent" screen with no agent list. Agents are only accessible through their respective zone pages (Sales, Service, Marketing). This may be by design but could be confusing for users navigating directly to /agents.
3. **Marketing agent names mismatch:** Agent names (Copywriter, Creative Director, Market Intel) differ from what was specified (Ad Copywriter, Score Card, Competitor Radar). Verify if this was an intentional rename.
4. **Console errors:** Multiple 404 errors on conversation message endpoints. Non-blocking but indicates orphaned conversation references.

## Overall Assessment
**All 15 pages/views load successfully.** All sprint verification criteria (S3, S4, S9, S10) PASS. No blocking visual issues. The application is functionally complete across all tested routes.
