import { useLocation } from 'wouter';
import { useRef } from 'react';
import { 
  Home, 
  Bot, 
  Folder, 
  BarChart3, 
  Briefcase, 
  Settings,
  ChevronsRight,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  { id: 'insights', label: 'Insights', icon: BarChart3, path: '/insights', hasPanel: true },
  { id: 'agents', label: 'Agents', icon: Bot, path: '/agents', hasPanel: true },
  { id: 'work-center', label: 'Hub', icon: Briefcase, path: '/work-center', hasPanel: true },
  { id: 'drive', label: 'Drive', icon: Folder, path: '/drive', hasPanel: true },
];

const bottomItems: MenuItem[] = [
  { id: 'system', label: 'System', icon: Settings, path: '/settings/system', hasPanel: true, adminOnly: true },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { 
    currentRole, 
    sidebarVisible, 
    setSidebarVisible,
    activePanel,
    subMenuExpanded,
    panelHovered,
    setActivePanel,
    toggleSubMenuExpanded
  } = useApp();
  
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  const getCurrentPagePanel = () => {
    const allItems = [...menuItems, ...bottomItems];
    const currentItem = allItems.find(item => isActive(item.path));
    return currentItem?.hasPanel ? currentItem.id : null;
  };

  const handleMouseEnter = (item: MenuItem) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    if (item.hasPanel) {
      setActivePanel(item.id);
    }
  };

  const handleMouseLeave = () => {
    if (!subMenuExpanded) {
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
      setActivePanel(item.id);
    } else {
      // Clear sub-menu state when navigating to home
      setActivePanel(null);
      if (subMenuExpanded) {
        toggleSubMenuExpanded();
      }
    }
  };
  
  // Check if current page has a sub-menu
  const currentPageHasPanel = getCurrentPagePanel() !== null;

  const renderMenuItem = (item: MenuItem) => {
    if (item.adminOnly && !canAccessSystem(currentRole)) {
      return null;
    }

    const Icon = item.icon;
    const active = isActive(item.path);
    const isPanelOpen = activePanel === item.id;

    return (
      <Tooltip key={item.id}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'w-full flex-col gap-1 h-auto py-2 px-1 relative',
              'hover-elevate',
              (active || isPanelOpen) && 'bg-accent'
            )}
            onClick={() => handleClick(item)}
            onMouseEnter={() => handleMouseEnter(item)}
            data-testid={`sidebar-item-${item.id}`}
          >
            <Icon className={cn(
              'h-5 w-5 flex-shrink-0',
              (active || isPanelOpen) ? 'text-purple-500 dark:text-purple-400' : 'text-muted-foreground'
            )} />
            <span className={cn(
              'text-[10px] leading-tight text-center',
              (active || isPanelOpen) ? 'font-medium text-foreground' : 'text-muted-foreground'
            )}>
              {item.label}
            </span>
            {active && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-purple-500 dark:bg-purple-400 rounded-r-full" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="hidden">
          <span className="font-medium">{item.label}</span>
        </TooltipContent>
      </Tooltip>
    );
  };

  if (!sidebarVisible) {
    return (
      <aside className="hidden lg:flex flex-col items-center border-r border-border bg-sidebar w-10 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => setSidebarVisible(true)}
          data-testid="button-show-sidebar"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </aside>
    );
  }

  return (
    <aside
      className="hidden lg:flex flex-col border-r border-border bg-sidebar w-16"
      onMouseLeave={handleMouseLeave}
    >
      {currentPageHasPanel && (
        <div className="flex flex-col items-center py-3 border-b border-border gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-7 w-7 text-muted-foreground',
                  subMenuExpanded && 'bg-accent text-primary'
                )}
                onClick={toggleSubMenuExpanded}
                data-testid="button-toggle-submenu"
              >
                <ChevronsRight className={cn(
                  'h-4 w-4 transition-transform',
                  subMenuExpanded && 'rotate-180'
                )} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {subMenuExpanded ? 'Collapse sub-menu' : 'Expand sub-menu'}
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className="flex-1 py-2 overflow-y-auto">
        <nav className="flex flex-col gap-1 px-1">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
      </div>

      <div className="border-t border-border py-2 px-1">
        <nav className="flex flex-col gap-1">
          {bottomItems.map((item) => renderMenuItem(item))}
        </nav>
      </div>

      <div className="border-t border-border py-2 px-1">
        <Button
          variant="ghost"
          className="w-full flex-col gap-1 h-auto py-2 px-1 hover-elevate"
          data-testid="button-logout"
        >
          <LogOut className="h-5 w-5 text-muted-foreground" />
          <span className="text-[10px] leading-tight text-muted-foreground">Logout</span>
        </Button>
      </div>
    </aside>
  );
}
