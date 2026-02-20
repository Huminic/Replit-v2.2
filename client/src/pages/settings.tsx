import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
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
import { useToast } from '@/hooks/use-toast';
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
  const { toast } = useToast();
  const { currentRole } = useApp();
  const [location] = useLocation();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, [location]);

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
                'relative rounded-xl border border-border bg-gradient-to-br p-5 cursor-pointer hover-elevate group',
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
        <Button size="sm" onClick={() => toast({ title: 'Add user', description: 'User creation is not available in demo mode.' })} data-testid="button-add-user">
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
                    <DropdownMenuItem onClick={() => toast({ title: 'Edit user', description: `Editing ${user.name} is not available in demo mode.` })}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => toast({ title: 'User removed', description: `${user.name} has been removed.` })}>
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

  const renderSectionPage = (title: string, description: string, items: { label: string; desc: string; type: 'toggle' | 'text' | 'select'; defaultValue?: boolean | string }[]) => (
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
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 py-1">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              {item.type === 'toggle' && <Switch defaultChecked={item.defaultValue as boolean} data-testid={`switch-${title.toLowerCase().replace(/\s/g, '-')}-${idx}`} />}
              {item.type === 'text' && <Input defaultValue={item.defaultValue as string} className="max-w-[200px]" data-testid={`input-${title.toLowerCase().replace(/\s/g, '-')}-${idx}`} />}
            </div>
          ))}
          <div className="pt-2">
            <Button size="sm" onClick={() => toast({ title: 'Settings saved', description: 'Your changes have been applied.' })} data-testid={`button-save-${title.toLowerCase().replace(/\s/g, '-')}`}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'users': return renderUserManagement();
      case 'tools': return renderToolsSection();
      case 'organization': return renderSectionPage('Organization Settings', 'Manage your company profile and branding', [
        { label: 'Organization Name', desc: 'Your company display name', type: 'text', defaultValue: 'Sunset Motors' },
        { label: 'Business Phone', desc: 'Primary contact number', type: 'text', defaultValue: '(555) 123-4567' },
        { label: 'Business Email', desc: 'Primary contact email', type: 'text', defaultValue: 'info@sunsetmotors.com' },
        { label: 'Public Listing', desc: 'Show in partner directory', type: 'toggle', defaultValue: true },
        { label: 'Multi-Location', desc: 'Enable multi-location support', type: 'toggle', defaultValue: false },
      ]);
      case 'knowledge': return renderSectionPage('Knowledge Base', 'Upload documents and configure AI training data', [
        { label: 'Auto-Index Files', desc: 'Automatically index uploaded documents for AI', type: 'toggle', defaultValue: true },
        { label: 'Enable Web Scraping', desc: 'Allow AI to learn from linked web pages', type: 'toggle', defaultValue: false },
        { label: 'Document Retention', desc: 'Days to keep processed documents', type: 'text', defaultValue: '90' },
        { label: 'Smart Summarization', desc: 'Auto-generate summaries for uploaded docs', type: 'toggle', defaultValue: true },
      ]);
      case 'ai': return renderSectionPage('AI Configuration', 'Configure hunches, agents, and AI behavior', [
        { label: 'Enable Hunches', desc: 'AI-generated business intelligence insights', type: 'toggle', defaultValue: true },
        { label: 'Auto-Scoring', desc: 'Automatically score and prioritize leads', type: 'toggle', defaultValue: true },
        { label: 'Confidence Threshold', desc: 'Minimum confidence for AI suggestions (%)', type: 'text', defaultValue: '75' },
        { label: 'Learning Mode', desc: 'Allow AI to learn from user corrections', type: 'toggle', defaultValue: true },
        { label: 'Daily Digest', desc: 'Send daily AI insights summary via email', type: 'toggle', defaultValue: false },
      ]);
      case 'security': return renderSectionPage('Security Settings', 'Authentication, SSO, and access policies', [
        { label: 'Two-Factor Authentication', desc: 'Require 2FA for all users', type: 'toggle', defaultValue: false },
        { label: 'SSO Provider', desc: 'Single sign-on provider URL', type: 'text', defaultValue: '' },
        { label: 'Session Timeout', desc: 'Minutes before auto-logout', type: 'text', defaultValue: '30' },
        { label: 'IP Allowlist', desc: 'Restrict access to specific IP ranges', type: 'toggle', defaultValue: false },
        { label: 'Audit Logging', desc: 'Log all user actions for compliance', type: 'toggle', defaultValue: true },
      ]);
      case 'notifications': return renderSectionPage('Notification Settings', 'Configure alert preferences and delivery channels', [
        { label: 'Email Notifications', desc: 'Receive alerts via email', type: 'toggle', defaultValue: true },
        { label: 'SMS Notifications', desc: 'Receive alerts via SMS', type: 'toggle', defaultValue: false },
        { label: 'Push Notifications', desc: 'Browser push notifications', type: 'toggle', defaultValue: true },
        { label: 'Quiet Hours Start', desc: 'No notifications after this time', type: 'text', defaultValue: '22:00' },
        { label: 'Quiet Hours End', desc: 'Resume notifications at this time', type: 'text', defaultValue: '07:00' },
      ]);
      case 'data': return renderSectionPage('Data Management', 'Import, export, and data retention policies', [
        { label: 'Auto-Backup', desc: 'Enable daily automatic data backups', type: 'toggle', defaultValue: true },
        { label: 'Data Retention', desc: 'Months to retain closed records', type: 'text', defaultValue: '24' },
        { label: 'Export Format', desc: 'Default export file format', type: 'text', defaultValue: 'CSV' },
        { label: 'GDPR Compliance', desc: 'Enable GDPR data handling rules', type: 'toggle', defaultValue: true },
      ]);
      case 'appearance': return renderSectionPage('Appearance', 'Theme, layout, and display preferences', [
        { label: 'Compact Mode', desc: 'Use smaller spacing and fonts', type: 'toggle', defaultValue: false },
        { label: 'Animations', desc: 'Enable UI animations and transitions', type: 'toggle', defaultValue: true },
        { label: 'Default View', desc: 'Default page on login', type: 'text', defaultValue: 'Main' },
        { label: 'Show Metric Tiles', desc: 'Display KPI tiles on home page', type: 'toggle', defaultValue: true },
      ]);
      case 'api': return renderSectionPage('API & Webhooks', 'Developer settings and external integrations', [
        { label: 'API Access', desc: 'Enable REST API access for this org', type: 'toggle', defaultValue: true },
        { label: 'API Key', desc: 'Your organization API key', type: 'text', defaultValue: 'nxs_sk_...redacted' },
        { label: 'Rate Limit', desc: 'Requests per minute', type: 'text', defaultValue: '1000' },
        { label: 'Webhook URL', desc: 'Endpoint for event webhooks', type: 'text', defaultValue: '' },
        { label: 'Webhook Events', desc: 'Send webhooks for deal changes', type: 'toggle', defaultValue: false },
      ]);
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
