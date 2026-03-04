/**
 * users.ts — RBAC role definitions, permission helpers, and mock user/org data
 *
 * 8 roles (org_staff was REMOVED in v2.1):
 *  - super_admin: Platform-level, full access, can switch orgs
 *  - partner_admin: Partner-level, full access to assigned orgs, can switch orgs
 *  - org_admin: Organization admin, full access within their org
 *  - executive: C-suite view, all departments + management
 *  - sales_manager: Sales + management access
 *  - sales: Sales department only
 *  - service: Service department only
 *  - marketing: Marketing department only
 *
 * Section permissions control sidebar visibility via canAccessSection().
 * Admin roles (super_admin, partner_admin, org_admin) can access System (settings).
 * All roles can access My Work. AI Chat and TeamBox are available to all roles by default.
 *
 * userPermissions (stored in AppContext) can override defaultSectionsByRole to grant
 * additional section access to individual users — e.g., giving a sales user marketing access.
 *
 * PRODUCTION NOTE: Roles and permissions will be managed via the backend user management API.
 * The role switcher in TopBar.tsx is a DEV TOOL for testing and will be removed/restricted.
 */

/** All 8 RBAC roles — used throughout the app for permission gating */
export type UserRole = 'super_admin' | 'partner_admin' | 'org_admin' | 'executive' | 'sales_manager' | 'sales' | 'service' | 'marketing';

/** Grantable sidebar sections — 'my-work' is always visible and not in this list */
export type SectionPermission = 'ai-chat' | 'teambox' | 'sales' | 'service' | 'marketing' | 'management';

/** All sections that can be granted/revoked per-user (excludes my-work which is always on) */
export const allGrantableSections: SectionPermission[] = ['ai-chat', 'teambox', 'sales', 'service', 'marketing', 'management'];

/** Default section access per role — can be overridden by userPermissions in AppContext */
export const defaultSectionsByRole: Record<UserRole, SectionPermission[]> = {
  super_admin: ['ai-chat', 'teambox', 'sales', 'service', 'marketing', 'management'],
  partner_admin: ['ai-chat', 'teambox', 'sales', 'service', 'marketing', 'management'],
  org_admin: ['ai-chat', 'teambox', 'sales', 'service', 'marketing', 'management'],
  executive: ['ai-chat', 'teambox', 'sales', 'service', 'marketing', 'management'],
  sales_manager: ['ai-chat', 'teambox', 'sales', 'management'],
  sales: ['ai-chat', 'teambox', 'sales'],
  service: ['ai-chat', 'teambox', 'service'],
  marketing: ['ai-chat', 'teambox', 'marketing'],
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  organizationId: string;
  permissions?: SectionPermission[];
}

export interface Organization {
  id: string;
  name: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  personaName: string;
}

/**
 * Mock organizations — each org has a personaName (the AI assistant's display name).
 * personaName appears in main.tsx chat, RightPane, and throughout the UI.
 */
export const mockOrganizations: Organization[] = [
  {
    id: 'org-1',
    name: 'Cage Automotive',
    primaryColor: '#8b5cf6',
    secondaryColor: '#3b82f6',
    personaName: 'Serra',
  },
  {
    id: 'org-2',
    name: 'Premier Motors',
    primaryColor: '#10b981',
    secondaryColor: '#3b82f6',
    personaName: 'Aria',
  },
  {
    id: 'org-3',
    name: 'Elite Auto Group',
    primaryColor: '#f59e0b',
    secondaryColor: '#ef4444',
    personaName: 'Nova',
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
    role: 'sales',
    organizationId: 'org-1',
  },
  {
    id: 'user-3',
    name: 'Mike Chen',
    email: 'mike@cageautomotive.com',
    role: 'service',
    organizationId: 'org-1',
  },
  {
    id: 'user-4',
    name: 'Emily Davis',
    email: 'emily@premiermotors.com',
    role: 'org_admin',
    organizationId: 'org-2',
  },
  {
    id: 'user-5',
    name: 'James Thompson',
    email: 'james@cageautomotive.com',
    role: 'sales_manager',
    organizationId: 'org-1',
  },
  {
    id: 'user-6',
    name: 'Lisa Park',
    email: 'lisa@cageautomotive.com',
    role: 'marketing',
    organizationId: 'org-1',
  },
  {
    id: 'user-7',
    name: 'Robert Cage',
    email: 'robert@cageautomotive.com',
    role: 'executive',
    organizationId: 'org-1',
  },
];

/** System/Settings access — only admin-level roles */
export const canAccessSystem = (role: UserRole): boolean => {
  return role === 'super_admin' || role === 'partner_admin' || role === 'org_admin';
};

/** Org switching — only platform/partner level roles can manage multiple orgs */
export const canSwitchOrgs = (role: UserRole): boolean => {
  return role === 'super_admin' || role === 'partner_admin';
};

/** Management dashboard access — leadership and admin roles */
export const canAccessManagement = (role: UserRole): boolean => {
  return role === 'super_admin' || role === 'partner_admin' || role === 'org_admin' || role === 'executive';
};

/**
 * Primary RBAC gating function — used by Sidebar.tsx to show/hide menu items.
 * Checks userPermissions first (per-user overrides), then falls back to defaultSectionsByRole.
 * 'my-work' is always accessible. 'system' requires admin role check.
 */
export const canAccessSection = (role: UserRole, section: string, userPermissions?: SectionPermission[]): boolean => {
  if (section === 'my-work') return true;

  if (section === 'system') {
    return canAccessSystem(role);
  }

  if (userPermissions && userPermissions.length > 0) {
    return userPermissions.includes(section as SectionPermission);
  }

  const defaults = defaultSectionsByRole[role];
  if (!defaults) return false;
  return defaults.includes(section as SectionPermission);
};

/** Human-readable role labels for the role switcher dropdown and profile display */
export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    partner_admin: 'Partner Admin',
    org_admin: 'Organization Admin',
    executive: 'Executive',
    sales_manager: 'Sales Manager',
    sales: 'Sales',
    service: 'Service',
    marketing: 'Marketing',
  };
  return labels[role];
};
