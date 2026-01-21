import { useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Bot, Plus, Search, Folder, Star, Users, Clock, FileBox, BarChart3, Target, PieChart,
  Calendar as CalendarIcon, CheckSquare, Lightbulb, ClipboardCheck, Activity, User as UserIcon,
  Server, Settings, Wrench, BookOpen, Zap, CreditCard, ChevronLeft, Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useApp } from '@/contexts/AppContext';
import { getAgentStatusColor, type Agent } from '@/mocks/agents';
import { mockActivityFeed } from '@/mocks/activity';
import { mockApprovals } from '@/mocks/tasks';

interface SubMenuManagerProps {
  selectedAgent: Agent | null;
  onSelectAgent: (agent: Agent) => void;
}

export function SubMenuManager({ selectedAgent, onSelectAgent }: SubMenuManagerProps) {
  const [location, setLocation] = useLocation();
  const { 
    activePanel, 
    subMenuExpanded, 
    setActivePanel, 
    setSubMenuExpanded,
    setPanelHovered,
    agents,
    currentUser
  } = useApp();
  
  const panelLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
      }, 200);
    }
  };

  const getCurrentPanelId = () => {
    if (activePanel) return activePanel;
    if (location.startsWith('/agents')) return 'agents';
    if (location.startsWith('/drive')) return 'drive';
    if (location.startsWith('/insights')) return 'insights';
    if (location.startsWith('/work-center')) return 'work-center';
    if (location.startsWith('/activity')) return 'activity';
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
      case 'agents':
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
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 flex flex-col gap-0.5">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      onSelectAgent(agent);
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
                    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                    { id: 'goals', label: 'Goals', icon: Target },
                    { id: 'reports', label: 'Reports', icon: PieChart },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => !location.startsWith('/insights') && setLocation('/insights')}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover-elevate"
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
        const pendingApprovals = mockApprovals.filter(a => a.status === 'pending').length;
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
                    { id: 'calendar', label: 'Calendar', icon: CalendarIcon, badge: 0 },
                    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: 0 },
                    { id: 'hunches', label: 'Hunches', icon: Lightbulb, badge: 0 },
                    { id: 'approvals', label: 'Approvals', icon: ClipboardCheck, badge: pendingApprovals },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => !location.startsWith('/work-center') && setLocation('/work-center')}
                        className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover-elevate"
                        data-testid={`panel-wc-${item.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </div>
                        {item.badge > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[10px]">{item.badge}</Badge>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </ScrollArea>
          </>
        );

      case 'activity':
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">Activity</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-activity-panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <nav className="flex flex-col gap-0.5">
                  {[
                    { id: 'all', label: 'All Activity', icon: Activity, count: mockActivityFeed.length },
                    { id: 'user', label: 'User Activity', icon: UserIcon, count: mockActivityFeed.filter(a => a.type === 'user').length },
                    { id: 'agent', label: 'Agent Activity', icon: Bot, count: mockActivityFeed.filter(a => a.type === 'agent').length },
                    { id: 'system', label: 'System Activity', icon: Server, count: mockActivityFeed.filter(a => a.type === 'system').length },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => !location.startsWith('/activity') && setLocation('/activity')}
                        className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover-elevate"
                        data-testid={`panel-activity-${item.id}`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </div>
                        <span className="text-xs text-muted-foreground">{item.count}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </ScrollArea>
          </>
        );

      case 'system':
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
                <nav className="flex flex-col gap-0.5">
                  {[
                    { id: 'users', label: 'Users', icon: Users },
                    { id: 'app', label: 'Application', icon: Settings },
                    { id: 'tools', label: 'Tools', icon: Wrench },
                    { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
                    { id: 'hunches', label: 'Hunches', icon: Zap },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => !location.startsWith('/settings') && setLocation('/settings/system')}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover-elevate"
                        data-testid={`panel-settings-${item.id}`}
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
                <nav className="flex flex-col gap-0.5">
                  {[
                    { id: 'profile', label: 'My Profile', icon: UserIcon },
                    { id: 'preferences', label: 'Preferences', icon: Settings },
                    { id: 'billing', label: 'Billing', icon: CreditCard },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => !location.startsWith('/profile') && setLocation('/profile')}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover-elevate"
                        data-testid={`panel-profile-${item.id}`}
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
