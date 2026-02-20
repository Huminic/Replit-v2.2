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
  Globe,
  MessageSquare,
  Video,
  Phone,
  PhoneCall,
  Mic,
  Send,
  Copy,
  Check,
  ChevronRight,
  ArrowLeft,
  Code,
  Layout,
  Target,
  Link2,
  X
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockUsers, getRoleLabel, type UserRole } from '@/mocks/users';
import { availableTools } from '@/mocks/agents';
import {
  mockWidgetConfigs,
  mockLandingPages,
  getWidgetStatusColor,
  getLandingPageTypeLabel,
  getEnabledChannelCount,
  generateEmbedCode,
  defaultChannels,
  defaultAppearance,
  defaultTargeting,
  type WidgetConfig,
  type LandingPage,
  type ChannelConfig,
  type AppearanceConfig,
  type TargetingConfig,
} from '@/mocks/widgets';
import { FavoritesBar } from '@/components/layout/FavoritesBar';
import { MobileNavDropdown } from '@/components/layout/MobileNavDropdown';
import { useApp } from '@/contexts/AppContext';

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
  { id: 'widgets', title: 'Widgets', description: 'Configure embeddable chat widgets', icon: MessageSquare, gradient: 'from-purple-500/15 to-indigo-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
  { id: 'landing-pages', title: 'Landing Pages', description: 'Manage hosted landing page experiences', icon: Layout, gradient: 'from-cyan-500/15 to-blue-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
  { id: 'tools', title: 'Tools & Integrations', description: 'Configure connected tools and services', icon: Wrench, gradient: 'from-emerald-500/15 to-teal-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
  { id: 'knowledge', title: 'Knowledge Base', description: 'Upload and manage AI training data', icon: BookOpen, gradient: 'from-amber-500/15 to-orange-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
  { id: 'ai', title: 'AI Configuration', description: 'Hunches, agents, and AI behavior settings', icon: Zap, gradient: 'from-fuchsia-500/15 to-pink-500/5', minRole: ['super_admin', 'partner_admin'] },
  { id: 'security', title: 'Security', description: 'Authentication, SSO, and access policies', icon: Lock, gradient: 'from-red-500/15 to-rose-500/5', minRole: ['super_admin', 'partner_admin'] },
  { id: 'notifications', title: 'Notifications', description: 'Alert preferences and delivery channels', icon: Bell, gradient: 'from-sky-500/15 to-blue-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
  { id: 'data', title: 'Data Management', description: 'Imports, exports, and data retention', icon: Database, gradient: 'from-indigo-500/15 to-violet-500/5', minRole: ['super_admin'] },
  { id: 'appearance', title: 'Appearance', description: 'Theme, layout, and display preferences', icon: Palette, gradient: 'from-teal-500/15 to-emerald-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
  { id: 'api', title: 'API & Webhooks', description: 'Developer settings and external integrations', icon: Globe, gradient: 'from-orange-500/15 to-amber-500/5', minRole: ['super_admin'] },
];

const channelMeta: { key: keyof ChannelConfig; icon: React.ElementType; description: string; requiresField?: string }[] = [
  { key: 'textChat', icon: MessageSquare, description: 'AI-powered text chat with streaming responses' },
  { key: 'videoAgent', icon: Video, description: 'Live 2-way video via Tavus AI persona', requiresField: 'personaId' },
  { key: 'callUs', icon: Phone, description: 'Shows dealer phone number with click-to-call', requiresField: 'phoneNumber' },
  { key: 'callYou', icon: PhoneCall, description: 'Callback request form queued for auto-call', requiresField: 'assistantId' },
  { key: 'webAudio', icon: Mic, description: 'Browser-based voice conversation via VAPI', requiresField: 'assistantId' },
  { key: 'sendText', icon: Send, description: 'SMS form sent via TextMagic integration' },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const { currentRole } = useApp();
  const [location] = useLocation();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(mockWidgetConfigs);
  const [landingPages, setLandingPages] = useState<LandingPage[]>(mockLandingPages);
  const [selectedWidget, setSelectedWidget] = useState<WidgetConfig | null>(null);
  const [selectedLandingPage, setSelectedLandingPage] = useState<LandingPage | null>(null);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [widgetTab, setWidgetTab] = useState('appearance');
  const [newDomain, setNewDomain] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (section) {
      setActiveSection(section);
    }
  }, [location]);

  const accessibleTiles = settingsTiles.filter(tile => tile.minRole.includes(currentRole));

  const handleCopyEmbed = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedEmbed(true);
    toast({ title: 'Copied!', description: 'Embed code copied to clipboard.' });
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleAddDomain = () => {
    if (!newDomain.trim() || !selectedWidget) return;
    const updated = { ...selectedWidget, allowedDomains: [...selectedWidget.allowedDomains, newDomain.trim()] };
    setSelectedWidget(updated);
    setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
    setNewDomain('');
    toast({ title: 'Domain added', description: `${newDomain.trim()} added to whitelist.` });
  };

  const handleRemoveDomain = (domain: string) => {
    if (!selectedWidget) return;
    const updated = { ...selectedWidget, allowedDomains: selectedWidget.allowedDomains.filter(d => d !== domain) };
    setSelectedWidget(updated);
    setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
  };

  const handleToggleChannel = (channelKey: keyof ChannelConfig, enabled: boolean) => {
    if (!selectedWidget) return;
    const updated = {
      ...selectedWidget,
      channels: {
        ...selectedWidget.channels,
        [channelKey]: { ...selectedWidget.channels[channelKey], enabled },
      },
    };
    setSelectedWidget(updated);
    setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
  };

  const handleDeleteWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    if (selectedWidget?.id === widgetId) setSelectedWidget(null);
    toast({ title: 'Widget deleted', description: 'The widget has been removed.' });
  };

  const handleCreateWidget = () => {
    const newWidget: WidgetConfig = {
      id: `widget-${Date.now()}`,
      widgetCode: `widget_${Math.random().toString(16).slice(2, 10)}`,
      name: 'New Widget',
      organizationId: 'org-1',
      status: 'draft',
      appearance: { ...defaultAppearance },
      channels: { ...defaultChannels },
      targeting: { ...defaultTargeting },
      allowedDomains: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWidgets(prev => [...prev, newWidget]);
    setSelectedWidget(newWidget);
    setWidgetTab('appearance');
    toast({ title: 'Widget created', description: 'Configure your new widget.' });
  };

  const handleCreateLandingPage = () => {
    const newPage: LandingPage = {
      id: `lp-${Date.now()}`,
      slug: `page-${Math.random().toString(36).slice(2, 8)}`,
      name: 'New Landing Page',
      type: 'multi',
      widgetConfigId: widgets[0]?.id || '',
      status: 'draft',
      appearance: {
        headerColor: '#8b5cf6',
        logoUrl: '',
        backgroundColor: '#ffffff',
        heading: 'Welcome',
        subheading: 'Choose how you\'d like to connect with us',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      conversions: 0,
    };
    setLandingPages(prev => [...prev, newPage]);
    setSelectedLandingPage(newPage);
    toast({ title: 'Page created', description: 'Configure your new landing page.' });
  };

  const handleDeleteLandingPage = (pageId: string) => {
    setLandingPages(prev => prev.filter(p => p.id !== pageId));
    if (selectedLandingPage?.id === pageId) setSelectedLandingPage(null);
    toast({ title: 'Page deleted', description: 'The landing page has been removed.' });
  };

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
          <ArrowLeft className="h-4 w-4 mr-1" />
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
        <ArrowLeft className="h-4 w-4 mr-1" />
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
        <ArrowLeft className="h-4 w-4 mr-1" />
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

  const renderWidgetPreview = (widget: WidgetConfig) => {
    const { appearance } = widget;
    const enabledChannels = channelMeta.filter(ch => widget.channels[ch.key].enabled);

    return (
      <div className="flex flex-col items-center gap-4 p-4">
        <p className="text-xs text-muted-foreground">Live Preview</p>
        <div className="w-[320px] rounded-2xl border border-border shadow-xl overflow-hidden bg-background">
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: appearance.colorTheme.primaryColor }}
          >
            <button className="text-white/70 text-sm">&larr;</button>
            <span className="text-white font-semibold text-sm">
              {appearance.branding.organizationName || 'Your Business'}
            </span>
            <button className="text-white/70 text-sm">&times;</button>
          </div>
          <div className="p-5 text-center">
            <p className="font-semibold text-foreground text-base">{appearance.welcomeScreen.heading}</p>
            <p className="text-sm text-muted-foreground mt-1">{appearance.welcomeScreen.message}</p>
          </div>
          <div className="px-4 pb-4 grid grid-cols-2 gap-2">
            {enabledChannels.map((ch) => {
              const Icon = ch.icon;
              const channelData = widget.channels[ch.key];
              return (
                <div
                  key={ch.key}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-primary/30 transition-colors cursor-pointer"
                  data-testid={`preview-channel-${ch.key}`}
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">{channelData.displayName}</span>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-2 border-t border-border text-center">
            <span className="text-[10px] text-muted-foreground">Powered by Nexxus</span>
          </div>
        </div>
        <div
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center shadow-lg cursor-pointer"
          style={{ backgroundColor: appearance.colorTheme.primaryColor }}
          data-testid="preview-widget-button"
        >
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <p className="text-[10px] text-muted-foreground">{appearance.minimizedState.label}</p>
      </div>
    );
  };

  const renderWidgetDetail = (widget: WidgetConfig) => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedWidget(null); }} data-testid="button-back-widget-list">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Widgets
        </Button>
        <div className="flex items-center gap-2">
          <Badge className={cn('text-white text-xs', getWidgetStatusColor(widget.status))}>
            {widget.status}
          </Badge>
          <Button
            size="sm"
            onClick={() => {
              const newStatus = widget.status === 'active' ? 'inactive' : 'active';
              const updated = { ...widget, status: newStatus as WidgetConfig['status'] };
              setSelectedWidget(updated);
              setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
              toast({ title: `Widget ${newStatus}`, description: `Widget is now ${newStatus}.` });
            }}
            variant={widget.status === 'active' ? 'outline' : 'default'}
            data-testid="button-toggle-widget-status"
          >
            {widget.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground">Widget Name</Label>
            <Input
              value={widget.name}
              onChange={(e) => {
                const updated = { ...widget, name: e.target.value };
                setSelectedWidget(updated);
                setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
              }}
              className="mt-1"
              data-testid="input-widget-name"
            />
            <p className="text-xs text-muted-foreground mt-1">Code: {widget.widgetCode}</p>
          </div>

          <Tabs value={widgetTab} onValueChange={setWidgetTab}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="appearance" data-testid="tab-appearance">
                <Palette className="h-3.5 w-3.5 mr-1 hidden sm:block" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="channels" data-testid="tab-channels">
                <MessageSquare className="h-3.5 w-3.5 mr-1 hidden sm:block" />
                Channels
              </TabsTrigger>
              <TabsTrigger value="targeting" data-testid="tab-targeting">
                <Target className="h-3.5 w-3.5 mr-1 hidden sm:block" />
                Targeting
              </TabsTrigger>
              <TabsTrigger value="domains" data-testid="tab-domains">
                <Link2 className="h-3.5 w-3.5 mr-1 hidden sm:block" />
                Domains
              </TabsTrigger>
              <TabsTrigger value="embed" data-testid="tab-embed">
                <Code className="h-3.5 w-3.5 mr-1 hidden sm:block" />
                Embed
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Color Theme</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {(['primaryColor', 'secondaryColor', 'textColor', 'backgroundColor'] as const).map((colorKey) => (
                      <div key={colorKey}>
                        <Label className="text-xs capitalize">{colorKey.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className="w-8 h-8 rounded-md border border-border flex-shrink-0"
                            style={{ backgroundColor: widget.appearance.colorTheme[colorKey] }}
                          />
                          <Input
                            value={widget.appearance.colorTheme[colorKey]}
                            onChange={(e) => {
                              const updated = {
                                ...widget,
                                appearance: {
                                  ...widget.appearance,
                                  colorTheme: { ...widget.appearance.colorTheme, [colorKey]: e.target.value },
                                },
                              };
                              setSelectedWidget(updated);
                              setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                            }}
                            className="h-8 text-xs"
                            data-testid={`input-color-${colorKey}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Branding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Organization Name</Label>
                    <Input
                      value={widget.appearance.branding.organizationName}
                      onChange={(e) => {
                        const updated = {
                          ...widget,
                          appearance: {
                            ...widget.appearance,
                            branding: { ...widget.appearance.branding, organizationName: e.target.value },
                          },
                        };
                        setSelectedWidget(updated);
                        setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                      }}
                      className="mt-1"
                      data-testid="input-org-name-widget"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Show Logo</p>
                      <p className="text-xs text-muted-foreground">Display organization logo in widget header</p>
                    </div>
                    <Switch
                      checked={widget.appearance.branding.showLogo}
                      onCheckedChange={(checked) => {
                        const updated = {
                          ...widget,
                          appearance: {
                            ...widget.appearance,
                            branding: { ...widget.appearance.branding, showLogo: checked },
                          },
                        };
                        setSelectedWidget(updated);
                        setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                      }}
                      data-testid="switch-show-logo"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Welcome Screen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Heading</Label>
                    <Input
                      value={widget.appearance.welcomeScreen.heading}
                      onChange={(e) => {
                        const updated = {
                          ...widget,
                          appearance: {
                            ...widget.appearance,
                            welcomeScreen: { ...widget.appearance.welcomeScreen, heading: e.target.value },
                          },
                        };
                        setSelectedWidget(updated);
                        setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                      }}
                      className="mt-1"
                      data-testid="input-welcome-heading"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Message</Label>
                    <Textarea
                      value={widget.appearance.welcomeScreen.message}
                      onChange={(e) => {
                        const updated = {
                          ...widget,
                          appearance: {
                            ...widget.appearance,
                            welcomeScreen: { ...widget.appearance.welcomeScreen, message: e.target.value },
                          },
                        };
                        setSelectedWidget(updated);
                        setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                      }}
                      rows={2}
                      className="mt-1"
                      data-testid="input-welcome-message"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Minimized State</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Position</Label>
                      <Select
                        value={widget.appearance.minimizedState.position}
                        onValueChange={(val) => {
                          const updated = {
                            ...widget,
                            appearance: {
                              ...widget.appearance,
                              minimizedState: { ...widget.appearance.minimizedState, position: val as 'bottom-right' | 'bottom-left' },
                            },
                          };
                          setSelectedWidget(updated);
                          setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                        }}
                      >
                        <SelectTrigger className="mt-1" data-testid="select-position">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Animation</Label>
                      <Select
                        value={widget.appearance.minimizedState.animation}
                        onValueChange={(val) => {
                          const updated = {
                            ...widget,
                            appearance: {
                              ...widget.appearance,
                              minimizedState: { ...widget.appearance.minimizedState, animation: val as 'pulse' | 'bounce' | 'none' },
                            },
                          };
                          setSelectedWidget(updated);
                          setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                        }}
                      >
                        <SelectTrigger className="mt-1" data-testid="select-animation">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pulse">Pulse</SelectItem>
                          <SelectItem value="bounce">Bounce</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Button Label</Label>
                    <Input
                      value={widget.appearance.minimizedState.label}
                      onChange={(e) => {
                        const updated = {
                          ...widget,
                          appearance: {
                            ...widget.appearance,
                            minimizedState: { ...widget.appearance.minimizedState, label: e.target.value },
                          },
                        };
                        setSelectedWidget(updated);
                        setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                      }}
                      className="mt-1"
                      data-testid="input-button-label"
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={() => toast({ title: 'Appearance saved', description: 'Widget appearance updated.' })}
                data-testid="button-save-appearance"
              >
                Save Appearance
              </Button>
            </TabsContent>

            <TabsContent value="channels" className="mt-4 space-y-3">
              {channelMeta.map((ch) => {
                const Icon = ch.icon;
                const channelData = widget.channels[ch.key];
                return (
                  <Card key={ch.key} data-testid={`channel-card-${ch.key}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Icon className="h-4 w-4 text-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{channelData.displayName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{ch.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={channelData.enabled}
                          onCheckedChange={(checked) => handleToggleChannel(ch.key, checked)}
                          data-testid={`switch-channel-${ch.key}`}
                        />
                      </div>
                      {channelData.enabled && ch.requiresField && (
                        <div className="mt-3 pl-12">
                          {ch.key === 'callUs' && (
                            <div>
                              <Label className="text-xs">Phone Number</Label>
                              <Input
                                value={(channelData as any).phoneNumber || ''}
                                onChange={(e) => {
                                  const updated = {
                                    ...widget,
                                    channels: {
                                      ...widget.channels,
                                      [ch.key]: { ...channelData, phoneNumber: e.target.value },
                                    },
                                  };
                                  setSelectedWidget(updated);
                                  setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                                }}
                                placeholder="+1-555-0100"
                                className="mt-1"
                                data-testid={`input-${ch.key}-phone`}
                              />
                            </div>
                          )}
                          {ch.key === 'videoAgent' && (
                            <div>
                              <Label className="text-xs">Tavus Persona ID</Label>
                              <Input
                                value={(channelData as any).personaId || ''}
                                onChange={(e) => {
                                  const updated = {
                                    ...widget,
                                    channels: {
                                      ...widget.channels,
                                      [ch.key]: { ...channelData, personaId: e.target.value },
                                    },
                                  };
                                  setSelectedWidget(updated);
                                  setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                                }}
                                placeholder="tavus_persona_..."
                                className="mt-1"
                                data-testid={`input-${ch.key}-persona`}
                              />
                            </div>
                          )}
                          {(ch.key === 'callYou' || ch.key === 'webAudio') && (
                            <div className="space-y-2">
                              <div>
                                <Label className="text-xs">VAPI Assistant ID</Label>
                                <Input
                                  value={(channelData as any).assistantId || ''}
                                  onChange={(e) => {
                                    const updated = {
                                      ...widget,
                                      channels: {
                                        ...widget.channels,
                                        [ch.key]: { ...channelData, assistantId: e.target.value },
                                      },
                                    };
                                    setSelectedWidget(updated);
                                    setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                                  }}
                                  placeholder="vapi_asst_..."
                                  className="mt-1"
                                  data-testid={`input-${ch.key}-assistant`}
                                />
                              </div>
                              {ch.key === 'webAudio' && (
                                <div>
                                  <Label className="text-xs">VAPI Public Key</Label>
                                  <Input
                                    value={(channelData as any).publicKey || ''}
                                    onChange={(e) => {
                                      const updated = {
                                        ...widget,
                                        channels: {
                                          ...widget.channels,
                                          [ch.key]: { ...channelData, publicKey: e.target.value },
                                        },
                                      };
                                      setSelectedWidget(updated);
                                      setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                                    }}
                                    placeholder="pk_..."
                                    className="mt-1"
                                    data-testid={`input-${ch.key}-publickey`}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              <Button
                onClick={() => toast({ title: 'Channels saved', description: 'Channel configuration updated.' })}
                data-testid="button-save-channels"
              >
                Save Channels
              </Button>
            </TabsContent>

            <TabsContent value="targeting" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Audience</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={widget.targeting.audience}
                    onValueChange={(val) => {
                      const updated = {
                        ...widget,
                        targeting: { ...widget.targeting, audience: val as 'all' | 'leads' | 'returning' },
                      };
                      setSelectedWidget(updated);
                      setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                    }}
                  >
                    <SelectTrigger data-testid="select-audience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Visitors</SelectItem>
                      <SelectItem value="leads">Known Leads Only</SelectItem>
                      <SelectItem value="returning">Returning Visitors</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Device Targeting</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(['desktop', 'mobile', 'tablet'] as const).map((device) => (
                    <div key={device} className="flex items-center justify-between">
                      <Label className="text-sm capitalize">{device}</Label>
                      <Switch
                        checked={widget.targeting.deviceTargeting[device]}
                        onCheckedChange={(checked) => {
                          const updated = {
                            ...widget,
                            targeting: {
                              ...widget.targeting,
                              deviceTargeting: { ...widget.targeting.deviceTargeting, [device]: checked },
                            },
                          };
                          setSelectedWidget(updated);
                          setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                        }}
                        data-testid={`switch-device-${device}`}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Behavior Triggers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Delay (seconds)</Label>
                      <Input
                        type="number"
                        value={widget.targeting.behaviorTriggers.delaySeconds}
                        onChange={(e) => {
                          const updated = {
                            ...widget,
                            targeting: {
                              ...widget.targeting,
                              behaviorTriggers: { ...widget.targeting.behaviorTriggers, delaySeconds: Number(e.target.value) },
                            },
                          };
                          setSelectedWidget(updated);
                          setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                        }}
                        className="mt-1"
                        data-testid="input-delay-seconds"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Scroll Depth (%)</Label>
                      <Input
                        type="number"
                        value={widget.targeting.behaviorTriggers.scrollDepthPercent}
                        onChange={(e) => {
                          const updated = {
                            ...widget,
                            targeting: {
                              ...widget.targeting,
                              behaviorTriggers: { ...widget.targeting.behaviorTriggers, scrollDepthPercent: Number(e.target.value) },
                            },
                          };
                          setSelectedWidget(updated);
                          setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                        }}
                        className="mt-1"
                        data-testid="input-scroll-depth"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Exit Intent</p>
                      <p className="text-xs text-muted-foreground">Show widget when user moves to leave</p>
                    </div>
                    <Switch
                      checked={widget.targeting.behaviorTriggers.exitIntent}
                      onCheckedChange={(checked) => {
                        const updated = {
                          ...widget,
                          targeting: {
                            ...widget.targeting,
                            behaviorTriggers: { ...widget.targeting.behaviorTriggers, exitIntent: checked },
                          },
                        };
                        setSelectedWidget(updated);
                        setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                      }}
                      data-testid="switch-exit-intent"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Business Hours Only</p>
                      <p className="text-xs text-muted-foreground">Only show during configured hours</p>
                    </div>
                    <Switch
                      checked={widget.targeting.businessHoursOnly}
                      onCheckedChange={(checked) => {
                        const updated = {
                          ...widget,
                          targeting: { ...widget.targeting, businessHoursOnly: checked },
                        };
                        setSelectedWidget(updated);
                        setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
                      }}
                      data-testid="switch-business-hours"
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={() => toast({ title: 'Targeting saved', description: 'Targeting rules updated.' })}
                data-testid="button-save-targeting"
              >
                Save Targeting
              </Button>
            </TabsContent>

            <TabsContent value="domains" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Allowed Domains</CardTitle>
                  <CardDescription>
                    Only these domains can load your widget. Leave empty to allow all domains (testing only). Supports wildcards (e.g. *.example.com).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="example.com or *.example.com"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                      data-testid="input-add-domain"
                    />
                    <Button onClick={handleAddDomain} size="sm" data-testid="button-add-domain">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {widget.allowedDomains.length === 0 ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                      No domains configured. Widget will accept requests from any domain. Add domains before going live.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {widget.allowedDomains.map((domain) => (
                        <div
                          key={domain}
                          className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2"
                          data-testid={`domain-${domain}`}
                        >
                          <div className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-mono">{domain}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleRemoveDomain(domain)}
                            data-testid={`button-remove-domain-${domain}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Maximum 50 domains per widget.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="embed" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Embed Code</CardTitle>
                  <CardDescription>
                    Copy this code and paste it into your website's HTML, just before the closing &lt;/body&gt; tag.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="bg-muted rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-border">
                      {generateEmbedCode(widget)}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleCopyEmbed(generateEmbedCode(widget))}
                      data-testid="button-copy-embed"
                    >
                      {copiedEmbed ? (
                        <><Check className="h-3.5 w-3.5 mr-1" /> Copied</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Widget Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Widget Code</span>
                    <span className="font-mono text-xs">{widget.widgetCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={cn('text-white text-xs', getWidgetStatusColor(widget.status))}>
                      {widget.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Channels</span>
                    <span>{getEnabledChannelCount(widget.channels)} of 6</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Allowed Domains</span>
                    <span>{widget.allowedDomains.length || 'All (testing)'}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="hidden lg:block w-[360px] flex-shrink-0 border-l border-border pl-6">
          {renderWidgetPreview(widget)}
        </div>
      </div>
    </div>
  );

  const renderWidgetsSection = () => {
    if (selectedWidget) {
      return renderWidgetDetail(selectedWidget);
    }

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} data-testid="button-back-settings">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button size="sm" onClick={handleCreateWidget} data-testid="button-create-widget">
            <Plus className="h-4 w-4 mr-1" />
            Create Widget
          </Button>
        </div>

        <div className="space-y-3">
          {widgets.map((widget) => (
            <Card
              key={widget.id}
              className="hover-elevate cursor-pointer"
              onClick={() => { setSelectedWidget(widget); setWidgetTab('appearance'); }}
              data-testid={`widget-card-${widget.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: widget.appearance.colorTheme.primaryColor + '20' }}
                  >
                    <MessageSquare className="h-5 w-5" style={{ color: widget.appearance.colorTheme.primaryColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{widget.name}</p>
                      <Badge className={cn('text-white text-[10px] px-1.5', getWidgetStatusColor(widget.status))}>
                        {widget.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="font-mono">{widget.widgetCode}</span>
                      <span>{getEnabledChannelCount(widget.channels)} channels</span>
                      <span>{widget.allowedDomains.length ? `${widget.allowedDomains.length} domains` : 'All domains'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`widget-menu-${widget.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedWidget(widget); setWidgetTab('appearance'); }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedWidget(widget); setWidgetTab('embed'); }}>
                          <Code className="h-4 w-4 mr-2" />
                          View Embed Code
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteWidget(widget.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {widgets.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No widgets configured yet.</p>
              <Button size="sm" className="mt-3" onClick={handleCreateWidget}>
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Widget
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLandingPageDetail = (page: LandingPage) => {
    const linkedWidget = widgets.find(w => w.id === page.widgetConfigId);
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedLandingPage(null)} data-testid="button-back-landing-list">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Pages
          </Button>
          <div className="flex items-center gap-2">
            <Badge className={cn('text-white text-xs', page.status === 'active' ? 'bg-emerald-500' : page.status === 'inactive' ? 'bg-gray-400' : 'bg-amber-500')}>
              {page.status}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newStatus = page.status === 'active' ? 'inactive' : 'active';
                const updated = { ...page, status: newStatus as LandingPage['status'] };
                setSelectedLandingPage(updated);
                setLandingPages(prev => prev.map(p => p.id === updated.id ? updated : p));
                toast({ title: `Page ${newStatus}`, description: `Landing page is now ${newStatus}.` });
              }}
              data-testid="button-toggle-page-status"
            >
              {page.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Page Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Page Name</Label>
                  <Input
                    value={page.name}
                    onChange={(e) => {
                      const updated = { ...page, name: e.target.value };
                      setSelectedLandingPage(updated);
                      setLandingPages(prev => prev.map(p => p.id === updated.id ? updated : p));
                    }}
                    className="mt-1"
                    data-testid="input-page-name"
                  />
                </div>
                <div>
                  <Label className="text-xs">URL Slug</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">/w/</span>
                    <Input
                      value={page.slug}
                      onChange={(e) => {
                        const updated = { ...page, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') };
                        setSelectedLandingPage(updated);
                        setLandingPages(prev => prev.map(p => p.id === updated.id ? updated : p));
                      }}
                      data-testid="input-page-slug"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Full URL: https://nexxusv2.huminicdev.com/w/{page.slug}
                  </p>
                </div>
                <div>
                  <Label className="text-xs">Page Type</Label>
                  <Select
                    value={page.type}
                    onValueChange={(val) => {
                      const updated = { ...page, type: val as LandingPage['type'] };
                      setSelectedLandingPage(updated);
                      setLandingPages(prev => prev.map(p => p.id === updated.id ? updated : p));
                    }}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-page-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multi">Multi-Channel (selector cards)</SelectItem>
                      <SelectItem value="chat">Chat Only (full-screen chat)</SelectItem>
                      <SelectItem value="video">Video Agent (full-screen video)</SelectItem>
                      <SelectItem value="callback">Callback Form (request form)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Linked Widget</Label>
                  <Select
                    value={page.widgetConfigId}
                    onValueChange={(val) => {
                      const updated = { ...page, widgetConfigId: val };
                      setSelectedLandingPage(updated);
                      setLandingPages(prev => prev.map(p => p.id === updated.id ? updated : p));
                    }}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-linked-widget">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {widgets.map((w) => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Channels and configuration are inherited from the linked widget.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Page Appearance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Header Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className="w-8 h-8 rounded-md border border-border flex-shrink-0"
                      style={{ backgroundColor: page.appearance.headerColor }}
                    />
                    <Input
                      value={page.appearance.headerColor}
                      onChange={(e) => {
                        const updated = { ...page, appearance: { ...page.appearance, headerColor: e.target.value } };
                        setSelectedLandingPage(updated);
                        setLandingPages(prev => prev.map(p => p.id === updated.id ? updated : p));
                      }}
                      className="h-8 text-xs"
                      data-testid="input-page-header-color"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Heading</Label>
                  <Input
                    value={page.appearance.heading}
                    onChange={(e) => {
                      const updated = { ...page, appearance: { ...page.appearance, heading: e.target.value } };
                      setSelectedLandingPage(updated);
                      setLandingPages(prev => prev.map(p => p.id === updated.id ? updated : p));
                    }}
                    className="mt-1"
                    data-testid="input-page-heading"
                  />
                </div>
                <div>
                  <Label className="text-xs">Subheading</Label>
                  <Input
                    value={page.appearance.subheading}
                    onChange={(e) => {
                      const updated = { ...page, appearance: { ...page.appearance, subheading: e.target.value } };
                      setSelectedLandingPage(updated);
                      setLandingPages(prev => prev.map(p => p.id === updated.id ? updated : p));
                    }}
                    className="mt-1"
                    data-testid="input-page-subheading"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={() => toast({ title: 'Page saved', description: 'Landing page configuration updated.' })}
              data-testid="button-save-landing-page"
            >
              Save Changes
            </Button>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div
                    className="px-4 py-3 text-center"
                    style={{ backgroundColor: page.appearance.headerColor }}
                  >
                    <p className="text-white font-semibold text-sm">
                      {linkedWidget?.appearance.branding.organizationName || 'Your Business'}
                    </p>
                  </div>
                  <div
                    className="p-6 text-center"
                    style={{ backgroundColor: page.appearance.backgroundColor }}
                  >
                    <h3 className="font-bold text-foreground text-lg">{page.appearance.heading}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{page.appearance.subheading}</p>

                    {page.type === 'multi' && linkedWidget && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {channelMeta.filter(ch => linkedWidget.channels[ch.key].enabled).map((ch) => {
                          const Icon = ch.icon;
                          return (
                            <div key={ch.key} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-background">
                              <Icon className="h-5 w-5 text-muted-foreground" />
                              <span className="text-xs font-medium">{linkedWidget.channels[ch.key].displayName}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {page.type === 'chat' && (
                      <div className="mt-4 p-4 rounded-xl border border-border bg-background text-left space-y-2">
                        <div className="bg-muted rounded-lg px-3 py-2 text-xs max-w-[80%]">
                          Hi! How can I help you today?
                        </div>
                        <div className="flex justify-end">
                          <div className="rounded-lg px-3 py-2 text-xs text-white max-w-[80%]" style={{ backgroundColor: page.appearance.headerColor }}>
                            I'm interested in...
                          </div>
                        </div>
                      </div>
                    )}

                    {page.type === 'video' && (
                      <div className="mt-4 aspect-video rounded-xl border border-border bg-muted flex items-center justify-center">
                        <Video className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}

                    {page.type === 'callback' && (
                      <div className="mt-4 space-y-2 text-left max-w-xs mx-auto">
                        <div className="h-8 bg-muted rounded-md" />
                        <div className="h-8 bg-muted rounded-md" />
                        <div className="h-8 bg-muted rounded-md" />
                        <div className="h-9 rounded-md" style={{ backgroundColor: page.appearance.headerColor }} />
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-border text-center bg-background">
                    <span className="text-[10px] text-muted-foreground">Powered by Nexxus</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{page.views.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Views</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-foreground">{page.conversions.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Conversions</p>
                  </div>
                </div>
                {page.views > 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {((page.conversions / page.views) * 100).toFixed(1)}% conversion rate
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderLandingPagesSection = () => {
    if (selectedLandingPage) {
      return renderLandingPageDetail(selectedLandingPage);
    }

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} data-testid="button-back-settings">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Button size="sm" onClick={handleCreateLandingPage} data-testid="button-create-landing-page">
            <Plus className="h-4 w-4 mr-1" />
            Create Page
          </Button>
        </div>

        <div className="space-y-3">
          {landingPages.map((page) => {
            const linkedWidget = widgets.find(w => w.id === page.widgetConfigId);
            return (
              <Card
                key={page.id}
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedLandingPage(page)}
                data-testid={`landing-page-card-${page.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: page.appearance.headerColor + '20' }}
                    >
                      <Layout className="h-5 w-5" style={{ color: page.appearance.headerColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{page.name}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {getLandingPageTypeLabel(page.type)}
                        </Badge>
                        <Badge className={cn('text-white text-[10px] px-1.5', page.status === 'active' ? 'bg-emerald-500' : page.status === 'inactive' ? 'bg-gray-400' : 'bg-amber-500')}>
                          {page.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="font-mono">/w/{page.slug}</span>
                        {linkedWidget && <span>via {linkedWidget.name}</span>}
                        <span>{page.views.toLocaleString()} views</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`page-menu-${page.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedLandingPage(page)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(`https://nexxusv2.huminicdev.com/w/${page.slug}`);
                            toast({ title: 'URL copied', description: 'Landing page URL copied to clipboard.' });
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteLandingPage(page.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {landingPages.length === 0 && (
            <div className="text-center py-12">
              <Layout className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No landing pages created yet.</p>
              <Button size="sm" className="mt-3" onClick={handleCreateLandingPage}>
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Page
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'users': return renderUserManagement();
      case 'tools': return renderToolsSection();
      case 'widgets': return renderWidgetsSection();
      case 'landing-pages': return renderLandingPagesSection();
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

      <div className="px-4 py-2 w-full max-w-5xl lg:hidden">
        <MobileNavDropdown currentPath="/settings/system" currentLabel="System Settings" />
      </div>
      <div className="px-4 py-2 w-full max-w-5xl border-b border-border hidden lg:flex items-center">
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
