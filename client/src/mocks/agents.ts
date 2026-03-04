/**
 * agents.ts — Real AI Agent definitions for Serra Auto Group
 *
 * Each Serra dealership has a named AI agent with both VAPI (voice) and Tavus (video)
 * capabilities. Agents are customer-facing with real phone numbers.
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
 * Voice powered by VAPI, video powered by Tavus.
 */

export type AgentStatus = 'active' | 'inactive' | 'draft';
export type AgentChannel = 'voice' | 'chat' | 'video' | 'email' | 'sms';
export type TriggerType = 'mention' | 'direct_message' | 'assign_task' | 'scheduled' | 'automated';
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
  channels: AgentChannel[];
  department: AgentDepartment;
  dealership?: string;
  avatar?: string;
  instructions: string;
  triggers: AgentTrigger[];
  tools: AgentTool[];
  customerLink?: string;
  assignedPhone?: string;
  chatLink?: string;
  vapiAssistantId?: string | null;
  tavusPersonaId?: string | null;
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
 * 5 real Serra Auto Group AI agents — one per dealership.
 * Each agent has VAPI (voice) and Tavus (video) capabilities.
 * Phone numbers are real assigned numbers.
 */
export const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'Caroline',
    description: 'AI agent for Serra Honda of Sylacauga — handles sales inquiries, service scheduling, and customer support via voice and video',
    status: 'active',
    channel: 'voice',
    channels: ['voice', 'video', 'chat'],
    department: 'sales',
    dealership: 'Serra Honda of Sylacauga',
    instructions: 'You are Caroline, the AI assistant for Serra Honda of Sylacauga. Help customers find the right Honda vehicle, schedule test drives, answer questions about inventory and pricing, and book service appointments. Be warm, professional, and knowledgeable about Honda models.',
    triggers: [
      { type: 'mention', enabled: true },
      { type: 'direct_message', enabled: true },
      { type: 'assign_task', enabled: true },
      { type: 'scheduled', enabled: true, config: { schedule: 'Daily at 8:00 AM' } },
      { type: 'automated', enabled: true, config: { condition: 'Inbound call or web inquiry' } },
    ],
    tools: [
      { ...availableTools[0], enabled: true },
      { ...availableTools[1], enabled: true },
      { ...availableTools[2], enabled: true },
      { ...availableTools[3], enabled: true },
      { ...availableTools[4], enabled: true },
      { ...availableTools[5], enabled: true },
    ],
    assignedPhone: '+1 (901) 203-8267',
    createdAt: '2026-01-15T10:30:00Z',
    updatedAt: '2026-02-28T14:45:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'agent-2',
    name: 'Magnolia',
    description: 'AI agent for Serra Nissan of Sylacauga — handles sales inquiries, service scheduling, and customer support via voice and video',
    status: 'active',
    channel: 'voice',
    channels: ['voice', 'video', 'chat'],
    department: 'sales',
    dealership: 'Serra Nissan of Sylacauga',
    instructions: 'You are Magnolia, the AI assistant for Serra Nissan of Sylacauga. Help customers explore Nissan vehicles, schedule test drives, provide pricing information, and manage service appointments. Be friendly, helpful, and deeply knowledgeable about the Nissan lineup.',
    triggers: [
      { type: 'mention', enabled: true },
      { type: 'direct_message', enabled: true },
      { type: 'assign_task', enabled: true },
      { type: 'scheduled', enabled: true, config: { schedule: 'Daily at 8:00 AM' } },
      { type: 'automated', enabled: true, config: { condition: 'Inbound call or web inquiry' } },
    ],
    tools: [
      { ...availableTools[0], enabled: true },
      { ...availableTools[1], enabled: true },
      { ...availableTools[2], enabled: true },
      { ...availableTools[3], enabled: true },
      { ...availableTools[4], enabled: true },
      { ...availableTools[5], enabled: true },
    ],
    assignedPhone: '+1 (256) 862-3318',
    createdAt: '2026-01-10T09:00:00Z',
    updatedAt: '2026-02-28T11:20:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'agent-3',
    name: 'Georgia',
    description: 'AI agent for Tony Serra Ford — handles sales inquiries, service scheduling, and customer support via voice and video',
    status: 'active',
    channel: 'voice',
    channels: ['voice', 'video', 'chat'],
    department: 'sales',
    dealership: 'Tony Serra Ford',
    instructions: 'You are Georgia, the AI assistant for Tony Serra Ford. Help customers find the right Ford vehicle — trucks, SUVs, cars — schedule test drives, provide trade-in estimates, and book service appointments. Be confident, knowledgeable about Ford models, and customer-focused.',
    triggers: [
      { type: 'mention', enabled: true },
      { type: 'direct_message', enabled: true },
      { type: 'assign_task', enabled: true },
      { type: 'scheduled', enabled: true, config: { schedule: 'Daily at 8:00 AM' } },
      { type: 'automated', enabled: true, config: { condition: 'Inbound call or web inquiry' } },
    ],
    tools: [
      { ...availableTools[0], enabled: true },
      { ...availableTools[1], enabled: true },
      { ...availableTools[2], enabled: true },
      { ...availableTools[3], enabled: true },
      { ...availableTools[4], enabled: true },
      { ...availableTools[5], enabled: true },
    ],
    assignedPhone: '+1 (256) 459-9707',
    createdAt: '2026-01-05T14:00:00Z',
    updatedAt: '2026-02-28T16:30:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'agent-4',
    name: 'Elizabeth',
    description: 'AI agent for Hyundai of Columbia — handles sales inquiries, service scheduling, and customer support via voice and video',
    status: 'active',
    channel: 'voice',
    channels: ['voice', 'video', 'chat'],
    department: 'sales',
    dealership: 'Hyundai of Columbia',
    instructions: 'You are Elizabeth, the AI assistant for Hyundai of Columbia. Help customers explore Hyundai vehicles, schedule test drives, answer pricing and financing questions, and manage service appointments. Be warm, approachable, and well-versed in the Hyundai lineup including EVs.',
    triggers: [
      { type: 'mention', enabled: true },
      { type: 'direct_message', enabled: true },
      { type: 'assign_task', enabled: true },
      { type: 'scheduled', enabled: true, config: { schedule: 'Daily at 8:00 AM' } },
      { type: 'automated', enabled: true, config: { condition: 'Inbound call or web inquiry' } },
    ],
    tools: [
      { ...availableTools[0], enabled: true },
      { ...availableTools[1], enabled: true },
      { ...availableTools[2], enabled: true },
      { ...availableTools[3], enabled: true },
      { ...availableTools[4], enabled: true },
      { ...availableTools[5], enabled: true },
    ],
    assignedPhone: '+1 (901) 203-9398',
    createdAt: '2026-01-12T11:00:00Z',
    updatedAt: '2026-02-28T09:15:00Z',
    createdBy: 'user-1',
  },
  {
    id: 'agent-5',
    name: 'Savannah',
    description: 'AI agent for Ford of Columbia — handles sales inquiries, service scheduling, and customer support via voice and video',
    status: 'active',
    channel: 'voice',
    channels: ['voice', 'video', 'chat'],
    department: 'sales',
    dealership: 'Ford of Columbia',
    instructions: 'You are Savannah, the AI assistant for Ford of Columbia. Help customers find their perfect Ford vehicle, schedule test drives, provide financing options, handle trade-in valuations, and book service appointments. Be energetic, helpful, and an expert on the Ford lineup.',
    triggers: [
      { type: 'mention', enabled: true },
      { type: 'direct_message', enabled: true },
      { type: 'assign_task', enabled: true },
      { type: 'scheduled', enabled: true, config: { schedule: 'Daily at 8:00 AM' } },
      { type: 'automated', enabled: true, config: { condition: 'Inbound call or web inquiry' } },
    ],
    tools: [
      { ...availableTools[0], enabled: true },
      { ...availableTools[1], enabled: true },
      { ...availableTools[2], enabled: true },
      { ...availableTools[3], enabled: true },
      { ...availableTools[4], enabled: true },
      { ...availableTools[5], enabled: true },
    ],
    assignedPhone: '+1 (931) 369-2815',
    createdAt: '2026-01-08T10:00:00Z',
    updatedAt: '2026-02-28T08:00:00Z',
    createdBy: 'user-1',
  },
];

/** Returns Tailwind bg class for agent status indicator dot */
export const getAgentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    active: 'bg-green-500',
    inactive: 'bg-gray-400',
    draft: 'bg-amber-500',
  };
  return colors[status] || 'bg-gray-400';
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
