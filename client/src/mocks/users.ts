// Mock user data for Nexxus V2 UI prototype
// All data is client-side only, no real authentication

export type UserRole = 'super_admin' | 'partner_admin' | 'org_admin' | 'org_staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
}

export const mockOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Cage Automotive',
    primaryColor: '#8b5cf6',
    secondaryColor: '#3b82f6',
  },
  {
    id: 'org-2',
    name: 'Premier Motors',
    primaryColor: '#10b981',
    secondaryColor: '#3b82f6',
  },
  {
    id: 'org-3',
    name: 'Elite Auto Group',
    primaryColor: '#f59e0b',
    secondaryColor: '#ef4444',
  },
];

export const mockCurrentUser: User = {
  id: 'user-1',
  name: 'Duane Wells',
  email: 'duane@cageautomotive.com',
  role: 'org_admin',
  organizationId: 'org-1',
};

export const mockUsers: User[] = [
  mockCurrentUser,
  {
    id: 'user-2',
    name: 'Sarah Johnson',
    email: 'sarah@cageautomotive.com',
    role: 'org_staff',
    organizationId: 'org-1',
  },
  {
    id: 'user-3',
    name: 'Mike Chen',
    email: 'mike@cageautomotive.com',
    role: 'org_staff',
    organizationId: 'org-1',
  },
  {
    id: 'user-4',
    name: 'Emily Davis',
    email: 'emily@premiermotors.com',
    role: 'org_admin',
    organizationId: 'org-2',
  },
];

// Helper to check if a user can access certain features
export const canAccessSystem = (role: UserRole): boolean => {
  return role === 'super_admin' || role === 'partner_admin' || role === 'org_admin';
};

export const canSwitchOrgs = (role: UserRole): boolean => {
  return role === 'super_admin' || role === 'partner_admin';
};

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    partner_admin: 'Partner Admin',
    org_admin: 'Organization Admin',
    org_staff: 'Staff',
  };
  return labels[role];
};
