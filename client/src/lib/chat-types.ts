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

export const agentSuggestions = [
  'AI agent documentation assistant',
  'AI agent task organizer',
  'AI agent collaboration facilitator',
  'AI agent partner portal manager',
  'AI agent progress reporter',
];
