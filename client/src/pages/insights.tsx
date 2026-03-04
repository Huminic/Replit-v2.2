/**
 * Insights Page — Large analytics dashboard (~1800 lines).
 *
 * Tab navigation: Dashboard | Reports | Library | Hunches
 *
 * === Dashboard Tab ===
 * Traffic-light zone system for lead management:
 * - RED ZONE (Immediate Action Required): Hot Leads Going Cold, New Leads Without Contact,
 *   Showroom Visitors Not Closed. Each card is clickable → opens drill-down dialog.
 * - YELLOW ZONE (Watch List): Stale Leads, Pending Finance deals over 5 days.
 * - GREEN ZONE: Pipeline health scorecard, conversion metrics, green zone KPIs.
 * - Charts: Leads trend (AreaChart), conversions (BarChart) via Recharts.
 *
 * === Reports Tab ===
 * Three report categories: Loss Analysis, Channel Performance, Trend Analysis.
 * Each has sub-tabs with detailed data tables and charts.
 * Includes: loss reasons, bad lead breakdown, source quality, channel comparison,
 * digital vs physical, service lane analysis, monthly performance, rolling forecast, YoY.
 *
 * === Library Tab ===
 * 34 browsable metric tiles organized by category (Pipeline, Conversion, Response, Lead Source,
 * Channel, Composite, Forecast). Grid/list toggle, search, category filter.
 * Click any metric → dialog with drill-down rows and AI-generated insight text.
 *
 * === Hunches Tab ===
 * AI-generated business insights: opportunity, threat, insight types.
 * Each hunch has confidence score, source, and recommended action.
 * Preferences sheet: notification channels, default view, min confidence, auto-dismiss.
 *
 * Data sources: mocks/insights.ts for all chart and table data.
 * PRODUCTION NOTE: Will wire to backend analytics engine. Hunches will be AI-generated.
 *
 * @see client/src/mocks/insights.ts — All mock data for charts, tables, zones
 */
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  TrendingUp, TrendingDown, Minus, AlertTriangle, AlertCircle, Lightbulb, 
  Filter, LayoutGrid, List, Search, BarChart3, LineChart, PieChart, FileText, 
  Phone, UserPlus, Eye, Download, ChevronRight, ArrowRight, Flame, Clock, Building2, 
  Target, Activity, Zap, X, SlidersHorizontal, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FavoritesBar } from '@/components/layout/FavoritesBar';
import { MobileNavDropdown } from '@/components/layout/MobileNavDropdown';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  mockLeadsChart, 
  mockConversionsChart,
  mockHotLeadsGoingCold,
  mockNewLeadsNoContact,
  mockShowroomNotClosed,
  yellowZoneData,
  greenZoneMetrics,
  pipelineHealthData,
  scorecardConversionMetrics,
  topLeadSources,
  channelPerformance,
  weekOverWeekTrends,
  lossReasonBreakdown,
  badLeadBreakdown,
  lossPatternsBySource,
  reengagementCandidates,
  sourceQualityTrends,
  fullChannelComparison,
  digitalVsPhysical,
  serviceLaneAnalysis,
  monthlyPerformanceSummary,
  rollingForecast,
  yearOverYear,
} from '@/mocks/insights';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, 
  Pie, Cell, Legend 
} from 'recharts';

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
  { id: 'lib-31', title: 'Sales Velocity', value: '3.4/day', change: '+0.4', trend: 'up' as const, category: 'Composite' },
  { id: 'lib-32', title: 'Digital Maturity Score', value: '0.68', change: '+0.06', trend: 'up' as const, category: 'Composite' },
  { id: 'lib-33', title: 'Projected Month Close', value: '51', change: '+8', trend: 'up' as const, category: 'Forecast' },
  { id: 'lib-34', title: 'Pipeline Coverage Ratio', value: '4.8x', change: '+0.3', trend: 'up' as const, category: 'Forecast' },
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

const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#DC2626', '#8B5CF6'];

const libMetricSampleData: Record<string, { rows: { label: string; value: string; detail?: string }[]; insight?: string }> = {
  'lib-1': { rows: [
    { label: 'NEW status', value: '62', detail: 'Avg age: 1.8 days' },
    { label: 'ACTIVE - Contacted', value: '98', detail: 'Avg age: 8.4 days' },
    { label: 'HOT - Showroom/Trade', value: '34', detail: 'Avg age: 4.2 days' },
    { label: 'PENDING - Finance/Closing', value: '28', detail: 'Avg age: 12.1 days' },
    { label: 'WAITING - No Response', value: '25', detail: 'Avg age: 18.6 days' },
  ], insight: '25 WAITING leads are aging rapidly — consider a re-engagement campaign or archive stale ones to keep pipeline healthy.' },
  'lib-2': { rows: [
    { label: 'AutoTrader', value: '6 leads', detail: 'Avg quality score: 7.2' },
    { label: 'Website (Organic)', value: '4 leads', detail: 'Avg quality score: 8.1' },
    { label: 'Cars.com', value: '3 leads', detail: 'Avg quality score: 6.8' },
    { label: 'Walk-In', value: '3 leads', detail: 'Highest close rate: 31%' },
    { label: 'Phone / Referral', value: '2 leads' },
  ], insight: 'Today\'s lead volume is 18 — above your 30-day avg of 15.2/day. Website organic leads trending up.' },
  'lib-5': { rows: [
    { label: 'This Week', value: '16.2/day', detail: 'Mon: 14, Tue: 18, Wed: 19, Thu: 15, Fri: 12' },
    { label: 'Last Week', value: '14.4/day' },
    { label: '4-Week Avg', value: '15.1/day' },
    { label: 'Best Day This Month', value: '22 (Feb 8)' },
    { label: 'Slowest Day', value: '9 (Feb 3, Monday)' },
  ], insight: 'Mid-week (Tue-Wed) consistently generates 20-30% more leads. Adjust staffing for peak intake.' },
  'lib-8': { rows: [
    { label: 'This Month SOLD', value: '74 units', detail: 'vs 67 last month (+10.4%)' },
    { label: 'This Month LOST', value: '326 leads', detail: 'LOST_NO_RESPONSE: 89, LOST_PURCHASED_ELSEWHERE: 142' },
    { label: 'Win Rate Trend', value: '' },
    { label: '  Jan', value: '16.2%' },
    { label: '  Feb (MTD)', value: '18.5%' },
    { label: '  Projected Mar', value: '19.1%' },
  ], insight: 'Win rate improving 2.3% MoM. If LOST_NO_RESPONSE (89 leads) were contacted, potential +12 sales.' },
  'lib-10': { rows: [
    { label: 'Walk-Ins This Month', value: '64', detail: '18 SOLD (28.7%)' },
    { label: 'Avg Time on Lot', value: '42 min' },
    { label: 'Trade-In Walk-Ins', value: '24 (38%)', detail: 'Close rate: 39% (vs 21% no trade)' },
    { label: 'Weekend Walk-Ins', value: '28 (44%)', detail: 'Close rate: 33% (higher traffic, lower conversion)' },
    { label: 'Top Salesperson (Walk-In)', value: 'Marcus T. — 7 SOLD' },
  ], insight: 'Walk-in close rate dipped 0.9% — weekend traffic quality declining. Consider pre-qualifying Saturday walk-ins.' },
  'lib-12': { rows: [
    { label: 'HOT Leads Total', value: '41', detail: '14 SOLD (34.1%)' },
    { label: 'HOT → SOLD avg time', value: '3.2 days' },
    { label: 'HOT → LOST reasons', value: '' },
    { label: '  Bought elsewhere', value: '11 leads' },
    { label: '  Price disagreement', value: '8 leads' },
    { label: '  Financing fell through', value: '5 leads' },
  ], insight: 'HOT leads that go unseen for >48h drop to 12% close rate. Respond within 2 hours for best results.' },
  'lib-16': { rows: [
    { label: 'Contacted Within 1hr', value: '38%', detail: '94 of 247 active leads' },
    { label: 'Contacted Within 4hr', value: '58%' },
    { label: 'Contacted Within 24hr', value: '72%' },
    { label: 'Never Contacted (>48h)', value: '14 leads', detail: 'Losing ~5% close probability per hour' },
    { label: 'Best Contact Channel', value: 'Phone (67% connect rate)' },
  ], insight: '14 leads haven\'t been contacted in 48+ hours. Immediate outreach could recover 3-4 potential sales.' },
  'lib-21': { rows: [
    { label: 'Internet Leads', value: '4.2 hrs', detail: 'Industry benchmark: 1.5 hrs' },
    { label: 'Phone Leads', value: '0.8 hrs' },
    { label: 'Walk-In', value: 'Immediate' },
    { label: 'After-Hours Leads', value: '11.4 hrs', detail: 'Auto-response sent, but human follow-up delayed' },
    { label: 'Weekend Response', value: '6.1 hrs' },
  ], insight: 'Internet lead response (4.2h) is 2.8x slower than benchmark. After-hours auto-nurture could cut this in half.' },
  'lib-22': { rows: [
    { label: 'Website', value: '34% (84 leads)', detail: 'Win rate: 19%, BAD rate: 6%' },
    { label: 'AutoTrader', value: '28% (69 leads)', detail: 'Win rate: 24%, BAD rate: 9%' },
    { label: 'Cars.com', value: '18% (44 leads)', detail: 'Win rate: 16%, BAD rate: 12%' },
    { label: 'Walk-In', value: '12% (30 leads)', detail: 'Win rate: 31%, BAD rate: 3%' },
    { label: 'Referral', value: '8% (20 leads)', detail: 'Win rate: 32%, BAD rate: 2%' },
  ], insight: 'Website drives most volume but referrals have 32% win rate — a referral program could be your highest ROI channel.' },
  'lib-27': { rows: [
    { label: 'Digital Sources', value: '58% (143 leads)' },
    { label: '  Website', value: '84 leads' },
    { label: '  3rd Party (AutoTrader/Cars.com)', value: '59 leads' },
    { label: 'Physical Sources', value: '42% (104 leads)' },
    { label: '  Walk-In', value: '64 leads' },
    { label: '  Phone', value: '40 leads' },
  ], insight: 'Digital lead share growing (+4% MoM) but physical leads close 1.7x higher. Balance both channels.' },
  'lib-31': { rows: [
    { label: 'Units Sold This Week', value: '17', detail: '3.4/day avg across 5 business days' },
    { label: 'Last Week', value: '15 (3.0/day)' },
    { label: 'Avg Days to Close', value: '8.4 days', detail: 'Down from 9.1 days last month' },
    { label: 'Fastest Close', value: '1 day (walk-in trade-up)' },
    { label: 'Avg Deal Value', value: '$34,200' },
  ], insight: 'Sales velocity up 13% week-over-week. Speed improvement is driven by better follow-up on HOT leads.' },
  'lib-33': { rows: [
    { label: 'Current MTD Sales', value: '38 units', detail: '14 business days elapsed' },
    { label: 'Projected Month-End', value: '51 units', detail: 'Based on current velocity + pipeline' },
    { label: 'Last Month Total', value: '43 units' },
    { label: 'Pipeline Support', value: '247 active leads', detail: '4.8x coverage ratio (healthy)' },
    { label: 'Confidence Level', value: '78%', detail: 'Based on historical close patterns' },
  ], insight: 'On track to beat last month by 8 units (+19%). Pipeline coverage is strong at 4.8x.' },
};

type DrillDownModal = null | 'hotLeads' | 'newLeads' | 'showroom' | 'staleLeads' | 'pendingFinance' | 'pipelineHealth' | 'scorecardDetail';
type ReportCategory = 'loss' | 'channel' | 'trend';

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5 text-green-500" />;
  if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function MiniSparkline({ data, color = 'hsl(var(--primary))' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 60;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

export default function InsightsPage() {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [libraryView, setLibraryView] = useState<'grid' | 'list'>('grid');
  const [libraryFilter, setLibraryFilter] = useState('all');
  const [librarySearch, setLibrarySearch] = useState('');
  const [selectedLibMetric, setSelectedLibMetric] = useState<typeof libraryMetrics[0] | null>(null);
  const [drillDown, setDrillDown] = useState<DrillDownModal>(null);
  const [reportCategory, setReportCategory] = useState<ReportCategory>('loss');
  const [reportSubTab, setReportSubTab] = useState('tab1');
  const [hunchPrefsOpen, setHunchPrefsOpen] = useState(false);
  const [showHunches, setShowHunches] = useState(true);
  const [notifInApp, setNotifInApp] = useState(true);
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifSms, setNotifSms] = useState(false);
  const [defaultView, setDefaultView] = useState('all');
  const [minConfidence, setMinConfidence] = useState([50]);
  const [autoDismissDays, setAutoDismissDays] = useState(7);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['dashboard', 'reports', 'library', 'hunches'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail;
      if (tab && ['dashboard', 'reports', 'library', 'hunches'].includes(tab)) {
        setActiveTab(tab);
      }
    };
    window.addEventListener('insights-tab-change', handler);
    return () => window.removeEventListener('insights-tab-change', handler);
  }, []);

  useEffect(() => {
    setReportSubTab('tab1');
  }, [reportCategory]);

  const categories = ['all', ...Array.from(new Set(libraryMetrics.map(m => m.category)))];
  const filteredLibrary = libraryMetrics.filter(m => {
    const matchesCategory = libraryFilter === 'all' || m.category === libraryFilter;
    const matchesSearch = !librarySearch || m.title.toLowerCase().includes(librarySearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleExport = (type: string) => {
    toast({ title: `Export ${type}`, description: `${type} export has been generated and is ready for download.` });
  };

  const handleAction = (action: string, detail: string) => {
    toast({ title: action, description: detail });
  };

  const renderDashboard = () => (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* RED ZONE */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <h2 className="text-sm font-semibold text-foreground">Immediate Action Required</h2>
            <span className="text-[11px] text-muted-foreground ml-auto">Last updated: 8:45 AM</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="border-red-500/20 hover-elevate cursor-pointer" onClick={() => setDrillDown('hotLeads')} data-testid="card-hot-leads">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Flame className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Hot Leads Going Cold</p>
                    <p className="text-2xl font-bold text-foreground">{mockHotLeadsGoingCold.length}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-[11px] text-red-500/80 mt-2">Leads aging 14-21 days without close</p>
              </CardContent>
            </Card>

            <Card className="border-red-500/20 hover-elevate cursor-pointer" onClick={() => setDrillDown('newLeads')} data-testid="card-new-leads-no-contact">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">New Leads Without Contact</p>
                    <p className="text-2xl font-bold text-foreground">{mockNewLeadsNoContact.length}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-[11px] text-red-500/80 mt-2">No contact in over 48 hours</p>
              </CardContent>
            </Card>

            <Card className="border-red-500/20 hover-elevate cursor-pointer" onClick={() => setDrillDown('showroom')} data-testid="card-showroom-visitors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Showroom Visitors Not Closed</p>
                    <p className="text-2xl font-bold text-foreground">{mockShowroomNotClosed.length}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-[11px] text-red-500/80 mt-2">Open over 7 days</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* YELLOW ZONE */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <h2 className="text-sm font-semibold text-foreground">Watch List</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="border-amber-500/20 hover-elevate cursor-pointer" onClick={() => setDrillDown('staleLeads')} data-testid="card-stale-leads">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{yellowZoneData.staleLeads.label}</p>
                    <p className="text-2xl font-bold text-foreground">{yellowZoneData.staleLeads.count}</p>
                    <p className="text-[11px] text-muted-foreground">Avg Age: {yellowZoneData.staleLeads.avgAge} days</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleExport('CSV'); }} data-testid="button-export-stale">
                    <Download className="h-3.5 w-3.5 mr-1" /> CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-500/20 hover-elevate cursor-pointer" onClick={() => setDrillDown('pendingFinance')} data-testid="card-pending-finance">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Target className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{yellowZoneData.pendingFinance.label}</p>
                    <p className="text-2xl font-bold text-foreground">{yellowZoneData.pendingFinance.count}</p>
                    <p className="text-[11px] text-amber-500">{yellowZoneData.pendingFinance.overFiveDays} deals over 5 days old</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* GREEN ZONE */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h2 className="text-sm font-semibold text-foreground">Today's Performance</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {greenZoneMetrics.map(m => (
              <Card key={m.id} data-testid={`green-metric-${m.id}`}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{m.value}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <TrendIcon trend={m.trend} />
                    <span className={cn('text-xs', m.trend === 'up' ? 'text-green-500' : (m.trend as string) === 'down' ? 'text-red-500' : 'text-muted-foreground')}>
                      {m.change}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* PIPELINE HEALTH SUMMARY */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Pipeline Health</h2>
            <Button variant="ghost" size="sm" onClick={() => setDrillDown('pipelineHealth')} data-testid="button-pipeline-details">
              View Details <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card data-testid="pipeline-active">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Active Pipeline</p>
                <p className="text-2xl font-bold text-foreground mt-1">{pipelineHealthData.monthEndForecast.activePipeline}</p>
                <p className="text-[11px] text-muted-foreground mt-1">leads in play</p>
              </CardContent>
            </Card>
            <Card data-testid="pipeline-freshness">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Freshness Score</p>
                <p className="text-2xl font-bold text-green-500 mt-1">{pipelineHealthData.freshnessScore}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{pipelineHealthData.freshness[0].pct}% under 7 days</p>
              </CardContent>
            </Card>
            <Card data-testid="pipeline-hot">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Hot Leads</p>
                <p className="text-2xl font-bold text-foreground mt-1">{pipelineHealthData.hotLeads.total}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{pipelineHealthData.hotLeads.pctOfActive}% of active</p>
              </CardContent>
            </Card>
            <Card className={pipelineHealthData.monthEndForecast.gap < 0 ? 'border-red-500/20' : ''} data-testid="pipeline-forecast">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Month-End Forecast</p>
                <p className="text-2xl font-bold text-foreground mt-1">{pipelineHealthData.monthEndForecast.projectedMonthEnd}</p>
                <p className={cn('text-[11px] mt-1', pipelineHealthData.monthEndForecast.gap < 0 ? 'text-red-500' : 'text-green-500')}>
                  {pipelineHealthData.monthEndForecast.gap} vs target ({pipelineHealthData.monthEndForecast.monthlyTarget})
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* PERFORMANCE SCORECARD SUMMARY */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Performance Scorecard</h2>
            <Button variant="ghost" size="sm" onClick={() => setDrillDown('scorecardDetail')} data-testid="button-scorecard-details">
              View Details <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {scorecardConversionMetrics.map(m => (
              <Card key={m.id} className="hover-elevate cursor-pointer" onClick={() => setDrillDown('scorecardDetail')} data-testid={`scorecard-${m.id}`}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-2xl font-bold text-foreground">{m.value}</p>
                    <MiniSparkline data={m.sparkline} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <TrendIcon trend={m.trend} />
                    <span className={cn('text-xs', m.trend === 'up' ? 'text-green-500' : m.trend === 'down' ? 'text-red-500' : 'text-muted-foreground')}>
                      {m.change}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CHARTS */}
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
              <CardTitle className="text-base">Conversions by Day</CardTitle>
              <CardDescription>This week's closings</CardDescription>
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
      </div>
    </ScrollArea>
  );

  const renderReports = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-3 pb-2 border-b border-border flex items-center gap-2 flex-wrap">
        {([
          { id: 'loss' as const, label: 'Loss & Quality', icon: PieChart },
          { id: 'channel' as const, label: 'Channel Intelligence', icon: BarChart3 },
          { id: 'trend' as const, label: 'Trend & Forecast', icon: LineChart },
        ]).map(cat => (
          <Button
            key={cat.id}
            variant={reportCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setReportCategory(cat.id)}
            data-testid={`report-cat-${cat.id}`}
          >
            <cat.icon className="h-3.5 w-3.5 mr-1.5" />
            {cat.label}
          </Button>
        ))}
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => handleExport('PDF')} data-testid="button-export-report-pdf">
          <Download className="h-3.5 w-3.5 mr-1" /> Export
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4">
          {reportCategory === 'loss' && renderLossReports()}
          {reportCategory === 'channel' && renderChannelReports()}
          {reportCategory === 'trend' && renderTrendReports()}
        </div>
      </ScrollArea>
    </div>
  );

  const renderLossReports = () => (
    <div className="space-y-4">
      <Tabs value={reportSubTab} onValueChange={setReportSubTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="tab1" data-testid="tab-loss-autopsy">Deal Death Autopsy</TabsTrigger>
          <TabsTrigger value="tab2" data-testid="tab-loss-reengage">Re-Engagement</TabsTrigger>
          <TabsTrigger value="tab3" data-testid="tab-loss-quality">Source Quality Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="tab1" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loss Reason Breakdown</CardTitle>
              <CardDescription>December 2025 | 128 Losses | 95 Bad Leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lossReasonBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="reason" type="category" className="text-xs" width={180} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#EF4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bad Lead Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={badLeadBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="reason" type="category" className="text-xs" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loss Patterns by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Source</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Lost</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Top Reason</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">%</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Avg Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lossPatternsBySource.map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 px-2 font-medium text-foreground">{row.source}</td>
                        <td className="py-2 px-2 text-right text-foreground">{row.totalLost}</td>
                        <td className="py-2 px-2 text-muted-foreground">{row.topReason}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{row.topReasonPct}%</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{row.avgDaysBeforeLoss}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tab2" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Re-Engagement Candidates</CardTitle>
              <CardDescription>Recently lost leads with high re-engagement potential</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Lead ID</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Days Since</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Source</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Reason</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Vehicle</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Score</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reengagementCandidates.map(row => (
                      <tr key={row.id} className="border-b border-border/50">
                        <td className="py-2 px-2 font-medium text-primary cursor-pointer hover:underline">{row.leadId}</td>
                        <td className="py-2 px-2 text-right text-foreground">{row.daysSinceLoss}</td>
                        <td className="py-2 px-2 text-muted-foreground">{row.originalSource}</td>
                        <td className="py-2 px-2 text-muted-foreground">{row.lossReason}</td>
                        <td className="py-2 px-2 text-muted-foreground">{row.vehicle}</td>
                        <td className="py-2 px-2 text-right">
                          <Badge variant="secondary" className={cn('text-[10px]', row.reengageScore >= 75 ? 'text-green-600' : 'text-amber-600')}>
                            {row.reengageScore}%
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <Button size="sm" variant="outline" onClick={() => handleAction('Re-engage', `Initiating outreach for lead ${row.leadId}`)} data-testid={`button-reengage-${row.id}`}>
                            <Phone className="h-3 w-3 mr-1" /> Call
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tab3" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Source Quality Trends</CardTitle>
              <CardDescription>Win rate by source over last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={sourceQualityTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="internet" name="Internet" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="walkIn" name="Walk-In" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="phone" name="Phone" stroke="#F59E0B" strokeWidth={2} />
                    <Line type="monotone" dataKey="referral" name="Referral" stroke="#8B5CF6" strokeWidth={2} />
                    <Line type="monotone" dataKey="service" name="Service" stroke="#EF4444" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderChannelReports = () => (
    <div className="space-y-4">
      <Tabs value={reportSubTab} onValueChange={setReportSubTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="tab1" data-testid="tab-channel-full">Full Comparison</TabsTrigger>
          <TabsTrigger value="tab2" data-testid="tab-channel-digital">Digital vs Physical</TabsTrigger>
          <TabsTrigger value="tab3" data-testid="tab-channel-service">Service-to-Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="tab1" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Channel Performance Intelligence</CardTitle>
              <CardDescription>Period: January 2026 | 637 Total Leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Channel</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Vol</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">%</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Win</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Loss</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Bad</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Hot%</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Show%</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Δ Win</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">#</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullChannelComparison.map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 px-2 font-medium text-foreground">{row.channel}</td>
                        <td className="py-2 px-2 text-right text-foreground">{row.volume}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{row.pct}</td>
                        <td className="py-2 px-2 text-right text-green-500">{row.winRate}</td>
                        <td className="py-2 px-2 text-right text-red-500">{row.lossRate}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{row.badRate}</td>
                        <td className="py-2 px-2 text-right text-foreground">{row.hotPct}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{row.showPct}</td>
                        <td className={cn('py-2 px-2 text-right', row.deltaWin.includes('+') ? 'text-green-500' : row.deltaWin.includes('-') ? 'text-red-500' : 'text-muted-foreground')}>{row.deltaWin}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{row.rank}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="p-2 rounded bg-green-500/10 text-xs"><span className="font-medium">Top:</span> Referral (32% win, 41% hot)</div>
                <div className="p-2 rounded bg-red-500/10 text-xs"><span className="font-medium">Under:</span> Service (11% despite 8% vol)</div>
                <div className="p-2 rounded bg-blue-500/10 text-xs"><span className="font-medium">Rising:</span> Prev Customer (+2%)</div>
                <div className="p-2 rounded bg-amber-500/10 text-xs"><span className="font-medium">Falling:</span> Internet (-2%)</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tab2" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Digital vs Physical Breakdown</CardTitle>
              <CardDescription>Internet + Chat + Parts vs Walk-In + Phone + Service + Referral + Prev</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[digitalVsPhysical.digital, digitalVsPhysical.physical].map((group, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border">
                    <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                      {i === 0 ? '🌐' : '🏢'} {group.label}
                    </h4>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Volume</span><span className="text-foreground font-medium">{group.volume} ({group.pct}%)</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Win Rate</span><span className="text-green-500">{group.winRate}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Loss Rate</span><span className="text-red-500">{group.lossRate}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Bad Rate</span><span className="text-foreground">{group.badRate}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Hot Lead %</span><span className="text-foreground">{group.hotPct}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Trade-In %</span><span className="text-foreground">{group.tradePct}</span></div>
                      <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                        Volume: {group.volumeTrend} | Win Rate: {group.winTrend}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Digital Maturity Score:</span>
                  <span className="font-bold text-foreground">{digitalVsPhysical.maturityScore}</span>
                  <span className="text-xs text-muted-foreground">(Benchmark: {digitalVsPhysical.benchmark})</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">💡 {digitalVsPhysical.insight}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tab3" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Service Lane Cross-Sell Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[11px] text-muted-foreground">Service Leads</p>
                  <p className="text-lg font-bold text-foreground">{serviceLaneAnalysis.currentPerformance.leads}</p>
                  <p className="text-[11px] text-muted-foreground">{serviceLaneAnalysis.currentPerformance.pctOfTotal}% of total</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[11px] text-muted-foreground">Win Rate</p>
                  <p className="text-lg font-bold text-foreground">{serviceLaneAnalysis.currentPerformance.winRate}%</p>
                  <p className="text-[11px] text-muted-foreground">Best practice: {serviceLaneAnalysis.currentPerformance.industryBest}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[11px] text-muted-foreground">Capture Rate</p>
                  <p className="text-lg font-bold text-foreground">{serviceLaneAnalysis.opportunitySizing.captureRate}%</p>
                  <p className="text-[11px] text-muted-foreground">{Math.round(serviceLaneAnalysis.opportunitySizing.monthlyServiceCustomers * serviceLaneAnalysis.opportunitySizing.captureRate / 100)} of {serviceLaneAnalysis.opportunitySizing.monthlyServiceCustomers}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[11px] text-muted-foreground">Monthly Sales</p>
                  <p className="text-lg font-bold text-foreground">{serviceLaneAnalysis.opportunitySizing.currentMonthlySales}</p>
                  <p className="text-[11px] text-muted-foreground">from service lane</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">What-If Scenarios</h4>
                <div className="space-y-2">
                  {serviceLaneAnalysis.scenarios.map((s, i) => (
                    <div key={i} className={cn('p-3 rounded-lg border', i === 2 ? 'border-green-500/30 bg-green-500/5' : 'border-border')}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{s.label}</span>
                        <Badge variant="secondary" className={cn('text-xs', i === 2 ? 'text-green-600' : '')}>
                          +{s.additionalSales} sales → {s.additionalProfit}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.leads} leads × {s.conversion}% = {s.sales} sales/month
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Recommended Actions</h4>
                <div className="space-y-1.5">
                  {serviceLaneAnalysis.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-foreground font-medium">{i + 1}.</span> {r}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderTrendReports = () => (
    <div className="space-y-4">
      <Tabs value={reportSubTab} onValueChange={setReportSubTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="tab1" data-testid="tab-trend-monthly">Monthly Summary</TabsTrigger>
          <TabsTrigger value="tab2" data-testid="tab-trend-forecast">Rolling Forecast</TabsTrigger>
          <TabsTrigger value="tab3" data-testid="tab-trend-yoy">Year-over-Year</TabsTrigger>
        </TabsList>

        <TabsContent value="tab1" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Performance Summary</CardTitle>
              <CardDescription>{monthlyPerformanceSummary.period} vs {monthlyPerformanceSummary.previousPeriod}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {monthlyPerformanceSummary.keyMetrics.map((m, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-[11px] text-muted-foreground">{m.label}</p>
                    <p className="text-lg font-bold text-foreground">{m.current}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendIcon trend={m.trend} />
                      <span className="text-xs text-green-500">{m.change}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">vs {m.previous}</p>
                  </div>
                ))}
              </div>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPerformanceSummary.volumeTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.7} />
                    <Bar dataKey="sold" name="Sold" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Biggest Winners</h4>
                  {monthlyPerformanceSummary.sourceChanges.winners.map((w, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm py-1">
                      <span className="text-green-500">🏆</span>
                      <span className="text-foreground font-medium">{w.source}:</span>
                      <span className="text-muted-foreground">{w.change}, win rate {w.winChange}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Areas of Concern</h4>
                  {monthlyPerformanceSummary.sourceChanges.losers.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm py-1">
                      <span className="text-amber-500">⚠️</span>
                      <span className="text-foreground font-medium">{l.source}:</span>
                      <span className="text-muted-foreground">{l.change}, win rate {l.winChange}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                  <h5 className="text-xs font-semibold text-green-600 mb-2">Wins</h5>
                  {monthlyPerformanceSummary.executiveSummary.wins.map((w, i) => (
                    <p key={i} className="text-xs text-muted-foreground py-0.5">✅ {w}</p>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <h5 className="text-xs font-semibold text-amber-600 mb-2">Concerns</h5>
                  {monthlyPerformanceSummary.executiveSummary.concerns.map((c, i) => (
                    <p key={i} className="text-xs text-muted-foreground py-0.5">⚠️ {c}</p>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <h5 className="text-xs font-semibold text-blue-600 mb-2">Recommendations</h5>
                  {monthlyPerformanceSummary.executiveSummary.recommendations.map((r, i) => (
                    <p key={i} className="text-xs text-muted-foreground py-0.5">{i + 1}. {r}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tab2" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">90-Day Rolling Forecast</CardTitle>
              <CardDescription>Generated: {rollingForecast.generated}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">{rollingForecast.methodology}</p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Month</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Lead Vol</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Sold</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Target</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rollingForecast.projections.map((p, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 px-2 font-medium text-foreground">{p.month}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{p.leadVol}</td>
                        <td className="py-2 px-2 text-right text-foreground">
                          {p.soldProjected ? `${p.soldActual} actual / ${p.soldProjected} projected` : p.soldRange}
                        </td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{p.target}</td>
                        <td className="py-2 px-2 text-right">
                          <Badge variant="secondary" className={cn('text-[10px]', p.status === 'success' ? 'text-green-600' : 'text-amber-600')}>
                            {p.status === 'success' ? '✅ On Track' : '⚠️ At Risk'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <h4 className="text-sm font-semibold text-foreground mb-2">Gap-to-Goal Analysis</h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Need:</span> <span className="font-medium text-foreground">{rollingForecast.gapAnalysis.salesNeeded} more sales</span></div>
                  <div><span className="text-muted-foreground">Days left:</span> <span className="font-medium text-foreground">{rollingForecast.gapAnalysis.daysRemaining}</span></div>
                  <div><span className="text-muted-foreground">Pipeline:</span> <span className="font-medium text-foreground">{rollingForecast.gapAnalysis.activePipeline} active</span></div>
                  <div><span className="text-muted-foreground">Required win rate:</span> <span className="font-medium text-red-500">{rollingForecast.gapAnalysis.requiredWinRate}</span></div>
                  <div><span className="text-muted-foreground">Baseline:</span> <span className="font-medium text-foreground">{rollingForecast.gapAnalysis.baselineWinRate}</span></div>
                </div>
                <p className="text-xs text-amber-600 mt-2 font-medium">⚠️ {rollingForecast.gapAnalysis.assessment}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">Recommendations to Close Gap</h4>
                {rollingForecast.gapRecommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground py-0.5">
                    <span className="text-foreground font-medium">{i + 1}.</span> {r}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tab3" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Year-over-Year Performance</CardTitle>
              <CardDescription>{yearOverYear.period}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Metric</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">2024</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">2025</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearOverYear.annual.map((row, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 px-2 font-medium text-foreground">{row.metric}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{row.y2023}</td>
                        <td className="py-2 px-2 text-right text-foreground">{row.y2024}</td>
                        <td className={cn('py-2 px-2 text-right', row.change.includes('+') ? 'text-green-500' : row.change === '0%' ? 'text-muted-foreground' : 'text-red-500')}>{row.change}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearOverYear.monthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="prev" name="2024" fill="hsl(var(--primary))" opacity={0.4} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="current" name="2025" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                <h4 className="text-xs font-semibold text-green-600 mb-2">Key Achievements</h4>
                {yearOverYear.achievements.map((a, i) => (
                  <p key={i} className="text-xs text-muted-foreground py-0.5">🏆 {a}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderLibrary = () => (
    <>
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
        <div className="flex items-center gap-1 flex-wrap">
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
      <ScrollArea className="flex-1 min-h-0">
        <div className={cn('p-4', libraryView === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' : 'space-y-2')}>
          {filteredLibrary.map(metric => (
            libraryView === 'grid' ? (
              <Card key={metric.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedLibMetric(metric)} data-testid={`lib-metric-${metric.id}`}>
                <CardContent className="p-4">
                  <Badge variant="secondary" className="text-[10px]">{metric.category}</Badge>
                  <p className="text-xs text-muted-foreground mt-3">{metric.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                      <p className={cn('text-xs mt-1', metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground')}>
                        {metric.change}
                      </p>
                    </div>
                    {metric.trend === 'up' && <TrendingUp className="h-10 w-10 text-green-500" />}
                    {metric.trend === 'down' && <TrendingDown className="h-10 w-10 text-red-500" />}
                    {(metric.trend as string) === 'neutral' && <Minus className="h-10 w-10 text-muted-foreground" />}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div key={metric.id} className="flex items-center gap-4 p-3 rounded-lg border border-border hover-elevate cursor-pointer" onClick={() => setSelectedLibMetric(metric)} data-testid={`lib-metric-${metric.id}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{metric.title}</p>
                  <Badge variant="secondary" className="text-[10px] mt-1">{metric.category}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{metric.value}</p>
                    <span className={cn('text-xs', metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground')}>
                      {metric.change}
                    </span>
                  </div>
                  {metric.trend === 'up' && <TrendingUp className="h-10 w-10 text-green-500" />}
                  {metric.trend === 'down' && <TrendingDown className="h-10 w-10 text-red-500" />}
                  {(metric.trend as string) === 'neutral' && <Minus className="h-10 w-10 text-muted-foreground" />}
                </div>
              </div>
            )
          ))}
        </div>
      </ScrollArea>
    </>
  );

  const renderHunches = () => (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-foreground">AI-Generated Hunches</h3>
          <Button variant="ghost" size="icon" onClick={() => setHunchPrefsOpen(true)} data-testid="button-hunch-preferences">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
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
                    <Button size="sm" variant="outline" onClick={() => toast({ title: 'Hunch dismissed', description: `"${hunch.title}" has been removed from your feed.` })} data-testid={`hunch-dismiss-${hunch.id}`}>Dismiss</Button>
                    <Button size="sm" onClick={() => toast({ title: 'Action initiated', description: `Creating task for "${hunch.title}". Your team will be notified.` })} data-testid={`hunch-act-${hunch.id}`}>Act</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Insights</h1>
          <p className="text-sm text-muted-foreground">Analytics, reports, and AI-generated intelligence</p>
        </div>
      </div>

      <div className="px-4 py-2 lg:hidden">
        <MobileNavDropdown currentPath="/insights" currentLabel="Insights" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 border-b border-border hidden lg:flex items-center">
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

        <TabsContent value="dashboard" className="flex-1 min-h-0 m-0 overflow-hidden data-[state=inactive]:hidden">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="reports" className="flex-1 min-h-0 m-0 overflow-hidden data-[state=inactive]:hidden">
          {renderReports()}
        </TabsContent>

        <TabsContent value="library" className="flex-1 min-h-0 m-0 overflow-hidden flex flex-col data-[state=inactive]:hidden">
          {renderLibrary()}
        </TabsContent>

        <TabsContent value="hunches" className="flex-1 min-h-0 m-0 overflow-hidden flex flex-col data-[state=inactive]:hidden">
          {renderHunches()}
        </TabsContent>
      </Tabs>

      <Sheet open={hunchPrefsOpen} onOpenChange={setHunchPrefsOpen}>
        <SheetContent side="right" className="w-[380px] sm:w-[420px]" data-testid="sheet-hunch-preferences">
          <SheetHeader>
            <SheetTitle>My Hunch Preferences</SheetTitle>
            <SheetDescription>
              These settings apply to your view only. System-wide hunch settings are managed in AI Configuration.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 mt-6">
            <div className="space-y-6 pr-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-hunches" className="text-sm font-medium text-foreground">Show Hunches</Label>
                <Switch id="show-hunches" checked={showHunches} onCheckedChange={setShowHunches} data-testid="switch-show-hunches" />
              </div>

              <div className="space-y-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notification Preferences</p>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notif-in-app" className="text-sm text-foreground">In-App</Label>
                  <Switch id="notif-in-app" checked={notifInApp} onCheckedChange={setNotifInApp} data-testid="switch-notif-in-app" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notif-email" className="text-sm text-foreground">Email</Label>
                  <Switch id="notif-email" checked={notifEmail} onCheckedChange={setNotifEmail} data-testid="switch-notif-email" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notif-sms" className="text-sm text-foreground">SMS</Label>
                  <Switch id="notif-sms" checked={notifSms} onCheckedChange={setNotifSms} data-testid="switch-notif-sms" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Default View</Label>
                <Select value={defaultView} onValueChange={setDefaultView}>
                  <SelectTrigger data-testid="select-default-view">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="opportunities">Opportunities</SelectItem>
                    <SelectItem value="threats">Threats</SelectItem>
                    <SelectItem value="insights">Insights</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-foreground">Minimum Confidence</Label>
                  <span className="text-sm text-muted-foreground" data-testid="text-min-confidence-value">{minConfidence[0]}%</span>
                </div>
                <Slider
                  value={minConfidence}
                  onValueChange={setMinConfidence}
                  min={0}
                  max={100}
                  step={5}
                  data-testid="slider-min-confidence"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="auto-dismiss" className="text-sm font-medium text-foreground">Auto-Dismiss After</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="auto-dismiss"
                    type="number"
                    min={1}
                    max={90}
                    value={autoDismissDays}
                    onChange={(e) => setAutoDismissDays(Number(e.target.value))}
                    className="w-20"
                    data-testid="input-auto-dismiss-days"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
            </div>
          </ScrollArea>
          <SheetFooter className="mt-6">
            <Button className="w-full" onClick={() => { setHunchPrefsOpen(false); toast({ title: 'Preferences saved', description: 'Your hunch preferences have been updated.' }); }} data-testid="button-save-hunch-preferences">
              Save Preferences
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* DRILL-DOWN MODALS */}

      {/* Hot Leads Going Cold */}
      <Dialog open={drillDown === 'hotLeads'} onOpenChange={(open) => !open && setDrillDown(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-hot-leads">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-500" /> Hot Leads Going Cold ({mockHotLeadsGoingCold.length})
            </DialogTitle>
            <DialogDescription>Leads aging 14+ days without close — immediate follow-up needed</DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Lead ID</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Days Old</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Source</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Vehicle</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockHotLeadsGoingCold.map(lead => (
                  <tr key={lead.id} className="border-b border-border/50">
                    <td className="py-2 px-2 font-medium text-primary cursor-pointer hover:underline">{lead.leadId}</td>
                    <td className="py-2 px-2 text-right text-foreground">{lead.daysOld} days</td>
                    <td className="py-2 px-2 text-muted-foreground">{lead.type}</td>
                    <td className="py-2 px-2 text-muted-foreground">{lead.source}</td>
                    <td className="py-2 px-2 text-muted-foreground">{lead.vehicle}</td>
                    <td className="py-2 px-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => handleAction('Call initiated', `Calling lead ${lead.leadId}`)} data-testid={`button-call-${lead.id}`}>
                        <Phone className="h-3 w-3 mr-1" /> Call
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('CSV')} data-testid="button-export-hot-leads">
              <Download className="h-3.5 w-3.5 mr-1" /> Export CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Leads Without Contact */}
      <Dialog open={drillDown === 'newLeads'} onOpenChange={(open) => !open && setDrillDown(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-new-leads">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" /> New Leads Without Contact ({mockNewLeadsNoContact.length})
            </DialogTitle>
            <DialogDescription>No contact made in over 48 hours</DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Lead ID</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Hours</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Source</th>
                  <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">Hot?</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockNewLeadsNoContact.map(lead => (
                  <tr key={lead.id} className="border-b border-border/50">
                    <td className="py-2 px-2 font-medium text-primary cursor-pointer hover:underline">{lead.leadId}</td>
                    <td className="py-2 px-2 text-right text-foreground">{lead.hoursOld} hrs</td>
                    <td className="py-2 px-2 text-muted-foreground">{lead.type}</td>
                    <td className="py-2 px-2 text-muted-foreground">{lead.source}</td>
                    <td className="py-2 px-2 text-center">
                      {lead.isHot ? <Badge variant="secondary" className="text-[10px] text-red-500">Hot</Badge> : <span className="text-xs text-muted-foreground">No</span>}
                    </td>
                    <td className="py-2 px-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => handleAction('Assigned', `Lead ${lead.leadId} assigned to next available rep`)} data-testid={`button-assign-${lead.id}`}>
                        <UserPlus className="h-3 w-3 mr-1" /> Assign
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Showroom Visitors Not Closed */}
      <Dialog open={drillDown === 'showroom'} onOpenChange={(open) => !open && setDrillDown(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-showroom">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-red-500" /> Showroom Visitors Not Closed ({mockShowroomNotClosed.length})
            </DialogTitle>
            <DialogDescription>Walk-in visitors open over 7 days</DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Lead ID</th>
                  <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Days Old</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Vehicle</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockShowroomNotClosed.map(lead => (
                  <tr key={lead.id} className="border-b border-border/50">
                    <td className="py-2 px-2 font-medium text-primary cursor-pointer hover:underline">{lead.leadId}</td>
                    <td className="py-2 px-2 text-right text-foreground">{lead.daysOld} days</td>
                    <td className="py-2 px-2 text-muted-foreground">{lead.type}</td>
                    <td className="py-2 px-2 text-muted-foreground">{lead.vehicle}</td>
                    <td className="py-2 px-2">
                      <Badge variant="secondary" className="text-[10px]">{lead.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stale Leads */}
      <Dialog open={drillDown === 'staleLeads'} onOpenChange={(open) => !open && setDrillDown(null)}>
        <DialogContent className="max-w-md" data-testid="dialog-stale-leads">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Stale Leads
            </DialogTitle>
            <DialogDescription>Leads approaching 28-35 days without resolution</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Leads needing update</span>
                <span className="text-2xl font-bold text-foreground">{yellowZoneData.staleLeads.count}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Average age</span>
                <span className="text-lg font-semibold text-foreground">{yellowZoneData.staleLeads.avgAge} days</span>
              </div>
            </div>
            <Button className="w-full" variant="outline" onClick={() => handleExport('CSV')} data-testid="button-export-stale-detail">
              <Download className="h-3.5 w-3.5 mr-1" /> Export Full List (CSV)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending Finance */}
      <Dialog open={drillDown === 'pendingFinance'} onOpenChange={(open) => !open && setDrillDown(null)}>
        <DialogContent className="max-w-md" data-testid="dialog-pending-finance">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-500" /> Deals Pending Finance
            </DialogTitle>
            <DialogDescription>Deals awaiting finance approval</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total pending</span>
                <span className="text-2xl font-bold text-foreground">{yellowZoneData.pendingFinance.count}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Over 5 days old</span>
                <span className="text-lg font-semibold text-amber-500">{yellowZoneData.pendingFinance.overFiveDays}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Focus on accelerating the 2 deals over 5 days to prevent month-end slippage.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pipeline Health Detail */}
      <Dialog open={drillDown === 'pipelineHealth'} onOpenChange={(open) => !open && setDrillDown(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" data-testid="dialog-pipeline-health">
          <DialogHeader>
            <DialogTitle>Pipeline Health Monitor</DialogTitle>
            <DialogDescription>Week of Feb 17-21, 2026</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Velocity Indicators</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[11px] text-muted-foreground">7-Day Avg</p>
                  <p className="text-lg font-bold text-foreground">{pipelineHealthData.velocity.sevenDay}</p>
                  <p className="text-[11px] text-muted-foreground">leads/day</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[11px] text-muted-foreground">30-Day Avg</p>
                  <p className="text-lg font-bold text-foreground">{pipelineHealthData.velocity.thirtyDay}</p>
                  <p className="text-[11px] text-muted-foreground">leads/day</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-[11px] text-muted-foreground">Trend</p>
                  <p className="text-lg font-bold text-green-500">{pipelineHealthData.velocity.direction}</p>
                  <p className="text-[11px] text-green-500">{pipelineHealthData.velocity.trend}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Pipeline Freshness</h4>
              <div className="flex h-6 rounded-full overflow-hidden">
                {pipelineHealthData.freshness.map((seg, i) => (
                  <div key={i} style={{ width: `${seg.pct}%`, backgroundColor: seg.color }} className="relative group" title={`${seg.range}: ${seg.count} (${seg.pct}%)`}>
                    {seg.pct >= 10 && <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium">{seg.pct}%</span>}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {pipelineHealthData.freshness.map((seg, i) => (
                  <span key={i} className="text-[10px] text-muted-foreground">{seg.range} ({seg.count})</span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-[10px] text-green-600">Freshness: {pipelineHealthData.freshnessScore}</Badge>
                <span className="text-xs text-muted-foreground">Stale: {pipelineHealthData.stalePct}% (Target: &lt;5%)</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Hot Lead Tracking</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Hot Leads</span><span className="font-medium text-foreground">{pipelineHealthData.hotLeads.total}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">% of Active</span><span className="font-medium text-foreground">{pipelineHealthData.hotLeads.pctOfActive}%</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Avg Age</span><span className="font-medium text-foreground">{pipelineHealthData.hotLeads.avgAge} days</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Over 14 days</span><span className="font-medium text-red-500">{pipelineHealthData.hotLeads.over14Days} leads</span></div>
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie data={pipelineHealthData.hotLeadAgeDistribution} dataKey="value" nameKey="range" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2}>
                        {pipelineHealthData.hotLeadAgeDistribution.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Lead Status Flow</h4>
              <div className="flex items-center justify-between gap-2">
                {pipelineHealthData.statusFlow.map((stage, i) => (
                  <div key={i} className="flex items-center gap-2 flex-1">
                    <div className="flex-1 p-3 rounded-lg bg-muted/50 border border-border text-center">
                      <p className="text-lg font-bold text-foreground">{stage.count}</p>
                      <p className="text-xs text-muted-foreground">{stage.stage}</p>
                      <p className="text-[10px] text-muted-foreground">{stage.pct}%</p>
                    </div>
                    {i < pipelineHealthData.statusFlow.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                  </div>
                ))}
              </div>
              {pipelineHealthData.statusFlow[0].pct > 15 && (
                <p className="text-xs text-amber-500 mt-2">⚠️ NEW category high ({pipelineHealthData.statusFlow[0].pct}%) — check response capacity</p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Month-End Forecast</h4>
              <div className="p-4 rounded-lg border border-border space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Current Sold (MTD)</span><span className="font-medium text-foreground">{pipelineHealthData.monthEndForecast.currentSold}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Active Pipeline</span><span className="font-medium text-foreground">{pipelineHealthData.monthEndForecast.activePipeline}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Historical Win Rate</span><span className="font-medium text-foreground">{pipelineHealthData.monthEndForecast.historicalWinRate}%</span></div>
                <div className="border-t border-border pt-2 flex justify-between"><span className="text-muted-foreground">Projected Month-End</span><span className="font-bold text-foreground">{pipelineHealthData.monthEndForecast.projectedMonthEnd} deals</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Monthly Target</span><span className="font-medium text-foreground">{pipelineHealthData.monthEndForecast.monthlyTarget} deals</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gap</span><span className="font-bold text-red-500">{pipelineHealthData.monthEndForecast.gap} deals ({pipelineHealthData.monthEndForecast.gapPct}%)</span></div>
                <p className="text-xs text-amber-600 mt-1">💡 {pipelineHealthData.monthEndForecast.actionNeeded}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => handleExport('PDF')} data-testid="button-export-pipeline">
                <Download className="h-3.5 w-3.5 mr-1" /> Export PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Performance Scorecard Detail */}
      <Dialog open={drillDown === 'scorecardDetail'} onOpenChange={(open) => !open && setDrillDown(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" data-testid="dialog-scorecard-detail">
          <DialogHeader>
            <DialogTitle>Performance Scorecard</DialogTitle>
            <DialogDescription>Rolling 30-Day Performance</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Key Conversion Metrics</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {scorecardConversionMetrics.map(m => (
                  <div key={m.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-[11px] text-muted-foreground">{m.label}</p>
                    <p className="text-xl font-bold text-foreground mt-1">{m.value}</p>
                    <MiniSparkline data={m.sparkline} />
                    <div className="flex items-center gap-1 mt-1">
                      <TrendIcon trend={m.trend} />
                      <span className={cn('text-xs', m.trend === 'up' ? 'text-green-500' : 'text-red-500')}>{m.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Top 5 Lead Sources (by Quality)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">#</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Source</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Vol</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Win Rate</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Quality</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Bad %</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Trend</th>
                      <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topLeadSources.map(s => (
                      <tr key={s.rank} className="border-b border-border/50">
                        <td className="py-2 px-2 text-muted-foreground">{s.rank}</td>
                        <td className="py-2 px-2 font-medium text-foreground">{s.source}</td>
                        <td className="py-2 px-2 text-right text-foreground">{s.volume}</td>
                        <td className="py-2 px-2 text-right text-green-500">{s.winRate}</td>
                        <td className="py-2 px-2 text-right text-foreground">{s.quality}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{s.badPct}</td>
                        <td className="py-2 px-2 text-muted-foreground">{s.trend}</td>
                        <td className="py-2 px-2 text-center">
                          <Badge variant="secondary" className={cn('text-[10px]', 
                            s.gradeColor === 'green' ? 'text-green-600' : 
                            s.gradeColor === 'yellow' ? 'text-amber-600' : 'text-red-600'
                          )}>
                            {s.grade}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-red-500 mt-2">🚨 AutoTrader graded D for 2nd consecutive week</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Channel Performance</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">Channel</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Volume</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">% Total</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Win</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Loss</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Bad</th>
                      <th className="text-right py-2 px-2 text-xs font-medium text-muted-foreground">Hot %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelPerformance.map((ch, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 px-2 font-medium text-foreground">{ch.channel}</td>
                        <td className="py-2 px-2 text-right text-foreground">{ch.volume}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{ch.pctTotal}</td>
                        <td className="py-2 px-2 text-right text-green-500">{ch.winRate}</td>
                        <td className="py-2 px-2 text-right text-red-500">{ch.lossRate}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{ch.badRate}</td>
                        <td className="py-2 px-2 text-right text-foreground">{ch.hotPct}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-blue-500 mt-2">💡 Referral has highest win rate (32%) but lowest volume (4%) — launch referral incentive program</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Week-over-Week Trends</h4>
              <div className="space-y-2">
                {weekOverWeekTrends.map((t, i) => (
                  <div key={i} className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground w-32">{t.metric}</span>
                    <span className="text-foreground">{t.thisWeek} vs {t.lastWeek}</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <TrendIcon trend={t.trend} />
                      <span className="text-green-500 text-xs">{t.change}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-green-500 mt-2">✅ 4 of 4 indicators trending positive</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Library Metric Detail */}
      <Dialog open={!!selectedLibMetric} onOpenChange={(open) => !open && setSelectedLibMetric(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto" data-testid="dialog-metric-detail">
          {selectedLibMetric && (() => {
            const sampleData = libMetricSampleData[selectedLibMetric.id] || null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedLibMetric.title}</DialogTitle>
                  <DialogDescription>Category: {selectedLibMetric.category}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                    <div>
                      <p className="text-3xl font-bold text-foreground">{selectedLibMetric.value}</p>
                      <p className={cn('text-sm mt-1', selectedLibMetric.trend === 'up' ? 'text-green-500' : selectedLibMetric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground')}>
                        {selectedLibMetric.change} vs last period
                      </p>
                    </div>
                    <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', selectedLibMetric.trend === 'up' ? 'bg-green-500/10' : selectedLibMetric.trend === 'down' ? 'bg-red-500/10' : 'bg-muted')}>
                      <TrendIcon trend={selectedLibMetric.trend} />
                    </div>
                  </div>
                  {sampleData ? (
                    <>
                      <div className="space-y-1">
                        {sampleData.rows.map((row, idx) => (
                          <div key={idx} className="py-1.5 px-2 rounded-md hover:bg-muted/50">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">{row.label}</span>
                              <span className="text-sm font-semibold text-foreground">{row.value}</span>
                            </div>
                            {row.detail && <p className="text-[11px] text-muted-foreground mt-0.5">{row.detail}</p>}
                          </div>
                        ))}
                      </div>
                      {sampleData.insight && (
                        <div className="flex items-start gap-2 p-2 rounded-md bg-primary/5 border border-primary/10">
                          <Lightbulb className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-foreground">{sampleData.insight}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">7-Day Avg</span><span className="text-foreground font-medium">{selectedLibMetric.value}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">30-Day Avg</span><span className="text-foreground font-medium">{selectedLibMetric.value}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">90-Day Avg</span><span className="text-foreground font-medium">{selectedLibMetric.value}</span></div>
                    </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => { toast({ title: 'Added to dashboard', description: `${selectedLibMetric.title} pinned to your dashboard.` }); setSelectedLibMetric(null); }} data-testid="button-pin-metric">
                      Pin to Dashboard
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
