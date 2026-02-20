import { useLocation } from 'wouter';
import { Star, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface FavoritesBarProps {
  currentPath: string;
  currentLabel: string;
}

export function FavoritesBar({ currentPath, currentLabel }: FavoritesBarProps) {
  const [, setLocation] = useLocation();
  const { favorites, addFavorite, removeFavorite, isFavorite } = useApp();
  
  const isCurrentFavorite = isFavorite(currentPath);

  const handleToggleFavorite = () => {
    if (isCurrentFavorite) {
      const fav = favorites.find(f => f.path === currentPath);
      if (fav) removeFavorite(fav.id);
    } else {
      addFavorite({
        id: `fav-${Date.now()}`,
        label: currentLabel,
        path: currentPath,
      });
    }
  };

  const handleFavClick = (fav: { id: string; path: string }) => {
    if (fav.path === currentPath) {
      removeFavorite(fav.id);
    } else {
      setLocation(fav.path);
    }
  };

  return (
    <div className="flex items-center gap-2 ml-auto">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleFavorite}
        title={isCurrentFavorite ? 'Remove from favorites' : 'Add to favorites'}
        data-testid="button-toggle-favorite"
      >
        <Star className={cn(
          "h-4 w-4",
          isCurrentFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
        )} />
      </Button>

      {favorites.length > 0 && (
        <>
          <div className="hidden md:flex items-center gap-1">
            <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mr-0.5">Favorites</span>
            <div className="w-px h-3 bg-border mr-0.5" />
            {favorites.map((fav) => (
              <Button
                key={fav.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "text-xs gap-1",
                  fav.path === currentPath 
                    ? "text-foreground font-medium" 
                    : "text-muted-foreground"
                )}
                onClick={() => handleFavClick(fav)}
                title={fav.path === currentPath ? 'Click to unfavorite' : `Go to ${fav.label}`}
                data-testid={`favorite-link-${fav.id}`}
              >
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                <span className="truncate max-w-20">{fav.label}</span>
              </Button>
            ))}
          </div>

          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs gap-1" data-testid="button-favorites-dropdown">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{favorites.length}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {favorites.map((fav) => (
                  <DropdownMenuItem
                    key={fav.id}
                    onClick={() => handleFavClick(fav)}
                    className={cn(fav.path === currentPath && "font-medium")}
                    data-testid={`favorite-dropdown-${fav.id}`}
                  >
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-2 flex-shrink-0" />
                    <span className="truncate">{fav.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  );
}
