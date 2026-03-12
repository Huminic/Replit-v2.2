import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  ArrowLeft, Phone, Video, MessageSquare, Brain, Image, Film, BarChart3, AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UsageMeter {
  name: string;
  value: number;
  aggregation: string;
}

interface BillingUsageData {
  configured: boolean;
  message?: string;
  billingPeriod?: { start: string; end: string };
  usage: Record<string, UsageMeter>;
}

interface EntitlementItem {
  feature: string;
  name: string;
  allowed: boolean;
  limit?: number;
  used?: number;
}

const meterIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  voice_minute: Phone,
  video_minute: Video,
  sms_sent: MessageSquare,
  llm_input_tokens: Brain,
  llm_output_tokens: Brain,
  image_generated: Image,
  video_generated: Film,
};

const meterUnits: Record<string, string> = {
  voice_minute: 'minutes',
  video_minute: 'minutes',
  sms_sent: 'messages',
  llm_input_tokens: 'tokens',
  llm_output_tokens: 'tokens',
  image_generated: 'images',
  video_generated: 'seconds',
};

function getUsageColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getUsageBadgeVariant(pct: number): 'destructive' | 'secondary' | 'default' {
  if (pct >= 90) return 'destructive';
  if (pct >= 70) return 'secondary';
  return 'default';
}

export default function BillingUsage() {
  const { data: usageData, isLoading } = useQuery<BillingUsageData>({
    queryKey: ['/api/billing/usage'],
  });

  const { data: entitlementData } = useQuery<{ configured: boolean; entitlements: EntitlementItem[] }>({
    queryKey: ['/api/billing/entitlements'],
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center">
        <div className="w-full max-w-5xl p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!usageData || usageData.configured === false) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground mb-1" data-testid="text-billing-not-configured">Billing Not Configured</h2>
            <p className="text-sm text-muted-foreground">
              Billing is not yet configured for your organization. Contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const entitlements = entitlementData?.entitlements || [];
  const entitlementMap = new Map(entitlements.map(e => [e.feature, e]));
  const usageEntries = Object.entries(usageData.usage || {});

  return (
    <div className="flex flex-col h-full items-center">
      <div className="w-full max-w-5xl p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/settings/billing">
            <Button variant="ghost" size="icon" data-testid="link-back-billing">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground" data-testid="text-usage-title">Usage Details</h1>
        </div>
        {usageData.billingPeriod && (
          <p className="text-sm text-muted-foreground ml-12" data-testid="text-billing-period">
            {new Date(usageData.billingPeriod.start).toLocaleDateString()} — {new Date(usageData.billingPeriod.end).toLocaleDateString()}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="p-4 max-w-5xl mx-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {usageEntries.map(([meterId, meter]) => {
              const entitlement = entitlementMap.get(meterId);
              const used = meter.value ?? 0;
              const limit = entitlement?.limit;
              const hasLimit = limit != null && limit > 0;
              const pct = hasLimit ? Math.min(100, (used / limit) * 100) : 0;
              const MeterIcon = meterIcons[meterId] || BarChart3;
              const unit = meterUnits[meterId] || '';

              return (
                <Card key={meterId} data-testid={`card-usage-detail-${meterId}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                          <MeterIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground" data-testid={`text-meter-name-${meterId}`}>{meter.name}</p>
                          <Badge variant="outline" className="text-[10px] mt-0.5" data-testid={`badge-aggregation-${meterId}`}>
                            {meter.aggregation}
                          </Badge>
                        </div>
                      </div>
                      {hasLimit && (
                        <Badge variant={getUsageBadgeVariant(pct)} data-testid={`badge-usage-pct-${meterId}`}>
                          {pct.toFixed(0)}%
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold text-foreground" data-testid={`text-usage-current-${meterId}`}>
                        {used.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">{unit}</span>
                      {hasLimit && (
                        <span className="text-sm text-muted-foreground" data-testid={`text-usage-of-limit-${meterId}`}>
                          / {limit.toLocaleString()} {unit}
                        </span>
                      )}
                    </div>

                    {hasLimit && (
                      <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getUsageColor(pct)}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                          data-testid={`bar-usage-detail-${meterId}`}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {usageEntries.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground" data-testid="text-no-usage">No usage data available for this period.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
