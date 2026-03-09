/**
 * @file main.tsx — Primary AI Chat Page
 * @description The center of the app experience. This is the main AI chat interface
 *   where users interact with the AI persona (personaName from AppContext). The page follows
 *   the cardinal layout rule: chat is always in center → info/artifacts appear in the right pane.
 *
 * @layout
 *   - Top section: Pipeline metric tiles (2x2 grid) that collapse after the user's first message
 *   - Center: Full chat thread with bot messages left-aligned, user messages right-aligned (NO avatars)
 *   - Bottom: Suggestion chips + gradient-bordered chat input with file upload dropdown
 *   - Metric detail dialog: Click any tile to see drill-down breakdown data
 *
 * @designConstraints
 *   - Metric tiles: gradient backgrounds, decorative SVG concentric circles, icon badges
 *   - Chat: Bot messages use bg-card with border, user messages use bg-primary
 *   - Thinking animation: flat rolling wave (.wave-dot CSS class), 3 dots with staggered timing (0s/0.15s/0.3s)
 *   - Input: gradient border wrapper (chat-input-gradient class) with purple glow shadow
 *
 * @rbac Pipeline tiles are org-scoped — data changes when switching organizations
 * @locked Metric tile gradient themes, wave animation timing, chat bubble styling
 *
 * @productionNote Chat responses are currently mocked with a 1.5s setTimeout.
 *   Will connect to AI backend at nexxusv2.huminicdev.com with conversation context.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Plus, Sparkles, TrendingUp, TrendingDown, Upload, FileText, X, ChevronDown, ChevronRight, ChevronUp, Brain, Globe, Square, RotateCcw, AlertCircle } from 'lucide-react';
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
import { getRandomSuggestions, type ChatMessage } from '@/lib/chat-types';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { MarkdownMessage } from '@/components/MarkdownMessage';
import { useToast } from '@/hooks/use-toast';
import type { Conversation as DbConversation, Message as DbMessage } from '@shared/schema';

interface PipelineData {
  activePipeline: number;
  appointmentsToday: number;
  openEscalations: number;
  outboundSent24h: number;
}

interface MetricTile {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  gradient: string;
  iconBg: string;
}

function buildPipelineTiles(data: PipelineData | undefined): MetricTile[] {
  const ap = data?.activePipeline ?? 0;
  const at = data?.appointmentsToday ?? 0;
  const oe = data?.openEscalations ?? 0;
  const os = data?.outboundSent24h ?? 0;
  return [
    { label: 'Active Pipeline', value: String(ap), change: 'live', trend: 'up', gradient: 'from-emerald-500/15 via-green-500/10 to-teal-500/5', iconBg: 'bg-emerald-500/20' },
    { label: 'Appointments Today', value: String(at), change: 'live', trend: 'up', gradient: 'from-blue-500/15 via-indigo-500/10 to-violet-500/5', iconBg: 'bg-blue-500/20' },
    { label: 'Open Escalations', value: String(oe), change: 'live', trend: oe > 0 ? 'down' : 'up', gradient: 'from-amber-500/15 via-orange-500/10 to-red-500/5', iconBg: 'bg-amber-500/20' },
    { label: 'Outbound Sent 24h', value: String(os), change: 'live', trend: 'up', gradient: 'from-purple-500/15 via-violet-500/10 to-indigo-500/5', iconBg: 'bg-purple-500/20' },
  ];
}


function buildMetricDetails(data: PipelineData | undefined): Record<string, { breakdown: { label: string; value: string; detail?: string }[]; description: string; highlights?: string[] }> {
  const ap = data?.activePipeline ?? 0;
  const at = data?.appointmentsToday ?? 0;
  const oe = data?.openEscalations ?? 0;
  const os = data?.outboundSent24h ?? 0;
  return {
    'Active Pipeline': { description: 'Leads created in the last 14 days, excluding Lost, Sold, and Duplicate statuses', breakdown: [
      { label: 'Total Active Leads', value: String(ap) },
      { label: 'Window', value: '14 days', detail: 'Active leads from the last 14 days' },
    ], highlights: ap > 0 ? ['14-day pipeline window ensures freshness'] : ['No active pipeline leads in the current window'] },
    'Appointments Today': { description: 'Scheduled appointments for today across all departments', breakdown: [
      { label: 'Total Today', value: String(at) },
    ], highlights: at > 0 ? [at + ' appointment' + (at !== 1 ? 's' : '') + ' scheduled for today'] : ['No appointments scheduled for today'] },
    'Open Escalations': { description: 'Active escalations requiring team attention in TeamBox', breakdown: [
      { label: 'Total Open', value: String(oe), detail: 'Includes VIN push failures, unsent messages, and customer escalations' },
    ], highlights: oe > 0 ? [oe + ' escalation' + (oe !== 1 ? 's' : '') + ' need attention'] : ['No open escalations'] },
    'Outbound Sent 24h': { description: 'Outbound messages sent across all channels in the last 24 hours', breakdown: [
      { label: 'Total Sent', value: String(os), detail: 'SMS, email, and voice combined' },
    ], highlights: os > 0 ? [os + ' outbound message' + (os !== 1 ? 's' : '') + ' delivered in the last 24 hours'] : ['No outbound messages sent in the last 24 hours'] },
  };
}

/** Decorative SVG icons shown inside each metric tile's icon badge (folder, users, lightning, chart) */
const tileIcons = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>,
];


/**
 * ThinkingCard — Expandable card showing AI reasoning steps.
 * Appears below bot messages that include a `thinking` property.
 * Shows a summary line with Brain icon; click to expand and see detailed reasoning steps.
 */
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

/**
 * MainPage — Primary chat interface component.
 * Uses personaName from AppContext to label the AI persona in responses.
 * The wave-dot animation (3 bouncing dots) displays while AI is "typing".
 */
export default function MainPage() {
  const { personaName, currentUser, currentOrganization, currentRole } = useApp();
  const [suggestions] = useState(() => getRandomSuggestions(currentRole));
  const orgId = currentOrganization?.id;
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<MetricTile | null>(null);
  const [tilesCollapsed, setTilesCollapsed] = useState(false);
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: pipelineData } = useQuery<PipelineData>({
    queryKey: ['/api/metrics/pipeline', orgId],
  });

  const metrics = buildPipelineTiles(pipelineData);
  const metricDetails = buildMetricDetails(pipelineData);

  const findOrCreateConversation = useCallback(async () => {
    if (!authUser || initialized) return;

    try {
      const res = await apiRequest('POST', '/api/conversations', {
        customerName: `${authUser.firstName} ${authUser.lastName}`,
        customerEmail: authUser.email,
        channel: 'ai-chat',
        status: 'open',
      });
      const newConv: DbConversation = await res.json();
      setConversationId(newConv.id);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations?channel=ai-chat'] });
      setInitialized(true);
    } catch (err) {
      console.error('Failed to create main chat conversation:', err);
    }
  }, [authUser, initialized, personaName]);

  useEffect(() => {
    findOrCreateConversation();
  }, [findOrCreateConversation]);

  const { data: dbMessages } = useQuery<DbMessage[]>({
    queryKey: [`/api/conversations/${conversationId}/messages`],
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (dbMessages && dbMessages.length > 0) {
      const mapped: ChatMessage[] = dbMessages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
      }));
      setMessages(mapped);
      if (mapped.some((m) => m.role === 'user')) {
        setHasSentMessage(true);
        setTilesCollapsed(true);
      }
    } else if (dbMessages && dbMessages.length === 0 && conversationId && !initialized) {
    }
  }, [dbMessages, conversationId, personaName, authUser]);

  const { sendMessage: streamSend, abortStream, retry, isStreaming, streamingContent, statusMessage, error: streamError, lastFailedContent } = useStreamingChat({
    conversationId,
  });

  const lastUserContent = messages.filter(m => m.role === 'user').at(-1)?.content;
  const handleRegenerate = () => {
    if (lastUserContent) streamSend(lastUserContent);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!inputValue.trim() || !conversationId) return;

    const content = inputValue.trim();
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    if (!hasSentMessage) {
      setHasSentMessage(true);
      setTilesCollapsed(true);
    }

    await streamSend(content);
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
        <div className="border-b border-border flex-shrink-0">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-between py-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" data-testid="text-ai-key-metrics-title">AI Key Metrics</h2>
              {hasSentMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => setTilesCollapsed(!tilesCollapsed)}
                  data-testid="button-toggle-metrics"
                >
                  {tilesCollapsed ? (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Show
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Hide
                    </>
                  )}
                </Button>
              )}
            </div>
            <div
              className={cn(
                'overflow-hidden transition-all duration-500 ease-in-out',
                tilesCollapsed ? 'max-h-0 opacity-0 pb-0' : 'max-h-[500px] opacity-100 pb-4'
              )}
            >
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
        </div>

        <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {messages.map((message, idx) => {
              const isLastAssistant = message.role === 'assistant' && idx === messages.length - 1;
              return (
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
                    {message.role === 'assistant' ? (
                      <MarkdownMessage
                        content={message.content}
                        rawContent={message.content}
                        isLastAssistant={isLastAssistant && !isStreaming}
                        onRegenerate={handleRegenerate}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    )}
                    {message.thinking && <ThinkingCard thinking={message.thinking} />}
                  </div>
                </div>
              );
            })}

            {isStreaming && (
              <div className="flex justify-start" data-testid="streaming-message">
                <div className="density-chat rounded-2xl px-5 py-4 max-w-[80%] bg-card border border-border">
                  {streamingContent ? (
                    <MarkdownMessage content={streamingContent} isStreaming showActions={false} />
                  ) : statusMessage ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-3.5 w-3.5 animate-pulse" />
                      <span>{statusMessage}</span>
                    </div>
                  ) : (
                    <div className="flex gap-1 items-center h-5">
                      <span className="wave-dot" />
                      <span className="wave-dot" style={{ animationDelay: '0.15s' }} />
                      <span className="wave-dot" style={{ animationDelay: '0.3s' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {streamError && !isStreaming && (
              <div className="flex justify-start" data-testid="stream-error">
                <div className="density-chat rounded-2xl px-5 py-4 max-w-[80%] bg-destructive/10 border border-destructive/30">
                  <div className="flex items-center gap-2 text-sm text-destructive mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{streamError}</span>
                  </div>
                  {lastFailedContent && (
                    <Button size="sm" variant="outline" onClick={retry} data-testid="button-retry">
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Retry
                    </Button>
                  )}
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
              {suggestions.map((suggestion, i) => (
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
                    <DropdownMenuItem
                      data-testid="menu-item-upload-file"
                      onClick={() => {
                        toast({
                          title: 'Coming Soon',
                          description: 'File upload will be available in a future update.',
                        });
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      data-testid="menu-item-add-document"
                      onClick={() => {
                        toast({
                          title: 'Coming Soon',
                          description: 'Knowledge base document attachment will be available in a future update.',
                        });
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Add Document
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
                {isStreaming ? (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-9 w-9 flex-shrink-0 rounded-full"
                    onClick={abortStream}
                    data-testid="button-main-stop"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    className="h-9 w-9 flex-shrink-0 rounded-full"
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    data-testid="button-main-send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedMetric} onOpenChange={(open) => !open && setSelectedMetric(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto" data-testid="dialog-metric-detail">
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
            <DialogDescription className="text-xs">
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
                <div className="space-y-1">
                  {(metricDetails[selectedMetric.label]?.breakdown || []).map((item, idx) => (
                    <div key={idx} className="py-1.5 px-2 rounded-md hover:bg-muted/50" data-testid={`metric-breakdown-${idx}`}>
                      <div className="flex items-center justify-between">
                        <span className={cn('text-sm', item.label.startsWith('  ') ? 'text-foreground pl-3' : 'text-muted-foreground font-medium')}>{item.label}</span>
                        {item.value && <span className="text-sm font-semibold text-foreground">{item.value}</span>}
                      </div>
                      {item.detail && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 pl-0">{item.detail}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {metricDetails[selectedMetric.label]?.highlights && (
                <div className="border-t border-border pt-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Insights</h4>
                  <div className="space-y-1.5">
                    {metricDetails[selectedMetric.label]!.highlights!.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <span className="text-xs text-foreground leading-relaxed">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
