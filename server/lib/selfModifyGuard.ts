/**
 * Pure self-mutation guards for user-management PATCH routes.
 *
 * I-249 (Wave 9-Sec): PATCH /api/users/:id at server/routes/users.ts:179
 * accepted `isActive: false` from any roleLevel <= 3 caller against any
 * target including their own row. A distracted org_admin could lock
 * themselves out by toggling their own active flag, forcing a super_admin
 * to recover them.
 *
 * Rule: an actor may not deactivate themselves. Re-activation (true) is
 * harmless and allowed; only the false-toggle on one's own row is blocked.
 *
 * Related self-mutation defects (self-role-change in the same handler at
 * users.ts:197-204) are flagged as separate scope — not gated here.
 */

export function isSelfDeactivationAttempt(
  actor: { id: string } | null | undefined,
  targetParams: { id?: string | null | undefined },
  body: Record<string, unknown>,
): boolean {
  if (!actor || !actor.id) return false;
  if (!targetParams || actor.id !== targetParams.id) return false;
  return body?.isActive === false;
}
