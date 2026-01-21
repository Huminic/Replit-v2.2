import { 
  Users, 
  Settings, 
  Wrench, 
  BookOpen, 
  Zap,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockUsers, getRoleLabel } from '@/mocks/users';
import { availableTools } from '@/mocks/agents';

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">System Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your organization and application settings</p>
      </div>

      <Tabs defaultValue="users" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 border-b border-border">
          <TabsList className="bg-transparent h-12 p-0 gap-4">
            <TabsTrigger value="users" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2" data-testid="tab-settings-users">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="app" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2" data-testid="tab-settings-app">
              <Settings className="h-4 w-4" />
              Application
            </TabsTrigger>
            <TabsTrigger value="tools" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2" data-testid="tab-settings-tools">
              <Wrench className="h-4 w-4" />
              Tools
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2" data-testid="tab-settings-knowledge">
              <BookOpen className="h-4 w-4" />
              Knowledge
            </TabsTrigger>
            <TabsTrigger value="hunches" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2" data-testid="tab-settings-hunches">
              <Zap className="h-4 w-4" />
              Hunches
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Users Tab */}
        <TabsContent value="users" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search users..." className="pl-9" data-testid="input-search-users" />
                </div>
                <Button size="sm" data-testid="button-add-user">
                  <Plus className="h-4 w-4 mr-1" />
                  Add User
                </Button>
              </div>

              <div className="space-y-2">
                {mockUsers.map((user) => (
                  <Card key={user.id} className="hover-elevate" data-testid={`user-${user.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="gap-1">
                            <Shield className="h-3 w-3" />
                            {getRoleLabel(user.role)}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem data-testid={`menu-edit-user-${user.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" data-testid={`menu-remove-user-${user.id}`}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Application Tab */}
        <TabsContent value="app" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">General Settings</CardTitle>
                  <CardDescription>Configure general application settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive email updates about agent activity</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-email-notifications" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Daily Digest</p>
                      <p className="text-xs text-muted-foreground">Send daily summary of all activity</p>
                    </div>
                    <Switch data-testid="switch-daily-digest" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Auto-approve Agents</p>
                      <p className="text-xs text-muted-foreground">Automatically approve new agent activations</p>
                    </div>
                    <Switch data-testid="switch-auto-approve" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Settings</CardTitle>
                  <CardDescription>Configure AI behavior and limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Response Length</p>
                      <p className="text-xs text-muted-foreground">Maximum words per agent response</p>
                    </div>
                    <Input type="number" defaultValue="250" className="w-24 text-right" data-testid="input-response-length" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Monthly Credit Limit</p>
                      <p className="text-xs text-muted-foreground">Maximum AI credits per month</p>
                    </div>
                    <Input type="number" defaultValue="10000" className="w-24 text-right" data-testid="input-credit-limit" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure available tools for your AI agents. Enable or disable tools globally.
              </p>
              
              <div className="space-y-2">
                {availableTools.map((tool) => (
                  <Card key={tool.id} className="hover-elevate" data-testid={`tool-setting-${tool.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Wrench className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{tool.name}</p>
                            <p className="text-sm text-muted-foreground">{tool.description}</p>
                          </div>
                        </div>
                        <Switch defaultChecked={tool.enabled} data-testid={`switch-tool-${tool.id}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Knowledge Tab */}
        <TabsContent value="knowledge" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Knowledge Base</h2>
                  <p className="text-sm text-muted-foreground">
                    Upload documents and data to train your AI agents
                  </p>
                </div>
                <Button size="sm" data-testid="button-upload-knowledge">
                  <Plus className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              </div>

              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No knowledge sources added yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Upload documents, connect APIs, or add website URLs to train your agents
                  </p>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Hunches Tab */}
        <TabsContent value="hunches" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hunch Configuration</CardTitle>
                  <CardDescription>Configure AI-generated insights and suggestions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Enable Hunches</p>
                      <p className="text-xs text-muted-foreground">Allow agents to generate insights proactively</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-enable-hunches" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Minimum Confidence</p>
                      <p className="text-xs text-muted-foreground">Only show hunches above this threshold</p>
                    </div>
                    <Input type="number" defaultValue="70" className="w-20 text-right" data-testid="input-min-confidence" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Hunch Notifications</p>
                      <p className="text-xs text-muted-foreground">Send notifications for new hunches</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-hunch-notifications" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
