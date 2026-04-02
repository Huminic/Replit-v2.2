# A-001 Post-Sprint Evaluation

## 1. What the sprint claimed

**Goals:** Produce binding architecture decisions and governance artifacts for MVP launch. Resolve gaps from architect review.

**ACs:**
- AC1: Environment Architecture section with 5 properties
- AC2: Change Lifecycle section with no-sync rule
- AC3: Migration Governance section
- AC4: Configuration Classification table (7+ categories)
- AC5: T-010e retired
- AC6: Successor sprints with Sprint Definition Format
- AC7: Issues reassigned, no orphans
- AC8: PLAN.md updated
- AC9: Decision register

## 2. What evidence exists

| AC | Evidence |
|----|---------|
| AC1 | GOVERNOR_REFERENCE.md §12 — source of truth table with all 5 properties |
| AC2 | GOVERNOR_REFERENCE.md §13 — 4 subsections, "not synchronized at the data level" verbatim |
| AC3 | GOVERNOR_REFERENCE.md §14 — 7-step approval, backup requirement, rollback procedure |
| AC4 | GOVERNOR_REFERENCE.md §15 — 9 categories (exceeds minimum) |
| AC5 | sprints.json — T-010e status=retired with rationale |
| AC6 | evidence/A-001/successor-sprint-I-001.md, I-002.md, I-003.md — all 6 sections present |
| AC7 | issues.md — grep T-011 returns 0. All I-215–I-224 reassigned. |
| AC8 | PLAN.md Wave 8 — references I-001/I-002/I-003 |
| AC9 | evidence/A-001/decision-register.md — 13 decisions, all 5 fields |

## 3. What was independently verified

Ghost verified all 9 ACs by reading actual files. Build passes. No source code modified.

## 4. What assumptions were false or unproven

- **db:push was described as "additive"** — WRONG. It can drop columns removed from schema.ts. Corrected in governance docs and decision register after devil's advocate review.
- **Container port assumed deterministic** — NOT guaranteed by Coolify unless explicitly configured. Added fixed port requirement to I-001.
- **MCP connectivity from container assumed** — NOT verified. Added verification step to I-001.
- **VAPI webhook post-repoint assumed working** — NOT verified. Added webhook test to I-001.
- **PM2 gap between I-001 and I-002** — created a temporary second production endpoint. Fixed by adding PM2 .env swap immediately after Caddy repoint in I-001.

## 5. Outcome

EXIT GATE: CLEARED

APPROVED — all ACs met, all exit criteria pass. Devil's advocate review surfaced 5 corrections, all applied.

## 6. Unresolved gaps

| Gap | Disposition |
|-----|------------|
| GOVERNOR_REFERENCE.md section numbering conflict (pre-existing) | New issue — cosmetic, non-blocking |
| I-201 delta sync never succeeded | Assigned to I-001 for container verification |
| No formal "launch gate" ceremony defined | I-001 AC7 (9 flows verified) serves as the launch gate |
| No staging-before-production deployment gate | By design (D-011) — CI/CD deploys on push to main |
