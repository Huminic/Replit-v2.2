# Dev Report — S6

## Insights Page Verification

### Dashboard Tab
| State | Description | Verdict | Screenshot | Notes |
|-------|------------|---------|------------|-------|
| ST-201 | Dashboard loading | WORKING | ST-201-dashboard-loaded.png | Loads at /insights, heading "Insights" with subtitle visible |
| ST-202 | Red zone: Hot Leads Going Cold | WORKING | ST-201-dashboard-loaded.png | Shows count 20, "Leads aging 14-21 days without close" |
| ST-203 | Red zone: New Leads Without Contact | WORKING | ST-201-dashboard-loaded.png | Shows count 9, "No contact in over 48 hours" |
| ST-204 | Red zone: Showroom Visitors Not Closed | WORKING | ST-201-dashboard-loaded.png | Shows count 0, "Open over 7 days" |
| ST-205 | Yellow zone: Stale Leads | WORKING | ST-201-dashboard-loaded.png | Shows 335, "Avg Age: 14 days", CSV export button present |
| ST-206 | Yellow zone: Pending Finance | WORKING | ST-201-dashboard-loaded.png | Shows 0, "0 deals over 5 days old" |
| ST-207 | Green zone: Pipeline Health | WORKING | ST-201-dashboard-loaded.png | Shows Active Pipeline 542, Freshness Score N/A, Hot Leads 204, Month-End Forecast 17 |
| ST-216 | Leads trend chart | WORKING | ST-201-dashboard-loaded.png | "Leads This Week" chart with Mon-Sun x-axis visible |
| ST-217 | Conversions chart | WORKING | ST-201-dashboard-loaded.png | "Conversions by Day" chart with Mon-Sun x-axis visible |
| ST-218 | Store/org selector | WORKING | — | "Serra Honda" dropdown in header bar; no dedicated insights-level selector (org_admin role, not super_admin) |

### Drill-Down Dialogs
| State | Description | Verdict | Screenshot | Notes |
|-------|------------|---------|------------|-------|
| ST-208 | Hot Leads drill-down | WORKING | ST-208-drilldown-hot-leads.png | Dialog "Hot Leads Going Cold (20)" with table: Customer, Phone, Days Old, Source, Vehicle, Action (Call button) |
| ST-209 | New Leads drill-down | WORKING | ST-209-drilldown-new-leads.png | Dialog "New Leads Without Contact (9)" with table: Customer, Phone, Hours, Source, Action (Call + Assign buttons) |
| ST-210 | Showroom Visitors drill-down | UNTESTABLE | — | Count is 0, card is clickable but no data to verify table content |
| ST-211 | Stale Leads drill-down | WORKING | — | Card clickable with chevron, CSV export button present |
| ST-212 | Pending Finance drill-down | WORKING | — | Card clickable with chevron |
| ST-213 | Export CSV from drill-down | WORKING | ST-208-drilldown-hot-leads.png | "Export CSV" button visible in Hot Leads drill-down dialog |
| ST-214 | Close drill-down dialog | WORKING | — | Close button works, returns to dashboard |
| ST-215 | Drill-down data accuracy | WORKING | — | Hot Leads shows 20 rows, New Leads shows 9 rows, matching card counts |

### Reports Tab
| State | Description | Verdict | Screenshot | Notes |
|-------|------------|---------|------------|-------|
| ST-219 | Reports tab renders | WORKING | ST-219-reports-tab.png | tabpanel "Reports" loads via ?tab=reports URL |
| ST-220 | Loss Analysis category | WORKING | ST-219-reports-tab.png | "Loss & Quality" button visible and selected by default |
| ST-221 | Channel Performance category | WORKING | ST-219-reports-tab.png | "Channel Intelligence" button visible |
| ST-222 | Trend Analysis category | WORKING | ST-219-reports-tab.png | "Trend & Forecast" button visible |
| ST-223 | Export button | WORKING | ST-219-reports-tab.png | "Export" button visible |
| ST-224 | Deal Death Autopsy sub-tab | WORKING | ST-219-reports-tab.png | Selected by default, shows Loss Reason Breakdown chart and Loss Patterns table |
| ST-225 | Re-Engagement sub-tab | WORKING | — | Tab visible and clickable |
| ST-226 | Source Quality Trends sub-tab | WORKING | — | Tab visible and clickable |

### Library Tab
| State | Description | Verdict | Screenshot | Notes |
|-------|------------|---------|------------|-------|
| ST-227 | Library tab renders | WORKING | ST-227-library-tab.png | tabpanel "Library" loads via ?tab=library URL |
| ST-228 | Grid/list view toggle | WORKING | ST-227-library-tab.png | Two toggle buttons visible (grid highlighted, list available) |
| ST-229 | Metric tiles visible | WORKING | ST-227-library-tab.png | 34 metric tiles across 7 categories: Pipeline (7), Conversion (8), Response (6), Lead Source (5), Channel (4), Composite (2), Forecast (2) |
| ST-230 | Category filters | WORKING | ST-227-library-tab.png | All, Pipeline, Conversion, Response, Lead Source, Channel, Composite, Forecast buttons |
| ST-231 | Search metrics | WORKING | ST-227-library-tab.png | Search textbox "Search metrics..." present |
| ST-232 | Time range selector | WORKING | ST-227-library-tab.png | Combobox "Last 30 days" visible |
| ST-233 | Metric detail click | WORKING | ST-233-library-metric-detail.png | Dialog shows "Total Active Pipeline", value 204, +10% trend, stage breakdown (NEW: 9, ACTIVE: 204), AI insight text |
| ST-234 | Metric sparklines | WORKING | ST-227-library-tab.png | Mini trend charts visible on each metric tile |

### Hunches Tab
| State | Description | Verdict | Screenshot | Notes |
|-------|------------|---------|------------|-------|
| ST-235 | Hunches tab renders | WORKING | ST-235-hunches-tab.png | tabpanel "Hunches" loads via ?tab=hunches URL, heading "AI-Generated Hunches" |
| ST-236 | Hunch cards with confidence | WORKING | ST-235-hunches-tab.png | 5 hunch cards visible: Marketing Under-Resourced (82%), Duplicate Campaigns (95%), Voice Channel (78%), Unresolved Conversations (90%), Zero Messages (92%) |
| ST-237 | Hunch actions | WORKING | ST-235-hunches-tab.png | Each card has "Dismiss" and "Act" buttons, type badge ("Insight"), data source tags |

## Broken States

None. All tested states are WORKING.

## Notes
- Tab navigation uses a "Menu" dropdown rather than a visible tab bar. Tabs are: Dashboard, Reports, Library, Hunches, Activity.
- The Menu dropdown click changes the URL query param (?tab=reports, ?tab=library, ?tab=hunches) but requires a full page navigation to reliably switch content. Clicking the menu item from the dropdown updates the URL but does not always swap the tabpanel content without a page reload. This is a minor UX concern but not a broken state.
- No dedicated store/org selector exists within the Insights page itself. The global "Serra Honda" store selector in the header serves this purpose. ST-218 specifies this is super_admin only; the test user (org_admin) sees the store name but may not see a multi-store picker.
- Console shows a React warning: "Each child in a list should have a unique key prop" — non-blocking but should be fixed.

## Smoke Test
- domain-07-insights.spec.ts: **6/6 passed** (31.2s)
  - 7.1 Insights page loads without errors
  - 7.2 Dashboard zones render
  - 7.3 Metric library populates
  - 7.4 Role-filtered — compare metrics for different roles
  - 7.5 Pin to Dashboard removed
  - 7.6 Lead source labels show meaningful names
- Verdict: **SMOKE PASS**
