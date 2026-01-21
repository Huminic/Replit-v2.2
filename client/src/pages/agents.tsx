import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Bot, 
  Plus, 
  Search, 
  Phone, 
  MessageSquare, 
  Video, 
  Mail,
  MoreVertical,
  Settings,
  Trash2,
  Play,
  Pause,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

const channelIcons: Record<AgentChannel, React.ElementType> = {
  voice: Phone,
  chat: MessageSquare,
  video: Video,
  email: Mail,
};

export default function AgentsPage() {
  const [, setLocation] = useLocation();
  const { agents, updateAgent } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = (agent: Agent) => {
    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    updateAgent(agent.id, { status: newStatus, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Panel - Agent List */}
      <aside className="flex flex-col w-full md:w-80 border-r border-border bg-card/30 flex-shrink-0">
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Agents</h2>
            <Button
              size="sm"
              onClick={() => setLocation('/agents/create')}
              data-testid="button-create-agent"
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-agents"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 flex flex-col gap-1">
            {filteredAgents.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No agents found</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setLocation('/agents/create')}
                  className="mt-2"
                >
                  Create your first agent
                </Button>
              </div>
            ) : (
              filteredAgents.map((agent) => {
                const ChannelIcon = channelIcons[agent.channel];
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg transition-colors hover-elevate',
                      selectedAgent?.id === agent.id ? 'bg-accent' : 'hover:bg-accent/50'
                    )}
                    data-testid={`agent-item-${agent.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                          <Bot className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{agent.name}</p>
                          <div className={cn('w-2 h-2 rounded-full', getAgentStatusColor(agent.status))} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{agent.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                            <ChannelIcon className="h-3 w-3" />
                            {agent.channel}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(agent.updatedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content - Agent Details or Empty State */}
      <div className="hidden md:flex flex-1 flex-col min-w-0">
        {selectedAgent ? (
          <>
            {/* Agent Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xl">
                      <Bot className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-foreground">{selectedAgent.name}</h1>
                      <Badge
                        variant={selectedAgent.status === 'active' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {selectedAgent.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">{selectedAgent.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Created by {selectedAgent.createdBy}</span>
                      <span>•</span>
                      <span>Updated {formatDistanceToNow(new Date(selectedAgent.updatedAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={selectedAgent.status === 'active' ? 'outline' : 'default'}
                    onClick={() => handleToggleStatus(selectedAgent)}
                    data-testid="button-toggle-agent-status"
                  >
                    {selectedAgent.status === 'active' ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
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
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Agent
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Agent
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Agent Details */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8 max-w-2xl">
                {/* Instructions */}
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Instructions</h3>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedAgent.instructions}
                    </p>
                  </div>
                </section>

                {/* Triggers */}
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Triggers</h3>
                  <div className="bg-card border border-border rounded-lg divide-y divide-border">
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
                </section>

                {/* Tools */}
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Tools & Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAgent.tools.filter(t => t.enabled).map((tool) => (
                      <Badge key={tool.id} variant="secondary" className="text-xs">
                        {tool.name}
                      </Badge>
                    ))}
                    {selectedAgent.tools.filter(t => t.enabled).length === 0 && (
                      <p className="text-sm text-muted-foreground">No tools enabled</p>
                    )}
                  </div>
                </section>
              </div>
            </ScrollArea>
          </>
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

      {/* Mobile - Show selected agent or empty state */}
      <div className="md:hidden flex-1">
        {selectedAgent && (
          <div className="p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedAgent(null)}
              className="mb-4"
            >
              <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
              Back
            </Button>
            {/* Mobile agent details would go here */}
          </div>
        )}
      </div>
    </div>
  );
}
