'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { SubscriptionService, SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/lib/subscription-service';
import { SubscriptionTier, UserType } from '@/lib/types';
import { 
  Crown, 
  Check, 
  Zap, 
  Users, 
  FileText, 
  BarChart3, 
  Shield, 
  Headphones,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface UpgradeDialogProps {
  children: React.ReactNode;
  reason?: string;
  requiredFeature?: string;
}

export function UpgradeDialog({ children, reason, requiredFeature }: UpgradeDialogProps) {
  const { user, upgradeSubscription } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  if (!user) return null;

  const availablePlans = SubscriptionService.getAvailablePlans(user.userType);
  const currentPlan = availablePlans.find(plan => plan.tier === user.subscriptionTier);
  const recommendedPlan = SubscriptionService.getUpgradeRecommendation(user.userType as any, user.subscriptionTier as any);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    setLoading(true);
    setSelectedTier(tier);

    try {
      await upgradeSubscription(tier);
      setOpen(false);
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setLoading(false);
      setSelectedTier(null);
    }
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('AI') || feature.includes('credits')) return <Zap className="h-4 w-4" />;
    if (feature.includes('team') || feature.includes('members')) return <Users className="h-4 w-4" />;
    if (feature.includes('export') || feature.includes('PDF')) return <FileText className="h-4 w-4" />;
    if (feature.includes('analytics')) return <BarChart3 className="h-4 w-4" />;
    if (feature.includes('support')) return <Headphones className="h-4 w-4" />;
    if (feature.includes('security') || feature.includes('SSO')) return <Shield className="h-4 w-4" />;
    return <Check className="h-4 w-4" />;
  };

  const PlanCard = ({ plan, isRecommended = false }: { plan: SubscriptionPlan; isRecommended?: boolean }) => {
    const isCurrentPlan = plan.tier === user.subscriptionTier;
    const price = billingPeriod === 'yearly' ? plan.price.yearly : plan.price.monthly;
    const savings = billingPeriod === 'yearly' ? Math.round(((plan.price.monthly * 12) - plan.price.yearly) / (plan.price.monthly * 12) * 100) : 0;

    return (
      <Card className={`relative ${isRecommended ? 'ring-2 ring-primary' : ''} ${isCurrentPlan ? 'opacity-60' : ''}`}>
        {isRecommended && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground">
              <Crown className="h-3 w-3 mr-1" />
              Recommended
            </Badge>
          </div>
        )}
        
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {plan.name}
            {isCurrentPlan && <Badge variant="secondary">Current</Badge>}
          </CardTitle>
          <CardDescription>{plan.description}</CardDescription>
          
          <div className="py-4">
            <div className="text-3xl font-bold">
              {SubscriptionService.formatPrice(price, billingPeriod)}
            </div>
            {billingPeriod === 'yearly' && savings > 0 && (
              <div className="text-sm text-green-600 font-medium">
                Save {savings}% annually
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                {getFeatureIcon(feature)}
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            className="w-full"
            variant={isCurrentPlan ? "secondary" : isRecommended ? "default" : "outline"}
            disabled={isCurrentPlan || loading}
            onClick={() => handleUpgrade(plan.tier)}
          >
            {loading && selectedTier === plan.tier ? (
              <>Upgrading...</>
            ) : isCurrentPlan ? (
              'Current Plan'
            ) : (
              <>
                Upgrade to {plan.name}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Upgrade Your Plan
          </DialogTitle>
          <DialogDescription>
            {reason || 'Unlock more features and capabilities with a premium plan'}
            {requiredFeature && (
              <div className="mt-2 p-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium text-primary">
                  Required: {requiredFeature}
                </p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-4">
            <Label htmlFor="billing-period" className={billingPeriod === 'monthly' ? 'font-medium' : 'text-muted-foreground'}>
              Monthly
            </Label>
            <Switch
              id="billing-period"
              checked={billingPeriod === 'yearly'}
              onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
            />
            <Label htmlFor="billing-period" className={billingPeriod === 'yearly' ? 'font-medium' : 'text-muted-foreground'}>
              Yearly
              <Badge variant="secondary" className="ml-2">Save up to 20%</Badge>
            </Label>
          </div>

          {/* Current Plan Info */}
          {currentPlan && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Current Plan: {currentPlan.name}</h4>
              <p className="text-sm text-muted-foreground">
                {SubscriptionService.formatPrice(
                  billingPeriod === 'yearly' ? currentPlan.price.yearly : currentPlan.price.monthly,
                  billingPeriod
                )}
              </p>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availablePlans
              .filter(plan => plan.tier !== user.subscriptionTier) // Hide current plan
              .map((plan) => (
                <PlanCard
                  key={plan.tier}
                  plan={plan}
                  isRecommended={plan.tier === recommendedPlan?.tier}
                />
              ))}
          </div>

          {/* Feature Comparison */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Feature Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border p-3 text-left">Feature</th>
                    {availablePlans.map(plan => (
                      <th key={plan.tier} className="border border-border p-3 text-center">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border p-3 font-medium">Projects</td>
                    {availablePlans.map(plan => {
                      const limits = SubscriptionService.getLimits(plan.tier);
                      return (
                        <td key={plan.tier} className="border border-border p-3 text-center">
                          {limits.maxProjects === -1 ? 'Unlimited' : limits.maxProjects}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="border border-border p-3 font-medium">Team Size</td>
                    {availablePlans.map(plan => {
                      const limits = SubscriptionService.getLimits(plan.tier);
                      return (
                        <td key={plan.tier} className="border border-border p-3 text-center">
                          {limits.maxTeamSize === -1 ? 'Unlimited' : `Up to ${limits.maxTeamSize}`}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="border border-border p-3 font-medium">AI Credits/Month</td>
                    {availablePlans.map(plan => {
                      const limits = SubscriptionService.getLimits(plan.tier);
                      return (
                        <td key={plan.tier} className="border border-border p-3 text-center">
                          {limits.aiCreditsPerMonth === 0 ? 'None' : 
                           limits.aiCreditsPerMonth === -1 ? 'Unlimited' : 
                           limits.aiCreditsPerMonth.toLocaleString()}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="border border-border p-3 font-medium">Export Formats</td>
                    {availablePlans.map(plan => {
                      const limits = SubscriptionService.getLimits(plan.tier);
                      return (
                        <td key={plan.tier} className="border border-border p-3 text-center">
                          {limits.exportFormats.length === 0 ? 'None' : limits.exportFormats.join(', ').toUpperCase()}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="border border-border p-3 font-medium">Advanced Analytics</td>
                    {availablePlans.map(plan => {
                      const limits = SubscriptionService.getLimits(plan.tier);
                      return (
                        <td key={plan.tier} className="border border-border p-3 text-center">
                          {limits.advancedAnalytics ? <Check className="h-4 w-4 text-green-600 mx-auto" /> : '—'}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Can I change my plan anytime?</p>
                <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div>
                <p className="font-medium">What happens to my data if I downgrade?</p>
                <p className="text-muted-foreground">Your data is always safe. Some features may become unavailable, but your projects and data remain intact.</p>
              </div>
              <div>
                <p className="font-medium">Do you offer refunds?</p>
                <p className="text-muted-foreground">We offer a 30-day money-back guarantee for all paid plans.</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}