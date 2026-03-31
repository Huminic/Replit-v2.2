# Landing Pages Domain Test Plan (T-005)

Generated: 2026-03-31
Source: Code analysis of client/src/pages/widget-landing.tsx, client/src/App.tsx, server/routes/public.ts

---

## 1. Architecture Overview

Landing pages are public-facing dealer pages served at `/p/{slug}` (and `/w/{slug}` alias). They render the `WidgetLandingPage` component outside the AuthProvider, so no authentication is required.

**Data flow:**
1. Client extracts `slug` from URL via `useRoute('/p/:slug')` or `useRoute('/w/:slug')`
2. Client fetches `/api/public/landing/{slug}` to resolve org data (id, name, slug, personaName)
3. Server calls `storage.getOrganizationBySlug(slug)` — returns org or checks `slugRedirects` table
4. Page renders dealer branding, lead capture form, and floating widget FAB

**Routes (App.tsx):**
- `/p/:slug` and `/w/:slug` both render `WidgetLandingPage` inside `PublicRouter` (no auth)
- `isPublicRoute()` prevents AuthProvider initialization for these paths

---

## 2. Dealer Inventory

| Dealer | Slug | Persona | Source |
|--------|------|---------|--------|
| Serra Honda | serra-honda | Caroline | widget/test page |
| Serra Nissan | serra-nissan | Magnolia | widget/test page |
| Tony Serra Ford | tony-serra-ford | Georgia | widget/test page |
| Hyundai of Columbia | hyundai-of-columbia | Elizabeth | widget/test page |
| Ford of Columbia | ford-of-columbia | Savannah | widget/test page |

---

## 3. Interactive Element Inventory

### 3.1 Page Structure (`data-testid="landing-page"`)

| Element | Type | Selector / data-testid | Behavior |
|---------|------|------------------------|----------|
| Page container | div | `data-testid="landing-page"` | Split layout: form left, branding right (desktop); stacked reversed (mobile) |
| Store name heading | h1 | `data-testid="landing-store-name"` | Displays `ORG_NAME` (dealer name) |
| Branding panel | div | `data-testid="landing-branding"` | Gunmetal blue (#2c3e50) background, hero image, stats |
| Hero image button | button | `data-testid="button-hero-image"` | Circular rotating image, click starts video chat |
| Hero video link | button | `data-testid="button-hero-video-link"` | "Start a Live Video Chat" text link |
| Stats row | div | (inline) | "500+ Vehicles", "4.9 Rating", "24/7 Available" |
| Loading spinner | div | Loader2 component | Shown while fetching org data |
| Not found state | div | (inline) | "Page Not Found" + "This dealership landing page doesn't exist." |

### 3.2 Lead Capture Form

| Element | Type | Selector / data-testid | Behavior |
|---------|------|------------------------|----------|
| First Name input | text | `data-testid="input-first-name"` | Required |
| Last Name input | text | `data-testid="input-last-name"` | Required |
| Phone input | tel | `data-testid="input-phone"` | Required |
| Email input | email | `data-testid="input-email"` | Required |
| Interest input | text | `data-testid="input-interest"` | Optional, placeholder "e.g. SUV under $40K" |
| Submit button | submit | `data-testid="button-submit"` | Text "Get in Touch", disabled while submitting, shows spinner |
| Success state | div | `data-testid="landing-success"` | "You're all set!" + CheckCircle icon |
| Send another button | button | `data-testid="button-send-another"` | Resets form to initial state |
| Consent text | p | (inline) | "By submitting, you agree to receive communications from {ORG_NAME}..." |

### 3.3 Widget FAB and Menu

| Element | Type | Selector / data-testid | Behavior |
|---------|------|------------------------|----------|
| FAB button | button | `data-testid="button-widget-fab"` | Fixed bottom-right, teal (#0d9488), toggles widget open/closed |
| Widget menu | div | `data-testid="widget-menu"` | 4 options: Web Chat, Instant Call Back, Contact Form, Two-Way Video |
| Chat option | button | `data-testid="widget-option-chat"` | Opens chat widget |
| Voice option | button | `data-testid="widget-option-voice"` | Opens callback widget |
| Form option | button | `data-testid="widget-option-form"` | Opens contact form widget |
| Video option | button | `data-testid="widget-option-video"` | Starts video chat (opens new window) |
| Close widget | button | `data-testid="button-close-widget"` | Closes widget menu |

### 3.4 Chat Widget (`data-testid="widget-chat"`)

| Element | Type | Selector / data-testid | Behavior |
|---------|------|------------------------|----------|
| Chat container | div | `data-testid="widget-chat"` | 320px wide, 420px tall |
| Back to menu | button | `data-testid="button-back-menu"` | Returns to widget menu |
| Persona name | text | (inline) | Shows PERSONA_NAME + "Online now" |
| Chat messages | div | `data-testid="chat-message-{i}"` | User messages teal, AI messages gray |
| Typing indicator | div | `data-testid="chat-typing-indicator"` | 3 bouncing dots while loading |
| Chat input | input | `data-testid="input-widget-chat"` | Placeholder "Type a message...", Enter key sends |
| Send button | button | `data-testid="button-widget-send"` | Sends chat message via `/api/widget/chat` |

### 3.5 Voice/Callback Widget (`data-testid="widget-voice"`)

| Element | Type | Selector / data-testid | Behavior |
|---------|------|------------------------|----------|
| Voice container | div | `data-testid="widget-voice"` | 320px wide, 300px tall |
| Phone input | tel | `data-testid="input-callback-phone"` | Placeholder "(555) 123-4567" |
| Call Me button | button | `data-testid="button-callback-submit"` | Disabled when phone empty, calls `/api/widget/voice-callback` |
| Success state | div | (inline) | "We're calling you now!" + CheckCircle |
| Request another | button | `data-testid="button-callback-another"` | Resets callback form |
| Retry button | button | `data-testid="button-callback-retry"` | Shown on error, resets to idle |

### 3.6 Contact Form Widget (`data-testid="widget-form"`)

| Element | Type | Selector / data-testid | Behavior |
|---------|------|------------------------|----------|
| Form container | div | `data-testid="widget-form"` | Inline contact form |
| Name input | input | `data-testid="input-form-name"` | Required |
| Email input | input | `data-testid="input-form-email"` | Required |
| Phone input | input | `data-testid="input-form-phone"` | Optional |
| Message textarea | textarea | `data-testid="input-form-message"` | Required |
| Submit button | button | `data-testid="button-form-submit"` | Disabled when required fields empty |
| Back button | button | `data-testid="button-form-back"` | Returns to menu |
| Close button | button | `data-testid="button-form-close"` | Closes widget |
| Success state | div | `data-testid="widget-form-success"` | "Message Sent" + CheckCircle |
| Send another | button | `data-testid="button-form-send-another"` | Resets form |

### 3.7 Video Widget (`data-testid="widget-video"`)

| Element | Type | Selector / data-testid | Behavior |
|---------|------|------------------------|----------|
| Video container | div | `data-testid="widget-video"` | Dark theme, 320x420 |
| Back button | button | `data-testid="button-video-back"` | Returns to menu, resets video state |
| Close button | button | `data-testid="button-video-close"` | Closes widget, resets video state |
| Mic toggle | button | `data-testid="button-toggle-mic"` | Toggles mute, red when muted |
| End call | button | `data-testid="button-end-call"` | Closes widget and resets state |
| Status indicators | text | (inline) | "Connecting..." / "Video opened in new window" / "Video unavailable" |

### 3.8 Fullscreen Video Mode (`?mode=video`)

| Element | Type | Selector / data-testid | Behavior |
|---------|------|------------------------|----------|
| Fullscreen container | div | `data-testid="fullscreen-video"` | Full viewport, dark background |
| Opened message | div | `data-testid="video-opened-message"` | Shown when video opens in new tab |
| Mic toggle | button | `data-testid="button-toggle-mic"` | Toggles mute |
| End call | button | `data-testid="button-end-call"` | Redirects to `/p/{slug}` |
| Fallback button | button | `data-testid="button-video-fallback"` | Shown on error, goes to `/p/{slug}` |

---

## 4. API Endpoints Used

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/public/landing/{slug}` | GET | None | Resolve org by slug, returns id/name/slug/personaName |
| `/api/widget/contact` | POST | None | Submit contact form (name, email, phone, message, slug) |
| `/api/widget/chat` | POST | None | Send chat message, get AI response |
| `/api/widget/voice-callback` | POST | None | Request outbound voice call |
| `/api/widget/voice-config/{slug}` | GET | None | Get vapiAssistantId and tavusPersonaId for slug |
| `/api/widget/video-session` | POST | None | Create Tavus video session |

All endpoints are rate-limited (60 req/min per IP, chat is 30 req/min).

---

## 5. Test Cases

### 5.1 Page Load and Dealer Resolution

**TC-LP-001: Serra Honda landing page loads**
- Priority: P0
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Wait for page to finish loading (spinner gone)
  3. Verify `data-testid="landing-page"` is visible
  4. Read text from `data-testid="landing-store-name"`
- Expected: Page loads, store name displays "Serra Honda"

**TC-LP-002: Serra Nissan landing page loads**
- Priority: P0
- Steps:
  1. Navigate to `/p/serra-nissan`
  2. Wait for page to finish loading
  3. Verify `data-testid="landing-page"` is visible
  4. Read text from `data-testid="landing-store-name"`
- Expected: Page loads, store name displays "Serra Nissan"

**TC-LP-003: Tony Serra Ford landing page loads**
- Priority: P0
- Steps:
  1. Navigate to `/p/tony-serra-ford`
  2. Wait for page to finish loading
  3. Verify `data-testid="landing-page"` is visible
  4. Read text from `data-testid="landing-store-name"`
- Expected: Page loads, store name displays "Tony Serra Ford"

**TC-LP-004: Hyundai of Columbia landing page loads**
- Priority: P0
- Steps:
  1. Navigate to `/p/hyundai-of-columbia`
  2. Wait for page to finish loading
  3. Verify `data-testid="landing-page"` is visible
  4. Read text from `data-testid="landing-store-name"`
- Expected: Page loads, store name displays "Hyundai of Columbia"

**TC-LP-005: Ford of Columbia landing page loads**
- Priority: P0
- Steps:
  1. Navigate to `/p/ford-of-columbia`
  2. Wait for page to finish loading
  3. Verify `data-testid="landing-page"` is visible
  4. Read text from `data-testid="landing-store-name"`
- Expected: Page loads, store name displays "Ford of Columbia"

**TC-LP-006: /w/ alias route works**
- Priority: P1
- Steps:
  1. Navigate to `/w/serra-honda`
  2. Wait for page to finish loading
  3. Verify `data-testid="landing-page"` is visible
  4. Read text from `data-testid="landing-store-name"`
- Expected: Page loads with "Serra Honda", identical to `/p/serra-honda`

**TC-LP-007: Invalid slug shows not found**
- Priority: P0
- Steps:
  1. Navigate to `/p/nonexistent-dealer`
  2. Wait for page to finish loading
- Expected: "Page Not Found" text visible. "This dealership landing page doesn't exist." visible. No `data-testid="landing-page"` present.

**TC-LP-008: Demo slug fallback**
- Priority: P2
- Steps:
  1. Navigate to `/p/demo`
  2. Wait for page to finish loading
- Expected: Page loads with either "Demo Organization" or the first org in the database. No error state.

### 5.2 Public Access (No Auth Required)

**TC-LP-010: Landing page loads without authentication**
- Priority: P0
- Steps:
  1. Clear all cookies and session storage
  2. Navigate to `/p/serra-honda`
  3. Wait for page to load
- Expected: Page loads normally. No redirect to `/login`. No auth errors in console.

**TC-LP-011: Landing page does not trigger auth initialization**
- Priority: P1
- Steps:
  1. Clear all cookies and session storage
  2. Navigate to `/p/serra-honda`
  3. Check network requests
- Expected: No requests to `/api/auth/*` or `/api/user` endpoints. Only `/api/public/landing/serra-honda` is called for data.

### 5.3 Dealer Branding Per Page

**TC-LP-020: Serra Honda branding elements**
- Priority: P0
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Wait for page to load
  3. Check org name appears in heading area (near Car icon)
  4. Check consent text includes "Serra Honda"
  5. Open widget menu via FAB button
  6. Check widget header shows "Serra Honda"
- Expected: "Serra Honda" appears in page heading, consent text, and widget header.

**TC-LP-021: Serra Honda persona name**
- Priority: P1
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Wait for page to load
  3. Open widget FAB (`data-testid="button-widget-fab"`)
  4. Click `data-testid="widget-option-chat"`
  5. Read persona name in chat header
  6. Read first chat message
- Expected: Persona name "Caroline" in chat header. Initial message: "Hi! I'm Caroline, your AI concierge at Serra Honda..."

**TC-LP-022: Serra Nissan persona name**
- Priority: P1
- Steps:
  1. Navigate to `/p/serra-nissan`
  2. Wait for page to load
  3. Open widget FAB, click chat option
  4. Read persona name and first message
- Expected: Persona name "Magnolia". Initial message includes "Magnolia" and "Serra Nissan".

**TC-LP-023: Tony Serra Ford persona name**
- Priority: P1
- Steps:
  1. Navigate to `/p/tony-serra-ford`
  2. Wait for page to load
  3. Open widget FAB, click chat option
  4. Read persona name and first message
- Expected: Persona name "Georgia". Initial message includes "Georgia" and "Tony Serra Ford".

**TC-LP-024: Hyundai of Columbia persona name**
- Priority: P1
- Steps:
  1. Navigate to `/p/hyundai-of-columbia`
  2. Wait for page to load
  3. Open widget FAB, click chat option
  4. Read persona name and first message
- Expected: Persona name "Elizabeth". Initial message includes "Elizabeth" and "Hyundai of Columbia".

**TC-LP-025: Ford of Columbia persona name**
- Priority: P1
- Steps:
  1. Navigate to `/p/ford-of-columbia`
  2. Wait for page to load
  3. Open widget FAB, click chat option
  4. Read persona name and first message
- Expected: Persona name "Savannah". Initial message includes "Savannah" and "Ford of Columbia".

### 5.4 Widget Rendering

**TC-LP-030: Widget FAB button present and functional**
- Priority: P0
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Verify `data-testid="button-widget-fab"` is visible (fixed bottom-right)
  3. Click FAB button
  4. Verify `data-testid="widget-menu"` appears
  5. Click FAB button again
  6. Verify widget menu closes
- Expected: FAB toggles widget menu open/closed. Menu shows 4 options.

**TC-LP-031: Widget menu has all 4 channel options**
- Priority: P0
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Click FAB button
  3. Verify `data-testid="widget-option-chat"` is visible with "Web Chat" text
  4. Verify `data-testid="widget-option-voice"` is visible with "Instant Call Back" text
  5. Verify `data-testid="widget-option-form"` is visible with "Contact Form" text
  6. Verify `data-testid="widget-option-video"` is visible with "Two-Way Video" text
- Expected: All 4 widget options are rendered with correct labels and icons.

**TC-LP-032: Chat widget opens and shows initial message**
- Priority: P0
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Click FAB, then click `data-testid="widget-option-chat"`
  3. Verify `data-testid="widget-chat"` is visible
  4. Read `data-testid="chat-message-0"` text
- Expected: Chat widget opens. First message is AI greeting with persona name and dealer name.

**TC-LP-033: Contact form widget opens with required fields**
- Priority: P0
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Click FAB, then click `data-testid="widget-option-form"`
  3. Verify `data-testid="widget-form"` is visible
  4. Verify `data-testid="input-form-name"`, `data-testid="input-form-email"`, `data-testid="input-form-message"` present
  5. Verify `data-testid="button-form-submit"` is disabled (fields empty)
- Expected: Form widget shows name, email, phone, message fields. Submit disabled until required fields filled.

**TC-LP-034: Voice callback widget opens**
- Priority: P0
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Click FAB, then click `data-testid="widget-option-voice"`
  3. Verify `data-testid="widget-voice"` is visible
  4. Verify `data-testid="input-callback-phone"` is present
  5. Verify `data-testid="button-callback-submit"` is disabled (phone empty)
- Expected: Voice widget shows phone input and "Call Me" button. Button disabled until phone entered.

**TC-LP-035: Video widget opens**
- Priority: P1
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Click FAB, then click `data-testid="widget-option-video"`
  3. Verify `data-testid="widget-video"` is visible
- Expected: Video widget opens with connecting or error state (depends on Tavus config).

**TC-LP-036: Widget close button from menu**
- Priority: P1
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Click FAB to open menu
  3. Click `data-testid="button-close-widget"`
  4. Verify widget menu is gone
- Expected: Widget closes. FAB shows MessageSquare icon again.

**TC-LP-037: Widget back navigation from chat**
- Priority: P1
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Click FAB, click chat option
  3. Click `data-testid="button-back-menu"`
  4. Verify `data-testid="widget-menu"` is visible again
- Expected: Returns to widget menu from chat view.

### 5.5 Lead Capture Form (Main Page)

**TC-LP-040: Lead form renders all fields**
- Priority: P0
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Verify `data-testid="input-first-name"` is visible
  3. Verify `data-testid="input-last-name"` is visible
  4. Verify `data-testid="input-phone"` is visible
  5. Verify `data-testid="input-email"` is visible
  6. Verify `data-testid="input-interest"` is visible
  7. Verify `data-testid="button-submit"` is visible with "Get in Touch" text
- Expected: All 5 inputs and submit button are rendered.

**TC-LP-041: Lead form submission success**
- Priority: P0
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Fill `data-testid="input-first-name"` with "Test"
  3. Fill `data-testid="input-last-name"` with "User"
  4. Fill `data-testid="input-phone"` with "5551234567"
  5. Fill `data-testid="input-email"` with "test@example.com"
  6. Fill `data-testid="input-interest"` with "SUV under 40K"
  7. Click `data-testid="button-submit"`
  8. Wait for submission
- Expected: `data-testid="landing-success"` appears with "You're all set!" text.

**TC-LP-042: Lead form send another resets form**
- Priority: P1
- Steps:
  1. Complete TC-LP-041
  2. Click `data-testid="button-send-another"`
- Expected: Form resets to initial state. All fields empty. Submit button visible.

**TC-LP-043: Lead form required field validation**
- Priority: P1
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Leave all fields empty
  3. Click `data-testid="button-submit"`
- Expected: Browser native validation prevents submission (HTML `required` attribute on first name, last name, phone, email).

### 5.6 Widget Chat Interaction

**TC-LP-050: Send chat message and receive AI response**
- Priority: P1
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Open chat widget (FAB -> chat option)
  3. Type "Hello" in `data-testid="input-widget-chat"`
  4. Click `data-testid="button-widget-send"`
  5. Wait for typing indicator to appear and then resolve
- Expected: User message appears as teal bubble. AI response appears as gray bubble. Typing indicator shows during loading.

**TC-LP-051: Chat send via Enter key**
- Priority: P2
- Steps:
  1. Open chat widget on any dealer page
  2. Type "Hi" in chat input
  3. Press Enter key
- Expected: Message sends same as clicking send button.

**TC-LP-052: Chat send button disabled while loading**
- Priority: P2
- Steps:
  1. Open chat widget
  2. Send a message
  3. While `data-testid="chat-typing-indicator"` is visible, check send button state
- Expected: `data-testid="button-widget-send"` is disabled during loading.

### 5.7 Widget Contact Form Interaction

**TC-LP-060: Widget contact form submission**
- Priority: P1
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Open form widget (FAB -> form option)
  3. Fill `data-testid="input-form-name"` with "Jane Doe"
  4. Fill `data-testid="input-form-email"` with "jane@test.com"
  5. Fill `data-testid="input-form-message"` with "Interested in service"
  6. Click `data-testid="button-form-submit"`
  7. Wait for submission
- Expected: `data-testid="widget-form-success"` appears with "Message Sent".

**TC-LP-061: Widget form submit disabled until required fields filled**
- Priority: P1
- Steps:
  1. Open form widget
  2. Check `data-testid="button-form-submit"` is disabled
  3. Fill only name -> still disabled
  4. Fill name + email -> still disabled
  5. Fill name + email + message -> enabled
- Expected: Button enables only when name, email, and message are all non-empty.

### 5.8 Voice Callback Interaction

**TC-LP-070: Callback phone input and submit**
- Priority: P1
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Open voice widget (FAB -> voice option)
  3. Type "5551234567" in `data-testid="input-callback-phone"`
  4. Verify `data-testid="button-callback-submit"` becomes enabled
  5. Click submit
- Expected: Callback request submitted. Shows either success ("We're calling you now!") or error state depending on VAPI config.

**TC-LP-071: Callback submit disabled without phone**
- Priority: P2
- Steps:
  1. Open voice widget
  2. Verify `data-testid="button-callback-submit"` is disabled
  3. Type a phone number
  4. Verify button becomes enabled
  5. Clear phone input
  6. Verify button becomes disabled again
- Expected: Button state tracks phone input presence.

### 5.9 Responsive Layout

**TC-LP-080: Desktop layout (1024px+)**
- Priority: P0
- Steps:
  1. Set viewport to 1280x720
  2. Navigate to `/p/serra-honda`
  3. Observe page layout
- Expected: Side-by-side layout. Form panel on left, branding panel on right (`flex-row` via `lg:flex-row`). Both panels visible simultaneously.

**TC-LP-081: Mobile layout (< 1024px)**
- Priority: P0
- Steps:
  1. Set viewport to 375x667 (iPhone SE)
  2. Navigate to `/p/serra-honda`
  3. Observe page layout
- Expected: Stacked layout with branding on top, form below (`flex-col-reverse`). Content scrollable. Widget FAB still accessible.

**TC-LP-082: Tablet layout (768px)**
- Priority: P1
- Steps:
  1. Set viewport to 768x1024 (iPad)
  2. Navigate to `/p/serra-honda`
  3. Observe page layout
- Expected: Stacked layout (below `lg` breakpoint). All content accessible. Widget FAB visible.

**TC-LP-083: Widget responsive on mobile**
- Priority: P1
- Steps:
  1. Set viewport to 375x667
  2. Navigate to `/p/serra-honda`
  3. Click FAB to open widget menu
  4. Verify widget fits within viewport (320px width)
- Expected: Widget menu and sub-views (chat, form, voice, video) fit within mobile viewport without horizontal overflow.

### 5.10 SEO and Meta Tags

**TC-LP-090: No document.title or meta tags set dynamically**
- Priority: P2
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Inspect `document.title`
  3. Inspect `<meta name="description">` tag
  4. Inspect Open Graph tags (`og:title`, `og:description`)
- Expected: **KNOWN GAP** -- The widget-landing.tsx component does NOT set `document.title`, `<meta>` description, or Open Graph tags dynamically. The page uses whatever defaults exist in index.html. This is a deficiency for SEO/sharing.

**TC-LP-091: Page is indexable (no noindex)**
- Priority: P2
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Check for `<meta name="robots" content="noindex">` in the document head
- Expected: No noindex directive (public pages should be crawlable). However, since this is an SPA, server-side rendering or prerendering would be needed for proper SEO.

### 5.11 Cross-Dealer Isolation

**TC-LP-100: Each dealer page shows only its own data**
- Priority: P0
- Steps:
  1. Navigate to `/p/serra-honda`, record store name and persona
  2. Navigate to `/p/serra-nissan`, record store name and persona
  3. Navigate to `/p/tony-serra-ford`, record store name and persona
  4. Navigate to `/p/hyundai-of-columbia`, record store name and persona
  5. Navigate to `/p/ford-of-columbia`, record store name and persona
- Expected: Each page shows unique dealer name and persona name matching the dealer inventory table (Section 2). No cross-contamination.

**TC-LP-101: Chat messages isolated per dealer**
- Priority: P1
- Steps:
  1. Navigate to `/p/serra-honda`, open chat, send "Hello Honda"
  2. Navigate to `/p/serra-nissan`, open chat
  3. Check chat messages
- Expected: Serra Nissan chat starts fresh with Magnolia's greeting. No Honda messages visible.

### 5.12 Error States and Edge Cases

**TC-LP-110: API rate limiting**
- Priority: P2
- Steps:
  1. Navigate to `/p/serra-honda`
  2. Rapidly send 31+ chat messages within 1 minute
- Expected: After rate limit exceeded, API returns 429 status. Chat shows error message.

**TC-LP-111: Slug redirect handling**
- Priority: P2
- Steps:
  1. If a slug redirect exists (old slug -> new slug), navigate to `/p/{old-slug}`
- Expected: Page detects redirect response (`data.redirect && data.newSlug`) and navigates to `/p/{newSlug}`.

**TC-LP-112: Network error during org load**
- Priority: P2
- Steps:
  1. Simulate network failure
  2. Navigate to `/p/serra-honda`
- Expected: Not-found state displayed ("Page Not Found") since fetch catch sets `notFound: true`.

---

## 6. Test Summary

| Category | Count | P0 | P1 | P2 |
|----------|-------|----|----|----|
| Page Load & Resolution | 8 | 5 | 1 | 2 |
| Public Access | 2 | 1 | 1 | 0 |
| Dealer Branding | 6 | 1 | 5 | 0 |
| Widget Rendering | 8 | 4 | 4 | 0 |
| Lead Capture Form | 4 | 2 | 2 | 0 |
| Chat Interaction | 3 | 0 | 1 | 2 |
| Contact Form Widget | 2 | 0 | 2 | 0 |
| Voice Callback | 2 | 0 | 1 | 1 |
| Responsive Layout | 4 | 2 | 2 | 0 |
| SEO/Meta | 2 | 0 | 0 | 2 |
| Cross-Dealer Isolation | 2 | 1 | 1 | 0 |
| Error States | 3 | 0 | 0 | 3 |
| **Total** | **46** | **16** | **20** | **10** |

---

## 7. Known Gaps and Observations

1. **No dynamic SEO tags** -- widget-landing.tsx does not set `document.title`, meta description, or OG tags per dealer. All landing pages share the same HTML `<title>` from index.html.
2. **No server-side rendering** -- As an SPA, search engine crawlers will not see dealer-specific content without JS execution. This limits organic search value.
3. **Video/Voice depend on external services** -- Tavus (video) and VAPI (voice) features require active service configuration per org. Tests for these should expect graceful degradation when not configured.
4. **Rate limiting is IP-based** -- Custom rate limiter (not just express-rate-limit) tracks per-IP. Testing rate limits requires multiple rapid requests from same IP.
5. **Static hero stats** -- "500+ Vehicles", "4.9 Rating", "24/7 Available" are hardcoded, not fetched per dealer.
