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
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import { FavoritesBar } from '@/components/layout/FavoritesBar';

const channelIcons: Record<AgentChannel, React.ElementType> = {
  voice: Phone,
  chat: MessageSquare,
  video: Video,
  email: Mail,
};

export default function AgentsPage() {
  const [, setLocation] = useLocation();
  const { agents, updateAgent } = useApp();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(agents[0] || null);

  const handleToggleStatus = (agent: Agent) => {
    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    updateAgent(agent.id, { status: newStatus, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="flex h-full overflow-hidden justify-center">
      <div className="flex-1 flex flex-col min-w-0 max-w-4xl">
        <div className="px-4 py-2 border-b border-border flex items-center">
          <FavoritesBar currentPath="/agents" currentLabel="Agents" />
        </div>
        {selectedAgent ? (
          <>
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
              <div className="space-y-8 max-w-2xl">
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Instructions</h3>
                  <div className="bg-card border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedAgent.instructions}
                    </p>
                  </div>
                </section>

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
    </div>
  );
}
