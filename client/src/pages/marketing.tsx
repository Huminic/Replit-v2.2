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
 *   - Studio: Creative studio with category filter pills and media gallery
 *   - Insights: Placeholder for Wave 2 campaign ROI and lead attribution analytics
 *
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { LayoutDashboard, Bot, BarChart3, Megaphone, Palette, MousePointerClick, Globe, Target } from 'lucide-react';
import InsightsPage from '@/pages/insights';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useApp } from '@/contexts/AppContext';
import { useQuery } from '@tanstack/react-query';
import AgentChatView from '@/components/marketing/AgentChatView';
import StudioGallery from '@/components/marketing/StudioGallery';
import { MARKETING_AGENTS, getSessionsForAgent, timeAgo } from '@/lib/marketing-agents';

interface MarketingMetricTile {
  id: string;
  label: string;
  value: string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'agents', label: 'Agents', icon: Bot },
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

export default function MarketingPage() {
  const [currentLocation, setLocation] = useLocation();
  const { currentOrganization } = useApp();
  const orgId = currentOrganization?.id;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMetric, setSelectedMetric] = useState<MarketingMetricTile | null>(null);
  const [studioFilter, setStudioFilter] = useState('all');
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [activeArtifactRef, setActiveArtifactRef] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const agentParam = params.get('agent');
    const sessionParam = params.get('session');
    const artifactRefParam = params.get('artifactRef');
    if (tab) setActiveTab(tab);
    if (agentParam && MARKETING_AGENTS.find(a => a.id === agentParam)) {
      setActiveAgentId(agentParam);
    }
    if (sessionParam) setActiveSessionId(sessionParam);
    if (artifactRefParam) setActiveArtifactRef(artifactRefParam);
  }, [currentLocation]);

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/metrics/dashboard', orgId],
  });

  // Fallback logic (intentional): uses marketing-specific stats from campaignStats.byDepartment.marketing
  // when available, otherwise falls back to org-wide campaignStats. This ensures tiles always show data
  // even when marketing-specific campaign data hasn't been segmented yet. (S-5.AC12)
  const mktStats = metrics?.campaignStats?.byDepartment?.marketing;
  // NOTE: change/trend data is not provided by /api/metrics/dashboard. Omitting change/trend
  // properties until the backend supports period-over-period comparison. (I-113)
  const marketingMetrics: MarketingMetricTile[] = [
    { id: 'mm-1', label: 'Campaign Performance', value: `${mktStats?.replyRate ?? metrics?.campaignStats?.replyRate ?? 0}%`, icon: Target },
    { id: 'mm-2', label: 'Campaigns Active', value: String(mktStats?.active ?? metrics?.campaignStats?.active ?? 0), icon: Megaphone },
    { id: 'mm-3', label: 'Messages Sent', value: String(mktStats?.sent ?? metrics?.campaignStats?.totalSent ?? 0), icon: MousePointerClick },
    { id: 'mm-4', label: 'Replies Received', value: String(mktStats?.replied ?? metrics?.campaignStats?.totalReplied ?? 0), icon: Globe },
  ];

  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Marketing Dashboard</h2>
        <p className="text-sm text-muted-foreground">Campaign performance and lead generation metrics</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {marketingMetrics.map(metric => (
          <Card key={metric.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`metric-tile-${metric.id}`} onClick={() => setSelectedMetric(metric)}>
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
    </div>
  );

  /** Agents tab — 5 marketing agent launcher cards (metric-card style) */
  const renderAgents = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" data-testid="text-agents-title">Marketing Agents</h2>
          <p className="text-sm text-muted-foreground">AI-powered creative tools for your dealership</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MARKETING_AGENTS.map(agentDef => {
          const sessions = getSessionsForAgent(agentDef.id);
          const lastSession = sessions[0];
          const AgentIcon = agentDef.icon;
          return (
            <div
              key={agentDef.id}
              className={cn(
                'relative rounded-xl border border-border bg-gradient-to-br cursor-pointer hover-elevate group transition-shadow duration-200',
                agentDef.gradient
              )}
              style={{ '--agent-glow': agentDef.glowColor } as React.CSSProperties}
              onClick={() => {
                setActiveAgentId(agentDef.id);
                setActiveSessionId(null);
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 30px ${agentDef.glowColor}`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
              data-testid={`agent-card-${agentDef.id}`}
            >
              <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.07] -mr-4 -mt-4">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                  <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
                  <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="1" className="text-foreground" />
                </svg>
              </div>

              <div className="relative p-4 flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: agentDef.accentColor + '20' }}
                >
                  <AgentIcon className="h-5 w-5" style={{ color: agentDef.accentColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground" data-testid={`text-agent-name-${agentDef.id}`}>{agentDef.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5" data-testid={`text-agent-desc-${agentDef.id}`}>{agentDef.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-muted-foreground" data-testid={`text-agent-sessions-${agentDef.id}`}>
                      {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                    </span>
                    {lastSession && (
                      <span className="text-[10px] text-muted-foreground" data-testid={`text-agent-last-used-${agentDef.id}`}>
                        Last used {timeAgo(lastSession.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const studioFilterCategories = ['All', 'Images', 'Videos', 'Copy', 'Scores', 'Voiceovers', 'Radar'];

  const renderStudio = () => (
    <div className="p-6 space-y-4">
      <div className="flex gap-2 flex-wrap mb-3" data-testid="studio-filter-pills">
        {studioFilterCategories.map(cat => (
          <button
            key={cat}
            onClick={() => setStudioFilter(cat.toLowerCase())}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              studioFilter === cat.toLowerCase()
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
            data-testid={`studio-filter-${cat.toLowerCase()}`}
          >
            {cat}
          </button>
        ))}
      </div>
      <StudioGallery />
    </div>
  );

  const renderInsights = () => (
    <InsightsPage embedded />
  );

  return (
    <div className="flex flex-col h-full" data-testid="marketing-page">
      {activeAgentId ? (
        <AgentChatView
          agentId={activeAgentId}
          sessionId={activeSessionId ?? undefined}
          artifactRef={activeArtifactRef ?? undefined}
          onBack={() => { setActiveAgentId(null); setActiveSessionId(null); setActiveArtifactRef(null); }}
        />
      ) : (
        <>
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
            {activeTab === 'studio' && renderStudio()}
            {activeTab === 'insights' && renderInsights()}
          </ScrollArea>
        </>
      )}

      <Dialog open={!!selectedMetric} onOpenChange={(open) => !open && setSelectedMetric(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto" data-testid="dialog-metric-detail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="text-metric-detail-title">
              {selectedMetric?.label}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Detailed breakdown of this marketing metric
            </DialogDescription>
          </DialogHeader>
          {selectedMetric && (
            <div className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-foreground" data-testid="text-metric-detail-value">{selectedMetric.value}</span>
              </div>
              <div className="border-t border-border pt-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Metric Info</h4>
                <div className="space-y-1">
                  <div className="py-1.5 px-2 rounded-md hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-medium">Current Value</span>
                      <span className="text-sm font-semibold text-foreground">{selectedMetric.value}</span>
                    </div>
                  </div>
                  <div className="py-1.5 px-2 rounded-md hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-medium">Department</span>
                      <span className="text-sm font-semibold text-foreground">Marketing</span>
                    </div>
                  </div>
                  <div className="py-1.5 px-2 rounded-md hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-medium">Data Source</span>
                      <span className="text-sm font-semibold text-foreground">Dashboard Metrics API</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
