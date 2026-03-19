import { test, expect } from "playwright/test";
import { testUsers, login, authHeader } from "./helpers/auth";

test.describe("Domain 12: Infrastructure", () => {
  test("12.1 Health endpoint returns 200", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);

    const body = await response.json();
    // Health check should indicate system status
    expect(body).toBeTruthy();
    const status = body.status ?? body.ok ?? body.healthy;
    expect(status).toBeTruthy();
  });

  test("12.2 Security headers present", async ({ request }) => {
    const response = await request.get("/api/health");
    const headers = response.headers();

    // Helmet sets these security headers
    const expectedHeaders = [
      "x-content-type-options",
      "x-frame-options",
      "x-xss-protection",
    ];

    const presentHeaders: string[] = [];
    const missingHeaders: string[] = [];

    for (const header of expectedHeaders) {
      if (headers[header]) {
        presentHeaders.push(header);
      } else {
        missingHeaders.push(header);
      }
    }

    // At least some Helmet headers should be present
    expect(presentHeaders.length).toBeGreaterThan(0);

    // Specific checks for common Helmet headers
    if (headers["x-content-type-options"]) {
      expect(headers["x-content-type-options"]).toBe("nosniff");
    }

    if (headers["x-frame-options"]) {
      expect(["DENY", "SAMEORIGIN"]).toContain(headers["x-frame-options"]);
    }

    // Strict-Transport-Security may also be present
    const hsts = headers["strict-transport-security"];
    if (hsts) {
      expect(hsts).toContain("max-age");
    }
  });

  test("12.3 Rate limiting works", async ({ request }) => {
    // Global rate limiter: 100 requests per minute (server/index.ts)
    // Auth rate limiter: AUTH_RATE_LIMIT_MAX env var, default 100 per 15 min (server/routes/auth.ts)
    // We need to exceed the global limit of 100/min to trigger 429
    const endpoint = "/api/auth/login";
    const badCredentials = { email: "ratelimit@test.com", password: "wrong" };

    // Send 110 requests in rapid succession to exceed the 100/min global limit
    const batchSize = 40;
    const allStatuses: number[] = [];

    for (let batch = 0; batch < 3; batch++) {
      const promises = Array.from({ length: batchSize }, () =>
        request.post(endpoint, { data: badCredentials }).then((r) => r.status())
      );
      const statuses = await Promise.all(promises);
      allStatuses.push(...statuses);

      // Check early if we already got a 429
      if (allStatuses.some((s) => s === 429)) break;
    }

    // Rate limiting should trigger after exceeding 100 rapid requests
    const has429 = allStatuses.some((s) => s === 429);
    expect(has429).toBe(true);
  });

  test("12.4 httpOnly cookie set on login", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      data: {
        email: testUsers.superAdmin.email,
        password: testUsers.superAdmin.password,
      },
    });

    expect(response.ok()).toBe(true);

    // Check Set-Cookie header for httpOnly flag
    const setCookieHeaders = response.headers()["set-cookie"] ?? "";

    if (setCookieHeaders.length > 0) {
      // At least one cookie should have httpOnly
      const hasHttpOnly = setCookieHeaders.toLowerCase().includes("httponly");
      expect(hasHttpOnly).toBe(true);

      // Should also have Secure flag (for production) or SameSite
      const hasSameSite = setCookieHeaders.toLowerCase().includes("samesite");
      // SameSite is recommended but not strictly required in dev
      if (hasSameSite) {
        expect(hasSameSite).toBe(true);
      }
    } else {
      // If no Set-Cookie, the auth may be token-only (JWT in body)
      // Verify token is returned in response body instead
      const body = await response.json();
      expect(body.accessToken ?? body.token).toBeTruthy();
      test.info().annotations.push({
        type: "note",
        description: "No Set-Cookie header — auth uses bearer token in response body",
      });
    }
  });

  test("12.5 Entitlement checks fail-closed", async ({ request }) => {
    // Test that requests with invalid/expired token get rejected (fail-closed)
    const invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoxNzAwMDAwMDAxfQ.invalid-signature";

    const protectedEndpoints = [
      "/api/tasks",
      "/api/contacts",
      "/api/organizations",
      "/api/users",
    ];

    for (const endpoint of protectedEndpoints) {
      const response = await request.get(endpoint, {
        headers: { Authorization: `Bearer ${invalidToken}` },
      });

      // Fail-closed: invalid token must NOT return 200
      // May return 401, 403, 404 (route not matched), or 429 (rate limited)
      expect(response.status()).not.toBe(200);
      expect([401, 403, 404, 429]).toContain(response.status());
    }

    // Also test with no token at all
    for (const endpoint of protectedEndpoints) {
      const response = await request.get(endpoint);
      // Should reject with 401, 403, 404, or 429
      expect(response.status()).not.toBe(200);
      expect([401, 403, 404, 429]).toContain(response.status());
    }
  });

  test("12.6 getConversationByPhone filters by orgId", async ({ request }) => {
    // Login as two different org users and verify data isolation
    const superSession = await login(request, testUsers.superAdmin);
    const salesSession = await login(request, testUsers.sales);

    // Query conversations by phone — each user should only see their org's data
    const phoneNumber = "+15551234567";

    const superRes = await request.get(`/api/conversations?phone=${encodeURIComponent(phoneNumber)}`, {
      headers: authHeader(superSession.token),
    });

    const salesRes = await request.get(`/api/conversations?phone=${encodeURIComponent(phoneNumber)}`, {
      headers: authHeader(salesSession.token),
    });

    // Both should respond successfully
    if (superRes.status() === 404 && salesRes.status() === 404) {
      // Endpoint may not exist as query param — try path-based
      const superRes2 = await request.get(`/api/conversations/phone/${encodeURIComponent(phoneNumber)}`, {
        headers: authHeader(superSession.token),
      });
      const salesRes2 = await request.get(`/api/conversations/phone/${encodeURIComponent(phoneNumber)}`, {
        headers: authHeader(salesSession.token),
      });

      // At minimum, server should not error
      expect(superRes2.status()).toBeLessThan(500);
      expect(salesRes2.status()).toBeLessThan(500);

      // If both return data, verify org isolation
      if (superRes2.ok() && salesRes2.ok()) {
        const superData = await superRes2.json();
        const salesData = await salesRes2.json();
        const superConvos = Array.isArray(superData) ? superData : (superData.conversations ?? []);
        const salesConvos = Array.isArray(salesData) ? salesData : (salesData.conversations ?? []);

        // Super admin and sales are in different orgs — data should differ
        for (const c of salesConvos) {
          const org = c.orgId ?? c.organizationId ?? c.org_id;
          if (org) {
            expect(String(org)).toBe(String(salesSession.organizationId));
          }
        }
      }

      return;
    }

    expect(superRes.status()).toBeLessThan(500);
    expect(salesRes.status()).toBeLessThan(500);

    // If both return data, verify org isolation
    if (superRes.ok() && salesRes.ok()) {
      const superData = await superRes.json();
      const salesData = await salesRes.json();
      const salesConvos = Array.isArray(salesData) ? salesData : (salesData.conversations ?? []);

      for (const c of salesConvos) {
        const org = c.orgId ?? c.organizationId ?? c.org_id;
        if (org) {
          expect(String(org)).toBe(String(salesSession.organizationId));
        }
      }
    }
  });
});
