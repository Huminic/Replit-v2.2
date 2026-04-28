# Priority 5 — Read-only runtime probe

Generated: 2026-04-28T00:38:28.562Z
Base URL: https://dev.huminicdev.com

## Failing /api/* requests by route

| route | method | status | url | failure |
|---|---|---|---|---|
| TeamBox | GET | (net-fail) | https://dev.huminicdev.com/api/agents?department=sales | net::ERR_ABORTED |
| TeamBox | GET | (net-fail) | https://dev.huminicdev.com/api/agents?department=marketing | net::ERR_ABORTED |
| TeamBox | GET | (net-fail) | https://dev.huminicdev.com/api/agents?department=service | net::ERR_ABORTED |
| TeamBox | GET | (net-fail) | https://dev.huminicdev.com/api/conversations?channel=ai-chat | net::ERR_ABORTED |
| TeamBox | GET | (net-fail) | https://dev.huminicdev.com/api/metrics/pipeline | net::ERR_ABORTED |
| TeamBox | GET | (net-fail) | https://dev.huminicdev.com/api/conversations | net::ERR_ABORTED |
| TeamBox | GET | (net-fail) | https://dev.huminicdev.com/api/notifications | net::ERR_ABORTED |
| TeamBox | GET | (net-fail) | https://dev.huminicdev.com/api/conversations?channel=ai-chat | net::ERR_ABORTED |
| Sales | GET | (net-fail) | https://dev.huminicdev.com/api/favorites | net::ERR_ABORTED |
| Sales | GET | (net-fail) | https://dev.huminicdev.com/api/organizations/24d64f99-ba04-4b43-af35-fd06f555ac86 | net::ERR_ABORTED |
| Sales | GET | (net-fail) | https://dev.huminicdev.com/api/notifications | net::ERR_ABORTED |
| Sales | GET | (net-fail) | https://dev.huminicdev.com/api/agents | net::ERR_ABORTED |
| Sales | GET | (net-fail) | https://dev.huminicdev.com/api/users | net::ERR_ABORTED |
| Sales | GET | (net-fail) | https://dev.huminicdev.com/api/campaigns | net::ERR_ABORTED |
| Sales | GET | (net-fail) | https://dev.huminicdev.com/api/notifications/unread-count | net::ERR_ABORTED |
| Service | GET | (net-fail) | https://dev.huminicdev.com/api/organizations/24d64f99-ba04-4b43-af35-fd06f555ac86 | net::ERR_ABORTED |
| Service | GET | (net-fail) | https://dev.huminicdev.com/api/agents?department=service | net::ERR_ABORTED |
| Service | GET | (net-fail) | https://dev.huminicdev.com/api/metrics/dashboard | net::ERR_ABORTED |
| Service | GET | (net-fail) | https://dev.huminicdev.com/api/notifications | net::ERR_ABORTED |
| Service | GET | (net-fail) | https://dev.huminicdev.com/api/agents?department=marketing | net::ERR_ABORTED |
| Service | GET | (net-fail) | https://dev.huminicdev.com/api/agents | net::ERR_ABORTED |
| Service | GET | (net-fail) | https://dev.huminicdev.com/api/vin/leads/summary | net::ERR_ABORTED |
| Service | GET | (net-fail) | https://dev.huminicdev.com/api/agents?department=sales | net::ERR_ABORTED |
| Service | GET | (net-fail) | https://dev.huminicdev.com/api/notifications/unread-count | net::ERR_ABORTED |
| Service | GET | (net-fail) | https://dev.huminicdev.com/api/activity-log?limit=10 | net::ERR_ABORTED |
| Service | GET | (net-fail) | https://dev.huminicdev.com/api/favorites | net::ERR_ABORTED |
| Marketing | GET | (net-fail) | https://dev.huminicdev.com/api/metrics/dashboard | net::ERR_ABORTED |
| Marketing | GET | (net-fail) | https://dev.huminicdev.com/api/agents?department=service | net::ERR_ABORTED |
| Marketing | GET | (net-fail) | https://dev.huminicdev.com/api/organizations/24d64f99-ba04-4b43-af35-fd06f555ac86 | net::ERR_ABORTED |
| Marketing | GET | (net-fail) | https://dev.huminicdev.com/api/conversations | net::ERR_ABORTED |
| Marketing | GET | (net-fail) | https://dev.huminicdev.com/api/campaigns/execution-statuses | net::ERR_ABORTED |
| Marketing | GET | (net-fail) | https://dev.huminicdev.com/api/conversations?channel=ai-chat | net::ERR_ABORTED |
| Marketing | GET | (net-fail) | https://dev.huminicdev.com/api/agents?department=marketing | net::ERR_ABORTED |
| Marketing | GET | (net-fail) | https://dev.huminicdev.com/api/activity-log?limit=8 | net::ERR_ABORTED |
| Marketing | GET | (net-fail) | https://dev.huminicdev.com/api/campaigns?department=service | net::ERR_ABORTED |
| Marketing | GET | (net-fail) | https://dev.huminicdev.com/api/notifications/unread-count | net::ERR_ABORTED |
| Marketing | GET | (net-fail) | https://dev.huminicdev.com/api/favorites | net::ERR_ABORTED |
| Marketing | GET | (net-fail) | https://dev.huminicdev.com/api/agents?department=sales | net::ERR_ABORTED |
| Marketing | GET | (net-fail) | https://dev.huminicdev.com/api/agents | net::ERR_ABORTED |
| Marketing | GET | (net-fail) | https://dev.huminicdev.com/api/notifications | net::ERR_ABORTED |
| Insights | GET | (net-fail) | https://dev.huminicdev.com/api/organizations/24d64f99-ba04-4b43-af35-fd06f555ac86 | net::ERR_ABORTED |
| Insights | GET | (net-fail) | https://dev.huminicdev.com/api/agents | net::ERR_ABORTED |
| Insights | GET | (net-fail) | https://dev.huminicdev.com/api/favorites | net::ERR_ABORTED |
| Insights | GET | (net-fail) | https://dev.huminicdev.com/api/notifications/unread-count | net::ERR_ABORTED |
| Insights | GET | (net-fail) | https://dev.huminicdev.com/api/agents?department=service | net::ERR_ABORTED |
| Insights | GET | (net-fail) | https://dev.huminicdev.com/api/agents?department=marketing | net::ERR_ABORTED |
| Insights | GET | (net-fail) | https://dev.huminicdev.com/api/metrics/dashboard | net::ERR_ABORTED |
| Insights | GET | (net-fail) | https://dev.huminicdev.com/api/notifications | net::ERR_ABORTED |
| Settings AI | GET | (net-fail) | https://dev.huminicdev.com/api/insights/library?lookbackDays=30 | net::ERR_ABORTED |
| Settings AI | GET | (net-fail) | https://dev.huminicdev.com/api/insights/reports | net::ERR_ABORTED |
| Settings AI | GET | (net-fail) | https://dev.huminicdev.com/api/agents?department=sales | net::ERR_ABORTED |
| Settings AI | GET | (net-fail) | https://dev.huminicdev.com/api/conversations?channel=ai-chat | net::ERR_ABORTED |
| Settings AI | GET | (net-fail) | https://dev.huminicdev.com/api/activity-log?limit=50 | net::ERR_ABORTED |
| Settings AI | GET | (net-fail) | https://dev.huminicdev.com/api/agents | net::ERR_ABORTED |
| Settings AI | GET | (net-fail) | https://dev.huminicdev.com/api/insights/dashboard | net::ERR_ABORTED |
| Settings AI | GET | (net-fail) | https://dev.huminicdev.com/api/agents?department=service | net::ERR_ABORTED |
| Settings AI | GET | (net-fail) | https://dev.huminicdev.com/api/notifications | net::ERR_ABORTED |
| Settings AI | GET | (net-fail) | https://dev.huminicdev.com/api/organizations/24d64f99-ba04-4b43-af35-fd06f555ac86 | net::ERR_ABORTED |
| Settings AI | GET | (net-fail) | https://dev.huminicdev.com/api/favorites | net::ERR_ABORTED |
| Settings AI | GET | (net-fail) | https://dev.huminicdev.com/api/hunches | net::ERR_ABORTED |
| Settings AI | GET | (net-fail) | https://dev.huminicdev.com/api/agents?department=marketing | net::ERR_ABORTED |
| Settings AI | GET | (net-fail) | https://dev.huminicdev.com/api/notifications/unread-count | net::ERR_ABORTED |

## Console/page errors matching criticalConsole patterns

(none captured)

## All console errors (for context)

(none captured)