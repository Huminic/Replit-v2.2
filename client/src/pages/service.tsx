/**
 * Service Department Dashboard
 *
 * Service-focused dashboard with campaign management capabilities.
 * Cardinal layout rule: data in center, Automa AI chat in right pane.
 *
 * RBAC: Visible to service, org_admin, executive, partner_admin, super_admin.
 * Access gating handled by canAccessSection() in users.ts via Sidebar navigation.
 *
 * Tabs:
 *   - Dashboard: Service KPI metric tiles (active campaigns, messages sent, replies, appointments, declined services, upsell rate)
 *   - Agents: Agent cards for service department AI agents
 *   - Campaigns: Campaign table with CSV upload info, status, channel, recipient/sent/replied counts, kill switch toggle.
 *     Shows "Communications Paused" badge when global communication gate is OFF (communicationGateEnabled from AppContext).
 *     Campaign Safety card explains kill switch and per-conversation disconnect in TeamBox.
 *   - Insights: Placeholder for Wave 2 service analytics
 *   - Calendar: Placeholder for Wave 2 service appointment scheduling
 *
 * Kill Switch: Toggle to immediately stop all outbound messages for a campaign.
 * CRITICAL FEATURE — added after spam incident. Each campaign row has its own toggle.
 *
 * PRODUCTION NOTE: Campaigns will use TextMagic (SMS) and Resend (email) APIs.
 * Currently uses getCampaignsByDepartment() from mock data.
 */
import { useState } from 'react';
import { LayoutDashboard, Bot, BarChart3, Calendar as CalendarIcon, Megaphone, TrendingUp, TrendingDown, MessageSquare, CalendarCheck, ThumbsDown, DollarSign, Upload, Power, PowerOff, Ban, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/contexts/AppContext';
import { getAgentStatusColor } from '@/mocks/agents';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Campaign as APICampaign, Agent } from '@shared/schema';

/** Sub-navigation tabs for the service page */
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

/**
 * Service KPI metric tiles — active campaigns, messages sent, replies received,
 * appointments booked, declined services, upsell rate.
 * PRODUCTION NOTE: Will be fetched from backend API aggregating TextMagic + Resend data.
 */
const serviceMetrics = [
  { id: 'svm-1', label: 'Active Campaigns', value: '3', change: 1, trend: 'up' as const, icon: Megaphone },
  { id: 'svm-2', label: 'Messages Sent', value: '456', change: 23, trend: 'up' as const, icon: MessageSquare },
  { id: 'svm-3', label: 'Replies Received', value: '89', change: 12, trend: 'up' as const, icon: MessageSquare },
  { id: 'svm-4', label: 'Appointments Booked', value: '34', change: 8, trend: 'up' as const, icon: CalendarCheck },
  { id: 'svm-5', label: 'Declined Services', value: '12', change: -2, trend: 'down' as const, icon: ThumbsDown },
  { id: 'svm-6', label: 'Upsell Rate', value: '22%', change: 3, trend: 'up' as const, icon: DollarSign },
];

/** Color mapping for campaign status indicators — used in both service.tsx and marketing.tsx */
const campaignStatusColors: Record<string, string> = {
  active: 'bg-green-500',
  paused: 'bg-amber-500',
  draft: 'bg-gray-400',
  completed: 'bg-blue-500',
};

export default function ServicePage() {
  const { communicationGateEnabled } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: serviceAgents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents?department=service'],
  });

  const { data: serviceCampaigns = [], isLoading: campaignsLoading } = useQuery<APICampaign[]>({
    queryKey: ['/api/campaigns?department=service'],
  });

  const killSwitchMutation = useMutation({
    mutationFn: async ({ id, killSwitch }: { id: string; killSwitch: boolean }) => {
      await apiRequest('PATCH', `/api/campaigns/${id}`, { killSwitch });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns?department=service'] });
    },
  });

  /** Dashboard tab — service KPI metric tiles in a responsive grid */
  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Service Dashboard</h2>
        <p className="text-sm text-muted-foreground">Service department performance and campaign metrics</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceMetrics.map(metric => (
          <Card key={metric.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`metric-tile-${metric.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{metric.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={cn('text-xs', metric.trend === 'up' ? 'text-green-500' : 'text-red-500')}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </span>
                <span className="text-xs text-muted-foreground">vs last week</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  /** Agents tab — service department AI agent cards */
  const renderAgents = () => {
    if (agentsLoading) {
      return (
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Service Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                    <Skeleton className="h-2.5 w-2.5 rounded-full" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-2 w-4/5 mt-1" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Service Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviceAgents.map(agent => (
            <Card key={agent.id} className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`agent-card-${agent.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white text-sm">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground">{agent.channels?.[0] || 'voice'}</p>
                  </div>
                  <div className={cn('w-2.5 h-2.5 rounded-full', getAgentStatusColor(agent.status))} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Campaigns tab — campaign table with CSV upload info, status, channel,
   * recipient/sent/replied counts, and per-campaign kill switch toggle.
   * Shows "Communications Paused" destructive badge when global communication gate is OFF.
   * Campaign Safety card at bottom explains kill switch behavior and per-conversation disconnect in TeamBox.
   */
  const renderCampaigns = () => (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Service Campaigns</h2>
        <div className="flex items-center gap-3">
          {!communicationGateEnabled && (
            <Badge variant="destructive" className="gap-1">
              <PowerOff className="h-3 w-3" />
              Communications Paused
            </Badge>
          )}
          <Button size="sm" data-testid="button-new-campaign">
            New Campaign
          </Button>
        </div>
      </div>

      {campaignsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Campaign</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Channel</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Recipients</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Sent</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Replied</th>
              <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Kill Switch</th>
            </tr>
          </thead>
          <tbody>
            {serviceCampaigns.map(campaign => (
              <tr key={campaign.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors" data-testid={`campaign-row-${campaign.id}`}>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{campaign.name}</p>
                    {campaign.csvFilename && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Upload className="h-3 w-3" />
                        {campaign.csvFilename}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-2 h-2 rounded-full', campaignStatusColors[campaign.status])} />
                    <span className="text-sm capitalize">{campaign.status}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-[10px]">{campaign.channel.toUpperCase()}</Badge>
                </td>
                <td className="px-4 py-3 text-right text-sm">{campaign.recipientCount}</td>
                <td className="px-4 py-3 text-right text-sm">{campaign.sentCount}</td>
                <td className="px-4 py-3 text-right text-sm">{campaign.repliedCount}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center">
                    <Switch
                      checked={!campaign.killSwitch}
                      onCheckedChange={(checked) => killSwitchMutation.mutate({ id: campaign.id, killSwitch: !checked })}
                      className="data-[state=unchecked]:bg-red-500"
                      data-testid={`switch-killswitch-${campaign.id}`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Ban className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Campaign Safety</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              Use the Kill Switch to immediately stop all outbound messages for a campaign. 
              Individual conversations can also be disconnected from campaigns in TeamBox.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  /** Insights tab — placeholder for Wave 2 service performance analytics and appointment trends */
  const renderInsights = () => (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-medium">Service Insights</h3>
        <p className="text-sm text-muted-foreground max-w-sm">Service performance analytics, appointment trends, and campaign effectiveness reports.</p>
      </div>
    </div>
  );

  /** Calendar tab — placeholder for Wave 2 service appointment scheduling and bay availability */
  const renderCalendar = () => (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-medium">Service Calendar</h3>
        <p className="text-sm text-muted-foreground max-w-sm">Service appointments, maintenance schedules, and service bay availability.</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full" data-testid="service-page">
      <div className="border-b border-border px-6 pt-4">
        <h1 className="text-xl font-semibold mb-3">Service</h1>
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
              data-testid={`tab-service-${tab.id}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'agents' && renderAgents()}
        {activeTab === 'campaigns' && renderCampaigns()}
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'calendar' && renderCalendar()}
      </ScrollArea>
    </div>
  );
}
