# T-022b Cross-Sign Verification

**Sprint:** T-022b (Sales Functional Depth)
**Executed:** 2026-03-27T01:00:00Z - 2026-03-27T01:20:00Z
**Signed by:** Test Agent

## Verification Summary

| AC | Verified | Method | Evidence |
|----|----------|--------|----------|
| AC1 | YES | Playwright snapshot + API `/api/agents` | 5 agents in sales dept (API), 5 in sidebar (DOM) |
| AC2 | YES | API `/api/agents` descriptions field | Full descriptions returned, no truncation |
| AC3 | YES | DOM text search + API agent names | Zero "CRM Guru" matches; agent named "Data Guru" |
| AC4 | YES | Playwright snapshot of /sales | 7 tiles rendered with "Sales Dashboard" heading |
| AC5 | YES | cURL to both API endpoints + DOM comparison | See pipeline-comparison.md |
| AC6 | YES | cURL to `/api/appointments` | 3 appointments with source=vapi found |
| AC7 | YES | cURL streaming to `/api/chat/{id}/stream` | Data Guru responded about leads/CRM |
| AC8 | YES | cURL streaming to `/api/chat/{id}/stream` | Sales Coach responded about financing objections |
| AC9 | YES | cURL streaming to `/api/chat/{id}/stream` | Communication Writer generated Civic follow-up email |
| AC10 | YES | DOM inspection + API comparison | All tiles show 0% change |
| AC11 | YES | cURL to both endpoints + DOM | Tile uses metrics pipeline (111), not warehouse (222) |

## Defects Found

1. **P1 - Sales sidebar navigation routes to Marketing** -- Clicking Sales in sidebar loads Marketing content in main area
2. **P2 - Product Tour buttons navigate to public widget page** -- Skip/Close buttons route to `/w/{org-slug}`, breaking auth session
3. **P3 - "Unauthorized Agent" visible in Sales** -- Test artifact agent visible to users (5 agents instead of expected 4)
4. **P3 - Data Guru references nonexistent "CRM Guru mode"** -- AI hallucination in agent response

## Cross-Sign

I verify that all 11 ACs were tested as specified and results documented with evidence.

- Evidence files: `post-sprint-report.md`, `pipeline-comparison.md`
- API data captured via cURL (not subject to browser session instability)
- DOM data captured via Playwright snapshots during successful page loads
