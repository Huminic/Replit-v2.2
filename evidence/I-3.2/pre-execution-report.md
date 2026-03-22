# Pre-Execution Report: I-3.2
Timestamp: 2026-03-22T19:54:06Z
Sprint: I-3.2
Status: READY

## Objective
Fix email notification template and recipient hierarchy. Copy working template from old app. Walk org hierarchy to include partner_admin for child store calls.

## Declared Files
- server/routes/webhooks.ts

## Success Criteria
- Template matches old app (/home/ubuntu/Live-Store/nexxus)
- Hyundai call → email to sam, durran, duane
- Ford call → email to durran, duane
- Serra Honda call → email to victoria, durran, duane
- CommGate OFF → no emails sent
- No admin@ addresses in recipients
