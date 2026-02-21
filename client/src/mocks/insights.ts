// Mock insights and analytics data for Nexxus V2 UI prototype

export interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  dueDate: string;
  status: 'on_track' | 'at_risk' | 'behind' | 'completed';
}

export interface CommandCenterLead {
  id: string;
  leadId: string;
  daysOld: number;
  hoursOld?: number;
  type: string;
  source: string;
  vehicle?: string;
  status?: string;
  isHot?: boolean;
}

export const mockMetrics: MetricCard[] = [
  {
    id: 'metric-1',
    title: 'Total Leads',
    value: 247,
    change: 12,
    changeLabel: 'vs last week',
    trend: 'up',
  },
  {
    id: 'metric-2',
    title: 'Conversion Rate',
    value: '18.5%',
    change: 2.3,
    changeLabel: 'vs last week',
    trend: 'up',
  },
  {
    id: 'metric-3',
    title: 'Agent Interactions',
    value: 1842,
    change: -5,
    changeLabel: 'vs last week',
    trend: 'down',
  },
  {
    id: 'metric-4',
    title: 'Avg Response Time',
    value: '2.3s',
    change: -0.5,
    changeLabel: 'vs last week',
    trend: 'up',
  },
  {
    id: 'metric-5',
    title: 'Customer Satisfaction',
    value: '4.8',
    change: 0.2,
    changeLabel: 'vs last month',
    trend: 'up',
  },
  {
    id: 'metric-6',
    title: 'Tasks Completed',
    value: 89,
    change: 15,
    changeLabel: 'vs last week',
    trend: 'up',
  },
];

export const mockLeadsChart: ChartDataPoint[] = [
  { date: '2026-01-15', value: 32, label: 'Mon' },
  { date: '2026-01-16', value: 28, label: 'Tue' },
  { date: '2026-01-17', value: 45, label: 'Wed' },
  { date: '2026-01-18', value: 38, label: 'Thu' },
  { date: '2026-01-19', value: 52, label: 'Fri' },
  { date: '2026-01-20', value: 24, label: 'Sat' },
  { date: '2026-01-21', value: 28, label: 'Sun' },
];

export const mockConversionsChart: ChartDataPoint[] = [
  { date: '2026-01-15', value: 5, label: 'Mon' },
  { date: '2026-01-16', value: 4, label: 'Tue' },
  { date: '2026-01-17', value: 8, label: 'Wed' },
  { date: '2026-01-18', value: 6, label: 'Thu' },
  { date: '2026-01-19', value: 10, label: 'Fri' },
  { date: '2026-01-20', value: 3, label: 'Sat' },
  { date: '2026-01-21', value: 4, label: 'Sun' },
];

export const mockAgentPerformance: ChartDataPoint[] = [
  { date: 'Sales Agent', value: 156 },
  { date: 'Support Agent', value: 243 },
  { date: 'Service Reminder', value: 89 },
  { date: 'Lead Qualifier', value: 0 },
  { date: 'Video Concierge', value: 12 },
];

export const mockGoals: Goal[] = [
  {
    id: 'goal-1',
    title: 'Monthly Lead Target',
    description: 'Generate 500 qualified leads this month',
    target: 500,
    current: 387,
    unit: 'leads',
    dueDate: '2026-01-31T23:59:59Z',
    status: 'on_track',
  },
  {
    id: 'goal-2',
    title: 'Customer Satisfaction Score',
    description: 'Maintain 4.5+ star rating',
    target: 4.5,
    current: 4.8,
    unit: 'stars',
    dueDate: '2026-01-31T23:59:59Z',
    status: 'completed',
  },
  {
    id: 'goal-3',
    title: 'Agent Response Time',
    description: 'Reduce average response time to under 2 seconds',
    target: 2,
    current: 2.3,
    unit: 'seconds',
    dueDate: '2026-01-31T23:59:59Z',
    status: 'at_risk',
  },
  {
    id: 'goal-4',
    title: 'Conversion Rate',
    description: 'Achieve 20% lead-to-sale conversion',
    target: 20,
    current: 18.5,
    unit: '%',
    dueDate: '2026-01-31T23:59:59Z',
    status: 'on_track',
  },
  {
    id: 'goal-5',
    title: 'Active Agents',
    description: 'Deploy 10 active AI agents',
    target: 10,
    current: 3,
    unit: 'agents',
    dueDate: '2026-02-28T23:59:59Z',
    status: 'behind',
  },
];

export const getGoalStatusColor = (status: Goal['status']): string => {
  const colors: Record<Goal['status'], string> = {
    on_track: 'text-green-600',
    at_risk: 'text-amber-600',
    behind: 'text-red-600',
    completed: 'text-blue-600',
  };
  return colors[status];
};

export const getGoalProgress = (goal: Goal): number => {
  return Math.min(100, (goal.current / goal.target) * 100);
};

// Command Center - Red Zone Lead Tables
export const mockHotLeadsGoingCold: CommandCenterLead[] = [
  {
    id: 'rl-1',
    leadId: '#12847',
    daysOld: 14,
    type: 'Internet',
    source: 'Facebook',
    vehicle: '2024 F-150',
    status: 'Contacted',
    isHot: true,
  },
  {
    id: 'rl-2',
    leadId: '#12823',
    daysOld: 16,
    type: 'Phone',
    source: 'AutoTrader',
    vehicle: '2024 Mustang',
    status: 'Appointment',
    isHot: true,
  },
  {
    id: 'rl-3',
    leadId: '#12801',
    daysOld: 18,
    type: 'Walk-In',
    source: 'Organic',
    vehicle: '2023 Camry',
    status: 'Contacted',
    isHot: true,
  },
  {
    id: 'rl-4',
    leadId: '#12778',
    daysOld: 15,
    type: 'Internet',
    source: 'Website',
    vehicle: '2024 RAV4',
    status: 'Follow-up',
    isHot: true,
  },
  {
    id: 'rl-5',
    leadId: '#12756',
    daysOld: 19,
    type: 'Phone',
    source: 'Facebook',
    vehicle: '2024 Accord',
    status: 'Contacted',
    isHot: false,
  },
  {
    id: 'rl-6',
    leadId: '#12734',
    daysOld: 17,
    type: 'Walk-In',
    source: 'Referral',
    vehicle: '2024 Civic',
    status: 'Appointment',
    isHot: true,
  },
  {
    id: 'rl-7',
    leadId: '#12712',
    daysOld: 21,
    type: 'Internet',
    source: 'AutoTrader',
    vehicle: '2023 Highlander',
    status: 'Follow-up',
    isHot: false,
  },
  {
    id: 'rl-8',
    leadId: '#12690',
    daysOld: 14,
    type: 'Phone',
    source: 'Website',
    vehicle: '2024 Tacoma',
    status: 'Contacted',
    isHot: true,
  },
];

export const mockNewLeadsNoContact: CommandCenterLead[] = [
  {
    id: 'nc-1',
    leadId: '#12989',
    hoursOld: 48,
    type: 'Internet',
    source: 'Facebook',
    vehicle: '2024 Jeep Wrangler',
    isHot: true,
  },
  {
    id: 'nc-2',
    leadId: '#12976',
    hoursOld: 62,
    type: 'Walk-In',
    source: 'Organic',
    vehicle: '2023 RAV4',
    isHot: true,
  },
  {
    id: 'nc-3',
    leadId: '#12964',
    hoursOld: 54,
    type: 'Phone',
    source: 'Website',
    vehicle: '2024 F-150 Lightning',
    isHot: false,
  },
  {
    id: 'nc-4',
    leadId: '#12951',
    hoursOld: 73,
    type: 'Internet',
    source: 'AutoTrader',
    vehicle: '2024 Accord',
    isHot: true,
  },
  {
    id: 'nc-5',
    leadId: '#12938',
    hoursOld: 48,
    type: 'Walk-In',
    source: 'Referral',
    vehicle: '2024 Camry',
    isHot: true,
  },
  {
    id: 'nc-6',
    leadId: '#12925',
    hoursOld: 81,
    type: 'Internet',
    source: 'Facebook',
    vehicle: '2023 Civic',
    isHot: false,
  },
  {
    id: 'nc-7',
    leadId: '#12912',
    hoursOld: 56,
    type: 'Phone',
    source: 'Organic',
    vehicle: '2024 Outback',
    isHot: true,
  },
  {
    id: 'nc-8',
    leadId: '#12899',
    hoursOld: 69,
    type: 'Internet',
    source: 'Website',
    vehicle: '2024 Highlander',
    isHot: false,
  },
  {
    id: 'nc-9',
    leadId: '#12886',
    hoursOld: 52,
    type: 'Walk-In',
    source: 'Organic',
    vehicle: '2023 Tacoma',
    isHot: true,
  },
  {
    id: 'nc-10',
    leadId: '#12873',
    hoursOld: 78,
    type: 'Internet',
    source: 'Facebook',
    vehicle: '2024 Mustang',
    isHot: false,
  },
  {
    id: 'nc-11',
    leadId: '#12860',
    hoursOld: 48,
    type: 'Phone',
    source: 'AutoTrader',
    vehicle: '2024 RAV4 Prime',
    isHot: true,
  },
  {
    id: 'nc-12',
    leadId: '#12847',
    hoursOld: 96,
    type: 'Internet',
    source: 'Website',
    vehicle: '2023 Civic Hybrid',
    isHot: false,
  },
];

export const mockShowroomNotClosed: CommandCenterLead[] = [
  {
    id: 'sc-1',
    leadId: '#12834',
    daysOld: 7,
    type: 'Walk-In',
    source: 'Organic',
    vehicle: '2024 Accord',
    status: 'Showroom Visit',
  },
  {
    id: 'sc-2',
    leadId: '#12821',
    daysOld: 12,
    type: 'Walk-In',
    source: 'Organic',
    vehicle: '2024 Civic',
    status: 'Test Drive Completed',
  },
  {
    id: 'sc-3',
    leadId: '#12808',
    daysOld: 9,
    type: 'Walk-In',
    source: 'Referral',
    vehicle: '2024 CR-V',
    status: 'Showroom Visit',
  },
  {
    id: 'sc-4',
    leadId: '#12795',
    daysOld: 25,
    type: 'Walk-In',
    source: 'Organic',
    vehicle: '2023 Pilot',
    status: 'Finance Pending',
  },
  {
    id: 'sc-5',
    leadId: '#12782',
    daysOld: 15,
    type: 'Walk-In',
    source: 'Organic',
    vehicle: '2024 Insight',
    status: 'Needs Follow-up',
  },
];

// Command Center - Yellow Zone
export const yellowZoneData = {
  staleLeads: { count: 42, avgAge: 32, label: 'Leads Approaching Stale (28-35 Days)' },
  pendingFinance: { count: 7, overFiveDays: 2, label: 'Deals Pending Finance' },
};

// Command Center - Green Zone
export const greenZoneMetrics = [
  { id: 'gz-1', label: 'New Leads Today', value: 23, change: '+15% vs avg', trend: 'up' as const },
  { id: 'gz-2', label: 'Active Pipeline', value: 225, change: 'Stable', trend: 'neutral' as const },
  { id: 'gz-3', label: 'Week Close Rate', value: '22%', change: '+3% vs LW', trend: 'up' as const },
  { id: 'gz-4', label: 'MTD Sold', value: 48, change: '65% to target', trend: 'up' as const },
];

// Pipeline Health Data
export const pipelineHealthData = {
  velocity: { sevenDay: 18.4, thirtyDay: 16.8, trend: '+9.5%', direction: 'Accelerating' as const },
  freshness: [
    { range: '0-7d', count: 85, pct: 38, color: '#10B981' },
    { range: '8-14d', count: 48, pct: 21, color: '#3B82F6' },
    { range: '15-30d', count: 62, pct: 28, color: '#F59E0B' },
    { range: '31-60d', count: 22, pct: 10, color: '#EF4444' },
    { range: '60d+', count: 8, pct: 3, color: '#DC2626' },
  ],
  freshnessScore: 'HEALTHY',
  stalePct: 3,
  hotLeads: { total: 32, pctOfActive: 14, avgAge: 8.4, over14Days: 5 },
  hotLeadAgeDistribution: [
    { range: '0-3 days', value: 10 },
    { range: '4-7 days', value: 12 },
    { range: '8-14 days', value: 5 },
    { range: '14+ days', value: 5 },
  ],
  statusFlow: [
    { stage: 'New', count: 42, pct: 19 },
    { stage: 'Waiting', count: 28, pct: 12 },
    { stage: 'Contacted', count: 155, pct: 69 },
  ],
  monthEndForecast: {
    currentSold: 48,
    activePipeline: 225,
    historicalWinRate: 21,
    projectedMonthEnd: 95,
    monthlyTarget: 110,
    gap: -15,
    gapPct: -14,
    actionNeeded: 'Need to accelerate conversion by 3% to hit target',
  },
};

// Performance Scorecard Data
export const scorecardConversionMetrics = [
  { id: 'sc-1', label: 'Win Rate', value: '21%', change: '+2% vs LM', trend: 'up' as const, sparkline: [18, 19, 19, 20, 21, 21, 22] },
  { id: 'sc-2', label: 'Loss Rate', value: '38%', change: '-3% vs LM', trend: 'up' as const, sparkline: [42, 41, 40, 39, 38, 38, 37] },
  { id: 'sc-3', label: 'Bad Rate', value: '14%', change: '+1% vs LM', trend: 'down' as const, sparkline: [13, 13, 14, 14, 14, 15, 14] },
  { id: 'sc-4', label: 'Active Pipeline', value: '225', change: '+8', trend: 'up' as const, sparkline: [210, 212, 215, 218, 220, 222, 225] },
];

export const topLeadSources = [
  { rank: 1, source: 'Walk-In', volume: 67, winRate: '31%', quality: 0.89, badPct: '3%', trend: '→', grade: 'A+', gradeColor: 'green' },
  { rank: 2, source: 'Referrals', volume: 34, winRate: '28%', quality: 0.82, badPct: '5%', trend: '↗ +12', grade: 'A', gradeColor: 'green' },
  { rank: 3, source: 'Facebook', volume: 178, winRate: '18%', quality: 0.62, badPct: '13%', trend: '↗ +5', grade: 'B', gradeColor: 'yellow' },
  { rank: 4, source: 'Website', volume: 95, winRate: '16%', quality: 0.58, badPct: '12%', trend: '→', grade: 'B-', gradeColor: 'yellow' },
  { rank: 5, source: 'AutoTrader', volume: 115, winRate: '12%', quality: 0.48, badPct: '16%', trend: '↘ -8', grade: 'D', gradeColor: 'red' },
];

export const channelPerformance = [
  { channel: 'Internet', volume: 285, pctTotal: '45%', winRate: '14%', lossRate: '41%', badRate: '15%', hotPct: '12%' },
  { channel: 'Walk-In', volume: 142, pctTotal: '28%', winRate: '26%', lossRate: '20%', badRate: '3%', hotPct: '22%' },
  { channel: 'Phone', volume: 95, pctTotal: '15%', winRate: '18%', lossRate: '40%', badRate: '11%', hotPct: '8%' },
  { channel: 'Referral', volume: 25, pctTotal: '4%', winRate: '32%', lossRate: '22%', badRate: '2%', hotPct: '41%' },
  { channel: 'Service', volume: 48, pctTotal: '8%', winRate: '11%', lossRate: '46%', badRate: '17%', hotPct: '3%' },
];

export const weekOverWeekTrends = [
  { metric: 'New Leads', thisWeek: 142, lastWeek: 130, change: '+12', trend: 'up' as const },
  { metric: 'Win Rate', thisWeek: '22%', lastWeek: '21%', change: '+1%', trend: 'up' as const },
  { metric: 'Response Time', thisWeek: '4.2 hrs', lastWeek: '8.2 hrs', change: '-4 hrs', trend: 'up' as const },
  { metric: 'Hot Leads', thisWeek: 32, lastWeek: 27, change: '+5', trend: 'up' as const },
];

// Reports - Loss & Quality Analysis
export const lossReasonBreakdown = [
  { reason: 'Lost - Lead Process Completed', count: 45, pct: 35 },
  { reason: 'Lost - Purchased Same Brand', count: 28, pct: 22 },
  { reason: 'Lost - Purchased Diff Brand', count: 18, pct: 14 },
  { reason: 'Lost - Changed Mind', count: 12, pct: 9 },
  { reason: 'Lost - Waiting on Trade', count: 8, pct: 6 },
  { reason: 'Other Lost Reasons', count: 17, pct: 14 },
];

export const badLeadBreakdown = [
  { reason: 'Bad Phone/Email', count: 32, pct: 34 },
  { reason: 'Out of Market', count: 24, pct: 25 },
  { reason: 'Duplicate', count: 18, pct: 19 },
  { reason: 'Not Interested', count: 12, pct: 13 },
  { reason: 'Wrong Dealership', count: 9, pct: 9 },
];

export const lossPatternsBySource = [
  { source: 'Internet', totalLost: 52, topReason: 'No Response', topReasonPct: 42, avgDaysBeforeLoss: 21 },
  { source: 'Walk-In', totalLost: 18, topReason: 'Competitor Price', topReasonPct: 38, avgDaysBeforeLoss: 14 },
  { source: 'Phone', totalLost: 28, topReason: 'No Response', topReasonPct: 51, avgDaysBeforeLoss: 18 },
  { source: 'Referral', totalLost: 6, topReason: 'Changed Mind', topReasonPct: 33, avgDaysBeforeLoss: 22 },
  { source: 'Service', totalLost: 24, topReason: 'Not Ready', topReasonPct: 45, avgDaysBeforeLoss: 30 },
];

export const reengagementCandidates = [
  { id: 'RE-001', leadId: '#12445', daysSinceLoss: 14, originalSource: 'Facebook', lossReason: 'Changed Mind', vehicle: '2024 Camry', reengageScore: 82 },
  { id: 'RE-002', leadId: '#12398', daysSinceLoss: 21, originalSource: 'Walk-In', lossReason: 'Waiting on Trade', vehicle: '2024 RAV4', reengageScore: 76 },
  { id: 'RE-003', leadId: '#12367', daysSinceLoss: 18, originalSource: 'AutoTrader', lossReason: 'Competitor Price', vehicle: '2024 Accord', reengageScore: 71 },
  { id: 'RE-004', leadId: '#12334', daysSinceLoss: 25, originalSource: 'Website', lossReason: 'Changed Mind', vehicle: '2023 Civic', reengageScore: 68 },
  { id: 'RE-005', leadId: '#12301', daysSinceLoss: 30, originalSource: 'Phone', lossReason: 'Not Ready', vehicle: '2024 Highlander', reengageScore: 64 },
];

export const sourceQualityTrends = [
  { month: 'Sep', internet: 12, walkIn: 28, phone: 16, referral: 30, service: 9 },
  { month: 'Oct', internet: 13, walkIn: 29, phone: 17, referral: 29, service: 10 },
  { month: 'Nov', internet: 13, walkIn: 30, phone: 17, referral: 31, service: 10 },
  { month: 'Dec', internet: 14, walkIn: 31, phone: 18, referral: 32, service: 11 },
  { month: 'Jan', internet: 14, walkIn: 26, phone: 18, referral: 28, service: 11 },
  { month: 'Feb', internet: 15, walkIn: 28, phone: 19, referral: 30, service: 12 },
];

// Reports - Channel Intelligence
export const fullChannelComparison = [
  { channel: 'Referral', volume: 25, pct: '4%', winRate: '32%', lossRate: '22%', badRate: '2%', hotPct: '41%', showPct: '45%', tradePct: '68%', deltaWin: '+4%', rank: 1 },
  { channel: 'Prev Customer', volume: 18, pct: '3%', winRate: '28%', lossRate: '18%', badRate: '4%', hotPct: '35%', showPct: '38%', tradePct: '72%', deltaWin: '+2%', rank: 2 },
  { channel: 'Walk-In', volume: 142, pct: '28%', winRate: '26%', lossRate: '20%', badRate: '3%', hotPct: '22%', showPct: '100%', tradePct: '58%', deltaWin: '+1%', rank: 3 },
  { channel: 'Phone', volume: 95, pct: '15%', winRate: '18%', lossRate: '40%', badRate: '11%', hotPct: '8%', showPct: '15%', tradePct: '55%', deltaWin: '0%', rank: 4 },
  { channel: 'Website Chat', volume: 32, pct: '5%', winRate: '16%', lossRate: '38%', badRate: '12%', hotPct: '15%', showPct: '5%', tradePct: '60%', deltaWin: '-1%', rank: 5 },
  { channel: 'Internet', volume: 285, pct: '45%', winRate: '14%', lossRate: '41%', badRate: '15%', hotPct: '12%', showPct: '8%', tradePct: '62%', deltaWin: '-2%', rank: 6 },
  { channel: 'Service', volume: 48, pct: '8%', winRate: '11%', lossRate: '46%', badRate: '17%', hotPct: '3%', showPct: '12%', tradePct: '48%', deltaWin: '+1%', rank: 7 },
  { channel: 'Import', volume: 12, pct: '2%', winRate: '8%', lossRate: '50%', badRate: '25%', hotPct: '0%', showPct: '0%', tradePct: '40%', deltaWin: '-3%', rank: 8 },
  { channel: 'Wholesale', volume: 8, pct: '1%', winRate: '6%', lossRate: '55%', badRate: '20%', hotPct: '0%', showPct: '0%', tradePct: '35%', deltaWin: '0%', rank: 9 },
  { channel: 'Parts Order', volume: 5, pct: '1%', winRate: '4%', lossRate: '60%', badRate: '30%', hotPct: '0%', showPct: '0%', tradePct: '25%', deltaWin: '-1%', rank: 10 },
];

export const digitalVsPhysical = {
  digital: { label: 'Digital Channels', volume: 322, pct: 51, winRate: '14%', lossRate: '42%', badRate: '16%', hotPct: '12%', tradePct: '61%', volumeTrend: '+8%', winTrend: '-2%' },
  physical: { label: 'Physical Channels', volume: 315, pct: 49, winRate: '24%', lossRate: '26%', badRate: '5%', hotPct: '22%', tradePct: '59%', volumeTrend: '-3%', winTrend: '+1%' },
  maturityScore: 0.65,
  benchmark: '0.75-0.85',
  insight: 'Digital volume is growing but conversion is lagging physical by 10%. Opportunity to improve digital lead handling could yield 20-30 additional monthly sales.',
};

export const serviceLaneAnalysis = {
  currentPerformance: { leads: 48, pctOfTotal: 8, winRate: 11, industryBest: '8-12%' },
  opportunitySizing: { monthlyServiceCustomers: 500, captureRate: 9.6, currentConversion: 11, currentMonthlySales: 5.3 },
  scenarios: [
    { label: 'Improve capture rate to 15%', leads: 75, conversion: 11, sales: 8.3, additionalSales: 3, additionalProfit: '$6,000/month' },
    { label: 'Improve conversion to 15%', leads: 48, conversion: 15, sales: 7.2, additionalSales: 2, additionalProfit: '$4,000/month' },
    { label: 'Both improvements', leads: 75, conversion: 15, sales: 11.3, additionalSales: 6, additionalProfit: '$12,000/month' },
  ],
  recommendations: [
    'Train service advisors on warm handoff process',
    'Implement service lane "upgrade checker" tool',
    'Offer trade appraisal with every service visit',
    'Sales manager meet-and-greet for customers waiting',
  ],
};

// Reports - Trend & Forecast
export const monthlyPerformanceSummary = {
  period: 'January 2026',
  previousPeriod: 'December 2025',
  keyMetrics: [
    { label: 'New Leads', current: 637, previous: 595, change: '+42 (+7%)', trend: 'up' as const },
    { label: 'Total Sold', current: 142, previous: 124, change: '+18 (+15%)', trend: 'up' as const },
    { label: 'Win Rate', current: '21%', previous: '19%', change: '+2%', trend: 'up' as const },
    { label: 'Avg Lead Age', current: '12.4 days', previous: '13.6 days', change: '-1.2 days', trend: 'up' as const },
  ],
  volumeTrends: [
    { month: 'Mar', leads: 420, sold: 82 }, { month: 'Apr', leads: 450, sold: 88 },
    { month: 'May', leads: 480, sold: 94 }, { month: 'Jun', leads: 510, sold: 100 },
    { month: 'Jul', leads: 490, sold: 96 }, { month: 'Aug', leads: 520, sold: 102 },
    { month: 'Sep', leads: 540, sold: 108 }, { month: 'Oct', leads: 560, sold: 114 },
    { month: 'Nov', leads: 595, sold: 124 }, { month: 'Dec', leads: 620, sold: 132 },
    { month: 'Jan', leads: 637, sold: 142 }, { month: 'Feb', leads: 580, sold: 118 },
  ],
  sourceChanges: {
    winners: [
      { source: 'Facebook', change: '+42 leads (+31%)', winChange: '+1%' },
      { source: 'Referrals', change: '+8 leads (+31%)', winChange: '+4%' },
      { source: 'Walk-In', change: '+12 leads (+9%)', winChange: '+1%' },
    ],
    losers: [
      { source: 'AutoTrader', change: '-18 leads (-14%)', winChange: '-3%' },
      { source: 'Phone', change: '-8 leads (-8%)', winChange: '0%' },
    ],
  },
  executiveSummary: {
    wins: [
      'Record volume month (637 leads, +7% MoM)',
      'Win rate improved to 21% (+2% MoM, +3% YoY)',
      'Facebook and Referral channels accelerating',
      'Pipeline freshness improved (38% <7 days old)',
    ],
    concerns: [
      'AutoTrader declining for 2nd consecutive month',
      'SERVICE channel still underperforming (11% win rate)',
      'Digital win rate (14%) lags physical (24%) by 10%',
    ],
    recommendations: [
      'Renegotiate/cancel AutoTrader if no improvement by Mar',
      'Launch referral incentive program ($500 bonus)',
      'Implement service lane cross-sell training',
      'Improve digital lead response time (target <5 min)',
    ],
  },
};

export const rollingForecast = {
  generated: 'Feb 21, 2026 at 6:00 AM',
  methodology: 'Based on trailing 90-day velocity and conversion patterns. Accounts for seasonal trends. Conservative estimate (uses 25th percentile win rate).',
  projections: [
    { month: 'February (partial)', leadVol: '285 (projected)', soldActual: 48, soldProjected: 95, target: 110, status: 'warning' as const, gap: -15 },
    { month: 'March', leadVol: '590-620', soldProjected: null, soldRange: '118-130', target: 110, status: 'success' as const, gap: null },
    { month: 'April', leadVol: '600-630', soldProjected: null, soldRange: '120-132', target: 110, status: 'success' as const, gap: null },
  ],
  gapAnalysis: {
    salesNeeded: 62,
    daysRemaining: 10,
    activePipeline: 225,
    requiredWinRate: '28%',
    baselineWinRate: '21%',
    assessment: 'CHALLENGING - need 7pt lift in conversion',
  },
  gapRecommendations: [
    'Weekend sales event (Feb 27-28)',
    'Accelerate SOLD_PENDING_FINANCE deals (7 pending)',
    'Manager outreach to all hot leads >7 days (32 leads)',
    'Re-engage showroom visitors from last 14 days (18 leads)',
  ],
};

export const yearOverYear = {
  period: '2025 vs 2024',
  annual: [
    { metric: 'Total Leads', y2023: '6,842', y2024: '7,254', change: '+412 (+6%)' },
    { metric: 'Total Sold', y2023: '1,285', y2024: '1,468', change: '+183 (+14%)' },
    { metric: 'Win Rate', y2023: '19%', y2024: '20%', change: '+1%' },
    { metric: 'Loss Rate', y2023: '41%', y2024: '39%', change: '-2%' },
    { metric: 'Bad Rate', y2023: '15%', y2024: '15%', change: '0%' },
  ],
  achievements: [
    'Volume growth: +6% YoY',
    'Sales growth: +14% YoY (outpaced volume by 2.3x)',
    'Conversion improvement: +1 percentage point',
    'Q4 was strongest quarter (1,842 leads, 412 sold)',
  ],
  monthlyComparison: [
    { month: 'Jan', prev: 520, current: 560 }, { month: 'Feb', prev: 480, current: 510 },
    { month: 'Mar', prev: 500, current: 540 }, { month: 'Apr', prev: 530, current: 570 },
    { month: 'May', prev: 560, current: 590 }, { month: 'Jun', prev: 580, current: 620 },
    { month: 'Jul', prev: 570, current: 600 }, { month: 'Aug', prev: 590, current: 630 },
    { month: 'Sep', prev: 610, current: 650 }, { month: 'Oct', prev: 630, current: 680 },
    { month: 'Nov', prev: 640, current: 680 }, { month: 'Dec', prev: 632, current: 624 },
  ],
};
