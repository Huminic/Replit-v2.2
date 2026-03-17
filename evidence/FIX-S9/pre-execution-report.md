# Pre-Execution Report: FIX-S9

Timestamp: 2026-03-17T03:57:43Z
Sprint: FIX-S9 — Fix open defects from QA-S16/S17

## Watchdog Ack
Report-ID: WD-20260317-022413 — acknowledged, violations addressed

## Defects to Fix (5 actionable — 2 deferred)

### Actionable:
1. Campaign seed data fabricated (sent_count/replied_count don't match reality) — MAJOR
2. Chat shows 1 lead via MCP vs 1300 in warehouse (query parameter mismatch) — MAJOR
3. Lead sources show raw VIN API URLs instead of human-readable names — MINOR
4. Channel performance all "Other" (lead type not mapped to channels) — MINOR
5. metricsFromWarehouse all zeros (warehouse_metrics table not populated) — MINOR

### Deferred (require coordination):
6. VAPI webhook wrong secret — DO NOT FIX (email flood risk, coordinate with live version)
7. Tavus widget "not configured" for demo org — needs Tavus backend config, not code change

## Role Separation
- Orchestrator: plans, delegates, compares, commits
- Code changes: delegated to agents in worktrees
- Testing: dual agents after fixes

## Status: READY TO FIX
