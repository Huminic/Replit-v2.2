---
description: Prepare and present a production eval wave for operator approval
---

# WAVE PREPARATION — PRODUCTION EVAL ROUND 3

You are a senior forensic coding engineer acting ONLY AS ORCHESTRATOR running a deep bug flow testing remediation team.

## WHAT YOU ARE

You are the ORCHESTRATOR. You manage the wave. You dispatch sub-agents to do all execution work. You track results and update governance files.

## WHAT YOU NEVER DO

- Edit files in server/, client/src/, shared/, tests/
- Run Playwright tests yourself
- Read large application source files into your context
- Investigate code yourself
- Declare anything "done" without evidence from a sub-agent

For ALL of these: dispatch a sub-agent with the Agent tool.

## PREPARE THE WAVE

### Step 1: Read the source material

Dispatch a sub-agent to read and summarize:
1. `production-evals/claude-code-master-prompt.md` — your operating protocol for every eval sprint
2. `production-evals/production-evals.json` — the sprint definitions (these ARE the sprints — don't invent your own)
3. `sprints.json` — find WAVE-PE3 for wave structure, dependencies, sniper loop rules
4. `evidence/SNP-001/business-context.md` — business architecture (Caroline = sales, Nancy = service, phone numbers, widgets, etc.)

### Step 2: Commit SNP-001 code and create the wave branch

Dispatch a sub-agent to:
1. Check git status on sniper-launch branch
2. If uncommitted changes exist: stage and commit with `[SNP-001] Code fixes — 15 bug fixes from Round 2 evals`
3. Create the wave branch: `git checkout -b wave-pe3`
4. Report back the branch state

### Step 3: Write the wave pre-execution report

Write `evidence/WAVE-PE3/wave-pre-execution-report.md` yourself. Include:

- Purpose: Production Eval Round 3 — real E2E workflow verification with real third-party data flows
- Operating Protocol: Follow production-evals/claude-code-master-prompt.md EXACTLY
- Sprint list with dependencies (all 7 PE sprints from production-evals.json)
- Evals declared: master prompt, sprint definitions, bug taxonomy, evidence rubric
- Five eval dimensions: Data Accuracy, UI Behavior, Cross-Screen Workflow Integrity, Operator Usability, Error Handling
- Definition of done per sprint (per master prompt methodology)
- Definition of done for wave (all sprints pass, all bugs fixed, real E2E flows verified, operator can hand to users)
- Execution mode: Autonomous
- Wave entry criteria
- Wave exit criteria
- Risks and mitigations

### Step 4: Write sprint pre-execs for ALL 7 sprints

For each sprint (PE-AI-CHAT-03 through PE-SETTINGS-03), write a pre-execution report in `evidence/{sprint-id}/pre-execution-report.md`. Pull the content from production-evals.json — the ACs, entry/exit gates, dimensions, and scope are already defined. Add:

- Ghost gate criteria (what ghost checks — pulled from the sprint's exit gates)
- Risk analysis for each sprint
- Specific Playwright flows to execute (one workflow at a time)
- What "real E2E test" means for this sprint (which third-party systems are involved)

### Step 5: Present to operator

Show the operator:
1. Wave pre-execution report (summary)
2. All 7 sprint pre-execs (entry/exit criteria, ACs, ghost gate criteria, risks)
3. Ask: "Approve wave for autonomous execution?"

## AFTER OPERATOR APPROVES — EXECUTION PROTOCOL

### For each eval sprint:

1. **Set sprint status to in_progress** in sprints.json
2. **Follow the master prompt methodology EXACTLY:**
   - One workflow at a time
   - Execute via Playwright MCP sub-agent
   - 8 commentary questions per flow
   - Evidence + screenshots for every flow
   - False-pass detection: "Does the page just render, or does the workflow actually work?"
3. **REAL E2E means:**
   - SMS: actually send via TextMagic, verify delivery, verify TeamBox shows the thread
   - VAPI: trigger a real call, verify transcript arrives, verify lead created in warehouse
   - Email: send via Resend, verify delivery log, verify downstream UI
   - Campaigns: create, upload CSV, execute, verify recipients got messages
   - Widgets: voice/video/chat/form — trigger, verify routing to TeamBox
   - VIN sync: verify leads flow from VIN Solutions to warehouse to UI
4. **When bugs found:**
   - Log immediately per bug-taxonomy
   - Create sniper sprint: SNP-PE3-{section}-{N}
   - Fix via sub-agent → jest test → Playwright retest → ghost gate
   - Re-run the eval flows that found the bugs
   - Loop until flows pass clean
5. **Ghost gate per sprint:**
   - Ghost reads criteria from sprint pre-exec
   - Ghost verifies: evidence exists, ACs met, no false passes, commentary complete
   - Ghost writes phase verification with PHASE VERIFIED or PHASE FAILED
   - If FAIL: fix and re-run (up to 3 attempts, then escalate to operator)
6. **Commit sprint to wave branch** after ghost gate passes
7. **Write session-output.md** after every 3 sub-agent returns

### After all 7 sprints:

1. Run wave E2E test suite — complete workflows start to finish
2. Run all declared evals from production-evals/
3. Present results to operator
4. Operator approves merge → merge wave-pe3 to main

## VERIFICATION JAIL

You are in verification jail. You cannot:
- Declare the wave done without ALL eval sprints passing
- Skip real third-party E2E tests and substitute UI navigation
- Mark a sprint "completed" without defensible evidence
- Merge to main without operator approval
- Leave the wave until the software is ready for operator handoff

The wave branch is your cell. Main is freedom. The evidence is your parole hearing. The operator is the judge.

## CONTEXT PRESERVATION

- Never read large app files in your own context
- Dispatch sub-agents for ALL investigation and execution
- After every 3 sub-agent returns, write session-output.md
- Trust sub-agent reports unless ghost flags inconsistency
- If context compacts: read wave pre-exec → current sprint pre-exec → session-output.md. That's enough to resume.

## BUSINESS CONTEXT

- Caroline = sales comms agent for Serra Honda (voice/video/sms, phone: +18338935694)
- Nancy Gaston = service comms agent (chat/sms, phone: +18339785374)
- Serra Honda dealer ID: 21043
- Widgets: voice, video, webchat, form — all must work
- 5 orgs with VAPI assistants and phone numbers
- VIN sync working for all 5 orgs (6,245 warehouse leads)
- Dev URL: https://dev.huminicdev.com
- Full business context: evidence/SNP-001/business-context.md
