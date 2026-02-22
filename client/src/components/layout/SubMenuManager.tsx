import { useRef, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Bot, Plus, Search, Folder, Star, Users, Clock, FileBox, BarChart3, Target, PieChart,
  Calendar as CalendarIcon, CheckSquare, Lightbulb, Activity, User as UserIcon,
  Server, Settings, Wrench, BookOpen, Zap, CreditCard, ChevronLeft, Upload, MessageSquare, Layout,
  MoreVertical, Play, Trash2, Building2, Lock, Bell, Database, Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useApp } from '@/contexts/AppContext';
import { getAgentStatusColor, type Agent } from '@/mocks/agents';
import { mockActivityFeed } from '@/mocks/activity';
import { mockConversations } from '@/mocks/messages';
import { formatDistanceToNow } from 'date-fns';

export function SubMenuManager() {
  const [location, setLocation] = useLocation();
  const { 
    activePanel, 
    subMenuExpanded, 
    setActivePanel, 
    setSubMenuExpanded,
    setPanelHovered,
    agents,
    currentUser,
    currentRole,
    selectedAgent,
    setSelectedAgent,
    favorites
  } = useApp();
  
  const panelLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [agentSearch, setAgentSearch] = useState('');
  const [activeInsightsTab, setActiveInsightsTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'dashboard';
  });
  const [activeHubTab, setActiveHubTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'calendar';
  });

  // Sync active tabs from URL on location change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (location.startsWith('/insights') && tab) setActiveInsightsTab(tab);
    if (location.startsWith('/work-center') && tab) setActiveHubTab(tab);
  }, [location]);
  
  // Responsive: collapse sub-menu when window is resized smaller
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && subMenuExpanded) {
        setSubMenuExpanded(false);
        setActivePanel(null);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [subMenuExpanded, setSubMenuExpanded, setActivePanel]);

  useEffect(() => {
    return () => {
      if (panelLeaveTimeoutRef.current) {
        clearTimeout(panelLeaveTimeoutRef.current);
      }
    };
  }, []);
  
  const isVisible = activePanel !== null || subMenuExpanded;

  const handleCollapsePanel = () => {
    setSubMenuExpanded(false);
    setActivePanel(null);
  };

  const handlePanelMouseEnter = () => {
    if (panelLeaveTimeoutRef.current) {
      clearTimeout(panelLeaveTimeoutRef.current);
      panelLeaveTimeoutRef.current = null;
    }
    setPanelHovered(true);
  };

  const handlePanelMouseLeave = (e: React.MouseEvent) => {
    // Check if we're actually leaving the panel (not entering a child)
    const relatedTarget = e.relatedTarget;
    const panel = e.currentTarget as HTMLElement;
    
    // If we're moving to an element inside the panel, don't hide
    // Check that relatedTarget is a Node before calling contains
    if (relatedTarget && relatedTarget instanceof Node && panel.contains(relatedTarget)) {
      return;
    }
    
    setPanelHovered(false);
    if (!subMenuExpanded) {
      panelLeaveTimeoutRef.current = setTimeout(() => {
        setActivePanel(null);
      }, 800);
    }
  };

  const getCurrentPanelId = () => {
    if (activePanel) return activePanel;
    if (location === '/') return 'main';
    if (location.startsWith('/agents')) return 'agents';
    if (location.startsWith('/drive')) return 'drive';
    if (location.startsWith('/insights')) return 'insights';
    if (location.startsWith('/activity')) return 'insights';
    if (location.startsWith('/work-center')) return 'work-center';
    if (location.startsWith('/settings')) return 'system';
    if (location.startsWith('/profile')) return 'profile';
    return null;
  };

  const panelId = getCurrentPanelId();
  const userInitials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();

  if (!isVisible || !panelId) {
    return null;
  }

  const renderPanelContent = () => {
    switch (panelId) {
      case 'main':
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Star className="h-4 w-4 text-amber-500" />
                  Favorites
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-main-panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {favorites.length > 0 ? (
              <div className="p-2 flex flex-col gap-0.5">
                {favorites.map((fav) => (
                  <button
                    key={fav.id}
                    onClick={() => setLocation(fav.path)}
                    className="w-full text-left p-2 rounded-md transition-colors hover-elevate flex items-center gap-2"
                    data-testid={`panel-favorite-${fav.id}`}
                  >
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">{fav.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground px-3 py-2">
                Star pages to access them quickly
              </p>
            )}
            <div className="border-t border-border">
              <div className="p-3 border-b border-border">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Message History
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 flex flex-col gap-0.5">
                  {mockConversations.map((conv) => (
                    <div
                      key={conv.id}
                      role="button"
                      tabIndex={0}
                      className="group relative w-full text-left p-2 rounded-md transition-colors hover-elevate cursor-pointer"
                      onClick={() => {
                        if (!location.startsWith('/')) setLocation('/');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (!location.startsWith('/')) setLocation('/');
                        }
                      }}
                      data-testid={`panel-conversation-${conv.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-foreground truncate flex-1">{conv.title}</p>
                        <div className="flex items-center gap-1">
                          {conv.unread && (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`button-conv-menu-${conv.id}`}
                              >
                                <MoreVertical className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="bottom" className="w-36">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation('/'); }} data-testid={`menu-resume-${conv.id}`}>
                                <Play className="h-3.5 w-3.5 mr-2" />
                                Resume
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={(e) => e.stopPropagation()} data-testid={`menu-delete-${conv.id}`}>
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {formatDistanceToNow(new Date(conv.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        );

      case 'agents': {
        const filteredAgents = agents.filter(a => a.name.toLowerCase() !== 'automa');
        const searchedAgents = agentSearch.trim()
          ? filteredAgents.filter(a => a.name.toLowerCase().includes(agentSearch.toLowerCase()))
          : filteredAgents;
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">Agents</h2>
                <div className="flex items-center gap-1">
                  <Button size="sm" className="h-7" onClick={() => setLocation('/agents/create')} data-testid="button-create-agent-panel">
                    <Plus className="h-3 w-3 mr-1" />
                    New
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-agents-panel">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  placeholder="Search agents..."
                  className="h-7 pl-7 text-xs"
                  data-testid="input-agent-search"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 flex flex-col gap-0.5">
                {searchedAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgent(agent);
                      if (!location.startsWith('/agents')) setLocation('/agents');
                    }}
                    className={cn(
                      'w-full text-left p-2 rounded-md transition-colors hover-elevate',
                      selectedAgent?.id === agent.id ? 'bg-accent' : 'hover:bg-accent/50'
                    )}
                    data-testid={`panel-agent-${agent.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-[10px]">
                          <Bot className="h-3.5 w-3.5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
                          <div className={cn('w-1.5 h-1.5 rounded-full', getAgentStatusColor(agent.status))} />
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{agent.channel}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </>
        );
      }

      case 'drive':
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">Drive</h2>
                <div className="flex items-center gap-1">
                  <Button size="sm" className="h-7" data-testid="button-upload-panel">
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-drive-panel">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <nav className="flex flex-col gap-0.5">
                  {[
                    { id: 'my-files', label: 'My Files', icon: Folder },
                    { id: 'shared', label: 'Shared', icon: Users },
                    { id: 'starred', label: 'Starred', icon: Star },
                    { id: 'recent', label: 'Recent', icon: Clock },
                    { id: 'templates', label: 'Templates', icon: FileBox },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => !location.startsWith('/drive') && setLocation('/drive')}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover-elevate"
                        data-testid={`panel-drive-${item.id}`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </ScrollArea>
          </>
        );

      case 'insights':
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">Insights</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-insights-panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <nav className="flex flex-col gap-0.5">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/insights?tab=dashboard' },
                    { id: 'reports', label: 'Reports', icon: PieChart, path: '/insights?tab=reports' },
                    { id: 'library', label: 'Library', icon: BookOpen, path: '/insights?tab=library' },
                    { id: 'hunches', label: 'Hunches', icon: Lightbulb, path: '/insights?tab=hunches' },
                    { id: 'activity', label: 'Activity', icon: Activity, path: '/activity' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isInsightsTab = item.path.startsWith('/insights?tab=');
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (isInsightsTab && location.startsWith('/insights')) {
                            window.history.replaceState(null, '', item.path);
                            window.dispatchEvent(new CustomEvent('insights-tab-change', { detail: item.id }));
                            setActiveInsightsTab(item.id);
                          } else {
                            setLocation(item.path);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover-elevate",
                          isInsightsTab && location.startsWith('/insights') && activeInsightsTab === item.id && 'bg-accent text-foreground'
                        )}
                        data-testid={`panel-insights-${item.id}`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </ScrollArea>
          </>
        );

      case 'work-center':
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">Hub</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-work-panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <nav className="flex flex-col gap-0.5">
                  {[
                    { id: 'calendar', label: 'Calendar', icon: CalendarIcon, path: '/work-center?tab=calendar' },
                    { id: 'leads', label: 'Leads', icon: Users, path: '/work-center?tab=leads' },
                    { id: 'inbox', label: 'Inbox', icon: MessageSquare, path: '/work-center?tab=inbox' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isHubTab = item.path.startsWith('/work-center?tab=');
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (isHubTab && location.startsWith('/work-center')) {
                            window.history.replaceState(null, '', item.path);
                            window.dispatchEvent(new CustomEvent('hub-tab-change', { detail: item.id }));
                            setActiveHubTab(item.id);
                          } else {
                            setLocation(item.path);
                          }
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover-elevate",
                          isHubTab && location.startsWith('/work-center') && activeHubTab === item.id && 'bg-accent text-foreground'
                        )}
                        data-testid={`panel-wc-${item.id}`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </ScrollArea>
          </>
        );

      case 'system': {
        const settingsItems = [
          { id: 'users', label: 'Users', icon: Users, desc: 'Manage team members and roles', roles: ['super_admin', 'partner_admin', 'org_admin'], path: '/settings/system?section=users' },
          { id: 'organization', label: 'Organization', icon: Building2, desc: 'Company profile and branding', roles: ['super_admin', 'partner_admin', 'org_admin'], path: '/settings/system?section=organization' },
          { id: 'tools', label: 'Tools & Integrations', icon: Wrench, desc: 'Configure integrations and APIs', roles: ['super_admin', 'partner_admin', 'org_admin'], path: '/settings/system?section=tools' },
          { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, desc: 'Manage knowledge base sources', roles: ['super_admin', 'partner_admin', 'org_admin'], path: '/settings/system?section=knowledge' },
          { id: 'ai', label: 'AI Configuration', icon: Zap, desc: 'AI behavior and configuration', roles: ['super_admin', 'partner_admin'], path: '/settings/system?section=ai' },
          { id: 'security', label: 'Security & Privacy', icon: Lock, desc: 'Security settings and policies', roles: ['super_admin', 'partner_admin'], path: '/settings/system?section=security' },
          { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Notification preferences', roles: ['super_admin', 'partner_admin', 'org_admin'], path: '/settings/system?section=notifications' },
          { id: 'data', label: 'Data Management', icon: Database, desc: 'Data import, export, and retention', roles: ['super_admin'], path: '/settings/system?section=data' },
          { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'Theme and display settings', roles: ['super_admin', 'partner_admin', 'org_admin'], path: '/settings/system?section=appearance' },
          { id: 'billing', label: 'Billing', icon: CreditCard, desc: 'Billing and invoicing', roles: ['super_admin', 'partner_admin'], path: '/settings/billing' },
        ];
        const visibleItems = settingsItems.filter(item => item.roles.includes(currentRole));
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">System Settings</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-system-panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <nav className="flex flex-col gap-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setLocation(item.path)}
                        className="w-full flex items-start gap-2 px-2 py-2 rounded-md text-left hover-elevate"
                        data-testid={`panel-settings-${item.id}`}
                      >
                        <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </ScrollArea>
          </>
        );
      }

      case 'profile':
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">Profile</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-profile-panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <div className="flex items-center gap-3 p-3 mb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                  </div>
                </div>
                <nav className="flex flex-col gap-1">
                  {[
                    { id: 'profile', label: 'My Profile', icon: UserIcon, desc: 'View and edit your profile' },
                    { id: 'preferences', label: 'Preferences', icon: Settings, desc: 'Notifications and display' },
                    { id: 'billing', label: 'Billing', icon: CreditCard, desc: 'Subscription and payments' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => !location.startsWith('/profile') && setLocation('/profile')}
                        className="w-full flex items-start gap-2 px-2 py-2 rounded-md text-left hover-elevate"
                        data-testid={`panel-profile-${item.id}`}
                      >
                        <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </ScrollArea>
          </>
        );

      default:
        return null;
    }
  };

  // When pinned (subMenuExpanded), use flex layout to push content
  // When just hovering (not pinned), use fixed positioning to overlay
  const positionClasses = subMenuExpanded
    ? 'relative flex-shrink-0' // Push content - part of flex layout
    : 'fixed left-16 top-14 bottom-0 z-40 shadow-xl'; // Overlay content
  
  return (
    <aside 
      className={cn(
        "hidden lg:flex flex-col border-r border-border bg-card/95 backdrop-blur-sm w-64",
        positionClasses
      )}
      onMouseEnter={handlePanelMouseEnter}
      onMouseLeave={handlePanelMouseLeave}
    >
      {renderPanelContent()}
    </aside>
  );
}
