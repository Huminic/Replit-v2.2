# Remediation Plan — Post-Testing
**Date:** 2026-03-27
**Source:** 16 T-series testing sprints + operator directives

---

## Disposition Summary

| Issue | Disposition | Sprint |
|---|---|---|
| I-134 | FIX — route redirect race | R-014 |
| I-135 | FIX — CORS cross-origin | R-014 |
| I-136 | FIX — Sales nav→marketing | R-015 |
| I-137 | FIX — Tour breaks session | R-015 |
| I-138 | FIX — Unauthorized Agent | R-016 |
| I-139 | FIX — CRM Guru hallucination | R-016 |
| I-140 | FIX — Password reset fails | R-017 |
| I-141 | FIX — VAPI webhook 422 | R-017 |
| I-142 | FIX — VIN lead source mapping | R-017 |
| I-143 | FIX — Business hours on outbound (TCPA) | R-017 |
| I-144 | FIX — Blacklist in CommGate | R-017 |
| I-145 | BACKLOG (BL-083) | — |
| I-146 | ACCEPTED as-is (BL-082) | — |
| I-147 | FIX — TeamBox tabs match popout | R-015 |
| I-148 | FIX — Remove Role Switcher | R-015 |

---

## Remediation Sprints

### R-014: Landing Page & Widget Fixes [FE+BE]
**Files:** client/src/pages/widget-landing.tsx, client/src/App.tsx, server/index.ts (CORS)
**Issues:**
- I-134 (HIGH): Fix /p/{slug} route race — ensure public routes aren't caught by auth redirect. Likely fix: move /p/:slug and /w/:slug routes ABOVE the catch-all in App.tsx, or exclude them from ProtectedRoute.
- I-135 (HIGH): Fix CORS for widget endpoints — add wildcard or domain whitelist for /widget/* and /api/widget/* routes. Currently returns 500 on cross-origin requests.

**Parallel with:** R-015, R-016

---

### R-015: Navigation & UI Cleanup [FE]
**Files:** client/src/components/layout/Sidebar.tsx, client/src/components/layout/TopBar.tsx, client/src/pages/teambox.tsx, client/src/components/layout/SubMenuManager.tsx
**Issues:**
- I-136 (HIGH): Sales sidebar routes to /marketing — fix the path in Sidebar.tsx nav items
- I-137 (HIGH): Tour Skip/Close navigates to /w/{slug} — fix to dismiss tour without navigation
- I-147 (MEDIUM): TeamBox tabs — align top tabs with popout (remove Conversations as standalone tab, add channel-based structure matching SMS/Email/Phone/Video/Tasks)
- I-148 (MEDIUM): Remove Role Switcher from TopBar (lines 389-420) — dev tool, not for production

**Parallel with:** R-014, R-016

---

### R-016: Data Cleanup [DT+BE]
**Files:** server/seed.ts, server/routes/chat.ts (or agent-instructions.json)
**Issues:**
- I-138 (MEDIUM): Remove "Unauthorized Agent" from seed data, or filter it from sales agent API response
- I-139 (LOW): Fix Data Guru instructions — remove "CRM Guru" references from agent prompt/instructions

**Also (operator directive):**
- Stub out Tasks feature in chat tools — remove createTask from any tool schemas, add comment noting BL-084
- If Tasks tab exists in TeamBox, stub it with "Coming soon" or remove

**Parallel with:** R-014, R-015

---

### R-017: Backend Fixes [BE]
**Files:** server/routes/webhooks.ts, server/outbound.ts, server/routes/auth.ts
**Issues:**
- I-140 (HIGH): Password reset — investigate and fix POST /api/auth/reset-password failure
- I-141 (HIGH): VAPI webhook 422 — fix transcript payload handling in webhooks.ts (missing `message` field)
- I-142 (MEDIUM): VIN lead source — change "Website" to "Dealers WebSite" in webhook lead creation
- I-143 (HIGH): Add business-hours check to outbound campaign execution pipeline (TCPA)
- I-144 (MEDIUM): Add blacklist check to checkCommGate() so dry runs catch blacklisted numbers

**Sequential after:** R-014/R-015/R-016 (backend changes need careful testing)

---

## Execution Order

```
PARALLEL:
  R-014 [FE+BE] Landing/CORS (I-134, I-135)
  R-015 [FE]    Nav/UI cleanup (I-136, I-137, I-147, I-148)
  R-016 [DT]    Data cleanup (I-138, I-139, tasks stub)

SEQUENTIAL:
  R-017 [BE]    Backend fixes (I-140, I-141, I-142, I-143, I-144)
```

R-014, R-015, R-016 touch different files — fully parallelizable.
R-017 is backend-heavy and needs testing after the FE fixes are in.

---

## After Remediation
1. Rebuild + restart PM2
2. Re-run failed T-sprint ACs to verify fixes
3. If all pass → SEC-10 (Launch prep)
