# E-012 Post-Sprint Report
**Sprint:** E-012 — Full Application Inventory and Verification
**Category:** Exploratory
**Phase:** qa_resolve_loop
**Date:** 2026-03-26

## What Was Done

### Phase 1: Codebase Inventory (COMPLETE)
- Full codebase inventory: 21 routes, 154 API endpoints, 20 DB tables, 6 RBAC levels, 8 external integrations, 14 agents
- Artifacts: codebase-inventory-raw.txt, ui-inventory.md

### Phase 2: Six-Layer Verification (COMPLETE with gaps)
- S1 Presentation: Playwright verified 8/10 untested routes. 2 routes untested (tool permissions revoked mid-run).
- S2 Application: API workflow verification — all endpoints return real data. Auth, org switching, conversations, campaigns, agents, warehouse, tasks, documents, insights, notifications all confirmed working.
- S3 Processing: Kill switch ON, blacklist working, FAL proxy functional, insights real data, hunches real. Billing returns {configured: false} — launch blocker confirmed.
- S4 Data: 11 agents, 140 conversations, 96 campaigns, 1912 leads, 48 metrics, 15 tasks, 5 hunches. Org isolation verified (Honda vs Nissan, zero leakage).
- S5 Security: Auth correct (no enumeration leak), org isolation PASS, security headers present, HTTPS working.
- S6 Infrastructure: PM2 online, health 200, central-mcp + vin-safe-mcp running, all critical env vars set except APP_BASE_URL (intentionally removed).

### AP Check (COMPLETE)
- Corrected 3 false claims from initial analysis
- Found 5 additional gaps Captain missed
- Identified always-true assertions in s11 test file

### Researcher Investigation (COMPLETE)
- I-108 (APP_BASE_URL): FALSE ISSUE — intentionally removed, uses request host
- I-107 (TextMagic key): FALSE ISSUE — SMS routes through central-mcp, not direct API
- I-106 (Campaign zero sends): Root cause = per-phone rate limit (3/24h) + recipient state machine. Rate limit raised to 100 by operator.
- VAPI webhook investigation: Confirmed webhooks configured to live.huminic.app, same instance as dev.huminicdev.com (both → port 5000)

### Test Coverage Audit (COMPLETE)
- 39 test files, 831 real assertions, 103 stubs
- 8 always-true assertions in s11-demo-hotfix.spec.ts
- 7 routes with zero coverage
- Test files use production URL (dev.huminicdev.com)

## Issues Found: 10 opened, 1 closed as false
- I-102: Photo Studio FE broken (FAL backend works) — REMEDIATING
- I-103: 8 always-true assertions — REMEDIATING
- I-104: 103 stub tests — REMEDIATING
- I-105: Billing not configured — REMEDIATING (launch blocker)
- I-106: Campaign rate limiting — INVESTIGATING (rate raised to 100)
- I-107: SMS rate limiting — INVESTIGATING (downgraded)
- I-108: APP_BASE_URL — CLOSED (false issue)
- I-109: Uncommitted git changes — REMEDIATING
- I-110: Test URLs use prod — REMEDIATING
- I-111: 7 routes uncovered — REMEDIATING

## Artifacts Produced
- codebase-inventory-raw.txt
- ui-inventory-raw.txt / ui-inventory.md
- fe-verification-raw.txt
- be-dt-verification-raw.txt
- test-coverage-matrix-raw.txt
- six-layer-verification.md
- application-deep-read.txt
- post-sprint.md (this file)

## What Was NOT Done
- AC9: Test files not yet updated
- AC10: Remediation sprint spec — writing now as R-012

## Hard-Won Knowledge
- Subagents cannot access cross-project files, Bash, or Playwright MCP from governor root. Must run from main session.
- SMS goes through central-mcp (callMCP "tm_send_message"), not direct TextMagic API. No TEXTMAGIC_API_KEY needed in app .env.
- APP_BASE_URL intentionally removed — app uses request host for multi-domain support.
- VAPI webhooks configured to live.huminic.app (same instance as dev.huminicdev.com, both port 5000).
- Always check the actual code path before claiming something is broken based on .env file presence.
