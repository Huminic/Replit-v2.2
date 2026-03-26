# Hard-Won Knowledge — nexxus2.2_replit

## Decisions

## Failures
- 2026-03-19: Builder rewrote central-mcp VIN connector without authorization (REM-8-DT)
- 2026-03-20: Builder wrote production email during testing sprint (REM-8-BE)
- 2026-03-20: Orchestrator edited sync.ts directly — governance boundary violation (REM-9)
- 2026-03-20: CommGate deployed without governance approval (emergency)
- 2026-03-24: Ghost agent edited sprints.json — instructed by Halo, content accepted

## Watch For
- VIN Solutions writes ONLY via vin-safe-mcp (port 4003), never central-mcp
- All role test accounts currently aliased to org_admin — RBAC is untested with real roles
- Agent instructions seeded at runtime — do not manual-edit
- Warehouse sync depends on all 5 dealer orgs in seed.ts
- Marketing agents are CLIENT-SIDE definitions (marketing-agents.ts MARKETING_AGENTS constant), NOT from /api/agents — different architecture than Sales/Service
- Service and Marketing metric trends are hardcoded to zero (change: 0, trend: 'up') — only Sales has real change data
- Sales buildSalesMetrics() has 7 tiles, not 6. Two tiles (Waiting on Response, Appointments Set) have hardcoded change: 0
- Sales Conversion Rate "change" field uses the absolute rate as the delta (line 115 of sales.tsx) — this is a bug
- Sales Recent Activity feed is a hardcoded static array (lines 591-603) — not from API
- Sub-menu labels and page tabs are independent — they can be out of sync (Service says "Dashboard", Manage says "Dashboard", Marketing says "Campaigns" — none of these tabs exist)
- Settings page uses tile grid → drill-down, NOT tabs. 7 tiles (no Billing tile). Billing only in sub-menu.
- AI Config tile is super_admin only but sub-menu shows it for partner_admin (read-only) — inconsistent
- TopBar "Take a Tour" label and Profile Billing link are stale — need rename and removal respectively
- Widget landing pages use hardcoded colors (WIDGET_TEAL, GUNMETAL_BLUE), not org config from settings
- Web Call widget currently does browser-to-AI voice call, NOT phone-to-phone outbound — manifest may want different behavior
- Nancy Gaston is the correct name for the service agent (manifest initially said "Payne" — operator corrected)
