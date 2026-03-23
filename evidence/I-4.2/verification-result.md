# I-4.2 — Update VAPI Webhook URLs

**Sprint:** I-4.2
**Date:** 2026-03-22
**Action:** IRREVERSIBLE (owner-approved)
**Status:** COMPLETE

## Objective

Update the serverUrl on all active VAPI assistants from dev/legacy URLs to `https://live.huminic.app/api/webhooks/vapi`.

## Pre-Flight Check

Health endpoint verified:
```json
{"status":"ok","version":"2.2.0","uptime":10199,"timestamp":"2026-03-22T23:57:20.552Z","environment":"production"}
```

## Assistants Updated (10 total)

| Assistant | ID | Previous serverUrl | New serverUrl | Status |
|-----------|----|--------------------|---------------|--------|
| Caroline - Serra Honda | 90a876c0-0f11-4424-abfe-9ac82b264d88 | https://dev.huminicdev.com/api/webhooks/vapi | https://live.huminic.app/api/webhooks/vapi | CORRECT |
| Magnolia - Serra Nissan | 2203b188-a549-417b-ab33-075766e1b5c1 | https://dev.huminicdev.com/api/webhooks/vapi | https://live.huminic.app/api/webhooks/vapi | CORRECT |
| Georgia - Tony Serra Ford | ad478eb2-6602-42c5-9732-3d4648013307 | https://dev.huminicdev.com/api/webhooks/vapi | https://live.huminic.app/api/webhooks/vapi | CORRECT |
| Elizabeth - Hyundai of Columbia | 6d12a8fa-0ed0-4ec1-bfdb-e84587ff86c0 | https://dev.huminicdev.com/api/webhooks/vapi | https://live.huminic.app/api/webhooks/vapi | CORRECT |
| Savannah - Ford of Columbia | 6216451c-e0a3-43d0-aece-ae382bd8df25 | https://dev.huminicdev.com/api/webhooks/vapi | https://live.huminic.app/api/webhooks/vapi | CORRECT |
| Nancy - Serra Service | c777f029-8c4c-4a23-98e4-3adfd4112a61 | NOT SET | https://live.huminic.app/api/webhooks/vapi | CORRECT |
| Elliott - Test Assistant | c303d993-bf42-4784-a8cb-247477b1cbdd | https://dev.huminicdev.com/api/webhooks/vapi | https://live.huminic.app/api/webhooks/vapi | CORRECT |
| Christine - Quality Check | d019ff3d-201b-4e2b-bf6a-590c19569fc8 | https://dev.huminicdev.com/api/webhooks/vapi | https://live.huminic.app/api/webhooks/vapi | CORRECT |
| Andor | 10dbe3a9-0253-41f2-b41b-293dd6babb60 | https://mcp.huminicdev.com/vapi/webhook | https://live.huminic.app/api/webhooks/vapi | CORRECT |
| Old Liz | cf756351-3db4-4e8a-a7d6-1e23ffbb4e62 | https://nexxusdev.huminicdev.com/api/vapi/webhook | https://live.huminic.app/api/webhooks/vapi | CORRECT |

## Assistants Not Updated (9 — no serverUrl configured)

These assistants had no serverUrl set before and were left unchanged (unused/template assistants):

- Custom Dealership Assistant (fbca5062)
- D.A.R.I.A (03a35527)
- Gabrielle (f499e129)
- Jamie - Knowledge Assistant (a6cd73c6)
- Karen (d072c6b4)
- Luxury Car Sales Assistant (eff8f361)
- Morgan (2729bd0e)
- Riley (efef092e)
- Riley (77f54294)

## Verification

Post-update API query confirmed all 10 updated assistants now report `serverUrl: https://live.huminic.app/api/webhooks/vapi`. No assistants report old/incorrect URLs.

## Notes

- The sprint instructions listed "Carol" for Serra Service (c777f029), but the VAPI API returns the name as "Nancy Serra Service". Same ID, same assistant.
- Nancy/Serra Service previously had NO serverUrl set — it now has one.
- Andor and Old Liz were not in the sprint's known list but had active old URLs pointing to dev/legacy domains. They were updated to prevent stale webhook routing.
- Christine (Quality Check Specialist) was also not in the known list but had a dev URL. Updated for consistency.
