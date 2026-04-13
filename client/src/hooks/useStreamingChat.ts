import { useState, useCallback, useRef, useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';
import { getAccessToken } from '@/lib/tokenStore';

interface UseStreamingChatOptions {
  conversationId: string | null;
  agentId?: string;
  mode?: string;
  pageContext?: string;
  onComplete?: (content: string) => void;
}

interface UseStreamingChatReturn {
  sendMessage: (content: string) => Promise<void>;
  abortStream: () => void;
  retry: () => void;
  isStreaming: boolean;
  streamingContent: string;
  statusMessage: string | null;
  error: string | null;
  lastFailedContent: string | null;
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

export function useStreamingChat({ conversationId, agentId, mode, pageContext, onComplete }: UseStreamingChatOptions): UseStreamingChatReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedContent, setLastFailedContent] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  const abortStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
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
    setLastFailedContent(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const accessToken = getAccessToken();
      const response = await fetch(`/api/chat/${conversationId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ content, agentId, ...(mode ? { mode } : {}), ...(pageContext ? { pageContext } : {}) }),
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
      if (onComplete && accumulated.text) {
        onComplete(accumulated.text);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
        return;
      }
      console.error('Streaming chat error:', err);
      setError(err.message || 'Failed to get AI response');
      setLastFailedContent(content);
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      setStatusMessage(null);
      abortRef.current = null;
    }
  }, [conversationId, agentId, mode, pageContext, onComplete]);

  const retry = useCallback(() => {
    if (lastFailedContent) {
      sendMessage(lastFailedContent);
    }
  }, [lastFailedContent, sendMessage]);

  return { sendMessage, abortStream, retry, isStreaming, streamingContent, statusMessage, error, lastFailedContent };
}
