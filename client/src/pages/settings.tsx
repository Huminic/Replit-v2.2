import { useState } from 'react';
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
  Shield,
  Building2,
  Bell,
  Lock,
  Database,
  Palette,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockUsers, getRoleLabel, type UserRole } from '@/mocks/users';
import { availableTools } from '@/mocks/agents';
import { FavoritesBar } from '@/components/layout/FavoritesBar';
import { useApp } from '@/contexts/AppContext';

/**
 * @component SettingsPage
 * @description System settings with tile-based navigation and role-gated sections
 * @designConstraints
 *   - Tile grid: Gradient background cards with decorative SVG patterns
 *   - Each tile has minRole array controlling visibility
 *   - Click tile to drill into section, Back button returns to grid
 * @rbac Hidden from org_staff role (sidebar adminOnly flag), sections role-gated per tile.minRole
 * @locked Tile gradient themes, role-gating per section
 */

interface SettingsTile {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  minRole: UserRole[];
}

const settingsTiles: SettingsTile[] = [
  { id: 'users', title: 'User Management', description: 'Manage users, roles, and permissions', icon: Users, gradient: 'from-blue-500/15 to-cyan-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
  { id: 'organization', title: 'Organization', description: 'Company profile and branding', icon: Building2, gradient: 'from-violet-500/15 to-purple-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
  { id: 'tools', title: 'Tools & Integrations', description: 'Configure connected tools and services', icon: Wrench, gradient: 'from-emerald-500/15 to-teal-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
  { id: 'knowledge', title: 'Knowledge Base', description: 'Upload and manage AI training data', icon: BookOpen, gradient: 'from-amber-500/15 to-orange-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
  { id: 'ai', title: 'AI Configuration', description: 'Hunches, agents, and AI behavior settings', icon: Zap, gradient: 'from-fuchsia-500/15 to-pink-500/5', minRole: ['super_admin', 'partner_admin'] },
  { id: 'security', title: 'Security', description: 'Authentication, SSO, and access policies', icon: Lock, gradient: 'from-red-500/15 to-rose-500/5', minRole: ['super_admin', 'partner_admin'] },
  { id: 'notifications', title: 'Notifications', description: 'Alert preferences and delivery channels', icon: Bell, gradient: 'from-sky-500/15 to-blue-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
  { id: 'data', title: 'Data Management', description: 'Imports, exports, and data retention', icon: Database, gradient: 'from-indigo-500/15 to-violet-500/5', minRole: ['super_admin'] },
  { id: 'appearance', title: 'Appearance', description: 'Theme, layout, and display preferences', icon: Palette, gradient: 'from-teal-500/15 to-emerald-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
  { id: 'api', title: 'API & Webhooks', description: 'Developer settings and external integrations', icon: Globe, gradient: 'from-orange-500/15 to-amber-500/5', minRole: ['super_admin'] },
];

export default function SettingsPage() {
  const { currentRole } = useApp();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const accessibleTiles = settingsTiles.filter(tile => tile.minRole.includes(currentRole));

  const renderTileGrid = () => (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accessibleTiles.map(tile => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.id}
              className={cn(
                'relative overflow-hidden rounded-xl border border-border bg-gradient-to-br p-5 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group',
                tile.gradient
              )}
              onClick={() => setActiveSection(tile.id)}
              data-testid={`settings-tile-${tile.id}`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 opacity-[0.05] -mr-2 -mt-2">
                <svg viewBox="0 0 80 80" className="w-full h-full">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
                  <circle cx="40" cy="40" r="20" fill="none" stroke="currentColor" strokeWidth="1" className="text-foreground" />
                </svg>
              </div>
              <div className="flex items-start gap-4 relative">
                <div className="w-11 h-11 rounded-xl bg-background/60 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-foreground/70" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{tile.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{tile.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} data-testid="button-back-settings">
          Back
        </Button>
        <Button size="sm" data-testid="button-add-user">
          <Plus className="h-4 w-4 mr-1" />
          Add User
        </Button>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." className="pl-9" data-testid="input-search-users" />
      </div>
      <div className="space-y-2">
        {mockUsers.map(user => (
          <Card key={user.id} className="hover-elevate" data-testid={`user-${user.id}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{user.name}</p>
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" />
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid={`user-menu-${user.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderToolsSection = () => (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} data-testid="button-back-settings">
        Back
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableTools.map(tool => (
          <Card key={tool.id} className="hover-elevate" data-testid={`tool-${tool.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{tool.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                </div>
                <Switch defaultChecked={tool.enabled} data-testid={`tool-switch-${tool.id}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderGenericSection = (title: string, description: string) => (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} data-testid="button-back-settings">
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Enable feature</p>
              <p className="text-sm text-muted-foreground">Toggle this feature on or off</p>
            </div>
            <Switch defaultChecked data-testid="switch-feature-toggle" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Auto-configure</p>
              <p className="text-sm text-muted-foreground">Allow system to manage settings automatically</p>
            </div>
            <Switch data-testid="switch-auto-config" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'users': return renderUserManagement();
      case 'tools': return renderToolsSection();
      case 'organization': return renderGenericSection('Organization Settings', 'Manage your company profile and branding');
      case 'knowledge': return renderGenericSection('Knowledge Base', 'Upload documents and configure AI training data');
      case 'ai': return renderGenericSection('AI Configuration', 'Configure hunches, agents, and AI behavior');
      case 'security': return renderGenericSection('Security Settings', 'Authentication, SSO, and access policies');
      case 'notifications': return renderGenericSection('Notification Settings', 'Configure alert preferences and delivery channels');
      case 'data': return renderGenericSection('Data Management', 'Import, export, and data retention policies');
      case 'appearance': return renderGenericSection('Appearance', 'Theme, layout, and display preferences');
      case 'api': return renderGenericSection('API & Webhooks', 'Developer settings and external integrations');
      default: return renderTileGrid();
    }
  };

  return (
    <div className="flex flex-col h-full items-center">
      <div className="w-full max-w-5xl p-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">System Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your organization and application settings</p>
        </div>
      </div>

      <div className="px-4 py-2 w-full max-w-5xl border-b border-border flex items-center">
        <FavoritesBar currentPath="/settings/system" currentLabel="System Settings" />
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="max-w-5xl mx-auto">
          {renderSectionContent()}
        </div>
      </ScrollArea>
    </div>
  );
}
