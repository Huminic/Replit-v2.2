export type ConversationChannel = 'sms' | 'email' | 'chat' | 'whatsapp' | 'voice';
export type ConversationStatus = 'open' | 'assigned' | 'participating' | 'automated' | 'scheduled' | 'followup' | 'pending' | 'closed';

export interface ConversationMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'agent' | 'bot' | 'staff';
  content: string;
  timestamp: string;
  attachments?: { name: string; type: string; url: string }[];
}

export interface TeamboxConversation {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  assignedTo?: string;
  agentId?: string;
  agentName?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  tags: string[];
  messages: ConversationMessage[];
  campaignId?: string;
  campaignDisconnected?: boolean;
}

export const mockTeamboxConversations: TeamboxConversation[] = [
  {
    id: 'tc-1',
    customerName: 'Michael Clark',
    customerEmail: 'michael.clark@email.com',
    customerPhone: '(412) 555-0101',
    channel: 'sms',
    status: 'open',
    assignedTo: 'user-2',
    agentId: 'agent-1',
    agentName: 'Sales Agent',
    lastMessage: 'I received a damaged item and need help.',
    lastMessageTime: '2026-02-20T14:30:00Z',
    unreadCount: 3,
    tags: ['sales', 'urgent'],
    messages: [
      { id: 'tm-1', senderId: 'agent-1', senderName: 'Sales Agent', senderType: 'bot', content: 'Hi Michael! Thank you for your interest in the 2026 Camry. Would you like to schedule a test drive?', timestamp: '2026-02-20T14:00:00Z' },
      { id: 'tm-2', senderId: 'cust-1', senderName: 'Michael Clark', senderType: 'customer', content: 'Yes, but I also wanted to ask about the trade-in value for my current car.', timestamp: '2026-02-20T14:15:00Z' },
      { id: 'tm-3', senderId: 'agent-1', senderName: 'Sales Agent', senderType: 'bot', content: 'Of course! I can help with that. What year, make, and model is your current vehicle?', timestamp: '2026-02-20T14:20:00Z' },
      { id: 'tm-4', senderId: 'cust-1', senderName: 'Michael Clark', senderType: 'customer', content: 'I received a damaged item and need help.', timestamp: '2026-02-20T14:30:00Z' },
    ],
  },
  {
    id: 'tc-2',
    customerName: 'Ben Smith',
    customerEmail: 'ben.smith@email.com',
    customerPhone: '(412) 555-0102',
    channel: 'chat',
    status: 'automated',
    agentId: 'agent-1',
    agentName: 'Sales Agent',
    lastMessage: "I'm having trouble accessing my account.",
    lastMessageTime: '2026-02-20T13:45:00Z',
    unreadCount: 1,
    tags: ['support'],
    messages: [
      { id: 'tm-5', senderId: 'agent-1', senderName: 'Sales Agent', senderType: 'bot', content: 'Welcome Ben! How can I help you today?', timestamp: '2026-02-20T13:30:00Z' },
      { id: 'tm-6', senderId: 'cust-2', senderName: 'Ben Smith', senderType: 'customer', content: "I'm having trouble accessing my account.", timestamp: '2026-02-20T13:45:00Z' },
    ],
  },
  {
    id: 'tc-3',
    customerName: 'David Jackson',
    customerEmail: 'david.jackson@email.com',
    customerPhone: '(412) 555-0103',
    channel: 'email',
    status: 'followup',
    assignedTo: 'user-1',
    lastMessage: 'I need to update my payment information.',
    lastMessageTime: '2026-02-20T12:00:00Z',
    unreadCount: 0,
    tags: ['billing'],
    messages: [
      { id: 'tm-7', senderId: 'cust-3', senderName: 'David Jackson', senderType: 'customer', content: 'I need to update my payment information.', timestamp: '2026-02-20T12:00:00Z' },
    ],
  },
  {
    id: 'tc-4',
    customerName: 'Joshua Thompson',
    customerEmail: 'joshua.t@email.com',
    customerPhone: '(412) 555-0104',
    channel: 'sms',
    status: 'assigned',
    assignedTo: 'user-2',
    agentId: 'agent-2',
    agentName: 'Communications Agent',
    lastMessage: 'I have a question about the special pricing.',
    lastMessageTime: '2026-02-20T11:30:00Z',
    unreadCount: 2,
    tags: ['sales', 'pricing'],
    messages: [
      { id: 'tm-8', senderId: 'agent-2', senderName: 'Communications Agent', senderType: 'bot', content: 'Hi Joshua! We have some great deals this month. Can I help you find the right vehicle?', timestamp: '2026-02-20T11:00:00Z' },
      { id: 'tm-9', senderId: 'cust-4', senderName: 'Joshua Thompson', senderType: 'customer', content: 'I have a question about the special pricing.', timestamp: '2026-02-20T11:30:00Z' },
    ],
  },
  {
    id: 'tc-5',
    customerName: 'Emily Davis',
    customerEmail: 'emily.d@email.com',
    customerPhone: '(412) 555-0105',
    channel: 'whatsapp',
    status: 'open',
    lastMessage: 'I need to change the shipping address.',
    lastMessageTime: '2026-02-20T10:45:00Z',
    unreadCount: 1,
    tags: ['service'],
    messages: [
      { id: 'tm-10', senderId: 'cust-5', senderName: 'Emily Davis', senderType: 'customer', content: 'I need to change the shipping address.', timestamp: '2026-02-20T10:45:00Z' },
    ],
  },
  {
    id: 'tc-6',
    customerName: 'Amanda Anderson',
    customerEmail: 'amanda.a@email.com',
    customerPhone: '(412) 555-0106',
    channel: 'chat',
    status: 'pending',
    agentId: 'agent-4',
    agentName: 'Service Guru',
    lastMessage: "I'd like to request a copy of my service history.",
    lastMessageTime: '2026-02-20T09:30:00Z',
    unreadCount: 0,
    tags: ['service', 'records'],
    messages: [
      { id: 'tm-11', senderId: 'cust-6', senderName: 'Amanda Anderson', senderType: 'customer', content: "I'd like to request a copy of my service history.", timestamp: '2026-02-20T09:30:00Z' },
    ],
  },
  {
    id: 'tc-7',
    customerName: 'Melissa Taylor',
    customerPhone: '(412) 555-0107',
    channel: 'sms',
    status: 'scheduled',
    agentId: 'agent-4',
    agentName: 'Service Guru',
    lastMessage: 'Your service appointment is confirmed for Friday at 10am.',
    lastMessageTime: '2026-02-19T16:00:00Z',
    unreadCount: 0,
    tags: ['service', 'appointment'],
    campaignId: 'camp-1',
    messages: [
      { id: 'tm-12', senderId: 'agent-4', senderName: 'Service Guru', senderType: 'bot', content: 'Hi Melissa! This is a reminder that your vehicle is due for its 30,000 mile service.', timestamp: '2026-02-19T15:00:00Z' },
      { id: 'tm-13', senderId: 'cust-7', senderName: 'Melissa Taylor', senderType: 'customer', content: 'Can I schedule it for Friday?', timestamp: '2026-02-19T15:30:00Z' },
      { id: 'tm-14', senderId: 'agent-4', senderName: 'Service Guru', senderType: 'bot', content: 'Your service appointment is confirmed for Friday at 10am.', timestamp: '2026-02-19T16:00:00Z' },
    ],
  },
  {
    id: 'tc-8',
    customerName: 'Stephanie Thompson',
    customerEmail: 'steph.t@email.com',
    channel: 'email',
    status: 'participating',
    assignedTo: 'user-1',
    agentId: 'agent-6',
    agentName: 'Marketing Agent',
    lastMessage: 'I received the wrong promotional offer.',
    lastMessageTime: '2026-02-19T14:00:00Z',
    unreadCount: 1,
    tags: ['marketing', 'complaint'],
    messages: [
      { id: 'tm-15', senderId: 'agent-6', senderName: 'Marketing Agent', senderType: 'bot', content: 'Hi Stephanie! Check out our exclusive February specials - up to $5,000 off select models!', timestamp: '2026-02-19T12:00:00Z' },
      { id: 'tm-16', senderId: 'cust-8', senderName: 'Stephanie Thompson', senderType: 'customer', content: 'I received the wrong promotional offer.', timestamp: '2026-02-19T14:00:00Z' },
    ],
  },
];

export const conversationStatusLabels: Record<ConversationStatus, string> = {
  open: 'Open',
  assigned: 'Assigned to me',
  participating: 'Participating',
  automated: 'Automated',
  scheduled: 'Scheduled',
  followup: 'Followup',
  pending: 'Pending',
  closed: 'Closed',
};

export const conversationChannelLabels: Record<ConversationChannel, string> = {
  sms: 'SMS',
  email: 'Email',
  chat: 'Web Chat',
  whatsapp: 'WhatsApp',
  voice: 'Voice',
};
