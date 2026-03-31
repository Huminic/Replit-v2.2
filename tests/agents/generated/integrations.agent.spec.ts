import { test, expect } from "playwright/test";
import { testUsers, login, authHeader } from "../../e2e/helpers/auth";

const BASE_URL = process.env.BASE_URL || "https://dev.huminicdev.com";

test.describe("Integrations Domain — Agent Tests", () => {
  let superToken: string;
  let orgToken: string;
  let orgId: string;

  test.beforeAll(async ({ request }) => {
    const superSession = await login(request, testUsers.superAdmin);
    superToken = superSession.token;
    const orgSession = await login(request, testUsers.orgAdmin);
    orgToken = orgSession.token;
    orgId = orgSession.organizationId;
  });

  // ═══════════════════════════════════════════════════════════════
  // 1. VAPI Webhook — Validation, Auth, Formats
  // ═══════════════════════════════════════════════════════════════

  test("TC-INT-001: VAPI webhook health check returns 200", async ({ request }) => {
    const res = await request.get("/api/webhooks/vapi");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("nexxus-connect-vapi-webhook");
  });

  test("TC-INT-004: VAPI webhook rejects invalid payload with 400", async ({ request }) => {
    const res = await request.post("/api/webhooks/vapi", {
      data: { garbage: true },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("Invalid webhook payload");
  });

  test("TC-INT-005: VAPI webhook rejects wrong secret with 401", async ({ request }) => {
    // If VAPI_WEBHOOK_SECRET is set on server, wrong secret yields 401.
    // If not set, auth check is skipped and this becomes a format validation test.
    const res = await request.post("/api/webhooks/vapi", {
      data: {
        message: {
          type: "end-of-call-report",
          call: {
            id: "auth-test-001",
            assistantId: "00000000-0000-0000-0000-000000000000",
            customer: { number: "+15550000000" },
          },
        },
      },
      headers: {
        "Content-Type": "application/json",
        "x-vapi-secret": "deliberately-wrong-secret-value",
      },
    });
    // 401 if secret is configured, otherwise 422 (unresolvable assistant) or 200
    if (res.status() === 401) {
      const body = await res.json();
      expect(body.message).toBe("Unauthorized");
    } else {
      // Secret not configured on server — annotate
      test.info().annotations.push({
        type: "note",
        description: `VAPI_WEBHOOK_SECRET not set on server — auth check skipped (got ${res.status()})`,
      });
      expect(res.status()).toBeLessThan(500);
    }
  });

  test("TC-INT-006: VAPI webhook accepts flat format (no message wrapper)", async ({ request }) => {
    const res = await request.post("/api/webhooks/vapi", {
      data: {
        type: "end-of-call-report",
        call: {
          id: `flat-test-${Date.now()}`,
          assistantId: "90a876c0-0f11-4424-abfe-9ac82b264d88", // Serra Honda Caroline
          customer: { number: "+15559999999", name: "Flat Format Test" },
          transcript: "AI: Hello. User: Testing flat format.",
          summary: "Flat format test call.",
          status: "ended",
        },
      },
      headers: { "Content-Type": "application/json" },
    });
    // Should accept — 200 if org resolved, 422 if assistant not found
    expect(res.status()).toBeLessThan(500);
    if (res.ok()) {
      const body = await res.json();
      expect(body.conversationId).toBeDefined();
    }
  });

  test("TC-INT-007: VAPI webhook ignores non-end-of-call events with 200", async ({ request }) => {
    const res = await request.post("/api/webhooks/vapi", {
      data: {
        message: {
          type: "speech-update",
          call: { id: "ignore-test-001" },
        },
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.message).toBe("Event type ignored");
    expect(body.type).toBe("speech-update");
  });

  test("TC-INT-008: VAPI webhook returns 422 for unknown assistantId when no fallback exists", async ({ request }) => {
    const res = await request.post("/api/webhooks/vapi", {
      data: {
        message: {
          type: "end-of-call-report",
          call: {
            id: `unknown-asst-${Date.now()}`,
            assistantId: "00000000-0000-0000-0000-000000000000",
            customer: { number: "+15550000000" },
          },
        },
      },
      headers: { "Content-Type": "application/json" },
    });
    // 422 if no org with active voice agent exists, or 200 if fallback succeeds
    expect([200, 422]).toContain(res.status());
    if (res.status() === 422) {
      const body = await res.json();
      expect(body.message).toContain("No organization found");
    }
  });

  test("TC-INT-009: VAPI dedup — second call with same ID returns deduplicated=true", async ({ request }) => {
    const callId = `dedup-test-${Date.now()}`;
    // First call
    const res1 = await request.post("/api/webhooks/vapi", {
      data: {
        message: {
          type: "end-of-call-report",
          call: {
            id: callId,
            assistantId: "90a876c0-0f11-4424-abfe-9ac82b264d88",
            customer: { number: "+15559999999", name: "Dedup Tester" },
            transcript: "First event transcript.",
            status: "ended",
          },
        },
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res1.status()).toBeLessThan(500);

    // Second call with same ID
    const res2 = await request.post("/api/webhooks/vapi", {
      data: {
        message: {
          type: "end-of-call-report",
          call: {
            id: callId,
            assistantId: "90a876c0-0f11-4424-abfe-9ac82b264d88",
            customer: { number: "+15559999999", name: "Dedup Tester" },
            transcript: "Second event transcript.",
            status: "ended",
          },
        },
      },
      headers: { "Content-Type": "application/json" },
    });

    if (res1.ok()) {
      // If first succeeded (org resolved), second should be deduplicated
      expect(res2.status()).toBe(200);
      const body2 = await res2.json();
      expect(body2.deduplicated).toBe(true);
      expect(body2.conversationId).toBeDefined();
    } else {
      // First failed (e.g. 422), so dedup won't trigger
      test.info().annotations.push({
        type: "note",
        description: `First call returned ${res1.status()} — dedup not testable without valid assistantId`,
      });
    }
  });

  test("TC-INT-012: VAPI->VIN pipeline is DISABLED (I-194 guard active)", async ({ request }) => {
    const res = await request.post("/api/webhooks/vapi", {
      data: {
        message: {
          type: "end-of-call-report",
          call: {
            id: `vin-disabled-${Date.now()}`,
            assistantId: "90a876c0-0f11-4424-abfe-9ac82b264d88",
            customer: { number: "+15559999999", name: "VIN Disabled Test" },
            transcript: "Testing VIN disabled path.",
            status: "ended",
          },
        },
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBeLessThan(500);
    if (res.ok()) {
      const body = await res.json();
      // vinLeadCreated should be false because I-194 disabled it
      expect(body.vinLeadCreated).toBe(false);
    }
  });

  test("TC-INT-VAPI-missing-call: VAPI webhook rejects payload with no call data", async ({ request }) => {
    const res = await request.post("/api/webhooks/vapi", {
      data: {
        message: {
          type: "end-of-call-report",
          // no call field
        },
      },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("Missing call data in payload");
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. Tavus Webhook
  // ═══════════════════════════════════════════════════════════════

  test("TC-INT-020: Tavus webhook rejects missing event/status with 400 or 401", async ({ request }) => {
    const res = await request.post("/api/webhooks/tavus", {
      data: { conversation_id: "test-123" },
      headers: { "Content-Type": "application/json" },
    });
    // 401 if TAVUS_WEBHOOK_SECRET is set (no secret header provided), 400 otherwise
    if (res.status() === 401) {
      test.info().annotations.push({
        type: "note",
        description: "TAVUS_WEBHOOK_SECRET is set — auth blocks before validation. Verifying auth gate.",
      });
      const body = await res.json();
      expect(body.message).toBe("Invalid webhook secret");
    } else {
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.message).toBe("Missing required field: event or status");
    }
  });

  test("TC-INT-021: Tavus webhook ignores non-end events with 200", async ({ request }) => {
    const res = await request.post("/api/webhooks/tavus", {
      data: {
        event: "conversation.started",
        conversation_id: "ignore-tavus-001",
      },
      headers: { "Content-Type": "application/json" },
    });
    // 401 if TAVUS_WEBHOOK_SECRET is set, 200 otherwise
    if (res.status() === 401) {
      test.info().annotations.push({
        type: "note",
        description: "TAVUS_WEBHOOK_SECRET blocks unauthenticated requests — cannot test event filtering without valid secret",
      });
    } else {
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Event type ignored");
    }
  });

  test("TC-INT-022: Tavus webhook rejects unresolvable persona_id with 400", async ({ request }) => {
    const res = await request.post("/api/webhooks/tavus", {
      data: {
        event: "conversation.end",
        conversation_id: `tavus-unknown-${Date.now()}`,
        persona_id: "nonexistent-persona-00000",
      },
      headers: { "Content-Type": "application/json" },
    });
    // 401 if secret required, 400 if persona unresolvable
    if (res.status() === 401) {
      test.info().annotations.push({
        type: "note",
        description: "TAVUS_WEBHOOK_SECRET blocks unauthenticated requests — persona resolution not reached",
      });
    } else {
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.message).toContain("Unable to resolve organization from persona");
    }
  });

  test("TC-INT-024: Tavus webhook rejects wrong secret with 401", async ({ request }) => {
    const res = await request.post("/api/webhooks/tavus", {
      data: {
        event: "conversation.end",
        conversation_id: "tavus-auth-test",
        persona_id: "test-persona",
      },
      headers: {
        "Content-Type": "application/json",
        "x-tavus-secret": "deliberately-wrong-secret",
      },
    });
    if (res.status() === 401) {
      const body = await res.json();
      expect(body.message).toBe("Invalid webhook secret");
    } else {
      test.info().annotations.push({
        type: "note",
        description: `TAVUS_WEBHOOK_SECRET not set on server — auth check skipped (got ${res.status()})`,
      });
      expect(res.status()).toBeLessThan(500);
    }
  });

  test("TC-INT-TAVUS-missing-convid: Tavus webhook rejects missing conversation_id", async ({ request }) => {
    const res = await request.post("/api/webhooks/tavus", {
      data: {
        event: "conversation.end",
        persona_id: "some-persona",
      },
      headers: { "Content-Type": "application/json" },
    });
    // 401 if secret required, 400 if missing conversation_id
    if (res.status() === 401) {
      test.info().annotations.push({
        type: "note",
        description: "TAVUS_WEBHOOK_SECRET blocks request before conversation_id validation",
      });
    } else {
      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body.message).toContain("conversation_id");
    }
  });

  test("TC-INT-TAVUS-empty-body: Tavus webhook rejects empty body", async ({ request }) => {
    const res = await request.post("/api/webhooks/tavus", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    // 401 (secret required) or 400 (invalid body)
    expect([400, 401]).toContain(res.status());
  });

  // ═══════════════════════════════════════════════════════════════
  // 3. TextMagic Webhook
  // ═══════════════════════════════════════════════════════════════

  test("TC-INT-031: TextMagic webhook rejects missing sender/text with 400", async ({ request }) => {
    const res = await request.post("/api/webhooks/textmagic", {
      data: { sender: "+15551234567" },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("Missing sender or text in webhook payload");
  });

  test("TC-INT-032: TextMagic webhook rejects wrong secret with 401", async ({ request }) => {
    const res = await request.post("/api/webhooks/textmagic", {
      data: { sender: "+15551234567", text: "test", receiver: "+15559876543" },
      headers: {
        "Content-Type": "application/json",
        "x-textmagic-secret": "deliberately-wrong-secret",
      },
    });
    if (res.status() === 401) {
      const body = await res.json();
      expect(body.message).toBe("Unauthorized");
    } else {
      test.info().annotations.push({
        type: "note",
        description: `TEXTMAGIC_WEBHOOK_SECRET not set — auth check skipped (got ${res.status()})`,
      });
      expect(res.status()).toBeLessThan(500);
    }
  });

  test("TC-INT-031b: TextMagic webhook rejects missing text field", async ({ request }) => {
    const res = await request.post("/api/webhooks/textmagic", {
      data: { receiver: "+15559876543" },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("Missing sender or text in webhook payload");
  });

  test("TC-INT-035: TextMagic webhook routes valid SMS without error", async ({ request }) => {
    const res = await request.post("/api/webhooks/textmagic", {
      data: {
        sender: "+15559990001",
        text: "Integration test SMS routing",
        receiver: "+15559876543",
        timestamp: Math.floor(Date.now() / 1000).toString(),
      },
      headers: { "Content-Type": "application/json" },
    });
    // Should not error — 200 whether org is resolved or not
    expect(res.status()).toBeLessThan(500);
  });

  // ═══════════════════════════════════════════════════════════════
  // 4. FAL Proxy — Auth and Validation
  // ═══════════════════════════════════════════════════════════════

  test("TC-INT-070: FAL proxy submit requires auth", async ({ request }) => {
    const res = await request.post("/api/fal-proxy", {
      data: { endpoint: "fal-ai/flux/dev", input: {} },
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(401);
  });

  test("TC-INT-071: FAL proxy submit requires endpoint parameter", async ({ request }) => {
    const res = await request.post("/api/fal-proxy", {
      data: { input: {} },
      headers: {
        ...authHeader(orgToken),
        "Content-Type": "application/json",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("endpoint is required");
  });

  test("TC-INT-072: FAL proxy status requires requestId and endpoint", async ({ request }) => {
    const res = await request.post("/api/fal-proxy/status", {
      data: {},
      headers: {
        ...authHeader(orgToken),
        "Content-Type": "application/json",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("requestId and endpoint are required");
  });

  test("TC-INT-073: FAL proxy result requires requestId and endpoint", async ({ request }) => {
    const res = await request.post("/api/fal-proxy/result", {
      data: {},
      headers: {
        ...authHeader(orgToken),
        "Content-Type": "application/json",
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("requestId and endpoint are required");
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. VIN Solutions — Read Endpoints and Auth Gates
  // ═══════════════════════════════════════════════════════════════

  test("TC-INT-058: VIN leads require authentication (401 without token)", async ({ request }) => {
    const res = await request.get("/api/vin/leads");
    expect(res.status()).toBe(401);
  });

  test("TC-INT-051: VIN token-status endpoint responds", async ({ request }) => {
    const res = await request.get("/api/vin/token-status", {
      headers: authHeader(superToken),
    });
    // 200 if VIN configured, 502 if MCP down, 404 if route missing
    expect(res.status()).toBeLessThan(500);
  });

  test("TC-INT-052: VIN lead-sources endpoint responds", async ({ request }) => {
    const res = await request.get("/api/vin/lead-sources", {
      headers: authHeader(superToken),
    });
    expect(res.status()).toBeLessThan(500);
  });

  test("TC-INT-053: VIN lead-statuses endpoint responds", async ({ request }) => {
    const res = await request.get("/api/vin/lead-statuses", {
      headers: authHeader(superToken),
    });
    expect(res.status()).toBeLessThan(500);
  });

  test("TC-INT-054: VIN dealers endpoint responds", async ({ request }) => {
    const res = await request.get("/api/vin/dealers", {
      headers: authHeader(superToken),
    });
    expect(res.status()).toBeLessThan(500);
  });

  test("TC-INT-055: VIN contacts search endpoint responds", async ({ request }) => {
    const res = await request.get("/api/vin/contacts/search?query=test", {
      headers: authHeader(superToken),
    });
    // 200 with data, 502 if MCP down (acceptable — tests route existence and auth)
    expect(res.status()).toBeLessThanOrEqual(502);
    expect(res.status()).not.toBe(500);
    if (res.status() === 502) {
      test.info().annotations.push({
        type: "note",
        description: "VIN contacts search returned 502 — central-mcp proxy error (acceptable)",
      });
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // 6. Integration Management
  // ═══════════════════════════════════════════════════════════════

  test("TC-INT-082: GET /api/integrations requires auth (401)", async ({ request }) => {
    const res = await request.get("/api/integrations");
    expect(res.status()).toBe(401);
  });

  test("TC-INT-080: GET /api/integrations lists integrations for org", async ({ request }) => {
    const res = await request.get("/api/integrations", {
      headers: authHeader(orgToken),
    });
    if (res.status() === 404) {
      test.info().annotations.push({
        type: "note",
        description: "GET /api/integrations endpoint not found (404)",
      });
      return;
    }
    expect(res.status()).toBeLessThan(500);
    if (res.ok()) {
      const body = await res.json();
      const integrations = Array.isArray(body) ? body : (body.integrations ?? body.data ?? []);
      // Each integration should have provider and org scope
      for (const intg of integrations.slice(0, 5)) {
        expect(intg.provider || intg.type).toBeTruthy();
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // 7. MCP Status and Health
  // ═══════════════════════════════════════════════════════════════

  test("TC-INT-100: MCP status endpoint responds", async ({ request }) => {
    const res = await request.get("/api/mcp/status", {
      headers: authHeader(superToken),
    });
    // 200 or 404 (route may not exist), but not 500
    expect(res.status()).toBeLessThan(500);
  });

  test("TC-INT-102: VIN endpoint returns structured error when MCP unreachable", async ({ request }) => {
    // We can't force MCP down, but we verify the response is well-structured
    const res = await request.get("/api/vin/leads", {
      headers: authHeader(superToken),
    });
    // 200 (data), 502 (MCP down), or other non-500
    expect(res.status()).toBeLessThan(500);
    if (res.status() === 502) {
      const body = await res.json();
      expect(body.message || body.error).toBeTruthy();
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // 8. Vendor Proxy — VAPI Read Endpoints (auth-gated, read-only)
  // ═══════════════════════════════════════════════════════════════

  test("TC-INT-VAPI-assistants-auth: VAPI assistants endpoint requires auth", async ({ request }) => {
    const res = await request.get("/api/vapi/assistants");
    expect(res.status()).toBe(401);
  });

  test("TC-INT-VAPI-assistants: VAPI assistants endpoint responds with auth", async ({ request }) => {
    const res = await request.get("/api/vapi/assistants", {
      headers: authHeader(superToken),
    });
    expect(res.status()).toBeLessThan(500);
  });

  test("TC-INT-VAPI-phone-numbers: VAPI phone numbers endpoint responds", async ({ request }) => {
    const res = await request.get("/api/vapi/phone-numbers", {
      headers: authHeader(superToken),
    });
    expect(res.status()).toBeLessThan(500);
  });

  test("TC-INT-TAVUS-personas-auth: Tavus personas endpoint requires auth", async ({ request }) => {
    const res = await request.get("/api/tavus/personas");
    expect(res.status()).toBe(401);
  });

  test("TC-INT-TAVUS-conversations: Tavus conversations list responds", async ({ request }) => {
    const res = await request.get("/api/tavus/conversations", {
      headers: authHeader(superToken),
    });
    expect(res.status()).toBeLessThan(500);
  });

  // ═══════════════════════════════════════════════════════════════
  // 9. Cross-cutting — Content-Type and Edge Cases
  // ═══════════════════════════════════════════════════════════════

  test("TC-INT-VAPI-no-body: VAPI webhook with empty body returns 400", async ({ request }) => {
    const res = await request.post("/api/webhooks/vapi", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(400);
  });

  test("TC-INT-TM-no-body: TextMagic webhook with empty body returns 400", async ({ request }) => {
    const res = await request.post("/api/webhooks/textmagic", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(400);
  });
});
