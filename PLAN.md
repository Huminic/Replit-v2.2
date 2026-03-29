# Nexxus Connect v2.2 — Plan

**Last Updated:** 2026-03-29

---

## You Are Here

- Issues have been cleaned and verified against code
- 41 active items remain
- Core system exists, but:
  - Communications behavior is not fully proven
  - Widget/inbound flows are incomplete
  - Some features appear done but are not validated

Current stage: **Stabilize → Validate → Prepare for Launch**

---

## Sprint Execution

Work is done in phases by system layer, not scattered fixes.

Each phase:
- Resolves a group of related issues
- Confirms behavior works end-to-end
- Removes false positives before moving forward

### Operating Model

| Role | Who | Does what |
|------|-----|-----------|
| Control plane | Operator | Decides what's next, approves sprints, reads evidence, says go/stop |
| Dispatcher | Captain | Dispatches the agent the operator requests, reports results |
| Work plane | Dev | Executes the task, writes evidence, runs smoke test |
| Audit plane | Ghost | Verifies evidence, writes verdicts, runs gate checks |

### Execution Pattern

```
1. Operator says "define sprint for [route/issue]"
2. Captain writes sprint in sprints.json (proposed)
3. Operator approves → Captain writes operator-approval.md
4. Ghost entry gate
5. Dev does the work + writes evidence
6. Dev runs smoke test
7. Ghost exit gate
8. Operator reads verdict → complete or redo
```

### Smoke Test Table

| Route | Smoke test | Cross-test |
|-------|-----------|------------|
| `/` (AI Chat) | s1-ai-chat.spec.ts | domain-02-dashboard.spec.ts |
| `/teambox` | s2-teambox.spec.ts | domain-05-teambox.spec.ts |
| `/sales` | s3-sales.spec.ts | domain-06-departments.spec.ts |
| `/service` | s4-service.spec.ts | domain-04-campaigns.spec.ts |
| `/marketing` | s5-marketing.spec.ts | domain-06-departments.spec.ts |
| `/management` | s6-manage.spec.ts | domain-08-billing.spec.ts |
| `/settings` | s7-system-profile.spec.ts | domain-09-settings.spec.ts |
| `/insights` | domain-07-insights.spec.ts | — |
| `/agents` | domain-06-departments.spec.ts | — |
| Widgets/landing | s8-landing-widgets.spec.ts | domain-11-integrations.spec.ts |

### Bug Routing

| Scenario | Action |
|----------|--------|
| Bug in this sprint's code | Fix it, retest |
| Bug in previous sprint's code, in scope | Fix here, document in issues.md |
| Bug in previous sprint's code, out of scope | Log in issues.md, don't touch it |
| Agent stuck 30+ minutes | STOP — escalate to operator |
| 2 fix attempts failed | STOP — escalate to operator |

---

## Sprint 0 — Backend / Comms Integrity (FOUNDATION)

**Why first:** Everything else lies without this.

**Focus:** Message flow correctness, channel behavior, AI vs human boundaries

| ID | Issue | Effort |
|----|-------|--------|
| I-141 | VAPI webhook 422 (transcripts missing) | M |
| I-144 | Blacklist bypass (non-SMS channels) | E |

Also:
- Re-test SMS takeover (now valid with Caroline SMS enabled)
- Verify campaign send pipeline under real conditions

**Outcome:** Messages behave correctly under all states. This is the trust anchor.

---

## Sprint 1 — Widget / Entry Points (Revenue Surface)

**Why:** This is the front door. Right now it lies (404 risk).

| ID | Issue | Effort |
|----|-------|--------|
| I-122 | Missing /api/widget/voice-callback | M |
| I-168 | Widget state coverage (22 states) | H |

**Subgroups:**
- Callback flow (backend + UI handshake)
- Interaction modes (chat / voice / video / form)

**Outcome:** Fully working inbound funnel. Every interaction creates a valid conversation.

---

## Sprint 2 — AI Chat (Core Intelligence Layer)

**Why:** This is where perception of "AI product" lives.

| ID | Issue | Effort |
|----|-------|--------|
| I-126 | Chat resume/history | E |
| I-139 | Data hallucination risk | M |

**Subgroups:**
- Chat continuity (resume + titles)
- Data grounding (CRM truth vs fabrication)

**Outcome:** Conversations persist correctly. AI stops sounding smart but being wrong.

---

## Sprint 3 — TeamBox (Operational Hub)

**Why:** This is where everything converges.

### 3A — TeamBox Core

| ID | Issue | Effort |
|----|-------|--------|
| I-150 | Channels mismatch (NEEDS INPUT) | E |

### 3B — CRM Action Layer

| ID | Issue | Effort |
|----|-------|--------|
| I-174 | "Send to CRM" manual lead creation | H |

**Outcome:** TeamBox becomes actionable, not just visible.

---

## Sprint 4 — Service (Data + Campaign Engine)

**Why:** Real business impact lives here.

### 4A — Metrics Correctness

| ID | Issue | Effort |
|----|-------|--------|
| I-113 | Hardcoded metrics | M |

### 4B — Campaign Engine

| ID | Issue | Effort |
|----|-------|--------|
| I-132 | Multi-channel campaigns | H |

**Outcome:** Metrics become real. Campaigns become powerful.

---

## Sprint 5 — Marketing (AI + Metrics Integrity)

**Why:** Currently misleading (zeros + broken AI).

| ID | Issue | Effort |
|----|-------|--------|
| I-172 | openai-proxy 401 | M |
| I-155 | Metrics zero | E |

**Outcome:** AI agents actually respond. Dashboard reflects reality.

---

## Sprint 6 — Insights (Differentiator)

| ID | Issue | Effort |
|----|-------|--------|
| I-156 | Insights page unverified | M |
| I-163 | 27 states untested | H |

**Outcome:** Insights are usable and trustworthy.

---

## Sprint 7 — Auth (Stability + Trust)

| ID | Issue | Effort |
|----|-------|--------|
| I-140 | Password reset flow | M |
| I-165 | 11 untested states | M |

**Outcome:** No broken login flows. No silent failures.

---

## Sprint 8 — Settings (Contained Cleanup)

| ID | Issue | Effort |
|----|-------|--------|
| I-148 | Dev artifacts cleanup | E |
| I-149 | Tour behavior (NEEDS INPUT) | E |
| I-157 | RBAC scope (NEEDS INPUT) | E |
| I-164 | 42 states untested | H |

**Outcome:** Clean, predictable admin surface.

---

## Sprint 9 — Management (Feature Completion)

| ID | Issue | Effort |
|----|-------|--------|
| I-116 | User Chats (not built) | H |
| I-169 | Hunch state handling | M |

**Outcome:** No placeholder features.

---

## Sprint 10 — Agents (Validation + Polish)

| ID | Issue | Effort |
|----|-------|--------|
| I-102 | Photo Studio integration | E |
| I-130 | Agent favorites + sub-menu bar (Sales/Service/Marketing) | M |
| I-138 | Unauthorized Agent DB artifact | E |

**Outcome:** Agent system feels complete, not experimental.

---

## Continuous — Test Infrastructure

Runs across all sprints. **No sprint closes without killing at least one fake test.**

| ID | Issue | Effort |
|----|-------|--------|
| I-103 | 6 always-true assertions | E |
| I-104 | 103 stub tests (delete) | E |
| I-110 | 2 files hardcode production URL | E |

---

## End-to-End Validation

After all sprints, validate full system flow:
1. Lead enters (widget, form, SMS, call)
2. Conversation is created
3. AI responds
4. Human takeover works
5. Actions (CRM, campaigns) execute
6. Data appears correctly across routes

**Outcome:** System works as a complete flow.

---

## Walkthrough

Full product walkthrough: Sales, Service, Marketing, TeamBox, key settings.

Validate: No dead ends. No misleading UI. No broken flows.

**Outcome:** System is usable without explanation.

---

## Launch

Ready when:
- Communications are reliable
- Entry points are complete
- AI behavior is consistent and grounded
- Core workflows produce real outcomes
- No critical flows fail

---

## References

- **State inventory:** evidence/U-001/state-enumeration.md (350 states)
- **Gap analysis:** evidence/G-004/cross-reference.md (149 gaps)
- **Issues:** issues.md (41 active)
- **V1 plan:** plan.md (historical, 85 sprints)
- **Test coverage:** e2e-flows.spec.ts, real-integrations.spec.ts, live-comms.spec.ts, deep-coverage.spec.ts
