import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Bot, 
  Plus, 
  Phone, 
  MessageSquare, 
  Video, 
  Mail,
  MoreVertical,
  Settings,
  Trash2,
  Play,
  Pause,
  ChevronRight,
  X,
  FileText,
  Zap,
  Wrench,
  BookOpen,
  Activity,
  Search,
  Pencil,
  Upload,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  ArrowLeft,
  ChevronsRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApp } from '@/contexts/AppContext';
import { getAgentStatusColor, availableTools, type Agent, type AgentChannel, type AgentTrigger, type AgentTool } from '@/mocks/agents';
import { formatDistanceToNow } from 'date-fns';
import { MobileNavDropdown } from '@/components/layout/MobileNavDropdown';
import { FavoritesBar } from '@/components/layout/FavoritesBar';

const channelIcons: Record<AgentChannel, React.ElementType> = {
  voice: Phone,
  chat: MessageSquare,
  video: Video,
  email: Mail,
};

const agentActivities = [
  { id: 'act1', text: 'Handled inbound chat from Sarah M.', time: '2 hours ago' },
  { id: 'act2', text: 'Sent follow-up email to lead #2847', time: '4 hours ago' },
  { id: 'act3', text: 'Qualified 3 new leads via web form', time: '6 hours ago' },
  { id: 'act4', text: 'Updated CRM records for 12 contacts', time: '8 hours ago' },
  { id: 'act5', text: 'Triggered service reminder campaign', time: '12 hours ago' },
];

const configSections = [
  { id: 'instructions', label: 'Instructions', icon: FileText },
  { id: 'triggers', label: 'Triggers', icon: Zap },
  { id: 'tools', label: 'Tools & Skills', icon: Wrench },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
  { id: 'activity', label: 'Activity', icon: Activity },
];

export default function AgentsPage() {
  const [, setLocation] = useLocation();
  const { agents, updateAgent, selectedAgent, setSelectedAgent, rightPaneOpen, setRightPaneOpen } = useApp();
  const [activeConfigSection, setActiveConfigSection] = useState('instructions');
  const [agentSearch, setAgentSearch] = useState('');

  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false);
  const [editInstructions, setEditInstructions] = useState('');

  const [triggersModalOpen, setTriggersModalOpen] = useState(false);
  const [editTriggers, setEditTriggers] = useState<AgentTrigger[]>([]);

  const [toolsModalOpen, setToolsModalOpen] = useState(false);
  const [editTools, setEditTools] = useState<AgentTool[]>([]);

  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
  const [knowledgeUploadOpen, setKnowledgeUploadOpen] = useState(false);

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase() !== 'automa' &&
    (!agentSearch || a.name.toLowerCase().includes(agentSearch.toLowerCase()))
  );

  const handleToggleStatus = (agent: Agent) => {
    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    updateAgent(agent.id, { status: newStatus, updatedAt: new Date().toISOString() });
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

  const renderConfigContent = () => {
    if (!selectedAgent) return null;

    switch (activeConfigSection) {
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
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Triggers</p>
              <Button variant="outline" size="sm" onClick={openTriggersModal} data-testid="button-edit-triggers">
                <Settings className="h-3 w-3 mr-1.5" />
                Configure
              </Button>
            </div>
            <div className="space-y-2">
              {selectedAgent.triggers.map((trigger) => (
                <div key={trigger.type} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">
                      {trigger.type.replace('_', ' ')}
                    </p>
                    {trigger.config?.schedule && (
                      <p className="text-xs text-muted-foreground mt-0.5">{trigger.config.schedule}</p>
                    )}
                    {trigger.config?.condition && (
                      <p className="text-xs text-muted-foreground mt-0.5">{trigger.config.condition}</p>
                    )}
                  </div>
                  <Badge variant={trigger.enabled ? 'default' : 'secondary'}>
                    {trigger.enabled ? 'On' : 'Off'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        );
      case 'tools':
        return (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Enabled Tools</p>
              <Button variant="outline" size="sm" onClick={openToolsModal} data-testid="button-edit-tools">
                <Wrench className="h-3 w-3 mr-1.5" />
                Manage
              </Button>
            </div>
            <div className="space-y-2">
              {selectedAgent.tools.map((tool) => (
                <div key={tool.id} className="flex items-center justify-between p-3 rounded-lg border border-border" data-testid={`tool-${tool.id}`}>
                  <div>
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
        );
      case 'knowledge':
        return (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Knowledge Sources</p>
              <Button variant="outline" size="sm" onClick={() => setKnowledgeModalOpen(true)} data-testid="button-manage-knowledge">
                <BookOpen className="h-3 w-3 mr-1.5" />
                Manage
              </Button>
            </div>
            <div className="space-y-3">
              {[
                { id: 'kb-1', name: 'Product Catalog', count: '248 items indexed', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { id: 'kb-2', name: 'FAQ & Policies', count: '42 documents', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { id: 'kb-3', name: 'Training Scripts', count: '15 conversation flows', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              ].map(kb => (
                <Card key={kb.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', kb.bg)}>
                      <BookOpen className={cn('h-5 w-5', kb.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{kb.name}</p>
                      <p className="text-xs text-muted-foreground">{kb.count}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setKnowledgeModalOpen(true)} data-testid={`kb-edit-${kb.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'activity':
        return (
          <div className="p-4 space-y-3">
            {agentActivities.map(act => (
              <div key={act.id} className="flex items-start gap-3 py-2" data-testid={`agent-activity-${act.id}`}>
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-foreground">{act.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-72 border-r border-border hidden lg:flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Agents</h2>
            <Button size="icon" variant="ghost" onClick={() => setLocation('/agents/create')} data-testid="button-create-agent">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={agentSearch}
              onChange={e => setAgentSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
              data-testid="input-agent-search"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredAgents.map(agent => (
              <button
                key={agent.id}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 hover-elevate',
                  selectedAgent?.id === agent.id ? 'bg-accent' : ''
                )}
                onClick={() => { setSelectedAgent(agent); }}
                data-testid={`agent-item-${agent.id}`}
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-foreground text-xs">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{agent.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={cn('w-1.5 h-1.5 rounded-full', agent.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground/50')} />
                    <span className="text-xs text-muted-foreground capitalize">{agent.status}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
            {filteredAgents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No agents found</p>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-2 border-b border-border hidden lg:flex items-center gap-2">
          <FavoritesBar currentPath="/agents" currentLabel="Agents" />
        </div>

        {selectedAgent ? (
          <div className="flex flex-1 overflow-hidden">
            {!rightPaneOpen && (
            <div className="flex-1 flex flex-col min-w-0">
                <div className="p-6 border-b border-border">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-lg">
                          <Bot className="h-7 w-7" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h1 className="text-xl font-bold text-foreground">{selectedAgent.name}</h1>
                          <Badge
                            variant={selectedAgent.status === 'active' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {selectedAgent.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{selectedAgent.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span>Created by {selectedAgent.createdBy}</span>
                          <span>Updated {formatDistanceToNow(new Date(selectedAgent.updatedAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid="button-agent-menu">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem data-testid="menu-edit-agent">
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Agent
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" data-testid="menu-delete-agent">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Agent
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3 lg:hidden">
                  <MobileNavDropdown currentPath="/agents" currentLabel="Agents" />
                </div>

                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6 max-w-2xl">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-2">Channel</h3>
                        <div className="flex gap-3">
                          {(() => {
                            const Icon = channelIcons[selectedAgent.channel];
                            return (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border" data-testid={`channel-${selectedAgent.channel}`}>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm capitalize text-foreground">{selectedAgent.channel}</span>
                              </div>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-2">Performance</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Interactions</p>
                            <p className="text-lg font-bold text-foreground">247</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Resolution Rate</p>
                            <p className="text-lg font-bold text-foreground">89%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Avg Response</p>
                            <p className="text-lg font-bold text-foreground">1.2s</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
            </div>
            )}

            {rightPaneOpen && selectedAgent && (
              <div className="flex-1 flex flex-col min-w-0 border-l border-border bg-background">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Configuration</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={selectedAgent.status === 'active' ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleToggleStatus(selectedAgent)}
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
                    <Button size="icon" variant="ghost" onClick={() => setRightPaneOpen(false)} data-testid="button-close-config">
                      <ChevronsRight className="h-4 w-4" />
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
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6">
              <Bot className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Select an Agent</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Choose an agent from the list to view its details, or create a new one to get started.
            </p>
            <Button onClick={() => setLocation('/agents/create')} data-testid="button-create-agent-empty">
              <Plus className="h-4 w-4 mr-2" />
              Create New Agent
            </Button>
          </div>
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
    </div>
  );
}
