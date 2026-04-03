# LV-001a Step 6: Ghost Gate — Retest Verification

**Date:** 2026-04-03T14:52:00Z
**Input:** evidence/LV-001a/step-5-retest-results.md
**Gate:** Verify retest categorization is complete and remediation path is clear

---

## Checkpoint 1: Test Run Was Real

**PASS**

Evidence of real execution present:
- Timestamp: 2026-04-03T14:35:14Z
- Command: `BASE_URL=https://dev.huminicdev.com npx playwright test tests/e2e/domain-*.spec.ts --reporter=list`
- Duration: 2m 43s
- Counts: 93 passed, 8 failed, 1 skipped (total 102)
- Baseline comparison: 45/36/1 (Step 1) vs 93/8/1 (Step 5)

No signs of fabrication. Duration is plausible for 102 domain tests against a remote target.

## Checkpoint 2: Improvement Is Genuine

**PASS**

- Pass delta: +48 (45 to 93)
- Fail delta: -28 (36 to 8)
- The report explains 28 distinct failures fixed, with cascade tests (tests that failed because an earlier test in the same file failed first) accounting for the additional +20 in the pass column.
- Root cause is consistent: 27 serra_honda@huminic.ai 401 errors + 2 duanekwells@gmail.com 401 errors + 2 voice config 404s + 1 widget endpoint = 32 directly or indirectly resolved by the seed fix in Step 3.
- No new failures introduced (NEW_FAILURE = 0). This confirms the seed fix was clean.

## Checkpoint 3: Remaining Failures Categorized

**PASS**

All 8 remaining failures have complete classification:

| Test | Category | MVP Flow | Status | Complete? |
|------|----------|----------|--------|-----------|
| 1.8 | TEST_ISSUE | SH-1 | ACCEPTED (I-231) | Yes |
| 4.10 | INTEGRATION | SV-1 | STILL_FAILING | Yes |
| 5.9 | INTEGRATION | SF-1 | STILL_FAILING | Yes |
| 6.4 | TEST_ISSUE | SH-2 | ACCEPTED (I-231) | Yes |
| 6.5 | TEST_ISSUE | SH-2 | ACCEPTED (I-231) | Yes |
| 6.7 | TEST_DATA | SH-2 | STILL_FAILING | Yes |
| 6.8 | TEST_DATA | SH-2 | STILL_FAILING | Yes |
| 12.2 | TEST_ISSUE | SH-5 | ACCEPTED (I-232) | Yes |

Every failure has: error description, category, MVP flow mapping, and disposition. No uncategorized failures exist.

## Checkpoint 4: Accepted Failures Have Issues

**PASS**

- **I-231** (issues.md line 197): "Spec conflict: Executive role + Management page." Covers tests 1.8, 6.4, 6.5. Status: OPEN (post-launch). Correctly identified as a spec conflict, not a product bug.
- **I-232** (issues.md line 198): "Security header duplication: nosniff, nosniff." Covers test 12.2. Status: OPEN. Root cause documented (Caddy + Helmet both set the header).

Both issues exist, have clear descriptions, and are correctly classified as non-MVP-blocking.

## Checkpoint 5: STILL_FAILING Tests Identified

**PASS**

4 tests remain STILL_FAILING with root cause analysis:

| Test | Root Cause | Severity | Pre-existing Issue? |
|------|-----------|----------|-------------------|
| 4.10 | AI reply pipeline gap after campaign reply | Medium | I-183 (issues.md line 156) |
| 5.9 | Webhook phone-to-org mapping lookup fails | Medium | I-195 (issues.md line 153) |
| 6.7 | No agent menu items seeded for test org | Low | No dedicated issue |
| 6.8 | Same root cause as 6.7 | Low | No dedicated issue |

**Note:** Tests 6.7 and 6.8 share a root cause (agent sidebar menu items not populated). They do not have dedicated issues in issues.md, but the root cause is documented in the retest report and their category (TEST_DATA) implies a seed/fixture fix, not an application code fix. These should be tracked if they enter a remediation loop.

## Checkpoint 6: No Flows Fully Blocked

**PASS**

MVP Flow Status from the report:

| Flow | Status | Assessment |
|------|--------|-----------|
| SF-1 Web Chat | PARTIAL | 1 of ~11 tests failing (5.9) — flow functional, webhook routing edge case |
| SF-2 Tavus Video | PASS | No failures |
| SF-4 VAPI Inbound | PASS | No failures |
| SF-5 Walk-In | PASS | No failures |
| SV-1 Campaign | PARTIAL | 1 of ~9 tests failing (4.10) — CRUD + send works, AI reply gap |
| SH-1 TeamBox | PASS* | Accepted test issue only |
| SH-2 VIN Integration | PARTIAL | 2 STILL_FAILING (sidebar agents) + 2 ACCEPTED — core VIN flow works |
| SH-3 Kill Switch | PASS | No failures |
| SH-4 Auth + RBAC | PASS | No failures |
| SH-5 Email | PASS* | Accepted test issue only |

No flow is fully blocked. All PARTIAL flows have their core functionality passing with isolated edge-case failures. Remediation can proceed without restarting any flow.

---

## Verdict

**STEP 6 GHOST GATE: PASSED**

Categorization is complete. All 8 failures are classified with category, MVP flow, and disposition. 4 are accepted under tracked issues (I-231, I-232). 4 are identified for remediation (Step 7). No uncategorized failures. No fully blocked flows. The remediation path is clear:

- **4.10, 5.9**: Integration issues with pre-existing issue tracker entries (I-183, I-195). Fix is test-side or requires investigation of the webhook pipeline.
- **6.7, 6.8**: Test data issue (shared root cause). Fix is seeding agent records for the test org's sidebar.

The sprint may proceed to Step 7 (remediation loop for STILL_FAILING tests).
