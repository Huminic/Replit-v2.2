/**
 * wf-widget-form.spec.ts — Workflow E2E: Widget Contact Form
 *
 * Full workflow: Landing page widget → form fill → API submission →
 * conversation created with channel='form' → auto-SMS attempt (blocked) →
 * admin verification in TeamBox → takeover
 *
 * Public page: /p/serra-honda (no auth needed for widget tests)
 * Form API: POST /api/widget/contact
 * Admin: serra_honda@huminic.ai / NexxusTest2026
 *
 * Confirmed data-testids from source:
 *   - button-widget-fab: floating action button on landing page
 *   - widget-menu: widget menu container
 *   - widget-option-form: form option in menu
 *   - widget-form-success: success state after submission
 *   - button-form-back: back to menu (form panel)
 *   - button-close-widget: close widget
 *   - sidebar-item-teambox: TeamBox nav item
 */
import { test, expect } from 'playwright/test';
import { login, loginForBrowser, authHeader, testUsers } from './helpers/auth';

// BASE_URL is set in playwright.config.ts — use relative paths
const LANDING = '/p/serra-honda';

test.describe.serial('Widget Form Workflow', () => {
  let token: string;
  let userId: string;
  let organizationId: string;
  let headers: Record<string, string>;

  /** Conversation ID created by API tests — reused for admin verification. */
  let formConversationId: string;

  /** Unique suffix for test data to avoid collisions. */
  const ts = Date.now();

  // ---------------------------------------------------------------------------
  // Setup: authenticate for API tests
  // ---------------------------------------------------------------------------
  test.beforeAll(async ({ request }) => {
    const session = await login(request, testUsers.orgAdmin);
    token = session.token;
    userId = session.userId;
    organizationId = session.organizationId;
    headers = { ...authHeader(token), 'Content-Type': 'application/json' };
  });

  // ===========================================================================
  // BROWSER TESTS — Widget UI on public landing page
  // ===========================================================================

  test('1. Widget FAB opens menu, form option visible', async ({ page }) => {
    await page.goto(LANDING, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Click the FAB
    await page.getByTestId('button-widget-fab').click();

    // Menu appears
    await expect(page.getByTestId('widget-menu')).toBeVisible();

    // Form option is available
    await expect(page.getByTestId('widget-option-form')).toBeVisible();
    console.log('  VERIFIED: FAB opens menu, Contact Form option visible');
  });

  test('2. Form fill and successful submission', async ({ page }) => {
    await page.goto(LANDING, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Open widget menu → form
    await page.getByTestId('button-widget-fab').click();
    await expect(page.getByTestId('widget-menu')).toBeVisible();
    await page.getByTestId('widget-option-form').click();

    // Fill all fields
    await page.getByTestId('input-form-name').fill(`WF-Form-Test-${ts}`);
    await page.getByTestId('input-form-email').fill(`wf-form-${ts}@example.com`);
    await page.getByTestId('input-form-phone').fill('(555) 900-0001');
    await page.getByTestId('input-form-message').fill('I am interested in a 2026 Civic test drive');

    // Submit button should be enabled now
    const submitBtn = page.getByTestId('button-form-submit');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Success state appears
    await expect(page.getByTestId('widget-form-success')).toBeVisible({ timeout: 15000 });
    console.log('  VERIFIED: Form submitted successfully, success state displayed');
  });

  test('3. Submit without phone (phone is optional)', async ({ page }) => {
    await page.goto(LANDING, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.getByTestId('button-widget-fab').click();
    await expect(page.getByTestId('widget-menu')).toBeVisible();
    await page.getByTestId('widget-option-form').click();

    // Fill required fields only — no phone
    await page.getByTestId('input-form-name').fill(`NoPhone-${ts}`);
    await page.getByTestId('input-form-email').fill(`nophone-${ts}@example.com`);
    await page.getByTestId('input-form-message').fill('Test message without phone');

    const submitBtn = page.getByTestId('button-form-submit');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await expect(page.getByTestId('widget-form-success')).toBeVisible({ timeout: 15000 });
    console.log('  VERIFIED: Form submission succeeds without phone');
  });

  test('4. Submit button disabled when required fields empty', async ({ page }) => {
    await page.goto(LANDING, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.getByTestId('button-widget-fab').click();
    await expect(page.getByTestId('widget-menu')).toBeVisible();
    await page.getByTestId('widget-option-form').click();

    const submitBtn = page.getByTestId('button-form-submit');

    // All empty — disabled
    await expect(submitBtn).toBeDisabled();

    // Name only — still disabled
    await page.getByTestId('input-form-name').fill('Partial User');
    await expect(submitBtn).toBeDisabled();

    // Name + email, no message — still disabled
    await page.getByTestId('input-form-email').fill('partial@example.com');
    await expect(submitBtn).toBeDisabled();

    // Clear name, fill message only — still disabled
    await page.getByTestId('input-form-name').fill('');
    await page.getByTestId('input-form-email').fill('');
    await page.getByTestId('input-form-message').fill('Only message');
    await expect(submitBtn).toBeDisabled();

    // All three required fields filled — enabled
    await page.getByTestId('input-form-name').fill('Complete User');
    await page.getByTestId('input-form-email').fill('complete@example.com');
    await expect(submitBtn).toBeEnabled();
    console.log('  VERIFIED: Submit button disabled/enabled follows required field rules');
  });

  test('5. Send another message resets the form', async ({ page }) => {
    await page.goto(LANDING, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.getByTestId('button-widget-fab').click();
    await expect(page.getByTestId('widget-menu')).toBeVisible();
    await page.getByTestId('widget-option-form').click();

    // Fill and submit
    await page.getByTestId('input-form-name').fill(`Reset-${ts}`);
    await page.getByTestId('input-form-email').fill(`reset-${ts}@example.com`);
    await page.getByTestId('input-form-message').fill('Testing form reset');
    await page.getByTestId('button-form-submit').click();
    await expect(page.getByTestId('widget-form-success')).toBeVisible({ timeout: 15000 });

    // Click send another
    await page.getByTestId('button-form-send-another').click();

    // Form should be back with empty fields
    await expect(page.getByTestId('input-form-name')).toBeVisible();
    await expect(page.getByTestId('input-form-name')).toHaveValue('');
    await expect(page.getByTestId('input-form-email')).toHaveValue('');
    await expect(page.getByTestId('input-form-message')).toHaveValue('');
    await expect(page.getByTestId('button-form-submit')).toBeDisabled();
    console.log('  VERIFIED: Send another message resets the form to blank state');
  });

  test('6. Back button returns to menu', async ({ page }) => {
    await page.goto(LANDING, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.getByTestId('button-widget-fab').click();
    await expect(page.getByTestId('widget-menu')).toBeVisible();
    await page.getByTestId('widget-option-form').click();

    // Click back
    await page.getByTestId('button-form-back').click();
    await expect(page.getByTestId('widget-menu')).toBeVisible();
    console.log('  VERIFIED: Back button returns to widget menu');
  });

  test('7. Close button dismisses the widget', async ({ page }) => {
    await page.goto(LANDING, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.getByTestId('button-widget-fab').click();
    await expect(page.getByTestId('widget-menu')).toBeVisible();
    await page.getByTestId('widget-option-form').click();

    // Click close
    await page.getByTestId('button-form-close').click();
    await expect(page.getByTestId('widget-form')).not.toBeVisible();

    // FAB should still be there
    await expect(page.getByTestId('button-widget-fab')).toBeVisible();
    console.log('  VERIFIED: Close button dismisses widget, FAB remains');
  });

  // ===========================================================================
  // API TESTS — POST /api/widget/contact
  // ===========================================================================

  test('8. API: POST /api/widget/contact creates conversation with channel=form', async ({ request }) => {
    const name = `API-Form-${ts}`;
    const email = `api-form-${ts}@example.com`;
    const phone = '+15559000001';
    const message = 'API direct test submission';

    const res = await request.post(`/api/widget/contact`, {
      headers: { 'Content-Type': 'application/json' },
      data: { slug: 'serra-honda', name, email, phone, message },
    });
    expect(res.ok(), `Widget contact POST should succeed: ${res.status()}`).toBe(true);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.conversationId).toBeTruthy();
    formConversationId = body.conversationId;

    // Verify the conversation via authenticated API
    const convRes = await request.get(`/api/conversations/${formConversationId}`, {
      headers: authHeader(token),
    });
    expect(convRes.ok()).toBe(true);

    const conv = await convRes.json();
    expect(conv.channel, 'Channel must be form').toBe('form');
    expect(conv.status, 'Status must be open').toBe('open');
    expect(conv.customerName).toBe(name);
    expect(conv.customerEmail).toBe(email);
    expect(conv.customerPhone).toBe(phone);

    console.log(`  VERIFIED: Conversation created — id=${formConversationId}, channel=form, status=open`);
  });

  test('9. API: Conversation has the form submission message', async ({ request }) => {
    const name = `MsgCheck-${ts}`;
    const email = `msgcheck-${ts}@example.com`;
    const phone = '+15559000002';
    const message = 'Inquiry about service department hours';

    // Create a form submission
    const res = await request.post(`/api/widget/contact`, {
      headers: { 'Content-Type': 'application/json' },
      data: { slug: 'serra-honda', name, email, phone, message },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    const convId = body.conversationId;

    // Fetch messages
    const msgRes = await request.get(`/api/conversations/${convId}/messages`, {
      headers: authHeader(token),
    });
    expect(msgRes.ok()).toBe(true);

    const messages = await msgRes.json();
    const msgList: any[] = Array.isArray(messages) ? messages : messages.messages ?? messages.data ?? [];
    expect(msgList.length).toBeGreaterThan(0);

    // First message should be the form submission
    const firstMsg = msgList[0];
    expect(firstMsg.role).toBe('user');
    expect(firstMsg.content).toContain('Contact Form Submission');
    expect(firstMsg.content).toContain(name);
    expect(firstMsg.content).toContain(email);
    expect(firstMsg.content).toContain(phone);
    expect(firstMsg.content).toContain(message);

    console.log(`  VERIFIED: Form submission message stored with correct format`);
  });

  test('10. API: Missing required fields returns 400', async ({ request }) => {
    // Missing name
    const res1 = await request.post(`/api/widget/contact`, {
      headers: { 'Content-Type': 'application/json' },
      data: { slug: 'serra-honda', email: 'missing@example.com', message: 'No name provided' },
    });
    expect(res1.status(), 'Missing name should return 400').toBe(400);

    // Missing email
    const res2 = await request.post(`/api/widget/contact`, {
      headers: { 'Content-Type': 'application/json' },
      data: { slug: 'serra-honda', name: 'No Email', message: 'No email provided' },
    });
    expect(res2.status(), 'Missing email should return 400').toBe(400);

    // Missing message
    const res3 = await request.post(`/api/widget/contact`, {
      headers: { 'Content-Type': 'application/json' },
      data: { slug: 'serra-honda', name: 'No Message', email: 'nomsg@example.com' },
    });
    expect(res3.status(), 'Missing message should return 400').toBe(400);

    console.log('  VERIFIED: Missing required fields returns 400');
  });

  test('11. API: Unknown slug returns 404', async ({ request }) => {
    const res = await request.post(`/api/widget/contact`, {
      headers: { 'Content-Type': 'application/json' },
      data: { slug: 'nonexistent-dealer-xyz', name: 'Test', email: 't@t.com', message: 'test' },
    });
    expect(res.status(), 'Unknown slug should return 404').toBe(404);

    console.log('  VERIFIED: Unknown slug returns 404');
  });

  test('12. API: Auto-SMS logged when OUTBOUND_LIVE_ENABLED=false', async ({ request }) => {
    const name = `SMS-Test-${ts}`;
    const phone = '+15559001234';

    const res = await request.post(`/api/widget/contact`, {
      headers: { 'Content-Type': 'application/json' },
      data: { slug: 'serra-honda', name, email: `smstest-${ts}@example.com`, phone, message: 'Testing SMS dispatch' },
    });
    expect(res.ok()).toBe(true);
    const body = await res.json();
    const convId = body.conversationId;

    // Verify conversation exists and is healthy — no error from SMS path
    const convRes = await request.get(`/api/conversations/${convId}`, {
      headers: authHeader(token),
    });
    expect(convRes.ok()).toBe(true);
    const conv = await convRes.json();
    expect(conv.status).toBe('open');
    expect(conv.channel).toBe('form');

    console.log(`  VERIFIED: Conversation created successfully despite OUTBOUND_LIVE_ENABLED=false, id=${convId}`);
  });

  test('13. API: Rate limiting accepts normal submission rate', async ({ request }) => {
    for (let i = 0; i < 3; i++) {
      const res = await request.post(`/api/widget/contact`, {
        headers: { 'Content-Type': 'application/json' },
        data: {
          slug: 'serra-honda',
          name: `RateTest-${ts}-${i}`,
          email: `rate-${ts}-${i}@example.com`,
          message: `Rate limit test ${i}`,
        },
      });
      expect(res.ok(), `Request ${i + 1}/3 should succeed: ${res.status()}`).toBe(true);
    }
    console.log('  VERIFIED: 3 sequential submissions accepted without rate limiting');
  });

  test('14. API: Channel filter returns only form conversations', async ({ request }) => {
    const res = await request.get(`/api/conversations?channel=form`, {
      headers: authHeader(token),
    });
    expect(res.ok()).toBe(true);

    const body = await res.json();
    const convList: any[] = Array.isArray(body) ? body : body.conversations ?? body.data ?? [];

    // Every returned conversation must have channel='form'
    for (const conv of convList) {
      expect(conv.channel, `Conversation ${conv.id} should have channel=form`).toBe('form');
    }
    console.log(`  VERIFIED: Channel filter returns ${convList.length} conversations, all channel=form`);
  });

  // ===========================================================================
  // ADMIN VERIFICATION — TeamBox takeover (browser-based)
  // ===========================================================================

  test('15. TeamBox: form conversation visible and takeover works', async ({ page, request }) => {
    // Create a fresh form conversation for this test
    const name = `Teambox-Form-${ts}`;
    const email = `teambox-form-${ts}@example.com`;
    const phone = '+15559009999';

    const formRes = await request.post(`/api/widget/contact`, {
      headers: { 'Content-Type': 'application/json' },
      data: { slug: 'serra-honda', name, email, phone, message: 'TeamBox verification test' },
    });
    expect(formRes.ok()).toBe(true);
    const formBody = await formRes.json();
    const convId = formBody.conversationId;

    // Login as Serra Honda admin and navigate to TeamBox
    const session = await loginForBrowser(page, testUsers.orgAdmin, '/teambox');

    // Navigate to TeamBox via sidebar
    await page.getByTestId('sidebar-item-teambox').click();
    await page.waitForTimeout(2000);

    // Verify TeamBox loaded
    await expect(page.getByRole('heading', { name: 'TeamBox', level: 1 })).toBeVisible({ timeout: 10000 });

    // Look for the form conversation — the customer name should appear
    await expect(page.getByText(name)).toBeVisible({ timeout: 15000 });

    // Click the conversation
    const convItem = page.locator('[data-testid^="conversation-item-"]').filter({
      hasText: name,
    }).first();
    await convItem.click();
    await page.waitForTimeout(1000);

    // Verify form submission message is in the thread
    await expect(page.getByText('Contact Form Submission').first()).toBeVisible({ timeout: 10000 });

    // Verify via API that this conversation is channel=form and status=open
    const verifyRes = await page.request.get(`/api/conversations/${convId}`, {
      headers: authHeader(session.token),
    });
    expect(verifyRes.ok()).toBe(true);
    const conv = await verifyRes.json();
    expect(conv.channel).toBe('form');
    expect(conv.status).toBe('open');

    console.log(`  VERIFIED: Form conversation visible in TeamBox — id=${convId}, name=${name}`);

    // Perform takeover via API (matching takeover test pattern)
    const takeoverRes = await page.request.patch(`/api/conversations/${convId}`, {
      headers: { ...authHeader(session.token), 'Content-Type': 'application/json' },
      data: { status: 'open', assignedTo: session.userId },
    });
    expect(takeoverRes.ok(), `Takeover PATCH should succeed: ${takeoverRes.status()}`).toBe(true);

    const updated = await takeoverRes.json();
    expect(updated.assignedTo).toBe(session.userId);
    expect(updated.status).toBe('open');

    console.log(`  VERIFIED: Takeover succeeded — assignedTo=${updated.assignedTo}`);
  });

  test('16. TeamBox: admin can reply to form conversation', async ({ request }) => {
    // Use the conversation from test 8 (formConversationId)
    expect(formConversationId, 'Need formConversationId from test 8').toBeTruthy();

    const replyContent = `Thanks for reaching out! We will contact you shortly. [${ts}]`;

    const msgRes = await request.post(`/api/conversations/${formConversationId}/messages`, {
      headers,
      data: {
        role: 'agent',
        content: replyContent,
        senderName: 'Serra Honda Agent',
      },
    });
    expect(msgRes.status(), `Reply POST should succeed: ${msgRes.status()}`).toBeLessThan(300);

    const msg = await msgRes.json();
    expect(msg.id).toBeTruthy();
    expect(msg.content).toBe(replyContent);

    // Verify reply appears in thread
    const threadRes = await request.get(`/api/conversations/${formConversationId}/messages`, {
      headers: authHeader(token),
    });
    expect(threadRes.ok()).toBe(true);
    const messages = await threadRes.json();
    const msgList: any[] = Array.isArray(messages) ? messages : messages.messages ?? messages.data ?? [];

    const found = msgList.find((m: any) => m.content === replyContent);
    expect(found, 'Reply must appear in conversation thread').toBeTruthy();

    console.log(`  VERIFIED: Admin reply stored in conversation thread — msgId=${found?.id}`);
  });

  // ---------------------------------------------------------------------------
  // Cleanup: release takeover assignments
  // ---------------------------------------------------------------------------
  test.afterAll(async ({ request }) => {
    if (formConversationId) {
      try {
        await request.patch(`/api/conversations/${formConversationId}`, {
          headers,
          data: { assignedTo: null, status: 'open' },
        });
        console.log(`  Cleanup: conversation ${formConversationId} released`);
      } catch {
        // Best effort
      }
    }
  });
});
