/**
 * Agents Page — Agent detail view with direct chat interface.
 *
 * Cardinal rule: Chat in center → Agent configuration in right pane (AgentConfigPane).
 *
 * Layout:
 * - When no agent selected: Empty state with "Select an Agent" prompt and "Create New Agent" button.
 * - When agent selected (via selectedAgent from AppContext):
 *   - Header: Agent avatar, name, status badge, description, created/updated metadata, dropdown menu (edit/delete).
 *   - Center: Full chat interface with the selected agent. Uses wave-dot animation for typing indicator.
 *   - Bottom: Suggestion chips (quick prompts) + gradient-bordered chat input with send button.
 *   - Right pane: AgentConfigPane component (managed by AppLayout) for performance metrics,
 *     instructions, triggers, tools, skills, knowledge, and activity.
 *
 * Chat flow:
 * - handleAgentSend: Adds user message, shows typing indicator for 1.8s, then adds bot response.
 * - agentSuggestions: Pre-built prompts that populate the input on click.
 * - Enter key sends (Shift+Enter for newline).
 *
 * Chat connects to AI backend. Agent selection comes from SubMenuManager
 * sidebar navigation. The mock response is a placeholder.
 *
 * Related files:
 * - AgentConfigPane.tsx: Right pane configuration panel for selected agent
 * - AppContext.tsx: selectedAgent, setSelectedAgent
 * - @shared/schema: Agent type definition
 *
 * @see client/src/components/AgentConfigPane.tsx
 * @see client/src/components/layout/SubMenuManager.tsx — Agent list with conversation expand
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { 
  Bot, 
  Plus, 
  MoreVertical,
  Settings,
  Trash2,
  Send,
  Sparkles,
  ArrowLeft,
  Globe,
  Square,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EntitlementGate } from '@/components/EntitlementGate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApp } from '@/contexts/AppContext';
import { useUILayout } from '@/contexts/UILayoutContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { type Agent, type Conversation as DbConversation, type Message as DbMessage } from '@shared/schema';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { MarkdownMessage } from '@/components/MarkdownMessage';
import { formatDistanceToNow } from 'date-fns';
import { MobileNavDropdown } from '@/components/layout/MobileNavDropdown';
import { getAccessToken } from '@/lib/tokenStore';

interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const agentSuggestions = [
  "Show today's lead activity",
  "Draft a follow-up email",
  "Summarize pipeline status",
  "Schedule callbacks for hot leads",
];

export default function AgentsPage() {
  const [, setLocation] = useLocation();
  const { selectedAgent, setSelectedAgent, addAgent } = useApp();
  const { setRightPaneOpen } = useUILayout();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [agentMessages, setAgentMessages] = useState<AgentChatMessage[]>([]);
  const [agentInput, setAgentInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentDepartment, setNewAgentDepartment] = useState('sales');
  const [newAgentDescription, setNewAgentDescription] = useState('');
  const agentInputRef = useRef<HTMLTextAreaElement>(null);
  const agentScrollRef = useRef<HTMLDivElement>(null);

  const deleteMutation = useMutation({
    mutationFn: async (agentId: string) => {
      await apiRequest('DELETE', `/api/agents/${agentId}`);
    },
    onSuccess: () => {
      setSelectedAgent(null);
      setDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      toast({ title: 'Agent deleted', description: 'The agent has been permanently removed.' });
    },
    onError: () => {
      setDeleteDialogOpen(false);
      toast({ title: 'Delete failed', description: 'Could not delete this agent. You may not have permission.', variant: 'destructive' });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; department: string; description: string }) => {
      const res = await apiRequest('POST', '/api/agents', data);
      return res.json();
    },
    onSuccess: (newAgent: Agent) => {
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      addAgent(newAgent);
      setSelectedAgent(newAgent);
      setCreateDialogOpen(false);
      setNewAgentName('');
      setNewAgentDepartment('sales');
      setNewAgentDescription('');
      toast({ title: 'Agent created', description: `${newAgent.name} is now ready.` });
    },
    onError: () => {
      toast({ title: 'Creation failed', description: 'Could not create the agent. You may not have permission.', variant: 'destructive' });
    },
  });

  const handleEditAgent = () => {
    setRightPaneOpen(true);
  };

  const handleDeleteAgent = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAgent = () => {
    if (selectedAgent) {
      deleteMutation.mutate(selectedAgent.id);
    }
  };

  const handleCreateAgent = () => {
    if (!newAgentName.trim()) return;
    createMutation.mutate({
      name: newAgentName.trim(),
      department: newAgentDepartment,
      description: newAgentDescription.trim(),
    });
  };

  const openCreateDialog = () => {
    setNewAgentName('');
    setNewAgentDepartment('sales');
    setNewAgentDescription('');
    setCreateDialogOpen(true);
  };

  const agentChannel = selectedAgent ? `agent-chat-${selectedAgent.id}` : null;

  const { data: existingConversations } = useQuery<DbConversation[]>({
    queryKey: ['/api/conversations', { channel: agentChannel }],
    queryFn: async () => {
      const res = await fetch(`/api/conversations?channel=${agentChannel}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
    enabled: !!authUser && !!agentChannel,
  });

  const findOrCreateConversation = useCallback(async () => {
    if (!authUser || !selectedAgent || !agentChannel || initialized) return;

    const match = existingConversations?.find(
      (c) => c.customerEmail === authUser.email && c.channel === agentChannel
    );

    if (match) {
      setConversationId(match.id);
      setInitialized(true);
    } else if (existingConversations !== undefined) {
      try {
        const res = await apiRequest('POST', '/api/conversations', {
          customerName: `${authUser.firstName} ${authUser.lastName}`,
          customerEmail: authUser.email,
          channel: agentChannel,
          status: 'open',
          agentId: selectedAgent.id,
        });
        const newConv: DbConversation = await res.json();
        setConversationId(newConv.id);

        const greeting = `I'm ${selectedAgent.name}. ${selectedAgent.description || "How can I help you today?"}`;
        await apiRequest('POST', `/api/conversations/${newConv.id}/messages`, {
          role: 'assistant',
          content: greeting,
          senderName: selectedAgent.name,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/conversations', { channel: agentChannel }] });
        setInitialized(true);
      } catch (err) {
        console.error('Failed to create agent conversation:', err);
      }
    }
  }, [authUser, selectedAgent, agentChannel, existingConversations, initialized]);

  useEffect(() => {
    findOrCreateConversation();
  }, [findOrCreateConversation]);

  useEffect(() => {
    setConversationId(null);
    setInitialized(false);
    setAgentMessages([]);
  }, [selectedAgent?.id]);

  const { data: dbMessages } = useQuery<DbMessage[]>({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/conversations/${conversationId}/messages`);
      return res.json();
    },
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (dbMessages && dbMessages.length > 0) {
      const mapped: AgentChatMessage[] = dbMessages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
      setAgentMessages(mapped);
    }
  }, [dbMessages]);

  const { sendMessage: streamSend, abortStream, retry, isStreaming, streamingContent, statusMessage, error: streamError, lastFailedContent } = useStreamingChat({
    conversationId,
    agentId: selectedAgent?.id,
  });

  const lastAgentUserContent = agentMessages.filter(m => m.role === 'user').at(-1)?.content;
  const handleRegenerate = () => {
    if (lastAgentUserContent) streamSend(lastAgentUserContent);
  };

  const handleAgentSend = async () => {
    if (!agentInput.trim() || !conversationId) return;
    const content = agentInput.trim();
    const userMsg: AgentChatMessage = { id: `ac-${Date.now()}`, role: 'user', content };
    setAgentMessages(prev => [...prev, userMsg]);
    setAgentInput('');
    await streamSend(content);
  };

  const handleAgentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAgentSend();
    }
  };

  useEffect(() => {
    if (agentScrollRef.current) {
      const el = agentScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [agentMessages, isStreaming, streamingContent]);

  return (
    <div className="flex h-full overflow-hidden flex-col">
      {selectedAgent ? (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-lg">
                    <Bot className="h-7 w-7" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl font-bold text-foreground">{selectedAgent.name}</h1>
                    <Badge
                      variant={selectedAgent.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {selectedAgent.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{selectedAgent.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span>Created {formatDistanceToNow(new Date(selectedAgent.createdAt), { addSuffix: true })}</span>
                    <span>Updated {formatDistanceToNow(new Date(selectedAgent.updatedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="button-agent-menu">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEditAgent} data-testid="menu-edit-agent">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Agent
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={handleDeleteAgent} data-testid="menu-delete-agent">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Agent
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          <div className="px-6 py-3 lg:hidden">
            <MobileNavDropdown currentPath="/agents" currentLabel="Agents" />
          </div>

          <ScrollArea className="flex-1" ref={agentScrollRef}>
            <div className="p-4 md:p-6 flex flex-col gap-4 max-w-3xl mx-auto">
              {agentMessages.map((msg, idx) => {
                const isLastAssistant = msg.role === 'assistant' && idx === agentMessages.length - 1;
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3',
                      msg.role === 'assistant'
                        ? 'self-start bg-card border border-border text-foreground'
                        : 'self-end bg-primary text-primary-foreground'
                    )}
                    data-testid={`agent-message-${msg.id}`}
                  >
                    {msg.role === 'assistant' ? (
                      <MarkdownMessage
                        content={msg.content}
                        rawContent={msg.content}
                        isLastAssistant={isLastAssistant && !isStreaming}
                        onRegenerate={handleRegenerate}
                      />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                );
              })}
              {isStreaming && (
                <div className="self-start max-w-[80%] rounded-2xl px-4 py-3 bg-card border border-border text-foreground" data-testid="streaming-message">
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
              )}

              {streamError && !isStreaming && (
                <div className="self-start max-w-[80%] rounded-2xl px-4 py-3 bg-destructive/10 border border-destructive/30" data-testid="stream-error">
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
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-border p-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-wrap gap-2 mb-3">
                {agentSuggestions.map(s => (
                  <button
                    key={s}
                    className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                    onClick={() => { setAgentInput(s); }}
                    data-testid={`agent-suggestion-${s.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    {s}
                  </button>
                ))}
              </div>
              <div className="chat-input-gradient rounded-2xl p-[3px] shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <div className="bg-background rounded-[14px] flex items-end gap-2 p-3">
                  <Textarea
                    ref={agentInputRef}
                    value={agentInput}
                    onChange={e => setAgentInput(e.target.value)}
                    onKeyDown={handleAgentKeyDown}
                    placeholder="Ask me anything about your business"
                    className="resize-none min-h-[44px] max-h-[120px] text-sm border-0 shadow-none focus-visible:ring-0 p-0"
                    rows={1}
                    data-testid="input-agent-chat"
                  />
                  {isStreaming ? (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-9 w-9 flex-shrink-0 rounded-full"
                      onClick={abortStream}
                      data-testid="button-agent-stop"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      className="h-9 w-9 flex-shrink-0 rounded-full"
                      onClick={handleAgentSend}
                      disabled={!agentInput.trim()}
                      data-testid="button-agent-send"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6">
            <Bot className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Select an Agent</h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Choose an agent from the list to view its details, or create a new one to get started.
          </p>
          <EntitlementGate feature="agent_slots">
            <Button onClick={openCreateDialog} data-testid="button-create-agent-empty">
              <Plus className="h-4 w-4 mr-2" />
              Create New Agent
            </Button>
          </EntitlementGate>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-delete-agent-title">Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedAgent?.name}</strong>? This action cannot be undone and all associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAgent}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle data-testid="text-create-agent-title">Create New Agent</DialogTitle>
            <DialogDescription>
              Set up a new AI agent for your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agent-name">Name</Label>
              <Input
                id="agent-name"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="e.g. Sales Assistant"
                data-testid="input-new-agent-name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agent-department">Department</Label>
              <Select value={newAgentDepartment} onValueChange={setNewAgentDepartment}>
                <SelectTrigger data-testid="select-new-agent-department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agent-description">Description</Label>
              <Textarea
                id="agent-description"
                value={newAgentDescription}
                onChange={(e) => setNewAgentDescription(e.target.value)}
                placeholder="What does this agent do?"
                className="resize-none"
                rows={3}
                data-testid="input-new-agent-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} data-testid="button-cancel-create">
              Cancel
            </Button>
            <Button
              onClick={handleCreateAgent}
              disabled={!newAgentName.trim() || createMutation.isPending}
              data-testid="button-confirm-create"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
