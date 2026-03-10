import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Plus, Sparkles, X, Image, Video, FileText, BarChart2, MapPin, Volume2, Download, ExternalLink, ChevronDown, ChevronUp, PanelRightOpen, PanelRightClose, Play } from 'lucide-react';
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
  timeAgo,
  getArtifactTypeLabel,
  type MarketingAgentDef,
  type AgentSession,
  type AgentChatMessage,
  type MarketingArtifact,
} from '@/lib/marketing-agents';
import { executeToolCall, type ToolExecResult } from '@/lib/tool-executor';

interface AgentChatViewProps {
  agentId: string;
  sessionId?: string;
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

export default function AgentChatView({ agentId, sessionId: initialSessionId, onBack }: AgentChatViewProps) {
  const agent = MARKETING_AGENTS.find(a => a.id === agentId);
  const [session, setSession] = useState<AgentSession | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolProgress, setToolProgress] = useState<string | null>(null);
  const [visorOpen, setVisorOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [selectedArtifact, setSelectedArtifact] = useState<MarketingArtifact | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ file: File; preview: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
  }, [agentId, initialSessionId]);

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
      const historyMsgs = updatedMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content + (m.attachments?.length ? `\n\n[User attached: ${m.attachments.map(a => a.name).join(', ')}]` : ''),
      }));

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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 hidden md:flex"
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          data-testid="button-toggle-artifact-panel"
        >
          {rightPanelOpen ? <PanelRightClose className="h-4 w-4 text-muted-foreground" /> : <PanelRightOpen className="h-4 w-4 text-muted-foreground" />}
        </Button>
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
            <div className="px-4 pt-3 pb-2">
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
                      {art.thumbnailUrl ? (
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

          {visorOpen === false && artifacts.length > 0 && (
            <button
              className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors border-b border-border"
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
                    {message.actionChips && message.actionChips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {message.actionChips.map((chip, ci) => (
                          <Button
                            key={ci}
                            variant="outline"
                            size="sm"
                            className="text-[10px] h-6 rounded-full px-2.5"
                            onClick={() => setInput(chip.label.replace(/^[^\w]+/, ''))}
                            data-testid={`action-chip-${ci}`}
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
                  <div className="bg-card border border-border rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {toolProgress || `${agent.name} is thinking...`}
                      </span>
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

        {rightPanelOpen && (
          <div className="hidden md:flex flex-col w-72 lg:w-80 border-l border-border flex-shrink-0 overflow-hidden" data-testid="artifact-history-panel">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Artifact History</h3>
            </div>
            <ScrollArea className="flex-1">
              {allArtifactsForAgent.length === 0 ? (
                <div className="p-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <AgentIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">No artifacts yet.</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Start a conversation to generate images, videos, copy, and more.</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {allArtifactsForAgent.map(art => {
                    const ArtIcon = artifactTypeIcons[art.type] || FileText;
                    return (
                      <button
                        key={art.id}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        onClick={() => setSelectedArtifact(art)}
                        data-testid={`artifact-history-${art.id}`}
                      >
                        {art.thumbnailUrl ? (
                          <img src={art.thumbnailUrl} alt={art.title} className="w-10 h-10 rounded-md object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-muted/30 flex items-center justify-center flex-shrink-0">
                            <ArtIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{art.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[9px] h-4 px-1.5">{getArtifactTypeLabel(art.type)}</Badge>
                            <span className="text-[9px] text-muted-foreground">{timeAgo(art.createdAt)}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
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
                  <div className="p-4 whitespace-pre-wrap text-sm">{selectedArtifact.data.text || JSON.stringify(selectedArtifact.data)}</div>
                )}
                {selectedArtifact.type === 'VOICEOVER' && selectedArtifact.dataUrl && (
                  <div className="p-4 flex items-center justify-center">
                    <audio src={selectedArtifact.dataUrl} controls className="w-full max-w-md" />
                  </div>
                )}
                {(selectedArtifact.type === 'SCORE' || selectedArtifact.type === 'RADAR') && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    {selectedArtifact.data ? JSON.stringify(selectedArtifact.data, null, 2) : 'Data visualization coming in a future sprint.'}
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
                  <Button variant="outline" size="sm" className="text-xs" data-testid="button-share-artifact">
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
