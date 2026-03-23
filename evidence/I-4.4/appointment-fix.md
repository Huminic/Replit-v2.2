# I-4.4 Appointment Source Field Fix

## Problem
POST /api/appointments with `source="widget"` (or any value) always returned `source="manual"`. The API hardcoded `source: "manual"` and did not extract `source` from the request body.

## Root Cause
In `server/routes/appointments.ts`, line 37 destructured `req.body` but did not include `source`. Line 54 hardcoded `source: "manual"`.

## Fix Applied
File: `server/routes/appointments.ts`

1. Added `source` and `status` to the destructured fields from `req.body` (line 37).
2. Changed `source: "manual"` to `source: source || "manual"` (line 54) so the request value is used when provided, falling back to "manual".
3. Changed `status: "scheduled"` to `status: status || "scheduled"` to also pass through the status field from the request body.

## Verification

### Test 1: source=vapi preserved
```
POST /api/appointments with source="vapi"
Response: source="vapi"
Result: PASS
```

### Test 2: default source when omitted
```
POST /api/appointments without source field
Response: source="manual"
Result: PASS
```

## Files Modified
- server/routes/appointments.ts (lines 37, 52, 54)
