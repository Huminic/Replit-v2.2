# Dev Report — S1

**Date:** 2026-03-29
**Target:** https://dev.huminicdev.com/p/serra-honda
**Agent:** Dev

## I-122: voice-callback endpoint
- Status: Created in public.ts (by Captain, not this agent)
- Endpoint: POST /api/widget/voice-callback
- Live test: Widget UI renders correctly — shows "Instant Call Back" header, phone number input, and "Call Me" button (disabled until number entered). After entering a phone number and clicking "Call Me", the endpoint returns **404** because the app has not been rebuilt/deployed since the route was added to source. The widget correctly handles the error and shows "Unable to place call. Please try again." with a "Try again" button. **UI is wired correctly; backend needs rebuild+deploy to go live.**

## I-168: Widget State Verification

| State | Description | Verdict | Screenshot | Notes |
|-------|------------|---------|------------|-------|
| ST-030 | Widget menu opens with all 4 options | WORKING | ST-030-widget-menu.png | Menu shows: Web Chat, Instant Call Back, Contact Form, Two-Way Video. All options clickable. |
| ST-031 | Chat UI appears | WORKING | ST-031-chat-ui.png | Chat opens with Caroline greeting: "Hi! I'm Caroline, your AI concierge at Serra Honda. How can I help you today?" Shows online status. |
| ST-032 | AI responds to chat message | WORKING | ST-032-chat-ai-response.png | Sent "What SUVs do you have available?" — received relevant, context-aware response about Honda inventory. |
| ST-033 | Video mode opens | WORKING | ST-033-video-widget.png | Clicking Two-Way Video opens a new tab to tavus.daily.co. Widget shows "Video opened in new window / Session running in a separate tab" with mic and hangup controls. No popup blocker issue — tab opened successfully. |
| ST-034 | Video window loads | WORKING | (new tab opened) | Tab title: "Daily - Get ready for your call" at tavus.daily.co. Video session initialized. |
| ST-035 | Video in-widget controls | WORKING | ST-033-video-widget.png | Mic button and end-call button visible in widget while video runs in separate tab. |
| ST-036 | Video back navigation | WORKING | (verified) | Back arrow returns to widget menu from video state. |
| ST-voice | Voice/Callback UI | WORKING (UI) | ST-voice-callback-ui.png | "Instant Call Back" mode shows phone icon, "Get a call back now" text, phone input, and "Call Me" button. Button disabled until valid input. |
| ST-voice-submit | Voice callback submit | BROKEN (expected) | ST-voice-callback-error.png | Submitting phone number returns 404 — endpoint exists in source but app not rebuilt. Error state renders correctly with "Unable to place call" message and "Try again" button. |
| ST-042 | Contact form appears | WORKING | ST-042-contact-form.png | Shows Name*, Email*, Phone, Message* fields. "Send Message" button disabled until required fields filled. |
| ST-043 | Contact form validation | WORKING | (verified) | Button stays disabled until Name, Email, and Message are filled. Phone is optional. |
| ST-044 | Contact form submission | WORKING | ST-044-form-success.png | Submitted with test data. Success state: checkmark icon, "Message Sent", "We'll get back to you shortly." and "Send another message" button. |
| ST-046 | Landing page form present | WORKING | ST-046-landing-form-filled.png | Separate lead form on landing page with: First Name, Last Name, Phone Number, Email, "What are you looking for?" fields and "Get in Touch" button. |
| ST-047 | Landing page form fills | WORKING | ST-046-landing-form-filled.png | All fields accept input. Form is independent of widget. |
| ST-048 | Landing page form submits | WORKING | ST-048-landing-form-success.png | Submitted with test data. Success state: checkmark, "You're all set!", "We'll be in touch shortly. Check your phone for a text from our team." and "Send another request" button. |

### Summary

- **13 states WORKING**
- **1 state BROKEN (expected):** Voice callback submit returns 404 — endpoint added to source but app not rebuilt/deployed
- **0 states UNTESTABLE**

## Smoke Test
- File: tests/e2e/s8-landing-widgets.spec.ts
- Result: **12 passed, 0 failed** (3.3s)
- Tests covered: video popup blocker fix, menu button label verification, voice widget phone form, store name element, landing API response, appointment endpoint, widget form submission, widget JS for 5 stores (serra-honda, serra-nissan, tony-serra-ford, hyundai-of-columbia, ford-of-columbia)
- Verdict: **SMOKE PASS**

## Screenshots Index

All screenshots saved to `/home/ubuntu/Claude-store/nexxus2.2_replit/evidence/S1/screenshots/`:

| File | Contents |
|------|----------|
| ST-000-landing-page-initial.png | Full landing page before interaction |
| ST-030-widget-menu.png | Widget menu with 4 options |
| ST-031-chat-ui.png | Chat UI with Caroline greeting |
| ST-032-chat-ai-response.png | AI response to SUV query |
| ST-033-video-widget.png | Video mode — "opened in new window" state |
| ST-042-contact-form.png | Contact form with all fields |
| ST-044-form-success.png | Contact form "Message Sent" confirmation |
| ST-046-landing-form-filled.png | Landing page lead form filled with test data |
| ST-048-landing-form-success.png | Landing page form "You're all set!" confirmation |
| ST-voice-callback-ui.png | Voice callback phone input UI |
| ST-voice-callback-error.png | Voice callback 404 error state |
