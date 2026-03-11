import { Share2, Link2, Download, Check } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getArtifactTypeLabel, type MarketingArtifact } from '@/lib/marketing-agents';

export interface ArtifactWithContext extends MarketingArtifact {
  agentName?: string;
  agentAccentColor?: string;
}

interface SharingPanelProps {
  artifact: ArtifactWithContext | null;
  open: boolean;
  onClose: () => void;
}

export default function SharingPanel({ artifact, open, onClose }: SharingPanelProps) {
  const { toast } = useToast();
  const [linkCopied, setLinkCopied] = useState(false);

  if (!artifact) return null;

  const shareUrl = `${window.location.origin}/shared/artifact/${artifact.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setLinkCopied(true);
      toast({ title: 'Link copied', description: 'Shareable link copied to clipboard' });
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const url = artifact.thumbnailUrl || artifact.dataUrl;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = artifact.title || 'artifact';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasDownloadableUrl = !!(artifact.thumbnailUrl || artifact.dataUrl);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md" data-testid="sharing-panel">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share Artifact
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border overflow-hidden bg-muted/20">
            {artifact.type === 'IMAGE' && artifact.thumbnailUrl ? (
              <img src={artifact.thumbnailUrl} alt={artifact.title} className="w-full max-h-[200px] object-contain" />
            ) : artifact.type === 'VIDEO' && artifact.thumbnailUrl ? (
              <img src={artifact.thumbnailUrl} alt={artifact.title} className="w-full max-h-[200px] object-contain" />
            ) : (
              <div className="flex items-center justify-center p-6 gap-3">
                <Badge variant="outline" className="text-xs">{getArtifactTypeLabel(artifact.type)}</Badge>
                <span className="text-sm font-medium">{artifact.title}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Shareable Link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs truncate" data-testid="text-share-url">
                {shareUrl}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                data-testid="btn-copy-link"
              >
                {linkCopied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Link2 className="h-3.5 w-3.5 mr-1.5" />}
                {linkCopied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          {hasDownloadableUrl && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDownload}
              data-testid="btn-share-download"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Artifact
            </Button>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Social Preview</p>
            <div
              className="rounded-lg border border-border overflow-hidden"
              data-testid="social-preview-card"
            >
              {(artifact.type === 'IMAGE' || artifact.type === 'VIDEO') && artifact.thumbnailUrl ? (
                <img src={artifact.thumbnailUrl} alt={artifact.title} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-muted/30 flex items-center justify-center">
                  <Badge variant="outline">{getArtifactTypeLabel(artifact.type)}</Badge>
                </div>
              )}
              <div className="p-3 space-y-1.5">
                <p className="text-sm font-semibold truncate">{artifact.title}</p>
                {artifact.agentName && (
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: artifact.agentAccentColor || 'hsl(var(--primary))' }}
                    />
                    <span className="text-[10px] text-muted-foreground">{artifact.agentName}</span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">Created with Nexxus Connect</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
