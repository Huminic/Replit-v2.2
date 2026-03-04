/**
 * @file main.tsx — Primary AI Chat Page
 * @description The center of the app experience. This is the main AI chat interface
 *   where users interact with the AI persona (personaName from AppContext). The page follows
 *   the cardinal layout rule: chat is always in center → info/artifacts appear in the right pane.
 *
 * @layout
 *   - Top section: Role-based metric tiles (2x2 grid) that collapse after the user's first message
 *   - Center: Full chat thread with bot messages left-aligned, user messages right-aligned (NO avatars)
 *   - Bottom: Suggestion chips + gradient-bordered chat input with file upload dropdown
 *   - Metric detail dialog: Click any tile to see drill-down breakdown data
 *
 * @designConstraints
 *   - Metric tiles: gradient backgrounds, decorative SVG concentric circles, icon badges
 *   - Chat: Bot messages use bg-card with border, user messages use bg-primary
 *   - Thinking animation: flat rolling wave (.wave-dot CSS class), 3 dots with staggered timing (0s/0.15s/0.3s)
 *   - Input: gradient border wrapper (chat-input-gradient class) with purple glow shadow
 *
 * @rbac All 8 roles see different metric tiles based on currentRole — each role gets tailored KPIs
 * @locked Metric tile gradient themes per role, wave animation timing, chat bubble styling
 *
 * @productionNote Chat responses are currently mocked with a 1.5s setTimeout.
 *   Will connect to AI backend at nexxusv2.huminicdev.com with conversation context.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Plus, Sparkles, TrendingUp, TrendingDown, Upload, FileText, X, ChevronDown, ChevronRight, ChevronUp, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { agentSuggestions, type ChatMessage } from '@/mocks/messages';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { UserRole } from '@/mocks/users';
import type { Conversation as DbConversation, Message as DbMessage } from '@shared/schema';

/** Shape of a single metric tile displayed above the chat */
interface MetricTile {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  gradient: string; // Tailwind gradient classes for tile background
  iconBg: string;   // Background color class for the icon badge
}

/**
 * roleMetrics — Role-based metric tiles that display above the chat area.
 * Each role gets 4 tailored KPI tiles. These collapse after the user sends their first message.
 * PRODUCTION NOTE: Values are currently hardcoded; will wire to real-time dashboard data from backend.
 */
const roleMetrics: Record<UserRole, MetricTile[]> = {
  super_admin: [
    { label: 'Partner Orgs', value: '12', change: '+2 this month', trend: 'up', gradient: 'from-violet-500/15 via-purple-500/10 to-fuchsia-500/5', iconBg: 'bg-violet-500/20' },
    { label: 'Total Logins', value: '1,847', change: '+18%', trend: 'up', gradient: 'from-blue-500/15 via-cyan-500/10 to-sky-500/5', iconBg: 'bg-blue-500/20' },
    { label: 'Platform Actions', value: '24.3K', change: '+9%', trend: 'up', gradient: 'from-emerald-500/15 via-green-500/10 to-teal-500/5', iconBg: 'bg-emerald-500/20' },
    { label: 'Agent Actions', value: '8,412', change: '+22%', trend: 'up', gradient: 'from-amber-500/15 via-orange-500/10 to-yellow-500/5', iconBg: 'bg-amber-500/20' },
  ],
  partner_admin: [
    { label: 'Sub Orgs', value: '6', change: '+1 this quarter', trend: 'up', gradient: 'from-indigo-500/15 via-violet-500/10 to-purple-500/5', iconBg: 'bg-indigo-500/20' },
    { label: 'Total Logins', value: '423', change: '+12%', trend: 'up', gradient: 'from-cyan-500/15 via-blue-500/10 to-sky-500/5', iconBg: 'bg-cyan-500/20' },
    { label: 'User Actions', value: '5,291', change: '+7%', trend: 'up', gradient: 'from-teal-500/15 via-emerald-500/10 to-green-500/5', iconBg: 'bg-teal-500/20' },
    { label: 'Agent Actions', value: '2,104', change: '+15%', trend: 'up', gradient: 'from-rose-500/15 via-pink-500/10 to-fuchsia-500/5', iconBg: 'bg-rose-500/20' },
  ],
  org_admin: [
    { label: 'Pipeline Value', value: '$284K', change: '+14%', trend: 'up', gradient: 'from-emerald-500/15 via-green-500/10 to-teal-500/5', iconBg: 'bg-emerald-500/20' },
    { label: 'Lead Source', value: '47 new', change: '+8 today', trend: 'up', gradient: 'from-blue-500/15 via-indigo-500/10 to-violet-500/5', iconBg: 'bg-blue-500/20' },
    { label: 'Lead Quality', value: '72%', change: '-3%', trend: 'down', gradient: 'from-amber-500/15 via-orange-500/10 to-red-500/5', iconBg: 'bg-amber-500/20' },
    { label: 'Demand Score', value: '8.4', change: '+0.6', trend: 'up', gradient: 'from-purple-500/15 via-violet-500/10 to-indigo-500/5', iconBg: 'bg-purple-500/20' },
  ],
  executive: [
    { label: 'Revenue', value: '$1.2M', change: '+9%', trend: 'up', gradient: 'from-emerald-500/15 via-green-500/10 to-teal-500/5', iconBg: 'bg-emerald-500/20' },
    { label: 'Team Activity', value: '94%', change: '+3%', trend: 'up', gradient: 'from-blue-500/15 via-indigo-500/10 to-violet-500/5', iconBg: 'bg-blue-500/20' },
    { label: 'Customer Sat', value: '4.7', change: '+0.2', trend: 'up', gradient: 'from-amber-500/15 via-orange-500/10 to-red-500/5', iconBg: 'bg-amber-500/20' },
    { label: 'ROI Score', value: '8.9', change: '+1.1', trend: 'up', gradient: 'from-purple-500/15 via-violet-500/10 to-indigo-500/5', iconBg: 'bg-purple-500/20' },
  ],
  sales_manager: [
    { label: 'Pipeline Value', value: '$284K', change: '+14%', trend: 'up', gradient: 'from-emerald-500/15 via-green-500/10 to-teal-500/5', iconBg: 'bg-emerald-500/20' },
    { label: 'Team Leads', value: '34', change: '+8 today', trend: 'up', gradient: 'from-blue-500/15 via-indigo-500/10 to-violet-500/5', iconBg: 'bg-blue-500/20' },
    { label: 'Conversion Rate', value: '24%', change: '+3%', trend: 'up', gradient: 'from-amber-500/15 via-orange-500/10 to-red-500/5', iconBg: 'bg-amber-500/20' },
    { label: 'Urgency Score', value: '8.4', change: '+0.6', trend: 'up', gradient: 'from-purple-500/15 via-violet-500/10 to-indigo-500/5', iconBg: 'bg-purple-500/20' },
  ],
  sales: [
    { label: 'Hot Opportunities', value: '7', change: '3 urgent', trend: 'up', gradient: 'from-orange-500/15 via-amber-500/10 to-yellow-500/5', iconBg: 'bg-orange-500/20' },
    { label: 'Buying Intel', value: '12', change: '5 new signals', trend: 'up', gradient: 'from-sky-500/15 via-blue-500/10 to-indigo-500/5', iconBg: 'bg-sky-500/20' },
    { label: 'Threats', value: '3', change: '1 critical', trend: 'down', gradient: 'from-red-500/15 via-rose-500/10 to-pink-500/5', iconBg: 'bg-red-500/20' },
    { label: 'Urgency Score', value: '8.1', change: '+1.2 today', trend: 'up', gradient: 'from-fuchsia-500/15 via-purple-500/10 to-violet-500/5', iconBg: 'bg-fuchsia-500/20' },
  ],
  service: [
    { label: 'Active Campaigns', value: '4', change: '+1 today', trend: 'up', gradient: 'from-teal-500/15 via-cyan-500/10 to-sky-500/5', iconBg: 'bg-teal-500/20' },
    { label: 'Messages Sent', value: '1,247', change: '+89 today', trend: 'up', gradient: 'from-blue-500/15 via-indigo-500/10 to-violet-500/5', iconBg: 'bg-blue-500/20' },
    { label: 'Appointments', value: '23', change: '+5 booked', trend: 'up', gradient: 'from-green-500/15 via-emerald-500/10 to-teal-500/5', iconBg: 'bg-green-500/20' },
    { label: 'Upsell Rate', value: '18%', change: '+2%', trend: 'up', gradient: 'from-purple-500/15 via-violet-500/10 to-indigo-500/5', iconBg: 'bg-purple-500/20' },
  ],
  marketing: [
    { label: 'Campaign Perf', value: '87%', change: '+4%', trend: 'up', gradient: 'from-pink-500/15 via-rose-500/10 to-red-500/5', iconBg: 'bg-pink-500/20' },
    { label: 'Leads Generated', value: '156', change: '+23 today', trend: 'up', gradient: 'from-blue-500/15 via-indigo-500/10 to-violet-500/5', iconBg: 'bg-blue-500/20' },
    { label: 'Widget Clicks', value: '3,412', change: '+12%', trend: 'up', gradient: 'from-amber-500/15 via-orange-500/10 to-red-500/5', iconBg: 'bg-amber-500/20' },
    { label: 'Landing Visits', value: '8,901', change: '+18%', trend: 'up', gradient: 'from-fuchsia-500/15 via-purple-500/10 to-violet-500/5', iconBg: 'bg-fuchsia-500/20' },
  ],
};

/** Decorative SVG icons shown inside each metric tile's icon badge (folder, users, lightning, chart) */
const tileIcons = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>,
];

/**
 * metricDetails — Drill-down data for each metric tile.
 * Clicking a tile opens a Dialog showing breakdown rows and key insights.
 * Each entry is keyed by the metric label string from roleMetrics.
 * PRODUCTION NOTE: This data will come from the analytics engine; currently hardcoded with realistic dealership data.
 */
const metricDetails: Record<string, { breakdown: { label: string; value: string; detail?: string }[]; description: string; highlights?: string[] }> = {
  'Pipeline Value': { description: 'Pipeline Health Score — Win Rate × 50pts + Active Pipeline Quality × 30pts + Pipeline Freshness × 20pts', breakdown: [
    { label: 'Win Rate (SOLD/SOLD+LOST)', value: '18.5%', detail: '74 SOLD / 326 LOST in last 90 days' },
    { label: 'Active Pipeline Quality (1 - BAD/Total)', value: '91.3%', detail: '87% leads non-BAD across 842 total' },
    { label: 'Pipeline Freshness (<30d)', value: '64%', detail: '158 of 247 active leads are under 30 days' },
    { label: 'Composite Score', value: '72/100' },
  ], highlights: ['Win rate up 2.3% from last month', '31 stale leads (>30d) need attention', 'Fresh lead ratio improving week-over-week'] },
  'Lead Source': { description: 'Lead Source Performance — Top Sources Win Rate × 40pts + Diversity × 30pts + Concentration Risk × 30pts', breakdown: [
    { label: 'AutoTrader.com', value: '24% win rate', detail: '142 leads, 34 SOLD, 12 BAD' },
    { label: 'Website (Organic)', value: '19% win rate', detail: '98 leads, 19 SOLD, 8 BAD' },
    { label: 'Cars.com', value: '16% win rate', detail: '87 leads, 14 SOLD, 11 BAD' },
    { label: 'Facebook Ads', value: '12% win rate', detail: '64 leads, 8 SOLD, 9 BAD' },
    { label: 'Walk-In (No Source)', value: '31% win rate', detail: '52 leads, 16 SOLD, 2 BAD' },
    { label: 'Source Diversity Score', value: '7/10 sources active' },
    { label: 'Concentration Risk', value: '34% (AutoTrader)' },
  ], highlights: ['Walk-ins have highest conversion but lowest volume', 'Facebook BAD rate (14%) needs investigation', 'Consider increasing referral marketing (32% win rate, only 4% volume)'] },
  'Lead Quality': { description: 'Lead Quality Score — (1 - BAD Rate) × 40pts + Trade-In Penetration × 30pts + In-Stock Match × 30pts', breakdown: [
    { label: 'BAD Lead Rate', value: '8.7%', detail: '73 BAD of 842 total leads' },
    { label: 'Top BAD Reasons', value: '' },
    { label: '  BAD_DUPLICATE', value: '28 leads (38%)' },
    { label: '  BAD_NO_VALID_CONTACT', value: '19 leads (26%)' },
    { label: '  BAD_WRONG_DEALER', value: '14 leads (19%)' },
    { label: 'Trade-In Penetration', value: '23%', detail: '57 of 247 active leads have trade-ins' },
    { label: 'In-Stock Match (VIN populated)', value: '41%', detail: '101 leads matched to inventory' },
  ], highlights: ['Duplicate detection could reduce BAD rate by 3.3%', 'Trade-in leads close at 35% (vs 18% overall)', 'In-stock matches close 2.1x faster'] },
  'Demand Score': { description: 'Market Demand — Demand Trend × 50pts + New/Used Balance × 25pts + Make Diversity × 25pts', breakdown: [
    { label: '30-Day Lead Growth', value: '+14%', detail: '478 leads this month vs 419 last month' },
    { label: 'New vs Used Split', value: '62% New / 38% Used' },
    { label: 'Top Makes in Demand', value: '' },
    { label: '  Honda', value: '23% of inquiries', detail: '89 leads, top model: CR-V' },
    { label: '  Toyota', value: '19% of inquiries', detail: '74 leads, top model: Camry' },
    { label: '  Ford', value: '15% of inquiries', detail: '58 leads, top model: F-150' },
    { label: 'Price Range: $30K-$45K', value: '54% of inquiries' },
  ], highlights: ['SUV demand up 22% month-over-month', 'Used vehicle inquiries trending up (was 32% → now 38%)', 'Luxury segment ($60K+) growing: 47 leads (+18%)'] },
  'Partner Orgs': { description: 'Total organizations under your partner group', breakdown: [
    { label: 'Serra Automotive Group', value: '5 stores', detail: '3 active, 2 onboarding' },
    { label: 'Hyundai of Columbia', value: '2 stores', detail: 'Both fully active' },
    { label: 'Metro Honda Alliance', value: '3 stores', detail: '2 active, 1 trial' },
    { label: 'Pinnacle Motors', value: '2 stores', detail: 'Both in trial period' },
    { label: 'Total Active Users', value: '147 across all orgs' },
    { label: 'Avg Monthly Logins', value: '1,847' },
  ], highlights: ['2 new orgs onboarded this month', 'Serra group has highest engagement (89% weekly active)', 'Pinnacle trial conversion likely (85% feature adoption)'] },
  'Total Logins': { description: 'User login activity across all organizations', breakdown: [
    { label: 'Daily Active Users', value: '89', detail: '61% of total user base' },
    { label: 'Weekly Active Users', value: '124', detail: '84% of total user base' },
    { label: 'Peak Login Hour', value: '9:00-10:00 AM', detail: 'Avg 34 concurrent users' },
    { label: 'Mobile Logins', value: '38%', detail: '702 of 1,847 total logins' },
    { label: 'Desktop Logins', value: '62%', detail: '1,145 of 1,847 total logins' },
  ], highlights: ['Login rate up 18% month-over-month', 'Mobile usage growing (was 31% last month)', 'Monday has highest login activity (avg 312)'] },
  'Platform Actions': { description: 'Total actions performed across the platform', breakdown: [
    { label: 'Chat Messages Sent', value: '8,412', detail: '346 unique conversations' },
    { label: 'Reports Generated', value: '1,284', detail: '214 unique report types' },
    { label: 'Agent Interactions', value: '5,891', detail: 'Across 12 active agents' },
    { label: 'File Uploads', value: '892' },
    { label: 'Calendar Events Created', value: '2,341' },
    { label: 'Settings Changes', value: '156' },
  ], highlights: ['Chat usage up 22% from last month', 'Report generation doubled since onboarding', 'Peak activity: Tuesday-Thursday'] },
  'Agent Actions': { description: 'Actions performed by AI agents', breakdown: [
    { label: 'Lead Follow-ups Sent', value: '3,247', detail: '38.6% auto-approved by managers' },
    { label: 'Appointment Reminders', value: '1,892', detail: '92% delivery rate' },
    { label: 'Lead Scoring Updates', value: '1,456', detail: 'Avg 17 rescores per lead' },
    { label: 'Alert Notifications', value: '891', detail: '67% acted upon within 2 hours' },
    { label: 'Report Summaries', value: '426', detail: 'Daily digest for 89 users' },
  ], highlights: ['Agent efficiency up 22% this month', 'Follow-up automation saving est. 14 hrs/week', 'Lead scoring accuracy: 87% (validated against outcomes)'] },
  'Sub Orgs': { description: 'Organizations under your partner administration', breakdown: [
    { label: 'Active Organizations', value: '5', detail: 'All with live data connections' },
    { label: 'Trial Organizations', value: '1', detail: 'Metro Honda - Day 12 of 30' },
    { label: 'Total Users Across Orgs', value: '89' },
    { label: 'Avg Leads/Org/Month', value: '142' },
    { label: 'Top Performing Org', value: 'Serra Downtown', detail: '24% win rate' },
  ], highlights: ['All active orgs renewed last quarter', 'Metro Honda trial trending toward conversion', 'Consider expanding to 2 pending partner inquiries'] },
  'User Actions': { description: 'User engagement across your partner organizations', breakdown: [
    { label: 'Chat Conversations', value: '2,104', detail: '24 avg per user this month' },
    { label: 'Reports Viewed', value: '891', detail: 'Most popular: Pipeline Velocity' },
    { label: 'Agent Configs Modified', value: '234' },
    { label: 'Leads Contacted via Platform', value: '1,456' },
    { label: 'Dashboard Views', value: '3,892' },
  ], highlights: ['Engagement up 7% from last month', 'Report usage correlates with higher close rates', 'Users avg 3.2 sessions per day'] },
  'Hot Opportunities': { description: 'Hot Opportunities Score — Hot Leads Awaiting Contact × 40pts + Showroom Today × 30pts + Fresh Trade-Ins × 30pts', breakdown: [
    { label: 'Hot Leads Needing Contact', value: '7 leads', detail: 'Oldest: 8 hours ago (Mark S. - 2024 CR-V)' },
    { label: 'Showroom Visitors Now', value: '3 customers', detail: 'Bay 2: James R. (F-150), Bay 5: Lisa M. (Accord), Bay 7: David K. (Tucson)' },
    { label: 'Fresh Trade-In Leads (<24h)', value: '4 leads', detail: 'Avg trade value: $18,500' },
    { label: 'Highest Value Opportunity', value: '$62,400 MSRP', detail: 'Robert T. - 2024 BMW X5 - HOT, showroom today' },
  ], highlights: ['3 hot leads have been waiting >6 hours — contact NOW', 'Showroom visitors convert at 41% vs 18% overall', 'Trade-in leads expire after 14 days (35% → 12% win rate)'] },
  'Buying Intel': { description: 'What Customers Are Buying — Model Concentration × 50pts + New/Used Clarity × 30pts + Price Clarity × 20pts', breakdown: [
    { label: 'Top Selling Models This Month', value: '' },
    { label: '  1. Honda CR-V', value: '23 inquiries, 8 sold', detail: 'Avg selling price: $34,200' },
    { label: '  2. Toyota Camry', value: '18 inquiries, 5 sold', detail: 'Avg selling price: $28,900' },
    { label: '  3. Ford F-150', value: '15 inquiries, 6 sold', detail: 'Avg selling price: $48,700' },
    { label: '  4. Hyundai Tucson', value: '12 inquiries, 4 sold' },
    { label: '  5. Honda Civic', value: '10 inquiries, 3 sold' },
    { label: 'New vs Used Split', value: '68% NEW, 32% USED', detail: 'Trending toward NEW (was 62/38)' },
    { label: 'Hot Price Range', value: '$30K-$45K (62%)' },
  ], highlights: ['SUV demand surging — CR-V + Tucson up 31% combined', 'F-150 has highest gross per unit ($4,200 avg front)', 'Budget segment ($0-$25K) shrinking: down 8% this month'] },
  'Threats': { description: 'Competitive Threat Alert — (1 - Lost Elsewhere Rate) × 50pts + (1 - Loss Growth) × 30pts + (1 - Waiting Ratio) × 20pts', breakdown: [
    { label: 'Lost to Competitors', value: '18 leads', detail: 'LOST_PURCHASED_DIFFERENT_BRAND up 25% vs last month' },
    { label: 'Lost - No Agreement', value: '12 leads', detail: 'Primarily pricing issues ($2K avg gap)' },
    { label: 'Lost - No Response', value: '8 leads', detail: 'We were too slow — avg 18hr response time' },
    { label: 'Ghosting Rate', value: '23 leads', detail: 'In WAITING status >7 days, gone cold' },
    { label: 'Internet Lead Loss Rate', value: '35%', detail: 'vs 18% walk-in loss rate — digital follow-up failing' },
  ], highlights: ['Premier Motors pricing 8% below on sedans — losing deals', 'Response time >4hrs kills 60% of internet leads', '23 ghosted leads could be re-engaged with price drop offer'] },
  'Urgency Score': { description: 'Pipeline Urgency — (1 - Overdue New Ratio) × 40pts + (1 - Stale Active Ratio) × 35pts + (1 - Cooling Hot Ratio) × 25pts', breakdown: [
    { label: 'URGENT - Need Contact NOW', value: '' },
    { label: '  NEW leads >24 hours', value: '7 leads', detail: 'Losing 5% close probability per hour' },
    { label: '  HOT leads >48 hours', value: '3 leads', detail: 'No longer hot — cooling rapidly' },
    { label: 'WARNING - Stale Deals', value: '' },
    { label: '  ACTIVE >14 days, no update', value: '18 leads', detail: 'Dying on the vine' },
    { label: '  ACTIVE >30 days', value: '12 leads', detail: '89% will statistically be lost' },
    { label: 'Pipeline Aging Trend', value: '+3.2 days faster than last month' },
  ], highlights: ['7 NEW leads need immediate contact (6+ hours overdue)', '3 hot leads cooling — win rate drops from 41% to 12% after 48h', '12 leads >30 days old should be triaged: save or archive'] },
};

/**
 * ThinkingCard — Expandable card showing AI reasoning steps.
 * Appears below bot messages that include a `thinking` property.
 * Shows a summary line with Brain icon; click to expand and see detailed reasoning steps.
 */
function ThinkingCard({ thinking }: { thinking: ChatMessage['thinking'] }) {
  const [expanded, setExpanded] = useState(false);
  if (!thinking) return null;

  return (
    <div className="mt-2 rounded-lg border border-purple-500/20 bg-purple-500/5 overflow-hidden" data-testid="thinking-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors"
        data-testid="button-toggle-thinking"
      >
        <Brain className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="font-medium flex-1 text-left">{thinking.summary}</span>
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {expanded && (
        <div className="px-3 pb-2.5 space-y-1 border-t border-purple-500/10">
          {thinking.details.map((detail, i) => (
            <div key={i} className="flex items-start gap-2 pt-1.5">
              <div className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground leading-relaxed">{detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * MainPage — Primary chat interface component.
 * Uses personaName from AppContext to label the AI persona in responses.
 * The wave-dot animation (3 bouncing dots) displays while AI is "typing".
 */
export default function MainPage() {
  const { currentRole, personaName, currentUser } = useApp();
  const { user: authUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<typeof roleMetrics.org_admin[0] | null>(null);
  const [tilesCollapsed, setTilesCollapsed] = useState(false);
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const metrics = roleMetrics[currentRole] || roleMetrics.org_admin;

  const { data: existingConversations } = useQuery<DbConversation[]>({
    queryKey: ['/api/conversations?channel=ai-chat'],
    enabled: !!authUser,
  });

  const findOrCreateConversation = useCallback(async () => {
    if (!authUser || initialized) return;

    const userEmail = authUser.email;
    const match = existingConversations?.find(
      (c) => c.customerEmail === userEmail && c.channel === 'ai-chat'
    );

    if (match) {
      setConversationId(match.id);
      setInitialized(true);
    } else if (existingConversations !== undefined) {
      try {
        const res = await apiRequest('POST', '/api/conversations', {
          customerName: `${authUser.firstName} ${authUser.lastName}`,
          customerEmail: userEmail,
          channel: 'ai-chat',
          status: 'open',
        });
        const newConv: DbConversation = await res.json();
        setConversationId(newConv.id);

        const greeting = `Hello! I'm ${personaName}, your AI assistant for Nexxus Connect. How can I help you today?`;
        await apiRequest('POST', `/api/conversations/${newConv.id}/messages`, {
          role: 'assistant',
          content: greeting,
          senderName: personaName,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/conversations?channel=ai-chat'] });
        setInitialized(true);
      } catch (err) {
        console.error('Failed to create main chat conversation:', err);
      }
    }
  }, [authUser, existingConversations, initialized, personaName]);

  useEffect(() => {
    findOrCreateConversation();
  }, [findOrCreateConversation]);

  const { data: dbMessages } = useQuery<DbMessage[]>({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (dbMessages && dbMessages.length > 0) {
      const mapped: ChatMessage[] = dbMessages.map((m) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
      }));
      setMessages(mapped);
      if (mapped.some((m) => m.role === 'user')) {
        setHasSentMessage(true);
        setTilesCollapsed(true);
      }
    } else if (dbMessages && dbMessages.length === 0 && conversationId && !initialized) {
    } else if (!conversationId && !authUser) {
      const greeting: ChatMessage = {
        id: 'greeting',
        role: 'assistant',
        content: `Hello! I'm ${personaName}, your AI assistant for Nexxus Connect. How can I help you today?`,
        timestamp: new Date().toISOString(),
      };
      setMessages([greeting]);
    }
  }, [dbMessages, conversationId, personaName, authUser]);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { role: string; content: string; senderName?: string }) => {
      if (!conversationId) throw new Error('No conversation');
      const res = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const content = inputValue.trim();
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    if (!hasSentMessage) {
      setHasSentMessage(true);
      setTilesCollapsed(true);
    }

    if (conversationId) {
      try {
        await sendMessageMutation.mutateAsync({
          role: 'user',
          content,
          senderName: currentUser.name,
        });
      } catch (err) {
        console.error('Failed to save user message:', err);
      }
    }

    setTimeout(async () => {
      const assistantContent = `I understand your request. Let me help you with that. This is the main chat interface where you can interact with ${personaName} for any task. Would you like me to analyze data, review your pipeline, or assist with something else?`;
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);

      if (conversationId) {
        try {
          await sendMessageMutation.mutateAsync({
            role: 'assistant',
            content: assistantContent,
            senderName: personaName,
          });
        } catch (err) {
          console.error('Failed to save assistant message:', err);
        }
      }
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-border flex-shrink-0">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-between py-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider" data-testid="text-ai-key-metrics-title">AI Key Metrics</h2>
              {hasSentMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => setTilesCollapsed(!tilesCollapsed)}
                  data-testid="button-toggle-metrics"
                >
                  {tilesCollapsed ? (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Show
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Hide
                    </>
                  )}
                </Button>
              )}
            </div>
            <div
              className={cn(
                'overflow-hidden transition-all duration-500 ease-in-out',
                tilesCollapsed ? 'max-h-0 opacity-0 pb-0' : 'max-h-[500px] opacity-100 pb-4'
              )}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {metrics.map((metric, i) => (
                <div
                  key={i}
                  className={cn(
                    'relative rounded-xl border border-border bg-gradient-to-br cursor-pointer hover-elevate group',
                    metric.gradient
                  )}
                  onClick={() => setSelectedMetric(metric)}
                  data-testid={`metric-tile-${i}`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.07] -mr-4 -mt-4">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground" />
                      <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground" />
                      <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="1" className="text-foreground" />
                    </svg>
                  </div>
                  <div className="relative p-4 flex items-start gap-3">
                    <div className={cn('flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-foreground/70', metric.iconBg)}>
                      {tileIcons[i]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium truncate">{metric.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-0.5 tracking-tight">{metric.value}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {metric.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {metric.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                        <span className={cn(
                          'text-[11px] font-medium',
                          metric.trend === 'up' && 'text-green-600 dark:text-green-400',
                          metric.trend === 'down' && 'text-red-600 dark:text-red-400',
                          metric.trend === 'neutral' && 'text-muted-foreground'
                        )}>
                          {metric.change}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollRef}>
          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
                data-testid={`main-chat-message-${message.id}`}
              >
                <div
                  className={cn(
                    'density-chat rounded-2xl px-5 py-4 max-w-[80%]',
                    message.role === 'assistant'
                      ? 'bg-card border border-border'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  {message.thinking && <ThinkingCard thinking={message.thinking} />}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl px-5 py-4">
                  <div className="flex gap-1 items-center h-5">
                    <span className="wave-dot" />
                    <span className="wave-dot" style={{ animationDelay: '0.15s' }} />
                    <span className="wave-dot" style={{ animationDelay: '0.3s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="px-4 md:px-6 pb-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[11px] text-muted-foreground font-medium">Try asking...</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {agentSuggestions.map((suggestion, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-7 rounded-full px-3"
                  onClick={() => {
                    setInputValue(suggestion);
                    inputRef.current?.focus();
                  }}
                  data-testid={`main-suggestion-${i}`}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-border">
          <div className="max-w-3xl mx-auto">
            <div className="chat-input-gradient rounded-2xl p-[3px] shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <div className="bg-background rounded-[14px] flex items-end gap-2 p-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 flex-shrink-0 rounded-full"
                      data-testid="button-main-chat-add"
                    >
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top" className="w-48">
                    <DropdownMenuItem data-testid="menu-item-upload-file">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </DropdownMenuItem>
                    <DropdownMenuItem data-testid="menu-item-add-document">
                      <FileText className="h-4 w-4 mr-2" />
                      Add Document
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about your business"
                  className="flex-1 bg-transparent resize-none outline-none text-sm min-h-[28px] max-h-40 py-1.5"
                  rows={1}
                  data-testid="input-main-chat"
                />
                <Button
                  size="icon"
                  className="h-9 w-9 flex-shrink-0 rounded-full"
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  data-testid="button-main-send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedMetric} onOpenChange={(open) => !open && setSelectedMetric(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto" data-testid="dialog-metric-detail">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" data-testid="text-metric-detail-title">
              {selectedMetric && (
                <>
                  {selectedMetric.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
                  {selectedMetric.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
                  {selectedMetric.label}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedMetric && (metricDetails[selectedMetric.label]?.description || 'Detailed breakdown of this metric')}
            </DialogDescription>
          </DialogHeader>
          {selectedMetric && (
            <div className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-foreground" data-testid="text-metric-detail-value">{selectedMetric.value}</span>
                <span className={cn(
                  'text-sm font-medium',
                  selectedMetric.trend === 'up' && 'text-green-600 dark:text-green-400',
                  selectedMetric.trend === 'down' && 'text-red-600 dark:text-red-400',
                  selectedMetric.trend === 'neutral' && 'text-muted-foreground'
                )}>
                  {selectedMetric.change}
                </span>
              </div>
              <div className="border-t border-border pt-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Breakdown</h4>
                <div className="space-y-1">
                  {(metricDetails[selectedMetric.label]?.breakdown || []).map((item, idx) => (
                    <div key={idx} className="py-1.5 px-2 rounded-md hover:bg-muted/50" data-testid={`metric-breakdown-${idx}`}>
                      <div className="flex items-center justify-between">
                        <span className={cn('text-sm', item.label.startsWith('  ') ? 'text-foreground pl-3' : 'text-muted-foreground font-medium')}>{item.label}</span>
                        {item.value && <span className="text-sm font-semibold text-foreground">{item.value}</span>}
                      </div>
                      {item.detail && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 pl-0">{item.detail}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {metricDetails[selectedMetric.label]?.highlights && (
                <div className="border-t border-border pt-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Key Insights</h4>
                  <div className="space-y-1.5">
                    {metricDetails[selectedMetric.label]!.highlights!.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <span className="text-xs text-foreground leading-relaxed">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
