# Dev Report — S5

## I-172: Token Refresh Fix
- Applied by Captain in AgentChatView.tsx
- Pre-flight refresh on isTokenExpiringSoon()
- 401 retry with fresh token
- Cannot live-test until deploy (live site serves old bundle)

## I-155: Marketing Metrics
- API response for `campaignStats.byDepartment.marketing`:
  ```json
  {
    "total": 9,
    "active": 0,
    "sent": 0,
    "replied": 0,
    "replyRate": 0
  }
  ```
- Global campaign stats: `active=28`, `totalSent=11`, `totalReplied=2`, `replyRate=18`
- Marketing department: `total=9` campaigns exist, but `active=0`, `sent=0`, `replied=0`
- Zeros are: **REAL DATA** — the marketing department field exists and is populated. There are 9 marketing campaigns in the system but none are active, and none have sent or received replies. The API returns correct structured data with real zero values.
- Status: **NOT A BUG** — dashboard zeros accurately reflect the backend state. Marketing campaigns exist but are inactive/unused.

## Smoke Test
- s5-marketing.spec.ts: **12/12 passed** (29.8s)
- All ACs verified: no Campaigns tab, correct tab order, Studio filters, 5 marketing agents, dashboard metrics, Photo Studio response, Copywriter response, no duplicate agent lists, no hardcoded trends
- Verdict: **SMOKE PASS**
