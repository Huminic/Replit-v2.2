import { useState, useCallback, useRef, useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';

interface UseStreamingChatOptions {
  conversationId: string | null;
  agentId?: string;
}

interface UseStreamingChatReturn {
  sendMessage: (content: string) => Promise<void>;
  isStreaming: boolean;
  streamingContent: string;
  statusMessage: string | null;
  error: string | null;
}

function parseSSELines(lines: string[], accumulated: { text: string }, setStreamingContent: (s: string) => void, setStatusMessage: (s: string | null) => void): boolean {
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const jsonStr = line.slice(6).trim();
    if (!jsonStr) continue;

    try {
      const event = JSON.parse(jsonStr);

      if (event.type === 'content') {
        setStatusMessage(null);
        accumulated.text += event.text;
        setStreamingContent(accumulated.text);
      } else if (event.type === 'status') {
        setStatusMessage(event.text || 'Working...');
      } else if (event.type === 'done') {
        setStatusMessage(null);
        return true;
      } else if (event.type === 'error') {
        setStatusMessage(null);
        throw new Error(event.message || 'Stream error');
      }
    } catch (parseErr) {
      if (parseErr instanceof SyntaxError) continue;
      throw parseErr;
    }
  }
  return false;
}

export function useStreamingChat({ conversationId, agentId }: UseStreamingChatOptions): UseStreamingChatReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId) return;

    if (abortRef.current) {
      abortRef.current.abort();
    }

    setIsStreaming(true);
    setStreamingContent('');
    setStatusMessage(null);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const accessToken = localStorage.getItem('nexxus_access_token');
      const response = await fetch(`/api/chat/${conversationId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ content, agentId }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: 'Stream request failed' }));
        throw new Error(errData.message || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      const accumulated = { text: '' };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        const streamDone = parseSSELines(lines, accumulated, setStreamingContent, setStatusMessage);
        if (streamDone) break;
      }

      if (buffer.trim()) {
        parseSSELines([buffer], accumulated, setStreamingContent, setStatusMessage);
      }

      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Streaming chat error:', err);
      setError(err.message || 'Failed to get AI response');
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [conversationId, agentId]);

  return { sendMessage, isStreaming, streamingContent, statusMessage, error };
}
