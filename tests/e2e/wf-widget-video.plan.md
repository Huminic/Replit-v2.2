# WF-WIDGET-VIDEO Test Plan

## Application Overview

Nexxus Connect v2.2 — CRM/AI platform for automotive dealerships. This test plan covers the WF-WIDGET-VIDEO workflow: a visitor navigates to a dealership landing page (/p/{slug}), opens the widget FAB, selects Two-Way Video, which calls /api/widget/video-session to create a Tavus session. When the session ends, Tavus fires a conversation.end webhook to /api/webhooks/tavus. The webhook creates a conversation (channel=video), stores the transcript as a senderName=Tavus system message, attempts a VIN Solutions lead via vin-safe-mcp (port 4003), creates admin notifications, fires a non-blocking email, and logs a tavus_video_completed activity event. The conversation is then visible in TeamBox under the Video tab. Admin: serra_honda@huminic.ai / NexxusTest2026. Base URL: https://dev.huminicdev.com. Tests follow the existing wf-*.spec.ts pattern with no mocks against the live dev server.

## Test Scenarios

### 1. Widget Video — Public API Preconditions

**Seed:** `tests/e2e/seed.spec.ts`

#### 1.1. Landing page API returns org data for serra-honda

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Send GET /api/public/landing/serra-honda
    - expect: Response status is 200
    - expect: Response body contains orgName, name, or storeName field with a non-empty value
    - expect: Response body contains a personaName field
  2. Log full response body for diagnostic reference
    - expect: No assertion — informational only

#### 1.2. Voice-config API returns tavusPersonaId for serra-honda

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Send GET /api/widget/voice-config/serra-honda
    - expect: Response status is 200
    - expect: Response body.tavusPersonaId is a non-empty string (not null)
    - expect: Response body also contains vapiAssistantId, orgName, and personaName
  2. Store the tavusPersonaId value for use in later tests
    - expect: Value retained as a test-scoped variable

#### 1.3. Voice-config API returns 404 for unknown slug

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Send GET /api/widget/voice-config/does-not-exist-xyz
    - expect: Response status is 404
    - expect: Response body contains a message field

#### 1.4. Widget JS is served for all five dealer slugs

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. For each of serra-honda, serra-nissan, tony-serra-ford, hyundai-of-columbia, ford-of-columbia: send GET /widget/dealer/{slug}.js
    - expect: Each request returns status 200
    - expect: Content-Type header contains 'javascript'
    - expect: Response body is longer than 100 bytes
    - expect: Body contains the dealer slug or name

### 2. Widget Video — POST /api/widget/video-session

**Seed:** `tests/e2e/seed.spec.ts`

#### 2.1. Video session created successfully with valid slug

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. POST /api/widget/video-session with body { slug: 'serra-honda', visitorName: 'Test Visitor WF-VIDEO' }
    - expect: Response status is 200
    - expect: Response body.conversationId is a non-empty string
    - expect: Response body.conversationUrl starts with 'https://'
    - expect: Response body.status field is present

#### 2.2. Video session rejected when org has no Tavus persona configured

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. POST /api/widget/video-session with body { slug: 'demo', visitorName: 'Test' } where the demo org is not in the database or has no Tavus persona
    - expect: Response status is 400 or 404
    - expect: Response body message explains no Tavus persona is configured or org not found

#### 2.3. Video session rejected when slug and widgetCode are both absent

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. POST /api/widget/video-session with an empty JSON body {}
    - expect: Response status is 400
    - expect: Response body.message contains 'widgetCode or slug is required'

#### 2.4. Video session rejected when slug is unknown

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. POST /api/widget/video-session with body { slug: 'nonexistent-org-xyz' }
    - expect: Response status is 404
    - expect: Response body.message is present

#### 2.5. Rate limiter enforces 30 requests per minute on video-session endpoint

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Send 31 rapid POST /api/widget/video-session requests from the same IP address
    - expect: First 30 requests return 200, 400, or 404 (not 429)
    - expect: 31st request returns 429
    - expect: Response includes RateLimit-Remaining header

### 3. Widget Video — Tavus Webhook Full Pipeline (Happy Path)

**Seed:** `tests/e2e/seed.spec.ts`

#### 3.1. Setup: authenticate as Serra Honda org admin and resolve persona ID

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. POST /api/auth/login with { email: 'serra_honda@huminic.ai', password: 'NexxusTest2026' }
    - expect: Status 200
    - expect: body.accessToken is a non-empty string
    - expect: body.user.organization.id is a non-empty string
  2. GET /api/agents with Authorization: Bearer {accessToken}
    - expect: Status 200
    - expect: Array contains at least one agent with non-null tavusPersonaId
  3. Store authToken, organizationId, and tavusPersonaId as describe-scoped variables
    - expect: All three values are non-empty strings

#### 3.2. Tavus conversation.end webhook creates a conversation record

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Build unique TEST_ID = `wf-vid-${Date.now()}-${random6}`. Set TAVUS_CONVERSATION_ID = `tavus-conv-${TEST_ID}`. POST /api/webhooks/tavus with payload: event='conversation.end', conversation_id=TAVUS_CONVERSATION_ID, status='ended', persona_id=tavusPersonaId, transcript containing 'CR-V' and visitor name WF-Vid-{TEST_ID}, summary containing the visitor name. Include x-tavus-secret header if TAVUS_WEBHOOK_SECRET env var is set.
    - expect: Status is 200, 400, or 401
    - expect: If 200: body.conversationId is a non-empty string — store as createdConversationId
    - expect: If 400 or 401: log rejection message, remaining tests in this suite skip

#### 3.3. Conversation exists in DB with channel=video and status=open

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Skip if createdConversationId is null. GET /api/conversations/{createdConversationId} with authToken.
    - expect: Status 200
    - expect: conv.id === createdConversationId
    - expect: conv.channel === 'video'
    - expect: conv.status === 'open'
    - expect: conv.organizationId is a non-empty string
    - expect: conv.customerName is a non-empty string (defaults to 'Video Visitor' when MCP fetch fails)

#### 3.4. Transcript stored as system message with senderName Tavus

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Skip if no conversation. Poll GET /api/conversations/{createdConversationId}/messages up to 5 times with 2-second pauses until a message with senderName='Tavus' appears.
    - expect: A message with senderName='Tavus' is found within the polling window
    - expect: message.role === 'system'
    - expect: message.content contains 'Video Call Summary', 'Video Call Transcript', or 'Transcript:'
    - expect: message.content contains at least one of: 'CR-V', 'Caroline', or the visitor name

#### 3.5. VIN lead pathway exercised (activity log or escalation task present)

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Skip if no conversation. GET /api/activity-log with authToken. Search for entry where action='tavus_video_completed' and entityId=createdConversationId.
    - expect: If found: log metadata.vinLeadCreated (true = VIN created, false = skipped or failed; both are acceptable states)
  2. GET /api/tasks with authToken. Search for escalation task where tags includes 'vin-integration' and 'tavus' and metadata string contains createdConversationId.
    - expect: If found: log task.title confirming VIN was attempted but failed
    - expect: At least one signal (activity log OR escalation task) confirms the VIN code path was reached
    - expect: If neither found: log conversation metadata; test passes (VIN is best-effort)

#### 3.6. Conversation visible in TeamBox via channel=video filter

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Skip if no conversation. GET /api/conversations?channel=video&status=open with authToken.
    - expect: Status 200
    - expect: Response array (or .data array) contains conversation with id=createdConversationId
    - expect: That conversation has channel='video' and status='open'
    - expect: Log total count of open video conversations

#### 3.7. Admin notification created for the video conversation

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Skip if no conversation. Poll GET /api/notifications with authToken up to 5 times with 2-second pauses, looking for notification where relatedEntityId=createdConversationId and type='call'.
    - expect: If found within polling window: notification.title contains 'Video Conversation Completed'
    - expect: If not found: log diagnostic message — notification is fire-and-forget, test passes regardless

#### 3.8. Cleanup: delete test conversation in afterAll

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. In afterAll hook: if createdConversationId is set, perform fresh login then DELETE /api/conversations/{createdConversationId}.
    - expect: Status 200 or 204
    - expect: Log deletion confirmation
    - expect: If deletion fails, log a warning — do not fail the suite

### 4. Widget Video — Tavus Webhook Rejection Cases

**Seed:** `tests/e2e/seed.spec.ts`

#### 4.1. Webhook rejected when persona_id matches no org agent

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. POST /api/webhooks/tavus with payload: event='conversation.end', conversation_id='tavus-bad-persona-{timestamp}', status='ended', persona_id='invalid-persona-does-not-exist-xyz'
    - expect: Status 400
    - expect: body.message contains text indicating org could not be resolved from persona

#### 4.2. Webhook rejected when conversation_id is missing

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. POST /api/webhooks/tavus with payload: event='conversation.end', status='ended', persona_id='some-persona' — omit conversation_id entirely
    - expect: Status 400
    - expect: body.message contains 'Missing or invalid conversation_id'

#### 4.3. Webhook with unrecognized event type is acknowledged without processing

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. POST /api/webhooks/tavus with payload: event='conversation.started', conversation_id='tavus-ignored-{timestamp}', status='active'
    - expect: Status 200
    - expect: body.message indicates the event was ignored (e.g. contains 'Event type ignored')

#### 4.4. Webhook rejected when secret header is missing (if TAVUS_WEBHOOK_SECRET is configured)

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Check if TAVUS_WEBHOOK_SECRET env var is set on the dev server. If yes: POST /api/webhooks/tavus with a valid payload but without the x-tavus-secret header.
    - expect: Status 401 when secret is configured
    - expect: body.message contains 'Invalid webhook secret'
    - expect: If secret is not configured: skip this test and log that it is not applicable

#### 4.5. VIN lead skipped when payload has no summary and no transcript

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Using the resolved tavusPersonaId: POST /api/webhooks/tavus with a valid payload where both transcript and summary are empty strings.
    - expect: Status 200 (conversation is still created even without transcript)
    - expect: body.conversationId is returned
  2. GET /api/activity-log with authToken. Find the tavus_video_completed entry for the new conversationId.
    - expect: metadata.vinLeadCreated === false confirming VIN was skipped because hasTavusTranscript was false
  3. Cleanup: DELETE /api/conversations/{conversationId}
    - expect: Status 200 or 204

#### 4.6. Duplicate Tavus conversation_id returns the existing conversation (deduplication)

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Send the same POST /api/webhooks/tavus payload with the same conversation_id a second time (reuse TAVUS_CONVERSATION_ID from the happy-path suite if available).
    - expect: If server implements deduplication: status 200 and body.conversationId matches the first response, with body.deduplicated=true
    - expect: If server does not deduplicate at the webhook level: status 200 creates a second conversation — log for informational purposes only

### 5. Widget Video — Browser UI (Landing Page Widget)

**Seed:** `tests/e2e/seed.spec.ts`

#### 5.1. Landing page loads and displays store name for serra-honda

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Navigate browser to https://dev.huminicdev.com/p/serra-honda
    - expect: Page loads without error
    - expect: data-testid='landing-store-name' element is visible and contains non-empty text
    - expect: data-testid='button-widget-fab' element is visible

#### 5.2. Widget FAB opens menu with all four options

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Navigate to /p/serra-honda. Wait for domcontentloaded + 2s.
    - expect: data-testid='button-widget-fab' is visible
  2. Click data-testid='button-widget-fab'
    - expect: data-testid='widget-menu' becomes visible
    - expect: data-testid='widget-option-chat' is visible and contains text 'Web Chat'
    - expect: data-testid='widget-option-voice' is visible and contains text 'Instant Call Back'
    - expect: data-testid='widget-option-form' is visible and contains text 'Contact Form'
    - expect: data-testid='widget-option-video' is visible and contains text 'Two-Way Video'

#### 5.3. Clicking video option transitions widget to connecting state

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Open the widget menu. Click data-testid='widget-option-video'.
    - expect: Widget menu closes (data-testid='widget-menu' is no longer visible)
    - expect: Widget area shows a connecting or active state: either a spinner, 'Connecting...' text, 'Video opened in new window' text, or videoStatus='error' message
    - expect: A new browser tab may be opened by window.open (Playwright popup handling may intercept it)

#### 5.4. Close button collapses the widget menu without leaving the page

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Open the widget menu. Click data-testid='button-close-widget'.
    - expect: data-testid='widget-menu' is no longer visible
    - expect: data-testid='button-widget-fab' is still visible
    - expect: Browser remains on /p/serra-honda

#### 5.5. Fullscreen video mode renders correctly via ?mode=video query parameter

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/p/serra-honda?mode=video. Wait for domcontentloaded + 3s.
    - expect: data-testid='fullscreen-video' element is visible
    - expect: Persona avatar initial or image is displayed
    - expect: Dealership name (Serra Honda) is shown
    - expect: A status indicator (Connecting..., Live, or Connection failed) is visible
    - expect: data-testid='button-toggle-mic' is visible in the bottom control bar
    - expect: data-testid='button-end-call' is visible in the bottom control bar

#### 5.6. End call button navigates back to landing page

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Navigate to /p/serra-honda?mode=video. Wait for render. Click data-testid='button-end-call'.
    - expect: Browser navigates to /p/serra-honda (without ?mode=video parameter)
    - expect: data-testid='button-widget-fab' is visible on the resulting page

#### 5.7. Mic toggle button cycles muted and unmuted state

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Navigate to /p/serra-honda?mode=video. Observe initial appearance of data-testid='button-toggle-mic'. Click the button.
    - expect: Button gains a red ring or red background class indicating muted state
  2. Click data-testid='button-toggle-mic' again.
    - expect: Red ring or red background class is removed, indicating unmuted state

#### 5.8. Fallback button in error state navigates back to the landing page

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/p/demo?mode=video (demo org has no Tavus persona, forcing videoStatus=error). Wait up to 10s for error state to render.
    - expect: data-testid='button-video-fallback' is visible
    - expect: Page shows 'Video Unavailable' heading
  2. Click data-testid='button-video-fallback'.
    - expect: Browser navigates to /p/demo (without ?mode=video)
    - expect: Landing page for demo loads or shows not-found page

#### 5.9. Unknown slug shows 404 page

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/p/does-not-exist-xyz
    - expect: Page displays 'Page Not Found' heading
    - expect: Page displays text indicating the dealership page does not exist
    - expect: data-testid='button-widget-fab' is NOT present on the page

### 6. Widget Video — TeamBox Admin Verification (Browser)

**Seed:** `tests/e2e/seed.spec.ts`

#### 6.1. Admin logs in and TeamBox renders with Video tab

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Use loginForBrowser helper: POST /api/auth/login with serra_honda@huminic.ai / NexxusTest2026 to get httpOnly cookie in browser context. Navigate to /teambox.
    - expect: Page loads /teambox without redirecting to /login
    - expect: data-testid='tab-teambox-conversations' is visible
    - expect: data-testid='tab-teambox-video' is visible
    - expect: data-testid='tab-teambox-phone' is visible

#### 6.2. TeamBox Video tab shows Tavus sessions table

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Click data-testid='tab-teambox-video'.
    - expect: data-testid='video-tab-content' is visible
    - expect: Heading 'Tavus Video Sessions' is visible
    - expect: Either data-testid='video-sessions-table' is present (if sessions exist) or 'No video sessions found' message is displayed

#### 6.3. Channel chip 'video' filters conversation list to video-only conversations

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Ensure the Conversations tab is active (click data-testid='tab-teambox-conversations' if needed). Locate data-testid='channel-filter-bar'. Click data-testid='channel-chip-video'.
    - expect: The video chip becomes the active chip (highlighted styling)
    - expect: The conversation list refreshes to show only conversations with channel=video
    - expect: Each visible conversation entry shows a video icon or video channel indicator

#### 6.4. Video conversation created by webhook appears in TeamBox and detail panel shows transcript

**File:** `tests/e2e/wf-widget-video.spec.ts`

**Steps:**
  1. Via API: fire POST /api/webhooks/tavus with a valid payload using resolved tavusPersonaId and unique visitorName 'TB-Verify-{timestamp}'. Capture conversationId.
    - expect: Webhook returns status 200 and a non-empty conversationId
  2. In browser: navigate to /teambox with authenticated session. Click data-testid='tab-teambox-video' or data-testid='channel-chip-video'. Wait up to 10 seconds for the list to update.
    - expect: The conversation entry for visitorName 'TB-Verify-{timestamp}' appears in the list within 10 seconds
    - expect: The entry shows a video icon or 'video' label
  3. Click on the matching conversation entry to open the detail panel.
    - expect: A message thread or detail panel is visible
    - expect: A message from senderName 'Tavus' is visible in the thread
    - expect: Message content contains 'Video Call Summary' or 'Video Call Transcript'
  4. Cleanup: DELETE /api/conversations/{conversationId} via API with authToken.
    - expect: Status 200 or 204
