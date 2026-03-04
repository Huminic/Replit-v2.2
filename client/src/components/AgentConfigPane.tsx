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
 * PRODUCTION NOTE: All config will persist to backend. Skills and tools will be
 * dynamically loaded from the AI engine configuration.
 *
 * @see client/src/pages/agents.tsx — Center chat interface for the selected agent
 * @see client/src/mocks/agents.ts — Agent type, availableTools, AgentChannel/Trigger/Tool types
 * @see client/src/contexts/AppContext.tsx — selectedAgent, updateAgent, setRightPaneOpen
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  Sparkles,
  Check,
  Headphones,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useApp } from '@/contexts/AppContext';
import { availableTools, type AgentChannel, type AgentTrigger, type AgentTool } from '@/lib/agent-utils';

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

const agentTriggersMock = [
  { id: 'trg-1', name: 'New lead 5min', schedule: 'Event', enabled: true },
  { id: 'trg-2', name: 'Daily follow-up', schedule: '9:00 AM', enabled: true },
  { id: 'trg-3', name: 'Stale lead check', schedule: '*/4h', enabled: false },
];

const assignedSkillsMock = [
  { id: 'sk-1', name: 'Lead Qualifier', active: true },
  { id: 'sk-2', name: 'Follow-Up Sequencer', active: true },
  { id: 'sk-3', name: 'Email Responder', active: true },
];

const skillsCatalog = [
  { id: 'cat-1', name: 'Lead Qualifier', category: 'Sales', enabled: true },
  { id: 'cat-2', name: 'Payment Calculator', category: 'Sales', enabled: false },
  { id: 'cat-3', name: 'Follow-Up Sequencer', category: 'Sales', enabled: true },
  { id: 'cat-4', name: 'Objection Handler', category: 'Sales', enabled: false },
  { id: 'cat-5', name: 'Trade-In Evaluator', category: 'Sales', enabled: false },
  { id: 'cat-6', name: 'Deal Structurer', category: 'Finance', enabled: false },
  { id: 'cat-7', name: 'Credit App Processor', category: 'Finance', enabled: false },
  { id: 'cat-8', name: 'Lease vs Buy Advisor', category: 'Finance', enabled: false },
  { id: 'cat-9', name: 'Rate Shopper', category: 'Finance', enabled: false },
  { id: 'cat-10', name: 'Rebate Finder', category: 'Finance', enabled: false },
  { id: 'cat-11', name: 'Inventory Tracker', category: 'Operations', enabled: false },
  { id: 'cat-12', name: 'Service Scheduler', category: 'Operations', enabled: false },
  { id: 'cat-13', name: 'Parts Lookup', category: 'Operations', enabled: false },
  { id: 'cat-14', name: 'Recall Checker', category: 'Operations', enabled: false },
  { id: 'cat-15', name: 'Lot Management', category: 'Operations', enabled: false },
  { id: 'cat-16', name: 'Email Composer', category: 'General', enabled: true },
  { id: 'cat-17', name: 'FAQ Responder', category: 'General', enabled: true },
  { id: 'cat-18', name: 'Appointment Setter', category: 'General', enabled: false },
  { id: 'cat-19', name: 'Language Translator', category: 'General', enabled: false },
  { id: 'cat-20', name: 'Sentiment Analyzer', category: 'General', enabled: false },
];

const knowledgeReferencesMock = [
  { id: 'ref-1', name: 'Product FAQ', items: 45, status: 'Stored' },
  { id: 'ref-2', name: 'Pricing Guide', items: 12, status: 'Stored' },
  { id: 'ref-3', name: 'Inventory CSV', items: 1200, status: 'Stored' },
];

const configSections = [
  { id: 'performance', label: 'Performance', icon: BarChart3 },
  { id: 'instructions', label: 'Instructions', icon: FileText },
  { id: 'triggers', label: 'Triggers', icon: Zap },
  { id: 'tools', label: 'Tools & Skills', icon: Wrench },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
  { id: 'activity', label: 'Activity', icon: Activity },
];

export function AgentConfigPane() {
  const { toast } = useToast();
  const { selectedAgent, updateAgent, setRightPaneOpen } = useApp();
  const [activeConfigSection, setActiveConfigSection] = useState('performance');

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

  const [triggersModalOpen, setTriggersModalOpen] = useState(false);
  const [editTriggers, setEditTriggers] = useState<AgentTrigger[]>([]);

  const [toolsModalOpen, setToolsModalOpen] = useState(false);
  const [editTools, setEditTools] = useState<AgentTool[]>([]);

  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [editSkillsCatalog, setEditSkillsCatalog] = useState(skillsCatalog.map(s => ({ ...s })));
  const [agentTriggers, setAgentTriggers] = useState(agentTriggersMock.map(t => ({ ...t })));

  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
  const [knowledgeUploadOpen, setKnowledgeUploadOpen] = useState(false);

  const handleToggleStatus = () => {
    if (!selectedAgent) return;
    const newStatus = selectedAgent.status === 'active' ? 'inactive' : 'active';
    updateAgent(selectedAgent.id, { status: newStatus, updatedAt: new Date().toISOString() });
  };

  const openInstructionsModal = () => {
    if (!selectedAgent) return;
    setEditInstructions(selectedAgent.instructions);
    setInstructionsModalOpen(true);
  };

  const saveInstructions = () => {
    if (!selectedAgent) return;
    updateAgent(selectedAgent.id, { instructions: editInstructions, updatedAt: new Date().toISOString() });
    setInstructionsModalOpen(false);
  };

  const openTriggersModal = () => {
    if (!selectedAgent) return;
    setEditTriggers(JSON.parse(JSON.stringify(selectedAgent.triggers)));
    setTriggersModalOpen(true);
  };

  const saveTriggers = () => {
    if (!selectedAgent) return;
    updateAgent(selectedAgent.id, { triggers: editTriggers, updatedAt: new Date().toISOString() });
    setTriggersModalOpen(false);
  };

  const toggleTrigger = (index: number) => {
    setEditTriggers(prev => prev.map((t, i) => i === index ? { ...t, enabled: !t.enabled } : t));
  };

  const openToolsModal = () => {
    if (!selectedAgent) return;
    const agentToolIds = selectedAgent.tools.map(t => t.id);
    const allTools = availableTools.map(t => ({
      ...t,
      enabled: agentToolIds.includes(t.id) ? (selectedAgent.tools.find(st => st.id === t.id)?.enabled ?? false) : false,
    }));
    setEditTools(allTools);
    setToolsModalOpen(true);
  };

  const saveTools = () => {
    if (!selectedAgent) return;
    const enabledTools = editTools.filter(t => t.enabled);
    updateAgent(selectedAgent.id, { tools: enabledTools, updatedAt: new Date().toISOString() });
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
                {(selectedAgent.channels || [selectedAgent.channel]).filter(Boolean).map((ch: string) => {
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
                      <Button variant="ghost" size="icon" onClick={() => window.open(selectedAgent.customerLink, '_blank')} data-testid="button-open-customer-link">
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
                {selectedAgent.chatLink && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border" data-testid="agent-chat-link">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Text Chat Link</p>
                        <p className="text-sm text-foreground truncate">{selectedAgent.chatLink}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(selectedAgent.chatLink!); toast({ title: 'Link copied', description: 'Chat link copied to clipboard.' }); }} data-testid="button-copy-chat-link">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => window.open(selectedAgent.chatLink, '_blank')} data-testid="button-open-chat-link">
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
      case 'triggers':
        return (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Agent Triggers</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => toast({ title: 'Add Trigger', description: 'Trigger editor not available in demo mode.' })} data-testid="button-add-trigger">
                  <Plus className="h-3 w-3 mr-1.5" />
                  Add Trigger
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast({ title: 'Configure', description: 'Trigger editor not available in demo mode.' })} data-testid="button-configure-triggers">
                  <Settings className="h-3 w-3 mr-1.5" />
                  Configure
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {agentTriggers.map((trigger) => (
                <div key={trigger.id} className="flex items-center justify-between p-3 rounded-lg border border-border" data-testid={`trigger-row-${trigger.id}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{trigger.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{trigger.schedule}</p>
                  </div>
                  <Switch
                    checked={trigger.enabled}
                    onCheckedChange={() => setAgentTriggers(prev => prev.map(t => t.id === trigger.id ? { ...t, enabled: !t.enabled } : t))}
                    data-testid={`trigger-toggle-${trigger.id}`}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <Info className="h-3 w-3 flex-shrink-0" />
              Triggers are configured per-agent
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
                {selectedAgent.tools.map((tool) => (
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
                {selectedAgent.tools.length === 0 && (
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

            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Skills</p>
                <Button variant="outline" size="sm" onClick={() => { setEditSkillsCatalog(skillsCatalog.map(s => ({ ...s }))); setSkillsModalOpen(true); }} data-testid="button-manage-skills">
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Manage
                </Button>
              </div>
              <div className="space-y-2">
                {assignedSkillsMock.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-3 rounded-lg border border-border" data-testid={`skill-${skill.id}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <p className="text-sm font-medium text-foreground">{skill.name}</p>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'knowledge':
        return (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">References</p>
              <Button variant="outline" size="sm" onClick={() => toast({ title: 'Upload Reference', description: 'File upload not available in demo mode.' })} data-testid="button-upload-reference">
                <Plus className="h-3 w-3 mr-1.5" />
                Upload Reference
              </Button>
            </div>
            <div className="space-y-2">
              {knowledgeReferencesMock.map((ref) => (
                <div key={ref.id} className="flex items-center justify-between p-3 rounded-lg border border-border" data-testid={`reference-${ref.id}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{ref.name}</p>
                      <p className="text-xs text-muted-foreground">{ref.items.toLocaleString()} items</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary">{ref.status}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => toast({ title: 'Delete Reference', description: 'Delete not available in demo mode.' })} data-testid={`reference-delete-${ref.id}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
              <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
              References stored for agent context. Auto-indexing controlled by Knowledge Base settings.
            </p>
          </div>
        );
      case 'activity':
        return (
          <div className="p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2" data-testid="activity-heading">Recent Calls</p>
            {callsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 rounded-lg" />
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
                      <a
                        href={call.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-0.5"
                        data-testid={`call-recording-${call.id}`}
                      >
                        Recording
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                    {call.transcript && (
                      <button
                        className="text-primary hover:underline"
                        onClick={() => {
                          navigator.clipboard.writeText(call.transcript);
                          toast({ title: 'Transcript copied', description: 'Full transcript copied to clipboard.' });
                        }}
                        data-testid={`call-transcript-${call.id}`}
                      >
                        Copy Transcript
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Headphones className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No recent calls</p>
                {!vapiAssistantId && (
                  <p className="text-xs text-muted-foreground mt-1">No VAPI assistant linked</p>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex flex-col h-full">
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

      <Dialog open={triggersModalOpen} onOpenChange={setTriggersModalOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="modal-edit-triggers">
          <DialogHeader>
            <DialogTitle>Configure Triggers</DialogTitle>
            <DialogDescription>
              Set when {selectedAgent?.name} should activate and respond
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {editTriggers.map((trigger, i) => (
              <div key={trigger.type} className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Zap className={cn('h-4 w-4', trigger.enabled ? 'text-primary' : 'text-muted-foreground')} />
                    <p className="text-sm font-medium text-foreground capitalize">
                      {trigger.type.replace('_', ' ')}
                    </p>
                  </div>
                  {trigger.config?.schedule && (
                    <p className="text-xs text-muted-foreground mt-1 ml-6">{trigger.config.schedule}</p>
                  )}
                  {trigger.config?.condition && (
                    <p className="text-xs text-muted-foreground mt-1 ml-6">{trigger.config.condition}</p>
                  )}
                </div>
                <Switch
                  checked={trigger.enabled}
                  onCheckedChange={() => toggleTrigger(i)}
                  data-testid={`trigger-switch-${trigger.type}`}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTriggersModalOpen(false)} data-testid="button-cancel-triggers">
              Cancel
            </Button>
            <Button onClick={saveTriggers} data-testid="button-save-triggers">
              Save Triggers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={toolsModalOpen} onOpenChange={setToolsModalOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="modal-edit-tools">
          <DialogHeader>
            <DialogTitle>Manage Tools & Skills</DialogTitle>
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
              {[
                { id: 'kb-1', name: 'Product Catalog', count: '248 items', type: 'Inventory Data', status: 'indexed' },
                { id: 'kb-2', name: 'FAQ & Policies', count: '42 docs', type: 'Documents', status: 'indexed' },
                { id: 'kb-3', name: 'Training Scripts', count: '15 flows', type: 'Conversation', status: 'indexed' },
              ].map(kb => (
                <div key={kb.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{kb.name}</p>
                      <p className="text-xs text-muted-foreground">{kb.count} - {kb.type}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">{kb.status}</Badge>
                </div>
              ))}
            </div>

            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setKnowledgeUploadOpen(true)}
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

      <Dialog open={skillsModalOpen} onOpenChange={setSkillsModalOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="modal-manage-skills">
          <DialogHeader>
            <DialogTitle>Manage Skills</DialogTitle>
            <DialogDescription>
              Assign skills from the catalog to {selectedAgent?.name}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2 pr-2">
              {editSkillsCatalog.map((skill, i) => (
                <div
                  key={skill.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border transition-colors',
                    skill.enabled ? 'border-primary/30 bg-primary/5' : 'border-border'
                  )}
                  data-testid={`skill-catalog-${skill.id}`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Checkbox
                      checked={skill.enabled}
                      onCheckedChange={() => setEditSkillsCatalog(prev => prev.map((s, idx) => idx === i ? { ...s, enabled: !s.enabled } : s))}
                      data-testid={`skill-checkbox-${skill.id}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{skill.name}</p>
                      <Badge variant="secondary" className="text-[10px] mt-0.5">{skill.category}</Badge>
                    </div>
                  </div>
                  {skill.enabled && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <p className="text-xs text-muted-foreground">{editSkillsCatalog.filter(s => s.enabled).length} skills selected</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSkillsModalOpen(false)} data-testid="button-cancel-skills">
                  Cancel
                </Button>
                <Button onClick={() => { setSkillsModalOpen(false); toast({ title: 'Skills updated', description: `Skill assignments saved for ${selectedAgent?.name}.` }); }} data-testid="button-save-skills">
                  Save Skills
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
