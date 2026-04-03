# LV-001a Step 3: Dev Remediation

**Date:** 2026-04-03
**Sprint:** LV-001a
**Step:** 3 of 12

## Actions Taken

### Fix 1: Seed missing test accounts (TEST_DATA — 30 failures)
6 accounts created on staging DB (nbsbmjesgozcyxdtrtsw):
- serra_honda@huminic.ai (org_admin, Serra Honda)
- duanekwells@gmail.com (partner_admin, Cage Automotive)
- serra_nissan@huminic.ai (org_admin, Serra Nissan)
- serra_ford@huminic.ai (org_admin, Tony Serra Ford)
- columbia_hyundai@huminic.ai (org_admin, Hyundai of Columbia)
- columbia_ford@huminic.ai (org_admin, Ford of Columbia)

All verified: login returns JWT on dev.huminicdev.com.

### Bug Investigation Results

| Bug | Original Category | Reclassified | Reason | Issue |
|-----|------------------|-------------|--------|-------|
| 1.8 Executive sidebar | PRODUCT_BUG | TEST_ISSUE | RBAC spec says no Management for Executive. Test is wrong. | I-231 |
| 6.4/6.5 /management redirect | PRODUCT_BUG | TEST_ISSUE | Intentional guard, super_admin only per spec | I-231 |
| 11.14 Widget public endpoint | PRODUCT_BUG | TEST_DATA | No widgets seeded on staging | I-233 |
| 12.2 Header duplication | TEST_ISSUE | TEST_ISSUE (confirmed) | Caddy + Helmet both set nosniff | I-232 |

### Revised Categorization

| Category | Before | After | Change |
|----------|--------|-------|--------|
| TEST_DATA | 30 | 33 | +3 (bugs 2, 3 reclassified) |
| PRODUCT_BUG | 4 | 0 | -4 (all reclassified) |
| TEST_ISSUE | 1 | 2 | +1 (bug 1 reclassified) |
| Total | 35 | 35 | — |

### MVP Flow Impact After Remediation

- 30 TEST_DATA failures should clear (accounts seeded)
- 3 TEST_DATA failures may clear if seed created widgets + agents
- 2 TEST_ISSUE failures are accepted (spec conflict, header duplication)
- **0 PRODUCT_BUG failures remain**
