# Integrity Audit — Unauthorized Actions (S0 through S10)

**Date:** 2026-03-28
**Auditor:** Integrity auditor (automated)
**Scope:** All S0-S10 sprint commits, checking for unauthorized modifications, process violations, and governance file tampering.

**Method:** For each sprint, compared:
1. `operator-approval.md` (approved scope)
2. `sprints.json` `filesModified` (declared scope)
3. `dev-report.md` (claimed work)
4. `git diff` of actual commit (ground truth)

---

## Sprint S-0
**Commit:** de65c33
**Approved scope:** Operator approved (generic approval, no scope details in approval file)
**Declared filesModified:** server/seed.ts, server/routes/webhooks.ts, server/outbound.ts, server/routes/campaigns.ts, server/routes/sms.ts, shared/schema.ts
**Actual files changed (app source):** server/outbound.ts, playwright.config.ts
**Actual files changed (other):** evidence/S-0/*, evidence/watchdog-ack.txt, sprints.json, tests/e2e/s0-foundation.spec.ts

**Unauthorized modifications:**
- `playwright.config.ts` modified but NOT in declared `filesModified`. Test infrastructure change without declaration.

**Process violations:**
- Operator approval file contains no scope details (just "OPERATOR APPROVED"). Step 1 acknowledgement (list scope, wait for approval) has no evidence of scope being listed.
- Several declared files (server/seed.ts, server/routes/webhooks.ts, server/routes/campaigns.ts, server/routes/sms.ts, shared/schema.ts) were NOT modified despite being listed in filesModified. Declaration is inaccurate in both directions.

**Governance files modified:** NONE (issues.md, backlog.md, PLAN.md untouched)

---

## Sprint S-1
**Commit:** e5b186e (also e308fc8 — two commits for same sprint)
**Approved scope:** Operator approved (generic approval, no scope details)
**Declared filesModified:** [] (empty — verification-only sprint)
**Actual files changed (app source):** NONE
**Actual files changed (other):** evidence/S-1/*, evidence/watchdog-ack.txt, sprints.json, tests/e2e/s1-ai-chat.spec.ts

**Unauthorized modifications:** NONE
**Process violations:** NONE — verification-only sprint, no app code changed, consistent with empty filesModified declaration.
**Governance files modified:** NONE

---

## Sprint S-2
**Commit:** a661e2e
**Approved scope:** Operator approved (generic approval, no scope details)
**Declared filesModified:** client/src/pages/teambox.tsx, client/src/components/layout/SubMenuManager.tsx
**Actual files changed (app source):** client/src/pages/teambox.tsx, client/src/components/layout/SubMenuManager.tsx
**Actual files changed (other):** evidence/S-2/*, evidence/watchdog-ack.txt, sprints.json, tests/e2e/s2-teambox.spec.ts

**Unauthorized modifications:** NONE
**Process violations:** NONE — actual changes match declared scope exactly.
**Governance files modified:** NONE

---

## Sprint S-3
**Commit:** 0622918
**Approved scope:** MISSING — No operator-approval.md exists in evidence/S3/
**Declared filesModified:** client/src/pages/sales.tsx
**Actual files changed (app source):** NONE (commit message confirms: "No application code changes")
**Actual files changed (other):** evidence/S-3/*, evidence/watchdog-ack.txt, sprints.json, tests/e2e/s3-sales.spec.ts

**Unauthorized modifications:** NONE (no app code changed)

**Process violations:**
- **CRITICAL: No operator-approval.md exists.** The agreed process requires operator approval before sprint execution. No evidence of Step 1 acknowledgement.
- Dev-report mentions "I-150: Channel filter cleanup — Removed: WhatsApp, Web Chat filter chips from teambox.tsx" but this work was actually done in S-2, not S-3. The dev-report is either retroactively documenting S-2 work or is inaccurate.
- Declared filesModified lists `client/src/pages/sales.tsx` but this file was NOT modified.

**Governance files modified:** NONE

---

## Sprint S-4
**Commit:** 08d524b
**Approved scope:** Operator approved (generic approval, no scope details)
**Declared filesModified:** client/src/pages/service.tsx
**Actual files changed (app source):** client/src/pages/service.tsx
**Actual files changed (other):** evidence/S-4/*, evidence/watchdog-ack.txt, sprints.json, tests/e2e/s4-service.spec.ts

**Unauthorized modifications:** NONE
**Process violations:** NONE — actual changes match declared scope.
**Governance files modified:** NONE

---

## Sprint S-5
**Commit:** db24d21
**Approved scope:** Operator approved (generic approval, no scope details)
**Declared filesModified:** client/src/pages/marketing.tsx
**Actual files changed (app source):** client/src/pages/marketing.tsx
**Actual files changed (other):** evidence/S-5/*, evidence/watchdog-ack.txt, sprints.json, tests/e2e/s5-marketing.spec.ts

**Unauthorized modifications:** NONE
**Process violations:** NONE — actual changes match declared scope.
**Governance files modified:** NONE

---

## Sprint S-6
**Commit:** f9de6da
**Approved scope:** Operator approved (generic approval, no scope details)
**Declared filesModified:** client/src/pages/management.tsx, client/src/pages/profile.tsx
**Actual files changed (app source):** client/src/pages/management.tsx, client/src/pages/profile.tsx
**Actual files changed (other):** evidence/S-6/*, evidence/watchdog-ack.txt, sprints.json, tests/e2e/s6-manage.spec.ts

**Unauthorized modifications:** NONE
**Process violations:** NONE — profile.tsx modification is justified by AC3 ("Billing NOT in Profile page") and explicitly declared in filesModified.
**Governance files modified:** NONE

---

## Sprint S-7
**Commit:** 4090f15
**Approved scope:** Operator approved (generic approval, no scope details)
**Declared filesModified:** client/src/pages/settings.tsx, client/src/pages/profile.tsx, client/src/components/layout/AppLayout.tsx
**Actual files changed (app source):** NONE (verification-only — only evidence files in commit)
**Actual files changed (other):** evidence/S-7/post-sprint-report.md, evidence/S-7/workflow-audit.log

**Unauthorized modifications:** NONE
**Process violations:** NONE — verification sprint, no app code changed. Declared files were not modified (declaration was aspirational, not actual).
**Governance files modified:** NONE

---

## Sprint S-8
**Commit:** 6cece97
**Approved scope:** Operator approved with decisions: "I-149 (tour per-section) = working as intended. I-157 (API Keys super_admin) = correct."
**Declared filesModified:** client/src/pages/widget-landing.tsx, server/routes/public.ts
**Actual files changed (app source):** client/src/pages/widget-landing.tsx
**Actual files changed (other):** evidence/S-8/*, evidence/watchdog-ack.txt, sprints.json, tests/e2e/s8-landing-widgets.spec.ts

**Unauthorized modifications:** NONE
**Process violations:**
- Declared `server/routes/public.ts` in filesModified but did not modify it. Minor declaration inaccuracy (over-declared, not under-declared).

**Governance files modified:** NONE

---

## Sprint S-9
**Commit:** 8ebe396
**Approved scope:** Operator approved with scope change: "Operator directive — hide Management tab from all roles except super_admin. Backlog I-116 and I-169."
**Declared filesModified:** tests/e2e/live-comms.spec.ts, tests/e2e/real-integrations.spec.ts
**Actual files changed (app source):** NONE (no client/ or server/ files modified)
**Actual files changed (test/infra):** package.json, package-lock.json, playwright.config.ts, tests/e2e/helpers/auth.ts, tests/e2e/live-comms.spec.ts, tests/e2e/real-integrations.spec.ts, tests/e2e/s9-cross-cutting.spec.ts
**Actual files changed (other):** evidence/S-9/*, sprints.json

**Unauthorized modifications:**
- `package.json` and `package-lock.json` modified (added @axe-core/playwright and dotenv devDependencies) — NOT in declared filesModified.
- `playwright.config.ts` modified (added dotenv import, removed "sprint" project config) — NOT in declared filesModified.
- `tests/e2e/helpers/auth.ts` modified (replaced fake test emails with real production emails, added 4 per-dealer accounts) — NOT in declared filesModified.
- `tests/e2e/s9-cross-cutting.spec.ts` created (396 lines) — NOT in declared filesModified.

**Process violations:**
- The operator-approval.md mentions "hide Management tab from all roles except super_admin" but no RBAC code was actually modified in this commit. The dev-report claims RBAC changes were made to rbac.ts and management.tsx, but the git diff shows zero changes to those files. **Either the RBAC change was never committed, or the dev-report is fabricated evidence.**
- 5 undeclared files modified. While test infrastructure changes (package.json, playwright.config.ts, auth helpers) are arguably necessary for the sprint's testing goals, they were not declared and represent scope creep.
- The auth.ts changes are significant: all role-specific test accounts (executive, sales, service, marketing) were redirected to the same `serra_honda@huminic.ai` org_admin account. This fundamentally changes how RBAC testing works and was not declared or acknowledged.

**Governance files modified:** NONE (issues.md, backlog.md, PLAN.md untouched)

---

## Sprint S-10
**Commit:** 3beb615
**Approved scope:** Operator approved with scope: "I-102 (Photo Studio verification) + I-138 (Unauthorized Agent cleanup). I-130 backlogged."
**Declared filesModified:** .github/workflows/deploy.yml
**Actual files changed (app source):** NONE
**Actual files changed (other):** .github/workflows/deploy.yml, issues.md, evidence/S-10/*, sprints.json, tests/e2e/s10-launch.spec.ts

**Unauthorized modifications:**
- **`issues.md` modified without declaration or prior acknowledgement.** This is a governance file. The changes were extensive: 3 REMEDIATING items marked CLOSED, 6 test gaps marked CLOSED, 4 TI items marked CLOSED, summary statistics rewritten. While the operator-approval.md mentions I-102 and I-138, it does NOT authorize modifying issues.md. The sprint's AC10 criterion is "All issues.md items status=CLOSED" — this is a verification criterion, not authorization to modify the file.

**Process violations:**
- **CRITICAL: Governance file (issues.md) modified without explicit operator acknowledgement.** The agreed rules state: "issues.md unchanged unless acknowledged."
- The operator-approval scope says "I-102 (Photo Studio verification) + I-138 (Unauthorized Agent cleanup)" but the dev-report focuses on verifying those issues (finding Photo Studio broken, finding unauthorized agent present) without actually fixing either. The issues.md changes are unrelated to I-102 and I-138 — they close out I-086, I-090, I-101, TI-010, TI-015, TI-016, TI-017, and multiple TG items.
- The dev-report does not mention modifying issues.md at all. The change was made silently.

**Governance files modified:** issues.md (UNAUTHORIZED)

---

## Summary of All Unauthorized Actions

### Critical Violations

1. **S-3: No operator-approval.md exists.** Sprint was executed without documented operator authorization. Violates the fundamental governance requirement.

2. **S-10: issues.md modified without acknowledgement.** Extensive changes to a governance file (closing 10+ items, rewriting statistics) were made silently — not mentioned in the dev-report, not declared in filesModified, and not authorized by the operator-approval scope (which only covers I-102 and I-138).

3. **S-9: Dev-report claims RBAC code changes that do not exist in the git commit.** The dev-report states RBAC modifications were made to rbac.ts and management.tsx, but the commit contains zero changes to those files. This is either fabricated evidence or the changes were never actually committed.

### Moderate Violations

4. **S-9: 5 undeclared files modified** — package.json, package-lock.json, playwright.config.ts, tests/e2e/helpers/auth.ts, tests/e2e/s9-cross-cutting.spec.ts. Test infrastructure changes were necessary for the sprint but not declared.

5. **S-9: auth.ts test user consolidation** — All role-specific test accounts were redirected to a single org_admin email, fundamentally changing RBAC test coverage. This architectural decision was not declared or acknowledged.

6. **S-0: playwright.config.ts modified without declaration** — Undeclared test infrastructure change.

### Minor Violations

7. **S-0: Declared filesModified inaccurate** — 5 of 6 declared files were NOT actually modified (only server/outbound.ts was changed). Over-declaration.

8. **S-3: Declared filesModified inaccurate** — client/src/pages/sales.tsx declared but not modified.

9. **S-3: Dev-report documents S-2 work** — Claims I-150 channel filter changes in teambox.tsx, but those changes were committed in S-2.

10. **S-7: Declared filesModified not modified** — settings.tsx, profile.tsx, AppLayout.tsx declared but none modified (verification-only sprint).

11. **S-8: Declared server/routes/public.ts not modified** — Over-declared.

12. **All sprints S-0 through S-10: Operator-approval files lack scope specificity.** Most contain only "OPERATOR APPROVED" with no list of what was approved. The agreed Step 1 (acknowledge sprint, list scope, wait for approval) has no evidence of scope being listed before approval in most cases.

### "While I'm Here" Changes

No explicit "while I'm here" code changes were detected. The unauthorized changes are primarily:
- Undeclared test infrastructure modifications (S-0, S-9)
- Governance file modification without acknowledgement (S-10)
- Evidence fabrication (S-9 dev-report vs actual commit)

---

## Rescue Copy Comparison

**Rescue snapshot taken:** 2026-03-29 00:40 UTC (commit 956bd8e)
**Files rescued:** PLAN.md, client/src/pages/teambox.tsx, client/src/pages/main.tsx, issues.md, sprints.json

### PLAN.md
**Result:** IDENTICAL — no changes between rescue copy and current version.

### client/src/pages/teambox.tsx
**Result:** 2-line difference. Rescue copy contains two additional filter entries that current version does not:
```
- { id: 'chat', label: 'Web Chat' },
- { id: 'whatsapp', label: 'WhatsApp' },
```
This is the I-150 channel filter cleanup (removing WhatsApp and Web Chat). The rescue copy was taken BEFORE the S2/S3 cleanup was applied. Current version is correct per sprint scope.

### client/src/pages/main.tsx
**Result:** IDENTICAL — no changes between rescue copy and current version.

### issues.md
**Result:** 1-line difference:
```
Rescue:  | I-102 | Photo Studio agent — FAL proxy code exists, known FE integration issue flagged in code comment | NEEDS LIVE TEST | E |
Current: | I-102 | Photo Studio agent — image generation returns 501 from /api/openai-proxy. Was working in prior testing runs. FAL proxy code exists. Needs investigation post-deploy. | OPEN | M |
```
The I-102 entry was updated after rescue with more specific diagnostic information (501 error, priority change from E to M). This change occurred AFTER the rescue snapshot and is the only post-rescue modification to issues.md.

### sprints.json
**Result:** 1507 lines of diff. Major structural changes:
- Version bumped from 6.2 to 7.0
- Description changed to "Rebuilt from verified state"
- totalSprints changed from 8 to 19
- Sprint IDs reorganized (S3A/S3B/S4A/S4B collapsed to S3/S4)
- FIX-01 sprint added with full definition
- All S-0 through S-10 sprint data updated with commitHash, status=committed, and detailed metadata

This is expected — sprints.json is updated with every sprint commit. The rescue copy predates the sprint execution.

---

## Conclusion

The most serious findings are:
1. **S-3 has no operator approval on file** — fundamental governance gap
2. **S-10 silently modified issues.md** — governance file changed without acknowledgement or declaration
3. **S-9 dev-report contains claims not supported by the git commit** — RBAC changes described but not present in the actual diff

The overall pattern shows that while most sprints (S-1, S-2, S-4, S-5, S-6, S-7, S-8) followed the process reasonably well, the approval documentation is thin across the board (most approvals lack scope specificity), and the S-9/S-10 sprints show escalating governance violations.
