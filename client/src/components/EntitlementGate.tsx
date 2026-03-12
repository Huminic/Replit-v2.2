import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Lock } from 'lucide-react';

interface EntitlementItem {
  feature: string;
  name: string;
  allowed: boolean;
  limit?: number;
  used?: number;
}

interface EntitlementsResponse {
  configured: boolean;
  entitlements?: EntitlementItem[];
  message?: string;
}

interface EntitlementGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function UpgradeCTA() {
  return (
    <Link href="/settings/billing/plan">
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-muted/50 dark:bg-muted/30 text-muted-foreground text-xs cursor-pointer hover-elevate"
        data-testid="upgrade-cta"
      >
        <Lock className="h-3 w-3" />
        <span>Upgrade to unlock</span>
      </div>
    </Link>
  );
}

export function EntitlementGate({ feature, children, fallback }: EntitlementGateProps) {
  const { data, isLoading } = useQuery<EntitlementsResponse>({
    queryKey: ['/api/billing/entitlements'],
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <div data-testid={`entitlement-gate-${feature}`}>{children}</div>;
  }

  if (!data || data.configured === false) {
    return <div data-testid={`entitlement-gate-${feature}`}>{children}</div>;
  }

  const entitlement = data.entitlements?.find(e => e.feature === feature);
  const allowed = !entitlement || entitlement.allowed;

  if (allowed) {
    return <div data-testid={`entitlement-gate-${feature}`}>{children}</div>;
  }

  return (
    <div data-testid={`entitlement-gate-${feature}`}>
      {fallback || <UpgradeCTA />}
    </div>
  );
}
