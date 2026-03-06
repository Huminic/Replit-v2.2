import { useState } from 'react';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, User, Phone, Mail, X } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import type { Appointment } from '@shared/schema';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const APPOINTMENT_TYPES: Record<string, { label: string; color: string }> = {
  test_drive: { label: 'Test Drive', color: 'bg-blue-500' },
  follow_up: { label: 'Follow Up', color: 'bg-amber-500' },
  service: { label: 'Service', color: 'bg-green-500' },
  consultation: { label: 'Consultation', color: 'bg-purple-500' },
  general: { label: 'General', color: 'bg-slate-500' },
};

const CONNECTOR_SOURCES = [
  { id: 'google_calendar', name: 'Google Calendar', status: 'available' },
  { id: 'dealer_com', name: 'Dealer.com', status: 'available' },
  { id: 'tekion', name: 'Tekion', status: 'available' },
];

interface AppointmentCalendarProps {
  department: string;
}

export function AppointmentCalendar({ department }: AppointmentCalendarProps) {
  const { toast } = useToast();
  const { currentRole } = useApp();
  const isSuperAdmin = currentRole === 'super_admin';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    appointmentType: 'general',
    startTime: '',
    endTime: '',
    notes: '',
  });

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

  const queryUrl = `/api/appointments?department=${department}&startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`;
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments', { department, start: startOfMonth.toISOString(), end: endOfMonth.toISOString() }],
    queryFn: async () => {
      const res = await fetch(queryUrl, {
        headers: { Authorization: `Bearer ${localStorage.getItem('nexxus_access_token')}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('POST', '/api/appointments', {
        ...data,
        department,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      setShowNewForm(false);
      setFormData({ title: '', customerName: '', customerPhone: '', customerEmail: '', appointmentType: 'general', startTime: '', endTime: '', notes: '' });
      toast({ title: 'Appointment created', description: 'The appointment has been added to the calendar.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create appointment.', variant: 'destructive' });
    },
  });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const daysInMonth = endOfMonth.getDate();
  const firstDayOfWeek = startOfMonth.getDay();
  const today = new Date();

  const getAppointmentsForDay = (day: number) => {
    return appointments.filter(a => {
      const d = new Date(a.startTime);
      return d.getDate() === day && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.customerName || !formData.startTime || !formData.endTime) {
      toast({ title: 'Missing fields', description: 'Please fill in all required fields.', variant: 'destructive' });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    const dateStr = date.toISOString().slice(0, 10);
    setFormData(prev => ({
      ...prev,
      startTime: `${dateStr}T09:00`,
      endTime: `${dateStr}T10:00`,
    }));
  };

  const selectedDayAppointments = selectedDate
    ? appointments.filter(a => {
        const d = new Date(a.startTime);
        return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
      })
    : [];

  return (
    <div className="p-6 space-y-4" data-testid="appointment-calendar">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={prevMonth} data-testid="button-prev-month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[180px] text-center" data-testid="text-calendar-month">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth} data-testid="button-next-month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowConnectors(true)} data-testid="button-connector-config">
            <CalendarIcon className="h-4 w-4 mr-1" />
            Sync Sources
          </Button>
          <Button size="sm" onClick={() => setShowNewForm(true)} data-testid="button-new-appointment">
            <Plus className="h-4 w-4 mr-1" />
            New Appointment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border border-border rounded-lg overflow-hidden">
        {DAYS.map(day => (
          <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground bg-muted/30 border-b border-border">
            {day}
          </div>
        ))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2 min-h-[80px] border-b border-r border-border bg-muted/10" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayAppts = getAppointmentsForDay(day);
          const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
          const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth();
          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={cn(
                "p-1.5 min-h-[80px] border-b border-r border-border text-left transition-colors hover:bg-accent/50",
                isToday && "bg-primary/5",
                isSelected && "ring-2 ring-primary ring-inset"
              )}
              data-testid={`calendar-day-${day}`}
            >
              <span className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                isToday && "bg-primary text-primary-foreground"
              )}>
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayAppts.slice(0, 2).map(a => {
                  const typeInfo = APPOINTMENT_TYPES[a.appointmentType] || APPOINTMENT_TYPES.general;
                  return (
                    <div key={a.id} className="flex items-center gap-1 truncate" data-testid={`appointment-${a.id}`}>
                      <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", typeInfo.color)} />
                      <span className="text-[10px] text-muted-foreground truncate">{a.title}</span>
                    </div>
                  );
                })}
                {dayAppts.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">+{dayAppts.length - 2} more</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" data-testid="text-selected-date">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDate(null)} data-testid="button-close-day-detail">
                <X className="h-3 w-3" />
              </Button>
            </div>
            {selectedDayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground" data-testid="text-no-appointments">No appointments scheduled</p>
            ) : (
              <div className="space-y-2">
                {selectedDayAppointments.map(a => {
                  const typeInfo = APPOINTMENT_TYPES[a.appointmentType] || APPOINTMENT_TYPES.general;
                  return (
                    <div key={a.id} className="flex items-start gap-3 p-2 rounded-md bg-muted/30" data-testid={`day-appointment-${a.id}`}>
                      <div className={cn("w-2 h-full min-h-[40px] rounded-full flex-shrink-0", typeInfo.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{a.title}</span>
                          <Badge variant="secondary" className="text-[10px]">{typeInfo.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(a.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {new Date(a.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{a.customerName}</span>
                          {a.customerPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{a.customerPhone}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-new-appointment">
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
            <DialogDescription>Schedule a new {department} appointment</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAppointment} className="space-y-3">
            <div>
              <Label htmlFor="apt-title">Title *</Label>
              <Input id="apt-title" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Test Drive - 2024 Camry" data-testid="input-appointment-title" />
            </div>
            <div>
              <Label htmlFor="apt-customer">Customer Name *</Label>
              <Input id="apt-customer" value={formData.customerName} onChange={e => setFormData(p => ({ ...p, customerName: e.target.value }))} placeholder="John Smith" data-testid="input-appointment-customer" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="apt-phone">Phone</Label>
                <Input id="apt-phone" value={formData.customerPhone} onChange={e => setFormData(p => ({ ...p, customerPhone: e.target.value }))} placeholder="(555) 123-4567" data-testid="input-appointment-phone" />
              </div>
              <div>
                <Label htmlFor="apt-email">Email</Label>
                <Input id="apt-email" value={formData.customerEmail} onChange={e => setFormData(p => ({ ...p, customerEmail: e.target.value }))} placeholder="john@example.com" data-testid="input-appointment-email" />
              </div>
            </div>
            <div>
              <Label htmlFor="apt-type">Type</Label>
              <Select value={formData.appointmentType} onValueChange={v => setFormData(p => ({ ...p, appointmentType: v }))}>
                <SelectTrigger data-testid="select-appointment-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(APPOINTMENT_TYPES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="apt-start">Start Time *</Label>
                <Input id="apt-start" type="datetime-local" value={formData.startTime} onChange={e => setFormData(p => ({ ...p, startTime: e.target.value }))} data-testid="input-appointment-start" />
              </div>
              <div>
                <Label htmlFor="apt-end">End Time *</Label>
                <Input id="apt-end" type="datetime-local" value={formData.endTime} onChange={e => setFormData(p => ({ ...p, endTime: e.target.value }))} data-testid="input-appointment-end" />
              </div>
            </div>
            <div>
              <Label htmlFor="apt-notes">Notes</Label>
              <Input id="apt-notes" value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." data-testid="input-appointment-notes" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowNewForm(false)} data-testid="button-cancel-appointment">Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-appointment">
                {createMutation.isPending ? 'Saving...' : 'Save Appointment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showConnectors} onOpenChange={setShowConnectors}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-connector-config">
          <DialogHeader>
            <DialogTitle>Appointment Sync Sources</DialogTitle>
            <DialogDescription>Connect external calendars to sync appointments automatically</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {CONNECTOR_SOURCES.map(src => (
              <div key={src.id} className="flex items-center justify-between p-3 rounded-lg border border-border" data-testid={`connector-${src.id}`}>
                <div>
                  <p className="text-sm font-medium">{src.name}</p>
                  <p className="text-xs text-muted-foreground">Sync appointments from {src.name}</p>
                </div>
                <Button variant="outline" size="sm" data-testid={`button-connect-${src.id}`}>
                  Configure
                </Button>
              </div>
            ))}
            {isSuperAdmin && (
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5" data-testid="connector-vinsolutions">
                <div>
                  <p className="text-sm font-medium">VIN Solutions</p>
                  <p className="text-xs text-muted-foreground">Sync appointments from VIN Solutions CRM</p>
                  <Badge variant="outline" className="text-[10px] mt-1">Super Admin</Badge>
                </div>
                <Button variant="outline" size="sm" data-testid="button-connect-vinsolutions">
                  Configure
                </Button>
              </div>
            )}
            {!isSuperAdmin && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground italic" data-testid="text-vin-not-listed">
                  VIN Solutions is not available as an appointment sync source.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
