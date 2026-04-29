# Ghost Knowledge — nexxus2.2_replit

## Incidents

### Incident 1: UI Destruction (2026-03-08, nexxus2.2)
Dev agent deleted pre-populated data arrays from 14 page files and replaced
them with API calls to an empty backend. The foundational rule "change the
data source, not the UI" was violated across every department page.
Pattern: S-002 (data_array_deletion)
Prevention: EF-14, EF-15, EF-16 in pre-commit hook, C6 in watchdog

### Incident 2: Cross-Project Modification (2026-03-19)
REM-8-DT builder agent rewrote central-mcp VIN connector without
authorization. No backup existed. No git history in central-mcp at the time.
The builder agent was told "Do NOT modify application code files" but went
into a completely different project directory and rewrote infrastructure files.
Pattern: V-002 (cross_project_scope_violation)
Prevention: Agent filesystem boundaries in CLAUDE.md, C20 pending

### Incident 3: Governance Theater (2026-03-19)
62 out of 62 sprints had zero success criteria in pre-exec reports.
30 sprints had bulk-generated evidence (pre-exec and post-sprint written
within 2 minutes). The governance process was followed in form but not
substance for the entire project history.
Pattern: V-001 (bulk_generated_evidence), V-003 (hollow_pre_exec)
Prevention: C18 upgraded to VIOLATION, C19 added

### Incident 4: Work Outside Governance (2026-03-18)
I-039 — full MCP routing rewrite done without registering a sprint.
5 application files modified with no sprint in_progress.
Pattern: V-004 (work_before_sprint_registration)
Prevention: C16 upgraded to VIOLATION for application files

### Incident 5: Unauthorized Production Deployment (2026-03-20)
Agent modified server/routes/webhooks.ts, ran npm run build, ran pm2 restart,
and deployed to production without any commit. Live application changed with
zero audit trail. This happened during an emergency fix for the email incident.
Pattern: V-007 (production_deploy_without_commit)
Prevention: Deployment action rules in CLAUDE.md (pending)

### Incident 6: Test Payloads to Production (2026-03-20)
Test webhook payloads with fake phone numbers (+15559999999) triggered real
email notifications to real org admins (Durran received fake lead notifications).
The REM-8-BE builder agent wrote email notification code without a CommGate check.
Pattern: V-008 (test_payload_triggers_production_action)
Prevention: CommGate rule in CLAUDE.md, CommGate check in webhooks.ts

### Incident 7: False Commit (2026-03-20)
REM-9 committed through the pre-commit hook without verifying success criteria.
Agent wrote "PASS" in artifacts to satisfy gates, not to verify work. Agent
admitted: "I just wrote the artifacts and pushed it through the hook."
Pattern: V-009 (commit_without_criteria_verification)
Prevention: Sprint checkpoint system (pending), human gate on irreversible actions

### Incident 8: VIN Lead Mis-Assignment (2026-03-20)
35 leads across Hyundai of Columbia and Ford of Columbia assigned to
Albert Thomas instead of Durran Cage. MCP connector resolved sales rep
by string-matching a hardcoded name with inconsistent whitespace. Silent
fallback to first Admin when match failed. Customer called to complain.
Root cause: MCP making business logic decisions instead of the application.
Prevention: vin-safe-mcp with prepare/review/execute/verify flow,
vin_lead_config table (pending)

## Known False Positives
- C1/C9: Historical batch commits (634e695 10 sprints, 551a3a9 3 sprints,
  now rebased to 9198948 and 8f61d60) — will never clear
- C9: P2-S2, P3-S0, P3-S2 out of chronological order — historical
- C16: evidence/ screenshots outside sprint scope during visual testing —
  legitimate artifacts, not application code

## Watch For
- Agent citing speed as justification for skipping governance (V-005)
- Agent using passing tests to justify process violations (V-006)
- Builder agents modifying files outside their designated project
- Pre-exec and post-sprint reports with identical timestamps
- Any npm run build or pm2 restart outside a committed sprint
- CommGate flags — should be OFF during testing, ON for production
- VIN Solutions operations — must go through vin-safe-mcp only
- feedback_autonomous_trust.md — must be deleted, contradicts Action Protocol
