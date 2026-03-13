/**
 * Lightweight API test client.
 * Wraps fetch to hit the local dev server with sensible defaults.
 */
import { getTestAuthToken, getAuthHeaders } from "./auth";

const BASE_URL = process.env.TEST_API_URL || "http://localhost:5000";

export interface ApiResponse<T = unknown> {
  status: number;
  ok: boolean;
  data: T;
  headers: Headers;
}

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}`;

  // Default to authenticated request if no Authorization header provided
  const defaultHeaders = headers ?? getAuthHeaders(getTestAuthToken());

  const options: RequestInit = {
    method,
    headers: defaultHeaders,
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  let data: T;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = (await res.json()) as T;
  } else {
    data = (await res.text()) as unknown as T;
  }

  return {
    status: res.status,
    ok: res.ok,
    data,
    headers: res.headers,
  };
}

export function get<T = unknown>(
  path: string,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  return request<T>("GET", path, undefined, headers);
}

export function post<T = unknown>(
  path: string,
  body: unknown,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  return request<T>("POST", path, body, headers);
}

export function patch<T = unknown>(
  path: string,
  body: unknown,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  return request<T>("PATCH", path, body, headers);
}

export function del<T = unknown>(
  path: string,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  return request<T>("DELETE", path, undefined, headers);
}
