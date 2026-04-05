# Widget Form Workflow Test Plan — WF-WIDGET-FORM

## Application Overview

End-to-end workflow tests for the landing page widget contact form on the Nexxus Connect CRM/AI platform serving automotive dealerships. The workflow covers: visiting /p/{slug}, clicking the floating action button (FAB) to open the widget menu, selecting the Contact Form option, filling the form (name, email, phone, message), submitting, verifying the success state, verifying that a conversation with channel='form' was created in the database, verifying that auto-SMS dispatch was attempted (blocked when OUTBOUND_LIVE_ENABLED=false), simulating a prospect inbound reply, and verifying TeamBox takeover by an admin user. Tests target Serra Honda (slug: serra-honda, admin: serra_honda@huminic.ai). Key data-testids: button-widget-fab, widget-menu, widget-option-form, widget-form, input-form-name, input-form-email, input-form-phone, input-form-message, button-form-submit, widget-form-success, button-form-send-another, button-form-back, button-form-close, button-take-over. API endpoint: POST /api/widget/contact. OUTBOUND_LIVE_ENABLED is false on staging so outbound SMS will be logged as 'blocked', not delivered.

## Test Scenarios

### 1. Widget Form Workflow

**Seed:** `tests/e2e/seed.spec.ts`

#### 1.1. Happy path: widget FAB opens menu, form option visible

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/p/serra-honda and wait for domcontentloaded
    - expect: The landing page loads with the Serra Honda store name visible (data-testid='landing-store-name')
    - expect: The floating action button (data-testid='button-widget-fab') is visible in the lower-right corner of the page
  2. Click the widget FAB button (data-testid='button-widget-fab')
    - expect: The widget menu panel opens (data-testid='widget-menu' becomes visible)
    - expect: The menu header shows 'Serra Honda' as the org name
    - expect: The header subtitle reads 'Choose how to connect'
    - expect: Four option buttons are visible: Web Chat, Instant Call Back, Contact Form, Two-Way Video
  3. Verify the Contact Form option button is visible (data-testid='widget-option-form')
    - expect: The button shows 'Contact Form' as the label
    - expect: The subtitle reads 'Send us a message'
    - expect: The button has an orange icon background

#### 1.2. Happy path: full form fill and successful submission

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/p/serra-honda, wait for page load, then click the widget FAB (data-testid='button-widget-fab')
    - expect: Widget menu opens (data-testid='widget-menu' is visible)
  2. Click the Contact Form option (data-testid='widget-option-form')
    - expect: The Contact Form panel opens (data-testid='widget-form' is visible)
    - expect: The form panel header shows 'Contact Form'
    - expect: Back arrow button (data-testid='button-form-back') and close button (data-testid='button-form-close') are visible
    - expect: Four fields are visible: Name (required), Email (required), Phone (optional), Message (required)
    - expect: The Send Message button (data-testid='button-form-submit') is present and initially disabled because fields are empty
  3. Type a unique name into the Name field (data-testid='input-form-name'), e.g. 'WF-Form-TestUser'
    - expect: The name field reflects the entered value
  4. Type a valid email address into the Email field (data-testid='input-form-email'), e.g. 'wf-form-test@example.com'
    - expect: The email field reflects the entered value
  5. Type a phone number into the Phone field (data-testid='input-form-phone'), e.g. '(555) 900-0001'
    - expect: The phone field reflects the entered value
  6. Type a message into the Message field (data-testid='input-form-message'), e.g. 'I am interested in a 2026 Civic test drive'
    - expect: The message textarea reflects the entered text
    - expect: The Send Message button (data-testid='button-form-submit') becomes enabled once name, email, and message are all non-empty
  7. Intercept the POST /api/widget/contact network request, then click the Send Message button (data-testid='button-form-submit')
    - expect: The button shows a loading spinner and text 'Sending...' while the request is in flight
    - expect: The POST /api/widget/contact request is made with body containing: slug='serra-honda', name, email, phone, message
    - expect: The API responds with HTTP 200 and body { success: true, conversationId: '<uuid>' }
    - expect: After the response, the form fields are replaced by the success view (data-testid='widget-form-success')
    - expect: The success view shows a CheckCircle icon, text 'Message Sent', and subtitle 'We\'ll get back to you shortly.'
    - expect: A 'Send another message' button (data-testid='button-form-send-another') is visible

#### 1.3. Submission without phone: phone is optional

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/p/serra-honda, open the widget FAB, click Contact Form option
    - expect: Widget form panel is visible (data-testid='widget-form')
  2. Fill in the Name field (data-testid='input-form-name') with 'NoPhone TestUser', Email field (data-testid='input-form-email') with 'nophone@example.com', leave Phone field (data-testid='input-form-phone') empty, and fill Message field (data-testid='input-form-message') with 'Test message no phone'
    - expect: The Send Message button is enabled with name, email, and message filled
  3. Click the Send Message button (data-testid='button-form-submit')
    - expect: POST /api/widget/contact is called without a phone field in the body
    - expect: The API responds with HTTP 200 and { success: true, conversationId: '<uuid>' }
    - expect: The success state is shown (data-testid='widget-form-success')

#### 1.4. Validation: Submit button disabled when required fields empty

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Navigate to https://dev.huminicdev.com/p/serra-honda, open the widget FAB, click Contact Form option
    - expect: Widget form panel is visible (data-testid='widget-form')
    - expect: The Send Message button (data-testid='button-form-submit') is disabled
  2. Fill in only the Name field (data-testid='input-form-name') with 'Partial User', leave Email and Message empty
    - expect: The Send Message button remains disabled — name alone is not sufficient
  3. Also fill in the Email field (data-testid='input-form-email') with 'partial@example.com', leave Message empty
    - expect: The Send Message button remains disabled — name and email without message is not sufficient
  4. Clear the Name field and fill only Message (data-testid='input-form-message') with 'Only message'
    - expect: The Send Message button remains disabled — message alone is not sufficient
  5. Fill all three required fields: Name, Email, and Message
    - expect: The Send Message button becomes enabled

#### 1.5. API: POST /api/widget/contact creates conversation with channel='form'

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Send a direct API request: POST /api/widget/contact with body { slug: 'serra-honda', name: 'API-Form-Test-<timestamp>', email: 'api-form-<timestamp>@example.com', phone: '+15559000001', message: 'API direct test submission' }
    - expect: HTTP 200 response
    - expect: Response body contains { success: true, conversationId: '<uuid>' }
    - expect: The conversationId is a non-empty string UUID
  2. Authenticate as Serra Honda org admin (serra_honda@huminic.ai, password: NexxusTest2026) via POST /api/auth/login
    - expect: HTTP 200 with accessToken in response body
  3. Fetch the created conversation: GET /api/conversations/<conversationId> with Authorization: Bearer <token>
    - expect: HTTP 200 response
    - expect: Response body has channel equal to 'form'
    - expect: Response body has customerName matching the name submitted
    - expect: Response body has customerEmail matching the email submitted
    - expect: Response body has customerPhone matching the phone submitted
    - expect: Response body has status equal to 'open'
    - expect: Response body has organizationId matching Serra Honda's org ID
    - expect: Response body has unreadCount greater than 0

#### 1.6. API: Conversation has the form submission message

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Send POST /api/widget/contact with unique name 'MsgCheck-<timestamp>', email, phone, and message 'Inquiry about service department hours'. Capture the conversationId from the response
    - expect: HTTP 200 with { success: true, conversationId }
  2. Authenticate as org admin and fetch messages: GET /api/conversations/<conversationId>/messages with auth token
    - expect: HTTP 200 response
    - expect: Response is an array with at least one message
    - expect: The first message has role='user'
    - expect: The message content includes the submitted name, email, phone, and original message text — formatted as 'Contact Form Submission\n\nName: ...\nEmail: ...\nPhone: ...\n\nMessage:\n...'

#### 1.7. API: Missing required fields returns 400

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Send POST /api/widget/contact with body { slug: 'serra-honda', email: 'missing@example.com', message: 'No name provided' } (omitting name)
    - expect: HTTP 400 response
    - expect: Response body contains a message field indicating name, email, and message are required
  2. Send POST /api/widget/contact with body { slug: 'serra-honda', name: 'No Email', message: 'No email provided' } (omitting email)
    - expect: HTTP 400 response
  3. Send POST /api/widget/contact with body { slug: 'serra-honda', name: 'No Message', email: 'nomsg@example.com' } (omitting message)
    - expect: HTTP 400 response

#### 1.8. API: Unknown slug returns 404

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Send POST /api/widget/contact with body { slug: 'nonexistent-dealer-xyz', name: 'Test', email: 't@t.com', message: 'test' }
    - expect: HTTP 404 response
    - expect: Response body contains a message indicating the organization was not found

#### 1.9. Auto-SMS: outbound send attempt is logged when OUTBOUND_LIVE_ENABLED=false

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Submit the widget contact form via POST /api/widget/contact with a phone number: { slug: 'serra-honda', name: 'SMS-Test-<timestamp>', email: 'smstest@example.com', phone: '+15559001234', message: 'Testing SMS dispatch' }. Capture conversationId.
    - expect: HTTP 200 with { success: true, conversationId }
  2. Note: The /api/widget/contact endpoint creates the conversation but does not itself trigger auto-SMS. Auto-SMS (autoGreeting) is triggered from the conversation creation flow on the server side when a phone is present. Check the outbound logs via GET /api/outbound-logs (with auth) or verify server behavior through conversation messages.
    - expect: The endpoint returns success regardless of SMS dispatch status
    - expect: No error is thrown even if auto-SMS is blocked by OUTBOUND_LIVE_ENABLED=false
    - expect: If autoGreeting is configured for Serra Honda and a phone was provided, the outbound log entry for that phone either shows status='blocked' (OUTBOUND_LIVE_ENABLED=false) or no log entry if the widget contact endpoint does not trigger autoGreeting directly
  3. Verify there is no duplicate conversation or error by fetching GET /api/conversations/<conversationId> with auth
    - expect: Conversation exists with status='open' and channel='form'

#### 1.10. TeamBox: form conversation appears and can be taken over

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Submit the widget contact form via POST /api/widget/contact to create a conversation. Record the conversationId and the submitted name (use a unique value like 'Teambox-Test-<timestamp>').
    - expect: HTTP 200 with { success: true, conversationId }
  2. Authenticate in the browser as serra_honda@huminic.ai using loginForBrowser() and navigate to /teambox
    - expect: TeamBox page loads (data-testid='teambox-page' is visible)
    - expect: The top menu bar (data-testid='teambox-top-menu') is visible
  3. Look for the submitted name in the conversations list. The list can be filtered by channel; click the channel filter chip for 'form' if it exists (data-testid='channel-chip-form'), or search for the unique name in the search input (data-testid='input-teambox-search')
    - expect: The conversation item for the submitted name appears in the list (data-testid='conversation-item-<conversationId>')
    - expect: The conversation shows the customer name that was submitted
  4. Click on the conversation item to open it
    - expect: The conversation detail pane opens
    - expect: The customer name is shown (data-testid='text-conversation-customer')
    - expect: The customer email and phone are displayed in the right panel (data-testid='text-customer-email', data-testid='text-customer-phone')
    - expect: The original form submission message appears in the message thread (containing 'Contact Form Submission')
    - expect: The Take Over button is visible (data-testid='button-take-over')
  5. Click the Take Over button (data-testid='button-take-over')
    - expect: The conversation is assigned to the logged-in admin user
    - expect: The Take Over button may disappear or change state after assignment
    - expect: The conversation status remains 'open'
  6. Via API, verify the conversation assignment: GET /api/conversations/<conversationId> with auth token
    - expect: Response body has assignedTo matching the admin user's ID
    - expect: Response body has status='open'

#### 1.11. TeamBox: admin can reply to form conversation

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Create a form conversation via API and log into TeamBox as org admin. Navigate to the conversation.
    - expect: Conversation is open in TeamBox with the form submission message visible
  2. Type a reply message in the reply input (data-testid='input-reply'), e.g. 'Thanks for reaching out! We will contact you shortly.'
    - expect: The reply input accepts text
  3. Click the send reply button (data-testid='button-send-reply')
    - expect: The message is sent and appears in the thread
    - expect: POST /api/conversations/<id>/messages returns HTTP 201
    - expect: The new message appears in the conversation with role='agent' or similar
  4. Verify the reply was stored by fetching GET /api/conversations/<conversationId>/messages with auth
    - expect: The messages array includes the agent reply with the correct content

#### 1.12. TeamBox: form channel filter shows only form conversations

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Authenticate as org admin and request GET /api/conversations?channel=form with auth header
    - expect: HTTP 200 response
    - expect: Response is an array
    - expect: Every conversation in the array has channel='form'

#### 1.13. Send another message: success state resets the form

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Navigate to /p/serra-honda, open the widget, click Contact Form, fill all required fields, and submit successfully. Verify success state is shown (data-testid='widget-form-success').
    - expect: Success state is visible with 'Message Sent' text
  2. Click the 'Send another message' button (data-testid='button-form-send-another')
    - expect: The success state is replaced by the blank form
    - expect: All form fields (Name, Email, Phone, Message) are empty
    - expect: The Send Message button is disabled again

#### 1.14. Navigation: back button returns to menu

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Navigate to /p/serra-honda, click the FAB, click Contact Form to open the form panel
    - expect: Widget form is visible (data-testid='widget-form')
  2. Click the back arrow button in the form header (data-testid='button-form-back')
    - expect: The form panel closes
    - expect: The widget menu is shown again (data-testid='widget-menu')
    - expect: All four options (Web Chat, Instant Call Back, Contact Form, Two-Way Video) are visible

#### 1.15. Navigation: close button dismisses the widget

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Navigate to /p/serra-honda, click the FAB, click Contact Form to open the form panel
    - expect: Widget form is visible
  2. Click the close button in the form header (data-testid='button-form-close')
    - expect: The widget form panel is dismissed
    - expect: No widget panel (form, menu, chat, voice, or video) is visible
    - expect: The FAB (data-testid='button-widget-fab') remains visible on the page

#### 1.16. Rate limiting: endpoint accepts normal submission rate

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Submit 3 sequential POST /api/widget/contact requests from the same IP within 60 seconds, each with unique names and emails but valid required fields targeting slug='serra-honda'
    - expect: All 3 requests return HTTP 200 with { success: true }
    - expect: The rate limiter threshold (30 requests per 60 seconds) is not hit by normal test volume

#### 1.17. API: widget/contact accepts widgetCode as alternative to slug

**File:** `tests/e2e/wf-widget-form.spec.ts`

**Steps:**
  1. Authenticate as org admin, then fetch GET /api/widgets with auth token to retrieve Serra Honda's widget list
    - expect: HTTP 200 with an array of widget objects
    - expect: At least one widget has a widgetCode field (non-empty string)
  2. Submit POST /api/widget/contact with body { widgetCode: '<widgetCode from above>', name: 'WidgetCode-Test', email: 'wc@example.com', message: 'Testing widgetCode path' }
    - expect: HTTP 200 with { success: true, conversationId }
    - expect: A conversation is created with channel='form' for Serra Honda's org
