'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { getUserProjects } from '@/lib/firestore';
import { Project } from '@/lib/types';
import { 
  FolderOpen, 
  Calendar, 
  Users, 
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Archive,
  Timer
} from 'lucide-react';

interface ProjectsListProps {
  onProjectSelect?: (project: Project) => void;
  refreshTrigger?: number;
}

export function ProjectsList({ onProjectSelect, refreshTrigger }: ProjectsListProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user, refreshTrigger]);

  const loadProjects = async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError('');
    try {
      const userProjects = await getUserProjects(user.uid);
      setProjects(userProjects);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'active':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-500" />;
      default:
        return <FolderOpen className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'active':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date.toDate ? date.toDate() : date;
    return new Date(dateObj).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeRemaining = (project: any) => {
    if (!project.created_at) return null;
    
    // Only calculate on client side to avoid hydration mismatch
    if (typeof window === 'undefined') {
      return 'Loading...';
    }
    
    const start = new Date(project.created_at);
    const duration = project.duration === "24h" ? 24 : 48;
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    const remaining = end.getTime() - new Date().getTime();

    if (remaining <= 0) return "Time's up!";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium">Failed to load projects</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadProjects} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredProjects = projects.filter(project => {
    if (showArchived) {
      return project.status === 'archived';
    }
    return project.status !== 'archived';
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowArchived(!showArchived)}
          className={showArchived ? "bg-accent" : ""}
        >
          <Archive className="h-4 w-4 mr-2" />
          {showArchived ? "Hide Archived" : "Show Archived"}
        </Button>
      </div>

      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-2">{showArchived ? "No archived projects" : "No active projects"}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {showArchived ? "Archived projects will appear here" : "Create your first project to get started"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        filteredProjects.map((project: any) => (
          <Card 
            key={project.id || project.project_id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onProjectSelect?.(project)}
          >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(project.status)}
                  {project.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {project.description || "Hackathon project"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={getStatusColor(project.status)}
                >
                  {project.status}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {project.duration}
                </Badge>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Join Code */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Join Code:</span>
                <Badge variant="outline" className="font-mono">
                  {project.join_code}
                </Badge>
              </div>

              {/* Project Info */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {project.members?.length || 1} member{(project.members?.length || 1) !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {getTimeRemaining(project)}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span>
                    Created {formatDate(project.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )))}
    </div>
  );
}