import { Camera, Video, PenTool, BarChart2, Map } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ArtifactType = 'IMAGE' | 'VIDEO' | 'COPY' | 'SCORE' | 'RADAR' | 'VOICEOVER';

export interface MarketingArtifact {
  id: string;
  type: ArtifactType;
  agentId: string;
  sessionId: string;
  title: string;
  thumbnailUrl?: string;
  dataUrl?: string;
  data?: any;
  vehicleContext?: string;
  createdAt: string;
}

export interface AgentSession {
  id: string;
  agentId: string;
  messages: AgentChatMessage[];
  artifacts: MarketingArtifact[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: string;
  toolCall?: {
    name: string;
    args: Record<string, any>;
    result?: any;
  };
  attachments?: { url: string; name: string; type: string }[];
}

export interface ToolFunctionDef {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean; enum?: string[] }>;
}

export interface MarketingAgentDef {
  id: string;
  name: string;
  icon: LucideIcon;
  accentColor: string;
  accentColorClass: string;
  gradient: string;
  glowColor: string;
  description: string;
  systemPrompt: string;
  suggestionChips: string[];
  inputPlaceholder: string;
  tools: ToolFunctionDef[];
  supportsAttachments: boolean;
}

export const MARKETING_AGENTS: MarketingAgentDef[] = [
  {
    id: 'photo-studio',
    name: 'Photo Studio',
    icon: Camera,
    accentColor: '#f59e0b',
    accentColorClass: 'text-amber-500',
    gradient: 'from-amber-500/15 via-orange-500/10 to-yellow-500/5',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    description: 'Make your vehicle photos look professional. Background removal, background swap, and studio-quality image generation.',
    systemPrompt: `You are Photo Studio, a specialized AI marketing agent for automotive dealerships. Your job is to help users create professional vehicle images.

You have two tools:
1. generate_vehicle_image — Generate a studio-quality image of a vehicle from a text description using AI image generation.
2. swap_vehicle_background — Remove the background from a vehicle photo and replace it with a new professional background.

When the user asks you to create or generate a vehicle image, use the generate_vehicle_image tool. When they want to change the background of an existing photo, use swap_vehicle_background.

Always confirm the vehicle details (year, make, model, color) and the desired background/setting before calling tools. Be enthusiastic but professional. Suggest creative backgrounds for dealership marketing: showroom floors, scenic drives, urban streets, studio backdrops.`,
    suggestionChips: [
      'Generate a photo of a 2024 Ford F-150 in a showroom',
      'Swap background to a mountain road scene',
      'Create a studio shot of a red Mustang GT',
      'Remove background from my vehicle photo',
    ],
    inputPlaceholder: 'Describe a vehicle image to create or drop a photo to edit...',
    tools: [
      {
        name: 'generate_vehicle_image',
        description: 'Generate a studio-quality AI image of a vehicle from a text prompt',
        parameters: {
          prompt: { type: 'string', description: 'Detailed description of the vehicle image to generate, including year, make, model, color, angle, and background setting', required: true },
          aspect_ratio: { type: 'string', description: 'Aspect ratio for the image', enum: ['16:9', '4:3', '1:1', '9:16'], required: false },
        },
      },
      {
        name: 'swap_vehicle_background',
        description: 'Remove the background from a vehicle photo and composite it onto a new background',
        parameters: {
          image_url: { type: 'string', description: 'URL or data URI of the vehicle photo to process', required: true },
          new_background: { type: 'string', description: 'Description of the new background to generate and composite behind the vehicle', required: true },
        },
      },
    ],
    supportsAttachments: true,
  },
  {
    id: 'video-producer',
    name: 'Video Producer',
    icon: Video,
    accentColor: '#ef4444',
    accentColorClass: 'text-red-500',
    gradient: 'from-red-500/15 via-rose-500/10 to-pink-500/5',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    description: 'Turn your photos into video content. Photo-to-video conversion, voiceover generation, and motion prompting.',
    systemPrompt: `You are Video Producer, a specialized AI marketing agent for automotive dealerships. Your job is to help users create compelling video content from their vehicle photos and assets.

You have two tools:
1. create_vehicle_video — Convert a still image into a short motion video (3-5 seconds) with AI-generated camera movement.
2. generate_voiceover — Generate a professional voiceover narration from text using AI text-to-speech.

When creating videos, ask what kind of camera movement they want (orbit, dolly, zoom, pan). When generating voiceovers, ask about tone (professional, energetic, warm, luxury) and confirm the script.

Suggest creative ideas: walk-around videos, hero reveal shots, social media reels, landing page headers.`,
    suggestionChips: [
      'Turn my vehicle photo into a video with orbit motion',
      'Create a voiceover for a truck commercial',
      'Generate a hero reveal video for the homepage',
      'Make a social reel from this car photo',
    ],
    inputPlaceholder: 'Drop a photo to animate or describe a voiceover to create...',
    tools: [
      {
        name: 'create_vehicle_video',
        description: 'Convert a still image into a short motion video with AI-generated camera movement',
        parameters: {
          image_url: { type: 'string', description: 'URL or data URI of the source image', required: true },
          motion_prompt: { type: 'string', description: 'Description of desired camera movement (e.g. slow orbit, dolly zoom, pan left)', required: true },
          duration: { type: 'string', description: 'Duration in seconds (3 or 5)', enum: ['3', '5'], required: false },
        },
      },
      {
        name: 'generate_voiceover',
        description: 'Generate a professional AI voiceover from a text script',
        parameters: {
          script: { type: 'string', description: 'The narration text to convert to speech', required: true },
          voice: { type: 'string', description: 'Voice style preference', enum: ['professional', 'energetic', 'warm', 'luxury'], required: false },
        },
      },
    ],
    supportsAttachments: true,
  },
  {
    id: 'copywriter',
    name: 'Copywriter',
    icon: PenTool,
    accentColor: '#8b5cf6',
    accentColorClass: 'text-violet-500',
    gradient: 'from-violet-500/15 via-purple-500/10 to-indigo-500/5',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    description: 'Write your ads and captions. Ad copy, headlines, social captions, email subjects, and Google ads.',
    systemPrompt: `You are Copywriter, a specialized AI marketing agent for automotive dealerships. Your job is to help users create compelling marketing copy across all formats.

You have one tool:
1. generate_ad_copy — Generate structured ad copy in multiple formats (social media, email subject lines, Google ads, display ads, landing page headlines).

When generating copy, always ask for: the vehicle or offer being promoted, the target audience, the tone (urgent, luxury, friendly, professional), and any specific calls-to-action. Provide multiple variations for each format so the user can choose.

Think like a senior automotive copywriter. Use power words, create urgency, and always include a clear CTA. Avoid cliches and generic language.`,
    suggestionChips: [
      'Write social media ads for a Memorial Day sale',
      'Create Google ad headlines for certified pre-owned',
      'Draft email subject lines for a new model launch',
      'Write a landing page headline for F-150 Lightning',
    ],
    inputPlaceholder: 'Tell me what you need copy for...',
    tools: [
      {
        name: 'generate_ad_copy',
        description: 'Generate structured advertising copy in multiple formats with variations',
        parameters: {
          vehicle_or_offer: { type: 'string', description: 'The vehicle, promotion, or offer to write copy for', required: true },
          target_audience: { type: 'string', description: 'Target audience description (e.g. first-time buyers, truck enthusiasts, luxury shoppers)', required: false },
          tone: { type: 'string', description: 'Desired tone of the copy', enum: ['urgent', 'luxury', 'friendly', 'professional', 'energetic'], required: false },
          formats: { type: 'string', description: 'Comma-separated list of formats to generate', enum: ['social,email,google_ads,display,landing_page'], required: false },
        },
      },
    ],
    supportsAttachments: false,
  },
  {
    id: 'creative-director',
    name: 'Creative Director',
    icon: BarChart2,
    accentColor: '#10b981',
    accentColorClass: 'text-emerald-500',
    gradient: 'from-emerald-500/15 via-green-500/10 to-teal-500/5',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    description: 'Tell me if this creative is good enough. Ad IQ scoring, effectiveness analysis, and improvement recommendations.',
    systemPrompt: `You are Creative Director, a specialized AI marketing agent for automotive dealerships. Your job is to evaluate marketing creatives and provide actionable scoring and recommendations.

You have one tool:
1. score_ad_image — Analyze a marketing image or creative asset and return a detailed effectiveness score with category breakdowns and improvement recommendations.

Scoring categories (each 0-100):
- Visual Impact: composition, color, clarity, focal point
- Brand Consistency: logo placement, color palette adherence, typography
- Message Clarity: headline readability, CTA visibility, value proposition
- Audience Appeal: target market alignment, emotional resonance
- Technical Quality: resolution, cropping, aspect ratio, file quality

Overall score is weighted average. Provide 3 specific, actionable improvement recommendations. Rate as Publish-Ready (80+), Needs Polish (60-79), or Rework Required (<60).`,
    suggestionChips: [
      'Score this ad image for effectiveness',
      'Rate my social media creative',
      'Is this banner ad publish-ready?',
      'Analyze this email header image',
    ],
    inputPlaceholder: 'Drop a creative asset to score and analyze...',
    tools: [
      {
        name: 'score_ad_image',
        description: 'Analyze a marketing creative and return an effectiveness score with category breakdowns and recommendations',
        parameters: {
          image_url: { type: 'string', description: 'URL or data URI of the creative asset to analyze', required: true },
          context: { type: 'string', description: 'Context about the ad (target platform, audience, campaign goal)', required: false },
        },
      },
    ],
    supportsAttachments: true,
  },
  {
    id: 'market-intel',
    name: 'Market Intel',
    icon: Map,
    accentColor: '#3b82f6',
    accentColorClass: 'text-blue-500',
    gradient: 'from-blue-500/15 via-indigo-500/10 to-cyan-500/5',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    description: 'Show me what the competition looks like. Competitor radar, brand presence scoring, and geographic gap analysis.',
    systemPrompt: `You are Market Intel, a specialized AI marketing agent for automotive dealerships. Your job is to provide competitive intelligence and market analysis.

You have one tool:
1. scan_competitor_radar — Scan a geographic area around a dealership to identify competitor locations, calculate brand presence scores, and generate a competitive landscape analysis.

When the user asks about competitors, nearby dealerships, or market positioning, use the scan_competitor_radar tool. Ask for:
- The dealership address or location to center the scan
- The scan radius in miles (default 15)
- Specific brands or competitors to focus on (optional)

Present findings clearly: map visualization with scored markers, ranked competitor table, and strategic analysis including top threat, market gaps, and opportunities.`,
    suggestionChips: [
      'Scan competitors within 15 miles of our dealership',
      'Show me the competitive landscape for Ford dealers',
      'What brands are over-represented in our area?',
      'Find gaps in luxury brand coverage nearby',
    ],
    inputPlaceholder: 'Ask about competitors or market positioning...',
    tools: [
      {
        name: 'scan_competitor_radar',
        description: 'Scan a geographic area to identify competitor dealerships, calculate brand presence scores, and analyze the competitive landscape',
        parameters: {
          address: { type: 'string', description: 'Center address for the competitor scan (dealership location)', required: true },
          radius_miles: { type: 'string', description: 'Scan radius in miles (default: 15)', required: false },
          focus_brands: { type: 'string', description: 'Comma-separated list of specific brands to focus on (optional)', required: false },
        },
      },
    ],
    supportsAttachments: false,
  },
];

export function getAgentById(id: string): MarketingAgentDef | undefined {
  return MARKETING_AGENTS.find(a => a.id === id);
}

function getUserScope(): string {
  try {
    const token = localStorage.getItem('nexxus_access_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.userId) return `_${payload.userId}`;
    }
  } catch {}
  return '';
}

function getArtifactsKey(): string {
  return `nexxus_marketing_artifacts${getUserScope()}`;
}

function getSessionsKey(): string {
  return `nexxus_marketing_sessions${getUserScope()}`;
}

export function loadArtifacts(): MarketingArtifact[] {
  try {
    const raw = localStorage.getItem(getArtifactsKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveArtifacts(artifacts: MarketingArtifact[]): void {
  localStorage.setItem(getArtifactsKey(), JSON.stringify(artifacts));
}

export function addArtifact(artifact: MarketingArtifact): MarketingArtifact[] {
  const all = loadArtifacts();
  all.unshift(artifact);
  saveArtifacts(all);
  return all;
}

export function removeArtifact(id: string): MarketingArtifact[] {
  const all = loadArtifacts().filter(a => a.id !== id);
  saveArtifacts(all);
  return all;
}

export function loadSessions(): AgentSession[] {
  try {
    const raw = localStorage.getItem(getSessionsKey());
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: AgentSession[]): void {
  localStorage.setItem(getSessionsKey(), JSON.stringify(sessions));
}

export function getSessionsForAgent(agentId: string): AgentSession[] {
  return loadSessions().filter(s => s.agentId === agentId);
}

export function getSession(sessionId: string): AgentSession | undefined {
  return loadSessions().find(s => s.id === sessionId);
}

export function createSession(agentId: string): AgentSession {
  const session: AgentSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    agentId,
    messages: [],
    artifacts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const all = loadSessions();
  all.unshift(session);
  saveSessions(all);
  return session;
}

export function updateSession(sessionId: string, updates: Partial<Pick<AgentSession, 'messages' | 'artifacts'>>): AgentSession | undefined {
  const all = loadSessions();
  const idx = all.findIndex(s => s.id === sessionId);
  if (idx === -1) return undefined;
  if (updates.messages) all[idx].messages = updates.messages;
  if (updates.artifacts) all[idx].artifacts = updates.artifacts;
  all[idx].updatedAt = new Date().toISOString();
  saveSessions(all);
  return all[idx];
}

export function deleteSession(sessionId: string): void {
  const all = loadSessions().filter(s => s.id !== sessionId);
  saveSessions(all);
}

export function createArtifactId(): string {
  return `art_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getArtifactTypeLabel(type: ArtifactType): string {
  const labels: Record<ArtifactType, string> = {
    IMAGE: 'Image',
    VIDEO: 'Video',
    COPY: 'Copy',
    SCORE: 'Score',
    RADAR: 'Radar Map',
    VOICEOVER: 'Voiceover',
  };
  return labels[type];
}

export function getArtifactFilterOptions(): { value: ArtifactType | 'ALL'; label: string }[] {
  return [
    { value: 'ALL', label: 'All' },
    { value: 'IMAGE', label: 'Images' },
    { value: 'VIDEO', label: 'Videos' },
    { value: 'COPY', label: 'Copy' },
    { value: 'SCORE', label: 'Scores' },
    { value: 'RADAR', label: 'Radar Maps' },
    { value: 'VOICEOVER', label: 'Voiceovers' },
  ];
}

export function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}
