import { type APIRequestContext } from "playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AuthUser {
  email: string;
  password: string;
  role: string;
  orgName: string;
}

// Test credentials — password set during T-2 testing session
const TEST_PASSWORD = "NexxusTest2026";

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

// File-based token cache to survive across Playwright worker processes.
// The auth rate limiter allows 5 requests per 15 minutes per IP.
// Without caching, 12+ test files x 7 users = 84+ login calls = instant 429.
const CACHE_FILE = path.resolve(__dirname, "../../../.playwright-auth-cache.json");
const CACHE_MAX_AGE_MS = 50 * 60 * 1000; // 50 minutes (tokens expire in 60)

interface CachedAuth {
  token: string;
  userId: string;
  organizationId: string;
  timestamp: number;
}

function readCache(): Record<string, CachedAuth> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      // Invalidate if too old
      const now = Date.now();
      const valid: Record<string, CachedAuth> = {};
      for (const [key, val] of Object.entries(data)) {
        const cached = val as CachedAuth;
        if (now - cached.timestamp < CACHE_MAX_AGE_MS) {
          valid[key] = cached;
        }
      }
      return valid;
    }
  } catch {}
  return {};
}

function writeCache(cache: Record<string, CachedAuth>) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch {}
}

export async function login(
  request: APIRequestContext,
  user: AuthUser
): Promise<{ token: string; userId: string; organizationId: string }> {
  // Check file-based cache first
  const cache = readCache();
  const cached = cache[user.email];
  if (cached) {
    return { token: cached.token, userId: cached.userId, organizationId: cached.organizationId };
  }

  const response = await request.post("/api/auth/login", {
    data: { email: user.email, password: user.password },
  });

  if (!response.ok()) {
    throw new Error(
      `Login failed for ${user.email}: ${response.status()} ${await response.text()}`
    );
  }

  const body = await response.json();
  const result = {
    token: body.accessToken,
    userId: body.user.id,
    organizationId: body.user.organization.id,
  };

  // Save to file-based cache
  cache[user.email] = { ...result, timestamp: Date.now() };
  writeCache(cache);

  return result;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Clear the auth cache. Call before a fresh test run.
 */
export function clearAuthCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);
  } catch {}
}
