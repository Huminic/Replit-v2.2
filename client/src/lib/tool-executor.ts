import { addArtifact, type MarketingArtifact } from './marketing-agents';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('nexxus_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

interface FalSubmitResult {
  request_id: string;
  status_url?: string;
  response_url?: string;
}

async function falSubmit(endpoint: string, input: Record<string, any>): Promise<FalSubmitResult> {
  const res = await fetch('/api/fal-proxy', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ endpoint, input }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`fal submit failed (${res.status}): ${errBody.substring(0, 200)}`);
  }
  const data = await res.json();
  return {
    request_id: data.request_id,
    status_url: data.status_url,
    response_url: data.response_url,
  };
}

async function falPollUntilDone(
  endpoint: string,
  submitResult: FalSubmitResult,
  onProgress?: (elapsed: number) => void,
): Promise<any> {
  const startTime = Date.now();
  const maxWait = 300_000;
  while (Date.now() - startTime < maxWait) {
    const statusBody: Record<string, any> = submitResult.status_url
      ? { statusUrl: submitResult.status_url }
      : { endpoint, requestId: submitResult.request_id };
    const res = await fetch('/api/fal-proxy/status', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(statusBody),
    });
    if (!res.ok) throw new Error(`fal status failed: ${res.status}`);
    const status = await res.json();
    if (onProgress) onProgress(Math.floor((Date.now() - startTime) / 1000));
    if (status.status === 'COMPLETED') {
      const resultBody: Record<string, any> = submitResult.response_url
        ? { responseUrl: submitResult.response_url }
        : { endpoint, requestId: submitResult.request_id };
      const resultRes = await fetch('/api/fal-proxy/result', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(resultBody),
      });
      if (!resultRes.ok) throw new Error(`fal result failed: ${resultRes.status}`);
      return resultRes.json();
    }
    if (status.status === 'FAILED') {
      throw new Error(status.error || 'fal.ai job failed');
    }
    await new Promise(r => setTimeout(r, 4000));
  }
  throw new Error('fal.ai job timed out after 5 minutes');
}

function makeArtifact(
  type: MarketingArtifact['type'],
  title: string,
  agentId: string,
  sessionId: string,
  dataUrl?: string,
  thumbnailUrl?: string,
  data?: Record<string, any>,
): MarketingArtifact {
  const artifact: MarketingArtifact = {
    id: `art_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    title,
    agentId,
    sessionId,
    createdAt: new Date().toISOString(),
    dataUrl,
    thumbnailUrl: thumbnailUrl || dataUrl,
    data,
  };
  addArtifact(artifact);
  return artifact;
}

export interface CompetitorEntry {
  name: string;
  rating: number;
  reviewCount: number;
  distance: number;
  address: string;
  rank: number;
}

export interface CompetitorRadarData {
  competitors: CompetitorEntry[];
  searchLocation: string;
  isDemo: boolean;
}

export interface ToolExecResult {
  content: string;
  artifact?: MarketingArtifact;
  actionChips?: Array<{ label: string; icon: string; action: string }>;
  inlineMedia?: { type: 'image' | 'video' | 'audio'; url: string };
  inlineCopyData?: AdCopyData;
  inlineScoreData?: ScoreCardData;
  inlineRadarData?: CompetitorRadarData;
}

export type ProgressCallback = (msg: string) => void;

export async function executeToolCall(
  toolName: string,
  args: Record<string, any>,
  agentId: string,
  sessionId: string,
  attachedImageDataUri?: string,
  onProgress?: ProgressCallback,
): Promise<ToolExecResult> {
  switch (toolName) {
    case 'generate_vehicle_image':
      return executeGenerateVehicleImage(args, agentId, sessionId, onProgress);
    case 'swap_vehicle_background':
      return executeSwapVehicleBackground(args, agentId, sessionId, attachedImageDataUri, onProgress);
    case 'create_vehicle_video':
      return executeCreateVehicleVideo(args, agentId, sessionId, attachedImageDataUri, onProgress);
    case 'generate_voiceover':
      return executeGenerateVoiceover(args, agentId, sessionId, onProgress);
    case 'generate_ad_copy':
      return executeGenerateAdCopy(args, agentId, sessionId, onProgress);
    case 'score_ad_image':
      return executeScoreAdImage(args, agentId, sessionId, attachedImageDataUri, onProgress);
    case 'scan_competitor_radar':
      return executeScanCompetitorRadar(args, agentId, sessionId, onProgress);
    default:
      return {
        content: `Tool **${toolName.replace(/_/g, ' ')}** is not yet implemented. It will be available in a future update.`,
      };
  }
}

async function executeGenerateVehicleImage(
  args: Record<string, any>,
  agentId: string,
  sessionId: string,
  onProgress?: ProgressCallback,
): Promise<ToolExecResult> {
  const prompt = args.prompt || 'professional automotive photography';
  const aspectRatio = args.aspect_ratio || '4:3';

  const sizeMap: Record<string, string> = {
    '16:9': 'landscape_16_9',
    '4:3': 'landscape_4_3',
    '1:1': 'square',
    '9:16': 'portrait_9_16',
  };

  const fullPrompt = `automotive marketing photography, studio quality, ${prompt}, professional lighting, sharp detail, high resolution`;

  onProgress?.('Generating your vehicle image...');

  const endpoint = 'fal-ai/flux/dev';
  const submitResult = await falSubmit(endpoint, {
    prompt: fullPrompt,
    image_size: sizeMap[aspectRatio] || 'landscape_4_3',
    num_images: 1,
  });

  onProgress?.('Rendering image...');

  const result = await falPollUntilDone(endpoint, submitResult, (elapsed) => {
    onProgress?.(`Rendering image... (${elapsed}s elapsed)`);
  });

  const imageUrl = result?.images?.[0]?.url;
  if (!imageUrl) throw new Error('No image returned from generation service');

  const artifact = makeArtifact('IMAGE', prompt.slice(0, 80), agentId, sessionId, imageUrl);

  return {
    content: `Here's your generated vehicle image. The image has been saved to your Studio gallery.`,
    artifact,
    inlineMedia: { type: 'image', url: imageUrl },
    actionChips: [
      { label: '🎬 Send to Video Producer', icon: 'video', action: 'send_to_video' },
      { label: '📊 Score this image', icon: 'score', action: 'score_image' },
      { label: '🔄 Generate variation', icon: 'refresh', action: 'generate_variation' },
    ],
  };
}

async function executeSwapVehicleBackground(
  args: Record<string, any>,
  agentId: string,
  sessionId: string,
  attachedImageDataUri?: string,
  onProgress?: ProgressCallback,
): Promise<ToolExecResult> {
  const imageUrl = args.image_url || attachedImageDataUri;
  if (!imageUrl) {
    return { content: 'Please attach a vehicle photo first so I can swap its background.' };
  }

  const newBackground = args.new_background || 'professional car dealership showroom';

  onProgress?.('Removing vehicle background...');

  let hostedImageUrl = imageUrl;
  if (imageUrl.startsWith('data:')) {
    const uploadRes = await fetch('/api/fal-proxy', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ endpoint: 'fal-ai/upload', input: { image_url: imageUrl } }),
    });
    if (!uploadRes.ok) throw new Error('Failed to upload image for processing');
    const uploadData = await uploadRes.json();
    if (uploadData.url) hostedImageUrl = uploadData.url;
    else throw new Error('Upload succeeded but no URL returned');
  }

  const bgRemoveEndpoint = 'fal-ai/bria/background/remove';
  const bgRemoveSubmit = await falSubmit(bgRemoveEndpoint, { image_url: hostedImageUrl });
  const bgRemoveResult = await falPollUntilDone(bgRemoveEndpoint, bgRemoveSubmit, (elapsed) => {
    onProgress?.(`Removing background... (${elapsed}s elapsed)`);
  });

  const foregroundUrl = bgRemoveResult?.image?.url;
  if (!foregroundUrl) throw new Error('Background removal failed');

  onProgress?.('Generating new backdrop...');

  const backdropEndpoint = 'fal-ai/flux/schnell';
  const backdropSubmit = await falSubmit(backdropEndpoint, {
    prompt: `${newBackground}, wide angle, high resolution, no vehicles, empty scene, professional photography`,
    image_size: 'landscape_4_3',
    num_images: 1,
  });
  const backdropResult = await falPollUntilDone(backdropEndpoint, backdropSubmit, (elapsed) => {
    onProgress?.(`Creating backdrop... (${elapsed}s elapsed)`);
  });

  const backdropUrl = backdropResult?.images?.[0]?.url;
  if (!backdropUrl) throw new Error('Backdrop generation failed');

  onProgress?.('Compositing final image...');

  const compositeUrl = await compositeImages(backdropUrl, foregroundUrl);

  const artifact = makeArtifact(
    'IMAGE',
    `Background swap: ${newBackground.slice(0, 60)}`,
    agentId,
    sessionId,
    compositeUrl,
  );

  return {
    content: `Background swapped successfully! Your vehicle is now on a ${newBackground} backdrop. Saved to Studio gallery.`,
    artifact,
    inlineMedia: { type: 'image', url: compositeUrl },
    actionChips: [
      { label: '🎬 Send to Video Producer', icon: 'video', action: 'send_to_video' },
      { label: '📊 Score this image', icon: 'score', action: 'score_image' },
      { label: '🔄 Try different background', icon: 'refresh', action: 'try_different_bg' },
    ],
  };
}

async function compositeImages(backdropUrl: string, foregroundUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Image compositing timed out after 30 seconds')), 30_000);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) { clearTimeout(timeout); reject(new Error('Canvas not supported')); return; }

    const backdrop = new window.Image();
    backdrop.crossOrigin = 'anonymous';
    backdrop.onload = () => {
      canvas.width = backdrop.width;
      canvas.height = backdrop.height;
      ctx.drawImage(backdrop, 0, 0);

      const fg = new window.Image();
      fg.crossOrigin = 'anonymous';
      fg.onload = () => {
        try {
          const scale = Math.min(canvas.width / fg.width, canvas.height / fg.height) * 0.85;
          const w = fg.width * scale;
          const h = fg.height * scale;
          const x = (canvas.width - w) / 2;
          const y = canvas.height - h - canvas.height * 0.05;
          ctx.drawImage(fg, x, y, w, h);
          const dataUrl = canvas.toDataURL('image/png');
          clearTimeout(timeout);
          resolve(dataUrl);
        } catch (err: any) {
          clearTimeout(timeout);
          reject(new Error(`Canvas export failed: ${err.message}`));
        }
      };
      fg.onerror = () => { clearTimeout(timeout); reject(new Error('Failed to load foreground image')); };
      fg.src = foregroundUrl;
    };
    backdrop.onerror = () => { clearTimeout(timeout); reject(new Error('Failed to load backdrop image')); };
    backdrop.src = backdropUrl;
  });
}

async function executeCreateVehicleVideo(
  args: Record<string, any>,
  agentId: string,
  sessionId: string,
  attachedImageDataUri?: string,
  onProgress?: ProgressCallback,
): Promise<ToolExecResult> {
  const imageUrl = args.image_url || attachedImageDataUri;
  if (!imageUrl) {
    return { content: 'Please attach a vehicle photo to convert into a video clip.' };
  }

  const motionPrompt = args.motion_prompt || 'slow cinematic orbit around the vehicle';
  const duration = args.duration || '5';

  onProgress?.('Preparing your video...');

  let hostedImageUrl = imageUrl;
  if (imageUrl.startsWith('data:')) {
    const uploadRes = await fetch('/api/fal-proxy', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ endpoint: 'fal-ai/upload', input: { image_url: imageUrl } }),
    });
    if (!uploadRes.ok) throw new Error('Failed to upload image for video processing');
    const uploadData = await uploadRes.json();
    if (uploadData.url) hostedImageUrl = uploadData.url;
    else throw new Error('Upload succeeded but no URL returned');
  }

  const endpoint = 'fal-ai/ltx-video-v095/image-to-video';
  const submitResult = await falSubmit(endpoint, {
    image_url: hostedImageUrl,
    prompt: motionPrompt,
    duration: parseInt(duration, 10),
  });

  const result = await falPollUntilDone(endpoint, submitResult, (elapsed) => {
    onProgress?.(`Rendering your video... (${elapsed}s elapsed)`);
  });

  const videoUrl = result?.video?.url;
  if (!videoUrl) throw new Error('No video returned from rendering service');

  const artifact = makeArtifact(
    'VIDEO',
    motionPrompt.slice(0, 80),
    agentId,
    sessionId,
    videoUrl,
    undefined,
  );

  return {
    content: `Your ${duration}-second video is ready! Saved to Studio gallery.`,
    artifact,
    inlineMedia: { type: 'video', url: videoUrl },
    actionChips: [
      { label: '🎙 Add voiceover', icon: 'voiceover', action: 'add_voiceover' },
      { label: '📊 Score the thumbnail', icon: 'score', action: 'score_thumbnail' },
      { label: '⬇ Download MP4', icon: 'download', action: 'download_mp4' },
    ],
  };
}

async function openaiChatCompletion(
  messages: Array<{ role: string; content: any }>,
  model: string = 'gpt-4o-mini',
  responseFormat?: { type: string },
): Promise<any> {
  const token = localStorage.getItem('nexxus_access_token');
  const payload: Record<string, any> = { model, messages };
  if (responseFormat) payload.response_format = responseFormat;

  const res = await fetch('/api/openai-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errText.substring(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

async function executeGenerateVoiceover(
  args: Record<string, any>,
  agentId: string,
  sessionId: string,
  onProgress?: ProgressCallback,
): Promise<ToolExecResult> {
  const script = args.script;
  if (!script) {
    return { content: 'Please provide the narration text you\'d like me to convert to speech.' };
  }

  const voiceMap: Record<string, string> = {
    professional: 'am_adam',
    energetic: 'am_michael',
    warm: 'af_bella',
    luxury: 'af_sarah',
  };
  const voice = voiceMap[args.voice || 'professional'] || 'am_adam';

  onProgress?.('Generating voiceover...');

  const endpoint = 'fal-ai/kokoro/american-english';
  const submitResult = await falSubmit(endpoint, { text: script, voice });
  const result = await falPollUntilDone(endpoint, submitResult, (elapsed) => {
    onProgress?.(`Recording voiceover... (${elapsed}s elapsed)`);
  });

  const audioUrl = result?.audio?.url || result?.audio_url?.url;
  if (!audioUrl) throw new Error('No audio returned from voiceover service');

  const artifact = makeArtifact(
    'VOICEOVER',
    `Voiceover: ${script.slice(0, 60)}...`,
    agentId,
    sessionId,
    audioUrl,
  );

  return {
    content: `Your voiceover is ready! Saved to Studio gallery.`,
    artifact,
    inlineMedia: { type: 'audio', url: audioUrl },
    actionChips: [
      { label: '🎬 Pair with video', icon: 'video', action: 'pair_with_video' },
      { label: '⬇ Download MP3', icon: 'download', action: 'download_audio' },
      { label: '🔄 Try different voice', icon: 'refresh', action: 'try_different_voice' },
    ],
  };
}

export interface AdCopyData {
  vehicle: string;
  variations: {
    headline: string[];
    body_copy: string[];
    social_caption: string[];
    email_subject: string[];
    google_ad: string[];
  };
}

async function executeGenerateAdCopy(
  args: Record<string, any>,
  agentId: string,
  sessionId: string,
  onProgress?: ProgressCallback,
): Promise<ToolExecResult> {
  const vehicleOrOffer = args.vehicle_or_offer;
  if (!vehicleOrOffer) {
    return { content: 'Please tell me what vehicle, promotion, or offer you want copy for.' };
  }

  const tone = args.tone || 'professional';
  const targetAudience = args.target_audience || 'general car buyers';
  const numVariations = 3;

  onProgress?.('Writing your ad copy...');

  const systemPrompt = `You are an expert automotive advertising copywriter. Write conversion-focused, brand-appropriate copy. Return ONLY valid JSON matching the requested structure. No markdown, no code fences, just pure JSON.`;

  const userPrompt = `Write ${numVariations} variations of ad copy for: ${vehicleOrOffer}

Target audience: ${targetAudience}
Tone: ${tone}

Return this exact JSON structure:
{
  "vehicle": "${vehicleOrOffer}",
  "variations": {
    "headline": ["variation1", "variation2", "variation3"],
    "body_copy": ["variation1", "variation2", "variation3"],
    "social_caption": ["variation1", "variation2", "variation3"],
    "email_subject": ["variation1", "variation2", "variation3"],
    "google_ad": ["variation1", "variation2", "variation3"]
  }
}

Rules:
- Headlines: punchy, under 10 words, no clichés
- Body copy: 2-3 sentences, clear CTA, benefit-driven
- Social captions: platform-ready, include relevant hashtags
- Email subjects: curiosity-driven, under 60 chars, no spam words
- Google ads: max 30 char headline + 90 char description per variation`;

  const rawContent = await openaiChatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    'gpt-4o-mini',
    { type: 'json_object' },
  );

  let copyData: AdCopyData;
  try {
    copyData = JSON.parse(rawContent);
  } catch {
    throw new Error('Failed to parse ad copy response. Please try again.');
  }

  if (!copyData.variations) {
    throw new Error('Invalid ad copy format returned. Please try again.');
  }

  const artifact = makeArtifact(
    'COPY',
    `Ad Copy: ${vehicleOrOffer.slice(0, 60)}`,
    agentId,
    sessionId,
    undefined,
    undefined,
    { copyData, text: copyData.variations.headline?.[0] || vehicleOrOffer },
  );

  return {
    content: `Here's your ad copy for **${copyData.vehicle}**. Each format has ${numVariations} variations — use the 📋 buttons to copy any of them.`,
    artifact,
    inlineMedia: undefined,
    actionChips: [
      { label: '🎙 Turn this into a voiceover', icon: 'voiceover', action: 'turn_into_voiceover' },
      { label: '📊 Score this campaign', icon: 'score', action: 'score_campaign' },
      { label: '🔄 Try different tone', icon: 'refresh', action: 'try_different_tone' },
    ],
    inlineCopyData: copyData,
  };
}

export interface ScoreCardData {
  overall_score: number;
  visual_appeal: number;
  subject_clarity: number;
  lighting_quality: number;
  text_legibility: number;
  ad_effectiveness: number;
  visual_appeal_feedback: string;
  subject_clarity_feedback: string;
  lighting_quality_feedback: string;
  text_legibility_feedback: string;
  ad_effectiveness_feedback: string;
  publish_ready: boolean;
  recommendations: string[];
}

async function executeScoreAdImage(
  args: Record<string, any>,
  agentId: string,
  sessionId: string,
  attachedImageDataUri?: string,
  onProgress?: ProgressCallback,
): Promise<ToolExecResult> {
  const imageUrl = args.image_url || attachedImageDataUri;
  if (!imageUrl) {
    return { content: 'Please upload an image or paste an image URL to score.' };
  }

  const context = args.context || 'general automotive marketing ad';

  onProgress?.('Analyzing your creative...');

  const systemPrompt = `You are an expert automotive marketing creative director. Analyze vehicle ad images with professional rigor. Return ONLY valid JSON matching the requested structure. No markdown, no code fences, just pure JSON.`;

  const imageContent: any[] = [
    {
      type: 'text',
      text: `Analyze this automotive marketing image for ad effectiveness. Context: ${context}

Return this exact JSON:
{
  "overall_score": <0-100>,
  "visual_appeal": <0-100>,
  "subject_clarity": <0-100>,
  "lighting_quality": <0-100>,
  "text_legibility": <0-100>,
  "ad_effectiveness": <0-100>,
  "visual_appeal_feedback": "<one sentence>",
  "subject_clarity_feedback": "<one sentence>",
  "lighting_quality_feedback": "<one sentence>",
  "text_legibility_feedback": "<one sentence>",
  "ad_effectiveness_feedback": "<one sentence>",
  "publish_ready": <true if overall_score >= 75>,
  "recommendations": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"]
}

Score honestly. Most dealership photos score 40-70. Only truly professional studio shots score above 85.`,
    },
    {
      type: 'image_url',
      image_url: {
        url: imageUrl,
        detail: 'high',
      },
    },
  ];

  const rawContent = await openaiChatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: imageContent },
    ],
    'gpt-4o-mini',
    { type: 'json_object' },
  );

  let scoreData: ScoreCardData;
  try {
    scoreData = JSON.parse(rawContent);
  } catch {
    throw new Error('Failed to parse score analysis. Please try again.');
  }

  const overallScore = scoreData.overall_score || 0;
  const publishStatus = overallScore >= 75 ? '✅ PUBLISH READY' : overallScore >= 50 ? '⚠ NEEDS WORK' : '❌ NOT READY';

  const artifact = makeArtifact(
    'SCORE',
    `Score: ${overallScore}/100 — ${publishStatus}`,
    agentId,
    sessionId,
    imageUrl.startsWith('data:') ? undefined : imageUrl,
    imageUrl.startsWith('data:') ? undefined : imageUrl,
    { scoreData },
  );

  const actionChips = overallScore < 75
    ? [
        { label: '📸 Regenerate in Photo Studio', icon: 'photo', action: 'regenerate_photo' },
        { label: '🔄 Upload revised version', icon: 'refresh', action: 'upload_revised' },
        { label: '✍ Write copy anyway', icon: 'copy', action: 'write_copy_anyway' },
      ]
    : [
        { label: '✍ Write copy for this', icon: 'copy', action: 'write_copy' },
        { label: '🎬 Send to Video Producer', icon: 'video', action: 'send_to_video' },
        { label: '⬇ Download scored report', icon: 'download', action: 'download_report' },
      ];

  return {
    content: `**${publishStatus}** — Overall Score: **${overallScore}/100**`,
    artifact,
    actionChips,
    inlineScoreData: scoreData,
    inlineMedia: imageUrl.startsWith('data:') ? undefined : { type: 'image' as const, url: imageUrl },
  };
}

function generateMockCompetitors(location: string): CompetitorEntry[] {
  return [
    { name: 'Premier Auto Group', rating: 4.6, reviewCount: 1247, distance: 3.2, address: `1200 Motor Mile Dr, ${location}`, rank: 1 },
    { name: 'Capitol City Motors', rating: 4.4, reviewCount: 892, distance: 5.8, address: `3400 Auto Park Blvd, ${location}`, rank: 2 },
    { name: 'Heritage Automotive', rating: 4.3, reviewCount: 634, distance: 8.1, address: `780 Dealer Row, ${location}`, rank: 3 },
    { name: 'Sunrise Dealership', rating: 4.1, reviewCount: 421, distance: 11.4, address: `2100 Highway 9 S, ${location}`, rank: 4 },
    { name: 'Valley Auto Sales', rating: 3.9, reviewCount: 318, distance: 14.7, address: `5600 Commerce Dr, ${location}`, rank: 5 },
  ];
}

async function executeScanCompetitorRadar(
  args: Record<string, any>,
  agentId: string,
  sessionId: string,
  onProgress?: ProgressCallback,
): Promise<ToolExecResult> {
  const address = args.address;
  if (!address) {
    return { content: 'Please provide a location or address to scan for competitors.' };
  }

  const radiusMiles = parseInt(args.radius_miles || '15', 10);
  const focusBrands = args.focus_brands || '';

  onProgress?.('Scanning competitor landscape...');

  let radarData: CompetitorRadarData;

  try {
    const token = localStorage.getItem('nexxus_access_token');
    const res = await fetch('/api/maps-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ address, radiusMiles, focusBrands }),
    });

    if (!res.ok) {
      throw new Error(`Maps API error: ${res.status}`);
    }

    const data = await res.json();
    if (data.competitors && data.competitors.length > 0) {
      radarData = {
        competitors: data.competitors.map((c: any, i: number) => ({
          name: c.name,
          rating: c.rating || 0,
          reviewCount: c.reviewCount || c.user_ratings_total || 0,
          distance: c.distance || 0,
          address: c.address || c.vicinity || '',
          rank: i + 1,
        })),
        searchLocation: address,
        isDemo: false,
      };
    } else {
      throw new Error('No results');
    }
  } catch {
    onProgress?.('Using demo data (no Maps API key configured)...');
    radarData = {
      competitors: generateMockCompetitors(address),
      searchLocation: address,
      isDemo: true,
    };
  }

  const competitorCount = radarData.competitors.length;
  const topCompetitor = radarData.competitors[0];

  const artifact = makeArtifact(
    'RADAR',
    `${competitorCount} competitors near ${address.slice(0, 40)}`,
    agentId,
    sessionId,
    undefined,
    undefined,
    { radarData },
  );

  const summary = radarData.isDemo
    ? `Found **${competitorCount} competing dealerships** near **${address}** (demo data). The top-ranked competitor is **${topCompetitor.name}** with a ${topCompetitor.rating} rating and ${topCompetitor.reviewCount} reviews at ${topCompetitor.distance} miles away.`
    : `Found **${competitorCount} competing dealerships** within ${radiusMiles} miles of **${address}**. The top-ranked competitor is **${topCompetitor.name}** with a ${topCompetitor.rating} rating and ${topCompetitor.reviewCount} reviews at ${topCompetitor.distance} miles away.`;

  return {
    content: summary,
    artifact,
    inlineRadarData: radarData,
    actionChips: [
      { label: 'Scan Another Area', icon: 'radar', action: 'scan_another_area' },
      { label: 'Export Report', icon: 'download', action: 'export_report' },
    ],
  };
}
