// Portal Offline Service - Handles offline submission and sync
import { offlineStorage } from './offlineStorage';
import { portalService } from './portalService';
import type { 
  OfflinePortalSubmission, 
  SubmitPortalRequest, 
  Portal, 
  PortalField,
  PortalBranding 
} from '../types/portal';

export class PortalOfflineService {
  private syncInProgress = false;
  private retryTimeouts = new Map<string, NodeJS.Timeout>();
  private maxRetries = 5;
  private baseRetryDelay = 2000; // 2 seconds

  constructor() {
    // Auto-sync when online
    window.addEventListener('online', () => {
      this.syncPendingSubmissions();
    });

    // Periodic sync every 5 minutes when online
    setInterval(() => {
      if (navigator.onLine && !this.syncInProgress) {
        this.syncPendingSubmissions();
      }
    }, 5 * 60 * 1000);
  }

  // Store portal data for offline access
  async cachePortalData(portalSlug: string): Promise<void> {
    try {
      const portalData = await portalService.getPublicPortal(portalSlug);
      
      await offlineStorage.cacheQuery(
        `portal:${portalSlug}`,
        portalData,
        24 * 60 * 60 * 1000 // 24 hours TTL
      );

      console.log(`Portal data cached for offline access: ${portalSlug}`);
    } catch (error) {
      console.error('Failed to cache portal data:', error);
      throw error;
    }
  }

  // Get cached portal data when offline
  async getCachedPortalData(portalSlug: string): Promise<{
    portal: Omit<Portal, 'internalSettings'>;
    fields: PortalField[];
    branding: PortalBranding;
  } | null> {
    try {
      return await offlineStorage.getCachedQuery(`portal:${portalSlug}`);
    } catch (error) {
      console.error('Failed to retrieve cached portal data:', error);
      return null;
    }
  }

  // Store submission offline when network is unavailable
  async storeOfflineSubmission(submission: SubmitPortalRequest, files: File[] = []): Promise<string> {
    const offlineSubmission: OfflinePortalSubmission = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      portalSlug: submission.portalSlug,
      formData: submission.formData,
      files,
      submissionMetadata: {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        location: submission.submitterLocation,
      },
      status: 'pending',
      retryCount: 0,
    };

    // Store in IndexedDB
    await offlineStorage.performOperation('offlineSubmissions', 'readwrite', (store) => 
      store.put(offlineSubmission)
    );

    // Store files separately
    for (const file of files) {
      const fileData = await this.fileToArrayBuffer(file);
      await offlineStorage.performOperation('offlineFiles', 'readwrite', (store) => 
        store.put({
          id: `${offlineSubmission.id}_${file.name}`,
          submissionId: offlineSubmission.id,
          filename: file.name,
          type: file.type,
          size: file.size,
          data: fileData,
        })
      );
    }

    console.log('Submission stored offline:', offlineSubmission.id);
    return offlineSubmission.id;
  }

  // Get all pending offline submissions
  async getPendingSubmissions(): Promise<OfflinePortalSubmission[]> {
    try {
      return await offlineStorage.performOperation('offlineSubmissions', 'readonly', (store) => {
        const index = store.index('status');
        return index.getAll('pending');
      });
    } catch (error) {
      console.error('Failed to get pending submissions:', error);
      return [];
    }
  }

  // Sync all pending submissions when online
  async syncPendingSubmissions(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;
    console.log('Starting sync of pending portal submissions...');

    try {
      const pendingSubmissions = await this.getPendingSubmissions();
      
      for (const submission of pendingSubmissions) {
        try {
          await this.syncSubmission(submission);
        } catch (error) {
          console.error(`Failed to sync submission ${submission.id}:`, error);
          await this.handleSyncError(submission, error);
        }
      }
    } catch (error) {
      console.error('Error during submission sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync individual submission
  private async syncSubmission(offlineSubmission: OfflinePortalSubmission): Promise<void> {
    // Update status to syncing
    await this.updateSubmissionStatus(offlineSubmission.id, 'syncing');

    try {
      // Reconstruct files from stored data
      const files = await this.getSubmissionFiles(offlineSubmission.id);
      const fileIds: string[] = [];

      // Upload files first if any
      for (const fileData of files) {
        try {
          const file = this.arrayBufferToFile(fileData.data, fileData.filename, fileData.type);
          const uploadResult = await portalService.uploadSubmissionFile(
            offlineSubmission.portalSlug,
            file,
            'attachment', // Default field name - could be enhanced
            offlineSubmission.id
          );
          fileIds.push(uploadResult.fileId);
        } catch (fileError) {
          console.error(`Failed to upload file ${fileData.filename}:`, fileError);
          // Continue with submission even if file upload fails
        }
      }

      // Submit the form data
      const submitRequest: SubmitPortalRequest = {
        portalSlug: offlineSubmission.portalSlug,
        formData: offlineSubmission.formData,
        submitterName: offlineSubmission.formData.submitterName,
        submitterEmail: offlineSubmission.formData.submitterEmail,
        submitterPhone: offlineSubmission.formData.submitterPhone,
        submitterLocation: offlineSubmission.submissionMetadata.location,
        fileIds,
        sessionId: offlineSubmission.id,
        userAgent: offlineSubmission.submissionMetadata.userAgent,
      };

      const result = await portalService.submitPortal(submitRequest);
      
      // Mark as synced
      await this.updateSubmissionStatus(offlineSubmission.id, 'synced');
      
      // Clean up offline data
      await this.cleanupSubmissionData(offlineSubmission.id);
      
      console.log(`Successfully synced submission ${offlineSubmission.id}, tracking code: ${result.trackingCode}`);
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('portalSubmissionSynced', {
        detail: { 
          offlineId: offlineSubmission.id, 
          trackingCode: result.trackingCode,
          submissionId: result.submissionId 
        }
      }));

    } catch (error) {
      await this.updateSubmissionStatus(offlineSubmission.id, 'failed');
      throw error;
    }
  }

  // Handle sync errors with exponential backoff
  private async handleSyncError(submission: OfflinePortalSubmission, error: any): Promise<void> {
    const newRetryCount = submission.retryCount + 1;
    
    if (newRetryCount >= this.maxRetries) {
      console.error(`Max retries reached for submission ${submission.id}`);
      await this.updateSubmissionStatus(submission.id, 'failed');
      return;
    }

    // Update retry count
    await offlineStorage.performOperation('offlineSubmissions', 'readwrite', (store) => {
      const updatedSubmission = {
        ...submission,
        retryCount: newRetryCount,
        lastSyncAttempt: Date.now(),
        syncError: error.message || 'Unknown error',
        status: 'pending' as const,
      };
      return store.put(updatedSubmission);
    });

    // Schedule retry with exponential backoff
    const retryDelay = this.baseRetryDelay * Math.pow(2, newRetryCount - 1);
    const timeoutId = setTimeout(() => {
      this.retryTimeouts.delete(submission.id);
      if (navigator.onLine) {
        this.syncSubmission(submission).catch(console.error);
      }
    }, retryDelay);

    this.retryTimeouts.set(submission.id, timeoutId);
    console.log(`Scheduled retry for submission ${submission.id} in ${retryDelay}ms (attempt ${newRetryCount})`);
  }

  // Update submission status
  private async updateSubmissionStatus(
    submissionId: string, 
    status: OfflinePortalSubmission['status']
  ): Promise<void> {
    await offlineStorage.performOperation('offlineSubmissions', 'readwrite', (store) => {
      const getRequest = store.get(submissionId);
      getRequest.onsuccess = () => {
        const submission = getRequest.result;
        if (submission) {
          submission.status = status;
          submission.lastSyncAttempt = Date.now();
          store.put(submission);
        }
      };
      return getRequest;
    });
  }

  // Get files associated with a submission
  private async getSubmissionFiles(submissionId: string): Promise<Array<{
    filename: string;
    type: string;
    size: number;
    data: ArrayBuffer;
  }>> {
    try {
      return await offlineStorage.performOperation('offlineFiles', 'readonly', (store) => {
        const index = store.index('submissionId');
        return index.getAll(submissionId);
      });
    } catch (error) {
      console.error('Failed to get submission files:', error);
      return [];
    }
  }

  // Clean up synced submission data
  private async cleanupSubmissionData(submissionId: string): Promise<void> {
    try {
      // Remove submission
      await offlineStorage.performOperation('offlineSubmissions', 'readwrite', (store) => 
        store.delete(submissionId)
      );

      // Remove associated files
      const files = await this.getSubmissionFiles(submissionId);
      await offlineStorage.performOperation('offlineFiles', 'readwrite', (store) => {
        const deletePromises = files.map(file => store.delete(`${submissionId}_${file.filename}`));
        return deletePromises[0] || store.count(); // Return first delete request or a count request
      });

      console.log(`Cleaned up offline data for submission ${submissionId}`);
    } catch (error) {
      console.error('Failed to cleanup submission data:', error);
    }
  }

  // Check if portal is available offline
  async isPortalAvailableOffline(portalSlug: string): Promise<boolean> {
    const cachedData = await this.getCachedPortalData(portalSlug);
    return cachedData !== null;
  }

  // Get offline submission statistics
  async getOfflineStats(): Promise<{
    pendingCount: number;
    syncingCount: number;
    failedCount: number;
    lastSyncTime: number | null;
  }> {
    try {
      const allSubmissions = await offlineStorage.performOperation('offlineSubmissions', 'readonly', (store) => 
        store.getAll()
      );

      const stats = {
        pendingCount: 0,
        syncingCount: 0,
        failedCount: 0,
        lastSyncTime: null as number | null,
      };

      for (const submission of allSubmissions) {
        switch (submission.status) {
          case 'pending':
            stats.pendingCount++;
            break;
          case 'syncing':
            stats.syncingCount++;
            break;
          case 'failed':
            stats.failedCount++;
            break;
        }

        if (submission.lastSyncAttempt && 
            (stats.lastSyncTime === null || submission.lastSyncAttempt > stats.lastSyncTime)) {
          stats.lastSyncTime = submission.lastSyncAttempt;
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get offline stats:', error);
      return {
        pendingCount: 0,
        syncingCount: 0,
        failedCount: 0,
        lastSyncTime: null,
      };
    }
  }

  // Clear all offline submission data
  async clearAllOfflineData(): Promise<void> {
    try {
      await offlineStorage.performOperation('offlineSubmissions', 'readwrite', (store) => 
        store.clear()
      );
      await offlineStorage.performOperation('offlineFiles', 'readwrite', (store) => 
        store.clear()
      );

      // Clear retry timeouts
      this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
      this.retryTimeouts.clear();

      console.log('All offline portal data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }

  // Utility: Convert File to ArrayBuffer
  private async fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  // Utility: Convert ArrayBuffer to File
  private arrayBufferToFile(buffer: ArrayBuffer, filename: string, type: string): File {
    return new File([buffer], filename, { type });
  }

  // Pre-cache multiple portals for offline access
  async preloadPortalsForOffline(portalSlugs: string[]): Promise<void> {
    console.log(`Pre-loading ${portalSlugs.length} portals for offline access...`);
    
    const results = await Promise.allSettled(
      portalSlugs.map(slug => this.cachePortalData(slug))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Portal preload complete: ${successful} successful, ${failed} failed`);
  }

  // Validate offline submission before storing
  async validateOfflineSubmission(
    portalSlug: string, 
    formData: Record<string, any>
  ): Promise<{
    isValid: boolean;
    errors: Array<{ field: string; message: string }>;
  }> {
    const cachedPortalData = await this.getCachedPortalData(portalSlug);
    
    if (!cachedPortalData) {
      return {
        isValid: false,
        errors: [{ field: 'portal', message: 'Portal data not available offline' }],
      };
    }

    const errors: Array<{ field: string; message: string }> = [];
    
    // Validate required fields
    for (const field of cachedPortalData.fields) {
      if (field.isRequired && (!formData[field.fieldName] || formData[field.fieldName] === '')) {
        errors.push({
          field: field.fieldName,
          message: `${field.fieldLabel} is required`,
        });
      }

      // Additional validation based on field type
      if (formData[field.fieldName]) {
        const value = formData[field.fieldName];
        
        switch (field.fieldType) {
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              errors.push({
                field: field.fieldName,
                message: `${field.fieldLabel} must be a valid email address`,
              });
            }
            break;
          case 'phone':
            if (!/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
              errors.push({
                field: field.fieldName,
                message: `${field.fieldLabel} must be a valid phone number`,
              });
            }
            break;
          case 'number':
            if (isNaN(Number(value))) {
              errors.push({
                field: field.fieldName,
                message: `${field.fieldLabel} must be a valid number`,
              });
            }
            break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Extend offline storage with portal-specific methods
declare module './offlineStorage' {
  interface OfflineStorageService {
    performOperation<T>(
      storeName: 'offlineSubmissions' | 'offlineFiles',
      mode: IDBTransactionMode,
      operation: (store: IDBObjectStore) => IDBRequest<T> | T
    ): Promise<T>;
  }
}

// Initialize offline storage for portal submissions
export const initializePortalOfflineStorage = async (): Promise<void> => {
  try {
    await offlineStorage.init();
    
    // Add portal-specific object stores if they don't exist
    const request = indexedDB.open('CMMS_Offline', 2); // Increment version
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Offline portal submissions
      if (!db.objectStoreNames.contains('offlineSubmissions')) {
        const store = db.createObjectStore('offlineSubmissions', { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('portalSlug', 'portalSlug', { unique: false });
        store.createIndex('timestamp', 'submissionMetadata.timestamp', { unique: false });
      }
      
      // Offline files for submissions
      if (!db.objectStoreNames.contains('offlineFiles')) {
        const store = db.createObjectStore('offlineFiles', { keyPath: 'id' });
        store.createIndex('submissionId', 'submissionId', { unique: false });
      }
    };
    
    console.log('Portal offline storage initialized');
  } catch (error) {
    console.error('Failed to initialize portal offline storage:', error);
  }
};

// Singleton instance
export const portalOfflineService = new PortalOfflineService();

// Initialize on module load
initializePortalOfflineStorage().catch(console.error);