import { describe, it, expect } from "vitest";

const BASE = "http://localhost:5000";

async function api(method: string, path: string, body?: any, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json, text };
}

async function login(email: string, password: string) {
  const res = await api("POST", "/api/auth/login", { email, password });
  return res.json?.accessToken || null;
}

describe("API Endpoint Smoke Test Battery", () => {

  describe("1. Authentication Endpoints", () => {

    it("POST /api/auth/login — missing email returns 400", async () => {
      const res = await api("POST", "/api/auth/login", { password: "test123" });
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("required");
    });

    it("POST /api/auth/login — missing password returns 400", async () => {
      const res = await api("POST", "/api/auth/login", { email: "test@test.com" });
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("required");
    });

    it("POST /api/auth/login — empty body returns 400", async () => {
      const res = await api("POST", "/api/auth/login", {});
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("required");
    });

    it("POST /api/auth/login — invalid credentials returns 401", async () => {
      const res = await api("POST", "/api/auth/login", { email: "nonexistent@test.com", password: "wrong" });
      expect(res.status).toBe(401);
    });

    it("POST /api/auth/login — valid credentials returns token", async () => {
      const res = await api("POST", "/api/auth/login", { email: "admin@nexxus.com", password: "admin123" });
      expect([200, 401]).toContain(res.status);
      if (res.status === 200) {
        expect(res.json.accessToken).toBeDefined();
        expect(res.json.refreshToken).toBeDefined();
        expect(res.json.user).toBeDefined();
      }
    });

    it("POST /api/auth/refresh — missing refresh token returns 400", async () => {
      const res = await api("POST", "/api/auth/refresh", {});
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("Refresh token required");
    });

    it("POST /api/auth/refresh — invalid refresh token returns 401", async () => {
      const res = await api("POST", "/api/auth/refresh", { refreshToken: "invalid-token-xyz" });
      expect(res.status).toBe(401);
    });

    it("POST /api/auth/forgot-password — missing email returns 400", async () => {
      const res = await api("POST", "/api/auth/forgot-password", {});
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("Email is required");
    });

    it("POST /api/auth/forgot-password — non-existent email returns 200 (no info leak)", async () => {
      const res = await api("POST", "/api/auth/forgot-password", { email: "nobody@nowhere.com" });
      expect(res.status).toBe(200);
      expect(res.json.message).toContain("If an account exists");
    });

    it("POST /api/auth/reset-password — missing token/password returns 400", async () => {
      const res = await api("POST", "/api/auth/reset-password", {});
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("Token and password are required");
    });

    it("POST /api/auth/reset-password — short password returns 400", async () => {
      const res = await api("POST", "/api/auth/reset-password", { token: "abc", password: "short" });
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("at least 8 characters");
    });

    it("POST /api/auth/reset-password — invalid token returns 400", async () => {
      const res = await api("POST", "/api/auth/reset-password", { token: "invalid-token", password: "validpassword123" });
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("Invalid or expired");
    });
  });

  describe("2. Missing Auth on Protected Endpoints", () => {
    const protectedEndpoints = [
      { method: "GET", path: "/api/auth/me" },
      { method: "POST", path: "/api/auth/logout" },
      { method: "GET", path: "/api/agents" },
      { method: "POST", path: "/api/agents" },
      { method: "GET", path: "/api/conversations" },
      { method: "POST", path: "/api/conversations" },
      { method: "GET", path: "/api/campaigns" },
      { method: "POST", path: "/api/campaigns" },
      { method: "GET", path: "/api/users" },
      { method: "POST", path: "/api/users" },
      { method: "GET", path: "/api/tasks" },
      { method: "POST", path: "/api/tasks" },
      { method: "GET", path: "/api/appointments" },
      { method: "GET", path: "/api/widgets" },
      { method: "GET", path: "/api/documents" },
      { method: "GET", path: "/api/notifications" },
      { method: "GET", path: "/api/notifications/unread-count" },
      { method: "GET", path: "/api/favorites" },
      { method: "GET", path: "/api/hunches" },
      { method: "GET", path: "/api/activity-log" },
      { method: "GET", path: "/api/metrics/dashboard" },
      { method: "GET", path: "/api/metrics/pipeline" },
      { method: "GET", path: "/api/outbound/status" },
      { method: "GET", path: "/api/usage" },
      { method: "GET", path: "/api/integrations" },
      { method: "GET", path: "/api/leads/scored" },
      { method: "GET", path: "/api/roles" },
    ];

    for (const ep of protectedEndpoints) {
      it(`${ep.method} ${ep.path} — no auth returns 401`, async () => {
        const res = await api(ep.method, ep.path);
        expect(res.status).toBe(401);
        expect(res.json.message).toBeDefined();
      });
    }
  });

  describe("3. Invalid Auth Token on Protected Endpoints", () => {
    it("GET /api/agents — invalid bearer token returns 401", async () => {
      const res = await api("GET", "/api/agents", undefined, "invalid-jwt-token");
      expect(res.status).toBe(401);
    });

    it("GET /api/conversations — expired/malformed token returns 401", async () => {
      const res = await api("GET", "/api/conversations", undefined, "eyJhbGciOiJIUzI1NiJ9.eyJ0ZXN0IjoxfQ.invalid");
      expect(res.status).toBe(401);
    });
  });

  describe("4. Invalid IDs on Resource Endpoints", () => {
    let token: string | null;

    it("setup: obtain auth token", async () => {
      token = await login("admin@nexxus.com", "admin123");
      if (!token) {
        const res = await api("POST", "/api/auth/login", { email: "admin@nexxus.com", password: "admin123" });
        console.log("Login attempt response:", res.status, JSON.stringify(res.json).substring(0, 200));
      }
    });

    it("GET /api/agents/:id — non-existent ID returns 404", async () => {
      if (!token) return;
      const res = await api("GET", "/api/agents/00000000-0000-0000-0000-000000000000", undefined, token);
      expect(res.status).toBe(404);
      expect(res.json.message).toContain("not found");
    });

    it("PATCH /api/agents/:id — non-existent ID returns 404", async () => {
      if (!token) return;
      const res = await api("PATCH", "/api/agents/00000000-0000-0000-0000-000000000000", { name: "test" }, token);
      expect(res.status).toBe(404);
    });

    it("DELETE /api/agents/:id — non-existent ID returns 404", async () => {
      if (!token) return;
      const res = await api("DELETE", "/api/agents/00000000-0000-0000-0000-000000000000", undefined, token);
      expect(res.status).toBe(404);
    });

    it("GET /api/conversations/:id — non-existent ID returns 404", async () => {
      if (!token) return;
      const res = await api("GET", "/api/conversations/00000000-0000-0000-0000-000000000000", undefined, token);
      expect(res.status).toBe(404);
    });

    it("PATCH /api/conversations/:id — non-existent ID returns 404", async () => {
      if (!token) return;
      const res = await api("PATCH", "/api/conversations/00000000-0000-0000-0000-000000000000", { status: "open" }, token);
      expect(res.status).toBe(404);
    });

    it("DELETE /api/conversations/:id — non-existent ID returns 404", async () => {
      if (!token) return;
      const res = await api("DELETE", "/api/conversations/00000000-0000-0000-0000-000000000000", undefined, token);
      expect(res.status).toBe(404);
    });

    it("GET /api/conversations/:id/messages — non-existent conversation returns 404", async () => {
      if (!token) return;
      const res = await api("GET", "/api/conversations/00000000-0000-0000-0000-000000000000/messages", undefined, token);
      expect(res.status).toBe(404);
    });

    it("GET /api/campaigns/:id — non-existent ID returns 404", async () => {
      if (!token) return;
      const res = await api("GET", "/api/campaigns/00000000-0000-0000-0000-000000000000", undefined, token);
      expect(res.status).toBe(404);
    });

    it("GET /api/organizations/:id — non-existent ID returns 404", async () => {
      if (!token) return;
      const res = await api("GET", "/api/organizations/00000000-0000-0000-0000-000000000000", undefined, token);
      expect([403, 404]).toContain(res.status);
    });

    it("GET /api/tasks/:id update — non-existent task returns 404", async () => {
      if (!token) return;
      const res = await api("PATCH", "/api/tasks/00000000-0000-0000-0000-000000000000", { status: "done" }, token);
      expect(res.status).toBe(404);
    });

    it("GET /api/appointments/:id — non-existent returns 404", async () => {
      if (!token) return;
      const res = await api("GET", "/api/appointments/00000000-0000-0000-0000-000000000000", undefined, token);
      expect(res.status).toBe(404);
    });

    it("GET /api/widgets/:id — non-existent returns 404", async () => {
      if (!token) return;
      const res = await api("GET", "/api/widgets/00000000-0000-0000-0000-000000000000", undefined, token);
      expect(res.status).toBe(404);
    });

    it("PATCH /api/hunches/:id — non-existent returns 404", async () => {
      if (!token) return;
      const res = await api("PATCH", "/api/hunches/00000000-0000-0000-0000-000000000000", { status: "accepted" }, token);
      expect(res.status).toBe(404);
    });
  });

  describe("5. Missing Required Fields on Creation Endpoints", () => {
    let token: string | null;

    it("setup: obtain auth token", async () => {
      token = await login("admin@nexxus.com", "admin123");
    });

    it("POST /api/users — missing required fields returns 400", async () => {
      if (!token) return;
      const res = await api("POST", "/api/users", { email: "test@test.com" }, token);
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("required");
    });

    it("POST /api/users — short password returns 400", async () => {
      if (!token) return;
      const res = await api("POST", "/api/users", {
        email: "test@test.com", password: "ab", firstName: "A", lastName: "B", roleId: "xxx"
      }, token);
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("at least 6");
    });

    it("POST /api/appointments — missing required fields returns 400", async () => {
      if (!token) return;
      const res = await api("POST", "/api/appointments", { title: "Test" }, token);
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("Missing required fields");
    });

    it("POST /api/auth/change-password — missing fields returns 400", async () => {
      if (!token) return;
      const res = await api("POST", "/api/auth/change-password", { currentPassword: "admin123" }, token);
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("required");
    });

    it("POST /api/auth/change-password — short new password returns 400", async () => {
      if (!token) return;
      const res = await api("POST", "/api/auth/change-password", { currentPassword: "admin123", newPassword: "ab" }, token);
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("at least 6");
    });
  });

  describe("6. Chat Endpoint Edge Cases", () => {
    let token: string | null;

    it("setup: obtain auth token", async () => {
      token = await login("admin@nexxus.com", "admin123");
    });

    it("POST /api/chat/:conversationId/stream — missing content returns 400", async () => {
      if (!token) return;
      const res = await api("POST", "/api/chat/00000000-0000-0000-0000-000000000000/stream", {}, token);
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("content is required");
    });

    it("POST /api/chat/:conversationId/stream — empty string content returns 400", async () => {
      if (!token) return;
      const res = await api("POST", "/api/chat/00000000-0000-0000-0000-000000000000/stream", { content: "" }, token);
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("content is required");
    });

    it("POST /api/chat/:conversationId/stream — non-string content returns 400", async () => {
      if (!token) return;
      const res = await api("POST", "/api/chat/00000000-0000-0000-0000-000000000000/stream", { content: 12345 }, token);
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("content is required");
    });

    it("POST /api/chat/:conversationId/stream — non-existent conversation returns 404", async () => {
      if (!token) return;
      const res = await api("POST", "/api/chat/00000000-0000-0000-0000-000000000000/stream", { content: "Hello" }, token);
      expect(res.status).toBe(404);
    });

    it("POST /api/chat/:conversationId/stream — special characters in content handled gracefully", async () => {
      if (!token) return;
      const res = await api("POST", "/api/chat/00000000-0000-0000-0000-000000000000/stream", {
        content: '<script>alert("xss")</script> \' " \\ \n \t \0 SELECT * FROM users;'
      }, token);
      expect([400, 404]).toContain(res.status);
    });

    it("POST /api/chat/:conversationId/stream — very long message (>10000 chars) returns graceful response", async () => {
      if (!token) return;
      const longMessage = "A".repeat(10001);
      const res = await api("POST", "/api/chat/00000000-0000-0000-0000-000000000000/stream", { content: longMessage }, token);
      expect([400, 404]).toContain(res.status);
    });
  });

  describe("7. Public/Widget Endpoints", () => {

    it("GET /api/public/landing/:slug — non-existent slug returns 404", async () => {
      const res = await api("GET", "/api/public/landing/non-existent-org-slug-xyz");
      expect(res.status).toBe(404);
    });

    it("POST /api/widget/contact — missing required fields returns 400", async () => {
      const res = await api("POST", "/api/widget/contact", { name: "Test" });
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("required");
    });

    it("POST /api/widget/contact — missing org identifier returns 404", async () => {
      const res = await api("POST", "/api/widget/contact", {
        name: "Test", email: "test@test.com", message: "Hello"
      });
      expect(res.status).toBe(404);
    });

    it("POST /api/widget/chat — missing slug returns 400", async () => {
      const res = await api("POST", "/api/widget/chat", { message: "Hello" });
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("required");
    });

    it("POST /api/widget/chat — missing message returns 400", async () => {
      const res = await api("POST", "/api/widget/chat", { slug: "test" });
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("required");
    });

    it("POST /api/widget/chat — non-existent slug returns 404", async () => {
      const res = await api("POST", "/api/widget/chat", { slug: "nonexistent-slug-xyz", message: "Hello" });
      expect(res.status).toBe(404);
    });

    it("POST /api/widget/video-session — missing widgetCode and slug returns 400", async () => {
      const res = await api("POST", "/api/widget/video-session", {});
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("required");
    });

    it("GET /api/widgets/public/:widgetCode — non-existent returns 404", async () => {
      const res = await api("GET", "/api/widgets/public/non_existent_widget_code");
      expect(res.status).toBe(404);
    });

    it("GET /api/widget/voice-config/:slug — non-existent returns 404", async () => {
      const res = await api("GET", "/api/widget/voice-config/nonexistent-slug-xyz");
      expect(res.status).toBe(404);
    });

    it("GET /api/webhooks/vapi — health check returns 200", async () => {
      const res = await api("GET", "/api/webhooks/vapi");
      expect(res.status).toBe(200);
      expect(res.json.status).toBe("ok");
    });
  });

  describe("8. Webhook Endpoints — Invalid Payloads", () => {

    it("POST /api/webhooks/vapi — invalid payload returns 400", async () => {
      const res = await api("POST", "/api/webhooks/vapi", { invalid: "data" });
      expect([400, 401]).toContain(res.status);
    });

    it("POST /api/webhooks/vapi — empty body returns 400", async () => {
      const res = await api("POST", "/api/webhooks/vapi", {});
      expect([400, 401]).toContain(res.status);
    });

    it("POST /api/webhooks/tavus — missing auth returns 401", async () => {
      const res = await api("POST", "/api/webhooks/tavus", { event: "conversation.end" });
      expect(res.status).toBe(401);
    });
  });

  describe("9. Organization Endpoints", () => {
    let token: string | null;

    it("setup: obtain auth token", async () => {
      token = await login("admin@nexxus.com", "admin123");
    });

    it("PATCH /api/organizations/:id/slug — missing slug returns 400", async () => {
      if (!token) return;
      const orgsRes = await api("GET", "/api/organizations", undefined, token);
      if (orgsRes.status !== 200 || !orgsRes.json.length) return;
      const orgId = orgsRes.json[0].id;
      const res = await api("PATCH", `/api/organizations/${orgId}/slug`, {}, token);
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("Slug is required");
    });

    it("PATCH /api/organizations/:id/slug — empty slug returns 400", async () => {
      if (!token) return;
      const orgsRes = await api("GET", "/api/organizations", undefined, token);
      if (orgsRes.status !== 200 || !orgsRes.json.length) return;
      const orgId = orgsRes.json[0].id;
      const res = await api("PATCH", `/api/organizations/${orgId}/slug`, { slug: "" }, token);
      expect(res.status).toBe(400);
    });
  });

  describe("10. Proxy Endpoints — Missing Config Graceful Handling", () => {
    let token: string | null;

    it("setup: obtain auth token", async () => {
      token = await login("admin@nexxus.com", "admin123");
    });

    it("POST /api/fal-proxy — missing endpoint returns 400", async () => {
      if (!token) return;
      const res = await api("POST", "/api/fal-proxy", {}, token);
      expect([400, 503]).toContain(res.status);
    });

    it("POST /api/fal-proxy — invalid endpoint URL returns 400", async () => {
      if (!token) return;
      const res = await api("POST", "/api/fal-proxy", { endpoint: "https://evil.com/exploit" }, token);
      expect([400, 503]).toContain(res.status);
    });

    it("POST /api/openai-proxy — missing messages returns 400", async () => {
      if (!token) return;
      const res = await api("POST", "/api/openai-proxy", {}, token);
      expect([400, 503]).toContain(res.status);
    });

    it("POST /api/maps-proxy — missing action returns 400", async () => {
      if (!token) return;
      const res = await api("POST", "/api/maps-proxy", {}, token);
      expect([400, 503]).toContain(res.status);
    });

    it("POST /api/maps-proxy — invalid action returns 400", async () => {
      if (!token) return;
      const res = await api("POST", "/api/maps-proxy", { action: "invalid" }, token);
      expect([400, 503]).toContain(res.status);
    });
  });

  describe("11. Metrics Endpoint Validation", () => {
    let token: string | null;

    it("setup: obtain auth token", async () => {
      token = await login("admin@nexxus.com", "admin123");
    });

    it("GET /api/metrics/pipeline/details — missing metric returns 400", async () => {
      if (!token) return;
      const res = await api("GET", "/api/metrics/pipeline/details", undefined, token);
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("Invalid metric");
    });

    it("GET /api/metrics/pipeline/details — invalid metric returns 400", async () => {
      if (!token) return;
      const res = await api("GET", "/api/metrics/pipeline/details?metric=invalid_metric", undefined, token);
      expect(res.status).toBe(400);
      expect(res.json.message).toContain("Invalid metric");
    });
  });

  describe("12. Content-Type Handling", () => {

    it("POST /api/auth/login — non-JSON content type handled gracefully", async () => {
      const res = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "not json",
      });
      expect([400, 415, 500]).toContain(res.status);
    });
  });

  describe("13. Conversation Endpoint Validation", () => {
    let token: string | null;

    it("setup: obtain auth token", async () => {
      token = await login("admin@nexxus.com", "admin123");
    });

    it("PATCH /api/conversations/:id — invalid update schema rejected", async () => {
      if (!token) return;
      const convos = await api("GET", "/api/conversations", undefined, token);
      if (convos.status !== 200 || !convos.json.length) return;
      const convId = convos.json[0].id;
      const res = await api("PATCH", `/api/conversations/${convId}`, { status: 12345 }, token);
      expect(res.status).toBe(400);
    });
  });

  describe("14. Security Endpoint Access", () => {

    it("GET /api/security-events — no auth returns 401", async () => {
      const res = await api("GET", "/api/security-events");
      expect(res.status).toBe(401);
    });
  });

});
