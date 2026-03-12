import { cn } from '@/lib/utils';

interface UsageMeterBarProps {
  name: string;
  used: number;
  limit?: number;
  unit?: string;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getBarColor(pct: number): string {
  if (pct > 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function UsageMeterBar({ name, used, limit, unit }: UsageMeterBarProps) {
  const slug = slugify(name);
  const hasLimit = limit != null && limit > 0;
  const pct = hasLimit ? Math.min(100, (used / limit!) * 100) : 0;

  return (
    <div className="space-y-1" data-testid={`usage-meter-${slug}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{name}</span>
        <span className="text-xs text-muted-foreground">
          {hasLimit ? (
            <>{used.toLocaleString()} / {limit!.toLocaleString()} {unit || ''}</>
          ) : (
            <>{used.toLocaleString()} {unit || ''}</>
          )}
        </span>
      </div>
      {hasLimit && (
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', getBarColor(pct))}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
      )}
    </div>
  );
}
