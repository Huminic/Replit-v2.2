// Mock chat messages for Nexxus V2 UI prototype

export type MessageRole = 'user' | 'assistant';

export interface ThinkingBlock {
  summary: string;
  details: string[];
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  thinking?: ThinkingBlock;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Sales Agent Setup',
    lastMessage: 'Your sales agent is now configured and ready to go!',
    timestamp: '2026-01-21T10:30:00Z',
    unread: false,
  },
  {
    id: 'conv-2',
    title: 'Inventory Analysis',
    lastMessage: 'Based on current trends, here are my recommendations...',
    timestamp: '2026-01-20T16:45:00Z',
    unread: true,
  },
  {
    id: 'conv-3',
    title: 'CRM Integration Help',
    lastMessage: 'I can help you connect your CRM system.',
    timestamp: '2026-01-19T14:20:00Z',
    unread: false,
  },
  {
    id: 'conv-4',
    title: 'Monthly Report Request',
    lastMessage: 'Here is your monthly sales performance report.',
    timestamp: '2026-01-18T09:00:00Z',
    unread: false,
  },
];

export const mockChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: "Hello! I'm Automa, your AI assistant for Nexxus V2. How can I help you today?",
    timestamp: '2026-01-21T09:00:00Z',
    thinking: {
      summary: 'Analyzed your dealership profile and recent activity',
      details: [
        'Checked current pipeline: 247 active leads across 4 sources',
        'Reviewed recent performance: Close rate up 2.3% this month',
        'Identified 3 priority follow-ups due today',
      ],
    },
  },
  {
    id: 'msg-2',
    role: 'user',
    content: "What can I build with you?",
    timestamp: '2026-01-21T09:01:00Z',
  },
  {
    id: 'msg-3',
    role: 'assistant',
    content: `Great question! You can build many types of agents to help automate your dealership operations:

**Project & Task Help**
1. **Auto-summary agent** – summarizes meetings, standups, or notes into key takeaways and action items
2. **Task manager** – creates, assigns, or organizes tasks automatically based on activity or keywords

**Communication & Update Help**
1. **Inbox updater** – pings you with updates on important tasks, mentions, or messages
2. **Progress reporter** – posts daily or weekly updates about project progress, delays, or blockers

**Business Operations Help**
1. **Report generator** – creates recurring summaries of cash flow or KPIs
2. **Proposal or deal tracker** – monitors proposal status and alerts on changes

What kind of agent would you like to create?`,
    timestamp: '2026-01-21T09:02:00Z',
  },
  {
    id: 'msg-4',
    role: 'user',
    content: "I want to create a sales agent that can handle voice calls",
    timestamp: '2026-01-21T09:05:00Z',
  },
  {
    id: 'msg-5',
    role: 'assistant',
    content: `Excellent choice! A voice-enabled sales agent can significantly improve your lead response time and customer engagement.

Let me help you set that up. I'll need a few details:

1. **Agent Name**: What would you like to call this agent?
2. **Primary Purpose**: Lead qualification, appointment scheduling, or general inquiries?
3. **Working Hours**: When should the agent be available?
4. **Escalation Rules**: When should calls be transferred to a human?

You can also configure these settings later in the Agent Builder. Would you like me to create a basic template to get you started?`,
    timestamp: '2026-01-21T09:06:00Z',
  },
];

export const agentSuggestions = [
  'AI agent documentation assistant',
  'AI agent task organizer',
  'AI agent collaboration facilitator',
  'AI agent partner portal manager',
  'AI agent progress reporter',
];
