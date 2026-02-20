import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, AlertCircle, Lightbulb, Filter, LayoutGrid, List, Search, BarChart3, LineChart, PieChart, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FavoritesBar } from '@/components/layout/FavoritesBar';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  mockMetrics, 
  mockLeadsChart, 
  mockConversionsChart,
  mockAgentPerformance,
} from '@/mocks/insights';
import { mockHunches } from '@/mocks/tasks';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * @component InsightsPage
 * @description Analytics dashboard with 4 tabs: Dashboard, Reports, Library, Hunches
 * @designConstraints
 *   - Dashboard: Command Center alerts (red/amber/blue), Pipeline funnel, Charts, Scorecard
 *   - Reports: Card grid with gradient backgrounds and icons
 *   - Library: Filterable metric grid/list with category badges
 *   - Hunches: Color-coded cards (green=opportunity, red=threat, blue=insight)
 * @rbac Visible to all roles
 * @locked Tab order (Dashboard/Reports/Library/Hunches), Hunch type color coding
 */

const commandCenterAlerts = [
  { id: 'alert-1', zone: 'critical', label: 'Pipeline stall detected', detail: '3 deals stuck >14 days in proposal stage', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
  { id: 'alert-2', zone: 'warning', label: 'Response time degrading', detail: 'Avg response up 0.8s in last 24h', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { id: 'alert-3', zone: 'info', label: 'New lead surge', detail: '12 new leads from social campaign', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
];

const pipelineStages = [
  { stage: 'New', count: 47, value: '$142K', pct: 100 },
  { stage: 'Contacted', count: 32, value: '$98K', pct: 68 },
  { stage: 'Qualified', count: 18, value: '$72K', pct: 38 },
  { stage: 'Proposal', count: 8, value: '$45K', pct: 17 },
  { stage: 'Won', count: 5, value: '$31K', pct: 11 },
];

const scorecardItems = [
  { metric: 'Close Rate', value: '18.5%', target: '20%', status: 'at_risk' as const },
  { metric: 'Avg Deal Size', value: '$6,200', target: '$5,500', status: 'on_track' as const },
  { metric: 'Time to Close', value: '12 days', target: '14 days', status: 'on_track' as const },
  { metric: 'Lead Response', value: '2.3s', target: '2.0s', status: 'at_risk' as const },
];

const reportCards = [
  { id: 'r1', title: 'Loss Analysis', description: 'Why deals are lost and patterns to address', icon: PieChart, gradient: 'from-red-500/10 to-orange-500/5' },
  { id: 'r2', title: 'Channel Intelligence', description: 'Lead source effectiveness and ROI breakdown', icon: BarChart3, gradient: 'from-blue-500/10 to-cyan-500/5' },
  { id: 'r3', title: 'Trend Forecasts', description: 'Predictive models for next 30/60/90 days', icon: LineChart, gradient: 'from-violet-500/10 to-purple-500/5' },
  { id: 'r4', title: 'Agent Effectiveness', description: 'AI agent performance and optimization areas', icon: FileText, gradient: 'from-emerald-500/10 to-teal-500/5' },
];

const libraryMetrics = [
  { id: 'lib-1', title: 'Total Active Pipeline', value: '247', change: '+12%', trend: 'up' as const, category: 'Pipeline' },
  { id: 'lib-2', title: 'Daily New Lead Volume', value: '18', change: '+3', trend: 'up' as const, category: 'Pipeline' },
  { id: 'lib-3', title: 'Weekly Lead Trend', value: '22.4', change: '+8%', trend: 'up' as const, category: 'Pipeline' },
  { id: 'lib-4', title: 'MoM Lead Growth', value: '+14%', change: '+6%', trend: 'up' as const, category: 'Pipeline' },
  { id: 'lib-5', title: 'Lead Velocity Rate', value: '16.2/day', change: '+1.8', trend: 'up' as const, category: 'Pipeline' },
  { id: 'lib-6', title: 'Pipeline Stagnation Index', value: '31', change: '-4', trend: 'up' as const, category: 'Pipeline' },
  { id: 'lib-7', title: 'Fresh Lead Ratio', value: '42%', change: '+5%', trend: 'up' as const, category: 'Pipeline' },
  { id: 'lib-8', title: 'Overall Win Rate', value: '18.5%', change: '+2.3%', trend: 'up' as const, category: 'Conversion' },
  { id: 'lib-9', title: 'Internet Close Rate', value: '14.2%', change: '+1.1%', trend: 'up' as const, category: 'Conversion' },
  { id: 'lib-10', title: 'Walk-In Close Rate', value: '28.7%', change: '-0.9%', trend: 'down' as const, category: 'Conversion' },
  { id: 'lib-11', title: 'Service-to-Sales', value: '6.3%', change: '+1.2%', trend: 'up' as const, category: 'Conversion' },
  { id: 'lib-12', title: 'Hot Lead Conversion', value: '34.1%', change: '+4.5%', trend: 'up' as const, category: 'Conversion' },
  { id: 'lib-13', title: 'Showroom Conversion', value: '31.2%', change: '+2.0%', trend: 'up' as const, category: 'Conversion' },
  { id: 'lib-14', title: 'Loss Rate', value: '38.4%', change: '-2.1%', trend: 'up' as const, category: 'Conversion' },
  { id: 'lib-15', title: 'Bad Lead Rate', value: '8.7%', change: '-1.3%', trend: 'up' as const, category: 'Conversion' },
  { id: 'lib-16', title: 'Contact Rate', value: '72%', change: '+5%', trend: 'up' as const, category: 'Response' },
  { id: 'lib-17', title: 'New Lead Aging', value: '1.8 days', change: '-0.3', trend: 'up' as const, category: 'Response' },
  { id: 'lib-18', title: 'Response Gap (>24h)', value: '14', change: '-6', trend: 'up' as const, category: 'Response' },
  { id: 'lib-19', title: 'Waiting Lead Volume', value: '38', change: '+4', trend: 'down' as const, category: 'Response' },
  { id: 'lib-20', title: 'Engagement Transition', value: '68%', change: '+3%', trend: 'up' as const, category: 'Response' },
  { id: 'lib-21', title: 'Avg Time to 1st Contact', value: '4.2 hrs', change: '-1.1', trend: 'up' as const, category: 'Response' },
  { id: 'lib-22', title: 'Top Source: Website', value: '34%', change: '+2%', trend: 'up' as const, category: 'Lead Source' },
  { id: 'lib-23', title: 'Source Win Rate (Web)', value: '16.8%', change: '+1.4%', trend: 'up' as const, category: 'Lead Source' },
  { id: 'lib-24', title: 'Source Diversity Score', value: '0.74', change: '+0.05', trend: 'up' as const, category: 'Lead Source' },
  { id: 'lib-25', title: 'Concentration Risk', value: '34%', change: '-3%', trend: 'up' as const, category: 'Lead Source' },
  { id: 'lib-26', title: 'Source Quality Score', value: '0.82', change: '+0.04', trend: 'up' as const, category: 'Lead Source' },
  { id: 'lib-27', title: 'Digital Lead %', value: '58%', change: '+4%', trend: 'up' as const, category: 'Channel' },
  { id: 'lib-28', title: 'Walk-In Traffic', value: '64', change: '-3', trend: 'down' as const, category: 'Channel' },
  { id: 'lib-29', title: 'Phone Inquiries', value: '42', change: '+7', trend: 'up' as const, category: 'Channel' },
  { id: 'lib-30', title: 'Referral Leads', value: '19', change: '+5', trend: 'up' as const, category: 'Channel' },
  { id: 'lib-31', title: 'Previous Customer %', value: '11.3%', change: '+1.8%', trend: 'up' as const, category: 'Channel' },
  { id: 'lib-32', title: 'Service Lane Cross-Sell', value: '7.4%', change: '+0.9%', trend: 'up' as const, category: 'Channel' },
  { id: 'lib-33', title: 'New vs Used Interest', value: '44/56', change: '0', trend: 'neutral' as const, category: 'Vehicle' },
  { id: 'lib-34', title: 'Avg Vehicle MSRP', value: '$38.4K', change: '+$1.2K', trend: 'up' as const, category: 'Vehicle' },
  { id: 'lib-35', title: 'Top Make: Toyota', value: '22%', change: '+1%', trend: 'up' as const, category: 'Vehicle' },
  { id: 'lib-36', title: 'Trade-In Penetration', value: '41%', change: '+3%', trend: 'up' as const, category: 'Vehicle' },
  { id: 'lib-37', title: 'High-Value Leads (>$60K)', value: '18', change: '+4', trend: 'up' as const, category: 'Vehicle' },
  { id: 'lib-38', title: 'Cash vs Finance', value: '22/78', change: '0', trend: 'neutral' as const, category: 'Vehicle' },
  { id: 'lib-39', title: 'Avg Lead Age', value: '14.2 days', change: '-1.3', trend: 'up' as const, category: 'Lifecycle' },
  { id: 'lib-40', title: 'Overdue Leads (>14d)', value: '52', change: '-8', trend: 'up' as const, category: 'Lifecycle' },
  { id: 'lib-41', title: 'Stale Lead %', value: '21%', change: '-4%', trend: 'up' as const, category: 'Lifecycle' },
  { id: 'lib-42', title: 'Avg Days to Close', value: '12.4', change: '-0.8', trend: 'up' as const, category: 'Lifecycle' },
  { id: 'lib-43', title: 'Fast Close Rate (<7d)', value: '24%', change: '+3%', trend: 'up' as const, category: 'Lifecycle' },
  { id: 'lib-44', title: 'Appointments Set', value: '34', change: '+6', trend: 'up' as const, category: 'Status' },
  { id: 'lib-45', title: 'Pending Finance', value: '8', change: '+2', trend: 'up' as const, category: 'Status' },
  { id: 'lib-46', title: 'Delivered (Month)', value: '42', change: '+7', trend: 'up' as const, category: 'Status' },
  { id: 'lib-47', title: 'No Response Loss', value: '31%', change: '-4%', trend: 'up' as const, category: 'Status' },
  { id: 'lib-48', title: 'Competitive Loss', value: '22%', change: '+1%', trend: 'down' as const, category: 'Status' },
  { id: 'lib-49', title: 'Hot Lead Volume', value: '28', change: '+5', trend: 'up' as const, category: 'Priority' },
  { id: 'lib-50', title: 'Hot Lead % of Active', value: '11.3%', change: '+1.2%', trend: 'up' as const, category: 'Priority' },
  { id: 'lib-51', title: 'Hot Lead Close Rate', value: '34.1%', change: '+4.5%', trend: 'up' as const, category: 'Priority' },
  { id: 'lib-52', title: 'Showroom Visits', value: '47', change: '+8', trend: 'up' as const, category: 'Priority' },
  { id: 'lib-53', title: 'Pipeline Efficiency', value: '0.72', change: '+0.08', trend: 'up' as const, category: 'Composite' },
  { id: 'lib-54', title: 'Lead Momentum Index', value: '1.14', change: '+0.12', trend: 'up' as const, category: 'Composite' },
  { id: 'lib-55', title: 'Sales Velocity', value: '3.4/day', change: '+0.4', trend: 'up' as const, category: 'Composite' },
  { id: 'lib-56', title: 'Lead Saturation Index', value: '18.2', change: '-1.4', trend: 'up' as const, category: 'Composite' },
  { id: 'lib-57', title: 'Digital Maturity Score', value: '0.68', change: '+0.06', trend: 'up' as const, category: 'Composite' },
  { id: 'lib-58', title: 'Projected Month Close', value: '51', change: '+8', trend: 'up' as const, category: 'Forecast' },
  { id: 'lib-59', title: 'Pipeline Coverage Ratio', value: '4.8x', change: '+0.3', trend: 'up' as const, category: 'Forecast' },
  { id: 'lib-60', title: 'Lead Burn Rate', value: '6.2/day', change: '+0.4', trend: 'up' as const, category: 'Forecast' },
  { id: 'lib-61', title: 'At-Risk Lead Count', value: '23', change: '-4', trend: 'up' as const, category: 'Forecast' },
];

const hunchesData = [
  { id: 'h1', title: 'Potential high-value lead detected', description: 'Customer viewed 3 luxury vehicles in the past week. Consider follow-up call.', type: 'opportunity' as const, confidence: 85, source: 'Sales Agent' },
  { id: 'h2', title: 'Service appointment cancelation pattern', description: '3 customers canceled appointments this week. Check for common issues.', type: 'threat' as const, confidence: 72, source: 'Service Reminder' },
  { id: 'h3', title: 'Inventory optimization opportunity', description: 'SUV sales trending up 15%. Consider adjusting inventory mix.', type: 'insight' as const, confidence: 91, source: 'Analytics Engine' },
  { id: 'h4', title: 'Cross-sell opportunity in service queue', description: 'Customers with vehicles >5 years old may be interested in trade-in offers.', type: 'opportunity' as const, confidence: 78, source: 'CRM Analysis' },
  { id: 'h5', title: 'Competitor pricing undercut detected', description: 'Premier Motors dropped sedan prices 8% across the board.', type: 'threat' as const, confidence: 94, source: 'Market Intel' },
  { id: 'h6', title: 'Seasonal demand shift incoming', description: 'Historical data shows 23% truck demand increase starting next month.', type: 'insight' as const, confidence: 88, source: 'Trend Analysis' },
];

const hunchTypeConfig = {
  opportunity: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', label: 'Opportunity' },
  threat: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Threat' },
  insight: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Insight' },
};

export default function InsightsPage() {
  const [libraryView, setLibraryView] = useState<'grid' | 'list'>('grid');
  const [libraryFilter, setLibraryFilter] = useState('all');
  const [librarySearch, setLibrarySearch] = useState('');

  const categories = ['all', ...Array.from(new Set(libraryMetrics.map(m => m.category)))];
  const filteredLibrary = libraryMetrics.filter(m => {
    const matchesCategory = libraryFilter === 'all' || m.category === libraryFilter;
    const matchesSearch = !librarySearch || m.title.toLowerCase().includes(librarySearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Insights</h1>
          <p className="text-sm text-muted-foreground">Analytics, reports, and AI-generated intelligence</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 border-b border-border flex items-center">
          <TabsList className="bg-transparent h-10 p-0 flex-shrink-0">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none" data-testid="tab-insights-dashboard">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none" data-testid="tab-insights-reports">
              Reports
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none" data-testid="tab-insights-library">
              Library
            </TabsTrigger>
            <TabsTrigger value="hunches" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none" data-testid="tab-insights-hunches">
              Hunches
            </TabsTrigger>
          </TabsList>
          <FavoritesBar currentPath="/insights" currentLabel="Insights" />
        </div>

        <TabsContent value="dashboard" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              <section>
                <h2 className="text-sm font-semibold text-foreground mb-3">Command Center</h2>
                <div className="space-y-2">
                  {commandCenterAlerts.map(alert => (
                    <div key={alert.id} className={cn('flex items-start gap-3 p-3 rounded-lg border', alert.color)} data-testid={`alert-${alert.id}`}>
                      {alert.zone === 'critical' && <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                      {alert.zone === 'warning' && <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                      {alert.zone === 'info' && <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                      <div>
                        <p className="text-sm font-medium">{alert.label}</p>
                        <p className="text-xs opacity-80 mt-0.5">{alert.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-semibold text-foreground mb-3">Pipeline Health</h2>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {pipelineStages.map((stage, i) => (
                        <div key={stage.stage} className="flex items-center gap-4" data-testid={`pipeline-${stage.stage}`}>
                          <span className="text-sm text-muted-foreground w-20">{stage.stage}</span>
                          <div className="flex-1">
                            <Progress value={stage.pct} className="h-2" />
                          </div>
                          <span className="text-sm font-medium text-foreground w-8 text-right">{stage.count}</span>
                          <span className="text-xs text-muted-foreground w-16 text-right">{stage.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card data-testid="chart-leads">
                  <CardHeader>
                    <CardTitle className="text-base">Leads This Week</CardTitle>
                    <CardDescription>Daily lead generation trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockLeadsChart}>
                          <defs>
                            <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="label" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#leadGradient)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="chart-conversions">
                  <CardHeader>
                    <CardTitle className="text-base">Conversions by Channel</CardTitle>
                    <CardDescription>This month's performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockConversionsChart}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="label" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <section>
                <h2 className="text-sm font-semibold text-foreground mb-3">Performance Scorecard</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {scorecardItems.map((item, i) => (
                    <Card key={i} data-testid={`scorecard-${i}`}>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">{item.metric}</p>
                        <p className="text-xl font-bold text-foreground mt-1">{item.value}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Target: {item.target}</span>
                          <Badge variant="secondary" className={cn('text-[10px]', item.status === 'on_track' ? 'text-green-600' : 'text-amber-600')}>
                            {item.status === 'on_track' ? 'On Track' : 'At Risk'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="reports" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportCards.map(report => {
                  const Icon = report.icon;
                  return (
                    <Card key={report.id} className="hover-elevate cursor-pointer group" data-testid={`report-${report.id}`}>
                      <CardContent className={cn('p-6 bg-gradient-to-br rounded-xl', report.gradient)}>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-6 w-6 text-foreground/70" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{report.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                            <Button variant="outline" size="sm" className="mt-3" data-testid={`report-view-${report.id}`}>
                              View Report
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="library" className="flex-1 m-0 overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search metrics..."
                value={librarySearch}
                onChange={e => setLibrarySearch(e.target.value)}
                className="pl-9"
                data-testid="input-library-search"
              />
            </div>
            <div className="flex items-center gap-1">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={libraryFilter === cat ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs capitalize"
                  onClick={() => setLibraryFilter(cat)}
                  data-testid={`filter-${cat}`}
                >
                  {cat}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <Button variant={libraryView === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setLibraryView('grid')} data-testid="button-library-grid">
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={libraryView === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setLibraryView('list')} data-testid="button-library-list">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 h-0">
            <div className={cn('p-4', libraryView === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' : 'space-y-2')}>
              {filteredLibrary.map(metric => (
                libraryView === 'grid' ? (
                  <Card key={metric.id} className="hover-elevate" data-testid={`lib-metric-${metric.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px]">{metric.category}</Badge>
                        {metric.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {metric.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                        {metric.trend === 'neutral' && <Minus className="h-3 w-3 text-muted-foreground" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">{metric.title}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{metric.value}</p>
                      <p className={cn('text-xs mt-1', metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground')}>
                        {metric.change}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div key={metric.id} className="flex items-center gap-4 p-3 rounded-lg border border-border hover-elevate" data-testid={`lib-metric-${metric.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{metric.title}</p>
                      <Badge variant="secondary" className="text-[10px] mt-1">{metric.category}</Badge>
                    </div>
                    <p className="text-lg font-bold text-foreground">{metric.value}</p>
                    <div className="flex items-center gap-1 w-20 justify-end">
                      {metric.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                      {metric.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                      {metric.trend === 'neutral' && <Minus className="h-3 w-3 text-muted-foreground" />}
                      <span className={cn('text-xs', metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground')}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="hunches" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {hunchesData.map(hunch => {
                const config = hunchTypeConfig[hunch.type];
                return (
                  <Card key={hunch.id} className={cn('border', config.border)} data-testid={`hunch-${hunch.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', config.bg)}>
                          <Lightbulb className={cn('h-5 w-5', config.color)} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-foreground">{hunch.title}</h4>
                            <Badge variant="secondary" className={cn('text-[10px]', config.color)}>
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{hunch.description}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <Badge variant="secondary" className="text-[10px]">{hunch.source}</Badge>
                            <span className="text-xs text-muted-foreground">Confidence: {hunch.confidence}%</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button size="sm" variant="outline" data-testid={`hunch-dismiss-${hunch.id}`}>Dismiss</Button>
                          <Button size="sm" data-testid={`hunch-act-${hunch.id}`}>Act</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
