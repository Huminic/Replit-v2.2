export type StatusFamily = 'active' | 'new' | 'sold' | 'lost' | 'bad' | 'service' | 'non_customer' | 'unknown';

export function classifyVinStatus(status: string | null | undefined): StatusFamily {
  if (!status) return 'unknown';

  const upper = status.toUpperCase();

  if (upper === 'ACTIVE_NEW_LEAD' || status === 'new' || status === 'uncontacted') return 'new';

  if (upper.startsWith('ACTIVE_') || status === 'active' || status === 'hot' ||
      status === 'contacted' || status === 'appointment_set' || status === 'test_drive' ||
      status === 'negotiation') return 'active';

  if (upper.startsWith('SOLD_') || status === 'sold' || status === 'closed-won') return 'sold';

  if (upper.startsWith('LOST_') || status === 'lost') return 'lost';

  if (upper.startsWith('BAD_') || upper.includes('DUPLICATE')) return 'bad';

  if (upper.startsWith('SERVICE_')) return 'service';

  if (upper === 'NON_CUSTOMER_INITIATED_LEAD') return 'non_customer';

  return 'unknown';
}

export function isActiveLead(status: string | null | undefined): boolean {
  return classifyVinStatus(status) === 'active';
}

export function isNewLead(status: string | null | undefined): boolean {
  return classifyVinStatus(status) === 'new';
}

export function isSoldLead(status: string | null | undefined): boolean {
  return classifyVinStatus(status) === 'sold';
}

export function isLostLead(status: string | null | undefined): boolean {
  return classifyVinStatus(status) === 'lost';
}

export function isBadLead(status: string | null | undefined): boolean {
  return classifyVinStatus(status) === 'bad';
}

export function isServiceLead(status: string | null | undefined): boolean {
  return classifyVinStatus(status) === 'service';
}

export function isExcludedFromPipeline(status: string | null | undefined): boolean {
  const family = classifyVinStatus(status);
  return family === 'lost' || family === 'bad' || family === 'sold' || family === 'service' || family === 'non_customer' || family === 'unknown';
}
