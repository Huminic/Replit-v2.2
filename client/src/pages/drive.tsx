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
  Users,
  Mail,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockFiles, formatFileSize, type DriveFile, type FileType } from '@/mocks/files';
import { formatDistanceToNow } from 'date-fns';
import { FavoritesBar } from '@/components/layout/FavoritesBar';
import { MobileNavDropdown } from '@/components/layout/MobileNavDropdown';

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
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareFile, setShareFile] = useState<DriveFile | null>(null);
  const [shareMethod, setShareMethod] = useState<'email' | 'sms'>('email');
  const [shareInput, setShareInput] = useState('');
  const [copied, setCopied] = useState(false);

  const displayedFiles = mockFiles.filter(f => f.parentId === currentFolder);

  const handleShare = (file: DriveFile) => {
    setShareFile(file);
    setShareModalOpen(true);
    setShareInput('');
    setCopied(false);
  };

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderFileItem = (file: DriveFile) => {
    const Icon = fileIcons[file.type];
    const iconColor = fileColors[file.type];

    if (viewMode === 'grid') {
      return (
        <div
          key={file.id}
          className="group relative bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer hover-elevate"
          onClick={() => {
            if (file.type === 'folder') {
              setCurrentFolder(file.id);
            } else {
              toast({ title: 'File preview', description: `Opening "${file.name}" preview.` });
            }
          }}
          data-testid={`file-item-${file.id}`}
        >
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 invisible group-hover:visible"
              onClick={(e) => { e.stopPropagation(); handleShare(file); }}
              data-testid={`share-btn-${file.id}`}
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            <div className="invisible group-hover:visible">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}>
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toast({ title: 'Download started', description: `${file.name} is downloading.` })} data-testid={`menu-download-${file.id}`}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare(file)} data-testid={`menu-share-${file.id}`}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast({ title: file.starred ? 'Unstarred' : 'Starred', description: `${file.name} has been ${file.starred ? 'removed from' : 'added to'} favorites.` })} data-testid={`menu-star-${file.id}`}>
                    <Star className="h-4 w-4 mr-2" />
                    {file.starred ? 'Unstar' : 'Star'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => toast({ title: 'File deleted', description: `${file.name} has been removed.` })} data-testid={`menu-delete-${file.id}`}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
        onClick={() => {
          if (file.type === 'folder') {
            setCurrentFolder(file.id);
          } else {
            toast({ title: 'File preview', description: `Opening "${file.name}" preview.` });
          }
        }}
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 invisible group-hover:visible"
            onClick={(e) => { e.stopPropagation(); handleShare(file); }}
            data-testid={`share-btn-${file.id}`}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 invisible group-hover:visible" onClick={e => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast({ title: 'Download started', description: `${file.name} is downloading.` })}><Download className="h-4 w-4 mr-2" />Download</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare(file)}><Share2 className="h-4 w-4 mr-2" />Share</DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({ title: file.starred ? 'Unstarred' : 'Starred', description: `${file.name} has been ${file.starred ? 'removed from' : 'added to'} favorites.` })}><Star className="h-4 w-4 mr-2" />{file.starred ? 'Unstar' : 'Star'}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => toast({ title: 'File deleted', description: `${file.name} has been removed.` })}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
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
          <Button onClick={() => toast({ title: 'New folder', description: 'Folder creation is not available in demo mode.' })} data-testid="button-new-folder">
            <Plus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        </div>
      </div>

      <div className="px-4 py-2 border-b border-border flex items-center">
        <MobileNavDropdown currentPath="/drive" currentLabel="Drive" />
        <FavoritesBar currentPath="/drive" currentLabel="Drive" />
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

      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="sm:max-w-md" data-testid="share-modal">
          <DialogHeader>
            <DialogTitle>Share File</DialogTitle>
            <DialogDescription>
              {shareFile ? `Share "${shareFile.name}" via email or SMS` : 'Share this file'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Tabs value={shareMethod} onValueChange={(v) => setShareMethod(v as 'email' | 'sms')}>
              <TabsList className="w-full">
                <TabsTrigger value="email" className="flex-1 gap-2" data-testid="share-tab-email">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="sms" className="flex-1 gap-2" data-testid="share-tab-sms">
                  <MessageCircle className="h-4 w-4" />
                  SMS
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Input
              placeholder={shareMethod === 'email' ? 'Enter email address' : 'Enter phone number'}
              value={shareInput}
              onChange={e => setShareInput(e.target.value)}
              data-testid="input-share-recipient"
            />

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex-1 text-xs text-muted-foreground truncate font-mono">
                https://nexxus.connect/share/{shareFile?.id || '...'}
              </div>
              <Button size="sm" variant="outline" onClick={handleCopyLink} data-testid="button-copy-link">
                {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>

            <Button className="w-full" disabled={!shareInput} onClick={() => { toast({ title: 'Share sent', description: `${shareMethod === 'email' ? 'Email' : 'SMS'} sent to ${shareInput}.` }); setShareModalOpen(false); }} data-testid="button-send-share">
              <Share2 className="h-4 w-4 mr-2" />
              Send {shareMethod === 'email' ? 'Email' : 'SMS'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
