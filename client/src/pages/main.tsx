import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Star, MessageSquare, Sparkles, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { mockChatMessages, mockConversations, agentSuggestions, type ChatMessage } from '@/mocks/messages';
import { useApp } from '@/contexts/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { useLocation } from 'wouter';
import type { UserRole } from '@/mocks/users';

interface MetricTile {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  gradient: string;
  iconBg: string;
}

const roleMetrics: Record<UserRole, MetricTile[]> = {
  super_admin: [
    { label: 'Partner Orgs', value: '12', change: '+2 this month', trend: 'up', gradient: 'from-violet-500/15 via-purple-500/10 to-fuchsia-500/5', iconBg: 'bg-violet-500/20' },
    { label: 'Total Logins', value: '1,847', change: '+18%', trend: 'up', gradient: 'from-blue-500/15 via-cyan-500/10 to-sky-500/5', iconBg: 'bg-blue-500/20' },
    { label: 'Platform Actions', value: '24.3K', change: '+9%', trend: 'up', gradient: 'from-emerald-500/15 via-green-500/10 to-teal-500/5', iconBg: 'bg-emerald-500/20' },
    { label: 'Agent Actions', value: '8,412', change: '+22%', trend: 'up', gradient: 'from-amber-500/15 via-orange-500/10 to-yellow-500/5', iconBg: 'bg-amber-500/20' },
  ],
  partner_admin: [
    { label: 'Sub Orgs', value: '6', change: '+1 this quarter', trend: 'up', gradient: 'from-indigo-500/15 via-violet-500/10 to-purple-500/5', iconBg: 'bg-indigo-500/20' },
    { label: 'Total Logins', value: '423', change: '+12%', trend: 'up', gradient: 'from-cyan-500/15 via-blue-500/10 to-sky-500/5', iconBg: 'bg-cyan-500/20' },
    { label: 'User Actions', value: '5,291', change: '+7%', trend: 'up', gradient: 'from-teal-500/15 via-emerald-500/10 to-green-500/5', iconBg: 'bg-teal-500/20' },
    { label: 'Agent Actions', value: '2,104', change: '+15%', trend: 'up', gradient: 'from-rose-500/15 via-pink-500/10 to-fuchsia-500/5', iconBg: 'bg-rose-500/20' },
  ],
  org_admin: [
    { label: 'Pipeline Value', value: '$284K', change: '+14%', trend: 'up', gradient: 'from-emerald-500/15 via-green-500/10 to-teal-500/5', iconBg: 'bg-emerald-500/20' },
    { label: 'Lead Source', value: '47 new', change: '+8 today', trend: 'up', gradient: 'from-blue-500/15 via-indigo-500/10 to-violet-500/5', iconBg: 'bg-blue-500/20' },
    { label: 'Lead Quality', value: '72%', change: '-3%', trend: 'down', gradient: 'from-amber-500/15 via-orange-500/10 to-red-500/5', iconBg: 'bg-amber-500/20' },
    { label: 'Demand Score', value: '8.4', change: '+0.6', trend: 'up', gradient: 'from-purple-500/15 via-violet-500/10 to-indigo-500/5', iconBg: 'bg-purple-500/20' },
  ],
  org_staff: [
    { label: 'Hot Opportunities', value: '7', change: '3 urgent', trend: 'up', gradient: 'from-orange-500/15 via-amber-500/10 to-yellow-500/5', iconBg: 'bg-orange-500/20' },
    { label: 'Buying Intel', value: '12', change: '5 new signals', trend: 'up', gradient: 'from-sky-500/15 via-blue-500/10 to-indigo-500/5', iconBg: 'bg-sky-500/20' },
    { label: 'Threats', value: '3', change: '1 critical', trend: 'down', gradient: 'from-red-500/15 via-rose-500/10 to-pink-500/5', iconBg: 'bg-red-500/20' },
    { label: 'Urgency Score', value: '8.1', change: '+1.2 today', trend: 'up', gradient: 'from-fuchsia-500/15 via-purple-500/10 to-violet-500/5', iconBg: 'bg-fuchsia-500/20' },
  ],
};

const tileIcons = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>,
];

export default function MainPage() {
  const { currentUser, currentRole, favorites, removeFavorite } = useApp();
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const metrics = roleMetrics[currentRole] || roleMetrics.org_admin;

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

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-4 border-b border-border flex-shrink-0">
          <div className="max-w-3xl mx-auto grid grid-cols-2 gap-3">
            {metrics.map((metric, i) => (
              <div
                key={i}
                className={cn(
                  'relative overflow-hidden rounded-xl border border-border bg-gradient-to-br cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group',
                  metric.gradient
                )}
                data-testid={`metric-tile-${i}`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.07] -mr-4 -mt-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
                    <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="1" className="text-foreground" />
                  </svg>
                </div>
                <div className="relative p-4 flex items-start gap-3">
                  <div className={cn('flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-foreground/70', metric.iconBg)}>
                    {tileIcons[i]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium truncate">{metric.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-0.5 tracking-tight">{metric.value}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {metric.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                      {metric.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                      <span className={cn(
                        'text-[11px] font-medium',
                        metric.trend === 'up' && 'text-green-600 dark:text-green-400',
                        metric.trend === 'down' && 'text-red-600 dark:text-red-400',
                        metric.trend === 'neutral' && 'text-muted-foreground'
                      )}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
                data-testid={`main-chat-message-${message.id}`}
              >
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
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl px-5 py-4">
                  <div className="flex gap-1 items-center h-5">
                    <span className="wave-dot" />
                    <span className="wave-dot" style={{ animationDelay: '0.15s' }} />
                    <span className="wave-dot" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

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
