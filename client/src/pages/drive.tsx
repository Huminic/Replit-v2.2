import { useState } from 'react';
import { 
  Folder, 
  FileText, 
  Table, 
  Image, 
  Video, 
  Music,
  Search,
  Grid,
  List,
  Upload,
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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockFiles, mockTemplates, formatFileSize, type DriveFile, type FileType } from '@/mocks/files';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  const displayedFiles = mockFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = file.parentId === currentFolder;
    return matchesSearch && matchesFolder;
  });

  const sharedFiles = mockFiles.filter(f => f.shared);
  const starredFiles = mockFiles.filter(f => f.starred);

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
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Star className="h-4 w-4 mr-2" />
                  {file.starred ? 'Unstar' : 'Star'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-3', 
            file.type === 'folder' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted'
          )}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
          
          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
          <div className="flex items-center gap-2 mt-1">
            {file.size && (
              <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
            )}
            {file.starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
            {file.shared && <Users className="h-3 w-3 text-muted-foreground" />}
          </div>
        </div>
      );
    }

    return (
      <div
        key={file.id}
        className="group flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 cursor-pointer hover-elevate"
        onClick={() => file.type === 'folder' && setCurrentFolder(file.id)}
        data-testid={`file-row-${file.id}`}
      >
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
          file.type === 'folder' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted'
        )}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {file.createdBy} • {formatDistanceToNow(new Date(file.updatedAt), { addSuffix: true })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {file.size && (
            <span className="text-xs text-muted-foreground hidden md:block">{formatFileSize(file.size)}</span>
          )}
          {file.starred && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
          {file.shared && <Badge variant="secondary" className="text-xs">Shared</Badge>}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Drive</h1>
          {currentFolder && (
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto text-muted-foreground"
              onClick={() => setCurrentFolder(null)}
            >
              ← Back to root
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" data-testid="button-upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button size="sm" data-testid="button-new-folder">
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-files"
          />
        </div>
        <div className="flex items-center border border-border rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 rounded-r-none', viewMode === 'grid' && 'bg-accent')}
            onClick={() => setViewMode('grid')}
            data-testid="button-view-grid"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-8 w-8 rounded-l-none', viewMode === 'list' && 'bg-accent')}
            onClick={() => setViewMode('list')}
            data-testid="button-view-list"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="my-files" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 border-b border-border">
          <TabsList className="bg-transparent h-12 p-0">
            <TabsTrigger value="my-files" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              My Files
            </TabsTrigger>
            <TabsTrigger value="shared" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Shared
            </TabsTrigger>
            <TabsTrigger value="starred" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Starred
            </TabsTrigger>
            <TabsTrigger value="templates" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
              Templates
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="my-files" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className={cn(
              'p-4',
              viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'flex flex-col gap-1'
            )}>
              {displayedFiles.length > 0 ? (
                displayedFiles.map(renderFileItem)
              ) : (
                <div className="col-span-full text-center py-12">
                  <Folder className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No files found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="shared" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className={cn(
              'p-4',
              viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'flex flex-col gap-1'
            )}>
              {sharedFiles.map(renderFileItem)}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="starred" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className={cn(
              'p-4',
              viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'flex flex-col gap-1'
            )}>
              {starredFiles.length > 0 ? (
                starredFiles.map(renderFileItem)
              ) : (
                <div className="col-span-full text-center py-12">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No starred files</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="templates" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className={cn(
              'p-4',
              viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4' : 'flex flex-col gap-1'
            )}>
              {mockTemplates.map(renderFileItem)}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
