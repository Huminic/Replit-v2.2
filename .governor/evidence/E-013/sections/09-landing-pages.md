# Section Audit: Landing Pages
**Sprint:** E-013
**Routes:** /p/:slug, /w/:slug
**Page Component:** client/src/pages/widget-landing.tsx (850+ lines)
**Sub-menu:** N/A — public page, no sub-menu

## What Exists in Code

### Page Structure (widget-landing.tsx)

This is a **public-facing page** — no auth required. Resolves org by slug via `/api/public/landing/:slug`. Falls back to "demo" slug if no match.

**Layout:** Two-panel — left side is a contact form ("Let's schedule a VIP test drive"), right side is a hero image area. On mobile, stacks vertically.

### Landing Page Features

#### Store Name Display
- **Positioned: top-left** — `<h1 className="absolute top-4 left-4 z-30">` at line 758
- Uses `ORG_NAME` (from API org data or fallback "Our Dealership")
- Also shown in the form header area with a Car icon badge (line 766-771)
- **Matches manifest:** "Store name should show on left side at top"

#### Contact Form (left panel)
- Fields: First Name, Last Name, Phone Number, Email, Interest/Vehicle (dropdown)
- Submit → POST /api/widget/contact with slug, name, email, phone, message
- Success state: checkmark + "You're all set!" + "Send another request" button
- **Real API submission — not mock**

#### Widget Overlay (bottom-right)
- Floating teal circle button → opens widget menu
- **4 widget options in menu:**

| Widget | Behavior | Implementation |
|---|---|---|
| Web Chat | Opens chat pane with AI assistant | POST /api/widget/chat with slug, message, conversationId. Real AI responses. |
| Web Call | Initiates VAPI voice call | Fetches voice config from /api/widget/voice-config/:slug. Creates VAPI instance with assistant ID. Real VAPI integration. |
| Contact Form | Opens form in widget | Same /api/widget/contact endpoint. Fields: name, email, phone, message. |
| Two-Way Video | Opens Tavus video in **new window** | POST /api/widget/video-session → gets conversationUrl → `window.open(url, '_blank')`. **Confirmed: opens in new window, NOT in widget pane.** |

#### Video Mode Handling
- **?mode=video** query parameter triggers fullscreen video UI
- Auto-launches on page load when `queryMode === 'video'`
- Fetches Tavus persona config, creates video session, opens in new window
- Fullscreen UI shows connection status (connecting/connected/error)
- **Connected state:** "Video opened in new window" message
- **Error state:** "Video Unavailable" with fallback button to landing page
- Mic toggle and end call buttons in footer

#### Voice Call Handling
- Uses VAPI Web SDK (`import Vapi from '@vapi-ai/web'`)
- Fetches `vapiAssistantId` from `/api/widget/voice-config/:slug`
- Status flow: idle → connecting → connected → ended/error
- Volume level visualization (5 animated bars)
- Mic mute/unmute control
- End call button

### Org Data Resolution
- Slug from route params (/p/:slug or /w/:slug)
- Fetches from `/api/public/landing/:slug`
- Handles redirect (if `data.redirect && data.newSlug`, navigates to new slug)
- Fallback: demo org with persona "Automa"

## Manifest vs Code

| Manifest Item | Code Status | Gap? |
|---|---|---|
| Sub items: Page, Widgets | Single page with embedded widgets. Not separate sub-pages. | Architecture differs from manifest description but functionality present |
| Video widget needs to target new window, not widget window | YES — `window.open(data.conversationUrl, '_blank')` at lines 124 and 323 | No gap |
| Store name should show on left side at top | YES — `absolute top-4 left-4` at line 758 | No gap |

## Findings

1. **Video opens in new window** — Confirmed at two code locations: fullscreen mode (line 124) and widget mode (line 323). Both use `window.open(..., '_blank', 'noopener,noreferrer')`. **Matches manifest requirement.**
2. **Store name is top-left** — Absolute positioned h1 at top-4 left-4 with z-30. **Matches manifest requirement.**
3. **Web Chat uses real AI** — POST /api/widget/chat returns AI response with conversationId persistence. Not mock.
4. **Voice call uses real VAPI** — Imports Vapi SDK, creates instance, connects to assistant. Requires VITE_VAPI_PUBLIC_KEY env var.
5. **Contact form submits to real API** — Both the main landing form and the widget form use /api/widget/contact.
6. **Demo fallback** — If slug is "demo", uses hardcoded org data without API call. Useful for testing but "demo" landing page won't have real voice/video config.
7. **Redirect handling** — API can return redirect with new slug, page navigates to it. Supports org slug changes without breaking bookmarks.
8. **No org-specific branding** — Page uses hardcoded colors (GUNMETAL_BLUE, WIDGET_TEAL), not org theme colors. All landing pages look the same except org name and persona name.

## Existing ACs

No section-specific ACs exist yet for Landing Pages.

## New ACs Needed

| Proposed AC | Priority | Dimension |
|---|---|---|
| Landing page loads for valid org slug (store name, persona name shown) | T2 | FE/BE |
| Landing page shows 404 for invalid slug | T2 | FE |
| Contact form submits and shows success state | T1 | FE/BE |
| Web Chat widget produces AI responses scoped to org | T1 | FE/BE |
| Web Call widget initiates VAPI call (requires voice config) | T1 | FE/BE |
| Video widget opens in new browser window (not widget pane) | T1 | FE |
| ?mode=video auto-launches fullscreen video session | T2 | FE |
| Store name visible at top-left on all screen sizes | T3 | FE |
| Widget menu shows all 4 options (Chat, Call, Form, Video) | T2 | FE |
| Slug redirect works (old slug → new slug) | T3 | FE/BE |

## Section Description (DRAFT — for operator edit)

**Landing Pages are the public-facing customer entry points.** Each organization gets a landing page at /p/{slug} (also accessible via /w/{slug}). The page loads org data from /api/public/landing/:slug and displays the store name (top-left, per manifest) with a contact form ("Let's schedule a VIP test drive" with first name, last name, phone, email, interest fields).

A floating widget button (bottom-right, teal) opens a menu with 4 communication options: **Web Chat** (AI chat via /api/widget/chat — real Claude-powered responses scoped to org), **Web Call** (VAPI voice call using org's assistant ID), **Contact Form** (name/email/phone/message form via /api/widget/contact), and **Two-Way Video** (Tavus video session that opens in a NEW browser window — confirmed per manifest requirement).

The page also supports a `?mode=video` parameter that launches a fullscreen video experience on page load, auto-connecting to the org's Tavus persona.

**Issues found:** All landing pages share the same hardcoded color scheme (gunmetal blue + teal) — no org-specific branding/theming. Demo slug uses hardcoded data (voice/video config won't work). Web Pages crawling in Knowledge Base is demo-only (no way to add real URLs to crawl for landing page content).
