import { useLocation } from 'wouter';
import { 
  Home, 
  Bot, 
  Folder, 
  BarChart3, 
  Briefcase, 
  Activity, 
  Settings, 
  User,
  ChevronRight,
  Star,
  MessageSquare,
  Calendar,
  CheckSquare,
  Lightbulb,
  ClipboardCheck,
  Users,
  Wrench,
  BookOpen,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { useApp } from '@/contexts/AppContext';
import { canAccessSystem } from '@/mocks/users';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  submenu?: { label: string; path: string; icon: React.ElementType }[];
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  {
    id: 'main',
    label: 'Main',
    icon: Home,
    path: '/',
    submenu: [
      { label: 'Favorites', path: '/', icon: Star },
      { label: 'Message History', path: '/', icon: MessageSquare },
    ],
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: Bot,
    path: '/agents',
    submenu: [
      { label: 'Agent Chat', path: '/agents', icon: MessageSquare },
      { label: 'Create Agent', path: '/agents/create', icon: Bot },
      { label: 'All Agents', path: '/agents', icon: Users },
    ],
  },
  {
    id: 'drive',
    label: 'Drive',
    icon: Folder,
    path: '/drive',
    submenu: [
      { label: 'My Files', path: '/drive', icon: Folder },
      { label: 'Shared Files', path: '/drive?tab=shared', icon: Users },
      { label: 'Templates', path: '/drive?tab=templates', icon: BookOpen },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: BarChart3,
    path: '/insights',
    submenu: [
      { label: 'Insight Engine', path: '/insights', icon: BarChart3 },
      { label: 'Goals', path: '/insights?tab=goals', icon: CheckSquare },
    ],
  },
  {
    id: 'work-center',
    label: 'Work Center',
    icon: Briefcase,
    path: '/work-center',
    submenu: [
      { label: 'Calendar', path: '/work-center', icon: Calendar },
      { label: 'Tasks', path: '/work-center?tab=tasks', icon: CheckSquare },
      { label: 'Hunches', path: '/work-center?tab=hunches', icon: Lightbulb },
      { label: 'Approvals', path: '/work-center?tab=approvals', icon: ClipboardCheck },
    ],
  },
  {
    id: 'activity',
    label: 'Activity',
    icon: Activity,
    path: '/activity',
    submenu: [
      { label: 'Users', path: '/activity?filter=user', icon: Users },
      { label: 'Agents', path: '/activity?filter=agent', icon: Bot },
      { label: 'System', path: '/activity?filter=system', icon: Settings },
    ],
  },
];

const bottomItems: MenuItem[] = [
  {
    id: 'system',
    label: 'System',
    icon: Settings,
    path: '/settings/system',
    adminOnly: true,
    submenu: [
      { label: 'Users', path: '/settings/system', icon: Users },
      { label: 'Application Settings', path: '/settings/system?tab=app', icon: Settings },
      { label: 'Tools', path: '/settings/system?tab=tools', icon: Wrench },
      { label: 'Knowledge', path: '/settings/system?tab=knowledge', icon: BookOpen },
      { label: 'Hunch Config', path: '/settings/system?tab=hunches', icon: Zap },
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    path: '/profile',
    submenu: [
      { label: 'My Profile', path: '/profile', icon: User },
      { label: 'Preferences', path: '/profile/preferences', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { currentUser, sidebarCollapsed, setSidebarCollapsed } = useApp();

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  const renderMenuItem = (item: MenuItem, isBottom = false) => {
    if (item.adminOnly && !canAccessSystem(currentUser.role)) {
      return null;
    }

    const Icon = item.icon;
    const active = isActive(item.path);

    const menuButton = (
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-start gap-3 h-auto py-3 px-3 relative group',
          'hover-elevate',
          active && 'bg-accent',
          sidebarCollapsed && 'justify-center px-2'
        )}
        onClick={() => setLocation(item.path)}
        data-testid={`sidebar-item-${item.id}`}
      >
        <Icon className={cn(
          'h-5 w-5 flex-shrink-0',
          active ? 'text-primary' : 'text-muted-foreground'
        )} />
        {!sidebarCollapsed && (
          <>
            <span className={cn(
              'text-sm',
              active ? 'font-medium text-foreground' : 'text-muted-foreground'
            )}>
              {item.label}
            </span>
            {item.submenu && (
              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </>
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
            {menuButton}
          </TooltipTrigger>
          <TooltipContent side="right" className="flex flex-col gap-1">
            <span className="font-medium">{item.label}</span>
            {item.submenu && (
              <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-border">
                {item.submenu.map((sub) => (
                  <Button
                    key={sub.path}
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2 h-8 text-xs"
                    onClick={() => setLocation(sub.path)}
                    data-testid={`tooltip-submenu-${item.id}-${sub.label.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <sub.icon className="h-3 w-3" />
                    {sub.label}
                  </Button>
                ))}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    if (item.submenu) {
      return (
        <HoverCard key={item.id} openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild>
            {menuButton}
          </HoverCardTrigger>
          <HoverCardContent side="right" align="start" className="w-48 p-2">
            <div className="flex flex-col gap-1">
              {item.submenu.map((sub) => (
                <Button
                  key={sub.path}
                  variant="ghost"
                  size="sm"
                  className="justify-start gap-2 h-9"
                  onClick={() => setLocation(sub.path)}
                  data-testid={`submenu-${item.id}-${sub.label.toLowerCase().replace(/\s/g, '-')}`}
                >
                  <sub.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{sub.label}</span>
                </Button>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
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
    >
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-2">
          {menuItems.map((item) => renderMenuItem(item))}
        </nav>
      </ScrollArea>

      <div className="border-t border-border py-4 px-2">
        <nav className="flex flex-col gap-1">
          {bottomItems.map((item) => renderMenuItem(item, true))}
        </nav>
      </div>

      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-muted-foreground text-xs"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          data-testid="button-toggle-sidebar"
        >
          {sidebarCollapsed ? '→' : '←'}
        </Button>
      </div>
    </aside>
  );
}
