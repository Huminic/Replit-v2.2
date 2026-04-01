/**
 * T-010b: Core App E2E Browser Tests
 *
 * Proves 3 core app flows work for real users with mocked external services.
 * - AC1: Login → Dashboard loads with user data and pipeline metrics
 * - AC2: Chat send → streaming response renders (mocked Anthropic SSE)
 * - AC3: TeamBox → click conversation → messages display → send reply → reply appears
 */

import { test, expect } from "playwright/test";
import { loginForBrowser, testUsers } from "./helpers/auth";

test.describe("T-010b: Core App E2E", () => {
  // AC1: Login form submit → dashboard loads with user data
  test("AC1: login → dashboard loads with pipeline metrics and user context", async ({ page }) => {
    // Login as superAdmin and navigate to main dashboard
    const auth = await loginForBrowser(page, testUsers.superAdmin, "/");

    // Verify the dashboard page loaded — the AI Key Metrics title must be visible
    const metricsTitle = page.locator('[data-testid="text-ai-key-metrics-title"]');
    await expect(metricsTitle).toBeVisible({ timeout: 15000 });
    await expect(metricsTitle).toHaveText("AI Key Metrics");

    // Verify pipeline metric tiles are rendered (4 tiles in the grid)
    // These tiles have gradient backgrounds and show real org-scoped data
    const metricTiles = page.locator(".grid .bg-gradient-to-br, .grid [class*='from-emerald'], .grid [class*='from-blue'], .grid [class*='from-amber'], .grid [class*='from-purple']");
    // Alternatively, check the grid has children
    const gridContainer = page.locator(".grid.grid-cols-1");
    await expect(gridContainer).toBeVisible({ timeout: 10000 });
    const tileCount = await gridContainer.locator("> div").count();
    expect(tileCount).toBe(4);

    // Verify the chat input area is present — this is the core interaction element
    const chatInput = page.locator('[data-testid="input-main-chat"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Verify the send button exists
    const sendButton = page.locator('[data-testid="button-main-send"]');
    await expect(sendButton).toBeVisible();

    // Verify suggestion chips are rendered (the "Try asking..." section)
    const suggestions = page.locator('[data-testid^="main-suggestion-"]');
    const suggestionCount = await suggestions.count();
    expect(suggestionCount).toBeGreaterThan(0);
  });

  // AC2: Chat send message → streaming response renders → message visible (mocked Anthropic SSE)
  test("AC2: chat send → mocked streaming response renders in chat thread", async ({ page }) => {
    const mockResponseText =
      "Hello! I'm your AI assistant. Your dealership pipeline looks healthy today. Is there anything specific you'd like to know?";

    // Track the conversation ID from the stream request so we can mock the messages refetch.
    let streamConversationId: string | null = null;
    let routeHit = false;

    // Mock the SSE stream endpoint BEFORE navigating.
    await page.route("**/api/chat/*/stream", async (route) => {
      routeHit = true;
      const url = route.request().url();
      // Extract conversation ID from URL: /api/chat/<id>/stream
      const match = url.match(/\/api\/chat\/([^/]+)\/stream/);
      if (match) streamConversationId = match[1];

      const mockSSE = [
        `data: ${JSON.stringify({ type: "content", text: "Hello! I'm your AI assistant. " })}\n\n`,
        `data: ${JSON.stringify({ type: "content", text: "Your dealership pipeline looks healthy today. " })}\n\n`,
        `data: ${JSON.stringify({ type: "content", text: "Is there anything specific you'd like to know?" })}\n\n`,
        `data: ${JSON.stringify({ type: "done" })}\n\n`,
      ].join("");

      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
        body: mockSSE,
      });
    });

    // After the stream completes, the React hook invalidates the messages query.
    // The page refetches GET /api/conversations/<id>/messages from the server.
    // Since our mock intercepted the stream BEFORE the server processed it, the
    // server never saved the assistant response. We intercept the messages refetch
    // to inject our mocked assistant message alongside the user message.
    let messagesIntercepted = false;
    await page.route("**/api/conversations/*/messages", async (route, request) => {
      // Only intercept AFTER the stream has been hit (to let initial loads through)
      if (!routeHit || request.method() !== "GET") {
        await route.continue();
        return;
      }

      // Let the real request go through and augment the response
      const response = await route.fetch();
      let realMessages: any[] = [];
      try {
        const body = await response.json();
        realMessages = Array.isArray(body) ? body : [];
      } catch {
        realMessages = [];
      }

      // Append our mocked assistant message
      const augmented = [
        ...realMessages,
        {
          id: `mock-assistant-${Date.now()}`,
          conversationId: streamConversationId,
          role: "assistant",
          content: mockResponseText,
          senderName: "Automa",
          createdAt: new Date().toISOString(),
        },
      ];

      messagesIntercepted = true;
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(augmented),
      });
    });

    // Login and navigate to main chat
    await loginForBrowser(page, testUsers.superAdmin, "/");

    // Wait for chat input to be ready
    const chatInput = page.locator('[data-testid="input-main-chat"]');
    await expect(chatInput).toBeVisible({ timeout: 15000 });

    // Wait for the send button — signals conversation ID has been created
    const sendButton = page.locator('[data-testid="button-main-send"]');
    await expect(sendButton).toBeVisible({ timeout: 10000 });

    // Type a message in the chat input
    await chatInput.fill("How is my pipeline doing today?");

    // Click the send button
    await sendButton.click();

    // Verify the user message appears in the thread (right-aligned, bg-primary)
    const userMessage = page.locator(".justify-end .bg-primary").last();
    await expect(userMessage).toBeVisible({ timeout: 5000 });
    await expect(userMessage).toContainText("How is my pipeline doing today?");

    // Verify the mocked assistant response renders in the chat thread.
    // After stream completes, useStreamingChat invalidates queries, and our
    // messages route mock returns the augmented response with the assistant message.
    const chatArea = page.locator(".max-w-3xl.mx-auto.flex.flex-col");
    await expect(chatArea).toContainText(
      "Your dealership pipeline looks healthy today",
      { timeout: 15000 }
    );

    // Verify the SSE route was intercepted (no real Anthropic call)
    expect(routeHit).toBe(true);

    // No error should be shown — proves the SSE was parsed without error
    const streamError = page.locator('[data-testid="stream-error"]');
    await expect(streamError).not.toBeVisible();

    // Verify the input was cleared after sending
    await expect(chatInput).toHaveValue("");
  });

  // AC3: TeamBox → click conversation → messages display → send reply → reply appears
  test("AC3: TeamBox — select conversation, view messages, send reply", async ({ page }) => {
    // Login as orgAdmin (Serra Honda) and navigate to TeamBox
    await loginForBrowser(page, testUsers.orgAdmin, "/teambox");

    // Wait for TeamBox page to load
    const teamboxPage = page.locator('[data-testid="teambox-page"]');
    await expect(teamboxPage).toBeVisible({ timeout: 15000 });

    // Wait for conversations list to load (skeleton disappears, items appear)
    // First wait for the conversation list container
    const conversationItems = page.locator('[data-testid^="conversation-item-"]');
    await expect(conversationItems.first()).toBeVisible({ timeout: 15000 });

    // Get the count of conversations
    const convCount = await conversationItems.count();
    expect(convCount).toBeGreaterThan(0);

    // Click the first conversation
    const firstConv = conversationItems.first();
    const firstConvCustomerName = await firstConv.locator(".text-sm.font-medium").textContent();
    await firstConv.click();

    // Verify the conversation header shows the customer name
    const customerHeader = page.locator('[data-testid="text-conversation-customer"]');
    await expect(customerHeader).toBeVisible({ timeout: 5000 });
    await expect(customerHeader).toHaveText(firstConvCustomerName!.trim());

    // Verify messages are displayed (or "No messages yet" if empty)
    // Wait for messages area to be ready
    await page.waitForTimeout(1000);
    const messageItems = page.locator('[data-testid^="message-"]');
    const noMessagesIndicator = page.locator("text=No messages yet");

    // Either messages exist or the empty state is shown
    const hasMessages = await messageItems.count() > 0;
    const hasEmptyState = await noMessagesIndicator.isVisible().catch(() => false);
    expect(hasMessages || hasEmptyState).toBe(true);

    // Now send a reply
    const replyInput = page.locator('[data-testid="input-reply"]');
    await expect(replyInput).toBeVisible({ timeout: 5000 });

    const replyText = `E2E test reply ${Date.now()}`;
    await replyInput.fill(replyText);
    await expect(replyInput).toHaveValue(replyText);

    // Click the send reply button
    const sendReplyButton = page.locator('[data-testid="button-send-reply"]');
    await expect(sendReplyButton).toBeEnabled();
    await sendReplyButton.click();

    // Verify the reply appears in the message thread
    // The reply should be an agent message (right-aligned, bg-primary)
    // Wait for the message to appear with our unique text
    const replyMessage = page.locator(`text=${replyText}`);
    await expect(replyMessage).toBeVisible({ timeout: 10000 });

    // Verify the reply input was cleared
    await expect(replyInput).toHaveValue("");
  });
});
