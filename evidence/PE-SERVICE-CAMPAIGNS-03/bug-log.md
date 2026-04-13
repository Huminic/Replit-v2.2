# PE-SERVICE-CAMPAIGNS-03 Bug Log

**Date:** 2026-04-07
**Evaluator:** Orchestrator (API observation + code review)

---

## BUG-01: Phantom recipientCount on Oil Change Reminder (NEW)

**Severity:** Medium
**Status:** New finding
**Location:** Campaign data / API

**Description:** Oil Change Reminder campaign has `recipientCount=234` but GET /api/campaigns/{id}/recipients returns an empty array (0 recipients). The displayed count is a phantom — likely stale from before DATA-CLEANUP operations deleted recipients but failed to update the aggregate count.

**Impact:** Service managers would see "234 recipients" and attempt to execute, but the campaign would send 0 messages. Misleading and wastes time.

**Evidence:** API-05 (recipients endpoint returns []), API-01 (campaign shows recipientCount=234)

**False-pass risk:** HIGH. If an evaluator only checked the campaign table (recipientCount column), this would appear as a campaign ready for 234 sends. The reality is 0 sends possible.

---

## BUG-02: Duplicate recipients in Service Reminder campaign (CARRIED)

**Severity:** Low
**Status:** Carried from PE-01, still present
**Location:** Campaign recipients

**Description:** John Doe (phone 5551234567) appears twice in the Service Reminder - February campaign with different creation timestamps (2026-04-03T14:24:09 and 2026-04-03T14:26:39). CSV re-upload without deduplication.

**Impact:** If campaign were executed, John Doe would receive two SMS messages.

**Evidence:** API-05 (recipients endpoint shows duplicates)

---

## BUG-03: No confirmation dialog before Execute (CARRIED — CRITICAL)

**Severity:** High
**Status:** Carried from PE-01, still present
**Location:** client/src/pages/service.tsx, line ~465

**Description:** The Execute button (Play icon) directly calls `executeMutation.mutate({ id: campaign.id, dryRun: false })` with a single click. There is no "Are you sure you want to send SMS to N recipients?" confirmation dialog. A misclick on Execute sends real SMS via TextMagic to all campaign recipients.

**Impact:** Accidental campaign execution with real financial cost (TextMagic charges) and potential spam/compliance risk.

**Evidence:** CODE-02 (service.tsx Execute button onClick handler has no confirmation step)

**Remediation:** Add a confirmation dialog before executing with dryRun=false. Show recipient count, channel, and campaign name.

---

## BUG-04: No campaign filter in TeamBox (CARRIED)

**Severity:** Medium
**Status:** Carried from PE-TEAMBOX-01 and PE-01, still present
**Location:** TeamBox page

**Description:** No filter or visual indicator exists in TeamBox to identify campaign-originated conversations. The campaignId field exists on conversations but is never populated in observed data, and no filter exposes it.

**Evidence:** API-06 (3 SMS conversations, none with campaignId)

---

## BUG-05: Agent card shows wrong channel label (NEW)

**Severity:** Low
**Status:** New finding
**Location:** client/src/pages/service.tsx, Agents tab

**Description:** Agent cards display `agent.channels?.[0] || 'voice'` as the channel label. Nancy Gaston's channels are `["chat","sms"]`, so the card shows "chat". Prior screenshot (PE-01) showed "voice" — indicating the channels array may have been empty at that time. The fallback to "voice" is misleading when the agent is a chat+sms agent.

**Impact:** Minor visual confusion about agent capabilities.

**Evidence:** SS-05 shows "voice" label, API-03 shows channels=["chat","sms"]

---

## BUG-06: communicationGateEnabled is null (INFORMATIONAL)

**Severity:** Low (informational)
**Status:** Observed
**Location:** Organization settings

**Description:** Serra Honda's `communicationGateEnabled` field returns null/None from the API. The CommGate badge logic in service.tsx checks `!communicationGateEnabled` — since null is falsy, this should show the "Communications Paused" badge. However, prior screenshots do NOT show this badge, suggesting either: (a) the field defaults to true in the frontend context, or (b) there is a discrepancy between API response and AppContext state.

**Impact:** If CommGate is intended to be a safety gate for outbound sends, its null state needs clarification.

**Evidence:** API-07 (communicationGateEnabled=null)

---

## RESOLVED since PE-01

| Bug | Resolution |
|-----|------------|
| BUG-04 (PE-01): Test data pollution (137 campaigns) | RESOLVED by DATA-CLEANUP-01/02. Now 12 total (3 service). |
| I-193: CSV Template download missing | RESOLVED. Link present in UI. |

---

## Summary

| Bug ID | Severity | Category | Status | False-pass risk |
|--------|----------|----------|--------|-----------------|
| BUG-01 | Medium | Data integrity | New | HIGH |
| BUG-02 | Low | Data quality | Carried | Low |
| BUG-03 | High | Safety | Carried (CRITICAL) | Medium |
| BUG-04 | Medium | Missing feature | Carried | Medium |
| BUG-05 | Low | Display | New | Low |
| BUG-06 | Low | Configuration | Informational | Low |
