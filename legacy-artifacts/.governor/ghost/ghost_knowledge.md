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
