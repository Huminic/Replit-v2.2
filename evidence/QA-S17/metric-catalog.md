# Nexxus Connect v2.2 — Metric Catalog

## Main Page (4 metrics)
| Metric | API | Calculation |
|--------|-----|-------------|
| Active Pipeline | /api/metrics/pipeline | Leads created last 14d, excluding Lost/Sold/Duplicate |
| Appointments Today | /api/metrics/pipeline | Scheduled appointments for today |
| Open Escalations | /api/metrics/pipeline | Active escalations (VIN push failures, unsent msgs) |
| Outbound Sent 24h | /api/metrics/pipeline | Messages sent across all channels in 24h |

## Sales Dashboard (7 metrics)
| Metric | API | Calculation |
|--------|-----|-------------|
| Total Leads (30d) | VIN Solutions | Sum all leads in 30d period |
| New Leads | VIN Solutions | Status = NEW |
| Active Pipeline | VIN Solutions | Active leads |
| Waiting on Response | VIN Solutions | Status = WAITING |
| Appointments Set | VIN Solutions | Scheduled appointments |
| Sold | VIN Solutions | Status = SOLD |
| Conversion Rate | Calculated | (sold / total) × 100% |

## Service Dashboard (6 metrics)
| Metric | API | Calculation |
|--------|-----|-------------|
| Active Campaigns | /api/metrics/dashboard | service department active count |
| Messages Sent | /api/metrics/dashboard | service department sent count |
| Replies Received | /api/metrics/dashboard | service department replied count |
| Open Conversations | /api/metrics/dashboard | open conversation count |
| Total Conversations | /api/metrics/dashboard | total conversation count |
| Reply Rate | Calculated | (replied / sent) × 100% |

## Marketing Dashboard (4 metrics)
| Metric | API | Calculation |
|--------|-----|-------------|
| Campaign Performance | /api/metrics/dashboard | marketing replyRate % |
| Campaigns Active | /api/metrics/dashboard | marketing active count |
| Messages Sent | /api/metrics/dashboard | marketing sent count |
| Replies Received | /api/metrics/dashboard | marketing replied count |

## Management Dashboard (6 metrics)
| Metric | API | Calculation |
|--------|-----|-------------|
| Active Pipeline | /api/metrics/dashboard | pipeline.activePipeline |
| Active Agents | /api/metrics/dashboard | agentCounts.active |
| Total Conversations | /api/metrics/dashboard | conversationCounts.total |
| Open Escalations | /api/metrics/dashboard | pipeline.openEscalations |
| Outbound Sent 24h | /api/metrics/dashboard | pipeline.outboundSent24h |
| Active Campaigns | /api/metrics/dashboard | campaignStats.active |

## Insights Dashboard (15+ metrics)
| Metric | API | Calculation |
|--------|-----|-------------|
| Total Leads | /api/insights/dashboard | Count leads in 30d |
| Hot Leads | /api/insights/dashboard | Status = ACTIVE/HOT |
| New Leads | /api/insights/dashboard | Status = NEW |
| Sold | /api/insights/dashboard | Status = SOLD |
| Conversion Rate | Calculated | (sold / total) × 100% |
| Hot Leads Going Cold | redZone | Active leads > 2 days old |
| New Leads No Contact | redZone | New leads missing phone/email |
| Showroom Not Closed | redZone | Walk-in source, not SOLD |
| Stale Leads | yellowZone | Not updated > 7 days, not SOLD |
| Pending Finance | yellowZone | PENDING_FINANCE status |
| Pipeline Velocity | warehouse | metricsMap["pipeline_velocity"] |
| Pipeline Freshness | warehouse | metricsMap["pipeline_freshness"] |
| Month End Forecast | warehouse | metricsMap["month_end_forecast"] |
| Lead Source Distribution | Calculated | Count per source / total × 100% |
| Channel Conversion | Calculated | Won per channel / volume × 100% |
