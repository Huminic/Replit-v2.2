# T-005 Test Plan: Widgets Domain

Sprint: T-005
Domain: 11 — Integrations / Widgets
Generated: 2026-03-31
Source files analyzed:
- `client/src/pages/widget-landing.tsx` (public landing page, 4 widget modes: chat, video, voice, form)
- `server/routes/widgets.ts` (authenticated CRUD: GET/POST/PATCH/DELETE /api/widgets, POST /api/widget/video-session)
- `server/routes/public.ts` (public endpoints: /api/widget/chat, /api/widget/contact, /api/widget/voice-callback, /api/widget/voice-config/:slug, /api/widgets/public/:widgetCode, /widget/dealer/:slug.js, /widget/test, /widget/nexxus-widget.js)
- `shared/schema.ts` (widgets table: id, name, type, status, description, widgetCode, organizationId, config, impressions, interactions)
- `tests/e2e/s8-landing-widgets.spec.ts` (8 existing tests: S-8.AC1-AC7)
- `tests/e2e/domain-11-integrations.spec.ts` (14 existing tests: 11.1-11.14)

---

## Widget Architecture Summary

**Widget types (WidgetMode):** `chat`, `video`, `voice`, `form` (plus `menu` and `closed` states)

**Public endpoints (no auth):**
- `GET /api/public/landing/:slug` — org data for landing page
- `POST /api/widget/chat` — send message, get AI response (Claude API)
- `POST /api/widget/contact` — form submission, creates conversation
- `POST /api/widget/voice-callback` — phone callback via VAPI
- `GET /api/widget/voice-config/:slug` — returns vapiAssistantId, tavusPersonaId
- `POST /api/widget/video-session` — create Tavus video session (CORS enabled)
- `GET /api/widgets/public/:widgetCode` — widget config by code
- `GET /widget/dealer/:slug.js` — embeddable JS per dealer
- `GET /widget/test` — partnership portal test page
- `GET /widget/nexxus-widget.js` — generic embed script

**Authenticated endpoints (role 3+ for write):**
- `GET /api/widgets` — list org widgets
- `GET /api/widgets/:id` — get single widget
- `POST /api/widgets` — create widget (requires `widget_slots` entitlement)
- `PATCH /api/widgets/:id` — update widget
- `DELETE /api/widgets/:id` — delete widget

**Known issues:**
- I-168: Voice callback 404 until deploy
- I-121: Popup blocker fix (window.open synchronous pattern)
- I-119: "Web Call" renamed to "Instant Call Back"

---

## Existing Coverage

| ID | Name | What it tests | Coverage level |
|----|------|---------------|----------------|
| S-8.AC1 | Video widget popup blocker fix | Code contains window.open('about:blank') pattern | Static code analysis only |
| S-8.AC1b | Menu button label "Instant Call Back" | Code contains correct label text | Static code analysis only |
| S-8.AC1c | Voice widget phone input form | Code contains testid attributes and API call | Static code analysis only |
| S-8.AC2 | Store name element | Code has data-testid, API returns name | Code + API smoke |
| S-8.AC3/AC4 | Widget appointment endpoint | POST /api/appointments with source=widget | API smoke |
| S-8.AC5 | Widget form creates conversation | POST /api/widget/contact | API functional |
| S-8.AC6/AC7 | Widget JS per dealer (5 dealers) | GET /widget/dealer/:slug.js content checks | API functional |
| 11.1 | Public widget endpoints no auth | GET landing + voice-config without token | API smoke |
| 11.8 | Widget video session | POST /api/widget/video-session | API smoke (may need Tavus key) |
| 11.10 | Landing page per dealer | GET /api/public/landing/:slug for 5 dealers | API functional |
| 11.11 | VAPI assistant ID matches org | GET /api/widget/voice-config/:slug | API functional |
| 11.12 | Tavus persona ID matches org | GET /api/widget/voice-config/:slug | API functional |
| 11.13 | Widget embed JS per org | GET /widget/dealer/:slug.js per dealer | API functional |
| 11.14 | Widget options (Chat/Voice/Video/Form) | GET /api/widgets/public/:widgetCode channels | API functional |

**Gaps in existing tests:** No UI-level widget interaction tests. No chat widget send/receive tests. No form validation tests. No widget CRUD tests. No rate limiting tests. No widget configuration management tests. No embed script integration tests. No error state tests. No cross-org isolation tests.

---

## NEW Test Cases

### A. Widget Menu Rendering

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-WGT-001 | Widget FAB opens menu | P0 | 1. Navigate to `/w/serra-honda`. 2. Wait for page load. 3. Click the widget FAB button. | Widget menu appears with `data-testid="widget-menu"`. Shows 4 options: Web Chat, Instant Call Back, Contact Form, Two-Way Video. |
| TC-WGT-002 | Menu shows all 4 widget options | P0 | 1. Navigate to `/w/serra-honda`. 2. Open widget menu. 3. Check for all option buttons. | `widget-option-chat`, `widget-option-voice`, `widget-option-form`, `widget-option-video` are all visible. |
| TC-WGT-003 | Menu displays org name | P1 | 1. Navigate to `/w/serra-honda`. 2. Open widget menu. | Menu header shows "Serra Honda" as org name. |
| TC-WGT-004 | Close button closes menu | P1 | 1. Navigate to `/w/serra-honda`. 2. Open widget menu. 3. Click close button (`button-close-widget`). | Widget menu disappears. FAB is visible again. |
| TC-WGT-005 | Video option shows persona name | P1 | 1. Navigate to `/w/serra-honda`. 2. Open widget menu. 3. Check video button description. | Video button subtitle reads "Face-to-face with {personaName}" (e.g. "Face-to-face with Caroline"). |

### B. Chat Widget

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-WGT-010 | Open chat from menu | P0 | 1. Navigate to `/w/serra-honda`. 2. Open menu, click "Web Chat". | Chat panel appears with `data-testid="widget-chat"`. Initial AI greeting message visible. |
| TC-WGT-011 | Send chat message | P0 | 1. Open chat widget. 2. Type "Do you have Honda Civics?" in `input-widget-chat`. 3. Click `button-widget-send`. | User message bubble appears. Typing indicator (`chat-typing-indicator`) shows. AI response appears. |
| TC-WGT-012 | Chat via Enter key | P1 | 1. Open chat widget. 2. Type message in input. 3. Press Enter. | Message sent, same behavior as button click. |
| TC-WGT-013 | AI response is contextual | P1 | 1. Open chat widget. 2. Send "What are your hours?". 3. Wait for response. | AI response references the dealership and provides relevant information (not a generic error). |
| TC-WGT-014 | Chat conversation persists | P1 | 1. Open chat widget. 2. Send message, receive response. 3. Send a second message. | Second message uses the same conversationId. Previous messages remain visible. AI context maintained. |
| TC-WGT-015 | Chat back button returns to menu | P1 | 1. Open chat widget. 2. Click back button (`button-back-menu`). | Returns to widget menu. Chat state preserved. |
| TC-WGT-016 | Chat empty input disabled | P2 | 1. Open chat widget. 2. Ensure input is empty. 3. Click send button. | No message sent. Button is disabled or no action occurs. |
| TC-WGT-017 | Chat auto-greeting on new conversation | P1 | 1. Open chat widget for first time. | Initial AI greeting message appears: "Hi! I'm {personaName}, your AI concierge at {orgName}." |
| TC-WGT-018 | Chat loading state during AI response | P1 | 1. Open chat widget. 2. Send a message. | Typing indicator (3 bouncing dots) appears while waiting. Send button shows spinner. Disappears when response arrives. |

### C. Chat Widget API

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-WGT-020 | POST /api/widget/chat creates conversation | P0 | 1. POST `/api/widget/chat` with `{ slug: "serra-honda", message: "Hello" }`. | 200 response. Body contains `conversationId` (non-null string) and `response` (non-empty AI text). |
| TC-WGT-021 | Chat continues existing conversation | P1 | 1. POST `/api/widget/chat` to create conversation. 2. POST again with returned `conversationId`. | Same `conversationId` returned. AI response has context from prior message. |
| TC-WGT-022 | Chat requires slug and message | P1 | 1. POST `/api/widget/chat` with empty body. 2. POST with slug only. 3. POST with message only. | All return 400: "slug and message are required". |
| TC-WGT-023 | Chat invalid slug returns 404 | P1 | 1. POST `/api/widget/chat` with `{ slug: "nonexistent-dealer", message: "Hi" }`. | 404: "Organization not found". |
| TC-WGT-024 | Chat rate limiting | P2 | 1. Send 35 requests to `/api/widget/chat` in under 60 seconds. | First 30 succeed. Subsequent requests return 429 "Too many requests". |
| TC-WGT-025 | Chat auto-greeting returned for new conversation | P1 | 1. POST `/api/widget/chat` with slug of an org that has an agent with autoGreeting. | Response includes `autoGreeting` field with personalized greeting text. |

### D. Video Widget

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-WGT-030 | Open video from menu | P0 | 1. Open widget menu. 2. Click "Two-Way Video" (`widget-option-video`). | Video panel appears with `data-testid="widget-video"`. Status shows "Connecting to {personaName}...". |
| TC-WGT-031 | Video session creates Tavus conversation | P1 | 1. POST `/api/widget/video-session` with `{ slug: "serra-honda", visitorName: "Test" }`. | 200 response with `conversationId`, `conversationUrl`, and `status`. |
| TC-WGT-032 | Video requires widgetCode or slug | P1 | 1. POST `/api/widget/video-session` with empty body. | 400: "widgetCode or slug is required". |
| TC-WGT-033 | Video invalid widget code returns 404 | P1 | 1. POST `/api/widget/video-session` with `{ widgetCode: "invalid_code" }`. | 404: "Widget not found". |
| TC-WGT-034 | Video no Tavus persona returns 400 | P1 | 1. POST `/api/widget/video-session` for an org with no Tavus agent. | 400: "No Tavus persona configured for this organization". |
| TC-WGT-035 | Video error state shows fallback | P1 | 1. Open video widget when Tavus is unavailable. | Error state shows "Video unavailable" with fallback message suggesting Web Chat. |
| TC-WGT-036 | Video CORS headers present | P1 | 1. Send OPTIONS to `/api/widget/video-session`. | 204 response with Access-Control-Allow-Origin: *, Allow-Methods: POST, OPTIONS. |
| TC-WGT-037 | Video opens in new window (popup pattern) | P1 | 1. Open video widget via menu click. | `window.open('about:blank')` called synchronously. After fetch, `videoWindow.location.href` set to Tavus URL. |
| TC-WGT-038 | Video connected state shows confirmation | P2 | 1. Open video widget, session connects successfully. | "Video opened in new window" message with `data-testid="video-opened-message-widget"`. |
| TC-WGT-039 | Video fullscreen mode via URL param | P2 | 1. Navigate to `/w/serra-honda?mode=video`. | Full-screen video layout renders with `data-testid="fullscreen-video"`. Auto-launches video session. |

### E. Voice Callback Widget

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-WGT-040 | Open voice callback from menu | P0 | 1. Open widget menu. 2. Click "Instant Call Back" (`widget-option-voice`). | Voice panel appears with `data-testid="widget-voice"`. Phone input (`input-callback-phone`) visible. |
| TC-WGT-041 | Submit callback with valid phone | P0 | 1. Open voice widget. 2. Enter "5551234567" in phone input. 3. Click "Call Me" (`button-callback-submit`). | Submitting state shows spinner. On success: "We're calling you now!" message. |
| TC-WGT-042 | Callback submit button disabled when empty | P1 | 1. Open voice widget. 2. Check submit button state with empty phone input. | Button is disabled. |
| TC-WGT-043 | Callback error state shows retry | P1 | 1. Open voice widget. 2. Submit callback that fails (e.g., org has no voice agent). | "Unable to place call. Please try again." message. Retry button (`button-callback-retry`) visible. |
| TC-WGT-044 | Callback success allows another request | P1 | 1. Complete a successful callback. 2. Click "Request another call" (`button-callback-another`). | Form resets to idle state with empty phone input. |
| TC-WGT-045 | Voice callback API requires phone | P1 | 1. POST `/api/widget/voice-callback` with `{ slug: "serra-honda" }` (no phone). | 400: "Phone number is required". |
| TC-WGT-046 | Voice callback API requires valid slug | P1 | 1. POST `/api/widget/voice-callback` with `{ slug: "nonexistent", phoneNumber: "+15551234567" }`. | 404: "Organization not found". |
| TC-WGT-047 | Voice callback API no voice agent | P1 | 1. POST `/api/widget/voice-callback` for org with no active VAPI agent. | 400: "No voice agent configured for this organization". |
| TC-WGT-048 | Voice callback formats phone number | P2 | 1. POST `/api/widget/voice-callback` with phoneNumber "5551234567" (no country code). | Server formats to "+15551234567" before calling VAPI. Call succeeds. |
| TC-WGT-049 | Voice callback creates conversation | P1 | 1. POST `/api/widget/voice-callback` with valid data. | Response includes `conversationId`. Conversation created with channel="voice", customerPhone set. |

### F. Contact Form Widget

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-WGT-050 | Open form from menu | P0 | 1. Open widget menu. 2. Click "Contact Form" (`widget-option-form`). | Form panel appears with `data-testid="widget-form"`. Fields: Name*, Email*, Phone, Message*. |
| TC-WGT-051 | Submit form with required fields | P0 | 1. Open form widget. 2. Fill name (`input-form-name`), email (`input-form-email`), message (`input-form-message`). 3. Click "Send Message" (`button-form-submit`). | Success state: "Message Sent" with checkmark (`widget-form-success`). |
| TC-WGT-052 | Form submit disabled without required fields | P1 | 1. Open form widget. 2. Leave name empty, fill email and message. | Submit button disabled. |
| TC-WGT-053 | Form submit disabled without email | P1 | 1. Open form widget. 2. Fill name and message, leave email empty. | Submit button disabled. |
| TC-WGT-054 | Form submit disabled without message | P1 | 1. Open form widget. 2. Fill name and email, leave message empty. | Submit button disabled. |
| TC-WGT-055 | Form phone is optional | P1 | 1. Open form widget. 2. Fill name, email, message only (no phone). 3. Submit. | Submission succeeds without phone number. |
| TC-WGT-056 | Form success allows "Send another message" | P1 | 1. Submit form successfully. 2. Click "Send another message" (`button-form-send-another`). | Form resets: all fields cleared, form inputs visible again. |
| TC-WGT-057 | Form back button returns to menu | P2 | 1. Open form widget. 2. Click back button (`button-form-back`). | Returns to widget menu. |
| TC-WGT-058 | Contact API requires name/email/message | P1 | 1. POST `/api/widget/contact` with missing required fields. | 400: "Name, email, and message are required". |
| TC-WGT-059 | Contact API creates conversation | P1 | 1. POST `/api/widget/contact` with valid data. | 200, `{ success: true, conversationId: "..." }`. Conversation created with channel="form". |
| TC-WGT-060 | Contact API accepts widgetCode lookup | P2 | 1. POST `/api/widget/contact` with `widgetCode` instead of `slug`. | Org resolved via widget code. Conversation created. |

### G. Public Access & Landing Page

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-WGT-070 | Landing page loads without auth | P0 | 1. Open `/w/serra-honda` in incognito browser (no session). | Page loads. Store name (`landing-store-name`) visible. Widget FAB available. |
| TC-WGT-071 | Landing page shows org name | P0 | 1. Navigate to `/w/serra-honda`. | `data-testid="landing-store-name"` contains "Serra Honda". |
| TC-WGT-072 | Landing page 404 for invalid slug | P1 | 1. Navigate to `/w/nonexistent-dealer`. | "Page Not Found" message displayed. |
| TC-WGT-073 | Landing page slug redirect | P2 | 1. Navigate to `/w/{old-slug}` where a redirect exists. | Browser redirects to `/p/{new-slug}`. |
| TC-WGT-074 | Demo slug fallback | P2 | 1. Navigate to `/w/demo`. | Loads with "Demo Organization" and persona "Automa". |
| TC-WGT-075 | Landing page loading state | P2 | 1. Navigate to `/w/serra-honda`, observe initial render. | Loader spinner visible until org data fetched. |
| TC-WGT-076 | Both /p/ and /w/ routes work | P1 | 1. Navigate to `/p/serra-honda`. 2. Navigate to `/w/serra-honda`. | Both routes render the same landing page with correct org data. |

### H. Widget Configuration (Authenticated)

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-WGT-080 | List widgets (authenticated) | P1 | 1. Login as orgAdmin. 2. GET `/api/widgets`. | 200 with array of widgets scoped to user's org. |
| TC-WGT-081 | Get single widget | P1 | 1. Login as orgAdmin. 2. GET `/api/widgets/:id` for own org widget. | 200 with widget object including widgetCode, type, config. |
| TC-WGT-082 | Create widget (role 3+) | P1 | 1. Login as orgAdmin (role 3). 2. POST `/api/widgets` with `{ name: "Test Widget", type: "chat" }`. | 201 with created widget. Auto-generated widgetCode present. |
| TC-WGT-083 | Create widget requires entitlement | P1 | 1. Login as user without `widget_slots` entitlement. 2. POST `/api/widgets`. | 403 or entitlement error. |
| TC-WGT-084 | Update widget | P1 | 1. Login as orgAdmin. 2. PATCH `/api/widgets/:id` with `{ name: "Updated Name" }`. | 200 with updated widget. |
| TC-WGT-085 | Delete widget | P1 | 1. Login as orgAdmin. 2. DELETE `/api/widgets/:id`. | 200 with `{ message: "Widget deleted" }`. |
| TC-WGT-086 | Cross-org widget access denied | P0 | 1. Login as orgAdmin of Org A. 2. GET `/api/widgets/:id` for Org B widget. | 403: "Access denied". |
| TC-WGT-087 | Widget CRUD requires auth | P1 | 1. GET `/api/widgets` without auth token. | 401: "Not authenticated". |
| TC-WGT-088 | Widget create requires role 3+ | P1 | 1. Login as sales role (role < 3). 2. POST `/api/widgets`. | 403 forbidden. |
| TC-WGT-089 | Public widget config by code | P1 | 1. GET `/api/widgets/public/:widgetCode` with valid code. | 200 with widgetCode, type, name, orgName, personaName, appearance, channels (chat/video/voice). |
| TC-WGT-090 | Public widget config invalid code | P1 | 1. GET `/api/widgets/public/invalid_code`. | 404: "Widget not found". |

### I. Widget Embed Scripts

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-WGT-100 | Dealer JS returns JavaScript | P0 | 1. GET `/widget/dealer/serra-honda.js` with Accept: application/javascript. | 200, Content-Type: application/javascript, body contains dealer slug and name, CORS header present. |
| TC-WGT-101 | Dealer JS for all 5 dealers | P1 | 1. For each of [serra-honda, serra-nissan, tony-serra-ford, hyundai-of-columbia, ford-of-columbia]: GET `/widget/dealer/:slug.js`. | Each returns 200 with JS containing the dealer's slug and name. |
| TC-WGT-102 | Dealer JS direct browser access redirects to Tavus | P1 | 1. GET `/widget/dealer/serra-honda.js` with Accept: text/html. | Redirects (302) to Tavus conversation URL, or 503 if Tavus unavailable. |
| TC-WGT-103 | Dealer JS invalid slug returns 404 | P1 | 1. GET `/widget/dealer/nonexistent.js`. | 404 with body `// dealer not found`. |
| TC-WGT-104 | Generic widget embed script | P2 | 1. GET `/widget/nexxus-widget.js`. | 200, Content-Type: application/javascript, body contains iframe creation logic referencing `/w/demo`. |
| TC-WGT-105 | Widget test portal page | P2 | 1. GET `/widget/test`. | 200, Content-Type: text/html, body contains all 5 dealer links and integration instructions. |

### J. Voice Config Endpoint

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-WGT-110 | Voice config returns agent IDs | P1 | 1. GET `/api/widget/voice-config/serra-honda`. | 200 with `{ vapiAssistantId, tavusPersonaId, orgName: "Serra Honda", personaName }`. |
| TC-WGT-111 | Voice config invalid slug | P1 | 1. GET `/api/widget/voice-config/nonexistent`. | 404: "Organization not found". |
| TC-WGT-112 | Voice config null IDs when no agents | P2 | 1. GET `/api/widget/voice-config/:slug` for org with no VAPI/Tavus agents. | 200 with vapiAssistantId: null, tavusPersonaId: null. |

### K. Rate Limiting & Security

| ID | Name | Priority | Steps | Expected Result |
|----|------|----------|-------|-----------------|
| TC-WGT-120 | Widget endpoints rate limited | P2 | 1. Send 65 requests to `/api/public/landing/serra-honda` within 60 seconds. | First 60 succeed (200). Subsequent return 429 "Too many requests". |
| TC-WGT-121 | Video session rate limited | P2 | 1. Send 35 POST requests to `/api/widget/video-session` within 60 seconds. | First 30 succeed. Subsequent return 429. |
| TC-WGT-122 | Chat rate limited (dual limiter) | P2 | 1. Send 35 POST requests to `/api/widget/chat` within 60 seconds. | Rate limited at 30 requests (express-rate-limit) or 30 (custom public rate). |

---

## Priority Summary

| Priority | Count | Description |
|----------|-------|-------------|
| P0 | 12 | Critical path: menu renders, each widget opens, basic send/submit, public access, cross-org isolation, embed JS |
| P1 | 33 | Core functionality: API validation, error states, conversation persistence, config endpoints, CRUD, RBAC |
| P2 | 12 | Edge cases: rate limiting, optional fields, demo fallback, redirect, loading states |

## Known Issues Affecting Tests

| Issue | Impact | Workaround |
|-------|--------|------------|
| I-168 | Voice callback returns 404 until next deploy | TC-WGT-041, TC-WGT-045-049 may 404. Annotate, do not fail. |
| I-121 | Popup blocker — window.open pattern | TC-WGT-037 verified via code analysis (S-8.AC1 already covers). |
| I-119 | "Web Call" renamed to "Instant Call Back" | Verified via S-8.AC1b. TC-WGT-040 confirms UI label. |

## Dependencies

- **Tavus API**: TC-WGT-031, TC-WGT-102 require active Tavus API key. Tests should annotate and pass gracefully if Tavus returns 503.
- **VAPI API**: TC-WGT-041, TC-WGT-049 require VAPI integration. Tests should annotate if no voice agent configured.
- **Claude API**: TC-WGT-011, TC-WGT-013, TC-WGT-020 require AI_INTEGRATIONS_ANTHROPIC_API_KEY. Fallback response "I'm sorry..." is acceptable.
- **Test data**: Tests assume serra-honda org exists in DB with slug "serra-honda". All dealer tests use the 5 standard dealer slugs.
