/**
 * agents.ts — Mock AI Agent definitions for Nexxus V2
 *
 * Defines the Agent data model and provides 6 pre-configured AI agents spanning
 * sales, service, and marketing departments. Each agent has:
 *  - Channel assignment (voice, chat, video, email, sms)
 *  - Trigger configuration (when the agent activates)
 *  - Tool bindings (which MCP tools the agent can use)
 *  - Customer-facing links and phone numbers
 *
 * Agents are displayed in:
 *  - SubMenuManager flyout panels (per-department agent lists)
 *  - agents.tsx detail/chat page (cardinal rule: chat center → config right)
 *  - AgentConfigPane.tsx (right pane config editor)
 *  - Department dashboards (sales.tsx, service.tsx, marketing.tsx)
 *
 * PRODUCTION NOTE: Agent CRUD will be handled by the backend API at
 * nexxusv2.huminicdev.com. Tools will be MCP-server-provided capabilities
 * (VIN decoder, CRM lookup, etc.). Agent instructions feed into the LLM prompt.
 */

/** Lifecycle status — draft agents are not customer-facing */
export type AgentStatus = 'active' | 'inactive' | 'draft';
/** Communication channel the agent operates on */
export type AgentChannel = 'voice' | 'chat' | 'video' | 'email' | 'sms';
/** How the agent gets activated — scheduled/automated triggers run without human initiation */
export type TriggerType = 'mention' | 'direct_message' | 'assign_task' | 'scheduled' | 'automated';
/** Department alignment — determines which sidebar section shows the agent */
export type AgentDepartment = 'sales' | 'service' | 'marketing' | 'system';

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

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  channel: AgentChannel;
  department: AgentDepartment;
  avatar?: string;
  instructions: string;
  triggers: AgentTrigger[];
  tools: AgentTool[];
  customerLink?: string;
  assignedPhone?: string;
  chatLink?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Available MCP tools that can be assigned to agents.
 * PRODUCTION NOTE: These will be dynamically loaded from the MCP server registry.
 * Each tool maps to a backend capability (VinSolutions CRM, TextMagic SMS, etc.)
 */
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

/**
 * 6 pre-configured mock agents covering all departments:
 *  1. Sales Agent — inbound voice lead qualification
 *  2. Communications Agent — outbound SMS/email campaigns
 *  3. CRM Data Agent — VinSolutions data queries and reporting
 *  4. Service Guru — service dept communications and scheduling
 *  5. Sales Guru — internal sales coaching and follow-up prioritization
 *  6. Marketing Agent — campaign management and performance tracking
 */
export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Sales Agent',
    description: 'Handles inbound sales inquiries and qualifies leads',
    status: 'active',
    channel: 'voice',
    department: 'sales',
    instructions: 'You are a friendly sales agent for a car dealership. Help customers find the right vehicle for their needs. Qualify leads by understanding their budget, preferences, and timeline.',
    triggers: [
      { type: 'mention', enabled: true },
      { type: 'direct_message', enabled: true },
      { type: 'assign_task', enabled: true },
      { type: 'scheduled', enabled: false },
      { type: 'automated', enabled: false },
    ],
    tools: [
      { ...availableTools[0], enabled: true },
      { ...availableTools[1], enabled: true },
      { ...availableTools[4], enabled: true },
    ],
    customerLink: 'https://nexxus.ai/a/sales-agent',
    assignedPhone: '(800) 555-0101',
    chatLink: 'https://nexxus.ai/chat/sales-agent',
    createdAt: '2026-01-15T10:30:00Z',
    updatedAt: '2026-01-20T14:45:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'agent-2',
    name: 'Communications Agent',
    description: 'Manages outbound SMS, email, and call campaigns across all departments',
    status: 'active',
    channel: 'sms',
    department: 'sales',
    instructions: 'You manage outbound communications for the dealership. Send follow-up messages, appointment reminders, and promotional campaigns. Always respect opt-out preferences and communication schedules.',
    triggers: [
      { type: 'mention', enabled: true },
      { type: 'direct_message', enabled: true },
      { type: 'assign_task', enabled: false },
      { type: 'scheduled', enabled: true, config: { schedule: 'Based on campaign schedule' } },
      { type: 'automated', enabled: true, config: { condition: 'New lead or status change' } },
    ],
    tools: [
      { ...availableTools[2], enabled: true },
      { ...availableTools[7], enabled: true },
    ],
    customerLink: 'https://nexxus.ai/a/comms-agent',
    assignedPhone: '(800) 555-0102',
    chatLink: 'https://nexxus.ai/chat/comms-agent',
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-01-19T11:20:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'agent-3',
    name: 'CRM Data Agent',
    description: 'Answers questions about CRM data, runs reports, and provides data insights',
    status: 'active',
    channel: 'chat',
    department: 'sales',
    instructions: 'You are the CRM Guru. Answer questions about VinSolutions data, run reports on pipeline health, lead scoring, and conversion metrics. Never fabricate data - if you dont have the information, say so clearly.',
    triggers: [
      { type: 'mention', enabled: true },
      { type: 'direct_message', enabled: true },
      { type: 'assign_task', enabled: false },
      { type: 'scheduled', enabled: false },
      { type: 'automated', enabled: false },
    ],
    tools: [
      { ...availableTools[2], enabled: true },
      { ...availableTools[6], enabled: true },
    ],
    customerLink: 'https://nexxus.ai/a/crm-guru',
    chatLink: 'https://nexxus.ai/chat/crm-guru',
    createdAt: '2026-01-05T14:00:00Z',
    updatedAt: '2026-01-18T16:30:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'agent-4',
    name: 'Service Guru',
    description: 'Handles service department communications and appointment management',
    status: 'active',
    channel: 'chat',
    department: 'service',
    instructions: 'You manage service department interactions. Schedule appointments, send service reminders, handle customer inquiries about maintenance and repairs. Upsell recommended services when appropriate.',
    triggers: [
      { type: 'mention', enabled: true },
      { type: 'direct_message', enabled: true },
      { type: 'assign_task', enabled: true },
      { type: 'scheduled', enabled: true, config: { schedule: 'Every Monday at 9:00 AM' } },
      { type: 'automated', enabled: true, config: { condition: 'Service due within 7 days' } },
    ],
    tools: [
      { ...availableTools[2], enabled: true },
      { ...availableTools[3], enabled: true },
      { ...availableTools[7], enabled: true },
    ],
    customerLink: 'https://nexxus.ai/a/service-guru',
    assignedPhone: '(800) 555-0104',
    chatLink: 'https://nexxus.ai/chat/service-guru',
    createdAt: '2026-01-12T11:00:00Z',
    updatedAt: '2026-01-17T09:15:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'agent-5',
    name: 'Sales Guru',
    description: 'Coaches salespeople through deals and prioritizes follow-ups',
    status: 'active',
    channel: 'chat',
    department: 'sales',
    instructions: 'You are a sales coaching agent. Help salespeople prioritize their leads, suggest next actions, and coach them through deals. Monitor overdue follow-ups and alert when opportunities are at risk.',
    triggers: [
      { type: 'mention', enabled: true },
      { type: 'direct_message', enabled: true },
      { type: 'assign_task', enabled: false },
      { type: 'scheduled', enabled: true, config: { schedule: 'Daily at 8:00 AM' } },
      { type: 'automated', enabled: true, config: { condition: 'Lead overdue > 48 hours' } },
    ],
    tools: [
      { ...availableTools[2], enabled: true },
      { ...availableTools[1], enabled: true },
      { ...availableTools[4], enabled: true },
    ],
    chatLink: 'https://nexxus.ai/chat/sales-guru',
    createdAt: '2026-01-08T10:00:00Z',
    updatedAt: '2026-01-20T08:00:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'agent-6',
    name: 'Marketing Agent',
    description: 'Manages marketing campaigns and tracks performance metrics',
    status: 'active',
    channel: 'email',
    department: 'marketing',
    instructions: 'You manage marketing campaigns. Track campaign performance, monitor widget interactions, and report on landing page visits. Generate marketing reports and suggest optimization strategies.',
    triggers: [
      { type: 'mention', enabled: true },
      { type: 'direct_message', enabled: true },
      { type: 'assign_task', enabled: false },
      { type: 'scheduled', enabled: true, config: { schedule: 'Weekly on Monday' } },
      { type: 'automated', enabled: false },
    ],
    tools: [
      { ...availableTools[6], enabled: true },
      { ...availableTools[7], enabled: true },
    ],
    customerLink: 'https://nexxus.ai/a/marketing-agent',
    chatLink: 'https://nexxus.ai/chat/marketing-agent',
    createdAt: '2026-01-14T13:00:00Z',
    updatedAt: '2026-01-19T15:30:00Z',
    createdBy: 'user-1',
  },
];

/** Returns Tailwind bg class for agent status indicator dot */
export const getAgentStatusColor = (status: AgentStatus): string => {
  const colors: Record<AgentStatus, string> = {
    active: 'bg-green-500',
    inactive: 'bg-gray-400',
    draft: 'bg-amber-500',
  };
  return colors[status];
};

/** Maps channel type to lucide-react icon name for display */
export const getChannelIcon = (channel: AgentChannel): string => {
  const icons: Record<AgentChannel, string> = {
    voice: 'Phone',
    chat: 'MessageSquare',
    video: 'Video',
    email: 'Mail',
    sms: 'Smartphone',
  };
  return icons[channel];
};

/** Filters agents by department — used in SubMenuManager and department dashboards */
export const getAgentsByDepartment = (agents: Agent[], department: AgentDepartment): Agent[] => {
  return agents.filter(a => a.department === department);
};
