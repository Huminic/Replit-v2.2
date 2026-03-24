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
    email: "duane.wells@huminic.ai",
    password: TEST_PASSWORD,
    role: "super_admin",
    orgName: "Huminic",
  },
  partnerAdmin: {
    email: "duanekwells@gmail.com",
    password: TEST_PASSWORD,
    role: "partner_admin",
    orgName: "Cage Automotive",
  },
  cagePartnerAdmin: {
    email: "duanekwells@gmail.com",
    password: TEST_PASSWORD,
    role: "partner_admin",
    orgName: "Cage Automotive",
  },
  orgAdmin: {
    email: "serra_honda@huminic.ai",
    password: TEST_PASSWORD,
    role: "org_admin",
    orgName: "Serra Honda",
  },
  // Role aliases — all map to Serra Honda org_admin (DB determines actual role)
  executive: {
    email: "serra_honda@huminic.ai",
    password: TEST_PASSWORD,
    role: "org_admin",
    orgName: "Serra Honda",
  },
  sales: {
    email: "serra_honda@huminic.ai",
    password: TEST_PASSWORD,
    role: "org_admin",
    orgName: "Serra Honda",
  },
  service: {
    email: "serra_honda@huminic.ai",
    password: TEST_PASSWORD,
    role: "org_admin",
    orgName: "Serra Honda",
  },
  marketing: {
    email: "serra_honda@huminic.ai",
    password: TEST_PASSWORD,
    role: "org_admin",
    orgName: "Serra Honda",
  },
  // Per-dealer org admin accounts
  serraNissan: {
    email: "serra_nissan@huminic.ai",
    password: TEST_PASSWORD,
    role: "org_admin",
    orgName: "Serra Nissan",
  },
  serraFord: {
    email: "serra_ford@huminic.ai",
    password: TEST_PASSWORD,
    role: "org_admin",
    orgName: "Tony Serra Ford",
  },
  columbiaHyundai: {
    email: "columbia_hyundai@huminic.ai",
    password: TEST_PASSWORD,
    role: "org_admin",
    orgName: "Hyundai of Columbia",
  },
  columbiaFord: {
    email: "columbia_ford@huminic.ai",
    password: TEST_PASSWORD,
    role: "org_admin",
    orgName: "Ford of Columbia",
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
 * Browser-based login that bypasses the SPA login form.
 * Uses API login to get the token, then navigates directly to the target page.
 * This avoids React Router SPA navigation timing issues in headless Chromium.
 *
 * The server sets an httpOnly refresh cookie on login response. Playwright's
 * page.request shares the cookie jar with the page, so the cookie is
 * automatically available when page.goto() loads the app and AuthContext
 * calls /api/auth/refresh.
 *
 * Cache strategy: the file cache stores access tokens for API tests, but
 * browser tests always need a fresh login to establish the httpOnly cookie
 * in each new browser context. We skip the cache for browser login.
 */
export async function loginForBrowser(
  page: import("playwright/test").Page,
  user: AuthUser,
  targetPath: string = "/"
): Promise<{ token: string; userId: string; organizationId: string }> {
  // Always perform a real login to ensure the httpOnly refresh cookie is set
  // in this browser context's cookie jar. The file-based cache only stores
  // access tokens — it cannot transfer httpOnly cookies between contexts.
  const response = await page.request.post("/api/auth/login", {
    data: { email: user.email, password: user.password },
  });

  if (!response.ok()) {
    throw new Error(`Login failed for ${user.email}: ${response.status()} ${await response.text()}`);
  }

  const body = await response.json();
  const result = {
    token: body.accessToken,
    userId: body.user.id,
    organizationId: body.user.organization.id,
  };

  // Update file cache (used by API-only tests via login())
  const cache = readCache();
  cache[user.email] = { ...result, timestamp: Date.now() };
  writeCache(cache);

  // Dismiss product tour overlays before navigation so they don't block
  // test interactions. The tour checks localStorage keys per page segment
  // with prefix 'nexxus_tour_dismissed_' and has an 800ms delay before showing.
  // Use addInitScript to set keys before any page JS runs.
  await page.addInitScript(() => {
    const prefix = 'nexxus_tour_dismissed_';
    const pageKeys = [
      'main', 'teambox', 'my-work', 'sales', 'service', 'marketing',
      'management', 'agents', 'insights', 'settings', 'profile', 'usage'
    ];
    for (const key of pageKeys) {
      localStorage.setItem(prefix + key, 'true');
    }
  });

  // Navigate to target page — the httpOnly refresh cookie from the login
  // response is in the browser's cookie jar. When React boots, AuthContext
  // will call /api/auth/refresh with the cookie and get an access token.
  await page.goto(targetPath, { waitUntil: "domcontentloaded", timeout: 30000 });

  // Wait for React to hydrate and AuthContext to complete initAuth()
  await page.waitForTimeout(2000);

  return result;
}

/**
 * Clear the auth cache. Call before a fresh test run.
 */
export function clearAuthCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);
  } catch {}
}
