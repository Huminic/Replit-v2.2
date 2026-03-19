import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { canAccessSystem } from '@/lib/rbac';
import { ArrowLeft, Check, X, Crown, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PlanDetails {
  id: string;
  name: string;
  description?: string;
  lookup_key?: string;
  price?: number;
  prices?: Array<{ amount: number; currency: string; interval?: string }>;
  features?: Record<string, any>;
  [key: string]: any;
}

interface EntitlementItem {
  feature: string;
  name: string;
  allowed: boolean;
  limit?: number;
  used?: number;
  [key: string]: any;
}

interface PlanResponse {
  configured: boolean;
  plan: PlanDetails | null;
  entitlements: EntitlementItem[];
}

interface PlansResponse {
  plans: PlanDetails[];
}

interface EntitlementsResponse {
  configured: boolean;
  entitlements: EntitlementItem[];
}

export default function BillingPlan() {
  const [, setLocation] = useLocation();
  const { currentRole } = useApp();

  // RBAC guard: only admin roles can access billing
  useEffect(() => {
    if (!canAccessSystem(currentRole)) {
      setLocation('/');
    }
  }, [currentRole, setLocation]);

  const { data: planData, isLoading: planLoading } = useQuery<PlanResponse>({
    queryKey: ['/api/billing/plan'],
  });

  const { data: plansData, isLoading: plansLoading } = useQuery<PlansResponse>({
    queryKey: ['/api/billing/plans'],
  });

  const { data: entitlementData } = useQuery<EntitlementsResponse>({
    queryKey: ['/api/billing/entitlements'],
  });

  const isLoading = planLoading || plansLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center">
        <div className="w-full max-w-5xl p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (planData && planData.configured === false) {
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

  const currentPlan = planData?.plan;
  const planEntitlements = planData?.entitlements || [];
  const orgEntitlements = entitlementData?.entitlements || [];
  const allPlans = plansData?.plans || [];

  const booleanFeatures = orgEntitlements.filter(e => e.limit == null || e.limit === 0);
  const meteredFeatures = orgEntitlements.filter(e => e.limit != null && e.limit > 0);

  function getPlanPrice(plan: PlanDetails): string {
    if (plan.prices && plan.prices.length > 0) {
      const price = plan.prices[0];
      return `$${Number(price.amount).toLocaleString('en-US', { minimumFractionDigits: 0 })}/${price.interval || 'mo'}`;
    }
    if (plan.price != null) {
      return `$${Number(plan.price).toLocaleString('en-US', { minimumFractionDigits: 0 })}/mo`;
    }
    return 'Contact us';
  }

  return (
    <div className="flex flex-col h-full items-center">
      <div className="w-full max-w-5xl p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/settings/billing">
            <Button variant="ghost" size="icon" data-testid="link-back-billing">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground" data-testid="text-plan-title">Your Plan</h1>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="p-4 max-w-5xl mx-auto space-y-6">
          {currentPlan && (
            <Card data-testid={`plan-card-${currentPlan.lookup_key || currentPlan.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <CardTitle className="text-lg" data-testid="text-current-plan-name">{currentPlan.name}</CardTitle>
                  <Badge data-testid="badge-current-plan">Current Plan</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentPlan.description && (
                  <p className="text-sm text-muted-foreground" data-testid="text-plan-description">{currentPlan.description}</p>
                )}

                {(booleanFeatures.length > 0 || meteredFeatures.length > 0) && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Your plan includes</p>
                    <div className="space-y-2">
                      {booleanFeatures.map(feat => (
                        <div key={feat.feature} className="flex items-center gap-2" data-testid={`feature-${feat.feature}`}>
                          {feat.allowed ? (
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="text-sm text-foreground">{feat.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {meteredFeatures.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Metered Allocations</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {meteredFeatures.map(feat => (
                        <div key={feat.feature} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50" data-testid={`metered-${feat.feature}`}>
                          <span className="text-sm text-foreground">{feat.name}</span>
                          <span className="text-sm font-medium text-foreground">{feat.limit?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!currentPlan && (
            <Card>
              <CardContent className="p-6 text-center">
                <Crown className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground" data-testid="text-no-plan">No active plan. Contact your administrator to get started.</p>
              </CardContent>
            </Card>
          )}

          {allPlans.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-foreground mb-3" data-testid="text-compare-plans-title">Compare Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="plan-comparison-grid">
                {allPlans.map(plan => {
                  const isCurrentPlan = currentPlan && (plan.id === currentPlan.id || plan.lookup_key === currentPlan.lookup_key);
                  return (
                    <Card
                      key={plan.id}
                      className={isCurrentPlan ? 'border-primary' : ''}
                      data-testid={`plan-card-${plan.lookup_key || plan.id}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <CardTitle className="text-base" data-testid={`text-plan-name-${plan.id}`}>{plan.name}</CardTitle>
                          {isCurrentPlan && (
                            <Badge data-testid={`badge-current-${plan.id}`}>Current Plan</Badge>
                          )}
                        </div>
                        <p className="text-xl font-bold text-foreground" data-testid={`text-plan-price-${plan.id}`}>
                          {getPlanPrice(plan)}
                        </p>
                      </CardHeader>
                      <CardContent>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                        )}
                        {planEntitlements.length > 0 && (
                          <div className="space-y-1.5">
                            {planEntitlements.map(ent => (
                              <div key={ent.feature} className="flex items-center gap-2">
                                {ent.allowed ? (
                                  <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                                ) : (
                                  <X className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {ent.name}
                                  {ent.limit != null && ent.limit > 0 && ` (${ent.limit.toLocaleString()})`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
