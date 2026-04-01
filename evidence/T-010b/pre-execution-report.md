# T-010b Pre-Execution Report

## Objective
Write 3 browser E2E tests that prove core app flows work for real users, using mocked external services (Anthropic API for chat).

## Success Criteria
- **AC1:** Browser test — login form submit -> dashboard loads with user data (pipeline metrics, chat input, suggestion chips)
- **AC2:** Browser test — chat send message -> streaming response renders -> message visible in chat thread (mocked Anthropic SSE via page.route())
- **AC3:** Browser test — TeamBox click conversation -> messages display -> send reply -> reply appears
- **AC4:** Each test would FAIL if behavior broke (tests assert on specific DOM elements, content, and state transitions)

## Approach
- Use `loginForBrowser()` helper for auth (bypasses login form, sets httpOnly cookie)
- Use Playwright `page.route()` to intercept `/api/chat/*/stream` and return mocked SSE events
- Also intercept `/api/conversations/*/messages` to inject mocked assistant response after stream completes
- Rely on existing `data-testid` attributes for stable selectors
- No real calls to Anthropic, VAPI, Tavus, TextMagic, or other external services

## Risk Assessment
- SSE mocking requires intercepting both the stream endpoint AND the subsequent messages refetch (since the server never saves the mocked response)
- TeamBox test depends on having at least one conversation in the org (Serra Honda)

## Declared Files

- tests/e2e/t010b-core-app.spec.ts
- playwright.config.ts
- evidence/T-010b/
