# Dev Report — S10

## I-102: Photo Studio
- Agent exists: YES
- Agent ID: `3ea9b301-262f-41fd-ab8e-3e163dc7575a`
- Department: marketing
- Status: active
- Channels: chat
- UI presence: Visible in Marketing > Agents tab, card shows "1 session, Last used 16h ago"
- Chat response: Agent responds immediately with "Sorry, I encountered an error connecting to the AI service. Please try again."
- Image generation: NOT WORKING — `/api/openai-proxy` returns server error (console log: `Failed to load resource: the server responded with a status of 501`)
- Verdict: BROKEN — agent exists and accepts messages, but the AI backend proxy is failing (501). No image generation occurs.
- Screenshot: `screenshots/photo-studio-error.png`

## I-138: Unauthorized Agent
- Found in API: YES
- Agent ID: `b2b41cb5-48f7-4090-a285-97a0397cdd5c`
- Department: sales
- Status: active
- Channels: voice, video
- Description: "Should fail"
- Instructions: null
- Visible in Sales UI: YES — appears as 5th card in Sales > Agents tab, also listed in "Top Performing Agents" sidebar widget
- Verdict: PRESENT (needs removal)
- Screenshot: `screenshots/sales-agents-all.png`

## Smoke Test
- domain-06-departments.spec.ts: 7 passed, 1 failed (40.8s)
- Failed test: `6.5 Demand Score tile visible on Management` — expects Demand Score tile on Management page but element count is 0
- Passing tests: 6.1 Sales, 6.2 Service, 6.3 Marketing, 6.4 Management loads, 6.6 No Billing in Sales sidebar, 6.7 Sales submenu agents, 6.8 Service submenu agents
- Verdict: SMOKE FAIL (1 of 8 tests failing — Demand Score tile missing from Management dashboard)
