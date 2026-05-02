# Chunk 1A — spec path deviation

Frozen preflight (92447ed) §2 + §4 declared new test file at:
  server/__tests__/statusClassifier.test.ts

Actual test file written at:
  tests/unit/statusClassifier.test.ts

## Why

vitest.config.ts:8 has `include: ["tests/**/*.test.ts"]` only. The repo
has no `server/__tests__/` directory; all 17 existing unit tests live
under `tests/unit/`. Honoring the spec path verbatim would require
amending vitest.config.ts (out of declared §2 scope) and would create
a parallel test discovery surface for no benefit.

## What changed

Path string only. Test functionality, coverage cases, runtime behavior,
runner invocation are identical to spec.

## Authorization

Lead-authorized 2026-05-02 after independent confirmation. Operator
informed in parallel; standing override applies if they direct otherwise.
