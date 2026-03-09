import { useLocation } from 'wouter';
import {
  Star,
  ChevronDown,
  BarChart3,
  PieChart,
  BookOpen,
  Lightbulb,
  Activity,
  Folder,
  Users,
  Clock,
  FileBox,
  Calendar as CalendarIcon,
  MessageSquare,
  Settings,
  Wrench,
  Zap,
  CreditCard,
  User as UserIcon,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface SubMenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const pageSubMenus: Record<string, { label: string; items: SubMenuItem[] }> = {
  '/insights': {
    label: 'Insights',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/insights?tab=dashboard' },
      { id: 'reports', label: 'Reports', icon: PieChart, path: '/insights?tab=reports' },
      { id: 'library', label: 'Library', icon: BookOpen, path: '/insights?tab=library' },
      { id: 'hunches', label: 'Hunches', icon: Lightbulb, path: '/insights?tab=hunches' },
      { id: 'activity', label: 'Activity', icon: Activity, path: '/activity' },
    ],
  },
  '/activity': {
    label: 'Insights',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/insights?tab=dashboard' },
      { id: 'reports', label: 'Reports', icon: PieChart, path: '/insights?tab=reports' },
      { id: 'library', label: 'Library', icon: BookOpen, path: '/insights?tab=library' },
      { id: 'hunches', label: 'Hunches', icon: Lightbulb, path: '/insights?tab=hunches' },
      { id: 'activity', label: 'Activity', icon: Activity, path: '/activity' },
    ],
  },
  '/work-center': {
    label: 'Hub',
    items: [
      { id: 'calendar', label: 'Calendar', icon: CalendarIcon, path: '/work-center?tab=calendar' },
      { id: 'leads', label: 'Leads', icon: Users, path: '/work-center?tab=leads' },
      { id: 'inbox', label: 'Inbox', icon: MessageSquare, path: '/work-center?tab=inbox' },
    ],
  },
  '/settings': {
    label: 'Settings',
    items: [
      { id: 'users', label: 'Users', icon: Users, path: '/settings/system?section=users' },
      { id: 'organization', label: 'Organization', icon: Settings, path: '/settings/system?section=organization' },
      { id: 'tools', label: 'Tools', icon: Wrench, path: '/settings/system?section=tools' },
      { id: 'knowledge', label: 'Knowledge', icon: BookOpen, path: '/settings/system?section=knowledge' },
      { id: 'ai', label: 'AI Config', icon: Zap, path: '/settings/system?section=ai' },
    ],
  },
  '/profile': {
    label: 'Profile',
    items: [
      { id: 'profile', label: 'My Profile', icon: UserIcon, path: '/profile' },
      { id: 'preferences', label: 'Preferences', icon: Settings, path: '/profile' },
      { id: 'billing', label: 'Billing', icon: CreditCard, path: '/profile' },
    ],
  },
};

function getSubMenuForPath(pathname: string) {
  for (const [key, value] of Object.entries(pageSubMenus)) {
    if (pathname.startsWith(key)) return value;
  }
  return null;
}

interface MobileNavDropdownProps {
  currentPath: string;
  currentLabel: string;
}

export function MobileNavDropdown({ currentPath, currentLabel }: MobileNavDropdownProps) {
  const [location, setLocation] = useLocation();
  const { favorites, addFavorite, removeFavorite, isFavorite, agents, selectedAgent, setSelectedAgent } = useApp();

  const isAgentsPage = location.startsWith('/agents');
  const subMenu = getSubMenuForPath(location);
  const isCurrentFavorite = isFavorite(currentPath);
  const filteredAgents = agents.filter(a => a.name.toLowerCase() !== 'automa');

  const handleToggleFavorite = () => {
    if (isCurrentFavorite) {
      const fav = favorites.find(f => f.path === currentPath);
      if (fav) removeFavorite(fav.id);
    } else {
      addFavorite(currentPath, currentLabel);
    }
  };

  const handleFavClick = (fav: { id: string; path: string }) => {
    if (fav.path === currentPath) {
      removeFavorite(fav.id);
    } else {
      setLocation(fav.path);
    }
  };

  if (isAgentsPage) {
    return (
      <div className="lg:hidden flex items-center gap-2 flex-1 min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs gap-1.5 w-full justify-between" data-testid="dropdown-mobile-agents">
              <div className="flex items-center gap-1.5 min-w-0">
                <Bot className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{selectedAgent?.name || 'Select Agent'}</span>
                {selectedAgent && (
                  <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', selectedAgent.status === 'active' ? 'bg-green-500' : 'bg-muted-foreground/50')} />
                )}
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Agents</DropdownMenuLabel>
            {filteredAgents.map(agent => (
              <DropdownMenuItem
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={cn(selectedAgent?.id === agent.id && "bg-accent")}
                data-testid={`dropdown-agent-${agent.id}`}
              >
                <Bot className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                <span className="truncate flex-1">{agent.name}</span>
                <Badge variant={agent.status === 'active' ? 'default' : 'secondary'} className="capitalize text-[10px] ml-2">
                  {agent.status}
                </Badge>
              </DropdownMenuItem>
            ))}
            {favorites.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  Favorites
                </DropdownMenuLabel>
                {favorites.map(fav => (
                  <DropdownMenuItem
                    key={fav.id}
                    onClick={() => handleFavClick(fav)}
                    data-testid={`dropdown-fav-${fav.id}`}
                  >
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-2 flex-shrink-0" />
                    <span className="truncate">{fav.label}</span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFavorite}
          title={isCurrentFavorite ? 'Remove from favorites' : 'Add to favorites'}
          data-testid="button-toggle-favorite"
        >
          <Star className={cn(
            "h-4 w-4",
            isCurrentFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
          )} />
        </Button>
      </div>
    );
  }

  return (
    <div className="lg:hidden flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="text-sm h-9 px-4 gap-2 min-w-[140px] justify-between" data-testid="dropdown-mobile-nav">
            <span>Menu</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          {subMenu && (
            <>
              <DropdownMenuLabel className="text-xs text-muted-foreground">{subMenu.label}</DropdownMenuLabel>
              {subMenu.items.map(item => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => setLocation(item.path)}
                    className="py-2"
                    data-testid={`dropdown-nav-${item.id}`}
                  >
                    <Icon className="h-4 w-4 mr-2.5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                );
              })}
            </>
          )}
          {favorites.length > 0 && (
            <>
              {subMenu && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                Favorites
              </DropdownMenuLabel>
              {favorites.map(fav => (
                <DropdownMenuItem
                  key={fav.id}
                  onClick={() => setLocation(fav.path)}
                  className={cn("py-2", fav.path === currentPath && "font-medium")}
                  data-testid={`dropdown-fav-${fav.id}`}
                >
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 mr-2.5 flex-shrink-0" />
                  <span className="truncate">{fav.label}</span>
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <button
        onClick={handleToggleFavorite}
        title={isCurrentFavorite ? 'Remove from favorites' : 'Add to favorites'}
        className="p-1"
        data-testid="button-toggle-favorite"
      >
        <Star className={cn(
          "h-5 w-5",
          isCurrentFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
        )} />
      </button>
    </div>
  );
}
