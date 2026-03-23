# Pre-Execution Report: G-8.4 — Multi-Org Awareness for Chat

**Sprint:** G-8.4
**Phase:** 8 — AI Chat & Agents
**Type:** Gap (verification-first)
**Date:** 2026-03-23

## Objective

Verify that chat context includes the current org from auth middleware, VIN queries scope to the current org, and org switch changes the chat context.

## Declared Files

- `evidence/G-8.4/` — evidence output (verification only, no application code expected)

## Verification Plan

1. Log in as super_admin (duane.wells@huminic.ai) — default org is Serra Honda
2. Send a chat message and verify response references Serra Honda
3. Switch org to Hyundai of Columbia via API
4. Send same chat message and verify response references Hyundai
5. Verify VIN data queries scope to the switched org

## Known Context from Code Review

- Chat endpoint at line 2037 loads org data via `storage.getOrganization(req.user.organizationId)`
- Line 2048: `orgName = org?.name || "Nexxus Connect"`
- Line 2182: `nexxusOrgId = resolveNexxusOrgId(req.user.organizationId)` scopes VIN queries
- Org switch should update `req.user.organizationId` via auth middleware

## Success Criteria

- Chat response mentions correct org name after switch
- VIN queries return data for the switched org
