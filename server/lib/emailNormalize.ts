/**
 * Pure email normalization helper for lookup AND storage.
 *
 * AUTH-D (Wave 9-Sec): operator-confirmed 2026-03-20 silent-fail regression
 * on forgot-password. Root cause: storage layer does exact-match SQL
 * (`eq(users.email, email)` at server/storage.ts:259), so any case or
 * whitespace difference between the request body and the stored email
 * silently misses the row. The endpoint still returns HTTP 200 to prevent
 * enumeration, so the user thinks reset succeeded but no email is sent.
 *
 * Fix is applied at the route layer (storage layer is out of scope per
 * Wave 9-Sec S3 constraints). Login already lowercased at auth.ts:48; this
 * extracts the same normalization into a shared helper and applies it to:
 *
 *   - server/routes/auth.ts:353 (forgot-password lookup)            [primary]
 *   - server/routes/users.ts:50  (POST /api/users dup-check lookup) [discovered]
 *   - server/routes/users.ts:63  (POST /api/users createUser email) [discovered]
 *   - server/routes/users.ts:328 (POST invite dup-check lookup)     [discovered]
 *   - server/routes/users.ts:343 (POST invite createUser email)     [discovered]
 *
 * Without normalizing on WRITE (users.ts createUser calls), an admin who
 * invites `Serra_Honda@Huminic.ai` stores it cased, and later login or
 * forgot-password with `serra_honda@huminic.ai` would silently miss
 * regardless of read-side normalization.
 */

export function normalizeEmailForLookup(input: unknown): string {
  if (input == null) return "";
  return String(input).trim().toLowerCase();
}
