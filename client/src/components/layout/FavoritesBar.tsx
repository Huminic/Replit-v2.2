import { useLocation } from 'wouter';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  return (
    <div className="flex items-center gap-2 ml-auto">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleToggleFavorite}
        data-testid="button-toggle-favorite"
      >
        <Star className={cn(
          "h-4 w-4",
          isCurrentFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
        )} />
      </Button>
      {favorites.length > 0 && (
        <div className="flex items-center gap-1 border-l border-border pl-2">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs group cursor-pointer hover-elevate",
                fav.path === currentPath ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
              <span 
                className="truncate max-w-24"
                onClick={() => setLocation(fav.path)}
                data-testid={`favorite-link-${fav.id}`}
              >
                {fav.label}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFavorite(fav.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                data-testid={`favorite-remove-${fav.id}`}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
