'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { UserProfile } from '@/components/auth/user-profile';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { JoinTeamDialog } from '@/components/teams/join-team-dialog';
import { ProjectsList } from '@/components/projects/projects-list';
import { USER_TYPE_DISPLAY_NAMES, TIER_DISPLAY_NAMES } from '@/lib/constants';
import { 
  User, 
  Settings, 
  Plus, 
  FolderOpen, 
  Users, 
  Zap,
  BarChart3,
  Calendar,
  LogOut
} from 'lucide-react';

export function DashboardContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleProjectCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTeamJoined = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (showProfile) {
    return <UserProfile onClose={() => setShowProfile(false)} />;
  }

  const getDashboardContent = () => {
    switch (user.userType) {
      case 'student':
        return {
          title: 'Student Dashboard',
          description: 'Manage your projects and assignments',
          quickActions: [
            { 
              icon: <Plus className="h-4 w-4" />, 
              label: 'New Project', 
              component: (
                <CreateProjectDialog onProjectCreated={handleProjectCreated}>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Plus className="h-4 w-4" />
                    New Project
                  </Button>
                </CreateProjectDialog>
              )
            },
            { 
              icon: <FolderOpen className="h-4 w-4" />, 
              label: 'My Projects', 
              action: () => document.getElementById('projects-section')?.scrollIntoView({ behavior: 'smooth' })
            },
            { 
              icon: <Users className="h-4 w-4" />, 
              label: 'Join Team', 
              component: (
                <JoinTeamDialog onTeamJoined={handleTeamJoined}>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Users className="h-4 w-4" />
                    Join Team
                  </Button>
                </JoinTeamDialog>
              )
            },
          ],
          stats: [
            { label: 'Active Projects', value: '0', icon: <FolderOpen className="h-4 w-4" /> },
            { label: 'Team Members', value: '0', icon: <Users className="h-4 w-4" /> },
            { label: 'Tasks Completed', value: '0', icon: <BarChart3 className="h-4 w-4" /> },
          ]
        };
      
      case 'hackathon_team':
        return {
          title: 'Hackathon Dashboard',
          description: 'Execute your hackathon project with AI assistance',
          quickActions: [
            { 
              icon: <Plus className="h-4 w-4" />, 
              label: 'Join Hackathon', 
              component: (
                <JoinTeamDialog onTeamJoined={handleTeamJoined}>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Plus className="h-4 w-4" />
                    Join Hackathon
                  </Button>
                </JoinTeamDialog>
              )
            },
            { 
              icon: <Zap className="h-4 w-4" />, 
              label: 'AI Analysis', 
              action: () => {} 
            },
            { 
              icon: <Users className="h-4 w-4" />, 
              label: 'Team Chat', 
              action: () => {} 
            },
          ],
          stats: [
            { label: 'Active Hackathons', value: '0', icon: <Calendar className="h-4 w-4" /> },
            { label: 'AI Credits', value: '50', icon: <Zap className="h-4 w-4" /> },
            { label: 'Team Projects', value: '0', icon: <FolderOpen className="h-4 w-4" /> },
          ]
        };
      
      case 'organizer':
        return {
          title: 'Organizer Dashboard',
          description: 'Manage hackathons and track team progress',
          quickActions: [
            { 
              icon: <Plus className="h-4 w-4" />, 
              label: 'Create Hackathon', 
              action: () => router.push('/organizer') 
            },
            { 
              icon: <Users className="h-4 w-4" />, 
              label: 'Manage Teams', 
              action: () => router.push('/organizer') 
            },
            { 
              icon: <BarChart3 className="h-4 w-4" />, 
              label: 'Analytics', 
              action: () => router.push('/organizer') 
            },
          ],
          stats: [
            { label: 'Active Events', value: '0', icon: <Calendar className="h-4 w-4" /> },
            { label: 'Total Teams', value: '0', icon: <Users className="h-4 w-4" /> },
            { label: 'Participants', value: '0', icon: <User className="h-4 w-4" /> },
          ]
        };
      
      case 'corporate_manager':
        return {
          title: 'Corporate Dashboard',
          description: 'Track internal innovation and hackathon initiatives',
          quickActions: [
            { 
              icon: <Plus className="h-4 w-4" />, 
              label: 'New Initiative', 
              component: (
                <CreateProjectDialog onProjectCreated={handleProjectCreated}>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Plus className="h-4 w-4" />
                    New Initiative
                  </Button>
                </CreateProjectDialog>
              )
            },
            { 
              icon: <Users className="h-4 w-4" />, 
              label: 'Employee Teams', 
              action: () => {} 
            },
            { 
              icon: <BarChart3 className="h-4 w-4" />, 
              label: 'Reports', 
              action: () => {} 
            },
          ],
          stats: [
            { label: 'Active Initiatives', value: '0', icon: <FolderOpen className="h-4 w-4" /> },
            { label: 'Employee Participation', value: '0', icon: <Users className="h-4 w-4" /> },
            { label: 'Innovation Score', value: '0', icon: <BarChart3 className="h-4 w-4" /> },
          ]
        };
      
      default:
        return {
          title: 'Dashboard',
          description: 'Welcome to HackMate AI',
          quickActions: [],
          stats: []
        };
    }
  };

  const dashboardContent = getDashboardContent();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">HackMate AI</h1>
              <p className="text-sm text-muted-foreground">
                {dashboardContent.description}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {TIER_DISPLAY_NAMES[user.subscriptionTier]}
              </Badge>
              
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.photoURL} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {USER_TYPE_DISPLAY_NAMES[user.userType]}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfile(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold mb-2">{dashboardContent.title}</h2>
            <p className="text-muted-foreground">
              Welcome back, {user.displayName}! Here's what's happening with your projects.
            </p>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Get started with these common tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboardContent.quickActions.map((action, index) => (
                  <div key={index}>
                    {action.component || (
                      <Button
                        variant="outline"
                        className="h-20 flex-col gap-2"
                        onClick={action.action}
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboardContent.stats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.label}
                  </CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Projects Section */}
          <div id="projects-section">
            <Card>
              <CardHeader>
                <CardTitle>My Projects</CardTitle>
                <CardDescription>
                  Your active and recent projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectsList 
                  refreshTrigger={refreshTrigger}
                  onProjectSelect={(project) => {
                    // Navigate to project detail page using id
                    router.push(`/project/${project.id}`);
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Subscription Info */}
          {user.subscriptionTier === 'free' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Upgrade to Pro
                </CardTitle>
                <CardDescription>
                  Unlock AI features, unlimited projects, and advanced analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full md:w-auto">
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}