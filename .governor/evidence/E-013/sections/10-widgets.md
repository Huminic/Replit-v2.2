# Section Audit: Widgets (Universal Widget)
**Sprint:** E-013
**Route:** Embedded on widget-landing.tsx + configurable in settings.tsx Tools & Integrations
**Page Components:** client/src/pages/widget-landing.tsx (widget rendering), client/src/pages/settings.tsx (widget management)
**Sub-menu:** N/A — widgets are embedded components, not a standalone page

## What Exists in Code

### Widget Types

The universal widget system supports 4 widget types, each with its own rendering mode:

| Widget Type | Icon | Implementation | Status |
|---|---|---|---|
| Web Chat (text) | MessageSquare | Full chat interface with /api/widget/chat API. AI responses, conversation persistence, typing indicator. | **Functional** |
| Web Call (voice) | Phone | VAPI Web SDK. Fetches assistant ID from /api/widget/voice-config/:slug. Voice call with volume viz + mic toggle. | **Functional (needs VAPI config)** |
| Contact Form | Send | Form (name, email, phone, message) → POST /api/widget/contact. Success confirmation. | **Functional** |
| Two-Way Video | Video | POST /api/widget/video-session → gets conversationUrl → `window.open(url, '_blank')`. Tavus integration. | **Functional (opens new window)** |

### Widget Menu (widgetMode === 'menu')
- Teal header with org name + "Choose how to connect"
- 4 option buttons with colored icon backgrounds:
  - Web Chat (blue-50 bg, blue-600 icon)
  - Web Call (emerald-50 bg, emerald-600 icon)
  - Contact Form (orange-50 bg, orange-600 icon)
  - Two-Way Video (purple-50 bg, purple-600 icon)
- Close button (X) to dismiss

### Web Chat Widget (widgetMode === 'chat')
- 280x420px rounded card with teal header
- Back button to menu, close button
- Scrollable message list (user right-aligned with teal bg, AI left-aligned with gray bg)
- Typing indicator (3 animated dots)
- Text input + send button
- API: POST /api/widget/chat with { slug, message, conversationId }
- ConversationId persisted for multi-turn context

### Web Call Widget (widgetMode === 'voice')
- 280x300px card with status states: idle → connecting → connected → ended → error
- Connected state: phone icon + "Connected to {PERSONA_NAME}" + volume visualizer (5 bars)
- Error state: "Voice calling is not configured yet. Please try Web Chat instead."
- Controls: mic mute toggle, end call button
- VAPI integration: `new Vapi(VITE_VAPI_PUBLIC_KEY)` → `vapi.start(assistantId)`
- **NOTE: Manifest says "Web call should trigger outbound instant agent call — ask for number, trigger VAPI call to prospect."** Current implementation initiates a browser-based VAPI call to the AI assistant, NOT an outbound call to the visitor's phone number. **This is a gap if the intent is phone-to-phone calling.**

### Video Widget (widgetMode === 'video')
- 280x420px card with dark background
- Status states: idle → connecting → connected → error
- Connected: "Video opened in new window" message
- Error: "Video chat is not configured yet. Please try Web Chat instead."
- **CONFIRMED: Opens in new window** — `window.open(data.conversationUrl, '_blank', 'noopener,noreferrer')` at line 323
- Mic toggle and end-call button in footer

### Contact Form Widget (widgetMode === 'form')
- 280px rounded card with teal header
- Fields: Name (required), Email (required), Phone (optional), Message (required)
- Submit → POST /api/widget/contact with { slug, name, email, phone, message }
- Success state: checkmark + "Message Sent" + "Send another message" button
- **Real API submission**

### Widget Management in Settings (Tools & Integrations → Widgets tab)
- Fetches widgets from `/api/widgets`
- Falls back to staticWidgets if API returns empty
- Widget config modal with 3 tabs: Settings, Appearance, Targeting
- **Appearance config:** primaryColor, secondaryColor, textColor, backgroundColor, orgName, showLogo, position, animation, buttonLabel, welcomeHeading, welcomeMessage
- **Targeting config:** audience (all/new/returning), includePages, excludePages, desktop/mobile/tablet toggles, businessHoursOnly, delaySeconds, scrollDepthPercent, exitIntent
- **Domain allowlisting:** Add/remove allowed domains
- **Embed code generation:** generateWidgetEmbedCode() produces embeddable snippet
- **Preview modal:** Shows widget preview
- **Status management:** Active/inactive/draft

### Universal Widget Settings
- Channel toggles: control which widget modes are available
- Stored via UniversalWidgetSettings type

## Manifest vs Code

| Manifest Item | Code Status | Gap? |
|---|---|---|
| Items: Web chat, Web Call, Contact Form, 2-way Video | YES — all 4 exist in widget menu | No gap |
| Video widget CONFIRMED to open new window, not chat pane | YES — `window.open(..., '_blank')` | No gap |
| Web call should trigger outbound instant agent call — ask for number, trigger VAPI call to prospect | **MISMATCH** — current Web Call starts a browser-based VAPI call to AI assistant. It does NOT ask for a phone number or trigger a VAPI outbound call to the prospect. | **Gap — different behavior than manifest** |

## Findings

1. **Web Call behavior mismatch** — Manifest says: "Web call should trigger outbound instant agent call — ask for number, trigger VAPI call to prospect." Current code initiates a browser-based voice call between the visitor and the VAPI AI assistant (similar to a phone call simulation in the browser). It does NOT collect the visitor's phone number and trigger an outbound VAPI call TO that number. This is a fundamental behavior difference.
2. **Video opens in new window** — Confirmed per manifest. `window.open(data.conversationUrl, '_blank', 'noopener,noreferrer')`.
3. **All widget APIs are real** — /api/widget/chat, /api/widget/contact, /api/widget/video-session, /api/widget/voice-config/:slug are all real endpoints with actual backend behavior.
4. **Widget management is comprehensive** — Settings page has full widget CRUD with appearance, targeting, domain allowlisting, embed code, and preview. Real API persistence via /api/widgets.
5. **Error handling is user-friendly** — Each widget mode has clear error states with suggestions (e.g., "Voice calling is not configured yet. Please try Web Chat instead.").
6. **No org-specific styling in widgets** — Widget uses hardcoded WIDGET_TEAL color. The widget management in settings has appearance config (primaryColor, etc.) but the landing page widget doesn't appear to use those customized values — it uses the hardcoded constant.

## Existing ACs

No section-specific ACs exist yet for Widgets.

## New ACs Needed

| Proposed AC | Priority | Dimension |
|---|---|---|
| Widget menu shows all 4 options when all channels enabled | T2 | FE |
| Web Chat widget sends message and receives AI response | T1 | FE/BE |
| Web Chat widget maintains conversation context across messages | T2 | FE/BE |
| Web Call behavior matches manifest: collect number → trigger outbound VAPI call | T1 | FE/BE |
| Contact Form widget submits and shows success | T1 | FE/BE |
| Video widget opens Tavus session in new browser window | T1 | FE |
| Widget appearance respects org config (not hardcoded WIDGET_TEAL) | T3 | FE |
| Widget embed code generates valid embeddable snippet | T2 | FE |
| Widget targeting rules work (page include/exclude, device type, delay) | T3 | FE |
| Widget channel toggles control which options appear in menu | T2 | FE |

## Section Description (DRAFT — for operator edit)

**Widgets are the customer-facing communication tools embedded on landing pages and external websites.** The universal widget presents as a floating button (bottom-right) that opens a menu with 4 options: **Web Chat** (AI-powered text chat with Claude, conversation persistence, typing indicators — via /api/widget/chat), **Web Call** (browser-based voice call with VAPI AI assistant — connects visitor to AI voice agent in browser), **Contact Form** (name/email/phone/message submission via /api/widget/contact), and **Two-Way Video** (Tavus AI video session that opens in a new browser window — confirmed per manifest).

Widget management lives in Settings → Tools & Integrations → Widgets tab, where admins can create/configure widgets with appearance settings (colors, position, animation, greeting), targeting rules (page include/exclude, device type, business hours, delay, scroll depth, exit intent), and domain allowlisting. Embed codes are generated for external website installation.

**Issues found:** Web Call behavior differs from manifest — manifest says it should "ask for number, trigger VAPI call to prospect" (phone-to-phone outbound), but current implementation is a browser-based AI voice call (browser-to-AI). Widget appearance on landing pages uses hardcoded teal color instead of org-specific config from settings. No section-specific tests exist.
