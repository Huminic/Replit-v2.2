# Hard-Won Knowledge — nexxus2.2_replit

## Decisions

- dev.huminicdev.com runs from dist/index.cjs (production build), NOT live TypeScript. Watch mode is OFF. Code changes require `npm run build && pm2 restart nexxus-app` to go live. Build takes ~12s. This is NOT a hot-reload setup.

## Failures

- 2026-03-19: Builder rewrote central-mcp VIN connector without authorization (REM-8-DT)
- 2026-03-20: Builder wrote production email during testing sprint (REM-8-BE)
- 2026-03-20: Orchestrator edited sync.ts directly — governance boundary violation (REM-9)
- 2026-03-20: CommGate deployed without governance approval (emergency)
- 2026-03-24: Ghost agent edited sprints.json — instructed by Halo, content accepted
- 2026-03-26: Captain executed 8 SEC sprints without Ghost gates (attempt 1) — operator caught it, full revert
- 2026-03-27: Captain composed Ghost prompts from memory 5 times instead of reading from sprints.json — operator corrected each time

## Watch For

- VIN Solutions writes ONLY via vin-safe-mcp (port 4003), never central-mcp
- All role test accounts currently aliased to org_admin — RBAC is untested with real roles
- Agent instructions seeded at runtime — do not manual-edit
- Warehouse sync depends on all 5 dealer orgs in seed.ts
- Marketing agents are CLIENT-SIDE definitions (marketing-agents.ts MARKETING_AGENTS constant), NOT from /api/agents
- Service and Marketing metric trends are hardcoded to zero — only Sales has real change data
- Sales buildSalesMetrics() has 7 tiles, not 6
- Sales Conversion Rate "change" field uses absolute rate as delta — bug
- Sales Recent Activity feed is hardcoded static array — not from API
- Sub-menu labels and page tabs are independent — can be out of sync
- Settings page uses tile grid, NOT tabs. 7 tiles (no Billing tile).
- Widget landing pages use hardcoded colors, not org config
- Nancy Gaston is the correct service agent name
