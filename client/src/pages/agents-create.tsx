import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Bot, 
  ChevronLeft, 
  Phone, 
  MessageSquare, 
  Video, 
  Mail,
  Check,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { availableTools, type AgentChannel, type TriggerType, type Agent } from '@/mocks/agents';

const channels: { id: AgentChannel; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'voice', label: 'Voice', icon: Phone, description: 'Handle phone calls' },
  { id: 'chat', label: 'Chat', icon: MessageSquare, description: 'Text conversations' },
  { id: 'video', label: 'Video', icon: Video, description: 'Video interactions' },
  { id: 'email', label: 'Email', icon: Mail, description: 'Email responses' },
];

const triggers: { id: TriggerType; label: string; description: string }[] = [
  { id: 'mention', label: 'Mention', description: 'Run when @mentioned' },
  { id: 'direct_message', label: 'Direct Message', description: 'Run when messaged directly' },
  { id: 'assign_task', label: 'Assign Task', description: 'Run when a task is assigned' },
  { id: 'scheduled', label: 'Scheduled', description: 'Run on a schedule' },
  { id: 'automated', label: 'Automated', description: 'Run when criteria is met' },
];

export default function AgentCreatePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { addAgent } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: '',
    channel: 'chat' as AgentChannel,
    triggers: {
      mention: true,
      direct_message: true,
      assign_task: false,
      scheduled: false,
      automated: false,
    } as Record<TriggerType, boolean>,
    tools: {} as Record<string, boolean>,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for your agent.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const newAgent: Agent = {
        id: `agent-${Date.now()}`,
        name: formData.name,
        description: formData.description || 'No description provided',
        status: 'draft',
        channel: formData.channel,
        instructions: formData.instructions || 'No instructions provided',
        triggers: triggers.map(t => ({
          type: t.id,
          enabled: formData.triggers[t.id] || false,
        })),
        tools: availableTools.map(tool => ({
          ...tool,
          enabled: formData.tools[tool.id] || false,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user-1',
      };

      addAgent(newAgent);
      
      toast({
        title: 'Agent created!',
        description: `${formData.name} has been created successfully.`,
      });

      setIsSubmitting(false);
      setLocation('/agents');
    }, 800);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/agents')}
            data-testid="button-back-to-agents"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Create Agent</h1>
            <p className="text-sm text-muted-foreground">Build a new AI agent</p>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          data-testid="button-save-agent"
        >
          {isSubmitting ? (
            <>
              <Sparkles className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Create Agent
            </>
          )}
        </Button>
      </div>

      {/* Form */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-3xl mx-auto space-y-8">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
              <CardDescription>Give your agent a name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Sales Agent, Support Bot"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  data-testid="input-agent-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of what this agent does"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  data-testid="input-agent-description"
                />
              </div>
            </CardContent>
          </Card>

          {/* Channel Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Channel</CardTitle>
              <CardDescription>How will this agent communicate?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {channels.map((channel) => {
                  const Icon = channel.icon;
                  const isSelected = formData.channel === channel.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => setFormData(prev => ({ ...prev, channel: channel.id }))}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                      data-testid={`channel-${channel.id}`}
                    >
                      <Icon className={cn('h-6 w-6', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                      <span className={cn('text-sm font-medium', isSelected ? 'text-primary' : 'text-foreground')}>
                        {channel.label}
                      </span>
                      <span className="text-xs text-muted-foreground text-center">{channel.description}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instructions</CardTitle>
              <CardDescription>Tell your agent how to behave and respond</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="You are a helpful sales agent for a car dealership. Help customers find the right vehicle for their needs..."
                className="min-h-32 resize-none"
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                data-testid="input-agent-instructions"
              />
            </CardContent>
          </Card>

          {/* Triggers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Triggers</CardTitle>
              <CardDescription>When should this agent run?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {triggers.map((trigger) => (
                <div key={trigger.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{trigger.label}</p>
                    <p className="text-xs text-muted-foreground">{trigger.description}</p>
                  </div>
                  <Switch
                    checked={formData.triggers[trigger.id]}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        triggers: { ...prev.triggers, [trigger.id]: checked }
                      }))
                    }
                    data-testid={`trigger-${trigger.id}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tools & Skills</CardTitle>
              <CardDescription>What capabilities should this agent have?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableTools.map((tool) => {
                  const isSelected = formData.tools[tool.id];
                  return (
                    <Badge
                      key={tool.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-colors',
                        isSelected && 'bg-primary'
                      )}
                      onClick={() => 
                        setFormData(prev => ({
                          ...prev,
                          tools: { ...prev.tools, [tool.id]: !isSelected }
                        }))
                      }
                      data-testid={`tool-${tool.id}`}
                    >
                      {isSelected && <Check className="h-3 w-3 mr-1" />}
                      {tool.name}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
