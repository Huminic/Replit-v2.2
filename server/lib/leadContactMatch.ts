/**
 * Pure helpers for matching warehouse_leads to conversations + computing
 * "Avg Time to 1st Contact" (lib-21).
 *
 * Match rule (mirrors the inline pattern at server/routes/insights.ts ~line
 * 907-911 and ~line 1015-1019): a conversation matches a lead when EITHER
 *   - phone match: last 10 digits of c.customerPhone include last 10 digits
 *     of lead.customerPhone (after stripping non-digits)
 *   - email match: c.customerEmail === lead.customerEmail (case-insensitive)
 *
 * "First contact" timestamp: the earliest matching conversation's createdAt.
 * The Conversation table doesn't carry a separate firstMessageAt column, but
 * the conversation row is created on the first inbound or outbound message,
 * so createdAt is a reasonable proxy. (See conversations schema in
 * shared/schema.ts.)
 *
 * "Avg Time to 1st Contact" returns:
 *   - the average days (vinCreatedAt -> first matching conversation
 *     createdAt) across leads with at least one matched conversation AND a
 *     non-null vinCreatedAt
 *   - null when no leads have a matched conversation (caller renders "—")
 *
 * Per issue I-260 ("compute average days between vinCreatedAt and first
 * conversation match"), we count only leads that actually have a matched
 * conversation. Counting unmatched leads as "infinity" would corrupt the
 * average and counting them as zero would inflate it; the right semantics
 * is "of the leads we did contact, how fast did we get to them?"
 *
 * No IO. Unit-testable.
 */

export interface LeadForContactMatch {
  customerPhone?: string | null;
  customerEmail?: string | null;
  vinCreatedAt?: string | Date | null;
  /** Fallback when vinCreatedAt is null. */
  createdAt?: string | Date | null;
}

export interface ConversationForContactMatch {
  customerPhone?: string | null;
  customerEmail?: string | null;
  createdAt: string | Date;
}

/** Strip non-digits, take the last 10 chars. Empty string if nothing left. */
function digits10(p: string | null | undefined): string {
  if (!p) return "";
  const onlyDigits = p.replace(/[^0-9]/g, "");
  return onlyDigits.slice(-10);
}

/**
 * Returns true when the given conversation is a contact for the given lead.
 * Phone match (last 10 digits) OR email match (case-insensitive). Either side
 * being missing on the relevant field disqualifies that match channel.
 */
export function conversationMatchesLead(
  lead: LeadForContactMatch,
  conv: ConversationForContactMatch,
): boolean {
  // Phone match
  const leadPhone10 = digits10(lead.customerPhone);
  const convPhone10 = digits10(conv.customerPhone);
  if (leadPhone10 && convPhone10 && convPhone10.includes(leadPhone10)) {
    return true;
  }
  // Email match
  if (
    lead.customerEmail &&
    conv.customerEmail &&
    lead.customerEmail.toLowerCase() === conv.customerEmail.toLowerCase()
  ) {
    return true;
  }
  return false;
}

/**
 * For a single lead, find the EARLIEST matching conversation by createdAt.
 * Returns the conversation or null.
 */
export function findEarliestMatchingConversation(
  lead: LeadForContactMatch,
  conversations: ConversationForContactMatch[],
): ConversationForContactMatch | null {
  let earliest: ConversationForContactMatch | null = null;
  let earliestMs = Number.POSITIVE_INFINITY;
  for (const conv of conversations) {
    if (!conversationMatchesLead(lead, conv)) continue;
    const t = new Date(conv.createdAt).getTime();
    if (Number.isNaN(t)) continue;
    if (t < earliestMs) {
      earliestMs = t;
      earliest = conv;
    }
  }
  return earliest;
}

/**
 * Compute the average days between vinCreatedAt and the earliest matching
 * conversation's createdAt, across all leads with at least one matched
 * conversation AND a usable vinCreatedAt (or createdAt fallback).
 *
 * Returns null when the matched-leads count is zero (caller renders "—").
 *
 * Negative durations (conversation predates VIN lead creation — possible
 * when an inbound chat creates the lead retroactively, or when timestamps
 * are skewed) are clamped to zero rather than dropped, matching how a human
 * reads "we got to them very quickly."
 */
export function computeAvgDaysToFirstContact(
  leads: LeadForContactMatch[],
  conversations: ConversationForContactMatch[],
): { avgDays: number; sampleSize: number } | null {
  let totalDays = 0;
  let sampleSize = 0;
  for (const lead of leads) {
    const created = lead.vinCreatedAt ?? lead.createdAt;
    if (!created) continue;
    const createdMs = new Date(created).getTime();
    if (Number.isNaN(createdMs)) continue;
    const earliest = findEarliestMatchingConversation(lead, conversations);
    if (!earliest) continue;
    const convMs = new Date(earliest.createdAt).getTime();
    if (Number.isNaN(convMs)) continue;
    const diffMs = Math.max(0, convMs - createdMs);
    totalDays += diffMs / (1000 * 60 * 60 * 24);
    sampleSize++;
  }
  if (sampleSize === 0) return null;
  return { avgDays: totalDays / sampleSize, sampleSize };
}

/**
 * Format the avgDays value for display. One decimal place, "days" suffix.
 * Returns "<1 day" for sub-day values (still under 24h average).
 */
export function formatAvgDaysToFirstContact(avgDays: number): string {
  if (avgDays < 1) {
    const hours = Math.round(avgDays * 24);
    if (hours === 0) return "<1 hour";
    return `${hours}h`;
  }
  return `${Math.round(avgDays * 10) / 10} days`;
}
