/**
 * Pure role-level guard for user-management mutations.
 *
 * The role-level model in this codebase: LOWER number = HIGHER privilege.
 *   1 = super_admin
 *   2 = partner_admin
 *   3 = org_admin
 *   4 = executive
 *   5 = sales_manager
 *   6 = sales / 7 = service / 8 = marketing / etc.
 *
 * Rule: an actor can only ASSIGN a role at their own level OR LOWER privilege
 * (numerically equal or HIGHER level number). An org_admin (level 3) cannot
 * create a partner_admin (level 2) or super_admin (level 1).
 *
 * This module extracts the inline check that was already present at three
 * sites in server/routes/users.ts (POST /api/users line 56-58,
 * PATCH /api/users/:id lines 184-187 + 195-197, POST /api/users/invite
 * lines 332-336). Behavior is preserved byte-for-byte; the extraction only
 * makes the rule unit-testable.
 *
 * This is the load-bearing security check for I-246. The companion UI
 * filter in client/src/pages/settings.tsx is UX only — the server is what
 * actually rejects.
 */

/**
 * Returns true if an actor at `actorRoleLevel` is allowed to assign a role
 * at `targetRoleLevel`.
 *
 *   canAssignRole(3, 1) -> false  (org_admin cannot assign super_admin)
 *   canAssignRole(3, 3) -> true   (org_admin can assign org_admin)
 *   canAssignRole(3, 6) -> true   (org_admin can assign sales)
 *   canAssignRole(1, 1) -> true   (super_admin can assign super_admin)
 *   canAssignRole(2, 3) -> true   (partner_admin can assign org_admin)
 */
export function canAssignRole(actorRoleLevel: number, targetRoleLevel: number): boolean {
  return targetRoleLevel >= actorRoleLevel;
}
