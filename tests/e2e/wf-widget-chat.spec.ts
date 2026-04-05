// spec: Widget Chat Workflow
// seed: tests/e2e/seed.spec.ts

import { test, expect } from 'playwright/test';
import { login, loginForBrowser, authHeader, testUsers } from './helpers/auth';

test.describe.serial('Widget Chat Workflow', () => {
  test('WF-WIDGET-CHAT end-to-end', async ({ page, request }) => {
    // 1. Navigate to Serra Honda landing page
    await page.goto('/p/serra-honda', { timeout: 30000 });

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // 2. Click widget FAB (data-testid="button-widget-fab")
    await page.getByTestId('button-widget-fab').click();

    // 3. Verify widget menu appears (data-testid="widget-menu")
    await expect(page.getByTestId('widget-menu')).toBeVisible();

    // 4. Click chat option (data-testid="widget-option-chat")
    await page.getByTestId('widget-option-chat').click();

    // 5. Verify chat panel opens (data-testid="widget-chat")
    await expect(page.getByTestId('widget-chat')).toBeVisible();

    // 6. Type "I'm interested in a 2024 Honda Civic" in input (data-testid="input-widget-chat")
    await page.getByTestId('input-widget-chat').fill('I\'m interested in a 2024 Honda Civic');

    // 7. Click send (data-testid="button-widget-send")
    await page.getByTestId('button-widget-send').click();

    // 8. Wait for AI response — wait for at least 2 chat messages (welcome + assistant reply)
    await expect(page.getByTestId('chat-message-2')).toBeVisible({ timeout: 30000 });

    // 9. Verify at least one assistant message visible (chat messages use indexed data-testid)
    await expect(page.getByTestId('chat-message-0')).toBeVisible();

    // 10. Send follow-up "What colors are available?" and send
    await page.getByTestId('input-widget-chat').fill('What colors are available?');
    await page.getByTestId('button-widget-send').click();

    // 11. Verify second response — 5 messages total (welcome + user + ai + user + ai)
    await expect(page.getByTestId('chat-message-4')).toBeVisible({ timeout: 30000 });

    // 12. Click back button (data-testid="button-back-menu") returns to menu
    await page.getByTestId('button-back-menu').click();
    await expect(page.getByTestId('widget-menu')).toBeVisible();

    // 13. Click close button (data-testid="button-close-widget") dismisses widget
    await page.getByTestId('button-close-widget').click();
    await expect(page.getByTestId('widget-menu')).not.toBeVisible();

    // 14. Verify recent chat conversation exists via authenticated API call.
    // The conversations endpoint requires an Authorization header (Bearer token),
    // which browser cookies alone do not provide. Use the API login helper.
    const auth = await login(request, testUsers.orgAdmin);
    const chatConvsRes = await request.get('/api/conversations?channel=chat', {
      headers: authHeader(auth.token),
    });
    expect(chatConvsRes.ok(), 'Chat conversations API should succeed').toBe(true);

    const chatConvsBody = await chatConvsRes.json();
    const chatConvs: any[] = Array.isArray(chatConvsBody) ? chatConvsBody : chatConvsBody.conversations ?? chatConvsBody.data ?? [];
    expect(chatConvs.length, 'Should have at least one chat conversation from widget test').toBeGreaterThan(0);

    // Verify a recent chat conversation exists with channel=chat
    const recentChat = chatConvs[0];
    expect(recentChat.channel, 'Conversation channel should be chat').toBe('chat');
    console.log(`  VERIFIED via API: ${chatConvs.length} chat conversations found, latest id=${recentChat.id}`);
  });
});
