# Nexxus Connect v2.2 — Acceptance Criteria

Master definition of what the product must do. Sprint-level AC maps back to this document.
User stories are in `user-stories.md` (the specification). This document is the checklist.

> **Reconciliation needed:** The feature map is from QA-S0 (2026-03-14). Recent sprints have changed the product. AC-1 sprint will reconcile this document against current code.

---

# Section 1: Feature Map Checklist

Source: evidence/QA-S0/feature-map.md + post-QA-S0 changes
Each item describes what the feature should do. Status populated during testing.

## Known Failures (open issues — expected to fail until remediation)
| Criterion | Issue | Domain |
|-----------|-------|--------|
| 4.10 | I-036: Campaign reply does not trigger AI agent response | BE |
| 11.2 | I-038: VAPI webhook rejects with 401 | IN |
| 11.6 | I-037: VAPI outbound calls have no context | BE |

## Domain 1: Authentication
| # | Criterion | User Story | Status | Verified By |
|---|-----------|------------|--------|-------------|
| 1.1 | Login sets httpOnly cookie (not localStorage) | — | | |
| 1.2 | Refresh token rotation works | — | | |
| 1.3 | Logout clears cookie and returns to login screen | — | | |
| 1.4 | Password strength validation rejects weak passwords | — | | |
| 1.5 | Reset token is hashed (SHA-256) before DB storage | — | | |
| 1.6 | Wrong credentials shows "invalid email or password" | — | | |
| 1.7 | RBAC: Sales/Marketing/Service don't see Manage or System | — | | |
| 1.8 | Executive sees Manage but NOT System | — | | |
| 1.9 | Super Admin can switch all orgs | US-022 | | |
| 1.10 | Partner Admin sees own companies + subs only | US-022 | | |
| 1.11 | Sales/Marketing/Service cannot switch orgs | — | | |
| 1.12 | Org switch triggers full page refresh | — | | |
| 1.13 | Product tour shows on first login | — | | |
| 1.14 | Tour dismisses per-page, doesn't restart on visited pages | — | | |
| 1.15 | Huminic master org exists, Super Admin home org is Huminic | — | | |
| 1.16 | Org hierarchy: Huminic -> Cage Automotive -> 5 dealerships | — | | |

## Domain 2: Dashboard & Main View
| # | Criterion | User Story | Status | Verified By |
|---|-----------|------------|--------|-------------|
| 2.1 | Main page loads without errors | — | | |
| 2.2 | Metrics are role-specific | US-023 | | |
| 2.3 | Left popout shows chat history + favorites (NOT agents) | — | | |
| 2.4 | No right popout on main page | — | | |
| 2.5 | Metrics centered with main chat window below | — | | |

## Domain 3: AI Agent & Chat
| # | Criterion | User Story | Status | Verified By |
|---|-----------|------------|--------|-------------|
| 3.1 | Agent listings per role in left menu popout (below separator) | — | | |
| 3.2 | Center chat layout on home page | — | | |
| 3.3 | Thinking indicators visible during AI processing | — | | |
| 3.4 | Web search tool works | US-006 | | |
| 3.5 | General knowledge questions work (weather, facts) | — | | |
| 3.6 | VIN data queries return real data | US-006, US-030 | | |
| 3.7 | Conversational tone (not report-formatted) | — | | |
| 3.8 | Multi-org awareness for Super Admin | — | | |
| 3.9 | Empty CRM shows graceful message (not raw zeros) | — | | |
| 3.10 | Document upload and retrieval works | — | | |
| 3.11 | Agent CRUD works (admin only) | — | | |

## Domain 4: Campaigns
| # | Criterion | User Story | Status | Verified By |
|---|-----------|------------|--------|-------------|
| 4.1 | Campaign create -> upload CSV -> preview -> execute flow works | US-009 | | |
| 4.2 | CSV upload accepts required fields (firstName, lastName, phone, email) | — | | |
| 4.3 | Campaign execution sends SMS to recipients via MCP | US-009 | | |
| 4.4 | Campaign execution sends email to recipients via MCP | — | | |
| 4.5 | Kill switch blocks all outbound when enabled | US-027 | | |
| 4.6 | Channel-specific pause works (SMS off, voice on) | US-028 | | |
| 4.7 | Execution statuses are org-scoped (no cross-org leak) | — | | |
| 4.8 | Campaign stop halts mid-execution | — | | |
| 4.9 | Customer replies create conversation thread in TeamBox | US-009, US-017 | | |
| 4.10 | Campaign reply triggers AI agent response | US-009, US-015 | | |

## Domain 5: Conversations & TeamBox
| # | Criterion | User Story | Status | Verified By |
|---|-----------|------------|--------|-------------|
| 5.1 | Universal inbox shows email, SMS, voice transcripts | — | | |
| 5.2 | Conversation list loads with correct data | — | | |
| 5.3 | Messages display in threaded conversation view | US-020 | | |
| 5.4 | Takeover stops AI, parks as human-only thread | US-009, US-017 | | |
| 5.5 | Users see their role's conversations | — | | |
| 5.6 | Org Admin+ sees all conversations | — | | |
| 5.7 | My Work shows own messages only | — | | |
| 5.8 | Outbound email via TeamBox works (Resend through MCP) | — | | |
| 5.9 | SMS webhook routes inbound to correct org | — | | |
| 5.10 | Thread history preserved across time gaps | US-020 | | |
| 5.11 | Workflows tab in persistent left column | — | | |

## Domain 6: Department Dashboards
| # | Criterion | User Story | Status | Verified By |
|---|-----------|------------|--------|-------------|
| 6.1 | Sales page loads with KPIs | US-007, US-023 | | |
| 6.2 | Service page loads with KPIs and campaigns | US-011 | | |
| 6.3 | Marketing page loads with KPIs and campaigns | — | | |
| 6.4 | Management page loads with executive overview | US-025, US-026 | | |
| 6.5 | Demand Score tile visible on Management | US-025 | | |
| 6.6 | Sales sidebar does NOT show Billing | — | | |
| 6.7 | Sales submenu shows 3 agents below separator | — | | |
| 6.8 | Service submenu shows at least 1 agent | — | | |

## Domain 7: Analytics & Insights
| # | Criterion | User Story | Status | Verified By |
|---|-----------|------------|--------|-------------|
| 7.1 | Insights page loads without errors | — | | |
| 7.2 | Dashboard zones render | — | | |
| 7.3 | Metric library populates | — | | |
| 7.4 | Role-filtered (Sales unfiltered, others filtered) | — | | |
| 7.5 | Pin to Dashboard removed | — | | |
| 7.6 | Lead source labels show meaningful names | US-024 | | |

## Domain 8: Billing
| # | Criterion | User Story | Status | Verified By |
|---|-----------|------------|--------|-------------|
| 8.1 | Billing pages load | — | | |
| 8.2 | Connected to FlexPrice | — | | |
| 8.3 | Super Admin sees all billing | — | | |
| 8.4 | Partner Admin + Org Admin see usage + wallet top-up | — | | |
| 8.5 | Sales/Marketing/Service do NOT see Billing | — | | |

## Domain 9: Settings & Profile
| # | Criterion | User Story | Status | Verified By |
|---|-----------|------------|--------|-------------|
| 9.1 | Settings page loads with all tiles | — | | |
| 9.2 | Profile shows name, email, photo, password change | — | | |
| 9.3 | Restart Tour button on profile | — | | |
| 9.4 | Org Wizard accessible to Super Admin only | — | | |
| 9.5 | Communication gate toggle in settings | US-027 | | |

## Domain 10: Tasks & Appointments
| # | Criterion | User Story | Status | Verified By |
|---|-----------|------------|--------|-------------|
| 10.1 | Tasks visible in My Work | — | | |
| 10.2 | Task creation: self-assign only | — | | |
| 10.3 | Appointments connected to calendar | US-013 | | |
| 10.4 | Task and appointment CRUD endpoints respond | — | | |

## Domain 11: Integrations & External
| # | Criterion | User Story | Status | Verified By |
|---|-----------|------------|--------|-------------|
| 11.1 | Public widget endpoints work without auth | — | | |
| 11.2 | VAPI webhook accepts end-of-call transcripts | US-004 | | |
| 11.3 | VAPI transcript appears in TeamBox | US-004 | | |
| 11.4 | TextMagic webhook routes SMS to correct org | US-015 | | |
| 11.5 | All third-party calls route through MCP | — | | |
| 11.6 | VAPI outbound calls include context (name, greeting, goal) | US-009 | | |
| 11.7 | Tavus personas active per dealer | US-002 | | |
| 11.8 | Widget video session creates Tavus conversation | US-002 | | |
| 11.9 | VIN Solutions data syncs (warehouse leads populated) | US-001 | | |

## Domain 12: Infrastructure & Security
| # | Criterion | User Story | Status | Verified By |
|---|-----------|------------|--------|-------------|
| 12.1 | Health endpoint returns 200 | — | | |
| 12.2 | Security headers present (Helmet) | — | | |
| 12.3 | Rate limiting works | — | | |
| 12.4 | httpOnly cookie set on login | — | | |
| 12.5 | Entitlement checks fail-closed | — | | |
| 12.6 | getConversationByPhone filters by orgId | — | | |

---

# Section 2: User Story Coverage

Full user story specifications are in `user-stories.md`. This section maps stories to feature map criteria.

| Story | Title | Covered By Criteria |
|-------|-------|-------------------|
| US-001 | Web Chat to VIN Lead | 11.9, 5.1 |
| US-002 | Tavus Video Lead | 11.7, 11.8, 10.3 |
| US-003 | Form to Two-Way SMS | 4.9, 5.9 |
| US-004 | VAPI Inbound Call | 11.2, 11.3 |
| US-005 | Walk-In Auto-Followup | 11.9 |
| US-006 | CRM Guru Research | 3.4, 3.6 |
| US-007 | Pipeline Review | 6.1 |
| US-008 | Competitive Alert | — (backlog BL-010) |
| US-009 | Oil Change Campaign | 4.1, 4.3, 4.9, 4.10, 5.4, 11.6 |
| US-010 | Recall Notification | 4.9, 5.4 |
| US-011 | Service Metrics | 6.2 |
| US-012 | Opt-Out Check | 4.5 |
| US-013 | Widget Scheduling | 10.3 |
| US-014 | Service Agent FAQ | 3.6 |
| US-015 | SMS Inbound Query | 4.10, 11.4 |
| US-016 | AI List Gen | 3.6 |
| US-017 | SMS Handover | 4.9, 5.4 |
| US-018 | TeamBox Filtering | 5.2, 5.5 |
| US-019 | Escalation Mgmt | — (backlog BL-011) |
| US-020 | History Preserve | 5.3, 5.10 |
| US-021 | After-Hours | — (backlog BL-009) |
| US-022 | Multi-Store Oversight | 1.9, 1.10 |
| US-023 | Metric Review | 2.2, 6.1 |
| US-024 | Source Analysis | 7.6 |
| US-025 | Executive Insight | 6.5 |
| US-026 | Coaching | 6.4 |
| US-027 | Master Kill Switch | 4.5, 9.5 |
| US-028 | Channel Pause | 4.6 |
| US-029 | Email Draft | 3.6 |
| US-030 | CRM Cross-Ref | 3.6 |

**Stories not covered by current criteria (deferred to backlog):** US-008, US-019, US-021

---

# Section 3: Launch Readiness

Status: NOT YET POPULATED — will be filled during T-2 and T-3 testing sprints.

**Total criteria:** 85
**Passing:** 0
**Known failures (open issues):** 3
**Not tested:** 85

---

**Last updated:** 2026-03-18
