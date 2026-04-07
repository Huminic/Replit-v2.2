# Ghost Entry Gate Template

The Ghost agent appends this section to `evidence/PE-{ID}/pre-execution-report.md` after reviewing the pre-execution package.

---

```markdown
## Ghost Entry Gate

**Timestamp:** {ISO-8601}
**Sprint:** PE-{ID}
**Reviewer:** Ghost Agent

### Verification Checklist

| Check | Result | Notes |
|-------|--------|-------|
| Sprint registered in sprints.json | PASS/FAIL | |
| Scope limited to one section | PASS/FAIL | |
| Declared Files match sprint declaredFiles | PASS/FAIL | |
| Acceptance Criteria copied from registry | PASS/FAIL | |
| Use Case Inventory covers happy/negative/edge | PASS/FAIL | |
| Evidence Plan matches evidence rubric | PASS/FAIL | |
| Action Boundary Review complete | PASS/FAIL | |
| Irreversible actions approved or excluded | PASS/FAIL | |
| ghost_messages.json clear | PASS/FAIL | |
| No other PE sprint in_progress | PASS/FAIL | |

### Assessment

{Brief narrative assessment of pre-execution readiness}

### Verdict

ENTRY GATE: APPROVED
(or)
ENTRY GATE: REJECTED — {specific reasons}
```

---

## Verification Command

```bash
grep "ENTRY GATE: APPROVED" evidence/PE-{ID}/pre-execution-report.md
```

If this returns no match, the agent MUST NOT begin evaluation execution.
