# Cross-Sign — EMG-ORG-SWITCH-01

**Sprint ID:** EMG-ORG-SWITCH-01
**Timestamp:** 2026-04-08T13:30:00Z

## Implementing Role: orchestrator

**Scope:** Replace `window.location.href = '/'` with `queryClient.invalidateQueries()` in `handleSwitchOrg` in TopBar.tsx to fix org-switch login redirect on HTTPS.
**Changes verified:**
- [x] client/src/components/layout/TopBar.tsx — handleSwitchOrg updated, page reload removed, queryClient.invalidateQueries() added
- [x] queryClient already imported at line 25 — no new imports needed
- [x] No DB changes, no API changes, no schema changes
- [x] Fix is minimal and targeted — single function

## Reviewing Role: enforcer

**Verification checklist:**
- [x] Only declared file modified: client/src/components/layout/TopBar.tsx
- [x] Change is backwards-compatible — no external behavior change except login redirect is eliminated
- [x] queryClient.invalidateQueries() is the correct React Query API for cache-busting without page reload
- [x] Emergency sprint authorized by operator — no ghost entry gate required
- [x] No security implications — access token remains in memory, org switch is auth-gated

## Verdict: APPROVED
