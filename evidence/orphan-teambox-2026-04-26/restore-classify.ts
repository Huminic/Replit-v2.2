/**
 * Restore-assessment re-classifier (2026-04-27 policy).
 *
 * Reads the saved pre-deletion snapshot at
 *   evidence/orphan-teambox-2026-04-26/full-serra-honda-delete-preview-2026-04-26.json
 * and re-classifies every deleted conversation row under the corrected
 * data-retention rule (decisions.md 2026-04-27, supersedes 2026-04-26).
 *
 * Three buckets:
 *   PRESERVE_REAL_OR_INTEGRATION
 *   DELETE_PROVEN_TEST
 *   REVIEW_UNKNOWN
 *
 * READ-ONLY. No DB writes. No DB reads either — pure JSON in / JSON out.
 *
 * IMPORTANT FINDING (surfaced in this script's output): the saved
 * preview captured every conversation column but did NOT capture the
 * 176 cascaded message rows themselves (no content, no role, no
 * sender_name, no per-message created_at). A proper restore of any
 * VAPI transcript content is therefore not possible from this snapshot
 * alone. This is flagged in the restore plan as a hard limitation.
 *
 * Run: `cd nexxus2.2_replit && npx tsx evidence/orphan-teambox-2026-04-26/restore-classify.ts`
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PREVIEW_PATH = resolve(
  __dirname,
  "full-serra-honda-delete-preview-2026-04-26.json",
);
const OUT_PATH = resolve(
  __dirname,
  "restore-assessment-2026-04-27.json",
);

// ----------------------------------------------------------------------
// Classification rules (operator policy 2026-04-27).
// ----------------------------------------------------------------------

// Test patterns that mark a row as PROVEN test irrespective of other signals.
const TEST_NAME_REGEX =
  /\btest\b|testlane|test customer|test user|test caller|test probe|test weaver/i;
const SPRINT_TEST_PREFIX_REGEX = /^(S-\d|WF[-_]|sprint|wf-)/i;
const OPERATOR_PHONES_NORMALIZED = ["14126546500", "4126546500"];
// Real-user emails (operator listed @huminic.ai and @misscommunicationconsulting.com
// as intentional real users; both should NOT auto-mark as test).
// Operator-personal aliases that mark a row as PROVEN test:
const OPERATOR_PERSONAL_EMAILS = [
  "duanekwells@gmail.com",
  "duanewells@icloud.com",
];
// Internal real-user / staff emails — these mean "real user", but a row
// owned by them is still a real interaction (not auto-test). Used for
// classification disambiguation, NOT a test marker.
const INTERNAL_USER_DOMAINS = [
  "huminic.ai",
  "misscommunicationconsulting.com",
  "serrahonda.net",
  "serrahonda.com",
  "cageautomotive.com",
];

function normalizePhone(p: string | null | undefined): string | null {
  if (!p) return null;
  return String(p).replace(/[^\d]/g, "");
}

function classifyPhone(p: string | null | undefined): {
  is_555_anywhere: boolean;
  is_555_npa: boolean;
  is_555_nxx: boolean;
  is_operator: boolean;
  raw: string | null;
  normalized: string | null;
  npa: string | null;
  nxx: string | null;
} {
  const norm = normalizePhone(p);
  let is555nxx = false;
  let is555npa = false;
  let npa: string | null = null;
  let nxx: string | null = null;
  if (norm) {
    const local = norm.length === 11 && norm.startsWith("1") ? norm.slice(1) : norm;
    if (local.length === 10) {
      npa = local.slice(0, 3);
      nxx = local.slice(3, 6);
      if (nxx === "555") is555nxx = true;
      if (npa === "555") is555npa = true;
    }
  }
  const isOperator = !!norm && OPERATOR_PHONES_NORMALIZED.includes(norm);
  return {
    is_555_anywhere: is555nxx || is555npa,
    is_555_npa: is555npa,
    is_555_nxx: is555nxx,
    is_operator: isOperator,
    raw: p ?? null,
    normalized: norm,
    npa,
    nxx,
  };
}

function emailDomain(e: string | null | undefined): string | null {
  if (!e) return null;
  const at = String(e).indexOf("@");
  if (at < 0) return null;
  return String(e).slice(at + 1).toLowerCase();
}

interface Row {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  channel: string;
  status: string;
  agent_id: string | null;
  assigned_to: string | null;
  campaign_id: string | null;
  source_conversation_id: string | null;
  campaign_disconnected: boolean;
  unread_count: number;
  last_message_at: string | null;
  escalation_sent_at: string | null;
  stale_trigger_processed_at: string | null;
  created_at: string;
  updated_at: string;
  message_count: number;
}

function classify(r: Row): {
  bucket: "PRESERVE_REAL_OR_INTEGRATION" | "DELETE_PROVEN_TEST" | "REVIEW_UNKNOWN";
  reasons: string[];
  signals: Record<string, unknown>;
} {
  const reasons: string[] = [];
  const signals: Record<string, unknown> = {};

  const name = String(r.customer_name || "");
  const email = r.customer_email;
  const phone = classifyPhone(r.customer_phone);
  const dom = emailDomain(email);
  const ch = String(r.channel);

  signals.phone = phone;
  signals.email_domain = dom;
  signals.channel = ch;
  signals.message_count = r.message_count;

  // ---------- DELETE_PROVEN_TEST signals ----------
  // Strong test markers — any single one is sufficient.
  let testMarkers = 0;
  if (TEST_NAME_REGEX.test(name)) {
    reasons.push(`name_matches_test_regex ('${name}')`);
    testMarkers++;
  }
  if (SPRINT_TEST_PREFIX_REGEX.test(name)) {
    reasons.push(`name_matches_sprint_or_workflow_prefix ('${name}')`);
    testMarkers++;
  }
  if (phone.is_555_anywhere) {
    reasons.push(
      `phone_555_${phone.is_555_npa ? "npa" : "nxx"} ('${r.customer_phone}')`,
    );
    testMarkers++;
  }
  if (phone.is_operator) {
    reasons.push(`phone_operator ('${r.customer_phone}')`);
    testMarkers++;
  }
  if (email && OPERATOR_PERSONAL_EMAILS.includes(email.toLowerCase())) {
    reasons.push(`email_operator_personal ('${email}')`);
    testMarkers++;
  }
  // wf-resend-* / wf-svc-agent-* test fixtures — any email with "wf-" prefix.
  if (email && /^wf-[a-z]+-/.test(email.toLowerCase())) {
    reasons.push(`email_workflow_test_fixture ('${email}')`);
    testMarkers++;
  }

  if (testMarkers > 0) {
    return { bucket: "DELETE_PROVEN_TEST", reasons, signals };
  }

  // ---------- PRESERVE_REAL_OR_INTEGRATION signals ----------
  // VAPI inbound voice with non-test phone + at least 1 message — strongest
  // single signal under the new policy.
  if (
    ch === "voice" &&
    !phone.is_555_anywhere &&
    !phone.is_operator &&
    r.message_count >= 1
  ) {
    reasons.push(
      `vapi_inbound_voice_with_real_phone (channel=voice, phone=${r.customer_phone}, msgs=${r.message_count})`,
    );
    return { bucket: "PRESERVE_REAL_OR_INTEGRATION", reasons, signals };
  }

  // Internal real-user email domains owning a conversation — real interaction.
  if (dom && INTERNAL_USER_DOMAINS.includes(dom)) {
    reasons.push(`internal_user_email_domain (${dom})`);
    // If it has messages, it's a real interaction. Even with 0 messages the
    // owner is a real user; the policy says PRESERVE the user, but the
    // empty conversation row itself is questionable. Distinguish:
    if (r.message_count >= 1) {
      reasons.push(`has_${r.message_count}_messages`);
      return { bucket: "PRESERVE_REAL_OR_INTEGRATION", reasons, signals };
    } else {
      // Real user, but the conversation row has no thread content. Flag for
      // operator review under the new policy (was DELETE under old).
      reasons.push(`zero_messages_but_real_user_email`);
      return { bucket: "REVIEW_UNKNOWN", reasons, signals };
    }
  }

  // Real-looking email (any non-test domain not already matched above).
  if (email && dom) {
    // Already filtered out operator-personal emails above. Anything else
    // with a domain string is a real-looking email.
    reasons.push(`real_looking_email_domain (${dom})`);
    if (r.message_count >= 1) {
      reasons.push(`has_${r.message_count}_messages`);
      return { bucket: "PRESERVE_REAL_OR_INTEGRATION", reasons, signals };
    } else {
      reasons.push(`zero_messages_but_real_email`);
      return { bucket: "REVIEW_UNKNOWN", reasons, signals };
    }
  }

  // Voice channel with non-test phone but ZERO messages — could be a
  // hangup/no-thread case (I-NEW-2026-04-26-D) for a real call. Per
  // operator policy (VAPI inbound: "treat as real unless proven test"),
  // and since we cannot prove this is test, this goes to REVIEW.
  if (
    ch === "voice" &&
    !phone.is_555_anywhere &&
    !phone.is_operator &&
    r.message_count === 0
  ) {
    reasons.push(
      `voice_zero_msgs_real_phone (possible real call w/ failed transcript, NEEDS_REVIEW per VAPI policy)`,
    );
    return { bucket: "REVIEW_UNKNOWN", reasons, signals };
  }

  // SMS channel with non-test phone + messages: real-looking SMS thread.
  if (
    ch === "sms" &&
    !phone.is_555_anywhere &&
    !phone.is_operator &&
    r.message_count >= 1
  ) {
    reasons.push(
      `sms_with_real_phone_and_messages (channel=sms, phone=${r.customer_phone}, msgs=${r.message_count})`,
    );
    // SMS is "not in customer use yet" per the integration-status table,
    // but a real phone with real messages is hard to disprove without
    // looking at content (which we don't have). Default to REVIEW per
    // policy ("classify before delete").
    return { bucket: "REVIEW_UNKNOWN", reasons, signals };
  }

  // ai-chat / chat / ai-assistant channels:
  // - Per the integration-status table: TextMagic/SMS, Tavus, Outbound
  //   Triggers are not in customer use yet. Web chat sessions
  //   (ai-chat/chat) before launch are likely operator/dealer testing.
  // - But we don't have message-content here, so we can't be sure.
  if (["ai-chat", "chat", "ai-assistant"].includes(ch)) {
    if (r.message_count === 0) {
      // Empty chat conversation. No identity, no content — almost
      // certainly a chat-init artifact (I-NEW-2026-04-26-B). Could be
      // either DELETE_PROVEN_TEST or REVIEW. Without identity we err on
      // REVIEW per the new policy ("classify before delete").
      reasons.push(`empty_chat_no_identity_no_content`);
      return { bucket: "REVIEW_UNKNOWN", reasons, signals };
    } else {
      // Has messages. Without content we can't determine if it's real or
      // test. REVIEW.
      reasons.push(
        `chat_with_messages_no_content_to_inspect (msgs=${r.message_count})`,
      );
      return { bucket: "REVIEW_UNKNOWN", reasons, signals };
    }
  }

  // Voice with operator phone: covered above (testMarkers > 0). Nothing
  // should fall through, but if it does, REVIEW.
  reasons.push(`unclassified_default_review`);
  return { bucket: "REVIEW_UNKNOWN", reasons, signals };
}

function main() {
  const raw = readFileSync(PREVIEW_PATH, "utf-8");
  const data = JSON.parse(raw);
  const rows: Row[] = data.full_rows;

  // SNAPSHOT INTEGRITY CHECK — surface what the saved JSON does and does
  // NOT contain. The 176 cascaded message rows are NOT in the snapshot;
  // any restore plan must account for that gap.
  const snapshotIntegrity = {
    has_full_conversation_columns: rows.length > 0 && "id" in rows[0] && "customer_name" in rows[0],
    has_per_conversation_message_count: rows.length > 0 && "message_count" in rows[0],
    captures_individual_message_rows_with_content: false,
    captures_message_role_sender_or_created_at: false,
    note:
      "The DELETE was DELETE FROM conversations WHERE organization_id = $1, which CASCADE-deleted 176 message rows via messages.conversation_id ON DELETE CASCADE. The saved preview JSON only captured the 84 conversations rows + their per-row message_count — NOT the 176 individual messages. Restoring the conversation rows alone would re-create empty threads. Transcript content for any VAPI inbound calls (or other channels) was lost when the CASCADE fired. This is documented as a hard limitation in restore-plan-2026-04-27.md.",
  };

  const classified = rows.map((r) => {
    const c = classify(r);
    return {
      id: r.id,
      customer_name: r.customer_name,
      customer_phone: r.customer_phone,
      customer_email: r.customer_email,
      channel: r.channel,
      message_count: r.message_count,
      created_at: r.created_at,
      last_message_at: r.last_message_at,
      campaign_id: r.campaign_id,
      bucket: c.bucket,
      reasons: c.reasons,
      signals: c.signals,
      full_row: r,
    };
  });

  const buckets = {
    PRESERVE_REAL_OR_INTEGRATION: classified.filter(
      (c) => c.bucket === "PRESERVE_REAL_OR_INTEGRATION",
    ),
    DELETE_PROVEN_TEST: classified.filter(
      (c) => c.bucket === "DELETE_PROVEN_TEST",
    ),
    REVIEW_UNKNOWN: classified.filter((c) => c.bucket === "REVIEW_UNKNOWN"),
  };
  const summary = {
    total_deleted_rows: classified.length,
    total_cascaded_message_rows: data.messages_cascade_count,
    PRESERVE_REAL_OR_INTEGRATION: buckets.PRESERVE_REAL_OR_INTEGRATION.length,
    DELETE_PROVEN_TEST: buckets.DELETE_PROVEN_TEST.length,
    REVIEW_UNKNOWN: buckets.REVIEW_UNKNOWN.length,
    rows_that_should_not_have_been_deleted:
      buckets.PRESERVE_REAL_OR_INTEGRATION.length + buckets.REVIEW_UNKNOWN.length,
  };

  // Channel breakdown per bucket — useful for the operator's quick read.
  const channelByBucket: Record<string, Record<string, number>> = {
    PRESERVE_REAL_OR_INTEGRATION: {},
    DELETE_PROVEN_TEST: {},
    REVIEW_UNKNOWN: {},
  };
  for (const c of classified) {
    const m = channelByBucket[c.bucket];
    m[c.channel] = (m[c.channel] || 0) + 1;
  }

  // Cascade message count per bucket (how many messages went away in
  // each bucket — proxy for "how much real content is potentially lost").
  const messagesByBucket = {
    PRESERVE_REAL_OR_INTEGRATION: buckets.PRESERVE_REAL_OR_INTEGRATION.reduce(
      (s, r) => s + r.message_count,
      0,
    ),
    DELETE_PROVEN_TEST: buckets.DELETE_PROVEN_TEST.reduce(
      (s, r) => s + r.message_count,
      0,
    ),
    REVIEW_UNKNOWN: buckets.REVIEW_UNKNOWN.reduce(
      (s, r) => s + r.message_count,
      0,
    ),
  };

  const out = {
    classified_at: new Date().toISOString(),
    policy: "decisions.md 2026-04-27 (supersedes 2026-04-26)",
    source_snapshot: PREVIEW_PATH,
    source_snapshot_probed_at: data.probed_at,
    deletion_commit: "831bbc2",
    deletion_executed_at: data.probed_at, // approximate; the actual COMMIT was minutes later
    snapshot_integrity: snapshotIntegrity,
    summary,
    channel_by_bucket: channelByBucket,
    messages_by_bucket: messagesByBucket,
    buckets: {
      PRESERVE_REAL_OR_INTEGRATION: buckets.PRESERVE_REAL_OR_INTEGRATION.map(
        (c) => ({
          id: c.id,
          customer_name: c.customer_name,
          customer_phone: c.customer_phone,
          customer_email: c.customer_email,
          channel: c.channel,
          message_count: c.message_count,
          created_at: c.created_at,
          campaign_id: c.campaign_id,
          reasons: c.reasons,
          full_row: c.full_row,
        }),
      ),
      REVIEW_UNKNOWN: buckets.REVIEW_UNKNOWN.map((c) => ({
        id: c.id,
        customer_name: c.customer_name,
        customer_phone: c.customer_phone,
        customer_email: c.customer_email,
        channel: c.channel,
        message_count: c.message_count,
        created_at: c.created_at,
        campaign_id: c.campaign_id,
        reasons: c.reasons,
        full_row: c.full_row,
      })),
      DELETE_PROVEN_TEST: buckets.DELETE_PROVEN_TEST.map((c) => ({
        id: c.id,
        customer_name: c.customer_name,
        customer_phone: c.customer_phone,
        customer_email: c.customer_email,
        channel: c.channel,
        message_count: c.message_count,
        created_at: c.created_at,
        reasons: c.reasons,
      })),
    },
  };

  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));

  // Compact stdout summary.
  const compact = {
    classified_at: out.classified_at,
    policy: out.policy,
    deletion_commit: out.deletion_commit,
    snapshot_integrity_summary: {
      conversations_columns_captured: snapshotIntegrity.has_full_conversation_columns,
      message_content_captured: snapshotIntegrity.captures_individual_message_rows_with_content,
      total_lost_message_rows: data.messages_cascade_count,
    },
    summary: out.summary,
    channel_by_bucket: out.channel_by_bucket,
    messages_by_bucket: out.messages_by_bucket,
    output_path: OUT_PATH,
  };
  console.log(JSON.stringify(compact, null, 2));
}

main();
