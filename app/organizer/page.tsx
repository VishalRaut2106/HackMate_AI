'use client';

import { useAuth } from '@/lib/auth-context';
import { HackathonManagement } from '@/components/organizer/hackathon-management';
import { UsageDashboard } from '@/components/subscription/usage-dashboard';
import { CustomBranding } from '@/components/branding/custom-branding';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Settings,
  Crown,
  AlertTriangle,
  ArrowLeft,
  Palette
} from 'lucide-react';

export default function OrganizerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Loading organizer dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  if (user.userType !== 'organizer' && user.userType !== 'corporate_manager') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              This page is only available to event organizers and corporate managers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOrganizerTier = user.subscriptionTier === 'organizer' || user.subscriptionTier === 'corporate';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">Organizer Dashboard</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant={isOrganizerTier ? "default" : "secondary"}>
                    {user.subscriptionTier === 'organizer' ? 'Organizer' : 
                     user.subscriptionTier === 'corporate' ? 'Corporate' : 'Basic'}
                  </Badge>
                  <span>•</span>
                  <span>{user.displayName || user.email}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isOrganizerTier && (
                <Button variant="outline" size="sm">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {!isOrganizerTier && (
          <Alert className="mb-6">
            <Crown className="h-4 w-4" />
            <AlertDescription>
              You're using basic organizer features. Upgrade to Organizer or Corporate plan for advanced event management, 
              custom branding, and detailed analytics.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl">
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Teams</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Usage</span>
            </TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events">
            <HackathonManagement />
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Management
                </CardTitle>
                <CardDescription>
                  Manage teams across all your hackathon events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Team management features coming soon</p>
                  <p className="text-sm">View and manage teams across all your events</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Event Analytics
                </CardTitle>
                <CardDescription>
                  Detailed insights and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Advanced analytics coming soon</p>
                  <p className="text-sm">Track engagement, success rates, and team performance</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <CustomBranding />
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage">
            <UsageDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}