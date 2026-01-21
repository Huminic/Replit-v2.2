import { TrendingUp, TrendingDown, Minus, Target, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  mockMetrics, 
  mockGoals, 
  mockLeadsChart, 
  mockConversionsChart,
  mockAgentPerformance,
  getGoalStatusColor,
  getGoalProgress
} from '@/mocks/insights';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InsightsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">Insights</h1>
        <p className="text-sm text-muted-foreground">Track your performance and achieve your goals</p>
      </div>

      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 border-b border-border">
          <TabsList className="bg-transparent h-12 p-0">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none" data-testid="tab-insights-dashboard">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="goals" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none" data-testid="tab-insights-goals">
              Goals
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {mockMetrics.map((metric) => (
                  <Card key={metric.id} className="hover-elevate" data-testid={`metric-${metric.id}`}>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground font-medium">{metric.title}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{metric.value}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {metric.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                        {metric.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                        {metric.trend === 'neutral' && <Minus className="h-3 w-3 text-muted-foreground" />}
                        <span className={cn(
                          'text-xs',
                          metric.trend === 'up' && 'text-green-500',
                          metric.trend === 'down' && 'text-red-500',
                          metric.trend === 'neutral' && 'text-muted-foreground'
                        )}>
                          {metric.change > 0 ? '+' : ''}{metric.change}%
                        </span>
                        <span className="text-xs text-muted-foreground">{metric.changeLabel}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leads Chart */}
                <Card data-testid="chart-leads">
                  <CardHeader>
                    <CardTitle className="text-base">Leads This Week</CardTitle>
                    <CardDescription>Daily lead generation trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
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
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="hsl(var(--primary))" 
                            fillOpacity={1} 
                            fill="url(#leadGradient)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Conversions Chart */}
                <Card data-testid="chart-conversions">
                  <CardHeader>
                    <CardTitle className="text-base">Conversions This Week</CardTitle>
                    <CardDescription>Lead to sale conversions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mockConversionsChart}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="label" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Agent Performance */}
              <Card data-testid="chart-agent-performance">
                <CardHeader>
                  <CardTitle className="text-base">Agent Performance</CardTitle>
                  <CardDescription>Interactions by agent this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockAgentPerformance} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="date" type="category" width={120} className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="goals" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {mockGoals.map((goal) => {
                const progress = getGoalProgress(goal);
                const statusColor = getGoalStatusColor(goal.status);
                
                return (
                  <Card key={goal.id} className="hover-elevate" data-testid={`goal-${goal.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            goal.status === 'completed' && 'bg-green-100 dark:bg-green-900/30',
                            goal.status === 'on_track' && 'bg-blue-100 dark:bg-blue-900/30',
                            goal.status === 'at_risk' && 'bg-amber-100 dark:bg-amber-900/30',
                            goal.status === 'behind' && 'bg-red-100 dark:bg-red-900/30'
                          )}>
                            {goal.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                            {goal.status === 'on_track' && <Target className="h-5 w-5 text-blue-600" />}
                            {goal.status === 'at_risk' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                            {goal.status === 'behind' && <AlertCircle className="h-5 w-5 text-red-600" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{goal.title}</h3>
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className={cn('capitalize', statusColor)}>
                          {goal.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-foreground">
                            {goal.current} / {goal.target} {goal.unit}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{Math.round(progress)}% complete</span>
                          <span>Due {new Date(goal.dueDate).toLocaleDateString()}</span>
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
