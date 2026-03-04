/**
 * notifications.ts — User notification data for Nexxus V2
 *
 * Notifications appear in the TopBar.tsx bell icon dropdown with unread count badge.
 * Each notification has an optional actionUrl for navigation on click.
 *
 * Notification types:
 *  - alert: Warnings requiring attention (e.g., low credits)
 *  - task: Task assignments from other users
 *  - approval: Items requiring admin approval (agent activation, expenses)
 *  - system: Automated system notifications (agent updates, reports ready)
 *  - mention: User was @mentioned in a comment or conversation
 *
 * Unread count tracked in AppContext (unreadNotificationCount) and displayed
 * as a badge on the bell icon in TopBar.
 *
 * PRODUCTION NOTE: Notifications will be pushed via WebSocket and persisted in the database.
 * Mark-as-read state synced with backend.
 */

/** Notification category — determines icon and color in the dropdown */
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

/** 6 mock notifications — 3 unread, 3 read — covering all notification types */
export const mockNotifications: Notification[] = [
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

/** Maps notification type to lucide-react icon name */
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

/** Returns Tailwind text color class for notification type */
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
