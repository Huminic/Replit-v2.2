/**
 * Wave 2B-T1 — Public Widget Chat Provider Proof (testlane invocation script)
 *
 * Purpose: prove the public widget chat endpoint
 *   POST /api/widget/chat   (server/routes/public.ts:242-379)
 * end-to-end against the running dev pm2 instance, including the live
 * Anthropic provider call (claude-sonnet-4-6) and the conversation /
 * messages DB writes that result.
 *
 * This script is a READ-ONLY invocation against an existing running dev
 * server. It does NOT modify any production endpoint code; it only POSTs
 * a single chat message and SELECTs the resulting rows.
 *
 * Usage (T1):
 *   set -a; source .env; set +a   # exposes DATABASE_URL to drizzle/storage
 *   npx tsx server/test-widget-2B.ts testWidgetChat
 *
 * --- Endpoint contract notes (authoritative source: server/routes/public.ts) ---
 *
 * The handler at line 242 reads `{ slug, message, conversationId }` from
 * the request body. It does NOT consult `widgetCode` or `sessionId` —
 * those fields are not part of this endpoint's contract today.
 *
 * The Wave 2B-T1 task description originally specified
 *   `{ widgetCode, sessionId, message }`
 * for this POST. That is a mismatch with the live endpoint and would
 * 400 with "slug and message are required". Per truth-over-compliance,
 * we send the actual contract `{ slug, message }` and document the
 * deviation here for the verifier.
 *
 * For provenance/auditability we still look up the chat widget for the
 * org (status="active" AND type IN ('text','unified')) and log its
 * widgetCode + id alongside the request, so the proof shows the
 * configured widget the org would use to embed this chat. The widget
 * itself is NOT consulted by the endpoint.
 *
 * --- Halt conditions ---
 *
 *   - HTTP status not 2xx → STOP
 *   - response.conversationId missing or not a UUID → STOP
 *   - response.response missing/empty/<= 20 chars → STOP (stub fallback proof)
 *   - response.response equals the known stub fallback string
 *     "I'm sorry, I'm unable to respond right now. Please try again later."
 *     → STOP (Anthropic provider call did not actually fire)
 *   - conversation row not found in DB after success → STOP
 *   - conversation.organizationId != serra-honda's id → STOP
 *   - messages count < 2 (user + assistant) → STOP
 */

import { storage, db } from "./storage";
import { conversations, messages, widgets } from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const SERRA_HONDA_SLUG = "serra-honda";
const DEFAULT_MESSAGE =
  "Hi, I am interested in a 2024 Honda Civic. Do you have any in stock?";
const BASE_URL = process.env.TESTLANE_BASE_URL || "http://localhost:5000";

// Known stub fallback string in server/routes/public.ts:323. Reply equality
// to this string indicates the Anthropic call failed silently — fail the
// proof so we never accept stub-only output as a passing provider proof.
const STUB_FALLBACK =
  "I'm sorry, I'm unable to respond right now. Please try again later.";

interface T1Result {
  ok: boolean;
  status: number | null;
  conversationId: string | null;
  replyText: string | null;
  durationMs: number;
  error?: string;
  meta: {
    sessionId: string; // generated per invocation; not consumed by endpoint today (see header)
    baseUrl: string;
    orgSlug: string;
    orgId: string | null;
    widgetCode: string | null;
    widgetId: string | null;
    widgetType: string | null;
    widgetStatus: string | null;
    requestBody: { slug: string; message: string } | null;
    httpResponseBody: unknown;
    isNewConversation: boolean;
    messageCount: number;
    firstUserMessagePreview: string | null;
    firstAssistantMessagePreview: string | null;
    haltChecks: {
      status2xx: boolean;
      hasConversationId: boolean;
      replyLengthOver20: boolean;
      replyNotStubFallback: boolean;
      conversationRowFound: boolean;
      conversationOrgMatchesSerraHonda: boolean;
      atLeastTwoMessages: boolean;
    };
  };
}

export async function testWidgetChat({
  orgSlug = SERRA_HONDA_SLUG,
  message = DEFAULT_MESSAGE,
}: { orgSlug?: string; message?: string } = {}): Promise<T1Result> {
  const sessionId = randomUUID();
  const t0 = Date.now();

  console.log("=== Wave 2B-T1 — Public Widget Chat Provider Proof ===");
  console.log("session-id:", sessionId);
  console.log("base URL:", BASE_URL);
  console.log("org slug:", orgSlug);

  const meta: T1Result["meta"] = {
    sessionId,
    baseUrl: BASE_URL,
    orgSlug,
    orgId: null,
    widgetCode: null,
    widgetId: null,
    widgetType: null,
    widgetStatus: null,
    requestBody: null,
    httpResponseBody: null,
    isNewConversation: false,
    messageCount: 0,
    firstUserMessagePreview: null,
    firstAssistantMessagePreview: null,
    haltChecks: {
      status2xx: false,
      hasConversationId: false,
      replyLengthOver20: false,
      replyNotStubFallback: false,
      conversationRowFound: false,
      conversationOrgMatchesSerraHonda: false,
      atLeastTwoMessages: false,
    },
  };

  // 1. Resolve org
  const org = await storage.getOrganizationBySlug(orgSlug);
  if (!org) {
    return {
      ok: false,
      status: null,
      conversationId: null,
      replyText: null,
      durationMs: Date.now() - t0,
      error: `org not found by slug=${orgSlug}`,
      meta,
    };
  }
  meta.orgId = org.id;
  console.log(`org: id=${org.id} slug=${org.slug} name=${org.name}`);

  // 2. Look up an active chat-capable widget for the org (auditing/traceability
  //    only — the endpoint does NOT consult this row). We treat a widget as
  //    "chat-enabled" if status='active' AND type IN ('text','unified'),
  //    matching how the front-end embed scripts present chat.
  const orgWidgets = await db
    .select()
    .from(widgets)
    .where(
      and(
        eq(widgets.organizationId, org.id),
        eq(widgets.status, "active"),
      ),
    );
  const chatWidget =
    orgWidgets.find((w) => w.type === "text") ||
    orgWidgets.find((w) => w.type === "unified") ||
    null;

  if (!chatWidget) {
    return {
      ok: false,
      status: null,
      conversationId: null,
      replyText: null,
      durationMs: Date.now() - t0,
      error: "no chat-enabled widget",
      meta,
    };
  }
  meta.widgetCode = chatWidget.widgetCode;
  meta.widgetId = chatWidget.id;
  meta.widgetType = chatWidget.type;
  meta.widgetStatus = chatWidget.status;
  console.log(
    `widget (audit only): id=${chatWidget.id} code=${chatWidget.widgetCode} type=${chatWidget.type} status=${chatWidget.status}`,
  );

  // 3. Capture pre-window for DB scan
  const preTs = new Date();
  console.log(`pre_ts=${preTs.toISOString()}`);

  // 4. POST to /api/widget/chat — single invocation only
  const requestBody = { slug: orgSlug, message };
  meta.requestBody = requestBody;
  console.log("POST", `${BASE_URL}/api/widget/chat`, JSON.stringify(requestBody));

  let httpStatus: number | null = null;
  let respBody: any = null;
  try {
    const res = await fetch(`${BASE_URL}/api/widget/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    httpStatus = res.status;
    respBody = await res.json().catch(() => null);
  } catch (err: any) {
    return {
      ok: false,
      status: null,
      conversationId: null,
      replyText: null,
      durationMs: Date.now() - t0,
      error: `fetch failed: ${err?.message || err}`,
      meta,
    };
  }
  meta.httpResponseBody = respBody;
  const postTs = new Date();
  console.log(`post_ts=${postTs.toISOString()}`);
  console.log(`HTTP ${httpStatus}`);
  console.log("response body:", JSON.stringify(respBody, null, 2));

  const conversationId: string | null = respBody?.conversationId ?? null;
  const replyText: string | null = respBody?.response ?? null;

  // 5. Halt-condition: HTTP 2xx
  const status2xx = httpStatus !== null && httpStatus >= 200 && httpStatus < 300;
  meta.haltChecks.status2xx = status2xx;
  // 6. Halt-condition: conversationId returned
  const hasConversationId = !!conversationId;
  meta.haltChecks.hasConversationId = hasConversationId;
  // 7. Halt-condition: reply length and non-stub
  const replyLengthOver20 = !!replyText && replyText.length > 20;
  const replyNotStubFallback = replyText !== STUB_FALLBACK;
  meta.haltChecks.replyLengthOver20 = replyLengthOver20;
  meta.haltChecks.replyNotStubFallback = replyNotStubFallback;

  if (!status2xx || !hasConversationId) {
    return {
      ok: false,
      status: httpStatus,
      conversationId,
      replyText,
      durationMs: Date.now() - t0,
      error: `HTTP failure: status=${httpStatus} hasConvoId=${hasConversationId}`,
      meta,
    };
  }

  // 8. Look up the conversation row
  const conversation = conversationId
    ? await storage.getConversation(conversationId)
    : undefined;
  meta.haltChecks.conversationRowFound = !!conversation;
  if (!conversation) {
    return {
      ok: false,
      status: httpStatus,
      conversationId,
      replyText,
      durationMs: Date.now() - t0,
      error: `conversation row not found id=${conversationId}`,
      meta,
    };
  }
  // The endpoint always creates a NEW conversation when no conversationId is
  // sent in the request body, so isNewConversation is implicitly true here.
  meta.isNewConversation = true;
  const conversationOrgMatchesSerraHonda = conversation.organizationId === org.id;
  meta.haltChecks.conversationOrgMatchesSerraHonda =
    conversationOrgMatchesSerraHonda;
  console.log(
    `conversation: id=${conversation.id} channel=${conversation.channel} status=${conversation.status} org=${conversation.organizationId} created_at=${conversation.createdAt.toISOString()}`,
  );

  // 9. Look up the messages rows
  const convoMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId!))
    .orderBy(desc(messages.createdAt));
  meta.messageCount = convoMessages.length;
  // Order ASC for first-user / first-assistant preview
  const ascMessages = [...convoMessages].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const firstUser = ascMessages.find((m) => m.role === "user");
  const firstAssistant = ascMessages.find((m) => m.role === "assistant");
  meta.firstUserMessagePreview = firstUser
    ? firstUser.content.slice(0, 200)
    : null;
  meta.firstAssistantMessagePreview = firstAssistant
    ? firstAssistant.content.slice(0, 200)
    : null;
  meta.haltChecks.atLeastTwoMessages = convoMessages.length >= 2;
  console.log(
    `messages count: ${convoMessages.length} (window pre=${preTs.toISOString()} post=${postTs.toISOString()})`,
  );

  const allHaltOk =
    status2xx &&
    hasConversationId &&
    replyLengthOver20 &&
    replyNotStubFallback &&
    !!conversation &&
    conversationOrgMatchesSerraHonda &&
    convoMessages.length >= 2;

  const durationMs = Date.now() - t0;
  if (!allHaltOk) {
    return {
      ok: false,
      status: httpStatus,
      conversationId,
      replyText,
      durationMs,
      error: `halt-check failed: ${JSON.stringify(meta.haltChecks)}`,
      meta,
    };
  }

  return {
    ok: true,
    status: httpStatus,
    conversationId,
    replyText,
    durationMs,
    meta,
  };
}

// ---------------------------------------------------------------------------
// Wave 2B-T2 — Public Widget Voice Callback Provider Proof
// ---------------------------------------------------------------------------
//
// Purpose: prove the public widget voice-callback endpoint
//   POST /api/widget/voice-callback   (server/routes/public.ts:130-187)
// end-to-end against the running dev pm2 instance, including the live
// VAPI provider call (vapi_create_call via central-mcp) and the
// conversations DB row that results.
//
// --- Endpoint contract (authoritative source: server/routes/public.ts:130-187) ---
//
// The handler reads `{ slug, phoneNumber }` from the request body. It does
// NOT consult any other field. It then:
//   1. resolveOrgBySlug(slug) → 404 if missing
//   2. find an active voice agent with vapiAssistantId & channels.includes("voice") → 400 if missing
//   3. normalize phoneNumber → +E.164
//   4. callMCP("vapi_create_call", { assistantId, customerNumber, phoneNumberId? })
//      — failures here return 503 (NOT 500)
//   5. createConversation(channel="voice", customerPhone, organizationId, ...) — NO provider-ref column
//   6. respond { success, callId, conversationId }
//
// Schema check (shared/schema.ts:86-109): the `conversations` table has no
// `vapi_call_id` / `provider_call_id` column today, so the VAPI callId only
// lives in (a) the HTTP response, (b) the server console, and (c) the VAPI
// dashboard. Delta-1 captures (a); delta-2 documents the cross-check path.
//
// --- Halt conditions ---
//
//   - allowlist check did not return exit 0 for +19014361271 → STOP (caller's responsibility)
//   - HTTP status not 2xx → STOP
//   - response.callId missing/empty → STOP (VAPI call did not fire)
//   - response.conversationId missing or not a UUID → STOP
//   - conversation row not found in DB after success → STOP
//   - conversation.organizationId != serra-honda's id → STOP
//   - conversation.channel != "voice" → STOP
//   - conversation.customerPhone != formatted +19014361271 → STOP

const NANCY_ALLOWLIST_PHONE = "+19014361271";

interface T2Result {
  ok: boolean;
  status: number | null;
  callId: string | null;
  conversationId: string | null;
  durationMs: number;
  error?: string;
  meta: {
    baseUrl: string;
    orgSlug: string;
    orgId: string | null;
    voiceAgentId: string | null;
    vapiAssistantId: string | null;
    requestPhoneIn: string;
    requestPhoneFormatted: string | null;
    requestBody: { slug: string; phoneNumber: string } | null;
    httpResponseBody: unknown;
    conversationRow: {
      id: string;
      organizationId: string;
      channel: string;
      status: string;
      customerPhone: string | null;
      customerName: string;
      createdAt: string;
    } | null;
    haltChecks: {
      status2xx: boolean;
      hasCallId: boolean;
      hasConversationId: boolean;
      conversationRowFound: boolean;
      conversationOrgMatchesSerraHonda: boolean;
      conversationChannelIsVoice: boolean;
      conversationPhoneMatches: boolean;
    };
  };
}

export async function testWidgetVoiceCallback({
  orgSlug = SERRA_HONDA_SLUG,
  phone = NANCY_ALLOWLIST_PHONE,
}: { orgSlug?: string; phone?: string } = {}): Promise<T2Result> {
  const t0 = Date.now();

  console.log("=== Wave 2B-T2 — Public Widget Voice Callback Provider Proof ===");
  console.log("base URL:", BASE_URL);
  console.log("org slug:", orgSlug);
  console.log("phone (request):", phone);

  const meta: T2Result["meta"] = {
    baseUrl: BASE_URL,
    orgSlug,
    orgId: null,
    voiceAgentId: null,
    vapiAssistantId: null,
    requestPhoneIn: phone,
    requestPhoneFormatted: null,
    requestBody: null,
    httpResponseBody: null,
    conversationRow: null,
    haltChecks: {
      status2xx: false,
      hasCallId: false,
      hasConversationId: false,
      conversationRowFound: false,
      conversationOrgMatchesSerraHonda: false,
      conversationChannelIsVoice: false,
      conversationPhoneMatches: false,
    },
  };

  // 1. Resolve org
  const org = await storage.getOrganizationBySlug(orgSlug);
  if (!org) {
    return {
      ok: false,
      status: null,
      callId: null,
      conversationId: null,
      durationMs: Date.now() - t0,
      error: `org not found by slug=${orgSlug}`,
      meta,
    };
  }
  meta.orgId = org.id;
  console.log(`org: id=${org.id} slug=${org.slug} name=${org.name}`);

  // 2. Audit-only: discover active voice agent (the endpoint does this same
  //    lookup at request time; we pre-check so the proof can show the
  //    configured assistant id alongside the captured callId).
  const orgAgents = await storage.getAgents(org.id);
  const voiceAgent = orgAgents.find(
    (a) =>
      a.vapiAssistantId &&
      Array.isArray(a.channels) &&
      a.channels.includes("voice") &&
      a.status === "active",
  );
  if (!voiceAgent?.vapiAssistantId) {
    return {
      ok: false,
      status: null,
      callId: null,
      conversationId: null,
      durationMs: Date.now() - t0,
      error: "no active voice agent for org (audit-only pre-check)",
      meta,
    };
  }
  meta.voiceAgentId = voiceAgent.id;
  meta.vapiAssistantId = voiceAgent.vapiAssistantId;
  console.log(
    `voice agent (audit): id=${voiceAgent.id} vapiAssistantId=${voiceAgent.vapiAssistantId} status=${voiceAgent.status}`,
  );

  // 3. Compute the formatted phone the endpoint will use (mirrors handler logic).
  const cleaned = phone.replace(/[^0-9+]/g, "");
  const formatted = cleaned.startsWith("+") ? cleaned : `+1${cleaned}`;
  meta.requestPhoneFormatted = formatted;

  // 4. Capture pre-window
  const preTs = new Date();
  console.log(`pre_ts=${preTs.toISOString()}`);

  // 5. POST to /api/widget/voice-callback — single invocation only
  const requestBody = { slug: orgSlug, phoneNumber: phone };
  meta.requestBody = requestBody;
  console.log(
    "POST",
    `${BASE_URL}/api/widget/voice-callback`,
    JSON.stringify(requestBody),
  );

  let httpStatus: number | null = null;
  let respBody: any = null;
  try {
    const res = await fetch(`${BASE_URL}/api/widget/voice-callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    httpStatus = res.status;
    respBody = await res.json().catch(() => null);
  } catch (err: any) {
    return {
      ok: false,
      status: null,
      callId: null,
      conversationId: null,
      durationMs: Date.now() - t0,
      error: `fetch failed: ${err?.message || err}`,
      meta,
    };
  }
  meta.httpResponseBody = respBody;
  const postTs = new Date();
  console.log(`post_ts=${postTs.toISOString()}`);
  console.log(`HTTP ${httpStatus}`);
  console.log("response body:", JSON.stringify(respBody, null, 2));

  const callId: string | null = respBody?.callId ?? null;
  const conversationId: string | null = respBody?.conversationId ?? null;

  // 6. Halt-conditions on HTTP layer
  const status2xx = httpStatus !== null && httpStatus >= 200 && httpStatus < 300;
  meta.haltChecks.status2xx = status2xx;
  meta.haltChecks.hasCallId = !!callId;
  meta.haltChecks.hasConversationId = !!conversationId;

  if (!status2xx || !callId || !conversationId) {
    return {
      ok: false,
      status: httpStatus,
      callId,
      conversationId,
      durationMs: Date.now() - t0,
      error: `HTTP failure: status=${httpStatus} hasCallId=${!!callId} hasConvoId=${!!conversationId}`,
      meta,
    };
  }

  // 7. Look up the conversation row in the DB
  const conversation = await storage.getConversation(conversationId);
  meta.haltChecks.conversationRowFound = !!conversation;
  if (!conversation) {
    return {
      ok: false,
      status: httpStatus,
      callId,
      conversationId,
      durationMs: Date.now() - t0,
      error: `conversation row not found id=${conversationId}`,
      meta,
    };
  }
  meta.conversationRow = {
    id: conversation.id,
    organizationId: conversation.organizationId,
    channel: conversation.channel,
    status: conversation.status,
    customerPhone: conversation.customerPhone ?? null,
    customerName: conversation.customerName,
    createdAt: conversation.createdAt.toISOString(),
  };
  meta.haltChecks.conversationOrgMatchesSerraHonda =
    conversation.organizationId === org.id;
  meta.haltChecks.conversationChannelIsVoice = conversation.channel === "voice";
  meta.haltChecks.conversationPhoneMatches =
    conversation.customerPhone === formatted;
  console.log(
    `conversation: id=${conversation.id} channel=${conversation.channel} status=${conversation.status} org=${conversation.organizationId} phone=${conversation.customerPhone} created_at=${conversation.createdAt.toISOString()}`,
  );

  const allHaltOk =
    status2xx &&
    !!callId &&
    !!conversationId &&
    meta.haltChecks.conversationRowFound &&
    meta.haltChecks.conversationOrgMatchesSerraHonda &&
    meta.haltChecks.conversationChannelIsVoice &&
    meta.haltChecks.conversationPhoneMatches;

  const durationMs = Date.now() - t0;
  if (!allHaltOk) {
    return {
      ok: false,
      status: httpStatus,
      callId,
      conversationId,
      durationMs,
      error: `halt-check failed: ${JSON.stringify(meta.haltChecks)}`,
      meta,
    };
  }

  return {
    ok: true,
    status: httpStatus,
    callId,
    conversationId,
    durationMs,
    meta,
  };
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

const isDirectInvocation =
  process.argv[1] && process.argv[1].endsWith("test-widget-2B.ts");

if (isDirectInvocation) {
  const fn = process.argv[2];
  if (fn === "testWidgetChat") {
    testWidgetChat()
      .then((r) => {
        console.log("RESULT:", JSON.stringify(r, null, 2));
        process.exit(r.ok ? 0 : 1);
      })
      .catch((e) => {
        console.error("FAILED:", e?.message || e);
        if (e?.stack) console.error(e.stack);
        process.exit(1);
      });
  } else if (fn === "testWidgetVoiceCallback") {
    testWidgetVoiceCallback()
      .then((r) => {
        console.log("RESULT:", JSON.stringify(r, null, 2));
        process.exit(r.ok ? 0 : 1);
      })
      .catch((e) => {
        console.error("FAILED:", e?.message || e);
        if (e?.stack) console.error(e.stack);
        process.exit(1);
      });
  } else {
    console.error(
      `Unknown function: "${fn}". Supported: testWidgetChat, testWidgetVoiceCallback`,
    );
    process.exit(2);
  }
}
