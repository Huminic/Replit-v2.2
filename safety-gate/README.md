# Deploy Safety Gate — Implementation Reference

**Status:** Design complete, not yet implemented
**Created:** 2026-04-03
**Issue:** I-228
**Implements when:** Operator says the time is right

## What This Is

A 3-layer pre-deployment safety system that catches nexxus-specific risks before code reaches production.

## Files to Create

| File | Purpose |
|------|---------|
| `.github/workflows/deploy-gate.yml` | CI pipeline with automated risk analysis |
| `scripts/deploy-risk-analysis.mjs` | Scans git diff for app-specific risks (webhooks, outbound messaging, VIN/MCP, auth, schema, env vars) |
| `scripts/schema-safety-check.mjs` | Detects destructive schema changes (column drops, renames, table removals) |
| `scripts/pre-deploy.sh` | Server-side: automatic pg_dump before every deploy, refuses to deploy if backup fails |

## Risk Patterns Covered

- Schema destructive ops (drizzle-kit push drops columns/tables)
- Webhook handler changes (VAPI, Tavus, SMS payload mismatch)
- Outbound messaging paths (unintended SMS/email/voice to customers)
- VIN Solutions / MCP integration changes (wrong data to dealership CRM)
- Auth changes (broken login, exposed routes)
- Campaign bulk sender changes (wrong messages to recipient lists)
- New env vars not set in Coolify
- Dockerfile / pm2 config changes
- Trigger/scheduler logic changes

## How It Works

1. Push to main triggers GitHub Actions
2. `deploy-risk-analysis.mjs` scans the diff against known risk patterns
3. If schema.ts changed, `schema-safety-check.mjs` does deep structural analysis
4. Produces a plain-language risk report (markdown artifact)
5. Blocks deploy if human review needed (RISK_LEVEL: BLOCK)
6. On server, `pre-deploy.sh` takes pg_dump backup before every deploy

## Full Design

The complete implementation (workflow YAML, all scripts with full code) was produced by the technical-architect agent on 2026-04-03. Ask sysadmin or the governor agent to retrieve it, or reference the conversation where it was designed.
