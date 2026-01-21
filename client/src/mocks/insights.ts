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
