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
