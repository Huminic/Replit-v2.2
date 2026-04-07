# Data Bug Investigation — SNP-PE3-CHAT-01

**Date:** 2026-04-07
**Scope:** Outbound Sent metric, contact name resolution, raw enum status values

---

## Question 1: What is the "Outbound Sent" metric tile?

### What it displays (drill-down table)

The drill-down modal renders a table with these columns:
- **Recipient** (`row.recipientName || '—'`)
- **Phone** (`row.recipientPhone`)
- **Email** (`row.recipientEmail || '—'`)
- **Channel** (`row.channel`) — displayed as a badge
- **Sent** (`row.sentAt` or `row.createdAt`, formatted as time only)

**File:** `client/src/pages/main.tsx`, lines 466-492

### API endpoint

The drill-down calls:
```
GET /api/metrics/pipeline/details?metric=outbound_sent
```

**File:** `client/src/pages/main.tsx`, line 336 — useQuery with queryKey `/api/metrics/pipeline/details?metric=${metricKey}`

### Server-side query

**File:** `server/routes/metrics.ts`, lines 38-124 — routes to `storage.getPipelineMetricDetails(orgId, 'outbound_sent')`

**File:** `server/storage.ts`, lines 925-976 — the `outbound_sent` case:

1. Queries the `outbound_log` table for rows where:
   - `organizationId` matches
   - `status = 'sent'`
   - `created_at >= 24 hours ago`
   - Ordered by `created_at DESC`, limit 100

2. Returns fields: `id`, `channel`, `status`, `messageContent`, `sentAt`, `createdAt`, `recipientId`, `campaignId`

3. **Recipient resolution (BUG-PE01-003 fix):** For rows with a `recipientId`, joins to `campaign_recipients` table to get `firstName`, `lastName`, `phone`, `email`. For non-campaign sends (no `recipientId`), attempts regex extraction of phone from `messageContent` — name is always `null` in this path.

### What this data actually is

This is data from the **Nexxus outbound campaign system** — NOT from VIN Solutions. It tracks:
- **Campaign SMS** sent via TextMagic (through `callMCP("tm_send_message", ...)`)
- **Campaign emails** sent via Resend
- **Campaign phone calls** initiated via VAPI
- **STOP confirmations** (SMS)
- **Lead notification emails** (from webhook triggers)

The `outbound_log` table is the Nexxus internal send log. Every call to `processOutboundSend()` in `server/outbound.ts` logs the attempt via `logAttempt()` (line 440-458), which calls `storage.createOutboundLog()`.

**Channels:** SMS, email, and phone (voice calls). All three.

### Schema: outbound_log table

**File:** `shared/schema.ts`, lines 235-248

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| organization_id | uuid | FK to organizations |
| campaign_id | uuid | FK to campaigns (nullable) |
| recipient_id | uuid | FK to campaign_recipients (nullable) |
| channel | text | "sms", "email", or "phone" |
| status | text | "sent", "blocked", "failed", "dry_run", "pending" |
| blocked_reason | text | nullable |
| message_content | text | nullable |
| sent_at | timestamp | nullable |
| created_at | timestamp | auto |

**Key finding:** The `outbound_log` table has NO recipient name, phone, or email columns. Recipient info must be resolved via the `recipient_id` FK to `campaign_recipients`. For non-campaign sends (STOP confirmations, ad-hoc sends), there is no structured recipient data — only regex extraction from `messageContent`.

---

## Question 2: How does the system get contact name information?

### VIN Solutions contact data via MCP

**File:** `server/vendorProxy.ts`

The system uses these MCP tools for contact data:

| Tool | Purpose | Returns name? |
|------|---------|---------------|
| `vin_query_leads` | Query leads by date range, status, limit | Returns `contact` as an href string (e.g., `/contacts/id/12345`), NOT the contact's name/phone/email directly |
| `vin_get_contact` | Get full contact by contactId | Yes — returns `ContactInformation` with `FirstName`, `LastName`, `Emails[]`, `Phones[]`, etc. |
| `vin_search_contacts` | Search contacts by name/email/phone | Yes |

**Critical gap:** `vin_query_leads` does NOT return contact name fields inline. The lead object contains only a `contact` href (a URL path like `/contacts/id/12345`). To get the actual name, you must:
1. Extract the contactId from the href using `extractContactIdFromHref()` (line 114-117)
2. Make a separate `vin_get_contact` call with that contactId

### flattenContactInfo utility

**File:** `server/vendorProxy.ts`, lines 119-152

Normalizes the VIN Solutions contact response into:
```
{ contactId, firstName, lastName, email, phone, city, state, zip, companyName, doNotCall, doNotEmail, doNotMail }
```

### What happens during lead sync

**File:** `server/sync.ts`, lines 11-38 — `transformVinLead()`

The sync builds `customerName` from:
```typescript
const name = [raw.contact?.firstName, raw.contact?.lastName].filter(Boolean).join(" ") || raw.customerName || null;
```

**This is the root cause of blank names.** The `vin_query_leads` MCP response returns `contact` as an href STRING (e.g., `"/contacts/id/12345"`), NOT as an object with `firstName`/`lastName`. So `raw.contact?.firstName` is always `undefined`, and `raw.customerName` is also likely `undefined` (not a standard VIN Solutions field).

Result: `customerName` is stored as `null` in `warehouse_leads` for virtually all synced leads.

### warehouse_leads schema

**File:** `shared/schema.ts`, lines 297-320

Name-related fields:
- `customer_name` (text, nullable) — the only name field
- `customer_email` (text, nullable)
- `customer_phone` (text, nullable)

No separate `first_name` / `last_name` fields.

### Background enrichment (partial fix exists)

**File:** `server/routes/metrics.ts`, lines 48-117

When the `active_pipeline` drill-down is loaded, if rows have blank `customerName`, a **background enrichment** process runs:
1. Calls `vin_query_leads` to get lead-to-contact href mappings
2. Extracts contactIds from hrefs
3. Calls `vin_get_contact` for up to 20 contacts (in batches of 5)
4. Updates `warehouse_leads` with the resolved name, phone, email

**Limitation:** This enrichment only fires for the `active_pipeline` metric, not for other views. It runs in the background (fire-and-forget), so the FIRST load still shows blank names — they only populate on subsequent loads.

### Summary: blank names ARE a missing query issue

Blank names are caused by a **code bug in `transformVinLead()`**, not a VIN API limitation. The VIN API DOES return contact names, but only via the separate `vin_get_contact` endpoint. The sync process (`runHistoricalBackfill` and `runDailyDelta`) calls `vin_query_leads` which returns contact as an href, then `transformVinLead()` tries to read `raw.contact.firstName` from what is actually a string URL — resulting in `null`.

The background enrichment in the metrics route is a partial workaround that was added later, but it only covers `active_pipeline` and only works on the second page load.

---

## Question 3: Raw enum status values

### Where status is displayed

**File:** `client/src/pages/main.tsx`

1. **Active Pipeline drill-down** (line 385):
   ```
   {row.vinStatus || '—'}
   ```
   Displayed raw in a badge span with no transformation.

2. **Contact detail view** (line 244):
   ```
   {leadRow.vinStatus}
   ```
   Also displayed raw with no transformation.

### What values are shown

These are VIN Solutions lead status enum values stored in `warehouse_leads.vin_status`. Based on the status filters in `server/sync.ts` (lines 243-263) and `server/storage.ts` (lines 816-824), the values include:

**Active statuses (visible in pipeline drill-down):**
- `ACTIVE_NEW_LEAD`
- `ACTIVE_WAITING_FOR_PROSPECT_RESPONSE`
- `ACTIVE_ACTIVE_LEAD`
- `ACTIVE_SET_APPOINTMENT`

**Sold statuses (filtered out of pipeline but visible in other views):**
- `SOLD_DELIVERED`
- `SOLD_PENDING_FINANCE`
- `SOLD_ON_ORDER`

**Lost statuses (filtered out):**
- `LOST_DID_NOT_RESPOND`
- `LOST_NO_AGREEMENT_REACHED`
- `LOST_BAD_CREDIT`
- `LOST_LEAD_PROCESS_COMPLETED`

**Other filtered statuses:**
- `NON_CUSTOMER_INITIATED_LEAD`
- `BAD*` (any BAD-prefixed)
- `SERVICE*` (any SERVICE-prefixed)
- `*DUPLICATE*` (any containing DUPLICATE)

### Is there a formatter?

**No.** There is no status formatter in `main.tsx` or anywhere in the client code that maps VIN status enums to human-readable labels.

The `my-work.tsx` page (line 46) has a `statusLabels` map, but it is for task statuses (todo/in_progress/done), not VIN lead statuses. It is not imported or used in `main.tsx`.

### What would need to be added

A mapping function like:
```typescript
const VIN_STATUS_LABELS: Record<string, string> = {
  'ACTIVE_NEW_LEAD': 'New Lead',
  'ACTIVE_WAITING_FOR_PROSPECT_RESPONSE': 'Waiting for Response',
  'ACTIVE_ACTIVE_LEAD': 'Active Lead',
  'ACTIVE_SET_APPOINTMENT': 'Appointment Set',
  'SOLD_DELIVERED': 'Sold — Delivered',
  'SOLD_PENDING_FINANCE': 'Sold — Pending Finance',
  'SOLD_ON_ORDER': 'Sold — On Order',
  'LOST_DID_NOT_RESPOND': 'Lost — No Response',
  'LOST_NO_AGREEMENT_REACHED': 'Lost — No Agreement',
  'LOST_BAD_CREDIT': 'Lost — Bad Credit',
  'LOST_LEAD_PROCESS_COMPLETED': 'Lost — Process Complete',
};

function formatVinStatus(raw: string | null): string {
  if (!raw) return '—';
  return VIN_STATUS_LABELS[raw] || raw.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
```

This would need to be applied at lines 385 and 244 of `main.tsx`.

---

## Summary of Findings

| Bug | Root Cause | Location |
|-----|-----------|----------|
| Blank names in pipeline drill-down | `transformVinLead()` reads `raw.contact.firstName` but `contact` is an href string, not an object | `server/sync.ts` line 12 |
| Blank names in outbound sent | Non-campaign sends have no `recipientId`, so no join to `campaign_recipients`; regex fallback only extracts phone | `server/storage.ts` lines 967-974 |
| Raw enum statuses shown | No VIN status formatter exists in the frontend | `client/src/pages/main.tsx` lines 385, 244 |
| Background enrichment only partial | Only runs for `active_pipeline` metric, fire-and-forget so first load always blank | `server/routes/metrics.ts` lines 48-117 |
