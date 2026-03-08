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

export function mapActivityLogToItem(log: {
  id: string;
  userId: string | null;
  organizationId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: unknown;
  createdAt: string | Date;
}): ActivityItem {
  const entityType = log.entityType || 'system';
  let type: ActivityType = 'system';
  if (entityType === 'user' || entityType === 'session') type = 'user';
  else if (entityType === 'agent' || entityType === 'campaign' || entityType === 'conversation') type = 'agent';

  const action = (log.action || 'updated') as ActivityAction;
  const meta = (log.metadata && typeof log.metadata === 'object' ? log.metadata : {}) as Record<string, string | number>;
  const actor = (meta.targetName as string) || (meta.agentName as string) || entityType;
  const target = log.entityId || '';
  const description = log.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return {
    id: log.id,
    type,
    action,
    actor,
    target,
    description,
    timestamp: typeof log.createdAt === 'string' ? log.createdAt : log.createdAt.toISOString(),
    metadata: meta,
  };
}

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
