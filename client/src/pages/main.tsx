import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Bot, Star, MessageSquare, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockChatMessages, mockConversations, agentSuggestions, type ChatMessage } from '@/mocks/messages';
import { useApp } from '@/contexts/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { useLocation } from 'wouter';

export default function MainPage() {
  const { currentUser, favorites, removeFavorite } = useApp();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false); // Default closed
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
        content: "I understand your request. Let me help you with that. This is the main chat interface where you can interact with Automa for any task. Would you like me to help you create an agent, analyze data, or assist with something else?",
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

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Panel - Favorites & Message History */}
      {leftPanelOpen && (
        <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 flex-shrink-0">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Star className="h-4 w-4 text-amber-500" />
              Favorites
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => setLeftPanelOpen(false)}
              data-testid="button-collapse-home-panel"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          {favorites.length > 0 ? (
            <div className="p-2 flex flex-col gap-1">
              {favorites.map((fav) => (
                <button
                  key={fav.id}
                  onClick={() => setLocation(fav.path)}
                  className="w-full text-left p-2 rounded-lg transition-colors hover-elevate flex items-center gap-2"
                  data-testid={`home-favorite-${fav.id}`}
                >
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                  <span className="text-sm text-foreground truncate">{fav.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground px-3 py-2">
              Star pages to access them quickly
            </p>
          )}

          <div className="flex-1 flex flex-col">
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MessageSquare className="h-4 w-4 text-primary" />
                Message History
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 flex flex-col gap-1">
                {mockConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg transition-colors hover-elevate',
                      activeConversation === conv.id ? 'bg-accent' : 'hover:bg-accent/50'
                    )}
                    data-testid={`conversation-${conv.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{conv.title}</p>
                      {conv.unread && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(conv.timestamp), { addSuffix: true })}
                    </p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>
      )}
      
      {/* Expand button when panel is closed */}
      {!leftPanelOpen && (
        <div className="hidden md:flex items-start pt-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => setLeftPanelOpen(true)}
            data-testid="button-expand-home-panel"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Nexxus Connect Header */}
        <div className="flex items-center justify-center py-8 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <div className="w-3 h-3 rounded-full bg-blue-500" />
            </div>
            <span className="text-xl font-semibold text-foreground">Nexxus Connect</span>
            <span className="text-muted-foreground text-xl">™</span>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' && 'flex-row-reverse'
                )}
                data-testid={`main-chat-message-${message.id}`}
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className={cn(
                    'text-sm',
                    message.role === 'assistant' 
                      ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white' 
                      : 'bg-primary text-primary-foreground'
                  )}>
                    {message.role === 'assistant' ? <Bot className="h-4 w-4" /> : userInitials}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    'density-chat rounded-2xl px-5 py-4 max-w-[80%]',
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
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-card border border-border rounded-2xl px-5 py-4">
                  <div className="flex gap-1.5">
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
          <div className="px-4 md:px-6 pb-2">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">Try asking...</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {agentSuggestions.map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8 rounded-full"
                    onClick={() => {
                      setInputValue(suggestion);
                      inputRef.current?.focus();
                    }}
                    data-testid={`main-suggestion-${i}`}
                  >
                    <Sparkles className="h-3 w-3 mr-1.5 text-primary" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 md:p-6 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <div className="chat-input-gradient rounded-2xl p-[3px] shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <div className="bg-background rounded-[14px] flex items-end gap-2 p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0 rounded-full"
                  data-testid="button-main-chat-add"
                >
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </Button>
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Give Nexxus Connect responsibilities, workflows, or projects to manage"
                  className="flex-1 bg-transparent resize-none outline-none text-sm min-h-[28px] max-h-40 py-1.5"
                  rows={1}
                  data-testid="input-main-chat"
                />
                <Button
                  size="icon"
                  className="h-9 w-9 flex-shrink-0 rounded-full"
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  data-testid="button-main-send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
