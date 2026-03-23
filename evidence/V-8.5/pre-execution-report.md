# Pre-Execution Report: V-8.5 — Verify Knowledge Base

**Sprint:** V-8.5
**Phase:** 8 — AI Chat & Agents
**Type:** Verification (read-only)
**Date:** 2026-03-23

## Objective

Verify that document upload works, documents are associated with the correct agent and org, and chat queries reference document content in responses.

## Declared Files

None — verification sprint is read-only.

Evidence output: `evidence/V-8.5/`

## Verification Plan

1. Check existing documents via GET /api/documents
2. Verify document upload endpoint exists (POST /api/documents)
3. If documents exist, test whether chat references their content
4. Verify documents are org-scoped (don't leak across orgs)

## Known Context from Code Review

- Lines 2084-2103 of routes.ts: Knowledge base documents loaded and injected into system prompt
- Documents filtered by agentId (agent-specific docs) or no agentId (general docs)
- Content truncated to 8000 chars per doc, 32000 total

## Success Criteria

- Document list endpoint returns documents
- Chat references document content when relevant
- Documents scoped to correct org
