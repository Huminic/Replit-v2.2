import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface BillingSummary {
  configured: boolean;
  creditBalance?: { balance: number; currency: string };
}

function getDotColor(dollars: number): string {
  if (dollars > 500) return 'bg-green-500';
  if (dollars >= 100) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function CreditBalanceIndicator() {
  const [, setLocation] = useLocation();
  const { data } = useQuery<BillingSummary>({
    queryKey: ['/api/billing/summary'],
    refetchInterval: 60000,
    staleTime: 30000,
  });

  if (!data || data.configured === false) return null;

  const dollars = (data.creditBalance?.balance ?? 0) / 100;

  return (
    <button
      onClick={() => setLocation('/settings/billing')}
      className={cn(
        'w-full flex flex-col items-center gap-1 py-2 px-1 rounded-md cursor-pointer',
        'hover-elevate'
      )}
      data-testid="credit-balance-indicator"
    >
      <div className="flex items-center gap-1.5">
        <span className={cn('h-2 w-2 rounded-full flex-shrink-0', getDotColor(dollars))} />
        <span className="text-[10px] font-medium text-foreground">
          ${dollars.toFixed(0)}
        </span>
      </div>
      <span className="text-[9px] text-muted-foreground leading-tight">Credits</span>
    </button>
  );
}
