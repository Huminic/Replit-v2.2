/**
 * @component RightPane
 * @description Right-side Automa AI chat panel for data-display pages. Cardinal rule: when data is in center,
 * this panel lets users discuss that data with the AI assistant.
 *
 * Features:
 *   - Uses personaName from AppContext as the assistant's display name
 *   - Mock chat pattern with simulated typing (wave-dot animation) and 1.5s response delay
 *   - Suggestion buttons shown when conversation has ≤3 messages (onboarding help)
 *   - Gradient border on input area (chat-input-gradient) for visual distinction
 *   - Enter to send, Shift+Enter for newline, auto-scroll on new messages
 *
 * @designConstraints
 *   - Rendered inside AppLayout right column (w-80 lg:w-96 on desktop, full-screen on mobile)
 *   - User messages: primary bg, right-aligned
 *   - Assistant messages: card bg with border, left-aligned
 *
 * @production Will connect to AI backend (nexxusv2.huminicdev.com) with dashboard context awareness.
 *   Currently uses mockChatMessages and simulated responses.
 * @see AppLayout.tsx — controls when this panel is shown/hidden
 * @see messages.ts — provides mockChatMessages and agentSuggestions
 */
import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockChatMessages, agentSuggestions, type ChatMessage } from '@/mocks/messages';
import { useApp } from '@/contexts/AppContext';

interface RightPaneProps {
  className?: string;
}

export function RightPane({ className }: RightPaneProps) {
  const { currentUser, personaName } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send user message and simulate AI response after 1.5s delay
  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: "I understand your request. Let me help you with that. This is a UI prototype, so I'm simulating a response. In production, this connects to your AI backend for intelligent responses.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  // Enter sends message, Shift+Enter adds newline
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Pre-fill input with suggestion text and focus the textarea
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-foreground" data-testid="text-persona-name">{personaName}</h3>
          <p className="text-xs text-muted-foreground">AI Assistant</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
              data-testid={`chat-message-${message.id}`}
            >
              <div
                className={cn(
                  'density-chat rounded-xl px-4 py-3 max-w-[85%]',
                  message.role === 'assistant'
                    ? 'bg-card border border-border'
                    : 'bg-primary text-primary-foreground'
                )}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <div className="flex items-center gap-1">
                  <span className="wave-dot" style={{ animationDelay: '0s' }} />
                  <span className="wave-dot" style={{ animationDelay: '0.15s' }} />
                  <span className="wave-dot" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {messages.length <= 3 && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Suggestions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {agentSuggestions.slice(0, 3).map((suggestion, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleSuggestionClick(suggestion)}
                data-testid={`suggestion-${i}`}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-border">
        <div className="chat-input-gradient rounded-xl p-[2px]">
          <div className="bg-background rounded-[10px] flex items-end gap-2 p-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              data-testid="button-chat-add"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </Button>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${personaName} anything...`}
              className="flex-1 bg-transparent resize-none outline-none text-sm min-h-[24px] max-h-32 py-1"
              rows={1}
              data-testid="input-chat-message"
            />
            <Button
              size="icon"
              className="h-8 w-8 flex-shrink-0 rounded-lg"
              onClick={handleSend}
              disabled={!inputValue.trim()}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
