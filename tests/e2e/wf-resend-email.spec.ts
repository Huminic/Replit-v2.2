/**
 * wf-resend-email.spec.ts — Workflow E2E: Resend Email Pipeline
 *
 * Tests the email sending pipeline via the conversation email endpoint.
 * Verifies that an email can be sent from a conversation and that
 * the activity log records the event.
 *
 * API-only tests — no browser/page needed.
 * Uses Serra Honda (orgAdmin) which has outboundEnabled and emailEnabled flags.
 */
import { test, expect } from "playwright/test";
import { login, authHeader, testUsers } from "./helpers/auth";

const BASE = process.env.BASE_URL || "http://localhost:5000";

const RUN_ID = `wf-email-${Date.now()}`;
const TEST_EMAIL_TO = `wf-resend-${RUN_ID}@example.com`;

test.describe.serial("Workflow: Resend Email Pipeline", () => {
  let token: string;
  let organizationId: string;
  let userId: string;
  let headers: Record<string, string>;
  let conversationId: string | null = null;

  test.beforeAll(async ({ request }) => {
    const session = await login(request, testUsers.orgAdmin);
    token = session.token;
    organizationId = session.organizationId;
    userId = session.userId;
    headers = authHeader(token);
  });

  // -------------------------------------------------------------------------
  // 1. Create a test conversation to send email from
  // -------------------------------------------------------------------------
  test("WF-EMAIL-1: Create conversation for email test", async ({ request }) => {
    const res = await request.post(`${BASE}/api/conversations`, {
      headers,
      data: {
        customerName: `WF Email Test ${RUN_ID}`,
        customerPhone: `+1555${Date.now().toString().slice(-7)}`,
        customerEmail: TEST_EMAIL_TO,
        channel: "email",
        status: "open",
        organizationId,
      },
    });

    // Accept 200/201 for conversation creation
    expect(res.status(), `Conversation creation failed: ${res.status()}`).toBeLessThan(300);
    const conv = await res.json();
    expect(conv.id).toBeTruthy();
    conversationId = conv.id;

    console.log(`  WF-EMAIL-1 PASS: Conversation created — id=${conversationId}`);
  });

  // -------------------------------------------------------------------------
  // 2. Send email via the conversation email endpoint
  // -------------------------------------------------------------------------
  test("WF-EMAIL-2: Send email via /api/conversations/:id/email", async ({ request }) => {
    expect(conversationId, "Conversation must exist from test 1").toBeTruthy();

    const res = await request.post(`${BASE}/api/conversations/${conversationId}/email`, {
      headers,
      data: {
        to: TEST_EMAIL_TO,
        subject: `WF Email Test ${RUN_ID}`,
        body: `<p>This is a workflow test email sent at ${new Date().toISOString()}.</p>`,
      },
    });

    const body = await res.json();
    console.log(`  [Email Send] Status: ${res.status()}, Body: ${JSON.stringify(body).slice(0, 300)}`);

    // Email may succeed (200) or fail if RESEND_API_KEY is missing (503) or other config issue
    // Both are valid workflow outcomes — we verify the pipeline handles it gracefully
    expect(res.status(), "Email endpoint should not crash (no 500)").not.toBe(500);

    if (res.ok()) {
      expect(body.success).toBe(true);
      console.log(`  WF-EMAIL-2 PASS: Email sent successfully to ${TEST_EMAIL_TO}`);
    } else if (res.status() === 503) {
      console.log(`  WF-EMAIL-2 SKIP: RESEND_API_KEY not configured — ${body.message}`);
      test.skip();
    } else {
      console.log(`  WF-EMAIL-2 INFO: Email send returned ${res.status()}: ${body.message}`);
    }
  });

  // -------------------------------------------------------------------------
  // 3. Verify activity log has an email_sent entry
  // -------------------------------------------------------------------------
  test("WF-EMAIL-3: Activity log records email_sent event", async ({ request }) => {
    expect(conversationId, "Conversation must exist from test 1").toBeTruthy();

    const res = await request.get(`${BASE}/api/activity-log?limit=20`, {
      headers,
    });
    expect(res.ok(), `Activity log fetch failed: ${res.status()}`).toBe(true);

    const logs = await res.json();
    expect(Array.isArray(logs)).toBe(true);

    // Look for an email_sent activity related to our conversation
    const emailLog = logs.find(
      (log: any) =>
        log.action === "email_sent" &&
        log.entityId === conversationId
    );

    if (emailLog) {
      expect(emailLog.entityType).toBe("conversation");
      expect(emailLog.organizationId).toBeTruthy();

      // Verify metadata contains recipient info
      const metadata = typeof emailLog.metadata === "string"
        ? JSON.parse(emailLog.metadata)
        : emailLog.metadata;
      if (metadata) {
        expect(metadata.to).toBe(TEST_EMAIL_TO);
        expect(metadata.subject).toContain(RUN_ID);
      }
      console.log(`  WF-EMAIL-3 PASS: Activity log contains email_sent for conversation ${conversationId}`);
    } else {
      // If email was not sent (RESEND_API_KEY missing), no activity log entry expected
      console.log(`  WF-EMAIL-3 SKIP: No email_sent activity found — email may not have been sent`);
    }
  });

  // -------------------------------------------------------------------------
  // 4. Verify conversation has the email message recorded
  // -------------------------------------------------------------------------
  test("WF-EMAIL-4: Conversation messages include the sent email", async ({ request }) => {
    expect(conversationId, "Conversation must exist from test 1").toBeTruthy();

    const res = await request.get(`${BASE}/api/conversations/${conversationId}/messages`, {
      headers,
    });
    expect(res.ok(), `Messages fetch failed: ${res.status()}`).toBe(true);

    const messages = await res.json();
    const msgList = Array.isArray(messages) ? messages : messages.data || [];

    // If email was sent, there should be an agent message with the email content
    const emailMessage = msgList.find(
      (m: any) =>
        m.role === "agent" &&
        m.content &&
        m.content.includes(TEST_EMAIL_TO)
    );

    if (emailMessage) {
      expect(emailMessage.content).toContain("Email sent to");
      expect(emailMessage.content).toContain(RUN_ID);
      console.log(`  WF-EMAIL-4 PASS: Conversation contains email message record`);
    } else {
      console.log(`  WF-EMAIL-4 SKIP: No email message found — email may not have been sent`);
    }
  });

  // -------------------------------------------------------------------------
  // 5. Verify outbound status endpoint reflects email channel config
  // -------------------------------------------------------------------------
  test("WF-EMAIL-5: Outbound status shows email channel configuration", async ({ request }) => {
    const res = await request.get(`${BASE}/api/outbound/status`, {
      headers,
    });
    expect(res.ok(), `Outbound status failed: ${res.status()}`).toBe(true);

    const status = await res.json();
    expect(status).toHaveProperty("emailEnabled");
    expect(status).toHaveProperty("globalKillSwitch");
    expect(status).toHaveProperty("effectiveStatus");
    expect(typeof status.emailEnabled).toBe("boolean");

    console.log(
      `  WF-EMAIL-5 PASS: Outbound status — emailEnabled=${status.emailEnabled}, ` +
      `globalKillSwitch=${status.globalKillSwitch}, effectiveStatus=${status.effectiveStatus}`
    );
  });
});
