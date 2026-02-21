import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Sparkles, TrendingUp, TrendingDown, Upload, FileText, X, ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { mockChatMessages, agentSuggestions, type ChatMessage } from '@/mocks/messages';
import { useApp } from '@/contexts/AppContext';
import type { UserRole } from '@/mocks/users';

/**
 * @component MainPage
 * @description Primary chat interface with role-based metric tiles and Automa AI conversation
 * @designConstraints
 *   - Metric tiles: 2x2 grid with gradient backgrounds, decorative SVG patterns, icon badges
 *   - Chat: Bot messages left-aligned, user messages right-aligned, NO avatars/icons
 *   - Thinking animation: flat rolling wave (.wave-dot CSS class), 3 dots with staggered timing
 *   - Input: gradient border wrapper (chat-input-gradient class)
 * @rbac All roles see different metric tiles based on currentRole
 * @locked Metric tile gradient themes per role, wave animation timing (0s/0.15s/0.3s delays)
 */

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

const metricDetails: Record<string, { breakdown: { label: string; value: string }[]; description: string }> = {
  'Active Deals': { description: 'All currently active deals in your pipeline', breakdown: [
    { label: 'New Leads', value: '42' }, { label: 'Qualified', value: '38' }, { label: 'Proposal Sent', value: '28' }, { label: 'Negotiation', value: '19' }, { label: 'Closing', value: '15' },
  ]},
  'Pipeline Value': { description: 'Total estimated value of active pipeline', breakdown: [
    { label: 'Q1 Deals', value: '$1.2M' }, { label: 'Q2 Deals', value: '$890K' }, { label: 'Q3 Projected', value: '$650K' }, { label: 'Enterprise', value: '$1.8M' },
  ]},
  'Conversion Rate': { description: 'Lead-to-deal conversion performance', breakdown: [
    { label: 'Web Leads', value: '34%' }, { label: 'Referrals', value: '52%' }, { label: 'Walk-ins', value: '28%' }, { label: 'Phone', value: '19%' },
  ]},
  'Avg Response Time': { description: 'Average time to first response', breakdown: [
    { label: 'Chat', value: '45s' }, { label: 'Email', value: '2.3h' }, { label: 'Phone', value: '1.2m' }, { label: 'SMS', value: '3.5m' },
  ]},
  'System Orgs': { description: 'Total organizations on the platform', breakdown: [
    { label: 'Active', value: '42' }, { label: 'Trial', value: '15' }, { label: 'Suspended', value: '3' }, { label: 'Pending', value: '8' },
  ]},
  'Total Users': { description: 'All users across the platform', breakdown: [
    { label: 'Admins', value: '24' }, { label: 'Managers', value: '89' }, { label: 'Staff', value: '245' }, { label: 'Inactive', value: '18' },
  ]},
  'AI Tasks Today': { description: 'AI-processed tasks in the last 24 hours', breakdown: [
    { label: 'Lead Scoring', value: '89' }, { label: 'Auto-Replies', value: '156' }, { label: 'Reports', value: '34' }, { label: 'Alerts', value: '12' },
  ]},
  'Uptime': { description: 'System availability this month', breakdown: [
    { label: 'API', value: '99.99%' }, { label: 'Web App', value: '99.95%' }, { label: 'Database', value: '100%' }, { label: 'AI Services', value: '99.8%' },
  ]},
  'Partner Orgs': { description: 'Organizations in your partner group', breakdown: [
    { label: 'Franchise A', value: '5' }, { label: 'Franchise B', value: '3' }, { label: 'Independent', value: '4' },
  ]},
  'Group Revenue': { description: 'Combined revenue across partner organizations', breakdown: [
    { label: 'New Sales', value: '$2.1M' }, { label: 'Used Sales', value: '$890K' }, { label: 'Service', value: '$450K' }, { label: 'F&I', value: '$320K' },
  ]},
  'Leads Today': { description: 'New leads received today', breakdown: [
    { label: 'Website', value: '12' }, { label: 'Phone', value: '8' }, { label: 'Walk-in', value: '5' }, { label: 'Referral', value: '3' },
  ]},
  'My Deals': { description: 'Your personally assigned deals', breakdown: [
    { label: 'Hot', value: '3' }, { label: 'Warm', value: '5' }, { label: 'Cold', value: '4' }, { label: 'Follow-up', value: '6' },
  ]},
  'Calls Today': { description: 'Your call activity today', breakdown: [
    { label: 'Outbound', value: '8' }, { label: 'Inbound', value: '4' }, { label: 'Missed', value: '1' }, { label: 'Voicemail', value: '2' },
  ]},
  'Tasks Due': { description: 'Tasks requiring your attention', breakdown: [
    { label: 'Overdue', value: '2' }, { label: 'Today', value: '5' }, { label: 'This Week', value: '8' }, { label: 'Next Week', value: '4' },
  ]},
};

function ThinkingCard({ thinking }: { thinking: ChatMessage['thinking'] }) {
  const [expanded, setExpanded] = useState(false);
  if (!thinking) return null;

  return (
    <div className="mt-2 rounded-lg border border-purple-500/20 bg-purple-500/5 overflow-hidden" data-testid="thinking-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors"
        data-testid="button-toggle-thinking"
      >
        <Brain className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="font-medium flex-1 text-left">{thinking.summary}</span>
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {expanded && (
        <div className="px-3 pb-2.5 space-y-1 border-t border-purple-500/10">
          {thinking.details.map((detail, i) => (
            <div key={i} className="flex items-start gap-2 pt-1.5">
              <div className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground leading-relaxed">{detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MainPage() {
  const { currentRole } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages.slice(0, 1));
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<typeof roleMetrics.org_admin[0] | null>(null);
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
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-4 border-b border-border flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3" data-testid="text-ai-key-metrics-title">AI Key Metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {metrics.map((metric, i) => (
              <div
                key={i}
                className={cn(
                  'relative rounded-xl border border-border bg-gradient-to-br cursor-pointer hover-elevate group',
                  metric.gradient
                )}
                onClick={() => setSelectedMetric(metric)}
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
                  {message.thinking && <ThinkingCard thinking={message.thinking} />}
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

        <div className="px-4 md:px-6 pb-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[11px] text-muted-foreground font-medium">Try asking...</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {agentSuggestions.map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-7 rounded-full px-3"
                  onClick={() => {
                    setInputValue(suggestion);
                    inputRef.current?.focus();
                  }}
                  data-testid={`main-suggestion-${i}`}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <div className="chat-input-gradient rounded-2xl p-[3px] shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <div className="bg-background rounded-[14px] flex items-end gap-2 p-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 flex-shrink-0 rounded-full"
                      data-testid="button-main-chat-add"
                    >
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top" className="w-48">
                    <DropdownMenuItem data-testid="menu-item-upload-file">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </DropdownMenuItem>
                    <DropdownMenuItem data-testid="menu-item-add-from-drive">
                      <FileText className="h-4 w-4 mr-2" />
                      Add from Drive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about your business"
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

      <Dialog open={!!selectedMetric} onOpenChange={(open) => !open && setSelectedMetric(null)}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-metric-detail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="text-metric-detail-title">
              {selectedMetric && (
                <>
                  {selectedMetric.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
                  {selectedMetric.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
                  {selectedMetric.label}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedMetric && (metricDetails[selectedMetric.label]?.description || 'Detailed breakdown of this metric')}
            </DialogDescription>
          </DialogHeader>
          {selectedMetric && (
            <div className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-foreground" data-testid="text-metric-detail-value">{selectedMetric.value}</span>
                <span className={cn(
                  'text-sm font-medium',
                  selectedMetric.trend === 'up' && 'text-green-600 dark:text-green-400',
                  selectedMetric.trend === 'down' && 'text-red-600 dark:text-red-400',
                  selectedMetric.trend === 'neutral' && 'text-muted-foreground'
                )}>
                  {selectedMetric.change}
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Breakdown</h4>
                <div className="space-y-2">
                  {(metricDetails[selectedMetric.label]?.breakdown || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded-md hover-elevate" data-testid={`metric-breakdown-${idx}`}>
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-semibold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
