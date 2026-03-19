# AUDIT-1e Defects

## DEF-011: Dead code — vapiGet/vapiPost/tavusGet/tavusPost in vendorProxy.ts
- Severity: MINOR (dead code after I-039 MCP migration)
- Action: Backlog (already tracked as BL-025)

## DEF-012: Dead code — Resend import in outbound.ts
- Severity: MINOR (unused after I-039)
- Action: Backlog (already tracked as BL-026)

## DEF-013: I-081 confirmed — assignedTo column missing from conversations schema
- Severity: MAJOR (takeover feature silently fails at data layer)
- File: shared/schema.ts — conversations table
- Action: Already in issues.md as I-081

## DEF-014: REM-4 missing loop-prep.md
- Severity: MINOR (governance gap)
- Action: Historical. Loop Prep Framework was added in harness.md but REM-4 didn't follow it.

## DEF-015: I-1 pre-exec has no declared files or success criteria
- Severity: MINOR (governance gap)
- Action: Will be fixed in AUDIT-1f/1g evidence rewrite.

## DEF-016: REM-1 I-058 claim misdescribes mechanism
- Severity: MINOR (documentation — code works correctly)
- Post-sprint says "skipped when no cookie exists" but code always calls refresh (httpOnly invisible to JS)
- Action: Historical documentation inaccuracy. Code behavior is correct.
