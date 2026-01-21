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
  MessageSquare,
  Users,
  Phone,
  Mail,
  Voicemail,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  mockTasks, 
  mockCalendarEvents, 
  mockHunches, 
  mockApprovals,
  mockLeads,
  mockInboxMessages,
  getTaskPriorityColor,
  getLeadStatusColor
} from '@/mocks/tasks';
import { format, formatDistanceToNow } from 'date-fns';
import { FavoritesBar } from '@/components/layout/FavoritesBar';

export default function WorkCenterPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dialerOpen, setDialerOpen] = useState(false);
  const [dialerNumber, setDialerNumber] = useState('');
  const [selectedContact, setSelectedContact] = useState<{ name: string; phone: string } | null>(null);

  const todayEvents = mockCalendarEvents.filter(event => {
    const eventDate = new Date(event.startTime).toDateString();
    const selected = selectedDate?.toDateString();
    return eventDate === selected;
  });

  const pendingApprovals = mockApprovals.filter(a => a.status === 'pending');
  const unreadMessages = mockInboxMessages.filter(m => !m.read).length;

  const handleDialerInput = (digit: string) => {
    setDialerNumber(prev => prev + digit);
  };

  const handleCall = (contact?: { name: string; phone: string }) => {
    if (contact) {
      setSelectedContact(contact);
      setDialerNumber(contact.phone);
    }
    setDialerOpen(true);
  };

  const handleClearDialer = () => {
    setDialerNumber('');
    setSelectedContact(null);
  };

  const getMessageIcon = (type: 'email' | 'sms' | 'voicemail') => {
    switch (type) {
      case 'email': return Mail;
      case 'sms': return MessageCircle;
      case 'voicemail': return Voicemail;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Hub</h1>
          <p className="text-sm text-muted-foreground">Manage your tasks, calendar, and approvals</p>
        </div>
        <Button size="sm" data-testid="button-add-task">
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>

      <Tabs defaultValue="calendar" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 border-b border-border flex items-center">
          <TabsList className="bg-transparent h-10 p-0 gap-4 flex-shrink-0">
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
            <TabsTrigger value="communication" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2 relative" data-testid="tab-wc-communication">
              <MessageSquare className="h-4 w-4" />
              Communication
              {unreadMessages > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                  {unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2" data-testid="tab-wc-leads">
              <Users className="h-4 w-4" />
              Open Leads
            </TabsTrigger>
          </TabsList>
          <FavoritesBar currentPath="/work-center" currentLabel="Hub" />
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

        <TabsContent value="communication" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">Inbox</h3>
                <Button size="sm" onClick={() => handleCall()} data-testid="button-make-call">
                  <Phone className="h-4 w-4 mr-1" />
                  Make Call
                </Button>
              </div>
              {mockInboxMessages.map(message => {
                const Icon = getMessageIcon(message.type);
                return (
                  <Card key={message.id} className={cn("hover-elevate", !message.read && "border-primary/50")} data-testid={`inbox-${message.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          message.type === 'email' ? "bg-blue-500/10" : message.type === 'sms' ? "bg-green-500/10" : "bg-purple-500/10"
                        )}>
                          <Icon className={cn(
                            "h-5 w-5",
                            message.type === 'email' ? "text-blue-500" : message.type === 'sms' ? "text-green-500" : "text-purple-500"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn("font-medium truncate", !message.read && "text-foreground", message.read && "text-muted-foreground")}>
                              {message.from}
                            </p>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className={cn("text-sm truncate", !message.read ? "text-foreground" : "text-muted-foreground")}>
                            {message.subject}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{message.preview}</p>
                        </div>
                        {!message.read && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="leads" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {mockLeads.map(lead => (
                <Card key={lead.id} className="hover-elevate" data-testid={`lead-${lead.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{lead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-foreground">{lead.name}</h4>
                          <Badge className={getLeadStatusColor(lead.status)} variant="secondary">
                            {lead.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Interested in: {lead.interestedIn}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{lead.phone}</span>
                          <span>•</span>
                          <span>{lead.email}</span>
                          {lead.lastContact && (
                            <>
                              <span>•</span>
                              <span>Last contact: {formatDistanceToNow(new Date(lead.lastContact), { addSuffix: true })}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleCall({ name: lead.name, phone: lead.phone })} data-testid={`lead-call-${lead.id}`}>
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`lead-email-${lead.id}`}>
                          <Mail className="h-4 w-4 mr-1" />
                          Email
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Dialog open={dialerOpen} onOpenChange={setDialerOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialer-modal">
          <DialogHeader>
            <DialogTitle>Make a Call</DialogTitle>
            <DialogDescription>
              {selectedContact ? `Calling ${selectedContact.name}` : 'Enter a phone number or select a contact'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={dialerNumber}
              onChange={(e) => setDialerNumber(e.target.value)}
              placeholder="Enter phone number"
              className="text-center text-xl font-mono"
              data-testid="dialer-input"
            />
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(digit => (
                <Button
                  key={digit}
                  variant="outline"
                  className="h-12 text-lg font-medium"
                  onClick={() => handleDialerInput(digit)}
                  data-testid={`dialer-btn-${digit}`}
                >
                  {digit}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleClearDialer} data-testid="dialer-clear">
                Clear
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={!dialerNumber} data-testid="dialer-call">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
            </div>
            {!selectedContact && (
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground mb-2">Quick contacts</p>
                <div className="space-y-2">
                  {mockLeads.slice(0, 3).map(lead => (
                    <Button
                      key={lead.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedContact({ name: lead.name, phone: lead.phone });
                        setDialerNumber(lead.phone);
                      }}
                      data-testid={`dialer-contact-${lead.id}`}
                    >
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="text-xs">{lead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <span className="truncate">{lead.name}</span>
                      <span className="text-muted-foreground ml-auto text-xs">{lead.phone}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
