 Agent Team Development Protocol for Mission-Critical Projects                                                                                                                                                              
  
  1. Philosophy  
  
  The core problem with agent teams on complex projects isn't capability — it's coordination failure. Agents lose context, duplicate work, skip edge cases, and produce inconsistent quality unless the protocol is  
  explicit about who does what, when, and how verification happens.  
  
  This document prescribes a deterministic workflow. Nothing is left to agent discretion except implementation details within their assigned scope.  
  
  ---  
  2. Team Topology  
  
  2.1 Required Roles  
  
  ┌────────────────┬─────────────────────────┬─────────────────────────────────────────────────────────────────────┬─────────────┐  
  │      Role      │       Agent Type        │                           Responsibility                            │ Tool Access │  
  ├────────────────┼─────────────────────────┼─────────────────────────────────────────────────────────────────────┼─────────────┤  
  │ Architect      │ Plan                    │ Decomposes specs into tasks, defines interfaces, resolves ambiguity │ Read-only   │  
  ├────────────────┼─────────────────────────┼─────────────────────────────────────────────────────────────────────┼─────────────┤  
  │ Implementer(s) │ general-purpose         │ Writes code within assigned scope                                   │ Full        │  
  ├────────────────┼─────────────────────────┼─────────────────────────────────────────────────────────────────────┼─────────────┤  
  │ Validator      │ general-purpose         │ Writes and runs tests, verifies metrics                             │ Full        │  
  ├────────────────┼─────────────────────────┼─────────────────────────────────────────────────────────────────────┼─────────────┤  
  │ Auditor        │ Explore                 │ Reviews completed work for gaps, inconsistencies, security          │ Read-only   │  
  ├────────────────┼─────────────────────────┼─────────────────────────────────────────────────────────────────────┼─────────────┤  
  │ Lead           │ (you, the orchestrator) │ Assigns work, enforces gates, makes decisions                       │ Full        │  
  └────────────────┴─────────────────────────┴─────────────────────────────────────────────────────────────────────┴─────────────┘  
  
  2.2 Why These Specific Roles  
  
  - Architect is read-only — prevents the planner from "just doing it" and skipping the approval gate.  
  - Validator is separate from Implementer — the person who wrote the code should never be the only person who tests it. Different context windows catch different assumptions.  
  - Auditor is read-only — can't "fix" what it finds. Must report back. This forces the finding to be triaged, not silently patched.  
  
  2.3 Scaling Rule  
  
  For N major features:  
  - 1 Architect (always)  
  - min(N, 3) Implementers (each in a worktree)  
  - 1 Validator per 2 Implementers  
  - 1 Auditor (runs after each phase gate)  
  
  More than 3 parallel Implementers creates coordination overhead that exceeds the parallelism benefit.  
  
  ---  
  3. Development Phases  
  
  Phase 0: Decomposition (Architect only)  
  
  Input: Project spec, requirements doc, existing codebase.  
  
  Process:  
  1. Architect explores the codebase and spec  
  2. Produces a Task Dependency Graph — not a flat list, a DAG  
  3. Each task specifies:  
    - Scope: Exactly which files/modules are touched  
    - Interface Contract: What inputs it accepts, what outputs it produces  
    - Verification Criteria: 3 specific, measurable checks (not "it works")  
    - Boundary: What this task explicitly does NOT touch  
  4. Lead reviews and approves the decomposition  
  
  Gate: Lead approves task graph. No implementation begins until this gate passes.  
  
  Anti-pattern to prevent: Architect produces vague tasks like "implement authentication." Every task must be specific enough that an agent with no prior context can execute it.  
  
  Phase 1: Interface-First Implementation  
  
  Process:  
  1. Lead creates all tasks via TaskCreate with dependencies (blockedBy/blocks)  
  2. Implementers claim tasks in dependency order (lowest ID first)  
  3. First commit for every task is interfaces only — types, function signatures, API contracts, database schemas. No logic.  
  4. Lead reviews interfaces for consistency across tasks  
  5. Only after interface approval does implementation proceed  
  
  Gate: All interfaces reviewed. No type conflicts. No overlapping responsibilities.  
  
  Why interface-first: When 3 agents independently implement features, they will create incompatible interfaces unless forced to agree upfront. This is the single most common failure mode in agent teams.  
  
  Phase 2: Implementation (Parallel)  
  
  Process:  
  1. Each Implementer works in an isolated worktree (isolation: "worktree")  
  2. Each Implementer writes code + unit tests for their assigned tasks  
  3. Implementers mark tasks complete via TaskUpdate only when:  
    - Code compiles/lints clean  
    - Unit tests pass  
    - The verification criteria from Phase 0 are addressed  
  4. Lead merges worktrees sequentially (not all at once)  
  5. After each merge, run full test suite before next merge  
  
  Communication Protocol:  
  - Implementer discovers interface needs to change → STOP. Message Lead. Do not modify the interface unilaterally.  
  - Implementer is blocked by another task → Message Lead, who reassigns or reorders.  
  - Implementer finds a spec ambiguity → Message Lead with 2-3 options. Do not guess.  
  
  Gate: All tasks complete. All unit tests pass. Integration tests pass after merge.  
  
  Phase 3: Validation (Validator agents)  
  
  Process:  
  1. Validator receives the merged codebase (not individual worktrees)  
  2. Validator writes tests against the verification criteria from Phase 0, not against the implementation  
  3. Three categories of validation:  
  
  Category A: Metrics Verification  
  For every metric in the spec:  
  Metric: [name]  
  Expected: [value/range]  
  Actual: [measured value]  
  Method: [how it was measured]  
  Pass/Fail: [result]  
  
  Category B: Edge Case Sweep  
  Validator systematically tests:  
  - Boundary values (0, 1, max, max+1, negative)  
  - Empty/null/undefined inputs  
  - Concurrent access (if applicable)  
  - Error paths (network failure, invalid data, timeout)  
  - State transitions (especially from unexpected states)  
  
  Category C: Integration Paths  
  Every path where module A calls module B:  
  - Happy path verified  
  - Error propagation verified  
  - Data format consistency verified  
  
  Gate: All metrics measured and documented. All edge case tests pass. All integration paths exercised.  
  
  Phase 4: Audit (Auditor agent, read-only)  
  
  Process:  
  1. Auditor reviews the entire codebase with a checklist:  
  
  Security Checklist:  
  - No hardcoded secrets/credentials  
  - Input validation at all system boundaries  
  - SQL injection / XSS / CSRF protections  
  - Authentication/authorization on all protected routes  
  - Error messages don't leak internal details  
  
  Consistency Checklist:  
  - Naming conventions consistent across all files  
  - Error handling pattern consistent  
  - Logging pattern consistent  
  - No dead code or unused imports  
  - No TODO/FIXME items left unaddressed  
  
  Completeness Checklist:  
  - Every spec requirement maps to implemented code  
  - Every implemented feature maps to a test  
  - Every error path has handling  
  - Every config value has a default or validation  
  - Database migrations are reversible  
  
  2. Auditor produces a findings report — does not fix anything  
  3. Lead triages findings: fix now / accept risk / defer  
  4. Implementers fix "fix now" items  
  5. Validator re-runs affected tests  
  
  Gate: All "fix now" findings resolved. Remaining findings documented with risk acceptance.  
  
  ---  
  4. The Metrics Verification Framework  
  
  For projects with many metrics, a flat list isn't enough. Structure them hierarchically:  
  
  Metrics Registry (single source of truth)  
  ├── Category: Performance  
  │   ├── M-PERF-001: API response time < 200ms (p95)  
  │   │   ├── Measurement method: k6 load test, 100 concurrent users  
  │   │   ├── Verification script: tests/perf/api-latency.js  
  │   │   └── Owner: Validator-1  
  │   └── M-PERF-002: Database query time < 50ms  
  │       ├── Measurement method: EXPLAIN ANALYZE on all queries  
  │       ├── Verification script: tests/perf/query-analysis.sql  
  │       └── Owner: Validator-1  
  ├── Category: Correctness  
  │   ├── M-CORR-001: All CRUD operations maintain referential integrity  
  │   │   └── ...  
  │   └── M-CORR-002: Concurrent writes produce consistent state  
  │       └── ...  
  ├── Category: Security  
  │   └── ...  
  └── Category: Reliability  
      └── ...  
  
  Rules for Metrics:  
  
  1. Every metric has an ID — referenced in tasks, tests, and reports  
  2. Every metric has an automated verification — no "manually check that..."  
  3. Every metric has an owner — one agent responsible for measuring it  
  4. Metrics are verified independently — Validator doesn't trust Implementer's self-reported metrics  
  5. Results are captured as artifacts — log files, screenshots, test output. Not "it passed."  
  
  ---  
  5. Communication Protocol  
  
  5.1 Message Types (By Convention)  
  
  Agents use SendMessage for all communication. Standardize content by purpose:  
  
  Status Update (Implementer → Lead):  
  Task [ID] status: [in_progress|blocked|complete]  
  Files changed: [list]  
  Tests: [pass/fail count]  
  Issues found: [if any]  
  
  Blocker Report (Any → Lead):  
  BLOCKED on Task [ID]  
  Cause: [specific cause]  
  Options:  
  1. [option with tradeoff]  
  2. [option with tradeoff]  
  Awaiting decision.  
  
  Finding (Auditor → Lead):  
  Finding [severity: critical|major|minor]  
  Location: [file:line]  
  Issue: [what's wrong]  
  Evidence: [proof]  
  Suggested fix: [if obvious]  
  
  Decision Request (Architect → Lead):  
  Ambiguity in [spec section/requirement]  
  Interpretation A: [description, implications]  
  Interpretation B: [description, implications]  
  Recommendation: [A or B, with reasoning]  
  
  5.2 What NOT to Broadcast  
  
  - Status updates (DM to Lead only)  
  - Questions about your own task (DM to Lead only)  
  - Implementation details (DM to relevant agent only)  
  
  Broadcast only for: breaking interface changes that affect all implementers, or blocking issues that halt all work.  
  
  ---  
  6. The "Nooks and Crannies" Protocol  
  
  For mission-critical systems, the obvious paths get tested. It's the corners that fail in production. Prescribe a systematic sweep:  
  
  6.1 Boundary Enumeration  
  
  Before Phase 3, the Architect produces a Boundary Map:  
  
  System Boundary: [e.g., "User input → API"]  
  ├── Valid inputs: [enumerated categories]  
  ├── Invalid inputs: [enumerated categories]  
  ├── Edge cases: [specific values]  
  ├── Encoding issues: [unicode, special chars, injection attempts]  
  └── Size limits: [min, max, overflow behavior]  
  
  Every system boundary gets one of these. The Validator must produce at least one test for every leaf node.  
  
  6.2 State Machine Coverage  
  
  For any stateful component:  
  1. Enumerate all states  
  2. Enumerate all transitions  
  3. Test every valid transition  
  4. Test every invalid transition (the nook)  
  5. Test rapid state changes (the cranny)  
  
  6.3 Failure Mode Injection  
  
  Systematically inject failures:  
  - Database connection drops mid-transaction  
  - External API returns 500  
  - Disk full during write  
  - Clock skew between services  
  - Partial data in cache  
  
  Each failure mode gets a test. Each test documents expected behavior.  
  
  ---  
  7. Task Lifecycle (Enforced by Lead)  
  
  CREATED → ASSIGNED → IN_PROGRESS → REVIEW → VALIDATED → DONE  
                    ↓                     ↑  
                  BLOCKED ────────────────┘  
                    (with reason)  
  
  CREATED: Architect defined it, Lead approved it.  
  ASSIGNED: Lead assigned to specific Implementer via TaskUpdate.  
  IN_PROGRESS: Implementer claimed it, working on it.  
  REVIEW: Implementer says done. Lead does quick review.  
  VALIDATED: Validator confirmed verification criteria pass.  
  DONE: Auditor found no issues (or issues were fixed).  
  
  A task is not DONE until it passes through Validator AND Auditor. Self-reported completion by the Implementer is necessary but not sufficient.  
  
  ---  
  8. Worktree Strategy  
  
  When to Use Worktrees  
  
  - Always for parallel Implementers (prevents merge conflicts during development)  
  - Always for Validator (tests against clean merged state, not in-progress work)  
  - Never for Architect or Auditor (they're read-only; main branch is fine)  
  
  Merge Order  
  
  1. Merge tasks in dependency order (leaves first, then nodes that depend on them)  
  2. Run full test suite after each merge  
  3. If merge breaks tests: STOP. Do not merge the next worktree. Fix first.  
  4. Never batch-merge multiple worktrees without intermediate testing  
  
  ---  
  9. Anti-Patterns This Protocol Prevents  
  
  ┌─────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────┐  
  │                    Anti-Pattern                     │                      How It's Prevented                      │  
  ├─────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤  
  │ Agent rewrites another agent's code                 │ Worktree isolation + explicit scope boundaries               │  
  ├─────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤  
  │ Metric claimed as passing without evidence          │ Metrics registry requires automated verification + artifacts │  
  ├─────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤  
  │ Edge cases skipped "because happy path works"       │ Boundary Map forces enumeration before testing               │  
  ├─────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤  
  │ Spec ambiguity resolved by guessing                 │ Decision Request protocol requires Lead approval             │  
  ├─────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤  
  │ Interface incompatibility discovered at integration │ Phase 1 interface-first gate                                 │  
  ├─────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤  
  │ "It works on my branch"                             │ Validator tests merged code, not individual branches         │  
  ├─────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤  
  │ Silent quality degradation                          │ Auditor is read-only and cannot "fix" — must report          │  
  ├─────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤  
  │ Coordination overhead exceeds benefit               │ Max 3 parallel Implementers rule                             │  
  └─────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────┘  
  
  ---  
  10. Document Template for Project Kickoff  
  
  When starting the project, create these files:  
  
  .project/  
  ├── spec.md                    # Full project specification  
  ├── metrics-registry.md        # All metrics with IDs and verification methods  
  ├── boundary-map.md            # All system boundaries enumerated  
  ├── task-graph.md              # DAG of all tasks with dependencies  
  ├── interface-contracts.md     # All agreed interfaces  
  ├── plans/  
  │   └── active-plan.md         # Current execution plan  
  ├── reports/  
  │   ├── validation-report.md   # Phase 3 output  
  │   └── audit-report.md        # Phase 4 output  
  └── progress.md                # Updated after each gate  
  
  ---  
  11. When to Deviate  
  
  This protocol is intentionally rigid. Deviate only when:  
  
  1. The project is not actually mission-critical — scale down to fewer phases  
  2. The team lead identifies a gate is blocking without adding value — document why and skip with explicit acknowledgment  
  3. An emergency fix is needed in production — bypass with post-hoc audit  
  
  Every deviation is documented in progress.md with rationale.  
