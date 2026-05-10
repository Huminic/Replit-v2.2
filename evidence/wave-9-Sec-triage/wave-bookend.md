# Wave 9-Sec — Security triage (operator-led; v2.2 vs v2.3 placement)

**Phase:** 9 (Management + Settings — security)
**Branch:** `wave/9-sec/triage` off `batch-1-finish-line` @ `d47388e`
**Plan reference:** plan.md row 12 — "Security triage — 5 original items (I-244, I-245, I-246, I-247, I-249) + 5 new auth items from I-Auth (D, E, G, H, I) — opens with operator decision on v2.2 vs v2.3 placement"

---

## OPENING (2026-05-10T18:26Z)

### Context

Operator signaled "I'm way behind" 2026-05-10. Compressing the remaining wave path: Wave 3C deferred to v2.3 (BL-002), so Wave 9-Sec is next, then Wave 11A.

Wave 9-Sec is a **TRIAGE-FIRST wave**, not an implementation wave. Each of the 10 security items gets a binary fate: ship in v2.2 / defer to v2.3 / drop. Implementation only happens for items selected for v2.2, and only after operator approves each one specifically.

### Scope (Phase 1 — read-only triage enumeration)

| Phase | Owner | Action |
|---|---|---|
| **Phase 1** | `scope-guardian` (team SendMessage) | Read `issues.md`, `evidence/wave-I-auth-integrity/`, plus the 5 original items (I-244, I-245, I-246, I-247, I-249). Produce a concrete table: item id, summary, severity, fix complexity, recommended placement (v2.2 / v2.3 / drop) with one-sentence reasoning |
| **Phase 2** | operator | Decide each row: v2.2 / v2.3 / drop |
| **Phase 3** (conditional) | `harness-backend` and/or `harness-frontend` | Implement only the v2.2-bucket items, with bookend protocol per chunk |
| **Phase 4** (only if Phase 3 ran) | `qa-evaluator` + 4 verifiers at gate | Standard verifier convergence |

### Default disposition

**Defer to v2.3 unless operator explicitly opts in** for v2.2. Operator's time pressure + the launch gate (Wave 11A) being the immediate successor wave means the bar for v2.2 inclusion is HIGH: the item must be (a) a real risk to launch dealerships or customer data, or (b) trivially fixable (single-line / config-only).

### Two deltas of proof contract

| Delta | What |
|---|---|
| **Delta 1** | The triage table itself (read-only enumeration) — proves the 10 items were considered by name, not skimmed |
| **Delta 2** | Operator's recorded triage decisions in `decisions.md` (or inline in this bookend's Phase 2 amendment) — proves placement was operator-decided, not orchestrator-decided |

If Phase 3 runs (any v2.2 implementations), each implemented item adds its own two-deltas per chunk.

### Team dispatch

**This wave uses SendMessage to existing teammates** per CLAUDE.md TEAM DISPATCH DEFAULT. No fresh `Agent` spawns.

- Phase 1: `SendMessage` to `scope-guardian` (read-only; appropriate role since scope-guardian also covers process-discipline + governance)
- Phase 3 (if): `SendMessage` to `harness-backend` / `harness-frontend` per item
- Phase 4 (if): `SendMessage` to `qa-evaluator` (post-fix), `code-reviewer` (blind diff), `scope-guardian` (scope + drift), `integration-safety` (if provider boundary touched)

### Risk profile

| Risk | Mitigation |
|---|---|
| Operator says "skip everything to v2.3" | Wave closes after Phase 2 with zero v2.2 implementations. Acceptable. |
| Operator says "fix all 10 in v2.2" | Wave expands; orchestrator presents time/risk tradeoff and reconfirms |
| Item touches auth / RBAC | Higher scrutiny: integration-safety + extra qa-evaluator E2E |
| Real-customer data exposure risk | Auto-promote to v2.2 even if operator wasn't going to (orchestrator advocate role) |

### Out of scope

- New security features beyond the 10 enumerated items
- Schema migrations (deferred per BL-107)
- Live-deploy actions (Wave 11A only)

### Posture at OPENING

- Branch: `wave/9-sec/triage` at `d47388e`
- Working tree dirty: 4 untracked + 0 modified (post-cleanup state)
- Team: 8 idle teammates ready for SendMessage

---

(Phase 2 amendment + CLOSING to follow.)
