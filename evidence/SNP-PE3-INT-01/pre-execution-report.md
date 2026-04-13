# Pre-Execution Report: SNP-PE3-INT-01

**Sprint:** SNP-PE3-INT-01
**Date:** 2026-04-07

## Objective
Fix hardcoded Tavus callback URL in server/vendorProxy.ts to use APP_BASE_URL environment variable.

## Declared Files
- server/vendorProxy.ts

## UI Changes
NONE

## Acceptance Criteria
- SNP-PE3-INT-01.AC1: Tavus callback URL uses APP_BASE_URL
- SNP-PE3-INT-01.AC2: No hardcoded production URLs remain in Tavus integration

## Test Plan
- Verify line 410 uses process.env.APP_BASE_URL
- Grep for remaining hardcoded live.huminic.app in Tavus section
- npm run build succeeds

## Success Criteria
- Tavus callback URL dynamically resolves per environment
- Build succeeds without errors
