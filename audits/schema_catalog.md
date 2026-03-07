# Schema & Persistence Audit — Nexxus Connect v2.2

**Audit Date:** 2026-03-07
**Scope:** `shared/schema.ts`, `server/storage.ts`, `server/seed.ts`, `drizzle.config.ts`, `migrations/`, `PRD.md`, `SRS.md`
**Status:** READ-ONLY catalog — no modifications made

---

## 1. Complete Table Catalog

### 1.1 `roles`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| name | text | NO | — | UNIQUE | — |
| level | integer | NO | — | — | — |

### 1.2 `organizations`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| name | text | NO | — | — | — |
| slug | text | NO | — | UNIQUE | — |
| persona_name | text | NO | `'Serra'` | — | — |
| partner_id | uuid | YES | — | — | — |
| outbound_enabled | boolean | NO | `false` | — | — |
| sms_enabled | boolean | NO | `false` | — | — |
| phone_enabled | boolean | NO | `false` | — | — |
| email_enabled | boolean | NO | `false` | — | — |
| settings | jsonb | YES | `{}` | — | — |
| created_at | timestamp | NO | `now()` | — | — |
| updated_at | timestamp | NO | `now()` | — | — |

### 1.3 `users`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| email | text | NO | — | UNIQUE | — |
| password | text | NO | — | — | — |
| first_name | text | NO | — | — | — |
| last_name | text | NO | — | — | — |
| role_id | uuid | NO | — | — | `roles.id` |
| organization_id | uuid | NO | — | — | `organizations.id` |
| location_id | text | YES | — | — | — |
| profile_photo_url | text | YES | — | — | — |
| is_active | boolean | NO | `true` | — | — |
| created_at | timestamp | NO | `now()` | — | — |
| updated_at | timestamp | NO | `now()` | — | — |

### 1.4 `sessions`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| user_id | uuid | NO | — | — | `users.id` |
| refresh_token | text | NO | — | UNIQUE | — |
| expires_at | timestamp | NO | — | — | — |
| created_at | timestamp | NO | `now()` | — | — |

### 1.5 `agents`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| name | text | NO | — | — | — |
| department | text | NO | — | — | — |
| type | text | NO | `'ai'` | — | — |
| status | text | NO | `'active'` | — | — |
| description | text | YES | — | — | — |
| channels | text[] | NO | `ARRAY['voice','video']::text[]` | — | — |
| dealership | text | YES | — | — | — |
| assigned_phone | text | YES | — | — | — |
| customer_link | text | YES | — | — | — |
| vapi_assistant_id | text | YES | — | — | — |
| tavus_persona_id | text | YES | — | — | — |
| instructions | text | YES | — | — | — |
| organization_id | uuid | NO | — | — | `organizations.id` |
| created_at | timestamp | NO | `now()` | — | — |
| updated_at | timestamp | NO | `now()` | — | — |

### 1.6 `conversations`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| customer_name | text | NO | — | — | — |
| customer_email | text | YES | — | — | — |
| customer_phone | text | YES | — | — | — |
| channel | text | NO | `'chat'` | — | — |
| status | text | NO | `'open'` | — | — |
| agent_id | uuid | YES | — | — | `agents.id` |
| organization_id | uuid | NO | — | — | `organizations.id` |
| campaign_id | uuid | YES | — | — | `campaigns.id` |
| campaign_disconnected | boolean | NO | `false` | — | — |
| unread_count | integer | NO | `0` | — | — |
| last_message_at | timestamp | YES | — | — | — |
| created_at | timestamp | NO | `now()` | — | — |
| updated_at | timestamp | NO | `now()` | — | — |

### 1.7 `messages`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| conversation_id | uuid | NO | — | — | `conversations.id` |
| role | text | NO | — | — | — |
| content | text | NO | — | — | — |
| sender_name | text | YES | — | — | — |
| created_at | timestamp | NO | `now()` | — | — |

### 1.8 `campaigns`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| name | text | NO | — | — | — |
| department | text | NO | `'sales'` | — | — |
| status | text | NO | `'draft'` | — | — |
| channel | text | NO | `'sms'` | — | — |
| organization_id | uuid | NO | — | — | `organizations.id` |
| kill_switch | boolean | NO | `false` | — | — |
| recipient_count | integer | NO | `0` | — | — |
| sent_count | integer | NO | `0` | — | — |
| replied_count | integer | NO | `0` | — | — |
| csv_filename | text | YES | — | — | — |
| message_template | text | YES | — | — | — |
| send_interval_seconds | integer | NO | `60` | — | — |
| created_at | timestamp | NO | `now()` | — | — |
| updated_at | timestamp | NO | `now()` | — | — |

### 1.9 `integrations`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| organization_id | uuid | NO | — | — | `organizations.id` |
| provider | text | NO | — | — | — |
| external_dealer_id | text | YES | — | — | — |
| external_dealer_name | text | YES | — | — | — |
| external_integration_id | text | YES | — | — | — |
| status | text | NO | `'active'` | — | — |
| nexxus_org_id | text | YES | — | — | — |
| created_at | timestamp | NO | `now()` | — | — |
| updated_at | timestamp | NO | `now()` | — | — |

### 1.10 `tasks`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| type | text | NO | `'task'` | — | — |
| title | text | NO | — | — | — |
| description | text | YES | — | — | — |
| status | text | NO | `'todo'` | — | — |
| priority | text | NO | `'medium'` | — | — |
| due_date | timestamp | YES | — | — | — |
| assigned_user_id | uuid | YES | — | — | `users.id` |
| organization_id | uuid | NO | — | — | `organizations.id` |
| tags | text[] | YES | `ARRAY[]::text[]` | — | — |
| metadata | text | YES | — | — | — |
| created_at | timestamp | NO | `now()` | — | — |
| updated_at | timestamp | NO | `now()` | — | — |

### 1.11 `widgets`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| name | text | NO | — | — | — |
| type | text | NO | `'text'` | — | — |
| status | text | NO | `'draft'` | — | — |
| description | text | YES | — | — | — |
| widget_code | text | NO | — | UNIQUE | — |
| organization_id | uuid | NO | — | — | `organizations.id` |
| config | jsonb | YES | `{}` | — | — |
| impressions | integer | NO | `0` | — | — |
| interactions | integer | NO | `0` | — | — |
| created_at | timestamp | NO | `now()` | — | — |
| updated_at | timestamp | NO | `now()` | — | — |

### 1.12 `knowledge_documents`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| name | text | NO | — | — | — |
| type | text | NO | — | — | — |
| size | integer | NO | `0` | — | — |
| status | text | NO | `'indexed'` | — | — |
| organization_id | uuid | NO | — | — | `organizations.id` |
| agent_id | uuid | YES | — | — | `agents.id` |
| content | text | YES | — | — | — |
| mime_type | text | YES | — | — | — |
| created_at | timestamp | NO | `now()` | — | — |
| updated_at | timestamp | NO | `now()` | — | — |

### 1.13 `campaign_recipients`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| campaign_id | uuid | NO | — | — | `campaigns.id` |
| first_name | text | YES | — | — | — |
| last_name | text | YES | — | — | — |
| phone | text | YES | — | — | — |
| email | text | YES | — | — | — |
| status | text | NO | `'pending'` | — | — |
| sent_at | timestamp | YES | — | — | — |
| delivered_at | timestamp | YES | — | — | — |
| created_at | timestamp | NO | `now()` | — | — |

### 1.14 `outbound_log`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| organization_id | uuid | NO | — | — | `organizations.id` |
| campaign_id | uuid | YES | — | — | `campaigns.id` |
| recipient_id | uuid | YES | — | — | `campaign_recipients.id` |
| channel | text | NO | — | — | — |
| status | text | NO | `'pending'` | — | — |
| blocked_reason | text | YES | — | — | — |
| message_content | text | YES | — | — | — |
| sent_at | timestamp | YES | — | — | — |
| created_at | timestamp | NO | `now()` | — | — |

### 1.15 `notifications`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| user_id | uuid | NO | — | — | `users.id` |
| organization_id | uuid | NO | — | — | `organizations.id` |
| type | text | NO | — | — | — |
| title | text | NO | — | — | — |
| message | text | YES | — | — | — |
| read | boolean | NO | `false` | — | — |
| related_entity_type | text | YES | — | — | — |
| related_entity_id | text | YES | — | — | — |
| created_at | timestamp | NO | `now()` | — | — |

### 1.16 `activity_log`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| user_id | uuid | YES | — | — | `users.id` |
| organization_id | uuid | NO | — | — | `organizations.id` |
| action | text | NO | — | — | — |
| entity_type | text | YES | — | — | — |
| entity_id | text | YES | — | — | — |
| metadata | jsonb | YES | `{}` | — | — |
| created_at | timestamp | NO | `now()` | — | — |

### 1.17 `hunches`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| organization_id | uuid | NO | — | — | `organizations.id` |
| type | text | NO | `'pattern'` | — | — |
| title | text | NO | — | — | — |
| description | text | NO | — | — | — |
| confidence | integer | NO | `50` | — | — |
| status | text | NO | `'new'` | — | — |
| department | text | YES | — | — | — |
| data_source | text | YES | — | — | — |
| batch_id | uuid | YES | — | — | — |
| generated_at | timestamp | NO | `now()` | — | — |
| accepted_at | timestamp | YES | — | — | — |
| resolved_at | timestamp | YES | — | — | — |
| created_at | timestamp | NO | `now()` | — | — |

### 1.18 `warehouse_leads`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| organization_id | uuid | NO | — | — | `organizations.id` |
| source_id | text | YES | — | — | — |
| data_source | text | NO | `'vin_solutions'` | — | — |
| vin_status | text | YES | — | — | — |
| customer_name | text | YES | — | — | — |
| customer_email | text | YES | — | — | — |
| customer_phone | text | YES | — | — | — |
| lead_source | text | YES | — | — | — |
| vehicle_of_interest | text | YES | — | — | — |
| assigned_salesperson | text | YES | — | — | — |
| dealer_name | text | YES | — | — | — |
| vin_created_at | timestamp | YES | — | — | — |
| vin_updated_at | timestamp | YES | — | — | — |
| synced_at | timestamp | NO | `now()` | — | — |
| created_at | timestamp | NO | `now()` | — | — |

### 1.19 `warehouse_metrics`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| organization_id | uuid | NO | — | — | `organizations.id` |
| metric_key | text | NO | — | — | — |
| metric_value | text | NO | — | — | — |
| period | text | YES | — | — | — |
| data_source | text | NO | `'vin_solutions'` | — | — |
| metadata | jsonb | YES | `{}` | — | — |
| synced_at | timestamp | NO | `now()` | — | — |
| created_at | timestamp | NO | `now()` | — | — |

### 1.20 `appointments`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| title | text | NO | — | — | — |
| customer_name | text | NO | — | — | — |
| customer_phone | text | YES | — | — | — |
| customer_email | text | YES | — | — | — |
| appointment_type | text | NO | `'general'` | — | — |
| department | text | NO | `'sales'` | — | — |
| assigned_user_id | uuid | YES | — | — | `users.id` |
| organization_id | uuid | NO | — | — | `organizations.id` |
| start_time | timestamp | NO | — | — | — |
| end_time | timestamp | NO | — | — | — |
| status | text | NO | `'scheduled'` | — | — |
| notes | text | YES | — | — | — |
| source | text | NO | `'manual'` | — | — |
| created_at | timestamp | NO | `now()` | — | — |
| updated_at | timestamp | NO | `now()` | — | — |

### 1.21 `slug_redirects`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| organization_id | uuid | NO | — | — | `organizations.id` |
| old_slug | text | NO | — | — | — |
| new_slug | text | NO | — | — | — |
| expires_at | timestamp | NO | — | — | — |
| created_at | timestamp | NO | `now()` | — | — |

### 1.22 `sync_log`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| organization_id | uuid | NO | — | — | `organizations.id` |
| sync_type | text | NO | — | — | — |
| status | text | NO | `'running'` | — | — |
| records_processed | integer | NO | `0` | — | — |
| records_failed | integer | NO | `0` | — | — |
| started_at | timestamp | NO | `now()` | — | — |
| completed_at | timestamp | YES | — | — | — |
| error_message | text | YES | — | — | — |
| created_at | timestamp | NO | `now()` | — | — |

### 1.23 `usage_events`

| Column | Type | Nullable | Default | Constraints | FK |
|--------|------|----------|---------|-------------|-----|
| id | uuid | NO | `gen_random_uuid()` | PK | — |
| organization_id | uuid | NO | — | — | `organizations.id` |
| event_type | text | NO | — | — | — |
| channel | text | YES | — | — | — |
| quantity | integer | NO | `1` | — | — |
| metadata | jsonb | YES | `{}` | — | — |
| created_at | timestamp | NO | `now()` | — | — |

### 1.24 `shared/models/chat.ts` — Separate Chat Schema (Replit Integration)

This is a separate, parallel schema used by the Replit chat integration (`server/replit_integrations/chat/`). It defines its own `conversations` and `messages` tables with serial integer PKs, conflicting with the main schema's UUID-based tables of the same name.

| Table | Column | Type | Nullable | Default | Constraints | FK |
|-------|--------|------|----------|---------|-------------|-----|
| conversations | id | serial | NO | auto-inc | PK | — |
| conversations | title | text | NO | — | — | — |
| conversations | created_at | timestamp | NO | `CURRENT_TIMESTAMP` | — | — |
| messages | id | serial | NO | auto-inc | PK | — |
| messages | conversation_id | integer | NO | — | — | `conversations.id` (onDelete: cascade) |
| messages | role | text | NO | — | — | — |
| messages | content | text | NO | — | — | — |
| messages | created_at | timestamp | NO | `CURRENT_TIMESTAMP` | — | — |

---

## 2. Storage Interface Methods Mapped to Tables

### IStorage Interface (defined in `server/storage.ts`)

| Method | Table(s) | Operation |
|--------|----------|-----------|
| `getUser(id)` | users | SELECT |
| `getUserByEmail(email)` | users | SELECT |
| `createUser(user)` | users | INSERT |
| `updateUser(id, data)` | users | UPDATE |
| `getRole(id)` | roles | SELECT |
| `getRoleByName(name)` | roles | SELECT |
| `getRoles()` | roles | SELECT |
| `createRole(role)` | roles | INSERT |
| `getOrganization(id)` | organizations | SELECT |
| `getOrganizations()` | organizations | SELECT |
| `createOrganization(org)` | organizations | INSERT |
| `updateOrganization(id, data)` | organizations | UPDATE |
| `createSession(session)` | sessions | INSERT |
| `getSessionByRefreshToken(token)` | sessions | SELECT |
| `deleteSession(id)` | sessions | DELETE |
| `deleteUserSessions(userId)` | sessions | DELETE |
| `getAgents(orgId, filters)` | agents | SELECT |
| `getUsers(orgId)` | users, roles | SELECT (LEFT JOIN) |
| `getAgent(id)` | agents | SELECT |
| `createAgent(agent)` | agents | INSERT |
| `updateAgent(id, data)` | agents | UPDATE |
| `deleteAgent(id)` | agents | DELETE |
| `getConversations(orgId, filters)` | conversations | SELECT |
| `getConversation(id)` | conversations | SELECT |
| `getConversationByPhone(phone, channel)` | conversations | SELECT |
| `createConversation(conv)` | conversations | INSERT |
| `updateConversation(id, data)` | conversations | UPDATE |
| `getMessages(conversationId)` | messages | SELECT |
| `createMessage(msg)` | messages | INSERT |
| `deleteConversation(id)` | messages, conversations | DELETE (both) |
| `deleteMessages(conversationId)` | messages | DELETE |
| `getCampaigns(orgId, filters)` | campaigns | SELECT |
| `getCampaign(id)` | campaigns | SELECT |
| `createCampaign(campaign)` | campaigns | INSERT |
| `updateCampaign(id, data)` | campaigns | UPDATE |
| `getIntegrations(orgId, filters)` | integrations | SELECT |
| `getIntegration(id)` | integrations | SELECT |
| `createIntegration(integration)` | integrations | INSERT |
| `updateIntegration(id, data)` | integrations | UPDATE |
| `getTasks(orgId, filters)` | tasks | SELECT |
| `getTask(id)` | tasks | SELECT |
| `createTask(task)` | tasks | INSERT |
| `updateTask(id, data)` | tasks | UPDATE |
| `deleteTask(id)` | tasks | DELETE |
| `getWidgets(orgId)` | widgets | SELECT |
| `getWidget(id)` | widgets | SELECT |
| `createWidget(widget)` | widgets | INSERT |
| `updateWidget(id, data)` | widgets | UPDATE |
| `deleteWidget(id)` | widgets | DELETE |
| `getDocuments(orgId, agentId)` | knowledge_documents | SELECT |
| `getDocument(id)` | knowledge_documents | SELECT |
| `createDocument(doc)` | knowledge_documents | INSERT |
| `deleteDocument(id)` | knowledge_documents | DELETE |
| `getRecipients(campaignId)` | campaign_recipients | SELECT |
| `getRecipient(id)` | campaign_recipients | SELECT |
| `createRecipients(recipients[])` | campaign_recipients | INSERT (batch) |
| `getRecipientCount(campaignId)` | campaign_recipients | SELECT (COUNT) |
| `updateRecipient(id, data)` | campaign_recipients | UPDATE |
| `getPendingRecipients(campaignId)` | campaign_recipients | SELECT |
| `createOutboundLog(log)` | outbound_log | INSERT |
| `getOutboundLogs(orgId, filters)` | outbound_log | SELECT |
| `getRecentOutboundCount(orgId, contact, hours)` | outbound_log, campaign_recipients | SELECT (JOIN + COUNT) |
| `createNotification(notif)` | notifications | INSERT |
| `getNotifications(userId, limit)` | notifications | SELECT |
| `getUnreadNotificationCount(userId)` | notifications | SELECT (COUNT) |
| `markNotificationRead(id)` | notifications | UPDATE |
| `markAllNotificationsRead(userId)` | notifications | UPDATE |
| `createActivityLog(entry)` | activity_log | INSERT |
| `getActivityLogs(orgId, limit)` | activity_log | SELECT |
| `getHunches(orgId, filters)` | hunches | SELECT |
| `getHunch(id)` | hunches | SELECT |
| `createHunch(hunch)` | hunches | INSERT |
| `updateHunch(id, data)` | hunches | UPDATE |
| `getAcceptedHunches(orgId)` | hunches | SELECT |
| `upsertWarehouseLead(lead)` | warehouse_leads | SELECT + INSERT/UPDATE |
| `getWarehouseLeads(orgId, filters)` | warehouse_leads | SELECT |
| `getWarehouseLeadCount(orgId, filters)` | warehouse_leads | SELECT (COUNT) |
| `upsertWarehouseMetric(metric)` | warehouse_metrics | SELECT + INSERT/UPDATE |
| `getWarehouseMetrics(orgId, filters)` | warehouse_metrics | SELECT |
| `createSyncLog(entry)` | sync_log | INSERT |
| `updateSyncLog(id, data)` | sync_log | UPDATE |
| `getLatestSync(orgId, syncType)` | sync_log | SELECT |
| `getSyncLogs(orgId, limit)` | sync_log | SELECT |
| `getAppointments(orgId, filters)` | appointments | SELECT |
| `getAppointment(id)` | appointments | SELECT |
| `createAppointment(appointment)` | appointments | INSERT |
| `updateAppointment(id, data)` | appointments | UPDATE |
| `deleteAppointment(id)` | appointments | DELETE |
| `getOrganizationBySlug(slug)` | organizations | SELECT |
| `getSlugRedirect(oldSlug)` | slug_redirects | SELECT |
| `createSlugRedirect(redirect)` | slug_redirects | INSERT |
| `updateOrganizationSlug(id, newSlug)` | organizations | UPDATE |
| `getDashboardMetrics(orgId)` | conversations, messages, campaigns, agents, users, warehouse_leads, tasks, outbound_log, appointments | SELECT (aggregate) |
| `getPipelineMetrics(orgId)` | warehouse_leads, tasks, outbound_log | SELECT (COUNT) |

### Methods on DatabaseStorage NOT in IStorage Interface

| Method | Table(s) | Operation |
|--------|----------|-----------|
| `logUsageEvent(event)` | usage_events | INSERT |
| `getUsageEvents(orgId, filters)` | usage_events | SELECT |
| `getUsageSummary(orgId, start, end)` | usage_events | SELECT (GROUP BY) |

---

## 3. Migration Status

- **Drizzle config:** `drizzle.config.ts` points to `./migrations` output directory, dialect `postgresql`, schema `./shared/schema.ts`
- **Migrations directory:** EXISTS but is EMPTY (contains no migration SQL files)
- **Observation:** Schema is being applied through `drizzle-kit push` or manual means, not through versioned migrations. No migration history is tracked in the repository.

---

## 4. Schema vs Requirements Gap Analysis

### 4.1 Tables/Entities Promised in SRS/PRD but MISSING from Schema

| Promised Entity (SRS §10) | Status | Notes |
|----------------------------|--------|-------|
| `landing_pages` | MISSING | SRS §10.4 specifies: `landing_pages (id, slug, name, type, linked_widget_id, status, appearance, organization_id, views, conversions, created_at, updated_at)`. No table exists in schema. |
| `campaign_messages` | MISSING | SRS §10.2 specifies: `campaign_messages (id, campaign_id, order, channel, subject, content, wait_hours)`. No table exists; campaigns have only a single `message_template` text field. |
| `metrics_cache` | MISSING | SRS §10.5 specifies: `metrics_cache (id, metric_key, value, role, organization_id, computed_at, ttl_seconds)`. Not present in schema. |
| `teambox_conversations` | MISSING | SRS §10.2 mentions a separate `teambox_conversations` table. The existing `conversations` table serves this purpose but has a different column set. |

### 4.2 Columns Promised but Missing or Different

| Table | SRS/PRD Column | Schema Status |
|-------|---------------|---------------|
| `organizations` | `industry` | MISSING |
| `organizations` | `plan` | MISSING |
| `organizations` | `logo_url` | MISSING |
| `organizations` | `primary_color` | MISSING |
| `organizations` | `secondary_color` | MISSING |
| `users` | `phone` | MISSING |
| `users` | `preferences` (jsonb) | MISSING |
| `users` | `name` (single field) | Schema uses `first_name` + `last_name` (acceptable divergence) |
| `users` | `avatar_url` | Schema uses `profile_photo_url` (acceptable name variant) |
| `conversations` | `title` | MISSING (present in chat.ts replit model but not main schema) |
| `messages` | `thinking` | MISSING (SRS §10.2 specifies thinking column for AI reasoning) |
| `campaigns` | `delivered_count` | MISSING (SRS §5.1 specifies it; schema has no delivered tracking) |
| `campaigns` | `created_by` | MISSING (SRS §5.1 specifies user who created campaign) |
| `campaigns` | `messages` (array/relation) | MISSING (SRS specifies `CampaignMessage[]`; only `message_template` text exists) |
| `agents` | `system_prompt` | MISSING (SRS §10.3; `instructions` may serve similar purpose) |
| `agents` | `triggers` | MISSING |
| `agents` | `tools` | MISSING |
| `agents` | `knowledge_sources` | MISSING |
| `agents` | `chat_link` | MISSING |
| `agents` | `created_by` | MISSING |
| `widgets` | `appearance` (separate) | Merged into `config` jsonb |
| `widgets` | `targeting` (separate) | Merged into `config` jsonb |
| `widgets` | `allowed_domains` (separate) | Merged into `config` jsonb |
| `notifications` | `action_url` | MISSING (SRS §10.6) |
| `activity_log` | `description` | MISSING (SRS §10.6) |
| `hunches` | `impact` | MISSING (SRS §10.5 mentions impact field; only `confidence` exists) |
| `hunches` | `pattern` | MISSING (may be in `description`) |
| `hunches` | `recommendation` | MISSING |
| `hunches` | `source` | MISSING (only `data_source` exists) |
| `hunches` | `data` (jsonb) | MISSING |

### 4.3 Tables in Schema but NOT Promised in SRS/PRD

| Table | Notes |
|-------|-------|
| `slug_redirects` | Not mentioned in SRS/PRD; supports org slug change feature |
| `sync_log` | Not mentioned in SRS/PRD; supports VinSolutions sync tracking |
| `warehouse_leads` | Not mentioned in SRS/PRD; supports VinSolutions data warehouse |
| `warehouse_metrics` | Not mentioned in SRS/PRD; supports VinSolutions metric warehouse |
| `outbound_log` | Not mentioned in SRS/PRD; supports campaign safety/audit trail |
| `usage_events` | Not mentioned in SRS/PRD; supports Wave 3 credit/metering |
| `campaign_recipients` | Not explicitly in SRS §10 tables but implied by campaign CSV upload feature |

---

## 5. Observations and Concerns

### 5.1 Dual Schema Conflict
- `shared/models/chat.ts` defines `conversations` and `messages` tables with serial integer PKs and different columns than the main `shared/schema.ts` which uses UUID PKs. Both files export types with the same names (`Conversation`, `Message`, `InsertConversation`, `InsertMessage`). This creates a naming collision risk. The Replit chat integration has its own storage layer at `server/replit_integrations/chat/storage.ts`.

### 5.2 IStorage Interface Incompleteness
- `logUsageEvent`, `getUsageEvents`, and `getUsageSummary` are implemented on `DatabaseStorage` but NOT declared in the `IStorage` interface. They can only be called when the consumer has a concrete `DatabaseStorage` reference, not through the interface.

### 5.3 Foreign Key Concerns
- `organizations.partner_id` (uuid, nullable) has no FK reference. It appears intended to reference another organization or a partner entity, but no constraint is defined.
- `hunches.batch_id` (uuid, nullable) has no FK reference. Purpose unclear — may reference a batch processing run but no `batches` table exists.
- `conversations.campaign_id` references `campaigns.id`, but `campaigns` is defined AFTER `conversations` in the schema file. This works because of the arrow function reference (`() => campaigns.id`), but the declaration order is inverted.

### 5.4 Missing ON DELETE Behaviors
- No `onDelete` cascade or set-null rules are defined on any FK in the main schema (only the Replit chat model has `onDelete: "cascade"`). Deleting a parent record (e.g., an organization, agent, user, or campaign) will fail with FK constraint violations unless explicitly handled in application code.
- `deleteAgent(id)` does a simple DELETE but agents are referenced by `conversations.agent_id` and `knowledge_documents.agent_id`.
- `deleteConversation(id)` manually deletes messages first, then the conversation — compensating for missing cascade.

### 5.5 Missing Indexes
- No explicit indexes are defined beyond PKs and UNIQUE constraints. High-cardinality query patterns that would benefit from indexes include:
  - `conversations.organization_id` + `status` (used in filtered queries)
  - `messages.conversation_id` (used in every message lookup)
  - `campaigns.organization_id` (used in filtered queries)
  - `notifications.user_id` + `read` (used in unread count)
  - `activity_log.organization_id` + `created_at` (used in ordered queries)
  - `warehouse_leads.organization_id` + `source_id` (used in upsert)

### 5.6 Missing NOT NULL Where Expected
- `campaign_recipients.first_name`, `last_name`, `phone`, `email` are all nullable. A recipient with no phone AND no email cannot be contacted.
- `outbound_log.campaign_id` and `outbound_log.recipient_id` are both nullable, meaning outbound logs can exist without linking to any campaign or recipient.

### 5.7 No RLS Policies
- SRS §10.7 specifies Row-Level Security policies on all multi-tenant tables. No RLS policies exist in the schema or migrations.

### 5.8 Missing `updated_at` on Some Tables
- `campaign_recipients` has no `updated_at` despite having mutable `status`, `sent_at`, `delivered_at` fields.
- `outbound_log` has no `updated_at`.
- `notifications` has no `updated_at` despite `read` being mutable.
- `activity_log` has no `updated_at` (acceptable — typically append-only).

### 5.9 Seed Data Observations
- Seed creates 8 roles matching the 8-role RBAC system: super_admin, partner_admin, org_admin, executive, sales_manager, sales, service, marketing.
- Role levels: super_admin=1, partner_admin=2, org_admin/executive/sales_manager=3, sales/service/marketing=4. Note that executive and sales_manager share level 3 with org_admin despite different access scopes.
- Seed creates 3 organizations, 8 users, 8 agents, 4 campaigns, 8 conversations with messages, 3 integrations, 6 tasks, 4 widgets, 4 knowledge documents, and 15 campaign recipients.
- Default password for all seed users: `password123`.

### 5.10 Type Safety Observations
- `updateCampaign` in seed calls `storage.updateCampaign(id, { recipientCount: count } as any)` — uses `as any` cast, suggesting type mismatch between the update schema and the data being passed.
- `updateHunch` in the IStorage interface accepts `Partial<Hunch>` (select type) rather than `Partial<InsertHunch>`, which is inconsistent with other update methods that use the insert type.

### 5.11 Missing `insertUsageEventSchema` Ordering
- The `insertUsageEventSchema` and `InsertUsageEvent` type are defined after all other insert schemas and select types (lines 365-366), breaking the declaration pattern used by all other tables. Not a functional issue but a code organization concern.
