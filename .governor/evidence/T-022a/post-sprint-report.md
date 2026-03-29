# T-022a Post-Sprint Report — AI Chat Functional Depth

**Sprint:** T-022a
**Target:** https://dev.huminicdev.com
**Test Account:** serra_honda@huminic.ai (org_admin)
**Timestamp:** 2026-03-27T01:20:00Z
**Result:** 11/12 PASS, 1/12 FAIL

---

## AC Results

| AC | Description | Result | Evidence |
|----|-------------|--------|----------|
| AC1 | Streaming < 8s | PASS | First token at 2919ms via Date.now() measurement |
| AC2 | Thinking indicators | PASS | Spinner class detected, animated SVG, "Thinking..." status text |
| AC3 | VIN data (leads query) | PASS | "20 leads for the last 7 days", VinSolutions CRM queried, sync lag warning |
| AC4 | Web search | PASS | "Searching the web..." status triggered, weather context returned with source references |
| AC5 | Task creation | **FAIL** | AI responds: "I'm not able to create tasks or calendar items." Task count unchanged (16). |
| AC6 | Multi-turn | PASS | 3rd message correctly references pipeline data from 1st (86 leads, waiting for response) |
| AC7 | Conversational tone | PASS | No "##" headers, no markdown tables. Tone is conversational with bold emphasis. |
| AC8 | Favorites | PASS | POST/GET/DELETE /api/favorites works. FavoritesBar component renders in UI. |
| AC9 | Delete conversation | PASS | DELETE /api/conversations/:id returns 200. Count decreased 80 to 79. |
| AC10 | Scroll / history count | PASS | 79 AI chat conversations (>= 20). ScrollArea in SubMenuManager handles list. |
| AC11a | Empty input | PASS | Returns `{"message":"Message content is required"}`, no crash. |
| AC11b | 500-char message | PASS | Full streamed response with pipeline analysis. |
| AC11c | Spanish message | PASS | "Hola, necesito ayuda con mi carro" -> full Spanish response from AI. |
| AC11d | Rapid messages | PASS | 3 concurrent messages all completed (20/22/22 content chunks each). |
| AC12 | Multi-role | PASS | super_admin, partner_admin, org_admin all login and reach /. Console errors are non-fatal auth race conditions. |

---

## AC5 Failure Detail

The AI chat does not have a task creation tool integrated. When asked "Create a task to follow up with John Smith tomorrow", the AI responds:

> I appreciate you thinking of me for that, but I'm not able to create tasks or calendar items — that's outside of what I can do in Nexxus Connect right now.

The `/api/tasks` endpoint exists and works (used by previous test suites to create tasks directly), but the AI chat's tool-calling system does not include a task creation function. This is a **feature gap**, not a bug.

**Recommendation:** Wire a `createTask` tool into the chat's function-calling schema (server/routes/chat.ts).

---

## Console Errors Observed (AC12)

All errors are non-fatal and non-role-specific:

1. **`Failed to create main chat conversation: TypeError: Failed to fetch`** — Race condition during login transitions where the chat auto-creates a conversation before auth state is fully established.
2. **`Conversation not found` (404)** — Stale conversation IDs stored in client state referencing previously deleted conversations.
3. **Auth refresh 400/401** — Expected during login/logout transitions when cookies are cleared.

None of these errors crash the application or block user interaction.

---

## Infrastructure Notes

- Chat uses SSE streaming via `/api/chat/:conversationId/stream`
- Conversations require explicit creation via `/api/conversations` with `channel: "ai-chat"`
- Auth uses in-memory access tokens (1h expiry) with httpOnly refresh cookies (7d expiry)
- Browser session stability is fragile during rapid page transitions (token loss causes redirects to /login)
- Tour overlay (`ProductTour` component) blocks interactions until dismissed; uses `nexxus_tour_dismissed_<page>` localStorage keys

---

## Test Methodology

- **AC1-AC2:** Playwright browser automation with Date.now() timing and DOM inspection
- **AC3-AC7, AC11:** Direct API calls via curl to `/api/chat/:id/stream` (SSE) for reliability
- **AC8-AC10:** API calls to `/api/favorites` and `/api/conversations` endpoints
- **AC12:** Playwright multi-login flow with console error capture
- Browser session instability required hybrid approach (Playwright + curl API)
