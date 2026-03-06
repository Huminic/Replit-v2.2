/**
 * Sales Department Dashboard
 *
 * Primary sales pipeline and performance page with tab navigation.
 * Cardinal layout rule: data displayed in center content area, Automa AI chat
 * available in the right pane (RightPane.tsx) for discussing sales data.
 *
 * RBAC: Visible to sales, sales_manager, org_admin, executive, partner_admin, super_admin.
 * Access gating handled by canAccessSection() in users.ts via Sidebar navigation.
 *
 * Tabs:
 *   - Dashboard: Metric tiles grid + top performing agents + recent activity feed
 *   - Agents: Agent cards for sales department. Click to select → opens AgentConfigPane in right pane
 *   - Insights: Placeholder for Wave 2 detailed analytics (lead scoring, conversion funnels)
 *   - Calendar: Placeholder for Wave 2 test drive / follow-up scheduling
 *
 * PRODUCTION NOTE: Metrics will wire to VinSolutions CRM data via MCP server.
 * Currently uses hardcoded salesMetrics array for mock display.
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { LayoutDashboard, Bot, BarChart3, Calendar as CalendarIcon, TrendingUp, TrendingDown, Users, Clock, Zap, Target, ArrowUpRight, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/contexts/AppContext';
import { getAgentStatusColor } from '@/lib/agent-utils';
import type { Agent } from '@shared/schema';

/** Sub-navigation tabs for the sales page — Dashboard/Agents/Insights/Calendar */
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

interface LeadSummary {
  period: { start: string; end: string };
  totalLeads: number;
  totalLeadsChange: number;
  newLeads: number;
  newLeadsChange: number;
  activeLeads: number;
  activeLeadsChange: number;
  soldLeads: number;
  soldLeadsChange: number;
  lostLeads: number;
  waitingForResponse: number;
  appointments: number;
  conversionRate: number;
  source: string;
  syncedAt?: string | null;
}

function formatSyncAge(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function buildSalesMetrics(summary: LeadSummary | undefined) {
  if (!summary) return [];
  const t = (v: number) => (v >= 0 ? 'up' : 'down') as 'up' | 'down';
  return [
    { id: 'sm-1', label: 'Total Leads (30d)', value: String(summary.totalLeads), change: summary.totalLeadsChange, trend: t(summary.totalLeadsChange), icon: Target },
    { id: 'sm-2', label: 'New Leads', value: String(summary.newLeads), change: summary.newLeadsChange, trend: t(summary.newLeadsChange), icon: Users },
    { id: 'sm-3', label: 'Active Pipeline', value: String(summary.activeLeads), change: summary.activeLeadsChange, trend: t(summary.activeLeadsChange), icon: Zap },
    { id: 'sm-4', label: 'Waiting on Response', value: String(summary.waitingForResponse), change: 0, trend: 'up' as const, icon: Clock },
    { id: 'sm-5', label: 'Appointments Set', value: String(summary.appointments), change: 0, trend: 'up' as const, icon: ArrowUpRight },
    { id: 'sm-6', label: 'Sold', value: String(summary.soldLeads), change: summary.soldLeadsChange, trend: t(summary.soldLeadsChange), icon: TrendingUp },
    { id: 'sm-7', label: 'Conversion Rate', value: `${summary.conversionRate}%`, change: summary.conversionRate, trend: t(summary.conversionRate), icon: TrendingUp },
  ];
}

export default function SalesPage() {
  const [, setLocation] = useLocation();
  const { selectedAgent, setSelectedAgent, setRightPaneOpen } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const { data: salesAgents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents?department=sales'],
  });

  const { data: leadSummary, isLoading: summaryLoading } = useQuery<LeadSummary>({
    queryKey: ['/api/vin/leads/summary'],
  });

  const salesMetrics = buildSalesMetrics(leadSummary);

  /** Dashboard tab — metric tiles grid + top performing agents card + recent activity feed */
  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-1">Sales Dashboard</h2>
          <p className="text-sm text-muted-foreground">Real-time sales pipeline and performance metrics</p>
        </div>
        {leadSummary?.source && (
          <div className="flex items-center gap-2" data-testid="sync-status-indicator">
            <Badge variant="outline" className={cn(
              "text-[10px]",
              leadSummary.source === 'warehouse'
                ? "border-green-300 text-green-600 dark:text-green-400"
                : "border-blue-300 text-blue-600 dark:text-blue-400"
            )} data-testid="badge-vinsolutions-live">
              {leadSummary.source === 'warehouse' ? 'Warehouse' : 'VinSolutions Live'}
            </Badge>
            {leadSummary.syncedAt && (
              <span className="text-[10px] text-muted-foreground" data-testid="text-sync-age">
                Synced {formatSyncAge(leadSummary.syncedAt)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
          ))
        ) : (
          salesMetrics.map(metric => (
            <Card key={metric.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`metric-tile-${metric.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <metric.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold" data-testid={`metric-value-${metric.id}`}>{metric.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={cn('text-xs', metric.trend === 'up' ? 'text-green-500' : 'text-red-500')}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs last 30d</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Top Performing Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-5 h-4" />
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                    <Skeleton className="w-2 h-2 rounded-full" />
                  </div>
                ))
              ) : (
                salesAgents.filter(a => a.status === 'active').map((agent, i) => (
                  <div key={agent.id} className="flex items-center gap-3" data-testid={`top-agent-${agent.id}`}>
                    <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                        <Bot className="h-3.5 w-3.5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.channels?.[0] || 'voice'}</p>
                    </div>
                    <div className={cn('w-2 h-2 rounded-full', getAgentStatusColor(agent.status))} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: 'New lead from website', time: '5 min ago', type: 'lead' },
                { action: 'Sales Agent qualified lead #1042', time: '12 min ago', type: 'agent' },
                { action: 'Follow-up call completed', time: '28 min ago', type: 'call' },
                { action: 'Proposal sent to David Jackson', time: '1 hour ago', type: 'email' },
                { action: 'Test drive scheduled - Emily Davis', time: '2 hours ago', type: 'calendar' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-sm flex-1">{item.action}</span>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  /** Agents tab — agent cards for sales department. Click to select → opens AgentConfigPane in right pane */
  const renderAgents = () => {
    if (isLoading) {
      return (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Sales Agents</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-10 w-10 rounded-full mb-3" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sales Agents</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {salesAgents.map((agent) => (
            <Card
              key={agent.id}
              className={cn('cursor-pointer hover:shadow-md transition-shadow', selectedAgent?.id === agent.id && 'ring-2 ring-primary')}
              onClick={() => { setSelectedAgent(agent); setLocation('/agents'); }}
              data-testid={`agent-card-${agent.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-sm">
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
                      setRightPaneOpen(true);
                    }}
                    data-testid={`button-agent-settings-${agent.id}`}
                  >
                    <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <div className={cn('w-2.5 h-2.5 rounded-full', getAgentStatusColor(agent.status))} />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary" className="text-[10px]">{agent.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  /** Insights tab — placeholder for Wave 2 analytics (lead scoring, conversion funnels, pipeline velocity) */
  const renderInsights = () => (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-medium">Sales Insights</h3>
        <p className="text-sm text-muted-foreground max-w-sm">Detailed analytics and reports for your sales pipeline, lead scoring, and conversion metrics.</p>
      </div>
    </div>
  );

  /** Calendar tab — placeholder for Wave 2 test drive scheduling and follow-up appointments */
  const renderCalendar = () => (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto" />
        <h3 className="text-lg font-medium">Sales Calendar</h3>
        <p className="text-sm text-muted-foreground max-w-sm">Test drives, follow-up appointments, and sales team schedules.</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full" data-testid="sales-page">
      <div className="border-b border-border px-6 pt-4">
        <h1 className="text-xl font-semibold mb-3">Sales</h1>
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
              data-testid={`tab-sales-${tab.id}`}
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
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'calendar' && renderCalendar()}
      </ScrollArea>
    </div>
  );
}
