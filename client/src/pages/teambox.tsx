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
import { Search, Filter, MessageSquare, Phone, Mail, Send, Ban, Smartphone, Bot, Loader2, AlertTriangle, CheckSquare, MailX, ChevronRight, Clock, UserCheck, Video, ExternalLink, FileText } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Conversation, Message, Task, User } from '@shared/schema';

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

type TaskType = 'task' | 'escalation' | 'unsent_message';
type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

const taskTypeConfig: Record<TaskType, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  task: { label: 'Task', icon: CheckSquare, color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-900/50', border: 'border-slate-200 dark:border-slate-700' },
  escalation: { label: 'Escalation', icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/50', border: 'border-orange-200 dark:border-orange-800' },
  unsent_message: { label: 'Unsent Message', icon: MailX, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/50', border: 'border-red-200 dark:border-red-800' },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/60', dot: 'bg-red-500' },
  high: { label: 'High', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/60', dot: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-900/60', dot: 'bg-yellow-500' },
  low: { label: 'Low', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/60', dot: 'bg-green-500' },
};

const taskTypeFilters: { id: TaskType | 'all'; label: string }[] = [
  { id: 'all', label: 'All Items' },
  { id: 'task', label: 'Tasks' },
  { id: 'escalation', label: 'Escalations' },
  { id: 'unsent_message', label: 'Unsent Messages' },
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

function TaskListSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-3 border-b border-border">
          <div className="flex items-start gap-2">
            <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-14" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TeamboxPage() {
  const { agents, currentOrganization, currentUser } = useApp();
  const orgId = currentOrganization?.id;
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'conversations' | 'tasks' | 'workflows'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'tasks' ? 'tasks' : 'conversations';
  });
  const [activeView, setActiveView] = useState<'conversations' | 'phone' | 'video'>('conversations');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState<ConversationStatus | 'all'>('all');
  const [activeChannel, setActiveChannel] = useState<ConversationChannel | 'all'>(() => {
    const params = new URLSearchParams(window.location.search);
    const ch = params.get('channel');
    if (ch && ['sms', 'email', 'voice', 'video', 'chat'].includes(ch)) {
      return ch as ConversationChannel;
    }
    return 'all';
  });
  const [activeTaskType, setActiveTaskType] = useState<TaskType | 'all'>('all');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [transcriptModal, setTranscriptModal] = useState<{ open: boolean; transcript: string; audioUrl?: string; callerNumber?: string }>({ open: false, transcript: '' });
  const scrollRef = useRef<HTMLDivElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations', orgId],
    refetchInterval: 5000,
  });

  const { data: allTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks', orgId],
  });

  const { data: vapiCalls = [], isLoading: vapiLoading } = useQuery<any[]>({
    queryKey: ['/api/vapi/calls'],
    enabled: activeView === 'phone',
  });

  const { data: tavusConversations = [], isLoading: tavusLoading } = useQuery<any[]>({
    queryKey: ['/api/tavus/conversations'],
    enabled: activeView === 'video',
  });

  const filteredTasks = allTasks.filter(t => {
    if (activeTaskType !== 'all' && t.type !== activeTaskType) return false;
    if (searchTerm && !t.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const selectedTask = allTasks.find(t => t.id === selectedTaskId) || null;

  const getTaskTypeCount = (type: TaskType | 'all') => {
    if (type === 'all') return allTasks.length;
    return allTasks.filter(t => t.type === type).length;
  };

  const updateTaskMutation = useMutation({
    mutationFn: async (data: { id: string; status: string }) => {
      return apiRequest('PATCH', `/api/tasks/${data.id}`, { status: data.status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: 'Task updated' });
    },
  });

  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/conversations', selectedConversationId, 'messages'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/conversations/${selectedConversationId}/messages`);
      return res.json();
    },
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
        assignedTo: currentUser.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({ title: 'Conversation taken over', description: 'AI responses paused. You are now handling this conversation.' });
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

  const { data: teamMembers = [] } = useQuery<User[]>({
    queryKey: ['/api/users', orgId],
  });

  const assignMutation = useMutation({
    mutationFn: async ({ conversationId, userId }: { conversationId: string; userId: string | null }) => {
      return apiRequest('PATCH', `/api/conversations/${conversationId}`, {
        assignedTo: userId,
        status: userId ? 'assigned' : 'open',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({ title: 'Conversation assigned' });
    },
  });

  const handleCallCustomer = () => {
    if (!selectedConversation?.customerPhone) {
      toast({ title: 'No phone number available', description: 'This customer does not have a phone number on file.' });
      return;
    }
    window.open(`tel:${selectedConversation.customerPhone}`, '_self');
  };

  const handleEmailCustomer = () => {
    if (!selectedConversation?.customerEmail) {
      toast({ title: 'No email available', description: 'This customer does not have an email address on file.' });
      return;
    }
    window.open(`mailto:${selectedConversation.customerEmail}`, '_self');
  };

  const handleSmsCustomer = () => {
    setReplyText('[SMS] ');
    setTimeout(() => {
      replyTextareaRef.current?.focus();
    }, 100);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedConversationId) return;
    sendReplyMutation.mutate({
      conversationId: selectedConversationId,
      content: replyText.trim(),
      senderName: currentUser?.name || 'Agent',
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
    <>
    <div className="flex flex-col h-full overflow-hidden" data-testid="teambox-page">
      {/* S-2.1: Top horizontal menu bar */}
      <div className="border-b border-border px-6 pt-4 flex-shrink-0" data-testid="teambox-top-menu">
        <h1 className="text-xl font-semibold mb-3">TeamBox</h1>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveView('conversations')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-md transition-colors border-b-2',
              activeView === 'conversations'
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            data-testid="tab-teambox-conversations"
          >
            <MessageSquare className="h-4 w-4" />
            Conversations
          </button>
          <button
            onClick={() => setActiveView('phone')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-md transition-colors border-b-2',
              activeView === 'phone'
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            data-testid="tab-teambox-phone"
          >
            <Phone className="h-4 w-4" />
            Phone
          </button>
          <button
            onClick={() => setActiveView('video')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-md transition-colors border-b-2',
              activeView === 'video'
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
            data-testid="tab-teambox-video"
          >
            <Video className="h-4 w-4" />
            Video
          </button>
        </div>
        {/* Channel filter chips — visible in conversations view */}
        {activeView === 'conversations' && (
          <div className="flex gap-1 mt-2 pb-2" data-testid="channel-filter-bar">
            {channelFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveChannel(filter.id)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-full transition-colors border',
                  activeChannel === filter.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-accent'
                )}
                data-testid={`channel-chip-${filter.id}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* S-2.3: Phone tab content */}
      {activeView === 'phone' && (
        <div className="flex-1 overflow-auto p-6" data-testid="phone-tab-content">
          <h2 className="text-lg font-semibold mb-4">VAPI Call Logs</h2>
          {vapiLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : vapiCalls.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">No call logs found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="phone-calls-table">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">Date</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">Caller Number</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">Assistant</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">Duration</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {vapiCalls.map((call: any, idx: number) => (
                    <tr key={call.id || idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-2 px-3 text-xs">
                        {call.createdAt ? new Date(call.createdAt).toLocaleString() : call.startedAt ? new Date(call.startedAt).toLocaleString() : '-'}
                      </td>
                      <td className="py-2 px-3 text-xs font-mono">{call.customer?.number || call.phoneNumber || '-'}</td>
                      <td className="py-2 px-3 text-xs">{call.assistant?.name || call.assistantId || '-'}</td>
                      <td className="py-2 px-3 text-xs">
                        {call.endedAt && call.startedAt
                          ? `${Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)}s`
                          : call.duration ? `${call.duration}s` : '-'}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="secondary" className="text-[10px]">{call.status || '-'}</Badge>
                      </td>
                      <td className="py-2 px-3">
                        {call.transcript && (
                          <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => setTranscriptModal({
                            open: true,
                            transcript: typeof call.transcript === 'string' ? call.transcript : JSON.stringify(call.transcript),
                            audioUrl: call.recordingUrl || call.recording_url,
                            callerNumber: call.customer?.number || call.phoneNumber,
                          })}>
                            <FileText className="h-3 w-3" />
                            Transcript
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* S-2.4: Video tab content */}
      {activeView === 'video' && (
        <div className="flex-1 overflow-auto p-6" data-testid="video-tab-content">
          <h2 className="text-lg font-semibold mb-4">Tavus Video Sessions</h2>
          {tavusLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tavusConversations.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">No video sessions found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="video-sessions-table">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">Date</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">Visitor</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">Persona</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">Duration</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="py-2 px-3 text-xs font-semibold text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {tavusConversations.map((session: any, idx: number) => (
                    <tr key={session.id || session.conversation_id || idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-2 px-3 text-xs">
                        {session.created_at ? new Date(session.created_at).toLocaleString() : session.createdAt ? new Date(session.createdAt).toLocaleString() : '-'}
                      </td>
                      <td className="py-2 px-3 text-xs">{session.visitor_name || session.visitorName || '-'}</td>
                      <td className="py-2 px-3 text-xs">{session.persona_name || session.personaName || session.replica_id || '-'}</td>
                      <td className="py-2 px-3 text-xs">
                        {session.ended_at && session.created_at
                          ? `${Math.round((new Date(session.ended_at).getTime() - new Date(session.created_at).getTime()) / 1000)}s`
                          : session.duration ? `${session.duration}s` : '-'}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="secondary" className="text-[10px]">{session.status || '-'}</Badge>
                      </td>
                      <td className="py-2 px-3">
                        {(session.recording_url || session.recordingUrl) && (
                          <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" asChild>
                            <a href={session.recording_url || session.recordingUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                              Recording
                            </a>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Conversations view (original 4-column layout) */}
      {activeView === 'conversations' && <div className="flex flex-1 overflow-hidden">
      <div className="w-64 border-r border-border flex flex-col bg-muted/30 flex-shrink-0 hidden lg:flex">
        <div className="p-2 border-b border-border">
          <div className="flex rounded-md bg-muted p-0.5 mb-2">
            <button
              onClick={() => setViewMode('conversations')}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-sm transition-colors font-medium',
                viewMode === 'conversations' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              data-testid="tab-conversations"
            >
              Conversations
            </button>
            <button
              onClick={() => setViewMode('tasks')}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-sm transition-colors font-medium',
                viewMode === 'tasks' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              data-testid="tab-tasks"
            >
              Tasks
              {allTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 min-w-4 text-[10px] px-1">{allTasks.length}</Badge>
              )}
            </button>
            <button
              onClick={() => setViewMode('workflows')}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-sm transition-colors font-medium',
                viewMode === 'workflows' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              data-testid="tab-workflows"
            >
              Workflows
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={viewMode === 'conversations' ? 'Search conversations...' : viewMode === 'tasks' ? 'Search tasks...' : 'Search workflows...'}
              className="h-8 pl-8 text-xs"
              data-testid="input-teambox-search"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {viewMode === 'conversations' ? (
            <>
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
            </>
          ) : viewMode === 'tasks' ? (
            <div className="p-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Type</p>
              {taskTypeFilters.map(filter => {
                const count = getTaskTypeCount(filter.id);
                const cfg = filter.id !== 'all' ? taskTypeConfig[filter.id] : null;
                const Icon = cfg?.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveTaskType(filter.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors',
                      activeTaskType === filter.id ? 'bg-accent text-foreground font-medium' : 'text-muted-foreground hover:bg-accent/50'
                    )}
                    data-testid={`filter-task-type-${filter.id}`}
                  >
                    <span className="flex items-center gap-1.5">
                      {Icon && <Icon className={cn('h-3 w-3', cfg?.color)} />}
                      {filter.label}
                    </span>
                    {count > 0 && <Badge variant="secondary" className="h-5 min-w-5 text-[10px]">{count}</Badge>}
                  </button>
                );
              })}

              <div className="mt-3 border-t border-border pt-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Priority</p>
                {(['critical', 'high', 'medium', 'low'] as TaskPriority[]).map(p => {
                  const cfg = priorityConfig[p];
                  const count = allTasks.filter(t => t.priority === p).length;
                  return (
                    <div key={p} className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                        {cfg.label}
                      </span>
                      <span>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Workflows</p>
              <div className="p-6 text-center text-sm text-muted-foreground">
                Workflow automation coming soon
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="w-72 xl:w-80 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {viewMode === 'conversations'
                ? (activeStatus === 'all' ? 'All' : conversationStatusLabels[activeStatus as ConversationStatus])
                : (activeTaskType === 'all' ? 'All Items' : taskTypeFilters.find(f => f.id === activeTaskType)?.label || 'All')}
            </span>
          </div>
          <Badge variant="secondary" className="text-xs" data-testid="badge-list-count">
            {viewMode === 'conversations' ? filteredConversations.length : filteredTasks.length}
          </Badge>
        </div>

        <ScrollArea className="flex-1">
          {viewMode === 'conversations' ? (
            <>
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
            </>
          ) : (
            <>
              {tasksLoading ? (
                <TaskListSkeleton />
              ) : (
                <div className="flex flex-col">
                  {filteredTasks.map(task => {
                    const typeCfg = taskTypeConfig[(task.type as TaskType) || 'task'] || taskTypeConfig.task;
                    const priCfg = priorityConfig[(task.priority as TaskPriority) || 'medium'] || priorityConfig.medium;
                    const TypeIcon = typeCfg.icon;
                    const isSelected = selectedTaskId === task.id;
                    return (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={cn(
                          'w-full text-left p-3 border-b border-border transition-colors',
                          isSelected ? 'bg-accent' : 'hover:bg-accent/50'
                        )}
                        data-testid={`task-item-${task.id}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={cn('flex-shrink-0 mt-0.5 h-8 w-8 rounded flex items-center justify-center border', typeCfg.bg, typeCfg.border)}>
                            <TypeIcon className={cn('h-4 w-4', typeCfg.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-sm font-medium truncate">{task.title}</span>
                              <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
                            )}
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge variant="outline" className={cn('h-4 text-[10px] px-1 border', typeCfg.border, typeCfg.color)}>
                                {typeCfg.label}
                              </Badge>
                              <Badge variant="outline" className={cn('h-4 text-[10px] px-1 gap-0.5', priCfg.color)}>
                                <span className={cn('h-1.5 w-1.5 rounded-full', priCfg.dot)} />
                                {priCfg.label}
                              </Badge>
                              {task.createdAt && (
                                <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {formatDistanceToNow(new Date(task.createdAt), { addSuffix: false })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {filteredTasks.length === 0 && !tasksLoading && (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No tasks found
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {viewMode === 'conversations' && selectedConversation ? (
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
                    ref={replyTextareaRef}
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
        ) : viewMode === 'tasks' && selectedTask ? (
          <>
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const typeCfg = taskTypeConfig[(selectedTask.type as TaskType) || 'task'] || taskTypeConfig.task;
                  const TypeIcon = typeCfg.icon;
                  return (
                    <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center border', typeCfg.bg, typeCfg.border)}>
                      <TypeIcon className={cn('h-5 w-5', typeCfg.color)} />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-sm font-semibold" data-testid="text-task-title">{selectedTask.title}</h3>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const typeCfg = taskTypeConfig[(selectedTask.type as TaskType) || 'task'] || taskTypeConfig.task;
                      const priCfg = priorityConfig[(selectedTask.priority as TaskPriority) || 'medium'] || priorityConfig.medium;
                      return (
                        <>
                          <Badge variant="outline" className={cn('text-[10px] h-4 px-1 border', typeCfg.border, typeCfg.color)} data-testid="badge-task-type">
                            {typeCfg.label}
                          </Badge>
                          <Badge variant="outline" className={cn('text-[10px] h-4 px-1 gap-0.5', priCfg.color)} data-testid="badge-task-priority">
                            <span className={cn('h-1.5 w-1.5 rounded-full', priCfg.dot)} />
                            {priCfg.label}
                          </Badge>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {selectedTask.status === 'todo' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => updateTaskMutation.mutate({ id: selectedTask.id, status: 'in-progress' })}
                    disabled={updateTaskMutation.isPending}
                    data-testid="button-task-start"
                  >
                    Start
                  </Button>
                )}
                {selectedTask.status === 'in-progress' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => updateTaskMutation.mutate({ id: selectedTask.id, status: 'done' })}
                    disabled={updateTaskMutation.isPending}
                    data-testid="button-task-resolve"
                  >
                    Resolve
                  </Button>
                )}
                {selectedTask.status === 'done' && (
                  <Badge variant="secondary" className="text-xs">Resolved</Badge>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-sm whitespace-pre-wrap" data-testid="text-task-description">
                    {selectedTask.description || 'No description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge variant="secondary" className="text-xs" data-testid="badge-task-status">{selectedTask.status}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Created</p>
                    <p className="text-sm" data-testid="text-task-created">
                      {selectedTask.createdAt ? formatDistanceToNow(new Date(selectedTask.createdAt), { addSuffix: true }) : 'Unknown'}
                    </p>
                  </div>
                </div>

                {selectedTask.tags && selectedTask.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedTask.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]" data-testid={`badge-task-tag-${i}`}>{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.metadata && (() => {
                  try {
                    const meta = JSON.parse(selectedTask.metadata);
                    return (
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Metadata</h4>
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                          <pre className="text-xs font-mono whitespace-pre-wrap break-words" data-testid="text-task-metadata">
                            {JSON.stringify(meta, null, 2)}
                          </pre>
                        </div>
                      </div>
                    );
                  } catch {
                    return null;
                  }
                })()}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            {(viewMode === 'conversations' && conversationsLoading) || (viewMode === 'tasks' && tasksLoading) ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <p className="text-sm">
                {viewMode === 'conversations' ? 'Select a conversation to view' : 'Select a task to view details'}
              </p>
            )}
          </div>
        )}
      </div>

      {viewMode === 'conversations' && selectedConversation && (
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
              <div>
                <p className="text-xs text-muted-foreground mb-1">Assign to</p>
                <Select
                  value={selectedConversation.assignedTo || 'unassigned'}
                  onValueChange={(value) => {
                    if (!selectedConversationId) return;
                    assignMutation.mutate({
                      conversationId: selectedConversationId,
                      userId: value === 'unassigned' ? null : value,
                    });
                  }}
                  disabled={assignMutation.isPending}
                >
                  <SelectTrigger className="h-8 text-xs" data-testid="select-assign-to">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-2">Quick Actions</p>
                <div className="flex flex-col gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs justify-start gap-2" onClick={handleCallCustomer} data-testid="button-call-customer">
                    <Phone className="h-3 w-3" /> Call
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs justify-start gap-2" onClick={handleEmailCustomer} data-testid="button-email-customer">
                    <Mail className="h-3 w-3" /> Email
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs justify-start gap-2" onClick={handleSmsCustomer} data-testid="button-sms-customer">
                    <Smartphone className="h-3 w-3" /> SMS
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>}
    </div>

      <Dialog open={transcriptModal.open} onOpenChange={(open) => setTranscriptModal(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Call Transcript
              {transcriptModal.callerNumber && (
                <Badge variant="secondary" className="text-xs ml-2">{transcriptModal.callerNumber}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="text-sm whitespace-pre-wrap leading-relaxed p-1">
              {transcriptModal.transcript || 'No transcript available'}
            </div>
          </ScrollArea>
          {transcriptModal.audioUrl && (
            <div className="pt-2 border-t">
              <a
                href={transcriptModal.audioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Listen to Recording
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
