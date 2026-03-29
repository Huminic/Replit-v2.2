# Post-Sprint Report: Remediation Retest (R-014 through R-017)

**Date:** 2026-03-27T04:15Z
**Target:** https://dev.huminicdev.com
**Test Account:** serra_honda@huminic.ai
**Tester:** Verification Agent (automated)

---

## Results Summary

| Fix | Issue | Status | Verdict |
|-----|-------|--------|---------|
| R-014 I-134 | Landing page route | PASS | Landing page renders at `/p/serra-honda` without redirect |
| R-014 I-135 | CORS on widget endpoint | PASS | Returns `access-control-allow-origin: *` with HTTP 200 |
| R-015 I-148 | Role Switcher removed | PASS | No ArrowDownRight dropdown in TopBar |
| R-016 I-139 | Data Guru name fix | PASS | Agent named "Data Guru" (not "CRM Guru") in DB and UI |
| R-017 I-141 | Webhook transcript fix | DEPLOYED, NEEDS LIVE TEST | Code deployed; most recent voice conv has 1 system message (summary). Needs a new VAPI call to verify real-time transcript storage. |
| R-017 I-143 | Business hours TCPA | PASS | `isWithinBusinessHours()` defined at line 224, called in `checkCommGate()` at line 267 for SMS and phone channels |
| R-017 I-144 | Blacklist in CommGate | PASS | `getBlacklistEntry()` called at line 289 inside `checkCommGate()` for SMS channel, blocks with reason |

---

## Detailed Evidence

### R-014 I-134: Landing Page Route Fix
- **URL tested:** `https://dev.huminicdev.com/p/serra-honda`
- **Result:** Page URL remained at `/p/serra-honda` (no redirect to `/login` or `/`)
- **Content confirmed:** "Serra Honda" heading, "Let's schedule a VIP test drive" form, "We are here for you 24/7" hero section
- **Screenshot:** `landing-page-serra-honda.png`

### R-014 I-135: CORS Fix
- **Command:** `curl -s -I -H "Origin: https://example.com" https://dev.huminicdev.com/widget/dealer/serra-honda.js`
- **Result:** HTTP 200, header `access-control-allow-origin: *` present
- **Previous behavior:** HTTP 500
- **No CORS errors in response**

### R-015 I-148: Role Switcher Removed
- **Observation:** TopBar contains: "Nexxus Connect" logo, "Serra Honda" org selector, globe icon, notification bell (50), phone icon, dark mode toggle, user avatar "SHA". No ArrowDownRight dropdown visible anywhere.
- **Screenshot:** `topbar-no-role-switcher.png`

### R-016 I-139: Data Guru Name Fix
- **API check:** `GET /api/agents` returns agent named "Data Guru" (id: c997a384), department: sales. Zero agents with "CRM Guru" in name.
- **UI check:** Sales > Agents sidebar shows: Caroline, Data Guru, Sales Coach, Communication Writer. No "CRM Guru" reference.
- **Seed data:** `server/seed.ts:447` defines agent as "Data Guru"
- **Screenshot:** `sales-agents-data-guru.png`

### R-017 I-141: Webhook Transcript Fix
- **Voice conversations found:** 28 total
- **Most recent:** id=a4e31e51, created 2026-03-27T03:39:47Z, has 1 message (system summary)
- **Assessment:** Code is deployed. The existing voice conversation has a summary but transcript storage from webhook requires a new inbound VAPI call to verify the full pipeline.
- **Status:** DEPLOYED, NEEDS LIVE TEST

### R-017 I-143: Business Hours TCPA
- **Function:** `isWithinBusinessHours(org)` at `server/outbound.ts:224`
- **Reads:** `settings.businessHoursStart` (default "8") and `settings.businessHoursEnd` (default "21")
- **Integration:** Called at line 267 inside `checkCommGate()` for channels "sms" and "phone"
- **Gate behavior:** Returns `{ allowed: false, reason: "Outside business hours..." }` when outside hours

### R-017 I-144: Blacklist in CommGate
- **Check location:** `server/outbound.ts:287-296` inside `checkCommGate()`
- **Mechanism:** `storage.getBlacklistEntry(customerContact, org.id)` called for SMS channel
- **Gate behavior:** Returns `{ allowed: false, reason: "Recipient blacklisted (reason: ...)" }`
- **Also present:** TextMagic-specific blacklist check at line 99 (defense in depth)

---

## Evidence Artifacts

| File | Description |
|------|-------------|
| `landing-page-serra-honda.png` | Full-page screenshot of `/p/serra-honda` landing page |
| `topbar-no-role-switcher.png` | TopBar screenshot showing no role switcher dropdown |
| `sales-agents-data-guru.png` | Sales page showing "Data Guru" agent name (not "CRM Guru") |

---

## Summary

6 of 7 checks passed outright. The webhook transcript fix (I-141) is deployed but requires a live VAPI call to generate a new voice conversation and confirm transcript messages are stored correctly. All other fixes are verified working on the live dev environment.
