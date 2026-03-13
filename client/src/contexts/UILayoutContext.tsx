/**
 * UILayoutContext.tsx — UI layout state extracted from AppContext.
 *
 * Manages sidebar visibility, right pane, mobile menu, sub-menu panel,
 * and hover state. These are purely presentational concerns separated
 * from the application data managed by AppContext.
 */
import { createContext, useContext, useState, type ReactNode } from 'react';

interface UILayoutContextValue {
  sidebarVisible: boolean;
  setSidebarVisible: (visible: boolean) => void;
  rightPaneOpen: boolean;
  setRightPaneOpen: (open: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  activePanel: string | null;
  setActivePanel: (panel: string | null) => void;
  subMenuExpanded: boolean;
  setSubMenuExpanded: (expanded: boolean) => void;
  panelHovered: boolean;
  setPanelHovered: (hovered: boolean) => void;
  toggleSubMenuExpanded: () => void;
}

const UILayoutContext = createContext<UILayoutContextValue | undefined>(undefined);

export function UILayoutProvider({ children }: { children: ReactNode }) {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [rightPaneOpen, setRightPaneOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [subMenuExpanded, setSubMenuExpanded] = useState(false);
  const [panelHovered, setPanelHovered] = useState(false);

  const toggleSubMenuExpanded = () => {
    setSubMenuExpanded(prev => !prev);
  };

  return (
    <UILayoutContext.Provider
      value={{
        sidebarVisible,
        setSidebarVisible,
        rightPaneOpen,
        setRightPaneOpen,
        mobileMenuOpen,
        setMobileMenuOpen,
        activePanel,
        setActivePanel,
        subMenuExpanded,
        setSubMenuExpanded,
        panelHovered,
        setPanelHovered,
        toggleSubMenuExpanded,
      }}
    >
      {children}
    </UILayoutContext.Provider>
  );
}

export function useUILayout() {
  const context = useContext(UILayoutContext);
  if (!context) {
    throw new Error('useUILayout must be used within UILayoutProvider');
  }
  return context;
}
