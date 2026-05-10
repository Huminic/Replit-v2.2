/**
 * AI-config field-allowlist gate for org-settings writes.
 *
 * I-245: PATCH /api/settings/org previously merged the entire request body
 * into org.settings under `requireRole(3)`. The UI hides the AI-config tile
 * for roleLevel > 2 (org_admin and lower), but the API did not enforce it —
 * an org_admin could PATCH AI-behavior fields directly and corrupt the
 * assistant for their dealership.
 *
 * Rule: only roleLevel <= 2 (super_admin = 1, partner_admin = 2) may write
 * AI-behavior fields. For roleLevel > 2 those fields are stripped from the
 * request body before the merge; all other fields (branding, business
 * hours, notifications, appearance, hunches toggle, etc.) pass through.
 *
 * Allowlist is intentionally narrow: only fields the AI-config tile in
 * client/src/pages/settings.tsx writes via /api/settings/org. Provider IDs
 * (vapiAssistantId, tavusPersonaId) are NOT written through this endpoint
 * (they live on per-agent records), so they are out of scope here.
 *
 * Fields gated:
 *  - aiModel               client/src/pages/settings.tsx:3184
 *  - systemPrompt          client/src/pages/settings.tsx:3216, :3241
 *  - chatInstructions      client/src/pages/settings.tsx:3233, :3241
 *
 * `hunchesEnabled` (settings.tsx:3303) is INTENTIONALLY excluded: it is an
 * operational on/off toggle for the org's own hunches feature, not a
 * prompt/instruction field that corrupts AI output content. An org_admin
 * legitimately controls it for their own org.
 */

export const AI_CONFIG_FIELDS = [
  "aiModel",
  "systemPrompt",
  "chatInstructions",
] as const;

export function stripAiFieldsForLowerRoles<T extends Record<string, unknown>>(
  body: T,
  roleLevel: number,
): T {
  if (roleLevel <= 2) return body;
  const out: Record<string, unknown> = { ...body };
  for (const field of AI_CONFIG_FIELDS) {
    delete out[field];
  }
  return out as T;
}
