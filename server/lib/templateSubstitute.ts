/**
 * Pure helper for substituting org-context template variables in
 * agent.instructions strings BEFORE injecting into Claude's system prompt.
 *
 * Background: agent-instructions.json contains template strings such as
 *   "You are the Sales Coach for {{dealershipName}}."
 * The previous behavior at server/routes/chat.ts ~line 161 appended
 * agent.instructions verbatim to the system prompt. Claude saw the literal
 * string "{{dealershipName}}" in the context. Visible failure mode: when
 * Claude is asked to draft a customer-facing email or SMS template, it can
 * emit literal "{{dealershipName}}" in the drafted output (issues.md I-269).
 *
 * This helper substitutes ORG-CONTEXT placeholders only:
 *   {{dealershipName}}  -> org.name
 *
 * Other placeholders that agent-instructions.json defines as RUNTIME
 * placeholders for AI-drafted customer templates (e.g. {{customerName}},
 * {{vehicleOfInterest}}, {{salespersonName}}) are intentionally LEFT in
 * place. Those are instructions to Claude about which placeholders to use
 * in drafted templates, not values to substitute at system-prompt time.
 *
 * Pure / no IO. Unit-testable.
 */

export interface OrgContextSubstitutions {
  /** The organization's name (org.name from storage.getOrganization). */
  dealershipName: string;
}

/**
 * Substitute org-context template variables in a string. Currently handles
 * `{{dealershipName}}`. Returns a new string; does not mutate input.
 */
export function substituteOrgContext(
  text: string,
  ctx: OrgContextSubstitutions,
): string {
  if (!text) return text;
  // Replace ALL occurrences of `{{dealershipName}}` (case-sensitive, as
  // agent-instructions.json uses this exact spelling).
  return text.split("{{dealershipName}}").join(ctx.dealershipName);
}
