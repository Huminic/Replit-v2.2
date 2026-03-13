/**
 * AppContext.tsx — Global application state provider for Nexxus V2
 *
 * Bridges AuthContext user identity into the app's UI state layer.
 * Auth provides the real user/role/organization. AppContext manages
 * UI state (sidebar, favorites, panels) and mock data fallbacks.
 *
 * The dev role switcher still works by overriding currentRole locally.
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole, SectionPermission } from '@/lib/rbac';
import type { Agent, Notification as DbNotification, Favorite } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  profilePhotoUrl?: string;
  organizationId: string;
  permissions?: SectionPermission[];
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  personaName: string;
}

const defaultOrganization: Organization = {
  id: '',
  name: '',
  slug: '',
  primaryColor: '#8b5cf6',
  secondaryColor: '#3b82f6',
  personaName: 'Automa',
};
import { useQuery } from '@tanstack/react-query';

export interface FavoriteItem {
  id: string;
  label: string;
  path: string;
}

interface AppContextValue {
  currentUser: User;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentOrganization: Organization;
  organizations: Organization[];
  agents: Agent[];
  notifications: DbNotification[];
  favorites: Favorite[];
  selectedAgent: Agent | null;
  sidebarVisible: boolean;
  rightPaneOpen: boolean;
  mobileMenuOpen: boolean;
  activePanel: string | null;
  subMenuExpanded: boolean;
  panelHovered: boolean;
  personaName: string;
  communicationGateEnabled: boolean;
  userPermissions: SectionPermission[];
  setUserPermissions: (perms: SectionPermission[]) => void;
  setSelectedAgent: (agent: Agent | null) => void;
  setSidebarVisible: (visible: boolean) => void;
  setRightPaneOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setActivePanel: (panel: string | null) => void;
  setSubMenuExpanded: (expanded: boolean) => void;
  setPanelHovered: (hovered: boolean) => void;
  toggleSubMenuExpanded: () => void;
  switchOrganization: (orgId: string) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;
  unreadNotificationCount: number;
  addFavorite: (path: string, label: string) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (path: string) => boolean;
  setCommunicationGateEnabled: (enabled: boolean) => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  showTour: boolean;
  setShowTour: (show: boolean) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function mapAuthUserToAppUser(authUser: { id: string; email: string; firstName: string; lastName: string; profilePhotoUrl?: string; role: { name: string }; organization: { id: string } }): User {
  return {
    id: authUser.id,
    name: `${authUser.firstName} ${authUser.lastName}`,
    email: authUser.email,
    role: authUser.role.name as UserRole,
    profilePhotoUrl: authUser.profilePhotoUrl,
    organizationId: authUser.organization.id,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();

  const authAppUser = authUser ? mapAuthUserToAppUser(authUser) : null;

  const canSwitchStore = authUser && (authUser.role.level <= 2);
  const { data: liveOrgList } = useQuery<{ id: string; name: string; slug: string }[]>({
    queryKey: ['/api/organizations'],
    enabled: !!authUser && !!canSwitchStore,
  });

  const { data: apiAgents } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    enabled: !!authUser,
  });

  const orgIdForDetails = authUser?.organization?.id;
  const { data: orgDetails } = useQuery<{
    id: string;
    name: string;
    slug: string;
    personaName: string;
    primaryColor: string | null;
    secondaryColor: string | null;
    outboundEnabled: boolean;
  }>({
    queryKey: ['/api/organizations', orgIdForDetails],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgIdForDetails}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('nexxus_access_token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch org details');
      return res.json();
    },
    enabled: !!orgIdForDetails,
  });

  const [userOverrides, setUserOverrides] = useState<Partial<User>>({});
  const [showTour, setShowTour] = useState(false);

  const resolvedOrganization: Organization = orgDetails
    ? {
        id: orgDetails.id,
        name: orgDetails.name,
        slug: orgDetails.slug || '',
        primaryColor: orgDetails.primaryColor || '#8b5cf6',
        secondaryColor: orgDetails.secondaryColor || '#3b82f6',
        personaName: orgDetails.personaName || 'Automa',
      }
    : defaultOrganization;

  const orgSource = liveOrgList && liveOrgList.length > 0 ? liveOrgList : null;
  const resolvedOrganizations: Organization[] = orgSource
    ? orgSource.map(o => ({
        id: o.id,
        name: o.name,
        slug: o.slug || '',
        primaryColor: '#8b5cf6',
        secondaryColor: '#3b82f6',
        personaName: 'Automa',
      }))
    : [];

  const { data: apiNotifications } = useQuery<DbNotification[]>({
    queryKey: ['/api/notifications'],
    enabled: !!authUser,
    refetchInterval: 30000,
  });

  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
    enabled: !!authUser,
    refetchInterval: 15000,
  });

  const resolvedAgents = apiAgents || [];

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const validRoles: UserRole[] = ['super_admin', 'partner_admin', 'org_admin', 'executive', 'sales_manager', 'sales', 'service', 'marketing'];
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role') as UserRole | null;
    if (roleParam && validRoles.includes(roleParam)) {
      localStorage.setItem('nexxus-current-role', roleParam);
      return roleParam;
    }
    return 'org_admin';
  });

  const [roleInitialized, setRoleInitialized] = useState(false);

  useEffect(() => {
    if (authUser && !roleInitialized) {
      const authRole = authUser.role.name as UserRole;
      setCurrentRole(authRole);
      localStorage.setItem('nexxus-current-role', authRole);
      setRoleInitialized(true);
    }
  }, [authUser, roleInitialized]);

  const [userPermissions, setUserPermissions] = useState<SectionPermission[]>([]);
  const handleSetCurrentRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem('nexxus-current-role', role);
  };

  const [currentOrganization, setCurrentOrganization] = useState<Organization>(defaultOrganization);

  useEffect(() => {
    setCurrentOrganization(resolvedOrganization);
  }, [orgDetails]);

  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    if (resolvedAgents.length > 0) {
      setAgents(resolvedAgents);
    }
  }, [apiAgents]);

  const notifications: DbNotification[] = apiNotifications || [];
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [rightPaneOpen, setRightPaneOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [subMenuExpanded, setSubMenuExpanded] = useState(false);
  const [panelHovered, setPanelHovered] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [communicationGateEnabled, setCommunicationGateEnabled] = useState(true);
  const { data: apiFavorites } = useQuery<Favorite[]>({
    queryKey: ['/api/favorites'],
    enabled: !!authUser,
  });
  const favorites: Favorite[] = apiFavorites || [];

  useEffect(() => {
    if (agents.length > 0) {
      if (!selectedAgent) {
        setSelectedAgent(agents[0]);
      } else {
        const updated = agents.find(a => a.id === selectedAgent.id) ||
                        agents.find(a => a.name === selectedAgent.name);
        if (updated && updated.id !== selectedAgent.id) {
          setSelectedAgent(updated);
        }
      }
    }
  }, [agents]);

  useEffect(() => {
    if (orgDetails) {
      setCommunicationGateEnabled(orgDetails.outboundEnabled !== false);
    }
  }, [orgDetails]);

  const personaName = currentOrganization.personaName;

  const addFavorite = async (path: string, label: string) => {
    try {
      await apiRequest('POST', '/api/favorites', { path, label });
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    } catch (err) {
      console.error('Failed to add favorite', err);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      await apiRequest('DELETE', `/api/favorites/${id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
    } catch (err) {
      console.error('Failed to remove favorite', err);
    }
  };

  const isFavorite = (path: string) => {
    return favorites.some(f => f.path === path);
  };

  const toggleSubMenuExpanded = () => {
    setSubMenuExpanded(prev => !prev);
  };

  const switchOrganization = (orgId: string) => {
    const org = resolvedOrganizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
    }
  };

  const addAgent = (agent: Agent) => {
    setAgents(prev => [...prev, agent]);
  };

  const updateAgentHandler = async (agentId: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, ...updates } : a));
    if (selectedAgent?.id === agentId) {
      setSelectedAgent(prev => prev ? { ...prev, ...updates } : prev);
    }
    try {
      await apiRequest('PATCH', `/api/agents/${agentId}`, updates);
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
    } catch (err) {
      console.error('Failed to persist agent update:', err);
    }
  };

  const markNotificationRead = async (notifId: string) => {
    try {
      await apiRequest('PATCH', `/api/notifications/${notifId}/read`);
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    } catch {
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await apiRequest('POST', '/api/notifications/mark-all-read');
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    } catch {
    }
  };

  const unreadNotificationCount = unreadCountData?.count ?? notifications.filter(n => !n.read).length;

  if (!authAppUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  const resolvedUser: User = {
    ...authAppUser,
    ...userOverrides,
  };

  return (
    <AppContext.Provider
      value={{
        currentUser: resolvedUser,
        currentRole,
        setCurrentRole: handleSetCurrentRole,
        currentOrganization,
        organizations: resolvedOrganizations,
        agents,
        notifications,
        favorites,
        selectedAgent,
        sidebarVisible,
        rightPaneOpen,
        mobileMenuOpen,
        activePanel,
        subMenuExpanded,
        panelHovered,
        personaName,
        communicationGateEnabled,
        userPermissions,
        setUserPermissions,
        setSelectedAgent,
        setSidebarVisible,
        setRightPaneOpen,
        setMobileMenuOpen,
        setActivePanel,
        setSubMenuExpanded,
        setPanelHovered,
        toggleSubMenuExpanded,
        switchOrganization,
        addAgent,
        updateAgent: updateAgentHandler,
        markNotificationRead,
        markAllNotificationsRead,
        unreadNotificationCount,
        addFavorite,
        removeFavorite,
        isFavorite,
        setCommunicationGateEnabled,
        updateCurrentUser: (updates: Partial<User>) => setUserOverrides(prev => ({ ...prev, ...updates })),
        showTour,
        setShowTour,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
