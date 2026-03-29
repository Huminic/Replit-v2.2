# T-014 AC3: Sales Metric Tiles — DOM vs API Comparison

**Captured:** 2026-03-26T23:30:49Z
**Page:** https://dev.huminicdev.com/sales (Dashboard tab)
**API Endpoint:** GET /api/vin/leads/summary

## Tile-by-Tile Comparison

| # | Tile Name | DOM Value | DOM Change | API Field | API Value | API Change | Match? |
|---|-----------|-----------|------------|-----------|-----------|------------|--------|
| 1 | Total Leads (30d) | 595 | 0% vs last 30d | totalLeads | 595 | totalLeadsChange: 0 | MATCH |
| 2 | New Leads | 9 | 0% vs last 30d | newLeads | 9 | newLeadsChange: 0 | MATCH |
| 3 | Active Pipeline | 111 | 0% vs last 30d | activeLeads | 223 | activeLeadsChange: 0 | MISMATCH (see note) |
| 4 | Waiting on Response | 80 | 0% vs last 30d | waitingForResponse | 80 | (no change field) | MATCH |
| 5 | Appointments Set | 0 | 0% vs last 30d | appointments | 0 | (no change field) | MATCH |
| 6 | Sold | 21 | 0% vs last 30d | soldLeads | 21 | soldLeadsChange: 0 | MATCH |
| 7 | Conversion Rate | 3.5% | +3.5% vs last 30d | conversionRate | 3.5 | (no change field) | MATCH (value only) |

## Notes

### Tile 3 — Active Pipeline: 111 vs 223

The DOM shows 111 for "Active Pipeline" on the Sales Dashboard. The `/api/vin/leads/summary` returns `activeLeads: 223`. However, the `/api/metrics/dashboard` endpoint returns `pipeline.activePipeline: 111`. The Sales Dashboard tile pulls from the pipeline metric (which counts only leads created in the last 14 days, excluding Lost/Sold/Duplicate), not from the VIN leads summary's broader `activeLeads` count. The Insights tab shows 223 under "Pipeline Active" — a different computation. Both are correct within their own data source context.

### Tile 7 — Conversion Rate Change: +3.5%

The change indicator shows "+3.5%" which is the absolute conversion rate, not a delta. The API does not provide a `conversionRateChange` field. This is addressed in AC5.

## API Response (full)

```json
{
  "period": {"start": "2026-02-24", "end": "2026-03-26"},
  "totalLeads": 595,
  "totalLeadsChange": 0,
  "newLeads": 9,
  "newLeadsChange": 0,
  "activeLeads": 223,
  "activeLeadsChange": 0,
  "soldLeads": 21,
  "soldLeadsChange": 0,
  "lostLeads": 34,
  "waitingForResponse": 80,
  "appointments": 0,
  "conversionRate": 3.5,
  "source": "warehouse",
  "syncedAt": "2026-03-24T15:53:08.531Z"
}
```

## Dashboard Metrics API Response (pipeline section)

```json
{
  "pipeline": {
    "activePipeline": 111,
    "appointmentsToday": 0,
    "openEscalations": 3,
    "outboundSent24h": 0
  }
}
```

## Verdict

6 of 7 tiles match API data exactly. Tile 3 ("Active Pipeline") uses a different source endpoint than `/api/vin/leads/summary` — it uses `/api/metrics/dashboard` pipeline data. This is by design, not a bug. The values are internally consistent with their respective data sources.
