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
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useApp } from '@/contexts/AppContext';
import { canAccessSystem } from '@/lib/rbac';

const menuItems = [
  { id: 'main', label: 'Main', icon: Home, path: '/' },
  { id: 'agents', label: 'Agents', icon: Bot, path: '/agents' },
  { id: 'insights', label: 'Insights', icon: BarChart3, path: '/insights' },
  { id: 'work-center', label: 'Hub', icon: Briefcase, path: '/work-center' },
  { id: 'activity', label: 'Activity', icon: Activity, path: '/activity' },
];

const bottomItems = [
  { id: 'system', label: 'System', icon: Settings, path: '/settings/system', adminOnly: true },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
];

export function MobileSidebar() {
  const [location, setLocation] = useLocation();
  const { currentUser, mobileMenuOpen, setMobileMenuOpen } = useApp();

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    setLocation(path);
    setMobileMenuOpen(false);
  };

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <SheetTitle className="text-lg">Nexxus</SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              data-testid="button-close-mobile-menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
          <nav className="flex flex-col gap-1 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 h-12 relative',
                    active && 'bg-accent'
                  )}
                  onClick={() => handleNavigate(item.path)}
                  data-testid={`mobile-nav-${item.id}`}
                >
                  <Icon className={cn(
                    'h-5 w-5',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <span className={cn(
                    'text-base',
                    active ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}>
                    {item.label}
                  </span>
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}
                </Button>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="border-t border-border p-4">
          <nav className="flex flex-col gap-1">
            {bottomItems.map((item) => {
              if (item.adminOnly && !canAccessSystem(currentUser.role)) {
                return null;
              }
              
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start gap-3 h-12 relative',
                    active && 'bg-accent'
                  )}
                  onClick={() => handleNavigate(item.path)}
                  data-testid={`mobile-nav-${item.id}`}
                >
                  <Icon className={cn(
                    'h-5 w-5',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <span className={cn(
                    'text-base',
                    active ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}>
                    {item.label}
                  </span>
                </Button>
              );
            })}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
