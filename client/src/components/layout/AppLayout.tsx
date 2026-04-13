/**
 * @component AppLayout
 * @description Master layout wrapper for all authenticated pages. Orchestrates the full application shell:
 * TopBar (h-14) + Sidebar (72px) + SubMenuManager (flyout) + main content + RightPane.
 *
 * Does NOT wrap /w/demo (the public landing page uses its own standalone layout).
 *
 * @designConstraints Cardinal layout rules enforced here:
 *   - chat-only: AI Chat page — centered content (max-w-4xl), no right pane
 *   - data-display: Dashboard pages (sales/service/marketing/management/insights) — right pane available for Automa AI chat
 *   - sub-menu: Utility pages (my-work/settings/profile) — no right pane, relies on SubMenuManager navigation
 *   - heavy-chat: Agent detail page — chat center → AgentConfigPane in right pane
 *   - teambox: CommBox 3-column layout — uses its own internal columns, no global right pane
 *
 * Right pane toggle:
 *   - Desktop: Slide-out panel (w-80 lg:w-96) with chevron close button
 *   - Mobile: Full-screen overlay with close button
 *   - FAB (floating action button): Appears on mobile for data-display pages to open Automa chat
 *
 * @see Sidebar.tsx — left navigation (72px)
 * @see SubMenuManager.tsx — flyout sub-menu panel
 * @see RightPane.tsx — Automa AI chat panel for data-display pages
 * @see AgentConfigPane.tsx — agent configuration panel for /agents route
 */
import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { RightPane } from './RightPane';
import { SubMenuManager } from './SubMenuManager';
import { AgentConfigPane } from '@/components/AgentConfigPane';
import { useApp } from '@/contexts/AppContext';
import { useUILayout } from '@/contexts/UILayoutContext';
import { ProductTour } from '@/components/ProductTour';
import { getTourStepsForRole } from '@/lib/tourSteps';

/**
 * ViewConfig determines right pane behavior and main content layout per route:
 * - chat-only: No right pane, centered chat (AI Chat page)
 * - data-display: Right pane with AI assistant (persona name from org config)
 * - sub-menu: No right pane, sub-menu navigation only
 * - heavy-chat: Right pane with AgentConfigPane
 * - teambox: Own internal 3-column layout, no global right pane
 */
type ViewConfig = 'chat-only' | 'data-display' | 'sub-menu' | 'heavy-chat' | 'teambox';

interface AppLayoutProps {
  children: React.ReactNode;
}

/** Maps the current route to a ViewConfig to determine layout behavior */
function getViewConfig(pathname: string): ViewConfig {
  if (pathname === '/') return 'chat-only';
  if (pathname.startsWith('/teambox')) return 'teambox';
  if (pathname.startsWith('/agents')) return 'heavy-chat';
  if (pathname.startsWith('/sales') || pathname.startsWith('/service') || pathname.startsWith('/marketing') || pathname.startsWith('/management') || pathname.startsWith('/insights')) {
    return 'data-display';
  }
  if (pathname.startsWith('/my-work') || pathname.startsWith('/settings') || pathname.startsWith('/profile')) {
    return 'sub-menu';
  }
  return 'data-display';
}

const TOUR_DISMISSED_PREFIX = 'nexxus_tour_dismissed_';

/** Derive a stable page key from the current pathname for per-page tour tracking */
function getTourPageKey(pathname: string): string {
  if (pathname === '/') return 'main';
  // Use the first path segment as the page key (e.g. /sales/foo -> sales)
  const segment = pathname.split('/').filter(Boolean)[0];
  return segment || 'main';
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { personaName, selectedAgent, setSelectedAgent, currentRole, showTour, setShowTour } = useApp();
  const { rightPaneOpen, setRightPaneOpen } = useUILayout();

  // Product tour disabled — it hijacks navigation and intercepts clicks globally.
  // To re-enable, restore the per-page auto-show logic that was here.
  useEffect(() => {
    setShowTour(false);
  }, [location]);

  const tourSteps = getTourStepsForRole(currentRole);

  const handleTourComplete = useCallback(() => {
    const pageKey = getTourPageKey(location);
    localStorage.setItem(TOUR_DISMISSED_PREFIX + pageKey, 'true');
    setShowTour(false);
  }, [setShowTour, location]);

  const handleTourSkip = useCallback(() => {
    const pageKey = getTourPageKey(location);
    localStorage.setItem(TOUR_DISMISSED_PREFIX + pageKey, 'true');
    setShowTour(false);
  }, [setShowTour, location]);
  
  const viewConfig = getViewConfig(location);
  const canToggleRightPane = viewConfig === 'data-display' || viewConfig === 'heavy-chat';
  const isAgentsPage = location.startsWith('/agents');

  useEffect(() => {
    setRightPaneOpen(false);
    if (viewConfig !== 'data-display' && viewConfig !== 'heavy-chat') {
      setSelectedAgent(null);
    }
  }, [location]);

  const renderRightPaneContent = () => {
    if (isAgentsPage || selectedAgent) {
      return <AgentConfigPane />;
    }
    return <RightPane />;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {showTour && tourSteps.length > 0 && (
        <ProductTour
          steps={tourSteps}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
      <TopBar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <SubMenuManager />
        
        <div className="flex-1 flex overflow-hidden relative">
          <main className={cn(
            'flex-1 overflow-hidden flex flex-col relative',
            viewConfig === 'chat-only' && 'max-w-4xl mx-auto w-full'
          )}>
            {viewConfig !== 'chat-only' && viewConfig !== 'teambox' && (
              <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-transparent via-transparent to-purple-500/[0.03] dark:to-purple-400/[0.04]" />
            )}
            <div className="relative z-[1] flex flex-col flex-1 overflow-hidden">
              {children}
            </div>
          </main>

          {canToggleRightPane && (
            rightPaneOpen ? (
              <>
                <div className="hidden md:flex flex-col overflow-hidden w-80 lg:w-96 border-l border-border flex-shrink-0">
                  <div className="flex items-center justify-end p-1 border-b border-border">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRightPaneOpen(false)}
                      data-testid="button-close-right-pane"
                    >
                      <ChevronsRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {renderRightPaneContent()}
                  </div>
                </div>
                <div className="fixed inset-0 z-50 bg-background flex flex-col md:hidden">
                  <div className="flex items-center justify-end p-2 border-b border-border">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setRightPaneOpen(false)}
                      data-testid="button-close-right-pane-mobile"
                    >
                      <ChevronsRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {renderRightPaneContent()}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="hidden md:flex flex-col items-center justify-start pt-2 pr-1 gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRightPaneOpen(true)}
                    title={isAgentsPage || selectedAgent ? "Open configuration" : `Discuss with ${personaName}`}
                    data-testid="button-open-right-pane"
                  >
                    <ChevronsLeft className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
