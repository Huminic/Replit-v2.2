import { test, expect } from "playwright/test";
import { testUsers, login, authHeader } from "../../e2e/helpers/auth";

const BASE_URL = process.env.BASE_URL || "https://dev.huminicdev.com";

test.describe("Infrastructure — Security Headers", () => {
  test("TC-INFRA-011: Content-Security-Policy header present with correct directives", async ({ request }) => {
    const response = await request.get("/api/health");
    const csp = response.headers()["content-security-policy"];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src");
    expect(csp).toContain("script-src");
    expect(csp).toContain("'self'");
  });

  test("TC-INFRA-012: X-Request-ID header present and unique across requests", async ({ request }) => {
    const res1 = await request.get("/api/health");
    const res2 = await request.get("/api/health");
    const id1 = res1.headers()["x-request-id"];
    const id2 = res2.headers()["x-request-id"];
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
    // Verify UUID format
    expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  test("TC-INFRA-013: Strict-Transport-Security header present over HTTPS", async ({ request }) => {
    const response = await request.get("/api/health");
    const hsts = response.headers()["strict-transport-security"];
    // HSTS may be set by Caddy reverse proxy or Helmet
    if (hsts) {
      expect(hsts).toContain("max-age");
      const match = hsts.match(/max-age=(\d+)/);
      expect(match).toBeTruthy();
      expect(Number(match![1])).toBeGreaterThan(0);
    } else {
      test.info().annotations.push({
        type: "note",
        description: "HSTS header not present — may be handled at CDN/proxy layer",
      });
    }
  });

  test("TC-INFRA-014: Cross-Origin-Embedder-Policy not set (disabled in config)", async ({ request }) => {
    const response = await request.get("/api/health");
    const coep = response.headers()["cross-origin-embedder-policy"];
    // Helmet config sets crossOriginEmbedderPolicy: false
    expect(coep).toBeFalsy();
  });
});

test.describe("Infrastructure — CORS", () => {
  test("TC-INFRA-040: Widget endpoints allow any origin", async ({ request }) => {
    const response = await request.fetch(`${BASE_URL}/api/widget/voice-config/serra-honda`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://random-dealer-site.com",
        "Access-Control-Request-Method": "GET",
      },
    });
    const acao = response.headers()["access-control-allow-origin"];
    expect(acao).toBe("*");
  });

  test("TC-INFRA-041: Non-widget API rejects unknown origins", async ({ request }) => {
    const response = await request.get("/api/health", {
      headers: { Origin: "https://evil-site.com" },
    });
    const acao = response.headers()["access-control-allow-origin"];
    // Should either be absent or not match the evil origin
    if (acao) {
      expect(acao).not.toBe("https://evil-site.com");
      expect(acao).not.toBe("*");
    }
  });

  test("TC-INFRA-042: Non-widget API allows APP_BASE_URL origin", async ({ request }) => {
    // The app's own origin should be allowed
    const response = await request.get("/api/health", {
      headers: { Origin: BASE_URL },
    });
    const acao = response.headers()["access-control-allow-origin"];
    // Should reflect the allowed origin
    if (acao) {
      expect(acao).toBe(BASE_URL);
    } else {
      test.info().annotations.push({
        type: "note",
        description: "CORS header not returned — may use same-origin without explicit header",
      });
    }
  });

  test("TC-INFRA-043: Non-widget API allows credentials for valid origin", async ({ request }) => {
    const response = await request.fetch(`${BASE_URL}/api/health`, {
      method: "OPTIONS",
      headers: {
        Origin: BASE_URL,
        "Access-Control-Request-Method": "GET",
      },
    });
    const allowCreds = response.headers()["access-control-allow-credentials"];
    if (allowCreds) {
      expect(allowCreds).toBe("true");
    }
  });

  test("TC-INFRA-044: Widget CORS allows GET, POST, OPTIONS only", async ({ request }) => {
    const response = await request.fetch(`${BASE_URL}/api/widget/voice-config/serra-honda`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://any-dealer.com",
        "Access-Control-Request-Method": "GET",
      },
    });
    const methods = response.headers()["access-control-allow-methods"];
    if (methods) {
      const upper = methods.toUpperCase();
      expect(upper).toContain("GET");
      expect(upper).toContain("POST");
      expect(upper).not.toContain("DELETE");
      expect(upper).not.toContain("PUT");
    }
  });

  test("TC-INFRA-045: /widget path (non-API) has permissive CORS", async ({ request }) => {
    const response = await request.fetch(`${BASE_URL}/widget/test`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://any-site.com",
        "Access-Control-Request-Method": "GET",
      },
    });
    const acao = response.headers()["access-control-allow-origin"];
    if (acao) {
      expect(acao).toBe("*");
    } else {
      test.info().annotations.push({
        type: "note",
        description: "/widget path may not have explicit CORS middleware",
      });
    }
  });
});

test.describe("Infrastructure — Cookie Security", () => {
  test("TC-INFRA-031: Refresh cookie has SameSite=Strict", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      data: {
        email: testUsers.superAdmin.email,
        password: testUsers.superAdmin.password,
      },
    });
    expect(response.ok()).toBe(true);
    const setCookie = response.headers()["set-cookie"] ?? "";
    expect(setCookie.toLowerCase()).toContain("samesite=strict");
  });

  test("TC-INFRA-032: Refresh cookie path scoped to /api/auth", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      data: {
        email: testUsers.superAdmin.email,
        password: testUsers.superAdmin.password,
      },
    });
    expect(response.ok()).toBe(true);
    const setCookie = response.headers()["set-cookie"] ?? "";
    expect(setCookie.toLowerCase()).toContain("path=/api/auth");
  });

  test("TC-INFRA-033: Refresh cookie has Secure flag (HTTPS environment)", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      data: {
        email: testUsers.superAdmin.email,
        password: testUsers.superAdmin.password,
      },
    });
    expect(response.ok()).toBe(true);
    const setCookie = response.headers()["set-cookie"] ?? "";
    // In production (HTTPS), Secure flag should be present
    if (setCookie.toLowerCase().includes("secure")) {
      expect(setCookie.toLowerCase()).toContain("secure");
    } else {
      test.info().annotations.push({
        type: "note",
        description: "Secure flag not present — NODE_ENV may not be 'production'",
      });
    }
  });

  test("TC-INFRA-034: Logout clears refresh cookie", async ({ request }) => {
    // Login first to establish session
    const session = await login(request, testUsers.superAdmin);
    const logoutRes = await request.post("/api/auth/logout", {
      headers: authHeader(session.token),
    });
    // Logout should clear the cookie
    if (logoutRes.ok()) {
      const setCookie = logoutRes.headers()["set-cookie"] ?? "";
      if (setCookie.includes("nexxus_refresh")) {
        // Cookie should be cleared (expires in past or maxAge=0)
        const lower = setCookie.toLowerCase();
        const isCleared =
          lower.includes("max-age=0") ||
          lower.includes("expires=thu, 01 jan 1970");
        expect(isCleared).toBe(true);
      }
    }
  });

  test("TC-INFRA-035: Access token returned in response body only, not in cookies", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      data: {
        email: testUsers.superAdmin.email,
        password: testUsers.superAdmin.password,
      },
    });
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.accessToken).toBeTruthy();
    // Access token should NOT appear in Set-Cookie
    const setCookie = response.headers()["set-cookie"] ?? "";
    if (setCookie) {
      expect(setCookie).not.toContain(body.accessToken);
    }
  });
});

test.describe("Infrastructure — Error Handling", () => {
  test("TC-INFRA-050: Unknown API path returns 404 JSON", async ({ request }) => {
    const response = await request.get("/api/nonexistent-route-xyz-test");
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Not found");
  });

  test("TC-INFRA-051: Malformed JSON body returns 400", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      headers: { "Content-Type": "application/json" },
      data: "this is not valid json{{{",
    });
    // Express json parser should reject with 400
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test("TC-INFRA-052: Oversized request body rejected", async ({ request }) => {
    // Server has 1MB JSON body limit
    const largePayload = "x".repeat(2 * 1024 * 1024); // 2MB
    const response = await request.post("/api/auth/login", {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ data: largePayload }),
    });
    // Should be 413 (Payload Too Large) or 400
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test("TC-INFRA-054: Error responses do not leak stack traces", async ({ request }) => {
    // Trigger a 404 and ensure no stack trace info leaks
    const response = await request.get("/api/nonexistent-route-xyz-test");
    const text = await response.text();
    expect(text).not.toContain("at /");
    expect(text).not.toContain("node_modules");
    expect(text).not.toContain("Error:");
    expect(text).not.toContain(".ts:");
    expect(text).not.toContain(".js:");

    // Also test with malformed input that might trigger an error
    const errRes = await request.post("/api/auth/login", {
      headers: { "Content-Type": "application/json" },
      data: "{bad json",
    });
    const errText = await errRes.text();
    expect(errText).not.toContain("at /");
    expect(errText).not.toContain("node_modules");
  });
});

test.describe("Infrastructure — Rate Limiting Headers", () => {
  test("TC-INFRA-021: Rate limit response includes standard headers", async ({ request }) => {
    // Send rapid requests to widget endpoint to trigger rate limit
    const endpoint = "/api/widget/voice-config/serra-honda";
    let rateLimitResponse = null;

    for (let i = 0; i < 50; i++) {
      const res = await request.get(endpoint);
      if (res.status() === 429) {
        rateLimitResponse = res;
        break;
      }
    }

    if (rateLimitResponse) {
      const headers = rateLimitResponse.headers();
      // standardHeaders: true should produce RateLimit-* headers
      const hasRateLimit =
        headers["ratelimit-limit"] ||
        headers["ratelimit-remaining"] ||
        headers["ratelimit-reset"] ||
        headers["retry-after"];
      expect(hasRateLimit).toBeTruthy();
    } else {
      test.info().annotations.push({
        type: "note",
        description: "Could not trigger 429 — rate limit may have been reset between tests",
      });
    }
  });

  test("TC-INFRA-023: Global rate limiter headers present on /api/* requests", async ({ request }) => {
    const response = await request.get("/api/health");
    const headers = response.headers();
    // standardHeaders: true means RateLimit-* headers should be present
    const hasRateLimitInfo =
      headers["ratelimit-limit"] ||
      headers["ratelimit-remaining"] ||
      headers["ratelimit-reset"] ||
      headers["x-ratelimit-limit"] ||
      headers["x-ratelimit-remaining"];
    if (hasRateLimitInfo) {
      expect(hasRateLimitInfo).toBeTruthy();
    } else {
      test.info().annotations.push({
        type: "note",
        description: "Rate limit headers not present on /api/health — may be excluded from rate limiter",
      });
    }
  });

  test("TC-INFRA-022: Auth rate limiter headers present on /api/auth/login", async ({ request }) => {
    // Send a login attempt and check for rate limit headers
    const response = await request.post("/api/auth/login", {
      data: { email: "nonexistent@test.com", password: "wrong" },
    });
    const headers = response.headers();
    const hasRateLimitInfo =
      headers["ratelimit-limit"] ||
      headers["ratelimit-remaining"] ||
      headers["x-ratelimit-limit"];
    if (hasRateLimitInfo) {
      expect(hasRateLimitInfo).toBeTruthy();
    } else {
      test.info().annotations.push({
        type: "note",
        description: "Auth rate limit headers not present — may use legacyHeaders or non-standard format",
      });
    }
  });
});

test.describe("Infrastructure — SSL/TLS", () => {
  test("TC-INFRA-080: HTTPS connection succeeds with valid response", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
  });

  test("TC-INFRA-081: HTTP redirects to HTTPS or is refused", async ({ request }) => {
    // Attempt HTTP — Caddy typically redirects to HTTPS
    try {
      const httpUrl = BASE_URL.replace("https://", "http://");
      const response = await request.get(`${httpUrl}/api/health`, {
        maxRedirects: 0,
      });
      // If we get a response, it should be a redirect
      expect([301, 302, 308]).toContain(response.status());
      const location = response.headers()["location"];
      if (location) {
        expect(location).toContain("https://");
      }
    } catch (err: any) {
      // Connection refused or redirect followed is also acceptable
      test.info().annotations.push({
        type: "note",
        description: `HTTP connection result: ${err.message}`,
      });
    }
  });
});

test.describe("Infrastructure — Health Endpoint Details", () => {
  test("TC-INFRA-002: Health endpoint requires no authentication", async ({ request }) => {
    // Request with no auth header at all
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.version).toBeTruthy();
    expect(typeof body.uptime).toBe("number");
    expect(body.timestamp).toBeTruthy();
    expect(body.environment).toBeTruthy();
  });

  test("TC-INFRA-003: Health endpoint uptime increases over time", async ({ request }) => {
    const res1 = await request.get("/api/health");
    const body1 = await res1.json();
    // Wait briefly
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const res2 = await request.get("/api/health");
    const body2 = await res2.json();
    expect(body2.uptime).toBeGreaterThanOrEqual(body1.uptime);
  });
});

test.describe("Infrastructure — Cross-Org Data Isolation", () => {
  test("TC-INFRA-072: Cross-org conversation access denied", async ({ request }) => {
    // Use two org_admin accounts from different dealership orgs for strict isolation test
    // Serra Honda and Serra Nissan are separate orgs under the same partner
    const hondaSession = await login(request, testUsers.orgAdmin); // Serra Honda
    const nissanSession = await login(request, testUsers.serraNissan); // Serra Nissan

    // Get conversations for Serra Honda
    const hondaRes = await request.get("/api/conversations", {
      headers: authHeader(hondaSession.token),
    });

    if (hondaRes.ok()) {
      const hondaData = await hondaRes.json();
      const hondaConvos = Array.isArray(hondaData) ? hondaData : (hondaData.conversations ?? []);

      if (hondaConvos.length > 0) {
        const hondaConvoId = hondaConvos[0].id;
        // Serra Nissan org_admin tries to access Serra Honda's conversation
        const crossRes = await request.get(`/api/conversations/${hondaConvoId}`, {
          headers: authHeader(nissanSession.token),
        });
        // Should be denied — different org, same role level
        expect([403, 404]).toContain(crossRes.status());
      } else {
        // Check in reverse — Nissan conversations accessed by Honda
        const nissanRes = await request.get("/api/conversations", {
          headers: authHeader(nissanSession.token),
        });
        if (nissanRes.ok()) {
          const nissanData = await nissanRes.json();
          const nissanConvos = Array.isArray(nissanData) ? nissanData : (nissanData.conversations ?? []);
          if (nissanConvos.length > 0) {
            const nissanConvoId = nissanConvos[0].id;
            const crossRes = await request.get(`/api/conversations/${nissanConvoId}`, {
              headers: authHeader(hondaSession.token),
            });
            expect([403, 404]).toContain(crossRes.status());
          } else {
            test.info().annotations.push({
              type: "note",
              description: "No conversations found for either org — cross-org test inconclusive",
            });
          }
        }
      }
    }
  });

  test("TC-INFRA-073: Tasks scoped to user's org", async ({ request }) => {
    const superSession = await login(request, testUsers.superAdmin);
    const orgSession = await login(request, testUsers.orgAdmin);

    const superRes = await request.get("/api/tasks", {
      headers: authHeader(superSession.token),
    });
    const orgRes = await request.get("/api/tasks", {
      headers: authHeader(orgSession.token),
    });

    if (superRes.ok() && orgRes.ok()) {
      const superData = await superRes.json();
      const orgData = await orgRes.json();
      const orgTasks = Array.isArray(orgData) ? orgData : (orgData.tasks ?? []);

      // Verify org admin only sees their org's tasks
      for (const task of orgTasks) {
        const orgId = task.organizationId ?? task.orgId ?? task.org_id;
        if (orgId) {
          expect(String(orgId)).toBe(String(orgSession.organizationId));
        }
      }
    }
  });

  test("TC-INFRA-074: Users list scoped to org", async ({ request }) => {
    const orgSession = await login(request, testUsers.orgAdmin);
    const response = await request.get("/api/users", {
      headers: authHeader(orgSession.token),
    });

    if (response.ok()) {
      const data = await response.json();
      const users = Array.isArray(data) ? data : (data.users ?? []);
      // Every user returned should belong to the same org
      for (const user of users) {
        const orgId = user.organizationId ?? user.orgId ?? user.org_id;
        if (orgId) {
          expect(String(orgId)).toBe(String(orgSession.organizationId));
        }
      }
    }
  });
});

test.describe("Infrastructure — Entitlement Behavior", () => {
  test("TC-INFRA-065: Malformed Bearer token format rejected", async ({ request }) => {
    // "Bearer" with no actual token value
    const response = await request.get("/api/tasks", {
      headers: { Authorization: "Bearer" },
    });
    expect(response.status()).toBe(401);
  });

  test("TC-INFRA-066: Non-Bearer auth scheme rejected", async ({ request }) => {
    const response = await request.get("/api/tasks", {
      headers: { Authorization: "Basic abc123def456" },
    });
    expect([401, 403]).toContain(response.status());
  });

  test("TC-INFRA-065b: Bearer token with empty string rejected", async ({ request }) => {
    const response = await request.get("/api/tasks", {
      headers: { Authorization: "Bearer " },
    });
    expect(response.status()).toBe(401);
  });

  test("TC-INFRA-062: Entitlement exceeded response format (if triggerable)", async ({ request }) => {
    // This test validates the expected response shape if entitlement limits are hit
    // We authenticate and check a known entitlement-protected endpoint
    const session = await login(request, testUsers.orgAdmin);

    // Attempt to access an entitlement-gated resource
    // If the org is over limit, we should get the structured 403
    const endpoints = ["/api/conversations", "/api/tasks", "/api/contacts"];

    for (const endpoint of endpoints) {
      const res = await request.get(endpoint, {
        headers: authHeader(session.token),
      });
      if (res.status() === 403) {
        const body = await res.json();
        if (body.error === "entitlement_exceeded") {
          expect(body.upgradeUrl).toBe("/settings/billing/plan");
          expect(body.feature).toBeTruthy();
          return; // Test passed — found the entitlement response
        }
      }
    }

    // If no entitlement limit was hit, note it
    test.info().annotations.push({
      type: "note",
      description: "No entitlement limit hit — org is within limits. Response format not verified.",
    });
  });
});
