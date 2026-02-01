'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';
import { createProject } from '@/lib/firestore';
import { SubscriptionService, UsageTracker } from '@/lib/subscription-service';
import { SubscriptionTier } from '@/lib/types';
import { UpgradeDialog } from '@/components/subscription/upgrade-dialog';
import { AlertCircle } from 'lucide-react';

interface CreateProjectDialogProps {
  children: React.ReactNode;
  onProjectCreated?: (projectId: string) => void;
}

export function CreateProjectDialog({ children, onProjectCreated }: CreateProjectDialogProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: '24h' as '24h' | '48h',
    techStack: '',
    category: 'Personal',
    privacy: 'private' as 'private' | 'team' | 'public',
  });

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error('Project name is required');
      }

      // Check subscription limits
      const usage = UsageTracker.getUsage(user.uid);
      if (!SubscriptionService.canCreateProject(usage.projectsCreated, user.subscriptionTier as SubscriptionTier)) {
        const limits = SubscriptionService.getLimits(user.subscriptionTier as SubscriptionTier);
        throw new Error(`You've reached your project limit (${limits.maxProjects}). Please upgrade your plan to create more projects.`);
      }

      // Create project
      const projectId = await createProject({
        name: formData.name.trim(),
        duration: formData.duration,
        userId: user.uid,
        techStack: formData.techStack.split(',').map(s => s.trim()).filter(Boolean),
        category: formData.category,
        privacy: formData.privacy
      });

      // Track usage
      UsageTracker.incrementProjectCount(user.uid);

      // Reset form
      setFormData({
        name: '',
        description: '',
        duration: '24h',
        techStack: '',
        category: 'Personal',
        privacy: 'private',
      });

      setOpen(false);
      onProjectCreated?.(projectId);
      
      // Navigate to the project page
      router.push(`/project/${projectId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new project and start collaborating with your team
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your hackathon project name"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Briefly describe your project idea..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Hackathon Duration</Label>
                <Select 
                  value={formData.duration} 
                  onValueChange={(value: '24h' | '48h') => setFormData(prev => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="48h">48 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

               <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Hackathon">Hackathon</SelectItem>
                    <SelectItem value="Corporate">Corporate</SelectItem>
                    <SelectItem value="Startup">Startup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="techStack">Tech Stack (comma separated)</Label>
              <Input
                id="techStack"
                value={formData.techStack}
                onChange={(e) => setFormData(prev => ({ ...prev, techStack: e.target.value }))}
                placeholder="React, Node.js, Firebase..."
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="privacy">Privacy</Label>
              <Select 
                value={formData.privacy} 
                onValueChange={(value: 'private' | 'team' | 'public') => setFormData(prev => ({ ...prev, privacy: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private (Only me)</SelectItem>
                  <SelectItem value="team">Team (Members only)</SelectItem>
                  <SelectItem value="public">Public (Everyone)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}