# Investigation Report: SNP-PE3-CHAT-01

**Date:** 2026-04-07
**Scope:** Vehicle of Interest field, Modal contact detail, AI Chat data source

---

## Investigation 1: Vehicle of Interest field from VIN Solutions

### Key Question
Does the VIN Solutions API return a vehicle description (like "2024 Honda Civic EX"), or only a URL/ID reference? What does the warehouse_leads table actually store?

### Findings

**Database schema** (`shared/schema.ts`, line 307):
- `warehouse_leads` table has a `vehicle_of_interest` column (text type).

**Sync transform** (`server/sync.ts`, line 22):
```
vehicleOfInterest: (Array.isArray(raw.vehiclesOfInterest) && raw.vehiclesOfInterest.length > 0
  ? String(raw.vehiclesOfInterest[0]) : null)
  || raw.vehicle?.description
  || raw.vehicleOfInterest
  || null,
```
The transform tries three sources in order:
1. `raw.vehiclesOfInterest[0]` -- an array on the lead object (stringified)
2. `raw.vehicle?.description` -- a description string on a vehicle sub-object
3. `raw.vehicleOfInterest` -- a flat field

**What VIN Solutions actually returns:** The VIN Solutions API's `vin_query_leads` response includes vehicle data. Evidence from `server/routes/chat.ts` (line 368) confirms the AI chat reads `l.vehicle?.description` when formatting lead summaries for the LLM. This implies the API does return a `vehicle.description` field (e.g., "2024 Honda Civic EX").

However, the `vehiclesOfInterest` array elements may be URLs or IDs rather than description strings. When `String(raw.vehiclesOfInterest[0])` is called, it could produce a URL like `"https://api.vinsolutions.com/..."` or `"[object Object]"` rather than a human-readable description. The sync code tries `String()` on whatever element is in the array without extracting a description property.

**VIN API endpoints for vehicle data:**
- `GET /api/vin/leads/:leadId/trade-vehicles` (line 767-778 of `vendorProxy.ts`) -- fetches trade vehicles via `vin_get_trade_vehicles`
- `POST /api/vin/leads/:leadId/vehicles-of-interest` (line 879-895) -- adds vehicle of interest via `vin_add_vehicle_of_interest`
- `GET /api/vin/vehicle-catalog` (line 820-835) -- searches the vehicle catalog

**Frontend display** (`client/src/pages/main.tsx`, line 269-275, 379):
- The ContactDetailView shows `leadRow.vehicleOfInterest` if present.
- The Active Pipeline table shows `row.vehicleOfInterest` in the Vehicle column.

### Answer
The VIN Solutions API **does** return vehicle description data. The `vehicle.description` field on lead objects contains human-readable strings. However, the `vehiclesOfInterest` array may contain objects/URLs that get naively stringified. The warehouse stores whatever the sync transform produces. If the sync runs and `vehiclesOfInterest` array elements are objects (not strings), the stored value could be `"[object Object]"` instead of a proper description.

### Recommendation
- Inspect the actual `vehiclesOfInterest` array structure from a live API response to determine if elements are strings, URLs, or objects.
- If they are objects, extract `.description` or `.year + .make + .model` from each element before storing.
- The `raw.vehicle?.description` fallback is likely the reliable source for a human-readable string.

---

## Investigation 2: Modal contact detail button

### Findings

**Metric tile click flow** (`client/src/pages/main.tsx`):
1. **Metric tiles** are rendered on the MainPage (line 558+). Clicking a tile sets `selectedMetric` state (line 566).
2. **MetricDetailDialog** (line 318-556) opens as a Dialog when `selectedMetric` is set.
3. It queries `/api/metrics/pipeline/details?metric={metricKey}` (line 328-331) to fetch row-level detail data.
4. For the `active_pipeline` metric, each row has a **"View Contact" button** (line 382-392) that calls `setViewingContact({ leadId: row.sourceId, row })`.
5. **ContactDetailView** (line 174-316) renders when `viewingContact` is set. It queries `/api/vin/leads/${leadId}/contact` (line 181-184).

**Server route** (`server/vendorProxy.ts`, lines 711-765):
- `GET /api/vin/leads/:leadId/contact` exists and works.
- It first checks the warehouse cache for basic info (name, phone, email).
- Then tries a live VIN Solutions lookup: queries all leads in 90-day window, finds the matching leadId, extracts the contact ID from the href, and fetches full contact info via `vin_get_contact`.
- Falls back to cached data if VIN lookup fails.

**URL-based query parameter:**
- The `?conversationId=X` parameter (line 577-590) is for resuming chat conversations, not for loading contact data. There is no URL-based contact query parameter.
- The contact detail load is purely state-driven (React state from clicking "View Contact" in the modal).

### Answer
The modal contact detail button works through a multi-step flow:
1. Click metric tile -> opens MetricDetailDialog
2. Click "View Contact" on a pipeline row -> sets state to show ContactDetailView
3. ContactDetailView calls `GET /api/vin/leads/:leadId/contact`
4. Server route exists at `vendorProxy.ts` line 711 and functions correctly (with cache fallback)

There are no URL-based query parameters for loading contacts. The only URL param is `?conversationId=X` for chat resumption.

---

## Investigation 3: AI Chat data source

### Findings

**Chat route** (`server/routes/chat.ts`):
The AI chat system gives Claude access to data through two mechanisms:

**A. System prompt context (loaded on every message, lines 125-275):**
- Organization info, team members, agents
- Accepted hunches (AI insights) with confidence levels
- Knowledge base documents (up to 32KB)
- Data freshness info (last sync times)
- Recent activity logs (last 15 events)
- Campaign data (last 10 campaigns with sent/replied counts)
- Page context (what page the user is currently viewing)

**B. Tool use (on-demand, lines 41-93):**
- `vin_query_leads` -- queries VIN Solutions directly via MCP (line 348-371). Returns lead data with name, status, source, vehicle description.
- `vin_lead_summary` -- queries VIN Solutions for aggregate metrics (line 374-418). Calculates total, new, active, sold, conversion rate with period-over-period changes.
- `web_search` -- Brave web search for current information.
- `query_campaigns` -- queries local campaign database.

**Dashboard tiles data source** (`server/routes/metrics.ts`):
- `GET /api/metrics/pipeline` calls `storage.getPipelineMetrics()` (line 28-36).
- This queries the **local warehouse_leads table** (not VIN Solutions directly) for active pipeline, plus appointments, tasks, and outbound_log tables.
- The pipeline count uses a 14-day window, excluding LOST/SOLD/BAD/DUPLICATE/SERVICE statuses.

**Comparison:**

| Data Point | Dashboard Tiles | AI Chat |
|---|---|---|
| Active Pipeline | warehouse_leads table (14-day, local) | VIN Solutions API (direct, 30-day default) |
| Appointments | appointments table (local) | NOT directly available (no tool) |
| Escalations | tasks table (local) | NOT directly available (no tool) |
| Outbound Sent | outbound_log table (local) | NOT directly available (no tool) |
| Lead Summary | N/A (tiles use pipeline) | VIN Solutions API (direct) |
| Campaigns | N/A | Local DB via query_campaigns tool |
| Activity Logs | N/A | Last 15 events in system prompt |

### Answer
The AI chat and the dashboard tiles use **different data sources**:

1. **Dashboard tiles** query the **local warehouse** (synced copy of VIN data, plus local tables for appointments/tasks/outbound).
2. **AI chat** queries **VIN Solutions directly** via MCP tools for lead/metric questions. It does NOT have access to pipeline metrics (active pipeline, appointments today, escalations, outbound sent) that the dashboard tiles show.

The AI chat has **broader but different** data access:
- It can query VIN Solutions live (fresher data)
- It has campaign data, activity logs, knowledge base, and hunches in context
- It does NOT have the 4 specific pipeline tile metrics (active pipeline, appointments today, escalations, outbound sent)
- It has no tool for appointments or escalation queries

### Recommendation
- Add a `pipeline_metrics` tool to the AI chat that calls `storage.getPipelineMetrics()` so the chat can reference the same numbers the user sees on the dashboard tiles.
- Alternatively, inject the pipeline data into the system prompt context (similar to how activity logs are injected).
- This would prevent confusion when a user asks "how many active pipeline leads do I have?" and gets a different number from the chat than what the tile shows (because the chat queries VIN directly with different date ranges and filters).

---

## Summary of Recommendations

### Investigation 1 (Vehicle of Interest)
1. **Verify** the actual structure of `vehiclesOfInterest` array elements from a live VIN API response.
2. **Fix** `sync.ts` line 22: if array elements are objects, extract `.description` or compose `year + make + model` instead of `String()`.
3. The `vehicle.description` fallback path is likely the reliable one.

### Investigation 2 (Modal Contact Detail)
1. **No issues found.** The flow works: tile click -> dialog -> "View Contact" button -> ContactDetailView -> `/api/vin/leads/:leadId/contact` endpoint.
2. No URL-based query parameter is used for contacts. The only URL param is `?conversationId=X` for chat.

### Investigation 3 (AI Chat Data Source)
1. **Data mismatch risk:** Dashboard tiles and AI chat use different sources and time windows.
2. **Add pipeline metrics tool** to chat so it can report the same numbers the tiles show.
3. **Missing from chat:** appointments today, open escalations, outbound sent 24h. Consider adding tools or system prompt injection for these.

---

## File References

| File | Key Lines | Purpose |
|---|---|---|
| `shared/schema.ts` | 297-320 | warehouse_leads table schema with vehicleOfInterest column |
| `server/sync.ts` | 11-29 | transformVinLead -- extracts vehicle data from VIN API response |
| `server/vendorProxy.ts` | 711-765 | GET /api/vin/leads/:leadId/contact endpoint |
| `server/vendorProxy.ts` | 527-550 | GET /api/vin/leads endpoint (raw VIN query) |
| `server/routes/metrics.ts` | 28-36, 38-124 | Pipeline metrics + details endpoints |
| `server/storage.ts` | 802-850 | getPipelineMetrics -- local warehouse query (14-day window) |
| `server/storage.ts` | 855-895 | getPipelineMetricDetails -- returns rows with vehicleOfInterest |
| `server/routes/chat.ts` | 41-93 | Chat tools definition (vin_query_leads, vin_lead_summary, etc.) |
| `server/routes/chat.ts` | 125-275 | System prompt construction with context injection |
| `server/routes/chat.ts` | 348-371 | vin_query_leads tool execution -- reads vehicle.description |
| `client/src/pages/main.tsx` | 174-316 | ContactDetailView component |
| `client/src/pages/main.tsx` | 318-556 | MetricDetailDialog with View Contact button |
| `client/src/pages/main.tsx` | 558-590 | MainPage with tile click and URL param handling |
