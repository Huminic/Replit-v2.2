# Pre-Execution Report: FIX-S10

Timestamp: 2026-03-17T06:47:11Z
Sprint: FIX-S10 — Org Admin multi-org + security + UI fixes

## Fixes
1. Remove "Pin to Dashboard" buttons from insights.tsx (lines 2079, 2155)
2. Move password change UI from settings.tsx to profile.tsx
3. Add additional_org_ids column to users table, enable Org Admin switching
4. Add partnerId validation to switch-org for Partner Admin

## Role Separation
Code changes delegated to builder agents. Orchestrator does not write code.

## Status: READY TO FIX
