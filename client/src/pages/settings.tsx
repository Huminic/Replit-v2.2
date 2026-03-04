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
  Mic,
  LayoutGrid,
  Copy,
  Check,
  ChevronRight,
  ArrowLeft,
  Code,
  Layout,
  Target,
  Link2,
  X,
  Eye,
  ExternalLink,
  AlertTriangle,
  FileUp,
  HardDrive,
  KeyRound,
  Webhook,
  Brain,
  ChevronDown,
  Upload,
  FileText,
  Phone,
  ShieldCheck,
  Send,
  Power,
  PowerOff,
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
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  mockWidgets,
  defaultUniversalSettings,
  type UniversalWidgetSettings,
  type WidgetChannel,
  mockLandingPages,
  getWidgetStatusColor,
  getLandingPageTypeLabel,
  generateWidgetEmbedCode,
  widgetTypeConfig,
  type IndividualWidget,
  type LandingPage,
  type WidgetType,
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
  { id: 'tools', title: 'Tools & Integrations', description: 'Configure tools, widgets, and landing pages', icon: Wrench, gradient: 'from-emerald-500/15 to-teal-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
  { id: 'knowledge', title: 'Knowledge Base', description: 'Upload and manage AI training data', icon: BookOpen, gradient: 'from-amber-500/15 to-orange-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
  { id: 'ai', title: 'AI Configuration', description: 'Hunches, agents, and AI behavior settings', icon: Zap, gradient: 'from-fuchsia-500/15 to-pink-500/5', minRole: ['super_admin', 'partner_admin'] },
  { id: 'security', title: 'Security', description: 'Authentication, SSO, and access policies', icon: Lock, gradient: 'from-red-500/15 to-rose-500/5', minRole: ['super_admin', 'partner_admin'] },
  { id: 'notifications', title: 'Notifications', description: 'Alert preferences and delivery channels', icon: Bell, gradient: 'from-sky-500/15 to-blue-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
  { id: 'data', title: 'Data Management', description: 'Imports, exports, and data retention', icon: Database, gradient: 'from-indigo-500/15 to-violet-500/5', minRole: ['super_admin'] },
  { id: 'appearance', title: 'Appearance', description: 'Theme, layout, and display preferences', icon: Palette, gradient: 'from-teal-500/15 to-emerald-500/5', minRole: ['super_admin', 'partner_admin', 'org_admin'] },
];

const widgetTypeIcons: Record<WidgetType, React.ElementType> = {
  text: MessageSquare,
  video: Video,
  voice: Mic,
  unified: LayoutGrid,
};

interface ToolCardData {
  id: string;
  friendlyName: string;
  technicalName: string;
  description: string;
  enabled: boolean;
  locked: boolean;
  category: 'mcp' | 'api' | 'other';
  icon: React.ElementType;
}

const toolCards: ToolCardData[] = [
  { id: 'crm', friendlyName: 'CRM Integration', technicalName: 'VIN Solutions', description: 'Connect to your CRM for lead and customer data sync', enabled: false, locked: true, category: 'api', icon: Users },
  { id: 'voice', friendlyName: 'Voice Calling', technicalName: 'VAPI', description: 'Browser-based voice calls powered by VAPI', enabled: false, locked: true, category: 'api', icon: Phone },
  { id: 'video-calling', friendlyName: 'Video Calling', technicalName: 'Tavus', description: 'Face-to-face video chat via Tavus AI persona', enabled: false, locked: true, category: 'api', icon: Video },
  { id: 'auth', friendlyName: 'Authentication', technicalName: 'Google Auth', description: 'Single sign-on via Google authentication', enabled: false, locked: true, category: 'api', icon: ShieldCheck },
  { id: 'sms', friendlyName: 'SMS & Text Sending', technicalName: 'TextMagic', description: 'Send SMS and text messages to customers', enabled: true, locked: false, category: 'api', icon: MessageSquare },
  { id: 'doc-gen', friendlyName: 'Document Generator', technicalName: 'Document Generator', description: 'Generate sales documents and contracts', enabled: true, locked: false, category: 'other', icon: FileText },
];

interface SkillItem {
  id: string;
  name: string;
  category: 'Sales' | 'Finance' | 'Operations' | 'General';
  description: string;
  prompt: string;
  temperature: number;
  enabled: boolean;
}

const mockSkills: SkillItem[] = [
  { id: 's1', name: 'Lead Qualifier', category: 'Sales', description: 'Qualify incoming leads based on criteria and budget', prompt: 'You are a lead qualification specialist...', temperature: 0.3, enabled: true },
  { id: 's2', name: 'Payment Calculator', category: 'Sales', description: 'Calculate monthly payments and financing options', prompt: 'Calculate vehicle payments based on...', temperature: 0.1, enabled: true },
  { id: 's3', name: 'Deal Structurer', category: 'Finance', description: 'Structure deals with optimal terms for customer and dealer', prompt: 'Structure the deal considering...', temperature: 0.2, enabled: true },
  { id: 's4', name: 'Credit Application Processor', category: 'Finance', description: 'Process and evaluate credit applications', prompt: 'Review the credit application...', temperature: 0.1, enabled: false },
  { id: 's5', name: 'Inventory Tracker', category: 'Operations', description: 'Track and manage vehicle inventory status', prompt: 'Monitor inventory levels and...', temperature: 0.2, enabled: true },
  { id: 's6', name: 'Service Scheduler', category: 'Operations', description: 'Schedule service appointments and manage bay allocation', prompt: 'Schedule service appointments...', temperature: 0.2, enabled: true },
  { id: 's7', name: 'Email Composer', category: 'General', description: 'Compose professional emails for various scenarios', prompt: 'Compose a professional email...', temperature: 0.5, enabled: true },
  { id: 's8', name: 'FAQ Responder', category: 'General', description: 'Answer frequently asked questions about products and services', prompt: 'Answer the following FAQ...', temperature: 0.3, enabled: true },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const { currentRole, communicationGateEnabled, setCommunicationGateEnabled, personaName } = useApp();
  const [location] = useLocation();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<IndividualWidget[]>(mockWidgets);
  const [landingPages, setLandingPages] = useState<LandingPage[]>(mockLandingPages);
  const [selectedWidget, setSelectedWidget] = useState<IndividualWidget | null>(null);
  const [selectedLandingPage, setSelectedLandingPage] = useState<LandingPage | null>(null);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [widgetConfigTab, setWidgetConfigTab] = useState('settings');
  const [newDomain, setNewDomain] = useState('');
  const [previewWidget, setPreviewWidget] = useState<IndividualWidget | null>(null);
  const [toolsTab, setToolsTab] = useState('mcp');
  const [widgetSearch, setWidgetSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [skillFilter, setSkillFilter] = useState('All');
  const [showKillConfirm, setShowKillConfirm] = useState(false);
  const [expandedUpload, setExpandedUpload] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [universalSettings, setUniversalSettings] = useState<UniversalWidgetSettings>(defaultUniversalSettings);

  const isSuperAdmin = currentRole === 'super_admin';
  const isPartnerAdmin = currentRole === 'partner_admin';
  const isReadOnlyAI = isPartnerAdmin;

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

  const handleDeleteLandingPage = (pageId: string) => {
    setLandingPages(prev => prev.filter(p => p.id !== pageId));
    if (selectedLandingPage?.id === pageId) setSelectedLandingPage(null);
    toast({ title: 'Page deleted', description: 'The landing page has been removed.' });
  };

  const handleCreateLandingPage = () => {
    const newPage: LandingPage = {
      id: `lp-${Date.now()}`,
      slug: `page-${Math.random().toString(36).slice(2, 8)}`,
      name: 'New Landing Page',
      type: 'multi',
      linkedWidgetId: widgets[0]?.id || '',
      status: 'draft',
      appearance: {
        headerColor: '#8b5cf6',
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} data-testid="button-back-settings">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => toast({ title: 'Add user', description: 'User creation is not available in demo mode.' })} data-testid="button-add-user">
            <Plus className="h-4 w-4 mr-1" />
            Add User
          </Button>
          {isSuperAdmin && (
            <Button size="sm" variant="outline" onClick={() => window.location.href = '/settings/org-wizard'} data-testid="button-new-organization">
              <Plus className="h-4 w-4 mr-1" />
              New Organization
            </Button>
          )}
        </div>
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

  const handleCreateWidget = () => {
    const newWidget: IndividualWidget = {
      id: `wgt-${Date.now()}`,
      type: 'text',
      widgetCode: `NXW-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      name: 'New Widget',
      description: 'New text chat widget',
      status: 'draft',
      appearance: {
        primaryColor: '#8b5cf6',
        secondaryColor: '#3b82f6',
        textColor: '#ffffff',
        backgroundColor: '#ffffff',
        organizationName: 'Cage Automotive',
        showLogo: true,
        position: 'bottom-right',
        animation: 'pulse',
        buttonLabel: 'Chat with us',
        welcomeHeading: 'Hi there!',
        welcomeMessage: 'How can we help you today?',
      },
      targeting: {
        audience: 'all',
        includePages: '/*',
        excludePages: '/admin/*',
        desktop: true,
        mobile: true,
        tablet: true,
        businessHoursOnly: false,
        delaySeconds: 3,
        scrollDepthPercent: 0,
        exitIntent: false,
      },
      allowedDomains: [],
      config: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      impressions: 0,
      interactions: 0,
    };
    setWidgets(prev => [...prev, newWidget]);
    setSelectedWidget(newWidget);
    toast({ title: 'Widget created', description: 'Configure your new widget.' });
  };

  const channelLabels: Record<WidgetChannel, { label: string; icon: React.ElementType; description: string }> = {
    chat: { label: 'Text Chat', icon: MessageSquare, description: 'AI-powered text conversations' },
    video: { label: 'AI Video', icon: Video, description: 'Face-to-face AI video via Tavus' },
    voice: { label: 'Voice Call', icon: Phone, description: 'Browser-based voice via VAPI' },
    sms: { label: 'SMS / Text', icon: Send, description: 'Two-way SMS messaging' },
    callback: { label: 'Callback Form', icon: FileText, description: 'Request a callback form' },
  };

  const renderUniversalSettings = () => {
    const updateChannel = (channel: WidgetChannel, enabled: boolean) => {
      setUniversalSettings(prev => ({
        ...prev,
        enabledChannels: { ...prev.enabledChannels, [channel]: enabled },
      }));
    };

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-purple-500" />
              <div>
                <CardTitle className="text-sm">Universal Widget Settings</CardTitle>
                <CardDescription>Configure which channels are available across all widgets and the landing page</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enabled Channels</Label>
              <div className="space-y-3 mt-3">
                {(Object.keys(universalSettings.enabledChannels) as WidgetChannel[]).map((channel) => {
                  const info = channelLabels[channel];
                  const ChannelIcon = info.icon;
                  return (
                    <div key={channel} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          universalSettings.enabledChannels[channel] ? 'bg-purple-500/10' : 'bg-muted'
                        )}>
                          <ChannelIcon className={cn('h-4 w-4', universalSettings.enabledChannels[channel] ? 'text-purple-500' : 'text-muted-foreground')} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{info.label}</p>
                          <p className="text-xs text-muted-foreground">{info.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={universalSettings.enabledChannels[channel]}
                        onCheckedChange={(val) => updateChannel(channel, val)}
                        data-testid={`switch-channel-${channel}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Video Settings</Label>
              <div>
                <Label className="text-xs">Video Persona Name</Label>
                <Input
                  value={universalSettings.videoPersonaName}
                  onChange={(e) => setUniversalSettings(prev => ({ ...prev, videoPersonaName: e.target.value }))}
                  className="mt-1"
                  data-testid="input-video-persona-name"
                />
              </div>
              <div>
                <Label className="text-xs">Video Greeting Message</Label>
                <Textarea
                  value={universalSettings.videoPersonaGreeting}
                  onChange={(e) => setUniversalSettings(prev => ({ ...prev, videoPersonaGreeting: e.target.value }))}
                  className="mt-1 text-sm"
                  rows={2}
                  data-testid="input-video-greeting"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Auto-launch Video on Landing Page</Label>
                  <p className="text-[10px] text-muted-foreground">Automatically start video agent when visitor loads landing page</p>
                </div>
                <Switch
                  checked={universalSettings.videoAutoLaunch}
                  onCheckedChange={(val) => setUniversalSettings(prev => ({ ...prev, videoAutoLaunch: val }))}
                  data-testid="switch-video-auto-launch"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Default Channel</Label>
              <Select
                value={universalSettings.defaultChannel}
                onValueChange={(val) => setUniversalSettings(prev => ({ ...prev, defaultChannel: val as WidgetChannel }))}
              >
                <SelectTrigger data-testid="select-default-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(universalSettings.enabledChannels) as WidgetChannel[])
                    .filter(ch => universalSettings.enabledChannels[ch])
                    .map(ch => (
                      <SelectItem key={ch} value={ch}>{channelLabels[ch].label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => toast({ title: 'Universal settings saved', description: 'Channel configuration updated for all widgets.' })}
              data-testid="button-save-universal-settings"
            >
              Save Universal Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderWidgetTypeCards = () => {
    const filtered = widgets.filter(w =>
      w.name.toLowerCase().includes(widgetSearch.toLowerCase()) ||
      w.widgetCode.toLowerCase().includes(widgetSearch.toLowerCase())
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Button size="sm" onClick={handleCreateWidget} data-testid="button-new-widget">
            <Plus className="h-4 w-4 mr-1" />
            New widget
          </Button>
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search widgets..."
              className="pl-9"
              value={widgetSearch}
              onChange={(e) => setWidgetSearch(e.target.value)}
              data-testid="input-search-widgets"
            />
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Name</TableHead>
                <TableHead>Embed Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((widget) => {
                const Icon = widgetTypeIcons[widget.type];
                return (
                  <TableRow
                    key={widget.id}
                    className="cursor-pointer"
                    onClick={() => { setSelectedWidget(widget); setWidgetConfigTab('settings'); }}
                    data-testid={`widget-row-${widget.id}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{widget.name}</p>
                          <p className="text-xs text-muted-foreground">{widgetTypeConfig[widget.type].label}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{widget.widgetCode}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => { e.stopPropagation(); handleCopyEmbed(generateWidgetEmbedCode(widget)); }}
                          data-testid={`button-copy-code-${widget.id}`}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-white text-[10px] px-1.5', getWidgetStatusColor(widget.status))}>
                        {widget.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {new Date(widget.updatedAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewWidget(widget)}
                          data-testid={`button-test-page-${widget.id}`}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View test page
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`widget-menu-${widget.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedWidget(widget); setWidgetConfigTab('settings'); }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyEmbed(generateWidgetEmbedCode(widget))}>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy embed code
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => {
                              setWidgets(prev => prev.filter(w => w.id !== widget.id));
                              toast({ title: 'Widget deleted', description: 'The widget has been removed.' });
                            }}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">No widgets found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filtered.length} of {widgets.length} widgets</span>
        </div>
      </div>
    );
  };

  const renderWidgetSettingsTab = (widget: IndividualWidget) => {
    const updateConfig = (key: string, value: string) => {
      const updated = { ...widget, config: { ...widget.config, [key]: value } };
      setSelectedWidget(updated);
      setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
    };

    const configFields: { key: string; label: string; types: WidgetType[]; multiline?: boolean }[] = [
      { key: 'agentName', label: 'Agent Name', types: ['text', 'unified'] },
      { key: 'aiInstructions', label: 'AI Instructions', types: ['text', 'unified'], multiline: true },
      { key: 'tavusPersonaId', label: 'Tavus Persona ID', types: ['video', 'unified'] },
      { key: 'tavusPersonaName', label: 'Tavus Persona Name', types: ['video', 'unified'] },
      { key: 'vapiAssistantId', label: 'VAPI Assistant ID', types: ['voice', 'unified'] },
      { key: 'vapiPublicKey', label: 'VAPI Public Key', types: ['voice', 'unified'] },
      { key: 'phoneDisplay', label: 'Phone Display', types: ['voice', 'unified'] },
    ];

    const relevantFields = configFields.filter(f => f.types.includes(widget.type));

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Widget Configuration</CardTitle>
            <CardDescription>Type-specific settings for {widgetTypeConfig[widget.type].label}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {relevantFields.map((field) => (
              <div key={field.key}>
                <Label className="text-xs">{field.label}</Label>
                {field.multiline ? (
                  <Textarea
                    value={widget.config[field.key] || ''}
                    onChange={(e) => updateConfig(field.key, e.target.value)}
                    className="mt-1 text-sm"
                    rows={3}
                    data-testid={`input-config-${field.key}`}
                  />
                ) : (
                  <Input
                    value={widget.config[field.key] || ''}
                    onChange={(e) => updateConfig(field.key, e.target.value)}
                    className="mt-1"
                    data-testid={`input-config-${field.key}`}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        <Button
          onClick={() => toast({ title: 'Settings saved', description: 'Widget configuration updated.' })}
          data-testid="button-save-widget-settings"
        >
          Save Settings
        </Button>
      </div>
    );
  };

  const renderWidgetAppearanceTab = (widget: IndividualWidget) => {
    const updateAppearance = (key: keyof IndividualWidget['appearance'], value: string | boolean) => {
      const updated = { ...widget, appearance: { ...widget.appearance, [key]: value } };
      setSelectedWidget(updated);
      setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
    };

    return (
      <div className="space-y-4">
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
                      style={{ backgroundColor: widget.appearance[colorKey] }}
                    />
                    <Input
                      value={widget.appearance[colorKey]}
                      onChange={(e) => updateAppearance(colorKey, e.target.value)}
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
                value={widget.appearance.organizationName}
                onChange={(e) => updateAppearance('organizationName', e.target.value)}
                className="mt-1"
                data-testid="input-org-name"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Show Logo</Label>
                <p className="text-[10px] text-muted-foreground">Display organization logo in widget</p>
              </div>
              <Switch
                checked={widget.appearance.showLogo}
                onCheckedChange={(val) => updateAppearance('showLogo', val)}
                data-testid="switch-show-logo"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Widget Behavior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Position</Label>
              <Select
                value={widget.appearance.position}
                onValueChange={(val) => updateAppearance('position', val)}
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
                value={widget.appearance.animation}
                onValueChange={(val) => updateAppearance('animation', val)}
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
            <div>
              <Label className="text-xs">Button Label</Label>
              <Input
                value={widget.appearance.buttonLabel}
                onChange={(e) => updateAppearance('buttonLabel', e.target.value)}
                className="mt-1"
                data-testid="input-button-label"
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
                value={widget.appearance.welcomeHeading}
                onChange={(e) => updateAppearance('welcomeHeading', e.target.value)}
                className="mt-1"
                data-testid="input-welcome-heading"
              />
            </div>
            <div>
              <Label className="text-xs">Message</Label>
              <Textarea
                value={widget.appearance.welcomeMessage}
                onChange={(e) => updateAppearance('welcomeMessage', e.target.value)}
                className="mt-1 text-sm"
                rows={2}
                data-testid="input-welcome-message"
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
      </div>
    );
  };

  const renderWidgetTargetingTab = (widget: IndividualWidget) => {
    const updateTargeting = (key: keyof IndividualWidget['targeting'], value: string | boolean | number) => {
      const updated = { ...widget, targeting: { ...widget.targeting, [key]: value } };
      setSelectedWidget(updated);
      setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
    };

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Audience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Target Audience</Label>
              <Select
                value={widget.targeting.audience}
                onValueChange={(val) => updateTargeting('audience', val)}
              >
                <SelectTrigger className="mt-1" data-testid="select-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visitors</SelectItem>
                  <SelectItem value="leads">Leads Only</SelectItem>
                  <SelectItem value="returning">Returning Visitors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Page Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Include Pages</Label>
              <Input
                value={widget.targeting.includePages}
                onChange={(e) => updateTargeting('includePages', e.target.value)}
                placeholder="/*"
                className="mt-1"
                data-testid="input-include-pages"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Use glob patterns. e.g. /inventory/*, /contact</p>
            </div>
            <div>
              <Label className="text-xs">Exclude Pages</Label>
              <Input
                value={widget.targeting.excludePages}
                onChange={(e) => updateTargeting('excludePages', e.target.value)}
                placeholder="/admin/*"
                className="mt-1"
                data-testid="input-exclude-pages"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Devices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['desktop', 'mobile', 'tablet'] as const).map((device) => (
              <div key={device} className="flex items-center justify-between">
                <Label className="text-xs capitalize">{device}</Label>
                <Switch
                  checked={widget.targeting[device]}
                  onCheckedChange={(val) => updateTargeting(device, val)}
                  data-testid={`switch-device-${device}`}
                />
              </div>
            ))}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Business Hours Only</Label>
                <p className="text-[10px] text-muted-foreground">Only show during business hours</p>
              </div>
              <Switch
                checked={widget.targeting.businessHoursOnly}
                onCheckedChange={(val) => updateTargeting('businessHoursOnly', val)}
                data-testid="switch-business-hours"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Triggers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Delay (seconds)</Label>
              <Input
                type="number"
                value={widget.targeting.delaySeconds}
                onChange={(e) => updateTargeting('delaySeconds', parseInt(e.target.value) || 0)}
                className="mt-1"
                data-testid="input-delay-seconds"
              />
            </div>
            <div>
              <Label className="text-xs">Scroll Depth (%)</Label>
              <Input
                type="number"
                value={widget.targeting.scrollDepthPercent}
                onChange={(e) => updateTargeting('scrollDepthPercent', parseInt(e.target.value) || 0)}
                className="mt-1"
                data-testid="input-scroll-depth"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Exit Intent</Label>
                <p className="text-[10px] text-muted-foreground">Show when user moves to leave</p>
              </div>
              <Switch
                checked={widget.targeting.exitIntent}
                onCheckedChange={(val) => updateTargeting('exitIntent', val)}
                data-testid="switch-exit-intent"
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
      </div>
    );
  };

  const renderWidgetDomainsTab = (widget: IndividualWidget) => (
    <div className="space-y-4">
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
    </div>
  );

  const renderWidgetEmbedTab = (widget: IndividualWidget) => {
    const embedCode = generateWidgetEmbedCode(widget);
    return (
      <div className="space-y-4">
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
                {embedCode}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => handleCopyEmbed(embedCode)}
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
              <span className="text-muted-foreground">Type</span>
              <span className="text-xs">{widgetTypeConfig[widget.type].label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge className={cn('text-white text-xs', getWidgetStatusColor(widget.status))}>
                {widget.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Allowed Domains</span>
              <span>{widget.allowedDomains.length || 'All (testing)'}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderWidgetInlinePreview = (widget: IndividualWidget) => {
    const Icon = widgetTypeIcons[widget.type];
    return (
      <div className="sticky top-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-3">
              <div className="w-full max-w-[280px] rounded-2xl border border-border shadow-lg overflow-hidden bg-background" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
                <div
                  className="px-3 py-2.5 flex items-center justify-between rounded-t-2xl"
                  style={{ backgroundColor: widget.appearance.primaryColor }}
                >
                  <span className="text-white font-semibold text-xs">
                    {widget.appearance.organizationName || 'Your Business'}
                  </span>
                  <span className="text-white/70 text-xs">&times;</span>
                </div>
                <div className="p-3 text-center">
                  <p className="font-semibold text-foreground text-xs">{widget.appearance.welcomeHeading}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{widget.appearance.welcomeMessage}</p>
                </div>
                <div className="space-y-1.5 p-2">
                  <div className="bg-muted rounded-lg px-2.5 py-1.5 text-[10px] max-w-[80%]">
                    How can I help you today?
                  </div>
                  <div className="flex justify-end">
                    <div className="rounded-lg px-2.5 py-1.5 text-[10px] text-white max-w-[80%]" style={{ backgroundColor: widget.appearance.primaryColor }}>
                      I'm looking for an SUV
                    </div>
                  </div>
                </div>
                <div className="px-3 py-1.5 border-t border-border text-center">
                  <span className="text-[8px] text-muted-foreground">Powered by Nexxus</span>
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundColor: widget.appearance.primaryColor }}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
              <p className="text-[10px] text-muted-foreground">{widget.appearance.buttonLabel}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderWidgetDetail = (widget: IndividualWidget) => {
    const Icon = widgetTypeIcons[widget.type];
    const embedCode = generateWidgetEmbedCode(widget);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setSelectedWidget(null)} data-testid="button-back-widget-list">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex-1" />
          <Badge className={cn('text-white text-xs', getWidgetStatusColor(widget.status))}>
            {widget.status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopyEmbed(embedCode)}
            data-testid="button-copy-embed-top"
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copy embed code
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const newStatus = widget.status === 'active' ? 'inactive' : 'active';
              const updated = { ...widget, status: newStatus as IndividualWidget['status'] };
              setSelectedWidget(updated);
              setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
              toast({ title: `Widget ${newStatus}`, description: `Widget is now ${newStatus}.` });
            }}
            variant={widget.status === 'active' ? 'outline' : 'default'}
            data-testid="button-toggle-widget-status"
          >
            {widget.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-widget-more">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPreviewWidget(widget)}>
                <Eye className="h-4 w-4 mr-2" />
                Full Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open('/w/demo', '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View test page
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => {
                setWidgets(prev => prev.filter(w => w.id !== widget.id));
                setSelectedWidget(null);
                toast({ title: 'Widget deleted' });
              }}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete widget
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <Input
              value={widget.name}
              onChange={(e) => {
                const updated = { ...widget, name: e.target.value };
                setSelectedWidget(updated);
                setWidgets(prev => prev.map(w => w.id === updated.id ? updated : w));
              }}
              className="font-semibold border-none p-0 h-auto text-base focus-visible:ring-0 shadow-none"
              data-testid="input-widget-name"
            />
            <p className="text-xs text-muted-foreground">Code: {widget.widgetCode} · {widgetTypeConfig[widget.type].label}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Accordion type="multiple" defaultValue={['appearance', 'channels', 'targeting', 'embed']} className="space-y-2">
              <AccordionItem value="appearance" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-semibold" data-testid="accordion-appearance">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    Appearance
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {renderWidgetAppearanceTab(widget)}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="channels" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-semibold" data-testid="accordion-channels">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Channels & Configuration
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {renderWidgetSettingsTab(widget)}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="targeting" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-semibold" data-testid="accordion-targeting">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    Targeting & Domains
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {renderWidgetTargetingTab(widget)}
                  <Separator className="my-4" />
                  {renderWidgetDomainsTab(widget)}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="embed" className="border rounded-lg px-4">
                <AccordionTrigger className="text-sm font-semibold" data-testid="accordion-embed">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    Embed Code
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="relative">
                      <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-border">
                        {embedCode}
                      </pre>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => handleCopyEmbed(embedCode)}
                        data-testid="button-copy-code"
                      >
                        {copiedEmbed ? <><Check className="h-3.5 w-3.5 mr-1" /> Copied</> : <><Copy className="h-3.5 w-3.5 mr-1" /> Copy code</>}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('/w/demo', '_blank')}
                        data-testid="button-view-test-page"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        View test page
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast({ title: 'Instructions sent', description: 'Embed instructions sent to your developer.' })}
                        data-testid="button-send-instructions"
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        Send instructions
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="hidden lg:block">
            {renderWidgetInlinePreview(widget)}
          </div>
        </div>
      </div>
    );
  };

  const renderWidgetPreviewModal = () => {
    if (!previewWidget) return null;
    const widget = previewWidget;
    const Icon = widgetTypeIcons[widget.type];

    const renderPreviewContent = () => {
      switch (widget.type) {
        case 'text':
          return (
            <div className="space-y-2 p-3">
              <div className="bg-muted rounded-lg px-3 py-2 text-xs max-w-[80%]">
                {widget.appearance.welcomeMessage}
              </div>
              <div className="bg-muted rounded-lg px-3 py-2 text-xs max-w-[80%]">
                How can I help you find the right vehicle today?
              </div>
              <div className="flex justify-end">
                <div className="rounded-lg px-3 py-2 text-xs text-white max-w-[80%]" style={{ backgroundColor: widget.appearance.primaryColor }}>
                  I'm looking for an SUV under $40k
                </div>
              </div>
              <div className="bg-muted rounded-lg px-3 py-2 text-xs max-w-[80%]">
                Great choice! We have several options...
              </div>
            </div>
          );
        case 'video':
          return (
            <div className="p-4 flex flex-col items-center gap-3">
              <div className="w-full aspect-video rounded-lg bg-muted flex items-center justify-center border border-border">
                <Video className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <Button size="sm" style={{ backgroundColor: widget.appearance.primaryColor }} className="text-white" data-testid="preview-connect-video">
                <Video className="h-3.5 w-3.5 mr-1" />
                Connect Video
              </Button>
            </div>
          );
        case 'voice':
          return (
            <div className="p-6 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: widget.appearance.primaryColor + '20' }}>
                  <Mic className="h-8 w-8" style={{ color: widget.appearance.primaryColor }} />
                </div>
                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: widget.appearance.primaryColor }} />
              </div>
              <p className="text-xs text-muted-foreground">Tap to start voice call</p>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full"
                    style={{
                      backgroundColor: widget.appearance.primaryColor,
                      height: `${12 + Math.random() * 20}px`,
                      opacity: 0.4 + Math.random() * 0.6,
                    }}
                  />
                ))}
              </div>
            </div>
          );
        case 'unified':
          return (
            <div className="p-4 grid grid-cols-2 gap-2">
              {[
                { icon: MessageSquare, label: 'Text Chat' },
                { icon: Video, label: 'Video Call' },
                { icon: Mic, label: 'Voice Call' },
                { icon: LayoutGrid, label: 'More Options' },
              ].map((ch) => {
                const ChIcon = ch.icon;
                return (
                  <div
                    key={ch.label}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:border-primary/30 cursor-pointer"
                    data-testid={`preview-unified-${ch.label.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <ChIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{ch.label}</span>
                  </div>
                );
              })}
            </div>
          );
      }
    };

    return (
      <Dialog open={!!previewWidget} onOpenChange={(open) => { if (!open) setPreviewWidget(null); }}>
        <DialogContent className="max-w-md" data-testid="dialog-widget-preview">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {widgetTypeConfig[widget.type].label} Preview
            </DialogTitle>
            <DialogDescription className="sr-only">Preview of the {widgetTypeConfig[widget.type].label}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-[320px] rounded-2xl border border-border shadow-xl overflow-visible bg-background" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
              <div
                className="px-4 py-3 flex items-center justify-between rounded-t-2xl"
                style={{ backgroundColor: widget.appearance.primaryColor }}
              >
                <span className="text-white font-semibold text-sm">
                  {widget.appearance.organizationName || 'Your Business'}
                </span>
                <button className="text-white/70 text-sm">&times;</button>
              </div>
              <div className="p-4 text-center">
                <p className="font-semibold text-foreground text-sm">{widget.appearance.welcomeHeading}</p>
                <p className="text-xs text-muted-foreground mt-1">{widget.appearance.welcomeMessage}</p>
              </div>
              {renderPreviewContent()}
              <div className="px-4 py-2 border-t border-border text-center">
                <span className="text-[10px] text-muted-foreground">Powered by Nexxus</span>
              </div>
            </div>
            <div
              className="w-[48px] h-[48px] rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: widget.appearance.primaryColor }}
              data-testid="preview-widget-button"
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-[10px] text-muted-foreground">{widget.appearance.buttonLabel}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderLandingPageList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button size="sm" onClick={handleCreateLandingPage} data-testid="button-create-landing-page">
          <Plus className="h-4 w-4 mr-1" />
          Create Page
        </Button>
      </div>

      <div className="space-y-3">
        {landingPages.map((page) => {
          const linkedWidget = widgets.find(w => w.id === page.linkedWidgetId);
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{page.name}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {getLandingPageTypeLabel(page.type)}
                      </Badge>
                      <Badge className={cn('text-white text-[10px] px-1.5', page.status === 'active' ? 'bg-emerald-500' : page.status === 'inactive' ? 'bg-gray-400' : 'bg-amber-500')}>
                        {page.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="font-mono">/w/{page.slug}</span>
                      {linkedWidget && <span>via {linkedWidget.name}</span>}
                      <span>{page.views.toLocaleString()} views</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {page.name === 'Cage Automotive Connect' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open('/w/demo', '_blank')}
                        data-testid={`button-preview-page-${page.id}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Preview
                      </Button>
                    )}
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

  const renderLandingPageDetail = (page: LandingPage) => {
    const linkedWidget = widgets.find(w => w.id === page.linkedWidgetId);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
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
            {page.name === 'Cage Automotive Connect' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/w/demo', '_blank')}
                data-testid="button-preview-landing-detail"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Preview
              </Button>
            )}
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
                    value={page.linkedWidgetId}
                    onValueChange={(val) => {
                      const updated = { ...page, linkedWidgetId: val };
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
                    Configuration is inherited from the linked widget.
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
                      {linkedWidget?.appearance.organizationName || 'Your Business'}
                    </p>
                  </div>
                  <div
                    className="p-6 text-center"
                    style={{ backgroundColor: page.appearance.backgroundColor }}
                  >
                    <h3 className="font-bold text-foreground text-lg">{page.appearance.heading}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{page.appearance.subheading}</p>

                    {page.type === 'multi' && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {[
                          { icon: MessageSquare, label: 'Text Chat' },
                          { icon: Video, label: 'Video Call' },
                          { icon: Mic, label: 'Voice Call' },
                          { icon: LayoutGrid, label: 'More' },
                        ].map((ch) => {
                          const ChIcon = ch.icon;
                          return (
                            <div key={ch.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border bg-background">
                              <ChIcon className="h-5 w-5 text-muted-foreground" />
                              <span className="text-xs font-medium">{ch.label}</span>
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

  const renderToolCard = (tool: ToolCardData) => {
    const TIcon = tool.icon;
    return (
      <Card key={tool.id} className={cn('hover-elevate', tool.locked && 'opacity-60')} data-testid={`tool-card-${tool.id}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <TIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-foreground">{tool.friendlyName}</p>
                <Switch checked={tool.enabled} disabled={tool.locked} data-testid={`tool-switch-${tool.id}`} onCheckedChange={() => toast({ title: 'Demo mode', description: 'Tool toggling is not available in demo mode.' })} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
              {isSuperAdmin && (
                <p className="text-[10px] text-muted-foreground/70 font-mono mt-1">Technical: {tool.technicalName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={tool.enabled ? 'default' : 'secondary'} className="text-[10px]">
              {tool.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
            {tool.locked && <Badge variant="outline" className="text-[10px]">Locked</Badge>}
          </div>
          {isSuperAdmin && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground flex items-center gap-1">
                <ChevronDown className="h-3 w-3" /> Economy Settings
              </summary>
              <div className="mt-2 space-y-2 pl-4 border-l-2 border-border">
                <div className="flex items-center gap-2">
                  <Checkbox id={`economy-${tool.id}`} data-testid={`checkbox-economy-${tool.id}`} />
                  <Label htmlFor={`economy-${tool.id}`} className="text-xs">Add to billing economy</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-20">Base Rate:</Label>
                  <Input defaultValue="0.00" className="h-7 text-xs w-24" data-testid={`input-base-rate-${tool.id}`} />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-20">Markup Rate:</Label>
                  <Input defaultValue="0.00" className="h-7 text-xs w-24" data-testid={`input-markup-rate-${tool.id}`} />
                </div>
              </div>
            </details>
          )}
          <details className="text-xs opacity-50">
            <summary className="cursor-pointer text-muted-foreground flex items-center gap-1">
              <ChevronDown className="h-3 w-3" /> Tool Instructions
            </summary>
            <div className="mt-2 p-3 bg-muted/50 rounded-lg text-muted-foreground">
              Future: instructions for tool-database connections
            </div>
          </details>
        </CardContent>
      </Card>
    );
  };

  const renderToolsSection = () => {
    const apiTools = toolCards.filter(t => t.category === 'api');
    const otherTools = toolCards.filter(t => t.category === 'other');

    const currentTab = selectedWidget ? 'widgets' : selectedLandingPage ? 'landing-pages' : toolsTab;

    return (
      <div className="p-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => { setActiveSection(null); setSelectedWidget(null); setSelectedLandingPage(null); }} data-testid="button-back-settings">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <Tabs value={currentTab} onValueChange={(val) => { setToolsTab(val); setSelectedWidget(null); setSelectedLandingPage(null); }}>
          <TabsList className={cn('w-full max-w-3xl', isSuperAdmin ? 'grid grid-cols-8' : 'grid grid-cols-6')}>
            <TabsTrigger value="mcp" data-testid="tab-mcp">MCP</TabsTrigger>
            <TabsTrigger value="api" data-testid="tab-api-tools">API</TabsTrigger>
            <TabsTrigger value="other" data-testid="tab-other">Other</TabsTrigger>
            <TabsTrigger value="universal" data-testid="tab-universal">Universal</TabsTrigger>
            <TabsTrigger value="widgets" data-testid="tab-widgets">Widgets</TabsTrigger>
            <TabsTrigger value="landing-pages" data-testid="tab-landing-pages">Pages</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="api-keys" data-testid="tab-api-keys">API Keys</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="webhooks" data-testid="tab-webhooks">Webhooks</TabsTrigger>}
          </TabsList>

          <TabsContent value="mcp" className="mt-4">
            <Card>
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No MCP tools configured.</p>
                <p className="text-xs text-muted-foreground mt-1">MCP tools are added via backend configuration.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {apiTools.map(renderToolCard)}
            </div>
          </TabsContent>

          <TabsContent value="other" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherTools.map(renderToolCard)}
            </div>
          </TabsContent>

          <TabsContent value="universal" className="mt-4">
            {renderUniversalSettings()}
          </TabsContent>

          <TabsContent value="widgets" className="mt-4">
            {selectedWidget ? renderWidgetDetail(selectedWidget) : renderWidgetTypeCards()}
          </TabsContent>

          <TabsContent value="landing-pages" className="mt-4">
            {selectedLandingPage ? renderLandingPageDetail(selectedLandingPage) : renderLandingPageList()}
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="api-keys" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">API Keys</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">API Access</p>
                      <p className="text-xs text-muted-foreground">Enable REST API access for this org</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-api-access" />
                  </div>
                  <div>
                    <Label className="text-xs">API Key</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value="nxs_sk_••••••••••••4a2f" readOnly className="font-mono text-sm" data-testid="input-api-key" />
                      <Button variant="outline" size="sm" onClick={() => toast({ title: 'Key rotated', description: 'A new API key has been generated.' })} data-testid="button-rotate-key">
                        <KeyRound className="h-3.5 w-3.5 mr-1" />
                        Rotate
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Rate Limit (requests/hour)</Label>
                    <Input defaultValue="1000" type="number" className="mt-1 max-w-[200px]" data-testid="input-rate-limit" />
                  </div>
                  <Button onClick={() => toast({ title: 'API settings saved', description: 'API configuration updated.' })} data-testid="button-save-api-keys">
                    Save
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="webhooks" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Webhooks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">Webhook URL</Label>
                    <Input placeholder="https://your-server.com/webhook" className="mt-1" data-testid="input-webhook-url" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Events</Label>
                    {['Lead Created', 'Call Completed', 'Appointment Booked', 'Agent Status Change'].map((evt, i) => (
                      <div key={evt} className="flex items-center gap-2">
                        <Checkbox id={`webhook-evt-${i}`} defaultChecked data-testid={`checkbox-webhook-${evt.toLowerCase().replace(/\s/g, '-')}`} />
                        <Label htmlFor={`webhook-evt-${i}`} className="text-sm">{evt}</Label>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">Status</p>
                      <p className="text-xs text-muted-foreground">Active / Inactive</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-webhook-status" />
                  </div>
                  <Button onClick={() => toast({ title: 'Webhooks saved', description: 'Webhook configuration updated.' })} data-testid="button-save-webhooks">
                    Save
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  };

  const renderKnowledgeBase = () => (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} data-testid="button-back-settings">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      <Tabs defaultValue="documents">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="documents" data-testid="tab-kb-documents">Documents</TabsTrigger>
          <TabsTrigger value="web-pages" data-testid="tab-kb-web-pages">Web Pages</TabsTrigger>
          <TabsTrigger value="databases" data-testid="tab-kb-databases">Databases</TabsTrigger>
          <TabsTrigger value="kb-settings" data-testid="tab-kb-settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm">Documents</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search..." className="pl-8 h-8 w-40" data-testid="input-search-documents" />
                  </div>
                  <Button size="sm" onClick={() => toast({ title: 'Upload', description: 'Document upload is not available in demo mode.' })} data-testid="button-upload-document">
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Upload
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground text-xs">
                      <th className="text-left p-2 font-medium">Name</th>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-left p-2 font-medium">Size</th>
                      <th className="text-left p-2 font-medium">Date</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border" data-testid="doc-row-inventory">
                      <td className="p-2 font-medium text-foreground">Inventory</td>
                      <td className="p-2 text-muted-foreground">CSV</td>
                      <td className="p-2 text-muted-foreground">2 MB</td>
                      <td className="p-2 text-muted-foreground">2/20</td>
                      <td className="p-2"><Button variant="ghost" size="icon" onClick={() => toast({ title: 'Deleted', description: 'Document removed.' })} data-testid="button-delete-doc-inventory"><Trash2 className="h-3.5 w-3.5" /></Button></td>
                    </tr>
                    <tr className="border-t border-border" data-testid="doc-row-pricing">
                      <td className="p-2 font-medium text-foreground">Pricing</td>
                      <td className="p-2 text-muted-foreground">PDF</td>
                      <td className="p-2 text-muted-foreground">500 KB</td>
                      <td className="p-2 text-muted-foreground">2/18</td>
                      <td className="p-2"><Button variant="ghost" size="icon" onClick={() => toast({ title: 'Deleted', description: 'Document removed.' })} data-testid="button-delete-doc-pricing"><Trash2 className="h-3.5 w-3.5" /></Button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="web-pages" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm">Web Pages</CardTitle>
                <Button size="sm" onClick={() => toast({ title: 'Add URL', description: 'URL addition is not available in demo mode.' })} data-testid="button-add-url">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add URL
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground text-xs">
                      <th className="text-left p-2 font-medium">URL</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Last Crawled</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border" data-testid="web-row-dealer">
                      <td className="p-2 font-mono text-xs text-foreground">dealer.com/inv</td>
                      <td className="p-2"><Badge variant="secondary" className="text-[10px]">Indexed</Badge></td>
                      <td className="p-2 text-muted-foreground">2/20</td>
                      <td className="p-2"><Button variant="ghost" size="icon" onClick={() => toast({ title: 'Deleted', description: 'URL removed.' })} data-testid="button-delete-url-dealer"><Trash2 className="h-3.5 w-3.5" /></Button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="databases" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center opacity-50">
              <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Database Connections</p>
              <p className="text-xs text-muted-foreground mt-1">Future: connect external databases</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kb-settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Knowledge Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><div><p className="font-medium text-sm text-foreground">Auto-Index Files</p><p className="text-xs text-muted-foreground">Automatically index uploaded documents</p></div><Switch defaultChecked data-testid="switch-auto-index" /></div>
              <div className="flex items-center justify-between"><div><p className="font-medium text-sm text-foreground">Enable Web Scraping</p><p className="text-xs text-muted-foreground">Allow AI to learn from linked web pages</p></div><Switch data-testid="switch-web-scraping" /></div>
              <div className="flex items-center justify-between gap-4"><div className="flex-1"><p className="font-medium text-sm text-foreground">Document Retention</p><p className="text-xs text-muted-foreground">Days to keep processed documents</p></div><Input defaultValue="90" className="max-w-[100px]" data-testid="input-doc-retention" /></div>
              <div className="flex items-center justify-between"><div><p className="font-medium text-sm text-foreground">Smart Summarization</p><p className="text-xs text-muted-foreground">Auto-generate summaries for uploaded docs</p></div><Switch defaultChecked data-testid="switch-smart-summarization" /></div>
              <div className="flex items-center justify-between opacity-50"><div><p className="font-medium text-sm text-foreground">Learning Mode</p><p className="text-xs text-muted-foreground">Allow AI to learn from corrections</p></div><Switch checked disabled data-testid="switch-learning-mode" /></div>
              <Button onClick={() => toast({ title: 'Settings saved', description: 'Knowledge base settings updated.' })} data-testid="button-save-kb-settings">Save</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderAIConfiguration = () => {
    const filteredSkills = skillFilter === 'All' ? mockSkills : mockSkills.filter(s => s.category === skillFilter);

    return (
      <div className="p-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => { setActiveSection(null); setSelectedSkill(null); }} data-testid="button-back-settings">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Tabs defaultValue="system-prompt">
          <TabsList className={cn('w-full max-w-lg', isSuperAdmin ? 'grid grid-cols-4' : isPartnerAdmin ? 'grid grid-cols-3' : 'grid grid-cols-4')}>
            <TabsTrigger value="system-prompt" data-testid="tab-system-prompt">System Prompt</TabsTrigger>
            <TabsTrigger value="agent-behavior" data-testid="tab-agent-behavior">Agent Behavior</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="skills" data-testid="tab-skills">Skills</TabsTrigger>}
            <TabsTrigger value="hunches" data-testid="tab-hunches">Hunches</TabsTrigger>
          </TabsList>

          <TabsContent value="system-prompt" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">System Prompt</CardTitle>
                {isReadOnlyAI && <CardDescription className="text-xs">Read-only view</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">System Prompt</Label>
                  <Textarea rows={6} defaultValue="You are Automa, an AI assistant for automotive dealerships..." disabled={isReadOnlyAI} className="mt-1" data-testid="textarea-system-prompt" />
                </div>
                <div>
                  <Label className="text-xs">System Information</Label>
                  <Textarea rows={3} defaultValue="" disabled={isReadOnlyAI} className="mt-1" data-testid="textarea-system-info" />
                </div>
                <div>
                  <Label className="text-xs">Rules & Exclusions</Label>
                  <Textarea rows={3} defaultValue="" disabled={isReadOnlyAI} className="mt-1" data-testid="textarea-rules-exclusions" />
                </div>
                {!isReadOnlyAI && <Button onClick={() => toast({ title: 'Saved', description: 'System prompt updated.' })} data-testid="button-save-system-prompt">Save</Button>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agent-behavior" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Agent Behavior</CardTitle>
                {isReadOnlyAI && <CardDescription className="text-xs">Read-only view</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Overall Behavior Context</Label>
                  <Textarea rows={5} defaultValue="Instructions for what agents are allowed to do and how they behave..." disabled={isReadOnlyAI} className="mt-1" data-testid="textarea-behavior-context" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Allowed Actions</Label>
                  {[
                    { label: 'Initiate outbound calls', checked: true },
                    { label: 'Send SMS messages', checked: true },
                    { label: 'Create leads in CRM', checked: true },
                    { label: 'Schedule appointments', checked: true },
                    { label: 'Access financial data', checked: false },
                    { label: 'Modify customer records', checked: false },
                  ].map((action, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Checkbox defaultChecked={action.checked} disabled={isReadOnlyAI} id={`action-${i}`} data-testid={`checkbox-action-${action.label.toLowerCase().replace(/\s/g, '-')}`} />
                      <Label htmlFor={`action-${i}`} className="text-sm">{action.label}</Label>
                    </div>
                  ))}
                </div>
                {!isReadOnlyAI && <Button onClick={() => toast({ title: 'Saved', description: 'Agent behavior updated.' })} data-testid="button-save-agent-behavior">Save</Button>}
              </CardContent>
            </Card>
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="skills" className="mt-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search skills..." className="pl-8" data-testid="input-search-skills" />
                </div>
                <Button size="sm" onClick={() => setSelectedSkill({ id: '', name: '', category: 'General', description: '', prompt: '', temperature: 0.5, enabled: true })} data-testid="button-new-skill">
                  <Plus className="h-4 w-4 mr-1" />
                  New Skill
                </Button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {['All', 'Sales', 'Finance', 'Operations', 'General'].map(cat => (
                  <Button key={cat} variant={skillFilter === cat ? 'default' : 'outline'} size="sm" onClick={() => setSkillFilter(cat)} data-testid={`filter-skill-${cat.toLowerCase()}`}>
                    {cat}
                  </Button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                      <div className="divide-y divide-border">
                        {filteredSkills.map(skill => (
                          <div
                            key={skill.id}
                            className={cn('p-3 cursor-pointer hover-elevate', selectedSkill?.id === skill.id && 'bg-muted/50')}
                            onClick={() => setSelectedSkill(skill)}
                            data-testid={`skill-item-${skill.id}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm text-foreground">{skill.name}</p>
                              <Badge variant="outline" className="text-[10px]">{skill.category}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {selectedSkill && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{selectedSkill.id ? 'Edit Skill' : 'New Skill'}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs">Name</Label>
                        <Input defaultValue={selectedSkill.name} className="mt-1" data-testid="input-skill-name" />
                      </div>
                      <div>
                        <Label className="text-xs">Category</Label>
                        <Select defaultValue={selectedSkill.category}>
                          <SelectTrigger className="mt-1" data-testid="select-skill-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="Finance">Finance</SelectItem>
                            <SelectItem value="Operations">Operations</SelectItem>
                            <SelectItem value="General">General</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input defaultValue={selectedSkill.description} className="mt-1" data-testid="input-skill-description" />
                      </div>
                      <div>
                        <Label className="text-xs">Skill Prompt</Label>
                        <Textarea defaultValue={selectedSkill.prompt} rows={4} className="mt-1" data-testid="textarea-skill-prompt" />
                      </div>
                      <div>
                        <Label className="text-xs">Temperature: {selectedSkill.temperature}</Label>
                        <Slider defaultValue={[selectedSkill.temperature * 100]} max={100} step={5} className="mt-2" data-testid="slider-skill-temperature" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">System-Wide Status</Label>
                        <Switch defaultChecked={selectedSkill.enabled} data-testid="switch-skill-status" />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button size="sm" onClick={() => toast({ title: 'Skill saved', description: 'Skill configuration updated.' })} data-testid="button-save-skill">Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedSkill(null)} data-testid="button-cancel-skill">Cancel</Button>
                        {selectedSkill.id && <Button size="sm" variant="destructive" onClick={() => { setSelectedSkill(null); toast({ title: 'Skill deleted', description: 'Skill has been removed.' }); }} data-testid="button-delete-skill">Delete</Button>}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Card className="border-destructive">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Emergency Controls
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={() => setShowKillConfirm(true)} data-testid="button-kill-switch">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    DISABLE ALL AGENTS
                  </Button>
                </CardContent>
              </Card>

              <Dialog open={showKillConfirm} onOpenChange={setShowKillConfirm}>
                <DialogContent data-testid="dialog-kill-confirm">
                  <DialogHeader>
                    <DialogTitle className="text-destructive">Confirm: Disable All Agents</DialogTitle>
                    <DialogDescription>This will immediately disable all active agents across all organizations. This action can be reversed but may disrupt service.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowKillConfirm(false)} data-testid="button-cancel-kill">Cancel</Button>
                    <Button variant="destructive" onClick={() => { setShowKillConfirm(false); toast({ title: 'All agents disabled', description: 'Emergency kill switch activated.' }); }} data-testid="button-confirm-kill">Confirm Disable</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
          )}

          <TabsContent value="hunches" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Hunches Configuration</CardTitle>
                {isReadOnlyAI && <CardDescription className="text-xs">Read-only view</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><div><p className="font-medium text-sm text-foreground">Enable Hunches</p><p className="text-xs text-muted-foreground">AI-generated business intelligence insights</p></div><Switch defaultChecked disabled={isReadOnlyAI} data-testid="switch-enable-hunches" /></div>
                <div className="flex items-center justify-between opacity-50"><div><p className="font-medium text-sm text-foreground">Auto-Scoring</p><p className="text-xs text-muted-foreground">Automatically score and prioritize leads</p></div><Switch checked disabled data-testid="switch-auto-scoring" /></div>
                <div className="flex items-center justify-between gap-4 opacity-50"><div className="flex-1"><p className="font-medium text-sm text-foreground">Confidence Threshold</p><p className="text-xs text-muted-foreground">Minimum confidence for AI suggestions (%)</p></div><Input value="70" disabled className="max-w-[80px]" data-testid="input-confidence-threshold" /></div>
                <div className="flex items-center justify-between gap-4 opacity-50"><div className="flex-1"><p className="font-medium text-sm text-foreground">Temperature per Org</p><p className="text-xs text-muted-foreground">AI randomness setting</p></div><Input value="0.5" disabled className="max-w-[80px]" data-testid="input-temperature-org" /></div>
                <div className="flex items-center justify-between"><div><p className="font-medium text-sm text-foreground">Daily Digest</p><p className="text-xs text-muted-foreground">Send daily AI insights summary via email</p></div><Switch disabled={isReadOnlyAI} data-testid="switch-daily-digest" /></div>
                <div>
                  <Label className="text-xs">Recipients</Label>
                  <Input defaultValue="" placeholder="email1@example.com, email2@example.com" disabled={isReadOnlyAI} className="mt-1" data-testid="input-digest-recipients" />
                </div>
                {!isReadOnlyAI && <Button onClick={() => toast({ title: 'Saved', description: 'Hunches configuration updated.' })} data-testid="button-save-hunches">Save</Button>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const renderSecurity = () => (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} data-testid="button-back-settings">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security Settings</CardTitle>
          <CardDescription>Authentication, SSO, and access policies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between opacity-50"><div><p className="font-medium text-sm text-foreground">Two-Factor Authentication</p><p className="text-xs text-muted-foreground">Require 2FA for all users</p></div><Switch checked disabled data-testid="switch-2fa" /></div>
          <div className="flex items-center justify-between gap-4 opacity-50"><div className="flex-1"><p className="font-medium text-sm text-foreground">SSO Provider</p><p className="text-xs text-muted-foreground">Single sign-on provider</p></div><Switch checked disabled data-testid="switch-sso" /></div>
          <div className="flex items-center justify-between gap-4 opacity-50"><div className="flex-1"><p className="font-medium text-sm text-foreground">Session Timeout</p><p className="text-xs text-muted-foreground">Minutes before auto-logout</p></div><Input value="60" disabled className="max-w-[80px]" data-testid="input-session-timeout" /></div>
          <div className="flex items-center justify-between opacity-50"><div><p className="font-medium text-sm text-foreground">IP Allowlist</p><p className="text-xs text-muted-foreground">Restrict access to specific IP ranges</p></div><Switch checked disabled data-testid="switch-ip-allowlist" /></div>
          <div className="flex items-center justify-between opacity-50"><div><p className="font-medium text-sm text-foreground">Audit Logging</p><p className="text-xs text-muted-foreground">Log all user actions for compliance</p></div><Switch checked disabled data-testid="switch-audit-logging" /></div>
          <Separator />
          <div>
            <p className="font-medium text-sm text-foreground mb-2">Password Management</p>
            <Button variant="outline" onClick={() => toast({ title: 'Password reset', description: 'Password reset email sent.' })} data-testid="button-reset-password">
              <Lock className="h-3.5 w-3.5 mr-1" />
              Reset Password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotifications = () => (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} data-testid="button-back-settings">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Settings</CardTitle>
          <CardDescription>Configure alert preferences and delivery channels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Global Settings</p>
          <div className="flex items-center justify-between"><div><p className="font-medium text-sm text-foreground">Email Notifications</p><p className="text-xs text-muted-foreground">Receive alerts via email</p></div><Switch defaultChecked data-testid="switch-email-notifications" /></div>
          <div className="flex items-center justify-between"><div><p className="font-medium text-sm text-foreground">SMS Notifications</p><p className="text-xs text-muted-foreground">Receive alerts via SMS</p></div><Switch data-testid="switch-sms-notifications" /></div>
          <div className="flex items-center justify-between"><div><p className="font-medium text-sm text-foreground">Push Notifications</p><p className="text-xs text-muted-foreground">Browser push notifications</p></div><Switch defaultChecked data-testid="switch-push-notifications" /></div>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <Label className="text-xs">Quiet Hours Start</Label>
              <Input defaultValue="22:00" className="mt-1 w-28" data-testid="input-quiet-start" />
            </div>
            <div>
              <Label className="text-xs">Quiet Hours End</Label>
              <Input defaultValue="07:00" className="mt-1 w-28" data-testid="input-quiet-end" />
            </div>
          </div>
          <Separator />
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Per-Event Preferences</p>
          {[
            { label: 'New Lead', desc: 'When a new lead is created' },
            { label: 'Appointment Booked', desc: 'When an appointment is scheduled' },
            { label: 'Agent Alert', desc: 'When an agent needs attention' },
            { label: 'Task Due', desc: 'When a task is approaching deadline' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 py-1">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked data-testid={`switch-notification-${item.label.toLowerCase().replace(/\s/g, '-')}`} />
            </div>
          ))}
          <Button onClick={() => toast({ title: 'Settings saved', description: 'Notification preferences updated.' })} data-testid="button-save-notifications">Save</Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderDataManagement = () => {
    const mockUploads = [
      { id: 'u1', name: 'Jan Inventory', type: 'CSV', records: 1247, date: '1/15', category: 'Inventory', mapping: 'VIN -> vehicle_vin, Make -> make, Model -> model', interpretation: 'Vehicle inventory data with 1,247 active listings', prompt: 'Import as structured inventory data' },
      { id: 'u2', name: 'Website Scrape', type: 'HTML', records: 342, date: '2/01', category: 'Other', mapping: 'URL -> source_url, Content -> body_text', interpretation: 'Web content scraped from dealer website', prompt: 'Extract product and pricing information' },
    ];

    return (
      <div className="p-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} data-testid="button-back-settings">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <Tabs defaultValue="uploads">
          <TabsList className="grid grid-cols-2 w-full max-w-sm">
            <TabsTrigger value="uploads" data-testid="tab-data-uploads">Database Uploads</TabsTrigger>
            <TabsTrigger value="health" data-testid="tab-data-health">Data Health</TabsTrigger>
          </TabsList>

          <TabsContent value="uploads" className="mt-4 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {['All', 'Inventory', 'Leads', 'Contacts', 'Other'].map(cat => (
                <Button key={cat} variant="outline" size="sm" data-testid={`filter-data-${cat.toLowerCase()}`}>{cat}</Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setShowUploadDialog(true)} data-testid="button-upload-data">
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload Data
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast({ title: 'Scrape URL', description: 'URL scraping is not available in demo mode.' })} data-testid="button-scrape-url">
                <Globe className="h-3.5 w-3.5 mr-1" />
                Scrape URL
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground text-xs">
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Type</th>
                        <th className="text-left p-2 font-medium">Records</th>
                        <th className="text-left p-2 font-medium">Date</th>
                        <th className="p-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockUploads.map(upload => (
                        <>
                          <tr key={upload.id} className="border-t border-border cursor-pointer hover-elevate" onClick={() => setExpandedUpload(expandedUpload === upload.id ? null : upload.id)} data-testid={`upload-row-${upload.id}`}>
                            <td className="p-2 font-medium text-foreground">{upload.name}</td>
                            <td className="p-2 text-muted-foreground">{upload.type}</td>
                            <td className="p-2 text-muted-foreground">{upload.records.toLocaleString()}</td>
                            <td className="p-2 text-muted-foreground">{upload.date}</td>
                            <td className="p-2"><Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toast({ title: 'Deleted', description: 'Upload removed.' }); }} data-testid={`button-delete-upload-${upload.id}`}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                          </tr>
                          {expandedUpload === upload.id && (
                            <tr key={`${upload.id}-detail`} className="border-t border-border bg-muted/30">
                              <td colSpan={5} className="p-3 text-xs space-y-2">
                                <div><span className="font-medium text-foreground">Field Mapping:</span> <span className="text-muted-foreground font-mono">{upload.mapping}</span></div>
                                <div><span className="font-medium text-foreground">Interpretation:</span> <span className="text-muted-foreground">{upload.interpretation}</span></div>
                                <div><span className="font-medium text-foreground">Processing Prompt:</span> <span className="text-muted-foreground">{upload.prompt}</span></div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between opacity-50">
              <div><p className="font-medium text-sm text-foreground">SOC2/Compliance</p><p className="text-xs text-muted-foreground">Data compliance checks enabled</p></div>
              <Switch checked disabled data-testid="switch-soc2" />
            </div>

            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogContent data-testid="dialog-upload-data">
                <DialogHeader>
                  <DialogTitle>Upload Data</DialogTitle>
                  <DialogDescription>Upload a file for processing and import</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Select defaultValue="inventory">
                      <SelectTrigger className="mt-1" data-testid="select-upload-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inventory">Inventory</SelectItem>
                        <SelectItem value="leads">Leads</SelectItem>
                        <SelectItem value="contacts">Contacts</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <FileUp className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">CSV, JSON, Excel, PDF</p>
                  </div>
                  <div>
                    <Label className="text-xs">Processing Instructions</Label>
                    <Textarea rows={2} placeholder="Describe how this data should be processed..." className="mt-1" data-testid="textarea-processing-instructions" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Label className="text-xs">Data Type:</Label>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="dataType" value="structured" defaultChecked id="dt-structured" data-testid="radio-structured" />
                      <Label htmlFor="dt-structured" className="text-xs">Structured</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="dataType" value="unstructured" id="dt-unstructured" data-testid="radio-unstructured" />
                      <Label htmlFor="dt-unstructured" className="text-xs">Unstructured</Label>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => { setShowUploadDialog(false); toast({ title: 'Processing', description: 'Data upload started. Processing will complete shortly.' }); }} data-testid="button-upload-process">
                    <Upload className="h-4 w-4 mr-1" />
                    Upload & Process
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="health" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">14,892</p><p className="text-xs text-muted-foreground">Total Records</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">2.3 GB</p><p className="text-xs text-muted-foreground">Storage Used</p></CardContent></Card>
              <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">8</p><p className="text-xs text-muted-foreground">Active Uploads</p></CardContent></Card>
            </div>
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between opacity-50"><div><p className="font-medium text-sm text-foreground">Auto-Backup</p><p className="text-xs text-muted-foreground">Daily automatic data backups</p></div><Switch checked disabled data-testid="switch-auto-backup" /></div>
                <div className="flex items-center justify-between gap-4 opacity-50"><div className="flex-1"><p className="font-medium text-sm text-foreground">Data Retention</p><p className="text-xs text-muted-foreground">Months to retain closed records</p></div><Input value="24" disabled className="max-w-[80px]" data-testid="input-data-retention" /></div>
                <div className="flex items-center justify-between gap-4 opacity-50"><div className="flex-1"><p className="font-medium text-sm text-foreground">Export Format</p><p className="text-xs text-muted-foreground">Default export file format</p></div><Input value="CSV" disabled className="max-w-[80px]" data-testid="input-export-format" /></div>
                <div className="flex items-center justify-between opacity-50"><div><p className="font-medium text-sm text-foreground">GDPR Compliance</p><p className="text-xs text-muted-foreground">GDPR data handling rules</p></div><Switch checked disabled data-testid="switch-gdpr" /></div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const renderAppearance = () => (
    <div className="p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} data-testid="button-back-settings">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Theme, layout, and display preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">These settings apply to all users in this organization.</p>
          <div className="flex items-center justify-between"><div><p className="font-medium text-sm text-foreground">Compact Mode</p><p className="text-xs text-muted-foreground">Use smaller spacing and fonts</p></div><Switch data-testid="switch-compact-mode" /></div>
          <div className="flex items-center justify-between"><div><p className="font-medium text-sm text-foreground">Animations</p><p className="text-xs text-muted-foreground">Enable UI animations and transitions</p></div><Switch defaultChecked data-testid="switch-animations" /></div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">Default View</p>
              <p className="text-xs text-muted-foreground">Default page on login</p>
            </div>
            <Select defaultValue="dashboard">
              <SelectTrigger className="w-40" data-testid="select-default-view">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="work-center">Hub</SelectItem>
                <SelectItem value="insights">Insights</SelectItem>
                <SelectItem value="agents">Agents</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between"><div><p className="font-medium text-sm text-foreground">Show Metric Tiles</p><p className="text-xs text-muted-foreground">Display KPI tiles on home page</p></div><Switch defaultChecked data-testid="switch-metric-tiles" /></div>
          <Button onClick={() => toast({ title: 'Settings saved', description: 'Appearance preferences updated.' })} data-testid="button-save-appearance-settings">Save</Button>
        </CardContent>
      </Card>
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

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'users': return renderUserManagement();
      case 'tools': return renderToolsSection();
      case 'organization': return (
        <div className="p-4 space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setActiveSection(null)} data-testid="button-back-settings">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization Settings</CardTitle>
              <CardDescription>Manage your company profile and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 py-1">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">Organization Name</p>
                  <p className="text-xs text-muted-foreground">Your company display name</p>
                </div>
                <Input defaultValue="Cage Automotive" className="max-w-[200px]" data-testid="input-org-name" />
              </div>
              <div className="flex items-center justify-between gap-4 py-1">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">AI Persona Name</p>
                  <p className="text-xs text-muted-foreground">The name your AI assistant presents to customers</p>
                </div>
                <Input defaultValue={personaName} className="max-w-[200px]" data-testid="input-persona-name" />
              </div>
              <div className="flex items-center justify-between gap-4 py-1">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">Business Phone</p>
                  <p className="text-xs text-muted-foreground">Primary contact number</p>
                </div>
                <Input defaultValue="(555) 123-4567" className="max-w-[200px]" data-testid="input-org-phone" />
              </div>
              <div className="flex items-center justify-between gap-4 py-1">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">Business Email</p>
                  <p className="text-xs text-muted-foreground">Primary contact email</p>
                </div>
                <Input defaultValue="info@cageautomotive.com" className="max-w-[200px]" data-testid="input-org-email" />
              </div>
              <div className="flex items-center justify-between gap-4 py-1">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">Public Listing</p>
                  <p className="text-xs text-muted-foreground">Show in partner directory</p>
                </div>
                <Switch defaultChecked data-testid="switch-public-listing" />
              </div>
              <div className="pt-2">
                <Button size="sm" onClick={() => toast({ title: 'Settings saved', description: 'Your changes have been applied.' })} data-testid="button-save-org">Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card className={cn('border-2', communicationGateEnabled ? 'border-green-500/30' : 'border-red-500/30')}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                {communicationGateEnabled ? (
                  <Power className="h-5 w-5 text-green-500" />
                ) : (
                  <PowerOff className="h-5 w-5 text-red-500" />
                )}
                <CardTitle className="text-base">Communication Gate</CardTitle>
              </div>
              <CardDescription>
                Master switch that controls ALL outbound automated communications (SMS, Email, Campaigns).
                Disable this to immediately halt all AI-initiated messages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {communicationGateEnabled ? 'Communications Active' : 'Communications Paused'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {communicationGateEnabled
                      ? 'All outbound automated communications are enabled'
                      : 'All outbound automated communications are stopped'}
                  </p>
                </div>
                <Switch
                  checked={communicationGateEnabled}
                  onCheckedChange={setCommunicationGateEnabled}
                  className={cn(
                    communicationGateEnabled
                      ? 'data-[state=checked]:bg-green-500'
                      : 'data-[state=unchecked]:bg-red-500'
                  )}
                  data-testid="switch-communication-gate"
                />
              </div>
              {!communicationGateEnabled && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 dark:text-red-300">
                      All automated communications are currently stopped. No campaigns, follow-ups, or AI-initiated messages will be sent until this gate is re-enabled.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
      case 'knowledge': return renderKnowledgeBase();
      case 'ai': return renderAIConfiguration();
      case 'security': return renderSecurity();
      case 'notifications': return renderNotifications();
      case 'data': return renderDataManagement();
      case 'appearance': return renderAppearance();
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

      {renderWidgetPreviewModal()}
    </div>
  );
}
