# Service-Campaign DARK-State Verification — Wave 11A Phase 2 Audit Finding #1

**Date:** 2026-05-11
**Agent:** integration-safety
**Branch:** wave/11-gov/11A-final-e2e
**HEAD:** 706144e
**Purpose:** Verify/refute orchestrator claim in `launch-recommendation.md:55` that "Service-campaign capability shipped ENABLED only for `serra-honda`; other 4 orgs DARK as planned." Per CLAUDE.md "Service-campaign launch rule (NEXXUS) — operator decision 2026-04-25".

## Verdict: YELLOW — needs operator interpretation, NOT a blocker

Claim is **substantively correct** for the campaign-outbound axis (no other org has any non-completed service campaign), but the org-level boolean flags (`outbound_enabled`, `sms_enabled`, `phone_enabled`, `email_enabled`) are TRUE for ALL 7 orgs. The rule's "service module flags default OFF for non-serra-honda orgs" is enforced via the `settings` jsonb (trigger flags only present on serra-honda) and via absence of service campaigns on other orgs — NOT via the channel-level booleans.

If "service-module enabled" means "has active service-department outbound campaigns running" → GREEN.
If "service-module enabled" means "channel booleans gate ALL outbound" → those booleans are TRUE everywhere → operator must clarify intent.

## Schema reference (shared/schema.ts:12-31, :122-148)

- `organizations` has top-level booleans: `outbound_enabled`, `sms_enabled`, `phone_enabled`, `email_enabled`, `video_enabled`. No per-department/per-module sub-flag column exists.
- `organizations.settings` (jsonb) carries trigger-level toggles: `triggersEnabled`, `checkInTriggerEnabled`, `afterHoursTriggerEnabled`, `triggerTestPhones`.
- `campaigns` has `department` text column (values seen: `sales`, `service`, `marketing`). Service campaigns are department='service'.
- No table or column literally named `service_campaign_enabled` / `service_module_enabled` / `service_outbound` exists.

## Query 1 — org-level channel flags + settings (all 7 orgs)

```sql
SELECT slug, outbound_enabled, sms_enabled, phone_enabled, email_enabled,
       video_enabled, settings FROM organizations ORDER BY slug;
```

| slug | outbound | sms | phone | email | video | settings (trigger keys) |
|---|---|---|---|---|---|---|
| cage-automotive | t | t | t | t | f | `{}` |
| ford-of-columbia | t | t | t | t | f | adfBrand/adfLeadSource/vapiPhoneNumberId only |
| huminic | t | t | t | t | f | `{}` |
| hyundai-of-columbia | t | t | t | t | f | adfBrand/adfLeadSource/vapiPhoneNumberId only |
| serra-honda | t | t | t | t | f | **triggersEnabled=true, checkInTriggerEnabled=true, afterHoursTriggerEnabled=false, triggerTestPhones=[+14126546500], textmagicPhone=+18338935694** |
| serra-nissan | t | t | t | t | f | adfBrand/adfLeadSource/vapiPhoneNumberId only |
| tony-serra-ford | t | t | t | t | f | adfBrand/adfLeadSource/vapiPhoneNumberId only |

**Observation:** All 7 orgs have all 4 outbound-channel booleans TRUE. Only serra-honda has the trigger-related `settings` keys populated (the other 6 have NULL for `triggersEnabled` etc.).

## Query 2 — active/scheduled/draft/paused campaigns per org (non-completed)

```sql
SELECT o.slug, c.department, c.status, c.kill_switch, count(*)
FROM campaigns c JOIN organizations o ON o.id = c.organization_id
WHERE c.status IN ('active','scheduled','paused','draft')
GROUP BY o.slug, c.department, c.status, c.kill_switch
ORDER BY o.slug, c.department, c.status;
```

| slug | department | status | kill_switch | count |
|---|---|---|---|---|
| serra-honda | marketing | draft | f | 1 |
| serra-honda | sales | active | f | 4 |
| serra-honda | sales | draft | f | 4 |
| serra-honda | service | active | f | **2** |
| serra-honda | service | draft | f | 7 |
| serra-honda | service | paused | t | 1 |

**Observation:** No other org has ANY non-completed campaign (sales OR service OR marketing). serra-honda is the ONLY org with active campaigns of any kind.

## Query 3 — ACTIVE service campaigns on serra-honda (recipient + execution detail)

```sql
SELECT slug, name, recipient_count, execution_processed
FROM campaigns c JOIN organizations o ON o.id = c.organization_id
WHERE c.status = 'active' AND c.department = 'service';
```

| slug | name | recipient_count | execution_processed |
|---|---|---|---|
| serra-honda | S11 Demo Smoke Test | 0 | 0 |
| serra-honda | S11 Demo Smoke Test | 0 | 0 |

**Observation:** Both active service campaigns have 0 recipients loaded and 0 processed → no sends will fire at launch.

## Query 4 — unexecuted scheduled actions per org

```sql
SELECT o.slug, sa.action_type, count(*)
FROM scheduled_actions sa JOIN organizations o ON o.id = sa.organization_id
WHERE sa.executed_at IS NULL
GROUP BY o.slug, sa.action_type;
```

Result: 0 rows. No queued outbound actions on any org.

## Trigger-service gate (server/services/triggerService.ts:197, :323, :751)

Code is fail-closed:

- `if (!settings.triggersEnabled) { return; }` (line 751)
- `if (!settings.checkInTriggerEnabled) { skip }` (line 323)
- `if (!settings.afterHoursTriggerEnabled) { skip }` (line 197)

Settings keys are NULL on all 6 non-serra-honda orgs → all three checks skip → no automated service-campaign trigger fires for those orgs.

## Service AI agents per org (informational — inbound only)

```sql
SELECT o.slug, a.name, a.department, a.status, a.channels
FROM agents a JOIN organizations o ON o.id = a.organization_id
WHERE a.department = 'service' ORDER BY o.slug;
```

Service agents exist on Ford of Columbia (Savannah voice/video, Nancy Gaston chat), Hyundai of Columbia (Nancy Gaston chat), serra-honda (Nancy Gaston chat/sms, Service Agent inactive), serra-nissan (Nancy Gaston chat, Magnolia voice/video), tony-serra-ford (Nancy Gaston chat). These are inbound-response agents (chat/voice/video are inbound channels routed to AI) — they do NOT initiate outbound service campaigns.

## Risk assessment

| Vector | State | Risk at launch |
|---|---|---|
| Outbound service-campaign sends from non-serra-honda orgs | NO active/scheduled service campaigns on any other org | NONE |
| serra-honda active service campaigns sending | 2 active campaigns, 0 recipients each | NONE (no recipients to send to) |
| Trigger-fired outbound on other orgs | trigger-flag keys NULL → fail-closed gate skips | NONE |
| Org-level channel booleans (all TRUE on all orgs) | TRUE everywhere, but no campaigns + no triggers + no scheduled actions on other orgs | NONE (booleans gate, but nothing to gate) |
| Inbound service AI agents on other orgs | Active on chat/voice/video | Inbound only — not service-campaign scope |

## Recommendation

Operator should clarify the intent of the "service-module flags default OFF" rule in CLAUDE.md before merge:

1. If intent is **"no outbound service-campaign sends fire from non-serra-honda orgs at launch"** → **GREEN.** Confirmed by absence of campaigns + scheduled actions + trigger flags on those orgs. Launch can proceed.
2. If intent is **"per-channel boolean flags must be FALSE on non-serra-honda orgs at launch"** → **YELLOW/RED.** All 7 orgs have all 4 channel booleans TRUE. Operator must decide: (a) toggle them OFF before merge for the 4 other dealership orgs, or (b) explicitly authorize ship-with on the basis that no campaigns/triggers exist to be gated.

Recommend updating `launch-recommendation.md:55` to read: "Service-campaign capability shipped ENABLED only for `serra-honda` (only org with active service campaigns + trigger flags); other 4 dealership orgs DARK at the campaign and trigger level. Org-level channel booleans are TRUE for all 7 orgs (out-of-scope for the service-campaign rule)."

## Constraints honored

- No DB rows were modified.
- No provider sends triggered.
- No credentials or PII printed.
- Allowlist not modified.

## Final response shape

- boundaries_touched: organizations + campaigns + scheduled_actions + agents tables (READ ONLY)
- safe_paths_used: psql read-only queries against DATABASE_URL from .env
- unsafe_paths_detected: none
- real_writes_approved_by_operator: none
- real_writes_NOT_approved: none
- verdict: **YELLOW — operator clarification needed on rule interpretation; if "no active outbound sends from non-serra-honda orgs" is the intent, it's GREEN.**
- required_changes_before_merge: update `launch-recommendation.md:55` to cite the actual mechanism (campaigns + trigger flags), not org-level channel booleans.
