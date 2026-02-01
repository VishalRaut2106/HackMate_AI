'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/auth-context';
import { TemplateService, ProjectTemplate } from '@/lib/template-service';
import { createProject } from '@/lib/firestore';
import { SubscriptionService, UsageTracker } from '@/lib/subscription-service';
import { SubscriptionTier } from '@/lib/types';
import { 
  Search, 
  Filter, 
  Star, 
  Users, 
  Clock, 
  Lightbulb,
  CheckSquare,
  AlertTriangle,
  Zap,
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface TemplateBrowserProps {
  onTemplateSelected?: (templateId: string) => void;
}

export function TemplateBrowser({ onTemplateSelected }: TemplateBrowserProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ProjectTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const allTemplates = TemplateService.getAllTemplates();
    setTemplates(allTemplates);
    setFilteredTemplates(allTemplates);
  }, []);

  useEffect(() => {
    let filtered = templates;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = TemplateService.searchTemplates(searchQuery);
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(t => t.difficulty === selectedDifficulty);
    }

    // Apply duration filter
    if (selectedDuration !== 'all') {
      filtered = filtered.filter(t => t.duration === selectedDuration);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory, selectedDifficulty, selectedDuration]);

  const handleUseTemplate = async (template: ProjectTemplate) => {
    if (!user) return;

    // Check subscription limits
    const usage = UsageTracker.getUsage(user.uid);
    if (!SubscriptionService.canCreateProject(usage.projectsCreated, user.subscriptionTier as SubscriptionTier)) {
      const limits = SubscriptionService.getLimits(user.subscriptionTier as SubscriptionTier);
      alert(`You've reached your project limit (${limits.maxProjects}). Please upgrade your plan.`);
      return;
    }

    setLoading(true);
    try {
      // Create project with template data
      const projectId = await createProject(
        template.name,
        template.duration,
        user.uid
      );

      // Track usage
      UsageTracker.incrementProjectCount(user.uid);

      // Navigate to project and trigger template application
      router.push(`/project/${projectId}?template=${template.id}`);
      
      onTemplateSelected?.(template.id);
    } catch (error) {
      console.error('Failed to create project from template:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: ProjectTemplate['difficulty']) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const categories = TemplateService.getCategories();
  const difficulties = TemplateService.getDifficultyLevels();
  const durations = TemplateService.getDurations();

  const TemplateCard = ({ template }: { template: ProjectTemplate }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {template.name}
            </CardTitle>
            <CardDescription className="mt-1">
              {template.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">{template.popularityScore}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
            {template.difficulty}
          </Badge>
          <Badge variant="secondary">{template.category}</Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {template.duration}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {template.estimatedTeamSize} members
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 4).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 4 && (
            <Badge variant="secondary" className="text-xs">
              +{template.tags.length - 4} more
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setSelectedTemplate(template)}
              >
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {template.name}
                </DialogTitle>
                <DialogDescription>
                  {template.description}
                </DialogDescription>
              </DialogHeader>
              
              {selectedTemplate && (
                <div className="space-y-6 pt-4">
                  {/* Template Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{selectedTemplate.difficulty}</div>
                      <div className="text-sm text-muted-foreground">Difficulty</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedTemplate.duration}</div>
                      <div className="text-sm text-muted-foreground">Duration</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedTemplate.estimatedTeamSize}</div>
                      <div className="text-sm text-muted-foreground">Team Size</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{selectedTemplate.popularityScore}</div>
                      <div className="text-sm text-muted-foreground">Popularity</div>
                    </div>
                  </div>

                  {/* Problem Statement */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      Problem Statement
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplate.idea.problem_statement}
                    </p>
                  </div>

                  {/* Target Users */}
                  <div>
                    <h4 className="font-medium mb-2">Target Users</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.idea.target_users.map(user => (
                        <Badge key={user} variant="outline">{user}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-green-500" />
                      Key Features
                    </h4>
                    <ul className="space-y-1">
                      {selectedTemplate.idea.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckSquare className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tech Stack */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      Suggested Tech Stack
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.idea.tech_stack_suggestions.map(tech => (
                        <Badge key={tech} variant="secondary">{tech}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Risks */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Potential Risks
                    </h4>
                    <ul className="space-y-1">
                      {selectedTemplate.idea.risks.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <AlertTriangle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button 
                      onClick={() => handleUseTemplate(selectedTemplate)}
                      disabled={loading}
                      className="min-w-32"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Use Template
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Button 
            onClick={() => handleUseTemplate(template)}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Use Template
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Project Templates</h2>
        <p className="text-muted-foreground">
          Start your hackathon project with proven templates and AI-generated ideas
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>
                      {difficulty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Duration</label>
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Duration</SelectItem>
                  {durations.map(duration => (
                    <SelectItem key={duration} value={duration}>
                      {duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {filteredTemplates.length} Template{filteredTemplates.length !== 1 ? 's' : ''} Found
          </h3>
          <div className="text-sm text-muted-foreground">
            Sorted by popularity
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="font-medium mb-2">No templates found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map(template => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}