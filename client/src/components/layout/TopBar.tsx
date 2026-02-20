import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Bell, 
  Activity, 
  Sun, 
  Moon, 
  ChevronDown,
  User,
  Settings,
  CreditCard,
  LogOut,
  Building2,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import { getNotificationIcon, getNotificationColor } from '@/mocks/notifications';
import { mockActivityFeed, getActivityColor } from '@/mocks/activity';
import { getRoleLabel, canSwitchOrgs, type UserRole } from '@/mocks/users';
import { formatDistanceToNow } from 'date-fns';

/**
 * @component TopBar
 * @description Top navigation bar with logo, search, role switcher, notifications, and activity feed
 * @designConstraints
 *   - Logo: Text-only "Nexxus Connect" with trademark symbol, NO icon
 *   - Role switcher: Shield icon button opening dropdown with 4 roles (temporary dev tool)
 *   - Activity feed: Dropdown with recent activity items (stays in header, NOT in sidebar)
 * @rbac Role switcher available to all (dev tool)
 * @locked Logo format (text-only), role switcher position, activity feed location
 */

const allRoles: UserRole[] = ['super_admin', 'partner_admin', 'org_admin', 'org_staff'];

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { 
    currentUser,
    currentRole,
    setCurrentRole,
    currentOrganization, 
    organizations, 
    notifications, 
    unreadNotificationCount,
    markNotificationRead,
    switchOrganization,
  } = useApp();
  const [, setLocation] = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  const userInitials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <header className="h-14 min-h-14 flex items-center px-4 border-b border-border bg-background z-50">
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="font-semibold text-foreground text-sm">Nexxus Connect<span className="text-muted-foreground">™</span></span>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 text-sm" data-testid="button-org-switcher">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium truncate max-w-40">{currentOrganization.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56" data-testid="dropdown-org-switcher">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Organization</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => switchOrganization(org.id)}
                className="flex items-center justify-between"
                data-testid={`org-option-${org.id}`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{org.name}</span>
                </div>
                {org.id === currentOrganization.id && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Notifications */}
        <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadNotificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center"
                >
                  {unreadNotificationCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80" data-testid="dropdown-notifications">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadNotificationCount > 0 && (
                <Badge variant="secondary" className="text-xs">{unreadNotificationCount} new</Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-80">
              {notifications.map((notif) => {
                const IconName = getNotificationIcon(notif.type);
                return (
                  <DropdownMenuItem
                    key={notif.id}
                    className={`flex items-start gap-3 p-3 cursor-pointer ${!notif.read ? 'bg-muted/50' : ''}`}
                    onClick={() => {
                      markNotificationRead(notif.id);
                      if (notif.actionUrl) setLocation(notif.actionUrl);
                    }}
                    data-testid={`notification-item-${notif.id}`}
                  >
                    <div className={`mt-0.5 ${getNotificationColor(notif.type)}`}>
                      {IconName === 'AlertTriangle' && <Bell className="h-4 w-4" />}
                      {IconName === 'CheckSquare' && <Activity className="h-4 w-4" />}
                      {IconName === 'CheckCircle' && <Check className="h-4 w-4" />}
                      {IconName === 'Settings' && <Settings className="h-4 w-4" />}
                      {IconName === 'AtSign' && <User className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notif.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Activity Feed */}
        <DropdownMenu open={activityOpen} onOpenChange={setActivityOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-activity-feed">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96" data-testid="dropdown-activity">
            <DropdownMenuLabel>Activity Feed</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-80">
              {mockActivityFeed.slice(0, 8).map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="flex items-start gap-3 p-3"
                  data-testid={`activity-item-${item.id}`}
                >
                  <div className={`w-8 h-8 rounded-full ${getActivityColor(item.type)} flex items-center justify-center flex-shrink-0`}>
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{item.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          data-testid="button-theme-toggle"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Sun className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>

        {/* Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2" data-testid="button-profile-menu">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64" data-testid="dropdown-profile">
            <div className="px-3 py-2">
              <p className="font-medium">{currentUser.name}</p>
              <p className="text-xs text-muted-foreground">{currentUser.email}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                {getRoleLabel(currentRole)}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation('/profile')} data-testid="menu-item-profile">
              <User className="h-4 w-4 mr-2" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation('/profile/preferences')} data-testid="menu-item-preferences">
              <Settings className="h-4 w-4 mr-2" />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation('/profile/billing')} data-testid="menu-item-billing">
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" data-testid="menu-item-logout">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Role Switcher (tiny arrow dropdown) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 hidden sm:flex" data-testid="button-role-switcher">
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" data-testid="dropdown-role-switcher">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Role (Dev)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allRoles.map((role) => (
              <DropdownMenuItem
                key={role}
                onClick={() => setCurrentRole(role)}
                className="flex items-center justify-between"
                data-testid={`role-option-${role}`}
              >
                <span>{getRoleLabel(role)}</span>
                {currentRole === role && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
