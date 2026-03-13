/**
 * AgentConfigPane — Right pane configuration panel for the selected AI agent.
 *
 * Rendered inside RightPane/AppLayout when an agent is selected and the user is on the Agents page.
 * Cardinal rule: Chat is in center (agents.tsx) → config details on right (this component).
 *
 * Configuration sections (tab navigation on left side of pane):
 * - Performance: Channel display, agent links (customer link, assigned phone, chat link with
 *   copy/open buttons), and metrics cards (interactions, resolution rate, avg response time).
 * - Instructions: Read-only system prompt with "Edit" button → modal for editing instructions text.
 * - Triggers: Agent automation triggers (e.g., "New lead 5min", "Daily follow-up").
 *   Each trigger has enable/disable toggle. Add Trigger and Configure buttons (demo-only).
 * - Tools & Skills: Active tools list with manage modal (toggles from availableTools in agents.ts).
 *   Skills catalog with 20 skills across Sales, Finance, Operations, General categories.
 *   Manage Skills modal with category headers and checkboxes.
 * - Knowledge: Reference documents (FAQ, Pricing Guide, Inventory CSV) with item counts.
 *   Upload Reference button and delete buttons (demo-only).
 * - Activity: Recent agent actions timeline (handled chat, sent email, qualified leads, etc.).
 *
 * State management:
 * - selectedAgent from AppContext drives all displayed data
 * - updateAgent from AppContext persists changes (instructions, triggers, tools, status)
 * - Modal pattern: Open modal → copy data to edit state → save writes back via updateAgent
 *
 * @see client/src/pages/agents.tsx — Center chat interface for the selected agent
 * @see client/src/mocks/agents.ts — Agent type, availableTools, AgentChannel/Trigger/Tool types
 * @see client/src/contexts/AppContext.tsx — selectedAgent, updateAgent, setRightPaneOpen
 */
import { useState, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Phone,
  MessageSquare,
  Video,
  Mail,
  Settings,
  Play,
  Pause,
  FileText,
  Zap,
  Wrench,
  BookOpen,
  Activity,
  Pencil,
  Upload,
  BarChart3,
  Globe,
  Link2,
  Copy,
  ExternalLink,
  ChevronsRight,
  Plus,
  Trash2,
  Info,
  Headphones,
  Clock,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useApp } from '@/contexts/AppContext';
import { useUILayout } from '@/contexts/UILayoutContext';
import { useLocation } from 'wouter';
import { getAccessToken } from '@/lib/tokenStore';
import { availableTools, type AgentChannel, type AgentTool } from '@/lib/agent-utils';
import {
  MARKETING_AGENTS,
  getSessionsForAgent,
  getArtifactTypeLabel,
  timeAgo,
  type MarketingArtifact,
} from '@/lib/marketing-agents';
import { Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

const channelIcons: Record<AgentChannel, React.ElementType> = {
  voice: Phone,
  chat: MessageSquare,
  video: Video,
  email: Mail,
  sms: MessageSquare,
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface SequenceStep {
  channel: 'sms' | 'phone' | 'email';
  waitMinutes: number;
  messageTemplate?: string;
}

interface StoreHoursConfig {
  openTime: string;
  closeTime: string;
  closedDays: number[];
}

interface AgentTriggerConfig {
  id: string;
  name: string;
  type: 'stale_lead' | 'source_volume' | 'new_lead_followup';
  enabled: boolean;
  config: {
    thresholdHours?: number;
    thresholdCount?: number;
    delayHours?: number;
    messageTemplate?: string;
    actions: { type: 'sms' | 'call' | 'email'; waitMinutes: number }[];
    channels?: { sms: boolean; phone: boolean; email: boolean };
    sequence?: SequenceStep[];
    businessHoursSequence?: SequenceStep[];
    afterHoursSequence?: SequenceStep[];
    conversionStatuses?: string[];
    storeHours?: StoreHoursConfig;
  };
}

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  sms: MessageSquare,
  phone: Phone,
  email: Mail,
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDefaultChannels(): { sms: boolean; phone: boolean; email: boolean } {
  return { sms: true, phone: false, email: false };
}

function getDefaultStoreHours(): StoreHoursConfig {
  return { openTime: '09:00', closeTime: '19:00', closedDays: [0] };
}

function migrateActionsToSequence(actions: { type: string; waitMinutes: number }[]): SequenceStep[] {
  return actions.map(a => ({
    channel: (a.type === 'call' ? 'phone' : a.type) as 'sms' | 'phone' | 'email',
    waitMinutes: a.waitMinutes,
  }));
}

function SequenceBuilder({
  label,
  description,
  sequence,
  onChange,
  channels,
  testId,
}: {
  label: string;
  description?: string;
  sequence: SequenceStep[];
  onChange: (seq: SequenceStep[]) => void;
  channels: { sms: boolean; phone: boolean; email: boolean };
  testId: string;
}) {
  const enabledChannels = (Object.entries(channels) as [string, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => k as 'sms' | 'phone' | 'email');

  const firstEnabled = enabledChannels[0] || 'sms';

  return (
    <div data-testid={testId}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div>
          <Label className="text-xs font-medium">{label}</Label>
          {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange([...sequence, { channel: firstEnabled, waitMinutes: 30 }])}
          data-testid={`${testId}-add-step`}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Step
        </Button>
      </div>
      {sequence.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">No steps configured</p>
      ) : (
        <div className="space-y-2">
          {sequence.map((step, idx) => {
            const StepIcon = CHANNEL_ICONS[step.channel] || MessageSquare;
            return (
              <div key={idx} className="flex items-center gap-2 p-2 rounded border border-border" data-testid={`${testId}-step-${idx}`}>
                <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                <StepIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <select
                  className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs flex-1"
                  value={step.channel}
                  onChange={(e) => {
                    const updated = [...sequence];
                    updated[idx] = { ...updated[idx], channel: e.target.value as 'sms' | 'phone' | 'email' };
                    onChange(updated);
                  }}
                  data-testid={`${testId}-channel-${idx}`}
                >
                  {enabledChannels.map(ch => (
                    <option key={ch} value={ch}>{ch === 'sms' ? 'SMS' : ch === 'phone' ? 'Phone Call' : 'Email'}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <input
                    type="number"
                    className="flex h-8 w-16 rounded-md border border-input bg-background px-2 py-1 text-xs"
                    value={step.waitMinutes}
                    onChange={(e) => {
                      const updated = [...sequence];
                      updated[idx] = { ...updated[idx], waitMinutes: parseInt(e.target.value) || 0 };
                      onChange(updated);
                    }}
                    min="0"
                    data-testid={`${testId}-wait-${idx}`}
                  />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
                {sequence.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onChange(sequence.filter((_, i) => i !== idx))}
                    data-testid={`${testId}-remove-${idx}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConversionStatusesEditor({
  statuses,
  onChange,
}: {
  statuses: string[];
  onChange: (s: string[]) => void;
}) {
  const [newStatus, setNewStatus] = useState('');

  const addStatus = () => {
    const trimmed = newStatus.trim();
    if (trimmed && !statuses.includes(trimmed)) {
      onChange([...statuses, trimmed]);
      setNewStatus('');
    }
  };

  return (
    <div data-testid="trigger-conversion-statuses">
      <Label className="text-xs font-medium">Conversion Statuses</Label>
      <p className="text-[10px] text-muted-foreground mb-2">Follow-ups are suppressed when lead reaches these statuses</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {statuses.map((s) => (
          <Badge key={s} variant="secondary" className="text-xs gap-1">
            {s}
            <button
              onClick={() => onChange(statuses.filter(x => x !== s))}
              className="ml-0.5"
              data-testid={`conversion-status-remove-${s}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
        {statuses.length === 0 && <span className="text-xs text-muted-foreground">None configured</span>}
      </div>
      <div className="flex gap-2">
        <input
          className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs"
          placeholder="Add status (e.g. SOLD)"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStatus(); } }}
          data-testid="input-conversion-status"
        />
        <Button variant="outline" size="sm" onClick={addStatus} data-testid="button-add-conversion-status">
          Add
        </Button>
      </div>
    </div>
  );
}


interface KBDocument {
  id: number;
  name: string;
  type: string;
  size: number;
  status: string;
  organizationId: number | null;
  agentId: number | null;
  content: string | null;
  mimeType: string | null;
  createdAt: string;
  updatedAt: string;
}

const configSections = [
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'instructions', label: 'Instructions', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'triggers', label: 'Triggers', icon: Zap },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
  { id: 'activity', label: 'Activity', icon: Activity },
];

const artifactTypeIcons: Record<string, React.ElementType> = {
  IMAGE: ImageIcon,
  VIDEO: VideoIcon,
  COPY: FileText,
  SCORE: BarChart3,
  RADAR: Globe,
  VOICEOVER: Headphones,
};

export function AgentConfigPane() {
  const { toast } = useToast();
  const { selectedAgent, updateAgent } = useApp();
  const { setRightPaneOpen } = useUILayout();
  const [location] = useLocation();
  const isMarketingPage = location.startsWith('/marketing');
  const [activeConfigSection, setActiveConfigSection] = useState('performance');
  const [activePaneTab, setActivePaneTab] = useState<'artifacts' | 'configuration'>(isMarketingPage ? 'artifacts' : 'configuration');

  const vapiAssistantId = selectedAgent?.vapiAssistantId;

  const { data: vapiAnalytics, isLoading: analyticsLoading } = useQuery<any[]>({
    queryKey: ['/api/vapi/analytics'],
    enabled: !!vapiAssistantId,
    staleTime: 60000,
  });

  const { data: vapiCalls, isLoading: callsLoading } = useQuery<any[]>({
    queryKey: [`/api/vapi/calls?assistantId=${vapiAssistantId}&limit=10`],
    enabled: !!vapiAssistantId,
    staleTime: 60000,
  });

  const agentAnalytics = vapiAnalytics?.[0]?.result?.find(
    (r: any) => r.assistantId === vapiAssistantId
  );

  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const [editInstructions, setEditInstructions] = useState('');

  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<AgentTriggerConfig | null>(null);

  const [toolsModalOpen, setToolsModalOpen] = useState(false);
  const [editTools, setEditTools] = useState<AgentTool[]>([]);


  const { data: agentConversations, isLoading: conversationsLoading } = useQuery<any[]>({
    queryKey: ['/api/conversations', { agentId: selectedAgent?.id }],
    queryFn: async () => {
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/conversations?agentId=${selectedAgent?.id}`, {
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
    enabled: !!selectedAgent?.id,
  });

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateFile, setDuplicateFile] = useState<File | null>(null);
  const [duplicateExisting, setDuplicateExisting] = useState<{ id: number; name: string; type: string; size: number; createdAt: string } | null>(null);
  const [duplicateCsvData, setDuplicateCsvData] = useState<{ existingCsvData?: { rowCount: number; headers: string[]; previewRows: string[] }; newCsvData?: { rowCount: number; headers: string[]; previewRows: string[] } } | null>(null);
  const [uploadPending, setUploadPending] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const { data: knowledgeDocuments, isLoading: knowledgeLoading } = useQuery<KBDocument[]>({
    queryKey: ['/api/documents', selectedAgent?.id],
    queryFn: async () => {
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/documents?agentId=${selectedAgent?.id}`, {
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch documents');
      return res.json();
    },
    enabled: !!selectedAgent?.id,
  });

  const doUpload = useCallback(async (file: File, replaceExisting?: boolean) => {
    if (!selectedAgent) return;
    setUploadPending(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('agentId', String(selectedAgent.id));
    if (replaceExisting) formData.append('replaceExisting', 'true');
    try {
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        let errorMsg: string;
        try {
          const json = await res.json();
          errorMsg = json.message || res.statusText;
        } catch {
          const text = await res.text();
          errorMsg = text || res.statusText;
        }
        throw new Error(errorMsg);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({ title: 'Document uploaded', description: `${file.name} uploaded successfully.` });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message || 'Could not upload document.', variant: 'destructive' });
    } finally {
      setUploadPending(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [selectedAgent, toast]);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedAgent) return;
    const file = files[0];
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'File too large', description: `Maximum file size is 5 MB. Selected file is ${formatFileSize(file.size)}.`, variant: 'destructive' });
      return;
    }

    try {
      const token = getAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const checkRes = await fetch('/api/documents/check-duplicate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ filename: file.name }),
        credentials: 'include',
      });
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.isDuplicate && checkData.existingDocument) {
          setDuplicateFile(file);
          setDuplicateExisting(checkData.existingDocument);

          if (checkData.existingCsvData && file.name.toLowerCase().endsWith('.csv')) {
            const text = await file.text();
            const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
            const newHeaders = lines.length > 0 ? lines[0].split(',').map((h: string) => h.trim().replace(/^"|"$/g, '')) : [];
            const newRowCount = Math.max(0, lines.length - 1);
            const newPreviewRows = lines.slice(1, 6).map((line: string) => {
              const vals = line.split(',').map((v: string) => v.trim().replace(/^"|"$/g, ''));
              return newHeaders.map((h: string, i: number) => `${h}: ${vals[i] || ''}`).filter((s: string) => !s.endsWith(': ')).join('\n');
            });
            setDuplicateCsvData({
              existingCsvData: checkData.existingCsvData,
              newCsvData: { rowCount: newRowCount, headers: newHeaders, previewRows: newPreviewRows },
            });
          } else {
            setDuplicateCsvData(null);
          }

          setDuplicateDialogOpen(true);
          return;
        }
      }
    } catch {}

    doUpload(file);
  }, [selectedAgent, toast, doUpload]);

  const handleDuplicateReplace = useCallback(() => {
    if (duplicateFile) {
      doUpload(duplicateFile, true);
    }
    setDuplicateDialogOpen(false);
    setDuplicateFile(null);
    setDuplicateExisting(null);
    setDuplicateCsvData(null);
  }, [duplicateFile, doUpload]);

  const handleDuplicateKeepExisting = useCallback(() => {
    setDuplicateDialogOpen(false);
    setDuplicateFile(null);
    setDuplicateExisting(null);
    setDuplicateCsvData(null);
    toast({ title: 'Upload cancelled', description: 'Keeping existing document.' });
  }, [toast]);

  const handleDuplicateCancel = useCallback(() => {
    setDuplicateDialogOpen(false);
    setDuplicateFile(null);
    setDuplicateExisting(null);
    setDuplicateCsvData(null);
  }, []);

  const handleDeleteDocument = useCallback(async (docId: number, docName: string) => {
    try {
      await apiRequest('DELETE', `/api/documents/${docId}`);
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({ title: 'Document deleted', description: `${docName} has been removed.` });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message || 'Could not delete document.', variant: 'destructive' });
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleToggleStatus = () => {
    if (!selectedAgent) return;
    const newStatus = selectedAgent.status === 'active' ? 'inactive' : 'active';
    updateAgent(selectedAgent.id, { status: newStatus, updatedAt: new Date() });
  };

  const openInstructionsModal = () => {
    if (!selectedAgent) return;
    setEditInstructions(selectedAgent.instructions ?? '');
    setInstructionsModalOpen(true);
  };

  const saveInstructions = () => {
    if (!selectedAgent) return;
    updateAgent(selectedAgent.id, { instructions: editInstructions, updatedAt: new Date() });
    setInstructionsModalOpen(false);
  };

  const agentTriggers: AgentTriggerConfig[] = ((selectedAgent as any)?.triggers as AgentTriggerConfig[]) || [];

  const saveTrigger = (trigger: AgentTriggerConfig) => {
    if (!selectedAgent) return;
    const existing = [...agentTriggers];
    const idx = existing.findIndex(t => t.id === trigger.id);
    if (idx >= 0) existing[idx] = trigger;
    else existing.push(trigger);
    updateAgent(selectedAgent.id, { triggers: existing } as any);
    setTriggerModalOpen(false);
    setEditingTrigger(null);
  };

  const deleteTrigger = (triggerId: string) => {
    if (!selectedAgent) return;
    const remaining = agentTriggers.filter(t => t.id !== triggerId);
    updateAgent(selectedAgent.id, { triggers: remaining } as any);
  };

  const toggleTriggerEnabled = (triggerId: string) => {
    if (!selectedAgent) return;
    const updated = agentTriggers.map(t => t.id === triggerId ? { ...t, enabled: !t.enabled } : t);
    updateAgent(selectedAgent.id, { triggers: updated } as any);
  };

  const openToolsModal = () => {
    if (!selectedAgent) return;
    const currentTools = (selectedAgent as any).tools || [];
    const agentToolIds = currentTools.map((t: any) => t.id);
    const allTools = availableTools.map(t => ({
      ...t,
      enabled: agentToolIds.includes(t.id) ? (currentTools.find((st: any) => st.id === t.id)?.enabled ?? false) : false,
    }));
    setEditTools(allTools);
    setToolsModalOpen(true);
  };

  const saveTools = () => {
    if (!selectedAgent) return;
    const enabledTools = editTools.filter(t => t.enabled);
    updateAgent(selectedAgent.id, { settings: { ...(selectedAgent.settings as Record<string, unknown>), tools: enabledTools }, updatedAt: new Date() });
    setToolsModalOpen(false);
  };

  const toggleTool = (index: number) => {
    setEditTools(prev => prev.map((t, i) => i === index ? { ...t, enabled: !t.enabled } : t));
  };

  if (!selectedAgent) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <p className="text-sm text-muted-foreground">Select an agent to view configuration</p>
      </div>
    );
  }

  const renderConfigContent = () => {
    switch (activeConfigSection) {
      case 'performance':
        return (
          <div className="p-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Channel</p>
              <div className="flex gap-3 flex-wrap">
                {(selectedAgent.channels || []).filter(Boolean).map((ch: string) => {
                  const Icon = channelIcons[ch as AgentChannel] || Phone;
                  return (
                    <div key={ch} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border" data-testid={`channel-${ch}`}>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm capitalize text-foreground">{ch}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Agent Information</p>
              <div className="space-y-2">
                {selectedAgent.customerLink && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border" data-testid="agent-customer-link">
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Customer Link</p>
                        <p className="text-sm text-foreground truncate">{selectedAgent.customerLink}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(selectedAgent.customerLink!); toast({ title: 'Link copied', description: 'Customer link copied to clipboard.' }); }} data-testid="button-copy-customer-link">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => window.open(selectedAgent.customerLink ?? undefined, '_blank')} data-testid="button-open-customer-link">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
                {selectedAgent.assignedPhone && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border" data-testid="agent-assigned-phone">
                    <div className="flex items-center gap-2 min-w-0">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Assigned Phone</p>
                        <p className="text-sm text-foreground">{selectedAgent.assignedPhone}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => { navigator.clipboard.writeText(selectedAgent.assignedPhone!); toast({ title: 'Phone copied', description: 'Phone number copied to clipboard.' }); }} data-testid="button-copy-phone">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                {selectedAgent.customerLink && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border" data-testid="agent-chat-link">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Text Chat Link</p>
                        <p className="text-sm text-foreground truncate">{selectedAgent.customerLink}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(selectedAgent.customerLink!); toast({ title: 'Link copied', description: 'Chat link copied to clipboard.' }); }} data-testid="button-copy-chat-link">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => window.open(selectedAgent.customerLink ?? undefined, '_blank')} data-testid="button-open-chat-link">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Metrics (Live)</p>
              <div className="grid grid-cols-1 gap-3">
                {analyticsLoading ? (
                  <>
                    <Skeleton className="h-[72px] rounded-xl" />
                    <Skeleton className="h-[72px] rounded-xl" />
                    <Skeleton className="h-[72px] rounded-xl" />
                  </>
                ) : (
                  <>
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between" data-testid="metric-calls">
                        <div>
                          <p className="text-xs text-muted-foreground">Calls (7d)</p>
                          <p className="text-lg font-bold text-foreground">{agentAnalytics?.countId || '0'}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {vapiAssistantId ? 'VAPI Live' : 'No VAPI ID'}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between" data-testid="metric-cost">
                        <div>
                          <p className="text-xs text-muted-foreground">Total Cost (7d)</p>
                          <p className="text-lg font-bold text-foreground">
                            ${agentAnalytics?.sumCost != null ? agentAnalytics.sumCost.toFixed(2) : '0.00'}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs text-green-600 dark:text-green-400">USD</Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between" data-testid="metric-duration">
                        <div>
                          <p className="text-xs text-muted-foreground">Avg Duration</p>
                          <p className="text-lg font-bold text-foreground">
                            {agentAnalytics?.avgDuration != null
                              ? `${Math.round(agentAnalytics.avgDuration * 60)}s`
                              : '—'}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs text-green-600 dark:text-green-400">Per call</Badge>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      case 'instructions':
        return (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">System Prompt</p>
              <Button variant="outline" size="sm" onClick={openInstructionsModal} data-testid="button-edit-instructions">
                <Pencil className="h-3 w-3 mr-1.5" />
                Edit
              </Button>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {selectedAgent.instructions}
            </p>
          </div>
        );
      case 'settings':
        const agentSettings = (selectedAgent as any).settings || {};
        return (
          <div className="p-4 space-y-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI Behavior</p>
            <div className="space-y-4">
              <div>
                <Label className="text-xs">AI Model</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                  value={agentSettings.aiModel || 'claude-sonnet-4-20250514'}
                  onChange={(e) => {
                    const newSettings = { ...agentSettings, aiModel: e.target.value };
                    updateAgent(selectedAgent.id, { settings: newSettings } as any);
                  }}
                  data-testid="select-agent-model"
                >
                  <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                  <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Temperature ({agentSettings.temperature ?? 0.7})</Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={agentSettings.temperature ?? 0.7}
                  onChange={(e) => {
                    const newSettings = { ...agentSettings, temperature: parseFloat(e.target.value) };
                    updateAgent(selectedAgent.id, { settings: newSettings } as any);
                  }}
                  className="w-full mt-1"
                  data-testid="slider-agent-temperature"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>
              <div>
                <Label className="text-xs">Response Style</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                  value={agentSettings.responseStyle || 'professional'}
                  onChange={(e) => {
                    const newSettings = { ...agentSettings, responseStyle: e.target.value };
                    updateAgent(selectedAgent.id, { settings: newSettings } as any);
                  }}
                  data-testid="select-agent-style"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="concise">Concise</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
              <div>
                <Label className="text-xs">Max Response Length</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                  value={agentSettings.maxResponseLength || 'medium'}
                  onChange={(e) => {
                    const newSettings = { ...agentSettings, maxResponseLength: e.target.value };
                    updateAgent(selectedAgent.id, { settings: newSettings } as any);
                  }}
                  data-testid="select-agent-max-length"
                >
                  <option value="short">Short (1-2 paragraphs)</option>
                  <option value="medium">Medium (3-4 paragraphs)</option>
                  <option value="long">Long (detailed)</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-3">
              <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
              Settings are saved automatically when changed.
            </p>
          </div>
        );
      case 'triggers':
        const isCommunicationsAgent = (selectedAgent.channels || []).some((ch: string) => ['voice', 'sms', 'video'].includes(ch));
        return (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agent Triggers</p>
              {isCommunicationsAgent && (
                <Button variant="outline" size="sm" onClick={() => {
                  setEditingTrigger({
                    id: `trg-${Date.now()}`,
                    name: '',
                    type: 'stale_lead',
                    enabled: true,
                    config: {
                      thresholdHours: 24,
                      actions: [{ type: 'sms', waitMinutes: 0 }],
                      channels: getDefaultChannels(),
                      businessHoursSequence: [{ channel: 'sms', waitMinutes: 0 }],
                      afterHoursSequence: [],
                      conversionStatuses: ['SOLD'],
                      storeHours: getDefaultStoreHours(),
                    },
                  });
                  setTriggerModalOpen(true);
                }} data-testid="button-add-trigger">
                  <Plus className="h-3 w-3 mr-1.5" />
                  Add Trigger
                </Button>
              )}
            </div>
            {!isCommunicationsAgent ? (
              <div className="text-center py-6">
                <Zap className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Triggers are only available for the Communications Agent</p>
                <p className="text-xs text-muted-foreground mt-1">Knowledge agents use chat-only interactions</p>
              </div>
            ) : agentTriggers.length === 0 ? (
              <div className="text-center py-6">
                <Zap className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No triggers configured</p>
                <p className="text-xs text-muted-foreground mt-1">Add triggers to automate lead follow-up</p>
              </div>
            ) : (
              <div className="space-y-2">
                {agentTriggers.map((trigger) => (
                  <div key={trigger.id} className="p-3 rounded-lg border border-border" data-testid={`trigger-row-${trigger.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{trigger.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {trigger.type === 'stale_lead' ? `Stale after ${trigger.config.thresholdHours}h` : trigger.type === 'new_lead_followup' ? `Follow-up ${trigger.config.delayHours || 48}h after lead created` : `Below ${trigger.config.thresholdCount}/week`}
                          {trigger.config.channels ? (
                            <>{' · '}{Object.entries(trigger.config.channels).filter(([, v]) => v).map(([k]) => k.toUpperCase()).join(', ')}</>
                          ) : trigger.type !== 'new_lead_followup' && trigger.config.actions ? (
                            <>{' · '}{trigger.config.actions.map(a => a.type.toUpperCase()).join(' → ')}</>
                          ) : trigger.type === 'new_lead_followup' ? ' · SMS' : null}
                          {trigger.config.businessHoursSequence && trigger.config.businessHoursSequence.length > 0 && (
                            <>{' · '}{trigger.config.businessHoursSequence.length} step{trigger.config.businessHoursSequence.length !== 1 ? 's' : ''}</>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTrigger({ ...trigger }); setTriggerModalOpen(true); }} data-testid={`trigger-edit-${trigger.id}`}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteTrigger(trigger.id)} data-testid={`trigger-delete-${trigger.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Switch
                          checked={trigger.enabled}
                          onCheckedChange={() => toggleTriggerEnabled(trigger.id)}
                          data-testid={`trigger-toggle-${trigger.id}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <Info className="h-3 w-3 flex-shrink-0" />
              {isCommunicationsAgent ? 'Triggers fire automated actions when conditions are met' : 'Only Communications Agents support triggers'}
            </p>
          </div>
        );
      case 'tools':
        return (
          <div className="p-4 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tools</p>
                <Button variant="outline" size="sm" onClick={openToolsModal} data-testid="button-edit-tools">
                  <Wrench className="h-3 w-3 mr-1.5" />
                  Manage
                </Button>
              </div>
              <div className="space-y-2">
                {((selectedAgent as any).tools || []).map((tool: any) => (
                  <div key={tool.id} className="flex items-center justify-between p-3 rounded-lg border border-border" data-testid={`tool-${tool.id}`}>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{tool.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                    </div>
                    <Badge variant={tool.enabled ? 'default' : 'secondary'}>
                      {tool.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
                {((selectedAgent as any).tools || []).length === 0 && (
                  <div className="text-center py-6">
                    <Wrench className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No tools configured</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={openToolsModal} data-testid="button-add-tools">
                      Add Tools
                    </Button>
                  </div>
                )}
              </div>
            </div>

          </div>
        );
      case 'knowledge':
        return (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">References</p>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="button-upload-reference">
                <Plus className="h-3 w-3 mr-1.5" />
                Upload Reference
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.csv,.txt"
                onChange={(e) => handleFileUpload(e.target.files)}
                data-testid="knowledge-file-input"
              />
            </div>
            <div className="space-y-2">
              {knowledgeLoading ? (
                <>
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </>
              ) : knowledgeDocuments && knowledgeDocuments.length > 0 ? (
                knowledgeDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border" data-testid={`reference-${doc.id}`}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.type} - {(doc.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="secondary">{doc.status}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDocument(doc.id, doc.name)} data-testid={`reference-delete-${doc.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
              <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
              References stored for agent context. Auto-indexing controlled by Knowledge Base settings.
            </p>
          </div>
        );
      case 'activity':
        return (
          <div className="p-4 space-y-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2" data-testid="activity-heading">Conversations</p>
              {conversationsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 rounded-lg" />
                  <Skeleton className="h-14 rounded-lg" />
                </div>
              ) : agentConversations && agentConversations.length > 0 ? (
                <div className="space-y-2">
                  {agentConversations.slice(0, 15).map((conv: any) => (
                    <div key={conv.id} className="p-3 rounded-lg border border-border" data-testid={`conv-${conv.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground truncate">{conv.customerName || 'Unknown'}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">{conv.lastMessageAt ? formatTimeAgo(conv.lastMessageAt) : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{conv.channel}</Badge>
                        <Badge variant={conv.status === 'open' ? 'default' : 'secondary'} className="text-[10px]">{conv.status}</Badge>
                        {conv.unreadCount > 0 && <Badge className="text-[10px] bg-red-500">{conv.unreadCount} unread</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <MessageSquare className="h-6 w-6 mx-auto text-muted-foreground/40 mb-1" />
                  <p className="text-xs text-muted-foreground">No conversations yet</p>
                </div>
              )}
            </div>
            {vapiAssistantId && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Recent Calls</p>
                {callsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 rounded-lg" />
                    <Skeleton className="h-16 rounded-lg" />
                  </div>
                ) : vapiCalls && vapiCalls.length > 0 ? (
                  vapiCalls.map((call: any) => (
                    <div key={call.id} className="p-3 rounded-lg border border-border space-y-1.5" data-testid={`call-${call.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Headphones className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{call.customer || 'Unknown'}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{call.startedAt ? formatTimeAgo(call.startedAt) : ''}</span>
                      </div>
                      {call.summary && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{call.summary}</p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>{formatDuration(call.duration)}</span>
                        {call.cost != null && <span>${call.cost.toFixed(4)}</span>}
                        {call.recordingUrl && (
                          <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-0.5" data-testid={`call-recording-${call.id}`}>
                            Recording <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                        {call.transcript && (
                          <button className="text-primary hover:underline" onClick={() => { navigator.clipboard.writeText(call.transcript); toast({ title: 'Transcript copied' }); }} data-testid={`call-transcript-${call.id}`}>
                            Copy Transcript
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Headphones className="h-6 w-6 mx-auto text-muted-foreground/40 mb-1" />
                    <p className="text-xs text-muted-foreground">No recent calls</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const marketingAgentParam = isMarketingPage ? new URLSearchParams(window.location.search).get('agent') : null;
  const activeMarketingAgent = marketingAgentParam ? MARKETING_AGENTS.find(a => a.id === marketingAgentParam) : null;
  const marketingArtifacts: MarketingArtifact[] = activeMarketingAgent
    ? getSessionsForAgent(activeMarketingAgent.id).flatMap(s => s.artifacts)
    : isMarketingPage
      ? MARKETING_AGENTS.flatMap(a => getSessionsForAgent(a.id).flatMap(s => s.artifacts))
      : [];

  const renderArtifactsContent = () => {
    if (marketingArtifacts.length === 0) {
      return (
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">No artifacts yet.</p>
          <p className="text-[10px] text-muted-foreground mt-1">Start a conversation to generate images, videos, copy, and more.</p>
        </div>
      );
    }
    return (
      <div className="p-2 space-y-1">
        {marketingArtifacts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(art => {
          const ArtIcon = artifactTypeIcons[art.type] || FileText;
          const agentDef = MARKETING_AGENTS.find(a => a.id === art.agentId);
          return (
            <div
              key={art.id}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
              data-testid={`artifact-item-${art.id}`}
            >
              {art.thumbnailUrl ? (
                <img src={art.thumbnailUrl} alt={art.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-md bg-muted/30 flex items-center justify-center flex-shrink-0">
                  <ArtIcon className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{art.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5">{getArtifactTypeLabel(art.type)}</Badge>
                  {agentDef && !activeMarketingAgent && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5" style={{ color: agentDef.accentColor }}>{agentDef.name.split(' ')[0]}</Badge>
                  )}
                  <span className="text-[9px] text-muted-foreground">{timeAgo(art.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {isMarketingPage ? (
          <>
            <div className="border-b border-border">
              <div className="flex">
                <button
                  className={cn(
                    'flex-1 py-2.5 text-xs font-medium text-center transition-colors border-b-2',
                    activePaneTab === 'artifacts'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setActivePaneTab('artifacts')}
                  data-testid="tab-pane-artifacts"
                >
                  Artifacts
                </button>
                <button
                  className={cn(
                    'flex-1 py-2.5 text-xs font-medium text-center transition-colors border-b-2',
                    activePaneTab === 'configuration'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setActivePaneTab('configuration')}
                  data-testid="tab-pane-configuration"
                >
                  Configuration
                </button>
              </div>
            </div>
            {activePaneTab === 'artifacts' ? (
              <ScrollArea className="flex-1">
                {renderArtifactsContent()}
              </ScrollArea>
            ) : (
              <>
                <div className="border-b border-border">
                  <div className="flex flex-col">
                    {configSections.map(section => {
                      const Icon = section.icon;
                      return (
                        <button
                          key={section.id}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover-elevate text-left',
                            activeConfigSection === section.id
                              ? 'text-foreground bg-accent font-medium'
                              : 'text-muted-foreground'
                          )}
                          onClick={() => setActiveConfigSection(section.id)}
                          data-testid={`config-section-${section.id}`}
                        >
                          <Icon className="h-4 w-4" />
                          {section.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {renderConfigContent()}
                </ScrollArea>
                <div className="p-3 border-t border-border flex justify-center">
                  <Button
                    variant={selectedAgent.status === 'active' ? 'outline' : 'default'}
                    size="sm"
                    onClick={handleToggleStatus}
                    data-testid="button-toggle-agent-status"
                  >
                    {selectedAgent.status === 'active' ? (
                      <>
                        <Pause className="h-3.5 w-3.5 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Configuration</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedAgent.status === 'active' ? 'outline' : 'default'}
                  size="sm"
                  onClick={handleToggleStatus}
                  data-testid="button-toggle-agent-status"
                >
                  {selectedAgent.status === 'active' ? (
                    <>
                      <Pause className="h-3.5 w-3.5 mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5 mr-1" />
                      Activate
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="border-b border-border">
              <div className="flex flex-col">
                {configSections.map(section => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover-elevate text-left',
                        activeConfigSection === section.id
                          ? 'text-foreground bg-accent font-medium'
                          : 'text-muted-foreground'
                      )}
                      onClick={() => setActiveConfigSection(section.id)}
                      data-testid={`config-section-${section.id}`}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <ScrollArea className="flex-1">
              {renderConfigContent()}
            </ScrollArea>
          </>
        )}
      </div>

      <Dialog open={instructionsModalOpen} onOpenChange={setInstructionsModalOpen}>
        <DialogContent className="sm:max-w-2xl" data-testid="modal-edit-instructions">
          <DialogHeader>
            <DialogTitle>Edit Instructions</DialogTitle>
            <DialogDescription>
              Define how {selectedAgent?.name} should behave and respond to customers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">System Prompt</Label>
              <Textarea
                value={editInstructions}
                onChange={e => setEditInstructions(e.target.value)}
                className="min-h-[200px] resize-none font-mono text-sm"
                data-testid="textarea-instructions"
              />
            </div>
            <div className="rounded-lg border border-border p-3 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-1">Tips</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>Be specific about the agent's role and responsibilities</li>
                <li>Define the tone and communication style</li>
                <li>Include any constraints or limitations</li>
                <li>Specify escalation procedures for complex requests</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInstructionsModalOpen(false)} data-testid="button-cancel-instructions">
              Cancel
            </Button>
            <Button onClick={saveInstructions} data-testid="button-save-instructions">
              Save Instructions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={triggerModalOpen} onOpenChange={(open) => { setTriggerModalOpen(open); if (!open) setEditingTrigger(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="modal-edit-trigger">
          <DialogHeader>
            <DialogTitle>{editingTrigger && agentTriggers.some(t => t.id === editingTrigger.id) ? 'Edit' : 'Add'} Trigger</DialogTitle>
            <DialogDescription>
              Configure automated actions for {selectedAgent?.name}
            </DialogDescription>
          </DialogHeader>
          {editingTrigger && (
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-5 pb-2">
                <div>
                  <Label className="text-xs">Trigger Name</Label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                    value={editingTrigger.name}
                    onChange={(e) => setEditingTrigger({ ...editingTrigger, name: e.target.value })}
                    placeholder="e.g., Stale Lead Follow-up"
                    data-testid="input-trigger-name"
                  />
                </div>
                <div>
                  <Label className="text-xs">Trigger Type</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                    value={editingTrigger.type}
                    onChange={(e) => {
                      const newType = e.target.value as 'stale_lead' | 'source_volume' | 'new_lead_followup';
                      let newConfig = { ...editingTrigger.config };
                      if (newType === 'stale_lead') {
                        newConfig = { ...newConfig, thresholdHours: newConfig.thresholdHours || 24 };
                      } else if (newType === 'source_volume') {
                        newConfig = { ...newConfig, thresholdCount: newConfig.thresholdCount || 10 };
                      } else if (newType === 'new_lead_followup') {
                        newConfig = {
                          ...newConfig,
                          delayHours: newConfig.delayHours || 48,
                          messageTemplate: newConfig.messageTemplate || 'Hi {customerFirstName}, this is {agentName} from {dealerStoreName}. I just wanted to follow up with you to see if you had any questions and if your experience with our dealer so far has been a good one. Please let me know if I can be of any assistance or if you have any feedback.',
                          actions: [{ type: 'sms', waitMinutes: 0 }],
                        };
                      }
                      if (!newConfig.channels) newConfig.channels = getDefaultChannels();
                      if (!newConfig.conversionStatuses) newConfig.conversionStatuses = ['SOLD'];
                      setEditingTrigger({ ...editingTrigger, type: newType, config: newConfig });
                    }}
                    data-testid="select-trigger-type"
                  >
                    <option value="stale_lead">Stale Lead (no activity for X hours)</option>
                    <option value="source_volume">Source Volume Drop (below X per week)</option>
                    <option value="new_lead_followup">New Lead Follow-up (SMS after X hours)</option>
                  </select>
                </div>
                {editingTrigger.type === 'new_lead_followup' ? (
                  <>
                    <div>
                      <Label className="text-xs">Hours after lead created</Label>
                      <input
                        type="number"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                        value={editingTrigger.config.delayHours || 48}
                        onChange={(e) => setEditingTrigger({ ...editingTrigger, config: { ...editingTrigger.config, delayHours: parseInt(e.target.value) || 1 } })}
                        min="1"
                        data-testid="input-delay-hours"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Message Template</Label>
                      <p className="text-[10px] text-muted-foreground mt-0.5 mb-1">
                        Use {'{customerFirstName}'}, {'{agentName}'}, {'{dealerStoreName}'} as placeholders
                      </p>
                      <textarea
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 min-h-[100px] resize-y"
                        value={editingTrigger.config.messageTemplate || ''}
                        onChange={(e) => setEditingTrigger({ ...editingTrigger, config: { ...editingTrigger.config, messageTemplate: e.target.value } })}
                        data-testid="textarea-message-template"
                      />
                    </div>
                  </>
                ) : editingTrigger.type === 'stale_lead' ? (
                  <div>
                    <Label className="text-xs">Hours without activity</Label>
                    <input
                      type="number"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                      value={editingTrigger.config.thresholdHours || 24}
                      onChange={(e) => setEditingTrigger({ ...editingTrigger, config: { ...editingTrigger.config, thresholdHours: parseInt(e.target.value) || 1 } })}
                      min="1"
                      data-testid="input-threshold-hours"
                    />
                  </div>
                ) : (
                  <div>
                    <Label className="text-xs">Minimum leads per week</Label>
                    <input
                      type="number"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1"
                      value={editingTrigger.config.thresholdCount || 10}
                      onChange={(e) => setEditingTrigger({ ...editingTrigger, config: { ...editingTrigger.config, thresholdCount: parseInt(e.target.value) || 1 } })}
                      min="1"
                      data-testid="input-threshold-count"
                    />
                  </div>
                )}

                <div className="border-t border-border pt-4">
                  <Label className="text-xs font-medium">Channel Enablement</Label>
                  <p className="text-[10px] text-muted-foreground mb-2">Select which channels this trigger can use</p>
                  <div className="flex gap-4 flex-wrap">
                    {(['sms', 'phone', 'email'] as const).map(ch => {
                      const ChIcon = CHANNEL_ICONS[ch];
                      const channels = editingTrigger.config.channels || getDefaultChannels();
                      return (
                        <label key={ch} className="flex items-center gap-2 cursor-pointer" data-testid={`trigger-channel-${ch}`}>
                          <Checkbox
                            checked={channels[ch]}
                            onCheckedChange={(checked) => {
                              const updatedChannels = { ...channels, [ch]: !!checked };
                              setEditingTrigger({
                                ...editingTrigger,
                                config: { ...editingTrigger.config, channels: updatedChannels },
                              });
                            }}
                          />
                          <ChIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{ch === 'sms' ? 'SMS' : ch === 'phone' ? 'Phone' : 'Email'}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <SequenceBuilder
                    label="Business Hours Sequence"
                    description="Steps executed during business hours"
                    sequence={editingTrigger.config.businessHoursSequence || (editingTrigger.config.actions?.length ? migrateActionsToSequence(editingTrigger.config.actions) : [])}
                    onChange={(seq) => setEditingTrigger({
                      ...editingTrigger,
                      config: { ...editingTrigger.config, businessHoursSequence: seq },
                    })}
                    channels={editingTrigger.config.channels || getDefaultChannels()}
                    testId="trigger-sequence-builder"
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <SequenceBuilder
                    label="After Hours / Closed Days"
                    description="Steps executed when the store is closed (more autonomy)"
                    sequence={editingTrigger.config.afterHoursSequence || []}
                    onChange={(seq) => setEditingTrigger({
                      ...editingTrigger,
                      config: { ...editingTrigger.config, afterHoursSequence: seq },
                    })}
                    channels={editingTrigger.config.channels || getDefaultChannels()}
                    testId="trigger-after-hours-sequence"
                  />
                </div>

                <div className="border-t border-border pt-4" data-testid="trigger-store-hours">
                  <Label className="text-xs font-medium">Store Hours</Label>
                  <p className="text-[10px] text-muted-foreground mb-3">Define business hours for sequence selection</p>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-center flex-wrap">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">Open</Label>
                        <input
                          type="time"
                          className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
                          value={(editingTrigger.config.storeHours || getDefaultStoreHours()).openTime}
                          onChange={(e) => {
                            const sh = editingTrigger.config.storeHours || getDefaultStoreHours();
                            setEditingTrigger({
                              ...editingTrigger,
                              config: { ...editingTrigger.config, storeHours: { ...sh, openTime: e.target.value } },
                            });
                          }}
                          data-testid="input-store-open-time"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">Close</Label>
                        <input
                          type="time"
                          className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
                          value={(editingTrigger.config.storeHours || getDefaultStoreHours()).closeTime}
                          onChange={(e) => {
                            const sh = editingTrigger.config.storeHours || getDefaultStoreHours();
                            setEditingTrigger({
                              ...editingTrigger,
                              config: { ...editingTrigger.config, storeHours: { ...sh, closeTime: e.target.value } },
                            });
                          }}
                          data-testid="input-store-close-time"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Closed Days</Label>
                      <div className="flex gap-2 flex-wrap">
                        {DAY_LABELS.map((day, idx) => {
                          const closedDays = (editingTrigger.config.storeHours || getDefaultStoreHours()).closedDays;
                          const isClosed = closedDays.includes(idx);
                          return (
                            <label key={day} className="flex items-center gap-1.5 cursor-pointer" data-testid={`store-closed-day-${idx}`}>
                              <Checkbox
                                checked={isClosed}
                                onCheckedChange={(checked) => {
                                  const sh = editingTrigger.config.storeHours || getDefaultStoreHours();
                                  const newClosed = checked
                                    ? [...sh.closedDays, idx]
                                    : sh.closedDays.filter(d => d !== idx);
                                  setEditingTrigger({
                                    ...editingTrigger,
                                    config: { ...editingTrigger.config, storeHours: { ...sh, closedDays: newClosed } },
                                  });
                                }}
                              />
                              <span className="text-xs">{day}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <ConversionStatusesEditor
                    statuses={editingTrigger.config.conversionStatuses || ['SOLD']}
                    onChange={(statuses) => setEditingTrigger({
                      ...editingTrigger,
                      config: { ...editingTrigger.config, conversionStatuses: statuses },
                    })}
                  />
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTriggerModalOpen(false); setEditingTrigger(null); }} data-testid="button-cancel-trigger">
              Cancel
            </Button>
            <Button onClick={() => editingTrigger && saveTrigger(editingTrigger)} disabled={!editingTrigger?.name} data-testid="button-save-trigger">
              Save Trigger
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={toolsModalOpen} onOpenChange={setToolsModalOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="modal-edit-tools">
          <DialogHeader>
            <DialogTitle>Manage Tools</DialogTitle>
            <DialogDescription>
              Enable or disable tools that {selectedAgent?.name} can use
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2 pr-2">
              {editTools.map((tool, i) => (
                <div key={tool.id} className={cn(
                  'flex items-center justify-between p-4 rounded-lg border transition-colors',
                  tool.enabled ? 'border-primary/30 bg-primary/5' : 'border-border'
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Wrench className={cn('h-4 w-4 flex-shrink-0', tool.enabled ? 'text-primary' : 'text-muted-foreground')} />
                      <p className="text-sm font-medium text-foreground">{tool.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-6">{tool.description}</p>
                  </div>
                  <Switch
                    checked={tool.enabled}
                    onCheckedChange={() => toggleTool(i)}
                    data-testid={`tool-switch-${tool.id}`}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <p className="text-xs text-muted-foreground">{editTools.filter(t => t.enabled).length} of {editTools.length} tools enabled</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setToolsModalOpen(false)} data-testid="button-cancel-tools">
                  Cancel
                </Button>
                <Button onClick={saveTools} data-testid="button-save-tools">
                  Save Tools
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={knowledgeModalOpen} onOpenChange={setKnowledgeModalOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="modal-manage-knowledge">
          <DialogHeader>
            <DialogTitle>Manage Knowledge Base</DialogTitle>
            <DialogDescription>
              Upload documents and configure training data for {selectedAgent?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              {knowledgeLoading ? (
                <>
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </>
              ) : knowledgeDocuments && knowledgeDocuments.length > 0 ? (
                knowledgeDocuments.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.type} - {(doc.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{doc.status}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDocument(doc.id, doc.name)} data-testid={`kb-delete-${doc.id}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                </div>
              )}
            </div>

            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              data-testid="knowledge-upload-area"
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-foreground">Upload New Knowledge</p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag files here or click to browse. Supports PDF, DOCX, CSV, TXT
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKnowledgeModalOpen(false)} data-testid="button-close-knowledge">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className={duplicateCsvData ? "sm:max-w-2xl" : undefined}>
          <DialogHeader>
            <DialogTitle>Duplicate File Found</DialogTitle>
            <DialogDescription>A document with this name already exists in your knowledge base.</DialogDescription>
          </DialogHeader>
          {duplicateExisting && (
            <div className="py-2 space-y-3">
              <div className="rounded-lg border border-border p-3 space-y-1">
                <p className="text-sm font-medium text-foreground" data-testid="text-duplicate-name">{duplicateExisting.name}</p>
                <p className="text-xs text-muted-foreground">Type: {duplicateExisting.type.toUpperCase()} &middot; Size: {formatFileSize(duplicateExisting.size)}</p>
              </div>
              {duplicateCsvData ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">This CSV file already exists. Compare the records below and choose which version to keep.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Existing</Badge>
                        <span className="text-xs text-muted-foreground">{duplicateCsvData.existingCsvData?.rowCount ?? 0} rows</span>
                      </div>
                      {duplicateCsvData.existingCsvData?.headers && duplicateCsvData.existingCsvData.headers.length > 0 && (
                        <p className="text-xs text-muted-foreground">Columns: {duplicateCsvData.existingCsvData.headers.join(', ')}</p>
                      )}
                      <ScrollArea className="max-h-[160px]">
                        <div className="space-y-1">
                          {(duplicateCsvData.existingCsvData?.previewRows || []).map((row, i) => (
                            <div key={i} className="rounded border border-border p-2 text-xs text-muted-foreground font-mono whitespace-pre-wrap" data-testid={`existing-csv-row-${i}`}>
                              {row}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">New Upload</Badge>
                        <span className="text-xs text-muted-foreground">{duplicateCsvData.newCsvData?.rowCount ?? 0} rows</span>
                      </div>
                      {duplicateCsvData.newCsvData?.headers && duplicateCsvData.newCsvData.headers.length > 0 && (
                        <p className="text-xs text-muted-foreground">Columns: {duplicateCsvData.newCsvData.headers.join(', ')}</p>
                      )}
                      <ScrollArea className="max-h-[160px]">
                        <div className="space-y-1">
                          {(duplicateCsvData.newCsvData?.previewRows || []).map((row, i) => (
                            <div key={i} className="rounded border border-border p-2 text-xs text-muted-foreground font-mono whitespace-pre-wrap" data-testid={`new-csv-row-${i}`}>
                              {row}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Would you like to replace the existing document with the new upload?</p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleDuplicateCancel} data-testid="button-duplicate-cancel">Cancel</Button>
            {duplicateCsvData && (
              <Button variant="secondary" onClick={handleDuplicateKeepExisting} data-testid="button-duplicate-keep-existing">
                Keep Existing
              </Button>
            )}
            <Button onClick={handleDuplicateReplace} disabled={uploadPending} data-testid="button-duplicate-replace">
              {uploadPending ? 'Replacing...' : 'Replace with New'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
