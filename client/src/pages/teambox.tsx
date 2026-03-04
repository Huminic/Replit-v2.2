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
 * @productionNote Conversations currently come from mockTeamboxConversations in mocks/conversations.ts.
 *   Will wire to backend API at nexxusv2.huminicdev.com for real-time conversation streaming.
 */

import { useState } from 'react';
import { Search, Filter, MessageSquare, Phone, Mail, Send, Paperclip, Ban, AlertTriangle, Smartphone, Globe, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import { mockTeamboxConversations, conversationStatusLabels, type ConversationStatus, type ConversationChannel, type TeamboxConversation } from '@/mocks/conversations';
import { formatDistanceToNow } from 'date-fns';

/** Maps each conversation channel type to its corresponding Lucide icon */
const channelIcons: Record<ConversationChannel, React.ElementType> = {
  sms: Smartphone,
  email: Mail,
  chat: MessageSquare,
  whatsapp: MessageSquare,
  voice: Phone,
};

/** Status filter options for Column 1 sidebar — includes counts dynamically calculated */
const statusFilters: { id: ConversationStatus | 'all'; label: string; count?: number }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'assigned', label: 'Assigned to me' },
  { id: 'participating', label: 'Participating' },
  { id: 'automated', label: 'Automated' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'followup', label: 'Followup' },
  { id: 'pending', label: 'Pending' },
];

/** Channel filter options for Column 1 sidebar — filters conversations by communication channel */
const channelFilters: { id: ConversationChannel | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sms', label: 'SMS' },
  { id: 'email', label: 'Email' },
  { id: 'chat', label: 'Web Chat' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'voice', label: 'Voice' },
];

/**
 * TeamboxPage — Main unified inbox component.
 * Pre-selects the first conversation on load.
 * PRODUCTION NOTE: Will need WebSocket/SSE for real-time message updates.
 */
export default function TeamboxPage() {
  const { currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState<ConversationStatus | 'all'>('all');
  const [activeChannel, setActiveChannel] = useState<ConversationChannel | 'all'>('all');
  const [selectedConversation, setSelectedConversation] = useState<TeamboxConversation | null>(mockTeamboxConversations[0]);
  const [replyText, setReplyText] = useState('');

  // Filter conversations by status, channel, and search term (customer name)
  const filteredConversations = mockTeamboxConversations.filter(conv => {
    if (activeStatus !== 'all' && conv.status !== activeStatus) return false;
    if (activeChannel !== 'all' && conv.channel !== activeChannel) return false;
    if (searchTerm && !conv.customerName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Counts conversations per status for the filter sidebar badges
  const getStatusCount = (status: ConversationStatus | 'all') => {
    if (status === 'all') return mockTeamboxConversations.length;
    return mockTeamboxConversations.filter(c => c.status === status).length;
  };

  return (
    <div className="flex h-full overflow-hidden" data-testid="teambox-page">
      {/* Column 1: Status & Channel filter sidebar — hidden on screens < lg */}
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

      {/* Column 2: Conversation list — shows avatar, channel icon, agent badge, unread count */}
      <div className="w-72 xl:w-80 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {activeStatus === 'all' ? 'All' : conversationStatusLabels[activeStatus as ConversationStatus]}
            </span>
          </div>
          <Badge variant="secondary" className="text-xs">{filteredConversations.length}</Badge>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {filteredConversations.map(conv => {
              const ChannelIcon = channelIcons[conv.channel];
              const isSelected = selectedConversation?.id === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
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
                      {/* Purple Bot icon overlay on avatar for automated (AI-handled) conversations */}
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
                          {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: false })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <ChannelIcon className="h-3 w-3 text-muted-foreground" />
                        {conv.agentName && (
                          <Badge variant="outline" className={cn(
                            "h-4 text-[10px] px-1 gap-0.5",
                            conv.status === 'automated' && "border-purple-300 dark:border-purple-700"
                          )}>
                            {conv.status === 'automated' && <Bot className="h-2.5 w-2.5" />}
                            {conv.agentName}
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
          </div>
        </ScrollArea>
      </div>

      {/* Column 3: Full chat thread with reply input */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConversation ? (
          <>
            {/* Chat header with customer name, tags, Take Over button, and Campaign Disconnect */}
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {selectedConversation.customerName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-sm font-semibold">{selectedConversation.customerName}</h3>
                  <div className="flex items-center gap-2">
                    {selectedConversation.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] h-4">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Take Over: Human agent takes control from AI when conversation is automated */}
                {selectedConversation.agentName && selectedConversation.status === 'automated' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    data-testid="button-take-over"
                  >
                    Take Over
                  </Button>
                )}
                {/* Campaign disconnect: Stops all future campaign messages for this customer */}
                {selectedConversation.campaignId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'h-7 text-xs gap-1',
                      selectedConversation.campaignDisconnected ? 'text-muted-foreground' : 'text-destructive border-destructive/30'
                    )}
                    data-testid="button-disconnect-campaign"
                  >
                    <Ban className="h-3 w-3" />
                    {selectedConversation.campaignDisconnected ? 'Disconnected' : 'Disconnect Campaign'}
                  </Button>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="flex flex-col gap-3 max-w-2xl mx-auto">
                {selectedConversation.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-2',
                      msg.senderType === 'customer' ? 'justify-start' : 'justify-end'
                    )}
                  >
                    {/* Message bubble: customer=bg-muted, bot=primary/10 with border, agent=bg-primary */}
                    <div className={cn(
                      'max-w-[75%] rounded-xl px-3 py-2',
                      msg.senderType === 'customer'
                        ? 'bg-muted text-foreground rounded-bl-sm'
                        : msg.senderType === 'bot'
                          ? 'bg-primary/10 text-foreground rounded-br-sm border border-primary/20'
                          : 'bg-primary text-primary-foreground rounded-br-sm'
                    )}>
                      <p className="text-[10px] font-medium mb-0.5 opacity-70">{msg.senderName}</p>
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-[10px] mt-1 opacity-50">
                        {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-border p-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="min-h-[60px] max-h-[120px] text-sm resize-none"
                    data-testid="input-reply"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-attach">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button size="icon" className="h-8 w-8" disabled={!replyText.trim()} data-testid="button-send-reply">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Select a conversation to view</p>
          </div>
        )}
      </div>

      {/* Column 4: Customer info panel — hidden on screens < xl */}
      {selectedConversation && (
        <div className="w-64 border-l border-border flex-shrink-0 hidden xl:flex flex-col">
          <div className="p-3 border-b border-border">
            <h4 className="text-sm font-semibold">Customer Info</h4>
          </div>
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Name</p>
                <p className="text-sm font-medium">{selectedConversation.customerName}</p>
              </div>
              {selectedConversation.customerEmail && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm">{selectedConversation.customerEmail}</p>
                </div>
              )}
              {selectedConversation.customerPhone && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <p className="text-sm">{selectedConversation.customerPhone}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Channel</p>
                <Badge variant="outline" className="text-xs">{selectedConversation.channel.toUpperCase()}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant="secondary" className="text-xs">{conversationStatusLabels[selectedConversation.status]}</Badge>
              </div>
              {selectedConversation.agentName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Handled by</p>
                  <p className="text-sm">{selectedConversation.agentName}</p>
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
              {selectedConversation.tags.length > 0 && (
                <div className="border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedConversation.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
