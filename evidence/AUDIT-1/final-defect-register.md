# AUDIT-1 Final Defect Register

All defects found during micro sprints 1a through 1e.

## CRITICAL (0)
None found.

## MAJOR (2)

### DEF-009: seed.ts logs admin password to console in production
- Source: AUDIT-1d
- File: server/seed.ts line 10
- Impact: Password visible in PM2 logs
- Action: Add to issues.md for remediation

### DEF-013: assignedTo column missing from conversations schema
- Source: AUDIT-1e
- File: shared/schema.ts — conversations table
- Impact: Takeover feature silently fails at data layer. PATCH with assignedTo is discarded. aiPaused always returns false.
- Action: Already in issues.md as I-081

## MINOR (14)

### DEF-001: P2-S0 post-sprint claims auth rate limit "10/min" — actual is 100/15min
- Source: AUDIT-1a
- Type: Stale documentation (code changed in REM-3)

### DEF-002: P2-S0 post-sprint claims "fails closed" with ENTITLEMENT_FAIL_OPEN — actual is fail-open with ENTITLEMENT_FAIL_CLOSED
- Source: AUDIT-1a
- Type: Stale documentation (code changed in REM-2)

### DEF-003: (req as any).requestId introduced by P2-S0 contradicting "no new any types"
- Source: AUDIT-1a
- Type: Type safety gap

### DEF-004: server/replit_integrations/ directory still exists with legacy naming
- Source: AUDIT-1a
- Type: Dead code / naming artifact

### DEF-005: Post-sprint reports have inaccurate line/endpoint counts (P4-S2, P4-S3, P4-S4)
- Source: AUDIT-1b
- Type: Stale documentation (counts drifted from remediation)

### DEF-006: QA-S7 gap analysis has inaccurate line numbers for as-any casts
- Source: AUDIT-1c
- Type: Stale documentation

### DEF-007: Password change duplicated in settings.tsx and profile.tsx
- Source: AUDIT-1d
- Type: Code duplication

### DEF-008: FIX-S10/S11 modified files outside declared scope
- Source: AUDIT-1d
- Type: Historical governance violation (Gate 2.5 now prevents)

### DEF-010: Governance documentation quality degraded in later FIX sprints
- Source: AUDIT-1d
- Type: Process (C19 now enforces quality)

### DEF-011: Dead code — vapiGet/vapiPost/tavusGet/tavusPost in vendorProxy.ts
- Source: AUDIT-1e
- Type: Dead code after I-039 MCP migration (tracked as BL-025)

### DEF-012: Dead code — Resend import in outbound.ts
- Source: AUDIT-1e
- Type: Dead code (tracked as BL-026)

### DEF-014: REM-4 missing loop-prep.md
- Source: AUDIT-1e
- Type: Governance gap

### DEF-015: I-1 pre-exec has no declared files or success criteria
- Source: AUDIT-1e
- Type: Governance gap (now fixed by AUDIT-1g rewrite)

### DEF-016: REM-1 I-058 claim misdescribes mechanism (cookie check vs always-refresh)
- Source: AUDIT-1e
- Type: Stale documentation
