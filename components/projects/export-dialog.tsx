'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { exportService, ExportOptions, ProjectExportData } from '@/lib/export-service';
import { Project, Task, ProjectMember, ChatMessage } from '@/lib/types';
import { 
  Download, 
  FileText, 
  Presentation, 
  Database, 
  Users, 
  MessageSquare,
  BarChart3,
  Lightbulb,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface ExportDialogProps {
  children: React.ReactNode;
  project: Project;
  tasks: Task[];
  members: ProjectMember[];
  messages?: ChatMessage[];
}

export function ExportDialog({ children, project, tasks, members, messages }: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeIdea: true,
    includeTasks: true,
    includeAnalytics: true,
    includeTeam: true,
    includeChat: false,
    format: 'pdf'
  });

  const calculateAnalytics = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
    
    const hoursElapsed = typeof window !== 'undefined' ? 
      Math.max(1, (new Date().getTime() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60)) :

      1;
    const teamVelocity = completedTasks / hoursElapsed;
    
    const timeElapsed = hoursElapsed < 24 
      ? `${Math.round(hoursElapsed)}h` 
      : `${Math.round(hoursElapsed / 24)}d ${Math.round(hoursElapsed % 24)}h`;

    return {
      totalTasks,
      completedTasks,
      completionRate,
      timeElapsed,
      teamVelocity
    };
  };

  const handleExport = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    setProgress(0);

    try {
      setProgress(20);

      const exportData: ProjectExportData = {
        project,
        tasks,
        members,
        messages: exportOptions.includeChat ? messages : undefined,
        analytics: exportOptions.includeAnalytics ? calculateAnalytics() : undefined
      };

      setProgress(50);

      const blob = await exportService.exportProject(exportData, exportOptions);
      
      setProgress(80);

      // Download the file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const fileExtension = exportOptions.format === 'pdf' ? 'html' : exportOptions.format;
      const fileName = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_report.${fileExtension}`;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProgress(100);
      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to export project');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleGeneratePitchDeck = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const exportData: ProjectExportData = {
        project,
        tasks,
        members
      };

      const blob = await exportService.generatePitchDeck(exportData);
      
      // Download the pitch deck
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_pitch_deck.html`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to generate pitch deck');
    } finally {
      setLoading(false);
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'pdf':
        return 'Comprehensive HTML report (can be printed to PDF)';
      case 'json':
        return 'Structured data export for developers';
      case 'csv':
        return 'Task list in spreadsheet format';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Project
          </DialogTitle>
          <DialogDescription>
            Generate reports and presentations for your project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={handleGeneratePitchDeck}
              disabled={loading}
            >
              <Presentation className="h-6 w-6" />
              <span className="text-sm">Generate Pitch Deck</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={handleExport}
              disabled={loading}
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">Export Report</span>
            </Button>
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Format</Label>
            <Select 
              value={exportOptions.format} 
              onValueChange={(value: 'pdf' | 'json' | 'csv') => 
                setExportOptions(prev => ({ ...prev, format: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Report (HTML)</SelectItem>
                <SelectItem value="json">JSON Data</SelectItem>
                <SelectItem value="csv">CSV Spreadsheet</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {getFormatDescription(exportOptions.format)}
            </p>
          </div>

          {/* Content Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Include in Export</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeIdea"
                  checked={exportOptions.includeIdea}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeIdea: !!checked }))
                  }
                />
                <Label htmlFor="includeIdea" className="flex items-center gap-2 text-sm">
                  <Lightbulb className="h-4 w-4" />
                  Project Idea & Analysis
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTasks"
                  checked={exportOptions.includeTasks}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeTasks: !!checked }))
                  }
                />
                <Label htmlFor="includeTasks" className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4" />
                  Tasks & Progress
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTeam"
                  checked={exportOptions.includeTeam}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeTeam: !!checked }))
                  }
                />
                <Label htmlFor="includeTeam" className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  Team Members
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeAnalytics"
                  checked={exportOptions.includeAnalytics}
                  onCheckedChange={(checked) => 
                    setExportOptions(prev => ({ ...prev, includeAnalytics: !!checked }))
                  }
                />
                <Label htmlFor="includeAnalytics" className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4" />
                  Analytics & Metrics
                </Label>
              </div>

              {messages && messages.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeChat"
                    checked={exportOptions.includeChat}
                    onCheckedChange={(checked) => 
                      setExportOptions(prev => ({ ...prev, includeChat: !!checked }))
                    }
                  />
                  <Label htmlFor="includeChat" className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4" />
                    Chat Messages
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Generating export...</span>
              </div>
              {progress > 0 && (
                <Progress value={progress} className="w-full" />
              )}
            </div>
          )}

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Export completed successfully!</AlertDescription>
            </Alert>
          )}

          {/* Export Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Export Preview</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Project: {project.name}</p>
              <p>• Tasks: {tasks.length} total, {tasks.filter(t => t.status === 'Done').length} completed</p>
              <p>• Team: {members.length} members</p>
              <p>• Duration: {project.duration}</p>
              {messages && exportOptions.includeChat && (
                <p>• Messages: {messages.length} chat messages</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export {exportOptions.format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}