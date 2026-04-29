# E-013 AC Priority Index
**Date:** 2026-03-26
**Purpose:** T1/T2/T3 priority labels for all 156 ACs. Sprint specs reference this for execution order.

## Priority Definitions
- **T1:** Data integrity, external data flow, CRM sync, webhooks, integrations — must work for launch
- **T2:** Metrics accuracy, campaign execution, chat quality, agent functionality — daily user features
- **T3:** Advanced settings, governance, appearance — nice-to-have for launch

---

## S-0: Foundation (all T1)
S-0.AC0–AC14: **T1**

## S-1: AI Chat
| AC | Priority |
|---|---|
| S-1.AC1 (page loads all roles) | T1 |
| S-1.AC2 (metric tiles render) | T2 |
| S-1.AC3 (chat input visible) | T1 |
| S-1.AC4 (streaming < 8s) | T2 |
| S-1.AC5 (thinking indicators) | T3 |
| S-1.AC6 (VIN data query) | T1 |
| S-1.AC7 (web search) | T2 |
| S-1.AC8 (task creation) | T2 |
| S-1.AC9 (multi-turn context) | T2 |
| S-1.AC10 (conversational tone) | T3 |
| S-1.AC11 (chat history list) | T2 |
| S-1.AC12 (favorites cycle) | T2 |
| S-1.AC13 (history delete) | T2 |
| S-1.AC14 (history scroll) | T3 |
| S-1.AC15 (tile drill-down) | T2 |
| S-1.AC16 (file upload) | T2 |
| S-1.AC17 (chat quality) | T2 |

## S-2: TeamBox
| AC | Priority |
|---|---|
| S-2.AC1–AC4 (menu/popout structure) | T2 |
| S-2.AC5–AC8 (VAPI/Tavus logs) | T2 |
| S-2.AC9 (filter chips color) | T3 |
| S-2.AC10–AC11 (manual message send+deliver) | T1 |
| S-2.AC12–AC13 (STOP/opt-out) | T1 |
| S-2.AC14 (near-real-time) | T2 |
| S-2.AC15–AC16 (human takeover) | T1 |
| S-2.AC17 (agent/human filter) | T2 |
| S-2.AC18 (form submissions) | T2 |
| S-2.AC19 (message history renders) | T1 |
| S-2.AC20 (campaign convos in TeamBox) | T1 |
| S-2.AC21 (delete conversation) | T2 |

## S-3: Sales
| AC | Priority |
|---|---|
| S-3.AC1–AC3 (agent cards) | T2 |
| S-3.AC4–AC7 (metrics match API) | T1 |
| S-3.AC8 (calendar appointment) | T1 |
| S-3.AC9–AC11 (agent chat tests) | T2 |
| S-3.AC12 (Recent Activity real data) | T2 |
| S-3.AC13 (conversion rate delta) | T1 |
| S-3.AC14 (Active Pipeline consistency) | T1 |
| S-3.AC15 (VAPI → calendar) | T1 |
| S-3.AC16 (hardcoded change values) | T2 |

## S-4: Service
| AC | Priority |
|---|---|
| S-4.AC1–AC2 (Campaigns first, no Dashboard) | T2 |
| S-4.AC3–AC4 (New Campaign + CSV buttons) | T2 |
| S-4.AC5 (campaign detail dialog) | T2 |
| S-4.AC6 (Insights KPI tiles) | T2 |
| S-4.AC7–AC8 (Nancy only, instructions) | T2 |
| S-4.AC9 (campaign E2E) | T1 |
| S-4.AC10 (reply → TeamBox) | T1 |
| S-4.AC11–AC12 (Nancy chat tests) | T2 |
| S-4.AC13–AC14 (after-hours) | T2 |
| S-4.AC15 (service-filtered metrics) | T2 |
| S-4.AC16 (real trend data) | T2 |
| S-4.AC17 (sub-menu fix) | T3 |
| S-4.AC18 (full campaign E2E) | T1 |

## S-5: Marketing
| AC | Priority |
|---|---|
| S-5.AC1–AC3 (no Campaigns, correct tabs) | T2 |
| S-5.AC4–AC5 (Studio filters) | T2 |
| S-5.AC6 (agent cards) | T2 |
| S-5.AC7 (dashboard tiles match) | T2 |
| S-5.AC8 (Photo Studio image) | T2 |
| S-5.AC9 (Copywriter) | T2 |
| S-5.AC10 (sub-menu Campaigns removed) | T3 |
| S-5.AC11 (real trend data) | T2 |
| S-5.AC12 (marketing-specific, not global) | T2 |
| S-5.AC13 (StudioGallery content) | T2 |
| S-5.AC14 (Video Producer) | T2 |
| S-5.AC15 (Market Intel) | T2 |

## S-6: Manage
| AC | Priority |
|---|---|
| S-6.AC1 (no Dashboard/ROI) | T2 |
| S-6.AC2–AC3 (Billing present, not in Profile) | T1 |
| S-6.AC4 (Insights real data) | T2 |
| S-6.AC5–AC6 (User Chats) | T2 |
| S-6.AC7–AC8 (partner admin multi-store) | T1 |
| S-6.AC9 (System Log real data) | T2 |
| S-6.AC10 (sub-menu fix) | T3 |
| S-6.AC11–AC12 (Hunches) | T2 |
| S-6.AC13 (Billing FlexPrice) | T1 |
| S-6.AC14 (RBAC redirect) | T1 |

## S-7: System / Profile / Top Icons
| AC | Priority |
|---|---|
| S-7.AC1–AC3 (settings render, CommGate) | T1 |
| S-7.AC4 (Reset Tour label) | T3 |
| S-7.AC5 (no Billing in Profile) | T2 |
| S-7.AC6 (landing page new window) | T2 |
| S-7.AC7 (Activity vs Notifications) | T2 |
| S-7.AC8 (RBAC per tile) | T1 |
| S-7.AC9 (User CRUD) | T1 |
| S-7.AC10–AC11 (CommGate + channels) | T1 |
| S-7.AC12 (KB upload) | T2 |
| S-7.AC13 (system prompt) | T2 |
| S-7.AC14 (business hours) | T2 |
| S-7.AC15 (Reset Tour TopBar) | T3 |
| S-7.AC16 (remove Billing from dropdown) | T3 |
| S-7.AC17–AC19 (profile photo, edit, password) | T2 |
| S-7.AC20 (org switcher) | T1 |
| S-7.AC21 (notification data source) | T2 |

## S-8: Landing / Widgets
| AC | Priority |
|---|---|
| S-8.AC1 (video new window) | T1 |
| S-8.AC2 (store name top-left) | T2 |
| S-8.AC3–AC4 (appointment booking) | T1 |
| S-8.AC5 (form → conversation) | T1 |
| S-8.AC6–AC7 (widget JS) | T2 |
| S-8.AC8 (landing page loads) | T2 |
| S-8.AC9 (contact form submit) | T1 |
| S-8.AC10 (web chat AI response) | T1 |
| S-8.AC11 (web call manifest behavior) | T1 |
| S-8.AC12 (widget menu 4 options) | T2 |
| S-8.AC13 (embed code) | T2 |
| S-8.AC14 (?mode=video) | T2 |

## S-9: Cross-Cutting (all T1)
S-9.AC1–AC10: **T1**

## S-10: Launch (all T1)
S-10.AC1–AC11: **T1**

---

## Summary

| Priority | Count | % |
|---|---|---|
| T1 | 68 | 44% |
| T2 | 72 | 46% |
| T3 | 16 | 10% |
| **Total** | **156** | 100% |

## Execution Order Recommendation
1. **T1 ACs first** — all sections in parallel where possible
2. **T2 ACs second** — section by section
3. **T3 ACs last** — may defer some to post-launch
