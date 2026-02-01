import { Project, Task, ProjectMember, ChatMessage } from './types';
import { ExportService } from './export-service';

export interface ExportJob {
  id: string;
  userId: string;
  projectId: string;
  type: 'pdf' | 'json' | 'csv' | 'pitch_deck' | 'html';
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: {
    url: string;
    filename: string;
    size: number;
    expiresAt: Date;
  };
  options: {
    includeAnalytics?: boolean;
    includeTasks?: boolean;
    includeMessages?: boolean;
    customBranding?: boolean;
    format?: string;
  };
}

export interface QueueStats {
  total: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  averageProcessingTime: number;
  queueWaitTime: number;
}

export class ExportQueue {
  private static jobs: Map<string, ExportJob> = new Map();
  private static processing: Set<string> = new Set();
  private static maxConcurrent = 3;
  private static processingInterval: NodeJS.Timeout | null = null;

  // Initialize the export queue
  static initialize() {
    if (!this.processingInterval) {
      this.processingInterval = setInterval(() => {
        this.processQueue();
      }, 1000);
    }
  }

  // Add export job to queue
  static async addJob(
    userId: string,
    projectId: string,
    type: ExportJob['type'],
    options: ExportJob['options'] = {},
    priority: ExportJob['priority'] = 'normal'
  ): Promise<string> {
    const jobId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: ExportJob = {
      id: jobId,
      userId,
      projectId,
      type,
      status: 'queued',
      priority,
      progress: 0,
      createdAt: new Date(),
      options
    };

    this.jobs.set(jobId, job);
    
    // Start processing if not already running
    this.initialize();
    
    return jobId;
  }

  // Process the export queue
  private static async processQueue() {
    // Get queued jobs sorted by priority and creation time
    const queuedJobs = Array.from(this.jobs.values())
      .filter(job => job.status === 'queued')
      .sort((a, b) => {
        // Priority order: urgent > high > normal > low
        const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        // If same priority, process older jobs first
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    // Process jobs up to max concurrent limit
    const availableSlots = this.maxConcurrent - this.processing.size;
    const jobsToProcess = queuedJobs.slice(0, availableSlots);

    for (const job of jobsToProcess) {
      this.processJob(job.id);
    }
  }

  // Process individual export job
  private static async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'queued') return;

    this.processing.add(jobId);
    
    // Update job status
    job.status = 'processing';
    job.startedAt = new Date();
    job.progress = 0;
    this.jobs.set(jobId, job);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        const currentJob = this.jobs.get(jobId);
        if (currentJob && currentJob.status === 'processing') {
          currentJob.progress = Math.min(currentJob.progress + Math.random() * 20, 90);
          this.jobs.set(jobId, currentJob);
        } else {
          clearInterval(progressInterval);
        }
      }, 500);

      // Process the export based on type
      let result;
      
      switch (job.type) {
        case 'pdf':
          result = await this.processPDFExport(job);
          break;
        case 'json':
          result = await this.processJSONExport(job);
          break;
        case 'csv':
          result = await this.processCSVExport(job);
          break;
        case 'pitch_deck':
          result = await this.processPitchDeckExport(job);
          break;
        case 'html':
          result = await this.processHTMLExport(job);
          break;
        default:
          throw new Error(`Unsupported export type: ${job.type}`);
      }

      clearInterval(progressInterval);

      // Complete the job
      job.status = 'completed';
      job.progress = 100;
      job.completedAt = new Date();
      job.result = result;
      
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
    } finally {
      this.processing.delete(jobId);
      this.jobs.set(jobId, job);
    }
  }

  // Process PDF export
  private static async processPDFExport(job: ExportJob): Promise<ExportJob['result']> {
    // Simulate processing time
    await this.delay(2000 + Math.random() * 3000);
    
    const filename = `${job.projectId}_report_${Date.now()}.pdf`;
    const url = `/api/exports/${job.id}/download`;
    
    return {
      url,
      filename,
      size: Math.floor(Math.random() * 5000000) + 1000000, // 1-5MB
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }

  // Process JSON export
  private static async processJSONExport(job: ExportJob): Promise<ExportJob['result']> {
    await this.delay(1000 + Math.random() * 2000);
    
    const filename = `${job.projectId}_data_${Date.now()}.json`;
    const url = `/api/exports/${job.id}/download`;
    
    return {
      url,
      filename,
      size: Math.floor(Math.random() * 1000000) + 100000, // 100KB-1MB
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  // Process CSV export
  private static async processCSVExport(job: ExportJob): Promise<ExportJob['result']> {
    await this.delay(500 + Math.random() * 1500);
    
    const filename = `${job.projectId}_tasks_${Date.now()}.csv`;
    const url = `/api/exports/${job.id}/download`;
    
    return {
      url,
      filename,
      size: Math.floor(Math.random() * 500000) + 50000, // 50KB-500KB
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  // Process pitch deck export
  private static async processPitchDeckExport(job: ExportJob): Promise<ExportJob['result']> {
    await this.delay(3000 + Math.random() * 5000);
    
    const filename = `${job.projectId}_pitch_${Date.now()}.pptx`;
    const url = `/api/exports/${job.id}/download`;
    
    return {
      url,
      filename,
      size: Math.floor(Math.random() * 10000000) + 5000000, // 5-10MB
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  // Process HTML export
  private static async processHTMLExport(job: ExportJob): Promise<ExportJob['result']> {
    await this.delay(1500 + Math.random() * 2500);
    
    const filename = `${job.projectId}_report_${Date.now()}.html`;
    const url = `/api/exports/${job.id}/download`;
    
    return {
      url,
      filename,
      size: Math.floor(Math.random() * 2000000) + 500000, // 500KB-2MB
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  // Utility delay function
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get job status
  static getJob(jobId: string): ExportJob | null {
    return this.jobs.get(jobId) || null;
  }

  // Get user's jobs
  static getUserJobs(userId: string): ExportJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Cancel a job
  static cancelJob(jobId: string, userId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.userId !== userId) return false;

    if (job.status === 'queued' || job.status === 'processing') {
      job.status = 'cancelled';
      job.completedAt = new Date();
      this.jobs.set(jobId, job);
      this.processing.delete(jobId);
      return true;
    }

    return false;
  }

  // Retry a failed job
  static retryJob(jobId: string, userId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.userId !== userId || job.status !== 'failed') return false;

    job.status = 'queued';
    job.progress = 0;
    job.error = undefined;
    job.startedAt = undefined;
    job.completedAt = undefined;
    job.result = undefined;
    
    this.jobs.set(jobId, job);
    return true;
  }

  // Get queue statistics
  static getQueueStats(): QueueStats {
    const jobs = Array.from(this.jobs.values());
    const completedJobs = jobs.filter(job => job.status === 'completed' && job.startedAt && job.completedAt);
    
    const averageProcessingTime = completedJobs.length > 0 
      ? completedJobs.reduce((sum, job) => {
          const processingTime = job.completedAt!.getTime() - job.startedAt!.getTime();
          return sum + processingTime;
        }, 0) / completedJobs.length
      : 0;

    const queuedJobs = jobs.filter(job => job.status === 'queued');
    const queueWaitTime = queuedJobs.length > 0
      ? Math.max(...queuedJobs.map(job => Date.now() - job.createdAt.getTime()))
      : 0;

    return {
      total: jobs.length,
      queued: jobs.filter(job => job.status === 'queued').length,
      processing: jobs.filter(job => job.status === 'processing').length,
      completed: jobs.filter(job => job.status === 'completed').length,
      failed: jobs.filter(job => job.status === 'failed').length,
      averageProcessingTime,
      queueWaitTime
    };
  }

  // Clean up old jobs
  static cleanupOldJobs(olderThanHours: number = 24) {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.completedAt && job.completedAt < cutoffTime) {
        this.jobs.delete(jobId);
      }
    }
  }

  // Set maximum concurrent exports
  static setMaxConcurrent(max: number) {
    this.maxConcurrent = Math.max(1, Math.min(max, 10)); // Limit between 1-10
  }

  // Get export limits based on subscription
  static getExportLimits(subscriptionTier: string): {
    maxConcurrent: number;
    maxDaily: number;
    maxFileSize: number;
    allowedFormats: string[];
  } {
    switch (subscriptionTier) {
      case 'free':
        return {
          maxConcurrent: 1,
          maxDaily: 5,
          maxFileSize: 10 * 1024 * 1024, // 10MB
          allowedFormats: ['json']
        };
      
      case 'student_pro':
      case 'hackathon_free':
        return {
          maxConcurrent: 2,
          maxDaily: 20,
          maxFileSize: 50 * 1024 * 1024, // 50MB
          allowedFormats: ['pdf', 'json', 'csv']
        };
      
      case 'hackathon_pro':
        return {
          maxConcurrent: 3,
          maxDaily: 50,
          maxFileSize: 100 * 1024 * 1024, // 100MB
          allowedFormats: ['pdf', 'json', 'csv', 'pitch_deck', 'html']
        };
      
      case 'organizer':
      case 'corporate':
        return {
          maxConcurrent: 5,
          maxDaily: -1, // Unlimited
          maxFileSize: 500 * 1024 * 1024, // 500MB
          allowedFormats: ['pdf', 'json', 'csv', 'pitch_deck', 'html']
        };
      
      default:
        return {
          maxConcurrent: 1,
          maxDaily: 5,
          maxFileSize: 10 * 1024 * 1024,
          allowedFormats: ['json']
        };
    }
  }

  // Check if user can export
  static canUserExport(userId: string, subscriptionTier: string): {
    canExport: boolean;
    reason?: string;
    dailyUsage?: number;
    dailyLimit?: number;
  } {
    const limits = this.getExportLimits(subscriptionTier);
    const userJobs = this.getUserJobs(userId);
    
    // Check daily limit
    if (limits.maxDaily !== -1) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayJobs = userJobs.filter(job => 
        job.createdAt >= today && 
        (job.status === 'completed' || job.status === 'processing' || job.status === 'queued')
      );
      
      if (todayJobs.length >= limits.maxDaily) {
        return {
          canExport: false,
          reason: `Daily export limit reached (${limits.maxDaily})`,
          dailyUsage: todayJobs.length,
          dailyLimit: limits.maxDaily
        };
      }
    }

    // Check concurrent limit
    const activeJobs = userJobs.filter(job => 
      job.status === 'processing' || job.status === 'queued'
    );
    
    if (activeJobs.length >= limits.maxConcurrent) {
      return {
        canExport: false,
        reason: `Maximum concurrent exports reached (${limits.maxConcurrent})`,
        dailyUsage: userJobs.filter(job => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return job.createdAt >= today;
        }).length,
        dailyLimit: limits.maxDaily
      };
    }

    return {
      canExport: true,
      dailyUsage: userJobs.filter(job => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return job.createdAt >= today;
      }).length,
      dailyLimit: limits.maxDaily
    };
  }

  // Shutdown the queue
  static shutdown() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}