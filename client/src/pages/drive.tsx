import { useState } from 'react';
import { 
  Folder, 
  FileText, 
  Table, 
  Image, 
  Video, 
  Music,
  Grid,
  List,
  Plus,
  MoreVertical,
  Star,
  Share2,
  Trash2,
  Download,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockFiles, formatFileSize, type DriveFile, type FileType } from '@/mocks/files';
import { formatDistanceToNow } from 'date-fns';

const fileIcons: Record<FileType, React.ElementType> = {
  folder: Folder,
  document: FileText,
  spreadsheet: Table,
  image: Image,
  pdf: FileText,
  video: Video,
  audio: Music,
};

const fileColors: Record<FileType, string> = {
  folder: 'text-blue-500',
  document: 'text-blue-600',
  spreadsheet: 'text-green-500',
  image: 'text-purple-500',
  pdf: 'text-red-500',
  video: 'text-pink-500',
  audio: 'text-orange-500',
};

export default function DrivePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  const displayedFiles = mockFiles.filter(f => f.parentId === currentFolder);

  const renderFileItem = (file: DriveFile) => {
    const Icon = fileIcons[file.type];
    const iconColor = fileColors[file.type];

    if (viewMode === 'grid') {
      return (
        <div
          key={file.id}
          className="group relative bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer hover-elevate"
          onClick={() => file.type === 'folder' && setCurrentFolder(file.id)}
          data-testid={`file-item-${file.id}`}
        >
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem data-testid={`menu-download-${file.id}`}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem data-testid={`menu-share-${file.id}`}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem data-testid={`menu-star-${file.id}`}>
                  <Star className="h-4 w-4 mr-2" />
                  {file.starred ? 'Unstar' : 'Star'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" data-testid={`menu-delete-${file.id}`}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
              <Icon className={cn('h-8 w-8', iconColor)} />
            </div>
            <p className="text-sm font-medium text-foreground text-center truncate w-full">{file.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {file.type === 'folder' ? 'Folder' : formatFileSize(file.size || 0)}
            </p>
          </div>
          
          {file.starred && (
            <Star className="absolute top-3 left-3 h-4 w-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
      );
    }

    return (
      <div
        key={file.id}
        className="group flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 cursor-pointer hover-elevate"
        onClick={() => file.type === 'folder' && setCurrentFolder(file.id)}
        data-testid={`file-item-${file.id}`}
      >
        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center">
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(file.updatedAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {file.starred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
          {file.shared && <Users className="h-4 w-4 text-muted-foreground" />}
          <span className="text-xs text-muted-foreground w-16 text-right">
            {file.type === 'folder' ? 'Folder' : formatFileSize(file.size || 0)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem><Download className="h-4 w-4 mr-2" />Download</DropdownMenuItem>
              <DropdownMenuItem><Share2 className="h-4 w-4 mr-2" />Share</DropdownMenuItem>
              <DropdownMenuItem><Star className="h-4 w-4 mr-2" />{file.starred ? 'Unstar' : 'Star'}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">My Files</h1>
          <p className="text-sm text-muted-foreground">
            {displayedFiles.length} {displayedFiles.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            data-testid="button-view-grid"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            data-testid="button-view-list"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button data-testid="button-new-folder">
            <Plus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {displayedFiles.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-foreground">No files found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Upload files or create a folder to get started
              </p>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
                : 'flex flex-col gap-1'
            )}>
              {displayedFiles.map(renderFileItem)}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
