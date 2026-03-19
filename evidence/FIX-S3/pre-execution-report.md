# Pre-Execution Report: FIX-S3
Timestamp: 2026-03-16T05:50:00Z
Sprint: FIX-S3 — Auth fixes — logout bug, error message, restart tour, org wizard, org data correction
Status: RETROACTIVE — originally written without governance compliance

## Objective
Fix 5 auth-related defects: (1) logout React DOM error, (2) wrong credentials show generic error instead of specific message, (3) restart tour button missing from profile, (4) org wizard not accessible to Super Admin, (5) Partner Admin org assignment incorrect.

## Declared Files
- client/src/contexts/AuthContext.tsx
- client/src/components/layout/Sidebar.tsx
- client/src/components/layout/TopBar.tsx
- client/src/pages/profile.tsx
- client/src/pages/org-wizard.tsx
- evidence/FIX-S3/
- evidence/live-testing-spec.md
- evidence/watchdog-ack.txt

## Success Criteria
Retroactive — derived from post-sprint claims:
- Logout produces clean redirect with no React DOM error
- Wrong credentials show "Invalid email or password" message
- Restart tour button present in Profile Preferences tab
- Org wizard renders 7-step form for Super Admin
- Partner Admin assigned to correct org (Cage Automotive)
