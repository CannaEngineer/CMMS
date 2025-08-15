// Advanced offline storage service using IndexedDB
class OfflineStorageService {
  private dbName = 'CMMS_Offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  // Initialize IndexedDB
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Work Orders store
        if (!db.objectStoreNames.contains('workOrders')) {
          const workOrderStore = db.createObjectStore('workOrders', { keyPath: 'id' });
          workOrderStore.createIndex('status', 'status', { unique: false });
          workOrderStore.createIndex('priority', 'priority', { unique: false });
          workOrderStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Assets store
        if (!db.objectStoreNames.contains('assets')) {
          const assetStore = db.createObjectStore('assets', { keyPath: 'id' });
          assetStore.createIndex('status', 'status', { unique: false });
          assetStore.createIndex('locationId', 'locationId', { unique: false });
        }

        // Cached queries store
        if (!db.objectStoreNames.contains('queryCache')) {
          const cacheStore = db.createObjectStore('queryCache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Pending operations store
        if (!db.objectStoreNames.contains('pendingOperations')) {
          const pendingStore = db.createObjectStore('pendingOperations', { keyPath: 'id' });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
          pendingStore.createIndex('type', 'type', { unique: false });
        }

        // Media/attachments store
        if (!db.objectStoreNames.contains('mediaCache')) {
          const mediaStore = db.createObjectStore('mediaCache', { keyPath: 'url' });
          mediaStore.createIndex('workOrderId', 'workOrderId', { unique: false });
        }

        // QR Scans store for offline QR functionality
        if (!db.objectStoreNames.contains('qrScans')) {
          const qrScansStore = db.createObjectStore('qrScans', { keyPath: 'id' });
          qrScansStore.createIndex('timestamp', 'timestamp', { unique: false });
          qrScansStore.createIndex('entityType', 'data.type', { unique: false });
        }

        // QR Actions store for offline QR actions
        if (!db.objectStoreNames.contains('qrActions')) {
          const qrActionsStore = db.createObjectStore('qrActions', { keyPath: 'id' });
          qrActionsStore.createIndex('status', 'status', { unique: false });
          qrActionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Generic store operations
  async performOperation<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Work Orders operations
  async saveWorkOrders(workOrders: any[]): Promise<void> {
    await this.performOperation('workOrders', 'readwrite', (store) => {
      workOrders.forEach(wo => {
        wo.lastSync = new Date().toISOString();
        store.put(wo);
      });
      return {} as IDBRequest<void>;
    });
  }

  async getWorkOrders(filters?: { status?: string; priority?: string }): Promise<any[]> {
    return this.performOperation('workOrders', 'readonly', (store) => {
      if (filters?.status) {
        const index = store.index('status');
        return index.getAll(filters.status);
      } else if (filters?.priority) {
        const index = store.index('priority');
        return index.getAll(filters.priority);
      }
      return store.getAll();
    });
  }

  async updateWorkOrder(id: string, data: Partial<any>): Promise<void> {
    const existing = await this.performOperation('workOrders', 'readonly', (store) => 
      store.get(id)
    );

    if (existing) {
      const updated = { 
        ...existing, 
        ...data, 
        updatedAt: new Date().toISOString(),
        lastSync: existing.lastSync // Preserve sync timestamp
      };
      
      await this.performOperation('workOrders', 'readwrite', (store) => 
        store.put(updated)
      );
    }
  }

  // Assets operations
  async saveAssets(assets: any[]): Promise<void> {
    await this.performOperation('assets', 'readwrite', (store) => {
      assets.forEach(asset => {
        asset.lastSync = new Date().toISOString();
        store.put(asset);
      });
      return {} as IDBRequest<void>;
    });
  }

  async getAssets(filters?: { status?: string; locationId?: number }): Promise<any[]> {
    return this.performOperation('assets', 'readonly', (store) => {
      if (filters?.status) {
        const index = store.index('status');
        return index.getAll(filters.status);
      } else if (filters?.locationId) {
        const index = store.index('locationId');
        return index.getAll(filters.locationId);
      }
      return store.getAll();
    });
  }

  // Query cache operations
  async cacheQuery(key: string, data: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    const cacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      expires: Date.now() + ttl,
    };

    await this.performOperation('queryCache', 'readwrite', (store) => 
      store.put(cacheEntry)
    );
  }

  async getCachedQuery(key: string): Promise<any | null> {
    const entry = await this.performOperation('queryCache', 'readonly', (store) => 
      store.get(key)
    );

    if (!entry || Date.now() > entry.expires) {
      if (entry) {
        // Clean up expired entry
        await this.performOperation('queryCache', 'readwrite', (store) => 
          store.delete(key)
        );
      }
      return null;
    }

    return entry.data;
  }

  // Pending operations
  async addPendingOperation(operation: {
    type: string;
    method: string;
    url: string;
    data?: any;
    entityId?: string;
  }): Promise<string> {
    const id = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pendingOp = {
      id,
      ...operation,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await this.performOperation('pendingOperations', 'readwrite', (store) => 
      store.put(pendingOp)
    );

    return id;
  }

  async getPendingOperations(): Promise<any[]> {
    return this.performOperation('pendingOperations', 'readonly', (store) => 
      store.getAll()
    );
  }

  async removePendingOperation(id: string): Promise<void> {
    await this.performOperation('pendingOperations', 'readwrite', (store) => 
      store.delete(id)
    );
  }

  // Media cache for attachments
  async cacheMedia(url: string, blob: Blob, workOrderId?: string): Promise<void> {
    const mediaEntry = {
      url,
      blob,
      workOrderId,
      timestamp: Date.now(),
    };

    await this.performOperation('mediaCache', 'readwrite', (store) => 
      store.put(mediaEntry)
    );
  }

  async getCachedMedia(url: string): Promise<Blob | null> {
    const entry = await this.performOperation('mediaCache', 'readonly', (store) => 
      store.get(url)
    );

    return entry?.blob || null;
  }

  // Cleanup operations
  async cleanupExpiredCache(): Promise<void> {
    const now = Date.now();
    
    // Clean expired query cache
    await this.performOperation('queryCache', 'readwrite', (store) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.expires < now) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
      return request;
    });
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    workOrders: number;
    assets: number;
    cachedQueries: number;
    pendingOperations: number;
    mediaFiles: number;
  }> {
    const [workOrders, assets, cachedQueries, pendingOperations, mediaFiles] = await Promise.all([
      this.performOperation('workOrders', 'readonly', (store) => store.count()),
      this.performOperation('assets', 'readonly', (store) => store.count()),
      this.performOperation('queryCache', 'readonly', (store) => store.count()),
      this.performOperation('pendingOperations', 'readonly', (store) => store.count()),
      this.performOperation('mediaCache', 'readonly', (store) => store.count()),
    ]);

    return {
      workOrders,
      assets,
      cachedQueries,
      pendingOperations,
      mediaFiles,
    };
  }

  // QR-specific operations
  async storeQRScan(scanResult: any): Promise<void> {
    const scanEntry = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...scanResult,
      storedAt: new Date().toISOString(),
      synced: false,
    };

    await this.performOperation('qrScans', 'readwrite', (store) => 
      store.put(scanEntry)
    );
  }

  async getPendingQRScans(): Promise<any[]> {
    return this.performOperation('qrScans', 'readonly', (store) => {
      const index = store.index('timestamp');
      return index.getAll();
    });
  }

  async storeQRAction(action: any): Promise<void> {
    const actionEntry = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...action,
      storedAt: new Date().toISOString(),
      status: 'pending',
    };

    await this.performOperation('qrActions', 'readwrite', (store) => 
      store.put(actionEntry)
    );
  }

  async getPendingQRActions(): Promise<any[]> {
    return this.performOperation('qrActions', 'readonly', (store) => {
      const index = store.index('status');
      return index.getAll('pending');
    });
  }

  async markQRActionCompleted(actionId: string): Promise<void> {
    const existing = await this.performOperation('qrActions', 'readonly', (store) => 
      store.get(actionId)
    );

    if (existing) {
      const updated = { 
        ...existing, 
        status: 'completed',
        completedAt: new Date().toISOString()
      };
      
      await this.performOperation('qrActions', 'readwrite', (store) => 
        store.put(updated)
      );
    }
  }

  async clearCompletedQRActions(): Promise<void> {
    await this.performOperation('qrActions', 'readwrite', (store) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.status === 'completed') {
            cursor.delete();
          }
          cursor.continue();
        }
      };
      return request;
    });
  }

  // Clear all offline data
  async clearAllData(): Promise<void> {
    const storeNames = ['workOrders', 'assets', 'queryCache', 'pendingOperations', 'mediaCache', 'qrScans', 'qrActions'];
    
    for (const storeName of storeNames) {
      await this.performOperation(storeName, 'readwrite', (store) => store.clear());
    }
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorageService();

// Initialize on app start
offlineStorage.init().catch(console.error);

// Background cleanup every hour
setInterval(() => {
  offlineStorage.cleanupExpiredCache().catch(console.error);
}, 60 * 60 * 1000);