import type { TourStep } from '@/components/ProductTour';
import type { UserRole } from '@/lib/rbac';

export interface TourStepDefinition extends TourStep {
  requiredRole?: 'all' | 'admin' | 'sales';
}

const allTourSteps: TourStepDefinition[] = [
  {
    target: '[data-testid="sidebar-item-ai-chat"]',
    title: 'Dashboard & AI Chat',
    description: 'Your home base. View key metrics, quick actions, and chat with your AI assistant to get answers instantly.',
    placement: 'right',
    requiredRole: 'all',
  },
  {
    target: '[data-testid="sidebar-item-teambox"]',
    title: 'TeamBox — Conversations',
    description: 'Manage all customer conversations in one place. View, assign, and respond to messages across all channels.',
    placement: 'right',
    requiredRole: 'all',
  },
  {
    target: '[data-testid="sidebar-item-sales"]',
    title: 'AI Agents & Sales',
    description: 'Configure your AI agents, set up automated responses, and manage your sales pipeline.',
    placement: 'right',
    requiredRole: 'sales',
  },
  {
    target: '[data-testid="sidebar-item-system"]',
    title: 'System Settings',
    description: 'Upload knowledge base documents, configure integrations, manage users, and customize your organization settings.',
    placement: 'right',
    requiredRole: 'admin',
  },
  {
    target: '[data-testid="sidebar-item-management"]',
    title: 'User Management',
    description: 'Manage team members, assign roles and permissions, and oversee departmental access controls.',
    placement: 'right',
    requiredRole: 'admin',
  },
  {
    target: '[data-testid="button-profile-menu"]',
    title: 'Your Profile',
    description: 'Access your account settings, preferences, billing information, and log out from here.',
    placement: 'bottom',
    requiredRole: 'all',
  },
];

export function getTourStepsForRole(role: UserRole): TourStep[] {
  const isAdmin = role === 'super_admin' || role === 'partner_admin' || role === 'org_admin';
  const isSales = role === 'sales' || role === 'sales_manager' || role === 'executive';

  return allTourSteps
    .filter((step) => {
      if (!step.requiredRole || step.requiredRole === 'all') return true;
      if (step.requiredRole === 'admin') return isAdmin;
      if (step.requiredRole === 'sales') return isSales || isAdmin;
      return false;
    })
    .map(({ requiredRole: _, ...rest }) => rest);
}
