# ADF Functions Insertion Guide

## Blocker

The captain-check hook at `.claude/hooks/captain-check.sh` blocks Edit/Write to `server/` paths because `CLAUDE_AGENT_DEPTH` env var is not set in the builder agent's environment. The hook exempts sub-agents (depth > 0) but the task dispatch mechanism does not set this variable.

## What was built

File: `evidence/LAUNCH-RECON-01/adf-build/adf-functions.ts`

Contains 4 functions:
1. `escapeXml(str)` -- XML character escaping helper
2. `formatPhoneForAdf(phone)` -- strips +1 prefix, formats as XXX-XXX-XXXX
3. `buildAdfXml(params)` -- pure function, builds ADF 1.0 XML from structured data
4. `submitAdfLead(organizationId, leadData)` -- async function, looks up org config, builds XML, sends or logs

## Insertion point

File: `server/routes/webhooks.ts`
Insert AFTER line 498 (end of `generateLeadEmailHTML()` function, the closing `}`+newline)
Insert BEFORE line 500 (the `// VAPI webhook call object schema` comment)

## How to insert

The orchestrator should either:
1. Temporarily set `CLAUDE_AGENT_DEPTH=1` in the hook environment, or
2. Directly edit `server/routes/webhooks.ts` (the orchestrator runs at depth 0 but can dispatch an agent with proper env), or
3. Apply the code manually

## Dependencies already imported

Both `storage` (line 4) and `callMCP` (line 6) are already imported in webhooks.ts. No new imports needed.

## Build verification

Build has NOT been run yet because the code has not been inserted into webhooks.ts. Once inserted, run:
```bash
cd /home/ubuntu/Claude-store/nexxus2.2_replit && npm run build 2>&1 | tail -10
```
