'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { SubscriptionService } from '@/lib/subscription-service';
import { UpgradeDialog } from '@/components/subscription/upgrade-dialog';
import { Project, Task, ProjectMember, SubscriptionTier } from '@/lib/types';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users,
  Target,
  Activity,
  Calendar,
  Zap,
  AlertTriangle,
  Crown
} from 'lucide-react';

interface AdvancedAnalyticsProps {
  project: Project;
  tasks: Task[];
  members: ProjectMember[];
  activities?: any[];
}

interface TeamPerformanceMetrics {
  memberId: string;
  memberName: string;
  tasksCompleted: number;
  tasksInProgress: number;
  averageTaskDuration: number;
  contributionScore: number;
  lastActive: Date;
}

interface ProjectInsights {
  velocityTrend: 'increasing' | 'decreasing' | 'stable';
  bottlenecks: string[];
  riskFactors: string[];
  recommendations: string[];
  completionPrediction: Date;
  efficiencyScore: number;
}

export function AdvancedAnalytics({ project, tasks, members, activities = [] }: AdvancedAnalyticsProps) {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [teamMetrics, setTeamMetrics] = useState<TeamPerformanceMetrics[]>([]);
  const [insights, setInsights] = useState<ProjectInsights | null>(null);

  const hasAdvancedAnalytics = user ? SubscriptionService.hasAdvancedAnalytics(user.subscriptionTier as SubscriptionTier) : false;

  useEffect(() => {
    if (hasAdvancedAnalytics) {
      calculateTeamMetrics();
      generateInsights();
    }
  }, [tasks, members, timeRange, hasAdvancedAnalytics]);

  const calculateTeamMetrics = () => {
    const metrics: TeamPerformanceMetrics[] = members.map(member => {
      const memberTasks = tasks.filter(task => task.assigned_to === member.user_id);
      const completedTasks = memberTasks.filter(task => task.status === 'Done');
      const inProgressTasks = memberTasks.filter(task => task.status === 'InProgress');
      
      // Calculate average task duration (mock calculation)
      const avgDuration = completedTasks.length > 0 ? 
        completedTasks.reduce((sum, task) => {
          // Mock duration calculation based on task complexity
          const complexity = task.effort === 'High' ? 8 : task.effort === 'Medium' ? 4 : 2;
          return sum + complexity;
        }, 0) / completedTasks.length : 0;

      // Calculate contribution score based on tasks completed and complexity
      const contributionScore = completedTasks.reduce((score, task) => {
        const complexityMultiplier = task.effort === 'High' ? 3 : task.effort === 'Medium' ? 2 : 1;
        const priorityMultiplier = task.priority === 'Critical' ? 2 : task.priority === 'High' ? 1.5 : 1;
        return score + (complexityMultiplier * priorityMultiplier);
      }, 0);

      return {
        memberId: member.user_id,
        memberName: member.name || 'Unknown Member',
        tasksCompleted: completedTasks.length,
        tasksInProgress: inProgressTasks.length,
        averageTaskDuration: avgDuration,
        contributionScore,
        lastActive: new Date(), // Mock - would come from activity data
      };
    });

    setTeamMetrics(metrics);
  };

  const generateInsights = () => {
    const completedTasks = tasks.filter(task => task.status === 'Done');
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? completedTasks.length / totalTasks : 0;

    // Mock velocity trend calculation
    const velocityTrend: ProjectInsights['velocityTrend'] = 
      completionRate > 0.7 ? 'increasing' : 
      completionRate < 0.3 ? 'decreasing' : 'stable';

    // Identify bottlenecks
    const bottlenecks: string[] = [];
    const inProgressTasks = tasks.filter(task => task.status === 'InProgress');
    if (inProgressTasks.length > totalTasks * 0.5) {
      bottlenecks.push('Too many tasks in progress - consider focusing on completion');
    }
    
    const unassignedTasks = tasks.filter(task => !task.assigned_to);
    if (unassignedTasks.length > 0) {
      bottlenecks.push(`${unassignedTasks.length} unassigned tasks blocking progress`);
    }

    // Risk factors
    const riskFactors: string[] = [];
    const highPriorityTasks = tasks.filter(task => task.priority === 'Critical' || task.priority === 'High');
    const completedHighPriority = highPriorityTasks.filter(task => task.status === 'Done');
    
    if (highPriorityTasks.length > 0 && completedHighPriority.length / highPriorityTasks.length < 0.5) {
      riskFactors.push('High priority tasks are behind schedule');
    }

    if (members.length < 2) {
      riskFactors.push('Single point of failure - consider adding team members');
    }

    // Recommendations
    const recommendations: string[] = [];
    if (completionRate < 0.5) {
      recommendations.push('Focus on completing existing tasks before adding new ones');
    }
    if (bottlenecks.length > 0) {
      recommendations.push('Address identified bottlenecks to improve team velocity');
    }
    if (unassignedTasks.length > 0) {
      recommendations.push('Assign ownership to all tasks for better accountability');
    }

    // Mock completion prediction
    const daysRemaining = project.duration === '24h' ? 1 : 2;
    const completionPrediction = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);

    // Efficiency score (0-100)
    const efficiencyScore = Math.round(completionRate * 100);

    setInsights({
      velocityTrend,
      bottlenecks,
      riskFactors,
      recommendations,
      completionPrediction,
      efficiencyScore
    });
  };

  const getVelocityIcon = (trend: ProjectInsights['velocityTrend']) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <Activity className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!hasAdvancedAnalytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Analytics
            <Badge variant="secondary">Pro Feature</Badge>
          </CardTitle>
          <CardDescription>
            Get detailed insights into team performance and project health
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Unlock Advanced Analytics</h3>
          <p className="text-muted-foreground mb-4">
            Get detailed team performance metrics, bottleneck analysis, and AI-powered recommendations
          </p>
          <UpgradeDialog 
            reason="Access advanced analytics and insights"
            requiredFeature="Advanced Analytics"
          >
            <Button>
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          </UpgradeDialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">Deep insights into your project performance</p>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getEfficiencyColor(insights?.efficiencyScore || 0)}`}>
                  {insights?.efficiencyScore || 0}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {insights?.velocityTrend === 'increasing' ? 'Improving' : 
                   insights?.velocityTrend === 'decreasing' ? 'Declining' : 'Stable'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Team Velocity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">
                    {tasks.filter(t => t.status === 'Done').length}
                  </div>
                  {insights && getVelocityIcon(insights.velocityTrend)}
                </div>
                <div className="text-xs text-muted-foreground">Tasks completed</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Bottlenecks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {insights?.bottlenecks.length || 0}
                </div>
                <div className="text-xs text-muted-foreground">Issues identified</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-red-600">
                    {insights?.riskFactors.length || 0}
                  </div>
                  {(insights?.riskFactors.length || 0) > 0 && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Risk factors</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Project Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Task Completion</span>
                  <span className="font-medium">
                    {tasks.filter(t => t.status === 'Done').length}/{tasks.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Team Utilization</span>
                  <span className="font-medium">
                    {Math.round((tasks.filter(t => t.assigned_to).length / Math.max(tasks.length, 1)) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">High Priority Progress</span>
                  <span className="font-medium">
                    {tasks.filter(t => (t.priority === 'High' || t.priority === 'Critical') && t.status === 'Done').length}/
                    {tasks.filter(t => t.priority === 'High' || t.priority === 'Critical').length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Project Duration</span>
                  <span className="font-medium">{project.duration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Time Elapsed</span>
                  <span className="font-medium">
                    {Math.round((new Date().getTime() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60))}h
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Estimated Completion</span>
                  <span className="font-medium">
                    {insights?.completionPrediction.toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Performance Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Performance Metrics
              </CardTitle>
              <CardDescription>
                Individual contribution analysis and performance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMetrics.map((metric) => (
                  <div key={metric.memberId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {(metric.memberName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{metric.memberName || 'Unknown Member'}</p>
                        <p className="text-sm text-muted-foreground">
                          {metric.tasksCompleted} completed • {metric.tasksInProgress} in progress
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {Math.round(metric.contributionScore)}
                      </div>
                      <div className="text-xs text-muted-foreground">Contribution Score</div>
                    </div>
                  </div>
                ))}
                {teamMetrics.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No team performance data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Bottlenecks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Identified Bottlenecks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights?.bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">{bottleneck}</p>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">No bottlenecks identified</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Risk Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights?.riskFactors.map((risk, index) => (
                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{risk}</p>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">No risk factors identified</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-500" />
                AI Recommendations
              </CardTitle>
              <CardDescription>
                Actionable suggestions to improve your project performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights?.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Zap className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-800">{recommendation}</p>
                  </div>
                )) || (
                  <p className="text-sm text-muted-foreground">No recommendations available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Project Predictions
              </CardTitle>
              <CardDescription>
                AI-powered forecasts based on current progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Predictive analytics coming soon</p>
                <p className="text-sm">Get completion forecasts and resource planning insights</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}