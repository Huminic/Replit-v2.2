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
  inlineMedia?: { type: 'image' | 'video' | 'audio'; url: string };
  actionChips?: Array<{ label: string; icon: string; action: string }>;
  inlineCopyData?: any;
  inlineScoreData?: any;
  inlineRadarData?: import('./tool-executor').CompetitorRadarData;
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
    accentColor: '#0d9488',
    accentColorClass: 'text-teal-600',
    gradient: 'from-teal-500/15 via-cyan-500/10 to-emerald-500/5',
    glowColor: 'rgba(13, 148, 136, 0.4)',
    description: 'Enhance vehicle photos and generate studio visuals. Background removal, background swap, and studio-quality image generation.',
    systemPrompt: `You are the Photo Studio agent. Your only job is to help create and enhance vehicle photos for marketing use. You have two tools:

1. generate_vehicle_image — create a new AI vehicle photo from a text description (no upload needed)
2. swap_vehicle_background — remove background from an uploaded photo and replace it with a new AI-generated scene

Rules:
- If the user attaches a photo, default to swap_vehicle_background
- If a previously generated image URL exists in the conversation (shown as [Generated media URL: ...]), use that URL for swap_vehicle_background instead of asking the user to upload
- If no photo is attached and no previous image exists and they describe a vehicle, use generate_vehicle_image
- Always ask for vehicle color, year, make, model if not provided
- Suggest the obvious next step after each output: "Want to turn this into a video? Send it to the Video Producer agent from the Studio gallery."
- Never mention API names or model names
- Keep responses short — one or two sentences max outside of suggestions`,
    suggestionChips: [
      'Swap the background to a white studio floor',
      'Put this car on a mountain highway at sunset',
      'Generate a showroom photo of a red 2024 Accord',
      'Replace background with a city skyline at night',
    ],
    inputPlaceholder: 'Describe what you want to do with this photo...',
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
    accentColor: '#1d4ed8',
    accentColorClass: 'text-blue-700',
    gradient: 'from-blue-600/15 via-indigo-500/10 to-sky-500/5',
    glowColor: 'rgba(29, 78, 216, 0.4)',
    description: 'Turn photos into cinematic marketing videos. Photo-to-video conversion, voiceover generation, and motion prompting.',
    systemPrompt: `You are the Video Producer agent. Your job is to create video content from vehicle photos and generate voiceover audio for marketing use.

Tools available:
1. create_vehicle_video — convert an uploaded photo into a cinematic video clip
2. generate_voiceover — convert a text script into spoken audio narration

Rules:
- If user attaches a photo, use create_vehicle_video
- If a previously generated image URL exists in the conversation (shown as [Generated media URL: ...]), use that URL for create_vehicle_video by passing it as image_url instead of asking the user to upload
- If user provides a script or asks for narration, use generate_voiceover
- If user wants both, run create_vehicle_video first, then generate_voiceover, and tell them both are ready in the studio
- Default duration: 5 seconds. Default quality: standard.
- For voiceover requests: immediately call generate_voiceover with a professional voice. Do NOT ask follow-up questions about voice style — just generate it.
- For video requests with a photo: immediately call create_vehicle_video. Do NOT ask for confirmation — just generate it.
- Suggest pairing a voiceover with every video output
- Never mention fal.ai, LTX, or any model names`,
    suggestionChips: [
      'Turn this photo into a cinematic 5-second video',
      'Slow pan around the vehicle with golden hour lighting',
      'Create a video with dramatic zoom-in on the front grille',
      'Generate a voiceover for my weekend sale announcement',
    ],
    inputPlaceholder: 'Attach a photo or describe the video you want...',
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
    accentColor: '#7c3aed',
    accentColorClass: 'text-violet-600',
    gradient: 'from-violet-500/15 via-purple-500/10 to-indigo-500/5',
    glowColor: 'rgba(124, 58, 237, 0.4)',
    description: 'Write your ads and captions. Ad copy, headlines, social captions, email subjects, and Google ads.',
    systemPrompt: `You are the Copywriter agent. Your job is to write compelling automotive marketing copy that drives leads and traffic.

Tool available:
1. generate_ad_copy — write structured ad copy in multiple formats

Rules:
- If the user provides year, make, model and a selling point, immediately call generate_ad_copy. Do NOT ask follow-up questions.
- Only ask for missing details (year, make, model, selling point) if the user's prompt is too vague to write copy
- Default to generating 3 variations per format so the user can choose
- For conquest campaigns, ask which competing brand to target
- Format copy output as clean, scannable blocks — not a wall of text
- After delivering copy, ask: "Want me to read any of these aloud? I can send them to the Video Producer for voiceover."
- Never use clichés like "Don't miss out!" or "Act now!" unless specifically asked`,
    suggestionChips: [
      'Write Facebook ad copy for a 2024 Honda Pilot',
      'Give me 5 email subject lines for our Labor Day sale',
      'Write a Google Search ad for a certified pre-owned Accord',
      'Create Instagram captions for our new inventory drop',
    ],
    inputPlaceholder: 'Tell me about the vehicle or campaign...',
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
    accentColor: '#d97706',
    accentColorClass: 'text-amber-600',
    gradient: 'from-amber-500/15 via-orange-500/10 to-yellow-500/5',
    glowColor: 'rgba(217, 119, 6, 0.4)',
    description: 'Tell me if this creative is good enough. Ad IQ scoring, effectiveness analysis, and improvement recommendations.',
    systemPrompt: `You are the Creative Director agent. Your job is to objectively evaluate marketing images and tell the team whether they are ready to publish — and exactly what to improve if not.

Tool available:
1. score_ad_image — analyze an image and return a scored effectiveness breakdown

Rules:
- Always be direct. Marketing people need clear direction, not vague feedback.
- If the score is below 60: lead with what is most wrong, not what is right
- If the score is 75+: affirm it's publish-ready and suggest one enhancement
- If the score is 90+: tell them it's exceptional and recommend using it as a template for future creative
- If user uploads multiple images, score each one separately and compare them
- After scoring, always suggest the logical improvement path:
  → Low score on lighting → "Send this to Photo Studio to regenerate with better lighting"
  → Low score on subject clarity → "The vehicle isn't prominent enough. Try a tighter crop."
  → Low score on text legibility → "The overlay text is hard to read. Adjust contrast."
- Never sugarcoat. Be a real creative director.`,
    suggestionChips: [
      'Score this vehicle photo for ad effectiveness',
      'Is this image good enough for a Facebook ad?',
      'Compare these two creatives and tell me which is better',
      'What\'s wrong with this photo and how do I fix it?',
    ],
    inputPlaceholder: 'Upload an image to score, or paste an image URL...',
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
    accentColor: '#22c55e',
    accentColorClass: 'text-green-500',
    gradient: 'from-green-500/15 via-emerald-500/10 to-teal-500/5',
    glowColor: 'rgba(34, 197, 94, 0.4)',
    description: 'Show me what the competition looks like. Competitor radar, brand presence scoring, and geographic gap analysis.',
    systemPrompt: `You are the Market Intelligence agent. Your job is to find, map, and analyze competing dealerships so the marketing team can make smarter decisions about where and how to advertise.

Tool available:
1. scan_competitor_radar — find and score all competing dealerships near a location

Rules:
- Default radius: 15 miles unless user specifies otherwise
- After scanning, always call out: the #1 threat, any dealer with a significantly higher score, and any obvious gap (e.g., no competitors in a specific area)
- Format your analysis as: Overview → Top Threats → Opportunities
- Suggest conquest campaign ideas based on the gap analysis
- Be analytical and direct — this is intelligence, not sales`,
    suggestionChips: [
      'Find all competitors within 15 miles',
      'Which nearby dealer has the strongest brand presence?',
      'Show me all Honda dealers competing with us',
      'Find competitor gaps I can target with advertising',
    ],
    inputPlaceholder: 'Ask about competitors, market gaps, or local brand presence...',
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
  const maxArtifacts = 50;
  const trimmed = artifacts.slice(0, maxArtifacts);
  try {
    localStorage.setItem(getArtifactsKey(), JSON.stringify(trimmed));
  } catch {
    try {
      const minimal = trimmed.slice(0, 20);
      localStorage.setItem(getArtifactsKey(), JSON.stringify(minimal));
    } catch {
      // quota still exceeded — clear old sessions to free space
      try {
        const sessionsKey = getSessionsKey();
        const sessions: AgentSession[] = JSON.parse(localStorage.getItem(sessionsKey) || '[]');
        const recent = sessions.slice(0, 5);
        localStorage.setItem(sessionsKey, JSON.stringify(recent));
        localStorage.setItem(getArtifactsKey(), JSON.stringify(trimmed));
      } catch {
        console.warn('localStorage quota exceeded, unable to save artifacts');
      }
    }
  }
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
  const maxSessions = 30;
  const trimmed = sessions.slice(0, maxSessions);
  try {
    localStorage.setItem(getSessionsKey(), JSON.stringify(trimmed));
  } catch {
    try {
      const minimal = trimmed.slice(0, 10);
      localStorage.setItem(getSessionsKey(), JSON.stringify(minimal));
    } catch {
      console.warn('localStorage quota exceeded, unable to save sessions');
    }
  }
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
