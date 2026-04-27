/**
 * VAPI inbound webhook content-presence guard.
 *
 * Sits in front of conversation creation in
 * `server/routes/webhooks.ts:/api/webhooks/vapi`. Pure function: given the
 * raw VAPI webhook payload, returns either `IGNORE` (no DB write) or
 * `CREATE` along with the extracted fields the route needs.
 *
 * Why this exists — `I-NEW-2026-04-26-D` (voice-without-thread):
 *
 *   VAPI inbound emits multiple events per call. The webhook accepts
 *   `end-of-call-report` and `call-ended`. Either can arrive with no
 *   transcript / no summary / no messages array — for example
 *   ringing-only, hung-up-before-pickup, failed-connect, or "ended"
 *   events for assistants without the post-call analysis pipeline
 *   enabled.
 *
 *   Before this guard, the route called `storage.createConversation`
 *   unconditionally for every `end-of-call-report`/`call-ended`,
 *   producing visible voice-channel rows in TeamBox with zero messages.
 *   These polluted TeamBox state and surfaced as the orphan voice
 *   conversations in the 2026-04-26 cleanup.
 *
 *   Forward-only fix: if a content-bearing event arrives empty,
 *   acknowledge the webhook (200) without writing a conversation.
 *
 * Behavior (event-type x content matrix):
 *
 *   eventType ∉ { "end-of-call-report", "call-ended" }
 *       → IGNORE (reason: "non-conversation-creating event type")
 *
 *   eventType ∈ { "end-of-call-report", "call-ended" }
 *       AND has any of: transcript / summary / non-empty messages array
 *       → CREATE (extract fields)
 *
 *   eventType ∈ { "end-of-call-report", "call-ended" }
 *       AND no transcript / no summary / no messages
 *       AND not a TestLane marker
 *       → IGNORE (reason: "no transcript/summary content (orphan-prevention)")
 *
 *   TestLane marker present (customer.name or callerName contains
 *   "[TESTLANE]" or equals "TestLane", OR customer.number on the
 *   testlane allowlist via `[testlane:` prefix in the name)
 *       → CREATE even without transcript content. This lets test
 *         fixtures exercise the create path deterministically without
 *         having to fabricate transcripts.
 *
 * Idempotency: NOT this layer's job. The route's existing
 * `processedVapiCalls` and `recentVapiCallsByPhone` maps still gate
 * duplicate creation; this guard only decides whether to even consider
 * creation.
 *
 * Pure-function design: takes the parsed webhook body and returns a
 * decision. No I/O, no DB, no logging side-effects (the caller logs).
 *
 * Scope: VAPI inbound only. Does not affect Tavus, ADF, outbound voice,
 * SMS, or any other channel.
 */

// ---------------------------------------------------------------------------
// Types matching the VAPI webhook payload (a subset; the route itself
// uses the full zod schema for parsing). We accept the union of "wrapped"
// and "flat" formats just like the route does.
// ---------------------------------------------------------------------------

export interface VapiCallObject {
  id?: string;
  type?: string;
  status?: string;
  phoneNumber?: { number?: string };
  customer?: { number?: string; name?: string };
  transcript?: string;
  summary?: string;
  startedAt?: string;
  endedAt?: string;
  assistantId?: string;
  recordingUrl?: string;
  artifact?: {
    transcript?: string;
    summary?: string;
    messages?: Array<{ role?: string; message?: string; content?: string }>;
    recordingUrl?: string;
  };
  messages?: Array<{ role?: string; message?: string; content?: string }>;
}

export interface VapiWebhookMessageLike {
  type: string;
  call?: VapiCallObject;
  recordingUrl?: string;
  transcript?: string;
  summary?: string;
  artifact?: {
    transcript?: string;
    summary?: string;
    messages?: Array<{ role?: string; message?: string; content?: string }>;
    recordingUrl?: string;
  };
  messages?: Array<{ role?: string; message?: string; content?: string }>;
}

/**
 * Normalized shape the guard works with. Caller maps the parsed (wrapped
 * or flat) payload into this shape before invoking the guard.
 */
export interface VapiInboundGuardInput {
  /** Event type from the webhook ("end-of-call-report", "call-ended",
   *  "status-update", "speech-update", etc.) */
  eventType: string;
  /** The call object from the payload (may be undefined for malformed
   *  or wrong-type events; the guard handles undefined defensively). */
  call?: VapiCallObject;
  /** Top-level (or message-level) transcript / summary / artifact /
   *  messages — VAPI sometimes places content here instead of on `call`.
   *  Caller passes whichever wrapper applies; the guard takes the union. */
  topLevelTranscript?: string;
  topLevelSummary?: string;
  topLevelArtifact?: {
    transcript?: string;
    summary?: string;
    messages?: Array<{ role?: string; message?: string; content?: string }>;
    recordingUrl?: string;
  };
  topLevelMessages?: Array<{ role?: string; message?: string; content?: string }>;
}

export interface VapiInboundGuardIgnore {
  action: "ignore";
  reason: string;
  /** True when the event type itself is not a candidate for conversation
   *  creation (e.g. status-update). Distinguished from "right type, no
   *  content". The route already 200s for ignored types, so this is
   *  primarily for logging/test assertions. */
  ignoredByEventType: boolean;
}

export interface VapiInboundGuardCreate {
  action: "create";
  /** Why creation was permitted. "content-present" or "testlane-marker". */
  reason: "content-present" | "testlane-marker";
  /** Extracted fields ready for storage.createConversation /
   *  storage.createMessage. */
  vapiCallId: string | null;
  customerName: string;
  customerPhone: string | null;
  assistantId: string | null;
  transcript: string;
  summary: string;
  recordingUrl: string | null;
  hasTranscript: boolean;
  hasSummary: boolean;
}

export type VapiInboundGuardDecision =
  | VapiInboundGuardIgnore
  | VapiInboundGuardCreate;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Event types that may create a conversation row when they carry
 *  content. Other types are ignored at the route layer regardless of
 *  content (status-update, speech-update, hang, transfer-destination-
 *  request, function-call, etc.). */
const CONVERSATION_CREATING_EVENT_TYPES = new Set([
  "end-of-call-report",
  "call-ended",
]);

/** Names that mark a request as TestLane and unlock creation without
 *  transcript content. Conservative: full-token match or substring with
 *  the canonical brackets. */
const TESTLANE_NAME_TOKENS = ["[TESTLANE]", "[testlane:", "TestLane"];

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function nonEmptyMessagesArray(
  arr: Array<{ role?: string; message?: string; content?: string }> | undefined,
): boolean {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  // At least one message must have content. VAPI sometimes sends an
  // empty messages array on hangup; that does not count as content.
  return arr.some(
    (m) => nonEmptyString(m.message) || nonEmptyString(m.content),
  );
}

function isTestLaneName(name: string | undefined | null): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  for (const token of TESTLANE_NAME_TOKENS) {
    if (trimmed.includes(token)) return true;
  }
  return false;
}

/**
 * Coalesce transcript/summary/messages from all VAPI payload locations
 * into a single resolved view. This mirrors the multi-location lookup
 * the route was already doing inline and centralizes it so the guard
 * and the route agree on what counts as "content".
 */
function resolveContent(input: VapiInboundGuardInput): {
  transcript: string;
  summary: string;
  hasMessages: boolean;
} {
  const call = input.call ?? {};
  const artifact = call.artifact ?? input.topLevelArtifact ?? undefined;

  let transcript = nonEmptyString(call.transcript) ? call.transcript! : "";
  if (!transcript && nonEmptyString(input.topLevelTranscript))
    transcript = input.topLevelTranscript!;
  if (!transcript && nonEmptyString(artifact?.transcript))
    transcript = artifact!.transcript!;

  let summary = nonEmptyString(call.summary) ? call.summary! : "";
  if (!summary && nonEmptyString(input.topLevelSummary))
    summary = input.topLevelSummary!;
  if (!summary && nonEmptyString(artifact?.summary))
    summary = artifact!.summary!;

  // Messages array from any location
  const callMessages = call.messages;
  const topMessages = input.topLevelMessages;
  const artifactMessages = artifact?.messages;
  const hasMessages =
    nonEmptyMessagesArray(callMessages) ||
    nonEmptyMessagesArray(topMessages) ||
    nonEmptyMessagesArray(artifactMessages);

  // If no transcript yet but we have a messages array, fold it the same
  // way the route does. This makes "messages array present" equivalent
  // to "transcript present" for the purposes of the guard.
  if (!transcript && hasMessages) {
    const arr = (callMessages?.length
      ? callMessages
      : topMessages?.length
        ? topMessages
        : artifactMessages) ?? [];
    transcript = arr
      .map((m) => `${m.role || "unknown"}: ${m.message || m.content || ""}`)
      .filter((line) => line.length > 10)
      .join("\n");
  }

  return { transcript, summary, hasMessages };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Decide whether a VAPI inbound webhook event should create a
 * conversation row and, if so, return the extracted fields.
 *
 * See module-level comment for the decision matrix.
 */
export function evaluateVapiInboundGuard(
  input: VapiInboundGuardInput,
): VapiInboundGuardDecision {
  // 1. Event-type filter. Only end-of-call-report / call-ended are
  //    candidates. Everything else is ignored regardless of content —
  //    matches the route's pre-existing behavior.
  if (!CONVERSATION_CREATING_EVENT_TYPES.has(input.eventType)) {
    return {
      action: "ignore",
      reason: `event type "${input.eventType}" does not create conversations`,
      ignoredByEventType: true,
    };
  }

  // 2. Resolve content from any payload location.
  const { transcript, summary, hasMessages } = resolveContent(input);
  const hasTranscript = transcript.trim().length > 0;
  const hasSummary = summary.trim().length > 0;

  // 3. Extract identity fields (used by both branches below for the
  //    create payload and for TestLane detection).
  const call = input.call ?? {};
  const customerName = call.customer?.name || "Unknown Caller";
  const customerPhone =
    call.customer?.number || call.phoneNumber?.number || null;
  const vapiCallId = call.id ?? null;
  const assistantId = call.assistantId ?? null;
  const recordingUrl =
    call.recordingUrl ||
    call.artifact?.recordingUrl ||
    input.topLevelArtifact?.recordingUrl ||
    null;

  // 4. Content present → CREATE (regular path).
  if (hasTranscript || hasSummary || hasMessages) {
    return {
      action: "create",
      reason: "content-present",
      vapiCallId,
      customerName,
      customerPhone,
      assistantId,
      transcript,
      summary,
      recordingUrl,
      hasTranscript,
      hasSummary,
    };
  }

  // 5. No content. TestLane bypass — allow create so test fixtures can
  //    exercise the create path without fabricating transcripts. The
  //    route's normal idempotency layer still applies.
  if (isTestLaneName(call.customer?.name)) {
    return {
      action: "create",
      reason: "testlane-marker",
      vapiCallId,
      customerName,
      customerPhone,
      assistantId,
      transcript,
      summary,
      recordingUrl,
      hasTranscript,
      hasSummary,
    };
  }

  // 6. No content, no TestLane marker → IGNORE.
  //    This is the fix for I-NEW-2026-04-26-D. The webhook still 200s
  //    so VAPI does not retry; we simply do not write a conversation.
  return {
    action: "ignore",
    reason:
      "end-of-call event has no transcript/summary/messages content (orphan-prevention guard, I-NEW-2026-04-26-D)",
    ignoredByEventType: false,
  };
}
