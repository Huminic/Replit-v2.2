import { useLocation } from 'wouter';
import { useRef } from 'react';
import { 
  Home, 
  Bot, 
  Folder, 
  BarChart3, 
  Briefcase, 
  Activity, 
  Settings, 
  User,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useApp } from '@/contexts/AppContext';
import { canAccessSystem } from '@/mocks/users';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  hasPanel?: boolean;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { id: 'main', label: 'Main', icon: Home, path: '/', hasPanel: false },
  { id: 'agents', label: 'Agents', icon: Bot, path: '/agents', hasPanel: true },
  { id: 'drive', label: 'Drive', icon: Folder, path: '/drive', hasPanel: true },
  { id: 'insights', label: 'Insights', icon: BarChart3, path: '/insights', hasPanel: true },
  { id: 'work-center', label: 'Work Center', icon: Briefcase, path: '/work-center', hasPanel: true },
  { id: 'activity', label: 'Activity', icon: Activity, path: '/activity', hasPanel: true },
];

const bottomItems: MenuItem[] = [
  { id: 'system', label: 'System', icon: Settings, path: '/settings/system', hasPanel: true, adminOnly: true },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile', hasPanel: true },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { 
    currentUser, 
    sidebarCollapsed, 
    setSidebarCollapsed,
    activePanel,
    panelLocked,
    panelHovered,
    setActivePanel,
    togglePanelLock
  } = useApp();
  
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  const handleMouseEnter = (item: MenuItem) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    if (item.hasPanel && !panelLocked) {
      setActivePanel(item.id);
    }
  };

  const handleMouseLeave = () => {
    if (!panelLocked) {
      leaveTimeoutRef.current = setTimeout(() => {
        if (!panelHovered) {
          setActivePanel(null);
        }
      }, 150);
    }
  };

  const handleClick = (item: MenuItem) => {
    setLocation(item.path);
    if (item.hasPanel) {
      togglePanelLock(item.id);
    }
  };

  const renderMenuItem = (item: MenuItem) => {
    if (item.adminOnly && !canAccessSystem(currentUser.role)) {
      return null;
    }

    const Icon = item.icon;
    const active = isActive(item.path);
    const isPanelOpen = activePanel === item.id;

    const menuButton = (
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start gap-3 h-auto py-3 px-3 relative group',
          'hover-elevate',
          (active || isPanelOpen) && 'bg-accent',
          sidebarCollapsed && 'justify-center px-2'
        )}
        onClick={() => handleClick(item)}
        onMouseEnter={() => handleMouseEnter(item)}
        data-testid={`sidebar-item-${item.id}`}
      >
        <Icon className={cn(
          'h-5 w-5 flex-shrink-0',
          (active || isPanelOpen) ? 'text-primary' : 'text-muted-foreground'
        )} />
        {!sidebarCollapsed && (
          <span className={cn(
            'text-sm',
            (active || isPanelOpen) ? 'font-medium text-foreground' : 'text-muted-foreground'
          )}>
            {item.label}
          </span>
        )}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r-full" />
        )}
      </Button>
    );

    if (sidebarCollapsed) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>
            <div
              onMouseEnter={() => handleMouseEnter(item)}
            >
              {menuButton}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <span className="font-medium">{item.label}</span>
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.id}>{menuButton}</div>;
  };

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-border bg-sidebar transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
      onMouseLeave={handleMouseLeave}
    >
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-2">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
      </ScrollArea>

      <div className="border-t border-border py-4 px-2">
        <nav className="flex flex-col gap-1">
          {bottomItems.map((item) => renderMenuItem(item))}
        </nav>
      </div>

      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-muted-foreground"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          data-testid="button-toggle-sidebar"
        >
          {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
}
