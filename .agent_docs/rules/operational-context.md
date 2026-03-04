# .agent_docs/rules/operational-context.md — Nexxus v2.2
# PURPOSE: Live deployment context, environment status, mockup references, and external account notes.
# Load this file when: starting a session on a new machine, verifying environment, or onboarding an agent.
# This file is updated by the owner or Architect when deployment state changes.
# Last updated: 2026-03-04

---

## 1. DEPLOYMENT STATUS

| Environment | Status | Port | PM2 process | URL |
|-------------|--------|------|-------------|-----|
| Production | ACTIVE | 5020 | nexxus-v2 | [owner to fill] |
| Staging | NOT YET CREATED | 5021 | nexxus-v2-staging | [H4 pre-flight task] |
| central-mcp | ACTIVE (PM2 id 14) | internal | central-mcp | ../central-mcp |

**Pre-flight H4 (create staging Supabase project) is REQUIRED before any Wave 1 code is written.**

---

## 2. KILL SWITCH STATUS

| Environment | outbound_enabled | sms_enabled | phone_enabled | email_enabled |
|-------------|-----------------|-------------|---------------|---------------|
| Production | UNKNOWN — verify before any outbound work | | | |
| Staging | NOT CREATED — all default FALSE when created | | | |

**All outbound must remain disabled until kill switch migration is deployed and tested on staging.**

---

## 3. MOCKUP / DESIGN REFERENCE

| Deliverable | URL | Status | Approved by |
|-------------|-----|--------|-------------|
| Navigation shell | [pending — H6 pre-flight task] | NOT DELIVERED | — |
| Pattern A — AI Chat | [pending] | NOT DELIVERED | — |
| Pattern B — Agent pages | [pending] | NOT DELIVERED | — |
| Pattern C — Content pages | [pending] | NOT DELIVERED | — |
| Kill Switch page | [pending] | NOT DELIVERED | — |
| Widget configuration UI | [pending] | NOT DELIVERED | — |
| Hosted landing page | [pending] | NOT DELIVERED | — |
| Escalation card variants | [pending] | NOT DELIVERED | — |
| Hunch card | [pending] | NOT DELIVERED | — |
| Metering tiles | [pending] | NOT DELIVERED | — |

**No UI component is built until the corresponding mockup is in the table above with status APPROVED.**
**T1 (approved UI mockups) is the highest truth tier in CLAUDE.md.**

---

## 4. EXTERNAL SERVICE ACCOUNTS

| Service | Account | Where credentials live | Status |
|---------|---------|----------------------|--------|
| Supabase (production) | [owner to confirm] | .env.production — DO NOT TOUCH | Active |
| Supabase (staging) | [create — H4] | .env.staging | Pending creation |
| VAPI | Org ID: c303d993-bf42-4784-a8cb-247477b1cbdd | DB per-org settings | Active |
| Tavus | [owner to confirm] | DB per-org settings | Active |
| TextMagic | [owner to confirm] | DB per-org settings | Active |
| Resend | [owner to confirm] | DB per-org settings | Active |
| VIN Solutions | Per-org OAuth tokens | Supabase tokens table (encrypted) | Active — per org |
| Google Ads | [Wave 5] | — | Not configured |
| QuickBooks | [Wave 5] | central-mcp QuickBooks connector | Not configured |

---

## 5. CURRENT WAVE STATUS

| Wave | Status | Gate status | Notes |
|------|--------|------------|-------|
| Wave 0 — Governance | IN PROGRESS | Owner sign-off pending (H10) | All 13 governance docs being written |
| Wave 1 — Stabilize | LOCKED | Requires Wave 0 complete | Cannot begin until H10 |
| Wave 2 — MVP Core | LOCKED | Requires Wave 1 demo | |
| Wave 3 — MVP Complete | LOCKED | Requires Wave 2 demo | |
| Wave 4 — Service Module | LOCKED | Requires Wave 3 payment | |
| Wave 5 — Billing + RBAC | LOCKED | Requires Wave 4 signed | |
| Wave 6 — French Pastry | LOCKED | Requires Wave 5 stable | |

---

## 6. CLAUDE SYSTEM-LEVEL AUDIT NOTES

Pre-flight task H8: audit Claude system-level context for conflicts.
Owner must verify and log findings here before Wave 1.

| Item | Check | Finding | Action taken |
|------|-------|---------|-------------|
| Active system prompts | Any system prompts that could override CLAUDE.md? | [H8 — pending] | — |
| Loaded memory | Any memory files from prior sessions with conflicting instructions? | [H8 — pending] | — |
| Tool configurations | Any tool configs that bypass kill switch or scope rules? | [H8 — pending] | — |
| .project/ directory | Does it exist in the repo? | [A6 — pending] | — |
| Competing governance files | Any pre-v2.2 specs or plans in root? | [A5 — pending] | — |

---

## 7. KNOWN ISSUES AND FLAGS

| ID | Issue | Priority | Status | Wave targeted |
|----|-------|----------|--------|---------------|
| P0-01 | Pipeline count inflated — showing 247, provisional filter not yet applied | P0 | OPEN | Wave 1 |
| P0-02 | Hosted-pages route mismatch | P0 | OPEN | Wave 1 |
| P0-03 | Kill switch missing from all outbound paths | P0 | OPEN | Wave 0/1 |
| P0-04 | No staging database exists | P0 | OPEN | Wave 0 (H4) |
| P0-05 | Competing governance files in root | P0 | OPEN | Wave 0 (A5) |
| P0-06 | Tests referencing dropped features | P0 | OPEN | Wave 1 |
| P0-07 | .project/ governance conflict if present | P0 | OPEN | Wave 0 (A6) |

---

## 8. HUMAN RELAY STATUS

These tasks require the owner to perform them — agents cannot complete them.

| Task | Owner action required | Status |
|------|----------------------|--------|
| H1 | Call Durran — confirm pipeline filter | PENDING |
| H2 | Communicate timeline update to Serra | PENDING |
| H3 | Approve governance document package (all 13 files) | PENDING |
| H4 | Create Supabase staging project | PENDING |
| H5 | Deliver DESIGNER_BRIEF.md to designer | PENDING |
| H6 | Obtain designer-approved mockups | PENDING |
| H7 | Store approved mockup URL in this file | PENDING |
| H8 | Audit Claude system-level context for conflicts | PENDING |
| H9 | Verify no .project/ conflicts in repo | PENDING |
| H10 | Owner signs off on pre-flight — Wave 1 unlocks | PENDING |
