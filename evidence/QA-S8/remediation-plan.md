# Remediation Plan

Generated: 2026-03-14
Sprint: QA-S8

## FIX-S0: MAJOR Defects + Governance Fixes + QA Evidence

### Acceptance Criteria

| # | Fix | File | Test |
|---|-----|------|------|
| 1 | API 404 handler: /api/* returns 404 JSON before SPA fallback | server/index.ts | GET /api/nonexistent returns 404 `{"error":"Not found"}` |
| 2 | Remove temp password console.log | server/routes/users.ts:371 | Grep confirms no plaintext password in console.log |
| 3 | Add HTML title tag | client/index.html | `<title>` tag present |
| 4 | Commit governance fixes (log_audit + EF-09) | scripts/pre-commit.sh, scripts/enforcer-checklist.sh | Hook synced, checklist passes |
| 5 | Commit all QA evidence (QA-S0 through QA-S8) | evidence/QA-S0/ through evidence/QA-S8/ | All evidence directories in commit |
| 6 | Commit quality matrix | evidence/quality-matrix.md | Present in commit |
| 7 | Commit context-check hook | .claude/ | Present in commit |
| 8 | Update sprints.json | sprints.json | All QA sprints marked committed, FIX-S0 committed |

### Scope
- server/index.ts (API 404 handler)
- server/routes/users.ts (remove console.log)
- client/index.html (title tag)
- scripts/pre-commit.sh (already fixed)
- scripts/enforcer-checklist.sh (already fixed)
- sprints.json
- .claude/ (hooks, settings)
- evidence/* (all QA artifacts)

### Commit Role
- COMMIT_ROLE=orchestrator
- COMMIT_SPRINT=FIX-S0

---

## FIX-S1: Type Safety + Documentation (deferred)

Not registered in sprints.json yet. Low priority. Will register after FIX-S0 is committed and authenticated testing (L2) determines if additional fixes are needed.

### Scope (tentative)
- 10 route files with `as any` casts
- 2 post-sprint reports with incorrect endpoint counts
- Duplicate security header resolution

---

## Authenticated Testing (deferred, requires credentials)

QA-S9 through QA-S14 will be registered after FIX-S0 is committed and test credentials are available.
