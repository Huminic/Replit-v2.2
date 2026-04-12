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
 *   - Campaigns (default): Campaign table with CSV upload info, status, channel, recipient/sent/replied counts, kill switch toggle.
 *     Shows "Communications Paused" badge when global communication gate is OFF (communicationGateEnabled from AppContext).
 *     Campaign Safety card explains kill switch and per-conversation disconnect in TeamBox.
 *     Prominent "New Campaign" and "Upload CSV" buttons at top. Row click opens campaign detail dialog.
 *   - Agents: Agent cards for service department AI agents
 *   - Insights: Service KPI metric tiles (active campaigns, messages sent, replies, etc.) plus embedded InsightsPage
 *   - Calendar: Service appointment scheduling
 *
 * Kill Switch: Toggle to immediately stop all outbound messages for a campaign.
 * CRITICAL FEATURE — added after spam incident. Each campaign row has its own toggle.
 *
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Bot, BarChart3, Calendar as CalendarIcon, Megaphone, MessageSquare, CalendarCheck, ThumbsDown, DollarSign, Upload, Download, Power, PowerOff, Loader2, Settings, Play, Square, Eye } from 'lucide-react';
import InsightsPage from '@/pages/insights';
import { AppointmentCalendar } from '@/components/AppointmentCalendar';
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
// Select removed — channel picker now uses checkboxes (I-132)
import { useApp } from '@/contexts/AppContext';
import { useUILayout } from '@/contexts/UILayoutContext';
import { getAgentStatusColor } from '@/lib/agent-utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Campaign as APICampaign, Agent } from '@shared/schema';
import { getAccessToken } from '@/lib/tokenStore';

interface ServiceMetricTile {
  id: string;
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs = [
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

interface DashboardMetrics {
  conversationCounts: { total: number; open: number; closed: number; byChannel: Record<string, number> };
  messageCounts: { total: number; last30Days: number };
  campaignStats: { total: number; active: number; totalSent: number; totalReplied: number; replyRate: number; byDepartment: Record<string, { total: number; active: number; sent: number; replied: number; replyRate: number }> };
  agentCounts: { total: number; active: number; byDepartment: Record<string, number> };
  userCounts: { total: number; active: number };
}

/** Color mapping for campaign status indicators — used in both service.tsx and marketing.tsx */
const campaignStatusColors: Record<string, string> = {
  active: 'bg-green-500',
  paused: 'bg-amber-500',
  draft: 'bg-gray-400',
  completed: 'bg-blue-500',
  scheduled: 'bg-purple-500',
};

export default function ServicePage() {
  const [currentLocation, setLocation] = useLocation();
  const searchString = useSearch();
  const { communicationGateEnabled, setSelectedAgent, currentOrganization } = useApp();
  const { setRightPaneOpen } = useUILayout();
  const orgId = currentOrganization?.id;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('campaigns');

  // Sync activeTab from URL ?tab= parameter (used by submenu navigation links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && tabs.some(t => t.id === tab)) setActiveTab(tab);
  }, [currentLocation, searchString]);
  const [selectedMetric, setSelectedMetric] = useState<ServiceMetricTile | null>(null);

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/metrics/dashboard', orgId],
  });

  const serviceStats = metrics?.campaignStats?.byDepartment?.service;
  const serviceMetrics: ServiceMetricTile[] = [
    { id: 'svm-1', label: 'Active Campaigns', value: String(serviceStats?.active ?? metrics?.campaignStats?.active ?? 0), icon: Megaphone },
    { id: 'svm-2', label: 'Messages Sent', value: String(serviceStats?.sent ?? metrics?.campaignStats?.totalSent ?? 0), icon: MessageSquare },
    { id: 'svm-3', label: 'Replies Received', value: String(serviceStats?.replied ?? metrics?.campaignStats?.totalReplied ?? 0), icon: MessageSquare },
    { id: 'svm-4', label: 'Open Conversations', value: String(metrics?.conversationCounts?.open ?? 0), icon: CalendarCheck },
    { id: 'svm-5', label: 'Total Conversations', value: String(metrics?.conversationCounts?.total ?? 0), icon: ThumbsDown },
    { id: 'svm-6', label: 'Reply Rate', value: `${serviceStats?.replyRate ?? metrics?.campaignStats?.replyRate ?? 0}%`, icon: DollarSign },
  ];

  const { data: serviceAgents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents?department=service', orgId],
  });

  const { data: serviceCampaigns = [], isLoading: campaignsLoading } = useQuery<APICampaign[]>({
    queryKey: ['/api/campaigns?department=service', orgId],
  });

  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvUploadCampaignId, setCsvUploadCampaignId] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<APICampaign | null>(null);

  // Fetch recipients when campaign detail dialog is open
  const { data: campaignRecipients = [], isLoading: recipientsLoading } = useQuery<Array<{
    id: string; firstName: string | null; lastName: string | null;
    phone: string | null; email: string | null; status: string | null;
    sentAt: string | null; deliveredAt: string | null;
  }>>({
    queryKey: [`/api/campaigns/${selectedCampaign?.id}/recipients`],
    enabled: !!selectedCampaign?.id,
  });

  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignChannels, setNewCampaignChannels] = useState<string[]>(['sms']);
  const [newCampaignTemplate, setNewCampaignTemplate] = useState('');

  const createCampaignMutation = useMutation({
    mutationFn: async (data: { name: string; department: string; channels: string[]; messageTemplate: string }) => {
      const results = [];
      for (const channel of data.channels) {
        const campaignName = data.channels.length > 1 ? `${data.name} (${channel.toUpperCase()})` : data.name;
        const res = await apiRequest('POST', '/api/campaigns', {
          name: campaignName,
          department: data.department,
          channel,
          messageTemplate: data.messageTemplate,
        });
        results.push(await res.json());
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns?department=service'] });
      queryClient.invalidateQueries({ queryKey: ['/api/metrics/dashboard'] });
      const count = results.length;
      toast({ title: "Campaign Created", description: count > 1 ? `${count} campaigns created (one per channel).` : "Your new service campaign has been created." });
      setNewCampaignOpen(false);
      setNewCampaignName('');
      setNewCampaignChannels(['sms']);
      setNewCampaignTemplate('');
    },
    onError: (err: Error) => {
      toast({ title: "Failed to Create Campaign", description: err.message, variant: "destructive" });
    },
  });

  const killSwitchMutation = useMutation({
    mutationFn: async ({ id, killSwitch }: { id: string; killSwitch: boolean }) => {
      await apiRequest('PATCH', `/api/campaigns/${id}`, { killSwitch });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns?department=service'] });
    },
  });

  const csvUploadMutation = useMutation({
    mutationFn: async ({ campaignId, file }: { campaignId: string; file: File }) => {
      const token = getAccessToken();
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
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns?department=service'] });
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
    refetchInterval: 15000,
  });

  const [scheduleDialogCampaignId, setScheduleDialogCampaignId] = useState<string | null>(null);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [executeConfirmCampaignId, setExecuteConfirmCampaignId] = useState<string | null>(null);

  const executeMutation = useMutation({
    mutationFn: async ({ id, dryRun, scheduledAt }: { id: string; dryRun: boolean; scheduledAt?: string }) => {
      await apiRequest('POST', `/api/campaigns/${id}/execute`, { dryRun, scheduledAt });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns?department=service'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/execution-statuses'] });
      if (variables.scheduledAt) {
        toast({ title: "Campaign Scheduled", description: `Campaign scheduled for ${new Date(variables.scheduledAt).toLocaleString()}.` });
      } else {
        toast({ title: variables.dryRun ? "Dry Run Started" : "Campaign Started", description: variables.dryRun ? "Preview mode — no messages will be sent." : "Campaign is now executing." });
      }
      setScheduleDialogCampaignId(null);
      setScheduleDateTime('');
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
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns?department=service'] });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns/execution-statuses'] });
      toast({ title: "Campaign Stopped", description: "Campaign execution has been stopped." });
    },
    onError: (err: Error) => {
      toast({ title: "Stop Failed", description: err.message, variant: "destructive" });
    },
  });

  /**
   * Agents tab — service department AI agent cards
   *
   * I-130 Assessment: Agent favorites feasibility.
   * A generic favorites API exists (/api/favorites) that stores path+label pairs (page bookmarks).
   * Adding per-agent favorites would require either: (a) repurposing the existing path-based
   * favorites system to store agent paths like "/agents?id=X", or (b) adding a dedicated
   * agent favorites endpoint. Either approach also needs UI changes (star icon per card,
   * favorites filter/sort). This crosses the declared file boundary (AppContext, API routes)
   * and is deferred to a future sprint.
   */
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
            <Card key={agent.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedAgent(agent); setLocation('/agents'); }} data-testid={`agent-card-${agent.id}`}>
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
          <a
            href="/campaign-template.csv"
            download="campaign-template.csv"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-download-csv-template"
          >
            <Download className="h-3.5 w-3.5" />
            CSV Template
          </a>
          <Button size="sm" variant="outline" data-testid="button-upload-csv" onClick={() => { setCsvUploadCampaignId('bulk'); csvInputRef.current?.click(); }}>
            <Upload className="h-4 w-4 mr-1.5" />
            Upload CSV
          </Button>
          <Button size="sm" data-testid="button-new-campaign" onClick={() => setNewCampaignOpen(true)}>
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
              <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {serviceCampaigns.map(campaign => (
              <tr key={campaign.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer" data-testid={`campaign-row-${campaign.id}`} onClick={() => setSelectedCampaign(campaign)}>
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
                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-center">
                    <Switch
                      checked={campaign.killSwitch}
                      onCheckedChange={(checked) => killSwitchMutation.mutate({ id: campaign.id, killSwitch: checked })}
                      className="data-[state=checked]:bg-red-500"
                      data-testid={`switch-killswitch-${campaign.id}`}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
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
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => stopMutation.mutate({ id: campaign.id })}
                                    disabled={stopMutation.isPending}
                                    data-testid={`button-stop-campaign-${campaign.id}`}
                                  >
                                    <Square className="h-4 w-4 text-red-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Stop Execution</TooltipContent>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setExecuteConfirmCampaignId(campaign.id)}
                                    disabled={executeMutation.isPending || campaign.recipientCount === 0}
                                    data-testid={`button-start-campaign-${campaign.id}`}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Execute Campaign</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setScheduleDialogCampaignId(campaign.id);
                                      setScheduleDateTime('');
                                    }}
                                    disabled={executeMutation.isPending || campaign.recipientCount === 0}
                                    data-testid={`button-schedule-campaign-${campaign.id}`}
                                  >
                                    <CalendarIcon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Schedule</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => executeMutation.mutate({ id: campaign.id, dryRun: true })}
                                    disabled={executeMutation.isPending || campaign.recipientCount === 0}
                                    data-testid={`button-dryrun-campaign-${campaign.id}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Dry Run</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
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
                            </TooltipTrigger>
                            <TooltipContent>Upload CSV</TooltipContent>
                          </Tooltip>
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

      {/*
        * I-132: Multi-channel campaign support (email + text + phone combination per campaign)
        * is a planned feature. Currently each campaign supports a single channel only.
        * Implementing multi-channel requires backend changes to the campaign model to store
        * an array of channels and route messages per-channel during execution.
        */}
      <Dialog open={newCampaignOpen} onOpenChange={setNewCampaignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Service Campaign</DialogTitle>
            <DialogDescription>Set up a new outbound campaign for the service department.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                data-testid="input-campaign-name"
                placeholder="e.g. Service Reminder Q1"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Channels</Label>
              <div className="flex flex-col gap-2" data-testid="campaign-channel-checkboxes">
                {[
                  { id: 'sms', label: 'SMS' },
                  { id: 'email', label: 'Email' },
                  { id: 'phone', label: 'Phone Call' },
                ].map(ch => (
                  <label key={ch.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCampaignChannels.includes(ch.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewCampaignChannels(prev => [...prev, ch.id]);
                        } else {
                          setNewCampaignChannels(prev => prev.filter(c => c !== ch.id));
                        }
                      }}
                      className="rounded border-border"
                      data-testid={`checkbox-channel-${ch.id}`}
                    />
                    <span className="text-sm">{ch.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-template">Message Template</Label>
              <Textarea
                id="campaign-template"
                data-testid="input-campaign-template"
                placeholder="Hi {firstName}, your vehicle is due for service..."
                value={newCampaignTemplate}
                onChange={(e) => setNewCampaignTemplate(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCampaignOpen(false)} data-testid="button-cancel-campaign">
              Cancel
            </Button>
            <Button
              onClick={() => createCampaignMutation.mutate({ name: newCampaignName, department: 'service', channels: newCampaignChannels, messageTemplate: newCampaignTemplate })}
              disabled={!newCampaignName.trim() || newCampaignChannels.length === 0 || createCampaignMutation.isPending}
              data-testid="button-submit-campaign"
            >
              {createCampaignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {newCampaignChannels.length > 1 ? `Create ${newCampaignChannels.length} Campaigns` : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!scheduleDialogCampaignId} onOpenChange={(open) => { if (!open) { setScheduleDialogCampaignId(null); setScheduleDateTime(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Campaign</DialogTitle>
            <DialogDescription>Choose a date and time to execute this campaign.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="schedule-datetime">Scheduled Date & Time</Label>
              <Input
                id="schedule-datetime"
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                data-testid="input-schedule-datetime"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setScheduleDialogCampaignId(null); setScheduleDateTime(''); }} data-testid="button-cancel-schedule">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (scheduleDialogCampaignId && scheduleDateTime) {
                  executeMutation.mutate({ id: scheduleDialogCampaignId, dryRun: false, scheduledAt: new Date(scheduleDateTime).toISOString() });
                }
              }}
              disabled={!scheduleDateTime || executeMutation.isPending}
              data-testid="button-confirm-schedule"
            >
              {executeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarIcon className="h-4 w-4 mr-2" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Execute Confirmation Dialog (SNP-PE3-SVC-01 safety fix) */}
      <Dialog open={!!executeConfirmCampaignId} onOpenChange={(open) => { if (!open) setExecuteConfirmCampaignId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Execute Campaign?</DialogTitle>
            <DialogDescription>
              This will send real SMS messages to{' '}
              {executeConfirmCampaignId
                ? (serviceCampaigns.find(c => c.id === executeConfirmCampaignId)?.recipientCount ?? 0)
                : 0}{' '}
              recipients via TextMagic. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExecuteConfirmCampaignId(null)} data-testid="button-cancel-execute">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (executeConfirmCampaignId) {
                  executeMutation.mutate({ id: executeConfirmCampaignId, dryRun: false });
                  setExecuteConfirmCampaignId(null);
                }
              }}
              disabled={executeMutation.isPending}
              data-testid="button-confirm-execute"
            >
              {executeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Execute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={!!selectedCampaign} onOpenChange={(open) => { if (!open) setSelectedCampaign(null); }}>
        <DialogContent className="sm:max-w-lg" data-testid="dialog-campaign-detail">
          <DialogHeader>
            <DialogTitle>{selectedCampaign?.name}</DialogTitle>
            <DialogDescription>Campaign details and statistics</DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={cn('w-2 h-2 rounded-full', campaignStatusColors[selectedCampaign.status])} />
                    <span className="text-sm capitalize font-medium">{selectedCampaign.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Channel</p>
                  <Badge variant="outline" className="mt-1 text-[10px]">{selectedCampaign.channel.toUpperCase()}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recipients</p>
                  <p className="text-sm font-medium mt-1">{selectedCampaign.recipientCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sent</p>
                  <p className="text-sm font-medium mt-1">{selectedCampaign.sentCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Replied</p>
                  <p className="text-sm font-medium mt-1">{selectedCampaign.repliedCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kill Switch</p>
                  <Badge variant={selectedCampaign.killSwitch ? "destructive" : "secondary"} className="mt-1 text-[10px]">
                    {selectedCampaign.killSwitch ? "ACTIVE — Messages Stopped" : "OFF — Messages Flowing"}
                  </Badge>
                </div>
              </div>
              {selectedCampaign.csvFilename && (
                <div>
                  <p className="text-xs text-muted-foreground">CSV File</p>
                  <p className="text-sm font-medium mt-1 flex items-center gap-1">
                    <Upload className="h-3 w-3" />
                    {selectedCampaign.csvFilename}
                  </p>
                </div>
              )}
              {selectedCampaign.messageTemplate && (
                <div>
                  <p className="text-xs text-muted-foreground">Message Template</p>
                  <p className="text-sm mt-1 bg-muted/50 rounded-md p-2 whitespace-pre-wrap">{selectedCampaign.messageTemplate}</p>
                </div>
              )}
              {/* Recipients table */}
              <div data-testid="campaign-recipients-section">
                <p className="text-xs text-muted-foreground mb-2">Recipients</p>
                {recipientsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading recipients...
                  </div>
                ) : campaignRecipients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recipients uploaded yet.</p>
                ) : (
                  <ScrollArea className="max-h-48">
                    <table className="w-full text-xs" data-testid="recipients-table">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-1 px-1 font-medium text-muted-foreground">Name</th>
                          <th className="text-left py-1 px-1 font-medium text-muted-foreground">Phone</th>
                          <th className="text-left py-1 px-1 font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaignRecipients.map((r) => (
                          <tr key={r.id} className="border-b border-muted/30">
                            <td className="py-1 px-1">{[r.firstName, r.lastName].filter(Boolean).join(' ') || '—'}</td>
                            <td className="py-1 px-1 text-muted-foreground">{r.phone || r.email || '—'}</td>
                            <td className="py-1 px-1">
                              <Badge variant={r.status === 'sent' || r.status === 'delivered' ? 'default' : 'secondary'} className="text-[9px] px-1">
                                {r.status || 'pending'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Service Metrics</h2>
          <p className="text-sm text-muted-foreground">Service department performance overview</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviceMetrics.map(metric => (
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
      <InsightsPage embedded />
    </div>
  );

  const renderCalendar = () => <AppointmentCalendar department="service" />;

  return (
    <div className="flex flex-col h-full" data-testid="service-page">
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        data-testid="input-csv-upload"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && csvUploadCampaignId) {
            csvUploadMutation.mutate({ campaignId: csvUploadCampaignId, file });
          }
          e.target.value = '';
        }}
      />
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
        {activeTab === 'agents' && renderAgents()}
        {activeTab === 'campaigns' && renderCampaigns()}
        {activeTab === 'insights' && renderInsights()}
        {activeTab === 'calendar' && renderCalendar()}
      </ScrollArea>

      <Dialog open={!!selectedMetric} onOpenChange={(open) => !open && setSelectedMetric(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto" data-testid="dialog-metric-detail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="text-metric-detail-title">
              {selectedMetric?.label}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Detailed breakdown of this service metric
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
                      <span className="text-sm font-semibold text-foreground">Service</span>
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
