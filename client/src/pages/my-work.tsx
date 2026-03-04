/**
 * @file my-work.tsx — Personal Productivity Dashboard
 * @description Individual user's personal workspace showing their own metrics, tasks,
 *   conversation history, and AI assistant link. This is a per-user view (not team-wide).
 *
 * @tabs
 *   - Dashboard: Personal KPIs (tasks due today, overdue items, active conversations, weekly completions)
 *   - Tasks: Full task list with priority/status indicators. Supports add task action.
 *   - Chat: Conversation history placeholder — will show personal chat threads
 *   - Assistant: NanoClaw AI personal assistant link — Wave 4 feature, currently placeholder
 *
 * @productionNote
 *   - personaName from AppContext powers the assistant section display name
 *   - mockMyTasks is placeholder data — will wire to backend task management API
 *   - currentUser from AppContext provides the greeting name on the dashboard tab
 */

import { useState } from 'react';
import { User, LayoutDashboard, CheckSquare, MessageSquare, ExternalLink, Clock, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';

/** Tab navigation config for the My Work page — each tab has an id, display label, and icon */
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'assistant', label: 'Assistant', icon: User },
];

/**
 * mockMyTasks — Placeholder task data for the personal task list.
 * PRODUCTION NOTE: Will wire to backend task management API.
 * Each task has an id, title, status (overdue/in_progress/pending/completed), priority, and dueDate.
 */
const mockMyTasks = [
  { id: 't1', title: 'Follow up with Michael Clark', status: 'overdue', priority: 'high', dueDate: '2026-02-19' },
  { id: 't2', title: 'Complete sales report for February', status: 'in_progress', priority: 'medium', dueDate: '2026-02-21' },
  { id: 't3', title: 'Review lead qualification criteria', status: 'pending', priority: 'low', dueDate: '2026-02-25' },
  { id: 't4', title: 'Respond to service inquiry - Joshua T.', status: 'in_progress', priority: 'high', dueDate: '2026-02-20' },
  { id: 't5', title: 'Update CRM contact records', status: 'pending', priority: 'medium', dueDate: '2026-02-28' },
  { id: 't6', title: 'Prepare weekly team standup notes', status: 'completed', priority: 'low', dueDate: '2026-02-18' },
];

/** Color mapping for task status indicators */
const statusColors: Record<string, string> = {
  overdue: 'text-red-500',
  in_progress: 'text-blue-500',
  pending: 'text-amber-500',
  completed: 'text-green-500',
};

/** Icon mapping for task status — AlertCircle for overdue, Clock for pending/in_progress, CheckCircle for completed */
const statusIcons: Record<string, React.ElementType> = {
  overdue: AlertCircle,
  in_progress: Clock,
  pending: Clock,
  completed: CheckCircle,
};

/**
 * MyWorkPage — Personal workspace component.
 * Uses currentUser from AppContext for greeting, personaName for the Assistant tab.
 */
export default function MyWorkPage() {
  const { currentUser, personaName } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dashboard tab: Personal KPI cards + upcoming tasks list
  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1" data-testid="text-greeting">Good morning, {currentUser.name.split(' ')[0]}</h2>
        <p className="text-sm text-muted-foreground">Here's your day at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tasks Due Today', value: '3', icon: CheckSquare, color: 'text-blue-500' },
          { label: 'Overdue Items', value: '1', icon: AlertCircle, color: 'text-red-500' },
          { label: 'Conversations', value: '5', icon: MessageSquare, color: 'text-purple-500' },
          { label: 'Completed This Week', value: '12', icon: TrendingUp, color: 'text-green-500' },
        ].map(metric => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
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
          <div className="space-y-2">
            {mockMyTasks.filter(t => t.status !== 'completed').slice(0, 5).map(task => {
              const StatusIcon = statusIcons[task.status];
              return (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors" data-testid={`task-item-${task.id}`}>
                  <StatusIcon className={cn('h-4 w-4 flex-shrink-0', statusColors[task.status])} />
                  <span className="text-sm flex-1 truncate">{task.title}</span>
                  <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px] h-5">
                    {task.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{task.dueDate}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Tasks tab: Full task list with status/priority badges and due dates
  const renderTasks = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">My Tasks</h2>
        <Button size="sm" data-testid="button-add-task">Add Task</Button>
      </div>
      <div className="space-y-2">
        {mockMyTasks.map(task => {
          const StatusIcon = statusIcons[task.status];
          return (
            <div key={task.id} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors" data-testid={`task-row-${task.id}`}>
              <StatusIcon className={cn('h-4 w-4 flex-shrink-0', statusColors[task.status])} />
              <span className="text-sm flex-1">{task.title}</span>
              <Badge variant={task.status === 'overdue' ? 'destructive' : 'secondary'} className="text-[10px]">
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'} className="text-[10px]">
                {task.priority}
              </Badge>
              <span className="text-xs text-muted-foreground">{task.dueDate}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Chat tab: Placeholder for personal conversation history — will show user's chat threads
  const renderChat = () => (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-medium">My Conversations</h3>
        <p className="text-sm text-muted-foreground max-w-sm">View your personal conversation history and continue where you left off.</p>
      </div>
    </div>
  );

  // Assistant tab: NanoClaw AI personal assistant — Wave 4 feature, currently shows placeholder with launch button
  const renderAssistant = () => (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <User className="h-12 w-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-medium">Personal Assistant</h3>
        <p className="text-sm text-muted-foreground max-w-sm">Your personal AI assistant powered by {personaName}. Coming soon.</p>
        <Button variant="outline" className="gap-2" data-testid="button-launch-assistant">
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
        <div className="flex gap-1">
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
    </div>
  );
}
