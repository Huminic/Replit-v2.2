import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Send, Plus, Sparkles, X, Image, Video, FileText, BarChart2, MapPin, Volume2, Download, ExternalLink, ChevronDown, ChevronUp, Play, Copy, Check, ChevronRight, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MARKETING_AGENTS,
  getSessionsForAgent,
  getSession,
  createSession,
  updateSession,
  loadArtifacts,
  timeAgo,
  getArtifactTypeLabel,
  type MarketingAgentDef,
  type AgentSession,
  type AgentChatMessage,
  type MarketingArtifact,
} from '@/lib/marketing-agents';
import { executeToolCall, type ToolExecResult, type AdCopyData, type ScoreCardData, type CompetitorRadarData } from '@/lib/tool-executor';
import SharingPanel from '@/components/marketing/SharingPanel';

interface AgentChatViewProps {
  agentId: string;
  sessionId?: string;
  artifactRef?: string;
  onBack: () => void;
}

const artifactTypeIcons: Record<string, typeof Image> = {
  IMAGE: Image,
  VIDEO: Video,
  COPY: FileText,
  SCORE: BarChart2,
  RADAR: MapPin,
  VOICEOVER: Volume2,
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex-shrink-0"
      data-testid="button-copy-text"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function InlineAdCopy({ data }: { data: AdCopyData }) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const sections = [
    { key: 'headline', label: 'Headlines', icon: '📰' },
    { key: 'body_copy', label: 'Body Copy', icon: '📝' },
    { key: 'social_caption', label: 'Social Captions', icon: '📱' },
    { key: 'email_subject', label: 'Email Subject Lines', icon: '📧' },
    { key: 'google_ad', label: 'Google Ads', icon: '🔍' },
  ];

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mt-3 space-y-1.5" data-testid="inline-ad-copy">
      {sections.map(({ key, label, icon }) => {
        const variations = data.variations?.[key as keyof typeof data.variations];
        if (!variations || variations.length === 0) return null;
        const isExpanded = expandedSections[key] ?? false;
        return (
          <div key={key} className="rounded-lg border border-border overflow-hidden">
            <button
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
              onClick={() => toggleSection(key)}
              data-testid={`toggle-section-${key}`}
            >
              <span className="text-sm">{icon}</span>
              <span className="text-xs font-medium flex-1">{label}</span>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5">{variations.length}</Badge>
              <ChevronRight className={cn('h-3 w-3 text-muted-foreground transition-transform', isExpanded && 'rotate-90')} />
            </button>
            {isExpanded && (
              <div className="border-t border-border">
                {variations.map((text: string, i: number) => (
                  <div
                    key={i}
                    className={cn('flex items-start gap-2 px-3 py-2.5', i > 0 && 'border-t border-border/50')}
                    data-testid={`copy-variation-${key}-${i}`}
                  >
                    <span className="text-[10px] text-muted-foreground font-mono mt-0.5 flex-shrink-0">{i + 1}.</span>
                    <p className="text-xs flex-1 leading-relaxed">{text}</p>
                    <CopyButton text={text} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AnimatedScoreCircle({ score, size = 80 }: { score: number; size?: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1000;
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const color = score < 50 ? '#ef4444' : score < 75 ? '#f59e0b' : score < 90 ? '#06b6d4' : '#22c55e';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }} data-testid="score-circle">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <span className="absolute text-lg font-bold" style={{ color }}>{animatedScore}</span>
    </div>
  );
}

function AnimatedBar({ value, label, feedback, delay = 0 }: { value: number; label: string; feedback: string; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  const color = value < 50 ? 'bg-red-500' : value < 75 ? 'bg-amber-500' : value < 90 ? 'bg-cyan-500' : 'bg-green-500';
  return (
    <div className="space-y-1" data-testid={`score-bar-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium">{label}</span>
        <span className="text-[11px] font-bold" style={{ color: value < 50 ? '#ef4444' : value < 75 ? '#f59e0b' : value < 90 ? '#06b6d4' : '#22c55e' }}>{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-1000 ease-out', color)}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground leading-snug">{feedback}</p>
    </div>
  );
}

function InlineScoreCard({ data }: { data: ScoreCardData }) {
  const publishBanner = data.overall_score >= 75
    ? { text: '✅ PUBLISH READY', bg: 'bg-green-500/10 border-green-500/30', textColor: 'text-green-500' }
    : data.overall_score >= 50
      ? { text: '⚠ NEEDS WORK', bg: 'bg-amber-500/10 border-amber-500/30', textColor: 'text-amber-500' }
      : { text: '❌ NOT READY', bg: 'bg-red-500/10 border-red-500/30', textColor: 'text-red-500' };

  return (
    <div className="mt-3 rounded-lg border border-border overflow-hidden" data-testid="inline-score-card">
      <div className="flex items-center gap-4 p-4">
        <AnimatedScoreCircle score={data.overall_score} />
        <div className="flex-1">
          <div className={cn('inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold mb-2', publishBanner.bg, publishBanner.textColor)}>
            {publishBanner.text}
          </div>
          <p className="text-[11px] text-muted-foreground">Overall effectiveness score based on 5 criteria</p>
        </div>
      </div>
      <div className="border-t border-border p-4 space-y-3">
        <AnimatedBar value={data.visual_appeal} label="Visual Appeal" feedback={data.visual_appeal_feedback} delay={100} />
        <AnimatedBar value={data.subject_clarity} label="Subject Clarity" feedback={data.subject_clarity_feedback} delay={200} />
        <AnimatedBar value={data.lighting_quality} label="Lighting Quality" feedback={data.lighting_quality_feedback} delay={300} />
        <AnimatedBar value={data.text_legibility} label="Text Legibility" feedback={data.text_legibility_feedback} delay={400} />
        <AnimatedBar value={data.ad_effectiveness} label="Ad Effectiveness" feedback={data.ad_effectiveness_feedback} delay={500} />
      </div>
      {data.recommendations?.length > 0 && (
        <div className="border-t border-border p-4">
          <p className="text-[11px] font-semibold mb-2">Recommendations</p>
          <ul className="space-y-1.5">
            {data.recommendations.map((rec: string, i: number) => (
              <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2" data-testid={`recommendation-${i}`}>
                <span className="text-primary mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(clamped);
  const hasHalf = clamped - fullStars >= 0.3;
  const emptyStars = Math.max(0, 5 - fullStars - (hasHalf ? 1 : 0));
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg key={`f${i}`} className="h-3 w-3 fill-amber-400 text-amber-400" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
      ))}
      {hasHalf && (
        <svg className="h-3 w-3 text-amber-400" viewBox="0 0 20 20">
          <defs><linearGradient id="halfStar"><stop offset="50%" stopColor="currentColor"/><stop offset="50%" stopColor="transparent"/></linearGradient></defs>
          <path fill="url(#halfStar)" stroke="currentColor" strokeWidth="1" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg key={`e${i}`} className="h-3 w-3 text-muted-foreground/30" viewBox="0 0 20 20"><path fill="currentColor" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
      ))}
    </div>
  );
}

function InlineCompetitorRadar({ data }: { data: CompetitorRadarData }) {
  return (
    <div className="mt-3 space-y-2" data-testid="inline-competitor-radar">
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="px-3 py-2 bg-[#22c55e]/5 border-b border-border">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" style={{ color: '#22c55e' }} />
            <span className="text-xs font-semibold">{data.searchLocation}</span>
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 ml-auto">{data.competitors.length} found</Badge>
          </div>
        </div>
        {data.competitors.map((comp, i) => (
          <div
            key={i}
            className={cn('flex items-start gap-3 px-3 py-3', i > 0 && 'border-t border-border/50')}
            data-testid={`competitor-card-${i}`}
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
              {comp.rank}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{comp.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <StarRating rating={comp.rating} />
                <span className="text-[10px] text-muted-foreground">{comp.rating.toFixed(1)}</span>
                <span className="text-[10px] text-muted-foreground">({comp.reviewCount.toLocaleString()} reviews)</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{comp.address}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <span className="text-xs font-medium" style={{ color: '#22c55e' }}>{comp.distance} mi</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgentChatView({ agentId, sessionId: initialSessionId, artifactRef, onBack }: AgentChatViewProps) {
  const [, setLocation] = useLocation();
  const agent = MARKETING_AGENTS.find(a => a.id === agentId);
  const [session, setSession] = useState<AgentSession | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolProgress, setToolProgress] = useState<string | null>(null);
  const [visorOpen, setVisorOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<MarketingArtifact | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ file: File; preview: string } | null>(null);
  const [sharingArtifact, setSharingArtifact] = useState<MarketingArtifact | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialSessionId === 'new') {
      const newSession = createSession(agentId);
      if (artifactRef) {
        const allArtifacts = loadArtifacts();
        const referencedArtifact = allArtifacts.find(a => a.id === artifactRef);
        if (referencedArtifact) {
          const contextMessage: AgentChatMessage = {
            id: `msg_${Date.now()}_ctx`,
            role: 'assistant',
            content: `I received an artifact from another agent: **${referencedArtifact.title}** (${getArtifactTypeLabel(referencedArtifact.type)}). How would you like me to work with this?`,
            timestamp: new Date().toISOString(),
            inlineMedia: referencedArtifact.dataUrl && (referencedArtifact.type === 'IMAGE' || referencedArtifact.type === 'VIDEO' || referencedArtifact.type === 'VOICEOVER')
              ? { type: referencedArtifact.type === 'IMAGE' ? 'image' : referencedArtifact.type === 'VIDEO' ? 'video' : 'audio', url: referencedArtifact.dataUrl }
              : undefined,
          };
          const updatedSession = { ...newSession, messages: [contextMessage], artifacts: [referencedArtifact] };
          updateSession(newSession.id, { messages: updatedSession.messages, artifacts: updatedSession.artifacts });
          setSession(updatedSession);
          setVisorOpen(true);
          return;
        }
      }
      setSession(newSession);
      return;
    }
    if (initialSessionId) {
      const existing = getSession(initialSessionId);
      if (existing) {
        setSession(existing);
        return;
      }
    }
    const sessions = getSessionsForAgent(agentId);
    if (sessions.length > 0) {
      setSession(sessions[0]);
    } else {
      setSession(createSession(agentId));
    }
  }, [agentId, initialSessionId, artifactRef]);

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [session?.messages.length, isStreaming, toolProgress]);

  const handleSend = useCallback(async () => {
    if (!input.trim() && !attachedFile) return;
    if (!session || !agent || isStreaming) return;

    const currentAttachedFile = attachedFile;
    const userMessage: AgentChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      attachments: currentAttachedFile ? [{ url: currentAttachedFile.preview, name: currentAttachedFile.file.name, type: currentAttachedFile.file.type }] : undefined,
    };

    const updatedMessages = [...session.messages, userMessage];
    const updated = updateSession(session.id, { messages: updatedMessages });
    if (updated) setSession({ ...updated });
    setInput('');
    setAttachedFile(null);
    setIsStreaming(true);
    setToolProgress(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = '28px';
    }

    try {
      const openaiTools = agent.tools.map(t => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: {
            type: 'object',
            properties: Object.fromEntries(
              Object.entries(t.parameters).map(([key, val]) => [
                key,
                { type: val.type, description: val.description, ...(val.enum ? { enum: val.enum } : {}) },
              ])
            ),
            required: Object.entries(t.parameters).filter(([, v]) => v.required).map(([k]) => k),
          },
        },
      }));

      const systemMsg = { role: 'system' as const, content: agent.systemPrompt };
      const historyMsgs = updatedMessages.map(m => {
        let content = m.content;
        if (m.attachments?.length) {
          content += `\n\n[User attached: ${m.attachments.map(a => a.name).join(', ')}]`;
        }
        if (m.inlineMedia) {
          content += `\n\n[Generated media URL: ${m.inlineMedia.url}]`;
        }
        return { role: m.role as 'user' | 'assistant', content };
      });

      const token = localStorage.getItem('nexxus_access_token');
      const res = await fetch('/api/openai-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [systemMsg, ...historyMsgs],
          tools: openaiTools.length > 0 ? openaiTools : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      const choice = data.choices?.[0];

      if (choice?.message?.tool_calls?.length) {
        const toolCall = choice.message.tool_calls[0];
        let parsedArgs: Record<string, any> = {};
        try { parsedArgs = JSON.parse(toolCall.function.arguments); } catch {}

        const statusMsg: AgentChatMessage = {
          id: `msg_${Date.now()}_status`,
          role: 'assistant',
          content: `Using **${toolCall.function.name.replace(/_/g, ' ')}**...`,
          timestamp: new Date().toISOString(),
          toolCall: { name: toolCall.function.name, args: parsedArgs },
        };
        const withStatus = [...updatedMessages, statusMsg];
        const u1 = updateSession(session.id, { messages: withStatus });
        if (u1) setSession({ ...u1 });

        try {
          const attachedDataUri = currentAttachedFile?.preview;
          const result: ToolExecResult = await executeToolCall(
            toolCall.function.name,
            parsedArgs,
            agentId,
            session.id,
            attachedDataUri,
            (progressMsg) => setToolProgress(progressMsg),
          );

          setToolProgress(null);

          const toolResultMsg: AgentChatMessage = {
            id: `msg_${Date.now()}_result`,
            role: 'assistant',
            content: result.content,
            timestamp: new Date().toISOString(),
            toolCall: { name: toolCall.function.name, args: parsedArgs },
            inlineMedia: result.inlineMedia,
            actionChips: result.actionChips,
            inlineCopyData: result.inlineCopyData,
            inlineScoreData: result.inlineScoreData,
            inlineRadarData: result.inlineRadarData,
          };

          const currentSession = getSession(session.id);
          const latestMessages = currentSession?.messages || withStatus;
          const withResult = [...latestMessages, toolResultMsg];
          const newArtifacts = [...(currentSession?.artifacts || session.artifacts)];
          if (result.artifact) {
            newArtifacts.push(result.artifact);
            setVisorOpen(true);
          }

          const u2 = updateSession(session.id, { messages: withResult, artifacts: newArtifacts });
          if (u2) setSession({ ...u2 });
        } catch (toolErr: any) {
          setToolProgress(null);
          const toolErrMsg: AgentChatMessage = {
            id: `msg_${Date.now()}_terr`,
            role: 'assistant',
            content: `I ran into an issue while executing the tool: ${toolErr.message || 'Unknown error'}. Please try again.`,
            timestamp: new Date().toISOString(),
          };
          const withErr = [...withStatus, toolErrMsg];
          const u2 = updateSession(session.id, { messages: withErr });
          if (u2) setSession({ ...u2 });
        }
      } else {
        const assistantMsg: AgentChatMessage = {
          id: `msg_${Date.now()}_asst`,
          role: 'assistant',
          content: choice?.message?.content || 'I encountered an issue processing your request. Please try again.',
          timestamp: new Date().toISOString(),
        };

        const withAssistant = [...updatedMessages, assistantMsg];
        const u2 = updateSession(session.id, { messages: withAssistant });
        if (u2) setSession({ ...u2 });
      }
    } catch (err) {
      const errorMsg: AgentChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content: 'Sorry, I encountered an error connecting to the AI service. Please try again.',
        timestamp: new Date().toISOString(),
      };
      const withError = [...updatedMessages, errorMsg];
      const u2 = updateSession(session.id, { messages: withError });
      if (u2) setSession({ ...u2 });
    } finally {
      setIsStreaming(false);
      setToolProgress(null);
    }
  }, [input, attachedFile, session, agent, isStreaming, agentId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({ file, preview: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '28px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  };

  const handleChipClick = useCallback((chip: { label: string; icon: string; action: string }, message: AgentChatMessage) => {
    const lastArtifactId = session?.artifacts[session.artifacts.length - 1]?.id;

    const crossAgentRoutes: Record<string, string> = {
      send_to_video: 'video-producer',
      score_image: 'creative-director',
      score_campaign: 'creative-director',
      score_thumbnail: 'creative-director',
      add_voiceover: 'video-producer',
      turn_into_voiceover: 'video-producer',
      pair_with_video: 'video-producer',
    };

    const sameAgentActions = ['generate_variation', 'try_different_bg', 'try_different_tone', 'try_different_voice', 'scan_another_area', 'upload_revised', 'write_copy_anyway', 'regenerate_photo', 'use_as_template'];

    const downloadActions = ['download_mp4', 'download_audio', 'export_report'];

    if (crossAgentRoutes[chip.action]) {
      const targetAgent = crossAgentRoutes[chip.action];
      const artifactParam = lastArtifactId ? `&artifactRef=${lastArtifactId}` : '';
      setLocation(`/marketing?tab=agents&agent=${targetAgent}&session=new${artifactParam}`);
      return;
    }

    if (downloadActions.includes(chip.action)) {
      const lastArtifact = session?.artifacts[session.artifacts.length - 1];
      if (lastArtifact?.dataUrl) {
        const a = document.createElement('a');
        a.href = lastArtifact.dataUrl;
        a.download = lastArtifact.title || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return;
    }

    setInput(chip.label.replace(/^[^\w]+/, ''));
  }, [session, setLocation]);

  const allArtifactsForAgent = getSessionsForAgent(agentId).flatMap(s => s.artifacts);

  if (!agent) return null;

  const AgentIcon = agent.icon;
  const messages = session?.messages ?? [];
  const artifacts = session?.artifacts ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden" data-testid="agent-chat-view">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border flex-shrink-0" data-testid="agent-chat-header">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={onBack}
          data-testid="button-agent-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0')} style={{ backgroundColor: agent.accentColor + '20' }}>
          <AgentIcon className="h-4 w-4" style={{ color: agent.accentColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate" data-testid="text-agent-name">{agent.name}</h2>
          <p className="text-[11px] text-muted-foreground truncate">{agent.description.split('.')[0]}</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className={cn(
              'overflow-hidden transition-all duration-500 ease-in-out border-b border-border',
              visorOpen && artifacts.length > 0 ? 'max-h-[180px] opacity-100' : 'max-h-0 opacity-0 border-b-0'
            )}
            data-testid="agent-visor"
          >
            <div className="px-4 md:px-6 pt-3 pb-2 flex justify-center">
              <div className="w-full max-w-3xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{agent.name} Outputs</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setVisorOpen(false)} data-testid="button-collapse-visor">
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {artifacts.map(art => {
                    const ArtIcon = artifactTypeIcons[art.type] || FileText;
                    return (
                      <button
                        key={art.id}
                        className="flex-shrink-0 w-[120px] rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer overflow-hidden"
                        onClick={() => setSelectedArtifact(art)}
                        data-testid={`artifact-visor-${art.id}`}
                      >
                        {art.type === 'SCORE' && art.data?.scoreData ? (
                          <div className="w-full h-16 flex items-center justify-center" style={{ backgroundColor: art.data.scoreData.overall_score >= 75 ? 'rgba(34,197,94,0.1)' : art.data.scoreData.overall_score >= 50 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)' }}>
                            <span className="text-xl font-bold" style={{ color: art.data.scoreData.overall_score >= 75 ? '#22c55e' : art.data.scoreData.overall_score >= 50 ? '#f59e0b' : '#ef4444' }}>
                              {art.data.scoreData.overall_score}
                            </span>
                          </div>
                        ) : art.type === 'COPY' && art.data?.text ? (
                          <div className="w-full h-16 flex items-center justify-center bg-violet-500/5 px-2">
                            <p className="text-[10px] text-center text-muted-foreground line-clamp-3 leading-snug">{art.data.text}</p>
                          </div>
                        ) : art.thumbnailUrl ? (
                          <img src={art.thumbnailUrl} alt={art.title} className="w-full h-16 object-cover" />
                        ) : (
                          <div className="w-full h-16 flex items-center justify-center bg-muted/30">
                            <ArtIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="px-2 py-1.5">
                          <p className="text-[10px] font-medium truncate">{art.title}</p>
                          <p className="text-[9px] text-muted-foreground">{getArtifactTypeLabel(art.type)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {visorOpen === false && artifacts.length > 0 && (
            <button
              className="flex items-center justify-center gap-1.5 px-4 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors border-b border-border w-full"
              onClick={() => setVisorOpen(true)}
              data-testid="button-expand-visor"
            >
              <ChevronDown className="h-3 w-3" />
              <span>{artifacts.length} output{artifacts.length !== 1 ? 's' : ''}</span>
            </button>
          )}

          <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
            <div className="max-w-3xl mx-auto flex flex-col gap-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
                  data-testid={`chat-message-${message.id}`}
                >
                  <div
                    className={cn(
                      'rounded-2xl px-5 py-4 max-w-[80%]',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border'
                    )}
                  >
                    {message.attachments?.map((att, i) => (
                      <div key={i} className="mb-2">
                        {att.type.startsWith('image/') ? (
                          <img src={att.url} alt={att.name} className="max-w-[200px] rounded-lg" />
                        ) : (
                          <div className="flex items-center gap-2 text-xs opacity-80">
                            <FileText className="h-3 w-3" />
                            <span>{att.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {message.toolCall && (
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: agent.accentColor, color: agent.accentColor }}>
                          {message.toolCall.name.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.inlineMedia && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-border/50">
                        {message.inlineMedia.type === 'image' && (
                          <img
                            src={message.inlineMedia.url}
                            alt="Generated"
                            className="w-full max-h-[400px] object-contain bg-muted/20 cursor-pointer"
                            onClick={() => {
                              const art = session?.artifacts.find(a => a.dataUrl === message.inlineMedia?.url);
                              if (art) setSelectedArtifact(art);
                            }}
                            data-testid={`inline-image-${message.id}`}
                          />
                        )}
                        {message.inlineMedia.type === 'video' && (
                          <video
                            src={message.inlineMedia.url}
                            controls
                            autoPlay
                            loop
                            className="w-full max-h-[400px]"
                            data-testid={`inline-video-${message.id}`}
                          />
                        )}
                        {message.inlineMedia.type === 'audio' && (
                          <div className="p-4">
                            <audio
                              src={message.inlineMedia.url}
                              controls
                              className="w-full"
                              data-testid={`inline-audio-${message.id}`}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    {message.inlineCopyData && (
                      <InlineAdCopy data={message.inlineCopyData} />
                    )}
                    {message.inlineScoreData && (
                      <InlineScoreCard data={message.inlineScoreData} />
                    )}
                    {message.inlineRadarData && (
                      <InlineCompetitorRadar data={message.inlineRadarData} />
                    )}
                    {message.actionChips && message.actionChips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {message.actionChips.map((chip, ci) => (
                          <Button
                            key={ci}
                            variant="outline"
                            size="sm"
                            className="text-[10px] h-6 rounded-full px-2.5"
                            onClick={() => handleChipClick(chip, message)}
                            data-testid={`action-chip-${chip.action}`}
                          >
                            {chip.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isStreaming && (
                <div className="flex justify-start" data-testid="chat-streaming-indicator">
                  <div className="bg-card border border-border rounded-2xl px-5 py-4 max-w-sm w-full shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${agent.accentColor}15` }}
                        >
                          <svg className="w-10 h-10 absolute animate-spin" viewBox="0 0 40 40" style={{ animationDuration: '1.5s' }}>
                            <circle cx="20" cy="20" r="17" fill="none" stroke={agent.accentColor} strokeWidth="2.5" strokeDasharray="80 27" strokeLinecap="round" opacity="0.7" />
                          </svg>
                          {(() => {
                            const AgentIcon = agent.id === 'photo-studio' ? Image
                              : agent.id === 'video-producer' ? Video
                              : agent.id === 'copywriter' ? FileText
                              : agent.id === 'creative-director' ? BarChart2
                              : MapPin;
                            return <AgentIcon className="w-4 h-4" style={{ color: agent.accentColor }} />;
                          })()}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">
                          {toolProgress || `${agent.name} is working...`}
                        </span>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full animate-pulse"
                            style={{
                              background: `linear-gradient(90deg, ${agent.accentColor}60, ${agent.accentColor})`,
                              width: '60%',
                              animation: 'progressSlide 2s ease-in-out infinite',
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground">This may take a moment</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {messages.length === 0 && !isStreaming && (
            <div className="px-4 md:px-6 pb-2">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-[11px] text-muted-foreground font-medium">Try asking...</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {agent.suggestionChips.map((chip, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-[11px] h-7 rounded-full px-3"
                      onClick={() => setInput(chip)}
                      data-testid={`chip-suggestion-${i}`}
                    >
                      {chip}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="p-4 md:p-6 border-t border-border flex-shrink-0">
            <div className="max-w-3xl mx-auto">
              {attachedFile && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="relative group">
                    {attachedFile.file.type.startsWith('image/') ? (
                      <img src={attachedFile.preview} alt="attached" className="h-12 w-12 rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg border border-border flex items-center justify-center bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <button
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      onClick={() => setAttachedFile(null)}
                      data-testid="button-remove-attachment"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">{attachedFile.file.name}</span>
                </div>
              )}
              <div className="chat-input-gradient rounded-2xl p-[3px] shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <div className="bg-background rounded-[14px] flex items-end gap-2 p-4">
                  {agent.supportsAttachments && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleFileSelect}
                        data-testid="input-file-attachment"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 flex-shrink-0 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="button-attach-file"
                      >
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </>
                  )}
                  <textarea
                    ref={textareaRef}
                    className="flex-1 bg-transparent resize-none outline-none text-sm min-h-[28px] max-h-40 py-1.5"
                    placeholder={agent.inputPlaceholder}
                    value={input}
                    onChange={(e) => { setInput(e.target.value); handleTextareaInput(); }}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    data-testid="input-agent-chat"
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 flex-shrink-0 rounded-full"
                    onClick={handleSend}
                    disabled={isStreaming || (!input.trim() && !attachedFile)}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <Dialog open={!!selectedArtifact} onOpenChange={(open) => !open && setSelectedArtifact(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-artifact-detail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="text-artifact-title">
              {selectedArtifact && (() => {
                const ArtIcon = artifactTypeIcons[selectedArtifact.type] || FileText;
                return <ArtIcon className="h-4 w-4" style={{ color: agent.accentColor }} />;
              })()}
              {selectedArtifact?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedArtifact && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border overflow-hidden bg-muted/20">
                {selectedArtifact.type === 'IMAGE' && selectedArtifact.dataUrl && (
                  <img src={selectedArtifact.dataUrl} alt={selectedArtifact.title} className="w-full max-h-[50vh] object-contain" />
                )}
                {selectedArtifact.type === 'VIDEO' && selectedArtifact.dataUrl && (
                  <video src={selectedArtifact.dataUrl} controls className="w-full max-h-[50vh]" />
                )}
                {selectedArtifact.type === 'COPY' && selectedArtifact.data && (
                  <div className="p-4">
                    {selectedArtifact.data.copyData ? (
                      <InlineAdCopy data={selectedArtifact.data.copyData} />
                    ) : (
                      <div className="whitespace-pre-wrap text-sm">{selectedArtifact.data.text || JSON.stringify(selectedArtifact.data)}</div>
                    )}
                  </div>
                )}
                {selectedArtifact.type === 'VOICEOVER' && selectedArtifact.dataUrl && (
                  <div className="p-4 flex items-center justify-center">
                    <audio src={selectedArtifact.dataUrl} controls className="w-full max-w-md" />
                  </div>
                )}
                {selectedArtifact.type === 'SCORE' && selectedArtifact.data?.scoreData && (
                  <div className="p-4">
                    <InlineScoreCard data={selectedArtifact.data.scoreData} />
                  </div>
                )}
                {selectedArtifact.type === 'SCORE' && !selectedArtifact.data?.scoreData && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {selectedArtifact.data ? JSON.stringify(selectedArtifact.data, null, 2) : 'Score data not available.'}
                  </div>
                )}
                {selectedArtifact.type === 'RADAR' && selectedArtifact.data?.radarData && (
                  <div className="p-4">
                    <InlineCompetitorRadar data={selectedArtifact.data.radarData} />
                  </div>
                )}
                {selectedArtifact.type === 'RADAR' && !selectedArtifact.data?.radarData && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    Radar data not available.
                  </div>
                )}
                {!selectedArtifact.dataUrl && !selectedArtifact.data && (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">Preview not available</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Badge variant="outline" className="text-[10px]">{getArtifactTypeLabel(selectedArtifact.type)}</Badge>
                  <p className="text-[10px] text-muted-foreground">{timeAgo(selectedArtifact.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  {selectedArtifact.dataUrl && (
                    <Button variant="outline" size="sm" className="text-xs" asChild data-testid="button-download-artifact">
                      <a href={selectedArtifact.dataUrl} download={selectedArtifact.title}>
                        <Download className="h-3 w-3 mr-1.5" />
                        Download
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => { if (selectedArtifact) setSharingArtifact(selectedArtifact); }}
                    data-testid="button-share-artifact"
                  >
                    <Share2 className="h-3 w-3 mr-1.5" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SharingPanel
        artifact={sharingArtifact ? { ...sharingArtifact, agentName: agent.name, agentAccentColor: agent.accentColor } : null}
        open={!!sharingArtifact}
        onClose={() => setSharingArtifact(null)}
      />
    </div>
  );
}
