# AI Chat / Main Dashboard — Section Function Map

## What This Page Does
The main page serves two purposes: (1) AI-powered chat for CRM queries and natural language interaction, and (2) a real-time metrics dashboard showing 4 key pipeline indicators.

## Layout
- **Top Bar**: Organization switcher (store dropdown), user profile, notifications
- **Metric Tiles (4)**: Active Pipeline (14-day), Appointments Today, Open Escalations, Outbound Sent (24h)
- **Chat Area**: Message history, streaming AI responses, suggestion chips
- **Input Area**: Textarea + send button + new conversation button

## Metric Tiles
| Tile | Data Source | Time Window | Drill-Down |
|------|-----------|-------------|------------|
| Active Pipeline | warehouseLeads (excluding LOST/SOLD/DUPLICATE/SERVICE/BAD) | 14 days | Table of leads with name, phone, source, status, date |
| Appointments Today | appointments (status=scheduled) | Today | Table with customer, time, type |
| Open Escalations | tasks (type=escalation, status=todo) | All open | Table with description, priority, assigned |
| Outbound Sent 24h | outboundLog (status=sent) | 24 hours | Table with recipient, channel, time, status |

## Chat Behavior
- Streaming SSE responses from Claude via /api/chat/{conversationId}/stream
- AI has tools: web_search, vin_query_leads
- 4 random suggestion chips shown before first message
- Tiles collapse after first message sent
- Auto-scroll on new messages (KNOWN BUG: scrollRef targets wrong DOM node)
- Thinking cards show AI reasoning (expandable)

## Store Switching
- Org switcher in TopBar changes currentOrganization in AppContext
- All metrics re-fetch with new orgId
- Chat context resets

## Drill-Down
- Click any metric tile -> MetricDetailDialog opens
- Shows table of contributing records
- Each row has "View Contact" button -> ContactDetailView
- ContactDetailView fetches live CRM data from VIN Solutions via /api/vin/leads/{leadId}/contact

## Configurable Elements
- None directly on this page (metrics are computed, not configurable)
- Chat behavior depends on agent persona configuration (separate Settings page)

## Role Access
- All authenticated roles can access this page
- Metric data is org-scoped (users see only their org's data)
- Super_admin and partner_admin can switch orgs
