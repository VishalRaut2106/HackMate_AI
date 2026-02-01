'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-context';
import { Project, ProjectMember } from '@/lib/types';
import { 
  Star, 
  MessageSquare, 
  Award, 
  TrendingUp,
  Users,
  Code,
  Lightbulb,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Eye,
  Download
} from 'lucide-react';

interface JudgeFeedback {
  id: string;
  projectId: string;
  judgeId: string;
  judgeName: string;
  judgeEmail: string;
  scores: {
    innovation: number;
    technical: number;
    design: number;
    presentation: number;
    impact: number;
  };
  overallScore: number;
  comments: {
    strengths: string;
    improvements: string;
    general: string;
  };
  categories: string[];
  recommendation: 'winner' | 'finalist' | 'honorable_mention' | 'participant';
  submittedAt: Date;
  isPublic: boolean;
}

interface JudgingCriteria {
  name: string;
  description: string;
  weight: number;
  maxScore: number;
}

const DEFAULT_CRITERIA: JudgingCriteria[] = [
  {
    name: 'innovation',
    description: 'Originality and creativity of the solution',
    weight: 0.25,
    maxScore: 10
  },
  {
    name: 'technical',
    description: 'Technical complexity and implementation quality',
    weight: 0.25,
    maxScore: 10
  },
  {
    name: 'design',
    description: 'User experience and interface design',
    weight: 0.2,
    maxScore: 10
  },
  {
    name: 'presentation',
    description: 'Quality of pitch and demonstration',
    weight: 0.15,
    maxScore: 10
  },
  {
    name: 'impact',
    description: 'Potential real-world impact and market viability',
    weight: 0.15,
    maxScore: 10
  }
];

interface JudgeFeedbackSystemProps {
  project: Project;
  members: ProjectMember[];
  isJudgeView?: boolean;
  isPublicDemo?: boolean;
}

export function JudgeFeedbackSystem({ 
  project, 
  members, 
  isJudgeView = false, 
  isPublicDemo = false 
}: JudgeFeedbackSystemProps) {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<JudgeFeedback[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<Partial<JudgeFeedback>>({
    scores: { innovation: 5, technical: 5, design: 5, presentation: 5, impact: 5 },
    comments: { strengths: '', improvements: '', general: '' },
    categories: [],
    recommendation: 'participant',
    isPublic: false
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('scoring');

  useEffect(() => {
    loadFeedback();
  }, [project.id]);

  const loadFeedback = () => {
    // Load feedback from localStorage (in production, this would be from backend)
    try {
      const stored = localStorage.getItem(`feedback_${project.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFeedback(parsed.map((f: any) => ({
          ...f,
          submittedAt: new Date(f.submittedAt)
        })));
      }
    } catch (error) {
      console.error('Failed to load feedback:', error);
    }
  };

  const saveFeedback = async () => {
    if (!user) return;

    setSubmitting(true);
    try {
      const overallScore = calculateOverallScore(currentFeedback.scores!);
      
      const newFeedback: JudgeFeedback = {
        id: `feedback_${Date.now()}_${user.uid}`,
        projectId: project.id,
        judgeId: user.uid,
        judgeName: user.displayName || user.email,
        judgeEmail: user.email,
        scores: currentFeedback.scores!,
        overallScore,
        comments: currentFeedback.comments!,
        categories: currentFeedback.categories!,
        recommendation: currentFeedback.recommendation!,
        submittedAt: new Date(),
        isPublic: currentFeedback.isPublic!
      };

      const updatedFeedback = [...feedback.filter(f => f.judgeId !== user.uid), newFeedback];
      
      // Save to localStorage (in production, this would be saved to backend)
      localStorage.setItem(`feedback_${project.id}`, JSON.stringify(updatedFeedback));
      
      setFeedback(updatedFeedback);
      
      // Reset form
      setCurrentFeedback({
        scores: { innovation: 5, technical: 5, design: 5, presentation: 5, impact: 5 },
        comments: { strengths: '', improvements: '', general: '' },
        categories: [],
        recommendation: 'participant',
        isPublic: false
      });

      setActiveTab('results');
    } catch (error) {
      console.error('Failed to save feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateOverallScore = (scores: JudgeFeedback['scores']) => {
    return DEFAULT_CRITERIA.reduce((total, criteria) => {
      const score = scores[criteria.name as keyof typeof scores];
      return total + (score * criteria.weight);
    }, 0);
  };

  const getAverageScores = () => {
    if (feedback.length === 0) return null;

    const averages = {
      innovation: 0,
      technical: 0,
      design: 0,
      presentation: 0,
      impact: 0,
      overall: 0
    };

    feedback.forEach(f => {
      averages.innovation += f.scores.innovation;
      averages.technical += f.scores.technical;
      averages.design += f.scores.design;
      averages.presentation += f.scores.presentation;
      averages.impact += f.scores.impact;
      averages.overall += f.overallScore;
    });

    Object.keys(averages).forEach(key => {
      averages[key as keyof typeof averages] /= feedback.length;
    });

    return averages;
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecommendationBadge = (recommendation: JudgeFeedback['recommendation']) => {
    const variants = {
      winner: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      finalist: 'bg-blue-100 text-blue-800 border-blue-200',
      honorable_mention: 'bg-green-100 text-green-800 border-green-200',
      participant: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const labels = {
      winner: 'Winner',
      finalist: 'Finalist',
      honorable_mention: 'Honorable Mention',
      participant: 'Participant'
    };

    return (
      <Badge className={variants[recommendation]}>
        {labels[recommendation]}
      </Badge>
    );
  };

  if (!isJudgeView && !isPublicDemo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Judge Feedback
          </CardTitle>
          <CardDescription>
            Feedback from judges will appear here after evaluation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feedback.length > 0 ? (
            <div className="space-y-4">
              {/* Average Scores */}
              {(() => {
                const averages = getAverageScores();
                return averages ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(averages.overall)}`}>
                            {averages.overall.toFixed(1)}
                          </div>
                          <div className="text-sm text-muted-foreground">Overall Score</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {feedback.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Judge Reviews</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {feedback.filter(f => f.recommendation === 'winner' || f.recommendation === 'finalist').length}
                          </div>
                          <div className="text-sm text-muted-foreground">Recommendations</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : null;
              })()}

              {/* Individual Feedback */}
              <div className="space-y-4">
                <h3 className="font-medium">Individual Reviews</h3>
                {feedback.filter(f => f.isPublic).map((f) => (
                  <Card key={f.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{f.judgeName}</CardTitle>
                          <CardDescription>
                            Submitted {f.submittedAt.toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRecommendationBadge(f.recommendation)}
                          <Badge variant="outline">
                            {f.overallScore.toFixed(1)}/10
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {f.comments.general && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">General Comments</h4>
                          <p className="text-sm text-muted-foreground">{f.comments.general}</p>
                        </div>
                      )}
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        {f.comments.strengths && (
                          <div>
                            <h4 className="font-medium mb-2 text-green-600">Strengths</h4>
                            <p className="text-sm">{f.comments.strengths}</p>
                          </div>
                        )}
                        {f.comments.improvements && (
                          <div>
                            <h4 className="font-medium mb-2 text-amber-600">Areas for Improvement</h4>
                            <p className="text-sm">{f.comments.improvements}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No judge feedback available yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Judge View
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Judge Evaluation</h2>
          <p className="text-muted-foreground">Evaluate {project.name}</p>
        </div>
        <Badge variant="secondary">
          Judge Mode
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="scoring">Scoring</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Scoring Tab */}
        <TabsContent value="scoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Evaluation Criteria
              </CardTitle>
              <CardDescription>
                Rate each aspect of the project on a scale of 1-10
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {DEFAULT_CRITERIA.map((criteria) => (
                <div key={criteria.name} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="capitalize font-medium">
                        {criteria.name} ({(criteria.weight * 100).toFixed(0)}% weight)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {criteria.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {currentFeedback.scores?.[criteria.name as keyof typeof currentFeedback.scores] || 5}
                      </div>
                      <div className="text-xs text-muted-foreground">/ 10</div>
                    </div>
                  </div>
                  <Slider
                    value={[currentFeedback.scores?.[criteria.name as keyof typeof currentFeedback.scores] || 5]}
                    onValueChange={(value) => {
                      setCurrentFeedback(prev => ({
                        ...prev,
                        scores: {
                          ...prev.scores!,
                          [criteria.name]: value[0]
                        }
                      }));
                    }}
                    max={10}
                    min={1}
                    step={0.5}
                    className="w-full"
                  />
                </div>
              ))}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Overall Score</span>
                  <span className="text-xl font-bold text-primary">
                    {calculateOverallScore(currentFeedback.scores!).toFixed(1)} / 10
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Detailed Feedback
              </CardTitle>
              <CardDescription>
                Provide constructive feedback to help the team improve
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="strengths">Project Strengths</Label>
                <Textarea
                  id="strengths"
                  placeholder="What did the team do well? What impressed you most?"
                  value={currentFeedback.comments?.strengths || ''}
                  onChange={(e) => setCurrentFeedback(prev => ({
                    ...prev,
                    comments: {
                      ...prev.comments!,
                      strengths: e.target.value
                    }
                  }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="improvements">Areas for Improvement</Label>
                <Textarea
                  id="improvements"
                  placeholder="What could be improved? What suggestions do you have?"
                  value={currentFeedback.comments?.improvements || ''}
                  onChange={(e) => setCurrentFeedback(prev => ({
                    ...prev,
                    comments: {
                      ...prev.comments!,
                      improvements: e.target.value
                    }
                  }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="general">General Comments</Label>
                <Textarea
                  id="general"
                  placeholder="Any additional thoughts or feedback?"
                  value={currentFeedback.comments?.general || ''}
                  onChange={(e) => setCurrentFeedback(prev => ({
                    ...prev,
                    comments: {
                      ...prev.comments!,
                      general: e.target.value
                    }
                  }))}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Recommendation</Label>
                  <Select 
                    value={currentFeedback.recommendation} 
                    onValueChange={(value: JudgeFeedback['recommendation']) => 
                      setCurrentFeedback(prev => ({ ...prev, recommendation: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="winner">Winner</SelectItem>
                      <SelectItem value="finalist">Finalist</SelectItem>
                      <SelectItem value="honorable_mention">Honorable Mention</SelectItem>
                      <SelectItem value="participant">Participant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <Select 
                    value={currentFeedback.isPublic ? 'public' : 'private'} 
                    onValueChange={(value) => 
                      setCurrentFeedback(prev => ({ ...prev, isPublic: value === 'public' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public (visible to team)</SelectItem>
                      <SelectItem value="private">Private (organizers only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={saveFeedback} 
                disabled={submitting}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Feedback...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Evaluation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evaluation Results
              </CardTitle>
              <CardDescription>
                Summary of all judge evaluations for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedback.length > 0 ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  {(() => {
                    const averages = getAverageScores();
                    return averages ? (
                      <div className="grid gap-4 md:grid-cols-5">
                        {DEFAULT_CRITERIA.map((criteria) => (
                          <div key={criteria.name} className="text-center">
                            <div className={`text-xl font-bold ${getScoreColor(averages[criteria.name as keyof typeof averages])}`}>
                              {averages[criteria.name as keyof typeof averages].toFixed(1)}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {criteria.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}

                  {/* Individual Reviews */}
                  <div className="space-y-4">
                    <h3 className="font-medium">All Reviews ({feedback.length})</h3>
                    {feedback.map((f) => (
                      <Card key={f.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">{f.judgeName}</CardTitle>
                              <CardDescription>
                                {f.submittedAt.toLocaleDateString()} • {f.submittedAt.toLocaleTimeString()}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              {getRecommendationBadge(f.recommendation)}
                              <Badge variant="outline">
                                {f.overallScore.toFixed(1)}/10
                              </Badge>
                              {f.isPublic ? (
                                <Badge variant="secondary">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Public
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  Private
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No evaluations submitted yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}