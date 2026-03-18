import { type APIRequestContext } from "playwright/test";

export interface AuthUser {
  email: string;
  password: string;
  role: string;
  orgName: string;
}

// Test credentials — password set during T-2 testing session
const TEST_PASSWORD = "TestPass2026!";

export const testUsers: Record<string, AuthUser> = {
  superAdmin: {
    email: "admin@nexxus.com",
    password: TEST_PASSWORD,
    role: "super_admin",
    orgName: "Huminic",
  },
  partnerAdmin: {
    email: "partner@nexxus.com",
    password: TEST_PASSWORD,
    role: "partner_admin",
    orgName: "Serra Honda",
  },
  orgAdmin: {
    email: "orgadmin@serrahonda.com",
    password: TEST_PASSWORD,
    role: "org_admin",
    orgName: "Serra Honda",
  },
  executive: {
    email: "executive@serrahonda.com",
    password: TEST_PASSWORD,
    role: "executive",
    orgName: "Serra Honda",
  },
  sales: {
    email: "sales@serrahonda.com",
    password: TEST_PASSWORD,
    role: "sales",
    orgName: "Serra Honda",
  },
  service: {
    email: "service@serrahonda.com",
    password: TEST_PASSWORD,
    role: "service",
    orgName: "Serra Honda",
  },
  marketing: {
    email: "marketing@serrahonda.com",
    password: TEST_PASSWORD,
    role: "marketing",
    orgName: "Serra Honda",
  },
};

export async function login(
  request: APIRequestContext,
  user: AuthUser
): Promise<{ token: string; userId: string; organizationId: string }> {
  const response = await request.post("/api/auth/login", {
    data: { email: user.email, password: user.password },
  });

  if (!response.ok()) {
    throw new Error(
      `Login failed for ${user.email}: ${response.status()} ${await response.text()}`
    );
  }

  const body = await response.json();
  return {
    token: body.accessToken,
    userId: body.user.id,
    organizationId: body.user.organization.id,
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
