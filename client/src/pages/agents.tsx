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
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApp } from '@/contexts/AppContext';
import { getAgentStatusColor, type Agent, type AgentChannel } from '@/mocks/agents';
import { formatDistanceToNow } from 'date-fns';
import { FavoritesBar } from '@/components/layout/FavoritesBar';

/**
 * @component AgentsPage
 * @description AI agent management with left list panel and ClickUp-style right config pane
 * @designConstraints
 *   - Left panel: 272px fixed width agent list with search, excludes "Automa" from list
 *   - Right config pane: 320px collapsible, sections: Instructions/Triggers/Tools/Knowledge/Activity
 *   - Center: Agent detail with avatar, status badge, channels, performance stats
 * @rbac Visible to all roles
 * @locked Config pane section order, Automa exclusion from agent list
 */

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
  const { agents, updateAgent, selectedAgent, setSelectedAgent } = useApp();
  const [configPaneOpen, setConfigPaneOpen] = useState(true);
  const [activeConfigSection, setActiveConfigSection] = useState('instructions');
  const [agentSearch, setAgentSearch] = useState('');

  const filteredAgents = agents.filter(a => 
    a.name.toLowerCase() !== 'automa' &&
    (!agentSearch || a.name.toLowerCase().includes(agentSearch.toLowerCase()))
  );

  const handleToggleStatus = (agent: Agent) => {
    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    updateAgent(agent.id, { status: newStatus, updatedAt: new Date().toISOString() });
  };

  const renderConfigContent = () => {
    if (!selectedAgent) return null;

    switch (activeConfigSection) {
      case 'instructions':
        return (
          <div className="p-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {selectedAgent.instructions}
            </p>
          </div>
        );
      case 'triggers':
        return (
          <div className="divide-y divide-border">
            {selectedAgent.triggers.map((trigger) => (
              <div key={trigger.type} className="flex items-center justify-between p-4">
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
        );
      case 'tools':
        return (
          <div className="p-4">
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
                <p className="text-sm text-muted-foreground text-center py-4">No tools configured</p>
              )}
            </div>
          </div>
        );
      case 'knowledge':
        return (
          <div className="p-4 space-y-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Product Catalog</p>
                  <p className="text-xs text-muted-foreground">248 items indexed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">FAQ & Policies</p>
                  <p className="text-xs text-muted-foreground">42 documents</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Training Scripts</p>
                  <p className="text-xs text-muted-foreground">15 conversation flows</p>
                </div>
              </CardContent>
            </Card>
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
      <div className="w-72 border-r border-border flex flex-col flex-shrink-0">
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
                onClick={() => { setSelectedAgent(agent); setConfigPaneOpen(true); }}
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
        <div className="px-4 py-2 border-b border-border flex items-center gap-2">
          <FavoritesBar currentPath="/agents" currentLabel="Agents" />
        </div>

        {selectedAgent ? (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
              <div className="p-6 border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-lg">
                        <Bot className="h-7 w-7" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-foreground">{selectedAgent.name}</h1>
                        <Badge
                          variant={selectedAgent.status === 'active' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {selectedAgent.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{selectedAgent.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>Created by {selectedAgent.createdBy}</span>
                        <span>Updated {formatDistanceToNow(new Date(selectedAgent.updatedAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={selectedAgent.status === 'active' ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleToggleStatus(selectedAgent)}
                      data-testid="button-toggle-agent-status"
                    >
                      {selectedAgent.status === 'active' ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
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

            {configPaneOpen && (
              <div className="w-80 border-l border-border flex flex-col flex-shrink-0 bg-background">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Configuration</h3>
                  <Button size="icon" variant="ghost" onClick={() => setConfigPaneOpen(false)} data-testid="button-close-config">
                    <X className="h-4 w-4" />
                  </Button>
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
    </div>
  );
}
