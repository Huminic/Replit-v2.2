# Ghost Exit Gate Template

The Ghost agent appends this section to `evidence/PE-{ID}/post-sprint-report.md` after reviewing all sprint artifacts.

---

```markdown
## Ghost Exit Gate

**Timestamp:** {ISO-8601}
**Sprint:** PE-{ID}
**Reviewer:** Ghost Agent

### 11-Question Verification

| # | Question | Result | Notes |
|---|----------|--------|-------|
| B1 | Entry gate was approved | PASS/FAIL | |
| B2 | All planned flows have execution reports | PASS/FAIL | |
| B3 | Every executed flow has evidence AND commentary | PASS/FAIL | |
| B4 | Data plausibility checks documented for data-heavy flows | PASS/FAIL | |
| B5 | False-pass detection performed (classes checked) | PASS/FAIL | |
| B6 | All bugs logged with severity, type, status | PASS/FAIL | |
| B7 | Remediation retests completed or explicitly deferred | PASS/FAIL | |
| B8 | Enforcer-checklist.txt exists with RESULT: APPROVED | PASS/FAIL | |
| B9 | Cross-sign.md exists with verdict: approved, different roles | PASS/FAIL | |
| B10 | ghost_messages.json clear | PASS/FAIL | |
| B11 | Watchdog violations == 0 or acknowledged | PASS/FAIL | |

### AC Verification

| AC | Claimed Result | Ghost Assessment | Evidence Adequate |
|----|---------------|-----------------|-------------------|
| PE-{ID}.AC1 | PASS/FAIL | CONFIRMED/DISPUTED | YES/NO |
| PE-{ID}.AC2 | PASS/FAIL | CONFIRMED/DISPUTED | YES/NO |
| ... | ... | ... | ... |

### Assessment

{Brief narrative assessment of sprint completion quality}

### Verdict

EXIT GATE: CLEARED
(or)
EXIT GATE: NOT CLEARED — {specific issues that must be resolved}
```

---

## Verification Command

```bash
grep "EXIT GATE: CLEARED" evidence/PE-{ID}/post-sprint-report.md
```

If this returns no match, the agent MUST NOT start the next sprint.
