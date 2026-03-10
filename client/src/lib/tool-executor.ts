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

export interface ToolExecResult {
  content: string;
  artifact?: MarketingArtifact;
  actionChips?: Array<{ label: string; icon: string; action: string }>;
  inlineMedia?: { type: 'image' | 'video' | 'audio'; url: string };
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
      { label: '⬇ Download audio', icon: 'download', action: 'download_audio' },
    ],
  };
}
