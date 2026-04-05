# Human Takeover Workflow (WF-TAKEOVER)

## Application Overview

Nexxus Connect v2.2 is a CRM/AI platform for automotive dealerships. TeamBox is the unified communication inbox where AI agents handle conversations automatically. The Human Takeover Workflow allows a human user to claim an AI-automated conversation, send manual replies, and then release it back to the AI agent. The takeover is implemented via PATCH /api/conversations/:id setting assignedTo to the current user ID. The server computes aiPaused as true when assignedTo is non-null, which blocks the SMS AI from responding. Release is done by setting assignedTo back to null. The Take Over button (data-testid=button-take-over) only renders when the conversation has agentId set AND status equals automated. There is no dedicated Release button — release is performed through the Assign to dropdown in the Customer Info panel by selecting Unassigned. Auth: serra_honda@huminic.ai / NexxusTest2026 (org_admin, Serra Honda).

## Test Scenarios

### 1. Human Takeover Workflow

**Seed:** `tests/e2e/seed.spec.ts`

#### 1.1. WF-TAKEOVER-01: Happy path — take over automated conversation, send message, release to AI

**File:** `tests/e2e/wf-takeover.spec.ts`

**Steps:**
  1. Log in via API POST /api/auth/login with body {email: 'serra_honda@huminic.ai', password: 'NexxusTest2026'} and capture the accessToken from the response body.
    - expect: Response status is 200
    - expect: Response body contains accessToken
  2. Set localStorage keys with prefix nexxus_tour_dismissed_ for all page segments (main, teambox, my-work, sales, service, marketing, management, agents, insights, settings, profile, usage) to 'true' to dismiss product tour overlays.
    - expect: All tour dismissal keys are set in localStorage before navigation
  3. Navigate to /teambox.
    - expect: Page URL contains /teambox
    - expect: The heading 'TeamBox' is visible
    - expect: The Conversations tab is active (data-testid=tab-teambox-conversations has border-primary styling)
    - expect: The channel filter bar is visible (data-testid=channel-filter-bar)
  4. In the left sidebar status filter, click the 'Automated' filter chip to show only automated conversations.
    - expect: The Automated filter chip becomes active (highlighted)
    - expect: The conversation list updates to show only conversations with status=automated
    - expect: Each conversation item in the list shows a purple Bot icon overlay on the avatar
  5. Select the first conversation in the list that has an AI agent assigned (look for a Bot icon badge). Click on it to open the conversation thread.
    - expect: The conversation thread loads in the center column
    - expect: Customer name is shown in the header (data-testid=text-conversation-customer)
    - expect: The channel badge is visible (e.g. SMS)
    - expect: The Take Over button is visible in the top-right of the thread header (data-testid=button-take-over)
    - expect: The Take Over button is not disabled
  6. Verify the current conversation status in the Customer Info panel on the right column. Check the Status badge.
    - expect: Status badge reads 'Automated'
    - expect: The 'Handled by' field in the Customer Info panel shows the AI agent name (data-testid=text-agent-name)
    - expect: The Assign to dropdown (data-testid=select-assign-to) shows 'Unassigned'
  7. Click the Take Over button (data-testid=button-take-over).
    - expect: A loading spinner briefly appears inside the Take Over button while the PATCH request is in flight
    - expect: A success toast notification appears with title 'Conversation taken over' and description 'AI responses paused. You are now handling this conversation.'
    - expect: The Take Over button disappears from the thread header (because status is no longer automated)
    - expect: The conversation list on the left refreshes (React Query invalidates /api/conversations)
  8. After takeover completes, verify the conversation state has changed by checking the Customer Info panel status badge and the Assign to dropdown.
    - expect: Status badge in Customer Info panel no longer reads 'Automated' — it reads 'Open'
    - expect: The Assign to dropdown (data-testid=select-assign-to) now shows the logged-in user's name (the org_admin for Serra Honda)
    - expect: The Take Over button is absent from the thread header
  9. Verify the API reflects the takeover by calling GET /api/conversations/:id and checking the response fields.
    - expect: Response contains assignedTo equal to the current user's ID (not null)
    - expect: Response contains aiPaused: true
    - expect: Response contains status: 'open'
  10. Type a manual reply message in the reply input textarea (data-testid=input-reply). Type the text: 'Hello, this is a message from a human agent.'
    - expect: The text appears in the textarea
    - expect: The Send button (data-testid=button-send-reply) becomes enabled (not disabled)
  11. Click the Send button (data-testid=button-send-reply) or press Enter (without Shift) to send the message.
    - expect: A loading spinner appears briefly on the Send button
    - expect: The reply textarea clears after sending
    - expect: The new message appears in the conversation thread in the center column
    - expect: The message is styled as an agent message (bg-primary / dark background)
    - expect: The sender name shows the logged-in user's name or 'Agent'
  12. Verify the sent message persists by calling GET /api/conversations/:id/messages.
    - expect: The response array contains the newly sent message
    - expect: The message has role: 'agent'
    - expect: The message content matches 'Hello, this is a message from a human agent.'
    - expect: The message has a valid createdAt timestamp
  13. To release the conversation back to the AI, open the Assign to dropdown in the Customer Info panel (data-testid=select-assign-to) and select 'Unassigned'.
    - expect: The dropdown opens and shows 'Unassigned' as the first option, followed by team member names
    - expect: After selecting Unassigned, a toast notification appears with title 'Conversation assigned'
    - expect: The Assign to dropdown now shows 'Unassigned'
  14. Verify the API reflects the release by calling GET /api/conversations/:id.
    - expect: Response contains assignedTo: null
    - expect: Response contains aiPaused: false or aiPaused field is falsy
    - expect: Response contains status: 'open'

#### 1.2. WF-TAKEOVER-02: Take Over button visibility rules — only appears on automated conversations

**File:** `tests/e2e/wf-takeover.spec.ts`

**Steps:**
  1. Log in via API POST /api/auth/login with {email: 'serra_honda@huminic.ai', password: 'NexxusTest2026'} and capture accessToken.
    - expect: Login succeeds with status 200 and accessToken in response
  2. Navigate to /teambox and dismiss product tour overlays (set all nexxus_tour_dismissed_ localStorage keys to 'true').
    - expect: TeamBox page loads with the Conversations tab active
  3. In the conversation list, filter by status='open' (click the Open filter chip) and select any open conversation that does NOT have an AI agent assigned (no Bot icon overlay).
    - expect: A conversation without a Bot icon is selected
    - expect: The thread header for this conversation does NOT show a Take Over button (data-testid=button-take-over should be absent from the DOM)
    - expect: The reply input (data-testid=input-reply) and send button (data-testid=button-send-reply) are still present and usable
  4. Now filter by status='automated' and select an automated conversation.
    - expect: The Take Over button IS present in the thread header (data-testid=button-take-over)
    - expect: This confirms button visibility is conditional on agentId set AND status=automated
  5. Via the API, PATCH the selected automated conversation to set assignedTo to the current user ID (simulate a prior takeover): PATCH /api/conversations/:id with {assignedTo: currentUser.id, status: 'open'}.
    - expect: Response status 200
    - expect: Response contains assignedTo equal to the user ID
    - expect: Response contains aiPaused: true
  6. Reload /teambox and reselect the same conversation.
    - expect: The Take Over button is NOT present (because status is now open, not automated)
    - expect: The Assign to dropdown shows the current user's name

#### 1.3. WF-TAKEOVER-03: AI blocking verification — SMS AI does not reply when conversation is taken over

**File:** `tests/e2e/wf-takeover.spec.ts`

**Steps:**
  1. Log in via API POST /api/auth/login with {email: 'serra_honda@huminic.ai', password: 'NexxusTest2026'} and capture accessToken.
    - expect: Login succeeds
  2. Find an automated SMS conversation by calling GET /api/conversations?channel=sms and filtering for those with agentId set and status=automated.
    - expect: At least one automated SMS conversation exists in the response
  3. Record the current message count for the chosen conversation by calling GET /api/conversations/:id/messages.
    - expect: Response returns an array; record its length as baseline_count
  4. Take over the conversation via PATCH /api/conversations/:id with {assignedTo: currentUser.id, status: 'open'}.
    - expect: Response status 200
    - expect: Response contains aiPaused: true
  5. Verify the conversation's fresh state by calling GET /api/conversations/:id.
    - expect: assignedTo is non-null and equals the current user's ID
    - expect: aiPaused is true
  6. Check the server-side SMS route behavior by inspecting the conversation response field aiPaused. The server computes aiPaused as !!assignedTo in PATCH /api/conversations/:id. Any new inbound SMS to this conversation will be blocked by the check in server/routes/sms.ts line 446: if (freshConversation.assignedTo) — the AI skip path logs '[SMS AI] AI paused — human takeover active'.
    - expect: aiPaused is true confirms the server-side block is in effect
    - expect: Any simulated inbound webhook to /api/sms/incoming for this conversation should NOT produce a new AI reply message
  7. Release the conversation by calling PATCH /api/conversations/:id with {assignedTo: null, status: 'open'}.
    - expect: Response status 200
    - expect: Response contains assignedTo: null
    - expect: Response contains aiPaused: false

#### 1.4. WF-TAKEOVER-04: Assign to team member (alternative to Take Over button)

**File:** `tests/e2e/wf-takeover.spec.ts`

**Steps:**
  1. Log in via API POST /api/auth/login with {email: 'serra_honda@huminic.ai', password: 'NexxusTest2026'} and capture accessToken.
    - expect: Login succeeds
  2. Navigate to /teambox with tour overlays dismissed.
    - expect: TeamBox loads with Conversations tab active
  3. Select any conversation (automated or open) and open the Customer Info panel on the right column (visible at xl breakpoint, width 1280px viewport).
    - expect: The Customer Info panel is visible with Name, Email, Phone, Channel, Status, Handled by, Assign to fields and Quick Actions
  4. Click the Assign to dropdown (data-testid=select-assign-to) to open it.
    - expect: Dropdown opens showing 'Unassigned' and a list of Serra Honda team members
  5. Select a team member from the dropdown (any member other than 'Unassigned').
    - expect: A toast appears: 'Conversation assigned'
    - expect: The dropdown now shows the selected team member's name
    - expect: The conversation list refreshes
  6. Verify the API state by calling GET /api/conversations/:id.
    - expect: assignedTo equals the selected team member's user ID
    - expect: aiPaused is true (assignedTo is non-null)
    - expect: status equals 'assigned'
  7. Open the Assign to dropdown again and select 'Unassigned' to release the assignment.
    - expect: Toast appears: 'Conversation assigned'
    - expect: The dropdown reverts to showing 'Unassigned'
    - expect: GET /api/conversations/:id shows assignedTo: null and aiPaused: false and status: 'open'

#### 1.5. WF-TAKEOVER-05: Reply input behavior — enter key sends, shift+enter creates newline

**File:** `tests/e2e/wf-takeover.spec.ts`

**Steps:**
  1. Log in and navigate to /teambox with tour overlays dismissed.
    - expect: TeamBox loads
  2. Select any conversation that has an existing thread (any status).
    - expect: The reply input (data-testid=input-reply) and send button (data-testid=button-send-reply) are visible at the bottom of the center column
    - expect: The send button is initially disabled because the input is empty
  3. Click the reply textarea (data-testid=input-reply) to focus it. Do NOT type anything. Attempt to click the send button.
    - expect: The send button remains disabled when the textarea is empty
    - expect: No API call is made
  4. Type a message with only whitespace (spaces) into the textarea.
    - expect: The send button remains disabled (the handler calls replyText.trim() and only enables for non-empty trimmed text)
  5. Clear the textarea and type the text 'Test line one' then press Shift+Enter.
    - expect: A newline is inserted into the textarea (the textarea content becomes 'Test line one\n')
    - expect: The message is NOT sent
    - expect: The send button is enabled
  6. Continue typing 'Test line two' on the second line, then press Enter (without Shift) to send.
    - expect: The message is sent immediately (Enter key triggers handleSendReply)
    - expect: The textarea clears after sending
    - expect: The message appears in the thread with both lines
    - expect: A loading spinner briefly appears on the send button while the POST request is in flight

#### 1.6. WF-TAKEOVER-06: Campaign Disconnect — separate from takeover, destructive action on campaign conversations

**File:** `tests/e2e/wf-takeover.spec.ts`

**Steps:**
  1. Log in and navigate to /teambox with tour overlays dismissed.
    - expect: TeamBox loads
  2. Select a conversation that has a campaignId set (look for a conversation where the 'Disconnect Campaign' button is visible — data-testid=button-disconnect-campaign). If none exist in the list, locate one via GET /api/conversations?status=open and find an entry with campaignId non-null.
    - expect: A conversation with a campaign is selected
    - expect: The Disconnect Campaign button (data-testid=button-disconnect-campaign) is visible in the thread header with destructive styling (red border, red text)
    - expect: A Ban icon is shown to the left of the 'Disconnect Campaign' label
  3. Click the Disconnect Campaign button.
    - expect: A loading spinner appears on the button
    - expect: The button text changes from 'Disconnect Campaign' to 'Disconnected'
    - expect: The button becomes disabled
    - expect: The button styling changes to muted (no longer destructive red)
    - expect: The conversation list refreshes
  4. Verify via API GET /api/conversations/:id.
    - expect: campaignDisconnected: true
    - expect: No further campaign messages should be sent to this customer
  5. Attempt to click the Disconnected button again.
    - expect: The button is disabled — clicking has no effect
    - expect: No additional API call is made

#### 1.7. WF-TAKEOVER-07: Unauthenticated access — PATCH takeover endpoint requires auth

**File:** `tests/e2e/wf-takeover.spec.ts`

**Steps:**
  1. Without logging in, send a PATCH request directly to /api/conversations/any-id with body {assignedTo: 'user-id', status: 'open'} and no Authorization header.
    - expect: Response status is 401
    - expect: Response body contains {message: 'Not authenticated'} or equivalent auth error
  2. Without logging in, send a GET request to /api/conversations with no Authorization header.
    - expect: Response status is 401
    - expect: Response body indicates authentication is required
  3. Without logging in, send a POST request to /api/conversations/:id/messages with no Authorization header.
    - expect: Response status is 401

#### 1.8. WF-TAKEOVER-08: Cross-org access control — cannot take over another org's conversation

**File:** `tests/e2e/wf-takeover.spec.ts`

**Steps:**
  1. Log in as Serra Honda org admin: POST /api/auth/login with {email: 'serra_honda@huminic.ai', password: 'NexxusTest2026'}. Capture token and organizationId.
    - expect: Login succeeds
  2. Log in as Serra Nissan org admin: POST /api/auth/login with {email: 'serra_nissan@huminic.ai', password: 'NexxusTest2026'}. Capture token and organizationId.
    - expect: Login succeeds
  3. As Serra Nissan, GET /api/conversations to find a conversation ID belonging to Serra Nissan's organization.
    - expect: At least one conversation is returned with Serra Nissan's organizationId
  4. As Serra Honda, attempt PATCH /api/conversations/:id (using Serra Nissan's conversation ID) with {assignedTo: serraHondaUserId, status: 'open'} and Serra Honda's Bearer token.
    - expect: Response status is 403 (Forbidden) or 404
    - expect: Serra Honda cannot modify Serra Nissan's conversation
  5. As Serra Honda, attempt GET /api/conversations/:id (using Serra Nissan's conversation ID) with Serra Honda's Bearer token.
    - expect: Response status is 403 or 404
    - expect: Cross-org read access is blocked for roleLevel > 2

#### 1.9. WF-TAKEOVER-09: Edge case — take over a conversation with no agentId (manually created open conversation)

**File:** `tests/e2e/wf-takeover.spec.ts`

**Steps:**
  1. Log in and navigate to /teambox with tour overlays dismissed.
    - expect: TeamBox loads
  2. Filter conversations by 'Open' status and select a conversation that does NOT have a Bot icon overlay (no agentId).
    - expect: A non-automated conversation is selected and loaded in the thread
  3. Inspect the thread header for the Take Over button.
    - expect: The Take Over button (data-testid=button-take-over) is NOT present in the DOM
    - expect: This is correct behavior: Take Over is only for automated conversations where agentId is set AND status is automated
  4. Verify the conversation can still receive manual replies without taking over. Type a message in the reply input and send it.
    - expect: The message is sent successfully via POST /api/conversations/:id/messages with status 201
    - expect: The message appears in the thread

#### 1.10. WF-TAKEOVER-10: Quick Actions in Customer Info panel are accessible after takeover

**File:** `tests/e2e/wf-takeover.spec.ts`

**Steps:**
  1. Log in and navigate to /teambox with tour overlays dismissed at 1280x720 viewport (xl breakpoint required for Customer Info panel to be visible).
    - expect: TeamBox loads with the right-side Customer Info panel visible
  2. Select an automated conversation and click Take Over.
    - expect: Takeover succeeds with toast notification
  3. In the Customer Info panel (right column), locate the Quick Actions section.
    - expect: Three buttons are visible: Call (data-testid=button-call-customer), Email (data-testid=button-email-customer), SMS (data-testid=button-sms-customer)
  4. Click the SMS quick action button.
    - expect: The reply textarea (data-testid=input-reply) receives focus
    - expect: The textarea is pre-populated with '[SMS] ' prefix
    - expect: The user can continue typing after the prefix
  5. Click the Call quick action button when the selected conversation's customer has no phone number on file.
    - expect: A toast appears: 'No phone number available — This customer does not have a phone number on file.'
  6. Click the Email quick action button when the selected conversation's customer has no email on file.
    - expect: A toast appears: 'No email available — This customer does not have an email address on file.'
