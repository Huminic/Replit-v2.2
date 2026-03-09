export type { UserRole } from '@/lib/rbac';
import type { UserRole } from '@/lib/rbac';

export type AgentChannel = 'voice' | 'chat' | 'video' | 'email' | 'sms';
export type TriggerType = 'mention' | 'direct_message' | 'assign_task' | 'scheduled' | 'automated';

export interface AgentTrigger {
  type: TriggerType;
  enabled: boolean;
  config?: {
    schedule?: string;
    condition?: string;
  };
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export const availableTools: AgentTool[] = [
  { id: 'vin-decoder', name: 'VIN Decoder', description: 'Decode vehicle identification numbers', enabled: false },
  { id: 'inventory-search', name: 'Inventory Search', description: 'Search dealership inventory', enabled: false },
  { id: 'crm-lookup', name: 'CRM Lookup', description: 'Look up customer records', enabled: false },
  { id: 'appointment-scheduler', name: 'Appointment Scheduler', description: 'Schedule service appointments', enabled: false },
  { id: 'price-calculator', name: 'Price Calculator', description: 'Calculate vehicle pricing and financing', enabled: false },
  { id: 'trade-in-estimator', name: 'Trade-In Estimator', description: 'Estimate trade-in values', enabled: false },
  { id: 'document-generator', name: 'Document Generator', description: 'Generate sales documents and contracts', enabled: false },
  { id: 'notification-sender', name: 'Notification Sender', description: 'Send emails and SMS notifications', enabled: false },
];

export const getAgentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-green-500',
    inactive: 'bg-gray-400',
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
