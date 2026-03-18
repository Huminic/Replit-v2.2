# T-4 Full Application Test Report
Date: 2026-03-18
Sprint: T-4 (post-REM-2)

## Summary

| Project | T-3 | T-4 | Change |
|---------|-----|-----|--------|
| Browser | 12 | **30** | **+18** |
| Catalog | 5 | 5 | 0 |
| API | 27 | 13* | -14* |
| Comms | 10 | 10 | 0 |

*API results corrupted — parallel A/B agents both restarted the server, causing 500s mid-run. Not a regression.

## Key Achievement
loginViaUI fix confirmed working. 18 previously blocked browser tests now pass. Tests that were timing out at 30s on form-based login now complete in <2s with API-based login.

## Browser Results (30/56 passed)

### Newly Passing (compared to T-3)
- 1.12 Org switch triggers full page refresh
- 1.13 Product tour shows on first login
- 1.14 Tour dismisses per-page
- 1.15 Huminic master org exists
- 2.1 Main page loads without errors
- 2.4 No right popout on main page
- 2.5 Metrics centered with chat below
- 3.1 Agent listings per role in left menu
- 3.2 Center chat layout on home page
- 3.3 Thinking indicators visible
- 3.10 Document upload works
- 3.11 Agent CRUD works
- 7.1-7.4 Manage pages render
- 8.1-8.3 System pages render
- 10.1-10.4 Mobile responsive tests pass

### Still Failing (25)
1. **Role login failures (9):** Tests 1.7-1.11, 6.2-6.5 — loginForBrowser returns non-ok for some roles. May be rate limiter or credential issue.
2. **Conversation API failures (6):** Tests 3.4-3.9 — POST /api/conversations fails. Conversation creation endpoint issue.
3. **UI element mismatches (5):** Tests 2.2, 2.3, 6.1, 7.5, 7.6 — selectors don't match current UI structure.
4. **Org hierarchy (1):** Test 1.16 — GET /api/organizations returns empty.
5. **Accessibility (2):** Tests 11.1, 11.2 — missing aria-labels and contrast.
6. **Other (2):** Tests 9.2, 9.3 — detail page elements not found.

## Parallel Agent Issue
Both agents restarted PM2 nexxus-app during their runs. Agent B's restart killed Agent A's server mid-test, causing 500s on login. Future A/B runs must be sequential (A finishes, then B starts) or use separate server instances.

## Verdict: FLAGGED
Significant improvement (+18 browser tests) but 25 browser failures remain. Most are now real issues (selectors, conversation API, role auth) rather than test infrastructure.
