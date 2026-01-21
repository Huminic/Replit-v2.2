import { useRef, type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';

interface SubMenuPanelProps {
  panelId: string;
  title: string;
  headerActions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SubMenuPanel({ panelId, title, headerActions, children, className }: SubMenuPanelProps) {
  const { 
    activePanel, 
    subMenuExpanded, 
    setActivePanel, 
    setSubMenuExpanded,
    setPanelHovered 
  } = useApp();
  
  const panelLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const isPanelVisible = activePanel === panelId || subMenuExpanded;

  const handleCollapsePanel = () => {
    setSubMenuExpanded(false);
    setActivePanel(null);
  };

  const handlePanelMouseEnter = () => {
    if (panelLeaveTimeoutRef.current) {
      clearTimeout(panelLeaveTimeoutRef.current);
      panelLeaveTimeoutRef.current = null;
    }
    setPanelHovered(true);
  };

  const handlePanelMouseLeave = () => {
    setPanelHovered(false);
    if (!subMenuExpanded) {
      panelLeaveTimeoutRef.current = setTimeout(() => {
        setActivePanel(null);
      }, 150);
    }
  };

  if (!isPanelVisible) {
    return null;
  }

  return (
    <aside 
      className={cn(
        "flex flex-col border-r border-border bg-card/30 flex-shrink-0 w-72",
        className
      )}
      onMouseEnter={handlePanelMouseEnter}
      onMouseLeave={handlePanelMouseLeave}
    >
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <div className="flex items-center gap-1">
            {headerActions}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCollapsePanel}
              data-testid={`button-collapse-${panelId}-panel`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {children}
      </ScrollArea>
    </aside>
  );
}
