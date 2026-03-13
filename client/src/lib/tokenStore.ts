/**
 * In-memory token store for access tokens.
 * Access tokens are never persisted to localStorage — they live only in memory.
 * On page refresh, AuthContext re-obtains the token via the httpOnly refresh cookie.
 */

let accessToken: string | null = null;
let tokenExpiry: number | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null, expiresIn?: number): void {
  accessToken = token;
  if (token && expiresIn) {
    tokenExpiry = Date.now() + (expiresIn * 1000);
  } else if (!token) {
    tokenExpiry = null;
  }
}

export function isTokenExpiringSoon(): boolean {
  if (!tokenExpiry) return true;
  const fiveMinutes = 5 * 60 * 1000;
  return (tokenExpiry - Date.now()) < fiveMinutes;
}

export function clearAccessToken(): void {
  accessToken = null;
  tokenExpiry = null;
}
