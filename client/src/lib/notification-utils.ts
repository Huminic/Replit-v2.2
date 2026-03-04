export type NotificationType = 'alert' | 'task' | 'approval' | 'system' | 'mention';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export const staticNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'alert',
    title: 'Low Credits Warning',
    message: 'Your AI credits are running low. Consider upgrading your plan.',
    timestamp: '2026-01-21T10:00:00Z',
    read: false,
    actionUrl: '/profile/billing',
  },
  {
    id: 'notif-2',
    type: 'approval',
    title: 'Agent Approval Required',
    message: 'The "Lead Qualifier" agent requires your approval before activation.',
    timestamp: '2026-01-21T09:30:00Z',
    read: false,
    actionUrl: '/agents/agent-4',
  },
  {
    id: 'notif-3',
    type: 'task',
    title: 'Task Assigned',
    message: 'Sarah Johnson assigned you a new task: "Review Q1 Sales Report"',
    timestamp: '2026-01-21T08:45:00Z',
    read: false,
    actionUrl: '/work-center/tasks',
  },
  {
    id: 'notif-4',
    type: 'mention',
    title: 'You were mentioned',
    message: 'Mike Chen mentioned you in a comment on "Monthly Goals"',
    timestamp: '2026-01-20T17:20:00Z',
    read: true,
    actionUrl: '/insights/goals',
  },
  {
    id: 'notif-5',
    type: 'system',
    title: 'Agent Update Complete',
    message: 'Your "Sales Agent" has been successfully updated with new skills.',
    timestamp: '2026-01-20T14:00:00Z',
    read: true,
    actionUrl: '/agents/agent-1',
  },
  {
    id: 'notif-6',
    type: 'system',
    title: 'Weekly Report Ready',
    message: 'Your weekly activity report is now available.',
    timestamp: '2026-01-19T09:00:00Z',
    read: true,
    actionUrl: '/insights',
  },
];

export const getNotificationIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    alert: 'AlertTriangle',
    task: 'CheckSquare',
    approval: 'CheckCircle',
    system: 'Settings',
    mention: 'AtSign',
  };
  return icons[type];
};

export const getNotificationColor = (type: NotificationType): string => {
  const colors: Record<NotificationType, string> = {
    alert: 'text-amber-500',
    task: 'text-blue-500',
    approval: 'text-purple-500',
    system: 'text-gray-500',
    mention: 'text-green-500',
  };
  return colors[type];
};
