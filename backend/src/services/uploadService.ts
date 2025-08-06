import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuration for different storage providers
export interface StorageConfig {
  provider: 'local' | 'supabase' | 's3' | 'cloudinary';
  local?: {
    uploadPath: string;
    publicUrl: string;
  };
  supabase?: {
    url: string;
    anonKey: string;
    bucket: string;
  };
  s3?: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
  };
  cloudinary?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
}

// Default configuration for local storage
const defaultConfig: StorageConfig = {
  provider: 'local',
  local: {
    uploadPath: path.join(__dirname, '../../uploads'),
    publicUrl: 'http://localhost:5000/uploads'
  }
};

export class UploadService {
  private config: StorageConfig;

  constructor(config: StorageConfig = defaultConfig) {
    this.config = config;
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory() {
    if (this.config.provider === 'local' && this.config.local) {
      const uploadPath = this.config.local.uploadPath;
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
    }
  }

  // Configure multer storage
  getMulterStorage() {
    if (this.config.provider === 'local') {
      return multer.diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = this.config.local!.uploadPath;
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          // Generate unique filename with timestamp and random string
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = path.extname(file.originalname);
          const baseName = path.basename(file.originalname, ext);
          const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
          cb(null, `${sanitizedBaseName}_${uniqueSuffix}${ext}`);
        }
      });
    }
    
    // For cloud providers, use memory storage and handle upload after
    return multer.memoryStorage();
  }

  // Configure multer instance
  getMulterConfig() {
    return multer({
      storage: this.getMulterStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Max 5 files per request
      },
      fileFilter: (req, file, cb) => {
        // Allow images, PDFs, and common document types
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} not allowed`));
        }
      }
    });
  }

  // Process uploaded files and return file info
  async processUploadedFiles(files: Express.Multer.File[], fieldName: string = 'files'): Promise<Array<{
    id: string;
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
    url: string;
    path: string;
  }>> {
    const processedFiles = [];

    for (const file of files) {
      let fileUrl: string;
      let filePath: string;

      if (this.config.provider === 'local') {
        // For local storage, file is already saved by multer
        filePath = file.path;
        fileUrl = `${this.config.local!.publicUrl}/${file.filename}`;
      } else {
        // For cloud providers, implement upload logic here
        // This is where you'd integrate with Supabase, S3, etc.
        throw new Error(`Cloud provider ${this.config.provider} not implemented yet`);
      }

      processedFiles.push({
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: fileUrl,
        path: filePath
      });
    }

    return processedFiles;
  }

  // Delete uploaded file
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (this.config.provider === 'local') {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          return true;
        }
      } else {
        // Implement cloud provider deletion
        throw new Error(`Cloud provider ${this.config.provider} deletion not implemented yet`);
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Get file URL
  getFileUrl(filename: string): string {
    if (this.config.provider === 'local') {
      return `${this.config.local!.publicUrl}/${filename}`;
    }
    // Implement for other providers
    return filename;
  }

  // Update configuration (useful for switching to production)
  updateConfig(newConfig: StorageConfig) {
    this.config = newConfig;
    this.ensureUploadDirectory();
  }
}

// Export singleton instance
export const uploadService = new UploadService();