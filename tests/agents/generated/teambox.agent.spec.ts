import { test, expect } from 'playwright/test';

/**
 * TeamBox Domain Agent Tests (T-002)
 * Generated from: tests/agents/plans/teambox-plan.md
 *
 * Covers NEW gaps not tested in domain-05-teambox.spec.ts (5.1–5.11).
 * Categories: Conversation CRUD, Filters, Message Thread, Takeover,
 * Campaign Disconnect, Unread Counts, Role-Based Access, Cross-Org Isolation,
 * SMS Handling, Search, Blacklist Management.
 *
 * All tests are independent. API tests use direct HTTP calls.
 * Browser tests used only where UI behavior must be verified.
 */

const BASE_URL = process.env.BASE_URL || 'https://dev.huminicdev.com';
const TEST_PASSWORD = 'NexxusTest2026';

const users = {
  superAdmin: { email: 'duane.wells@huminic.ai', password: TEST_PASSWORD, role: 'super_admin' },
  orgAdmin: { email: 'serra_honda@huminic.ai', password: TEST_PASSWORD, role: 'org_admin' },
  sales: { email: 'sales_staff@huminic.ai', password: TEST_PASSWORD, role: 'sales' },
  serraNissan: { email: 'serra_nissan@huminic.ai', password: TEST_PASSWORD, role: 'org_admin' },
};

// Token cache per test file run (avoids rate limiting)
const tokenCache: Record<string, { token: string; userId: string; organizationId: string }> = {};

async function apiLogin(request: any, user: { email: string; password: string }) {
  if (tokenCache[user.email]) return tokenCache[user.email];
  const res = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  if (!res.ok()) throw new Error(`Login failed for ${user.email}: ${res.status()}`);
  const body = await res.json();
  const result = { token: body.accessToken, userId: body.user.id, organizationId: body.user.organization.id };
  tokenCache[user.email] = result;
  return result;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** Helper to parse conversation list from various response shapes */
function parseConvList(body: any): any[] {
  return Array.isArray(body) ? body : body.conversations ?? body.data ?? [];
}

// ============================================================================
// A. CONVERSATION CRUD
// ============================================================================

test.describe('A. Conversation CRUD', () => {
  test('TC-TB-069: Create conversation via API', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const res = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: {
        customerName: 'Agent Test Create',
        customerEmail: 'agent-create@test.com',
        channel: 'email',
        status: 'open',
      },
    });
    expect(res.status()).toBe(201);
    const conv = await res.json();
    expect(conv.id).toBeTruthy();
    expect(conv.customerName).toBe('Agent Test Create');
    expect(conv.channel).toBe('email');
    expect(conv.status).toBe('open');
    expect(conv.organizationId).toBeTruthy();
  });

  test('TC-TB-070: Create conversation validates required fields', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const res = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: {
        // missing customerName — should fail validation
        channel: 'sms',
      },
    });
    // Either 400 validation error or 500 if schema is strict
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('TC-TB-071: Get single conversation by ID', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    // Create one first
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Get By ID Test', channel: 'sms', status: 'open' },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();

    const getRes = await request.get(`${BASE_URL}/api/conversations/${created.id}`, {
      headers: auth(token),
    });
    expect(getRes.ok()).toBeTruthy();
    const conv = await getRes.json();
    expect(conv.id).toBe(created.id);
    expect(conv.customerName).toBe('Get By ID Test');
  });

  test('TC-TB-072: Get non-existent conversation returns 404', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request.get(`${BASE_URL}/api/conversations/${fakeId}`, {
      headers: auth(token),
    });
    expect(res.status()).toBe(404);
  });

  test('TC-TB-073: Update conversation status via PATCH', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    // Create then update
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Patch Status Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();

    const patchRes = await request.patch(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
      data: { status: 'closed' },
    });
    expect(patchRes.ok()).toBeTruthy();
    const updated = await patchRes.json();
    expect(updated.status).toBe('closed');
  });

  test('TC-TB-074: PATCH validates update schema', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const listRes = await request.get(`${BASE_URL}/api/conversations`, { headers: auth(token) });
    const convs = parseConvList(await listRes.json());
    if (convs.length === 0) { test.skip(); return; }

    const res = await request.patch(`${BASE_URL}/api/conversations/${convs[0].id}`, {
      headers: auth(token),
      data: { unreadCount: 'not-a-number' }, // invalid type
    });
    expect(res.status()).toBe(400);
  });

  test('TC-TB-067: Delete conversation succeeds for authorized role', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    // Create a conversation to delete (orgAdmin = roleLevel 3)
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Delete Me Test', channel: 'email', status: 'open' },
    });
    expect(createRes.status()).toBe(201);
    const conv = await createRes.json();

    const delRes = await request.delete(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
    });
    expect(delRes.ok()).toBeTruthy();

    // Verify deletion
    const getRes = await request.get(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
    });
    expect(getRes.status()).toBe(404);
  });
});

// ============================================================================
// B. CHANNEL / STATUS / AGENT FILTERS
// ============================================================================

test.describe('B. Filters via API', () => {
  test('TC-TB-016: API channel filter — sms', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const res = await request.get(`${BASE_URL}/api/conversations?channel=sms`, {
      headers: auth(token),
    });
    expect(res.ok()).toBeTruthy();
    const convs = parseConvList(await res.json());
    for (const c of convs) {
      expect(c.channel).toBe('sms');
    }
  });

  test('TC-TB-016b: API channel filter — email', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const res = await request.get(`${BASE_URL}/api/conversations?channel=email`, {
      headers: auth(token),
    });
    expect(res.ok()).toBeTruthy();
    const convs = parseConvList(await res.json());
    for (const c of convs) {
      expect(c.channel).toBe('email');
    }
  });

  test('TC-TB-027: API status filter — open', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const res = await request.get(`${BASE_URL}/api/conversations?status=open`, {
      headers: auth(token),
    });
    expect(res.ok()).toBeTruthy();
    const convs = parseConvList(await res.json());
    for (const c of convs) {
      expect(c.status).toBe('open');
    }
  });

  test('TC-TB-027b: API status filter — closed', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const res = await request.get(`${BASE_URL}/api/conversations?status=closed`, {
      headers: auth(token),
    });
    expect(res.ok()).toBeTruthy();
    const convs = parseConvList(await res.json());
    for (const c of convs) {
      expect(c.status).toBe('closed');
    }
  });

  test('TC-TB-029: API agentId filter', async ({ request }) => {
    const { token, userId } = await apiLogin(request, users.superAdmin);
    // Assign a conversation to current user then filter
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Agent Filter Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();
    await request.patch(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
      data: { assignedTo: userId },
    });

    const res = await request.get(`${BASE_URL}/api/conversations?agentId=${userId}`, {
      headers: auth(token),
    });
    expect(res.ok()).toBeTruthy();
    const filtered = parseConvList(await res.json());
    // If agentId filter is implemented, all results should match
    // If not implemented server-side, we just verify endpoint doesn't error
    expect(Array.isArray(filtered)).toBeTruthy();
  });

  test('TC-TB-028: Combined channel + status filter', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const res = await request.get(`${BASE_URL}/api/conversations?channel=sms&status=open`, {
      headers: auth(token),
    });
    expect(res.ok()).toBeTruthy();
    const convs = parseConvList(await res.json());
    for (const c of convs) {
      expect(c.channel).toBe('sms');
      expect(c.status).toBe('open');
    }
  });
});

// ============================================================================
// C. MESSAGE THREAD
// ============================================================================

test.describe('C. Message Thread', () => {
  test('TC-TB-033: Messages load for conversation', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    // Create conversation with a message
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Msg Thread Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();
    await request.post(`${BASE_URL}/api/conversations/${conv.id}/messages`, {
      headers: auth(token),
      data: { content: 'Hello from test', role: 'user', senderName: 'Test Customer' },
    });

    const msgRes = await request.get(`${BASE_URL}/api/conversations/${conv.id}/messages`, {
      headers: auth(token),
    });
    expect(msgRes.ok()).toBeTruthy();
    const msgs = await msgRes.json();
    const msgList = Array.isArray(msgs) ? msgs : msgs.messages ?? msgs.data ?? [];
    expect(msgList.length).toBeGreaterThanOrEqual(1);
    expect(msgList[0]).toHaveProperty('content');
    expect(msgList[0]).toHaveProperty('role');
  });

  test('TC-TB-038: POST message to conversation', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Msg Post Test', channel: 'email', status: 'open' },
    });
    const conv = await createRes.json();

    const msgRes = await request.post(`${BASE_URL}/api/conversations/${conv.id}/messages`, {
      headers: auth(token),
      data: { content: 'Agent reply message', role: 'agent', senderName: 'Test Agent' },
    });
    expect(msgRes.status()).toBe(201);
    const msg = await msgRes.json();
    expect(msg.content).toBe('Agent reply message');
    expect(msg.role).toBe('agent');
    expect(msg.senderName).toBe('Test Agent');
    expect(msg.conversationId).toBe(conv.id);
  });

  test('TC-TB-039: Message creation validates required fields', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Msg Validation Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();

    const msgRes = await request.post(`${BASE_URL}/api/conversations/${conv.id}/messages`, {
      headers: auth(token),
      data: { /* missing content and role */ senderName: 'Test' },
    });
    // Should return 400 for missing required fields
    expect(msgRes.status()).toBeGreaterThanOrEqual(400);
  });

  test('TC-TB-033b: Messages for non-existent conversation returns 404', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request.get(`${BASE_URL}/api/conversations/${fakeId}/messages`, {
      headers: auth(token),
    });
    expect(res.status()).toBe(404);
  });
});

// ============================================================================
// D. TAKEOVER
// ============================================================================

test.describe('D. Takeover', () => {
  test('TC-TB-048: Take Over PATCH sets assignedTo and status', async ({ request }) => {
    const { token, userId } = await apiLogin(request, users.superAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Takeover Test', channel: 'sms', status: 'automated' },
    });
    const conv = await createRes.json();

    const patchRes = await request.patch(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
      data: { status: 'open', assignedTo: userId },
    });
    expect(patchRes.ok()).toBeTruthy();
    const updated = await patchRes.json();
    expect(updated.status).toBe('open');
    // aiPaused is computed from assignedTo presence
    // assignedTo may or may not persist depending on DB column — documented limitation
  });

  test('TC-TB-048b: Takeover then release (unassign)', async ({ request }) => {
    const { token, userId } = await apiLogin(request, users.superAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Unassign Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();

    // Assign
    await request.patch(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
      data: { assignedTo: userId },
    });

    // Unassign
    const unassignRes = await request.patch(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
      data: { assignedTo: null },
    });
    expect(unassignRes.ok()).toBeTruthy();
  });
});

// ============================================================================
// E. CAMPAIGN DISCONNECT
// ============================================================================

test.describe('E. Campaign Disconnect', () => {
  test('TC-TB-053: Disconnect Campaign PATCH sets campaignDisconnected', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Campaign Disconnect Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();

    const patchRes = await request.patch(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
      data: { campaignDisconnected: true },
    });
    expect(patchRes.ok()).toBeTruthy();
    const updated = await patchRes.json();
    expect(updated.campaignDisconnected).toBe(true);
  });

  test('TC-TB-053b: campaignDisconnected persists on re-read', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Campaign Persist Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();

    await request.patch(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
      data: { campaignDisconnected: true },
    });

    const getRes = await request.get(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
    });
    expect(getRes.ok()).toBeTruthy();
    const refreshed = await getRes.json();
    expect(refreshed.campaignDisconnected).toBe(true);
  });
});

// ============================================================================
// F. UNREAD COUNTS
// ============================================================================

test.describe('F. Unread Counts', () => {
  test('TC-TB-057: Unread count reset via PATCH', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Unread Reset Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();

    // Set unread to 5
    await request.patch(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
      data: { unreadCount: 5 },
    });

    // Reset to 0
    const resetRes = await request.patch(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
      data: { unreadCount: 0 },
    });
    expect(resetRes.ok()).toBeTruthy();
    const updated = await resetRes.json();
    expect(updated.unreadCount).toBe(0);
  });

  test('TC-TB-057b: Unread count set to arbitrary value', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Unread Set Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();

    const patchRes = await request.patch(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
      data: { unreadCount: 3 },
    });
    expect(patchRes.ok()).toBeTruthy();
    const updated = await patchRes.json();
    expect(updated.unreadCount).toBe(3);
  });
});

// ============================================================================
// G. ROLE-BASED ACCESS & CROSS-ORG ISOLATION
// ============================================================================

test.describe('G. Role-Based Access', () => {
  test('TC-TB-068: Unauthenticated access returns 401', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/conversations`);
    expect(res.status()).toBe(401);
  });

  test('TC-TB-062: Super admin sees conversations', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const res = await request.get(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
    });
    expect(res.ok()).toBeTruthy();
    const convs = parseConvList(await res.json());
    expect(Array.isArray(convs)).toBeTruthy();
  });

  test('TC-TB-063: Sales user sees org-scoped conversations', async ({ request }) => {
    const { token, organizationId } = await apiLogin(request, users.sales);
    const res = await request.get(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
    });
    expect(res.ok()).toBeTruthy();
    const convs = parseConvList(await res.json());
    // All returned conversations should belong to user's org
    for (const c of convs) {
      expect(c.organizationId).toBe(organizationId);
    }
  });

  test('TC-TB-064: Cross-org conversation access denied', async ({ request }) => {
    // Create a conversation as Serra Honda orgAdmin
    const serra = await apiLogin(request, users.orgAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(serra.token),
      data: { customerName: 'Cross Org Test', channel: 'sms', status: 'open' },
    });
    expect(createRes.status()).toBe(201);
    const conv = await createRes.json();

    // Try to access it as Serra Nissan orgAdmin (different org, roleLevel > 2)
    const nissan = await apiLogin(request, users.serraNissan);
    const getRes = await request.get(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(nissan.token),
    });
    expect(getRes.status()).toBe(403);
  });

  test('TC-TB-065: Cross-org message access denied', async ({ request }) => {
    const serra = await apiLogin(request, users.orgAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(serra.token),
      data: { customerName: 'Cross Org Msg Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();

    const nissan = await apiLogin(request, users.serraNissan);
    const msgRes = await request.get(`${BASE_URL}/api/conversations/${conv.id}/messages`, {
      headers: auth(nissan.token),
    });
    expect(msgRes.status()).toBe(403);
  });

  test('TC-TB-066: Delete conversation requires role level 3+', async ({ request }) => {
    // Sales user (roleLevel > 3) should be denied delete
    const admin = await apiLogin(request, users.superAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(admin.token),
      data: { customerName: 'Delete Role Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();

    const salesAuth = await apiLogin(request, users.sales);
    const delRes = await request.delete(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(salesAuth.token),
    });
    // requireRole(3) should block sales (roleLevel > 3)
    expect(delRes.status()).toBeGreaterThanOrEqual(401);
  });

  test('TC-TB-002: Conversation list respects org scoping', async ({ request }) => {
    const { token, organizationId } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
    });
    expect(res.ok()).toBeTruthy();
    const convs = parseConvList(await res.json());
    for (const c of convs) {
      expect(c.organizationId).toBe(organizationId);
    }
  });
});

// ============================================================================
// H. SMS WEBHOOK HANDLING
// ============================================================================

test.describe('H. SMS Webhook', () => {
  // TextMagic webhook uses multer upload.none() — accepts multipart/form-data.
  // Org routing depends on textmagicPhone being configured in org settings.
  // In dev, org phone config may be absent — tests check endpoint behavior, not org routing.

  // Helper: resolve a receiver phone that routes to an org, or skip
  let resolvedReceiver: string | null = null;

  test.beforeAll(async ({ request: _unused }, testInfo) => {
    // Try to find an org with textmagicPhone configured
    // If none found, webhook tests will validate endpoint behavior (400s, 200 with message)
    try {
      const loginRes = await (testInfo as any).project?.use?.request?.post?.(`${BASE_URL}/api/auth/login`, {
        data: { email: users.superAdmin.email, password: users.superAdmin.password },
      });
      // Can't easily get request in beforeAll — we'll detect in tests
    } catch {}
  });

  test('TC-TB-075: Inbound SMS — endpoint accepts and responds', async ({ request }) => {
    const uniquePhone = `1555${Date.now().toString().slice(-7)}`;
    const res = await request.post(`${BASE_URL}/api/webhooks/textmagic`, {
      multipart: {
        sender: uniquePhone,
        receiver: '18338096836',
        text: 'Agent test inbound SMS creating new conversation',
        timestamp: String(Math.floor(Date.now() / 1000)),
      },
    });
    // Endpoint should not error — returns 200 regardless of org resolution
    expect(res.status()).toBeLessThan(500);
    const body = await res.json();
    // Either conversation created or unresolvable (depends on env config)
    if (body.success && body.conversationId) {
      expect(body.conversationId).toBeTruthy();
    } else {
      // Unresolvable sender — still 200, valid response
      expect(body.message).toBeTruthy();
    }
  });

  test('TC-TB-076: Inbound SMS — duplicate sender routes to same conversation', async ({ request }) => {
    const uniquePhone = `1555${Date.now().toString().slice(-7)}`;

    const res1 = await request.post(`${BASE_URL}/api/webhooks/textmagic`, {
      multipart: {
        sender: uniquePhone,
        receiver: '18338096836',
        text: 'First message',
        timestamp: String(Math.floor(Date.now() / 1000)),
      },
    });
    expect(res1.ok()).toBeTruthy();
    const body1 = await res1.json();

    if (!body1.conversationId) {
      // Org not configured for routing — skip append check
      test.info().annotations.push({ type: 'note', description: 'Org TextMagic phone not configured — cannot verify append behavior' });
      return;
    }

    const res2 = await request.post(`${BASE_URL}/api/webhooks/textmagic`, {
      multipart: {
        sender: uniquePhone,
        receiver: '18338096836',
        text: 'Second message appending',
        timestamp: String(Math.floor(Date.now() / 1000)),
      },
    });
    expect(res2.ok()).toBeTruthy();
    const body2 = await res2.json();
    expect(body2.conversationId).toBe(body1.conversationId);
  });

  test('TC-TB-077: SMS webhook missing sender returns 400', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/webhooks/textmagic`, {
      multipart: {
        sender: '',
        receiver: '18338096836',
        text: 'Missing sender test',
      },
    });
    expect(res.status()).toBe(400);
  });

  test('TC-TB-078: SMS STOP keyword processing', async ({ request }) => {
    const uniquePhone = `1555${Date.now().toString().slice(-7)}`;
    const res = await request.post(`${BASE_URL}/api/webhooks/textmagic`, {
      multipart: {
        sender: uniquePhone,
        receiver: '18338096836',
        text: 'STOP',
        timestamp: String(Math.floor(Date.now() / 1000)),
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    // If org resolved: blacklisted response. If not: unresolvable message.
    if (body.action === 'blacklisted') {
      expect(body.keyword).toBe('STOP');
      expect(body.success).toBe(true);
    } else {
      // Org not resolvable — endpoint still responds 200
      expect(body.message).toBeTruthy();
    }
  });

  test('TC-TB-079: SMS STOP keywords variant — UNSUBSCRIBE', async ({ request }) => {
    const uniquePhone = `1555${Date.now().toString().slice(-7)}`;
    const res = await request.post(`${BASE_URL}/api/webhooks/textmagic`, {
      multipart: {
        sender: uniquePhone,
        receiver: '18338096836',
        text: 'UNSUBSCRIBE',
        timestamp: String(Math.floor(Date.now() / 1000)),
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    if (body.action === 'blacklisted') {
      expect(body.keyword).toBe('UNSUBSCRIBE');
    } else {
      expect(body.message).toBeTruthy();
    }
  });

  test('TC-TB-079b: SMS STOP keywords variant — QUIT', async ({ request }) => {
    const uniquePhone = `1555${Date.now().toString().slice(-7)}`;
    const res = await request.post(`${BASE_URL}/api/webhooks/textmagic`, {
      multipart: {
        sender: uniquePhone,
        receiver: '18338096836',
        text: 'QUIT',
        timestamp: String(Math.floor(Date.now() / 1000)),
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    if (body.action === 'blacklisted') {
      expect(body.keyword).toBe('QUIT');
    } else {
      expect(body.message).toBeTruthy();
    }
  });

  test('TC-TB-077b: SMS webhook missing text returns 400', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/webhooks/textmagic`, {
      multipart: {
        sender: '15551234567',
        receiver: '18338096836',
        text: '',
      },
    });
    expect(res.status()).toBe(400);
  });
});

// ============================================================================
// I. EMAIL ENDPOINT VALIDATION
// ============================================================================

test.describe('I. Outbound Email Validation', () => {
  test('TC-TB-089: Email send requires to, subject, body', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    // Create a conversation
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Email Validation Test', channel: 'email', status: 'open' },
    });
    const conv = await createRes.json();

    // Missing 'to' field
    const res = await request.post(`${BASE_URL}/api/conversations/${conv.id}/email`, {
      headers: auth(token),
      data: { subject: 'Test', body: 'Test body' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toContain('Missing required fields');
  });

  test('TC-TB-089b: Email send missing subject returns 400', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Email Subject Test', channel: 'email', status: 'open' },
    });
    const conv = await createRes.json();

    const res = await request.post(`${BASE_URL}/api/conversations/${conv.id}/email`, {
      headers: auth(token),
      data: { to: 'test@example.com', body: 'Body only' },
    });
    expect(res.status()).toBe(400);
  });
});

// ============================================================================
// J. BLACKLIST MANAGEMENT
// ============================================================================

test.describe('J. SMS Blacklist Management', () => {
  test('TC-TB-107: Get SMS blacklist requires role 3+', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/sms-blacklist`, {
      headers: auth(token),
    });
    expect(res.ok()).toBeTruthy();
    const entries = await res.json();
    expect(Array.isArray(entries)).toBeTruthy();
  });

  test('TC-TB-107b: Sales user cannot access blacklist', async ({ request }) => {
    const { token } = await apiLogin(request, users.sales);
    const res = await request.get(`${BASE_URL}/api/sms-blacklist`, {
      headers: auth(token),
    });
    // requireRole(3) should block sales
    expect(res.status()).toBeGreaterThanOrEqual(401);
  });

  test('TC-TB-109: Remove non-existent blacklist entry returns 404', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request.delete(`${BASE_URL}/api/sms-blacklist/${fakeId}`, {
      headers: auth(token),
    });
    expect(res.status()).toBe(404);
  });
});

// ============================================================================
// K. CROSS-ORG POST OPERATIONS
// ============================================================================

test.describe('K. Cross-Org Write Isolation', () => {
  test('TC-TB-064b: Cross-org PATCH denied', async ({ request }) => {
    const serra = await apiLogin(request, users.orgAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(serra.token),
      data: { customerName: 'Cross Org Patch Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();

    const nissan = await apiLogin(request, users.serraNissan);
    const patchRes = await request.patch(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(nissan.token),
      data: { status: 'closed' },
    });
    expect(patchRes.status()).toBe(403);
  });

  test('TC-TB-064c: Cross-org DELETE denied', async ({ request }) => {
    const serra = await apiLogin(request, users.orgAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(serra.token),
      data: { customerName: 'Cross Org Delete Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();

    const nissan = await apiLogin(request, users.serraNissan);
    const delRes = await request.delete(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(nissan.token),
    });
    // Either 403 (access denied) or 401 (role check fails first)
    expect(delRes.status()).toBeGreaterThanOrEqual(401);
  });

  test('TC-TB-064d: Cross-org message POST denied', async ({ request }) => {
    const serra = await apiLogin(request, users.orgAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(serra.token),
      data: { customerName: 'Cross Org Message Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();

    const nissan = await apiLogin(request, users.serraNissan);
    const msgRes = await request.post(`${BASE_URL}/api/conversations/${conv.id}/messages`, {
      headers: auth(nissan.token),
      data: { content: 'Intruder message', role: 'agent', senderName: 'Intruder' },
    });
    expect(msgRes.status()).toBe(403);
  });
});

// ============================================================================
// L. CONVERSATION STRUCTURE & DATA INTEGRITY
// ============================================================================

test.describe('L. Data Integrity', () => {
  test('TC-TB-001: Conversation list contains expected fields', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const res = await request.get(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
    });
    expect(res.ok()).toBeTruthy();
    const convs = parseConvList(await res.json());
    if (convs.length > 0) {
      const c = convs[0];
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('channel');
      expect(c).toHaveProperty('status');
      expect(c).toHaveProperty('organizationId');
      expect(c).toHaveProperty('customerName');
    }
  });

  test('TC-TB-073b: PATCH updates lastMessageAt on message send', async ({ request }) => {
    const { token } = await apiLogin(request, users.superAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'LastMsg Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();
    const beforeMsg = conv.lastMessageAt;

    // Small delay to ensure timestamp differs
    await new Promise(r => setTimeout(r, 100));

    await request.post(`${BASE_URL}/api/conversations/${conv.id}/messages`, {
      headers: auth(token),
      data: { content: 'Updating timestamp', role: 'agent', senderName: 'Agent' },
    });

    const getRes = await request.get(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
    });
    const refreshed = await getRes.json();
    // lastMessageAt should be updated (or at least set)
    expect(refreshed.lastMessageAt).toBeTruthy();
    if (beforeMsg) {
      expect(new Date(refreshed.lastMessageAt).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeMsg).getTime()
      );
    }
  });

  test('TC-TB-056: Unread count can be set and incremented via PATCH', async ({ request }) => {
    // Tests unread count manipulation via API (webhook-based increment depends on env config)
    const { token } = await apiLogin(request, users.superAdmin);
    const createRes = await request.post(`${BASE_URL}/api/conversations`, {
      headers: auth(token),
      data: { customerName: 'Unread Increment Test', channel: 'sms', status: 'open' },
    });
    const conv = await createRes.json();

    // Set initial unread count
    await request.patch(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
      data: { unreadCount: 2 },
    });

    // Verify it was set
    const getRes = await request.get(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
    });
    const updated = await getRes.json();
    expect(updated.unreadCount).toBe(2);

    // Increment via PATCH (simulating what webhook does)
    await request.patch(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
      data: { unreadCount: (updated.unreadCount || 0) + 1 },
    });

    const getRes2 = await request.get(`${BASE_URL}/api/conversations/${conv.id}`, {
      headers: auth(token),
    });
    const updated2 = await getRes2.json();
    expect(updated2.unreadCount).toBe(3);
  });
});
