export type ActivityType = 'user' | 'agent' | 'system';
export type ActivityAction = 
  | 'created' 
  | 'updated' 
  | 'deleted' 
  | 'activated' 
  | 'deactivated' 
  | 'completed' 
  | 'assigned' 
  | 'uploaded'
  | 'login'
  | 'logout'
  | 'call_started'
  | 'call_ended'
  | 'message_sent';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  action: ActivityAction;
  actor: string;
  target: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, string | number>;
}

export const staticActivityFeed: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'agent',
    action: 'call_ended',
    actor: 'Sales Agent',
    target: 'John Smith',
    description: 'Completed sales call with John Smith (3m 42s)',
    timestamp: '2026-01-21T10:45:00Z',
    metadata: { duration: 222, outcome: 'qualified_lead' },
  },
  {
    id: 'act-2',
    type: 'user',
    action: 'login',
    actor: 'Duane Wells',
    target: 'Nexxus V2',
    description: 'Logged in from Chrome on macOS',
    timestamp: '2026-01-21T09:00:00Z',
  },
  {
    id: 'act-3',
    type: 'agent',
    action: 'message_sent',
    actor: 'Support Agent',
    target: 'Customer #4521',
    description: 'Sent automated response to support inquiry',
    timestamp: '2026-01-21T08:30:00Z',
  },
  {
    id: 'act-4',
    type: 'user',
    action: 'created',
    actor: 'Sarah Johnson',
    target: 'Q1 Goals Report',
    description: 'Created new insight report',
    timestamp: '2026-01-20T16:00:00Z',
  },
  {
    id: 'act-5',
    type: 'system',
    action: 'completed',
    actor: 'System',
    target: 'Daily Backup',
    description: 'Automated daily backup completed successfully',
    timestamp: '2026-01-20T03:00:00Z',
  },
  {
    id: 'act-6',
    type: 'agent',
    action: 'activated',
    actor: 'Service Reminder',
    target: 'Scheduled Task',
    description: 'Sent 47 service reminders',
    timestamp: '2026-01-20T09:00:00Z',
    metadata: { sent: 47, failed: 2 },
  },
  {
    id: 'act-7',
    type: 'user',
    action: 'updated',
    actor: 'Duane Wells',
    target: 'Sales Agent',
    description: 'Updated agent instructions and triggers',
    timestamp: '2026-01-19T14:30:00Z',
  },
  {
    id: 'act-8',
    type: 'user',
    action: 'uploaded',
    actor: 'Mike Chen',
    target: 'Vehicle Photos',
    description: 'Uploaded 12 new vehicle photos to media library',
    timestamp: '2026-01-19T11:00:00Z',
    metadata: { files: 12 },
  },
  {
    id: 'act-9',
    type: 'agent',
    action: 'call_started',
    actor: 'Sales Agent',
    target: 'New Lead',
    description: 'Initiated outbound call to new website lead',
    timestamp: '2026-01-19T10:15:00Z',
  },
  {
    id: 'act-10',
    type: 'system',
    action: 'updated',
    actor: 'System',
    target: 'Knowledge Base',
    description: 'Auto-synced inventory data from DMS',
    timestamp: '2026-01-19T02:00:00Z',
    metadata: { vehicles: 156 },
  },
];

export const getActivityIcon = (type: ActivityType): string => {
  const icons: Record<ActivityType, string> = {
    user: 'User',
    agent: 'Bot',
    system: 'Server',
  };
  return icons[type];
};

export const getActivityColor = (type: ActivityType): string => {
  const colors: Record<ActivityType, string> = {
    user: 'bg-blue-500',
    agent: 'bg-purple-500',
    system: 'bg-gray-500',
  };
  return colors[type];
};
