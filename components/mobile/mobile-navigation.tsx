'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Menu, 
  Home, 
  FolderOpen, 
  Users, 
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Crown,
  Lightbulb,
  CheckSquare,
  MessageCircle,
  Github,
  Share2
} from 'lucide-react';

interface MobileNavigationProps {
  projectTabs?: boolean;
}

export function MobileNavigation({ projectTabs = false }: MobileNavigationProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleNavigation = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  const mainNavItems = [
    {
      icon: <Home className="h-4 w-4" />,
      label: 'Dashboard',
      path: '/dashboard',
      active: pathname === '/dashboard'
    },
    {
      icon: <FolderOpen className="h-4 w-4" />,
      label: 'Projects',
      path: '/dashboard',
      active: pathname.startsWith('/project/')
    },
    ...(user?.userType === 'organizer' || user?.userType === 'corporate_manager' ? [{
      icon: <Calendar className="h-4 w-4" />,
      label: 'Organizer',
      path: '/organizer',
      active: pathname === '/organizer'
    }] : []),
    {
      icon: <Settings className="h-4 w-4" />,
      label: 'Settings',
      path: '/settings',
      active: pathname === '/settings'
    }
  ];

  const projectTabItems = [
    {
      icon: <Lightbulb className="h-4 w-4" />,
      label: 'Idea',
      value: 'idea'
    },
    {
      icon: <CheckSquare className="h-4 w-4" />,
      label: 'Tasks',
      value: 'tasks'
    },
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: 'Analytics',
      value: 'analytics'
    },
    {
      icon: <MessageCircle className="h-4 w-4" />,
      label: 'Mentor',
      value: 'mentor'
    },
    {
      icon: <Github className="h-4 w-4" />,
      label: 'GitHub',
      value: 'github'
    },
    {
      icon: <Share2 className="h-4 w-4" />,
      label: 'Team',
      value: 'team'
    }
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">H</span>
            </div>
            HackMate AI
          </SheetTitle>
          <SheetDescription>
            {user && (
              <div className="flex items-center gap-2 mt-2">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                  {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm">{user.displayName || user.email}</span>
                <Badge variant="secondary" className="text-xs">
                  {user.subscriptionTier === 'free' ? 'Free' : 'Pro'}
                </Badge>
              </div>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-2">Navigation</h3>
            <nav className="space-y-1">
              {mainNavItems.map((item) => (
                <Button
                  key={item.path}
                  variant={item.active ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleNavigation(item.path)}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              ))}
            </nav>
          </div>

          {/* Project Tabs (if in project view) */}
          {projectTabs && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-2">Project Sections</h3>
              <nav className="space-y-1">
                {projectTabItems.map((item) => (
                  <Button
                    key={item.value}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      // Trigger tab change (this would need to be connected to the parent component)
                      const event = new CustomEvent('mobile-tab-change', { detail: item.value });
                      window.dispatchEvent(event);
                      setOpen(false);
                    }}
                  >
                    {item.icon}
                    <span className="ml-2">{item.label}</span>
                  </Button>
                ))}
              </nav>
            </div>
          )}

          {/* Subscription Info */}
          {user && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-2">Subscription</h3>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current Plan</span>
                  <Badge variant={user.subscriptionTier === 'free' ? 'secondary' : 'default'}>
                    {user.subscriptionTier === 'free' ? 'Free' : 
                     user.subscriptionTier === 'student_pro' ? 'Student Pro' :
                     user.subscriptionTier === 'hackathon_pro' ? 'Hackathon Pro' :
                     user.subscriptionTier === 'organizer' ? 'Organizer' :
                     user.subscriptionTier === 'corporate' ? 'Corporate' : 'Basic'}
                  </Badge>
                </div>
                {user.subscriptionTier === 'free' && (
                  <Button size="sm" className="w-full">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-2">Quick Actions</h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation('/dashboard')}
              >
                <FolderOpen className="h-4 w-4" />
                <span className="ml-2">Create Project</span>
              </Button>
              {(user?.userType === 'organizer' || user?.userType === 'corporate_manager') && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/organizer')}
                >
                  <Calendar className="h-4 w-4" />
                  <span className="ml-2">Create Event</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <div className="absolute bottom-6 left-6 right-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}