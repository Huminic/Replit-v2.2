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
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { 
  mockTasks, 
  mockCalendarEvents, 
  mockHunches, 
  mockApprovals,
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
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Work Center</h1>
          <p className="text-sm text-muted-foreground">Manage your tasks, calendar, and approvals</p>
        </div>
        <Button size="sm" data-testid="button-add-task">
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 border-b border-border">
          <TabsList className="bg-transparent h-10 p-0 gap-4">
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

        <TabsContent value="calendar" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardContent className="p-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md"
                    />
                  </CardContent>
                </Card>
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-medium text-foreground">
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
                  </h3>
                  {todayEvents.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center">
                        <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">No events scheduled</p>
                      </CardContent>
                    </Card>
                  ) : (
                    todayEvents.map(event => (
                      <Card key={event.id} className="hover-elevate" data-testid={`event-${event.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="text-center">
                              <p className="text-lg font-bold text-primary">
                                {format(new Date(event.startTime), 'HH:mm')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(event.endTime), 'HH:mm')}
                              </p>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{event.title}</h4>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                              )}
                              {event.attendees && (
                                <div className="flex items-center gap-2 mt-2">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {event.attendees.join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary">{event.type}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="tasks" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {mockTasks.map(task => (
                <Card key={task.id} className="hover-elevate" data-testid={`task-${task.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                        task.status === 'done' ? 'bg-primary border-primary' : 'border-muted-foreground'
                      )}>
                        {task.status === 'done' && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={cn(
                            'font-medium',
                            task.status === 'done' ? 'text-muted-foreground line-through' : 'text-foreground'
                          )}>
                            {task.title}
                          </h4>
                          <Badge className={getTaskPriorityColor(task.priority)} variant="secondary">
                            {task.priority}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due {format(new Date(task.dueDate), 'MMM d')}
                          </div>
                          {task.assignee && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.assignee}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="hunches" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {mockHunches.map(hunch => (
                <Card key={hunch.id} className="hover-elevate" data-testid={`hunch-${hunch.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        hunch.confidence >= 80 ? 'bg-red-500/10' : hunch.confidence >= 60 ? 'bg-yellow-500/10' : 'bg-blue-500/10'
                      )}>
                        <Lightbulb className={cn(
                          'h-5 w-5',
                          hunch.confidence >= 80 ? 'text-red-500' : hunch.confidence >= 60 ? 'text-yellow-500' : 'text-blue-500'
                        )} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{hunch.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{hunch.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="secondary">{hunch.source}</Badge>
                          <span className="text-xs text-muted-foreground">
                            Confidence: {hunch.confidence}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" data-testid={`hunch-dismiss-${hunch.id}`}>
                          Dismiss
                        </Button>
                        <Button size="sm" data-testid={`hunch-act-${hunch.id}`}>
                          Take Action
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="approvals" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {pendingApprovals.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <ClipboardCheck className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No pending approvals</p>
                  </CardContent>
                </Card>
              ) : (
                pendingApprovals.map(approval => (
                  <Card key={approval.id} className="hover-elevate" data-testid={`approval-${approval.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{approval.requestedBy.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{approval.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{approval.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Requested by {approval.requestedBy}</span>
                            <span>•</span>
                            <span>{format(new Date(approval.requestedAt), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-destructive" data-testid={`approval-reject-${approval.id}`}>
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button size="sm" data-testid={`approval-approve-${approval.id}`}>
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
