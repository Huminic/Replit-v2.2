# T-2 Agent A Concordance Report

Agent A ran the full 113-test suite independently. Results compared against orchestrator's run.

## Agent A Results
| Project | Passed | Failed | Skipped |
|---------|--------|--------|---------|
| API | 14 | 13 | 5+8 did not run |
| Browser | 13 | 42 | 1 |
| Comms | 10 | 1 | 1 |
| Catalog | 5 | 0 | 0 |
| **Total** | **42** | **56** | **15** |

## Orchestrator Results
| Project | Passed | Failed | Skipped |
|---------|--------|--------|---------|
| API | 22 | 13 | 5 |
| Browser | 9 | 46 | 1 |
| Comms | 10 | 1 | 1 |
| Catalog | 5 | 0 | 0 |
| **Total** | **46** | **60** | **7** |

## Concordance
- Comms and Catalog: identical results
- API: Agent A had more rate-limit failures (8 "did not run") due to running without file-based token cache
- Browser: Agent A passed 4 more browser tests (13 vs 9) — likely different rate-limit timing

## Additional Findings from Agent A (not in orchestrator's initial analysis)
1. Campaign execute/stop endpoints return 404 (not 500 as initially categorized)
2. FLEXPRICE_API_KEY missing from .env — root cause of billing data issues
3. Widget embed endpoint returns 404 (/api/widgets/embed/test-org)
4. Entitlements endpoint returns 404
5. Demand Score tile not found by selector
6. Test bug: invalid CSS selector `text=/agent/i` in 6.7/6.8
7. Test bug: 1.6 checks body.message but API returns body.error

All additional findings logged in issues.md as I-045 through I-047 and TI-006/TI-007.
