import { createContext, useContext, useState, type ReactNode } from 'react';
import { mockCurrentUser, mockOrganizations, type User, type Organization } from '@/mocks/users';
import { mockAgents, type Agent } from '@/mocks/agents';
import { mockNotifications, type Notification } from '@/mocks/notifications';

interface AppContextValue {
  currentUser: User;
  currentOrganization: Organization;
  organizations: Organization[];
  agents: Agent[];
  notifications: Notification[];
  sidebarCollapsed: boolean;
  rightPaneOpen: boolean;
  mobileMenuOpen: boolean;
  mobileChatOpen: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setRightPaneOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setMobileChatOpen: (open: boolean) => void;
  switchOrganization: (orgId: string) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  markNotificationRead: (notifId: string) => void;
  unreadNotificationCount: number;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser] = useState<User>(mockCurrentUser);
  const [currentOrganization, setCurrentOrganization] = useState<Organization>(mockOrganizations[0]);
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPaneOpen, setRightPaneOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

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
        currentOrganization,
        organizations: mockOrganizations,
        agents,
        notifications,
        sidebarCollapsed,
        rightPaneOpen,
        mobileMenuOpen,
        mobileChatOpen,
        setSidebarCollapsed,
        setRightPaneOpen,
        setMobileMenuOpen,
        setMobileChatOpen,
        switchOrganization,
        addAgent,
        updateAgent,
        markNotificationRead,
        unreadNotificationCount,
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
