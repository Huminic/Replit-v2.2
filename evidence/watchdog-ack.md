# Watchdog Acknowledgment — M-001 Pre-Sprint Baseline
**Sprint:** M-001
**Date:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
**Acknowledged by:** orchestrator

## Acknowledged Violations (structural, pre-existing)

**C5 (untracked evidence dirs):** .governor/evidence contains untracked directories from prior T-sprints and U-001 crawl. These are valid evidence artifacts not yet committed. Will be addressed during M-001.

**C7 (session state stale):** session-state.md is in governor memory, not the nexxus app. Updated this session at ~/.claude/projects/.../memory/session-state.md. Nexxus-local session state not maintained separately.

**C9 (chain of custody — T-sprint hashes):** 17 T-sprints were committed as "evidence-only" (no code changes, test-only sprints). Their evidence exists in untracked directories. This is a known structural condition from the prior QA cycle.

**C15 (memory staleness):** MEMORY.md referenced is the governor root memory, updated this session. Nexxus-local memory not maintained separately.

**C16 (drift detection):** Same root cause as C9 — T-sprints with evidence-only hashes. E-012 null hash is pre-V2 sprint. These are structural conditions, not per-sprint violations.

**C19 (pre-exec quality):** R-016 and R-017 pre-exec format issues are from prior session. Not M-001 scope.

## New Violations: None

All violations are pre-existing structural conditions. No new violations introduced by M-001 baseline commit.
