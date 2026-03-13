/**
 * Authentication test helpers.
 * Generates valid JWTs for making authenticated API calls in tests.
 */
import jwt from "jsonwebtoken";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_ROLE_ID = "00000000-0000-0000-0000-000000000001";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required for test auth. Set it in .env or environment.");
  }
  return secret;
}

export interface TestTokenOptions {
  userId?: string;
  organizationId?: string;
  roleId?: string;
  type?: "access" | "refresh";
  expiresIn?: string;
}

/**
 * Generate a valid JWT access token for testing.
 * Uses the real JWT_SECRET from .env so tokens pass server-side verification.
 */
export function getTestAuthToken(
  userId: string = DEFAULT_USER_ID,
  orgId: string = DEFAULT_ORG_ID,
  options: Partial<TestTokenOptions> = {}
): string {
  const payload = {
    userId,
    organizationId: orgId,
    roleId: options.roleId ?? DEFAULT_ROLE_ID,
    type: options.type ?? "access",
  };
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: options.expiresIn ?? "1h",
  });
}

/**
 * Return an Authorization header object suitable for fetch/request calls.
 */
export function getAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
