import { put, del, list } from '@vercel/blob';
import multer from 'multer';
import path from 'path';

export interface BlobFile {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
  pathname: string;
  downloadUrl?: string;
}

export class BlobUploadService {
  private token: string;

  constructor() {
    this.token = process.env.BLOB_READ_WRITE_TOKEN!;
    
    if (!this.token) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required for Vercel Blob storage');
    }
  }

  // Configure multer for in-memory storage (required for Vercel Blob)
  getMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit (increased for Vercel Blob)
        files: 10 // Max 10 files per request
      },
      fileFilter: (req, file, cb) => {
        // Allow images, PDFs, and common document types
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
          'application/pdf',
          'text/plain',
          'text/csv',
          'application/json',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/zip',
          'application/x-zip-compressed',
          'video/mp4',
          'video/quicktime',
          'audio/mpeg',
          'audio/wav'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} not allowed`));
        }
      }
    });
  }

  // Generate a unique filename with proper organization
  private generateFileName(originalName: string, folder: string = 'uploads'): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50); // Limit length
    
    return `${folder}/${timestamp}/${sanitizedBaseName}_${uniqueSuffix}${ext}`;
  }

  // Upload a single file to Vercel Blob
  async uploadFile(
    file: Express.Multer.File, 
    folder: string = 'uploads',
    options: {
      access?: 'public';
      addRandomSuffix?: boolean;
      cacheControlMaxAge?: number;
    } = {}
  ): Promise<BlobFile> {
    try {
      const pathname = options.addRandomSuffix 
        ? `${folder}/${file.originalname}`
        : this.generateFileName(file.originalname, folder);

      console.log(`[BlobUploadService] Uploading file: ${pathname} (${file.size} bytes)`);

      const blob = await put(pathname, file.buffer, {
        access: options.access || 'public',
        addRandomSuffix: options.addRandomSuffix || false,
        cacheControlMaxAge: options.cacheControlMaxAge || 86400, // 1 day default
        token: this.token
      });

      const result: BlobFile = {
        id: `blob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: blob.pathname.split('/').pop() || file.originalname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: blob.url,
        pathname: blob.pathname,
        downloadUrl: blob.downloadUrl
      };

      console.log(`[BlobUploadService] File uploaded successfully: ${blob.url}`);
      return result;

    } catch (error) {
      console.error(`[BlobUploadService] Error uploading file ${file.originalname}:`, error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Process multiple uploaded files
  async processUploadedFiles(
    files: Express.Multer.File[], 
    folder: string = 'uploads',
    options: {
      access?: 'public';
      addRandomSuffix?: boolean;
      cacheControlMaxAge?: number;
    } = {}
  ): Promise<BlobFile[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, folder, options));
    
    try {
      const results = await Promise.all(uploadPromises);
      console.log(`[BlobUploadService] Successfully uploaded ${results.length} files`);
      return results;
    } catch (error) {
      console.error('[BlobUploadService] Error uploading files:', error);
      throw error;
    }
  }

  // Upload a file from buffer or stream
  async uploadFromBuffer(
    buffer: Buffer,
    filename: string,
    mimetype: string,
    folder: string = 'uploads',
    options: {
      access?: 'public';
      addRandomSuffix?: boolean;
      cacheControlMaxAge?: number;
    } = {}
  ): Promise<BlobFile> {
    try {
      const pathname = options.addRandomSuffix 
        ? `${folder}/${filename}`
        : this.generateFileName(filename, folder);

      console.log(`[BlobUploadService] Uploading buffer as: ${pathname} (${buffer.length} bytes)`);

      const blob = await put(pathname, buffer, {
        access: options.access || 'public',
        addRandomSuffix: options.addRandomSuffix || false,
        cacheControlMaxAge: options.cacheControlMaxAge || 86400,
        token: this.token
      });

      const result: BlobFile = {
        id: `blob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: blob.pathname.split('/').pop() || filename,
        originalname: filename,
        mimetype: mimetype,
        size: buffer.length,
        url: blob.url,
        pathname: blob.pathname,
        downloadUrl: blob.downloadUrl
      };

      console.log(`[BlobUploadService] Buffer uploaded successfully: ${blob.url}`);
      return result;

    } catch (error) {
      console.error(`[BlobUploadService] Error uploading buffer as ${filename}:`, error);
      throw new Error(`Failed to upload buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete a file from Vercel Blob
  async deleteFile(url: string): Promise<boolean> {
    try {
      console.log(`[BlobUploadService] Deleting file: ${url}`);
      
      await del(url, { token: this.token });
      
      console.log(`[BlobUploadService] File deleted successfully: ${url}`);
      return true;
    } catch (error) {
      console.error(`[BlobUploadService] Error deleting file ${url}:`, error);
      return false;
    }
  }

  // List files in a specific folder
  async listFiles(
    prefix?: string,
    limit: number = 1000,
    cursor?: string
  ): Promise<{
    blobs: Array<{
      url: string;
      pathname: string;
      size: number;
      uploadedAt: Date;
      downloadUrl: string;
    }>;
    cursor?: string;
    hasMore: boolean;
  }> {
    try {
      console.log(`[BlobUploadService] Listing files with prefix: ${prefix || 'all'}`);
      
      const result = await list({
        prefix,
        limit,
        cursor,
        token: this.token
      });

      console.log(`[BlobUploadService] Found ${result.blobs.length} files`);
      
      return {
        blobs: result.blobs,
        cursor: result.cursor,
        hasMore: result.hasMore
      };
    } catch (error) {
      console.error('[BlobUploadService] Error listing files:', error);
      throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get a file URL (for existing files)
  getFileUrl(pathname: string): string {
    // Vercel Blob URLs follow a predictable pattern
    // This is a helper method for constructing URLs from pathnames
    return pathname;
  }

  // Check if service is properly configured
  isConfigured(): boolean {
    return !!this.token;
  }

  // Get service info
  getServiceInfo() {
    return {
      provider: 'vercel-blob',
      configured: this.isConfigured(),
      features: [
        'Global CDN delivery',
        'Automatic optimization',
        'Large file support (up to 100MB)',
        'Built-in caching',
        'Secure uploads'
      ]
    };
  }
}

// Export singleton instance with error handling
let blobUploadServiceInstance: BlobUploadService;

try {
  console.log('[BlobUploadService] Initializing Vercel Blob upload service...');
  blobUploadServiceInstance = new BlobUploadService();
  console.log('[BlobUploadService] Vercel Blob upload service initialized successfully');
} catch (error) {
  console.error('[BlobUploadService] Failed to initialize Vercel Blob upload service:', error);
  // Don't create a fallback instance - if Blob service fails, we should know about it
  throw error;
}

export const blobUploadService = blobUploadServiceInstance;