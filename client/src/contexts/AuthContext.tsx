/**
 * Authentication Context
 *
 * Manages user authentication state, JWT tokens, and auth operations.
 * Access tokens are stored in memory only (via tokenStore).
 * Refresh tokens are httpOnly cookies (never visible to JS).
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getAccessToken, setAccessToken, clearAccessToken, isTokenExpiringSoon } from '@/lib/tokenStore';

// User type matching backend response
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl?: string;
  role: {
    id: string;
    name: string;
    level: number;
  };
  organization: {
    id: string;
    name: string;
  };
}

// Accessible organization type
export interface AccessibleOrganization {
  id: string;
  name: string;
  slug: string;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  accessibleOrganizations: AccessibleOrganization[] | null;
  isAuthenticated: boolean;
  isPartnerAdmin: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  clearError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Non-sensitive UI state keys (these stay in localStorage)
const ACCESSIBLE_ORGS_KEY = 'nexxus_accessible_orgs';

// BroadcastChannel for cross-tab logout sync
let logoutChannel: BroadcastChannel | null = null;
try {
  logoutChannel = new BroadcastChannel('nexxus_auth');
} catch {
  // BroadcastChannel not supported — cross-tab sync disabled
}

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const [accessibleOrganizations, setAccessibleOrganizations] = useState<AccessibleOrganization[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Store access token in memory (via tokenStore module)
   */
  const storeToken = useCallback((access: string, expiresIn: number) => {
    setAccessToken(access, expiresIn);
    setAccessTokenState(access);
  }, []);

  /**
   * Clear all auth state
   */
  const clearAuth = useCallback(() => {
    clearAccessToken();
    setAccessTokenState(null);
    setAccessibleOrganizations(null);
    setUser(null);
    localStorage.removeItem(ACCESSIBLE_ORGS_KEY);
  }, []);

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Receive httpOnly cookie
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // Parse server error response safely — if JSON parsing fails, fall
        // back to status text so the user never sees a generic "Login failed"
        // when the server sent a specific message (I-055 fix).
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Store access token in memory only
      storeToken(data.accessToken, data.expiresIn);

      // Set user
      setUser(data.user);

      // Store accessible organizations (non-sensitive UI data, safe for localStorage)
      if (data.accessibleOrganizations) {
        setAccessibleOrganizations(data.accessibleOrganizations);
        localStorage.setItem(ACCESSIBLE_ORGS_KEY, JSON.stringify(data.accessibleOrganizations));
      } else {
        setAccessibleOrganizations(null);
        localStorage.removeItem(ACCESSIBLE_ORGS_KEY);
      }

      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      clearAuth();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   *
   * Redirect-first strategy: navigate to /login before clearing React state
   * to avoid race conditions where component re-renders hit unmounted DOM nodes
   * (I-056 fix).
   */
  const logout = async () => {
    try {
      const token = getAccessToken();

      // Call logout endpoint (also clears cookie server-side)
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }

    // Notify other tabs before redirecting
    logoutChannel?.postMessage('logout');

    // Clear auth state and redirect — use location.href so the full page
    // reloads, which avoids React trying to re-render components that
    // depend on the now-cleared auth state.
    clearAuth();
    window.location.href = '/login';
  };

  /**
   * Refresh access token via httpOnly cookie
   */
  const refreshToken = async () => {
    try {
      // Refresh token is in httpOnly cookie — sent automatically
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      // Store new access token in memory
      storeToken(data.accessToken, data.expiresIn);

      // Update user if provided
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Token refresh error:', err);
      clearAuth();
      setError('Session expired. Please login again.');
    }
  };

  /**
   * Fetch current user
   */
  const fetchUser = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Fetch user error:', err);
      clearAuth();
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Switch to a different organization (Partner Admin only)
   */
  const switchOrganization = async (organizationId: string) => {
    const { getAccessToken } = await import('@/lib/tokenStore');
    const token = getAccessToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch('/api/auth/switch-org', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to switch organization');
      }

      const data = await response.json();

      // Store new access token in memory
      storeToken(data.accessToken, data.expiresIn);

      // Update user with new organization
      if (user) {
        setUser({
          ...user,
          organization: data.organization,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to switch organization';
      setError(message);
      throw err;
    }
  };

  /**
   * Initialize auth state on mount — try refreshing via cookie
   */
  useEffect(() => {
    const initAuth = async () => {
      // Restore accessible organizations from localStorage (non-sensitive UI data)
      const storedOrgs = localStorage.getItem(ACCESSIBLE_ORGS_KEY);
      if (storedOrgs) {
        try {
          setAccessibleOrganizations(JSON.parse(storedOrgs));
        } catch {
          localStorage.removeItem(ACCESSIBLE_ORGS_KEY);
        }
      }

      // Try to get a new access token via the refresh cookie.
      // The refresh cookie is httpOnly so it's invisible to document.cookie.
      // We must attempt the refresh call and let the server decide if the
      // cookie is present. A 401/400 response simply means no valid session.
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          storeToken(data.accessToken, data.expiresIn);
          if (data.user) {
            setUser(data.user);
          } else {
            await fetchUser(data.accessToken);
          }
        }
        // If refresh fails, user simply isn't authenticated — no error shown
      } catch {
        // No valid session — user needs to login
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Auto-refresh token before expiry
   */
  useEffect(() => {
    if (!accessTokenState) return;

    const interval = setInterval(() => {
      if (isTokenExpiringSoon()) {
        refreshToken();
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [accessTokenState]);

  /**
   * Cross-tab logout synchronization via BroadcastChannel
   */
  useEffect(() => {
    if (!logoutChannel) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'logout') {
        clearAuth();
        window.location.href = '/login?expired=true';
      }
    };

    logoutChannel.addEventListener('message', handleMessage);
    return () => logoutChannel?.removeEventListener('message', handleMessage);
  }, [clearAuth]);

  const value: AuthContextType = {
    user,
    accessToken: accessTokenState,
    accessibleOrganizations,
    isAuthenticated: !!user && !!accessTokenState,
    isPartnerAdmin: user?.role.level === 2,
    loading,
    error,
    login,
    logout,
    refreshToken,
    switchOrganization,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
