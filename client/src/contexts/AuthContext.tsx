/**
 * Authentication Context
 *
 * Manages user authentication state, JWT tokens, and auth operations.
 * Provides login, logout, token refresh, and user state to entire app.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  locationId?: string;
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

// Token storage keys
const ACCESS_TOKEN_KEY = 'nexxus_access_token';
const REFRESH_TOKEN_KEY = 'nexxus_refresh_token';
const TOKEN_EXPIRY_KEY = 'nexxus_token_expiry';
const ACCESSIBLE_ORGS_KEY = 'nexxus_accessible_orgs';

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [accessibleOrganizations, setAccessibleOrganizations] = useState<AccessibleOrganization[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Store tokens in localStorage
   */
  const storeTokens = (access: string, refresh: string, expiresIn: number) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);

    // Store expiry time (current time + expiresIn seconds)
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

    setAccessToken(access);
  };

  /**
   * Clear tokens from localStorage
   */
  const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(ACCESSIBLE_ORGS_KEY);
    setAccessToken(null);
    setAccessibleOrganizations(null);
    setUser(null);
  };

  /**
   * Check if token is expired or expiring soon (within 5 minutes)
   */
  const isTokenExpiringSoon = (): boolean => {
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return true;

    const expiryTime = parseInt(expiryStr, 10);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return (expiryTime - now) < fiveMinutes;
  };

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();

      // Store tokens
      storeTokens(data.accessToken, data.refreshToken, data.expiresIn);

      // Set user
      setUser(data.user);

      // Store accessible organizations (for Partner Admins)
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
      clearTokens();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);

      // Call logout endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Logout error:', err);
      // Continue with local logout even if API call fails
    } finally {
      clearTokens();
      setLoading(false);
    }
  };

  /**
   * Refresh access token
   */
  const refreshToken = async () => {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!refresh) {
      clearTokens();
      return;
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      // Store new tokens
      storeTokens(data.accessToken, data.refreshToken, data.expiresIn);

      // Update user if provided
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Token refresh error:', err);
      clearTokens();
      setError('Session expired. Please login again.');
    }
  };

  /**
   * Fetch current user
   */
  const fetchUser = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      console.error('Fetch user error:', err);
      clearTokens();
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
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

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
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to switch organization');
      }

      const data = await response.json();

      // Store new tokens
      storeTokens(data.accessToken, data.refreshToken, data.expiresIn);

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
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);

      if (!token) {
        setLoading(false);
        return;
      }

      // Restore accessible organizations from localStorage
      const storedOrgs = localStorage.getItem(ACCESSIBLE_ORGS_KEY);
      if (storedOrgs) {
        try {
          setAccessibleOrganizations(JSON.parse(storedOrgs));
        } catch {
          localStorage.removeItem(ACCESSIBLE_ORGS_KEY);
        }
      }

      // Check if token is expiring soon
      if (isTokenExpiringSoon()) {
        await refreshToken();
      } else {
        setAccessToken(token);
        await fetchUser(token);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Auto-refresh token before expiry
   */
  useEffect(() => {
    if (!accessToken) return;

    // Check token expiry every minute
    const interval = setInterval(() => {
      if (isTokenExpiringSoon()) {
        refreshToken();
      }
    }, 60 * 1000); // Check every 60 seconds

    return () => clearInterval(interval);
  }, [accessToken]);

  /**
   * Cross-tab logout synchronization via StorageEvent
   * When another tab clears the access token, this tab detects it and logs out.
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ACCESS_TOKEN_KEY && e.newValue === null && accessToken) {
        // Token was removed in another tab — sync logout here
        setAccessToken(null);
        setUser(null);
        setAccessibleOrganizations([]);
        sessionStorage.setItem('nexxus_session_expired', 'true');
        window.location.href = '/login?expired=true';
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [accessToken]);

  const value: AuthContextType = {
    user,
    accessToken,
    accessibleOrganizations,
    isAuthenticated: !!user && !!accessToken,
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
