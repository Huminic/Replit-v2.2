# E-013 Ghost Gate Criteria — Per Section
**Date:** 2026-03-26
**Purpose:** Evidence requirements, verification checks, and pass/fail rules that Ghost enforces before a section sprint can ship.

---

## Universal Gates (apply to ALL sections)

| Gate | Check | Pass Condition |
|---|---|---|
| G-0.1 | All ACs have test assertions | Every AC in the section has at least one non-trivial assertion in its .spec.ts |
| G-0.2 | No always-true assertions | grep for `expect(true)`, `toBeTruthy()` without a variable — must return zero matches |
| G-0.3 | No hardcoded test URLs | grep for `dev.huminicdev.com` — must use env var or config |
| G-0.4 | No console errors on page load | Playwright captures console, asserts zero error-level entries |
| G-0.5 | RBAC role test | Page loads for all permitted roles, redirects for non-permitted roles |
| G-0.6 | No cross-org data leakage | Page shows only current org's data |
| G-0.7 | Build passes | `npm run build` completes without errors after changes |

---

## Per-Section Gates

### S-1: AI Chat
| Gate | Evidence Required | Pass/Fail |
|---|---|---|
| G-1.1 | Chat streaming produces tokens within 8s | Timing measurement < 8000ms |
| G-1.2 | Chat response uses org context (not generic) | Response mentions org-specific data |
| G-1.3 | File upload completes and chat references content | Conversation log shows file analysis |
| G-1.4 | History delete actually removes from DB | GET /api/conversations count decreases |

### S-2: TeamBox
| Gate | Evidence Required | Pass/Fail |
|---|---|---|
| G-2.1 | Message history shows real chat content | Selected conversation renders message text (not blank) |
| G-2.2 | Take Over stops AI responses | After assign, inbound message gets no AI reply |
| G-2.3 | VAPI call logs show real data | Phone tab table has rows from /api with timestamps |
| G-2.4 | Manual send delivers | outbound_log has entry with status=sent |

### S-3: Sales
| Gate | Evidence Required | Pass/Fail |
|---|---|---|
| G-3.1 | All 7 metric tiles match API values | Tile-by-tile comparison documented |
| G-3.2 | Recent Activity is from API (not hardcoded) | DOM values change between page loads / match API |
| G-3.3 | All 4 agents respond on-topic | Each agent produces relevant response to domain question |
| G-3.4 | Conversion Rate change is a delta (not absolute) | change value differs from conversionRate value |

### S-4: Service
| Gate | Evidence Required | Pass/Fail |
|---|---|---|
| G-4.1 | Campaigns tab is first | Tab index assertion |
| G-4.2 | No Dashboard tab exists | Negative assertion |
| G-4.3 | Campaign execute → SMS delivered | outbound_log with real delivery |
| G-4.4 | Service metrics are service-filtered | Open/Total Conversations scoped to service dept |
| G-4.5 | Only Nancy Gaston on Agents tab | Exactly 1 agent card visible |

### S-5: Marketing
| Gate | Evidence Required | Pass/Fail |
|---|---|---|
| G-5.1 | No Campaigns in sub-menu or page tabs | Negative assertions on both |
| G-5.2 | All 5 agent cards render with descriptions | 5 cards visible, each has description text |
| G-5.3 | Studio gallery has content (not empty) | At least one artifact visible in gallery |
| G-5.4 | Photo Studio produces image (I-102 resolved) | Image URL in response |

### S-6: Manage
| Gate | Evidence Required | Pass/Fail |
|---|---|---|
| G-6.1 | User Chats shows real data (not placeholder) | Tab renders conversation list, not "coming soon" |
| G-6.2 | Hunches state machine works | Accept → status changes. Dismiss → status changes. |
| G-6.3 | Billing shows real FlexPrice data (I-105 resolved) | BillingDashboard renders plan/usage, not "not configured" |
| G-6.4 | RBAC redirect works | Non-management role gets redirected to / |

### S-7: System / Profile / Top Icons
| Gate | Evidence Required | Pass/Fail |
|---|---|---|
| G-7.1 | RBAC per settings tile verified | 3 role screenshots showing different tile counts |
| G-7.2 | User CRUD works | Add user → appears in list. Edit → changes persist. Deactivate → marked inactive. |
| G-7.3 | CommGate toggle stops outbound | Toggle OFF → campaign execute blocked |
| G-7.4 | "Reset Tour" label in TopBar (not "Take a Tour") | Screenshot of dropdown |
| G-7.5 | No Billing in profile dropdown | Screenshot showing dropdown without Billing |
| G-7.6 | Knowledge Base upload works | File appears in document table |

### S-8: Landing Pages / Widgets
| Gate | Evidence Required | Pass/Fail |
|---|---|---|
| G-8.1 | Video opens in new window | Browser proves window.open called with _blank |
| G-8.2 | Store name at top-left | Screenshot for each of 5 dealers |
| G-8.3 | Web Chat produces AI response | Chat widget message → response visible |
| G-8.4 | Contact form creates conversation | POST /api/widget/contact → conversation in DB |
| G-8.5 | Web Call matches manifest behavior | Number collection → VAPI outbound (not browser call) |

---

## Gate Enforcement Rules

1. **Ghost is the gate authority, not advisory.** No sprint ships without Ghost sign-off.
2. **Every gate must have evidence.** Screenshots, API responses, query outputs, or test outputs.
3. **Failed gates block merge.** Dev must fix and re-submit.
4. **Ghost runs independently.** Ghost does not trust Dev's claims — it verifies directly.
5. **Universal gates (G-0.x) are checked on every section.** Section gates (G-N.x) are additional.
