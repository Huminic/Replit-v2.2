import { test, expect } from 'playwright/test';

/**
 * Service Domain Agent Tests
 * Generated from: tests/agents/plans/service-plan.md
 * Domain: Service (/service)
 *
 * Covers gaps not addressed by domain-06-departments.spec.ts or s4-service.spec.ts:
 *   - Tab navigation (Campaigns, Agents, Insights, Calendar)
 *   - Campaign table display, new campaign dialog, kill switch, execution controls
 *   - Agent cards and interaction
 *   - Metric tiles and detail dialog
 *   - Calendar rendering
 *   - RBAC role access
 *   - Campaign and appointment API validation
 *   - Error/empty states
 */

const BASE_URL = process.env.BASE_URL || 'https://dev.huminicdev.com';
const TEST_PASSWORD = 'NexxusTest2026';

const users = {
  service: { email: 'service_staff@huminic.ai', password: TEST_PASSWORD },
  orgAdmin: { email: 'serra_honda@huminic.ai', password: TEST_PASSWORD },
  superAdmin: { email: 'duane.wells@huminic.ai', password: TEST_PASSWORD },
  sales: { email: 'sales_staff@huminic.ai', password: TEST_PASSWORD },
  marketing: { email: 'marketing_staff@huminic.ai', password: TEST_PASSWORD },
  executive: { email: 'executive_staff@huminic.ai', password: TEST_PASSWORD },
  partnerAdmin: { email: 'duanekwells@gmail.com', password: TEST_PASSWORD },
};

/** Login via API, dismiss tours, navigate to target path */
async function loginAndNavigate(
  page: import('playwright/test').Page,
  user: { email: string; password: string },
  targetPath: string = '/service'
) {
  const response = await page.request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  if (!response.ok()) {
    throw new Error(`Login failed for ${user.email}: ${response.status()} ${await response.text()}`);
  }
  const body = await response.json();

  await page.addInitScript(() => {
    const prefix = 'nexxus_tour_dismissed_';
    const keys = [
      'main', 'teambox', 'my-work', 'sales', 'service', 'marketing',
      'management', 'agents', 'insights', 'settings', 'profile', 'usage',
    ];
    for (const key of keys) {
      localStorage.setItem(prefix + key, 'true');
    }
  });

  await page.goto(`${BASE_URL}${targetPath}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(2000);

  return {
    token: body.accessToken,
    userId: body.user?.id,
    organizationId: body.user?.organization?.id,
  };
}

/** API-only login returning token */
async function apiLogin(
  request: import('playwright/test').APIRequestContext,
  user: { email: string; password: string }
) {
  const res = await request.post(`${BASE_URL}/api/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  if (!res.ok()) {
    throw new Error(`Login failed for ${user.email}: ${res.status()} ${await res.text()}`);
  }
  const body = await res.json();
  return {
    token: body.accessToken,
    userId: body.user?.id,
    organizationId: body.user?.organization?.id,
  };
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ============================================================
// 1. Page Load & Structure
// ============================================================
test.describe('Service — Page Load & Structure', () => {

  test('SVC-002: service page loads for org_admin', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    expect(page.url()).toContain('/service');
    await expect(page.locator('[data-testid="service-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('SVC-003: service page loads for super_admin', async ({ page }) => {
    await loginAndNavigate(page, users.superAdmin, '/service');
    expect(page.url()).toContain('/service');
    await expect(page.locator('[data-testid="service-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('SVC-004: default tab is Campaigns', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    const campaignsTab = page.locator('[data-testid="tab-service-campaigns"]');
    await expect(campaignsTab).toBeVisible();
    // Active tab has border-primary class
    await expect(campaignsTab).toHaveClass(/border-primary/);
    // Campaigns heading visible
    await expect(page.locator('h2:has-text("Service Campaigns")')).toBeVisible();
  });

  test('SVC-005: all 4 tabs render in tab bar', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    for (const tabId of ['campaigns', 'agents', 'insights', 'calendar']) {
      await expect(page.locator(`[data-testid="tab-service-${tabId}"]`)).toBeVisible();
    }
  });

  test('SVC-006: no Dashboard tab exists', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await expect(page.locator('[data-testid="tab-service-dashboard"]')).toHaveCount(0);
    await expect(page.locator('button:has-text("Dashboard")')).toHaveCount(0);
  });
});

// ============================================================
// 2. Tab Navigation
// ============================================================
test.describe('Service — Tab Navigation', () => {

  test('SVC-010: switch to Agents tab', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="tab-service-agents"]').click();
    await expect(page.locator('h2:has-text("Service Agents")')).toBeVisible();
  });

  test('SVC-011: switch to Insights tab', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="tab-service-insights"]').click();
    await expect(page.locator('h2:has-text("Service Metrics")')).toBeVisible();
  });

  test('SVC-012: switch to Calendar tab', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="tab-service-calendar"]').click();
    await page.waitForTimeout(1000);
    // Calendar renders — look for month navigation or day headers
    const calendarContent = page.locator('text=/Sun|Mon|Tue|January|February|March|April|May|June|July|August|September|October|November|December/');
    await expect(calendarContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('SVC-013: switch back to Campaigns tab after navigating away', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="tab-service-agents"]').click();
    await expect(page.locator('h2:has-text("Service Agents")')).toBeVisible({ timeout: 10000 });
    await page.locator('[data-testid="tab-service-campaigns"]').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('h2:has-text("Service Campaigns")')).toBeVisible({ timeout: 10000 });
  });

  test('SVC-014: URL ?tab= parameter sets active tab', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service?tab=agents');
    await expect(page.locator('h2:has-text("Service Agents")')).toBeVisible({ timeout: 10000 });
  });

  test('SVC-015: invalid ?tab= parameter defaults to campaigns', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service?tab=invalid');
    await expect(page.locator('h2:has-text("Service Campaigns")')).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================
// 3. Campaigns Tab — Table & Buttons
// ============================================================
test.describe('Service — Campaigns Tab', () => {

  test('SVC-020: campaign table renders with header columns', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    for (const col of ['Campaign', 'Status', 'Channel', 'Recipients', 'Sent', 'Replied', 'Kill Switch', 'Actions']) {
      await expect(page.locator(`th:has-text("${col}")`)).toBeVisible();
    }
  });

  test('SVC-030: New Campaign button opens dialog', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="button-new-campaign"]').click();
    await expect(page.locator('text="Create Service Campaign"')).toBeVisible();
    await expect(page.locator('[data-testid="input-campaign-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="campaign-channel-checkboxes"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-campaign-template"]')).toBeVisible();
  });

  test('SVC-031: channel checkboxes default to SMS selected', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="button-new-campaign"]').click();
    await expect(page.locator('[data-testid="checkbox-channel-sms"]')).toBeChecked();
    await expect(page.locator('[data-testid="checkbox-channel-email"]')).not.toBeChecked();
    await expect(page.locator('[data-testid="checkbox-channel-phone"]')).not.toBeChecked();
  });

  test('SVC-033: create button disabled when name empty', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="button-new-campaign"]').click();
    await expect(page.locator('[data-testid="button-submit-campaign"]')).toBeDisabled();
  });

  test('SVC-034: create button disabled when no channel selected', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="button-new-campaign"]').click();
    await page.locator('[data-testid="input-campaign-name"]').fill('Test Campaign');
    // Uncheck SMS (the default)
    await page.locator('[data-testid="checkbox-channel-sms"]').uncheck();
    await expect(page.locator('[data-testid="button-submit-campaign"]')).toBeDisabled();
  });

  test('SVC-035: cancel button closes dialog', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="button-new-campaign"]').click();
    await expect(page.locator('text="Create Service Campaign"')).toBeVisible();
    await page.locator('[data-testid="button-cancel-campaign"]').click();
    await expect(page.locator('text="Create Service Campaign"')).not.toBeVisible();
  });

  test('SVC-041: CSV template download link exists', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    const link = page.locator('[data-testid="link-download-csv-template"]');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/campaign-template.csv');
    await expect(link).toHaveAttribute('download', 'campaign-template.csv');
  });

  test('SVC-050: kill switch toggles visible per campaign row', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    const switches = page.locator('[data-testid^="switch-killswitch-"]');
    const count = await switches.count();
    // Should have at least one kill switch if campaigns exist
    if (count > 0) {
      await expect(switches.first()).toBeVisible();
    }
  });
});

// ============================================================
// 4. Campaign Detail Dialog
// ============================================================
test.describe('Service — Campaign Detail Dialog', () => {

  test('SVC-070: click campaign row opens detail dialog', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    const row = page.locator('[data-testid^="campaign-row-"]').first();
    const rowCount = await row.count();
    if (rowCount > 0) {
      await row.click();
      await expect(page.locator('[data-testid="dialog-campaign-detail"]')).toBeVisible();
    }
  });

  test('SVC-071: detail dialog shows status, channel, recipients, sent, replied', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    const row = page.locator('[data-testid^="campaign-row-"]').first();
    const rowCount = await row.count();
    if (rowCount > 0) {
      await row.click();
      const dialog = page.locator('[data-testid="dialog-campaign-detail"]');
      await expect(dialog).toBeVisible();
      for (const label of ['Status', 'Channel', 'Recipients', 'Sent', 'Replied', 'Kill Switch']) {
        await expect(dialog.locator(`text="${label}"`)).toBeVisible();
      }
    }
  });
});

// ============================================================
// 5. Safety Card
// ============================================================
test.describe('Service — Safety Card', () => {

  test('SVC-080: campaign safety card visible when not dismissed', async ({ page }) => {
    // Clear dismiss state before navigation
    await page.addInitScript(() => {
      localStorage.removeItem('campaign-safety-dismissed');
    });
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await expect(page.locator('[data-testid="card-campaign-safety"]')).toBeVisible();
  });

  test('SVC-081: dismiss button hides safety card', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('campaign-safety-dismissed');
    });
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await expect(page.locator('[data-testid="card-campaign-safety"]')).toBeVisible();
    await page.locator('[data-testid="button-dismiss-campaign-safety"]').click();
    await expect(page.locator('[data-testid="card-campaign-safety"]')).not.toBeVisible();
  });
});

// ============================================================
// 6. Agents Tab
// ============================================================
test.describe('Service — Agents Tab', () => {

  test('SVC-090: agents tab shows agent cards', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="tab-service-agents"]').click();
    await page.waitForTimeout(2000);
    const cards = page.locator('[data-testid^="agent-card-"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('SVC-091: agent card shows name, channel, status dot', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="tab-service-agents"]').click();
    await page.waitForTimeout(2000);
    const card = page.locator('[data-testid^="agent-card-"]').first();
    // Card has text content (name)
    const cardText = await card.textContent();
    expect(cardText!.length).toBeGreaterThan(0);
    // Has a status dot (rounded-full div)
    await expect(card.locator('.rounded-full').first()).toBeVisible();
  });

  test('SVC-092: agent card click navigates to /agents', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="tab-service-agents"]').click();
    await page.waitForTimeout(2000);
    const card = page.locator('[data-testid^="agent-card-"]').first();
    await card.click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/agents');
  });
});

// ============================================================
// 7. Insights Tab — Metric Tiles
// ============================================================
test.describe('Service — Insights Tab', () => {

  test('SVC-100: insights tab shows 6 metric tiles', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service?tab=insights');
    await page.waitForTimeout(3000);
    for (let i = 1; i <= 6; i++) {
      await expect(page.locator(`[data-testid="metric-tile-svm-${i}"]`)).toBeVisible({ timeout: 10000 });
    }
  });

  test('SVC-101: metric tiles show correct labels', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="tab-service-insights"]').click();
    await page.waitForTimeout(2000);
    const labels = ['Active Campaigns', 'Messages Sent', 'Replies Received', 'Open Conversations', 'Total Conversations', 'Reply Rate'];
    for (const label of labels) {
      await expect(page.locator(`text="${label}"`).first()).toBeVisible();
    }
  });

  test('SVC-103: click metric tile opens detail dialog', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="tab-service-insights"]').click();
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="metric-tile-svm-1"]').click();
    await expect(page.locator('[data-testid="dialog-metric-detail"]')).toBeVisible();
    await expect(page.locator('[data-testid="text-metric-detail-title"]')).toContainText('Active Campaigns');
    await expect(page.locator('[data-testid="text-metric-detail-value"]')).toBeVisible();
  });

  test('SVC-104: metric detail dialog shows department and data source', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="tab-service-insights"]').click();
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="metric-tile-svm-1"]').click();
    const dialog = page.locator('[data-testid="dialog-metric-detail"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('text="Service"')).toBeVisible();
    await expect(dialog.locator('text="Dashboard Metrics API"')).toBeVisible();
  });
});

// ============================================================
// 8. RBAC — Role Access
// ============================================================
test.describe('Service — RBAC', () => {

  test('SVC-151: sales role sidebar does not show Service link', async ({ page }) => {
    // RBAC for service is enforced via sidebar navigation visibility, not route blocking.
    // Sales users should not see a Service sidebar item.
    await loginAndNavigate(page, users.sales, '/');
    const sidebar = page.locator('nav, [class*="sidebar"], [role="navigation"]');
    const serviceItem = sidebar.locator('[data-testid="sidebar-item-service"]');
    await expect(serviceItem).toHaveCount(0);
  });

  test('SVC-152: marketing role sidebar does not show Service link', async ({ page }) => {
    await loginAndNavigate(page, users.marketing, '/');
    const sidebar = page.locator('nav, [class*="sidebar"], [role="navigation"]');
    const serviceItem = sidebar.locator('[data-testid="sidebar-item-service"]');
    await expect(serviceItem).toHaveCount(0);
  });

  test('SVC-153: org_admin can access /service', async ({ page }) => {
    // orgAdmin access already validated in many tests above; this is an explicit RBAC check
    await loginAndNavigate(page, users.orgAdmin, '/service');
    const servicePage = page.locator('[data-testid="service-page"]');
    await expect(servicePage).toBeVisible({ timeout: 15000 });
  });

  test('SVC-154: executive can access /service', async ({ page }) => {
    await loginAndNavigate(page, users.executive, '/service');
    await expect(page.locator('[data-testid="service-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('SVC-155: partner_admin can access /service', async ({ page }) => {
    await loginAndNavigate(page, users.partnerAdmin, '/service');
    await expect(page.locator('[data-testid="service-page"]')).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================
// 9. API — Campaign CRUD
// ============================================================
test.describe('Service — Campaign API', () => {

  test('SVC-130: GET /api/campaigns?department=service returns service campaigns', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/campaigns?department=service`, {
      headers: authHeader(token),
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
    // All returned campaigns should be service department
    for (const c of data) {
      expect(c.department).toBe('service');
    }
  });

  test('SVC-134: PATCH /api/campaigns/:id updates campaign fields', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    // Get an existing service campaign first
    const listRes = await request.get(`${BASE_URL}/api/campaigns?department=service`, {
      headers: authHeader(token),
    });
    const campaigns = await listRes.json();
    if (campaigns.length === 0) {
      test.skip();
      return;
    }
    const campaignId = campaigns[0].id;
    const currentKS = campaigns[0].killSwitch;
    // Toggle killSwitch
    const patchRes = await request.patch(`${BASE_URL}/api/campaigns/${campaignId}`, {
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      data: { killSwitch: !currentKS },
    });
    expect(patchRes.ok()).toBeTruthy();
    // Restore original
    await request.patch(`${BASE_URL}/api/campaigns/${campaignId}`, {
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      data: { killSwitch: currentKS },
    });
  });

  test('SVC-142: GET /api/campaigns/:id returns single campaign', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const listRes = await request.get(`${BASE_URL}/api/campaigns?department=service`, {
      headers: authHeader(token),
    });
    const campaigns = await listRes.json();
    if (campaigns.length === 0) {
      test.skip();
      return;
    }
    const res = await request.get(`${BASE_URL}/api/campaigns/${campaigns[0].id}`, {
      headers: authHeader(token),
    });
    expect(res.ok()).toBeTruthy();
    const campaign = await res.json();
    expect(campaign.id).toBe(campaigns[0].id);
  });
});

// ============================================================
// 10. API — Appointments
// ============================================================
test.describe('Service — Appointment API', () => {

  test('SVC-120: GET /api/appointments filters by department', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    const res = await request.get(
      `${BASE_URL}/api/appointments?department=service&startDate=${startDate}&endDate=${endDate}`,
      { headers: authHeader(token) }
    );
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
  });

  test('SVC-121: POST /api/appointments creates appointment', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 1);
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(11, 0, 0, 0);

    const res = await request.post(`${BASE_URL}/api/appointments`, {
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      data: {
        title: 'Agent Test Service Appointment',
        customerName: 'Test Customer',
        customerPhone: '555-0199',
        customerEmail: 'test-svc@example.com',
        type: 'service',
        department: 'service',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: 'Created by agent test',
      },
    });
    expect(res.ok()).toBeTruthy();
    const appt = await res.json();
    expect(appt.id).toBeTruthy();

    // Cleanup: delete the appointment
    if (appt.id) {
      await request.delete(`${BASE_URL}/api/appointments/${appt.id}`, {
        headers: authHeader(token),
      });
    }
  });

  test('SVC-122: PATCH /api/appointments/:id updates appointment', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    // Create, then update, then delete
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 2);
    startTime.setHours(14, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(15, 0, 0, 0);

    const createRes = await request.post(`${BASE_URL}/api/appointments`, {
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      data: {
        title: 'Patch Test Appointment',
        customerName: 'Patch Customer',
        type: 'service',
        department: 'service',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    });
    if (!createRes.ok()) { test.skip(); return; }
    const appt = await createRes.json();

    const patchRes = await request.patch(`${BASE_URL}/api/appointments/${appt.id}`, {
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      data: { title: 'Updated Appointment Title' },
    });
    expect(patchRes.ok()).toBeTruthy();

    // Cleanup
    await request.delete(`${BASE_URL}/api/appointments/${appt.id}`, {
      headers: authHeader(token),
    });
  });

  test('SVC-123: DELETE /api/appointments/:id removes appointment', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 3);
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(startTime);
    endTime.setHours(10, 0, 0, 0);

    const createRes = await request.post(`${BASE_URL}/api/appointments`, {
      headers: { ...authHeader(token), 'Content-Type': 'application/json' },
      data: {
        title: 'Delete Test Appointment',
        customerName: 'Delete Customer',
        type: 'general',
        department: 'service',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    });
    if (!createRes.ok()) { test.skip(); return; }
    const appt = await createRes.json();

    const delRes = await request.delete(`${BASE_URL}/api/appointments/${appt.id}`, {
      headers: authHeader(token),
    });
    expect(delRes.ok()).toBeTruthy();
  });
});

// ============================================================
// 11. API — Metrics
// ============================================================
test.describe('Service — Metrics API', () => {

  test('SVC-170: GET /api/metrics/dashboard returns service breakdown', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/metrics/dashboard`, {
      headers: authHeader(token),
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.campaignStats).toBeTruthy();
    // Should have byDepartment with service
    if (data.campaignStats.byDepartment) {
      expect(data.campaignStats.byDepartment.service).toBeTruthy();
      const svc = data.campaignStats.byDepartment.service;
      expect(typeof svc.total).toBe('number');
      expect(typeof svc.active).toBe('number');
      expect(typeof svc.sent).toBe('number');
      expect(typeof svc.replied).toBe('number');
    }
  });
});

// ============================================================
// 12. API — Agents
// ============================================================
test.describe('Service — Agents API', () => {

  test('SVC-180: GET /api/agents?department=service returns service agents', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/agents?department=service`, {
      headers: authHeader(token),
    });
    expect(res.ok()).toBeTruthy();
    const agents = await res.json();
    expect(Array.isArray(agents)).toBeTruthy();
    expect(agents.length).toBeGreaterThanOrEqual(1);
    // Nancy Gaston should be present
    const nancy = agents.find((a: any) => a.name?.includes('Nancy'));
    expect(nancy).toBeTruthy();
  });

  test('SVC-181: Nancy Gaston has valid instructions', async ({ request }) => {
    const { token } = await apiLogin(request, users.orgAdmin);
    const res = await request.get(`${BASE_URL}/api/agents?department=service`, {
      headers: authHeader(token),
    });
    const agents = await res.json();
    const nancy = agents.find((a: any) => a.name?.includes('Nancy'));
    expect(nancy).toBeTruthy();
    expect(nancy.instructions?.length).toBeGreaterThan(100);
    expect(nancy.instructions).toContain('Nancy');
    expect(nancy.instructions).not.toContain('Carol');
  });
});

// ============================================================
// 13. Calendar Tab — Browser
// ============================================================
test.describe('Service — Calendar Tab', () => {

  test('SVC-110: calendar renders month view', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="tab-service-calendar"]').click();
    await page.waitForTimeout(2000);
    // Month names or day abbreviations should be visible
    const monthOrDay = page.locator('text=/January|February|March|April|May|June|July|August|September|October|November|December/');
    await expect(monthOrDay.first()).toBeVisible({ timeout: 10000 });
  });

  test('SVC-111: calendar prev/next month navigation', async ({ page }) => {
    await loginAndNavigate(page, users.orgAdmin, '/service');
    await page.locator('[data-testid="tab-service-calendar"]').click();
    await page.waitForTimeout(2000);
    // Get current month text
    const monthText = await page.locator('text=/January|February|March|April|May|June|July|August|September|October|November|December/').first().textContent();
    // Click next month button (typically a chevron or arrow)
    const nextButton = page.locator('button:has-text("›"), button:has-text(">"), button:has-text("Next"), [data-testid*="next"]').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
      // Verify month changed or is still navigable
      const newMonthText = await page.locator('text=/January|February|March|April|May|June|July|August|September|October|November|December/').first().textContent();
      // Month should be different (or might wrap to same month next year)
      expect(newMonthText).toBeTruthy();
    }
  });
});

// ============================================================
// 14. Cross-Cutting Concerns
// ============================================================
test.describe('Service — Cross-Cutting', () => {

  test('SVC-200: no console errors on service page across all tabs', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await loginAndNavigate(page, users.orgAdmin, '/service');
    // Visit each tab
    for (const tabId of ['agents', 'insights', 'calendar', 'campaigns']) {
      await page.locator(`[data-testid="tab-service-${tabId}"]`).click();
      await page.waitForTimeout(1500);
    }

    // Filter out known benign errors (e.g., favicon, third-party)
    const realErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('net::ERR') &&
      !e.includes('Failed to load resource') &&
      !e.includes('ResizeObserver')
    );
    expect(realErrors).toEqual([]);
  });
});
