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
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { LayoutDashboard, Bot, BarChart3, Calendar as CalendarIcon, TrendingUp, TrendingDown, Users, Clock, Zap, Target, ArrowUpRight, Settings, User, ArrowLeft, Phone, MessageSquare, Mail, MapPin, Sparkles, Loader2 } from 'lucide-react';
import InsightsPage from '@/pages/insights';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/contexts/AppContext';
import { useUILayout } from '@/contexts/UILayoutContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { getAgentStatusColor } from '@/lib/agent-utils';
import { AppointmentCalendar } from '@/components/AppointmentCalendar';
import type { Agent, ActivityLog } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';
import { mapActivityLogToItem, getActivityColor } from '@/lib/activity-utils';

interface SalesMetricTile {
  id: string;
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ComponentType<{ className?: string }>;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
];

interface PipelineMetrics {
  activePipeline: number;
  appointmentsToday: number;
  openEscalations: number;
  outboundSent24h: number;
}

interface DashboardMetricsResponse {
  pipeline: PipelineMetrics;
  [key: string]: any;
}

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

function buildSalesMetrics(summary: LeadSummary | undefined, pipeline?: PipelineMetrics): SalesMetricTile[] {
  if (!summary) return [
    { id: 'sm-1', label: 'Total Leads (30d)', value: '0', change: 0, trend: 'up' as const, icon: Target },
    { id: 'sm-2', label: 'New Leads', value: '0', change: 0, trend: 'up' as const, icon: Users },
    { id: 'sm-3', label: 'Active Pipeline', value: String(pipeline?.activePipeline ?? 0), change: 0, trend: 'up' as const, icon: Zap },
    { id: 'sm-4', label: 'Waiting on Response', value: '0', change: 0, trend: 'up' as const, icon: Clock },
    { id: 'sm-5', label: 'Appointments Set', value: '0', change: 0, trend: 'up' as const, icon: ArrowUpRight },
    { id: 'sm-6', label: 'Sold', value: '0', change: 0, trend: 'up' as const, icon: TrendingUp },
    { id: 'sm-7', label: 'Conversion Rate', value: '0%', change: 0, trend: 'up' as const, icon: TrendingUp },
  ];
  const t = (v: number) => (v >= 0 ? 'up' : 'down') as 'up' | 'down';
  const activePipeline = pipeline?.activePipeline ?? summary.activeLeads;
  return [
    { id: 'sm-1', label: 'Total Leads (30d)', value: String(summary.totalLeads), change: summary.totalLeadsChange, trend: t(summary.totalLeadsChange), icon: Target },
    { id: 'sm-2', label: 'New Leads', value: String(summary.newLeads), change: summary.newLeadsChange, trend: t(summary.newLeadsChange), icon: Users },
    { id: 'sm-3', label: 'Active Pipeline', value: String(activePipeline), change: summary.activeLeadsChange, trend: t(summary.activeLeadsChange), icon: Zap },
    { id: 'sm-4', label: 'Waiting on Response', value: String(summary.waitingForResponse), change: 0, trend: 'up' as const, icon: Clock },
    { id: 'sm-5', label: 'Appointments Set', value: String(summary.appointments), change: 0, trend: 'up' as const, icon: ArrowUpRight },
    { id: 'sm-6', label: 'Sold', value: String(summary.soldLeads), change: summary.soldLeadsChange, trend: t(summary.soldLeadsChange), icon: TrendingUp },
    // change: 0 — API does not provide conversionRateChange; using absolute rate as delta was misleading (I-114)
    { id: 'sm-7', label: 'Conversion Rate', value: `${summary.conversionRate}%`, change: 0, trend: 'up' as const, icon: TrendingUp },
  ];
}

/** Maps sales metric labels to pipeline detail API keys where available */
const salesMetricApiKeys: Record<string, string> = {
  'Active Pipeline': 'active_pipeline',
  'Appointments Set': 'appointments_today',
};

function SalesMetricDetailDialog({ selectedMetric, onClose, orgId, leadSummary }: {
  selectedMetric: SalesMetricTile | null;
  onClose: () => void;
  orgId: string | undefined;
  leadSummary: LeadSummary | undefined;
}) {
  const { toast } = useToast();
  const metricKey = selectedMetric ? salesMetricApiKeys[selectedMetric.label] : null;
  const [viewingContact, setViewingContact] = useState<{ leadId: string; row: any } | null>(null);

  const { data: detailRows, isLoading, isError } = useQuery<any[]>({
    queryKey: [`/api/metrics/pipeline/details?metric=${metricKey}`, orgId],
    enabled: !!selectedMetric && !!metricKey,
  });

  const handleClose = () => {
    setViewingContact(null);
    onClose();
  };

  const renderRecordTable = () => {
    if (!metricKey) {
      return (
        <div className="space-y-3">
          <div className="py-1.5 px-2 rounded-md hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Current Value</span>
              <span className="text-sm font-semibold text-foreground">{selectedMetric?.value}</span>
            </div>
          </div>
          <div className="py-1.5 px-2 rounded-md hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Change</span>
              <span className="text-sm font-semibold text-foreground">{(selectedMetric?.change ?? 0) > 0 ? '+' : ''}{selectedMetric?.change}%</span>
            </div>
          </div>
          <div className="py-1.5 px-2 rounded-md hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">Period</span>
              <span className="text-sm font-semibold text-foreground">Last 30 days</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            {leadSummary?.source === 'warehouse' ? 'Data sourced from warehouse sync.' : leadSummary?.source ? 'Data sourced from VinSolutions CRM.' : 'Data from local metrics.'}
          </p>
        </div>
      );
    }

    if (isLoading) {
      return <div className="py-8 text-center text-sm text-muted-foreground">Loading records...</div>;
    }
    if (isError) {
      return <div className="py-8 text-center text-sm text-red-500">Failed to load records</div>;
    }
    if (!detailRows || detailRows.length === 0) {
      return <div className="py-8 text-center text-sm text-muted-foreground">No records found</div>;
    }

    if (metricKey === 'active_pipeline') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="sales-table-active-pipeline">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Name</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Vehicle</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Lead ID</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((row: any, idx: number) => (
                <tr key={row.id || idx} className="border-b border-border/50 hover:bg-muted/30" data-testid={`sales-row-pipeline-${idx}`}>
                  <td className="py-2 px-2 font-medium text-foreground">{row.customerName || '—'}</td>
                  <td className="py-2 px-2"><span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">{row.vinStatus || '—'}</span></td>
                  <td className="py-2 px-2 text-muted-foreground truncate max-w-[140px]">{row.vehicleOfInterest || '—'}</td>
                  <td className="py-2 px-2 text-xs text-muted-foreground font-mono">{row.sourceId || row.id?.substring(0, 8)}</td>
                  <td className="py-2 px-2">
                    {row.sourceId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-primary hover:text-primary gap-1"
                        onClick={() => setViewingContact({ leadId: row.sourceId, row })}
                        data-testid={`sales-button-view-contact-${idx}`}
                      >
                        <User className="h-3 w-3" />
                        Show Contact
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (metricKey === 'appointments_today') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="sales-table-appointments">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Name</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Phone</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Email</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Type</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((row: any, idx: number) => (
                <tr key={row.id || idx} className="border-b border-border/50 hover:bg-muted/30" data-testid={`sales-row-appointment-${idx}`}>
                  <td className="py-2 px-2 font-medium text-foreground">{row.customerName || '—'}</td>
                  <td className="py-2 px-2 text-muted-foreground"><PhoneCell phone={row.customerPhone} toast={toast} /></td>
                  <td className="py-2 px-2 text-muted-foreground truncate max-w-[160px]">{row.customerEmail || '—'}</td>
                  <td className="py-2 px-2"><span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">{row.appointmentType}</span></td>
                  <td className="py-2 px-2 text-muted-foreground">{row.startTime ? new Date(row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={!!selectedMetric} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="dialog-metric-detail">
        {viewingContact ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Contact Details
              </DialogTitle>
              <DialogDescription className="text-xs">
                Live contact information from CRM
              </DialogDescription>
            </DialogHeader>
            <SalesContactDetailView
              leadId={viewingContact.leadId}
              leadRow={viewingContact.row}
              onBack={() => setViewingContact(null)}
              orgId={orgId}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2" data-testid="text-metric-detail-title">
                {selectedMetric && (
                  <>
                    {selectedMetric.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
                    {selectedMetric.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
                    {selectedMetric.label}
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {metricKey ? 'Records that make up this metric' : 'Detailed breakdown of this sales metric'}
              </DialogDescription>
            </DialogHeader>
            {selectedMetric && (
              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-foreground" data-testid="text-metric-detail-value">{selectedMetric.value}</span>
                  <span className={cn(
                    'text-sm font-medium',
                    selectedMetric.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {selectedMetric.change > 0 ? '+' : ''}{selectedMetric.change}% vs last 30d
                  </span>
                  {metricKey && detailRows && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      {(detailRows.length ?? 0) >= 100
                        ? `showing first 100 of ${selectedMetric.value} records`
                        : `${detailRows.length ?? 0} records`}
                    </span>
                  )}
                </div>
                <div className="border-t border-border pt-3">
                  {renderRecordTable()}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PhoneCell({ phone, toast }: { phone: string | null | undefined; toast: any }) {
  if (!phone || phone === '—') return <span>—</span>;
  return (
    <span
      className="text-primary cursor-pointer hover:underline"
      onClick={() => {
        const digits = phone.replace(/\D/g, '');
        window.open(`tel:${digits}`, '_self');
        toast({ title: 'Calling', description: `Initiating call to ${digits}` });
      }}
    >
      {phone}
    </span>
  );
}

function SalesContactDetailView({ leadId, leadRow, onBack, orgId }: {
  leadId: string;
  leadRow: any;
  onBack: () => void;
  orgId?: string;
}) {
  const { toast } = useToast();
  const { data: contact, isLoading, isError } = useQuery<any>({
    queryKey: [`/api/vin/leads/${leadId}/contact`, orgId],
    enabled: !!leadId,
  });

  const contactName = contact
    ? [contact.firstName, contact.lastName].filter(Boolean).join(' ')
    : leadRow?.customerName || '—';
  const contactPhone = contact?.phone || leadRow?.customerPhone || null;
  const contactEmail = contact?.email || leadRow?.customerEmail || null;

  return (
    <div className="space-y-5" data-testid="sales-contact-detail-view">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-back-to-leads"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </button>

      {isLoading ? (
        <div className="py-10 flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading contact from CRM...</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground" data-testid="text-contact-name">{contactName}</h3>
              {leadRow?.vinStatus && (
                <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">{leadRow.vinStatus}</span>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            {contactPhone && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground flex-1">{contactPhone}</span>
              </div>
            )}
            {contactEmail && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground flex-1 truncate">{contactEmail}</span>
              </div>
            )}
            {contact?.city && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground flex-1">
                  {[contact.city, contact.state, contact.zip].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            {leadRow?.vehicleOfInterest && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-muted-foreground">Vehicle of Interest</span>
                  <p className="text-sm text-foreground">{leadRow.vehicleOfInterest}</p>
                </div>
              </div>
            )}
            {!contactPhone && !contactEmail && !isLoading && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No contact information available
              </div>
            )}
          </div>

          {isError && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Could not fetch live CRM data. Showing cached info.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 gap-2"
              onClick={() => {
                if (!contactPhone) { toast({ title: 'No phone number', description: 'No phone number on file.' }); return; }
                window.open(`tel:${contactPhone.replace(/\D/g, '')}`, '_self');
              }}
              disabled={!contactPhone}
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => {
                if (!contactPhone) { toast({ title: 'No phone number', description: 'No phone number on file.' }); return; }
                window.open(`sms:${contactPhone.replace(/\D/g, '')}`, '_self');
              }}
              disabled={!contactPhone}
            >
              <MessageSquare className="h-4 w-4" />
              Text
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function SalesPage() {
  const [currentLocation, setLocation] = useLocation();
  const { selectedAgent, setSelectedAgent, currentOrganization } = useApp();
  const { setRightPaneOpen } = useUILayout();
  const { toast } = useToast();
  const orgId = currentOrganization?.id;
  const [activeTab, setActiveTab] = useState('dashboard');

  // Sync activeTab from URL ?tab= parameter (used by submenu navigation links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && tabs.some(t => t.id === tab)) setActiveTab(tab);
  }, [currentLocation]);
  const [selectedMetric, setSelectedMetric] = useState<SalesMetricTile | null>(null);
  
  const { data: salesAgents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ['/api/agents?department=sales', orgId],
  });

  const { data: leadSummary, isLoading: summaryLoading } = useQuery<LeadSummary>({
    queryKey: ['/api/vin/leads/summary', orgId],
  });

  const { data: dashboardMetrics } = useQuery<DashboardMetricsResponse>({
    queryKey: ['/api/metrics/dashboard', orgId],
  });

  const { data: activityLogs, isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ['/api/activity-log?limit=10', orgId],
  });

  const salesMetrics = buildSalesMetrics(leadSummary, dashboardMetrics?.pipeline);

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
        {salesMetrics.map(metric => (
            <Card key={metric.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`metric-tile-${metric.id}`} onClick={() => setSelectedMetric(metric)}>
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
        ))}
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
            <div className="space-y-3" data-testid="recent-activity-feed">
              {activityLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="h-3 flex-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))
              ) : (activityLogs && activityLogs.length > 0) ? (
                activityLogs.slice(0, 10).map((log) => {
                  const item = mapActivityLogToItem(log);
                  return (
                    <div key={item.id} className="flex items-center gap-3" data-testid={`activity-item-${item.id}`}>
                      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', getActivityColor(item.type))} />
                      <span className="text-sm flex-1">{item.description}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-3">No recent activity</p>
              )}
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

  const renderInsights = () => (
    <InsightsPage embedded />
  );

  const renderCalendar = () => <AppointmentCalendar department="sales" />;


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

      <SalesMetricDetailDialog
        selectedMetric={selectedMetric}
        onClose={() => setSelectedMetric(null)}
        orgId={orgId}
        leadSummary={leadSummary}
      />
    </div>
  );
}
