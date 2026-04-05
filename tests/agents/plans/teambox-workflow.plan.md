# TeamBox Workflow Test Plan

## Application Overview

TeamBox is the central conversation management hub in Nexxus Connect, a CRM/AI platform for automotive dealerships. It enables org_admin and agent users to view all inbound customer conversations across multiple channels (SMS, Email, Voice/VAPI, Video/Tavus, Chat), filter and search them, read message threads, take over from AI, send replies, assign conversations, and release them back to AI or other agents. The tested org is Serra Honda (serra_honda@huminic.ai). Key observed data: 65 total conversations at time of exploration, status categories include All/Open/Assigned to me/Participating/Automated/Scheduled/Followup/Pending. Channel filters include All/SMS/Email/Voice. The left sidebar also shows per-channel links (SMS 4, Email 2, Phone 3, Video) and a Tasks link. Three main content tabs exist: Conversations, Phone (VAPI Call Logs), and Video (Tavus Sessions). Within Conversations, there is also a Workflows sub-tab (coming soon placeholder). Each conversation shows customer name, timestamp, last message preview, AI agent name, and unread count badge. The detail panel shows the thread, Customer Info panel (name, email, phone, channel, status, handled-by, assign-to dropdown, quick actions for Call/Email/SMS). AI-handled conversations show a Take Over button (data-testid=button-take-over). After takeover, a toast notification confirms AI responses paused. The reply box (data-testid=input-reply) accepts text; the send button (data-testid=button-send-reply) is disabled when empty. After sending, the thread and conversation list preview update immediately.

## Test Scenarios

### 1. TeamBox Navigation and Layout

**Seed:** `tests/e2e/helpers/auth.ts`

#### 1.1. Authenticated user can navigate to TeamBox from the sidebar

**File:** `tests/e2e/teambox/navigation.spec.ts`

**Steps:**
  1. Log in at https://dev.huminicdev.com with email serra_honda@huminic.ai and password NexxusTest2026. The dashboard (AI Key Metrics page) should load.
    - expect: The page URL is https://dev.huminicdev.com/
    - expect: The heading 'AI Key Metrics' is visible
    - expect: The sidebar shows navigation buttons: AI Chat, TeamBox, Sales, Service, Marketing
  2. Click the TeamBox button in the left sidebar navigation.
    - expect: The URL changes to https://dev.huminicdev.com/teambox
    - expect: The TeamBox heading (level 1) is visible: 'TeamBox'
    - expect: The TeamBox sidebar button shows as active/highlighted
  3. Verify the three main content tabs are visible at the top of the page.
    - expect: A Conversations button tab is present
    - expect: A Phone button tab is present (data-testid='tab-teambox-phone')
    - expect: A Video button tab is present (data-testid='tab-teambox-video')
  4. Verify the left sidebar shows channel-specific navigation links below the main navigation.
    - expect: A SMS link with a numeric badge (count >= 0) is present
    - expect: An Email link with a numeric badge is present
    - expect: A Phone link with a numeric badge is present
    - expect: A Video link is present
    - expect: A Tasks link is present
  5. Verify the conversation list panel is visible and contains the sub-tabs and filter controls.
    - expect: A Conversations sub-tab button is visible
    - expect: A Workflows sub-tab button is visible (data-testid='tab-workflows')
    - expect: A search input with placeholder 'Search conversations...' is visible
    - expect: Status filter buttons are visible: All (with count), Open, Assigned to me, Participating, Automated, Scheduled, Followup, Pending
    - expect: Channel filter buttons are visible: All, SMS, Email, Voice

#### 1.2. TeamBox page loads correctly on direct URL navigation

**File:** `tests/e2e/teambox/navigation.spec.ts`

**Steps:**
  1. Log in, then navigate directly to https://dev.huminicdev.com/teambox.
    - expect: The page loads without error
    - expect: The TeamBox heading is visible
    - expect: The conversation list is populated
  2. Reload the page using page.reload().
    - expect: The page reloads and still shows TeamBox content
    - expect: The conversation list is re-populated
    - expect: No authentication redirect occurs

#### 1.3. Unauthenticated user cannot access TeamBox

**File:** `tests/e2e/teambox/navigation.spec.ts`

**Steps:**
  1. Without logging in, navigate directly to https://dev.huminicdev.com/teambox.
    - expect: The page redirects to the login page
    - expect: The TeamBox content is not accessible
    - expect: A login form with email and password fields is presented

### 2. Conversation List - Viewing and Filtering

**Seed:** `tests/e2e/helpers/auth.ts`

#### 2.1. Conversation list displays all conversations with correct metadata

**File:** `tests/e2e/teambox/conversation-list.spec.ts`

**Steps:**
  1. Log in as serra_honda@huminic.ai, navigate to TeamBox. Ensure the Conversations sub-tab is active and All status filter is selected.
    - expect: The conversation list shows a count label matching the All status button count (e.g., 65)
    - expect: Each conversation item shows the customer initials avatar
    - expect: Each conversation item shows the customer name
    - expect: Conversations with recent activity show a relative timestamp (e.g., 'about 4 hours')
    - expect: Conversations with unread messages show a numeric badge
    - expect: AI-handled conversations show an AI agent name badge (e.g., 'Caroline')
  2. Scroll down through the full conversation list.
    - expect: The list scrolls smoothly
    - expect: No duplicate conversations are visible
    - expect: The total count matches the total number of items visible when scrolled fully

#### 2.2. Filter conversations by status - Open

**File:** `tests/e2e/teambox/conversation-list.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Click the Open status filter button.
    - expect: The Open button becomes active/highlighted
    - expect: The conversation list count updates to match the number in the Open badge
    - expect: Only conversations with Open status are shown
  2. Click All status filter to reset.
    - expect: The list returns to showing all conversations
    - expect: The count resets to the full total

#### 2.3. Filter conversations by status - Assigned to me

**File:** `tests/e2e/teambox/conversation-list.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Click the Assigned to me status filter button.
    - expect: The list updates to show only conversations assigned to the current user (Serra Honda Admin)
    - expect: The count matches the number shown in the button badge

#### 2.4. Filter conversations by status - Automated

**File:** `tests/e2e/teambox/conversation-list.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Click the Automated status filter button.
    - expect: The list shows only AI-handled conversations
    - expect: Each conversation in the list shows an AI agent name badge (e.g., Caroline)

#### 2.5. Filter conversations by channel - SMS

**File:** `tests/e2e/teambox/conversation-list.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. In the Channel filter row, click the SMS button (data-testid='channel-chip-sms').
    - expect: The SMS channel button becomes active
    - expect: The conversation list updates to show only SMS conversations
    - expect: The count label updates (e.g., 4)
    - expect: All visible conversations are of the SMS channel type
  2. Click Email channel filter.
    - expect: The list updates to show only Email conversations
    - expect: The count updates accordingly
  3. Click Voice channel filter.
    - expect: The list updates to show only Voice conversations
  4. Click All channel filter to reset (data-testid='channel-chip-all').
    - expect: All conversations are shown again
    - expect: The count returns to the full total

#### 2.6. Combine status and channel filters

**File:** `tests/e2e/teambox/conversation-list.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Click Open status filter, then click SMS channel filter.
    - expect: The list shows only conversations that are both Open AND SMS channel
    - expect: The count reflects the combined filter result
    - expect: If no conversations match, a suitable empty state message is displayed

#### 2.7. Search conversations by customer name

**File:** `tests/e2e/teambox/conversation-list.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Click the Search conversations input and type 'Ben Smith'.
    - expect: The conversation list filters to show conversations matching Ben Smith
    - expect: The Ben Smith conversation item is visible in the list
  2. Clear the search input.
    - expect: The full conversation list is restored
  3. Type a search term that matches no conversations (e.g., 'ZZZNONEXISTENT999').
    - expect: The conversation list shows zero results
    - expect: An empty state or no-results message is displayed

#### 2.8. Workflows sub-tab shows placeholder coming soon message

**File:** `tests/e2e/teambox/conversation-list.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Click the Workflows sub-tab button (data-testid='tab-workflows').
    - expect: The Workflows panel becomes active
    - expect: A search input with placeholder 'Search workflows...' is visible
    - expect: A message 'Workflow automation coming soon' is displayed
    - expect: No workflow items are listed

### 3. Conversation Thread - Viewing Messages

**Seed:** `tests/e2e/helpers/auth.ts`

#### 3.1. Selecting a conversation loads the message thread in the detail panel

**File:** `tests/e2e/teambox/conversation-thread.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. In the conversation list, click on the Ben Smith conversation (handled by Caroline with 1 unread).
    - expect: The Ben Smith conversation becomes active/highlighted in the list
    - expect: The center panel updates to show the conversation thread
    - expect: The thread heading shows 'Ben Smith'
    - expect: A channel badge is visible (e.g., CHAT)
    - expect: The message thread shows the Sales Agent message: 'Welcome Ben! How can I help you today?'
    - expect: The thread shows Ben Smith's message: 'I'm having trouble accessing my account.'
    - expect: Each message shows sender name, message body, and relative timestamp
  2. Verify the Customer Info panel on the right is populated.
    - expect: Name: Ben Smith
    - expect: Email: ben.smith@email.com
    - expect: Phone: (412) 555-0102
    - expect: Channel: CHAT
    - expect: Handled by: Caroline
    - expect: Assign to dropdown is visible
    - expect: Quick Actions buttons visible: Call, Email, SMS
  3. Click on a different conversation in the list (e.g., Michael Clark).
    - expect: The thread panel updates to show Michael Clark's conversation
    - expect: Customer Info panel updates with Michael Clark's details
    - expect: The Ben Smith conversation is no longer highlighted as active

#### 3.2. Default page load shows a conversation selected in the detail panel

**File:** `tests/e2e/teambox/conversation-thread.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Observe the detail panel on page load without clicking any conversation.
    - expect: The detail panel is not blank
    - expect: Either a conversation thread is shown OR a placeholder like 'Select a conversation to view' is displayed
    - expect: If a conversation is auto-selected, the Customer Info panel shows data

### 4. AI Takeover Flow

**Seed:** `tests/e2e/helpers/auth.ts`

#### 4.1. Take Over button is visible on AI-handled conversations

**File:** `tests/e2e/teambox/ai-takeover.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Click the Automated status filter. Click on an automated conversation (showing an AI agent badge like Caroline).
    - expect: The thread panel header shows a Take Over button (data-testid='button-take-over')
    - expect: The conversation status in Customer Info shows Automated

#### 4.2. Clicking Take Over shows toast and changes conversation status to Open

**File:** `tests/e2e/teambox/ai-takeover.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Find and click an Automated conversation. Note the current status (Automated) and Automated filter count. Click the Take Over button (data-testid='button-take-over').
    - expect: A toast notification appears reading 'Conversation taken over'
    - expect: The toast subtitle reads 'AI responses paused. You are now handling this conversation.'
  2. After the toast, observe the Customer Info panel and the status filters.
    - expect: The conversation status changes from Automated to Open
    - expect: The Assign to dropdown shows Serra Honda Admin (current user)
    - expect: The Take Over button is no longer visible
    - expect: The Automated filter count decrements by 1
    - expect: The Open filter count increments by 1

#### 4.3. Take Over button is NOT present on non-automated conversations

**File:** `tests/e2e/teambox/ai-takeover.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Click the Open status filter. Select a conversation that is already Open and human-handled.
    - expect: No Take Over button is present in the thread panel header
    - expect: The reply input is directly available for use

### 5. Reply - Sending Messages

**Seed:** `tests/e2e/helpers/auth.ts`

#### 5.1. Reply input is empty and send button is disabled on conversation load

**File:** `tests/e2e/teambox/reply.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Click on any conversation.
    - expect: The reply textbox (data-testid='input-reply') is visible at the bottom of the thread panel
    - expect: The textbox is empty (placeholder 'Write a reply...' is shown)
    - expect: The send button (data-testid='button-send-reply') is disabled

#### 5.2. Send button becomes enabled when reply text is typed

**File:** `tests/e2e/teambox/reply.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Open a conversation. Type any text in the reply input.
    - expect: The send button (data-testid='button-send-reply') becomes enabled as soon as text is present
  2. Clear all text from the reply input.
    - expect: The send button becomes disabled again

#### 5.3. Sending a reply appends message to thread and clears input

**File:** `tests/e2e/teambox/reply.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Open the Ben Smith conversation (ensure it has been taken over or is human-handled). Type the message 'Thank you for contacting Serra Honda. I will help you with your account access issue.' in the reply input (data-testid='input-reply').
    - expect: The text appears in the reply input
    - expect: The send button is enabled
  2. Click the send button (data-testid='button-send-reply').
    - expect: The reply input is cleared after send
    - expect: The send button becomes disabled again
    - expect: The new message appears at the bottom of the thread
    - expect: The sender label shows 'Serra Honda Admin' or the current user name
    - expect: The message body matches the typed text exactly
    - expect: A relative timestamp appears on the new message (e.g., 'less than a minute ago')
  3. Observe the conversation list item for Ben Smith.
    - expect: The list item updates its last-message preview to show the new message text
    - expect: The timestamp on the list item is updated to reflect the new activity

#### 5.4. Cannot send an empty or whitespace-only reply

**File:** `tests/e2e/teambox/reply.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Open a conversation. Type spaces only in the reply input.
    - expect: The send button remains disabled for whitespace-only input
    - expect: If the button somehow becomes enabled, clicking it must not add a blank message to the thread

### 6. Conversation Assignment

**Seed:** `tests/e2e/helpers/auth.ts`

#### 6.1. Assign to dropdown shows available agents and Unassigned option

**File:** `tests/e2e/teambox/assignment.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Select any conversation. In the Customer Info panel, click the Assign to combobox (data-testid='select-assign-to').
    - expect: A dropdown list opens
    - expect: The first option is Unassigned
    - expect: Options include agents: Marcus Webb, James Chen, Vanessa Torres, Derek Wilson, Ashley Brooks, Brian Mitchell, Rachel Kim, Serra Honda Admin, Duane K. Wells
    - expect: The current assignee is highlighted/selected in the list

#### 6.2. Assigning a conversation to an agent updates the assignment persistently

**File:** `tests/e2e/teambox/assignment.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Select an Unassigned conversation. Open the Assign to dropdown and select James Chen.
    - expect: The dropdown closes
    - expect: The Assign to field shows James Chen
  2. Reload the page and re-select the same conversation.
    - expect: The Assign to field still shows James Chen (assignment is persisted to the server)

#### 6.3. Setting assignment to Unassigned releases the conversation

**File:** `tests/e2e/teambox/assignment.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Select a conversation assigned to an agent. Open the Assign to dropdown and select Unassigned.
    - expect: The Assign to field shows Unassigned
    - expect: The conversation no longer appears under Assigned to me filter for the previous assignee

### 7. Phone Tab - VAPI Call Logs

**Seed:** `tests/e2e/helpers/auth.ts`

#### 7.1. Phone tab displays VAPI Call Logs table with correct columns

**File:** `tests/e2e/teambox/phone-tab.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Click the Phone tab (data-testid='tab-teambox-phone').
    - expect: The Phone tab becomes active
    - expect: A heading 'VAPI Call Logs' is visible
    - expect: A table is visible with column headers: Date, Caller Number, Assistant, Duration, Status
    - expect: At least one row is present in the table
    - expect: Each row shows a date/time, a caller number (or '-' if unknown), an assistant UUID, a duration in seconds (e.g., 241s), and a status of 'ended'
  2. Identify a row that has a Transcript button. Click the Transcript button.
    - expect: A transcript view opens or a modal appears
    - expect: The transcript content is accessible
  3. Verify rows without transcripts do not show the Transcript button.
    - expect: Rows with no transcript have an empty last cell (no Transcript button)

### 8. Video Tab - Tavus Sessions

**Seed:** `tests/e2e/helpers/auth.ts`

#### 8.1. Video tab displays Tavus Video Sessions section

**File:** `tests/e2e/teambox/video-tab.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Click the Video tab (data-testid='tab-teambox-video').
    - expect: The Video tab becomes active
    - expect: A heading 'Tavus Video Sessions' is visible
  2. Observe the content of the Video tab when no sessions exist.
    - expect: The message 'No video sessions found' is displayed
    - expect: No error or crash occurs
  3. If video sessions are present (future state), observe the list.
    - expect: Sessions are listed with relevant metadata such as date, customer name, and duration

### 9. Quick Actions in Customer Info Panel

**Seed:** `tests/e2e/helpers/auth.ts`

#### 9.1. Quick Action buttons (Call, Email, SMS) are visible for each conversation

**File:** `tests/e2e/teambox/quick-actions.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Select the Ben Smith conversation.
    - expect: Under Quick Actions in the Customer Info panel, three buttons are visible: Call, Email, SMS

#### 9.2. Quick Action Call button initiates a call action

**File:** `tests/e2e/teambox/quick-actions.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Select a conversation with a phone number. Click the Call quick action button.
    - expect: A call initiation interface, dialog, or confirmation prompt appears
    - expect: No unhandled error or blank screen occurs

#### 9.3. Quick Action Email button initiates an email action

**File:** `tests/e2e/teambox/quick-actions.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Select the Ben Smith conversation (has email ben.smith@email.com). Click the Email quick action button.
    - expect: An email compose interface or new Email conversation dialog appears
    - expect: No unhandled error occurs

#### 9.4. Quick Action SMS button initiates an SMS action

**File:** `tests/e2e/teambox/quick-actions.spec.ts`

**Steps:**
  1. Log in, go to TeamBox. Select a conversation. Click the SMS quick action button.
    - expect: An SMS compose interface or new SMS conversation dialog appears
    - expect: No unhandled error occurs

### 10. Full WF-TEAMBOX End-to-End Workflow

**Seed:** `tests/e2e/helpers/auth.ts`

#### 10.1. Complete agent workflow: login, view conversations, filter by channel, filter by status, open AI conversation, take over, send reply, verify thread, assign to agent, release to unassigned

**File:** `tests/e2e/teambox/e2e-workflow.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com. Log in with email 'serra_honda@huminic.ai' and password 'NexxusTest2026'.
    - expect: Login succeeds
    - expect: The dashboard (AI Key Metrics) loads
    - expect: The page URL is https://dev.huminicdev.com/
  2. Click the TeamBox button in the left sidebar.
    - expect: The URL becomes /teambox
    - expect: The TeamBox page loads with the conversation list visible
    - expect: The All status filter shows a count greater than 0
  3. Click the SMS channel filter button (data-testid='channel-chip-sms') to filter by SMS channel.
    - expect: The conversation list updates to show only SMS conversations
    - expect: The count badge reflects the SMS-only subset (e.g., 4)
  4. Click the All channel filter (data-testid='channel-chip-all') to reset the channel filter.
    - expect: All conversations are shown again
  5. Click the Automated status filter button to see AI-managed conversations.
    - expect: The list shows only Automated conversations
    - expect: At least one conversation with an AI agent badge is visible
  6. Click on an Automated conversation from the list (for example, the Ben Smith - Caroline conversation). Record the current Automated filter count.
    - expect: The thread panel shows the conversation thread with messages
    - expect: The Customer Info panel shows the customer details with status Automated
    - expect: The Take Over button (data-testid='button-take-over') is visible in the thread header area
  7. Click the Take Over button (data-testid='button-take-over').
    - expect: A toast notification appears: 'Conversation taken over'
    - expect: The toast body reads: 'AI responses paused. You are now handling this conversation.'
  8. Dismiss the toast or wait for it to auto-dismiss. Observe the Customer Info panel and status filters.
    - expect: The status field in Customer Info shows 'Open' (changed from Automated)
    - expect: The Assign to dropdown shows 'Serra Honda Admin' (current logged-in user)
    - expect: The Take Over button is no longer visible in the thread header
    - expect: The Automated filter count has decremented by 1
    - expect: The Open filter count has incremented by 1
  9. Click the reply input (data-testid='input-reply') at the bottom of the thread panel. Type the message: 'Thank you for reaching out to Serra Honda. I am here to help you with your account access issue. Could you please describe the problem in more detail?'
    - expect: The text appears in the reply input
    - expect: The send button (data-testid='button-send-reply') becomes enabled
  10. Click the send button (data-testid='button-send-reply').
    - expect: The reply input is cleared after send
    - expect: The send button becomes disabled again
    - expect: The new message appears at the bottom of the thread with the text: 'Thank you for reaching out to Serra Honda. I am here to help you with your account access issue. Could you please describe the problem in more detail?'
    - expect: The sender label on the new message shows 'Serra Honda Admin'
    - expect: A relative timestamp appears (e.g., 'less than a minute ago')
  11. Observe the conversation list item.
    - expect: The conversation list item for this conversation shows the new message text as the preview
    - expect: The timestamp on the list item is updated to 'less than a minute'
  12. In the Customer Info panel, click the Assign to dropdown (data-testid='select-assign-to') and select 'Unassigned' to release the conversation.
    - expect: The dropdown closes
    - expect: The Assign to field shows 'Unassigned'
  13. Click the All status filter and verify the conversation is still present in the full list.
    - expect: The conversation appears in the All view
    - expect: The last message preview in the list item reflects the reply that was sent
