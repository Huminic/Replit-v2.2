# Re-Verification Round 3 — org_admin (Serra Honda)

**Date:** 2026-04-07  
**Account:** serra_honda@huminic.ai (org_admin)  
**Verifier:** Independent agent (did not write any application code)

---

## Test 1: Session Stability on Insights — FAIL

- Navigated to /insights via sidebar. Page loaded correctly with real Serra Honda data.
- **Data displayed:** Hot Leads Going Cold: 20, New Leads Without Contact: 20, Pipeline Active: 164, Conversion Rate: 2.4%, Total Leads: 456, Total Sold: 11.
- **"Last updated" timestamp:** "8:54 AM" — dynamic, matches actual server time. PASS.
- **Activity tab:** No Activity tab visible in the Insights page DOM. Only a "Dashboard" tabpanel exists with no tab switcher. Could not verify Activity tab content.
- **Session stability: FAIL.** During a 30-second wait on Insights, the page redirected from /insights to /settings/system after ~20-25 seconds. Console shows `Failed to load resource: the server responded with a status of 400` on `/api/auth/refresh`. Session was lost and redirected to /login multiple times during testing (4 total session drops across the session). This is a recurring auth refresh bug.

## Test 2: Sales Page — PASS

- Clicked "Sales" in sidebar. Navigated to /sales (not /service). Correct.
- **Real data confirmed:** Total Leads 456, New Leads 36 (+100%), Active Pipeline 107 (+64%), Waiting on Response 97, Sold 11 (-45%), Conversion Rate 2.4%. Source labeled "Warehouse — Synced 1h ago."
- Sub-tabs present: Dashboard, Agents, Insights, Calendar.
- Top Performing Agents: Data Guru, Sales Coach, Communication Writer, Caroline.
- Recent Activity: real timestamped events (Login Failed, Auto Greeting Sent, Vapi Call Received, Sync Backfill).
- Session was stable for the duration of the Sales page test (~10 seconds before navigating away).

## Test 3: Sidebar Routing — PASS

All three routes resolved correctly on first click:

| Click | Expected | Actual | Result |
|-------|----------|--------|--------|
| Service | /service | /service | PASS |
| TeamBox | /teambox | /teambox | PASS |
| Insights | /insights | /insights | PASS |

No double-clicks needed. Each sidebar button navigated to the correct page immediately.

---

## Summary

| Test | Verdict |
|------|---------|
| 1. Session Stability on Insights | **FAIL** — auth refresh 400 causes redirect after ~20s |
| 2. Sales Page | **PASS** |
| 3. Sidebar Routing | **PASS** |

**Critical issue:** `/api/auth/refresh` returns HTTP 400, causing repeated session loss and redirects to /login. This affected all pages, not just Insights. Four session drops occurred during this test session.
