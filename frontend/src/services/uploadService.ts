// Frontend Upload Service - Handles file uploads to Vercel Blob via backend API
import { apiClient } from './api';

export interface UploadedFile {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
  pathname: string;
  downloadUrl?: string;
}

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

export class UploadService {
  // Upload files for a specific entity (requires authentication)
  async uploadFiles(
    entityType: string,
    files: File[],
    entityId?: string,
    options?: UploadOptions
  ): Promise<UploadedFile[]> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const endpoint = entityId 
        ? `/api/uploads/${entityType}/${entityId}`
        : `/api/uploads/${entityType}`;

      console.log(`[UploadService] Uploading ${files.length} files to ${endpoint}`);

      const response = await this.uploadWithProgress(endpoint, formData, options);

      if (response.success && response.files) {
        console.log(`[UploadService] Successfully uploaded ${response.files.length} files`);
        return response.files;
      } else {
        throw new Error('Upload failed: No files processed');
      }
    } catch (error) {
      console.error('[UploadService] Upload error:', error);
      throw error;
    }
  }

  // Upload a single file
  async uploadFile(
    entityType: string,
    file: File,
    entityId?: string,
    options?: UploadOptions
  ): Promise<UploadedFile> {
    const files = await this.uploadFiles(entityType, [file], entityId, options);
    return files[0];
  }

  // Upload files to portal (public access)
  async uploadPortalFiles(
    portalSlug: string,
    files: File[],
    options?: UploadOptions
  ): Promise<UploadedFile[]> {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const endpoint = `/api/portals/public/${portalSlug}/upload`;

      console.log(`[UploadService] Uploading ${files.length} files to portal ${portalSlug}`);

      const response = await this.uploadWithProgress(endpoint, formData, options);

      if (response.success && response.files) {
        console.log(`[UploadService] Successfully uploaded ${response.files.length} files to portal`);
        return response.files;
      } else {
        throw new Error('Portal upload failed: No files processed');
      }
    } catch (error) {
      console.error('[UploadService] Portal upload error:', error);
      throw error;
    }
  }

  // Upload asset images
  async uploadAssetImages(
    assetId: string,
    images: File[],
    options?: UploadOptions
  ): Promise<UploadedFile[]> {
    return this.uploadFiles('assets', images, assetId, options);
  }

  // Upload work order attachments
  async uploadWorkOrderAttachments(
    workOrderId: string,
    files: File[],
    options?: UploadOptions
  ): Promise<UploadedFile[]> {
    return this.uploadFiles('work-orders', files, workOrderId, options);
  }

  // Upload user avatar
  async uploadUserAvatar(
    userId: string,
    avatarFile: File,
    options?: UploadOptions
  ): Promise<UploadedFile> {
    return this.uploadFile('users', avatarFile, userId, options);
  }

  // Upload part images
  async uploadPartImages(
    partId: string,
    images: File[],
    options?: UploadOptions
  ): Promise<UploadedFile[]> {
    return this.uploadFiles('parts', images, partId, options);
  }

  // Upload location images
  async uploadLocationImages(
    locationId: string,
    images: File[],
    options?: UploadOptions
  ): Promise<UploadedFile[]> {
    return this.uploadFiles('locations', images, locationId, options);
  }

  // Private method to handle upload with progress tracking
  private async uploadWithProgress(
    endpoint: string,
    formData: FormData,
    options?: UploadOptions
  ): Promise<{ success: boolean; files: UploadedFile[] }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Set up progress tracking
      if (options?.onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            options.onProgress!(progress);
          }
        });
      }

      // Set up abort signal
      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }

      // Handle response
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was aborted'));
      });

      // Add authentication headers
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // Send request
      xhr.open('POST', endpoint);
      xhr.send(formData);
    });
  }

  // Validate file before upload
  validateFile(
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {}
  ): { valid: boolean; error?: string } {
    const {
      maxSize = 100 * 1024 * 1024, // 100MB default
      allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.doc', '.docx']
    } = options;

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(maxSize)})`
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed`
      };
    }

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `File extension ${fileExtension} is not allowed`
      };
    }

    return { valid: true };
  }

  // Validate multiple files
  validateFiles(
    files: File[],
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      allowedExtensions?: string[];
      maxCount?: number;
    } = {}
  ): { valid: boolean; errors: string[] } {
    const { maxCount = 10 } = options;
    const errors: string[] = [];

    // Check file count
    if (files.length > maxCount) {
      errors.push(`Cannot upload more than ${maxCount} files at once`);
    }

    // Validate each file
    files.forEach((file, index) => {
      const validation = this.validateFile(file, options);
      if (!validation.valid) {
        errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Utility function to format file sizes
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get supported file types for UI display
  getSupportedFileTypes(): string[] {
    return [
      'JPEG/JPG Images',
      'PNG Images', 
      'GIF Images',
      'WebP Images',
      'PDF Documents',
      'Text Files',
      'Word Documents'
    ];
  }

  // Get maximum file size for UI display
  getMaxFileSize(): string {
    return '100 MB';
  }
}

// Export singleton instance
export const uploadService = new UploadService();