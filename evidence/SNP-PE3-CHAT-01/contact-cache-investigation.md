# Contact Data Storage & Caching Investigation

**Date:** 2026-04-07
**Scope:** Research only -- how contact data flows through Nexxus Connect v2.2

---

## Question 1: Does warehouse_leads store fetched contact names?

**YES.** The `warehouse_leads` table has three contact columns:

| Column | Type | File | Line |
|--------|------|------|------|
| `customer_name` | text | `shared/schema.ts` | 303 |
| `customer_email` | text | `shared/schema.ts` | 304 |
| `customer_phone` | text | `shared/schema.ts` | 305 |

**Initial sync populates these.** The `transformVinLead()` function in `server/sync.ts` (line 11) extracts contact info from the VIN query_leads response:

```
customerName: [raw.contact?.firstName, raw.contact?.lastName].filter(Boolean).join(" ")
customerEmail: raw.contact?.email || raw.email || null
customerPhone: raw.contact?.phone || raw.phone || null
```

**However:** The VIN `query_leads` endpoint returns minimal/inconsistent contact data. Many leads arrive with `customerName = null` because the `raw.contact` nested object is often absent from the query_leads response. This is why background enrichment exists.

There is NO separate UPDATE query that writes contact info back after a `vin_get_contact` call from the View Contact endpoint. The only write-back happens from the background enrichment (see Q2).

---

## Question 2: Does the background enrichment persist?

**YES -- it persists to warehouse_leads.**

File: `server/routes/metrics.ts` lines 48-117

The background enrichment fires when the `active_pipeline` metric drill-down finds leads with `!r.customerName && r.sourceId`. It:

1. Queries `vin_query_leads` for recent leads (14-day window)
2. Extracts `contactId` from the lead's `ContactHref`
3. Calls `vin_get_contact` for each contact (batches of 5, 8s timeout)
4. **Writes back to warehouse_leads** via `storage.upsertWarehouseLead()` (line 97)

The upsert writes these fields:

| Field | Value Written | Line |
|-------|---------------|------|
| `customerName` | `[firstName, lastName].join(" ")` | 94 |
| `customerPhone` | `contact.phone` | 101 |
| `customerEmail` | `contact.email` | 102 |
| `vinStatus` | preserved from existing row | 103 |

This is a **fire-and-forget async IIFE** -- it runs in the background after the API response is already sent. The enriched data is available on subsequent requests.

**Limitation:** Only enriches up to 20 leads per request, only for active_pipeline drill-downs, only for leads updated in the last 14 days.

---

## Question 3: Does the View Contact endpoint cache?

**NO -- it does NOT write back to the database.**

File: `server/vendorProxy.ts` lines 711-765

The `GET /api/vin/leads/:leadId/contact` endpoint:

1. **Reads** from warehouse_leads via `getWarehouseLeadBySourceId()` (line 719) to build a `cachedContact` fallback
2. Attempts a live VIN lookup via `vin_query_leads` + `vin_get_contact`
3. If live lookup succeeds: returns the fresh data directly via `res.json(flattenContactInfo(data))` -- **does NOT save it**
4. If live lookup fails: falls back to `cachedContact` from warehouse_leads (line 757)

**Key finding:** When a user clicks "View Contact" and the live VIN fetch succeeds, the fresh name/phone/email is returned to the frontend but **discarded on the server side**. The next request will fetch from VIN again. There is no write-back.

---

## Question 4: Is there a separate contacts table?

**NO.** There is no `contacts`, `contact_cache`, or similar table in `shared/schema.ts`. There are no contact caching methods in `server/storage.ts`.

The only place contact data is stored is `warehouse_leads.customer_name`, `warehouse_leads.customer_email`, and `warehouse_leads.customer_phone`.

---

## Summary: Contact Data Caching State

| Scenario | Fetches from VIN? | Persists to DB? | Where? |
|----------|-------------------|-----------------|--------|
| Initial sync (full/delta) | query_leads only | YES | warehouse_leads (but contact fields often null) |
| Background enrichment (metrics) | query_leads + get_contact | YES | warehouse_leads via upsertWarehouseLead |
| View Contact endpoint | query_leads + get_contact | NO | Returns in-memory only |
| Direct contact lookup `/api/vin/contacts/:id` | get_contact | NO | Returns in-memory only |

**Bottom line:** Contact data IS cached in warehouse_leads, but only by the initial sync (often incomplete) and the background enrichment (limited scope -- 20 leads, 14-day window, active_pipeline only). The View Contact endpoint, which does the most targeted per-lead contact fetch, does NOT cache its results. Every "View Contact" click triggers a fresh VIN API call.

**Opportunity:** Adding a write-back in the View Contact endpoint (`vendorProxy.ts` line ~750) would cache contact data for leads that users actively look at, reducing redundant VIN API calls and improving fallback reliability.
