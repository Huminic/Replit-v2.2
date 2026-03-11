# API Endpoint Smoke Test Report — T015

## Summary

Comprehensive API endpoint smoke test battery covering all critical endpoints with valid/invalid inputs, missing auth, invalid JSON, missing required fields, invalid IDs, and edge case inputs.

## Test Coverage

### 1. Authentication Endpoints (10 tests)
- Login: missing email, missing password, empty body, invalid credentials, valid credentials
- Refresh: missing token, invalid token
- Forgot password: missing email, non-existent email (no info leak verified)
- Reset password: missing token/password, short password, invalid token

### 2. Missing Auth on Protected Endpoints (27 tests)
- All major GET/POST endpoints return 401 when no auth token is provided
- Covers: agents, conversations, campaigns, users, tasks, appointments, widgets, documents, notifications, favorites, hunches, activity-log, metrics, outbound status, usage, integrations, leads/scored, roles

### 3. Invalid Auth Token (2 tests)
- Invalid bearer token returns 401
- Expired/malformed JWT returns 401

### 4. Invalid IDs on Resource Endpoints (13 tests)
- Non-existent UUIDs return 404 for: agents, conversations, campaigns, organizations, tasks, appointments, widgets, hunches
- Covers GET, PATCH, DELETE methods

### 5. Missing Required Fields on Creation Endpoints (5 tests)
- User creation: missing fields, short password
- Appointment creation: missing required fields
- Password change: missing fields, short password

### 6. Chat Endpoint Edge Cases (6 tests)
- Missing content, empty string, non-string content, special characters, very long messages
- Non-existent conversation returns 404

### 7. Public/Widget Endpoints (9 tests)
- Landing page: non-existent slug returns 404
- Widget contact: missing required fields, missing org
- Widget chat: missing slug, missing message, non-existent slug
- Widget video: missing identifiers
- Widget public config: non-existent returns 404
- Voice config: non-existent returns 404
- VAPI health check: returns 200

### 8. Webhook Endpoints (3 tests)
- VAPI: invalid payload, empty body
- Tavus: missing auth

### 9. Organization Endpoints (2 tests)
- Slug update: missing slug, empty slug

### 10. Proxy Endpoints (5 tests)
- fal.ai: missing endpoint, invalid URL
- OpenAI: missing messages
- Maps: missing action, invalid action

### 11. Metrics Validation (2 tests)
- Missing metric parameter returns 400
- Invalid metric parameter returns 400

### 12. Content-Type Handling (1 test)
- Non-JSON content type handled gracefully

### 13. Conversation Validation (1 test)
- Invalid update schema rejected

### 14. Security Endpoint Access (1 test)
- Security events without auth returns 401

## Issues Found & Fixed

### Issue 1: Chat endpoint accepted empty strings
- **Endpoint**: `POST /api/chat/:conversationId/stream`
- **Problem**: The `content` field was only checked for truthiness, so whitespace-only strings could pass validation
- **Fix**: Added `content.trim().length === 0` check

### Issue 2: No max length on chat messages
- **Endpoint**: `POST /api/chat/:conversationId/stream`
- **Problem**: No upper bound on message length; extremely long messages could cause excessive memory/token usage with Claude API
- **Fix**: Added 50,000 character limit

### Issue 3: Widget chat accepted non-string messages
- **Endpoint**: `POST /api/widget/chat`
- **Problem**: Only checked `!message` (truthy), but numeric values, objects, etc. would pass
- **Fix**: Added `typeof message !== "string"` and `message.trim().length === 0` checks, plus 10,000 char limit

### Issue 4: Widget contact lacked input type/length validation
- **Endpoint**: `POST /api/widget/contact`
- **Problem**: No type checking or length limits on name, email, message fields (public endpoint)
- **Fix**: Added string type checks and length limits (name: 200, email: 320, message: 10,000)

## Conclusion

All critical API endpoints handle valid and invalid inputs gracefully. Error responses consistently return JSON with descriptive `message` fields. Authentication is enforced on all protected endpoints. Input validation improvements have been applied to public-facing endpoints to harden against abuse.
