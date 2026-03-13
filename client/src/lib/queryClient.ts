import { QueryClient, QueryCache, QueryFunction } from "@tanstack/react-query";
import { getAccessToken, setAccessToken, clearAccessToken } from "./tokenStore";

let refreshPromise: Promise<boolean> | null = null;

function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function handleUnauthorized() {
  clearAccessToken();
  // Clear org data from localStorage (non-sensitive, just UI state)
  localStorage.removeItem('nexxus_accessible_orgs');
  if (window.location.pathname !== '/login') {
    sessionStorage.setItem('nexxus_session_expired', 'true');
    window.location.href = '/login';
  }
}

async function tryRefreshToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      // Refresh token is in httpOnly cookie — sent automatically with credentials: 'include'
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) return false;

      const data = await res.json();
      setAccessToken(data.accessToken, data.expiresIn);
      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function fetchWithAutoRefresh(url: string, init: RequestInit): Promise<Response> {
  let res = await fetch(url, init);

  if (res.status === 401) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newInit = { ...init, headers: getAuthHeaders(init.headers as Record<string, string> | undefined) };
      res = await fetch(url, newInit);
    }
  }

  return res;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 401) {
      handleUnauthorized();
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers = getAuthHeaders(data ? { "Content-Type": "application/json" } : {});

  const res = await fetchWithAutoRefresh(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const res = await fetchWithAutoRefresh(url, {
      headers: getAuthHeaders(),
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      console.error('Query error:', error.message);
    },
  }),
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      staleTime: 300000,
      retry: 3,
    },
    mutations: {
      retry: false,
    },
  },
});

// Re-export token functions for components that need direct access token
export { getAccessToken } from "./tokenStore";
