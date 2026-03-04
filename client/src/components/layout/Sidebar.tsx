/**
 * @component Sidebar
 * @description Primary navigation sidebar (72px wide). Icon-only navigation with text labels below each icon.
 * Uses a persona/department-based structure replacing the old feature-based navigation.
 *
 * Navigation items: AI Chat → TeamBox → My Work → Sales → Service → Marketing → Management
 * Bottom items: System (settings) — RBAC gated to admin roles only
 *
 * @designConstraints
 *   - Fixed width of 72px when expanded, 40px when collapsed (ChevronsRight button only)
 *   - Active route indicator: purple left border bar + purple icon tint
 *   - Hover behavior: mouseEnter sets activePanel → shows SubMenuManager flyout panel
 *   - 800ms delay on mouseLeave before closing the flyout (prevents flicker)
 *   - toggleSubMenuExpanded: Locks the sub-menu panel open (pin mode) vs hover-only mode
 *
 * @rbac canAccessSection() from users.ts checks currentRole + userPermissions to show/hide items
 * @see SubMenuManager.tsx — flyout panel rendered alongside this sidebar
 * @see AppContext.tsx — provides activePanel, subMenuExpanded, panelHovered state
 * @production Logout button is placeholder — will wire to auth provider
 */
import { useLocation } from 'wouter';
import { useRef, useEffect } from 'react';
import { 
  MessageSquare,
  Inbox,
  User,
  ShoppingCart,
  Wrench,
  Megaphone,
  LayoutDashboard,
  Settings,
  ChevronsRight,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useApp } from '@/contexts/AppContext';
import { canAccessSection } from '@/lib/rbac';

/** Sidebar menu item shape — hasPanel indicates whether hovering shows a SubMenuManager flyout */
interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  hasPanel?: boolean;
  section?: string;
}

/** Main navigation items — each has hasPanel:true for sub-menu flyout support */
const menuItems: MenuItem[] = [
  { id: 'ai-chat', label: 'AI Chat', icon: MessageSquare, path: '/', hasPanel: true, section: 'ai-chat' },
  { id: 'teambox', label: 'TeamBox', icon: Inbox, path: '/teambox', hasPanel: true, section: 'teambox' },
  { id: 'my-work', label: 'My Work', icon: User, path: '/my-work', hasPanel: true, section: 'my-work' },
  { id: 'sales', label: 'Sales', icon: ShoppingCart, path: '/sales', hasPanel: true, section: 'sales' },
  { id: 'service', label: 'Service', icon: Wrench, path: '/service', hasPanel: true, section: 'service' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, path: '/marketing', hasPanel: true, section: 'marketing' },
  { id: 'management', label: 'Manage', icon: LayoutDashboard, path: '/management', hasPanel: true, section: 'management' },
];

/** Bottom-pinned items — System settings, RBAC gated to admin roles via canAccessSection() */
const bottomItems: MenuItem[] = [
  { id: 'system', label: 'System', icon: Settings, path: '/settings/system', hasPanel: true, section: 'system' },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { 
    currentRole, 
    userPermissions,
    sidebarVisible, 
    setSidebarVisible,
    activePanel,
    subMenuExpanded,
    panelHovered,
    setActivePanel,
    toggleSubMenuExpanded
  } = useApp();
  
  // 800ms delay timer ref for mouseLeave — prevents sub-menu from closing instantly when moving cursor between sidebar and flyout
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  // Route matching — exact match for root, prefix match for other paths
  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  // Determines if the current page has a sub-menu panel (used to show/hide the pin toggle button)
  const getCurrentPagePanel = () => {
    const allItems = [...menuItems, ...bottomItems];
    const currentItem = allItems.find(item => isActive(item.path));
    return currentItem?.hasPanel ? currentItem.id : null;
  };

  // On hover: cancel any pending close timeout and open the sub-menu flyout for this item
  const handleMouseEnter = (item: MenuItem) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    if (item.hasPanel) {
      setActivePanel(item.id);
    }
  };

  // On leave: if not pinned (subMenuExpanded), start 800ms timeout to close the flyout
  const handleMouseLeave = () => {
    if (!subMenuExpanded) {
      leaveTimeoutRef.current = setTimeout(() => {
        if (!panelHovered) {
          setActivePanel(null);
        }
      }, 800);
    }
  };

  // Navigate to the item's route and open its flyout panel (or close panel if item has no panel)
  const handleClick = (item: MenuItem) => {
    setLocation(item.path);
    if (item.hasPanel) {
      setActivePanel(item.id);
    } else {
      setActivePanel(null);
      if (subMenuExpanded) {
        toggleSubMenuExpanded();
      }
    }
  };
  
  const currentPageHasPanel = getCurrentPagePanel() !== null;

  // Renders a single sidebar icon button — RBAC filtered, with active indicator and panel highlight
  const renderMenuItem = (item: MenuItem) => {
    if (item.section && !canAccessSection(currentRole, item.section, userPermissions.length > 0 ? userPermissions : undefined)) {
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
              'h-[22px] w-[22px] flex-shrink-0',
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

  // Collapsed state: 40px wide, shows only a ChevronsRight expand button
  if (!sidebarVisible) {
    return (
      <aside className="flex flex-col items-center border-r border-border bg-sidebar w-10 py-2">
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
      className="flex flex-col border-r border-border bg-sidebar w-[72px]"
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
