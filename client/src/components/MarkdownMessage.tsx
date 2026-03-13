import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkdownMessageProps {
  content: string;
  isStreaming?: boolean;
  showActions?: boolean;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  rawContent?: string;
}

export function MarkdownMessage({ content, isStreaming, showActions = true, isLastAssistant, onRegenerate, rawContent }: MarkdownMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawContent || content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="group relative">
      <div className="markdown-message text-sm leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          disallowedElements={['script', 'iframe', 'object', 'embed', 'form', 'input', 'style']}
          unwrapDisallowed={true}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            em: ({ children }) => <em>{children}</em>,
            ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-sm">{children}</li>,
            h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
            h2: ({ children }) => <h2 className="text-sm font-bold mb-1.5">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
            code: ({ className, children, ...props }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                    {children}
                  </code>
                );
              }
              return (
                <code className={cn("block text-xs font-mono", className)} {...props}>
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="bg-muted/80 border border-border rounded-lg p-3 mb-2 overflow-x-auto text-xs">
                {children}
              </pre>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto mb-2">
                <table className="min-w-full border border-border text-xs">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
            th: ({ children }) => <th className="border border-border px-2 py-1 text-left font-semibold">{children}</th>,
            td: ({ children }) => <td className="border border-border px-2 py-1">{children}</td>,
            a: ({ children, href }) => {
              const safeHref = href && /^(https?:|mailto:|tel:)/i.test(href) ? href : undefined;
              return (
                <a href={safeHref} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">
                  {children}
                </a>
              );
            },
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-primary/30 pl-3 italic text-muted-foreground mb-2">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="my-3 border-border" />,
          }}
        >
          {content}
        </ReactMarkdown>
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-primary/70 animate-pulse ml-0.5 align-text-bottom" />
        )}
      </div>
      {showActions && !isStreaming && content && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1" data-testid="message-actions">
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-copy-message"
            title="Copy message"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          {isLastAssistant && onRegenerate && (
            <button
              onClick={onRegenerate}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-regenerate"
              title="Regenerate response"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
