import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { useApp } from '@/contexts/AppContext';
import { canAccessSystem } from '@/lib/rbac';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Invoice {
  id: string;
  amount_due?: number;
  amount?: number;
  total?: number;
  currency?: string;
  status?: string;
  created_at?: string;
  invoice_date?: string;
  due_date?: string;
  invoice_number?: string;
  [key: string]: any;
}

interface InvoiceResponse {
  configured: boolean;
  message?: string;
  invoices: Invoice[];
}

function getStatusBadge(status: string | undefined) {
  const s = (status || '').toLowerCase();
  if (s === 'paid' || s === 'finalized') {
    return <Badge variant="default" className="bg-green-600 dark:bg-green-700 text-white no-default-hover-elevate no-default-active-elevate">{status}</Badge>;
  }
  if (s === 'pending' || s === 'draft' || s === 'open') {
    return <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 no-default-hover-elevate no-default-active-elevate">{status}</Badge>;
  }
  if (s === 'overdue' || s === 'void' || s === 'uncollectible') {
    return <Badge variant="destructive">{status}</Badge>;
  }
  return <Badge variant="outline">{status || 'Unknown'}</Badge>;
}

function formatAmount(invoice: Invoice): string {
  const amount = invoice.amount_due ?? invoice.total ?? invoice.amount ?? 0;
  return `$${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function BillingInvoices() {
  const [, setLocation] = useLocation();
  const { currentRole } = useApp();

  // RBAC guard: only admin roles can access billing
  useEffect(() => {
    if (!canAccessSystem(currentRole)) {
      setLocation('/');
    }
  }, [currentRole, setLocation]);

  const { data: invoiceData, isLoading } = useQuery<InvoiceResponse>({
    queryKey: ['/api/billing/invoices'],
  });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center">
        <div className="w-full max-w-5xl p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!invoiceData || invoiceData.configured === false) {
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

  const invoices = invoiceData.invoices || [];

  return (
    <div className="flex flex-col h-full items-center">
      <div className="w-full max-w-5xl p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/settings/billing">
            <Button variant="ghost" size="icon" data-testid="link-back-billing">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground" data-testid="text-invoices-title">Invoice History</h1>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="p-4 max-w-5xl mx-auto">
          {invoices.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground" data-testid="text-no-invoices">No invoices yet</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table data-testid="invoice-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invoice ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id} data-testid={`invoice-row-${invoice.id}`}>
                        <TableCell data-testid={`text-invoice-date-${invoice.id}`}>
                          {formatDate(invoice.invoice_date || invoice.created_at)}
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-invoice-amount-${invoice.id}`}>
                          {formatAmount(invoice)}
                        </TableCell>
                        <TableCell data-testid={`badge-invoice-status-${invoice.id}`}>
                          {getStatusBadge(invoice.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono" data-testid={`text-invoice-id-${invoice.id}`}>
                          {invoice.invoice_number || invoice.id}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
