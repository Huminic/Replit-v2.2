# Phase 8 — AI Chat & Agents

**Phase Description**
The AI chat experience — CRM Guru, Communication Agent, and Service
Agent. Streaming responses, tool use, knowledge base, VIN data queries.
This must rival ChatGPT in quality and responsiveness.

**Open Issues:** None specific — but quality needs verification
**Depends On:** Phase 1 (Auth), Phase 2 (Data — VIN data for queries)
**Status:** MOSTLY DONE — needs quality verification and tuning

---

---

SPRINT E-8.0 — Phase 8 Entry Inspection

WHY IT MATTERS
Before any work starts in this phase, verify the foundation is solid.
If a dependency is broken, everything built on top of it fails.

WHAT GETS BUILT
  (Exploratory — read only, no code changes)
  - Verify dependencies: Phase 1, 2
  - Check files this phase will touch for uncommitted changes:
    server/routes/chat.ts, client/src/pages/main.tsx, client/src/pages/agents.tsx
  - Read sprint descriptions — are they still accurate?
  - Check ghost_messages for unresolved directives
  - Check issues.md for any new issues affecting this phase
  - Run relevant Playwright tests for dependencies

HOW WE KNOW IT IS DONE
  - Dependencies confirmed working (not just committed — tested)
  - No uncommitted changes in phase files
  - No unresolved ghost directives affecting this phase
  - Sprint descriptions reviewed and confirmed accurate
  - Entry inspection report written to evidence/

FAILS IF
  - A dependency phase has unresolved issues
  - Uncommitted changes exist in files this phase will touch
  - Ghost directives are pending

VERIFICATION NOTES
  - This is a 15-minute read-and-verify, not a full audit
  - If issues found, resolve them before starting the phase
  - Ghost runs /ghost-check at this point


SPRINT V-8.1 — Verify Streaming Chat Quality

WHY IT MATTERS
The chat experience must be smooth, fast, and intelligent. If it feels
sluggish or gives bad answers, the product fails regardless of features.

WHAT GETS BUILT
  (Verification — assess current quality)
  FE
    - Verify streaming renders tokens progressively (not waiting for full response)
    - Verify thinking indicators show during processing
    - Verify conversation history persists
    - Verify chat input is responsive
  BE
    - Verify POST /api/chat/:conversationId/stream uses SSE correctly
    - Verify Claude model is configured and responding
    - Time the response: first token should appear within 2 seconds

HOW WE KNOW IT IS DONE
  - Chat renders tokens as they arrive (visible streaming)
  - Thinking animation shows while waiting
  - First token appears within 2 seconds of sending message
  - Chat history is maintained across page navigation
  - No console errors during chat

WHAT IT DOES NOT INCLUDE
  - Prompt tuning (Sprint G-8.3)
  - Tool improvements (Sprint G-8.4)

FAILS IF
  - Chat waits for full response before rendering (no streaming)
  - Response takes more than 5 seconds to start
  - Chat history is lost on navigation

VERIFICATION NOTES
  - Test from the Main page chat panel
  - Try several query types: greeting, VIN data query, general question
  - Compare feel to ChatGPT — note gaps

---

SPRINT V-8.2 — Verify Chat Tools (Web Search, VIN Query, Campaign Query)

WHY IT MATTERS
The AI agents use tools to access real data. If tools don't work,
the AI gives generic answers instead of data-driven ones.

WHAT GETS BUILT
  (Verification)
  BE
    - Verify search_vin_leads tool returns real VIN data
    - Verify search_web tool (Brave) returns search results
    - Verify query_campaigns tool returns campaign data
    - Verify create_task tool creates a task record

HOW WE KNOW IT IS DONE
  - Ask: "Show me leads from the last 7 days" → returns real data
  - Ask: "What's the weather in Birmingham?" → returns web search result
  - Ask: "How many campaigns are active?" → returns campaign count
  - Ask: "Create a task to follow up with John Smith" → task appears in tasks table

WHAT IT DOES NOT INCLUDE
  - New tools (not adding capabilities, just verifying existing ones)
  - Knowledge base queries (Sprint V-8.5)

FAILS IF
  - VIN query returns empty when warehouse has data
  - Web search fails or returns error
  - Tool calls throw exceptions visible to user

VERIFICATION NOTES
  - Depends on Phase 2 (warehouse must have data for VIN queries)
  - Test as different roles to verify org scoping

---

SPRINT G-8.3 — Agent Prompt Tuning

WHY IT MATTERS
The AI's personality and response quality depend on the system prompt.
Each agent type (CRM Guru, Communication Agent, Service Agent) needs
a well-crafted prompt that makes it useful and conversational.

WHAT GETS BUILT
  DT
    - Update agents.instructions for CRM Guru:
      Conversational tone, not report-formatted
      Aware of dealership context (org name, dealer type)
      Can reference VIN data naturally
      Suggests follow-up actions
    - Update agents.instructions for Communication Agent:
      Drafts emails and SMS templates
      Vehicle-specific when VIN data is available
      Professional but friendly tone
    - Update agents.instructions for Service Agent (Nancy Gaston):
      FAQ answers (pricing, scheduling, hours)
      References knowledge base
      Pivots to booking appointments

HOW WE KNOW IT IS DONE
  - CRM Guru answers data questions conversationally (not "Here is a table...")
  - Communication Agent produces polished email drafts
  - Service Agent answers service FAQ questions with real pricing
  - All agents mention the dealership name naturally

WHAT IT DOES NOT INCLUDE
  - New tool capabilities
  - Voice/video prompt (those are on VAPI/Tavus vendor side)

FAILS IF
  - Agents respond in report format instead of conversation
  - Agents don't know which dealership they're serving
  - Service Agent can't answer basic FAQ

VERIFICATION NOTES
  - This is a content sprint, not a code sprint
  - Test by having a multi-turn conversation with each agent
  - Compare to ChatGPT quality

---

SPRINT G-8.4 — Multi-Org Awareness for Chat

WHY IT MATTERS
Super Admin and Partner Admin see multiple orgs. When they ask
"Show me leads," the AI should know which org context they're in
and respond accordingly.

WHAT GETS BUILT
  BE
    - Verify chat context includes current org from auth middleware
    - Verify VIN queries scope to current org
    - Verify org switch changes the chat context

HOW WE KNOW IT IS DONE
  - As Super Admin on Serra Honda: "Show me leads" → Serra Honda leads
  - Switch to Hyundai: "Show me leads" → Hyundai leads
  - As Partner Admin: sees leads for whichever org is selected

FAILS IF
  - Chat returns data from wrong org
  - Org switch doesn't update chat context

VERIFICATION NOTES
  - Reference: architecture-map.md FLOW 11

---

SPRINT V-8.5 — Verify Knowledge Base

WHY IT MATTERS
The AI agents reference uploaded documents for FAQ answers, pricing,
and dealership-specific information.

WHAT GETS BUILT
  (Verification)
  BE
    - Verify document upload works (POST /api/documents)
    - Verify documents are associated with correct agent and org
    - Verify chat queries reference document content in responses
  FE
    - Verify document list shows uploaded files
    - Verify upload form works

HOW WE KNOW IT IS DONE
  - Upload a test document (e.g., service pricing sheet)
  - Ask the Service Agent about pricing → response references the document
  - Document appears in agent's knowledge base list

FAILS IF
  - Upload fails
  - AI doesn't reference uploaded documents in responses
  - Documents leak across orgs

VERIFICATION NOTES
  - Test with a small text document first
  - Verify org scoping — documents from Serra Honda shouldn't appear for Hyundai

---

**Phase 8 Summary**

| Sprint | Type | Issue | What |
|--------|------|-------|------|
| V-8.1 | Verify | — | Streaming chat quality |
| V-8.2 | Verify | — | Chat tools (VIN, web, campaigns) |
| G-8.3 | Gap | — | Agent prompt tuning |
| G-8.4 | Gap | — | Multi-org awareness |
| V-8.5 | Verify | — | Knowledge base |

---

SPRINT T-8.EXIT — Phase 8 Exit Inspection

WHY IT MATTERS
Before the next phase starts, confirm this phase is truly done.
Every sprint committed, every acceptance criterion verified,
every test passing.

WHAT GETS BUILT
  (Testing — no code changes)
  - Verify every sprint in this phase has status "committed" in sprints.json
  - Run acceptance criteria for this phase: AC 3.1-3.11
  - Run relevant Playwright tests
  - Check: did any sprint touch files outside its declared scope?
  - Write one-sentence verdict

HOW WE KNOW IT IS DONE
  - All sprints in this phase: status "committed" with valid hash
  - Acceptance criteria checked: Chat streams smoothly, tools return real data, agents have distinct personas, knowledge base works
  - Relevant Playwright tests pass
  - No files modified outside declared scope
  - Verdict written: "Phase 8 is SOLID" or "Phase 8 has issues: [list]"

FAILS IF
  - Any sprint not committed
  - Any acceptance criterion fails
  - Files modified outside scope
  - Verdict is not SOLID

VERIFICATION NOTES
  - Ghost runs /ghost-check at this point
  - If verdict is not SOLID, next phase is BLOCKED
  - Issues found become new sprints in THIS phase (not the next one)


**Phase 8 is DONE when:**
- Chat streams tokens smoothly (rivals ChatGPT responsiveness)
- VIN data queries return real, org-scoped data
- Each agent has a distinct personality and useful responses
- Knowledge base documents are referenced in AI answers
- Multi-org switching changes chat context correctly
