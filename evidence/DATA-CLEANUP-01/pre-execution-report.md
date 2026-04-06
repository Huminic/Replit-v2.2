# Pre-Execution Report: DATA-CLEANUP-01

**Date:** 2026-04-06
**Sprint:** DATA-CLEANUP-01 — Test Data Purge

## Objective

Purge all E2E test artifacts from the production database (Supabase). This includes test campaigns, test conversations (555 numbers), unauthorized/XSS agents, test users, and system-generated escalation noise. Production data must remain untouched.

## SQL Statements

1. **Backup:** SELECT count(*) from all affected tables (pre-cleanup snapshot)
2. **DELETE** messages where conversationId references test conversations
3. **DELETE** conversations with 555 phone numbers or test customer names (WF-*, E2E*, Cross Org*)
4. **DELETE** campaign_recipients for test campaigns
5. **DELETE** campaigns named E2E*, WF-*, Vehicle Merge*, Test Campaign*
6. **DELETE** agents named *Unauthorized*, *Should fail*, *XSS*
7. **DELETE** users with firstName LIKE 'T022e%'
8. **UPDATE** escalation tasks (VIN Lead, Prepare Failed, SMS blocked) to status='archived'

## Declared Files

- evidence/DATA-CLEANUP-01/pre-execution-report.md
- evidence/DATA-CLEANUP-01/post-sprint-report.md
- evidence/DATA-CLEANUP-01/pre-cleanup-counts.txt
- evidence/DATA-CLEANUP-01/post-cleanup-counts.txt
- evidence/DATA-CLEANUP-01/post-cleanup-verify.txt
- issues.md

## Not In Scope

- Application code changes
- Schema migrations
- UI modifications

## Test Plan

- Pre-cleanup: SELECT count(*) on conversations, campaigns, agents, users, tasks
- Post-cleanup: SELECT count(*) on same tables, compare deltas
- API verification: Login as serra_honda@huminic.ai, GET /api/campaigns, /api/agents, /api/conversations
- Spot-check: Confirm real production records still exist after cleanup

## Acceptance Criteria

- DC-01.AC1: Test campaigns deleted (>130 E2E artifacts)
- DC-01.AC2: Test conversations with 555 numbers deleted
- DC-01.AC3: Test/unauthorized agents deleted
- DC-01.AC4: Test user records deleted
- DC-01.AC5: System-generated VIN/SMS escalation noise archived
- DC-01.AC6: Production data untouched — verified by spot check
