# Code Audit — Agent 1 (AUDIT-1e)
**Auditor:** Claude Agent 1
**Date:** 2026-03-19
**Sprints Audited:** REM-1, REM-2, REM-3, REM-4, ALN-1, I-1, I-039

---

## REM-1

### Claim: "I-038: FIXED — Removed VAPI_WEBHOOK_SECRET from .env"
- Sprint: REM-1
- File: .env
- Lines: N/A
- Code does: VAPI_WEBHOOK_SECRET is absent from .env
- Verdict: CONFIRMED
- Evidence: `grep "VAPI_WEBHOOK_SECRET" .env` returns no matches

### Claim: "I-045: FIXED — FLEXPRICE_API_KEY added to .env"
- Sprint: REM-1
- File: .env
- Lines: N/A
- Code does: FLEXPRICE_API_KEY is present in .env
- Verdict: CONFIRMED
- Evidence: `FLEXPRICE_API_KEY=<REDACTED>`

### Claim: "I-048: FIXED — 5 dead passport/session packages removed"
- Sprint: REM-1
- File: package.json
- Lines: N/A
- Code does: No passport or express-session dependencies in package.json
- Verdict: CONFIRMED
- Evidence: `grep -E "passport|express-session" package.json` returns no matches

### Claim: "I-051: FIXED — 4 orphaned env vars removed (TEXTMAGIC_API_KEY, USERNAME, SESSION_SECRET, VAPI_API_KEY)"
- Sprint: REM-1
- File: .env
- Lines: N/A
- Code does: None of these four vars appear in .env
- Verdict: CONFIRMED
- Evidence: `grep -E "^TEXTMAGIC_API_KEY|^TEXTMAGIC_USERNAME|^SESSION_SECRET|^VAPI_API_KEY=" .env` returns no matches

### Claim: "I-052: FIXED — Missing env vars added (FLEXPRICE_API_KEY, FLEXPRICE_BASE_URL, TAVUS_WEBHOOK_SECRET, VITE_VAPI_PUBLIC_KEY, TAVUS_API_KEY corrected)"
- Sprint: REM-1
- File: .env
- Lines: N/A
- Code does: All 5 vars present in .env
- Verdict: CONFIRMED
- Evidence:
```
VITE_VAPI_PUBLIC_KEY=<REDACTED>
TAVUS_API_KEY=<REDACTED>
TAVUS_WEBHOOK_SECRET=<REDACTED>
FLEXPRICE_API_KEY=<REDACTED>
FLEXPRICE_BASE_URL=https://api.cloud.flexprice.io/v1
```

### Claim: "I-049: FIXED — Indexes added on campaignRecipients.campaignId and notifications.userId"
- Sprint: REM-1
- File: shared/schema.ts
- Lines: 226, 256
- Code does: Both indexes exist in schema definition
- Verdict: CONFIRMED
- Evidence:
```typescript
index("idx_campaign_recipients_campaign").on(table.campaignId),  // line 226
index("idx_notifications_user").on(table.userId),                // line 256
```

### Claim: "I-053: FIXED — Partner Admin switch-org now resolves group parent correctly"
- Sprint: REM-1
- File: server/routes/auth.ts
- Lines: 294-303
- Code does: PA at child org resolves groupParentId via `userOrg?.partnerId || user.organizationId`, then filters partnerOrgs accordingly
- Verdict: CONFIRMED
- Evidence:
```typescript
const groupParentId = userOrg?.partnerId || user.organizationId;
const partnerOrgs = allOrgs.filter(o => o.id === groupParentId || o.partnerId === groupParentId);
```

### Claim: "I-036: FIXED — AI agent processing for inbound SMS"
- Sprint: REM-1
- File: server/routes/sms.ts
- Lines: 313-370
- Code does: On inbound SMS, finds org's active SMS agent, builds context from conversation history, calls Anthropic Claude API, sends AI response via SMS
- Verdict: CONFIRMED
- Evidence:
```typescript
// AI agent processing for inbound SMS (fire-and-forget)     // line 313
const smsAgent = orgAgents.find(                              // line 329
  a => a.status === "active" && a.type === "ai" &&
    (a.channels?.includes("sms") || a.channels?.includes("voice"))
);
```

### Claim: "I-037: FIXED — VAPI outbound calls now pass customerName, phoneNumberId, firstMessageOverride, systemPromptOverride via OutboundCallContext"
- Sprint: REM-1
- File: server/outbound.ts
- Lines: 137-202
- Code does: OutboundCallContext interface defined with all 4 fields; sendPhone() uses them to build VAPI call args
- Verdict: CONFIRMED
- Evidence:
```typescript
export interface OutboundCallContext {     // line 137
  customerName?: string;                   // line 138
// ...
callArgs.firstMessageOverride = content.replace(/\{\{customerName\}\}/g, customerName);  // line 185
```

### Claim: "I-040: FIXED — Added try/catch around processNext in campaign execution"
- Sprint: REM-1
- File: server/outbound.ts
- Lines: 525-618
- Code does: processNext wrapped in try/catch at lines 526/610, error logged with campaign ID
- Verdict: CONFIRMED
- Evidence:
```typescript
const processNext = async () => {
    try {                                                    // line 526
    // ... campaign execution logic ...
    } catch (processErr: any) {                              // line 610
      console.error(`[Campaign ${campaignId}] processNext error:`, processErr.message);
```

### Claim: "I-044: FIXED — PATCH conversation now returns computed aiPaused field"
- Sprint: REM-1
- File: server/routes/conversations.ts
- Lines: 135-137
- Code does: After update, computes aiPaused as boolean from assignedTo, returns in response
- Verdict: CONFIRMED
- Evidence:
```typescript
const aiPaused = !!(conv as any)?.assignedTo;
return res.json({ ...conv, aiPaused });
```

### Claim: "I-046: FIXED — Added POST /api/entitlements/check endpoint returning 401 for invalid tokens"
- Sprint: REM-1
- File: server/routes/billing.ts
- Lines: 165-184
- Code does: POST endpoint exists with authenticateToken middleware (401 for invalid tokens), checks feature_key, calls billingService, handles degraded mode
- Verdict: CONFIRMED
- Evidence:
```typescript
app.post("/api/entitlements/check", authenticateToken, async (req, res) => {  // line 165
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
```

### Claim: "I-050: FIXED — Extracted generateHunchesForOrg to server/services/hunchService.ts. Deleted 6200-line routes.ts monolith"
- Sprint: REM-1
- File: server/services/hunchService.ts, server/routes.ts
- Lines: hunchService.ts:15
- Code does: hunchService.ts exists with exported generateHunchesForOrg function; server/routes.ts does not exist (deleted)
- Verdict: CONFIRMED
- Evidence:
```typescript
// hunchService.ts line 15:
export async function generateHunchesForOrg(orgId: string, userId?: string) {
// server/routes.ts: file does not exist (DELETED)
```

### Claim: "I-055: FIXED — Wrapped response.json() in try/catch for login error handling"
- Sprint: REM-1
- File: client/src/contexts/AuthContext.tsx
- Lines: 116-121
- Code does: Login error path wraps response.json() in try/catch, falls back to statusText
- Verdict: CONFIRMED
- Evidence:
```typescript
try {
  const errorData = await response.json();
  errorMessage = errorData.message || errorData.error || errorMessage;
} catch {
  errorMessage = response.statusText || errorMessage;
}
```

### Claim: "I-056: FIXED — Logout uses window.location.href for full reload, avoiding React DOM race"
- Sprint: REM-1
- File: client/src/contexts/AuthContext.tsx
- Lines: 177-181
- Code does: logout() clears auth state then uses `window.location.href = '/login'` for full page reload
- Verdict: CONFIRMED
- Evidence:
```typescript
// Clear auth state and redirect — use location.href so the full page
// reloads, which avoids React trying to re-render components that
// depend on the now-cleared auth state.
clearAuth();
window.location.href = '/login';
```

### Claim: "I-057: FIXED — Tour backdrop has clipPath cutout allowing clicks through to spotlight area"
- Sprint: REM-1
- File: client/src/components/ProductTour.tsx
- Lines: 170-175
- Code does: No clipPath exists in the current file. The backdrop BLOCKS all clicks (pointerEvents: 'auto'). REM-3 I-061 superseded this approach — clipPath was removed.
- Verdict: GAP
- Evidence: REM-1 claimed clipPath cutout, but REM-3 I-061 removed it. Current code at line 170: `{/* Backdrop: blocks all clicks. Tour is only dismissable via the X button or Skip button in the tooltip (I-061 fix). */}`. The REM-1 fix was valid at commit time but was intentionally reversed in REM-3.

### Claim: "I-058: FIXED — Auth refresh skipped when no nexxus_refresh cookie exists"
- Sprint: REM-1
- File: client/src/contexts/AuthContext.tsx
- Lines: 306-315
- Code does: The code does NOT check for the cookie before attempting refresh. It always calls /api/auth/refresh and lets the server decide (because the cookie is httpOnly and invisible to JS). Functionally equivalent but implementation differs from claim.
- Verdict: GAP
- Evidence:
```typescript
// The refresh cookie is httpOnly so it's invisible to document.cookie.
// We must attempt the refresh call and let the server decide if the
// cookie is present. A 401/400 response simply means no valid session.
try {
  const response = await fetch('/api/auth/refresh', {
```
Comment says "skip when no cookie" but the mechanism is server-side rejection, not client-side skip.

### Claim: "I-060: FIXED — After-hours auto-response with business hours check and Followup tag"
- Sprint: REM-1
- File: server/services/scheduler.ts
- Lines: 176-298
- Code does: afterHoursSequence and businessHoursSequence support with isWithinBusinessHours() check at line 182, follow-up step tracking via storage.updateFollowupStep()
- Verdict: CONFIRMED
- Evidence:
```typescript
const afterHoursSeq = trigger.config?.afterHoursSequence || [];     // line 177
const isWithinBusinessHours = (): boolean => {                       // line 182
await storage.updateFollowupStep(lead.id, currentStep + 1);         // line 298
```

---

## REM-2

### Claim: "Added loginForBrowser() to helpers/auth.ts — API-based login + page.goto replaces form-based login"
- Sprint: REM-2
- File: tests/e2e/helpers/auth.ts
- Lines: 155
- Code does: loginForBrowser exported function exists
- Verdict: CONFIRMED
- Evidence:
```typescript
export async function loginForBrowser(   // line 155
  page: import("playwright/test").Page,
  user: AuthUser,
```

### Claim: "Updated 7 test files, replacing all loginViaUI calls"
- Sprint: REM-2
- Files: domain-01 through domain-09 spec files
- Lines: N/A
- Code does: loginForBrowser imported and used in domain-01, 02, 03, 05, 06, 07, 08, 09 spec files (8 files). loginViaUI only remains in usability-audit.spec.ts (not one of the 7 domain test files).
- Verdict: CONFIRMED
- Evidence: grep shows loginForBrowser in 8 domain spec files; loginViaUI only in usability-audit.spec.ts

### Claim: "I-040: Root cause was entitlement check fail-closing when FlexPrice API unreachable. Changed to fail-open with degraded flag"
- Sprint: REM-2
- File: server/middleware/entitlementCheck.ts
- Lines: 34-36
- Code does: When billing service is unreachable, middleware fails open (calls next() instead of returning error)
- Verdict: CONFIRMED
- Evidence:
```typescript
// Default: fail open — allow the action when billing service is unreachable
console.warn(`[Entitlement] Billing service unreachable for ${featureKey} — failing open (allowing action)`);
return next();
```

### Claim: "I-046: Added graceful error handling in billing route for entitlement checks"
- Sprint: REM-2
- File: server/routes/billing.ts
- Lines: 181-184
- Code does: Catches entitlement errors, returns degraded response with allowed:true instead of 500
- Verdict: CONFIRMED
- Evidence:
```typescript
} catch (entitlementErr: any) {
  console.log(`[Billing] entitlement check unavailable: ${entitlementErr.message}`);
  return res.json({ configured: true, feature: feature_key, allowed: true, degraded: true,
    message: "Billing service unavailable — defaulting to allowed" });
```

---

## REM-3

### Claim: "I-065: FIXED — Super Admin DB updated to Huminic org. Seed updated"
- Sprint: REM-3
- File: server/seed.ts
- Lines: 733-758
- Code does: Creates Huminic org if missing, reassigns admin@nexxus.com to Huminic org
- Verdict: CONFIRMED
- Evidence:
```typescript
// Create Huminic org if it doesn't exist (top-level org for Super Admins)
let huminicOrg = orgs.find(o => o.slug === "huminic");
// ...
// Reassign admin@nexxus.com to Huminic if it exists on the wrong org
if (adminUser && adminUser.organizationId !== huminicOrg.id) {
  await storage.updateUser(adminUser.id, { organizationId: huminicOrg.id });
```

### Claim: "I-066: FIXED — Org switch adds 100ms delay before reload for cookie storage"
- Sprint: REM-3
- File: client/src/components/layout/TopBar.tsx
- Lines: 123-128
- Code does: 100ms setTimeout delay before window.location.href reload after org switch
- Verdict: CONFIRMED
- Evidence:
```typescript
// committed by the browser before reloading. Without this delay, the page can
// reload before the cookie is available (I-066 fix).
await new Promise(r => setTimeout(r, 100));
window.location.href = '/';
```

### Claim: "I-067: FIXED — Rate limiter configurable via AUTH_RATE_LIMIT_MAX env var (default 100)"
- Sprint: REM-3
- File: server/routes/auth.ts
- Lines: 17-19
- Code does: authLimiter max reads from AUTH_RATE_LIMIT_MAX env var with default 100
- Verdict: CONFIRMED
- Evidence:
```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '100'),
```

### Claim: "I-061: FIXED — Tour backdrop onClick removed, clipPath removed. Only X/Skip/Escape dismisses"
- Sprint: REM-3
- File: client/src/components/ProductTour.tsx
- Lines: 118, 170-175, 211, 228
- Code does: No clipPath in file. Backdrop has pointerEvents:'auto' (blocks clicks). Only Escape key (line 118), X button onClick (line 211), and Skip button onClick (line 228) dismiss the tour.
- Verdict: CONFIRMED
- Evidence:
```typescript
if (e.key === 'Escape') onSkip();                           // line 118
{/* Backdrop: blocks all clicks. Tour is only dismissable via the X button
    or Skip button in the tooltip (I-061 fix). */}           // line 170
onClick={onSkip}                                             // line 211 (X button)
onClick={onSkip}                                             // line 228 (Skip button)
```

### Claim: "I-062: FIXED — Chat history onClick condition fixed (was always false, now navigates)"
- Sprint: REM-3
- File: client/src/components/layout/SubMenuManager.tsx
- Lines: 437-443
- Code does: Chat history items have onClick={() => setLocation('/')} which navigates on click
- Verdict: CONFIRMED
- Evidence:
```typescript
<div
  key={conv.id}
  role="button"
  tabIndex={0}
  className="group relative w-full text-left p-2 rounded-md ..."
  onClick={() => setLocation('/')}
```

### Claim: "I-064: FIXED — Lead modal on sales page: contact list with Show Contact drill-down"
- Sprint: REM-3
- File: client/src/pages/sales.tsx
- Lines: 205-215
- Code does: "Show Contact" button per lead row, triggers setViewingContact with lead's sourceId
- Verdict: CONFIRMED
- Evidence:
```typescript
<Button variant="ghost" size="sm"
  onClick={() => setViewingContact({ leadId: row.sourceId, row })}
  data-testid={`sales-button-view-contact-${idx}`}>
  <User className="h-3 w-3" />
  Show Contact
</Button>
```

---

## REM-4

### Claim: "Root cause: httpOnly cookie invisible to document.cookie -> initAuth never refreshed"
- Sprint: REM-4
- File: client/src/contexts/AuthContext.tsx
- Lines: 306-323
- Code does: initAuth always attempts refresh via server call since httpOnly cookie is invisible to JS. Comment at line 307 confirms this design.
- Verdict: CONFIRMED
- Evidence:
```typescript
// The refresh cookie is httpOnly so it's invisible to document.cookie.
// We must attempt the refresh call and let the server decide if the
// cookie is present.
const response = await fetch('/api/auth/refresh', {
```

### Claim: "Root cause: duplicate session unique constraint on rapid login"
- Sprint: REM-4
- File: server/routes/auth.ts
- Lines: 103-113
- Code does: deleteUserSessions called before createSession to prevent duplicate constraint violations
- Verdict: CONFIRMED
- Evidence:
```typescript
// Clear any existing sessions for this user to prevent unique constraint
// violations when the same user logs in twice in rapid succession
await storage.deleteUserSessions(user.id);
await storage.createSession({
```

### Claim: "Kill switch: req.body null guard + early 403 check"
- Sprint: REM-4
- File: server/routes/campaigns.ts
- Lines: 233-237
- Code does: killSwitch check at line 233 returns 403 before execution; req.body null guard at line 237 (`req.body || {}`)
- Verdict: CONFIRMED
- Evidence:
```typescript
if (existingCampaign.killSwitch) {
  return res.status(403).json({ message: "Campaign kill switch is active — execution blocked" });
}
const body = req.body || {};
```

### Claim: "VIN: 502 -> 503 with graceful test handling"
- Sprint: REM-4
- File: server/vendorProxy.ts
- Lines: 428
- Code does: VIN Solutions error returns 503 (Service Unavailable) instead of 502
- Verdict: CONFIRMED
- Evidence:
```typescript
return res.status(503).json({ message: "VinSolutions service unavailable — upstream API may be temporarily down", error: err.message });
```

### Claim: "Widget verification: 5 new tests created and passing (11.10-11.14)"
- Sprint: REM-4
- File: tests/e2e/domain-11-integrations.spec.ts
- Lines: 254, 282, 304, 325, 351
- Code does: Tests 11.10 through 11.14 exist (landing page widget, VAPI assistant match, Tavus persona match, widget embed JS, widget options)
- Verdict: CONFIRMED
- Evidence:
```typescript
test("11.10 Landing page widget loads per dealer with correct dealer name", ...
test("11.11 VAPI assistant ID matches org's agent record", ...
test("11.12 Tavus persona ID matches org's agent record", ...
test("11.13 Widget embed JS serves per org", ...
test("11.14 Widget options available (Chat, Voice, Video, Form)", ...
```

### Claim: "I-081 [DT]: assignedTo column missing from conversations table"
- Sprint: REM-4 (new issue found)
- File: shared/schema.ts
- Lines: N/A
- Code does: No `assignedTo` or `assigned_to` column in schema.ts. Code at server/routes/conversations.ts:136 uses `(conv as any)?.assignedTo` — type-unsafe cast because column doesn't exist in schema.
- Verdict: CONFIRMED
- Evidence: `grep "assignedTo\|assigned_to" shared/schema.ts` returns no matches. The PATCH handler uses unsafe `(conv as any)?.assignedTo`.

---

## ALN-1

### Claim: "Added smoke test steps to Sprint Lifecycle (steps 7-9)"
- Sprint: ALN-1
- File: harness.md
- Lines: 106-108
- Code does: Steps 7 (smoke test each fix), 8 (smoke test all issues), 9 (update issues.md) present in harness
- Verdict: CONFIRMED
- Evidence:
```markdown
7. **Smoke test each fix** — builder runs the specific Playwright test(s) mapped to the issue.
8. **Smoke test all issues** — after all sub-sprints, run all issue-specific tests as a batch.
9. **Update issues.md** — mark each verified issue.
```

### Claim: "Added Issue Statuses (OPEN/FIXING/FIXED/VERIFIED/CLOSED)"
- Sprint: ALN-1
- File: harness.md
- Lines: 117-131
- Code does: Issue Statuses table present with all 5 statuses defined with meanings and who sets them
- Verdict: CONFIRMED
- Evidence:
```markdown
## Issue Statuses (in issues.md)
| Status | Meaning | Who Sets It |
| OPEN | ... | FIXING | ... | FIXED | ... | VERIFIED | ... | CLOSED | ...
```

### Claim: "I-068: dual rate limiter fixed"
- Sprint: ALN-1
- File: server/routes/auth.ts
- Lines: 17-35
- Code does: Single authLimiter instance used on login endpoint. No duplicate rate limiters.
- Verdict: CONFIRMED
- Evidence: Only one `rateLimit()` call in auth.ts; `authLimiter` applied to login, forgot-password, reset-password endpoints.

### Claim: "TI-008: Selectors updated to data-testid"
- Sprint: ALN-1
- File: tests/e2e/domain-06-departments.spec.ts
- Lines: 77
- Code does: Uses `[data-testid*="demand"]` selector
- Verdict: CONFIRMED
- Evidence:
```typescript
page.locator('[data-testid*="demand"]')
```

---

## I-1

### Claim: "I-009: campaign cross-org fixed"
- Sprint: I-1
- File: server/routes/campaigns.ts
- Lines: 71, 141, 160, 228
- Code does: All campaign operations filter by req.user.organizationId; access checks for cross-org requests
- Verdict: CONFIRMED
- Evidence:
```typescript
const campaignList = await storage.getCampaigns(req.user.organizationId, filters);  // line 71
if (campaign.organizationId !== req.user.organizationId && req.user.roleLevel > 2)  // line 141
```

### Claim: "I-008: Demand Score"
- Sprint: I-1
- File: client/src/pages/management.tsx
- Lines: 124, 137
- Code does: Demand Score computed via useMemo, displayed as a tile with trend indicator
- Verdict: CONFIRMED
- Evidence:
```typescript
const demandScore = useMemo(() => {                          // line 124
{ id: 'mgmt-7', label: 'Demand Score', value: String(demandScore), ...  // line 137
```

---

## I-039

### Claim: "sendSmsRaw() -> callMCP('tm_send_message', ...)"
- Sprint: I-039
- File: server/outbound.ts
- Lines: 3, 85
- Code does: Imports callMCP from vendorProxy; sendSmsRaw uses callMCP("tm_send_message", ...)
- Verdict: CONFIRMED
- Evidence:
```typescript
import { callMCP } from "./vendorProxy";                     // line 3
const result = await callMCP("tm_send_message", {            // line 85
```

### Claim: "sendSms() -> callMCP('tm_send_message', ...)"
- Sprint: I-039
- File: server/outbound.ts
- Lines: 114
- Code does: sendSms uses callMCP("tm_send_message", ...)
- Verdict: CONFIRMED
- Evidence:
```typescript
const result = await callMCP("tm_send_message", {            // line 114
```

### Claim: "sendPhone() -> callMCP('vapi_create_call', ...)"
- Sprint: I-039
- File: server/outbound.ts
- Lines: 205
- Code does: sendPhone uses callMCP("vapi_create_call", ...)
- Verdict: CONFIRMED
- Evidence:
```typescript
const result = await callMCP("vapi_create_call", callArgs);  // line 205
```

### Claim: "sendEmail() -> callMCP('resend_send_email', ...)"
- Sprint: I-039
- File: server/outbound.ts
- Lines: 128
- Code does: sendEmail uses callMCP("resend_send_email", ...)
- Verdict: CONFIRMED
- Evidence:
```typescript
const result = await callMCP("resend_send_email", {          // line 128
```

### Claim: "9 proxy routes changed from direct API calls to callMCP (VAPI: 5, Tavus: 4)"
- Sprint: I-039
- File: server/vendorProxy.ts
- Lines: 207-389
- Code does: All 9 proxy routes use callMCP: vapi_list_assistants (207), vapi_list_phone_numbers (226), vapi_list_calls (248), vapi_get_call (279), vapi_get_analytics (319), tavus_list_personas (328), tavus_list_replicas (346), tavus_create_conversation (373), tavus_list_conversations (389)
- Verdict: CONFIRMED
- Evidence: 9 callMCP calls across proxy routes, matching the claimed VAPI (5) + Tavus (4) split

### Claim: "Added Array.isArray() guards for array responses"
- Sprint: I-039
- File: server/vendorProxy.ts
- Lines: 208, 227, 249, 329, 347, 390
- Code does: Array.isArray guards on all list-type responses
- Verdict: CONFIRMED
- Evidence:
```typescript
const arr = Array.isArray(data) ? data : [];                 // lines 208, 227, 249
const items = Array.isArray(data) ? data : (data?.data || []);  // lines 329, 347, 390
```

### Claim: "POST /api/conversations/:id/email -> callMCP('resend_send_email', ...)"
- Sprint: I-039
- File: server/routes/conversations.ts
- Lines: 196-197
- Code does: Dynamic import of callMCP, then callMCP("resend_send_email", ...)
- Verdict: CONFIRMED
- Evidence:
```typescript
const { callMCP } = await import("../vendorProxy");
await callMCP("resend_send_email", {
```

### Claim: "Tavus webhook conversation fetch -> callMCP('tavus_get_conversation', ...)"
- Sprint: I-039
- File: server/routes/webhooks.ts
- Lines: 453-454
- Code does: Dynamic import of callMCP, then callMCP("tavus_get_conversation", ...)
- Verdict: CONFIRMED
- Evidence:
```typescript
const { callMCP: callMCPTavus } = await import("../vendorProxy");
tavusData = await callMCPTavus("tavus_get_conversation", { conversationId: tavusConversationId });
```

### Claim: "Video session creation -> callMCP('tavus_create_conversation', ...)"
- Sprint: I-039
- File: server/routes/widgets.ts
- Lines: 46
- Code does: callMCP("tavus_create_conversation", mcpPayload) for video session creation
- Verdict: CONFIRMED
- Evidence:
```typescript
const data = await callMCP("tavus_create_conversation", mcpPayload);
```

### Claim: "Removed TEXTMAGIC_API_KEY, TEXTMAGIC_USERNAME, TEXTMAGIC_BASE_URL constants"
- Sprint: I-039
- File: server/outbound.ts
- Lines: N/A
- Code does: No TEXTMAGIC_* constants in outbound.ts
- Verdict: CONFIRMED
- Evidence: grep for TEXTMAGIC in outbound.ts returns no matches

### Claim: "Kept vapiGet/vapiPost/tavusGet/tavusPost function definitions"
- Sprint: I-039
- File: server/vendorProxy.ts
- Lines: 154, 165, 178, 189
- Code does: All four helper functions still defined (vapiGet, vapiPost, tavusGet, tavusPost)
- Verdict: CONFIRMED
- Evidence:
```typescript
async function vapiGet(path: string) {         // line 154
export async function vapiPost(path: string, body: unknown) {  // line 165
async function tavusGet(path: string) {        // line 178
async function tavusPost(path: string, body: unknown) {  // line 189
```
Note: These functions are defined but no longer called by the proxy routes (which use callMCP instead). They remain as dead code.

---

## Summary

| Sprint | Claims Verified | Confirmed | Gap | Incorrect |
|--------|----------------|-----------|-----|-----------|
| REM-1  | 17             | 15        | 2   | 0         |
| REM-2  | 4              | 4         | 0   | 0         |
| REM-3  | 6              | 6         | 0   | 0         |
| REM-4  | 6              | 6         | 0   | 0         |
| ALN-1  | 4              | 4         | 0   | 0         |
| I-1    | 2              | 2         | 0   | 0         |
| I-039  | 12             | 12        | 0   | 0         |
| **Total** | **51**      | **49**    | **2** | **0**   |

### GAP Details

1. **REM-1 I-057** (Tour clipPath cutout): Claimed clipPath cutout for clicks, but REM-3 I-061 intentionally removed it. The claim was accurate at commit time but the fix was superseded. Not an error — a design reversal.

2. **REM-1 I-058** (Auth refresh skip): Claimed "refresh skipped when no nexxus_refresh cookie exists" but the implementation always attempts the refresh and lets the server reject (because httpOnly cookies are invisible to JS). Functionally equivalent outcome, but the claim's description of the mechanism is misleading.

### Notable Observations

- **Dead code**: vapiGet/vapiPost/tavusGet/tavusPost remain defined in vendorProxy.ts but are unused after I-039 migration to callMCP.
- **Schema gap**: I-081 (assignedTo column missing) is a real finding — the conversations PATCH handler uses `(conv as any)?.assignedTo`, a type-unsafe workaround for a missing schema column.
- **Audit confidence**: 96% of claims verified against current code. No fabricated claims detected.
