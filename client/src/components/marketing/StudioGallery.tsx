import { useState, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import { Image, Video, FileText, BarChart2, MapPin, Volume2, Download, Play, Palette, Send, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MARKETING_AGENTS,
  getSessionsForAgent,
  timeAgo,
  getArtifactTypeLabel,
  type MarketingArtifact,
  type ArtifactType,
} from '@/lib/marketing-agents';
import SharingPanel from '@/components/marketing/SharingPanel';

interface ArtifactWithContext extends MarketingArtifact {
  agentId: string;
  sessionId: string;
  agentName: string;
  agentAccentColor: string;
}

const artifactTypeIcons: Record<string, typeof Image> = {
  IMAGE: Image,
  VIDEO: Video,
  COPY: FileText,
  SCORE: BarChart2,
  RADAR: MapPin,
  VOICEOVER: Volume2,
};

const typeFilters: { value: ArtifactType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'IMAGE', label: 'Images' },
  { value: 'VIDEO', label: 'Videos' },
  { value: 'COPY', label: 'Copy' },
  { value: 'SCORE', label: 'Scores' },
  { value: 'VOICEOVER', label: 'Voiceovers' },
  { value: 'RADAR', label: 'Radar' },
];

export default function StudioGallery() {
  const [, setLocation] = useLocation();
  const [activeType, setActiveType] = useState<ArtifactType | 'ALL'>('ALL');
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [sendPickerIndex, setSendPickerIndex] = useState<number | null>(null);
  const [sharingArtifact, setSharingArtifact] = useState<ArtifactWithContext | null>(null);
  const sendPickerRef = useRef<HTMLDivElement>(null);

  const allArtifacts = useMemo<ArtifactWithContext[]>(() => {
    const result: ArtifactWithContext[] = [];
    for (const agent of MARKETING_AGENTS) {
      const sessions = getSessionsForAgent(agent.id);
      for (const session of sessions) {
        for (const artifact of session.artifacts) {
          result.push({
            ...artifact,
            agentId: agent.id,
            sessionId: session.id,
            agentName: agent.name,
            agentAccentColor: agent.accentColor,
          });
        }
      }
    }
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, []);

  const filtered = useMemo(() => {
    let items = allArtifacts;
    if (activeType !== 'ALL') {
      items = items.filter(a => a.type === activeType);
    }
    if (activeAgent) {
      items = items.filter(a => a.agentId === activeAgent);
    }
    return items;
  }, [allArtifacts, activeType, activeAgent]);

  const handleResume = (artifact: ArtifactWithContext) => {
    setLocation(`/marketing?tab=agents&agent=${artifact.agentId}&session=${artifact.sessionId}`);
  };

  const handleDownload = (artifact: ArtifactWithContext) => {
    const url = artifact.thumbnailUrl || artifact.dataUrl;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = artifact.title || 'artifact';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasDownloadableUrl = (artifact: ArtifactWithContext) => {
    return !!(artifact.thumbnailUrl || artifact.dataUrl);
  };

  const handleSendToAgent = (artifact: ArtifactWithContext, targetAgentId: string) => {
    setSendPickerIndex(null);
    setLocation(`/marketing?tab=agents&agent=${targetAgentId}&session=new&artifactRef=${artifact.id}`);
  };

  if (allArtifacts.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center h-full" data-testid="empty-state-studio">
        <div className="text-center space-y-3">
          <Palette className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-medium">No artifacts yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Start a conversation with any marketing agent to generate images, videos, copy, and more.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4" data-testid="studio-gallery">
      <div>
        <h2 className="text-lg font-semibold mb-1">Studio Gallery</h2>
        <p className="text-sm text-muted-foreground">All outputs from your marketing agents</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {typeFilters.map(f => (
          <Button
            key={f.value}
            variant={activeType === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveType(f.value)}
            data-testid={`filter-pill-${f.value.toLowerCase()}`}
          >
            {f.label}
          </Button>
        ))}
        <div className="w-px bg-border mx-1" />
        {MARKETING_AGENTS.map(agent => (
          <Button
            key={agent.id}
            variant={activeAgent === agent.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveAgent(activeAgent === agent.id ? null : agent.id)}
            className={cn(activeAgent === agent.id && 'text-white')}
            style={activeAgent === agent.id ? { backgroundColor: agent.accentColor, borderColor: agent.accentColor } : undefined}
            data-testid={`filter-pill-${agent.id}`}
          >
            {agent.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((artifact, index) => {
          const ArtIcon = artifactTypeIcons[artifact.type] || FileText;
          return (
            <div
              key={artifact.id}
              className="rounded-xl border border-border overflow-hidden hover-elevate"
              data-testid={`artifact-card-${index}`}
            >
              <div className="h-32 bg-muted/30 flex items-center justify-center overflow-hidden">
                {artifact.type === 'IMAGE' && artifact.thumbnailUrl ? (
                  <img src={artifact.thumbnailUrl} alt={artifact.title} className="w-full h-full object-cover" />
                ) : artifact.type === 'VIDEO' && artifact.thumbnailUrl ? (
                  <img src={artifact.thumbnailUrl} alt={artifact.title} className="w-full h-full object-cover" />
                ) : artifact.type === 'SCORE' && artifact.data?.scoreData ? (
                  <div className="flex flex-col items-center justify-center">
                    <span
                      className="text-3xl font-bold"
                      style={{
                        color: artifact.data.scoreData.overall_score >= 75
                          ? '#22c55e'
                          : artifact.data.scoreData.overall_score >= 50
                            ? '#f59e0b'
                            : '#ef4444',
                      }}
                    >
                      {artifact.data.scoreData.overall_score}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-1">Score</span>
                  </div>
                ) : artifact.type === 'COPY' && artifact.data?.text ? (
                  <p className="text-[11px] text-muted-foreground text-center px-3 line-clamp-4 leading-relaxed">
                    {artifact.data.text}
                  </p>
                ) : (
                  <ArtIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              <div className="p-3 space-y-2">
                <p className="text-sm font-medium truncate">{artifact.title}</p>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[9px] uppercase">
                    {getArtifactTypeLabel(artifact.type)}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: artifact.agentAccentColor }}
                    />
                    <span className="text-[10px] text-muted-foreground">{artifact.agentName}</span>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground">{timeAgo(artifact.createdAt)}</p>

                <div className="flex items-center gap-1 pt-1 relative">
                  {hasDownloadableUrl(artifact) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(artifact)}
                      data-testid={`btn-download-${index}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleResume(artifact)}
                    data-testid={`btn-resume-${index}`}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSharingArtifact(artifact)}
                    data-testid={`btn-share-${index}`}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSendPickerIndex(sendPickerIndex === index ? null : index)}
                    data-testid={`btn-send-${index}`}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  {sendPickerIndex === index && (
                    <div
                      ref={sendPickerRef}
                      className="absolute bottom-full right-0 mb-1 bg-popover border border-border rounded-lg shadow-lg p-2 z-50 min-w-[160px]"
                      data-testid={`send-picker-${index}`}
                    >
                      <p className="text-[10px] text-muted-foreground mb-1.5 px-1 font-medium">Send to Agent</p>
                      {MARKETING_AGENTS.filter(a => a.id !== artifact.agentId).map(agent => (
                        <button
                          key={agent.id}
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-accent/50 transition-colors text-left"
                          onClick={() => handleSendToAgent(artifact, agent.id)}
                          data-testid={`send-to-${agent.id}-${index}`}
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: agent.accentColor }}
                          />
                          <span className="text-xs">{agent.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <SharingPanel
        artifact={sharingArtifact}
        open={!!sharingArtifact}
        onClose={() => setSharingArtifact(null)}
      />
    </div>
  );
}
