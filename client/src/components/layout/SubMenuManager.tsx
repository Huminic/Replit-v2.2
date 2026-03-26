/**
 * @component SubMenuManager
 * @description Flyout sub-menu panel (280px wide) that appears when hovering/pinning sidebar items.
 * Shows section-specific navigation links, agent lists with chevron-expand for conversation history.
 *
 * Positioned fixed at left-16 (next to 72px sidebar), fills full height below TopBar (top-14).
 *
 * Panel cases per sidebar section:
 *   - ai-chat: Favorites list + chat history + artifacts placeholder
 *   - teambox: Conversation/task/workflow navigation + quick filters (open/automated/followup)
 *   - my-work: Assistant/dashboard/tasks/chat tab links
 *   - sales/service/marketing: Tab navigation + agent list with expandable conversations
 *   - management: Insights/hunches/activities/user-chats/billing navigation
 *   - system: Settings items filtered by currentRole RBAC
 *   - profile: User info + profile/preferences/billing links
 *
 * @features
 *   - renderAgentList: Agents with chevron-expand button to show conversation history.
 *     Clicking a conversation navigates to TeamBox. Active (non-closed) count shown in badge.
 *   - toggleAgentExpanded / expandedAgents: Local state for agent conversation expand/collapse
 *   - agentSearch: Filter agents by name within each department panel
 *   - 1200ms mouseLeave delay prevents flicker when moving between sidebar and panel
 *
 * @see Sidebar.tsx — triggers this panel via activePanel state
 * @see AppContext.tsx — provides activePanel, subMenuExpanded, panelHovered
 * @production Conversations and agents wired to backend API via useQuery
 */
import { useRef, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Bot, Search, Star, BarChart3, Target,
  Calendar as CalendarIcon, Lightbulb, Activity, User as UserIcon,
  Settings, Wrench, BookOpen, Zap, CreditCard, ChevronLeft,
  MessageSquare, LayoutDashboard, CheckSquare,
  Building2, Bell, Palette,
  Megaphone, Users, DollarSign, ExternalLink, Inbox,
  ChevronDown, ChevronRight, X,
  Smartphone, Mail, Phone, Video
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useApp } from '@/contexts/AppContext';
import { useUILayout } from '@/contexts/UILayoutContext';
import { getAgentStatusColor } from '@/lib/agent-utils';
import { canAccessSystem } from '@/lib/rbac';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Play, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Agent, Conversation } from '@shared/schema';
import { MARKETING_AGENTS } from '@/lib/marketing-agents';

export function SubMenuManager() {
  const [location, setLocation] = useLocation();
  const {
    currentUser,
    currentRole,
    selectedAgent,
    setSelectedAgent,
    favorites,
    removeFavorite,
    currentOrganization
  } = useApp();
  const {
    activePanel,
    subMenuExpanded,
    setActivePanel,
    setSubMenuExpanded,
    setPanelHovered
  } = useUILayout();
  const orgId = currentOrganization?.id;
  
  const panelLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoRevertTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [agentSearch, setAgentSearch] = useState('');
  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({});

  const { data: allConversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations', orgId],
  });

  const { data: chatHistory = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations?channel=ai-chat', orgId],
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations?channel=ai-chat'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations?channel=ai-assistant'] });
    },
  });

  const { data: salesAgents = [] } = useQuery<Agent[]>({
    queryKey: ['/api/agents?department=sales', orgId],
  });

  const { data: serviceAgents = [] } = useQuery<Agent[]>({
    queryKey: ['/api/agents?department=service', orgId],
  });

  const { data: marketingAgents = [] } = useQuery<Agent[]>({
    queryKey: ['/api/agents?department=marketing', orgId],
  });

  // Auto-close sub-menu on window resize below 1024px (prevents layout breakage on mobile)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && subMenuExpanded) {
        setSubMenuExpanded(false);
        setActivePanel(null);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [subMenuExpanded, setSubMenuExpanded, setActivePanel]);

  useEffect(() => {
    return () => {
      if (panelLeaveTimeoutRef.current) clearTimeout(panelLeaveTimeoutRef.current);
      if (autoRevertTimeoutRef.current) clearTimeout(autoRevertTimeoutRef.current);
    };
  }, []);

  const resetAutoRevert = () => {
    if (autoRevertTimeoutRef.current) clearTimeout(autoRevertTimeoutRef.current);
    if (subMenuExpanded) {
      autoRevertTimeoutRef.current = setTimeout(() => {
        setSubMenuExpanded(false);
      }, 60000);
    }
  };

  useEffect(() => {
    if (subMenuExpanded) {
      resetAutoRevert();
    } else {
      if (autoRevertTimeoutRef.current) {
        clearTimeout(autoRevertTimeoutRef.current);
        autoRevertTimeoutRef.current = null;
      }
    }
  }, [subMenuExpanded]);
  
  const isVisible = activePanel !== null || subMenuExpanded;

  // Close/unpin the sub-menu panel
  const handleCollapsePanel = () => {
    setSubMenuExpanded(false);
    setActivePanel(null);
  };

  // Cancel any pending close timeout when mouse enters the panel
  const handlePanelMouseEnter = () => {
    if (panelLeaveTimeoutRef.current) {
      clearTimeout(panelLeaveTimeoutRef.current);
      panelLeaveTimeoutRef.current = null;
    }
    setPanelHovered(true);
  };

  // Start close timeout when mouse leaves the panel (unless pinned)
  const handlePanelMouseLeave = (e: React.MouseEvent) => {
    const relatedTarget = e.relatedTarget;
    const panel = e.currentTarget as HTMLElement;
    
    if (relatedTarget && relatedTarget instanceof Node && panel.contains(relatedTarget)) {
      return;
    }
    
    setPanelHovered(false);
    if (!subMenuExpanded) {
      panelLeaveTimeoutRef.current = setTimeout(() => {
        setActivePanel(null);
      }, 2000);
    }
  };

  // Resolves which panel content to render based on activePanel or current route
  const getCurrentPanelId = () => {
    if (activePanel) return activePanel;
    if (location === '/') return 'ai-chat';
    if (location.startsWith('/teambox')) return 'teambox';
    if (location.startsWith('/my-work')) return 'my-work';
    if (location.startsWith('/sales')) return 'sales';
    if (location.startsWith('/service')) return 'service';
    if (location.startsWith('/marketing')) return 'marketing';
    if (location.startsWith('/management')) return 'management';
    if (location.startsWith('/agents')) return 'sales';
    if (location.startsWith('/insights')) return 'management';
    if (location.startsWith('/settings')) return 'system';
    if (location.startsWith('/profile')) return 'profile';
    return null;
  };

  const panelId = getCurrentPanelId();

  if (!isVisible || !panelId) {
    return null;
  }

  // Reusable nav item renderer — shows icon, label, optional badge (e.g. conversation count)
  const renderNavItem = (item: { id: string; label: string; icon: React.ElementType; path?: string; onClick?: () => void; active?: boolean; badge?: string; comingSoon?: boolean }) => {
    const Icon = item.icon;
    if (item.comingSoon) {
      return (
        <div
          key={item.id}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground/50 cursor-not-allowed"
          data-testid={`panel-nav-${item.id}`}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1 text-left">{item.label}</span>
          <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/40 bg-muted/50 px-1.5 py-0.5 rounded" data-testid={`badge-coming-soon-${item.id}`}>Coming Soon</span>
        </div>
      );
    }
    return (
      <button
        key={item.id}
        onClick={item.onClick || (() => item.path && setLocation(item.path))}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover-elevate",
          item.active && 'bg-accent text-foreground'
        )}
        data-testid={`panel-nav-${item.id}`}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && <Badge variant="secondary" className="h-5 text-[10px]">{item.badge}</Badge>}
      </button>
    );
  };

  // Toggle chevron expand/collapse for an agent's conversation history
  const toggleAgentExpanded = (agentId: string) => {
    setExpandedAgents(prev => ({ ...prev, [agentId]: !prev[agentId] }));
  };

  const getAgentConversations = (agentId: string) => {
    return allConversations.filter(c => c.agentId === agentId);
  };

  /**
   * Renders agent list for a department with search filter and chevron-expand conversation history.
   * Each agent shows: avatar, name, status dot, expand button with active conversation count badge.
   * Expanded view shows conversation list with customer name, AI badge (if automated), unread dot.
   * Clicking a conversation navigates to TeamBox.
   */
  const renderAgentList = (department: 'sales' | 'service' | 'marketing') => {
    const agentMap = { sales: salesAgents, service: serviceAgents, marketing: marketingAgents };
    const deptAgents = agentMap[department];
    const searched = agentSearch.trim()
      ? deptAgents.filter(a => a.name.toLowerCase().includes(agentSearch.toLowerCase()))
      : deptAgents;
    
    return (
      <div className="border-t border-border mt-2 pt-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Agents</p>
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={agentSearch}
            onChange={(e) => setAgentSearch(e.target.value)}
            placeholder="Search agents..."
            className="h-7 pl-7 text-xs"
            data-testid="input-agent-search"
          />
        </div>
        {searched.map((agent) => {
          const agentConvos = getAgentConversations(agent.id);
          const isExpanded = expandedAgents[agent.id] || false;
          const activeConvoCount = agentConvos.filter(c => c.status !== 'closed').length;

          return (
            <div key={agent.id}>
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setSelectedAgent(agent);
                    setLocation('/agents');
                    if (!subMenuExpanded) {
                      setActivePanel(null);
                    }
                  }}
                  className={cn(
                    'flex-1 text-left p-2 rounded-md transition-colors hover-elevate',
                    selectedAgent?.id === agent.id ? 'bg-accent' : 'hover:bg-accent/50'
                  )}
                  data-testid={`panel-agent-${agent.id}`}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-[10px]">
                        <Bot className="h-3 w-3" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
                        <div className={cn('w-1.5 h-1.5 rounded-full', getAgentStatusColor(agent.status))} />
                      </div>
                    </div>
                  </div>
                </button>
                {agentConvos.length > 0 && (
                  <button
                    onClick={() => toggleAgentExpanded(agent.id)}
                    className="p-1.5 rounded-md hover:bg-accent/50 transition-colors flex-shrink-0"
                    data-testid={`button-expand-agent-${agent.id}`}
                    title={isExpanded ? 'Hide conversations' : `Show ${activeConvoCount} conversation${activeConvoCount !== 1 ? 's' : ''}`}
                  >
                    <div className="flex items-center gap-0.5">
                      {activeConvoCount > 0 && (
                        <Badge variant="secondary" className="h-4 min-w-4 text-[9px] px-1">
                          {activeConvoCount}
                        </Badge>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                )}
              </div>

              {isExpanded && agentConvos.length > 0 && (
                <div className="ml-6 pl-2 border-l-2 border-border/50 space-y-0.5 pb-1">
                  {agentConvos.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => setLocation('/teambox')}
                      className="w-full text-left p-1.5 rounded-md hover:bg-accent/50 transition-colors group"
                      data-testid={`agent-convo-${convo.id}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-foreground truncate flex-1">
                          {convo.customerName}
                        </span>
                        {convo.status === 'automated' && (
                          <Badge variant="outline" className="h-3.5 text-[8px] px-1 border-purple-300 text-purple-600 dark:text-purple-400">
                            AI
                          </Badge>
                        )}
                        {convo.unreadCount > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      {convo.lastMessageAt && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {formatDistanceToNow(new Date(convo.lastMessageAt), { addSuffix: true })}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Renders the appropriate panel content based on the current panelId
  const renderPanelContent = () => {
    switch (panelId) {
      case 'ai-chat':
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Star className="h-4 w-4 text-amber-500" />
                  Favorites
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-chat-panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {favorites.length > 0 ? (
              <div className="p-2 flex flex-col gap-0.5">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="group w-full flex items-center gap-2 p-2 rounded-md transition-colors hover-elevate"
                    data-testid={`panel-favorite-${fav.id}`}
                  >
                    <button
                      onClick={() => setLocation(fav.path)}
                      className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      data-testid={`panel-favorite-link-${fav.id}`}
                    >
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate">{fav.label}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFavorite(fav.id); }}
                      className="invisible group-hover:visible flex-shrink-0 p-0.5 rounded text-muted-foreground/60 transition-colors"
                      title="Remove favorite"
                      data-testid={`panel-favorite-remove-${fav.id}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground px-3 py-2">Star pages to access them quickly</p>
            )}
            <div className="border-t border-border">
              <div className="p-3 border-b border-border">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Chat History
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 flex flex-col gap-0.5">
                  {chatHistory.length > 0 ? chatHistory.map((conv) => (
                    <div
                      key={conv.id}
                      role="button"
                      tabIndex={0}
                      className="group relative w-full text-left p-2 rounded-md transition-colors hover-elevate cursor-pointer"
                      onClick={() => setLocation('/')}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLocation('/'); } }}
                      data-testid={`panel-conversation-${conv.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-foreground truncate flex-1">{conv.customerName || 'Chat'}</p>
                        <div className="flex items-center gap-1">
                          {conv.unreadCount > 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()} data-testid={`button-conv-menu-${conv.id}`}>
                                <MoreVertical className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="bottom" className="w-36">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation('/'); }} data-testid={`menu-resume-${conv.id}`}>
                                <Play className="h-3.5 w-3.5 mr-2" /> Resume
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); deleteConversationMutation.mutate(conv.id); }} data-testid={`menu-delete-${conv.id}`}>
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {conv.lastMessageAt && (
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground px-2 py-2">No chat history yet</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        );

      case 'teambox': {
        const smsCount = allConversations.filter(c => c.channel === 'sms').length;
        const emailCount = allConversations.filter(c => c.channel === 'email').length;
        const voiceCount = allConversations.filter(c => c.channel === 'voice').length;
        const videoCount = allConversations.filter(c => c.channel === 'video').length;
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">TeamBox</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-teambox-panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Channels</p>
                <nav className="flex flex-col gap-0.5">
                  {renderNavItem({ id: 'tb-sms', label: 'SMS', icon: Smartphone, path: '/teambox?channel=sms', badge: smsCount > 0 ? String(smsCount) : undefined })}
                  {renderNavItem({ id: 'tb-email', label: 'Email', icon: Mail, path: '/teambox?channel=email', badge: emailCount > 0 ? String(emailCount) : undefined })}
                  {renderNavItem({ id: 'tb-phone', label: 'Phone', icon: Phone, path: '/teambox?channel=voice', badge: voiceCount > 0 ? String(voiceCount) : undefined })}
                  {renderNavItem({ id: 'tb-video', label: 'Video', icon: Video, path: '/teambox?channel=video', badge: videoCount > 0 ? String(videoCount) : undefined })}
                </nav>
              </div>
              <div className="p-2 border-t border-border">
                <nav className="flex flex-col gap-0.5">
                  {renderNavItem({ id: 'tb-tasks', label: 'Tasks', icon: CheckSquare, path: '/teambox?tab=tasks' })}
                </nav>
              </div>
            </ScrollArea>
          </>
        );
      }

      case 'my-work':
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">My Work</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-mywork-panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <nav className="flex flex-col gap-0.5">
                  {renderNavItem({ id: 'mw-dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/my-work', active: location === '/my-work' })}
                  {renderNavItem({ id: 'mw-tasks', label: 'Tasks', icon: CheckSquare, path: '/my-work?tab=tasks' })}
                  {renderNavItem({ id: 'mw-chat', label: 'Chat', icon: MessageSquare, path: '/my-work?tab=chat' })}
                </nav>
              </div>
            </ScrollArea>
          </>
        );

      case 'sales':
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">Sales</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-sales-panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <nav className="flex flex-col gap-0.5">
                  {renderNavItem({ id: 'sl-dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/sales', active: location === '/sales' })}
                  {renderNavItem({ id: 'sl-agents', label: 'Agents', icon: Bot, path: '/sales?tab=agents' })}
                  {renderNavItem({ id: 'sl-insights', label: 'Insights', icon: BarChart3, path: '/sales?tab=insights' })}
                  {renderNavItem({ id: 'sl-calendar', label: 'Calendar', icon: CalendarIcon, path: '/sales?tab=calendar' })}
                </nav>
                {renderAgentList('sales')}
              </div>
            </ScrollArea>
          </>
        );

      case 'service':
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">Service</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-service-panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <nav className="flex flex-col gap-0.5">
                  {renderNavItem({ id: 'sv-campaigns', label: 'Campaigns', icon: Megaphone, path: '/service', active: location === '/service' })}
                  {renderNavItem({ id: 'sv-agents', label: 'Agents', icon: Bot, path: '/service?tab=agents' })}
                  {renderNavItem({ id: 'sv-insights', label: 'Insights', icon: BarChart3, path: '/service?tab=insights' })}
                  {renderNavItem({ id: 'sv-calendar', label: 'Calendar', icon: CalendarIcon, path: '/service?tab=calendar' })}
                </nav>
                {renderAgentList('service')}
              </div>
            </ScrollArea>
          </>
        );

      case 'marketing':
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">Marketing</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-marketing-panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <nav className="flex flex-col gap-0.5">
                  {renderNavItem({ id: 'mk-dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/marketing', active: location === '/marketing' })}
                  {renderNavItem({ id: 'mk-studio', label: 'Studio', icon: Palette, path: '/marketing?tab=studio' })}
                  {renderNavItem({ id: 'mk-insights', label: 'Insights', icon: BarChart3, path: '/marketing?tab=insights' })}
                </nav>
                <div className="border-t border-border mt-2 pt-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">AI Agents</p>
                  <div className="flex flex-col gap-0.5">
                    {MARKETING_AGENTS.map((mAgent) => {
                      const MIcon = mAgent.icon;
                      return (
                        <button
                          key={mAgent.id}
                          onClick={() => {
                            setLocation(`/marketing?tab=agents&agent=${mAgent.id}`);
                            if (!subMenuExpanded) {
                              setActivePanel(null);
                            }
                          }}
                          className="flex items-center gap-2 p-2 rounded-md transition-colors hover:bg-accent/50 text-left"
                          data-testid={`panel-marketing-agent-${mAgent.id}`}
                        >
                          <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: mAgent.accentColor + '20' }}>
                            <MIcon className="h-3 w-3" style={{ color: mAgent.accentColor }} />
                          </div>
                          <p className="text-xs font-medium text-foreground truncate">{mAgent.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {renderAgentList('marketing')}
              </div>
            </ScrollArea>
          </>
        );

      case 'management':
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">Management</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-management-panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <nav className="flex flex-col gap-0.5">
                  {renderNavItem({ id: 'mg-insights', label: 'Insights', icon: BarChart3, path: '/management', active: location === '/management' })}
                  {renderNavItem({ id: 'mg-hunches', label: 'Hunches', icon: Lightbulb, path: '/management?tab=hunches' })}
                  {renderNavItem({ id: 'mg-activities', label: 'System Log', icon: Activity, path: '/management?tab=activities' })}
                  {renderNavItem({ id: 'mg-user-chats', label: 'User Chats', icon: MessageSquare, path: '/management?tab=user-chats' })}
                  {renderNavItem({ id: 'mg-billing', label: 'Billing', icon: CreditCard, path: '/management?tab=billing' })}
                </nav>
              </div>
            </ScrollArea>
          </>
        );

      case 'system': {
        const settingsItems = [
          { id: 'users', label: 'Users', icon: Users, desc: 'Manage team members and roles', roles: ['super_admin', 'partner_admin', 'org_admin'], path: '/settings/system?section=users' },
          { id: 'organization', label: 'Organization', icon: Building2, desc: 'Company profile and branding', roles: ['super_admin', 'partner_admin', 'org_admin'], path: '/settings/system?section=organization' },
          { id: 'tools', label: 'Tools & Integrations', icon: Wrench, desc: 'Configure integrations and APIs', roles: ['super_admin', 'partner_admin', 'org_admin'], path: '/settings/system?section=tools' },
          { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, desc: 'Manage knowledge base sources', roles: ['super_admin', 'partner_admin', 'org_admin'], path: '/settings/system?section=knowledge' },
          { id: 'ai', label: 'AI Configuration', icon: Zap, desc: 'AI behavior and configuration', roles: ['super_admin', 'partner_admin'], path: '/settings/system?section=ai' },
          { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Notification preferences', roles: ['super_admin', 'partner_admin', 'org_admin'], path: '/settings/system?section=notifications' },
          { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'Theme and display settings', roles: ['super_admin', 'partner_admin', 'org_admin'], path: '/settings/system?section=appearance' },
          { id: 'billing', label: 'Billing', icon: CreditCard, desc: 'Billing and invoicing', roles: ['super_admin', 'partner_admin'], path: '/settings/billing' },
        ];
        const visibleItems = settingsItems.filter(item => item.roles.includes(currentRole));
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">System Settings</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-system-panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <nav className="flex flex-col gap-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setLocation(item.path)}
                        className="w-full flex items-start gap-2 px-2 py-2 rounded-md text-left hover-elevate"
                        data-testid={`panel-settings-${item.id}`}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </ScrollArea>
          </>
        );
      }

      case 'profile':
        return (
          <>
            <div className="p-3 border-b border-border">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-foreground">Profile</h2>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCollapsePanel} data-testid="button-collapse-profile-panel">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                <div className="flex items-center gap-3 p-3 mb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{currentUser.name}</p>
                    <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                  </div>
                </div>
                <nav className="flex flex-col gap-0.5">
                  {renderNavItem({ id: 'pf-profile', label: 'My Profile', icon: UserIcon, path: '/profile' })}
                  {renderNavItem({ id: 'pf-prefs', label: 'Preferences', icon: Settings, path: '/profile/preferences' })}
                </nav>
              </div>
            </ScrollArea>
          </>
        );

      default:
        return null;
    }
  };

  const handlePanelInteraction = () => {
    if (subMenuExpanded) resetAutoRevert();
  };

  if (subMenuExpanded && isVisible) {
    return (
      <div
        className="relative z-40 w-[280px] border-r border-border bg-background flex-shrink-0 transition-all duration-200"
        onMouseMove={handlePanelInteraction}
        onClick={handlePanelInteraction}
        data-testid="submenu-panel"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {renderPanelContent()}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed left-16 top-14 bottom-0 z-40 w-[280px] border-r border-border bg-background shadow-lg transition-all duration-200',
        isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      )}
      onMouseEnter={handlePanelMouseEnter}
      onMouseLeave={handlePanelMouseLeave}
      data-testid="submenu-panel"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {renderPanelContent()}
      </div>
    </div>
  );
}
