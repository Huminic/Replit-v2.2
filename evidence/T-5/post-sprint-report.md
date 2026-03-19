# Post-Sprint Report: T-5
Timestamp: 2026-03-19T02:30:00Z
Sprint: T-5
Status: COMPLETE

## Results

| Project | Passed | Failed | Skipped | Total |
|---------|--------|--------|---------|-------|
| API | 19 | 16 | 5 | 40 |
| Browser | 30 | 22 | 4 | 56 |
| Comms | 10 | 1 | 1 | 12 |
| Catalog | 5 | 0 | 0 | 5 |
| **Total** | **64** | **39** | **10** | **113** |

## Improvement over T-4
- Browser: 30 (same as T-4)
- API: 19 (down from T-4's corrupted 27 — this is the clean baseline)
- Comms: 10 (stable)
- Catalog: 5 (stable)

## Key Findings
- Rate limiter at 100 eliminated 429 errors
- Token cache working — no rate limit interference
- TI fixes (selectors, payloads) improved chat tests 3.4-3.9
- Auth session persistence still main blocker (14 browser tests redirect to /login)

## Verdict: FLAGGED
64/113 passed. Significant issues remain in auth session persistence.

## Governance Note
This sprint's evidence was not created at execution time. It is being retroactively documented to correct a governance violation where T-5 results were folded into ALN-1's commit without proper T-5 artifacts. The test data is accurate — it was captured and reported during the session.
