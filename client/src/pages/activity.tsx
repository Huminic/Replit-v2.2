import { useState } from 'react';
import { 
  User, 
  Bot, 
  Server, 
  Filter,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockActivityFeed, getActivityColor, type ActivityType } from '@/mocks/activity';
import { formatDistanceToNow } from 'date-fns';
import { FavoritesBar } from '@/components/layout/FavoritesBar';

const filterOptions: { id: ActivityType | 'all'; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All Activity', icon: Filter },
  { id: 'user', label: 'User Activity', icon: User },
  { id: 'agent', label: 'Agent Activity', icon: Bot },
  { id: 'system', label: 'System Activity', icon: Server },
];

export default function ActivityPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActivity = mockActivityFeed.filter(item => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch = 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.target.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'user': return User;
      case 'agent': return Bot;
      case 'system': return Server;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">Activity</h1>
        <p className="text-sm text-muted-foreground">Track all system activity and events</p>
      </div>

      <div className="flex items-center gap-4 p-4 border-b border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activity..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-activity"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" data-testid="button-filter-activity">
              <Filter className="h-4 w-4" />
              {filterOptions.find(f => f.id === filter)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {filterOptions.map((option) => {
              const Icon = option.icon;
              return (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => setFilter(option.id)}
                  className={cn(filter === option.id && 'bg-accent')}
                  data-testid={`filter-${option.id}`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {option.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-4 py-2 border-b border-border flex items-center">
        <FavoritesBar currentPath="/activity" currentLabel="Activity" />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredActivity.length > 0 ? (
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {filteredActivity.map((item) => {
                  const Icon = getActivityIcon(item.type);
                  return (
                    <div key={item.id} className="relative flex gap-4 cursor-pointer hover-elevate rounded-lg p-2 -ml-2" onClick={() => toast({ title: item.description, description: `${item.actor} → ${item.target}` })} data-testid={`activity-row-${item.id}`}>
                      <Avatar className={cn('h-10 w-10 flex-shrink-0 z-10', getActivityColor(item.type))}>
                        <AvatarFallback className="text-white">
                          <Icon className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-foreground">{item.description}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">{item.actor}</span>
                              <span className="text-xs text-muted-foreground">→</span>
                              <span className="text-xs text-muted-foreground">{item.target}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {item.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        {item.metadata && (
                          <div className="flex gap-2 mt-2">
                            {Object.entries(item.metadata).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-[10px]">
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No activity found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Try adjusting your filters or search query
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
