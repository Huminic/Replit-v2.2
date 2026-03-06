import { useState } from 'react';
import { useLocation } from 'wouter';
import { User, LayoutDashboard, CheckSquare, MessageSquare, ExternalLink, Clock, AlertCircle, CheckCircle, TrendingUp, Plus, Trash2, Edit2, Loader2, Mail, MessageCircle, Phone, Smartphone, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/contexts/AppContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@shared/schema';
import { mockConversations } from '@/mocks/messages';
import { mockTeamboxConversations } from '@/mocks/conversations';
import type { ConversationChannel } from '@/mocks/conversations';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'assistant', label: 'Assistant', icon: User },
];

const statusColors: Record<string, string> = {
  overdue: 'text-red-500',
  todo: 'text-amber-500',
  in_progress: 'text-blue-500',
  review: 'text-purple-500',
  done: 'text-green-500',
};

const statusIcons: Record<string, React.ElementType> = {
  overdue: AlertCircle,
  todo: Clock,
  in_progress: Clock,
  review: Clock,
  done: CheckCircle,
};

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

function getDisplayStatus(task: Task): string {
  if (task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date()) {
    return 'overdue';
  }
  return task.status;
}

const emptyFormState = {
  title: '',
  description: '',
  priority: 'medium' as string,
  status: 'todo' as string,
  dueDate: '',
};

const channelIcons: Record<ConversationChannel, React.ElementType> = {
  sms: Smartphone,
  email: Mail,
  chat: MessageCircle,
  whatsapp: Phone,
  voice: Phone,
};

export default function MyWorkPage() {
  const { currentUser, personaName } = useApp();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formState, setFormState] = useState(emptyFormState);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest('POST', '/api/tasks', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: 'Task created' });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to create task', description: err.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await apiRequest('PATCH', `/api/tasks/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: 'Task updated' });
      closeDialog();
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to update task', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: 'Task deleted' });
    },
    onError: (err: Error) => {
      toast({ title: 'Failed to delete task', description: err.message, variant: 'destructive' });
    },
  });

  const openCreateDialog = () => {
    setEditingTask(null);
    setFormState(emptyFormState);
    setDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormState({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTask(null);
    setFormState(emptyFormState);
  };

  const handleSubmit = () => {
    if (!formState.title.trim()) return;
    const payload: Record<string, unknown> = {
      title: formState.title,
      description: formState.description || null,
      priority: formState.priority,
      status: formState.status,
      dueDate: formState.dueDate ? new Date(formState.dueDate).toISOString() : null,
    };
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleComplete = (task: Task) => {
    updateMutation.mutate({ id: task.id, data: { status: 'done' } });
  };

  const handleDelete = (task: Task) => {
    deleteMutation.mutate(task.id);
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const tasksDueToday = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) >= today && new Date(t.dueDate) <= endOfToday).length;
  const overdueItems = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < today).length;
  const activeTasks = tasks.filter(t => t.status !== 'done').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;

  const renderLoadingSkeleton = () => (
    <div className="p-6 space-y-4">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );

  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1" data-testid="text-greeting">Good morning, {currentUser.name.split(' ')[0]}</h2>
        <p className="text-sm text-muted-foreground">Here's your day at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tasks Due Today', value: isLoading ? '-' : String(tasksDueToday), icon: CheckSquare, color: 'text-blue-500' },
          { label: 'Overdue Items', value: isLoading ? '-' : String(overdueItems), icon: AlertCircle, color: 'text-red-500' },
          { label: 'Active Tasks', value: isLoading ? '-' : String(activeTasks), icon: MessageSquare, color: 'text-purple-500' },
          { label: 'Completed', value: isLoading ? '-' : String(completedTasks), icon: TrendingUp, color: 'text-green-500' },
        ].map(metric => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold mt-1" data-testid={`metric-${metric.label.toLowerCase().replace(/\s/g, '-')}`}>{metric.value}</p>
                </div>
                <metric.icon className={cn('h-8 w-8', metric.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Upcoming Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? renderLoadingSkeleton() : (
            <div className="space-y-2">
              {tasks.filter(t => t.status !== 'done').slice(0, 5).map(task => {
                const display = getDisplayStatus(task);
                const StatusIcon = statusIcons[display] || Clock;
                return (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-md hover-elevate" data-testid={`task-item-${task.id}`}>
                    <StatusIcon className={cn('h-4 w-4 flex-shrink-0', statusColors[display])} />
                    <span className="text-sm flex-1 truncate">{task.title}</span>
                    <Badge variant={task.priority === 'high' || task.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-[10px] h-5">
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}</span>
                  </div>
                );
              })}
              {tasks.filter(t => t.status !== 'done').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming tasks</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderTasks = () => (
    <div className="p-6">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <h2 className="text-lg font-semibold">My Tasks</h2>
        <Button size="sm" onClick={openCreateDialog} data-testid="button-add-task">
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>
      {isLoading ? renderLoadingSkeleton() : (
        <div className="space-y-2">
          {tasks.map(task => {
            const display = getDisplayStatus(task);
            const StatusIcon = statusIcons[display] || Clock;
            return (
              <div key={task.id} className="flex items-center gap-3 p-3 border border-border rounded-md hover-elevate" data-testid={`task-row-${task.id}`}>
                <StatusIcon className={cn('h-4 w-4 flex-shrink-0', statusColors[display])} />
                <span className="text-sm flex-1">{task.title}</span>
                <Badge variant={display === 'overdue' ? 'destructive' : 'secondary'} className="text-[10px]">
                  {display === 'overdue' ? 'overdue' : statusLabels[task.status] || task.status}
                </Badge>
                <Badge variant={task.priority === 'high' || task.priority === 'urgent' ? 'destructive' : 'outline'} className="text-[10px]">
                  {task.priority}
                </Badge>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}</span>
                <div className="flex items-center gap-1">
                  {task.status !== 'done' && (
                    <Button size="icon" variant="ghost" onClick={() => handleComplete(task)} data-testid={`button-complete-task-${task.id}`}>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(task)} data-testid={`button-edit-task-${task.id}`}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(task)} data-testid={`button-delete-task-${task.id}`}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            );
          })}
          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks yet. Click "Add Task" to create one.</p>
          )}
        </div>
      )}
    </div>
  );

  const renderChat = () => {
    const recentConversations = mockTeamboxConversations
      .filter(c => c.status !== 'closed')
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

    const aiConversations = mockConversations;

    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-1">Recent Conversations</h2>
          <p className="text-sm text-muted-foreground">Your active customer conversations and AI chat history</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Customer Conversations</h3>
          <div className="space-y-2">
            {recentConversations.slice(0, 5).map(conv => {
              const ChannelIcon = channelIcons[conv.channel] || MessageSquare;
              return (
                <div
                  key={conv.id}
                  className="flex items-center gap-3 p-3 border border-border rounded-md cursor-pointer hover-elevate"
                  onClick={() => setLocation('/teambox')}
                  data-testid={`chat-conversation-${conv.id}`}
                >
                  <ChannelIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{conv.customerName}</span>
                      <Badge variant="outline" className="text-[10px]">{conv.channel.toUpperCase()}</Badge>
                      {conv.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-[10px]">{conv.unreadCount}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(conv.lastMessageTime).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">AI Chat History</h3>
          <div className="space-y-2">
            {aiConversations.map(conv => (
              <div
                key={conv.id}
                className="flex items-center gap-3 p-3 border border-border rounded-md cursor-pointer hover-elevate"
                onClick={() => setLocation('/')}
                data-testid={`chat-ai-conversation-${conv.id}`}
              >
                <Bot className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{conv.title}</span>
                    {conv.unread && (
                      <Badge variant="secondary" className="text-[10px]">New</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(conv.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => setLocation('/teambox')} data-testid="button-view-all-conversations">
            <ExternalLink className="h-4 w-4 mr-2" />
            View All in TeamBox
          </Button>
        </div>
      </div>
    );
  };

  const renderAssistant = () => (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <User className="h-12 w-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-medium">Personal Assistant</h3>
        <p className="text-sm text-muted-foreground max-w-sm">Your personal AI assistant powered by {personaName}. Ask questions, get insights, and manage your workflow.</p>
        <Button variant="outline" className="gap-2" onClick={() => setLocation('/')} data-testid="button-launch-assistant">
          <ExternalLink className="h-4 w-4" />
          Launch Assistant
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full" data-testid="my-work-page">
      <div className="border-b border-border px-6 pt-4">
        <h1 className="text-xl font-semibold mb-3">My Work</h1>
        <div className="flex gap-1 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-md transition-colors border-b-2',
                activeTab === tab.id
                  ? 'border-primary text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
              data-testid={`tab-mywork-${tab.id}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'tasks' && renderTasks()}
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'assistant' && renderAssistant()}
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={formState.title}
                onChange={e => setFormState(s => ({ ...s, title: e.target.value }))}
                placeholder="Task title"
                data-testid="input-task-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={formState.description}
                onChange={e => setFormState(s => ({ ...s, description: e.target.value }))}
                placeholder="Optional description"
                className="resize-none"
                data-testid="input-task-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formState.priority} onValueChange={v => setFormState(s => ({ ...s, priority: v }))}>
                  <SelectTrigger data-testid="select-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formState.status} onValueChange={v => setFormState(s => ({ ...s, status: v }))}>
                  <SelectTrigger data-testid="select-task-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due Date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={formState.dueDate}
                onChange={e => setFormState(s => ({ ...s, dueDate: e.target.value }))}
                data-testid="input-task-due-date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel-task">Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formState.title.trim() || isMutating} data-testid="button-submit-task">
              {isMutating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingTask ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
