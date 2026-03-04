/**
 * Protected Route Component
 *
 * Wraps routes that require authentication and optional role-level access control.
 * - Redirects to /login if user is not authenticated.
 * - Redirects to / if user lacks the required role level.
 *
 * Role levels (from AuthContext):
 *   1 = super_admin
 *   2 = partner_admin
 *   3 = org_admin
 *   4 = org_staff
 *
 * Lower level number = higher privilege.
 */

import { ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Maximum role level allowed (e.g., 3 means org_admin and above). Lower = higher privilege. */
  requiredLevel?: number;
}

export function ProtectedRoute({ children, requiredLevel }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Check role-level access if required
  if (requiredLevel !== undefined && user?.role?.level !== undefined) {
    if (user.role.level > requiredLevel) {
      return <Redirect to="/" />;
    }
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
}
