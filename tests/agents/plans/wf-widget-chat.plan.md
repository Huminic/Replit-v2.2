# WF-WIDGET-CHAT Test Plan

## Application Overview

Nexxus Connect v2.2 is a CRM/AI platform for automotive dealerships. The WF-WIDGET-CHAT workflow covers the end-to-end journey of a website visitor who arrives at a dealership landing page, opens the embedded chat widget, types a message, receives an AI-generated response, and has that conversation automatically captured as a record visible in the internal TeamBox inbox.

Key system facts discovered during exploration:
- Public landing pages are served at /p/:slug and /w/:slug (e.g. /p/serra-honda, /w/demo). These routes are NOT auth-gated — they render without AuthProvider per App.tsx PublicRouter.
- The floating widget button (data-testid="button-widget-fab") opens a multi-channel menu: Web Chat, Instant Call Back, Contact Form, Two-Way Video.
- Selecting Web Chat (data-testid="widget-option-chat") opens a chat panel (data-testid="widget-chat") with AI greeting, typing indicator (data-testid="chat-typing-indicator"), and message bubbles indexed as chat-message-{i}.
- Chat messages are sent to POST /api/widget/chat with body {slug, message, conversationId}. A new conversation is created on the first message (channel="chat", status="open", customerName="Website Visitor").
- The AI response comes from Claude (claude-sonnet-4-6) using an org-specific system prompt plus any uploaded knowledge-base documents.
- On the first message, an auto-greeting may be prepended from the active agent if autoGreeting is configured.
- The created conversation is immediately visible in TeamBox (/teambox) under the All or Chat channel filter. Conversations are polled every 5 seconds.
- Active org_admin for Serra Honda: serra_honda@huminic.ai / NexxusTest2026.
- Rate limiting: 30 requests/minute per IP on /api/widget/chat (widgetLimiter + checkPublicRate with limit=30), 60/minute on general public endpoints.
- Contact form (POST /api/widget/contact) creates a separate conversation with channel="form".
- Five dealer slugs available: serra-honda, serra-nissan, tony-serra-ford, hyundai-of-columbia, ford-of-columbia. Persona names: Caroline, Magnolia, Georgia, Elizabeth, Savannah respectively.
- TeamBox channel filter can be pre-activated via URL param: /teambox?channel=chat.

## Test Scenarios

### 1. Widget Chat Workflow

**Seed:** `tests/e2e/helpers/auth.ts`

#### 1.1. WF-WIDGET-CHAT-01: Happy path — visitor opens chat widget on Serra Honda landing page and receives AI response

**File:** `tests/e2e/wf-widget-chat.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/p/serra-honda in a fresh browser context (no auth cookies). The page is publicly accessible with no login required.
    - expect: Page loads at /p/serra-honda without redirect to /login
    - expect: Heading 'Serra Honda' is visible on the page
    - expect: A VIP test drive form with First Name, Last Name, Phone Number, Email, and interest fields is visible
    - expect: A floating widget button is visible in the bottom-right corner (data-testid='button-widget-fab')
  2. Record the current conversation count by calling GET /api/conversations authenticated as serra_honda@huminic.ai before the chat starts. Save this count as BEFORE_COUNT.
    - expect: API returns HTTP 200 with a JSON array of conversations
  3. Click the floating widget button (data-testid='button-widget-fab').
    - expect: A channel-selection menu appears (data-testid='widget-menu')
    - expect: The menu shows four options: 'Web Chat', 'Instant Call Back', 'Contact Form', 'Two-Way Video'
    - expect: The menu header displays 'Serra Honda' as the organization name
  4. Click the 'Web Chat' option (data-testid='widget-option-chat').
    - expect: The multi-channel menu closes
    - expect: A chat panel opens (data-testid='widget-chat')
    - expect: The chat panel header shows the AI persona name 'Caroline' and the status 'Online now'
    - expect: An initial AI greeting message is shown (data-testid='chat-message-0') containing a greeting referencing Serra Honda
    - expect: A text input (data-testid='input-widget-chat') and send button (data-testid='button-widget-send') are visible
  5. Click the chat input field (data-testid='input-widget-chat') and type the message: "I'm interested in a 2024 Honda Civic".
    - expect: The typed text appears in the input field
  6. Click the send button (data-testid='button-widget-send') to submit the message.
    - expect: The user message appears as a right-aligned bubble in the chat panel
    - expect: The input field is cleared after sending
    - expect: A typing indicator (data-testid='chat-typing-indicator') with three animated dots appears
    - expect: The send button shows a loading spinner
  7. Wait up to 15 seconds for the AI response to appear.
    - expect: The typing indicator disappears
    - expect: A new AI message bubble appears aligned to the left
    - expect: The AI response is non-empty and contextually relevant to a 2024 Honda Civic inquiry
    - expect: No error message such as 'having trouble connecting' is shown
  8. Log in as Serra Honda org admin: POST to /api/auth/login with {email: 'serra_honda@huminic.ai', password: 'NexxusTest2026'}. Navigate to https://dev.huminicdev.com/teambox.
    - expect: Login returns HTTP 200 with an accessToken
    - expect: TeamBox page loads showing the 'TeamBox' heading
    - expect: The conversation list shows conversations in the left column
  9. In the TeamBox left column, look for a recently created conversation from 'Website Visitor'. It should appear near the top of the list (sorted by most recent lastMessageAt).
    - expect: A conversation entry labeled 'Website Visitor' appears in the list
    - expect: The conversation shows a CHAT channel icon (MessageSquare)
    - expect: The conversation was created within the last few minutes
    - expect: The unread count badge on the conversation is 1 or greater
  10. Click the 'Website Visitor' conversation to open the message thread.
    - expect: The message thread shows the user message: "I'm interested in a 2024 Honda Civic"
    - expect: The message thread shows the AI response received during the widget session
    - expect: The Customer Info panel on the right shows: Name='Website Visitor', Channel='CHAT', Status='Open'
    - expect: Quick Actions (Call, Email, SMS) are present in the Customer Info panel
  11. Call GET /api/conversations authenticated and confirm the conversation count is BEFORE_COUNT + 1 or more.
    - expect: Conversation count increased by at least 1
    - expect: The new conversation has channel='chat' and status='open'

#### 1.2. WF-WIDGET-CHAT-02: Multi-turn conversation — visitor sends multiple messages in the same session

**File:** `tests/e2e/wf-widget-chat.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/w/demo (demo public landing page, resolves to first available org).
    - expect: Page loads with 'Demo Organization' heading
    - expect: Floating widget button is visible
  2. Click the widget button and select 'Web Chat'.
    - expect: Chat panel opens with the AI greeting message visible as the first bubble
  3. Send the first message: 'What SUVs do you have under $40,000?'
    - expect: User message appears as a right-aligned bubble
    - expect: Typing indicator appears briefly
    - expect: AI responds with content relevant to SUVs
    - expect: No error state is displayed
  4. Without reloading the page, send a second message: 'Do you offer financing?'
    - expect: Second message is sent with the same conversationId (conversation continues)
    - expect: AI responds and the response appears below the first AI reply
    - expect: Both user messages and both AI responses are visible in the chat scroll area
  5. Send a third message: 'Can I schedule a test drive this Saturday?'
    - expect: Third message appended to same thread
    - expect: AI responds appropriately
    - expect: All six messages (3 user + 3 AI, plus any auto-greeting) are visible in the scrollable chat area
  6. Using the conversationId returned from the widget chat API calls, call GET /api/conversations/{id}/messages authenticated as the org admin.
    - expect: The messages endpoint returns all messages in the thread
    - expect: Message roles alternate between 'user' and 'assistant'
    - expect: All message content matches what was displayed in the widget

#### 1.3. WF-WIDGET-CHAT-03: Widget menu navigation — back button and close button behave correctly

**File:** `tests/e2e/wf-widget-chat.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/p/serra-honda and open the widget by clicking the FAB button.
    - expect: Widget menu opens with all four channel options visible
  2. Click 'Web Chat' to open the chat panel.
    - expect: Chat panel (data-testid='widget-chat') is visible with AI greeting
  3. Click the back arrow button (data-testid='button-back-menu') in the chat panel header.
    - expect: Chat panel closes
    - expect: Widget menu (data-testid='widget-menu') reappears with all four options
    - expect: The FAB button is still visible
  4. Click the close button (data-testid='button-close-widget') on the menu header.
    - expect: The widget menu closes completely
    - expect: The floating widget button returns to its inactive (non-menu) state
    - expect: The landing page content is fully visible with no overlay
  5. Click the floating widget button again to reopen.
    - expect: The menu opens fresh showing all four channel options
    - expect: No stale chat messages or error states from the previous session are visible

#### 1.4. WF-WIDGET-CHAT-04: Edge case — send button disabled state and empty/whitespace message handling

**File:** `tests/e2e/wf-widget-chat.spec.ts`

**Steps:**
  1. Navigate to /p/serra-honda, open the widget, and navigate to the Web Chat panel.
    - expect: Chat panel opens with input field and send button visible
  2. Without typing anything, click the send button (data-testid='button-widget-send').
    - expect: No message is sent
    - expect: No network request is made to /api/widget/chat
    - expect: The chat panel shows no empty bubble and no error message
  3. Type three spaces in the input and click send.
    - expect: No message is sent (handleChatSend trims input)
    - expect: The whitespace input is rejected or cleared without a network request
  4. Type 'Hello' and submit. While the typing indicator is showing (chatLoading=true), attempt to click the send button again with a new message in the input.
    - expect: The send button is disabled (shows spinner) while loading
    - expect: No duplicate message or duplicate API call is triggered
    - expect: After the AI responds, the send button re-enables and accepts new input

#### 1.5. WF-WIDGET-CHAT-05: Edge case — widget on non-existent dealer slug shows 404 state

**File:** `tests/e2e/wf-widget-chat.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/p/this-dealership-does-not-exist-xyz.
    - expect: The page does NOT redirect to /login
    - expect: A 'Page Not Found' error message is displayed on the page
    - expect: The error text reads: 'This dealership landing page doesn't exist.'
    - expect: No JavaScript errors related to null org data are present in the console
  2. Make a direct API call: GET /api/public/landing/this-dealership-does-not-exist-xyz.
    - expect: API returns HTTP 404
    - expect: Response body contains {message: 'Organization not found'}

#### 1.6. WF-WIDGET-CHAT-06: Edge case — widget chat API rate limiting is enforced

**File:** `tests/e2e/wf-widget-chat.spec.ts`

**Steps:**
  1. Send 31 consecutive POST requests to /api/widget/chat from the same IP using slug='serra-honda' and message='Rate limit test'. Each request should be made in rapid succession (no delay between them).
    - expect: The first 30 requests return HTTP 200 with a valid response body (conversationId, response)
    - expect: The 31st request returns HTTP 429
    - expect: The 429 response body contains {error: 'Rate limit exceeded'} or {message: 'Too many requests'}
    - expect: Rate-limit headers (RateLimit-Limit, RateLimit-Remaining) are present on the 429 response
  2. Wait 61 seconds to allow the rate limit window to reset, then send one more request.
    - expect: The request returns HTTP 200 (rate limit has reset)

#### 1.7. WF-WIDGET-CHAT-07: API validation — missing and invalid fields return correct error responses

**File:** `tests/e2e/wf-widget-chat.spec.ts`

**Steps:**
  1. POST to /api/widget/chat with body {message: 'Hello'} — slug is missing.
    - expect: API returns HTTP 400
    - expect: Response body contains {message: 'slug and message are required'}
  2. POST to /api/widget/chat with body {slug: 'serra-honda'} — message is missing.
    - expect: API returns HTTP 400
    - expect: Response body contains {message: 'slug and message are required'}
  3. POST to /api/widget/chat with body {slug: 'unknown-slug-xyz', message: 'Hello'}.
    - expect: API returns HTTP 404
    - expect: Response body contains {message: 'Organization not found'}
  4. POST to /api/widget/chat with body {slug: 'serra-honda', message: 'Hello', conversationId: 'nonexistent-id-abc123'}.
    - expect: API returns HTTP 404
    - expect: Response body contains {message: 'Conversation not found'}

#### 1.8. WF-WIDGET-CHAT-08: TeamBox admin can view, reply to, and assign a widget chat conversation

**File:** `tests/e2e/wf-widget-chat.spec.ts`

**Steps:**
  1. Using the API, POST to /api/widget/chat with {slug: 'serra-honda', message: 'Admin verification test message'}. Record the returned conversationId and AI response.
    - expect: API returns HTTP 200 with a non-empty conversationId and a non-empty 'response' field
  2. Log in as Serra Honda org admin: POST to /api/auth/login with {email: 'serra_honda@huminic.ai', password: 'NexxusTest2026'}. Store the accessToken.
    - expect: HTTP 200 with accessToken
    - expect: User role is 'org_admin' and orgName is 'Serra Honda'
  3. Call GET /api/conversations with Authorization: Bearer {accessToken}. Find the conversation matching the conversationId from step 1.
    - expect: The conversation is present in the list
    - expect: conversation.channel === 'chat'
    - expect: conversation.status === 'open'
    - expect: conversation.customerName === 'Website Visitor'
    - expect: conversation.unreadCount is 1 or greater
  4. Navigate to https://dev.huminicdev.com/teambox authenticated as Serra Honda admin and wait for the conversation list to load.
    - expect: TeamBox page loads with 'TeamBox' heading
    - expect: The conversation list shows entries with CHAT channel icons
  5. Click on the 'Website Visitor' conversation created in step 1 (it should be near the top).
    - expect: The message thread opens showing 'Admin verification test message'
    - expect: The AI response is also visible in the thread
    - expect: Customer Info panel shows: Name='Website Visitor', Channel='CHAT', Status='Open'
    - expect: 'Assign to' dropdown shows 'Unassigned'
  6. In the 'Write a reply...' textarea, type 'A sales specialist will contact you shortly.' and click the send button.
    - expect: The reply appears in the thread attributed to the logged-in agent (Serra Honda Admin)
    - expect: The textarea is cleared after sending
  7. Use the 'Assign to' dropdown in the Customer Info panel to assign the conversation to a team member.
    - expect: The dropdown shows available team members
    - expect: After selecting, the assignment is reflected in the Customer Info panel

#### 1.9. WF-WIDGET-CHAT-09: All five dealer landing pages are publicly accessible with a functional widget

**File:** `tests/e2e/wf-widget-chat.spec.ts`

**Steps:**
  1. For each of the five dealer slugs (serra-honda, serra-nissan, tony-serra-ford, hyundai-of-columbia, ford-of-columbia), navigate to https://dev.huminicdev.com/p/{slug} and verify the page loads.
    - expect: All 5 pages load at /p/{slug} without redirecting to /login
    - expect: Each page shows the correct dealership name in the H1 heading
    - expect: Each page shows a floating widget FAB button
  2. For each dealer slug, call GET /api/public/landing/{slug}.
    - expect: Each call returns HTTP 200
    - expect: Response JSON contains: id (non-empty), name (correct dealer name), slug (matching the request), personaName (non-empty string)
  3. Open the widget menu on each dealer landing page and verify the persona name in the 'Two-Way Video' button label.
    - expect: Serra Honda: 'Face-to-face with Caroline'
    - expect: Serra Nissan: 'Face-to-face with Magnolia'
    - expect: Tony Serra Ford: 'Face-to-face with Georgia'
    - expect: Hyundai of Columbia: 'Face-to-face with Elizabeth'
    - expect: Ford of Columbia: 'Face-to-face with Savannah'

#### 1.10. WF-WIDGET-CHAT-10: Contact form sub-workflow — creates a conversation with channel='form'

**File:** `tests/e2e/wf-widget-chat.spec.ts`

**Steps:**
  1. Navigate to /p/serra-honda and open the widget menu by clicking the FAB button.
    - expect: Widget menu opens with 'Contact Form' option visible (data-testid='widget-option-form')
  2. Click 'Contact Form' (data-testid='widget-option-form') to open the form panel.
    - expect: A form panel opens (data-testid='widget-form' or similar)
    - expect: Fields are visible for Name, Email, optional Phone, and Message
    - expect: A submit button is present
  3. Fill in the form: Name='Jane Doe', Email='jane.doe@testexample.com', Phone='5559876543', Message='Information about financing options.'
    - expect: All fields accept the input without errors
  4. Submit the contact form.
    - expect: The submission completes successfully
    - expect: A success/confirmation state is shown in the widget panel
    - expect: No error message is displayed
  5. Log in as Serra Honda org admin and call GET /api/conversations. Find the conversation created by the form.
    - expect: A conversation exists with customerName='Jane Doe', customerEmail='jane.doe@testexample.com', channel='form', status='open'
    - expect: The conversation has a message containing the form content (name, email, phone, message body)
  6. Navigate to TeamBox and verify the contact form conversation appears in the list.
    - expect: The conversation from 'Jane Doe' is visible in the conversation list
    - expect: Clicking it opens the thread with the form content as the first message

#### 1.11. WF-WIDGET-CHAT-11: Security — public landing page does not expose auth-protected data or routes

**File:** `tests/e2e/wf-widget-chat.spec.ts`

**Steps:**
  1. From an unauthenticated context, call GET /api/conversations with no Authorization header.
    - expect: API returns HTTP 401
    - expect: No conversation data is returned in the response body
  2. From an unauthenticated context, call GET /api/widgets with no Authorization header.
    - expect: API returns HTTP 401
    - expect: Widget configuration data is not exposed
  3. Navigate to https://dev.huminicdev.com/teambox in a browser with no login session.
    - expect: Browser redirects to /login
    - expect: TeamBox content is not rendered
    - expect: No conversation data is visible on the page
  4. Call GET /api/widgets/public/{widgetCode} with a known widget code (e.g. from the static widget list: widget_txt_a1b2c3).
    - expect: If the widget code exists in the DB: response is HTTP 200 with only safe public fields (widgetCode, type, name, orgName, personaName, appearance, channels) — no internal IDs, auth tokens, or sensitive config
    - expect: If it does not exist in the DB: HTTP 404

#### 1.12. WF-WIDGET-CHAT-12: TeamBox channel filter — Web Chat filter shows only chat-channel conversations

**File:** `tests/e2e/wf-widget-chat.spec.ts`

**Steps:**
  1. Log in as Serra Honda org admin and navigate to https://dev.huminicdev.com/teambox.
    - expect: TeamBox loads with 'All' filter active
    - expect: Total conversation count is shown in the 'All 65' button (or similar)
  2. Navigate to https://dev.huminicdev.com/teambox?channel=chat to activate the chat channel filter via URL parameter.
    - expect: Page loads with the chat filter pre-selected or reflected in the active state
    - expect: The conversation count badge updates to show fewer conversations than the total (e.g. '48' instead of '65')
    - expect: All visible conversations display the CHAT (MessageSquare) channel icon
    - expect: No SMS, Email, or Voice conversations appear in the filtered list
  3. Click any conversation in the chat-filtered list.
    - expect: The conversation detail shows 'CHAT' as the channel badge in the thread header
  4. Click the 'SMS' channel filter button in the TeamBox sidebar (or top tab row).
    - expect: The list updates to show only SMS-channel conversations
    - expect: Chat conversations are no longer visible in the filtered list
  5. Click 'All' to return to the unfiltered view.
    - expect: The full conversation list is restored to the original total count
