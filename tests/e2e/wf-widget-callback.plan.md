# Widget Callback Workflow Test Plan

## Application Overview

Tests the WF-WIDGET-CALLBACK end-to-end workflow on the Nexxus Connect CRM/AI platform for automotive dealerships. The workflow covers: (1) a visitor arriving at a public landing page (/p/{slug}), (2) opening the engagement widget, (3) selecting the "Instant Call Back" voice option, (4) entering a phone number and submitting, (5) the server resolving the org, finding the active VAPI voice agent, and dispatching an outbound call via vapi_create_call through the central-mcp proxy, (6) a conversation record being created in the database with channel="voice", and (7) the resulting conversation being visible in the admin TeamBox. The workflow is unauthenticated on the visitor side (public route /api/widget/voice-callback) and verified post-submission through authenticated admin API calls. Rate limiting (60 req/min per IP) and a voice-agent pre-requisite (org must have an active agent with vapiAssistantId) are critical boundary conditions.

## Test Scenarios

### 1. WF-WIDGET-CALLBACK: Happy Path — Callback Request Submitted

**Seed:** `tests/e2e/seed.spec.ts`

#### 1.1. WF-CB-01: Landing page loads for known slug

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Send GET request to /api/public/landing/serra-honda without authentication
    - expect: Response status is 200
    - expect: Response body contains orgName, personaName, and slug fields
    - expect: orgName matches 'Serra Honda'
  2. Navigate browser to https://dev.huminicdev.com/p/serra-honda
    - expect: Page renders without error state
    - expect: Store name element with data-testid='landing-store-name' is visible and contains 'Serra Honda'
    - expect: Engagement FAB button with data-testid='button-widget-fab' is visible in the viewport

#### 1.2. WF-CB-02: Widget FAB opens the engagement menu

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/p/serra-honda and wait for page to fully load
    - expect: Widget FAB (data-testid='button-widget-fab') is visible
  2. Click the FAB button (data-testid='button-widget-fab')
    - expect: Widget menu panel appears with data-testid='widget-menu'
    - expect: Four option buttons are displayed: Web Chat, Instant Call Back, Contact Form, Two-Way Video
    - expect: The 'Instant Call Back' option has data-testid='widget-option-voice' and shows label 'Get a call back now'
    - expect: The menu header shows 'Choose how to connect' and the org name 'Serra Honda'

#### 1.3. WF-CB-03: Clicking Instant Call Back opens phone input panel

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Open the widget menu (click data-testid='button-widget-fab'), then click data-testid='widget-option-voice'
    - expect: Widget menu closes and a voice panel appears with data-testid='widget-voice'
    - expect: Panel header shows 'Instant Call Back'
    - expect: Phone input field with data-testid='input-callback-phone' is visible and focused or ready for input
    - expect: Submit button with data-testid='button-callback-submit' is visible and has label 'Call Me'
    - expect: Submit button is initially disabled because the phone input is empty
  2. Type a single space character into data-testid='input-callback-phone'
    - expect: Submit button data-testid='button-callback-submit' remains disabled because whitespace-only input is invalid per the disabled={!callbackPhone.trim()} logic

#### 1.4. WF-CB-04: Callback submission triggers API call and shows success state

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Open the widget voice panel (FAB → Instant Call Back), then type '+15552223333' into data-testid='input-callback-phone'
    - expect: Submit button data-testid='button-callback-submit' becomes enabled
    - expect: Input shows the typed phone number
  2. Click data-testid='button-callback-submit'
    - expect: A loading spinner/state with text 'Requesting call back...' is displayed while the API call is in progress
  3. Wait for the API response (POST /api/widget/voice-callback)
    - expect: On success (200): panel transitions to success state showing 'We're calling you now!'
    - expect: Success state includes 'Please keep your phone nearby' message
    - expect: A 'Request another call' button with data-testid='button-callback-another' is visible
    - expect: No error message is shown
  4. Verify the network request that was made
    - expect: POST /api/widget/voice-callback was called with body: {slug: 'serra-honda', phoneNumber: '+15552223333'}
    - expect: Response status was 200
    - expect: Response body contained success=true, callId, and conversationId

#### 1.5. WF-CB-05: Callback API creates a voice conversation record

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Submit a callback request via POST /api/widget/voice-callback with body {slug: 'serra-honda', phoneNumber: '+14805550001'} and Content-Type: application/json
    - expect: Response status is 200
    - expect: Response body has success=true
    - expect: Response body has a non-empty callId string (VAPI call was dispatched)
    - expect: Response body has a non-empty conversationId string (DB record created)
  2. Authenticate as Serra Honda org admin (serra_honda@huminic.ai / NexxusTest2026) via POST /api/auth/login
    - expect: Login returns accessToken
  3. Fetch the conversation using GET /api/conversations/{conversationId} with Authorization: Bearer {accessToken}
    - expect: Response status is 200
    - expect: conversation.channel equals 'voice'
    - expect: conversation.status equals 'open'
    - expect: conversation.customerPhone equals '+14805550001' (E.164 formatted)
    - expect: conversation.customerName equals 'Callback Request'
    - expect: conversation.organizationId matches Serra Honda's org ID
  4. Fetch conversation messages using GET /api/conversations/{conversationId}/messages with Authorization: Bearer {accessToken}
    - expect: Response is 200 with an array
    - expect: At least one message exists created by the callback submission

#### 1.6. WF-CB-06: Created conversation appears in admin TeamBox voice queue

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. After submitting a callback via POST /api/widget/voice-callback (obtaining conversationId), authenticate as org admin and call GET /api/conversations?channel=voice&status=open
    - expect: Response is 200
    - expect: The conversation list contains an entry with id matching the returned conversationId
    - expect: That entry has channel='voice', status='open', and customerPhone matching the submitted number
  2. Also call GET /api/conversations?channel=voice (no status filter)
    - expect: The same conversation appears in the unfiltered list

### 2. WF-WIDGET-CALLBACK: Edge Cases and Validation

**Seed:** `tests/e2e/seed.spec.ts`

#### 2.1. WF-CB-07: Callback request rejected when phone number is missing

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Send POST /api/widget/voice-callback with body {slug: 'serra-honda'} and no phoneNumber field
    - expect: Response status is 400
    - expect: Response body contains a message field explaining that phone number is required
  2. Send POST /api/widget/voice-callback with body {slug: 'serra-honda', phoneNumber: ''} (empty string)
    - expect: Response status is 400
    - expect: Response body contains an error message

#### 2.2. WF-CB-08: Callback request rejected for unknown slug

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Send POST /api/widget/voice-callback with body {slug: 'does-not-exist-xyz', phoneNumber: '+15551234567'}
    - expect: Response status is 404
    - expect: Response body message indicates 'Organization not found'

#### 2.3. WF-CB-09: Callback request rejected when org has no active voice agent

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Identify a test org slug that has no active agents with vapiAssistantId configured (or use an org with agents that have no vapiAssistantId)
    - expect: This precondition can be verified via GET /api/agents authenticated to the target org
  2. Send POST /api/widget/voice-callback with body {slug: 'no-voice-agent-org', phoneNumber: '+15551234567'}
    - expect: Response status is 400
    - expect: Response body message indicates 'No voice agent configured for this organization'
    - expect: No VAPI call is dispatched
    - expect: No conversation record is created

#### 2.4. WF-CB-10: Phone number is normalized to E.164 format

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Send POST /api/widget/voice-callback with body {slug: 'serra-honda', phoneNumber: '(555) 123-4567'} (formatted with parentheses, spaces, hyphens)
    - expect: If a voice agent is configured and VAPI call succeeds, response is 200
    - expect: The conversationId in the response corresponds to a conversation where customerPhone is '+15551234567' (stripped of non-numeric characters, prefixed with +1)
  2. Send POST /api/widget/voice-callback with body {slug: 'serra-honda', phoneNumber: '+15559998877'} (already E.164)
    - expect: customerPhone stored as '+15559998877' unchanged (already has + prefix, no modification applied)
  3. Send POST /api/widget/voice-callback with body {slug: 'serra-honda', phoneNumber: '5551234567'} (10-digit no country code)
    - expect: customerPhone stored as '+15551234567' (prefixed with +1)

#### 2.5. WF-CB-11: Rate limiting enforced on voice-callback endpoint

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Note that the public rate limit is 60 requests per 60 seconds per IP. Send 61 rapid consecutive POST requests to /api/widget/voice-callback from the same IP with any body
    - expect: The first 60 requests return either 200 (if org/agent configured) or a non-429 error (400, 404, 500)
    - expect: The 61st (or later) request returns HTTP 429 with message 'Too many requests'
  2. Wait for the 60-second rate limit window to reset, then send one more request
    - expect: The request after the reset window succeeds with a non-429 status code

#### 2.6. WF-CB-12: Widget UI error state shown when callback API fails

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/p/serra-honda, open the widget, click Instant Call Back. Simulate an API failure by intercepting the POST /api/widget/voice-callback request and responding with HTTP 500
    - expect: After clicking 'Call Me', the widget transitions to an error state
  2. Observe the error state in the widget panel (data-testid='widget-voice')
    - expect: Error message 'Unable to place call. Please try again.' is displayed
    - expect: A retry button with data-testid='button-callback-retry' is visible
  3. Click the retry button (data-testid='button-callback-retry')
    - expect: Widget returns to idle state with the phone input form shown
    - expect: callbackStatus resets to 'idle'
    - expect: Phone input is cleared and ready for re-entry

#### 2.7. WF-CB-13: 'Request another call' resets the widget to idle state

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Complete a successful callback submission in the browser (widget reaches 'We're calling you now!' success state)
    - expect: 'Request another call' button with data-testid='button-callback-another' is visible
  2. Click data-testid='button-callback-another'
    - expect: Widget reverts to idle state showing the phone input form
    - expect: callbackStatus resets to 'idle'
    - expect: callbackPhone input field is empty
    - expect: Submit button data-testid='button-callback-submit' is disabled again

#### 2.8. WF-CB-14: Widget close button dismisses the voice panel

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Open widget, navigate to voice panel (FAB → Instant Call Back)
    - expect: Voice panel data-testid='widget-voice' is displayed
  2. Click the X close button in the voice panel header
    - expect: Widget panel closes and widgetMode returns to 'closed'
    - expect: Widget FAB is visible again
    - expect: No network request was made (form was not submitted)

#### 2.9. WF-CB-15: Back navigation from voice panel returns to menu

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Open widget menu, click 'Instant Call Back' to open voice panel
    - expect: Voice panel data-testid='widget-voice' is displayed
  2. Click the back arrow '←' button in the voice panel header
    - expect: Widget mode returns to 'menu' and the main widget menu panel data-testid='widget-menu' is shown again
    - expect: All four options (Web Chat, Instant Call Back, Contact Form, Two-Way Video) are visible

### 3. WF-WIDGET-CALLBACK: Voice Config API Pre-conditions

**Seed:** `tests/e2e/seed.spec.ts`

#### 3.1. WF-CB-16: Voice config endpoint returns VAPI assistant ID for configured org

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Send GET /api/widget/voice-config/serra-honda without authentication
    - expect: Response status is 200
    - expect: Response body contains vapiAssistantId field (may be a non-null string if a voice agent is configured, or null if not)
    - expect: Response body contains tavusPersonaId field
    - expect: Response body contains orgName: 'Serra Honda'
    - expect: Response body contains personaName field
  2. Send GET /api/widget/voice-config/does-not-exist-slug
    - expect: Response status is 404
    - expect: Response body message is 'Organization not found'

#### 3.2. WF-CB-17: Callback only dispatches VAPI call when vapiAssistantId is present

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Call GET /api/widget/voice-config/serra-honda to check whether vapiAssistantId is configured
    - expect: If vapiAssistantId is non-null: subsequent POST /api/widget/voice-callback returns 200 with callId present
    - expect: If vapiAssistantId is null: subsequent POST /api/widget/voice-callback returns 400 with 'No voice agent configured for this organization'

#### 3.3. WF-CB-18: VAPI call ID is returned in callback response

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Submit POST /api/widget/voice-callback with {slug: 'serra-honda', phoneNumber: '+14805550123'} and a voice agent is configured
    - expect: Response body includes callId field matching a VAPI-generated call ID (non-empty string)
    - expect: Response body includes conversationId field (UUID)
    - expect: Response body includes success: true
  2. Optionally verify the VAPI call via the proxy GET /api/integrations/vapi/calls with admin auth, looking for the returned callId
    - expect: If VAPI call list is available, the call ID from the response appears in the list of recent calls
    - expect: Call status is 'queued' or 'ringing' depending on response timing

#### 3.4. WF-CB-19: VAPI webhook end-of-call-report stores transcript for callback-initiated call

**File:** `tests/e2e/wf-widget-callback.spec.ts`

**Steps:**
  1. Complete steps from WF-CB-05 to obtain a real conversationId from a callback submission
    - expect: conversationId is stored and conversation has channel='voice'
  2. Simulate VAPI end-of-call-report webhook by sending POST /api/webhooks/vapi with the returned callId set as call.id, assistantId matching the org's voice agent, customer.number matching the submitted phone, a transcript, and a summary
    - expect: Webhook returns 200 or the conversation is updated
    - expect: A transcript message appears in GET /api/conversations/{conversationId}/messages with senderName='VAPI'
    - expect: Message content contains 'Call Summary' and the transcript text
  3. Poll GET /api/conversations/{conversationId}/messages up to 3 times with 2s delay to allow DB propagation
    - expect: Within 6 seconds, at least one message with senderName='VAPI' and role='system' exists in the conversation
    - expect: Message content includes the summary text that was sent in the webhook payload
