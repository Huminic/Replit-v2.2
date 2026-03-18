# AC-1 Reconciliation Findings
Date: 2026-03-18

## Summary
85 criteria audited against current codebase. 71 accurate. 14 findings.

## Corrections Applied to acceptance_criteria.md
| Criterion | Change |
|-----------|--------|
| 2.3 | Clarified: AI Chat panel shows history+favorites (not agents), but dept sections DO show agents |
| 4.6 | Changed from "channel-specific pause" to "channel-specific flags (per org toggles)" — no mid-campaign pause exists |
| 5.11 | Added note: Workflows tab is disabled with "Coming Soon" message, not functional |
| 6.7 | Changed from "3 agents" to "dynamic count per org" — agent list is DB-driven |

## Confirmed Known Failures
| Criterion | Issue | Status |
|-----------|-------|--------|
| 4.10 | I-036: No agent processing for inbound SMS | Open |
| 11.2 | I-038: VAPI webhook returns 401 | Open |
| 11.6 | I-037: VAPI outbound calls lack context | Open |

## Additional Findings (not blocking, noted for awareness)
- 5.8: TeamBox outbound email endpoint exists (POST /api/conversations/:id/email) but UI integration is through a dialog — works but is API-first
- 12.3: Rate limiting exists via publicRateLimits map in sms.ts and checkPublicRate function — not a global Express middleware but present on sensitive endpoints
- 3.1: Agent listings appear in dept sections (sales/service/marketing) not in the AI Chat left panel — criterion description was ambiguous
