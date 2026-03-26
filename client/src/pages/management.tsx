/**
 * Executive / Management Dashboard
 *
 * Cross-department KPI overview page for leadership roles.
 * Cardinal layout rule: data in center, Automa AI chat in right pane.
 *
 * RBAC: Visible to org_admin, executive, sales_manager, partner_admin, super_admin.
 * Access gating handled by canAccessSection() in users.ts via Sidebar navigation.
 *
 * Tabs:
 *   - Insights: Cross-department analytics and trend analysis
 *   - Hunches: AI-generated business insights ranked by confidence and impact. Each hunch has a pattern + recommendation format.
 *   - System Log: Recent team/agent actions across all departments
 *   - User Chats: View chat conversations by user across departments and agents
 *   - Billing: Organization billing dashboard (BillingDashboard component)
 *
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { BarChart3, Lightbulb, Activity, CreditCard, Target, Briefcase, Loader2, User, Bot, Server, Check, X, RotateCw, Sparkles, MessageSquare } from 'lucide-react';
import InsightsPage from '@/pages/insights';
import BillingDashboard from '@/pages/BillingDashboard';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { canAccessManagement } from '@/lib/rbac';
import type { ActivityLog, Hunch } from '@shared/schema';

/** Sub-navigation tabs for the management page */
const tabs = [
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'hunches', label: 'Hunches', icon: Lightbulb },
  { id: 'activities', label: 'System Log', icon: Activity },
  { id: 'user-chats', label: 'User Chats', icon: MessageSquare },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState('insights');
  const { toast } = useToast();
  const { currentOrganization, currentRole } = useApp();
  const [currentLocation, setLocation] = useLocation();
  const orgId = currentOrganization?.id;

  // Sync activeTab from URL ?tab= parameter (used by submenu navigation links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && tabs.some(t => t.id === tab)) setActiveTab(tab);
  }, [currentLocation]);

  // RBAC guard: redirect roles without management access (sales, service, marketing)
  useEffect(() => {
    if (!canAccessManagement(currentRole)) {
      setLocation('/');
    }
  }, [currentRole, setLocation]);

  const { data: activityLogs, isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/activity-log', orgId],
  });

  const { data: hunches, isLoading: hunchesLoading } = useQuery<Hunch[]>({
    queryKey: ['/api/hunches', orgId],
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/hunches/generate'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hunches'] });
      toast({ title: "Hunches generated", description: "AI analysis complete." });
    },
    onError: () => {
      toast({ title: "Generation failed", description: "Could not generate hunches.", variant: "destructive" });
    },
  });

  const updateHunchMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest('PATCH', `/api/hunches/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hunches'] });
    },
    onError: () => {
      toast({ title: "Update failed", description: "Could not update hunch.", variant: "destructive" });
    },
  });

  const renderInsights = () => (
    <InsightsPage embedded />
  );

  const renderHunches = () => (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold mb-1">AI Hunches</h2>
          <p className="text-sm text-muted-foreground">Pattern-based insights ranked by confidence</p>
        </div>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          data-testid="button-generate-hunches"
        >
          {generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          <span className="ml-1.5">{generateMutation.isPending ? 'Generating...' : 'Generate Hunches'}</span>
        </Button>
      </div>
      {hunchesLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hunches && hunches.length > 0 ? (
        <div className="space-y-3">
          {hunches.map(hunch => (
            <Card key={hunch.id} data-testid={`hunch-card-${hunch.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className={cn('h-5 w-5 flex-shrink-0', hunch.confidence >= 85 ? 'text-amber-500' : hunch.confidence >= 70 ? 'text-amber-400' : 'text-amber-300')} />
                    <h3 className="text-sm font-semibold">{hunch.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-[10px]">{hunch.type}</Badge>
                    <Badge variant="outline" className="text-[10px]">{hunch.confidence}%</Badge>
                    <Badge variant={hunch.status === 'accepted' ? 'default' : hunch.status === 'dismissed' ? 'destructive' : 'secondary'} className="text-[10px]">{hunch.status}</Badge>
                  </div>
                </div>
                <div className="space-y-2 ml-7">
                  <p className="text-sm">{hunch.description}</p>
                  {hunch.department && (
                    <p className="text-xs text-muted-foreground">Department: {hunch.department}</p>
                  )}
                  {hunch.status === 'new' && (
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateHunchMutation.mutate({ id: hunch.id, status: 'accepted' })}
                        disabled={updateHunchMutation.isPending}
                        data-testid={`button-accept-hunch-${hunch.id}`}
                      >
                        <Check className="h-3 w-3 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateHunchMutation.mutate({ id: hunch.id, status: 'dismissed' })}
                        disabled={updateHunchMutation.isPending}
                        data-testid={`button-dismiss-hunch-${hunch.id}`}
                      >
                        <X className="h-3 w-3 mr-1" /> Dismiss
                      </Button>
                    </div>
                  )}
                  {hunch.status === 'accepted' && (
                    <div className="pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateHunchMutation.mutate({ id: hunch.id, status: 'resolved' })}
                        disabled={updateHunchMutation.isPending}
                        data-testid={`button-resolve-hunch-${hunch.id}`}
                      >
                        <RotateCw className="h-3 w-3 mr-1" /> Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Lightbulb className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No hunches yet. Click Generate to create AI insights.</p>
        </div>
      )}
    </div>
  );

  const getActivityDescription = (log: ActivityLog): string => {
    const meta = (log.metadata || {}) as Record<string, any>;
    switch (log.action) {
      case 'user_created': return `Created user ${meta.targetName || meta.targetEmail || ''}`;
      case 'user_updated': return `Updated user profile (${meta.fields || ''})`;
      case 'agent_created': return `Created agent "${meta.agentName || ''}" in ${meta.department || 'unknown'} department`;
      case 'agent_updated': return `Updated agent "${meta.agentName || ''}" (${meta.fields || ''})`;
      case 'agent_deleted': return `Deleted agent "${meta.agentName || ''}"`;
      case 'campaign_created': return `Created campaign "${meta.campaignName || ''}" in ${meta.department || 'unknown'}`;
      case 'campaign_stopped': return `Stopped campaign "${meta.campaignName || ''}" (kill switch)`;
      case 'campaign_resumed': return `Resumed campaign "${meta.campaignName || ''}"`;
      case 'campaign_updated': return `Updated campaign "${meta.campaignName || ''}" (${meta.fields || ''})`;
      case 'organization_updated': return `Updated organization settings (${meta.fields || ''})`;
      case 'document_uploaded': return `Uploaded document "${meta.fileName || ''}" (${meta.fileType || ''})`;
      default: return log.action.replace(/_/g, ' ');
    }
  };

  const getActivityIconAndColor = (action: string): { icon: typeof Activity; color: string } => {
    if (action.startsWith('user_')) return { icon: User, color: 'bg-blue-500' };
    if (action.startsWith('agent_')) return { icon: Bot, color: 'bg-purple-500' };
    if (action.startsWith('campaign_')) return { icon: Target, color: 'bg-green-500' };
    if (action.startsWith('organization_')) return { icon: Briefcase, color: 'bg-amber-500' };
    if (action.startsWith('document_')) return { icon: Server, color: 'bg-gray-500' };
    return { icon: Activity, color: 'bg-gray-500' };
  };

  const renderActivities = () => (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">System Log</h2>
      {activityLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-md">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : activityLogs && activityLogs.length > 0 ? (
        <div className="space-y-2">
          {activityLogs.map(log => {
            const { icon: Icon, color } = getActivityIconAndColor(log.action);
            return (
              <div key={log.id} className="flex items-start gap-3 p-3 border border-border rounded-md" data-testid={`activity-item-${log.id}`}>
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', color)}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{getActivityDescription(log)}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </p>
                    {log.entityType && (
                      <Badge variant="secondary" className="text-[10px]">{log.entityType}</Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No activity recorded yet</p>
        </div>
      )}
    </div>
  );

  /** User Chats tab — placeholder for viewing user chat activity across all agents */
  const renderUserChats = () => (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-medium">User Chats</h3>
        <p className="text-sm text-muted-foreground max-w-sm">User chat activity — coming soon</p>
        <p className="text-xs text-muted-foreground">View and filter chat conversations by user across all departments and agents.</p>
      </div>
    </div>
  );

  /** Billing tab — renders the BillingDashboard component */
  const renderBilling = () => (
    <div data-testid="billing-tab-content">
      <BillingDashboard />
    </div>
  );

  return (
    <div className="flex flex-col h-full" data-testid="management-page">
      <div className="border-b border-border px-6 pt-4">
        <h1 className="text-xl font-semibold mb-3">Management</h1>
        <div className="flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-md transition-colors border-b-2',
                activeTab === tab.id
                  ? 'border-primary text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
              data-testid={`tab-mgmt-${tab.id}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'hunches' && renderHunches()}
        {activeTab === 'activities' && renderActivities()}
        {activeTab === 'user-chats' && renderUserChats()}
        {activeTab === 'billing' && renderBilling()}
      </ScrollArea>
    </div>
  );
}
