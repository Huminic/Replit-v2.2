# Phase Manifest — Nexxus Connect v2.2

Status key: DONE | VERIFY | ACTIVE | BLOCKED | NOT_STARTED

| # | Phase | Status | Open Issues | Depends On | File |
|---|-------|--------|-------------|------------|------|
| 1 | Auth & Security | VERIFY | I-097, I-098 | — | 01-auth-security.md |
| 2 | Data Foundation & Sync | ACTIVE | I-090, I-095 | Phase 1 | 02-data-sync.md |
| 3 | Communications & CommGate | ACTIVE | I-087, I-091, I-092, I-101, I-102 | Phase 1 | 03-communications.md |
| 4 | Voice & Video | BLOCKED | I-093, I-094, I-099, I-100 | Phase 3 | 04-voice-video.md |
| 5 | TeamBox & Conversations | VERIFY | — | Phase 3 | 05-teambox.md |
| 6 | Campaigns & Outbound | ACTIVE | I-092 (shared w/ Phase 3) | Phase 3 | 06-campaigns.md |
| 7 | Triggers & Automation | ACTIVE | — | Phase 3, 4 | 07-triggers.md |
| 8 | AI Chat & Agents | VERIFY | — | Phase 1 | 08-ai-chat-agents.md |
| 9 | Notifications & Alerts | ACTIVE | I-087 (shared w/ Phase 3) | Phase 3, 4, 5 | 09-notifications.md |
| 10 | Department Pages | VERIFY | I-089 | Phase 2, 8 | 10-department-pages.md |
| 11 | Insights & Metrics | ACTIVE | I-090 (shared w/ Phase 2) | Phase 2 | 11-insights-metrics.md |
| 12 | Widgets & Landing | VERIFY | — | Phase 3, 4 | 12-widgets-landing.md |
| 13 | Settings & Admin | ACTIVE | — | Phase 1 | 13-settings-admin.md |
| 14 | Billing & Metering | VERIFY | — | Phase 13 | 14-billing.md |
| 15 | Launch Preparation | NOT_STARTED | — | All phases | 15-launch.md |

## Critical Path

```
Phase 1 (Auth) ─── mostly done, verify + fix I-097/I-098
    |
    ├── Phase 3 (Communications) ─── 5 open issues, CRITICAL
    |       |
    |       ├── Phase 4 (Voice/Video) ─── 4 open issues, BLOCKED on Phase 3
    |       |       |
    |       |       └── Phase 7 (Triggers) ─── needs comms + voice working
    |       |
    |       ├── Phase 5 (TeamBox) ─── verify only
    |       |
    |       ├── Phase 6 (Campaigns) ─── shares I-092 with Phase 3
    |       |
    |       └── Phase 9 (Notifications) ─── needs comms pipeline
    |
    ├── Phase 2 (Data/Sync) ─── I-090, I-095
    |       |
    |       ├── Phase 10 (Dept Pages) ─── verify, fix I-089
    |       |
    |       └── Phase 11 (Insights) ─── shares I-090 with Phase 2
    |
    ├── Phase 8 (AI Chat) ─── verify only
    |
    ├── Phase 13 (Settings) ─── active, needs VIN lead config
    |       |
    |       └── Phase 14 (Billing) ─── verify
    |
    └── Phase 12 (Widgets) ─── verify, needs comms + voice
            |
            └── Phase 15 (Launch) ─── last
```

## Sprint Count Estimate

| Phase | Verification Sprints | Development Sprints | Total |
|-------|---------------------|-------------------|-------|
| 1 | 3 | 2 | 5 |
| 2 | 2 | 3 | 5 |
| 3 | 1 | 6 | 7 |
| 4 | 1 | 5 | 6 |
| 5 | 3 | 1 | 4 |
| 6 | 1 | 3 | 4 |
| 7 | 1 | 3 | 4 |
| 8 | 3 | 1 | 4 |
| 9 | 1 | 3 | 4 |
| 10 | 4 | 2 | 6 |
| 11 | 1 | 2 | 3 |
| 12 | 2 | 1 | 3 |
| 13 | 2 | 3 | 5 |
| 14 | 2 | 0 | 2 |
| 15 | 0 | 4 | 4 |
| **Total** | **27** | **39** | **66** |
