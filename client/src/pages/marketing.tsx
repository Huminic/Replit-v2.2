/**
 * Marketing Department Dashboard
 *
 * Marketing-focused dashboard with campaign management and creative studio placeholder.
 * Cardinal layout rule: data in center, Automa AI chat in right pane.
 *
 * RBAC: Visible to marketing, org_admin, executive, partner_admin, super_admin.
 * Access gating handled by canAccessSection() in users.ts via Sidebar navigation.
 *
 * Tabs:
 *   - Dashboard: Marketing KPI metric tiles (campaign performance, leads generated, widget interactions, landing page visits)
 *   - Agents: Agent cards for marketing department AI agents
 *   - Campaigns: Same campaign table pattern as service.tsx with kill switch toggle per campaign
 *   - Studio: Placeholder for Wave 4 media creation tools (video, image, podcast, landing page builder)
 *   - Insights: Placeholder for Wave 2 campaign ROI and lead attribution analytics
 *
 * PRODUCTION NOTE: Widget interactions tracked via analytics events.
 * Landing page visits tracked via UTM params and /w/demo route analytics.
 * Campaigns use TextMagic (SMS) and Resend (email) APIs, same as service.
 */
import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { LayoutDashboard, Bot, BarChart3, Megaphone, Palette, TrendingUp, TrendingDown, MousePointerClick, Globe, Users, Target, Upload, Power, PowerOff, Ban, Loader2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/contexts/AppContext';
import { getAgentStatusColor } from '@/lib/agent-utils';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Campaign as APICampaign, Agent } from '@shared/schema';

/** Sub-navigation tabs for the marketing page — includes Studio (Wave 4) */
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'studio', label: 'Studio', icon: Palette },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
];

interface DashboardMetrics {
  conversationCounts: { total: number; open: number; closed: number; byChannel: Record<string, number> };
  messageCounts: { total: number; last30Days: number };
  campaignStats: { total: number; active: number; totalSent: number; totalReplied: number; replyRate: number; byDepartment: Record<string, { total: number; active: number; sent: number; replied: number; replyRate: number }> };
  agentCounts: { total: number; active: number; byDepartment: Record<string, number> };
  userCounts: { total: number; active: number };
}

/** Color mapping for campaign status indicators — same pattern used in service.tsx */
const campaignStatusColors: Record<string, string> = {
  active: 'bg-green-500',
  paused: 'bg-amber-500',
  draft: 'bg-gray-400',
  completed: 'bg-blue-500',
};

export default function MarketingPage() {
  const [, setLocation] = useLocation();
  const { communicationGateEnabled, setSelectedAgent } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/metrics/dashboard'],
  });

  const marketingMetrics = useMemo(() => {
    const mkt = metrics?.campaignStats?.byDepartment?.marketing;
    const totalConversations = metrics?.conversationCounts?.total ?? 0;
    return [
      { id: 'mm-1', label: 'Campaign Performance', value: `${mkt?.replyRate ?? 0}%`, icon: Target },
      { id: 'mm-2', label: 'Active Campaigns', value: String(mkt?.active ?? 0), icon: Megaphone },
      { id: 'mm-3', label: 'Total Messages', value: String(mkt?.sent ?? 0), icon: MousePointerClick },
      { id: 'mm-4', label: 'Conversations', value: String(totalConversations), icon: Globe },
    ];
  }, [metrics]);

  const { data: marketingAgents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents?department=marketing'],
  });

  const { data: marketingCampaigns = [], isLoading: campaignsLoading } = useQuery<APICampaign[]>({
    queryKey: ['/api/campaigns?department=marketing'],
  });

  const killSwitchMutation = useMutation({
    mutationFn: async ({ id, killSwitch }: { id: string; killSwitch: boolean }) => {
      await apiRequest('PATCH', `/api/campaigns/${id}`, { killSwitch });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns?department=marketing'] });
    },
  });

  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Marketing Dashboard</h2>
        <p className="text-sm text-muted-foreground">Campaign performance and lead generation metrics</p>
      </div>
      {metricsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {marketingMetrics.map(metric => (
          <Card key={metric.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`metric-tile-${metric.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  );

  /** Agents tab — marketing department AI agent cards */
  const renderAgents = () => (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-semibold">Marketing Agents</h2>
      {agentsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketingAgents.map(agent => (
            <Card key={agent.id} className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`agent-card-${agent.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-pink-500 text-white text-sm">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground">{agent.channels?.[0] || 'voice'}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAgent(agent);
                      setLocation('/agents');
                    }}
                    data-testid={`button-agent-settings-${agent.id}`}
                  >
                    <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <div className={cn('w-2.5 h-2.5 rounded-full', getAgentStatusColor(agent.status))} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  /**
   * Campaigns tab — same campaign table pattern as service.tsx.
   * Includes kill switch toggle per campaign and "Communications Paused" badge when global gate is OFF.
   */
  const renderCampaigns = () => (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Marketing Campaigns</h2>
        <div className="flex items-center gap-3">
          {!communicationGateEnabled && (
            <Badge variant="destructive" className="gap-1">
              <PowerOff className="h-3 w-3" />
              Communications Paused
            </Badge>
          )}
          <Button size="sm" data-testid="button-new-marketing-campaign">New Campaign</Button>
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
            {marketingCampaigns.map(campaign => (
              <tr key={campaign.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors" data-testid={`campaign-row-${campaign.id}`}>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{campaign.name}</p>
                    {campaign.csvFilename && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Upload className="h-3 w-3" /> {campaign.csvFilename}
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
    </div>
  );

  /** Studio tab — placeholder for Wave 4 media creation tools (video, image, podcast, landing page builder) */
  const renderStudio = () => (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <Palette className="h-12 w-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-medium">Marketing Studio</h3>
        <p className="text-sm text-muted-foreground max-w-sm">Create videos, images, podcasts, and landing pages for your marketing campaigns. Coming in Wave 4.</p>
        <Badge variant="secondary">Coming Soon</Badge>
      </div>
    </div>
  );

  /** Insights tab — placeholder for Wave 2 campaign ROI, lead attribution, and conversion funnel analytics */
  const renderInsights = () => (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-medium">Marketing Insights</h3>
        <p className="text-sm text-muted-foreground max-w-sm">Campaign ROI, lead attribution, channel performance, and conversion funnel analytics.</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full" data-testid="marketing-page">
      <div className="border-b border-border px-6 pt-4">
        <h1 className="text-xl font-semibold mb-3">Marketing</h1>
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
              data-testid={`tab-marketing-${tab.id}`}
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
        {activeTab === 'studio' && renderStudio()}
        {activeTab === 'insights' && renderInsights()}
      </ScrollArea>
    </div>
  );
}
