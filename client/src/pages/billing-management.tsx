/**
 * Billing Management Page — Partner and super admin billing dashboard.
 *
 * RBAC: Restricted to super_admin and partner_admin. Other roles see "Access Denied" card.
 * Route: /settings/billing
 *
 * === SuperAdminBillingView ===
 * Full revenue management for all organizations:
 * - Revenue Overview: MRR, Active Accounts, Avg Rev/Account, Overage Revenue,
 *   Outstanding Invoices, Collected This Month.
 * - Organization Billing Status: Table of all orgs with billing on/off, anniversary date,
 *   base fee, usage, status. Expandable rows show BillingConfigSection.
 * - BillingConfigSection: Per-org config — billing toggle, anniversary date, base fee,
 *   setup fee, default voice/video minutes, overage rates, payment reminders.
 * - Invoice Builder: Select org, date range, auto-populated line items (Monthly Base,
 *   Voice Usage, Video, SMS Bundle). Add line item, preview, and send buttons.
 *
 * === PartnerAdminBillingView ===
 * Read-only view of partner's managed organizations:
 * - Org table: Name, status, MRR, last invoice date.
 * - Summary cards: Total MRR and Active Accounts.
 * - "Add Organization" button links to /settings/org-wizard.
 *
 * PRODUCTION NOTE: Billing data and invoice generation will wire to backend billing system.
 * Overage calculation based on usage tracking from metering system (Wave 3).
 *
 * @see client/src/pages/profile.tsx — Individual user billing view (Billing tab)
 * @see client/src/pages/org-wizard.tsx — New org creation with billing config
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  DollarSign, TrendingUp, Users, CreditCard, FileText, Plus,
  ArrowUpRight, Eye, Send, ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/contexts/AppContext';
import { MobileNavDropdown } from '@/components/layout/MobileNavDropdown';

function SuperAdminBillingView() {
  const { toast } = useToast();
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  const revenueMetrics = [
    { label: 'MRR', value: '$12,450', change: '8%', up: true },
    { label: 'Active Accounts', value: '24', change: '', up: false },
    { label: 'Avg Rev/Account', value: '$518.75', change: '', up: false },
    { label: 'Overage Revenue', value: '$1,847', change: '', up: false },
    { label: 'Outstanding Invoices', value: '3 ($890)', change: '', up: false },
    { label: 'Collected This Month', value: '$11,560', change: '', up: false },
  ];

  const orgBillingData = [
    { id: 'serra', name: 'Serra Honda', billing: true, anniversary: '3/15', baseFee: '$99', usage: '$37', status: 'Paid' },
    { id: 'hyundai', name: 'Hyundai Col', billing: true, anniversary: '4/01', baseFee: '$149', usage: '$52', status: 'Due' },
    { id: 'demo', name: 'Demo Org', billing: false, anniversary: '--', baseFee: '--', usage: '--', status: '--' },
  ];

  const invoiceLineItems = [
    { desc: 'Monthly Base', amount: '$99.00' },
    { desc: 'Voice Usage', amount: '$11.75' },
    { desc: 'Video', amount: '$0.00' },
    { desc: 'SMS Bundle', amount: '$25.00' },
  ];

  const invoiceTotal = '$135.75';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3" data-testid="text-revenue-overview-title">Revenue Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {revenueMetrics.map((metric) => (
            <Card key={metric.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xl font-bold text-foreground" data-testid={`text-metric-${metric.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>{metric.value}</p>
                  {metric.change && (
                    <Badge variant="secondary" className="gap-0.5">
                      <ArrowUpRight className="h-3 w-3" />
                      {metric.change}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <h2 className="text-base font-semibold text-foreground" data-testid="text-org-billing-title">Organization Billing Status</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={() => toast({ title: 'Send Invoice', description: 'Invoice sending is not available in demo mode.' })} data-testid="button-send-invoice">
              <Send className="h-3 w-3 mr-1" />
              Send Invoice
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast({ title: 'Add Manual Add-On', description: 'Manual add-ons are not available in demo mode.' })} data-testid="button-add-addon">
              <Plus className="h-3 w-3 mr-1" />
              Add Manual Add-On
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Org Name</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Anniversary</TableHead>
                  <TableHead>Base Fee</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgBillingData.map((org) => (
                  <>
                    <TableRow key={org.id} className="cursor-pointer" onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)} data-testid={`row-org-billing-${org.id}`}>
                      <TableCell className="font-medium" data-testid={`text-org-name-${org.id}`}>{org.name}</TableCell>
                      <TableCell>
                        <Badge variant={org.billing ? 'default' : 'secondary'} data-testid={`badge-billing-${org.id}`}>
                          {org.billing ? 'ON' : 'OFF'}
                        </Badge>
                      </TableCell>
                      <TableCell>{org.anniversary}</TableCell>
                      <TableCell>{org.baseFee}</TableCell>
                      <TableCell>{org.usage}</TableCell>
                      <TableCell>
                        {org.status !== '--' ? (
                          <Badge variant={org.status === 'Paid' ? 'secondary' : 'outline'} data-testid={`badge-status-${org.id}`}>
                            {org.status}
                          </Badge>
                        ) : '--'}
                      </TableCell>
                      <TableCell>
                        {expandedOrg === org.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                    </TableRow>
                    {expandedOrg === org.id && (
                      <TableRow key={`${org.id}-config`}>
                        <TableCell colSpan={7} className="p-0">
                          <BillingConfigSection orgName={org.name} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3" data-testid="text-invoice-builder-title">Invoice Builder</h2>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>To</Label>
                <Select defaultValue="serra">
                  <SelectTrigger data-testid="select-invoice-org">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serra">Serra Honda</SelectItem>
                    <SelectItem value="hyundai">Hyundai Col</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Input type="date" defaultValue="2026-02-01" className="flex-1" data-testid="input-invoice-period-start" />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input type="date" defaultValue="2026-02-28" className="flex-1" data-testid="input-invoice-period-end" />
                </div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceLineItems.map((item, i) => (
                  <TableRow key={i} data-testid={`row-invoice-line-${i}`}>
                    <TableCell>{item.desc}</TableCell>
                    <TableCell className="text-right font-medium">{item.amount}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-bold" data-testid="text-invoice-total">{invoiceTotal}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => toast({ title: 'Add Line Item', description: 'Line item added.' })} data-testid="button-add-line-item">
                <Plus className="h-3 w-3 mr-1" />
                Add Line Item
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast({ title: 'Preview', description: 'Invoice preview is not available in demo mode.' })} data-testid="button-preview-invoice">
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
              <Button size="sm" onClick={() => toast({ title: 'Invoice Sent', description: 'Invoice has been sent successfully.' })} data-testid="button-send-invoice-builder">
                <Send className="h-3 w-3 mr-1" />
                Send Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BillingConfigSection({ orgName }: { orgName: string }) {
  const { toast } = useToast();

  return (
    <div className="p-4 bg-muted/30 space-y-4 border-t border-border">
      <h3 className="text-sm font-semibold text-foreground" data-testid="text-billing-config-title">Billing Configuration</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Organization</Label>
          <Input defaultValue={orgName} readOnly data-testid="input-config-org" />
        </div>
        <div className="flex items-center gap-3">
          <Label>Billing Enabled</Label>
          <Switch defaultChecked data-testid="switch-billing-enabled" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Anniversary Date</Label>
          <Input type="date" defaultValue="2026-03-15" data-testid="input-anniversary-date" />
        </div>
        <div className="space-y-2">
          <Label>Base Monthly Fee</Label>
          <Input type="number" defaultValue="99" data-testid="input-base-fee" />
        </div>
        <div className="space-y-2">
          <Label>Setup Fee</Label>
          <Input type="number" defaultValue="0" data-testid="input-setup-fee" />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Default Minutes</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-muted-foreground">Voice</Label>
            <Input type="number" defaultValue="1000" className="w-24" data-testid="input-voice-minutes" />
            <span className="text-xs text-muted-foreground">min</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-muted-foreground">Video</Label>
            <Input type="number" defaultValue="500" className="w-24" data-testid="input-video-minutes" />
            <span className="text-xs text-muted-foreground">min</span>
          </div>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Overage Rates</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-muted-foreground">Voice</Label>
            <span className="text-sm text-foreground">$0.25/min</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-muted-foreground">Video</Label>
            <span className="text-sm text-foreground">$0.32/min</span>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Proration applies when billing is enabled mid-cycle.</p>
      <div className="flex items-center gap-3">
        <Label>Payment Reminders</Label>
        <Switch defaultChecked data-testid="switch-payment-reminders" />
      </div>
      <Button onClick={() => toast({ title: 'Configuration Saved', description: 'Billing configuration has been saved.' })} data-testid="button-save-billing-config">
        Save Configuration
      </Button>
    </div>
  );
}

function PartnerAdminBillingView() {
  const { toast } = useToast();

  const myOrgs = [
    { id: 'serra', name: 'Serra Honda', status: 'Active', mrr: '$136', lastInvoice: 'Feb 15' },
    { id: 'hyundai', name: 'Hyundai Col.', status: 'Active', mrr: '$201', lastInvoice: 'Feb 01' },
  ];

  const totalMRR = '$337';
  const activeAccounts = 2;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-base font-semibold text-foreground" data-testid="text-my-orgs-title">My Organizations</h2>
        <Button size="sm" onClick={() => window.location.href = '/settings/org-wizard'} data-testid="button-add-organization">
          <Plus className="h-3 w-3 mr-1" />
          Add Organization
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Org Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>Last Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myOrgs.map((org) => (
                <TableRow key={org.id} data-testid={`row-partner-org-${org.id}`}>
                  <TableCell className="font-medium" data-testid={`text-partner-org-name-${org.id}`}>{org.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" data-testid={`badge-partner-status-${org.id}`}>{org.status}</Badge>
                  </TableCell>
                  <TableCell data-testid={`text-partner-mrr-${org.id}`}>{org.mrr}</TableCell>
                  <TableCell>{org.lastInvoice}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total MRR</p>
            <p className="text-xl font-bold text-foreground" data-testid="text-partner-total-mrr">{totalMRR}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Active Accounts</p>
            <p className="text-xl font-bold text-foreground" data-testid="text-partner-active-accounts">{activeAccounts}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BillingManagementPage() {
  const [, setLocation] = useLocation();
  const { currentRole } = useApp();

  if (currentRole !== 'super_admin' && currentRole !== 'partner_admin') {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8">
        <Card>
          <CardContent className="p-6 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-foreground mb-1" data-testid="text-access-denied">Access Denied</h2>
            <p className="text-sm text-muted-foreground">You do not have permission to view billing management.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full items-center">
      <div className="w-full max-w-5xl p-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground" data-testid="text-billing-page-title">Billing Management</h1>
        <p className="text-sm text-muted-foreground">
          {currentRole === 'super_admin' ? 'Manage billing, invoicing, and revenue across all organizations' : 'View billing status for your organizations'}
        </p>
      </div>

      <div className="px-4 py-2 lg:hidden w-full max-w-5xl">
        <MobileNavDropdown currentPath="/settings/billing" currentLabel="Billing" />
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="p-4 max-w-5xl mx-auto">
          {currentRole === 'super_admin' ? <SuperAdminBillingView /> : <PartnerAdminBillingView />}
        </div>
      </ScrollArea>
    </div>
  );
}
