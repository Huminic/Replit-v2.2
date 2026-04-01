import { test, expect } from 'playwright/test';
import { testUsers, login, authHeader, loginForBrowser } from '../../e2e/helpers/auth';

/**
 * Role Access Matrix — Comprehensive RBAC test
 * Tests every role against every page-level API endpoint and sidebar visibility.
 *
 * Role levels (from seed.ts):
 *   super_admin=1, partner_admin=2, org_admin=3, executive=3, sales_manager=3,
 *   sales=4, service=4, marketing=4
 *
 * requireRole(N) blocks if roleLevel > N (lower = more privileged)
 *
 * RBAC section access (from rbac.ts defaultSectionsByRole):
 *   super_admin:   ai-chat, teambox, sales, service, marketing, management
 *   partner_admin: ai-chat, teambox, sales, service, marketing
 *   org_admin:     ai-chat, teambox, sales, service, marketing
 *   executive:     ai-chat, teambox, sales, service, marketing
 *   sales:         ai-chat, teambox, sales
 *   service:       ai-chat, teambox, service
 *   marketing:     ai-chat, teambox, marketing
 *
 * canAccessSystem (settings): super_admin, partner_admin, org_admin only
 */

const BASE_URL = process.env.BASE_URL || 'https://dev.huminicdev.com';

// Roles we have test accounts for (no sales_manager account available)
const ROLE_KEYS = [
  'superAdmin',
  'partnerAdmin',
  'orgAdmin',
  'executive',
  'sales',
  'service',
  'marketing',
] as const;

type RoleKey = typeof ROLE_KEYS[number];

// ── API Endpoint Matrix ──────────────────────────────────────────────
// Each entry: [endpoint, method, requireRole level or null (any auth), description]
// requireRole(N) means roleLevel must be <= N to access.
interface EndpointDef {
  path: string;
  method: 'GET' | 'POST';
  requireRoleLevel: number | null; // null = any authenticated user
  label: string;
}

const ENDPOINTS: EndpointDef[] = [
  // General — any authenticated user
  { path: '/api/conversations', method: 'GET', requireRoleLevel: null, label: 'Dashboard/Chat — conversations' },
  { path: '/api/tasks', method: 'GET', requireRoleLevel: null, label: 'Dashboard — tasks' },
  { path: '/api/notifications', method: 'GET', requireRoleLevel: null, label: 'Notifications' },
  { path: '/api/users/me', method: 'GET', requireRoleLevel: null, label: 'Current user profile' },

  // Agents — GET is any auth, POST requires level 3
  { path: '/api/agents', method: 'GET', requireRoleLevel: null, label: 'Agents — list (any auth)' },
  { path: '/api/agents?department=sales', method: 'GET', requireRoleLevel: null, label: 'Sales agents' },
  { path: '/api/agents?department=service', method: 'GET', requireRoleLevel: null, label: 'Service agents' },
  { path: '/api/agents?department=marketing', method: 'GET', requireRoleLevel: null, label: 'Marketing agents' },

  // Insights — any auth
  { path: '/api/insights/dashboard', method: 'GET', requireRoleLevel: null, label: 'Insights dashboard' },
  { path: '/api/insights/library', method: 'GET', requireRoleLevel: null, label: 'Insights library' },

  // Settings — requireRole(3)
  { path: '/api/settings/org', method: 'GET', requireRoleLevel: null, label: 'Settings — org (read)' },

  // Management — users require level 3
  { path: '/api/users', method: 'GET', requireRoleLevel: 3, label: 'Management — user list' },

  // Organizations — any auth for GET list, level 3 for mutations
  { path: '/api/organizations', method: 'GET', requireRoleLevel: null, label: 'Organizations list' },

  // Billing — requireRole(3)
  { path: '/api/billing/summary', method: 'GET', requireRoleLevel: 3, label: 'Billing summary' },
  { path: '/api/billing/plan', method: 'GET', requireRoleLevel: 3, label: 'Billing plan' },
  { path: '/api/billing/invoices', method: 'GET', requireRoleLevel: 3, label: 'Billing invoices' },
  { path: '/api/billing/entitlements', method: 'GET', requireRoleLevel: 3, label: 'Billing entitlements' },

  // Usage — requireRole(3)
  { path: '/api/usage', method: 'GET', requireRoleLevel: 3, label: 'Usage stats' },

  // Widgets — GET any auth, POST requires level 3
  { path: '/api/widgets', method: 'GET', requireRoleLevel: null, label: 'Widgets list' },

  // Integrations — GET any auth
  { path: '/api/integrations', method: 'GET', requireRoleLevel: null, label: 'Integrations list' },

  // Sync status — any auth
  { path: '/api/sync/status', method: 'GET', requireRoleLevel: null, label: 'Sync status' },

  // Documents — any auth
  { path: '/api/documents', method: 'GET', requireRoleLevel: null, label: 'Documents list' },
];

// Role level mapping
const ROLE_LEVELS: Record<RoleKey, number> = {
  superAdmin: 1,
  partnerAdmin: 2,
  orgAdmin: 3,
  executive: 3,
  sales: 4,
  service: 4,
  marketing: 4,
};

// Expected sidebar sections per role (from rbac.ts)
// Sidebar item IDs: ai-chat, teambox, sales, service, marketing, management, system
const EXPECTED_SIDEBAR: Record<RoleKey, string[]> = {
  superAdmin: ['ai-chat', 'teambox', 'sales', 'service', 'marketing', 'management', 'system'],
  partnerAdmin: ['ai-chat', 'teambox', 'sales', 'service', 'marketing', 'system'],
  orgAdmin: ['ai-chat', 'teambox', 'sales', 'service', 'marketing', 'system'],
  executive: ['ai-chat', 'teambox', 'sales', 'service', 'marketing'],
  sales: ['ai-chat', 'teambox', 'sales'],
  service: ['ai-chat', 'teambox', 'service'],
  marketing: ['ai-chat', 'teambox', 'marketing'],
};

// ── Helper: login and get token via cached API auth ──────────────────
async function getToken(
  request: import('playwright/test').APIRequestContext,
  roleKey: RoleKey
): Promise<string> {
  const user = testUsers[roleKey];
  if (!user) throw new Error(`No test user for role: ${roleKey}`);
  const { token } = await login(request, user);
  return token;
}

// ══════════════════════════════════════════════════════════════════════
// SECTION 1: API-level access matrix (fast, no browser needed)
// ══════════════════════════════════════════════════════════════════════

test.describe('Role Access Matrix — API Endpoints', () => {
  // Pre-cache all tokens in a single serial block to avoid rate limiting
  const tokens: Partial<Record<RoleKey, string>> = {};

  test.beforeAll(async ({ request }) => {
    // Login all roles sequentially to respect rate limiter
    for (const roleKey of ROLE_KEYS) {
      tokens[roleKey] = await getToken(request, roleKey);
    }
  });

  for (const roleKey of ROLE_KEYS) {
    const roleLevel = ROLE_LEVELS[roleKey];

    test.describe(`Role: ${roleKey} (level ${roleLevel})`, () => {
      for (const endpoint of ENDPOINTS) {
        const shouldHaveAccess =
          endpoint.requireRoleLevel === null || roleLevel <= endpoint.requireRoleLevel;

        const expectation = shouldHaveAccess ? 'ALLOW' : 'DENY';

        test(`${expectation}: ${endpoint.label} [${endpoint.method} ${endpoint.path}]`, async ({ request }) => {
          const token = tokens[roleKey];
          if (!token) {
            test.skip(true, `No token for ${roleKey}`);
            return;
          }

          const headers = authHeader(token);
          let response;

          if (endpoint.method === 'GET') {
            response = await request.get(`${BASE_URL}${endpoint.path}`, { headers });
          } else {
            // POST endpoints — we don't send body (expect 400 at worst, not 403)
            response = await request.post(`${BASE_URL}${endpoint.path}`, {
              headers,
              data: {},
            });
          }

          const status = response.status();

          if (shouldHaveAccess) {
            // Should NOT get 401 or 403
            expect(
              status,
              `${roleKey} should access ${endpoint.path} but got ${status}`
            ).not.toBe(403);
            expect(
              status,
              `${roleKey} should be authenticated for ${endpoint.path} but got 401`
            ).not.toBe(401);
          } else {
            // Should get 403 (Forbidden)
            expect(
              status,
              `${roleKey} (level ${roleLevel}) should be denied ${endpoint.path} (requires level ${endpoint.requireRoleLevel}) but got ${status}`
            ).toBe(403);
          }
        });
      }
    });
  }
});

// ══════════════════════════════════════════════════════════════════════
// SECTION 2: Unauthenticated API access (should get 401)
// ══════════════════════════════════════════════════════════════════════

test.describe('Role Access Matrix — Unauthenticated requests', () => {
  const protectedEndpoints = [
    '/api/conversations',
    '/api/tasks',
    '/api/agents',
    '/api/users',
    '/api/settings/org',
    '/api/billing/summary',
    '/api/insights/dashboard',
    '/api/organizations',
    '/api/notifications',
  ];

  for (const endpoint of protectedEndpoints) {
    test(`DENY unauthenticated: GET ${endpoint}`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${endpoint}`);
      expect(response.status()).toBe(401);
    });
  }
});

// ══════════════════════════════════════════════════════════════════════
// SECTION 3: Public pages — no auth required
// ══════════════════════════════════════════════════════════════════════

test.describe('Role Access Matrix — Public endpoints', () => {
  // Widget and landing page endpoints are public (no authenticateToken)
  // The /w/:slug and /p/:slug pages are served as SPA routes.
  // The widget video session API is public.
  test('Public: POST /api/widget/video-session (rate limited but not auth-gated)', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/widget/video-session`, {
      data: { agentId: 'nonexistent' },
    });
    // Should NOT be 401 — it's public. May be 404/400/429 but not auth-gated.
    expect(response.status()).not.toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════
// SECTION 4: Sidebar visibility per role (browser tests — 1 login per role)
// ══════════════════════════════════════════════════════════════════════

test.describe('Role Access Matrix — Sidebar visibility', () => {
  // Increase timeout for browser tests
  test.setTimeout(45_000);

  for (const roleKey of ROLE_KEYS) {
    test(`Sidebar items for ${roleKey}`, async ({ page }) => {
      const user = testUsers[roleKey];
      if (!user) {
        test.skip(true, `No test user for ${roleKey}`);
        return;
      }

      // Login and navigate to root
      await loginForBrowser(page, user, `${BASE_URL}/`);

      // Wait for sidebar to render
      await page.waitForTimeout(2000);

      // Sidebar nav items have specific IDs or labels — check for each
      // The sidebar uses button/anchor elements with text labels
      const expectedItems = EXPECTED_SIDEBAR[roleKey];
      const allSidebarItems = ['ai-chat', 'teambox', 'sales', 'service', 'marketing', 'management', 'system'];

      for (const itemId of allSidebarItems) {
        const shouldBeVisible = expectedItems.includes(itemId);

        // Map item IDs to their visible labels
        const labelMap: Record<string, string> = {
          'ai-chat': 'AI Chat',
          'teambox': 'TeamBox',
          'sales': 'Sales',
          'service': 'Service',
          'marketing': 'Marketing',
          'management': 'Manage',
          'system': 'System',
        };

        const label = labelMap[itemId];

        // Look for the sidebar item by its text content
        // Sidebar items are rendered as buttons/links with the label text
        const item = page.locator(`nav, aside, [class*="sidebar"]`).locator(`text="${label}"`).first();

        if (shouldBeVisible) {
          // Should be visible in sidebar
          const isVisible = await item.isVisible().catch(() => false);
          expect(
            isVisible,
            `${roleKey} should see sidebar item "${label}" but it was not visible`
          ).toBe(true);
        } else {
          // Should NOT be visible
          const isVisible = await item.isVisible().catch(() => false);
          expect(
            isVisible,
            `${roleKey} should NOT see sidebar item "${label}" but it was visible`
          ).toBe(false);
        }
      }
    });
  }
});
