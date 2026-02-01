'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateHackathonDialog } from './create-hackathon-dialog';
import { useAuth } from '@/lib/auth-context';
import { getOrganizerHackathons, getHackathonTeams, getHackathonStats } from '@/lib/firestore';
import { HackathonEvent, Project } from '@/lib/types';
import { 
  Calendar, 
  Users, 
  Trophy,
  Plus,
  Eye,
  Settings,
  BarChart3,
  Clock,
  MapPin,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react';

interface HackathonStats {
  totalParticipants: number;
  totalTeams: number;
  activeProjects: number;
  completedProjects: number;
}

export function HackathonManagement() {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState<HackathonEvent[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<HackathonEvent | null>(null);
  const [hackathonStats, setHackathonStats] = useState<Record<string, HackathonStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadHackathons();
    }
  }, [user]);

  const loadHackathons = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const organizerHackathons = await getOrganizerHackathons(user.uid);
      setHackathons(organizerHackathons);
      
      // Load stats for each hackathon
      const stats: Record<string, HackathonStats> = {};
      for (const hackathon of organizerHackathons) {
        try {
          const hackathonStat = await getHackathonStats(hackathon.event_id);
          stats[hackathon.event_id] = hackathonStat;
        } catch (err) {
          console.error(`Failed to load stats for hackathon ${hackathon.event_id}:`, err);
          stats[hackathon.event_id] = {
            totalParticipants: 0,
            totalTeams: 0,
            activeProjects: 0,
            completedProjects: 0
          };
        }
      }
      setHackathonStats(stats);
      
      if (organizerHackathons.length > 0 && !selectedHackathon) {
        setSelectedHackathon(organizerHackathons[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load hackathons');
    } finally {
      setLoading(false);
    }
  };

  const handleHackathonCreated = (newHackathon: HackathonEvent) => {
    setHackathons(prev => [newHackathon, ...prev]);
    setSelectedHackathon(newHackathon);
    setHackathonStats(prev => ({
      ...prev,
      [newHackathon.event_id]: {
        totalParticipants: 0,
        totalTeams: 0,
        activeProjects: 0,
        completedProjects: 0
      }
    }));
  };

  const getStatusColor = (status: HackathonEvent['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'judging': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysUntil = (date: Date) => {
    const now = new Date();
    const target = new Date(date);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Hackathon Management</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hackathon Management</h2>
          <p className="text-muted-foreground">Create and manage your hackathon events</p>
        </div>
        <CreateHackathonDialog onHackathonCreated={handleHackathonCreated}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Hackathon
          </Button>
        </CreateHackathonDialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hackathons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Hackathons Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first hackathon to start managing teams and tracking progress
            </p>
            <CreateHackathonDialog onHackathonCreated={handleHackathonCreated}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Hackathon
              </Button>
            </CreateHackathonDialog>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{hackathons.length}</div>
                  <div className="text-xs text-muted-foreground">
                    {hackathons.filter(h => h.status === 'active').length} active
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.values(hackathonStats).reduce((sum, stats) => sum + stats.totalTeams, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Across all events
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Participants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.values(hackathonStats).reduce((sum, stats) => sum + stats.totalParticipants, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total registered
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Object.values(hackathonStats).reduce((sum, stats) => sum + stats.activeProjects + stats.completedProjects, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Object.values(hackathonStats).reduce((sum, stats) => sum + stats.completedProjects, 0)} completed
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Events */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
                <CardDescription>Your latest hackathon events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hackathons.slice(0, 5).map((hackathon) => {
                    const stats = hackathonStats[hackathon.event_id] || {
                      totalParticipants: 0,
                      totalTeams: 0,
                      activeProjects: 0,
                      completedProjects: 0
                    };
                    const daysUntil = getDaysUntil(hackathon.start_date);

                    return (
                      <div key={hackathon.event_id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium">{hackathon.name}</h3>
                            <Badge className={getStatusColor(hackathon.status)}>
                              {hackathon.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(hackathon.start_date)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {stats.totalTeams} teams
                            </div>
                            <div className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {stats.totalParticipants} participants
                            </div>
                            {hackathon.status === 'upcoming' && daysUntil > 0 && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {daysUntil} days to go
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {hackathons.map((hackathon) => {
                const stats = hackathonStats[hackathon.event_id] || {
                  totalParticipants: 0,
                  totalTeams: 0,
                  activeProjects: 0,
                  completedProjects: 0
                };
                const daysUntil = getDaysUntil(hackathon.start_date);

                return (
                  <Card key={hackathon.event_id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{hackathon.name}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {hackathon.description}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(hackathon.status)}>
                          {hackathon.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Event Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(hackathon.start_date)} - {formatDate(hackathon.end_date)}</span>
                        </div>
                        {hackathon.theme && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{hackathon.theme}</span>
                          </div>
                        )}
                        {hackathon.status === 'upcoming' && daysUntil > 0 && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <Clock className="h-4 w-4" />
                            <span className="font-medium">{daysUntil} days to go</span>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div className="text-center">
                          <div className="text-lg font-bold">{stats.totalTeams}</div>
                          <div className="text-xs text-muted-foreground">Teams</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{stats.totalParticipants}</div>
                          <div className="text-xs text-muted-foreground">Participants</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Analytics
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Event Performance Analytics
                </CardTitle>
                <CardDescription>
                  Detailed insights across all your hackathon events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Advanced analytics coming soon</p>
                  <p className="text-sm">Track team performance, engagement metrics, and success rates</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}