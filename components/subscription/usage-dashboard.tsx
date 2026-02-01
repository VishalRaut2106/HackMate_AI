'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { SubscriptionService, UsageTracker, UsageStats } from '@/lib/subscription-service';
import { UpgradeDialog } from './upgrade-dialog';
import { SubscriptionTier, UserType } from '@/lib/types';
import { 
  Zap, 
  FolderOpen, 
  Users, 
  FileText, 
  BarChart3, 
  Crown,
  TrendingUp,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export function UsageDashboard() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user) {
      // Check if usage should be reset
      if (UsageTracker.shouldResetUsage(user.uid)) {
        UsageTracker.resetMonthlyUsage(user.uid);
      }
      
      const currentUsage = UsageTracker.getUsage(user.uid);
      setUsage(currentUsage);
    }
  }, [user, refreshKey]);

  const refreshUsage = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!user || !usage) return null;

  const limits = SubscriptionService.getLimits(user.subscriptionTier as SubscriptionTier);
  const recommendedPlan = SubscriptionService.getUpgradeRecommendation(user.userType as any, user.subscriptionTier as any);

  const getUsageColor = (used: number, limit: number) => {
    if (limit === -1) return 'text-green-600'; // Unlimited
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (used: number, limit: number) => {
    if (limit === -1) return 'bg-green-500'; // Unlimited
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Unlimited' : limit.toLocaleString();
  };

  const isNearLimit = (used: number, limit: number) => {
    return limit !== -1 && (used / limit) >= 0.8;
  };

  const isAtLimit = (used: number, limit: number) => {
    return limit !== -1 && used >= limit;
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Current Plan
              </CardTitle>
              <CardDescription>
                Your subscription and usage overview
              </CardDescription>
            </div>
            <Badge variant={user.subscriptionTier === 'free' ? 'secondary' : 'default'}>
              {user.subscriptionTier === 'free' ? 'Free' : 'Pro'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {user.subscriptionTier.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-sm text-muted-foreground">Plan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {usage.projectsCreated}
              </div>
              <div className="text-sm text-muted-foreground">Projects Created</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {usage.aiCreditsUsed}
              </div>
              <div className="text-sm text-muted-foreground">AI Credits Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {typeof window !== 'undefined' ? 
                  Math.floor((new Date().getTime() - usage.lastResetDate.getTime()) / (1000 * 60 * 60 * 24)) : 
                  0
                }
              </div>
              <div className="text-sm text-muted-foreground">Days This Cycle</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Projects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderOpen className="h-4 w-4" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Used</span>
                <span className={`text-sm font-medium ${getUsageColor(usage.projectsCreated, limits.maxProjects)}`}>
                  {usage.projectsCreated} / {formatLimit(limits.maxProjects)}
                </span>
              </div>
              {limits.maxProjects !== -1 && (
                <Progress 
                  value={(usage.projectsCreated / limits.maxProjects) * 100} 
                  className="h-2"
                />
              )}
              {isAtLimit(usage.projectsCreated, limits.maxProjects) && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  Limit reached
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Credits */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4" />
              AI Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Used this month</span>
                <span className={`text-sm font-medium ${getUsageColor(usage.aiCreditsUsed, limits.aiCreditsPerMonth)}`}>
                  {usage.aiCreditsUsed} / {formatLimit(limits.aiCreditsPerMonth)}
                </span>
              </div>
              {limits.aiCreditsPerMonth !== -1 && limits.aiCreditsPerMonth > 0 && (
                <Progress 
                  value={(usage.aiCreditsUsed / limits.aiCreditsPerMonth) * 100} 
                  className="h-2"
                />
              )}
              {limits.aiCreditsPerMonth === 0 && (
                <div className="text-xs text-muted-foreground">
                  AI features not available on this plan
                </div>
              )}
              {isAtLimit(usage.aiCreditsUsed, limits.aiCreditsPerMonth) && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  Monthly limit reached
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Team Size */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Team Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Max allowed</span>
                <span className="text-sm font-medium">
                  {formatLimit(limits.maxTeamSize)} members
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Per project limit
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Features */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Export Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Available formats</span>
                <span className="text-sm font-medium">
                  {limits.exportFormats.length === 0 ? 'None' : limits.exportFormats.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {limits.exportFormats.length > 0 ? (
                  limits.exportFormats.map(format => (
                    <Badge key={format} variant="secondary" className="text-xs">
                      {format.toUpperCase()}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Export not available
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings and Recommendations */}
      {(isNearLimit(usage.projectsCreated, limits.maxProjects) || 
        isNearLimit(usage.aiCreditsUsed, limits.aiCreditsPerMonth) ||
        recommendedPlan) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <TrendingUp className="h-5 w-5" />
              Usage Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isNearLimit(usage.projectsCreated, limits.maxProjects) && (
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <AlertTriangle className="h-4 w-4" />
                You're approaching your project limit ({usage.projectsCreated}/{limits.maxProjects})
              </div>
            )}
            
            {isNearLimit(usage.aiCreditsUsed, limits.aiCreditsPerMonth) && (
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <AlertTriangle className="h-4 w-4" />
                You're running low on AI credits ({usage.aiCreditsUsed}/{limits.aiCreditsPerMonth})
              </div>
            )}

            {recommendedPlan && (
              <div className="pt-2">
                <p className="text-sm text-yellow-700 mb-3">
                  Consider upgrading to <strong>{recommendedPlan.name}</strong> for more features and higher limits.
                </p>
                <UpgradeDialog reason="Unlock more features and higher limits">
                  <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </Button>
                </UpgradeDialog>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Feature Access
          </CardTitle>
          <CardDescription>
            What's included in your current plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Advanced Analytics</span>
              {limits.advancedAnalytics ? (
                <Badge variant="default" className="text-xs">Included</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Not Available</Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Priority Support</span>
              {limits.prioritySupport ? (
                <Badge variant="default" className="text-xs">Included</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Community Only</Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Custom Branding</span>
              {limits.customBranding ? (
                <Badge variant="default" className="text-xs">Included</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Not Available</Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">API Access</span>
              {limits.apiAccess ? (
                <Badge variant="default" className="text-xs">Included</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Not Available</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Reset Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Billing Cycle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current cycle started:</span>
              <span>{typeof window !== 'undefined' ? usage.lastResetDate.toLocaleDateString() : 'Loading...'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Next reset:</span>
              <span>
                {typeof window !== 'undefined' ? 
                  new Date(usage.lastResetDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() :
                  'Loading...'
                }
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              AI credits and export limits reset monthly. Project limits are cumulative.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}