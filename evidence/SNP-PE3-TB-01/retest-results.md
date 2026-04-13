# SNP-PE3-TB-01 Retest Results

**Date:** 2026-04-07
**Tester:** Playwright MCP (automated interactive)
**Account:** serra_honda@huminic.ai (Serra Honda, org_admin)
**Build:** Post npm run build + pm2 restart

## Test 1: Message Role Styling (BUG-TB03-03)

**Result: PASS**

- Opened Website Visitor chat conversation (webchat channel)
- Agent messages (Caroline) are right-aligned with blue/primary background
- Customer messages (Website Visitor: "What SUVs do you have?") are left-aligned with muted/light background
- Role detection correctly identifies "user" role messages as customer (inbound)

**Evidence:** retest-full-teambox.png, retest-message-styling.png

## Test 2: Auto-Select (BUG-TB03-04)

**Result: PASS**

- Loaded TeamBox fresh after login
- Auto-selected conversation is "Website Visitor" (webchat) -- first item in the filtered conversation list
- This is NOT an ai-chat conversation
- Auto-select picks from filteredConversations, not the unfiltered array

**Evidence:** retest-full-teambox.png

## Test 3: Regression -- Filters and Thread Selection

**Result: PASS**

- TeamBox loads correctly with 7 conversations in "All" view
- SMS filter: shows 2 conversations (+1821616232, +1428670293)
- Email filter: shows 1 conversation (Stephanie Thompson)
- All filter: shows 7 conversations
- Thread selection: clicking +1821616232 loads its SMS thread with correct message display
- Customer Info panel updates correctly on selection
- Reply textbox present and functional

**Evidence:** retest-sms-filter.png, retest-sms-thread.png, retest-email-filter.png, retest-all-filter.png

## Summary

| Bug | Description | Status |
|-----|-------------|--------|
| BUG-TB03-03 | Message role styling wrong for "user" role | FIXED - verified |
| BUG-TB03-04 | Auto-select picks invisible ai-chat conversation | FIXED - verified |
| BUG-TB03-01 | VAPI call transcripts not linked | DOCUMENTED (backend change needed) |
| BUG-TB03-02 | Marketing email missing campaignId | DOCUMENTED (data ingestion issue) |

All 2 fixable bugs verified as resolved. No regressions detected.
