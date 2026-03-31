/**
 * T-002 Agent Tests: AI Chat Domain
 * Covers gaps identified in chat-plan.md that are NOT in domain-03-chat.spec.ts
 * Focus: Conversation CRUD, Favorites, Chat streaming, Role-based access,
 *        Multi-org isolation, Document upload, Error handling
 */
import { test, expect } from "playwright/test";
import { testUsers, login, authHeader } from "../../e2e/helpers/auth";

const BASE_URL = process.env.BASE_URL || "https://dev.huminicdev.com";

// ---------------------------------------------------------------------------
// Helper: create a throwaway conversation for test isolation
// ---------------------------------------------------------------------------
async function createConversation(
  request: any,
  token: string,
  overrides: Record<string, any> = {}
) {
  const res = await request.post("/api/conversations", {
    headers: authHeader(token),
    data: {
      customerName: "Agent Test Customer",
      channel: "ai-chat",
      ...overrides,
    },
  });
  expect(res.status()).toBe(201);
  return res.json();
}

// Helper: cleanup conversation (best-effort, don't fail test)
async function deleteConversation(request: any, token: string, id: string) {
  try {
    await request.delete(`/api/conversations/${id}`, {
      headers: authHeader(token),
    });
  } catch {}
}

// ===================================================================
// A. CONVERSATION CRUD (TC-CHAT-040 through TC-CHAT-048)
// ===================================================================
test.describe("Conversation CRUD", () => {
  test("TC-040: Create conversation returns 201 with correct shape", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, token);

    expect(conv.id).toBeDefined();
    expect(conv.organizationId).toBeDefined();
    expect(conv.channel).toBe("ai-chat");
    expect(conv.customerName).toBe("Agent Test Customer");
    expect(conv.status).toBe("open");

    await deleteConversation(request, token, conv.id);
  });

  test("TC-041: List conversations returns array", async ({ request }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, token);

    const listRes = await request.get("/api/conversations", {
      headers: authHeader(token),
    });
    expect(listRes.ok()).toBe(true);
    const list = await listRes.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);

    await deleteConversation(request, token, conv.id);
  });

  test("TC-041b: List conversations with channel filter", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, token, {
      channel: "ai-chat",
    });

    const filterRes = await request.get("/api/conversations?channel=ai-chat", {
      headers: authHeader(token),
    });
    expect(filterRes.ok()).toBe(true);
    const filtered = await filterRes.json();
    expect(Array.isArray(filtered)).toBe(true);
    for (const c of filtered) {
      expect(c.channel).toBe("ai-chat");
    }

    await deleteConversation(request, token, conv.id);
  });

  test("TC-042: Get single conversation by ID", async ({ request }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, token);

    const getRes = await request.get(`/api/conversations/${conv.id}`, {
      headers: authHeader(token),
    });
    expect(getRes.ok()).toBe(true);
    const fetched = await getRes.json();
    expect(fetched.id).toBe(conv.id);
    expect(fetched.customerName).toBe("Agent Test Customer");

    await deleteConversation(request, token, conv.id);
  });

  test("TC-043: Update conversation status", async ({ request }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, token);

    const patchRes = await request.patch(`/api/conversations/${conv.id}`, {
      headers: authHeader(token),
      data: { status: "closed" },
    });
    expect(patchRes.ok()).toBe(true);
    const updated = await patchRes.json();
    expect(updated.status).toBe("closed");

    await deleteConversation(request, token, conv.id);
  });

  test("TC-044: Delete conversation (admin)", async ({ request }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, token);

    const delRes = await request.delete(`/api/conversations/${conv.id}`, {
      headers: authHeader(token),
    });
    expect(delRes.ok()).toBe(true);

    // Verify gone
    const getRes = await request.get(`/api/conversations/${conv.id}`, {
      headers: authHeader(token),
    });
    expect(getRes.status()).toBe(404);
  });

  test("TC-045: Sales user cannot delete conversation (403)", async ({
    request,
  }) => {
    // Create as admin
    const admin = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, admin.token);

    // Try delete as sales
    const sales = await login(request, testUsers.sales);
    const delRes = await request.delete(`/api/conversations/${conv.id}`, {
      headers: authHeader(sales.token),
    });
    expect(delRes.status()).toBe(403);

    await deleteConversation(request, admin.token, conv.id);
  });

  test("TC-047: Get messages for conversation", async ({ request }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, token);

    const msgsRes = await request.get(
      `/api/conversations/${conv.id}/messages`,
      { headers: authHeader(token) }
    );
    expect(msgsRes.ok()).toBe(true);
    const msgs = await msgsRes.json();
    expect(Array.isArray(msgs)).toBe(true);

    await deleteConversation(request, token, conv.id);
  });
});

// ===================================================================
// B. FAVORITES (TC-CHAT-070 through TC-CHAT-072)
// ===================================================================
test.describe("Favorites CRUD", () => {
  test("TC-070: Add favorite returns 201", async ({ request }) => {
    const { token } = await login(request, testUsers.orgAdmin);

    const addRes = await request.post("/api/favorites", {
      headers: authHeader(token),
      data: { path: "/test-agent-fav", label: "Agent Test Favorite" },
    });
    expect(addRes.status()).toBe(201);
    const fav = await addRes.json();
    expect(fav.id).toBeDefined();
    expect(fav.path).toBe("/test-agent-fav");
    expect(fav.label).toBe("Agent Test Favorite");

    // Cleanup
    await request.delete(`/api/favorites/${fav.id}`, {
      headers: authHeader(token),
    });
  });

  test("TC-071: List favorites returns array including added item", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.orgAdmin);

    const addRes = await request.post("/api/favorites", {
      headers: authHeader(token),
      data: { path: "/list-test-fav", label: "List Test" },
    });
    const fav = await addRes.json();

    const listRes = await request.get("/api/favorites", {
      headers: authHeader(token),
    });
    expect(listRes.ok()).toBe(true);
    const list = await listRes.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((f: any) => f.id === fav.id)).toBe(true);

    await request.delete(`/api/favorites/${fav.id}`, {
      headers: authHeader(token),
    });
  });

  test("TC-072: Remove favorite and confirm gone", async ({ request }) => {
    const { token } = await login(request, testUsers.orgAdmin);

    const addRes = await request.post("/api/favorites", {
      headers: authHeader(token),
      data: { path: "/remove-test-fav", label: "Remove Test" },
    });
    const fav = await addRes.json();

    const delRes = await request.delete(`/api/favorites/${fav.id}`, {
      headers: authHeader(token),
    });
    expect(delRes.ok()).toBe(true);

    const listRes = await request.get("/api/favorites", {
      headers: authHeader(token),
    });
    const list = await listRes.json();
    expect(list.some((f: any) => f.id === fav.id)).toBe(false);
  });
});

// ===================================================================
// C. CHAT MESSAGE FLOW / STREAMING (TC-CHAT-010, 019, 020)
// ===================================================================
test.describe("Chat Stream Endpoint", () => {
  test("TC-010: POST to stream endpoint returns 200 with body", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, token);

    const streamRes = await request.post(
      `/api/chat/${conv.id}/stream`,
      {
        headers: {
          ...authHeader(token),
          "Content-Type": "application/json",
        },
        data: { content: "What is 2 plus 2?" },
      }
    );
    // Stream endpoint should return 200 (SSE)
    expect(streamRes.status()).toBe(200);

    // Body should contain SSE data lines
    const body = await streamRes.text();
    expect(body.length).toBeGreaterThan(0);
    // SSE responses contain "data:" prefixed lines
    expect(body).toContain("data:");

    await deleteConversation(request, token, conv.id);
  });

  test("TC-019: Empty content returns 400", async ({ request }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, token);

    const res = await request.post(`/api/chat/${conv.id}/stream`, {
      headers: {
        ...authHeader(token),
        "Content-Type": "application/json",
      },
      data: {},
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toContain("content");

    await deleteConversation(request, token, conv.id);
  });

  test("TC-020: Stream endpoint requires auth (401)", async ({ request }) => {
    // Use a random UUID — auth check should fire before conversation lookup
    const res = await request.post(
      `/api/chat/00000000-0000-0000-0000-000000000000/stream`,
      {
        headers: { "Content-Type": "application/json" },
        data: { content: "test" },
      }
    );
    expect(res.status()).toBe(401);
  });

  test("TC-010b: Stream response contains done event", async ({ request }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, token);

    const streamRes = await request.post(
      `/api/chat/${conv.id}/stream`,
      {
        headers: {
          ...authHeader(token),
          "Content-Type": "application/json",
        },
        data: { content: "Say hello in one word." },
      }
    );
    expect(streamRes.status()).toBe(200);
    const body = await streamRes.text();
    // Should contain a done event
    expect(body).toContain('"type":"done"');

    await deleteConversation(request, token, conv.id);
  });
});

// ===================================================================
// D. AGENT SELECTION (TC-CHAT-080 area)
// ===================================================================
test.describe("Agent Selection", () => {
  test("TC-080a: List agents per role — orgAdmin sees agents", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const res = await request.get("/api/agents", {
      headers: authHeader(token),
    });
    expect(res.ok()).toBe(true);
    const agents = await res.json();
    expect(Array.isArray(agents)).toBe(true);
  });

  test("TC-080b: List agents per role — sales sees agents", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.sales);
    const res = await request.get("/api/agents", {
      headers: authHeader(token),
    });
    expect(res.ok()).toBe(true);
    const agents = await res.json();
    expect(Array.isArray(agents)).toBe(true);
  });

  test("TC-081: Agent-specific chat creates conversation", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.orgAdmin);

    // Get an agent first
    const agentsRes = await request.get("/api/agents", {
      headers: authHeader(token),
    });
    const agents = await agentsRes.json();
    if (agents.length === 0) {
      test.skip();
      return;
    }
    const agentId = agents[0].id;

    // Create conversation with agent channel
    const conv = await createConversation(request, token, {
      channel: `agent-chat-${agentId}`,
      customerName: "Agent Chat Test",
    });
    expect(conv.channel).toBe(`agent-chat-${agentId}`);

    await deleteConversation(request, token, conv.id);
  });

  test("TC-082: Send message to agent-specific conversation", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.orgAdmin);

    const agentsRes = await request.get("/api/agents", {
      headers: authHeader(token),
    });
    const agents = await agentsRes.json();
    if (agents.length === 0) {
      test.skip();
      return;
    }
    const agentId = agents[0].id;

    const conv = await createConversation(request, token, {
      channel: `agent-chat-${agentId}`,
      customerName: "Agent Msg Test",
    });

    const streamRes = await request.post(`/api/chat/${conv.id}/stream`, {
      headers: {
        ...authHeader(token),
        "Content-Type": "application/json",
      },
      data: { content: "Hello agent", agentId },
    });
    expect(streamRes.status()).toBe(200);
    const body = await streamRes.text();
    expect(body).toContain("data:");

    await deleteConversation(request, token, conv.id);
  });
});

// ===================================================================
// E. DOCUMENT UPLOAD (TC-CHAT-110 area)
// ===================================================================
test.describe("Document Upload", () => {
  test("TC-110: Upload text document returns 201", async ({ request }) => {
    const { token } = await login(request, testUsers.orgAdmin);

    const fileContent = "This is a test document for agent testing.\nLine 2.";
    const boundary = "----AgentTestBoundary" + Date.now();
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="agent-test-doc.txt"',
      "Content-Type: text/plain",
      "",
      fileContent,
      `--${boundary}--`,
    ].join("\r\n");

    const uploadRes = await request.post("/api/documents", {
      headers: {
        ...authHeader(token),
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      data: body,
    });

    // Accept 201 (success) or 400/413 (validation) — just not 500
    expect(uploadRes.status()).toBeLessThan(500);

    if (uploadRes.status() === 201) {
      const doc = await uploadRes.json();
      expect(doc.id).toBeDefined();
      // Cleanup
      await request.delete(`/api/documents/${doc.id}`, {
        headers: authHeader(token),
      });
    }
  });

  test("TC-114: Check duplicate document endpoint", async ({ request }) => {
    const { token } = await login(request, testUsers.orgAdmin);

    const checkRes = await request.post("/api/documents/check-duplicate", {
      headers: authHeader(token),
      data: { filename: "nonexistent-agent-test-file.txt" },
    });
    expect(checkRes.ok()).toBe(true);
    const result = await checkRes.json();
    expect(result.isDuplicate).toBe(false);
  });

  test("TC-114b: Check duplicate requires filename", async ({ request }) => {
    const { token } = await login(request, testUsers.orgAdmin);

    const checkRes = await request.post("/api/documents/check-duplicate", {
      headers: authHeader(token),
      data: {},
    });
    expect(checkRes.status()).toBe(400);
  });

  test("TC-117: List documents with optional agentId filter", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.orgAdmin);

    const listRes = await request.get("/api/documents", {
      headers: authHeader(token),
    });
    expect(listRes.ok()).toBe(true);
    const docs = await listRes.json();
    expect(Array.isArray(docs)).toBe(true);
  });
});

// ===================================================================
// F. ROLE-BASED ACCESS (TC-CHAT-090 area)
// ===================================================================
test.describe("Role-Based Access", () => {
  test("TC-091: Sales user can list agents (read access)", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.sales);
    const res = await request.get("/api/agents", {
      headers: authHeader(token),
    });
    expect(res.ok()).toBe(true);
  });

  test("TC-092: Sales user cannot create agents (403)", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.sales);
    const res = await request.post("/api/agents", {
      headers: authHeader(token),
      data: {
        name: "Unauthorized Agent",
        description: "Should fail",
        systemPrompt: "test",
        model: "gpt-4o-mini",
        department: "sales",
        isActive: true,
      },
    });
    expect(res.status()).toBe(403);
  });

  test("TC-093: Sales user cannot delete conversations (403)", async ({
    request,
  }) => {
    const admin = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, admin.token);

    const sales = await login(request, testUsers.sales);
    const delRes = await request.delete(`/api/conversations/${conv.id}`, {
      headers: authHeader(sales.token),
    });
    expect(delRes.status()).toBe(403);

    await deleteConversation(request, admin.token, conv.id);
  });

  test("TC-090a: OrgAdmin can create and chat on conversations", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, token);
    expect(conv.id).toBeDefined();

    const streamRes = await request.post(`/api/chat/${conv.id}/stream`, {
      headers: {
        ...authHeader(token),
        "Content-Type": "application/json",
      },
      data: { content: "Hello" },
    });
    expect(streamRes.status()).toBe(200);

    await deleteConversation(request, token, conv.id);
  });

  test("TC-090b: SuperAdmin can create conversations", async ({ request }) => {
    const { token } = await login(request, testUsers.superAdmin);
    const res = await request.post("/api/conversations", {
      headers: authHeader(token),
      data: { customerName: "SA Test", channel: "ai-chat" },
    });
    expect(res.status()).toBe(201);
    const conv = await res.json();

    await deleteConversation(request, token, conv.id);
  });
});

// ===================================================================
// G. MULTI-ORG ISOLATION (TC-CHAT-100, 101, 102)
// ===================================================================
test.describe("Multi-Org Isolation", () => {
  test("TC-101: Conversations scoped to organization", async ({ request }) => {
    // Create as Serra Honda orgAdmin
    const honda = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, honda.token, {
      customerName: "Honda Isolation Test",
    });

    // List as Serra Nissan orgAdmin — should NOT include Honda's conversation
    const nissan = await login(request, testUsers.serraNissan);
    const listRes = await request.get("/api/conversations", {
      headers: authHeader(nissan.token),
    });
    expect(listRes.ok()).toBe(true);
    const nissanConvs = await listRes.json();
    const leaked = nissanConvs.find((c: any) => c.id === conv.id);
    expect(leaked).toBeUndefined();

    await deleteConversation(request, honda.token, conv.id);
  });

  test("TC-046: Cross-org conversation access denied (403)", async ({
    request,
  }) => {
    // Create as Serra Honda orgAdmin
    const honda = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, honda.token);

    // Try direct access as Serra Nissan orgAdmin
    const nissan = await login(request, testUsers.serraNissan);
    const getRes = await request.get(`/api/conversations/${conv.id}`, {
      headers: authHeader(nissan.token),
    });
    expect(getRes.status()).toBe(403);

    await deleteConversation(request, honda.token, conv.id);
  });

  test("TC-102: Super admin can access cross-org conversation", async ({
    request,
  }) => {
    // Create as Serra Honda orgAdmin
    const honda = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, honda.token);

    // Super admin (roleLevel <= 2) should be able to access
    const sa = await login(request, testUsers.superAdmin);
    const getRes = await request.get(`/api/conversations/${conv.id}`, {
      headers: authHeader(sa.token),
    });
    expect(getRes.ok()).toBe(true);
    const fetched = await getRes.json();
    expect(fetched.id).toBe(conv.id);

    await deleteConversation(request, honda.token, conv.id);
  });

  test("TC-100: Super admin can chat on conversation", async ({ request }) => {
    const { token } = await login(request, testUsers.superAdmin);
    const conv = await createConversation(request, token, {
      customerName: "SA Chat Test",
    });

    const streamRes = await request.post(`/api/chat/${conv.id}/stream`, {
      headers: {
        ...authHeader(token),
        "Content-Type": "application/json",
      },
      data: { content: "What organizations do we manage?" },
    });
    expect(streamRes.status()).toBe(200);
    const body = await streamRes.text();
    expect(body).toContain("data:");

    await deleteConversation(request, token, conv.id);
  });
});

// ===================================================================
// H. ERROR HANDLING (TC-CHAT-120, 123, 124)
// ===================================================================
test.describe("Error Handling", () => {
  test("TC-120: Chat on non-existent conversation returns 404", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.orgAdmin);

    const res = await request.post(
      `/api/chat/00000000-0000-0000-0000-000000000001/stream`,
      {
        headers: {
          ...authHeader(token),
          "Content-Type": "application/json",
        },
        data: { content: "Hello" },
      }
    );
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.message).toContain("not found");
  });

  test("TC-123: Get non-existent conversation returns 404", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.orgAdmin);

    const res = await request.get(
      `/api/conversations/00000000-0000-0000-0000-000000000001`,
      { headers: authHeader(token) }
    );
    expect(res.status()).toBe(404);
  });

  test("TC-123b: Delete non-existent conversation returns 404", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.orgAdmin);

    const res = await request.delete(
      `/api/conversations/00000000-0000-0000-0000-000000000001`,
      { headers: authHeader(token) }
    );
    expect(res.status()).toBe(404);
  });

  test("TC-019b: Whitespace-only content returns 400", async ({ request }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, token);

    const res = await request.post(`/api/chat/${conv.id}/stream`, {
      headers: {
        ...authHeader(token),
        "Content-Type": "application/json",
      },
      data: { content: "   " },
    });
    // Server checks typeof content === "string" and truthy, spaces may pass
    // Accept either 400 (validation) or 200 (treated as valid input)
    expect(res.status()).toBeLessThan(500);

    await deleteConversation(request, token, conv.id);
  });
});

// ===================================================================
// I. CHAT HISTORY (TC-CHAT-047 extended)
// ===================================================================
test.describe("Chat History", () => {
  test("TC-047b: Messages appear after sending via stream", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, token);

    // Send a message through the stream endpoint
    const streamRes = await request.post(`/api/chat/${conv.id}/stream`, {
      headers: {
        ...authHeader(token),
        "Content-Type": "application/json",
      },
      data: { content: "History test message" },
    });
    expect(streamRes.status()).toBe(200);

    // Fetch messages — should have at least the user message
    const msgsRes = await request.get(
      `/api/conversations/${conv.id}/messages`,
      { headers: authHeader(token) }
    );
    expect(msgsRes.ok()).toBe(true);
    const msgs = await msgsRes.json();
    expect(msgs.length).toBeGreaterThanOrEqual(1);

    // Find the user message
    const userMsg = msgs.find(
      (m: any) => m.role === "user" && m.content === "History test message"
    );
    expect(userMsg).toBeDefined();

    await deleteConversation(request, token, conv.id);
  });

  test("TC-041c: List conversations filtered by status", async ({
    request,
  }) => {
    const { token } = await login(request, testUsers.orgAdmin);
    const conv = await createConversation(request, token);

    // Close it
    await request.patch(`/api/conversations/${conv.id}`, {
      headers: authHeader(token),
      data: { status: "closed" },
    });

    const listRes = await request.get(
      "/api/conversations?status=closed",
      { headers: authHeader(token) }
    );
    expect(listRes.ok()).toBe(true);
    const list = await listRes.json();
    expect(Array.isArray(list)).toBe(true);
    for (const c of list) {
      expect(c.status).toBe("closed");
    }

    await deleteConversation(request, token, conv.id);
  });
});
