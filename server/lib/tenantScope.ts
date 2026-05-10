/**
 * Pure tenant-scoping helper for vendor-proxy read endpoints.
 *
 * I-244: handlers like GET /api/vin/leads/summary previously accepted
 * `?orgId=<uuid>` from any authenticated user and used it verbatim, allowing
 * an org_admin (roleLevel = 3) of org A to read org B's data by passing
 * org B's UUID.
 *
 * Rule: only roleLevel <= 2 (super_admin = 1, partner_admin = 2) may use a
 * caller-supplied orgId override (they have legitimate cross-org access).
 * For roleLevel > 2 the override is IGNORED and the user's own
 * organizationId is enforced.
 *
 * The role-level model: LOWER number = HIGHER privilege (see roleGuard.ts).
 */

export function resolveEffectiveOrgId(
  roleLevel: number,
  queryOrgId: string | undefined,
  userOrgId: string,
): string {
  if (roleLevel > 2) return userOrgId;
  return queryOrgId || userOrgId;
}
