# Clarification Answers — User Responses
**Date:** 2026-02-16
**Status:** Authoritative decisions — governs Master SRS and Implementation Plan

---

## CRITICAL DECISIONS

### Q1. VIN Solutions Write-Back
**Decision:** Lead Management API CAN create leads (tested and verified in code).
- We add leads to VIN API
- Appointments go in OUR calendar (VIN does NOT allow appointment access via API)
- Context Router should be involved in this flow
- Action: Find and verify the lead creation code

### Q2. VAPI/Tavus Webhooks
**Decision:** Webhooks ARE live in production. No polling needed — these are action-based.
- Webhook triggers: email notification + insert into our DB + insert into VIN + transcript + left as unassigned
- Need to research VIN API capabilities for lead insertion from webhook data
- Master SRS should reflect webhook-based architecture

### Q3. Context Router
**Decision:** User defers technical implementation to me.
- Different situations require different data handling
- Must be careful about API rate limiting (likely why it was disabled)
- I should decide best approach given environment knowledge and goals
- Need to review scenarios to determine optimal handling per case

### Q4. Data Warehouse vs. Pass-Through
**Decision:** Hybrid model.
- User couldn't trust local data config → wanted VIN direct for reliability
- Context Router exists because some data lives ONLY in our system (e.g., appointments — VIN doesn't store these)
- Acceptable model: **Pull data once a day + manual refresh button**
- Reduces API calls while keeping data fresh enough

### Q5. Metric Source of Truth
**Decision:** Daily refresh from VIN + manual refresh button.
- Not mission-critical frequency — once a day is fine
- Some metrics include data only in our database (appointments, voice calls)
- Context Router is critical for combining sources correctly
- Discreet refresh button acceptable

### Q6. Local Leads (606 Records)
**Decision:** Critical clarifications:
- **Excel upload data was NEVER supposed to be in the DB** — one-time artifact to show lead count, OLD data, not real
- Data warehouse is for VIN API limitations (48-hour window claim by VIN rep — I disproved this, full history accessible)
- What matters: **actionable data PER DEALER** (not aggregate)
- Need: new leads in last 24 hours, AI leads vs direct VIN leads
- Report upload feature planned for settings to bring in non-API data
- **Context Router must be smart about tagging and categorizing** — extremely important
- One VIN connection, rate limit aggregate across all dealers, but data must be per-store
- If deeper clarification on categories/tags/statuses is needed, user will dig in

---

## HIGH PRIORITY DECISIONS

### Q7. Widget Options
**Decision:** All 6 options confirmed:
1. Text Chat
2. Voice Inbound (Call Us)
3. Voice Outbound (Call You / Callback)
4. Video Agent
5. Web Audio
6. Send a Text

**Additional requirements:**
- Enable/disable per option per org
- Ability to add custom items with URL (for third-party vendors)
- Fill-out-a-form option should be possible

### Q8. SMS Bi-Directional
**Decision:** Outbound-only for now (one shared phone number).
- Bi-directional when each store gets own number (future phase)
- DO show sent items in Work Hub

### Q9. Outbound Communication
**Decision:** SMS outbound may work but not through Work Hub.
**#1 PRIORITY (customer desperately wants this):**
- Create custom agent that watches new leads
- After time threshold with no communication → VAPI calls customer to set up test drive
- Two contexts for outbound calls:
  1. Watch active new leads → no communication after threshold → VAPI outbound call
  2. (Second context to be defined)
- System triggers exist in settings — status unknown, may not have been requested

### Q10. Orchestration Agent
**Decision:** Not a definite need. Build only if architectural deficiency requires it. Don't destabilize the system.

### Q11. System Agents vs User Agents
**Decision:**
- System agents: background work, invisible to users
- User agents: created by users, access only provisioned org features
- DealerBrain: system-wide agent for admin tasks, data retrieval, artifacts
- Agent security model needs further definition

### Q12. Staff Messaging Inbox vs Hub
**Decision:** Hub = Work Hub = unified inbox concept.
- Should contain: notifications, messages, SMS threads, emails
- Email system was built but disappeared from interface
- Google email → switched to IMAP/SMTP
- Current Hub mostly right except: **email missing, no SMS communication visible**
- User requests my opinion on consolidation

---

## MEDIUM PRIORITY DECISIONS

### Q13. Industry-Agnostic
**Decision:** Keep automotive terms for now. Add code comments about future genericization. Not important right now.

### Q14. Multi-Org Queries
**Decision:** Single-org context only. Run queries per org individually. Add multi-org to roadmap (future).

### Q15. MCP Proxy
**Decision:** Defer entirely. Already talking to DB, Tavus, VAPI directly. Future phase.

### Q16. Layout Types
**Decision:** Current setup looks correct. Layout types matter for new pages. Rule: chat focus → center, data/config focus → center.

### Q17. Widget Configuration UI
**Decision:** HIGHER PRIORITY than expected.
- Customers want to deploy on websites NOW
- Need: basic config (branding, color, which widgets to include)
- Need: individual cut/paste embed code
- Already gave customers deployment code (not using it yet)
- May need to swap code ASAP
- Both unified widget AND individual HTML widgets needed

### Q18. VIN Polling
**Decision:** Every 4 hours (not hourly). Discreet refresh button near metrics for manual update. Page-level refresh (all metrics), not per-metric.

### Q19. Multiple Widgets Per Org
**Decision:** One widget of each type per org for now. Multiple later. Must reconcile widgets against third-party/internal chats.

### Q20. Hosted Pages
**Decision:** Code exists from v1 and v2. Needs fixing. Yes, it's needed and available.

---

## OVERARCHING MANDATE

**Data accuracy is non-negotiable.** User's words:
- "We cannot have data that is wrong. We cannot have metrics that are wrong."
- Quality gates must test data outcomes and accuracy
- Must reconcile dashboard results with actual VIN numbers
- This has been a repeated problem
- Every phase must include data reconciliation verification
- Need feature/function filter to track customer requirements
