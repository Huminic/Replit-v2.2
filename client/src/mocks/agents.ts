// Mock agent data for Nexxus V2 UI prototype

export type AgentStatus = 'active' | 'inactive' | 'draft';
export type AgentChannel = 'voice' | 'chat' | 'video' | 'email';
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

export interface Agent {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  channel: AgentChannel;
  avatar?: string;
  instructions: string;
  triggers: AgentTrigger[];
  tools: AgentTool[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
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

export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Sales Agent',
    description: 'Handles inbound sales inquiries and qualifies leads',
    status: 'active',
    channel: 'voice',
    instructions: 'You are a friendly sales agent for a car dealership. Help customers find the right vehicle for their needs.',
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
    createdAt: '2026-01-15T10:30:00Z',
    updatedAt: '2026-01-20T14:45:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'agent-2',
    name: 'Support Agent',
    description: 'Provides customer support and answers common questions',
    status: 'active',
    channel: 'chat',
    instructions: 'You are a helpful customer support agent. Answer questions about service, maintenance, and vehicle features.',
    triggers: [
      { type: 'mention', enabled: true },
      { type: 'direct_message', enabled: true },
      { type: 'assign_task', enabled: false },
      { type: 'scheduled', enabled: false },
      { type: 'automated', enabled: true, config: { condition: 'New support ticket created' } },
    ],
    tools: [
      { ...availableTools[2], enabled: true },
      { ...availableTools[3], enabled: true },
    ],
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-01-19T11:20:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'agent-3',
    name: 'Service Reminder',
    description: 'Sends automated service reminders to customers',
    status: 'active',
    channel: 'email',
    instructions: 'Send friendly service reminders to customers based on their vehicle maintenance schedule.',
    triggers: [
      { type: 'mention', enabled: false },
      { type: 'direct_message', enabled: false },
      { type: 'assign_task', enabled: false },
      { type: 'scheduled', enabled: true, config: { schedule: 'Every Monday at 9:00 AM' } },
      { type: 'automated', enabled: true, config: { condition: 'Service due within 7 days' } },
    ],
    tools: [
      { ...availableTools[2], enabled: true },
      { ...availableTools[7], enabled: true },
    ],
    createdAt: '2026-01-05T14:00:00Z',
    updatedAt: '2026-01-18T16:30:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'agent-4',
    name: 'Lead Qualifier',
    description: 'Qualifies incoming leads and routes to sales team',
    status: 'draft',
    channel: 'chat',
    instructions: 'Engage with website visitors, qualify their interest level, and gather contact information.',
    triggers: [
      { type: 'mention', enabled: false },
      { type: 'direct_message', enabled: false },
      { type: 'assign_task', enabled: false },
      { type: 'scheduled', enabled: false },
      { type: 'automated', enabled: true, config: { condition: 'New website visitor' } },
    ],
    tools: [
      { ...availableTools[1], enabled: true },
      { ...availableTools[4], enabled: true },
      { ...availableTools[5], enabled: true },
    ],
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-01-20T08:00:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'agent-5',
    name: 'Video Concierge',
    description: 'Provides personalized video tours of vehicles',
    status: 'inactive',
    channel: 'video',
    instructions: 'Conduct virtual vehicle tours and answer questions in real-time via video call.',
    triggers: [
      { type: 'mention', enabled: true },
      { type: 'direct_message', enabled: true },
      { type: 'assign_task', enabled: true },
      { type: 'scheduled', enabled: true, config: { schedule: 'On demand' } },
      { type: 'automated', enabled: false },
    ],
    tools: [
      { ...availableTools[0], enabled: true },
      { ...availableTools[1], enabled: true },
      { ...availableTools[4], enabled: true },
      { ...availableTools[5], enabled: true },
    ],
    createdAt: '2026-01-12T11:00:00Z',
    updatedAt: '2026-01-17T09:15:00Z',
    createdBy: 'user-1',
  },
];

export const getAgentStatusColor = (status: AgentStatus): string => {
  const colors: Record<AgentStatus, string> = {
    active: 'bg-green-500',
    inactive: 'bg-gray-400',
    draft: 'bg-amber-500',
  };
  return colors[status];
};

export const getChannelIcon = (channel: AgentChannel): string => {
  const icons: Record<AgentChannel, string> = {
    voice: 'Phone',
    chat: 'MessageSquare',
    video: 'Video',
    email: 'Mail',
  };
  return icons[channel];
};
