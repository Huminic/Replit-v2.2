import { TrendingUp, TrendingDown, Minus, Target, CheckCircle, AlertTriangle, AlertCircle, PieChart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FavoritesBar } from '@/components/layout/FavoritesBar';
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
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Insights</h1>
          <p className="text-sm text-muted-foreground">Track your performance and achieve your goals</p>
        </div>
        <Button size="sm" data-testid="button-add-goal">
          <Plus className="h-4 w-4 mr-1" />
          New Goal
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 border-b border-border flex items-center">
          <TabsList className="bg-transparent h-10 p-0 flex-shrink-0">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none" data-testid="tab-insights-dashboard">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="goals" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none" data-testid="tab-insights-goals">
              Goals
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none" data-testid="tab-insights-reports">
              Reports
            </TabsTrigger>
          </TabsList>
          <FavoritesBar currentPath="/insights" currentLabel="Insights" />
        </div>

        <TabsContent value="dashboard" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                <Card data-testid="chart-conversions">
                  <CardHeader>
                    <CardTitle className="text-base">Conversions by Channel</CardTitle>
                    <CardDescription>This month's performance</CardDescription>
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

              <Card data-testid="agent-performance">
                <CardHeader>
                  <CardTitle className="text-base">Agent Performance</CardTitle>
                  <CardDescription>Interactions by agent this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAgentPerformance.map((agent, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{agent.date}</span>
                            <span className="text-sm text-muted-foreground">{agent.value} interactions</span>
                          </div>
                          <Progress value={Math.min(100, (agent.value / 250) * 100)} className="h-2" />
                        </div>
                      </div>
                    ))}
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
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {goal.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                          {goal.status === 'on_track' && <Target className="h-5 w-5 text-blue-500" />}
                          {goal.status === 'at_risk' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                          {goal.status === 'behind' && <AlertCircle className="h-5 w-5 text-red-500" />}
                          <div>
                            <h3 className="font-medium text-foreground">{goal.title}</h3>
                            <p className="text-sm text-muted-foreground">{goal.description}</p>
                          </div>
                        </div>
                        <Badge className={statusColor}>{goal.status.replace('_', ' ')}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{goal.current} / {goal.target} {goal.unit}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="reports" className="flex-1 m-0 overflow-hidden">
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <PieChart className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-foreground">Reports Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-1">
              Advanced analytics and custom reports are in development
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
