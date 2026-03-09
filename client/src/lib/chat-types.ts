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

const suggestionsByRole: Record<string, string[]> = {
  sales: [
    "Show today's lead activity",
    "What's my pipeline looking like?",
    "Draft a follow-up email for a prospect",
    "Which leads haven't been contacted this week?",
    "How are my conversion rates trending?",
    "Help me prepare for a sales meeting",
    "What appointments do I have today?",
    "Summarize my top opportunities",
  ],
  service: [
    "Show open service appointments",
    "Which customers are due for maintenance?",
    "Draft a service reminder message",
    "What's the recall status for my department?",
    "Help me write a customer follow-up",
    "Show today's service schedule",
    "How are our CSI scores trending?",
    "What campaigns are running this week?",
  ],
  marketing: [
    "How are our campaigns performing?",
    "Draft a promotional email",
    "What's our lead source breakdown?",
    "Show marketing ROI this month",
    "Help me plan a new campaign",
    "Which channels are driving the most leads?",
    "Analyze our email open rates",
    "Suggest content for social media",
  ],
  management: [
    "Give me a dealership performance overview",
    "How are we tracking against targets?",
    "Show me team activity this week",
    "What are the top escalations right now?",
    "Compare store performance across locations",
    "What hunches need my attention?",
    "Show KPIs for this month",
    "Which agents need review?",
  ],
  default: [
    "What can you help me with today?",
    "Show me today's activity summary",
    "Help me draft a message",
    "What's happening across the dealership?",
    "Show open tasks and escalations",
    "How is the team performing this week?",
    "What appointments are coming up?",
    "Summarize recent lead activity",
  ],
};

export function getRandomSuggestions(role?: string, count: number = 4): string[] {
  const roleKey = role && ['sales', 'sales_manager'].includes(role) ? 'sales'
    : role === 'service' ? 'service'
    : role === 'marketing' ? 'marketing'
    : role && ['super_admin', 'partner_admin', 'org_admin', 'executive'].includes(role) ? 'management'
    : 'default';
  const pool = suggestionsByRole[roleKey];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
