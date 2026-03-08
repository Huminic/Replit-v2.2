# Sweep 6 Report — Frontend Remediation

## Summary
Removed all mock data from production code paths, wired 3 RC-blocking UI panels to real backend APIs, deleted all orphaned mock files, and categorized remaining demo-mode actions.

## Completed Tasks

### T001: TopBar Activity Feed → Real API (UI-06)
- Replaced `staticActivityFeed` import with `useQuery` to `GET /api/activity-log`
- Maps API response to UI shape, handles loading/empty states

### T002: My Work Chat Tab → Real API (UI-02)
- Replaced `mockConversations` and `mockTeamboxConversations` with `useQuery` to `GET /api/conversations`
- AI Chat History shows empty state until AI chat history API exists

### T003: Insights Page → Real Backend (UI-01)
- Created two aggregation endpoints: `GET /api/insights/dashboard` and `GET /api/insights/reports`
- Replaced all 23 mock data imports with `useQuery` hooks computing variables from API data
- Wired hunches tab to existing `GET /api/hunches` API
- Deleted `client/src/lib/insight-data.ts` (725 lines of mock data)

### T005: OrgWizard → POST API
- Created `POST /api/organizations` route (super admin only)
- Wired frontend `handleCreate()` to use `useMutation`

### T006: Orphaned Mock Files Deleted
All 12 files in `client/src/mocks/` deleted (zero consumers confirmed):
- activity.ts, agents.ts, campaigns.ts, conversations.ts, files.ts, index.ts
- insights.ts, messages.ts, notifications.ts, tasks.ts, users.ts, widgets.ts

## T004: Demo-Mode Action Categorization

### DEFER (Post-MVP) — UI affordances that need future backend work
These are non-RC-blocking. They show "demo mode" toasts for features not yet built. The UI correctly indicates the feature is not available.

| File | Action | Reason to Defer |
|------|--------|-----------------|
| AgentConfigPane.tsx:485 | Add Trigger / Configure Triggers | Trigger editor is a Phase 2 feature |
| billing-management.tsx:106,110,220 | Send Invoice / Add Add-On / Preview Invoice | Billing integration (Stripe) is post-MVP |
| profile.tsx:550,561 | View Invoice | Requires billing integration |
| settings.tsx:1973 | Send embed instructions | Email delivery for widget embed code |
| settings.tsx:2532 | Tool toggling | Agent tool configuration not yet persisted |
| settings.tsx:2719 | API key rotation | Needs crypto key generation backend |
| settings.tsx:2866,2888 | Add/Delete URL | URL allowlist management |
| settings.tsx:3117 | Kill switch | Agent emergency disable (needs agent runtime) |
| settings.tsx:3269 | Scrape URL | Knowledge base URL scraping |
| settings.tsx:3296,3361 | Upload/Delete files | Knowledge base file upload processing |
| teambox.tsx:315 | File attachments | Chat file attachments |

### NOT DEMO-MODE (Real functionality, keep as-is)
| File | Action | Status |
|------|--------|--------|
| marketing.tsx:177 | Campaign dry run/start | Real functionality, wired to API |
| service.tsx:185 | Campaign dry run/start | Real functionality, wired to API |
| insights.tsx:1419 | Hunch Act/Dismiss | Toast confirms action (acceptable UX) |

### Recommendation
All demo-mode actions are correctly deferred with appropriate toast messaging. None are RC-blocking. No changes needed for RC milestone.
