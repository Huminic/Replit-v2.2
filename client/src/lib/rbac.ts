export type UserRole = 'super_admin' | 'partner_admin' | 'org_admin' | 'executive' | 'sales_manager' | 'sales' | 'service' | 'marketing';

export type SectionPermission = 'ai-chat' | 'teambox' | 'sales' | 'service' | 'marketing' | 'management';

export const allGrantableSections: SectionPermission[] = ['ai-chat', 'teambox', 'sales', 'service', 'marketing', 'management'];

export const defaultSectionsByRole: Record<UserRole, SectionPermission[]> = {
  super_admin: ['ai-chat', 'teambox', 'sales', 'service', 'marketing', 'management'],
  partner_admin: ['ai-chat', 'teambox', 'sales', 'service', 'marketing'],
  org_admin: ['ai-chat', 'teambox', 'sales', 'service', 'marketing'],
  executive: ['ai-chat', 'teambox', 'sales', 'service', 'marketing'],
  sales_manager: ['ai-chat', 'teambox', 'sales'],
  sales: ['ai-chat', 'teambox', 'sales'],
  service: ['ai-chat', 'teambox', 'service'],
  marketing: ['ai-chat', 'teambox', 'marketing'],
};

export const canAccessSystem = (role: UserRole): boolean => {
  return role === 'super_admin' || role === 'partner_admin' || role === 'org_admin';
};

export const canSwitchOrgs = (role: UserRole): boolean => {
  return role === 'super_admin' || role === 'partner_admin';
};

export const canAccessManagement = (role: UserRole): boolean => {
  return role === 'super_admin';
};

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
