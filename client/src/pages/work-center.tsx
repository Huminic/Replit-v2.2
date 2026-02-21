import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { 
  Calendar as CalendarIcon, 
  Plus,
  User,
  MessageSquare,
  Users,
  Phone,
  Mail,
  Voicemail,
  MessageCircle,
  CalendarPlus,
  Send,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Activity,
  Clock,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  mockCalendarEvents, 
  mockLeads,
  mockInboxMessages,
  getLeadStatusColor,
  type Lead,
  type LeadActivity
} from '@/mocks/tasks';
import { format, formatDistanceToNow, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, addWeeks, addMonths, addYears, subDays, subWeeks, subMonths, subYears, isSameDay, isSameMonth, getDay } from 'date-fns';
import { FavoritesBar } from '@/components/layout/FavoritesBar';
import { MobileNavDropdown } from '@/components/layout/MobileNavDropdown';

type CalendarViewMode = 'year' | 'month' | 'week' | 'day';

export default function WorkCenterPage() {
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState('calendar');
  const [calendarView, setCalendarView] = useState<CalendarViewMode>('week');
  const [calendarSearch, setCalendarSearch] = useState('');
  const [viewDate, setViewDate] = useState(new Date());

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const fn = direction === 'prev'
      ? { year: subYears, month: subMonths, week: subWeeks, day: subDays }
      : { year: addYears, month: addMonths, week: addWeeks, day: addDays };
    setViewDate(prev => fn[calendarView](prev, 1));
  };

  const getViewLabel = () => {
    switch (calendarView) {
      case 'year': return format(viewDate, 'yyyy');
      case 'month': return format(viewDate, 'MMMM yyyy');
      case 'week': {
        const start = startOfWeek(viewDate, { weekStartsOn: 0 });
        const end = endOfWeek(viewDate, { weekStartsOn: 0 });
        return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
      }
      case 'day': return format(viewDate, 'EEEE, MMMM d, yyyy');
    }
  };

  const getEventsForDay = (date: Date) => {
    return mockCalendarEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return isSameDay(eventDate, date);
    });
  };

  const filteredCalendarEvents = useMemo(() => {
    if (!calendarSearch.trim()) return mockCalendarEvents;
    const q = calendarSearch.toLowerCase();
    return mockCalendarEvents.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.attendees.some(a => a.toLowerCase().includes(q))
    );
  }, [calendarSearch]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(viewDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end: addDays(start, 6) });
  }, [viewDate]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    const calStart = startOfWeek(start, { weekStartsOn: 0 });
    const calEnd = endOfWeek(end, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [viewDate]);

  const hours = Array.from({ length: 14 }, (_, i) => i + 7);

  const eventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300';
      case 'appointment': return 'bg-green-500/15 border-green-500/40 text-green-700 dark:text-green-300';
      case 'task': return 'bg-orange-500/15 border-orange-500/40 text-orange-700 dark:text-orange-300';
      case 'reminder': return 'bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300';
      default: return 'bg-muted border-border text-foreground';
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['calendar', 'leads', 'inbox'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail;
      if (tab && ['calendar', 'leads', 'inbox'].includes(tab)) {
        setActiveTab(tab);
      }
    };
    window.addEventListener('hub-tab-change', handler);
    return () => window.removeEventListener('hub-tab-change', handler);
  }, []);
  const [dialerOpen, setDialerOpen] = useState(false);
  const [dialerNumber, setDialerNumber] = useState('');
  const [selectedContact, setSelectedContact] = useState<{ name: string; phone: string } | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [messageType, setMessageType] = useState<'sms' | 'email'>('sms');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleLead, setScheduleLead] = useState<string>('');
  const [leadDetailOpen, setLeadDetailOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

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
      <div className="p-4 border-b border-border flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Hub</h1>
          <p className="text-sm text-muted-foreground">Calendar, leads, and communications</p>
        </div>
        <Button size="sm" onClick={() => setNewMessageOpen(true)} data-testid="button-new-message">
          <Plus className="h-4 w-4 mr-1.5" />
          New Message
        </Button>
      </div>

      <div className="px-4 py-2 lg:hidden">
        <MobileNavDropdown currentPath="/work-center" currentLabel="Hub" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 border-b border-border hidden lg:flex items-center">
          <TabsList className="bg-transparent h-10 p-0 gap-4 flex-shrink-0">
            <TabsTrigger value="calendar" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2" data-testid="tab-wc-calendar">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2" data-testid="tab-wc-leads">
              <Users className="h-4 w-4" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="inbox" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2 relative" data-testid="tab-wc-inbox">
              <MessageSquare className="h-4 w-4" />
              Inbox
              {unreadMessages > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                  {unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <FavoritesBar currentPath="/work-center" currentLabel="Hub" />
        </div>

        <TabsContent value="calendar" className="flex-1 m-0 overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-1">
                {(['year', 'month', 'week', 'day'] as CalendarViewMode[]).map(v => (
                  <Button
                    key={v}
                    variant={calendarView === v ? 'default' : 'ghost'}
                    size="sm"
                    className="capitalize text-xs"
                    onClick={() => setCalendarView(v)}
                    data-testid={`cal-view-${v}`}
                  >
                    {v}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => navigateCalendar('prev')} data-testid="cal-prev">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="font-medium text-sm whitespace-nowrap" onClick={() => setViewDate(new Date())} data-testid="cal-today">
                  {getViewLabel()}
                </Button>
                <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => navigateCalendar('next')} data-testid="cal-next">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative w-full sm:w-56 flex-shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  className="pl-8 text-sm"
                  value={calendarSearch}
                  onChange={e => setCalendarSearch(e.target.value)}
                  data-testid="input-search-calendar"
                />
              </div>
            </div>

            {calendarSearch.trim() ? (
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">{filteredCalendarEvents.length} result{filteredCalendarEvents.length !== 1 ? 's' : ''}</p>
                  {filteredCalendarEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground text-sm">No events match your search</p>
                    </div>
                  ) : filteredCalendarEvents.map(event => (
                    <Card key={event.id} className="hover-elevate cursor-pointer" onClick={() => toast({ title: event.title, description: `${format(new Date(event.startTime), 'MMM d, h:mm a')} - ${format(new Date(event.endTime), 'h:mm a')}` })} data-testid={`event-${event.id}`}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={cn('w-1 self-stretch rounded-full flex-shrink-0', event.type === 'meeting' ? 'bg-blue-500' : event.type === 'appointment' ? 'bg-green-500' : event.type === 'task' ? 'bg-orange-500' : 'bg-purple-500')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(event.startTime), 'EEE, MMM d · h:mm a')} – {format(new Date(event.endTime), 'h:mm a')}</p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] capitalize flex-shrink-0">{event.type}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : calendarView === 'day' ? (
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <div className="relative">
                    {hours.map(hour => {
                      const dayEvents = getEventsForDay(viewDate).filter(e => {
                        const h = new Date(e.startTime).getHours();
                        return h >= hour && h < hour + 1;
                      });
                      return (
                        <div key={hour} className="flex min-h-[60px] border-b border-border/50">
                          <div className="w-16 flex-shrink-0 text-xs text-muted-foreground pt-1 pr-3 text-right">
                            {format(new Date(2026, 0, 1, hour), 'h a')}
                          </div>
                          <div className="flex-1 relative pl-3 border-l border-border">
                            {dayEvents.map(event => (
                              <div
                                key={event.id}
                                className={cn('rounded-md border px-2 py-1 mb-1 cursor-pointer text-xs', eventTypeColor(event.type))}
                                onClick={() => toast({ title: event.title, description: `${format(new Date(event.startTime), 'h:mm a')} - ${format(new Date(event.endTime), 'h:mm a')}. ${event.description}` })}
                                data-testid={`event-${event.id}`}
                              >
                                <p className="font-medium truncate">{event.title}</p>
                                <p className="opacity-70">{format(new Date(event.startTime), 'h:mm a')} – {format(new Date(event.endTime), 'h:mm a')}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            ) : calendarView === 'week' ? (
              <ScrollArea className="flex-1">
                <div className="min-w-[700px]">
                  <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border sticky top-0 bg-background z-10">
                    <div className="p-2" />
                    {weekDays.map(day => (
                      <div key={day.toISOString()} className={cn('p-2 text-center border-l border-border', isSameDay(day, new Date()) && 'bg-primary/5')}>
                        <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
                        <p className={cn('text-sm font-medium', isSameDay(day, new Date()) ? 'text-primary' : 'text-foreground')}>{format(day, 'd')}</p>
                      </div>
                    ))}
                  </div>
                  {hours.map(hour => (
                    <div key={hour} className="grid grid-cols-[64px_repeat(7,1fr)] min-h-[52px] border-b border-border/50">
                      <div className="text-xs text-muted-foreground pt-1 pr-3 text-right">
                        {format(new Date(2026, 0, 1, hour), 'h a')}
                      </div>
                      {weekDays.map(day => {
                        const dayEvents = getEventsForDay(day).filter(e => {
                          const h = new Date(e.startTime).getHours();
                          return h >= hour && h < hour + 1;
                        });
                        return (
                          <div key={day.toISOString()} className={cn('border-l border-border p-0.5 relative', isSameDay(day, new Date()) && 'bg-primary/5')}>
                            {dayEvents.map(event => (
                              <div
                                key={event.id}
                                className={cn('rounded border px-1.5 py-0.5 cursor-pointer text-[11px] leading-tight mb-0.5', eventTypeColor(event.type))}
                                onClick={() => toast({ title: event.title, description: `${format(new Date(event.startTime), 'h:mm a')} - ${format(new Date(event.endTime), 'h:mm a')}. ${event.description}` })}
                                data-testid={`event-${event.id}`}
                              >
                                <p className="font-medium truncate">{event.title}</p>
                                <p className="opacity-70 truncate">{format(new Date(event.startTime), 'h:mm')} – {format(new Date(event.endTime), 'h:mm')}</p>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : calendarView === 'month' ? (
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="bg-muted/50 p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
                    ))}
                    {monthDays.map(day => {
                      const dayEvents = getEventsForDay(day);
                      const isCurrentMonth = isSameMonth(day, viewDate);
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            'bg-background min-h-[80px] p-1.5 cursor-pointer hover:bg-accent/30 transition-colors',
                            !isCurrentMonth && 'opacity-40',
                            isSameDay(day, new Date()) && 'ring-1 ring-primary ring-inset'
                          )}
                          onClick={() => { setViewDate(day); setCalendarView('day'); }}
                        >
                          <p className={cn('text-xs font-medium mb-1', isSameDay(day, new Date()) ? 'text-primary' : 'text-foreground')}>{format(day, 'd')}</p>
                          <div className="space-y-0.5">
                            {dayEvents.slice(0, 3).map(event => (
                              <div key={event.id} className={cn('rounded px-1 py-0.5 text-[10px] leading-tight truncate border', eventTypeColor(event.type))} data-testid={`event-${event.id}`}>
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <p className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <ScrollArea className="flex-1">
                <div className="p-4">
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthDate = new Date(viewDate.getFullYear(), i, 1);
                      const monthEnd = endOfMonth(monthDate);
                      const monthEvents = mockCalendarEvents.filter(e => {
                        const d = new Date(e.startTime);
                        return d >= monthDate && d <= monthEnd;
                      });
                      const isCurrentMonth = i === new Date().getMonth() && viewDate.getFullYear() === new Date().getFullYear();
                      return (
                        <Card
                          key={i}
                          className={cn('cursor-pointer hover-elevate', isCurrentMonth && 'ring-1 ring-primary')}
                          onClick={() => { setViewDate(new Date(viewDate.getFullYear(), i, 1)); setCalendarView('month'); }}
                        >
                          <CardContent className="p-3">
                            <p className={cn('text-sm font-medium mb-2', isCurrentMonth ? 'text-primary' : 'text-foreground')}>{format(monthDate, 'MMMM')}</p>
                            <div className="grid grid-cols-7 gap-px">
                              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                                <div key={idx} className="text-[8px] text-muted-foreground text-center">{d}</div>
                              ))}
                              {Array.from({ length: getDay(monthDate) }, (_, k) => (
                                <div key={`blank-${k}`} />
                              ))}
                              {eachDayOfInterval({ start: monthDate, end: monthEnd }).map(day => {
                                const hasEvents = getEventsForDay(day).length > 0;
                                return (
                                  <div key={day.toISOString()} className="text-center">
                                    <span className={cn('text-[9px]', isSameDay(day, new Date()) ? 'text-primary font-bold' : 'text-muted-foreground', hasEvents && 'underline decoration-primary')}>
                                      {format(day, 'd')}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            {monthEvents.length > 0 && (
                              <p className="text-[10px] text-muted-foreground mt-2">{monthEvents.length} event{monthEvents.length !== 1 ? 's' : ''}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </TabsContent>

        <TabsContent value="leads" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {mockLeads.map(lead => (
                <Card key={lead.id} className="hover-elevate cursor-pointer" data-testid={`lead-${lead.id}`} onClick={() => { setSelectedLead(lead); setLeadDetailOpen(true); }}>
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
                          <div className="flex items-center gap-1 ml-auto" data-testid={`lead-score-${lead.id}`}>
                            <Target className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className={cn("text-xs font-semibold", lead.score >= 75 ? "text-green-600 dark:text-green-400" : lead.score >= 50 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>{lead.score}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Interested in: {lead.interestedIn}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span>{lead.phone}</span>
                          <span>{lead.email}</span>
                          {lead.lastContact && (
                            <span>Last contact: {formatDistanceToNow(new Date(lead.lastContact), { addSuffix: true })}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 flex-wrap">
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          setMessageType('sms');
                          setNewMessageOpen(true);
                        }} data-testid={`lead-text-${lead.id}`}>
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Text
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleCall({ name: lead.name, phone: lead.phone }); }} data-testid={`lead-call-${lead.id}`}>
                          <Phone className="h-4 w-4 mr-1" />
                          Call
                        </Button>
                        <Button size="sm" variant="outline" onClick={(e) => {
                          e.stopPropagation();
                          setScheduleLead(lead.name);
                          setScheduleOpen(true);
                        }} data-testid={`lead-schedule-${lead.id}`}>
                          <CalendarPlus className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="inbox" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <h3 className="font-medium text-foreground">Universal Inbox</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    setMessageType('email');
                    setNewMessageOpen(true);
                  }} data-testid="button-compose-email">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setMessageType('sms');
                    setNewMessageOpen(true);
                  }} data-testid="button-compose-sms">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    SMS
                  </Button>
                  <Button size="sm" onClick={() => handleCall()} data-testid="button-make-call">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
              {mockInboxMessages.map(message => {
                const Icon = getMessageIcon(message.type);
                return (
                  <Card key={message.id} className={cn("hover-elevate cursor-pointer", !message.read && "border-primary/50")} onClick={() => toast({ title: message.subject, description: `From: ${message.from}. ${message.preview}` })} data-testid={`inbox-${message.id}`}>
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
              <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={!dialerNumber} onClick={() => { toast({ title: 'Calling...', description: `Dialing ${dialerNumber}${selectedContact ? ` (${selectedContact.name})` : ''}.` }); setDialerOpen(false); }} data-testid="dialer-call">
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

      <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="new-message-modal">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>Send an SMS or email to a prospect</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={messageType === 'sms' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMessageType('sms')}
                className="flex-1"
                data-testid="msg-type-sms"
              >
                <MessageCircle className="h-4 w-4 mr-1.5" />
                SMS
              </Button>
              <Button
                variant={messageType === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMessageType('email')}
                className="flex-1"
                data-testid="msg-type-email"
              >
                <Mail className="h-4 w-4 mr-1.5" />
                Email
              </Button>
            </div>
            <Input
              placeholder={messageType === 'sms' ? 'Phone number' : 'Recipient email'}
              data-testid="msg-recipient"
            />
            {messageType === 'email' && (
              <Input
                placeholder="Subject"
                data-testid="msg-subject"
              />
            )}
            <Textarea
              placeholder={messageType === 'sms' ? 'Type your message...' : 'Compose your email...'}
              className="min-h-[120px] resize-none"
              data-testid="msg-body"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNewMessageOpen(false)} data-testid="msg-cancel">
                Cancel
              </Button>
              <Button onClick={() => { toast({ title: 'Message sent', description: `Your ${messageType === 'sms' ? 'SMS' : 'email'} has been sent.` }); setNewMessageOpen(false); }} data-testid="msg-send">
                <Send className="h-4 w-4 mr-1.5" />
                Send {messageType === 'sms' ? 'SMS' : 'Email'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-md" data-testid="schedule-modal">
          <DialogHeader>
            <DialogTitle>Schedule Appointment</DialogTitle>
            <DialogDescription>
              {scheduleLead ? `Schedule with ${scheduleLead}` : 'Schedule a new appointment'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Appointment title"
              defaultValue={scheduleLead ? `Meeting with ${scheduleLead}` : ''}
              data-testid="schedule-title"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                <Input type="date" data-testid="schedule-date" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Time</label>
                <Input type="time" data-testid="schedule-time" />
              </div>
            </div>
            <Textarea
              placeholder="Notes (optional)"
              className="min-h-[80px] resize-none"
              data-testid="schedule-notes"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setScheduleOpen(false)} data-testid="schedule-cancel">
                Cancel
              </Button>
              <Button onClick={() => { toast({ title: 'Appointment scheduled', description: `${scheduleLead ? `Meeting with ${scheduleLead}` : 'Appointment'} has been scheduled.` }); setScheduleOpen(false); }} data-testid="schedule-confirm">
                <CalendarPlus className="h-4 w-4 mr-1.5" />
                Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={leadDetailOpen} onOpenChange={setLeadDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col" data-testid="lead-detail-modal">
          {selectedLead && (
            <>
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-lg">{selectedLead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-lg">{selectedLead.name}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {selectedLead.interestedIn} &middot; {selectedLead.source}
                    </DialogDescription>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-shrink-0" data-testid="lead-detail-score">
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-2",
                      selectedLead.score >= 75 ? "border-green-500 dark:border-green-400 text-green-600 dark:text-green-400 bg-green-500/10" :
                      selectedLead.score >= 50 ? "border-amber-500 dark:border-amber-400 text-amber-600 dark:text-amber-400 bg-amber-500/10" :
                      "border-muted text-muted-foreground bg-muted/30"
                    )}>
                      {selectedLead.score}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Score</span>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-border flex-shrink-0">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Status</p>
                  <Badge className={cn(getLeadStatusColor(selectedLead.status), "mt-1")} variant="secondary">{selectedLead.status}</Badge>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Phone</p>
                  <p className="text-sm text-foreground mt-1">{selectedLead.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Email</p>
                  <p className="text-sm text-foreground mt-1 truncate">{selectedLead.email}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Created</p>
                  <p className="text-sm text-foreground mt-1">{format(new Date(selectedLead.createdAt), 'MMM d, yyyy')}</p>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="flex items-center gap-2 py-2 flex-shrink-0">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium text-foreground">Activity Timeline</h3>
                  <span className="text-xs text-muted-foreground">({selectedLead.activities.length} events)</span>
                </div>
                <ScrollArea className="h-[calc(100%-2rem)]">
                  <div className="relative pl-6 pb-4">
                    <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                    {[...selectedLead.activities].reverse().map((activity, idx) => {
                      const activityIcon = {
                        call: Phone,
                        email: Mail,
                        sms: MessageCircle,
                        note: FileText,
                        status_change: Target,
                        meeting: CalendarIcon,
                      }[activity.type];
                      const ActivityIcon = activityIcon;
                      const activityColor = {
                        call: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
                        email: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
                        sms: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30',
                        note: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
                        status_change: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
                        meeting: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30',
                      }[activity.type];

                      return (
                        <div key={activity.id} className="relative mb-4 last:mb-0" data-testid={`activity-${activity.id}`}>
                          <div className={cn("absolute -left-6 w-[18px] h-[18px] rounded-full border flex items-center justify-center", activityColor)}>
                            <ActivityIcon className="h-2.5 w-2.5" />
                          </div>
                          <div className="ml-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm text-foreground">{activity.description}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">{format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}</p>
                            </div>
                            {activity.details && (
                              <p className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded p-2 border border-border/50">{activity.details}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border flex-shrink-0">
                <Button size="sm" variant="outline" onClick={(e) => {
                  e.stopPropagation();
                  setLeadDetailOpen(false);
                  setMessageType('sms');
                  setNewMessageOpen(true);
                }} data-testid="lead-detail-text">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Text
                </Button>
                <Button size="sm" variant="outline" onClick={(e) => {
                  e.stopPropagation();
                  setLeadDetailOpen(false);
                  handleCall({ name: selectedLead.name, phone: selectedLead.phone });
                }} data-testid="lead-detail-call">
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
                <Button size="sm" variant="outline" onClick={(e) => {
                  e.stopPropagation();
                  setLeadDetailOpen(false);
                  setScheduleLead(selectedLead.name);
                  setScheduleOpen(true);
                }} data-testid="lead-detail-schedule">
                  <CalendarPlus className="h-4 w-4 mr-1" />
                  Schedule
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
