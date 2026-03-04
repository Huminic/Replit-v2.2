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
import { mockOrganizations, type User, type Organization, type UserRole, type SectionPermission } from '@/mocks/users';
import { mockAgents, type Agent } from '@/mocks/agents';
import { mockNotifications, type Notification } from '@/mocks/notifications';
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
  notifications: Notification[];
  favorites: FavoriteItem[];
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
  unreadNotificationCount: number;
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (path: string) => boolean;
  setCommunicationGateEnabled: (enabled: boolean) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function mapAuthUserToAppUser(authUser: { id: string; email: string; firstName: string; lastName: string; role: { name: string }; organization: { id: string } }): User {
  return {
    id: authUser.id,
    name: `${authUser.firstName} ${authUser.lastName}`,
    email: authUser.email,
    role: authUser.role.name as UserRole,
    organizationId: authUser.organization.id,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, accessibleOrganizations } = useAuth();

  const authAppUser = authUser ? mapAuthUserToAppUser(authUser) : null;

  const { data: apiAgents } = useQuery<Agent[]>({
    queryKey: ['/api/agents'],
    enabled: !!authUser,
  });

  const { data: orgDetails } = useQuery<{
    id: string;
    name: string;
    slug: string;
    personaName: string;
    primaryColor: string | null;
    secondaryColor: string | null;
    outboundEnabled: boolean;
  }>({
    queryKey: ['/api/organizations', authUser?.organization?.id],
    enabled: !!authUser?.organization?.id,
  });

  const resolvedUser: User = authAppUser || {
    id: 'fallback',
    name: 'User',
    email: '',
    role: 'org_admin',
    organizationId: 'org-1',
  };

  const resolvedOrganization: Organization = orgDetails
    ? {
        id: orgDetails.id,
        name: orgDetails.name,
        primaryColor: orgDetails.primaryColor || '#8b5cf6',
        secondaryColor: orgDetails.secondaryColor || '#3b82f6',
        personaName: orgDetails.personaName || 'Serra',
      }
    : mockOrganizations[0];

  const resolvedOrganizations: Organization[] = accessibleOrganizations
    ? accessibleOrganizations.map(o => {
        const mock = mockOrganizations.find(m => m.name === o.name);
        return {
          id: o.id,
          name: o.name,
          primaryColor: mock?.primaryColor || '#8b5cf6',
          secondaryColor: mock?.secondaryColor || '#3b82f6',
          personaName: mock?.personaName || 'Serra',
        };
      })
    : mockOrganizations;

  const resolvedAgents = apiAgents || mockAgents;

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const validRoles: UserRole[] = ['super_admin', 'partner_admin', 'org_admin', 'executive', 'sales_manager', 'sales', 'service', 'marketing'];
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role') as UserRole | null;
    if (roleParam && validRoles.includes(roleParam)) {
      localStorage.setItem('nexxus-current-role', roleParam);
      return roleParam;
    }
    const saved = localStorage.getItem('nexxus-current-role');
    return (saved as UserRole) || 'org_admin';
  });

  useEffect(() => {
    if (authUser && !localStorage.getItem('nexxus-current-role')) {
      setCurrentRole(authUser.role.name as UserRole);
    }
  }, [authUser]);

  const [userPermissions, setUserPermissions] = useState<SectionPermission[]>([]);
  const handleSetCurrentRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem('nexxus-current-role', role);
  };

  const [currentOrganization, setCurrentOrganization] = useState<Organization>(mockOrganizations[0]);

  useEffect(() => {
    setCurrentOrganization(resolvedOrganization);
  }, [orgDetails]);

  const [agents, setAgents] = useState<Agent[]>(mockAgents);

  useEffect(() => {
    if (resolvedAgents !== mockAgents) {
      setAgents(resolvedAgents);
    }
  }, [apiAgents]);

  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [rightPaneOpen, setRightPaneOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [subMenuExpanded, setSubMenuExpanded] = useState(false);
  const [panelHovered, setPanelHovered] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [communicationGateEnabled, setCommunicationGateEnabled] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([
    { id: 'fav-1', label: 'Sales Dashboard', path: '/sales' },
    { id: 'fav-2', label: 'Service Calendar', path: '/service?tab=calendar' },
  ]);

  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0]);
    }
  }, [agents]);

  useEffect(() => {
    if (orgDetails) {
      setCommunicationGateEnabled(orgDetails.outboundEnabled !== false);
    }
  }, [orgDetails]);

  const personaName = currentOrganization.personaName;

  const addFavorite = (item: FavoriteItem) => {
    setFavorites(prev => [...prev, item]);
  };

  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
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

  const updateAgentHandler = (agentId: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, ...updates } : a));
  };

  const markNotificationRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

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
        unreadNotificationCount,
        addFavorite,
        removeFavorite,
        isFavorite,
        setCommunicationGateEnabled,
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
