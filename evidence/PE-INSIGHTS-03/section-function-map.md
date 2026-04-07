# PE-INSIGHTS-03 Section Function Map

**Date:** 2026-04-07
**Page:** /insights
**Account:** serra_honda@huminic.ai (Serra Honda, org_admin)

## Page Header
- Title: "Insights" with subtitle "Analytics, reports, and AI-generated intelligence"
- Org context: "Serra Honda" visible in top bar

## Tab Bar (5 tabs, all functional)
| Tab | URL Param | Purpose |
|-----|-----------|---------|
| Dashboard | (default) | Action alerts, performance metrics, pipeline health, charts |
| Reports | ?tab=reports | Loss & Quality, Channel Intelligence, Trend & Forecast sub-reports |
| Library | ?tab=library | Metric card library with category filters (Pipeline, Conversion, Response, Lead Source, Channel, Composite, Forecast) |
| Hunches | ?tab=hunches | AI-generated strategic insights with confidence scores and actionable recommendations |
| Activity | ?tab=activity | Chronological activity log (campaigns, calls, SMS, agent changes) |

## Dashboard Tab Sections
| Section | Function | Data State |
|---------|----------|------------|
| Immediate Action Required | 3 alert cards: Hot Leads Going Cold (20), New Leads Without Contact (20), Showroom Visitors Not Closed (0) | Populated with real counts |
| Watch List | Stale Leads (0), Pending Finance (0) | Partially populated |
| Today's Performance | Pipeline Active (162), Conversion Rate (2.4%), Total Leads (452) | Populated |
| Pipeline Health | Active Pipeline (452), Freshness Score (Stale/31%), Hot Leads (162/36%), Month-End Forecast (11/-39 vs 50) | Populated |
| Performance Scorecard | Win Rate (2.4%), Total Sold (11), Hot Leads (162), Total Leads (452) | Populated |
| Leads This Week chart | Bar chart with daily lead generation (Wed-Tue axis, 0-28 range) | Rendered with data |
| Conversions by Day chart | Bar chart with daily closings (Wed-Tue axis) | Rendered with data |

## Reports Tab Sub-Reports
| Sub-Report | Function | Data State |
|------------|----------|------------|
| Loss & Quality (default) | Loss Reason Breakdown chart, Bad Lead Breakdown chart, Loss Patterns by Source table | Charts rendered with data; table has 7 source rows |
| Channel Intelligence | Channel performance metrics | Available |
| Trend & Forecast | Monthly summary, rolling forecast, YoY | Available |

## Library Tab
| Category | Card Count | Data State |
|----------|------------|------------|
| All | 20+ metric cards | Populated |
| Pipeline | Total Active Pipeline (162), Daily New Lead Volume (0), Weekly Lead Trend (14.3/day), MoM Lead Growth (-78%), Lead Velocity Rate (15.1/day), Pipeline Stagnation Index (0), Fresh Lead Ratio (34%) | Populated with trend indicators |
| Conversion | Overall Win Rate (2.4%), Internet Close Rate (0%), Walk-In Close Rate (0%), Service-to-Sales (not connected), Hot Lead Conversion (0%) | Populated |

## Hunches Tab
| Element | Description |
|---------|-------------|
| AI-Generated Hunches | 4+ insight cards with titles, descriptions, confidence scores |
| Card 1 | "Service Department Severely Under-Resourced for Campaigns" - Confidence: 75% |
| Card 2 | "Form Channel Dominates Inbound -- Underutilizing Voice & AI" - Confidence: 82% |
| Card 3 | "Automated Workflow Campaigns Flooding Sales Pipeline" - Confidence: 82% |
| Card 4 | "Campaigns Generating Zero Engagement Across the Board" |
| Each card | Has Dismiss and Act buttons, entity tags, and confidence percentages |

## Activity Tab
| Element | Description |
|---------|-------------|
| Activity Log | Chronological list of system events (Agent CRUD, Campaign lifecycle, SMS/VAPI webhooks) |
| Events | Timestamped entries with icons and descriptions |
| Data | Shows real events from test suite execution (4/7/2026 timestamps) |

## Sidebar Navigation
- Insights link IS present in sidebar (BUG-INS-12 from PE-INSIGHTS-02: FIXED)

## Drill-Down Modals
| Trigger | Modal Content |
|---------|---------------|
| "Stale Leads" card | Opens modal: "Stale Leads - Leads approaching 28-35 days without resolution", shows count (0), avg age, Export Full List (CSV) button, Close button |
| "View Details" (Pipeline Health) | Expected to open pipeline detail |
| "View Details" (Performance Scorecard) | Expected to open scorecard detail |

## CSV Export
- Dashboard: CSV button visible on Watch List section
- Modal: "Export Full List (CSV)" button in drill-down modals
- Reports tab: Export button visible
