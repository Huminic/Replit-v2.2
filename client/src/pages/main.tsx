/**
 * @file main.tsx — Primary AI Chat Page
 * @description The center of the app experience. This is the main AI chat interface
 *   where users interact with the AI persona (personaName from AppContext). The page follows
 *   the cardinal layout rule: chat is always in center → info/artifacts appear in the right pane.
 *
 * @layout
 *   - Top section: Pipeline metric tiles (2x2 grid) that collapse after the user's first message
 *   - Center: Full chat thread with bot messages left-aligned, user messages right-aligned (NO avatars)
 *   - Bottom: Suggestion chips + gradient-bordered chat input with file upload dropdown
 *   - Metric detail dialog: Click any tile to see drill-down breakdown data
 *
 * @designConstraints
 *   - Metric tiles: gradient backgrounds, decorative SVG concentric circles, icon badges
 *   - Chat: Bot messages use bg-card with border, user messages use bg-primary
 *   - Thinking animation: flat rolling wave (.wave-dot CSS class), 3 dots with staggered timing (0s/0.15s/0.3s)
 *   - Input: gradient border wrapper (chat-input-gradient class) with purple glow shadow
 *
 * @rbac Pipeline tiles are org-scoped — data changes when switching organizations
 * @locked Metric tile gradient themes, wave animation timing, chat bubble styling
 *
 * @productionNote Chat responses are currently mocked with a 1.5s setTimeout.
 *   Will connect to AI backend at nexxusv2.huminicdev.com with conversation context.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearch, useLocation } from 'wouter';
import { Send, Plus, Sparkles, TrendingUp, TrendingDown, X, ChevronDown, ChevronRight, ChevronUp, Brain, Globe, Square, RotateCcw, AlertCircle, Phone, MessageSquare, ArrowLeft, User, Mail, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getRandomSuggestions, type ChatMessage } from '@/lib/chat-types';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient, getQueryFn } from '@/lib/queryClient';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { MarkdownMessage } from '@/components/MarkdownMessage';
import { useToast } from '@/hooks/use-toast';
import type { Conversation as DbConversation, Message as DbMessage } from '@shared/schema';

interface PipelineData {
  activePipeline: number;
  appointmentsToday: number;
  openEscalations: number;
  outboundSent24h: number;
}

interface MetricTile {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  gradient: string;
  iconBg: string;
}

const metricApiKeys: Record<string, string> = {
  'Active Pipeline': 'active_pipeline',
  'Appointments Today': 'appointments_today',
  'Open Escalations': 'open_escalations',
  'Outbound Sent 24h': 'outbound_sent',
};

function buildPipelineTiles(data: PipelineData | undefined): MetricTile[] {
  const ap = data?.activePipeline ?? 0;
  const at = data?.appointmentsToday ?? 0;
  const oe = data?.openEscalations ?? 0;
  const os = data?.outboundSent24h ?? 0;
  return [
    { label: 'Active Pipeline', value: String(ap), change: 'live', trend: 'up', gradient: 'from-emerald-500/15 via-green-500/10 to-teal-500/5', iconBg: 'bg-emerald-500/20' },
    { label: 'Appointments Today', value: String(at), change: 'live', trend: 'up', gradient: 'from-blue-500/15 via-indigo-500/10 to-violet-500/5', iconBg: 'bg-blue-500/20' },
    { label: 'Open Escalations', value: String(oe), change: 'live', trend: oe > 0 ? 'down' : 'up', gradient: 'from-amber-500/15 via-orange-500/10 to-red-500/5', iconBg: 'bg-amber-500/20' },
    { label: 'Outbound Sent 24h', value: String(os), change: 'live', trend: 'up', gradient: 'from-purple-500/15 via-violet-500/10 to-indigo-500/5', iconBg: 'bg-purple-500/20' },
  ];
}


function buildMetricDetails(data: PipelineData | undefined): Record<string, { breakdown: { label: string; value: string; detail?: string }[]; description: string; highlights?: string[] }> {
  const ap = data?.activePipeline ?? 0;
  const at = data?.appointmentsToday ?? 0;
  const oe = data?.openEscalations ?? 0;
  const os = data?.outboundSent24h ?? 0;
  return {
    'Active Pipeline': { description: 'Leads created in the last 14 days, excluding Lost, Sold, and Duplicate statuses', breakdown: [
      { label: 'Total Active Leads', value: String(ap) },
      { label: 'Window', value: '14 days', detail: 'Active leads from the last 14 days' },
    ], highlights: ap > 0 ? ['14-day pipeline window ensures freshness'] : ['No active pipeline leads in the current window'] },
    'Appointments Today': { description: 'Scheduled appointments for today across all departments', breakdown: [
      { label: 'Total Today', value: String(at) },
    ], highlights: at > 0 ? [at + ' appointment' + (at !== 1 ? 's' : '') + ' scheduled for today'] : ['No appointments scheduled for today'] },
    'Open Escalations': { description: 'Active escalations requiring team attention in TeamBox', breakdown: [
      { label: 'Total Open', value: String(oe), detail: 'Includes VIN push failures, unsent messages, and customer escalations' },
    ], highlights: oe > 0 ? [oe + ' escalation' + (oe !== 1 ? 's' : '') + ' need attention'] : ['No open escalations'] },
    'Outbound Sent 24h': { description: 'Outbound messages sent across all channels in the last 24 hours', breakdown: [
      { label: 'Total Sent', value: String(os), detail: 'SMS, email, and voice combined' },
    ], highlights: os > 0 ? [os + ' outbound message' + (os !== 1 ? 's' : '') + ' delivered in the last 24 hours'] : ['No outbound messages sent in the last 24 hours'] },
  };
}

/** Decorative SVG icons shown inside each metric tile's icon badge (folder, users, lightning, chart) */
const tileIcons = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>,
];


/**
 * ThinkingCard — Expandable card showing AI reasoning steps.
 * Appears below bot messages that include a `thinking` property.
 * Shows a summary line with Brain icon; click to expand and see detailed reasoning steps.
 */
function ThinkingCard({ thinking }: { thinking: ChatMessage['thinking'] }) {
  const [expanded, setExpanded] = useState(false);
  if (!thinking) return null;

  return (
    <div className="mt-2 rounded-lg border border-purple-500/20 bg-purple-500/5 overflow-hidden" data-testid="thinking-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors"
        data-testid="button-toggle-thinking"
      >
        <Brain className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="font-medium flex-1 text-left">{thinking.summary}</span>
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {expanded && (
        <div className="px-3 pb-2.5 space-y-1 border-t border-purple-500/10">
          {thinking.details.map((detail, i) => (
            <div key={i} className="flex items-start gap-2 pt-1.5">
              <div className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground leading-relaxed">{detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function clickToCall(phone: string | null | undefined, toast: any) {
  if (!phone || phone === '—') {
    toast({ title: 'No phone number', description: 'This contact does not have a phone number on file.' });
    return;
  }
  const digits = phone.replace(/\D/g, '');
  window.open(`tel:${digits}`, '_self');
  toast({ title: 'Calling', description: `Initiating call to ${digits}` });
}

function cleanVehicleOfInterest(value: string | null | undefined): string {
  if (!value) return '—';
  if (value.startsWith('https://api.vinsolutions.com') || value.startsWith('http://api.vinsolutions.com')) return 'No data';
  if (value === '[object Object]') return 'No data';
  return value;
}

function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    const d = digits.slice(1);
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

const VIN_STATUS_LABELS: Record<string, string> = {
  ACTIVE_NEW_LEAD: 'New Lead',
  ACTIVE_WAITING_FOR_PROSPECT_RESPONSE: 'Waiting for Response',
  ACTIVE_APPOINTMENT_SET: 'Appointment Set',
  ACTIVE_REVISIT: 'Revisit',
  SOLD_DELIVERED: 'Sold - Delivered',
  SOLD_PENDING_FINANCE: 'Sold - Pending Finance',
  SOLD_PENDING_DELIVERY: 'Sold - Pending Delivery',
  LOST_PURCHASED_SAME_BRAND_DIFFERENT_DEALER: 'Lost - Same Brand, Other Dealer',
  LOST_PURCHASED_DIFFERENT_BRAND: 'Lost - Different Brand',
  LOST_NOT_IN_MARKET: 'Lost - Not in Market',
  LOST_BAD_LEAD: 'Lost - Bad Lead',
  LOST_DUPLICATE: 'Lost - Duplicate',
  WALK_IN: 'Walk-In',
  INTERNET: 'Internet',
  PHONE: 'Phone',
};

function formatVinStatus(status: string | null | undefined): string {
  if (!status) return '—';
  if (VIN_STATUS_LABELS[status]) return VIN_STATUS_LABELS[status];
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function PhoneCell({ phone, toast }: { phone: string | null | undefined; toast: any }) {
  if (!phone || phone === '—') return <span>—</span>;
  return (
    <span
      className="text-primary cursor-pointer hover:underline"
      onClick={() => clickToCall(phone, toast)}
      data-testid={`phone-click-${phone}`}
    >
      {formatPhoneNumber(phone)}
    </span>
  );
}

function ContactDetailView({ leadId, leadRow, onBack, orgId }: {
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

  const handleCall = () => {
    if (!contactPhone) {
      toast({ title: 'No phone number', description: 'This contact does not have a phone number on file.' });
      return;
    }
    const digits = contactPhone.replace(/\D/g, '');
    window.open(`tel:${digits}`, '_self');
    toast({ title: 'Calling', description: `Initiating call to ${digits}` });
  };

  const handleText = () => {
    if (!contactPhone) {
      toast({ title: 'No phone number', description: 'This contact does not have a phone number on file.' });
      return;
    }
    const digits = contactPhone.replace(/\D/g, '');
    window.open(`sms:${digits}`, '_self');
    toast({ title: 'Texting', description: `Opening SMS to ${digits}` });
  };

  return (
    <div className="space-y-5" data-testid="contact-detail-view">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-back-to-leads"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </button>

      {isLoading ? (
        <div className="py-10 flex flex-col items-center gap-3" data-testid="contact-loading">
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
                <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground" data-testid="text-contact-status">{formatVinStatus(leadRow.vinStatus)}</span>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            {contactPhone && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border" data-testid="contact-phone-row">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground flex-1" data-testid="text-contact-phone">{formatPhoneNumber(contactPhone)}</span>
              </div>
            )}
            {contactEmail && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border" data-testid="contact-email-row">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground flex-1 truncate" data-testid="text-contact-email">{contactEmail}</span>
              </div>
            )}
            {contact?.city && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border" data-testid="contact-location-row">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground flex-1" data-testid="text-contact-location">
                  {[contact.city, contact.state, contact.zip].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            {contact?.companyName && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border" data-testid="contact-company-row">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-foreground flex-1" data-testid="text-contact-company">{contact.companyName}</span>
              </div>
            )}
            {leadRow?.vehicleOfInterest && cleanVehicleOfInterest(leadRow.vehicleOfInterest) !== 'No data' && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border" data-testid="contact-vehicle-row">
                <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-muted-foreground">Vehicle of Interest</span>
                  <p className="text-sm text-foreground" data-testid="text-contact-vehicle">{cleanVehicleOfInterest(leadRow.vehicleOfInterest)}</p>
                </div>
              </div>
            )}
            {!contactPhone && !contactEmail && !isLoading && (
              <div className="py-4 text-center text-sm text-muted-foreground" data-testid="contact-no-info">
                No contact information available
              </div>
            )}
          </div>

          {isError && (
            <p className="text-xs text-amber-600 dark:text-amber-400" data-testid="contact-crm-error">
              Could not fetch live CRM data. Showing cached info.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 gap-2"
              onClick={handleCall}
              disabled={!contactPhone}
              data-testid="button-call-contact"
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleText}
              disabled={!contactPhone}
              data-testid="button-text-contact"
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

function MetricDetailDialog({ selectedMetric, metricDetails, onClose, orgId }: {
  selectedMetric: MetricTile | null;
  metricDetails: Record<string, { breakdown: { label: string; value: string; detail?: string }[]; description: string; highlights?: string[] }>;
  onClose: () => void;
  orgId: string | undefined;
}) {
  const { toast } = useToast();
  const metricKey = selectedMetric ? metricApiKeys[selectedMetric.label] : null;
  const [viewingContact, setViewingContact] = useState<{ leadId: string; row: any } | null>(null);

  const { data: detailRows, isLoading, isError } = useQuery<any[]>({
    queryKey: [`/api/metrics/pipeline/details?metric=${metricKey}`, orgId],
    enabled: !!selectedMetric && !!metricKey,
  });

  const handleClose = () => {
    setViewingContact(null);
    onClose();
  };

  const renderTable = () => {
    if (isLoading) {
      return (
        <div className="py-8 text-center text-sm text-muted-foreground" data-testid="metric-detail-loading">
          Loading records...
        </div>
      );
    }
    if (isError) {
      return (
        <div className="py-8 text-center text-sm text-red-500" data-testid="metric-detail-error">
          Failed to load records
        </div>
      );
    }
    if (!detailRows || detailRows.length === 0) {
      return (
        <div className="py-8 text-center text-sm text-muted-foreground" data-testid="metric-detail-empty">
          No records found
        </div>
      );
    }

    if (metricKey === 'active_pipeline') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-active-pipeline">
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
                <tr key={row.id || idx} className="border-b border-border/50 hover:bg-muted/30" data-testid={`row-pipeline-${idx}`}>
                  <td className="py-2 px-2 font-medium text-foreground">{row.customerName || '—'}</td>
                  <td className="py-2 px-2"><span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">{formatVinStatus(row.vinStatus)}</span></td>
                  <td className="py-2 px-2 text-muted-foreground truncate max-w-[140px]">{cleanVehicleOfInterest(row.vehicleOfInterest)}</td>
                  <td className="py-2 px-2 text-xs text-muted-foreground font-mono">{row.sourceId || row.id?.substring(0, 8)}</td>
                  <td className="py-2 px-2">
                    {row.sourceId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-primary hover:text-primary gap-1"
                        onClick={() => setViewingContact({ leadId: row.sourceId, row })}
                        data-testid={`button-view-contact-${idx}`}
                      >
                        <User className="h-3 w-3" />
                        View Contact
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
          <table className="w-full text-sm" data-testid="table-appointments">
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
                <tr key={row.id || idx} className="border-b border-border/50 hover:bg-muted/30" data-testid={`row-appointment-${idx}`}>
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

    if (metricKey === 'open_escalations') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-escalations">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Title</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Type</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Priority</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((row: any, idx: number) => (
                <tr key={row.id || idx} className="border-b border-border/50 hover:bg-muted/30" data-testid={`row-escalation-${idx}`}>
                  <td className="py-2 px-2 font-medium text-foreground truncate max-w-[200px]">{row.title || '—'}</td>
                  <td className="py-2 px-2"><span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">{row.type}</span></td>
                  <td className="py-2 px-2"><span className={cn('px-1.5 py-0.5 rounded text-xs', row.priority === 'high' ? 'bg-red-500/15 text-red-600' : row.priority === 'medium' ? 'bg-amber-500/15 text-amber-600' : 'bg-muted text-muted-foreground')}>{row.priority}</span></td>
                  <td className="py-2 px-2 text-muted-foreground text-xs">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (metricKey === 'outbound_sent') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-outbound">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Recipient</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Phone</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Email</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Channel</th>
                <th className="py-2 px-2 text-xs font-semibold text-muted-foreground">Sent</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((row: any, idx: number) => (
                <tr key={row.id || idx} className="border-b border-border/50 hover:bg-muted/30" data-testid={`row-outbound-${idx}`}>
                  <td className="py-2 px-2 font-medium text-foreground">{row.recipientName || '—'}</td>
                  <td className="py-2 px-2 text-muted-foreground"><PhoneCell phone={row.recipientPhone} toast={toast} /></td>
                  <td className="py-2 px-2 text-muted-foreground truncate max-w-[160px]">{row.recipientEmail || '—'}</td>
                  <td className="py-2 px-2"><span className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">{row.channel}</span></td>
                  <td className="py-2 px-2 text-muted-foreground text-xs">{row.sentAt ? new Date(row.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : row.createdAt ? new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
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
              <DialogTitle className="flex items-center gap-2" data-testid="text-contact-detail-title">
                <User className="h-5 w-5 text-primary" />
                Contact Details
              </DialogTitle>
              <DialogDescription className="text-xs">
                Live contact information from CRM
              </DialogDescription>
            </DialogHeader>
            <ContactDetailView
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
                {selectedMetric && (metricDetails[selectedMetric.label]?.description || 'Detailed breakdown of this metric')}
              </DialogDescription>
            </DialogHeader>
            {selectedMetric && (
              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-foreground" data-testid="text-metric-detail-value">{selectedMetric.value}</span>
                  <span className={cn(
                    'text-sm font-medium',
                    selectedMetric.trend === 'up' && 'text-green-600 dark:text-green-400',
                    selectedMetric.trend === 'down' && 'text-red-600 dark:text-red-400',
                    selectedMetric.trend === 'neutral' && 'text-muted-foreground'
                  )}>
                    {selectedMetric.change}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {(detailRows?.length ?? 0) >= 100
                      ? `showing first 100 of ${selectedMetric.value} records`
                      : `${detailRows?.length ?? 0} records`}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  {renderTable()}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function MainPage() {
  const { personaName, currentUser, currentOrganization, currentRole } = useApp();
  const [suggestions] = useState(() => getRandomSuggestions(currentRole));
  const orgId = currentOrganization?.id;
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedMetric, setSelectedMetric] = useState<MetricTile | null>(null);
  const [tilesCollapsed, setTilesCollapsed] = useState(false);
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  const [, setLocation] = useLocation();
  const searchString = useSearch();

  // Resume a conversation when ?conversationId=X is in the URL
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const resumeId = params.get('conversationId');
    if (resumeId) {
      conversationIdRef.current = resumeId;
      setConversationId(resumeId);
      setMessages([]);
      setInitialized(true);
      setHasSentMessage(false);
      setTilesCollapsed(false);
      // Clean the URL without triggering re-render
      window.history.replaceState({}, '', '/');
    }
  }, [searchString]);

  const { data: pipelineData } = useQuery<PipelineData>({
    queryKey: ['/api/metrics/pipeline', orgId],
  });

  const metrics = buildPipelineTiles(pipelineData);
  const metricDetails = buildMetricDetails(pipelineData);

  const { data: existingConversations } = useQuery<DbConversation[]>({
    queryKey: ['/api/conversations?channel=ai-chat'],
    enabled: !!authUser,
  });

  const findOrCreateConversation = useCallback(async (): Promise<string | null> => {
    if (!authUser || initialized) return conversationIdRef.current;

    // Reuse an existing ai-chat conversation for this user if one exists
    const userEmail = authUser.email;
    const match = existingConversations?.find(
      (c) => c.customerEmail === userEmail && c.channel === 'ai-chat'
    );

    if (match) {
      conversationIdRef.current = match.id;
      setConversationId(match.id);
      setChatError(null);
      setInitialized(true);
      return match.id;
    }

    // Only create if the query has resolved (not still loading)
    if (existingConversations === undefined) return null;

    try {
      const res = await apiRequest('POST', '/api/conversations', {
        customerName: `${authUser.firstName} ${authUser.lastName}`,
        customerEmail: authUser.email,
        channel: 'ai-chat',
        status: 'open',
      });
      const newConv: DbConversation = await res.json();
      conversationIdRef.current = newConv.id;
      setConversationId(newConv.id);
      setChatError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations?channel=ai-chat'] });
      setInitialized(true);
      return newConv.id;
    } catch (err) {
      console.error('Failed to create main chat conversation:', err);
      setChatError('Failed to initialize chat. Click to retry.');
      return null;
    }
  }, [authUser, existingConversations, initialized, personaName]);

  useEffect(() => {
    findOrCreateConversation();
  }, [findOrCreateConversation]);

  const { data: dbMessages } = useQuery<DbMessage[]>({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/conversations/${conversationId}/messages`);
      return res.json();
    },
    enabled: !!conversationId,
  });

  const handleStreamComplete = useCallback((finalContent: string) => {
    setMessages(prev => [...prev, {
      id: `msg-ai-${Date.now()}`,
      role: 'assistant' as const,
      content: finalContent,
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  const { sendMessage: streamSend, abortStream, retry, isStreaming, streamingContent, statusMessage, error: streamError, lastFailedContent } = useStreamingChat({
    conversationId,
    onComplete: handleStreamComplete,
  });

  useEffect(() => {
    // Chat starts blank and accumulates only via UI interactions.
    // Never sync from DB to prevent history flooding in after first send.
    isInitialLoad.current = false;
  }, [dbMessages]);

  const lastUserContent = messages.filter(m => m.role === 'user').at(-1)?.content;
  const handleRegenerate = () => {
    if (lastUserContent) streamSend(lastUserContent);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    let activeConversationId = conversationId || conversationIdRef.current;
    if (!activeConversationId) {
      // Conversation not yet initialized — create it and use the returned ID directly
      setChatError(null);
      setInitialized(false);
      activeConversationId = await findOrCreateConversation();
      if (!activeConversationId) {
        toast({ title: 'Chat error', description: 'Could not create conversation. Please refresh the page.', variant: 'destructive' });
        return;
      }
    }

    const content = inputValue.trim();
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    if (!hasSentMessage) {
      setHasSentMessage(true);
      setTilesCollapsed(true);
    }

    await streamSend(content, activeConversationId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-border flex-shrink-0">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-between py-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" data-testid="text-ai-key-metrics-title">AI Key Metrics</h2>
              {hasSentMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => setTilesCollapsed(!tilesCollapsed)}
                  data-testid="button-toggle-metrics"
                >
                  {tilesCollapsed ? (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Show
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Hide
                    </>
                  )}
                </Button>
              )}
            </div>
            <div
              className={cn(
                'overflow-hidden transition-all duration-500 ease-in-out',
                tilesCollapsed ? 'max-h-0 opacity-0 pb-0' : 'max-h-[500px] opacity-100 pb-4'
              )}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {metrics.map((metric, i) => (
                <div
                  key={i}
                  className={cn(
                    'relative rounded-xl border border-border bg-gradient-to-br cursor-pointer hover-elevate group',
                    metric.gradient
                  )}
                  onClick={() => setSelectedMetric(metric)}
                  data-testid={`metric-tile-${i}`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.07] -mr-4 -mt-4">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                      <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
                      <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="1" className="text-foreground" />
                    </svg>
                  </div>
                  <div className="relative p-4 flex items-start gap-3">
                    <div className={cn('flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-foreground/70', metric.iconBg)}>
                      {tileIcons[i]}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-medium leading-tight">{metric.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-0.5 tracking-tight">{metric.value}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {metric.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {metric.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                        <span className={cn(
                          'text-[11px] font-medium',
                          metric.trend === 'up' && 'text-green-600 dark:text-green-400',
                          metric.trend === 'down' && 'text-red-600 dark:text-red-400',
                          metric.trend === 'neutral' && 'text-muted-foreground'
                        )}>
                          {metric.change}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {chatError && (
              <div
                className="flex justify-center cursor-pointer"
                onClick={() => { setChatError(null); setInitialized(false); }}
                data-testid="chat-error-banner"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive hover:bg-destructive/20 transition-colors">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{chatError}</span>
                </div>
              </div>
            )}

            {messages.map((message, idx) => {
              const isLastAssistant = message.role === 'assistant' && idx === messages.length - 1;
              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                  data-testid={`main-chat-message-${message.id}`}
                >
                  <div
                    className={cn(
                      'density-chat rounded-2xl px-5 py-4 max-w-[80%]',
                      message.role === 'assistant'
                        ? 'bg-card border border-border'
                        : 'bg-primary text-primary-foreground'
                    )}
                  >
                    {message.role === 'assistant' ? (
                      <MarkdownMessage
                        content={message.content}
                        rawContent={message.content}
                        isLastAssistant={isLastAssistant && !isStreaming}
                        onRegenerate={handleRegenerate}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    )}
                    {message.thinking && <ThinkingCard thinking={message.thinking} />}
                  </div>
                </div>
              );
            })}

            {isStreaming && (
              <div className="flex justify-start" data-testid="streaming-message">
                <div className="density-chat rounded-2xl px-5 py-4 max-w-[80%] bg-card border border-border">
                  {streamingContent ? (
                    <MarkdownMessage content={streamingContent} isStreaming showActions={false} />
                  ) : statusMessage ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-3.5 w-3.5 animate-pulse" />
                      <span>{statusMessage}</span>
                    </div>
                  ) : (
                    <div className="flex gap-1 items-center h-5">
                      <span className="wave-dot" />
                      <span className="wave-dot" style={{ animationDelay: '0.15s' }} />
                      <span className="wave-dot" style={{ animationDelay: '0.3s' }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {streamError && !isStreaming && (
              <div className="flex justify-start" data-testid="stream-error">
                <div className="density-chat rounded-2xl px-5 py-4 max-w-[80%] bg-destructive/10 border border-destructive/30">
                  <div className="flex items-center gap-2 text-sm text-destructive mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{streamError}</span>
                  </div>
                  {lastFailedContent && (
                    <Button size="sm" variant="outline" onClick={retry} data-testid="button-retry">
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="px-4 md:px-6 pb-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[11px] text-muted-foreground font-medium">Try asking...</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-7 rounded-full px-3"
                  onClick={() => {
                    setInputValue(suggestion);
                    inputRef.current?.focus();
                  }}
                  data-testid={`main-suggestion-${i}`}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <div className="chat-input-gradient rounded-2xl p-[3px] shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <div className="bg-background rounded-[14px] flex items-end gap-2 p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0 rounded-full"
                  data-testid="button-main-chat-add"
                  onClick={() => {
                    setMessages([]);
                    setInputValue('');
                    setConversationId(null);
                    setInitialized(false);
                    setChatError(null);
                    setHasSentMessage(false);
                    setTilesCollapsed(false);
                  }}
                >
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </Button>

                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about your business"
                  className="flex-1 bg-transparent resize-none outline-none text-sm min-h-[28px] max-h-40 py-1.5"
                  rows={1}
                  data-testid="input-main-chat"
                />
                {isStreaming ? (
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-9 w-9 flex-shrink-0 rounded-full"
                    onClick={abortStream}
                    data-testid="button-main-stop"
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    className="h-9 w-9 flex-shrink-0 rounded-full"
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    data-testid="button-main-send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MetricDetailDialog
        selectedMetric={selectedMetric}
        metricDetails={metricDetails}
        onClose={() => setSelectedMetric(null)}
        orgId={orgId}
      />
    </div>
  );
}
