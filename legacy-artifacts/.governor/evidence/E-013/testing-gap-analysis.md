# Testing Gap Analysis — T-Sprint Coverage vs ACs & User Stories
**Date:** 2026-03-26

## Method
Cross-referenced every AC in acceptance_criteria.md (156 total) and every user story (US-001 through US-030) against the 9 T-sprint ACs to find coverage gaps.

---

## SEC Sprint Fixes vs T-Sprint Verification

| SEC Fix | What Changed | T-Sprint That Verifies It |
|---|---|---|
| SEC-07 I-117 Reset Tour | TopBar label | T-013.AC2 |
| SEC-07 I-118 Billing removed | TopBar dropdown | T-013.AC3 |
| SEC-07 I-120 AI Config RBAC | Settings tile | T-015.AC8 |
| SEC-07 I-127 My Work hidden | Sidebar nav | T-013.AC4 |
| SEC-01 I-126 Chat title | SubMenuManager | T-019.AC8 |
| SEC-01 I-126 Chat resume | main.tsx URL param | T-019.AC1 |
| SEC-03 I-112 Activity feed | sales.tsx useQuery | T-014.AC4 |
| SEC-03 I-114 Conversion rate | sales.tsx change:0 | T-014.AC5 |
| SEC-04 I-115 Sub-menu | SubMenuManager | T-013.AC5 |
| SEC-04 I-128 Campaign dismiss | service.tsx | T-013.AC8 |
| SEC-04 I-129 Tooltips | service.tsx | T-013.AC9 |
| SEC-05 I-115 Sub-menu | SubMenuManager | T-013.AC6 |
| SEC-05 I-113 Metric trends | marketing.tsx | **NOT COVERED** — no T-sprint verifies marketing metrics render without hardcoded trends |
| SEC-05 I-124 Duplicate agents | SubMenuManager | **NOT COVERED** — no T-sprint checks marketing popout has single agent section |
| SEC-06 I-115 Sub-menu | SubMenuManager | T-013.AC7 |
| SEC-08 I-119 Instant Call Back | widget-landing.tsx | T-013.AC10 + T-016.AC4 |
| SEC-08 I-121 Video popup | widget-landing.tsx | T-016.AC3 |

**Gaps from SEC fixes not verified by T-sprints:**
1. Marketing metrics render without hardcoded change/trend values
2. Marketing popout has no duplicate agent sections

---

## ACs Not Covered by Any T-Sprint

### S-1 (AI Chat)
| AC | Description | Covered? |
|---|---|---|
| S-1.AC1 | Page loads all 7 roles | T-013.AC11 (console errors) — but not explicitly per-role |
| S-1.AC4 | Streaming first token < 8s | **NOT COVERED** |
| S-1.AC5 | Thinking indicators | **NOT COVERED** |
| S-1.AC7 | Web search returns results | **NOT COVERED** |
| S-1.AC8 | Task creation via chat | **NOT COVERED** |
| S-1.AC9 | Multi-turn context | **NOT COVERED** |
| S-1.AC10 | Conversational tone | **NOT COVERED** |
| S-1.AC12 | Favorites add/remove/persist | **NOT COVERED** |
| S-1.AC13 | Chat history delete | **NOT COVERED** |
| S-1.AC14 | Chat history scroll 20+ items | **NOT COVERED** |
| S-1.AC16 | File upload (BL-075 — missing feature) | **NOT APPLICABLE** (feature doesn't exist) |

### S-2 (TeamBox)
| AC | Description | Covered? |
|---|---|---|
| S-2.AC1 | Top menu bar present | T-018 (implied but not explicit) |
| S-2.AC2 | Popout has SMS/Email/Phone/Video/Tasks | **NOT COVERED** |
| S-2.AC3 | "Conversations" NOT in popout | **NOT COVERED** |
| S-2.AC9 | Filter chips not light blue | **NOT COVERED** |
| S-2.AC11 | Manual message delivered (outbound_log) | T-018.AC4 |
| S-2.AC12 | STOP/opt-out adds to blacklist | **NOT COVERED** |
| S-2.AC13 | No messages to blacklisted phone | **NOT COVERED** |
| S-2.AC14 | Near-real-time within 10s | **NOT COVERED** |
| S-2.AC21 | Delete conversation | **NOT COVERED** (BL-076 — main page UI missing) |

### S-3 (Sales)
| AC | Description | Covered? |
|---|---|---|
| S-3.AC1 | 4 agents visible | **NOT COVERED** (SEC-03 had 5 — seed data issue) |
| S-3.AC2 | Descriptions not truncated | **NOT COVERED** |
| S-3.AC3 | "Data Guru" not "CRM Guru" | **NOT COVERED** |
| S-3.AC6 | Pipeline data renders | **NOT COVERED** |
| S-3.AC7 | Pipeline matches warehouse | **NOT COVERED** |
| S-3.AC8 | Calendar shows VAPI appointment | T-017a (implied) |
| S-3.AC15 | VAPI webhook → Sales Calendar | T-017a.AC4 (VIN lead, not calendar specifically) |
| S-3.AC16 | Hardcoded change values | **NOT COVERED** |

### S-4 (Service)
| AC | Description | Covered? |
|---|---|---|
| S-4.AC3 | New Campaign button visible | **NOT COVERED** |
| S-4.AC4 | CSV Upload button prominent | **NOT COVERED** |
| S-4.AC5 | Campaign detail dialog | **NOT COVERED** |
| S-4.AC7 | Only Nancy Gaston on Agents tab | **NOT COVERED** |
| S-4.AC8 | Nancy has instructions > 100 chars | **NOT COVERED** |
| S-4.AC15 | Service-filtered metrics | **NOT COVERED** (documented as BE limitation) |
| S-4.AC16 | Real trend data | **NOT COVERED** (documented as BE limitation) |

### S-5 (Marketing)
| AC | Description | Covered? |
|---|---|---|
| S-5.AC2 | No campaign data fetching | **NOT COVERED** |
| S-5.AC3 | 4 correct tab labels | **NOT COVERED** |
| S-5.AC4 | Studio filter pills | **NOT COVERED** |
| S-5.AC5 | Studio filters work | **NOT COVERED** |
| S-5.AC7 | Dashboard tiles match API | **NOT COVERED** |
| S-5.AC13 | StudioGallery has content | **NOT COVERED** |

### S-6 (Manage)
| AC | Description | Covered? |
|---|---|---|
| S-6.AC1 | No Dashboard/ROI tabs | **NOT COVERED** |
| S-6.AC5 | User Chats lists conversations | **NOT APPLICABLE** (placeholder — I-116) |
| S-6.AC6 | User Chats filter | **NOT APPLICABLE** |

### S-7 (System/Profile)
| AC | Description | Covered? |
|---|---|---|
| S-7.AC1 | All 8 settings sections render | **NOT COVERED** |
| S-7.AC2 | No agents in settings popout | **NOT COVERED** |
| S-7.AC9 | User Management CRUD | **NOT COVERED** |
| S-7.AC12 | Knowledge Base upload | **NOT COVERED** |
| S-7.AC13 | System prompt saves → affects chat | **NOT COVERED** |
| S-7.AC17 | Profile photo upload | **NOT COVERED** |
| S-7.AC18 | Profile edit saves | **NOT COVERED** |
| S-7.AC19 | Change password | **NOT COVERED** |
| S-7.AC21 | Notification data from real API | **NOT COVERED** |

### S-8 (Landing/Widgets)
| AC | Description | Covered? |
|---|---|---|
| S-8.AC2 | Store name top-left x5 dealers | T-014 (implied but not explicit for all 5) |
| S-8.AC3 | Widget appointment → DB | **NOT COVERED** |
| S-8.AC4 | Appointment in calendar | **NOT COVERED** |
| S-8.AC6 | Widget JS files serve valid JS x5 | **NOT COVERED** |
| S-8.AC7 | Widget JS has dealer name | **NOT COVERED** |

### S-9 (Cross-Cutting)
| AC | Description | Covered? |
|---|---|---|
| S-9.AC2 | No assistantId resolution errors in logs | **NOT COVERED** |
| S-9.AC3 | 9 weekend calls replayed | **NOT COVERED** (historical — may not be re-testable) |
| S-9.AC4 | VIN leads from replayed calls | **NOT COVERED** (same) |
| S-9.AC7 | Walk-in followup trigger | **NOT COVERED** |
| S-9.AC8 | Accessibility axe-core scan | **NOT COVERED** |

---

## User Stories Not Covered by T-Sprints

| US | Title | T-Sprint Coverage | Gap |
|---|---|---|---|
| US-005 | Walk-In Auto-Followup | **NONE** | No test for scheduled followup triggers |
| US-012 | Opt-Out Check | **NONE** | STOP/blacklist not in any T-sprint |
| US-013 | Widget Scheduling | **NONE** | Appointment booking via widget not tested |

---

## Additional Gaps Found

### Gap 9: STOP/Opt-Out Flow
No T-sprint tests the STOP keyword → blacklist → message blocking pipeline. This is a compliance requirement (TCPA). S-2.AC12/AC13 define it. US-012 requires it. It's completely missing from testing.

### Gap 10: Calendar / Appointment Continuity
VAPI calls should create appointments that appear in Sales Calendar (S-3.AC8, S-3.AC15). Widget bookings should create appointments (S-8.AC3/AC4, US-013). No T-sprint verifies any appointment flow end-to-end.

### Gap 11: Walk-In Auto-Followup Trigger
US-005 and S-9.AC7 require that a walk-in trigger fires a followup action. No T-sprint covers this. It's a scheduled/triggered behavior — needs a test that creates the trigger condition and verifies the action fires.

### Gap 12: Streaming Performance
S-1.AC4 requires first token within 8 seconds. No T-sprint measures streaming performance. A slow response is a bad user experience even if the content is correct.

### Gap 13: Accessibility
S-9.AC8 requires an axe-core scan on all major pages. No T-sprint includes accessibility testing. This affects all users and may have legal implications.

### Gap 14: Settings Functionality (Deep)
T-013 checks navigation labels. But no T-sprint verifies that Settings actually WORKS — User Management CRUD (S-7.AC9), Knowledge Base upload (S-7.AC12), system prompt changes affecting chat (S-7.AC13), profile photo upload (S-7.AC17), password change (S-7.AC19). These are all functional tests, not just "page renders."

### Gap 15: Studio / Creative Tools
Marketing Studio has filter pills (S-5.AC4/AC5), a gallery (S-5.AC13), and agent-produced artifacts (S-5.AC8 Photo Studio, S-5.AC14 Video Producer). None of these are tested. The creative toolset is completely uncovered.

### Gap 16: Near-Real-Time Message Delivery
S-2.AC14 requires new messages to appear in TeamBox within 10 seconds via polling. No T-sprint verifies real-time behavior — they all check state after the fact, not the latency of updates.

---

## Summary of All Gaps (Original 8 + New 8)

| # | Gap | Severity | Source |
|---|---|---|---|
| 1 | Org switcher data reload | T1 | Devil's advocate |
| 2 | Concurrent campaign overlap | T2 | Devil's advocate |
| 3 | Webhook failure recovery | T1 | Devil's advocate |
| 4 | Chat edge cases | T2 | Devil's advocate |
| 5 | Widget embed cross-origin | T1 | Devil's advocate |
| 6 | Billing API baseline | T1 | Devil's advocate |
| 7 | Password reset flow | T2 | Devil's advocate |
| 8 | Mobile responsiveness | T2 | Devil's advocate |
| 9 | STOP/opt-out (TCPA compliance) | T1 | AC/US diff |
| 10 | Calendar/appointment continuity | T1 | AC/US diff |
| 11 | Walk-in auto-followup trigger | T2 | AC/US diff |
| 12 | Streaming performance | T2 | AC diff |
| 13 | Accessibility (axe-core) | T2 | AC diff |
| 14 | Settings functionality (CRUD, upload, password) | T1 | AC diff |
| 15 | Studio/creative tools | T2 | AC diff |
| 16 | Near-real-time message latency | T2 | AC diff |
