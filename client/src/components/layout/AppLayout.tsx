import { useLocation } from 'wouter';
import { MessageSquare, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { MobileSidebar } from './MobileSidebar';
import { RightPane } from './RightPane';
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
  const { rightPaneOpen, setMobileChatOpen, setMobileMenuOpen } = useApp();
  
  const viewConfig = getViewConfig(location);
  const showRightPane = viewConfig !== 'chat-only' && rightPaneOpen;

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <TopBar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MobileSidebar />
        
        {/* Main Content */}
        <main className={cn(
          'flex-1 overflow-hidden flex flex-col',
          viewConfig === 'chat-only' && 'max-w-4xl mx-auto w-full'
        )}>
          {children}
        </main>

        {/* Right Pane - Desktop */}
        {showRightPane && (
          <aside className="hidden xl:flex w-80 border-l border-border flex-shrink-0">
            <RightPane />
          </aside>
        )}
      </div>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden flex items-center justify-around p-2 border-t border-border bg-background">
        <Button
          variant="ghost"
          className="flex-1 flex flex-col gap-1 h-auto py-2"
          onClick={() => setMobileChatOpen(true)}
          data-testid="button-mobile-chat"
        >
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Chat</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 flex flex-col gap-1 h-auto py-2"
          onClick={() => setMobileMenuOpen(true)}
          data-testid="button-mobile-menu-bottom"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Menu</span>
        </Button>
      </div>

      {/* Mobile Chat Sheet */}
      <RightPane mode="sheet" />
    </div>
  );
}
