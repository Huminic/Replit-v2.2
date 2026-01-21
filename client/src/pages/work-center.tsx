import { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckSquare, 
  Lightbulb, 
  ClipboardCheck,
  Plus,
  Clock,
  User,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { 
  mockTasks, 
  mockCalendarEvents, 
  mockHunches, 
  mockApprovals,
  getTaskStatusColor,
  getTaskPriorityColor
} from '@/mocks/tasks';
import { format } from 'date-fns';

export default function WorkCenterPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const todayEvents = mockCalendarEvents.filter(event => {
    const eventDate = new Date(event.startTime).toDateString();
    const selected = selectedDate?.toDateString();
    return eventDate === selected;
  });

  const pendingApprovals = mockApprovals.filter(a => a.status === 'pending');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">Work Center</h1>
        <p className="text-sm text-muted-foreground">Manage your tasks, calendar, and approvals</p>
      </div>

      <Tabs defaultValue="calendar" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 border-b border-border">
          <TabsList className="bg-transparent h-12 p-0 gap-4">
            <TabsTrigger value="calendar" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2" data-testid="tab-wc-calendar">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2" data-testid="tab-wc-tasks">
              <CheckSquare className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="hunches" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2" data-testid="tab-wc-hunches">
              <Lightbulb className="h-4 w-4" />
              Hunches
            </TabsTrigger>
            <TabsTrigger value="approvals" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2 relative" data-testid="tab-wc-approvals">
              <ClipboardCheck className="h-4 w-4" />
              Approvals
              {pendingApprovals.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                  {pendingApprovals.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="flex-1 m-0 overflow-hidden">
          <div className="flex h-full">
            {/* Calendar Sidebar */}
            <div className="hidden md:flex flex-col w-80 border-r border-border p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
            </div>

            {/* Events */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Today'}
                  </h2>
                  <Button size="sm" data-testid="button-add-event">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Event
                  </Button>
                </div>

                {todayEvents.length > 0 ? (
                  <div className="space-y-3">
                    {todayEvents.map((event) => (
                      <Card key={event.id} className="hover-elevate" data-testid={`event-${event.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="text-center min-w-16">
                              <p className="text-sm font-medium text-foreground">
                                {format(new Date(event.startTime), 'h:mm a')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(event.endTime), 'h:mm a')}
                              </p>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-foreground">{event.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs capitalize">{event.type}</Badge>
                                {event.attendees.length > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {event.attendees.join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No events scheduled for this day</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
                <Button size="sm" data-testid="button-add-task">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
              </div>

              <div className="space-y-3">
                {mockTasks.map((task) => (
                  <Card key={task.id} className="hover-elevate" data-testid={`task-${task.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center',
                          task.status === 'done' 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-muted-foreground/30'
                        )}>
                          {task.status === 'done' && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className={cn(
                              'font-medium',
                              task.status === 'done' 
                                ? 'text-muted-foreground line-through' 
                                : 'text-foreground'
                            )}>
                              {task.title}
                            </h3>
                            <Badge className={cn('text-xs', getTaskPriorityColor(task.priority))}>
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <Badge variant="secondary" className={cn('text-xs', getTaskStatusColor(task.status))}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              {task.assignee}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Due {format(new Date(task.dueDate), 'MMM d')}
                            </div>
                          </div>
                          {task.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {task.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px]">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Hunches Tab */}
        <TabsContent value="hunches" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">AI Hunches</h2>
              <p className="text-sm text-muted-foreground">Insights and suggestions from your AI agents</p>

              <div className="space-y-3">
                {mockHunches.map((hunch) => (
                  <Card key={hunch.id} className="hover-elevate" data-testid={`hunch-${hunch.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                          <Lightbulb className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-foreground">{hunch.title}</h3>
                            <Badge variant="secondary" className="capitalize text-xs">
                              {hunch.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{hunch.description}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-xs text-muted-foreground">Source: {hunch.source}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Confidence:</span>
                              <Progress value={hunch.confidence} className="w-16 h-1.5" />
                              <span className="text-xs font-medium">{hunch.confidence}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Pending Approvals</h2>

              <div className="space-y-3">
                {mockApprovals.map((approval) => (
                  <Card key={approval.id} className="hover-elevate" data-testid={`approval-${approval.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                            approval.status === 'pending' && 'bg-amber-100 dark:bg-amber-900/30',
                            approval.status === 'approved' && 'bg-green-100 dark:bg-green-900/30',
                            approval.status === 'rejected' && 'bg-red-100 dark:bg-red-900/30'
                          )}>
                            {approval.status === 'pending' && <AlertCircle className="h-5 w-5 text-amber-600" />}
                            {approval.status === 'approved' && <Check className="h-5 w-5 text-green-600" />}
                            {approval.status === 'rejected' && <X className="h-5 w-5 text-red-600" />}
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{approval.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{approval.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[10px]">
                                    {approval.requestedBy.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">{approval.requestedBy}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs capitalize">{approval.type}</Badge>
                            </div>
                          </div>
                        </div>
                        {approval.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" data-testid={`reject-${approval.id}`}>
                              <X className="h-4 w-4" />
                            </Button>
                            <Button size="sm" data-testid={`approve-${approval.id}`}>
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
