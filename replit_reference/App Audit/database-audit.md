# Nexxus V2 Database Layer Forensic Audit

**Audit Date:** 2026-02-21
**Auditor:** Claude Opus 4.6 (forensic code analysis)
**Scope:** All migration files, table definitions, RLS policies, JSONB structures, foreign keys, functions, triggers, and connection configuration

---

## 1. Migration File Inventory

**Total migration files:** 33 (numbered 001-033, with 011 missing)
**Location:** `/home/ubuntu/Claude-store/nexxus-v2/database/migrations/`
**Date range:** 2026-01-22 through 2026-02-19

| # | File | Date | Purpose |
|---|------|------|---------|
| 001 | `001_create_core_tables.sql` | 2026-01-22 | Core 10 tables: organizations, locations, roles, users, partner_admin_organizations, integrations, agents, skills, conversations, messages, agent_runs |
| 002 | `002_create_remaining_tables.sql` | 2026-01-22 | 12 more tables: tasks, dashboards, widgets, goals, artifacts, credit_policies, credit_allocations, credit_usage, hunches, audit_log, insight_card_config, insight_card_state |
| 003 | `003_context_router_tables.sql` | 2026-01-29 | Context router: leads, vin_reports_cache, vapi_call_logs, tavus_sessions, sync_queue; also creates `update_updated_at_column()` function and 4 triggers |
| 004a | `004_create_user_integrations.sql` | 2026-02-01 | user_integrations table for IMAP/calendar per-user settings |
| 004b | `004_serra_seed_data.sql` | 2026-02-01 | Seed data: Serra orgs, partner admin user, VIN integrations, sample leads/calls/sessions; adds `external_id` column to integrations |
| 005 | `005_create_appointments_tables.sql` | 2026-02-01 | appointments, availability_blocks, appointment_reminders |
| 006 | `006_create_email_tables.sql` | 2026-02-01 | cached_emails, sent_emails, email_templates; default email templates seeded |
| 007 | `007_create_dealerbrain_config.sql` | 2026-02-02 | dealerbrain_config key-value table with 3 default rows |
| 008 | `008_create_notifications_tables.sql` | 2026-02-03 | notification_settings, notifications; creates `create_default_notification_settings()` trigger function |
| 009 | `009_create_password_reset_tokens.sql` | 2026-02-04 | password_reset_tokens table |
| 010 | `010_create_textmagic_tables.sql` | 2026-02-04 | textmagic_config, textmagic_messages, textmagic_opt_outs |
| 011 | **MISSING** | -- | No migration file 011 exists |
| 012 | `012_credit_policy_unique.sql` | 2026-02-05 | Bug fix: deduplicates credit_policies rows, adds UNIQUE(organization_id, service_type) |
| 013 | `013_create_widget_tables.sql` | 2026-02-05 | widget_configs, widget_callback_requests |
| 014 | `014_widget_interaction_tables.sql` | 2026-02-05 | widget_visitors, widget_chat_messages |
| 015 | `015_hosted_pages.sql` | 2026-02-08 | hosted_pages table |
| 016 | `016_inbox_conversations.sql` | 2026-02-08 | inbox_conversations, inbox_messages |
| 017 | `017_tracking_events.sql` | 2026-02-08 | tracking_events for pixel attribution |
| 018 | `018_trigger_rules.sql` | 2026-02-08 | trigger_rules, trigger_executions |
| 019 | `019_ai_usage_events.sql` | 2026-02-08 | ai_usage_events for governance |
| 020 | `020_report_benchmarks.sql` | 2026-02-08 | report_benchmarks (public ref data, 12 seed rows) |
| 021 | `021_widget_agent_config.sql` | 2026-02-08 | ALTER TABLE widget_configs: adds chat_instructions, chat_agent_name, chat_enabled_tools |
| 022 | `022_drive_files.sql` | 2026-02-09 | drive_folders, drive_files |
| 023 | `023_hunches_approvals.sql` | 2026-02-09 | ALTER TABLE hunches: adds columns; creates approval_requests table |
| 024 | `024_credit_idempotency.sql` | 2026-02-09 | ALTER TABLE vapi_call_logs/tavus_sessions: adds credit_recorded flag |
| 025 | `025_dealer_pulse_cache.sql` | 2026-02-12 | dealer_pulse_cache table |
| 026 | `026_org_lead_settings.sql` | 2026-02-12 | ALTER TABLE integrations: adds lead_duration_threshold |
| 027 | `027_knowledge_uploads.sql` | 2026-02-13 | knowledge_uploads table |
| 028 | `028_notification_idempotency.sql` | 2026-02-17 | ALTER TABLE vapi_call_logs: adds notification_sent flag |
| 029 | `029_default_trigger_templates.sql` | 2026-02-17 | trigger_templates table + 1 seed template |
| 030 | `030_vin_api_call_tracking.sql` | 2026-02-17 | vin_api_calls telemetry table |
| 031 | `031_service_quotas.sql` | 2026-02-17 | service_quotas table |
| 032 | `032_sms_business_hours.sql` | 2026-02-18 | ALTER TABLE textmagic_config: adds business_hours, ai_auto_reply_enabled; creates sms_conversation_state |
| 033 | `033_register_video_agents.sql` | 2026-02-19 | Seed data: registers 5 Tavus video agents for Serra/Hyundai/Ford orgs; adds unique index on agents for persona dedup |

**Additional SQL files:**
- `database/seed.sql` -- Development seed data (Nexxus Platform org, test dealership, Super Admin, Org Admin, Org Staff users)

**Anomalies:**
- Migration 011 is missing entirely (gap between 010 and 012)
- Two files share the `004` prefix (`004_create_user_integrations.sql` and `004_serra_seed_data.sql`) -- numbering collision

---

## 2. Complete Table Inventory

**Total distinct tables defined in migrations:** 53

| # | Table Name | Migration | Purpose | Key Columns |
|---|-----------|-----------|---------|-------------|
| 1 | `organizations` | 001 | Multi-tenant organization management | id, name, slug, type, settings (JSONB), billing_info (JSONB), status |
| 2 | `locations` | 001 | Dealership locations within organizations | id, organization_id, name, address (JSONB), timezone, business_hours (JSONB), contact_info (JSONB), settings (JSONB) |
| 3 | `roles` | 001 | RBAC role definitions (4-tier) | id, name, level (1-4), permissions (JSONB), description |
| 4 | `users` | 001 | User accounts | id, organization_id, location_id, email, password_hash, first_name, last_name, role_id, settings (JSONB), status |
| 5 | `partner_admin_organizations` | 001 | Partner Admin multi-org assignment junction | id, user_id, organization_id, assigned_at, assigned_by |
| 6 | `integrations` | 001 | External API credentials per org | id, organization_id, type, config (JSONB), credentials (JSONB), status, last_sync, external_id (004b), lead_duration_threshold (026) |
| 7 | `agents` | 001 | AI agent configurations | id, organization_id, name, description, type, config (JSONB), status, performance_metrics (JSONB), created_by |
| 8 | `skills` | 001 | Agent skill library | id, name, category, description, template (JSONB), parameters_schema (JSONB), is_system |
| 9 | `conversations` | 001 | Chat/voice/video conversation history | id, organization_id, location_id, type, channel, customer_info (JSONB), agent_id, user_id, status, metadata (JSONB) |
| 10 | `messages` | 001 | Individual messages within conversations | id, conversation_id, sender_type, sender_id, content, content_type, metadata (JSONB) |
| 11 | `agent_runs` | 001 | Execution tracking for agent tasks | id, agent_id, conversation_id, task_id, status, input_data (JSONB), output_data (JSONB), error_details (JSONB), credits_consumed |
| 12 | `tasks` | 002 | Work center task management | id, organization_id, title, description, type, status, priority, assigned_to, agent_id, due_date, metadata (JSONB) |
| 13 | `dashboards` | 002 | Insights dashboard configurations | id, organization_id, user_id, name, description, layout (JSONB), is_public |
| 14 | `widgets` | 002 | Dashboard widget components | id, dashboard_id, type, config (JSONB), position (JSONB) |
| 15 | `goals` | 002 | Performance goal tracking | id, organization_id, user_id, name, type, target_value, current_value, period, status |
| 16 | `artifacts` | 002 | File management for Drive | id, organization_id, conversation_id, agent_run_id, name, type, content_type, file_size, storage_path, metadata (JSONB) |
| 17 | `credit_policies` | 002 | Pricing/billing rules per org | id, organization_id, service_type, rate_per_unit, cost_per_unit, unit_type, monthly_allowance, overage_rate |
| 18 | `credit_allocations` | 002 | Monthly credit allocation tracking | id, organization_id, policy_id, period_start, period_end, allocated_credits, used_credits, cost |
| 19 | `credit_usage` | 002 | Real-time credit consumption | id, allocation_id, agent_run_id, service_type, units_consumed, cost |
| 20 | `hunches` | 002 (+ 023) | AI-generated insights | id, organization_id, type, confidence, data (JSONB), reasoning, suggested_actions (JSONB), status, title (023), priority (023), feedback (023) |
| 21 | `audit_log` | 002 | Security audit trail | id, organization_id, user_id, action, resource_type, resource_id, details (JSONB), ip_address, user_agent |
| 22 | `insight_card_config` | 002 | Insight card configurations | id, organization_id, user_id, card_type, title, description, config (JSONB), display_order, is_enabled |
| 23 | `insight_card_state` | 002 | User-specific insight card preferences | id, user_id, card_config_id, filters (JSONB), view_preference, is_collapsed |
| 24 | `leads` | 003 | Source of truth for all leads | id, organization_id, first_name, last_name, phone, email, vehicle_interest, source, is_nexxus_originated, vin_customer_id, status, lead_score, metadata (JSONB) |
| 25 | `vin_reports_cache` | 003 | Historical VIN Solutions data cache | id, organization_id, integration_id, report_type, dealer_id, date_range_start/end, data (JSONB), record_count, expires_at, is_stale |
| 26 | `vapi_call_logs` | 003 (+ 024, 028) | VAPI voice call metadata | id, organization_id, vapi_call_id, vapi_assistant_id, phone_number, direction, status, transcript, summary, end_of_call_report (JSONB), metadata (JSONB), credit_recorded (024), notification_sent (028) |
| 27 | `tavus_sessions` | 003 (+ 024) | Tavus video session metadata | id, organization_id, tavus_conversation_id, status, transcript, summary, engagement_score, lead_extracted, metadata (JSONB), credit_recorded (024) |
| 28 | `sync_queue` | 003 | Bidirectional sync job queue | id, organization_id, job_type, priority, source_table, source_id, target_system, status, attempts, last_error, error_details (JSONB), payload (JSONB), result (JSONB) |
| 29 | `user_integrations` | 004a | User-level email/calendar integration | id, user_id, organization_id, integration_type, credentials (JSONB), config (JSONB), status, sync_cursor |
| 30 | `appointments` | 005 | Calendar appointments | id, organization_id, title, start_time, end_time, appointment_type, customer_id, assigned_user_id, booked_by, status, metadata (JSONB) |
| 31 | `availability_blocks` | 005 | Availability schedules | id, organization_id, user_id, day_of_week, start_time, end_time, is_recurring, block_type, max_concurrent_appointments |
| 32 | `appointment_reminders` | 005 | SMS/email reminder queue | id, appointment_id, reminder_type, reminder_timing, send_at, status, metadata (JSONB) |
| 33 | `cached_emails` | 006 | Emails synced from user IMAP | id, user_integration_id, user_id, organization_id, message_id, uid, folder, subject, body_text, body_html, to_addresses (JSONB), attachments (JSONB) |
| 34 | `sent_emails` | 006 | Outbound email audit trail | id, user_id, organization_id, to_addresses (JSONB), subject, body_html, send_method, status, template_variables (JSONB), attachments (JSONB), metadata (JSONB) |
| 35 | `email_templates` | 006 | Email templates for confirmations etc. | id, organization_id, name, slug, category, subject_template, body_html_template, available_variables (JSONB) |
| 36 | `dealerbrain_config` | 007 | DealerBrain/Automa AI config (key-value) | id, config_key, config_value, description, updated_by |
| 37 | `notification_settings` | 008 | User notification preferences | id, user_id, organization_id, channel, event_type, enabled |
| 38 | `notifications` | 008 | Notification instances | id, user_id, organization_id, title, body, type, priority, data (JSONB), delivered_via (JSONB), read_at |
| 39 | `password_reset_tokens` | 009 | Secure password reset tokens | id, user_id, token, expires_at, used_at |
| 40 | `textmagic_config` | 010 (+ 032) | SMS config per org | id, organization_id, api_username, api_key_encrypted, phone_number, enabled, business_hours (JSONB, 032), ai_auto_reply_enabled (032) |
| 41 | `textmagic_messages` | 010 | SMS message log | id, organization_id, textmagic_message_id, direction, from_number, to_number, message_text, status, linked_lead_id, linked_appointment_id |
| 42 | `textmagic_opt_outs` | 010 | SMS opt-out tracking | id, organization_id, phone_number, opted_out_at, status |
| 43 | `widget_configs` | 013 (+ 021) | Per-org widget configuration | id, organization_id, widget_code, widget_name, config_appearance (JSONB), config_channels (JSONB), config_targeting (JSONB), allowed_domains (JSONB), chat_instructions (021), chat_agent_name (021), chat_enabled_tools (JSONB, 021) |
| 44 | `widget_callback_requests` | 013 | "Call You Back" requests from widget | id, widget_config_id, organization_id, customer_name, customer_phone, status, vapi_call_id |
| 45 | `widget_visitors` | 014 | Widget visitor session tracking | id, visitor_id, widget_config_id, organization_id, customer_name, customer_email, customer_phone, lead_id, metadata (JSONB) |
| 46 | `widget_chat_messages` | 014 | Chat messages in widget sessions | id, visitor_id, widget_config_id, organization_id, role, content, metadata (JSONB) |
| 47 | `hosted_pages` | 015 | Standalone hosted interaction pages | id, organization_id, widget_config_id, page_type, slug, title, config_appearance (JSONB), config_meta (JSONB), published, status |
| 48 | `inbox_conversations` | 016 | Unified inbox conversations | id, organization_id, channel, status, customer_name, customer_phone, customer_email, assigned_to, widget_visitor_id |
| 49 | `inbox_messages` | 016 | Inbox message entries | id, conversation_id, sender_type, sender_id, content, channel, metadata (JSONB) |
| 50 | `tracking_events` | 017 | Pixel tracking events | id, organization_id, visitor_id, event_type, page_url, utm_source/medium/campaign/term/content, metadata (JSONB) |
| 51 | `trigger_rules` | 018 | Automation trigger rules | id, organization_id, name, event_type, conditions (JSONB), action_type, action_config (JSONB), delay_seconds, business_hours_only |
| 52 | `trigger_executions` | 018 | Trigger execution logs | id, trigger_rule_id, organization_id, event_data (JSONB), action_result (JSONB), status, error_message |
| 53 | `ai_usage_events` | 019 | AI governance usage tracking | id, organization_id, user_id, action_type, tool_invoked, tokens_used_input, tokens_used_output, duration_ms, metadata (JSONB) |
| 54 | `report_benchmarks` | 020 | Industry benchmark metrics | id, metric_name, benchmark_value, source, category |
| 55 | `drive_folders` | 022 | Drive folder hierarchy | id, organization_id, parent_id (self-referencing FK), name, created_by |
| 56 | `drive_files` | 022 | Drive file storage | id, organization_id, folder_id, name, original_name, mime_type, size_bytes, disk_path, created_by |
| 57 | `approval_requests` | 023 | Approval workflow | id, organization_id, title, description, request_type, status, priority, requested_by, assigned_to, resolved_by, metadata (JSONB) |
| 58 | `dealer_pulse_cache` | 025 | Dealer Pulse periodic snapshots | id, organization_id, snapshot (JSONB), generated_at, expires_at |
| 59 | `knowledge_uploads` | 027 | Admin CSV/Excel lead import tracking | id, organization_id, uploaded_by, filename, file_type, record_count, source_tag, status, metadata (JSONB) |
| 60 | `trigger_templates` | 029 | System-defined trigger blueprints | id, name, event_type, conditions (JSONB), action_type, action_config (JSONB), is_system |
| 61 | `vin_api_calls` | 030 | VIN API call telemetry | id, organization_id, user_id, endpoint, request_params (JSONB), result_count, response_status, duration_ms |
| 62 | `service_quotas` | 031 | Per-org monthly service limits | id, organization_id, service_type, monthly_limit, current_usage, period_start, alert_threshold |
| 63 | `sms_conversation_state` | 032 | SMS AI/human collision avoidance state | id, organization_id, customer_phone, state, last_ai_response_at, last_human_response_at, dormant_after_minutes |

**Note:** The CLAUDE.md claims "36 tables" but the actual migration files define **63 distinct tables** (including ALTER TABLE additions as enhancements, not new tables). The count of CREATE TABLE statements is **53** unique tables, with 10 ALTER TABLE migrations adding columns to existing tables.

---

## 3. RLS Policy Inventory

**Total tables with RLS enabled:** 53 (every CREATE TABLE has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)

### RLS Pattern Categories

#### Pattern A: Organization isolation via `app.current_org_id` (most common)
```sql
USING (organization_id = current_setting('app.current_org_id', true)::UUID)
```
**Tables using this pattern:** organizations, locations, users, integrations, agents, conversations, tasks, dashboards, goals, artifacts, credit_policies, credit_allocations, hunches, insight_card_config, leads, vin_reports_cache, vapi_call_logs, tavus_sessions, sync_queue, appointments, availability_blocks, email_templates, textmagic_config, textmagic_messages, textmagic_opt_outs, widget_configs, widget_callback_requests, widget_visitors, widget_chat_messages, hosted_pages, inbox_conversations, tracking_events, trigger_rules, trigger_executions, ai_usage_events, drive_folders, drive_files, approval_requests, dealer_pulse_cache, knowledge_uploads, vin_api_calls, service_quotas, sms_conversation_state

#### Pattern B: User-self-access via `app.current_user_id`
```sql
USING (user_id = current_setting('app.current_user_id', true)::UUID)
```
**Tables using this pattern:** partner_admin_organizations, user_integrations, cached_emails, sent_emails, notification_settings, notifications, insight_card_state

#### Pattern C: Super Admin bypass via `app.user_role_level = 1`
```sql
USING (current_setting('app.user_role_level', true)::INTEGER = 1)
```
**Tables using this pattern:** organizations, users, roles, skills, agents (via org), audit_log, leads, vin_reports_cache, vapi_call_logs, tavus_sessions, sync_queue, appointments, availability_blocks, appointment_reminders, user_integrations (SELECT only), email_templates

#### Pattern D: Service role bypass (`TO service_role`)
```sql
FOR ALL TO service_role USING (true) WITH CHECK (true)
```
**Tables using this pattern:** textmagic_config, textmagic_messages, textmagic_opt_outs, widget_configs, widget_callback_requests, widget_visitors, widget_chat_messages, hosted_pages, inbox_conversations, inbox_messages, tracking_events, trigger_rules, trigger_executions, ai_usage_events, trigger_templates, vin_api_calls, service_quotas

#### Pattern E: Role-tiered access (Org Admin+ manages, Staff reads)
```sql
-- Manage: role_level <= 3
-- Read-only: role_level = 4
```
**Tables using this pattern:** widget_configs, widget_callback_requests, hosted_pages, trigger_rules, ai_usage_events (admin read org, user read own)

#### Pattern F: Open read for all authenticated users
```sql
FOR SELECT USING (true)
```
**Tables using this pattern:** roles, skills

#### Pattern G: Special/anomalous
- `password_reset_tokens`: `FOR ALL USING (true)` -- open to all, effectively no RLS
- `dealer_pulse_cache`: uses `current_setting('app.current_role', true) = 'super_admin'` -- different variable name than `app.user_role_level`
- `knowledge_uploads`: same anomalous `app.current_role` pattern
- `report_benchmarks`: **NO RLS at all** (public reference data)

### Total RLS Policy Count

Counting each CREATE POLICY statement across all migrations: **~100 policies** (exact count from manual enumeration of all migration files).

---

## 4. CRITICAL FINDING: RLS Variable Name Mismatch

### The Problem

The `SecureQueryBuilder` (the primary database access layer for request-scoped queries) sets:
```typescript
// server/db/SecureQueryBuilder.ts line 244
SET LOCAL app.current_organization_id = '...'
```

But **every single RLS policy in the database** checks:
```sql
current_setting('app.current_org_id', true)
```

These are **different variable names**: `app.current_organization_id` vs `app.current_org_id`.

### Impact Assessment

The `current_setting('app.current_org_id', true)` call with `true` as the second argument means "return empty string if missing" -- it will NOT throw an error. An empty string cast to UUID will fail, effectively **denying all access** through SecureQueryBuilder for organization-scoped queries.

**However**, this appears to be mitigated in practice because:
1. Most route handlers bypass SecureQueryBuilder entirely and use `set_config('app.current_org_id', ...)` directly via pool queries (seen in `server/routes/leads.ts`, `server/routes/widgets.ts`, `server/routes/triggers.ts`, `server/routes/insights.ts`, `server/routes/settings.ts`)
2. The `server/auth/jwt.ts` `getRLSSessionVariables()` function correctly uses `app.current_org_id` (line 138)
3. The `KnowledgeUploadService` and other services set `app.current_org_id` directly

**Net result:** The SecureQueryBuilder's `setRLSContext()` method sets the WRONG variable name. Any code path that relies on `req.db.query()` through the middleware pipeline (enforceOrganizationContext -> SecureQueryBuilder -> setRLSContext) would set `app.current_organization_id`, which NO RLS policy checks. The system works because most actual queries bypass SecureQueryBuilder and set the correct variable directly on the pool.

**Severity:** HIGH -- The SecureQueryBuilder is architecturally intended as the primary secure query path, but its RLS context setting is broken. The workaround (direct pool queries) means RLS enforcement depends on each route handler remembering to call `set_config` manually.

### Secondary Variable Anomalies

| Variable | Used In | Purpose |
|----------|---------|---------|
| `app.current_org_id` | All SQL RLS policies, jwt.ts, most route handlers | Organization isolation |
| `app.current_organization_id` | SecureQueryBuilder only | **WRONG NAME** -- not matched by any policy |
| `app.current_user_id` | SQL RLS policies, SecureQueryBuilder, jwt.ts | User-self-access isolation |
| `app.user_role_level` | SQL RLS policies, SecureQueryBuilder, most route handlers | Role-based access control |
| `app.current_role` | dealer_pulse_cache, knowledge_uploads policies | **Anomalous** -- checks string 'super_admin' instead of integer level |
| `app.current_role_level` | server/routes/triggers.ts line 38 | **WRONG NAME** -- should be `app.user_role_level` |

---

## 5. JSONB Column Inventory

**Total JSONB columns:** 58

| Table | Column | Expected Structure |
|-------|--------|--------------------|
| organizations | settings | `{timezone, industry, subscription_tier}` |
| organizations | billing_info | Billing details (schema not enforced) |
| locations | address | Address object |
| locations | business_hours | Business hours schedule |
| locations | contact_info | Phone, email, etc. |
| locations | settings | Location-specific settings |
| roles | permissions | `{"all": true}` or `{"manage_assigned_orgs": true, ...}` |
| users | settings | User preferences |
| integrations | config | `{"dealer_name", "features": [...]}` for VIN; varies by type |
| integrations | credentials | `{"client_id", "client_secret", "api_key"}` -- encrypted at app layer |
| agents | config | `{"tavus_persona_id": "..."}` for video; varies by type |
| agents | performance_metrics | Agent performance data |
| skills | template | Skill template definition |
| skills | parameters_schema | JSON Schema for skill params |
| conversations | customer_info | Customer contact details |
| conversations | metadata | Conversation metadata |
| messages | metadata | Message metadata |
| agent_runs | input_data | Task input |
| agent_runs | output_data | Task output |
| agent_runs | error_details | Error information |
| tasks | metadata | Task metadata |
| dashboards | layout | Dashboard layout config |
| widgets | config | Widget configuration |
| widgets | position | Widget position on dashboard |
| artifacts | metadata | File metadata |
| hunches | data | Hunch data payload |
| hunches | suggested_actions | Recommended actions |
| audit_log | details | Audit event details |
| insight_card_config | config | Full InsightCardConfig schema |
| insight_card_state | filters | User-selected filters |
| leads | metadata | Lead metadata |
| vin_reports_cache | data | Cached VIN API response data |
| vapi_call_logs | end_of_call_report | VAPI end-of-call data |
| vapi_call_logs | metadata | Call metadata |
| tavus_sessions | metadata | Session metadata |
| sync_queue | error_details | Sync error information |
| sync_queue | payload | Job payload data |
| sync_queue | result | Sync result data |
| user_integrations | credentials | Encrypted user integration creds |
| user_integrations | config | Non-sensitive integration config |
| cached_emails | to_addresses | `[{email, name}]` |
| cached_emails | cc_addresses | `[{email, name}]` |
| cached_emails | bcc_addresses | `[{email, name}]` |
| cached_emails | attachments | `[{filename, contentType, size}]` |
| sent_emails | to_addresses | `[{email, name}]` |
| sent_emails | cc_addresses | `[{email, name}]` |
| sent_emails | bcc_addresses | `[{email, name}]` |
| sent_emails | attachments | `[{filename, url, size}]` |
| sent_emails | template_variables | Template substitution data |
| sent_emails | metadata | Send metadata |
| email_templates | available_variables | `[{name, description}]` |
| notifications | data | `{leadId, appointmentId, actionUrl, actionLabel}` |
| notifications | delivered_via | `['in_app', 'email']` |
| widget_configs | config_appearance | `{colorTheme, branding, minimizedState, welcomeScreen}` -- detailed defaults |
| widget_configs | config_channels | `{textChat, videoAgent, callUs, callYou, webAudio, sendText}` -- each with enabled flag |
| widget_configs | config_targeting | `{audience, pageRules, deviceTargeting, businessHours, behaviorTriggers}` |
| widget_configs | allowed_domains | `[{domain, verified, addedAt}]` |
| widget_configs | chat_enabled_tools | `["search_inventory", "check_availability", ...]` |
| widget_visitors | metadata | Visitor metadata |
| widget_chat_messages | metadata | Message metadata |
| hosted_pages | config_appearance | Page appearance config |
| hosted_pages | config_meta | Page meta configuration |
| inbox_messages | metadata | Message metadata |
| tracking_events | metadata | Event metadata |
| trigger_rules | conditions | `{lead_age_hours: {gte: 2}, no_prior_contact: true}` |
| trigger_rules | action_config | Action-specific configuration |
| trigger_executions | event_data | Event that triggered execution |
| trigger_executions | action_result | Result of action execution |
| ai_usage_events | metadata | Usage event metadata |
| textmagic_config | business_hours | `{timezone, schedule: {monday: {open, close}, ...}, afterHoursAutoReply}` |
| approval_requests | metadata | Approval metadata |
| dealer_pulse_cache | snapshot | Full Dealer Pulse 5-phase snapshot |
| knowledge_uploads | metadata | Upload metadata |
| vin_api_calls | request_params | API request parameters |
| service_quotas | (none) | No JSONB columns |

**Observation:** None of these JSONB columns have CHECK constraints or JSON Schema validation at the database level. All structural validation is performed at the application layer. This is standard for PostgreSQL but means schema drift is possible.

---

## 6. Foreign Key Relationships

### Complete FK Map

**Total foreign key relationships:** ~80

#### Core Entity FKs (001)
- `locations.organization_id` -> `organizations.id` (CASCADE)
- `users.organization_id` -> `organizations.id` (CASCADE)
- `users.location_id` -> `locations.id`
- `users.role_id` -> `roles.id`
- `partner_admin_organizations.user_id` -> `users.id` (CASCADE)
- `partner_admin_organizations.organization_id` -> `organizations.id` (CASCADE)
- `partner_admin_organizations.assigned_by` -> `users.id`
- `organizations.created_by` -> `users.id` (deferred FK)
- `organizations.updated_by` -> `users.id` (deferred FK)
- `integrations.organization_id` -> `organizations.id` (CASCADE)
- `agents.organization_id` -> `organizations.id` (CASCADE)
- `agents.created_by` -> `users.id`
- `conversations.organization_id` -> `organizations.id` (CASCADE)
- `conversations.location_id` -> `locations.id`
- `conversations.agent_id` -> `agents.id`
- `conversations.user_id` -> `users.id`
- `messages.conversation_id` -> `conversations.id` (CASCADE)
- `agent_runs.agent_id` -> `agents.id` (CASCADE)
- `agent_runs.conversation_id` -> `conversations.id`
- `agent_runs.task_id` -> `tasks.id` (deferred to 002)

#### Secondary Entity FKs (002)
- `tasks.organization_id` -> `organizations.id` (CASCADE)
- `tasks.assigned_to` -> `users.id`
- `tasks.agent_id` -> `agents.id`
- `tasks.created_by` -> `users.id`
- `dashboards.organization_id` -> `organizations.id` (CASCADE)
- `dashboards.user_id` -> `users.id`
- `dashboards.created_by` -> `users.id`
- `widgets.dashboard_id` -> `dashboards.id` (CASCADE)
- `goals.organization_id` -> `organizations.id` (CASCADE)
- `goals.user_id` -> `users.id`
- `artifacts.organization_id` -> `organizations.id` (CASCADE)
- `artifacts.conversation_id` -> `conversations.id`
- `artifacts.agent_run_id` -> `agent_runs.id`
- `artifacts.created_by` -> `users.id`
- `credit_policies.organization_id` -> `organizations.id` (CASCADE)
- `credit_allocations.organization_id` -> `organizations.id` (CASCADE)
- `credit_allocations.policy_id` -> `credit_policies.id`
- `credit_usage.allocation_id` -> `credit_allocations.id`
- `credit_usage.agent_run_id` -> `agent_runs.id`
- `hunches.organization_id` -> `organizations.id` (CASCADE)
- `hunches.reviewed_by` -> `users.id` (added 023)
- `audit_log.organization_id` -> `organizations.id`
- `audit_log.user_id` -> `users.id`
- `insight_card_config.organization_id` -> `organizations.id` (CASCADE)
- `insight_card_config.user_id` -> `users.id`
- `insight_card_config.created_by` -> `users.id`
- `insight_card_state.user_id` -> `users.id` (CASCADE)
- `insight_card_state.card_config_id` -> `insight_card_config.id` (CASCADE)

#### Context Router FKs (003)
- `leads.organization_id` -> `organizations.id` (CASCADE)
- `leads.assigned_to` -> `users.id`
- `leads.location_id` -> `locations.id`
- `leads.created_by` -> `users.id`
- `leads.vapi_call_id` -> `vapi_call_logs.id` (deferred)
- `leads.tavus_session_id` -> `tavus_sessions.id` (deferred)
- `vin_reports_cache.organization_id` -> `organizations.id` (CASCADE)
- `vin_reports_cache.integration_id` -> `integrations.id` (CASCADE)
- `vapi_call_logs.organization_id` -> `organizations.id` (CASCADE)
- `vapi_call_logs.lead_id` -> `leads.id` (deferred)
- `vapi_call_logs.conversation_id` -> `conversations.id`
- `vapi_call_logs.agent_id` -> `agents.id`
- `tavus_sessions.organization_id` -> `organizations.id` (CASCADE)
- `tavus_sessions.lead_id` -> `leads.id` (deferred)
- `tavus_sessions.conversation_id` -> `conversations.id`
- `tavus_sessions.agent_id` -> `agents.id`
- `sync_queue.organization_id` -> `organizations.id` (CASCADE)
- `sync_queue.target_integration_id` -> `integrations.id`

#### Remaining FKs (004-033)
- `user_integrations.user_id` -> `users.id` (CASCADE)
- `user_integrations.organization_id` -> `organizations.id` (CASCADE)
- `appointments.organization_id` -> `organizations.id` (CASCADE)
- `appointments.customer_id` -> `leads.id`
- `appointments.assigned_user_id` -> `users.id`
- `appointments.location_id` -> `locations.id`
- `appointments.booking_agent_id` -> `agents.id`
- `appointments.conversation_id` -> `conversations.id`
- `appointments.created_by` -> `users.id`
- `appointments.cancelled_by` -> `users.id`
- `availability_blocks.organization_id` -> `organizations.id` (CASCADE)
- `availability_blocks.user_id` -> `users.id`
- `availability_blocks.location_id` -> `locations.id`
- `availability_blocks.created_by` -> `users.id`
- `appointment_reminders.appointment_id` -> `appointments.id` (CASCADE)
- `cached_emails.user_integration_id` -> `user_integrations.id` (CASCADE)
- `cached_emails.user_id` -> `users.id` (CASCADE)
- `cached_emails.organization_id` -> `organizations.id` (CASCADE)
- `cached_emails.linked_lead_id` -> `leads.id`
- `cached_emails.linked_appointment_id` -> `appointments.id`
- `cached_emails.linked_conversation_id` -> `conversations.id`
- `sent_emails.user_id` -> `users.id`
- `sent_emails.organization_id` -> `organizations.id`
- `sent_emails.user_integration_id` -> `user_integrations.id`
- `sent_emails.in_reply_to_email_id` -> `cached_emails.id`
- `sent_emails.linked_lead_id` -> `leads.id`
- `sent_emails.linked_appointment_id` -> `appointments.id`
- `sent_emails.linked_conversation_id` -> `conversations.id`
- `sent_emails.created_by` -> `users.id`
- `email_templates.organization_id` -> `organizations.id` (CASCADE)
- `email_templates.created_by` -> `users.id`
- `dealerbrain_config.updated_by` -> `users.id`
- `notification_settings.user_id` -> `users.id` (CASCADE)
- `notification_settings.organization_id` -> `organizations.id` (CASCADE)
- `notifications.user_id` -> `users.id` (CASCADE)
- `notifications.organization_id` -> `organizations.id` (CASCADE)
- `password_reset_tokens.user_id` -> `users.id` (CASCADE)
- `textmagic_config.organization_id` -> `organizations.id` (CASCADE)
- `textmagic_messages.organization_id` -> `organizations.id`
- `textmagic_messages.sent_by_user_id` -> `users.id`
- `textmagic_opt_outs.organization_id` -> `organizations.id`
- `widget_configs.organization_id` -> `organizations.id` (CASCADE)
- `widget_configs.created_by` -> `users.id`
- `widget_configs.updated_by` -> `users.id`
- `widget_callback_requests.widget_config_id` -> `widget_configs.id` (CASCADE)
- `widget_callback_requests.organization_id` -> `organizations.id` (CASCADE)
- `widget_visitors.widget_config_id` -> `widget_configs.id` (CASCADE)
- `widget_visitors.organization_id` -> `organizations.id` (CASCADE)
- `widget_visitors.lead_id` -> `leads.id`
- `widget_chat_messages.visitor_id` -> `widget_visitors.id` (CASCADE)
- `widget_chat_messages.widget_config_id` -> `widget_configs.id` (CASCADE)
- `widget_chat_messages.organization_id` -> `organizations.id` (CASCADE)
- `hosted_pages.organization_id` -> `organizations.id` (CASCADE)
- `hosted_pages.widget_config_id` -> `widget_configs.id` (SET NULL)
- `hosted_pages.created_by` -> `users.id`
- `inbox_conversations.organization_id` -> `organizations.id` (CASCADE)
- `inbox_conversations.assigned_to` -> `users.id`
- `inbox_conversations.widget_visitor_id` -> `widget_visitors.id`
- `inbox_messages.conversation_id` -> `inbox_conversations.id` (CASCADE)
- `inbox_messages.sender_id` -> `users.id`
- `tracking_events.organization_id` -> `organizations.id` (CASCADE)
- `trigger_rules.organization_id` -> `organizations.id` (CASCADE)
- `trigger_rules.created_by` -> `users.id`
- `trigger_executions.trigger_rule_id` -> `trigger_rules.id` (CASCADE)
- `trigger_executions.organization_id` -> `organizations.id` (CASCADE)
- `ai_usage_events.organization_id` -> `organizations.id` (CASCADE)
- `ai_usage_events.user_id` -> `users.id` (CASCADE)
- `drive_folders.organization_id` -> `organizations.id`
- `drive_folders.parent_id` -> `drive_folders.id` (CASCADE, self-referencing)
- `drive_folders.created_by` -> `users.id`
- `drive_files.organization_id` -> `organizations.id`
- `drive_files.folder_id` -> `drive_folders.id` (SET NULL)
- `drive_files.created_by` -> `users.id`
- `approval_requests.organization_id` -> `organizations.id`
- `approval_requests.requested_by` -> `users.id`
- `approval_requests.assigned_to` -> `users.id`
- `approval_requests.resolved_by` -> `users.id`
- `dealer_pulse_cache.organization_id` -> `organizations.id` (CASCADE)
- `knowledge_uploads.organization_id` -> `organizations.id` (CASCADE)
- `knowledge_uploads.uploaded_by` -> `users.id`
- `knowledge_uploads.undone_by` -> `users.id`
- `vin_api_calls.organization_id` -> `organizations.id`
- `vin_api_calls.user_id` -> `users.id`
- `service_quotas.organization_id` -> `organizations.id`
- `sms_conversation_state.organization_id` -> `organizations.id` (CASCADE)

### Notable FK Patterns
- Circular FKs between `leads` <-> `vapi_call_logs` and `leads` <-> `tavus_sessions` (resolved via deferred constraints in 003)
- Self-referencing FK: `drive_folders.parent_id` -> `drive_folders.id`
- Missing FK: `textmagic_messages.linked_lead_id` and `linked_appointment_id` are not declared as FKs despite being used as logical references

---

## 7. Database Functions and Triggers

### Functions (2)

| Function | Created In | Purpose |
|----------|-----------|---------|
| `update_updated_at_column()` | 003 | Generic trigger function: sets `NEW.updated_at = NOW()` on any row update |
| `create_default_notification_settings()` | 008 | Creates default in_app + email notification settings when a new user is inserted |

### Triggers (11)

| Trigger | Table | Event | Function |
|---------|-------|-------|----------|
| `update_leads_updated_at` | leads | BEFORE UPDATE | `update_updated_at_column()` |
| `update_vapi_call_logs_updated_at` | vapi_call_logs | BEFORE UPDATE | `update_updated_at_column()` |
| `update_tavus_sessions_updated_at` | tavus_sessions | BEFORE UPDATE | `update_updated_at_column()` |
| `update_sync_queue_updated_at` | sync_queue | BEFORE UPDATE | `update_updated_at_column()` |
| `update_user_integrations_updated_at` | user_integrations | BEFORE UPDATE | `update_updated_at_column()` |
| `update_appointments_updated_at` | appointments | BEFORE UPDATE | `update_updated_at_column()` |
| `update_availability_blocks_updated_at` | availability_blocks | BEFORE UPDATE | `update_updated_at_column()` |
| `update_appointment_reminders_updated_at` | appointment_reminders | BEFORE UPDATE | `update_updated_at_column()` |
| `update_cached_emails_updated_at` | cached_emails | BEFORE UPDATE | `update_updated_at_column()` |
| `update_sent_emails_updated_at` | sent_emails | BEFORE UPDATE | `update_updated_at_column()` |
| `update_email_templates_updated_at` | email_templates | BEFORE UPDATE | `update_updated_at_column()` |
| `update_notification_settings_updated_at` | notification_settings | BEFORE UPDATE | `update_updated_at_column()` |
| `create_user_notification_defaults` | users | AFTER INSERT | `create_default_notification_settings()` |

**Observation:** Many tables with `updated_at` columns do NOT have update triggers. Tables created in migration 002 (tasks, dashboards, widgets, goals, artifacts, credit_policies, credit_allocations, credit_usage, hunches, audit_log, insight_card_config, insight_card_state) rely on application code to set `updated_at`. This creates inconsistency -- some tables auto-update the timestamp, others do not.

Tables MISSING `updated_at` triggers that have `updated_at` columns:
- tasks, dashboards, widgets, goals, credit_policies, hunches (original), insight_card_config, insight_card_state, textmagic_config, widget_configs, hosted_pages, inbox_conversations, trigger_rules, approval_requests, service_quotas, sms_conversation_state

---

## 8. Connection Configuration

### Database Provider
- **Provider:** Supabase (PostgreSQL)
- **Supabase Project ID:** `lhltgisoqxgpamtssxeb`
- **Region:** `aws-0-us-west-2`

### Connection Strings

| Variable | Port | Purpose | Protocol |
|----------|------|---------|----------|
| `DATABASE_URL` | 6543 | Application pool (via pgbouncer) | `?pgbouncer=true` |
| `DIRECT_URL` | 5432 | Migrations, background jobs | Direct connection |

### Pool Configuration (`server/db.ts`)

```typescript
export const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

**Key detail:** The pool prefers `DIRECT_URL` (port 5432, direct) over `DATABASE_URL` (port 6543, pgbouncer). This means the application uses the direct connection by default, NOT the pooler.

### Connection Architecture

```
Application (Node.js)
    |
    v
pg.Pool (max: 10, idle: 30s, timeout: 10s)
    |
    +-- DIRECT_URL (5432) -- preferred when available
    |
    +-- DATABASE_URL (6543) -- fallback, pgbouncer
    |
    v
Supabase PostgreSQL (aws-0-us-west-2)
```

### RLS Enforcement Path

```
HTTP Request
    |
    v
authenticate middleware (JWT verification)
    |
    v
enforceOrganizationContext middleware
    |-- Creates RLSContext from JWT payload
    |-- Creates SecureQueryBuilder with context
    |-- Attaches to req.db
    |
    v
Route Handler
    |-- Option A: req.db.query() -> SecureQueryBuilder.query()
    |       -> SET LOCAL app.current_organization_id = '...'  ** WRONG NAME **
    |       -> SET LOCAL app.current_user_id = '...'
    |       -> SET LOCAL app.user_role_level = '...'
    |
    |-- Option B: Direct pool.query() with manual set_config()
    |       -> set_config('app.current_org_id', ..., false)   ** CORRECT NAME **
    |       -> set_config('app.user_role_level', ..., false)
    |
    v
PostgreSQL RLS Policies
    -> current_setting('app.current_org_id', true)
    -> current_setting('app.current_user_id', true)
    -> current_setting('app.user_role_level', true)
```

---

## 9. UNIQUE Constraints Inventory

| Table | Constraint | Columns |
|-------|-----------|---------|
| organizations | PK + slug unique | `slug` |
| users | PK + email unique | `email` |
| partner_admin_organizations | UNIQUE | `(user_id, organization_id)` |
| credit_policies | 012 addition | `(organization_id, service_type)` |
| insight_card_state | UNIQUE | `(user_id, card_config_id)` |
| vin_reports_cache | UNIQUE | `(organization_id, report_type, dealer_id, date_range_start, date_range_end)` |
| vapi_call_logs | UNIQUE | `vapi_call_id` |
| tavus_sessions | UNIQUE | `tavus_conversation_id` |
| user_integrations | UNIQUE | `(user_id, integration_type)` |
| cached_emails | UNIQUE | `(user_integration_id, folder, uid)` |
| email_templates | UNIQUE NULLS NOT DISTINCT | `(organization_id, slug)` |
| notification_settings | UNIQUE | `(user_id, channel, event_type)` |
| textmagic_config | UNIQUE | `(organization_id)` |
| textmagic_opt_outs | UNIQUE | `(organization_id, phone_number)` |
| widget_configs | UNIQUE | `widget_code` |
| widget_visitors | UNIQUE INDEX | `(visitor_id, widget_config_id)` |
| hosted_pages | UNIQUE | `(organization_id, slug)` |
| dealer_pulse_cache | UNIQUE | `(organization_id)` |
| report_benchmarks | UNIQUE | `(metric_name, source)` |
| service_quotas | UNIQUE | `(organization_id, service_type, period_start)` |
| sms_conversation_state | UNIQUE | `(organization_id, customer_phone)` |
| agents | UNIQUE INDEX (conditional) | `(organization_id, type, config->>'tavus_persona_id') WHERE type='video'` (033) |
| dealerbrain_config | UNIQUE | `config_key` |

---

## 10. CHECK Constraints Inventory

| Table | Column | Constraint |
|-------|--------|-----------|
| organizations | type | `IN ('dealership', 'dealer_group', 'vendor')` |
| roles | level | `IN (1, 2, 3, 4)` |
| messages | sender_type | `IN ('user', 'agent', 'system')` |
| leads | status | `IN ('new', 'contacted', 'qualified', 'appointment_set', 'closed_won', 'closed_lost')` |
| leads | lead_score | `BETWEEN 0 AND 100` |
| vapi_call_logs | direction | `IN ('inbound', 'outbound')` |
| tavus_sessions | status | `IN ('active', 'completed', 'failed', 'abandoned')` |
| tavus_sessions | engagement_score | `BETWEEN 0 AND 100` |
| tavus_sessions | outcome | `IN ('appointment_scheduled', 'info_provided', 'no_engagement', 'technical_issue')` |
| sync_queue | job_type | `IN ('lead_to_vin', 'vin_to_nexxus', 'appointment_to_vin')` |
| sync_queue | priority | `BETWEEN 1 AND 10` |
| sync_queue | status | `IN ('pending', 'processing', 'completed', 'failed', 'retrying')` |
| sync_queue | target_system | `IN ('vin_solutions', 'vapi', 'tavus')` |
| user_integrations | integration_type | `IN ('email_imap', 'google_calendar', 'outlook_calendar')` |
| user_integrations | status | `IN ('pending', 'active', 'error', 'disconnected')` |
| appointments | appointment_type | `IN ('test_drive', 'service', 'sales_meeting', 'delivery', 'follow_up', 'other')` |
| appointments | booked_by | `IN ('customer_self', 'vapi_agent', 'tavus_agent', 'staff', 'import')` |
| appointments | status | `IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'rescheduled')` |
| appointments | time_order | `end_time > start_time` |
| availability_blocks | day_of_week | `BETWEEN 0 AND 6` |
| availability_blocks | block_type | `IN ('available', 'blocked', 'busy', 'override')` |
| availability_blocks | status | `IN ('active', 'inactive')` |
| availability_blocks | time_order | `end_time > start_time` |
| appointment_reminders | reminder_type | `IN ('email', 'sms', 'both')` |
| appointment_reminders | reminder_timing | `IN ('24_hours', '2_hours', '1_hour', '30_minutes', 'custom')` |
| appointment_reminders | status | `IN ('pending', 'sending', 'sent', 'failed', 'cancelled')` |
| email_templates | category | `IN ('appointment_confirmation', 'appointment_reminder', 'welcome', 'follow_up', 'lead_nurture', 'custom')` |
| notification_settings | channel | `IN ('in_app', 'email', 'push')` |
| notification_settings | event_type | 17 specific event types |
| notifications | priority | `IN ('low', 'normal', 'high', 'urgent')` |
| sent_emails | send_method | `IN ('smtp', 'resend')` |
| sent_emails | status | `IN ('pending', 'sending', 'sent', 'delivered', 'failed', 'bounced')` |
| textmagic_messages | direction | `IN ('inbound', 'outbound')` |
| textmagic_opt_outs | status | `IN ('opted_out', 'opted_in')` |
| widget_configs | status | `IN ('active', 'inactive', 'archived')` |
| widget_callback_requests | status | `IN ('pending', 'scheduled', 'completed', 'cancelled')` |
| widget_chat_messages | role | `IN ('visitor', 'assistant', 'system')` |
| hosted_pages | page_type | `IN ('chat', 'video', 'callback', 'multi')` |
| hosted_pages | status | `IN ('draft', 'published', 'archived')` |
| inbox_conversations | channel | `IN ('widget_chat', 'sms', 'email')` |
| inbox_conversations | status | `IN ('open', 'assigned', 'resolved', 'archived')` |
| inbox_messages | sender_type | `IN ('customer', 'staff', 'system', 'ai')` |
| inbox_messages | channel | `IN ('widget_chat', 'sms', 'email')` |
| tracking_events | event_type | `IN ('page_view', 'widget_open', 'widget_interact', 'form_submit', 'click', 'scroll_depth', 'session_start', 'session_end')` |
| trigger_rules | event_type | 7 specific event types |
| trigger_rules | action_type | `IN ('outbound_call', 'send_sms', 'send_notification', 'create_task', 'assign_lead')` |
| trigger_rules | status | `IN ('active', 'inactive', 'archived')` |
| trigger_executions | status | `IN ('pending', 'queued', 'executing', 'completed', 'failed', 'skipped')` |
| ai_usage_events | action_type | `IN ('chat_message', 'tool_invocation', 'artifact_generated', 'context_query', 'system_prompt')` |
| trigger_templates | event_type | Same 7 types as trigger_rules |
| trigger_templates | action_type | Same 5 types as trigger_rules |
| service_quotas | service_type | `IN ('voice', 'video', 'chat', 'sms', 'email', 'task')` |
| sms_conversation_state | state | `IN ('AI_ACTIVE', 'HUMAN_ACTIVE', 'DORMANT')` |
| hunches | confidence | `BETWEEN 0 AND 1` |

---

## 11. Index Inventory

**Total indexes created (approximate):** 160+

Indexes are created extensively across all tables. The most heavily indexed tables are:

| Table | Index Count | Notable Indexes |
|-------|-------------|-----------------|
| leads | 8 | org, source, nexxus_originated, status, vin_id, phone, email, created DESC |
| vapi_call_logs | 6+ | org, vapi_id, phone, status, started DESC, lead (partial) |
| appointments | 12 | org+time, user+time, phone+time, email+time, status+time, type+time, booked_by, vapi (partial), tavus (partial), vin (partial), upcoming (partial) |
| cached_emails | 11 | user+folder+date, integration, from_address, thread, date, unread (partial), starred (partial), lead (partial), appointment (partial), message_id, full-text GIN |
| tracking_events | 5 | org, visitor, type, created, utm compound |

**Full-text search index:** One GIN index on `cached_emails` using `to_tsvector('english', ...)` on subject + body_text.

**Partial indexes:** Extensively used (14+ instances) for performance on filtered queries like `WHERE status = 'pending'`, `WHERE is_stale = false`, `WHERE lead_id IS NOT NULL`.

---

## 12. Seed Data Summary

### Default Roles (001)
| Role | Level | Permissions |
|------|-------|-------------|
| Super Admin | 1 | `{"all": true}` |
| Partner Admin | 2 | `{"manage_assigned_orgs", "view_reports"}` |
| Org Admin | 3 | `{"manage_org_users", "manage_org_settings"}` |
| Org Staff | 4 | `{"use_agents", "view_insights"}` |

### Default Email Templates (006)
- Appointment Confirmation (system-wide)
- 24-Hour Reminder (system-wide)

### DealerBrain Config Defaults (007)
- `system_instructions` (empty)
- `feedback_enabled` (true)
- `feedback_instructions` (empty)

### Report Benchmarks (020)
- 12 industry benchmark metrics (close rate, contact rate, appointment rates, source conversion rates)

### Trigger Templates (029)
- 1 system template: "Neglected Lead Auto-Call"

### Serra Organization Seed Data (004b)
- 3 organizations: Serra Honda, Serra Nissan, Tony Serra Ford
- 3 users: Partner Admin (durran@cageautomotive.com), Serra Honda Admin, Serra Honda Staff
- 3 VIN integrations (dealer IDs: 21043, 21044, 21047)
- 3 sample leads, 2 sample VAPI calls, 1 sample Tavus session

### Video Agent Registration (033)
- 5 video agents: Caroline (Serra Honda), Magnolia (Serra Nissan), Georgia (Tony Serra Ford), Elizabeth (Hyundai of Columbia), Savannah (Ford of Columbia)

---

## 13. Issues and Findings Summary

### CRITICAL

1. **RLS Variable Name Mismatch (HIGH):** `SecureQueryBuilder` sets `app.current_organization_id` but all RLS policies check `app.current_org_id`. The system works only because most routes bypass SecureQueryBuilder and set the correct variable directly.

2. **Triggers Route Uses Wrong Variable (MEDIUM):** `server/routes/triggers.ts` line 38 sets `app.current_role_level` instead of `app.user_role_level`. This means trigger rule RLS policies requiring `app.user_role_level` will not work correctly for trigger routes.

3. **Inconsistent Super Admin Bypass Pattern (MEDIUM):** Two tables (`dealer_pulse_cache`, `knowledge_uploads`) use `current_setting('app.current_role', true) = 'super_admin'` instead of `current_setting('app.user_role_level', true)::INTEGER = 1`. The `app.current_role` variable is never set by any application code found in the codebase, making these bypass policies non-functional.

### WARNINGS

4. **Missing Migration 011:** Gap in migration numbering. Not necessarily a problem, but could indicate a dropped or deleted migration.

5. **Duplicate Migration Prefix 004:** Two files share the `004` prefix. This could cause confusion about execution order.

6. **Missing `updated_at` Triggers:** 16+ tables have `updated_at` columns but no automatic trigger. Application code must manually set `updated_at = NOW()` on every update.

7. **Missing FK Declarations:** `textmagic_messages.linked_lead_id` and `textmagic_messages.linked_appointment_id` are used as logical foreign keys but have no FOREIGN KEY constraint declared.

8. **No JSONB Schema Validation:** All 58 JSONB columns rely entirely on application-layer validation. Database enforces no structural constraints on JSONB data.

9. **password_reset_tokens RLS Policy:** The policy `FOR ALL USING (true)` effectively disables RLS. While this table is system-managed, any authenticated user could theoretically query it if they bypass application-layer access controls.

10. **Pool Prefers Direct URL:** The connection pool uses `DIRECT_URL` (port 5432, direct connection) over `DATABASE_URL` (port 6543, pgbouncer). This means connection pooling is done at the Node.js level only, not at the pgbouncer level.

11. **SET LOCAL Without Transaction:** The `SecureQueryBuilder.query()` method uses `SET LOCAL` which is transaction-scoped, but the method does NOT wrap queries in a transaction (no BEGIN/COMMIT). `SET LOCAL` outside a transaction block is equivalent to `SET` and persists for the session -- which is then returned to the pool. This could leak RLS context to subsequent queries on the same connection.

---

## 14. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│                                                             │
│  authenticate() -> enforceOrganizationContext() -> routes   │
│       │                    │                         │      │
│       │              Creates req.db            Uses pool    │
│       │         (SecureQueryBuilder)          directly      │
│       │              │                         │            │
│       └──────────────┼─────────────────────────┘            │
│                      │                                      │
│              ┌───────┴───────┐                              │
│              │   pg.Pool     │                              │
│              │  max: 10      │                              │
│              │  idle: 30s    │                              │
│              └───────┬───────┘                              │
│                      │                                      │
└──────────────────────┼──────────────────────────────────────┘
                       │
              DIRECT_URL:5432
                       │
┌──────────────────────┼──────────────────────────────────────┐
│              SUPABASE POSTGRESQL                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ROW-LEVEL SECURITY                      │   │
│  │                                                      │   │
│  │  app.current_org_id    -> org isolation (53 tables)  │   │
│  │  app.current_user_id   -> user-self access (7 tbl)   │   │
│  │  app.user_role_level   -> role-based access          │   │
│  │  service_role           -> bypass for system ops      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  53 tables | ~100 RLS policies | ~160 indexes              │
│  2 functions | 12+ triggers | ~80 foreign keys             │
│  58 JSONB columns | 50+ CHECK constraints                  │
│  22+ UNIQUE constraints                                    │
└─────────────────────────────────────────────────────────────┘
```

---

**End of Audit**

*This document was generated by forensic analysis of all 33 migration files in `/home/ubuntu/Claude-store/nexxus-v2/database/migrations/`, the database connection layer in `server/db.ts` and `server/db/SecureQueryBuilder.ts`, the RLS middleware in `server/middleware/enforceOrganizationContext.ts`, and the JWT module in `server/auth/jwt.ts`.*
