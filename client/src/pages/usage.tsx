import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, MessageSquare, Phone, Mail, Calendar, ArrowUpDown, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { getAccessToken } from '@/lib/tokenStore';
import { MobileNavDropdown } from '@/components/layout/MobileNavDropdown';

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: typeof MessageSquare; color: string }> = {
  outbound_sms: { label: 'SMS Sent', icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
  outbound_email: { label: 'Emails Sent', icon: Mail, color: 'text-purple-600 bg-purple-50' },
  outbound_phone: { label: 'Phone Calls', icon: Phone, color: 'text-green-600 bg-green-50' },
  outbound_sms_blocked: { label: 'SMS Blocked', icon: MessageSquare, color: 'text-red-600 bg-red-50' },
  outbound_email_blocked: { label: 'Emails Blocked', icon: Mail, color: 'text-red-600 bg-red-50' },
  outbound_phone_blocked: { label: 'Phone Blocked', icon: Phone, color: 'text-red-600 bg-red-50' },
  outbound_sms_failed: { label: 'SMS Failed', icon: MessageSquare, color: 'text-orange-600 bg-orange-50' },
  outbound_email_failed: { label: 'Emails Failed', icon: Mail, color: 'text-orange-600 bg-orange-50' },
  outbound_phone_failed: { label: 'Phone Failed', icon: Phone, color: 'text-orange-600 bg-orange-50' },
};

function getEventConfig(eventType: string) {
  return EVENT_TYPE_CONFIG[eventType] || { label: eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), icon: BarChart3, color: 'text-gray-600 bg-gray-50' };
}

export default function UsagePage() {
  const { currentRole } = useApp();
  const [period, setPeriod] = useState('current_month');

  const isPartnerOrAbove = currentRole && ['super_admin', 'partner_admin'].includes(currentRole);

  const { data: summaryData = [], isLoading, isError, error } = useQuery<Array<{
    organizationId: string;
    organizationName: string;
    period: { start: string; end: string };
    usage: Array<{ eventType: string; total: number }>;
  }>>({
    queryKey: ['/api/usage/summary', { period }],
    queryFn: async () => {
      const now = new Date();
      let startDate: string, endDate: string;
      if (period === 'current_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDate = now.toISOString();
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
      }
      const token = getAccessToken();
      const res = await fetch(`/api/usage/summary?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch usage data (${res.status})`);
      }
      return res.json();
    },
  });

  const allUsage = summaryData.flatMap(s => s.usage);
  const totalEvents = allUsage.reduce((sum, u) => sum + u.total, 0);

  const aggregatedUsage: Record<string, number> = {};
  for (const entry of allUsage) {
    aggregatedUsage[entry.eventType] = (aggregatedUsage[entry.eventType] || 0) + entry.total;
  }

  if (currentRole && !['super_admin', 'partner_admin', 'org_admin'].includes(currentRole)) {
    return (
      <div className="flex-1 flex items-center justify-center p-8" data-testid="usage-access-denied">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Usage data is available to Organization Admins and above.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="usage-page">
      <div className="flex items-center justify-between h-14 px-6 border-b border-border bg-background flex-shrink-0">
        <div className="flex items-center gap-3">
          <MobileNavDropdown currentPath="/usage" currentLabel="Usage" />
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground" data-testid="text-usage-title">Usage</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]" data-testid="select-usage-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isError && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30" data-testid="usage-error-banner">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Failed to load usage data</p>
              <p className="text-xs text-red-600 dark:text-red-400">{(error as Error)?.message || 'An unexpected error occurred. Please try again.'}</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold" data-testid="text-total-events">{totalEvents.toLocaleString()}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Event Types</p>
                  <p className="text-2xl font-bold" data-testid="text-event-types">{Object.keys(aggregatedUsage).length}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ArrowUpDown className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{isPartnerOrAbove ? 'Organizations' : 'Period'}</p>
                  <p className="text-2xl font-bold" data-testid="text-org-count">
                    {isPartnerOrAbove ? summaryData.length : (period === 'current_month' ? 'Current Month' : 'Last Month')}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading usage data...</div>
            ) : Object.keys(aggregatedUsage).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-usage">
                No usage events recorded for this period.
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(aggregatedUsage)
                  .sort(([, a], [, b]) => b - a)
                  .map(([eventType, total]) => {
                    const config = getEventConfig(eventType);
                    const Icon = config.icon;
                    const maxTotal = Math.max(...Object.values(aggregatedUsage));
                    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                    return (
                      <div key={eventType} className="flex items-center gap-3" data-testid={`usage-row-${eventType}`}>
                        <div className={`h-8 w-8 rounded-md flex items-center justify-center ${config.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{config.label}</span>
                            <Badge variant="secondary" className="text-xs">{total.toLocaleString()}</Badge>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {isPartnerOrAbove && summaryData.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usage by Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summaryData.map(org => {
                  const orgTotal = org.usage.reduce((s, u) => s + u.total, 0);
                  return (
                    <div key={org.organizationId} className="border rounded-lg p-4" data-testid={`usage-org-${org.organizationId}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{org.organizationName}</span>
                        <Badge variant="outline">{orgTotal.toLocaleString()} events</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {org.usage.map(u => {
                          const config = getEventConfig(u.eventType);
                          return (
                            <Badge key={u.eventType} variant="secondary" className="text-xs">
                              {config.label}: {u.total}
                            </Badge>
                          );
                        })}
                        {org.usage.length === 0 && (
                          <span className="text-xs text-muted-foreground">No events</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
