// Mock tasks and work center data for Nexxus V2 UI prototype

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
  createdAt: string;
  tags: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  type: 'meeting' | 'task' | 'reminder' | 'appointment';
  attendees: string[];
}

export interface Hunch {
  id: string;
  title: string;
  description: string;
  source: string;
  confidence: number;
  createdAt: string;
  status: 'new' | 'acknowledged' | 'actioned' | 'dismissed';
}

export interface Approval {
  id: string;
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  type: 'agent' | 'document' | 'expense' | 'access';
  status: 'pending' | 'approved' | 'rejected';
}

export const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Review Q1 Sales Report',
    description: 'Analyze the quarterly sales data and prepare summary for leadership meeting',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Duane Wells',
    dueDate: '2026-01-22T17:00:00Z',
    createdAt: '2026-01-18T10:00:00Z',
    tags: ['reports', 'sales'],
  },
  {
    id: 'task-2',
    title: 'Configure Service Reminder Agent',
    description: 'Set up automated service reminders with proper timing and messaging',
    status: 'todo',
    priority: 'medium',
    assignee: 'Duane Wells',
    dueDate: '2026-01-25T17:00:00Z',
    createdAt: '2026-01-19T14:00:00Z',
    tags: ['agents', 'automation'],
  },
  {
    id: 'task-3',
    title: 'Update inventory photos',
    description: 'Upload new photos for recently added vehicles',
    status: 'done',
    priority: 'low',
    assignee: 'Mike Chen',
    dueDate: '2026-01-20T17:00:00Z',
    createdAt: '2026-01-15T09:00:00Z',
    tags: ['inventory', 'photos'],
  },
  {
    id: 'task-4',
    title: 'Train new Sales Agent model',
    description: 'Provide feedback and training data to improve agent responses',
    status: 'review',
    priority: 'high',
    assignee: 'Sarah Johnson',
    dueDate: '2026-01-23T17:00:00Z',
    createdAt: '2026-01-17T11:00:00Z',
    tags: ['agents', 'training'],
  },
  {
    id: 'task-5',
    title: 'Prepare marketing campaign',
    description: 'Design promotional materials for spring sale event',
    status: 'todo',
    priority: 'urgent',
    assignee: 'Sarah Johnson',
    dueDate: '2026-01-24T17:00:00Z',
    createdAt: '2026-01-20T08:00:00Z',
    tags: ['marketing', 'campaign'],
  },
];

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'Weekly Team Standup',
    description: 'Regular team sync meeting',
    startTime: '2026-01-21T09:00:00Z',
    endTime: '2026-01-21T09:30:00Z',
    type: 'meeting',
    attendees: ['Duane Wells', 'Sarah Johnson', 'Mike Chen'],
  },
  {
    id: 'event-2',
    title: 'Client Demo: Nexxus V2',
    description: 'Product demonstration for Premier Motors',
    startTime: '2026-01-21T14:00:00Z',
    endTime: '2026-01-21T15:00:00Z',
    type: 'meeting',
    attendees: ['Duane Wells'],
  },
  {
    id: 'event-3',
    title: 'Service Appointment: Oil Change',
    description: 'Customer: John Smith - 2024 Honda Accord',
    startTime: '2026-01-21T10:00:00Z',
    endTime: '2026-01-21T11:00:00Z',
    type: 'appointment',
    attendees: ['Service Team'],
  },
  {
    id: 'event-4',
    title: 'Review Agent Performance',
    description: 'Monthly review of AI agent metrics',
    startTime: '2026-01-22T11:00:00Z',
    endTime: '2026-01-22T12:00:00Z',
    type: 'task',
    attendees: ['Duane Wells'],
  },
  {
    id: 'event-5',
    title: 'Morning Sales Huddle',
    description: 'Daily sales team check-in',
    startTime: '2026-02-16T09:00:00Z',
    endTime: '2026-02-16T09:30:00Z',
    type: 'meeting',
    attendees: ['Duane Wells', 'Sarah Johnson'],
  },
  {
    id: 'event-6',
    title: 'Test Drive: 2026 BMW X5',
    description: 'Scheduled test drive with Robert Garcia',
    startTime: '2026-02-17T10:00:00Z',
    endTime: '2026-02-17T11:00:00Z',
    type: 'appointment',
    attendees: ['Robert Garcia', 'Mike Chen'],
  },
  {
    id: 'event-7',
    title: 'Finance Review Meeting',
    description: 'Monthly finance reconciliation with accounting',
    startTime: '2026-02-17T14:00:00Z',
    endTime: '2026-02-17T15:30:00Z',
    type: 'meeting',
    attendees: ['Duane Wells', 'Finance Team'],
  },
  {
    id: 'event-8',
    title: 'Inventory Walkthrough',
    description: 'New arrivals lot inspection',
    startTime: '2026-02-18T08:30:00Z',
    endTime: '2026-02-18T09:30:00Z',
    type: 'task',
    attendees: ['Mike Chen'],
  },
  {
    id: 'event-9',
    title: 'Lunch with Premier Motors Rep',
    description: 'Partnership discussion over lunch',
    startTime: '2026-02-18T12:00:00Z',
    endTime: '2026-02-18T13:00:00Z',
    type: 'meeting',
    attendees: ['Duane Wells'],
  },
  {
    id: 'event-10',
    title: 'Service Follow-up Calls',
    description: 'Call customers with completed service orders',
    startTime: '2026-02-19T10:00:00Z',
    endTime: '2026-02-19T11:30:00Z',
    type: 'task',
    attendees: ['Service Team'],
  },
  {
    id: 'event-11',
    title: 'AI Agent Training Session',
    description: 'Workshop on new agent capabilities',
    startTime: '2026-02-19T15:00:00Z',
    endTime: '2026-02-19T16:00:00Z',
    type: 'meeting',
    attendees: ['Duane Wells', 'Sarah Johnson', 'Mike Chen'],
  },
  {
    id: 'event-12',
    title: 'Vehicle Delivery: Honda Civic',
    description: 'Customer pickup scheduled - Jennifer Lee',
    startTime: '2026-02-20T11:00:00Z',
    endTime: '2026-02-20T12:00:00Z',
    type: 'appointment',
    attendees: ['Sarah Johnson'],
  },
  {
    id: 'event-13',
    title: 'Weekly Team Standup',
    description: 'Regular team sync meeting',
    startTime: '2026-02-21T09:00:00Z',
    endTime: '2026-02-21T09:30:00Z',
    type: 'meeting',
    attendees: ['Duane Wells', 'Sarah Johnson', 'Mike Chen'],
  },
  {
    id: 'event-14',
    title: 'Marketing Campaign Review',
    description: 'Review spring sale campaign performance',
    startTime: '2026-02-21T13:00:00Z',
    endTime: '2026-02-21T14:00:00Z',
    type: 'meeting',
    attendees: ['Sarah Johnson', 'Marketing Team'],
  },
  {
    id: 'event-15',
    title: 'Oil Change: 2024 Accord',
    description: 'Regular maintenance - Customer: Tom Wilson',
    startTime: '2026-02-22T10:00:00Z',
    endTime: '2026-02-22T10:45:00Z',
    type: 'appointment',
    attendees: ['Service Team'],
  },
];

export const mockHunches: Hunch[] = [
  {
    id: 'hunch-1',
    title: 'Potential high-value lead detected',
    description: 'Customer viewed 3 luxury vehicles in the past week. Consider follow-up call.',
    source: 'Sales Agent',
    confidence: 85,
    createdAt: '2026-01-21T08:30:00Z',
    status: 'new',
  },
  {
    id: 'hunch-2',
    title: 'Service appointment cancelation pattern',
    description: '3 customers canceled appointments this week. Check for common issues.',
    source: 'Service Reminder Agent',
    confidence: 72,
    createdAt: '2026-01-20T15:00:00Z',
    status: 'acknowledged',
  },
  {
    id: 'hunch-3',
    title: 'Inventory optimization opportunity',
    description: 'SUV sales trending up 15%. Consider adjusting inventory mix.',
    source: 'Analytics Engine',
    confidence: 91,
    createdAt: '2026-01-19T10:00:00Z',
    status: 'actioned',
  },
];

export const mockApprovals: Approval[] = [
  {
    id: 'approval-1',
    title: 'Activate Lead Qualifier Agent',
    description: 'New agent ready for production deployment',
    requestedBy: 'Sarah Johnson',
    requestedAt: '2026-01-20T16:00:00Z',
    type: 'agent',
    status: 'pending',
  },
  {
    id: 'approval-2',
    title: 'Marketing Budget Increase',
    description: 'Request for additional $5,000 for spring campaign',
    requestedBy: 'Mike Chen',
    requestedAt: '2026-01-19T14:00:00Z',
    type: 'expense',
    status: 'pending',
  },
  {
    id: 'approval-3',
    title: 'New User Access: Emily Davis',
    description: 'Staff access for new team member',
    requestedBy: 'Duane Wells',
    requestedAt: '2026-01-18T11:00:00Z',
    type: 'access',
    status: 'approved',
  },
];

export const getTaskStatusColor = (status: TaskStatus): string => {
  const colors: Record<TaskStatus, string> = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    review: 'bg-amber-100 text-amber-700',
    done: 'bg-green-100 text-green-700',
  };
  return colors[status];
};

export const getTaskPriorityColor = (priority: TaskPriority): string => {
  const colors: Record<TaskPriority, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600',
  };
  return colors[priority];
};

// Lead types and mock data
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  status: LeadStatus;
  source: string;
  interestedIn: string;
  lastContact?: string;
  createdAt: string;
}

export interface InboxMessage {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  timestamp: string;
  read: boolean;
  type: 'email' | 'sms' | 'voicemail';
}

export const mockLeads: Lead[] = [
  {
    id: 'lead-1',
    name: 'Jennifer Martinez',
    email: 'jennifer.m@email.com',
    phone: '(555) 123-4567',
    status: 'new',
    source: 'Website',
    interestedIn: '2024 Toyota Camry',
    createdAt: '2026-01-21T08:00:00Z',
  },
  {
    id: 'lead-2',
    name: 'Robert Williams',
    email: 'rwilliams@company.com',
    phone: '(555) 234-5678',
    company: 'Williams Construction',
    status: 'contacted',
    source: 'Phone Inquiry',
    interestedIn: '2024 Ford F-150',
    lastContact: '2026-01-20T14:30:00Z',
    createdAt: '2026-01-19T10:00:00Z',
  },
  {
    id: 'lead-3',
    name: 'Amanda Chen',
    email: 'amanda.chen@gmail.com',
    phone: '(555) 345-6789',
    status: 'qualified',
    source: 'Referral',
    interestedIn: '2024 Honda CR-V',
    lastContact: '2026-01-21T09:15:00Z',
    createdAt: '2026-01-18T11:00:00Z',
  },
  {
    id: 'lead-4',
    name: 'Michael Thompson',
    email: 'mthompson@email.com',
    phone: '(555) 456-7890',
    status: 'proposal',
    source: 'Walk-in',
    interestedIn: '2024 BMW X5',
    lastContact: '2026-01-20T16:00:00Z',
    createdAt: '2026-01-15T13:00:00Z',
  },
  {
    id: 'lead-5',
    name: 'Sarah Kim',
    email: 'sarahkim@outlook.com',
    phone: '(555) 567-8901',
    status: 'new',
    source: 'Social Media',
    interestedIn: '2024 Tesla Model 3',
    createdAt: '2026-01-21T07:30:00Z',
  },
];

export const mockInboxMessages: InboxMessage[] = [
  {
    id: 'msg-1',
    from: 'Jennifer Martinez',
    fromEmail: 'jennifer.m@email.com',
    subject: 'Interested in the Camry',
    preview: 'Hi, I saw the 2024 Toyota Camry on your website and I would like to schedule a test drive...',
    timestamp: '2026-01-21T08:15:00Z',
    read: false,
    type: 'email',
  },
  {
    id: 'msg-2',
    from: 'Robert Williams',
    fromEmail: 'rwilliams@company.com',
    subject: 'Re: Ford F-150 Availability',
    preview: 'Thank you for the information. I am available this Saturday for a viewing...',
    timestamp: '2026-01-20T16:45:00Z',
    read: true,
    type: 'email',
  },
  {
    id: 'msg-3',
    from: '(555) 345-6789',
    fromEmail: 'amanda.chen@gmail.com',
    subject: 'Voicemail',
    preview: 'Hi, this is Amanda Chen calling about the Honda CR-V we discussed...',
    timestamp: '2026-01-21T09:00:00Z',
    read: false,
    type: 'voicemail',
  },
  {
    id: 'msg-4',
    from: 'Michael Thompson',
    fromEmail: 'mthompson@email.com',
    subject: 'BMW X5 Financing Options',
    preview: 'I reviewed the financing options you sent. Can we discuss the 60-month term?',
    timestamp: '2026-01-20T15:30:00Z',
    read: true,
    type: 'email',
  },
  {
    id: 'msg-5',
    from: '(555) 567-8901',
    fromEmail: 'sarahkim@outlook.com',
    subject: 'SMS',
    preview: 'Is the Tesla Model 3 still available?',
    timestamp: '2026-01-21T07:45:00Z',
    read: false,
    type: 'sms',
  },
];

export const getLeadStatusColor = (status: LeadStatus): string => {
  const colors: Record<LeadStatus, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-purple-100 text-purple-700',
    qualified: 'bg-green-100 text-green-700',
    proposal: 'bg-amber-100 text-amber-700',
    won: 'bg-emerald-100 text-emerald-700',
    lost: 'bg-gray-100 text-gray-700',
  };
  return colors[status];
};
