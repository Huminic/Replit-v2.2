import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  Wallet, Crown, BarChart3, ArrowRight, Loader2,
  Phone, Video, MessageSquare, Brain, Image, Film, AlertCircle, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { canAccessSystem } from '@/lib/rbac';

interface UsageMeter {
  name: string;
  value: number;
  aggregation: string;
}

interface BillingSummary {
  configured: boolean;
  message?: string;
  plan: { name: string; id: string } | null;
  tier: string | null;
  creditBalance: { balance: number; currency: string };
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
  voice_minute: 'min',
  video_minute: 'min',
  sms_sent: 'msgs',
  llm_input_tokens: 'tokens',
  llm_output_tokens: 'tokens',
  image_generated: 'images',
  video_generated: 'sec',
};

function getUsageColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getBalanceClasses(balance: number): string {
  if (balance > 50) return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
  if (balance > 20) return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';
  return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
}

function getBalanceTextColor(balance: number): string {
  if (balance > 50) return 'text-green-700 dark:text-green-400';
  if (balance > 20) return 'text-yellow-700 dark:text-yellow-400';
  return 'text-red-700 dark:text-red-400';
}

export default function BillingDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { currentRole } = useApp();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');

  // RBAC guard: only admin roles can access billing
  useEffect(() => {
    if (!canAccessSystem(currentRole)) {
      setLocation('/');
    }
  }, [currentRole, setLocation]);

  const { data: summary, isLoading } = useQuery<BillingSummary>({
    queryKey: ['/api/billing/summary'],
  });

  const topUpMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest('POST', '/api/billing/topup', { amount });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/billing/usage'] });
      setTopUpOpen(false);
      setTopUpAmount('');
      toast({ title: 'Wallet topped up', description: `New balance: $${data.balance?.balance?.toFixed(2) ?? 'updated'}` });
    },
    onError: (err: any) => {
      toast({ title: 'Top up failed', description: err.message || 'An error occurred', variant: 'destructive' });
    },
  });

  const { data: entitlementData } = useQuery<{ configured: boolean; entitlements: EntitlementItem[] }>({
    queryKey: ['/api/billing/entitlements'],
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center">
        <div className="w-full max-w-5xl p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!summary || summary.configured === false) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground mb-1" data-testid="text-billing-not-configured">Billing Not Configured</h2>
            <p className="text-sm text-muted-foreground" data-testid="text-billing-not-configured-msg">
              Billing is not yet configured for your organization. Contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const entitlements = entitlementData?.entitlements || [];
  const entitlementMap = new Map(entitlements.map(e => [e.feature, e]));
  const usageEntries = Object.entries(summary.usage || {});
  const balanceDollars = summary.creditBalance?.balance ?? 0;
  const balancePct = balanceDollars > 0 ? Math.min(100, balanceDollars) : 0;

  return (
    <div className="flex flex-col h-full items-center">
      <div className="w-full max-w-5xl p-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground" data-testid="text-billing-title">Billing & Usage</h1>
        <p className="text-sm text-muted-foreground" data-testid="text-billing-subtitle">
          {summary.plan ? summary.plan.name : 'No active plan'}
        </p>
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="p-4 max-w-5xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className={`border ${getBalanceClasses(balancePct)}`} data-testid="card-credit-balance">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Credit Balance</CardTitle>
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${getBalanceTextColor(balancePct)}`} data-testid="text-credit-balance">
                  ${balanceDollars.toFixed(2)}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {summary.creditBalance?.currency || 'USD'}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setTopUpOpen(true)} data-testid="button-top-up-wallet">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Top Up
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-current-plan">
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Plan</CardTitle>
                <Crown className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground" data-testid="text-plan-name">
                  {summary.plan?.name || 'None'}
                </p>
                {summary.tier && (
                  <Badge variant="secondary" className="mt-1" data-testid="badge-plan-tier">
                    {summary.tier}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-base font-semibold text-foreground mb-3" data-testid="text-usage-overview-title">Usage Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usageEntries.map(([meterId, meter]) => {
                const entitlement = entitlementMap.get(meterId);
                const used = meter.value ?? 0;
                const limit = entitlement?.limit;
                const hasLimit = limit != null && limit > 0;
                const pct = hasLimit ? Math.min(100, (used / limit) * 100) : 0;
                const MeterIcon = meterIcons[meterId] || BarChart3;
                const unit = meterUnits[meterId] || '';

                return (
                  <Card key={meterId} data-testid={`card-usage-${meterId}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <MeterIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{meter.name}</span>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-xl font-bold text-foreground" data-testid={`text-usage-value-${meterId}`}>
                          {used.toLocaleString()}
                        </span>
                        {hasLimit && (
                          <span className="text-sm text-muted-foreground" data-testid={`text-usage-limit-${meterId}`}>
                            / {limit.toLocaleString()} {unit}
                          </span>
                        )}
                        {!hasLimit && unit && (
                          <span className="text-sm text-muted-foreground">{unit}</span>
                        )}
                      </div>
                      {hasLimit && (
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden" data-testid={`bar-usage-${meterId}`}>
                          <div
                            className={`h-full rounded-full transition-all ${getUsageColor(pct)}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      )}
                      {hasLimit && (
                        <p className="text-xs text-muted-foreground mt-1">{pct.toFixed(0)}% used</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/settings/billing/usage">
              <Button variant="outline" size="sm" data-testid="link-view-usage">
                View Usage Details
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link href="/settings/billing/plan">
              <Button variant="outline" size="sm" data-testid="link-manage-plan">
                Manage Plan
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link href="/settings/billing/invoices">
              <Button variant="outline" size="sm" data-testid="link-invoice-history">
                Invoice History
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </ScrollArea>

      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="topup-amount">Amount (USD)</Label>
              <Input
                id="topup-amount"
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                data-testid="input-topup-amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTopUpOpen(false); setTopUpAmount(''); }} data-testid="button-cancel-topup">
              Cancel
            </Button>
            <Button
              onClick={() => {
                const amount = parseFloat(topUpAmount);
                if (!amount || amount <= 0) {
                  toast({ title: 'Invalid amount', description: 'Please enter a positive amount.', variant: 'destructive' });
                  return;
                }
                topUpMutation.mutate(amount);
              }}
              disabled={topUpMutation.isPending}
              data-testid="button-confirm-topup"
            >
              {topUpMutation.isPending ? 'Processing...' : 'Top Up'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
