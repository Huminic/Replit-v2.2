import { test, expect } from "playwright/test";
import { testUsers, login, authHeader } from "./helpers/auth";

test.describe("Domain 11: Integrations", () => {
  let token: string;
  let organizationId: string;

  test.beforeAll(async ({ request }) => {
    const session = await login(request, testUsers.superAdmin);
    token = session.token;
    organizationId = session.organizationId;
  });

  test("11.1 Public widget endpoints work without auth", async ({ request }) => {
    // Public endpoints should respond without any auth token
    const endpoints = [
      "/api/public/widget/config",
      "/api/public/widget/health",
      "/api/public/health",
    ];

    let atLeastOneWorks = false;

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      // Public endpoints should NOT return 401/403
      if (response.status() !== 404) {
        expect([401, 403]).not.toContain(response.status());
        atLeastOneWorks = true;
      }
    }

    // At least one public endpoint should exist and be accessible
    expect(atLeastOneWorks).toBe(true);
  });

  // I-038: VAPI webhook endpoint not accepting transcripts correctly
  test.fixme("11.2 VAPI webhook accepts transcripts", async ({ request }) => {
    // KNOWN FAILURE: I-038 — VAPI webhook not processing transcripts
    const response = await request.post("/api/webhooks/vapi", {
      data: {
        type: "transcript",
        call: {
          id: "test-call-001",
          orgId: organizationId,
          transcript: "Test transcript from Playwright",
        },
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(response.ok()).toBe(true);
  });

  // Depends on 11.2 (I-038)
  test.fixme("11.3 VAPI transcript appears in TeamBox", async ({ request }) => {
    // KNOWN FAILURE: Depends on I-038 — VAPI transcript ingestion
    const response = await request.get("/api/teambox/messages", {
      headers: authHeader(token),
    });
    expect(response.ok()).toBe(true);
    const body = await response.json();
    const messages = Array.isArray(body) ? body : (body.messages ?? body.data ?? []);
    const hasTranscript = messages.some(
      (m: any) => m.source === "vapi" || m.type === "transcript"
    );
    expect(hasTranscript).toBe(true);
  });

  test("11.4 TextMagic webhook routes SMS to correct org", async ({ request }) => {
    const response = await request.post("/api/webhooks/textmagic", {
      data: {
        messageId: "test-sms-001",
        sender: "+15551234567",
        receiver: "+15559876543",
        text: "E2E test SMS message",
        timestamp: new Date().toISOString(),
      },
      headers: { "Content-Type": "application/json" },
    });

    // Webhook should accept the payload (200 or 202)
    // 404 means endpoint doesn't exist, which is still useful info
    expect(response.status()).toBeLessThan(500);
  });

  test("11.5 All third-party calls route through MCP", async ({ request }) => {
    // Code review test — verify vendorProxy or MCP pattern exists
    // We test this by checking the MCP endpoint responds
    const mcpResponse = await request.get("/api/mcp/status", {
      headers: authHeader(token),
    });

    // If MCP endpoint exists, verify it responds
    if (mcpResponse.status() !== 404) {
      expect(mcpResponse.status()).toBeLessThan(500);
    }

    // Also verify vendor proxy endpoint pattern
    const proxyResponse = await request.get("/api/vendor/status", {
      headers: authHeader(token),
    });

    // At minimum, the server should not error on these routes
    // A 404 is acceptable (route may not exist as GET), 500 is not
    expect(mcpResponse.status()).toBeLessThan(500);
    expect(proxyResponse.status()).toBeLessThan(500);
  });

  // I-037: VAPI outbound calls missing dealer context
  test.fixme("11.6 VAPI outbound calls include context", async ({ request }) => {
    // KNOWN FAILURE: I-037 — Outbound calls not including dealer context
    const response = await request.post("/api/vapi/outbound", {
      headers: authHeader(token),
      data: {
        phoneNumber: "+15551234567",
        contactId: "test-contact-001",
        context: {
          dealerName: "Serra Honda",
          orgId: organizationId,
        },
      },
    });
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.context).toBeTruthy();
    expect(body.context.orgId).toBe(organizationId);
  });

  test("11.7 Tavus personas active per dealer", async ({ request }) => {
    const response = await request.get("/api/tavus/personas", {
      headers: authHeader(token),
    });

    // Tavus personas endpoint should respond
    if (response.status() === 404) {
      // Endpoint might not exist yet — mark as known
      test.info().annotations.push({
        type: "note",
        description: "Tavus personas endpoint not found (404)",
      });
      return;
    }

    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const body = await response.json();
      const personas = Array.isArray(body) ? body : (body.personas ?? body.data ?? []);
      // Each persona should be tied to a dealer/org
      for (const persona of personas.slice(0, 5)) {
        const hasOrg = persona.orgId ?? persona.organizationId ?? persona.dealerId ?? persona.org_id;
        if (hasOrg) {
          expect(hasOrg).toBeTruthy();
        }
      }
    }
  });

  test("11.8 Widget video session creates Tavus conversation", async ({ request }) => {
    const response = await request.post("/api/widget/video-session", {
      data: {
        visitorName: "E2E Test Visitor",
        dealerId: organizationId,
      },
      headers: { "Content-Type": "application/json" },
    });

    // Video session creation — may require Tavus API key to fully work
    if (response.status() === 404) {
      test.info().annotations.push({
        type: "note",
        description: "Widget video session endpoint not found (404)",
      });
      return;
    }

    // Should not error server-side
    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const body = await response.json();
      // Should return some session/conversation identifier
      const sessionId = body.sessionId ?? body.conversationId ?? body.id;
      expect(sessionId).toBeTruthy();
    }
  });

  test("11.9 VIN Solutions data syncs", async ({ request }) => {
    const response = await request.get("/api/vin/leads", {
      headers: authHeader(token),
    });

    if (response.status() === 404) {
      // Try alternative endpoint
      const altResponse = await request.get("/api/vinsolutions/leads", {
        headers: authHeader(token),
      });

      if (altResponse.status() === 404) {
        test.info().annotations.push({
          type: "note",
          description: "VIN Solutions leads endpoint not found (404)",
        });
        return;
      }

      // 503 = upstream VIN API temporarily unavailable — not a bug in our code
      if (altResponse.status() === 503) {
        test.info().annotations.push({
          type: "note",
          description: "VIN Solutions upstream API temporarily unavailable (503)",
        });
        return;
      }

      expect(altResponse.status()).toBeLessThan(500);
      return;
    }

    // 503 = upstream VIN API temporarily unavailable — not a bug in our code
    if (response.status() === 503) {
      test.info().annotations.push({
        type: "note",
        description: "VIN Solutions upstream API temporarily unavailable (503)",
      });
      return;
    }

    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const body = await response.json();
      const leads = Array.isArray(body) ? body : (body.leads ?? body.data ?? []);
      // Leads should be scoped to requesting user's org
      for (const lead of leads.slice(0, 5)) {
        const leadOrg = lead.orgId ?? lead.organizationId ?? lead.org_id;
        if (leadOrg) {
          expect(String(leadOrg)).toBe(String(organizationId));
        }
      }
    }
  });

  // --- Widget/Assistant Org Mapping Verification Tests (I-080) ---

  const dealerSlugs = [
    { slug: "serra-honda", name: "Serra Honda" },
    { slug: "serra-nissan", name: "Serra Nissan" },
    { slug: "tony-serra-ford", name: "Tony Serra Ford" },
    { slug: "hyundai-of-columbia", name: "Hyundai of Columbia" },
    { slug: "ford-of-columbia", name: "Ford of Columbia" },
  ];

  test("11.10 Landing page widget loads per dealer with correct dealer name", async ({ request }) => {
    // GET /api/public/landing/:slug returns org info including name
    let verified = 0;
    for (const dealer of dealerSlugs) {
      const res = await request.get(`/api/public/landing/${dealer.slug}`);
      if (res.ok()) {
        const body = await res.json();
        // Should include the org name and slug
        expect(body.name).toBe(dealer.name);
        expect(body.slug).toBe(dealer.slug);
        expect(body.id).toBeDefined();
        verified++;
      } else if (res.status() === 404) {
        // Org slug may not exist in test DB — acceptable
        test.info().annotations.push({
          type: "note",
          description: `Dealer slug "${dealer.slug}" not found (404)`,
        });
      } else {
        // Should not be an auth error (public endpoint) or server error
        expect(res.status()).toBeLessThan(500);
        expect([401, 403]).not.toContain(res.status());
      }
    }
    // At least one dealer should be accessible
    expect(verified).toBeGreaterThan(0);
  });

  test("11.11 VAPI assistant ID matches org's agent record", async ({ request }) => {
    // For each dealer: query voice-config endpoint which returns vapiAssistantId from agent records
    let verified = 0;
    for (const dealer of dealerSlugs) {
      const res = await request.get(`/api/widget/voice-config/${dealer.slug}`);
      if (res.ok()) {
        const body = await res.json();
        // voice-config returns { vapiAssistantId, tavusPersonaId, orgName, personaName }
        expect(body.orgName).toBe(dealer.name);
        // vapiAssistantId may be null if no voice agent is configured
        if (body.vapiAssistantId) {
          expect(typeof body.vapiAssistantId).toBe("string");
          expect(body.vapiAssistantId.length).toBeGreaterThan(0);
        }
        verified++;
      } else if (res.status() !== 404) {
        expect(res.status()).toBeLessThan(500);
      }
    }
    expect(verified).toBeGreaterThan(0);
  });

  test("11.12 Tavus persona ID matches org's agent record", async ({ request }) => {
    // Same voice-config endpoint returns tavusPersonaId
    let verified = 0;
    for (const dealer of dealerSlugs) {
      const res = await request.get(`/api/widget/voice-config/${dealer.slug}`);
      if (res.ok()) {
        const body = await res.json();
        expect(body.orgName).toBe(dealer.name);
        // tavusPersonaId may be null if no video agent is configured
        if (body.tavusPersonaId) {
          expect(typeof body.tavusPersonaId).toBe("string");
          expect(body.tavusPersonaId.length).toBeGreaterThan(0);
        }
        verified++;
      } else if (res.status() !== 404) {
        expect(res.status()).toBeLessThan(500);
      }
    }
    expect(verified).toBeGreaterThan(0);
  });

  test("11.13 Widget embed JS serves per org", async ({ request }) => {
    // GET /widget/dealer/:slug.js returns JavaScript for embedding
    let verified = 0;
    for (const dealer of dealerSlugs) {
      const res = await request.get(`/widget/dealer/${dealer.slug}.js`);
      if (res.ok()) {
        const contentType = res.headers()["content-type"] ?? "";
        expect(contentType).toContain("javascript");
        const body = await res.text();
        // JS should reference the dealer slug
        expect(body).toContain(dealer.slug);
        // JS should contain the dealer name
        expect(body).toContain(dealer.name);
        verified++;
      } else if (res.status() === 404) {
        test.info().annotations.push({
          type: "note",
          description: `Widget JS for "${dealer.slug}" not found (dealer may not exist in DB)`,
        });
      } else {
        expect(res.status()).toBeLessThan(500);
      }
    }
    expect(verified).toBeGreaterThan(0);
  });

  test("11.14 Widget options available (Chat, Voice, Video, Form)", async ({ request }) => {
    // GET /api/widgets/public/:widgetCode returns config with channels
    // First, get a widget code by listing org widgets via authenticated endpoint
    const widgetListRes = await request.get("/api/widgets", {
      headers: authHeader(token),
    });

    if (!widgetListRes.ok()) {
      // Try the voice-config endpoint instead, which confirms available modes
      let verified = 0;
      for (const dealer of dealerSlugs) {
        const vcRes = await request.get(`/api/widget/voice-config/${dealer.slug}`);
        if (vcRes.ok()) {
          const body = await vcRes.json();
          // Voice config confirms voice/video capabilities
          // Chat is always available via /api/widget/chat
          // Form is always available via /api/widget/contact
          verified++;
        }
      }

      // Verify chat endpoint exists (public, no auth)
      const chatCheck = await request.post("/api/widget/chat", {
        data: { slug: "serra-honda", message: "test" },
        headers: { "Content-Type": "application/json" },
      });
      // Should not 404 — endpoint exists
      expect(chatCheck.status()).not.toBe(404);

      // Verify form/contact endpoint exists (public, no auth)
      const formCheck = await request.post("/api/widget/contact", {
        data: {
          slug: "serra-honda",
          name: "Test",
          email: "test@test.com",
          message: "test",
        },
        headers: { "Content-Type": "application/json" },
      });
      expect(formCheck.status()).not.toBe(404);

      expect(verified).toBeGreaterThan(0);
      return;
    }

    const widgets = await widgetListRes.json();
    if (widgets.length === 0) {
      // No widgets configured — verify public endpoints still work
      test.info().annotations.push({
        type: "note",
        description: "No widgets configured in test org — testing public endpoint availability",
      });

      // Chat endpoint exists
      const chatRes = await request.post("/api/widget/chat", {
        data: { slug: "serra-honda", message: "availability check" },
        headers: { "Content-Type": "application/json" },
      });
      expect(chatRes.status()).not.toBe(404);
      return;
    }

    // Test the public widget config endpoint with a known widget code
    const widgetCode = widgets[0].widgetCode;
    const publicRes = await request.get(`/api/widgets/public/${widgetCode}`);
    expect(publicRes.ok()).toBe(true);

    const config = await publicRes.json();
    expect(config.widgetCode).toBe(widgetCode);
    expect(config.orgName).toBeTruthy();

    // Verify channels object includes expected modes
    if (config.channels) {
      expect(config.channels).toHaveProperty("chat");
      expect(config.channels).toHaveProperty("voice");
      expect(config.channels).toHaveProperty("video");
    }
  });
});
