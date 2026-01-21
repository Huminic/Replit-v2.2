import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Bot, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { mockChatMessages, agentSuggestions, type ChatMessage } from '@/mocks/messages';
import { useApp } from '@/contexts/AppContext';

interface RightPaneProps {
  className?: string;
  mode?: 'inline' | 'sheet';
}

export function RightPane({ className, mode = 'inline' }: RightPaneProps) {
  const { currentUser, mobileChatOpen, setMobileChatOpen } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const userInitials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
        content: "I understand your request. Let me help you with that. This is a UI prototype, so I'm simulating a response. In a production environment, this would connect to the Automa AI backend for intelligent responses.",
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const chatContent = (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Automa</h3>
            <p className="text-xs text-muted-foreground">AI Assistant</p>
          </div>
        </div>
        {mode === 'sheet' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileChatOpen(false)}
            data-testid="button-close-chat"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="flex flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' && 'flex-row-reverse'
              )}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className={cn(
                  'text-xs',
                  message.role === 'assistant' 
                    ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white' 
                    : 'bg-primary text-primary-foreground'
                )}>
                  {message.role === 'assistant' ? <Bot className="h-4 w-4" /> : userInitials}
                </AvatarFallback>
              </Avatar>
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
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Suggestions */}
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

      {/* Input */}
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
              placeholder="Ask Automa anything..."
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

  if (mode === 'sheet') {
    return (
      <Sheet open={mobileChatOpen} onOpenChange={setMobileChatOpen}>
        <SheetContent side="bottom" className="h-[70vh] p-0 rounded-t-xl">
          {chatContent}
        </SheetContent>
      </Sheet>
    );
  }

  return chatContent;
}
