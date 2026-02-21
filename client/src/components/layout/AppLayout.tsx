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

type ViewConfig = 'chat-only' | 'data-display' | 'sub-menu' | 'heavy-chat';

interface AppLayoutProps {
  children: React.ReactNode;
}

function getViewConfig(pathname: string): ViewConfig {
  if (pathname === '/') return 'chat-only';
  if (pathname.startsWith('/agents')) return 'heavy-chat';
  if (pathname.startsWith('/drive') || pathname.startsWith('/insights') || pathname.startsWith('/activity')) {
    return 'data-display';
  }
  if (pathname.startsWith('/work-center') || pathname.startsWith('/settings') || pathname.startsWith('/profile')) {
    return 'sub-menu';
  }
  return 'data-display';
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { rightPaneOpen, setRightPaneOpen } = useApp();
  
  const viewConfig = getViewConfig(location);
  const canToggleRightPane = viewConfig !== 'chat-only';
  const isAgentsPage = location.startsWith('/agents');

  const renderRightPaneContent = () => {
    if (isAgentsPage) {
      return <AgentConfigPane />;
    }
    return <RightPane />;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <TopBar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <SubMenuManager />
        
        <div className="flex-1 flex overflow-hidden relative">
          <main className={cn(
            'flex-1 overflow-hidden flex flex-col relative',
            viewConfig === 'chat-only' && 'max-w-4xl mx-auto w-full'
          )}>
            {viewConfig !== 'chat-only' && (
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
              <div className="flex flex-col items-center justify-start pt-2 pr-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightPaneOpen(true)}
                  title={isAgentsPage ? "Open configuration" : "Open chat"}
                  data-testid="button-open-right-pane"
                >
                  <ChevronsLeft className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
