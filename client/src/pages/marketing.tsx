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
import { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { LayoutDashboard, Bot, BarChart3, Megaphone, Palette, TrendingUp, TrendingDown, MousePointerClick, Globe, Users, Target, Upload, Power, PowerOff, Ban, Loader2, Settings, Play, Square, Eye } from 'lucide-react';
import InsightsPage from '@/pages/insights';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { getAgentStatusColor } from '@/lib/agent-utils';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Campaign as APICampaign, Agent } from '@shared/schema';
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
  const [currentLocation, setLocation] = useLocation();
  const { communicationGateEnabled, setSelectedAgent, setRightPaneOpen, currentOrganization } = useApp();
  const orgId = currentOrganization?.id;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMetric, setSelectedMetric] = useState<MarketingMetricTile | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvUploadCampaignId, setCsvUploadCampaignId] = useState<string | null>(null);
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignChannel, setNewCampaignChannel] = useState('sms');
  const [newCampaignTemplate, setNewCampaignTemplate] = useState('');
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

  const createCampaignMutation = useMutation({
    mutationFn: async (data: { name: string; department: string; channel: string; messageTemplate: string }) => {
      const res = await apiRequest('POST', '/api/campaigns', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns?department=marketing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/metrics/dashboard'] });
      toast({ title: "Campaign Created", description: "Your new marketing campaign has been created." });
      setNewCampaignOpen(false);
      setNewCampaignName('');
      setNewCampaignChannel('sms');
      setNewCampaignTemplate('');
    },
    onError: (err: Error) => {
      toast({ title: "Failed to Create Campaign", description: err.message, variant: "destructive" });
    },
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/metrics/dashboard', orgId],
  });

  const mktStats = metrics?.campaignStats?.byDepartment?.marketing;
  const marketingMetrics: MarketingMetricTile[] = [
    { id: 'mm-1', label: 'Campaign Performance', value: `${mktStats?.replyRate ?? metrics?.campaignStats?.replyRate ?? 0}%`, change: 0, trend: 'up' as const, icon: Target },
    { id: 'mm-2', label: 'Campaigns Active', value: String(mktStats?.active ?? metrics?.campaignStats?.active ?? 0), change: 0, trend: 'up' as const, icon: Megaphone },
    { id: 'mm-3', label: 'Messages Sent', value: String(mktStats?.sent ?? metrics?.campaignStats?.totalSent ?? 0), change: 0, trend: 'up' as const, icon: MousePointerClick },
    { id: 'mm-4', label: 'Replies Received', value: String(mktStats?.replied ?? metrics?.campaignStats?.totalReplied ?? 0), change: 0, trend: 'up' as const, icon: Globe },
  ];

  const { data: marketingAgents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents?department=marketing', orgId],
  });

  const { data: marketingCampaigns = [], isLoading: campaignsLoading } = useQuery<APICampaign[]>({
    queryKey: ['/api/campaigns?department=marketing', orgId],
  });

  const killSwitchMutation = useMutation({
    mutationFn: async ({ id, killSwitch }: { id: string; killSwitch: boolean }) => {
      await apiRequest('PATCH', `/api/campaigns/${id}`, { killSwitch });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns?department=marketing'] });
    },
  });

  const csvUploadMutation = useMutation({
    mutationFn: async ({ campaignId, file }: { campaignId: string; file: File }) => {
      const token = localStorage.getItem("nexxus_access_token");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/campaigns/${campaignId}/upload-csv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Upload failed" }));
        let errorMsg = err.message;
        if (err.missingRequired?.length) {
          errorMsg += `. Missing required columns: ${err.missingRequired.join(", ")}`;
        }
        throw new Error(errorMsg);
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns?department=marketing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/metrics/dashboard'] });
      let description = `${data.recipientCount} recipients loaded.`;
      if (data.warnings && data.warnings.length > 0) {
        description += ` ${data.warnings.join(". ")}`;
      }
      toast({
        title: data.warnings?.length ? "CSV Uploaded with Warnings" : "CSV Uploaded",
        description,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    },
  });

  const { data: executionStatuses = {} } = useQuery<Record<string, { campaignId: string; status: string; totalRecipients: number; processed: number; sent: number; blocked: number; failed: number; dryRun: boolean }>>({
    queryKey: ['/api/campaigns/execution-statuses', orgId],
    refetchInterval: 3000,
  });

  const executeMutation = useMutation({
    mutationFn: async ({ id, dryRun }: { id: string; dryRun: boolean }) => {
      await apiRequest('POST', `/api/campaigns/${id}/execute`, { dryRun });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns?department=marketing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/execution-statuses'] });
      toast({ title: variables.dryRun ? "Dry Run Started" : "Campaign Started", description: variables.dryRun ? "Preview mode — no messages will be sent." : "Campaign is now executing." });
    },
    onError: (err: Error) => {
      toast({ title: "Execution Failed", description: err.message, variant: "destructive" });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await apiRequest('POST', `/api/campaigns/${id}/stop`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns?department=marketing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/execution-statuses'] });
      toast({ title: "Campaign Stopped", description: "Campaign execution has been stopped." });
    },
    onError: (err: Error) => {
      toast({ title: "Stop Failed", description: err.message, variant: "destructive" });
    },
  });

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
          <Button size="sm" data-testid="button-new-marketing-campaign" onClick={() => setNewCampaignOpen(true)}>New Campaign</Button>
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
              <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
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
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {(() => {
                      const execStatus = executionStatuses[campaign.id];
                      const isExecuting = execStatus?.status === "executing";
                      return (
                        <>
                          {isExecuting ? (
                            <>
                              <Badge variant="secondary" className="text-[10px] gap-1">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                {execStatus.processed}/{execStatus.totalRecipients}
                                {execStatus.dryRun ? " (dry)" : ""}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => stopMutation.mutate({ id: campaign.id })}
                                disabled={stopMutation.isPending}
                                data-testid={`button-stop-campaign-${campaign.id}`}
                              >
                                <Square className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => executeMutation.mutate({ id: campaign.id, dryRun: false })}
                                disabled={executeMutation.isPending || campaign.recipientCount === 0}
                                data-testid={`button-start-campaign-${campaign.id}`}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => executeMutation.mutate({ id: campaign.id, dryRun: true })}
                                disabled={executeMutation.isPending || campaign.recipientCount === 0}
                                data-testid={`button-dryrun-campaign-${campaign.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCsvUploadCampaignId(campaign.id);
                              csvInputRef.current?.click();
                            }}
                            disabled={csvUploadMutation.isPending}
                            data-testid={`button-upload-csv-${campaign.id}`}
                          >
                            {csvUploadMutation.isPending && csvUploadCampaignId === campaign.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <Dialog open={newCampaignOpen} onOpenChange={setNewCampaignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Marketing Campaign</DialogTitle>
            <DialogDescription>Set up a new outbound campaign for the marketing department.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="mkt-campaign-name">Campaign Name</Label>
              <Input
                id="mkt-campaign-name"
                data-testid="input-marketing-campaign-name"
                placeholder="e.g. Spring Promo Blast"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mkt-campaign-channel">Channel</Label>
              <Select value={newCampaignChannel} onValueChange={setNewCampaignChannel}>
                <SelectTrigger data-testid="select-marketing-campaign-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mkt-campaign-template">Message Template</Label>
              <Textarea
                id="mkt-campaign-template"
                data-testid="input-marketing-campaign-template"
                placeholder="Hi {firstName}, check out our latest offers..."
                value={newCampaignTemplate}
                onChange={(e) => setNewCampaignTemplate(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCampaignOpen(false)} data-testid="button-cancel-marketing-campaign">
              Cancel
            </Button>
            <Button
              onClick={() => createCampaignMutation.mutate({ name: newCampaignName, department: 'marketing', channel: newCampaignChannel, messageTemplate: newCampaignTemplate })}
              disabled={!newCampaignName.trim() || createCampaignMutation.isPending}
              data-testid="button-submit-marketing-campaign"
            >
              {createCampaignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderStudio = () => (
    <StudioGallery />
  );

  const renderInsights = () => (
    <InsightsPage embedded />
  );

  return (
    <div className="flex flex-col h-full" data-testid="marketing-page">
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        data-testid="input-csv-upload-marketing"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && csvUploadCampaignId) {
            csvUploadMutation.mutate({ campaignId: csvUploadCampaignId, file });
          }
          e.target.value = '';
        }}
      />

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
            {activeTab === 'campaigns' && renderCampaigns()}
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
