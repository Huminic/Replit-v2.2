/**
 * @file teambox.tsx — CommBox-Inspired 3-Column Unified Inbox
 * @description The TeamBox is a unified communication inbox modeled after CommBox.
 *   It uses its OWN internal 4-column layout (NOT the global AppLayout right pane).
 *   Cardinal rule: chat thread is in center → customer info panel is on the right column.
 *
 * @layout 4-column structure:
 *   - Column 1 (w-64, hidden on <lg): Status and channel filter sidebar with counts
 *   - Column 2 (w-72 / xl:w-80): Scrollable conversation list with avatar, channel icon,
 *     agent badge, unread count. Automated conversations show a purple Bot icon overlay on the avatar
 *   - Column 3 (flex-1): Full chat thread with reply input. Bot messages styled with primary/10 bg and border.
 *     Customer messages use bg-muted. Agent messages use bg-primary.
 *   - Column 4 (w-64, hidden on <xl): Customer info panel with quick actions (Call/Email/SMS)
 *
 * @keyFeatures
 *   - Take Over button: Appears when conversation is automated — lets a human take control from the AI agent
 *   - Campaign disconnect: Stops all future campaign messages for this specific customer conversation.
 *     Uses Ban icon and destructive styling. Shows "Disconnected" when already disconnected.
 *   - Status filters: all, open, assigned, participating, automated, scheduled, followup, pending
 *   - Channel filters: all, SMS, Email, Web Chat, WhatsApp, Voice
 *
 * @dataSource Conversations loaded from GET /api/conversations, messages from GET /api/conversations/:id/messages.
 *   Replies persisted via POST, Take Over and Campaign Disconnect via PATCH.
 */

import { useState, useEffect, useRef } from 'react';
import { Search, Filter, MessageSquare, Phone, Mail, Send, Paperclip, Ban, Smartphone, Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/contexts/AppContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import type { Conversation, Message } from '@shared/schema';

type ConversationChannel = 'sms' | 'email' | 'chat' | 'whatsapp' | 'voice';
type ConversationStatus = 'open' | 'assigned' | 'participating' | 'automated' | 'scheduled' | 'followup' | 'pending' | 'closed';

const conversationStatusLabels: Record<ConversationStatus, string> = {
  open: 'Open',
  assigned: 'Assigned to me',
  participating: 'Participating',
  automated: 'Automated',
  scheduled: 'Scheduled',
  followup: 'Followup',
  pending: 'Pending',
  closed: 'Closed',
};

const channelIcons: Record<ConversationChannel, React.ElementType> = {
  sms: Smartphone,
  email: Mail,
  chat: MessageSquare,
  whatsapp: MessageSquare,
  voice: Phone,
};

const statusFilters: { id: ConversationStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'assigned', label: 'Assigned to me' },
  { id: 'participating', label: 'Participating' },
  { id: 'automated', label: 'Automated' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'followup', label: 'Followup' },
  { id: 'pending', label: 'Pending' },
];

const channelFilters: { id: ConversationChannel | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sms', label: 'SMS' },
  { id: 'email', label: 'Email' },
  { id: 'chat', label: 'Web Chat' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'voice', label: 'Voice' },
];

function getAgentName(agentId: string | null, agents: { id: string; name: string }[]): string | undefined {
  if (!agentId) return undefined;
  const agent = agents.find(a => a.id === agentId);
  return agent?.name;
}

function ConversationListSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-3 border-b border-border">
          <div className="flex items-start gap-2">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="flex flex-col gap-3 max-w-2xl mx-auto p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={cn('flex gap-2', i % 2 === 0 ? 'justify-start' : 'justify-end')}>
          <Skeleton className={cn('rounded-xl h-16', i % 2 === 0 ? 'w-[60%]' : 'w-[50%]')} />
        </div>
      ))}
    </div>
  );
}

export default function TeamboxPage() {
  const { agents } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState<ConversationStatus | 'all'>('all');
  const [activeChannel, setActiveChannel] = useState<ConversationChannel | 'all'>('all');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
  });

  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/conversations', selectedConversationId, 'messages'],
    enabled: !!selectedConversationId,
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const filteredConversations = conversations.filter(conv => {
    if (activeStatus !== 'all' && conv.status !== activeStatus) return false;
    if (activeChannel !== 'all' && conv.channel !== activeChannel) return false;
    if (searchTerm && !conv.customerName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusCount = (status: ConversationStatus | 'all') => {
    if (status === 'all') return conversations.length;
    return conversations.filter(c => c.status === status).length;
  };

  const getLastMessage = (conv: Conversation): string => {
    if (selectedConversationId === conv.id && messages.length > 0) {
      return messages[messages.length - 1].content;
    }
    return '';
  };

  const sendReplyMutation = useMutation({
    mutationFn: async (data: { conversationId: string; content: string; senderName: string }) => {
      return apiRequest('POST', `/api/conversations/${data.conversationId}/messages`, {
        role: 'agent',
        content: data.content,
        senderName: data.senderName,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', variables.conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setReplyText('');
    },
  });

  const takeOverMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest('PATCH', `/api/conversations/${conversationId}`, {
        status: 'open',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });

  const disconnectCampaignMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest('PATCH', `/api/conversations/${conversationId}`, {
        campaignDisconnected: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedConversationId) return;
    sendReplyMutation.mutate({
      conversationId: selectedConversationId,
      content: replyText.trim(),
      senderName: 'Agent',
    });
  };

  const handleTakeOver = () => {
    if (!selectedConversationId) return;
    takeOverMutation.mutate(selectedConversationId);
  };

  const handleDisconnectCampaign = () => {
    if (!selectedConversationId) return;
    disconnectCampaignMutation.mutate(selectedConversationId);
  };

  return (
    <div className="flex h-full overflow-hidden" data-testid="teambox-page">
      <div className="w-64 border-r border-border flex flex-col bg-muted/30 flex-shrink-0 hidden lg:flex">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="h-8 pl-8 text-xs"
              data-testid="input-teambox-search"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Status</p>
            {statusFilters.map(filter => {
              const count = getStatusCount(filter.id);
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveStatus(filter.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors',
                    activeStatus === filter.id ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground hover:bg-accent/50'
                  )}
                  data-testid={`filter-status-${filter.id}`}
                >
                  <span>{filter.label}</span>
                  {count > 0 && <Badge variant="secondary" className="h-5 min-w-5 text-[10px]">{count}</Badge>}
                </button>
              );
            })}
          </div>

          <div className="p-2 border-t border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Channel</p>
            {channelFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveChannel(filter.id)}
                className={cn(
                  'w-full flex items-center px-2 py-1.5 rounded-md text-xs transition-colors',
                  activeChannel === filter.id ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground hover:bg-accent/50'
                )}
                data-testid={`filter-channel-${filter.id}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="w-72 xl:w-80 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {activeStatus === 'all' ? 'All' : conversationStatusLabels[activeStatus as ConversationStatus]}
            </span>
          </div>
          <Badge variant="secondary" className="text-xs" data-testid="badge-conversation-count">{filteredConversations.length}</Badge>
        </div>

        <ScrollArea className="flex-1">
          {conversationsLoading ? (
            <ConversationListSkeleton />
          ) : (
            <div className="flex flex-col">
              {filteredConversations.map(conv => {
                const ChannelIcon = channelIcons[conv.channel as ConversationChannel] || MessageSquare;
                const isSelected = selectedConversationId === conv.id;
                const agentName = getAgentName(conv.agentId, agents);
                const lastMsgText = getLastMessage(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={cn(
                      'w-full text-left p-3 border-b border-border transition-colors',
                      isSelected ? 'bg-accent' : 'hover:bg-accent/50'
                    )}
                    data-testid={`conversation-item-${conv.id}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="relative flex-shrink-0 mt-0.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {conv.customerName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {conv.status === 'automated' && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center ring-2 ring-background" title="AI-handled conversation">
                            <Bot className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-medium truncate">{conv.customerName}</span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {conv.lastMessageAt
                              ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })
                              : ''}
                          </span>
                        </div>
                        {lastMsgText && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMsgText}</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          <ChannelIcon className="h-3 w-3 text-muted-foreground" />
                          {agentName && (
                            <Badge variant="outline" className={cn(
                              "h-4 text-[10px] px-1 gap-0.5",
                              conv.status === 'automated' && "border-purple-300 dark:border-purple-700"
                            )}>
                              {conv.status === 'automated' && <Bot className="h-2.5 w-2.5" />}
                              {agentName}
                            </Badge>
                          )}
                          {conv.unreadCount > 0 && (
                            <Badge className="h-4 min-w-4 text-[10px] px-1 ml-auto">{conv.unreadCount}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredConversations.length === 0 && !conversationsLoading && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No conversations found
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {selectedConversation.customerName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-semibold" data-testid="text-conversation-customer">{selectedConversation.customerName}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {(selectedConversation.channel || '').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {selectedConversation.agentId && selectedConversation.status === 'automated' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleTakeOver}
                    disabled={takeOverMutation.isPending}
                    data-testid="button-take-over"
                  >
                    {takeOverMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    Take Over
                  </Button>
                )}
                {selectedConversation.campaignId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-7 text-xs gap-1',
                      selectedConversation.campaignDisconnected ? 'text-muted-foreground' : 'text-destructive border-destructive/30'
                    )}
                    onClick={handleDisconnectCampaign}
                    disabled={selectedConversation.campaignDisconnected || disconnectCampaignMutation.isPending}
                    data-testid="button-disconnect-campaign"
                  >
                    {disconnectCampaignMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Ban className="h-3 w-3" />
                    )}
                    {selectedConversation.campaignDisconnected ? 'Disconnected' : 'Disconnect Campaign'}
                  </Button>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messagesLoading ? (
                <MessagesSkeleton />
              ) : (
                <div className="flex flex-col gap-3 max-w-2xl mx-auto">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-2',
                        msg.role === 'customer' ? 'justify-start' : 'justify-end'
                      )}
                      data-testid={`message-${msg.id}`}
                    >
                      <div className={cn(
                        'max-w-[75%] rounded-xl px-3 py-2',
                        msg.role === 'customer'
                          ? 'bg-muted text-foreground rounded-bl-sm'
                          : msg.role === 'bot'
                            ? 'bg-primary/10 text-foreground rounded-br-sm border border-primary/20'
                            : 'bg-primary text-primary-foreground rounded-br-sm'
                      )}>
                        <p className="text-[10px] font-medium mb-0.5 opacity-70">{msg.senderName || msg.role}</p>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-[10px] mt-1 opacity-50">
                          {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No messages yet
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="border-t border-border p-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="min-h-[60px] max-h-[120px] text-sm resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    data-testid="input-reply"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-attach">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-8 w-8"
                    disabled={!replyText.trim() || sendReplyMutation.isPending}
                    onClick={handleSendReply}
                    data-testid="button-send-reply"
                  >
                    {sendReplyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            {conversationsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <p className="text-sm">Select a conversation to view</p>
            )}
          </div>
        )}
      </div>

      {selectedConversation && (
        <div className="w-64 border-l border-border flex-shrink-0 hidden xl:flex flex-col">
          <div className="p-3 border-b border-border">
            <h4 className="text-sm font-semibold">Customer Info</h4>
          </div>
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Name</p>
                <p className="text-sm font-medium" data-testid="text-customer-name">{selectedConversation.customerName}</p>
              </div>
              {selectedConversation.customerEmail && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm" data-testid="text-customer-email">{selectedConversation.customerEmail}</p>
                </div>
              )}
              {selectedConversation.customerPhone && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <p className="text-sm" data-testid="text-customer-phone">{selectedConversation.customerPhone}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Channel</p>
                <Badge variant="outline" className="text-xs">{(selectedConversation.channel || '').toUpperCase()}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant="secondary" className="text-xs">
                  {conversationStatusLabels[selectedConversation.status as ConversationStatus] || selectedConversation.status}
                </Badge>
              </div>
              {selectedConversation.agentId && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Handled by</p>
                  <p className="text-sm" data-testid="text-agent-name">{getAgentName(selectedConversation.agentId, agents) || 'AI Agent'}</p>
                </div>
              )}
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-2">Quick Actions</p>
                <div className="flex flex-col gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs justify-start gap-2" data-testid="button-call-customer">
                    <Phone className="h-3 w-3" /> Call
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs justify-start gap-2" data-testid="button-email-customer">
                    <Mail className="h-3 w-3" /> Email
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs justify-start gap-2" data-testid="button-sms-customer">
                    <Smartphone className="h-3 w-3" /> SMS
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
