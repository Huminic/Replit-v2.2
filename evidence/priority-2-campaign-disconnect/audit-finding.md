# Priority #2 — Campaign disconnect false-block — audit finding

**Date:** 2026-04-27
**Source code under audit:** `server/outbound.ts:509-519` (pre-fix)
**Caller under audit:** `server/outbound.ts:478-483` (`checkCommGate`)
**Reporter:** launch-readiness closeout queue, item #3 ("Fix campaign disconnect false-block if confirmed").

## Verdict

**FIX-NEEDED — bug confirmed.**

## Pre-fix code

```ts
async function getConversationForRecipient(
  organizationId: string,
  recipient: CampaignRecipient,   // ← parameter declared
  campaignId?: string
) {
  if (!campaignId) return undefined;
  const conversations = await storage.getConversations(organizationId, {});
  return conversations.find(
    c => c.campaignId === campaignId   // ← recipient parameter UNUSED
  );
}
```

## Bug shape

The function takes a `recipient` parameter but does not use it. It returns the first conversation in the org whose `campaignId` matches the supplied campaignId — regardless of which recipient that conversation actually belongs to.

The caller at `server/outbound.ts:478-483` reads `conversation?.campaignDisconnected` and blocks with reason `"Recipient disconnected from campaign"` if true:

```ts
if (recipient) {
  const conversation = await getConversationForRecipient(org.id, recipient, campaign?.id);
  if (conversation?.campaignDisconnected) {
    return { allowed: false, reason: "Recipient disconnected from campaign" };
  }
}
```

Combined effect: if recipient-A's conversation row in a campaign has `campaignDisconnected=true`, every other recipient in the same campaign (B, C, D, E, …) is wrongly blocked because they all receive A's row from the lookup. The user-visible symptom: one user replying STOP appears to block the entire campaign for unrelated recipients.

## Reproduction (audit script)

`evidence/priority-2-campaign-disconnect/audit-buggy-vs-fixed.ts` re-implements both versions and runs them against a five-recipient fixture campaign (Alice, Bob, Carol, Dave, Eve) where only Bob's row is `campaignDisconnected=true` and only Dave has another (active) row in the campaign.

Trace excerpt (`audit-buggy-vs-fixed-trace.txt`):

```
Scenario A — pre-fix BUGGY behavior (recipient param ignored)
========================================================================
rcpt-1 (Alice, phone=+14805550001): conv-bob ... campaignDisconnected=true  → caller WOULD block: YES
rcpt-2 (Bob,   phone=+14805550002): conv-bob ... campaignDisconnected=true  → caller WOULD block: YES
rcpt-3 (Carol, phone=+14805550003): conv-bob ... campaignDisconnected=true  → caller WOULD block: YES
rcpt-4 (Dave,  phone=+14805550004): conv-bob ... campaignDisconnected=true  → caller WOULD block: YES
rcpt-5 (Eve,   phone=+14805550005): conv-bob ... campaignDisconnected=true  → caller WOULD block: YES

Buggy: 5/5 recipients would be blocked.
DEMONSTRATED — the bug returns the disconnected row for all five recipients.

Scenario B — post-fix behavior (recipient identity scoped)
========================================================================
rcpt-1 (Alice): <undefined>  (caller treats as: not blocked, first send)
rcpt-2 (Bob):   conv-bob   campaignDisconnected=true  → caller WOULD block: YES
rcpt-3 (Carol): <undefined>  (caller treats as: not blocked, first send)
rcpt-4 (Dave):  conv-dave  campaignDisconnected=false → caller WOULD block: no
rcpt-5 (Eve):   <undefined>  (caller treats as: not blocked, first send)

Fixed: 1/5 recipients would be blocked.
PASS — only Bob is blocked; Alice, Carol, Dave, Eve are NOT cross-blocked.
```

## Fix shape

The fix scopes matching by recipient identity in addition to campaignId:

- A pure helper `findConversationForRecipient(conversations, recipient, campaignId)` is added.
- A pure helper `phoneVariantsForRecipientMatch(phone)` mirrors the variant set used by `storage.getConversationByPhone` (`server/storage.ts:431-435`): `normalizedPhone`, `digitsOnly`, `without1`, `with1`, `+with1`. So a stored `"+14805550199"` matches a recipient typed as `"4805550199"`, `"14805550199"`, `"(480) 555-0199"`, etc.
- A conversation matches a recipient when `c.campaignId === campaignId` AND any of:
  - `c.customerPhone` is in the recipient's phone variant set, OR
  - `c.customerEmail` (case-insensitive, trimmed) equals the recipient's email.
- Recipient with neither phone nor email → returns `undefined`. Caller treats `undefined` as "no prior conversation" and the recipient is NOT blocked. This is the correct sentinel: the alternative (returning the first campaign-matching conversation as the pre-fix function did) is exactly the bug being fixed.

`getConversationForRecipient` is now a thin async wrapper that calls `storage.getConversations(organizationId, {})` and forwards to `findConversationForRecipient`.

## Test coverage

`tests/unit/getConversationForRecipient.test.ts` — 24 cases:

- 6 cases for `phoneVariantsForRecipientMatch` (E.164, 10-digit, 11-digit, formatted, null/empty, de-dup).
- 2 cases for the actual bug shape (recipient-A disconnected ≠ blocking recipient-B).
- 5 cases for phone-variant matching across formats.
- 5 cases for email matching (case-insensitive, whitespace-trimmed, no cross-match, phone+email OR semantics).
- 4 cases for no-match / undefined sentinel (no phone+no email, whitespace-only phone, empty conversations, different campaign).
- 2 end-to-end scenarios (five-recipient campaign, same recipient in two campaigns).

## Audit script run command

```bash
set -a; source .env; set +a
npx tsx evidence/priority-2-campaign-disconnect/audit-buggy-vs-fixed.ts \
  > evidence/priority-2-campaign-disconnect/audit-buggy-vs-fixed-trace.txt
```

Note: the audit script imports from `server/outbound.ts`, which transitively loads `server/auth.ts` (requires `JWT_SECRET`) and `server/vendorProxy.ts` (warns on unset `NEXXUS_ORG_MAP`). Both are resolved by sourcing `.env` first; the vendorProxy parse warning is harmless and unrelated to the audit logic.

## Six scenarios — all PASS

| # | Scenario | Pre-fix | Post-fix | Outcome |
|---|---|---|---|---|
| A | Buggy reproduction (5 recipients, 1 disconnected) | 5/5 blocked | n/a | DEMONSTRATED |
| B | Fixed five-recipient campaign | n/a | 1/5 blocked (the right one) | PASS |
| C | Phone-format variance (E.164, 11-digit, 10-digit, formatted) | n/a | 4/4 match | PASS |
| D | Email-only recipient (Alice disconnected, Bob active) | n/a | each gets own row | PASS |
| E | Null-identity recipient | returns A's disconnected row | undefined | PASS (no false block) |
| F | Same phone in two campaigns (camp-A disconnected, camp-B active) | n/a | A blocks, B passes | PASS (no cross-campaign leak) |

## Constraints honored

- Forward-only fix; no DB migration; no schema change; no UI change.
- No production deploy; no rebuild; no PM2 restart; no provider sends; no DB writes from tests (mocked).
- Pre-fix "buggy" function exists ONLY in the audit script for behavioral comparison; production code has been replaced.
