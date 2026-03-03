import { createContext, useContext, useState, type ReactNode } from 'react';
import { mockCurrentUser, mockOrganizations, type User, type Organization, type UserRole } from '@/mocks/users';
import { mockAgents, type Agent } from '@/mocks/agents';
import { mockNotifications, type Notification } from '@/mocks/notifications';

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

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser] = useState<User>(mockCurrentUser);
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const validRoles: UserRole[] = ['super_admin', 'partner_admin', 'org_admin', 'org_staff'];
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role') as UserRole | null;
    if (roleParam && validRoles.includes(roleParam)) {
      localStorage.setItem('nexxus-current-role', roleParam);
      return roleParam;
    }
    const saved = localStorage.getItem('nexxus-current-role');
    return (saved as UserRole) || mockCurrentUser.role;
  });
  const handleSetCurrentRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem('nexxus-current-role', role);
  };
  const [currentOrganization, setCurrentOrganization] = useState<Organization>(mockOrganizations[0]);
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [rightPaneOpen, setRightPaneOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [subMenuExpanded, setSubMenuExpanded] = useState(false);
  const [panelHovered, setPanelHovered] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(mockAgents[0] || null);
  const [communicationGateEnabled, setCommunicationGateEnabled] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([
    { id: 'fav-1', label: 'Sales Dashboard', path: '/sales' },
    { id: 'fav-2', label: 'Service Calendar', path: '/service?tab=calendar' },
  ]);

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
    const org = mockOrganizations.find(o => o.id === orgId);
    if (org) {
      setCurrentOrganization(org);
    }
  };

  const addAgent = (agent: Agent) => {
    setAgents(prev => [...prev, agent]);
  };

  const updateAgent = (agentId: string, updates: Partial<Agent>) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, ...updates } : a));
  };

  const markNotificationRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole: handleSetCurrentRole,
        currentOrganization,
        organizations: mockOrganizations,
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
        updateAgent,
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
