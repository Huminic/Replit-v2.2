export type { UserRole } from '@/mocks/users';
import type { UserRole } from '@/mocks/users';

export const getAgentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-green-500',
    inactive: 'bg-gray-400',
    draft: 'bg-amber-500',
  };
  return colors[status] || 'bg-gray-400';
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
