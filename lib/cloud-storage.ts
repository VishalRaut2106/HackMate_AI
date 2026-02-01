import { SubscriptionService } from './subscription-service';
import { SubscriptionTier } from './types';

export interface CloudStorageProvider {
  name: string;
  id: string;
  icon: string;
  maxFileSize: number;
  supportedFormats: string[];
  authRequired: boolean;
}

export interface CloudFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  provider: string;
  uploadedAt: Date;
  uploadedBy: string;
  projectId: string;
  isPublic: boolean;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
  };
}

export interface StorageQuota {
  used: number;
  limit: number;
  provider: string;
}

export const CLOUD_PROVIDERS: CloudStorageProvider[] = [
  {
    name: 'Google Drive',
    id: 'google_drive',
    icon: '🗂️',
    maxFileSize: 100 * 1024 * 1024, // 100MB
    supportedFormats: ['*'],
    authRequired: true
  },
  {
    name: 'Dropbox',
    id: 'dropbox',
    icon: '📦',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    supportedFormats: ['*'],
    authRequired: true
  },
  {
    name: 'OneDrive',
    id: 'onedrive',
    icon: '☁️',
    maxFileSize: 100 * 1024 * 1024, // 100MB
    supportedFormats: ['*'],
    authRequired: true
  },
  {
    name: 'AWS S3',
    id: 'aws_s3',
    icon: '🪣',
    maxFileSize: 500 * 1024 * 1024, // 500MB
    supportedFormats: ['*'],
    authRequired: true
  },
  {
    name: 'Firebase Storage',
    id: 'firebase',
    icon: '🔥',
    maxFileSize: 200 * 1024 * 1024, // 200MB
    supportedFormats: ['*'],
    authRequired: false
  }
];

export class CloudStorageService {
  private static connections: Map<string, any> = new Map();
  private static files: Map<string, CloudFile[]> = new Map();

  // Initialize cloud storage for a user
  static async initializeStorage(userId: string, subscriptionTier: SubscriptionTier) {
    const limits = SubscriptionService.getLimits(subscriptionTier);
    
    // Initialize default providers based on subscription
    const availableProviders = this.getAvailableProviders(subscriptionTier);
    
    for (const provider of availableProviders) {
      await this.initializeProvider(userId, provider.id);
    }
  }

  // Get available providers based on subscription
  static getAvailableProviders(subscriptionTier: SubscriptionTier): CloudStorageProvider[] {
    const limits = SubscriptionService.getLimits(subscriptionTier);
    
    if (subscriptionTier === 'free') {
      return CLOUD_PROVIDERS.filter(p => p.id === 'firebase');
    }
    
    if (subscriptionTier === 'student_pro' || subscriptionTier === 'hackathon_free') {
      return CLOUD_PROVIDERS.filter(p => 
        ['firebase', 'google_drive', 'dropbox'].includes(p.id)
      );
    }
    
    // Pro and enterprise tiers get all providers
    return CLOUD_PROVIDERS;
  }

  // Initialize a specific provider
  static async initializeProvider(userId: string, providerId: string) {
    const provider = CLOUD_PROVIDERS.find(p => p.id === providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);

    try {
      let connection;
      
      switch (providerId) {
        case 'google_drive':
          connection = await this.initializeGoogleDrive(userId);
          break;
        case 'dropbox':
          connection = await this.initializeDropbox(userId);
          break;
        case 'onedrive':
          connection = await this.initializeOneDrive(userId);
          break;
        case 'aws_s3':
          connection = await this.initializeAWSS3(userId);
          break;
        case 'firebase':
          connection = await this.initializeFirebase(userId);
          break;
        default:
          throw new Error(`Provider ${providerId} not implemented`);
      }

      this.connections.set(`${userId}_${providerId}`, connection);
      return connection;
    } catch (error) {
      console.error(`Failed to initialize ${providerId}:`, error);
      throw error;
    }
  }

  // Google Drive integration
  private static async initializeGoogleDrive(userId: string) {
    // In a real implementation, this would use Google Drive API
    return {
      provider: 'google_drive',
      authenticated: false,
      quota: { used: 0, limit: 15 * 1024 * 1024 * 1024 }, // 15GB
      authUrl: `https://accounts.google.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT&scope=https://www.googleapis.com/auth/drive.file&response_type=code&state=${userId}`
    };
  }

  // Dropbox integration
  private static async initializeDropbox(userId: string) {
    return {
      provider: 'dropbox',
      authenticated: false,
      quota: { used: 0, limit: 2 * 1024 * 1024 * 1024 }, // 2GB
      authUrl: `https://www.dropbox.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT&response_type=code&state=${userId}`
    };
  }

  // OneDrive integration
  private static async initializeOneDrive(userId: string) {
    return {
      provider: 'onedrive',
      authenticated: false,
      quota: { used: 0, limit: 5 * 1024 * 1024 * 1024 }, // 5GB
      authUrl: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_REDIRECT&scope=files.readwrite&state=${userId}`
    };
  }

  // AWS S3 integration
  private static async initializeAWSS3(userId: string) {
    return {
      provider: 'aws_s3',
      authenticated: false,
      quota: { used: 0, limit: -1 }, // Unlimited with proper billing
      requiresConfig: true,
      configFields: ['accessKeyId', 'secretAccessKey', 'region', 'bucketName']
    };
  }

  // Firebase Storage integration
  private static async initializeFirebase(userId: string) {
    return {
      provider: 'firebase',
      authenticated: true, // Uses existing Firebase auth
      quota: { used: 0, limit: 1 * 1024 * 1024 * 1024 }, // 1GB free
    };
  }

  // Upload file to cloud storage
  static async uploadFile(
    userId: string,
    projectId: string,
    file: File,
    providerId: string,
    options: {
      isPublic?: boolean;
      folder?: string;
      generateThumbnail?: boolean;
    } = {}
  ): Promise<CloudFile> {
    const provider = CLOUD_PROVIDERS.find(p => p.id === providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);

    // Check file size
    if (file.size > provider.maxFileSize) {
      throw new Error(`File size exceeds ${provider.maxFileSize / (1024 * 1024)}MB limit for ${provider.name}`);
    }

    // Check subscription limits
    const quota = await this.getStorageQuota(userId, providerId);
    if (quota.limit !== -1 && quota.used + file.size > quota.limit) {
      throw new Error('Storage quota exceeded');
    }

    const connection = this.connections.get(`${userId}_${providerId}`);
    if (!connection) {
      throw new Error(`${provider.name} not connected`);
    }

    try {
      let uploadResult;
      
      switch (providerId) {
        case 'google_drive':
          uploadResult = await this.uploadToGoogleDrive(connection, file, options);
          break;
        case 'dropbox':
          uploadResult = await this.uploadToDropbox(connection, file, options);
          break;
        case 'onedrive':
          uploadResult = await this.uploadToOneDrive(connection, file, options);
          break;
        case 'aws_s3':
          uploadResult = await this.uploadToAWSS3(connection, file, options);
          break;
        case 'firebase':
          uploadResult = await this.uploadToFirebase(connection, file, options);
          break;
        default:
          throw new Error(`Upload not implemented for ${providerId}`);
      }

      const cloudFile: CloudFile = {
        id: `${providerId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: uploadResult.url,
        downloadUrl: uploadResult.downloadUrl,
        thumbnailUrl: uploadResult.thumbnailUrl,
        provider: providerId,
        uploadedAt: new Date(),
        uploadedBy: userId,
        projectId,
        isPublic: options.isPublic || false,
        metadata: uploadResult.metadata
      };

      // Store file reference
      const projectFiles = this.files.get(projectId) || [];
      projectFiles.push(cloudFile);
      this.files.set(projectId, projectFiles);

      return cloudFile;
    } catch (error) {
      console.error(`Upload to ${provider.name} failed:`, error);
      throw error;
    }
  }

  // Provider-specific upload implementations
  private static async uploadToGoogleDrive(connection: any, file: File, options: any) {
    // Mock implementation - in reality would use Google Drive API
    const fileId = `gdrive_${Date.now()}`;
    return {
      url: `https://drive.google.com/file/d/${fileId}/view`,
      downloadUrl: `https://drive.google.com/uc?id=${fileId}`,
      thumbnailUrl: file.type.startsWith('image/') ? `https://drive.google.com/thumbnail?id=${fileId}` : undefined,
      metadata: await this.extractFileMetadata(file)
    };
  }

  private static async uploadToDropbox(connection: any, file: File, options: any) {
    const path = `/${options.folder || 'hackmate'}/${file.name}`;
    return {
      url: `https://www.dropbox.com/s/mockid/${file.name}`,
      downloadUrl: `https://dl.dropboxusercontent.com/s/mockid/${file.name}`,
      thumbnailUrl: undefined,
      metadata: await this.extractFileMetadata(file)
    };
  }

  private static async uploadToOneDrive(connection: any, file: File, options: any) {
    const itemId = `onedrive_${Date.now()}`;
    return {
      url: `https://1drv.ms/mockshare/${itemId}`,
      downloadUrl: `https://api.onedrive.com/v1.0/shares/${itemId}/root/content`,
      thumbnailUrl: undefined,
      metadata: await this.extractFileMetadata(file)
    };
  }

  private static async uploadToAWSS3(connection: any, file: File, options: any) {
    const key = `${options.folder || 'hackmate'}/${Date.now()}_${file.name}`;
    const bucket = connection.bucketName || 'hackmate-storage';
    
    return {
      url: `https://${bucket}.s3.amazonaws.com/${key}`,
      downloadUrl: `https://${bucket}.s3.amazonaws.com/${key}`,
      thumbnailUrl: undefined,
      metadata: await this.extractFileMetadata(file)
    };
  }

  private static async uploadToFirebase(connection: any, file: File, options: any) {
    // Mock Firebase Storage upload
    const path = `projects/${options.folder || 'files'}/${Date.now()}_${file.name}`;
    
    return {
      url: `https://firebasestorage.googleapis.com/v0/b/hackmate-ai.appspot.com/o/${encodeURIComponent(path)}?alt=media`,
      downloadUrl: `https://firebasestorage.googleapis.com/v0/b/hackmate-ai.appspot.com/o/${encodeURIComponent(path)}?alt=media`,
      thumbnailUrl: undefined,
      metadata: await this.extractFileMetadata(file)
    };
  }

  // Extract file metadata
  private static async extractFileMetadata(file: File): Promise<CloudFile['metadata']> {
    const metadata: CloudFile['metadata'] = {};

    if (file.type.startsWith('image/')) {
      try {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            metadata.width = img.width;
            metadata.height = img.height;
            URL.revokeObjectURL(url);
            resolve(void 0);
          };
          img.onerror = reject;
          img.src = url;
        });
      } catch (error) {
        console.warn('Failed to extract image metadata:', error);
      }
    }

    if (file.type.startsWith('video/')) {
      try {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            metadata.width = video.videoWidth;
            metadata.height = video.videoHeight;
            metadata.duration = video.duration;
            URL.revokeObjectURL(url);
            resolve(void 0);
          };
          video.onerror = reject;
          video.src = url;
        });
      } catch (error) {
        console.warn('Failed to extract video metadata:', error);
      }
    }

    return metadata;
  }

  // Get storage quota for a provider
  static async getStorageQuota(userId: string, providerId: string): Promise<StorageQuota> {
    const connection = this.connections.get(`${userId}_${providerId}`);
    if (!connection) {
      return { used: 0, limit: 0, provider: providerId };
    }

    // In a real implementation, this would query the actual provider
    return connection.quota || { used: 0, limit: 0, provider: providerId };
  }

  // Get all files for a project
  static getProjectFiles(projectId: string): CloudFile[] {
    return this.files.get(projectId) || [];
  }

  // Delete a file
  static async deleteFile(userId: string, fileId: string): Promise<void> {
    // Find the file across all projects
    for (const [projectId, files] of this.files.entries()) {
      const fileIndex = files.findIndex(f => f.id === fileId);
      if (fileIndex !== -1) {
        const file = files[fileIndex];
        
        // Check permissions
        if (file.uploadedBy !== userId) {
          throw new Error('Permission denied');
        }

        // Delete from provider (mock implementation)
        await this.deleteFromProvider(file);
        
        // Remove from local storage
        files.splice(fileIndex, 1);
        this.files.set(projectId, files);
        return;
      }
    }
    
    throw new Error('File not found');
  }

  // Delete file from cloud provider
  private static async deleteFromProvider(file: CloudFile): Promise<void> {
    // Mock implementation - in reality would call provider APIs
    console.log(`Deleting file ${file.name} from ${file.provider}`);
  }

  // Sync files from cloud provider
  static async syncFiles(userId: string, projectId: string, providerId: string): Promise<CloudFile[]> {
    const connection = this.connections.get(`${userId}_${providerId}`);
    if (!connection) {
      throw new Error(`${providerId} not connected`);
    }

    // Mock implementation - in reality would fetch from provider
    const existingFiles = this.getProjectFiles(projectId);
    return existingFiles.filter(f => f.provider === providerId);
  }

  // Get file sharing link
  static async getShareLink(fileId: string, expiresIn?: number): Promise<string> {
    // Find the file
    for (const files of this.files.values()) {
      const file = files.find(f => f.id === fileId);
      if (file) {
        // Generate temporary share link
        const expiry = expiresIn ? Date.now() + expiresIn : undefined;
        const token = btoa(JSON.stringify({ fileId, expiry }));
        return `${window.location.origin}/api/files/share/${token}`;
      }
    }
    
    throw new Error('File not found');
  }

  // Check if user has connected a provider
  static isProviderConnected(userId: string, providerId: string): boolean {
    const connection = this.connections.get(`${userId}_${providerId}`);
    return connection && connection.authenticated;
  }

  // Get connection status for all providers
  static getConnectionStatus(userId: string): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    CLOUD_PROVIDERS.forEach(provider => {
      status[provider.id] = this.isProviderConnected(userId, provider.id);
    });
    
    return status;
  }

  // Disconnect a provider
  static async disconnectProvider(userId: string, providerId: string): Promise<void> {
    const connectionKey = `${userId}_${providerId}`;
    
    if (this.connections.has(connectionKey)) {
      // In a real implementation, would revoke tokens/permissions
      this.connections.delete(connectionKey);
    }
  }

  // Get total storage usage across all providers
  static async getTotalStorageUsage(userId: string): Promise<{
    used: number;
    limit: number;
    byProvider: Record<string, StorageQuota>;
  }> {
    const byProvider: Record<string, StorageQuota> = {};
    let totalUsed = 0;
    let totalLimit = 0;

    for (const provider of CLOUD_PROVIDERS) {
      try {
        const quota = await this.getStorageQuota(userId, provider.id);
        byProvider[provider.id] = quota;
        totalUsed += quota.used;
        if (quota.limit !== -1) {
          totalLimit += quota.limit;
        }
      } catch (error) {
        console.warn(`Failed to get quota for ${provider.id}:`, error);
      }
    }

    return {
      used: totalUsed,
      limit: totalLimit === 0 ? -1 : totalLimit,
      byProvider
    };
  }
}