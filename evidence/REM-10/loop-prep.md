# Loop Prep: REM-10

## 1. Issue-to-Domain Assignment
| Issue | Domain | Sub-Sprint | Summary |
|-------|--------|------------|---------|
| I-095 | DT | REM-10-DT | Appointment source field defaults to "manual" |
| I-096 | BE | REM-10-BE | Email notification recipients don't walk org hierarchy — partner_admin missing from child store notifications |
| I-097 | AU | REM-10-AU | Durran on wrong org (Serra Honda, should be Cage Automotive) |
| I-098 | AU | REM-10-AU | Victoria missing additional_org_ids for Serra Nissan and Tony Serra Ford |
| I-099 | IN | REM-10-IN | VAPI assistant serverUrl still points to old app (nexxusv2.huminicdev.com) |
| I-100 | IN | REM-10-IN | Tavus webhook URL still points to old app |
| TI-015 | TI | REM-10-TI | live-comms.spec.ts callMCP response parsing broken |
| TI-016 | TI | REM-10-TI | RI-TAVUS-2 test queries single org for multi-dealer check |
| TI-017 | TI | REM-10-TI | sync.ts date fix not in compiled build |

## 2. Issue-to-Test Mapping
| Issue | Playwright Test(s) | Verification |
|-------|-------------------|--------------|
| I-095 | DC-US013-1 | Appointment source="widget" → GET returns "widget" |
| I-096 | RI-EMAIL-1 + manual verification | Hyundai call → email to sam, durran, duane |
| I-097 | RI-ORG-1 | Durran login → 6 accessible orgs |
| I-098 | Manual DB query | Victoria additional_org_ids contains Serra Nissan + Tony Serra Ford |
| I-099 | curl live.huminic.app/api/webhooks/vapi | Webhook responds, VAPI assistant updated |
| I-100 | curl live.huminic.app/api/webhooks/tavus | Webhook responds, Tavus webhook URL updated |
| TI-015 | LC-1 through LC-10 | All pass (currently 7 fail) |
| TI-016 | RI-TAVUS-2 | 5 personas found across all stores |
| TI-017 | RI-VIN-1 | warehouse_leads vinCreatedAt non-null |

## 3. Declared Files Per Sub-Sprint

### REM-10-AU (Auth/Data — I-097, I-098)
- Database UPDATE statements (Durran org, Victoria additional_org_ids)
- No application code changes

### REM-10-BE (Backend — I-096)
- server/routes/webhooks.ts (sendLeadNotificationEmail — walk partner_id chain)

### REM-10-DT (Data — I-095)
- server/routes/appointments.ts (preserve source field)

### REM-10-IN (Infrastructure — I-099, I-100)
- VAPI API calls to update assistant serverUrl (5 assistants)
- Tavus webhook URL update
- npm run build + pm2 restart (picks up sync.ts fix)

### REM-10-TI (Test Infrastructure — TI-015, TI-016, TI-017)
- tests/e2e/live-comms.spec.ts (callMCP parsing)
- tests/e2e/real-integrations.spec.ts (RI-TAVUS-2 test design)

## 4. Dependency Order
| Order | Sub-Sprint | Why First |
|-------|------------|-----------|
| 1 | REM-10-AU | Durran and Victoria must be correct before email tests |
| 2 | REM-10-BE | Email recipient logic must walk hierarchy before sending real emails |
| 3 | REM-10-DT | Appointment source fix |
| 4 | REM-10-IN | Rebuild app, update VAPI/Tavus URLs — must happen before real comms |
| 5 | REM-10-TI | Test infrastructure fixes — must happen before full test suite |
| 6 | VERIFY | Send test email to duanekwells@gmail.com, wait for confirmation |
| 7 | REPLAY | Replay March 18-19 calls, verify emails + VIN leads |
| 8 | ELLIOTT | Elliott → Caroline real call test |
| 9 | SMS | Real SMS tests with user's phone |
| 10 | SUITE | Full test suite run with all projects |

## 5. Prerequisites
| Prerequisite | Status |
|-------------|--------|
| User approval for email sends | REQUIRED — user must confirm test email before real sends |
| VAPI API key available | YES — VAPI_PRIVATE_KEY in .env |
| TextMagic numbers confirmed | YES — +18338096836 (send), +18339785374 (Serra receive), +18338935694 (receive) |
| User's phone for SMS test | YES — +14126546500 |
| Elliott script location | YES — /home/ubuntu/Live-Store/nexxus/tests/scripts/elliott-test-v2.ts |
| VIN Solutions access | YES — working (6,158 leads synced) |

## 6. Email Recipient Choreography (CRITICAL)

### When a call comes to Hyundai of Columbia:
1. Query users on Hyundai org → sam.mayfield@bc.auto (org_admin, level 3)
2. Walk UP via partner_id: Hyundai → Cage Automotive
3. Query users on Cage → durran@cageautomotive.com (partner_admin, level 2)
4. Query ALL orgs for super_admins → duane.wells@huminic.ai (level 1)
5. Send to: [sam, durran, duane]

### When a call comes to Ford of Columbia:
1. Query users on Ford org → (no real users after admin@ removed)
2. Walk UP via partner_id: Ford → Cage Automotive
3. Query users on Cage → durran@cageautomotive.com (partner_admin, level 2)
4. Query ALL orgs for super_admins → duane.wells@huminic.ai (level 1)
5. Send to: [durran, duane]

### When a call comes to Serra Honda:
1. Query users on Serra Honda → victoria@misscommunicationconsulting.com (org_admin, level 3)
2. Walk UP via partner_id: Serra Honda → Cage Automotive
3. Query users on Cage → durran@cageautomotive.com (partner_admin, level 2)
4. Query ALL orgs for super_admins → duane.wells@huminic.ai (level 1)
5. Send to: [victoria, durran, duane]

### When a call comes to Serra Nissan:
1. Query users on Serra Nissan → (no real users after admin@ removed)
2. Walk UP via partner_id: Serra Nissan → Cage Automotive
3. Query users on Cage → durran@cageautomotive.com (partner_admin, level 2)
4. Query ALL orgs for super_admins → duane.wells@huminic.ai (level 1)
5. Victoria has additional_org_ids including Serra Nissan → also included
6. Send to: [victoria, durran, duane]

### When a call comes to Tony Serra Ford:
1. Query users on Tony Serra Ford → (no real users after admin@ removed)
2. Walk UP via partner_id: Tony Serra Ford → Cage Automotive
3. Query users on Cage → durran@cageautomotive.com (partner_admin, level 2)
4. Query ALL orgs for super_admins → duane.wells@huminic.ai (level 1)
5. Victoria has additional_org_ids including Tony Serra Ford → also included
6. Send to: [victoria, durran, duane]

## 7. March 18-19 Call Replay
| Call ID | Assistant | Store | Customer Phone | VIN Dealer ID | Email Recipients |
|---------|-----------|-------|----------------|---------------|-----------------|
| 019d088a | Elizabeth | Hyundai of Columbia | +1 618-317-4312 | 13399 | sam, durran, duane |
| 019d087c | Savannah | Ford of Columbia | +1 615-308-3969 | 13398 | durran, duane |
| 019d0877 | Elizabeth | Hyundai of Columbia | +1 866-242-2720 | 13399 | sam, durran, duane |
| 019d062b | Savannah | Ford of Columbia | +1 864-546-2319 | 13398 | durran, duane |
| 019d0611 | Magnolia | Serra Nissan | +1 256-626-4331 | 21044 | victoria, durran, duane |
