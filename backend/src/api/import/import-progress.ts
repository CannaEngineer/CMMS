// Import progress tracking
interface ImportProgress {
  importId: string;
  status: 'running' | 'completed' | 'failed';
  currentStep: string;
  progress: number; // 0-100
  processedRecords: number;
  totalRecords: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  currentRecord?: string;
  timestamp: Date;
}

// In-memory progress store (in production, use Redis or database)
const progressStore = new Map<string, ImportProgress>();

export class ImportProgressTracker {
  static updateProgress(importId: string, update: Partial<ImportProgress>) {
    const existing = progressStore.get(importId) || {
      importId,
      status: 'running' as const,
      currentStep: 'Starting...',
      progress: 0,
      processedRecords: 0,
      totalRecords: 0,
      importedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      timestamp: new Date()
    };
    
    const updated = {
      ...existing,
      ...update,
      timestamp: new Date()
    };
    
    progressStore.set(importId, updated);
    console.log(`📊 Progress Update [${importId}]: ${updated.currentStep} (${updated.progress}%) - ${updated.processedRecords}/${updated.totalRecords} processed`);
    
    return updated;
  }
  
  static getProgress(importId: string): ImportProgress | null {
    return progressStore.get(importId) || null;
  }
  
  static completeImport(importId: string, finalStatus: 'completed' | 'failed') {
    const progress = progressStore.get(importId);
    if (progress) {
      progress.status = finalStatus;
      progress.progress = 100;
      progress.currentStep = finalStatus === 'completed' ? 'Import completed successfully' : 'Import failed';
    }
  }
  
  static cleanupProgress(importId: string) {
    // Clean up after 1 hour
    setTimeout(() => {
      progressStore.delete(importId);
    }, 60 * 60 * 1000);
  }
}