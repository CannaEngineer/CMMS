# QR System Performance Optimization Guide

## **Overview**
This guide provides comprehensive performance optimization recommendations for the QR system to ensure enterprise-grade scalability, fast response times, and efficient resource utilization.

---

## **1. Database Performance Optimizations**

### **Indexing Strategy**
```sql
-- Critical indexes for optimal query performance
CREATE INDEX CONCURRENTLY idx_qr_codes_hot_queries 
ON qr_codes(organization_id, status, entity_type, created_at);

CREATE INDEX CONCURRENTLY idx_qr_scan_logs_analytics 
ON qr_scan_logs(organization_id, scanned_at, scan_action) 
INCLUDE (qr_code_id, device_type, response_time_ms);

CREATE INDEX CONCURRENTLY idx_qr_codes_expiration_cleanup 
ON qr_codes(expires_at, status) 
WHERE expires_at IS NOT NULL AND status = 'ACTIVE';

-- Partial indexes for frequent queries
CREATE INDEX CONCURRENTLY idx_qr_codes_active_public 
ON qr_codes(organization_id, entity_type, entity_id) 
WHERE status = 'ACTIVE' AND is_public = true;

-- Composite index for batch operations
CREATE INDEX CONCURRENTLY idx_batch_ops_status_org 
ON qr_batch_operations(organization_id, status, created_at);
```

### **Query Optimization Patterns**
```typescript
// Optimized QR code retrieval with pagination
export const getQRCodesPaginated = async (
  organizationId: number,
  filters: QRCodeFilters,
  pagination: PaginationOptions
): Promise<PaginatedQRCodes> => {
  // Use cursor-based pagination for better performance at scale
  const whereClause = {
    organizationId,
    ...(filters.status && { status: filters.status }),
    ...(filters.entityType && { entityType: filters.entityType }),
    ...(filters.search && {
      OR: [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ]
    })
  };

  // Use efficient counting for pagination
  const [qrCodes, totalCount] = await Promise.all([
    prisma.qRCode.findMany({
      where: whereClause,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      take: pagination.limit,
      skip: (pagination.page - 1) * pagination.limit,
      select: {
        id: true,
        uniqueId: true,
        title: true,
        entityType: true,
        entityId: true,
        status: true,
        currentScans: true,
        createdAt: true,
        // Use selective field loading
        _count: {
          select: { scanLogs: true }
        }
      }
    }),
    // Use estimated count for large datasets
    pagination.page === 1 
      ? prisma.qRCode.count({ where: whereClause })
      : null
  ]);

  return { qrCodes, totalCount: totalCount || 0 };
};
```

### **Database Connection Optimization**
```typescript
// Optimized Prisma configuration
export const prismaConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pooling for high concurrency
  engine: {
    connectionLimit: 20,
    poolTimeout: 30000,
    connectionTimeout: 10000,
  },
  // Query optimization
  generator: {
    previewFeatures: [
      'fullTextSearch',
      'interactiveTransactions',
      'selectRelationCount'
    ]
  }
};

// Connection pool management
export class DatabaseManager {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    if (!this.instance) {
      this.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' 
          ? ['query', 'info', 'warn', 'error'] 
          : ['error'],
        errorFormat: 'pretty',
      });
    }
    return this.instance;
  }

  static async healthCheck(): Promise<boolean> {
    try {
      await this.getInstance().$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
```

---

## **2. Caching Strategies**

### **Redis Cache Implementation**
```typescript
export class QRCacheService {
  private redis: Redis;
  private readonly TTL = {
    QR_CODE: 3600,      // 1 hour
    SCAN_STATS: 1800,   // 30 minutes
    BATCH_STATUS: 300,  // 5 minutes
    ANALYTICS: 7200     // 2 hours
  };

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });
  }

  // Cache QR code data with hash-based keys
  async cacheQRCode(qrCode: QRCode): Promise<void> {
    const key = `qr:code:${qrCode.qrHash}`;
    await this.redis.setex(
      key, 
      this.TTL.QR_CODE, 
      JSON.stringify(qrCode)
    );
    
    // Cache entity mapping for quick lookups
    const entityKey = `qr:entity:${qrCode.organizationId}:${qrCode.entityType}:${qrCode.entityId}`;
    await this.redis.setex(entityKey, this.TTL.QR_CODE, qrCode.id.toString());
  }

  // Cache scan statistics with automatic invalidation
  async cacheScanStats(qrCodeId: number, stats: QRScanStats): Promise<void> {
    const key = `qr:stats:${qrCodeId}`;
    await this.redis.setex(key, this.TTL.SCAN_STATS, JSON.stringify(stats));
  }

  // Batch operation status caching
  async cacheBatchStatus(batchId: string, status: QRBatchOperation): Promise<void> {
    const key = `qr:batch:${batchId}`;
    await this.redis.setex(key, this.TTL.BATCH_STATUS, JSON.stringify(status));
    
    // Add to organization's batch list
    const orgBatchesKey = `qr:org:batches:${status.organizationId}`;
    await this.redis.zadd(orgBatchesKey, Date.now(), batchId);
    await this.redis.expire(orgBatchesKey, this.TTL.BATCH_STATUS);
  }

  // Analytics caching with time-based keys
  async cacheAnalytics(
    organizationId: number, 
    timeframe: string, 
    analytics: QRAnalyticsData
  ): Promise<void> {
    const key = `qr:analytics:${organizationId}:${timeframe}`;
    await this.redis.setex(key, this.TTL.ANALYTICS, JSON.stringify(analytics));
  }

  // Implement cache warming strategy
  async warmCache(organizationId: number): Promise<void> {
    // Pre-load frequently accessed QR codes
    const activeQRCodes = await prisma.qRCode.findMany({
      where: { 
        organizationId, 
        status: 'ACTIVE',
        currentScans: { gt: 0 }
      },
      orderBy: { currentScans: 'desc' },
      take: 100
    });

    await Promise.all(
      activeQRCodes.map(qr => this.cacheQRCode(qr))
    );
  }
}
```

### **Application-Level Caching**
```typescript
export class QRServiceWithCache extends QRCodeService {
  private memoryCache = new Map<string, { data: any; expires: number }>();
  private readonly MEMORY_TTL = 5 * 60 * 1000; // 5 minutes

  async getQRCodeByHash(qrHash: string): Promise<QRCode | null> {
    // Check memory cache first
    const memKey = `qr:${qrHash}`;
    const cached = this.memoryCache.get(memKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Check Redis cache
    const redisKey = `qr:code:${qrHash}`;
    const redisCached = await this.cacheService.get(redisKey);
    if (redisCached) {
      const qrCode = JSON.parse(redisCached);
      this.memoryCache.set(memKey, {
        data: qrCode,
        expires: Date.now() + this.MEMORY_TTL
      });
      return qrCode;
    }

    // Fallback to database
    const qrCode = await prisma.qRCode.findUnique({
      where: { qrHash }
    });

    if (qrCode) {
      await this.cacheService.cacheQRCode(qrCode);
      this.memoryCache.set(memKey, {
        data: qrCode,
        expires: Date.now() + this.MEMORY_TTL
      });
    }

    return qrCode;
  }

  // Clean up memory cache periodically
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.memoryCache.entries()) {
        if (value.expires <= now) {
          this.memoryCache.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }
}
```

---

## **3. QR Code Generation Optimization**

### **Optimized QR Generation Service**
```typescript
export class OptimizedQRGeneratorService {
  private qrPool: QRCode[] = [];
  private readonly POOL_SIZE = 100;

  constructor() {
    this.initializeQRPool();
  }

  // Pre-generate QR codes for faster response
  private async initializeQRPool(): Promise<void> {
    for (let i = 0; i < this.POOL_SIZE; i++) {
      const qr = new QRCodeLib({
        errorCorrectionLevel: 'M',
        type: 'canvas',
        quality: 0.92,
        margin: 4,
        width: 200
      });
      this.qrPool.push(qr);
    }
  }

  async generateQRCode(data: string, config: QRCodeConfig): Promise<string> {
    // Use object pool to avoid object creation overhead
    const qr = this.qrPool.pop() || new QRCodeLib();
    
    try {
      // Generate QR code with optimized settings
      const dataUrl = await qr.toDataURL(data, {
        errorCorrectionLevel: config.errorCorrectionLevel || 'M',
        width: config.size || 200,
        margin: config.margin || 4,
        color: {
          dark: config.color || '#000000',
          light: config.backgroundColor || '#FFFFFF'
        }
      });

      return dataUrl;
    } finally {
      // Return QR instance to pool
      if (this.qrPool.length < this.POOL_SIZE) {
        this.qrPool.push(qr);
      }
    }
  }

  // Batch QR generation with parallel processing
  async generateBatchQRCodes(
    requests: QRGenerationRequest[]
  ): Promise<QRGenerationResult[]> {
    const chunkSize = 10; // Process in chunks to avoid memory issues
    const results: QRGenerationResult[] = [];

    for (let i = 0; i < requests.length; i += chunkSize) {
      const chunk = requests.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (request) => {
          try {
            const qrImageUrl = await this.generateQRCode(request.data, request.config);
            return { success: true, qrImageUrl, request };
          } catch (error) {
            return { success: false, error: error.message, request };
          }
        })
      );
      results.push(...chunkResults);
    }

    return results;
  }
}
```

### **File Storage Optimization**
```typescript
export class OptimizedQRFileService {
  private uploadQueue: Array<{ file: Buffer; path: string; resolve: Function; reject: Function }> = [];
  private isProcessingQueue = false;

  constructor(private storageProvider: StorageProvider) {
    this.startQueueProcessor();
  }

  async saveQRImage(imageData: string, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const buffer = Buffer.from(imageData.split(',')[1], 'base64');
      
      // Add to upload queue for batch processing
      this.uploadQueue.push({
        file: buffer,
        path: `qr-codes/${fileName}`,
        resolve,
        reject
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.uploadQueue.length === 0) return;

    this.isProcessingQueue = true;
    const batch = this.uploadQueue.splice(0, 5); // Process 5 at a time

    try {
      await Promise.all(
        batch.map(async ({ file, path, resolve, reject }) => {
          try {
            const url = await this.storageProvider.upload(path, file);
            resolve(url);
          } catch (error) {
            reject(error);
          }
        })
      );
    } finally {
      this.isProcessingQueue = false;
      
      // Continue processing if queue has items
      if (this.uploadQueue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  // CDN integration for fast image delivery
  generateCDNUrl(fileName: string): string {
    const cdnBaseUrl = process.env.CDN_BASE_URL;
    return cdnBaseUrl ? `${cdnBaseUrl}/qr-codes/${fileName}` : `/uploads/qr-codes/${fileName}`;
  }
}
```

---

## **4. WebSocket Performance Optimization**

### **Optimized WebSocket Service**
```typescript
export class OptimizedQRWebSocketService {
  private eventQueue: Map<string, QREvent[]> = new Map();
  private flushInterval: NodeJS.Timeout;

  constructor(private websocketService: WebSocketService) {
    this.startEventBatching();
  }

  // Batch events to reduce WebSocket overhead
  emitQREvent(organizationId: number, event: QREvent): void {
    const key = `org:${organizationId}`;
    
    if (!this.eventQueue.has(key)) {
      this.eventQueue.set(key, []);
    }
    
    this.eventQueue.get(key)!.push(event);
  }

  private startEventBatching(): void {
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 1000); // Batch every second
  }

  private flushEvents(): void {
    for (const [key, events] of this.eventQueue.entries()) {
      if (events.length === 0) continue;

      const organizationId = parseInt(key.split(':')[1]);
      
      // Send batched events
      this.websocketService.emitToOrganization(organizationId, 'qr-batch-events', {
        events,
        timestamp: new Date().toISOString()
      });

      // Clear processed events
      this.eventQueue.set(key, []);
    }
  }

  // Selective room subscription for better performance
  subscribeToQRUpdates(
    socket: AuthenticatedSocket, 
    filters: QRSubscriptionFilters
  ): void {
    const rooms: string[] = [];

    if (filters.entityTypes) {
      filters.entityTypes.forEach(entityType => {
        rooms.push(`qr:${entityType}`);
      });
    }

    if (filters.batchOperations) {
      rooms.push(`qr:batches:${socket.organizationId}`);
    }

    if (filters.realTimeScans) {
      rooms.push(`qr:scans:${socket.organizationId}`);
    }

    rooms.forEach(room => socket.join(room));
  }
}
```

---

## **5. API Performance Optimizations**

### **Request Optimization Patterns**
```typescript
// Implement API response compression
export const compressionMiddleware = compression({
  filter: (req, res) => {
    // Don't compress responses if client doesn't support it
    if (req.headers['x-no-compression']) return false;
    // Compress all QR API responses
    return req.path.startsWith('/api/v1/qr');
  },
  level: 6, // Good compression/speed balance
  threshold: 1024 // Only compress responses > 1KB
});

// Rate limiting with Redis for distributed systems
export const qrRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:qr:'
  }),
  windowMs: 60 * 1000, // 1 minute
  max: (req) => {
    // Different limits based on operation type
    if (req.path.includes('/scan')) return 1000; // High limit for scans
    if (req.path.includes('/batch')) return 5;   // Low limit for batch ops
    return 100; // Default limit
  },
  keyGenerator: (req) => {
    return `${req.user?.organizationId || 'anon'}:${req.ip}`;
  }
});

// Request deduplication middleware
export const deduplicationMiddleware = (ttl = 5000) => {
  const requestCache = new Map<string, Promise<any>>();

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only deduplicate GET requests
    if (req.method !== 'GET') return next();

    const key = `${req.user?.id}:${req.path}:${JSON.stringify(req.query)}`;
    
    if (requestCache.has(key)) {
      // Return cached promise result
      try {
        const result = await requestCache.get(key);
        return res.json(result);
      } catch (error) {
        return next(error);
      }
    }

    // Create promise for this request
    const requestPromise = new Promise((resolve, reject) => {
      const originalSend = res.json;
      res.json = function(data: any) {
        resolve(data);
        return originalSend.call(this, data);
      };

      // Handle errors
      const originalNext = next;
      next = (error?: any) => {
        if (error) reject(error);
        return originalNext(error);
      };
    });

    requestCache.set(key, requestPromise);

    // Clear cache after TTL
    setTimeout(() => {
      requestCache.delete(key);
    }, ttl);

    next();
  };
};
```

### **Optimized Query Patterns**
```typescript
export class OptimizedQRQueryService {
  // Use database views for complex analytics
  async getQRAnalytics(organizationId: number, timeframe: string): Promise<QRAnalytics> {
    // Use pre-computed database views
    const analytics = await prisma.$queryRaw`
      SELECT * FROM qr_analytics_summary 
      WHERE organization_id = ${organizationId} 
      AND timeframe = ${timeframe}
    `;

    return analytics[0];
  }

  // Implement cursor-based pagination for large datasets
  async getQRScanLogsPaginated(
    qrCodeId: number,
    cursor?: string,
    limit = 20
  ): Promise<PaginatedScanLogs> {
    const scanLogs = await prisma.qRScanLog.findMany({
      where: { qrCodeId },
      orderBy: { scannedAt: 'desc' },
      take: limit + 1, // Take one extra to determine if there's a next page
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1 // Skip the cursor
      })
    });

    const hasNextPage = scanLogs.length > limit;
    const items = hasNextPage ? scanLogs.slice(0, -1) : scanLogs;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return { items, nextCursor, hasNextPage };
  }

  // Optimize aggregation queries
  async getQRStatsByEntity(
    organizationId: number,
    entityType: QREntityType
  ): Promise<QREntityStats[]> {
    return await prisma.$queryRaw`
      WITH qr_stats AS (
        SELECT 
          qc.entity_id,
          COUNT(qsl.id) as total_scans,
          COUNT(DISTINCT qsl.scanned_by) as unique_scanners,
          AVG(qsl.response_time_ms) as avg_response_time,
          MAX(qsl.scanned_at) as last_scanned
        FROM qr_codes qc
        LEFT JOIN qr_scan_logs qsl ON qc.id = qsl.qr_code_id
        WHERE qc.organization_id = ${organizationId}
          AND qc.entity_type = ${entityType}
        GROUP BY qc.entity_id
      )
      SELECT 
        qs.*,
        CASE 
          WHEN ${entityType} = 'ASSET' THEN a.name
          WHEN ${entityType} = 'LOCATION' THEN l.name
          WHEN ${entityType} = 'WORK_ORDER' THEN wo.title
        END as entity_name
      FROM qr_stats qs
      LEFT JOIN "Asset" a ON qs.entity_id = a.id AND ${entityType} = 'ASSET'
      LEFT JOIN "Location" l ON qs.entity_id = l.id AND ${entityType} = 'LOCATION'
      LEFT JOIN "WorkOrder" wo ON qs.entity_id = wo.id AND ${entityType} = 'WORK_ORDER'
      ORDER BY qs.total_scans DESC
    `;
  }
}
```

---

## **6. Monitoring and Performance Metrics**

### **Performance Monitoring Service**
```typescript
export class QRPerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();

  trackQRGeneration(duration: number, success: boolean): void {
    this.updateMetric('qr_generation', {
      duration,
      success,
      timestamp: Date.now()
    });
  }

  trackQRScan(duration: number, success: boolean, cacheHit: boolean): void {
    this.updateMetric('qr_scan', {
      duration,
      success,
      cacheHit,
      timestamp: Date.now()
    });
  }

  trackBatchOperation(batchId: string, itemsProcessed: number, duration: number): void {
    this.updateMetric('batch_operation', {
      batchId,
      itemsProcessed,
      duration,
      throughput: itemsProcessed / (duration / 1000), // items per second
      timestamp: Date.now()
    });
  }

  // Export metrics for monitoring systems
  async exportMetrics(): Promise<PerformanceReport> {
    const report: PerformanceReport = {
      qrGeneration: this.calculateStats('qr_generation'),
      qrScanning: this.calculateStats('qr_scan'),
      batchOperations: this.calculateStats('batch_operation'),
      cacheHitRate: this.calculateCacheHitRate(),
      timestamp: new Date().toISOString()
    };

    // Send to monitoring service
    await this.sendToMonitoring(report);

    return report;
  }

  private calculateStats(metricType: string): MetricStats {
    const metric = this.metrics.get(metricType);
    if (!metric) return { avg: 0, min: 0, max: 0, count: 0 };

    const durations = metric.data.map(d => d.duration);
    return {
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      count: durations.length,
      successRate: metric.data.filter(d => d.success).length / durations.length
    };
  }
}
```

### **Database Performance Monitoring**
```sql
-- Create monitoring views for database performance
CREATE VIEW qr_performance_metrics AS
SELECT 
  'qr_codes' as table_name,
  pg_size_pretty(pg_total_relation_size('qr_codes')) as size,
  (SELECT COUNT(*) FROM qr_codes) as row_count,
  (SELECT COUNT(*) FROM qr_codes WHERE status = 'ACTIVE') as active_codes
UNION ALL
SELECT 
  'qr_scan_logs' as table_name,
  pg_size_pretty(pg_total_relation_size('qr_scan_logs')) as size,
  (SELECT COUNT(*) FROM qr_scan_logs) as row_count,
  (SELECT COUNT(*) FROM qr_scan_logs WHERE scanned_at > NOW() - INTERVAL '24 hours') as recent_scans;

-- Monitor slow queries
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Query to identify slow QR-related queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE query LIKE '%qr_%' 
ORDER BY mean_time DESC 
LIMIT 10;
```

---

## **7. Scaling Recommendations**

### **Horizontal Scaling Patterns**
```typescript
// Implement sharding for large organizations
export class QRShardingService {
  private getShardKey(organizationId: number): string {
    // Simple hash-based sharding
    const shard = organizationId % parseInt(process.env.QR_SHARD_COUNT || '4');
    return `shard_${shard}`;
  }

  async getShardedPrismaClient(organizationId: number): Promise<PrismaClient> {
    const shardKey = this.getShardKey(organizationId);
    const databaseUrl = process.env[`DATABASE_URL_${shardKey.toUpperCase()}`] || process.env.DATABASE_URL;
    
    return new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  }

  // Distributed batch processing
  async distributeBatchOperation(
    batch: QRBatchOperation
  ): Promise<void> {
    const shardKey = this.getShardKey(batch.organizationId);
    const queueName = `qr_batch_${shardKey}`;
    
    // Add to distributed queue
    await this.queueService.add(queueName, {
      batchId: batch.batchId,
      organizationId: batch.organizationId
    });
  }
}

// Load balancing for QR scanning
export class QRScanLoadBalancer {
  private scanServers: string[] = [
    'scan-server-1.internal',
    'scan-server-2.internal',
    'scan-server-3.internal'
  ];

  selectScanServer(qrHash: string): string {
    // Consistent hashing for QR code distribution
    const hash = this.hashString(qrHash);
    const serverIndex = hash % this.scanServers.length;
    return this.scanServers[serverIndex];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
```

### **Resource Optimization**
```typescript
// Memory usage optimization
export class QRMemoryOptimizer {
  private static readonly MAX_CACHE_SIZE = 1000;
  private lruCache: Map<string, any> = new Map();

  set(key: string, value: any): void {
    if (this.lruCache.size >= QRMemoryOptimizer.MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = this.lruCache.keys().next().value;
      this.lruCache.delete(firstKey);
    }
    
    this.lruCache.set(key, value);
  }

  // Periodic memory cleanup
  startMemoryCleanup(): void {
    setInterval(() => {
      if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) { // 500MB
        this.lruCache.clear();
        global.gc?.(); // Force garbage collection if available
      }
    }, 30000); // Check every 30 seconds
  }
}
```

---

## **Summary of Key Optimizations**

1. **Database**: Optimized indexes, query patterns, and connection pooling
2. **Caching**: Multi-layer caching with Redis and memory caches
3. **QR Generation**: Object pooling and batch processing
4. **File Storage**: Asynchronous upload queues and CDN integration
5. **WebSocket**: Event batching and selective subscriptions
6. **API**: Compression, rate limiting, and request deduplication
7. **Monitoring**: Comprehensive performance tracking
8. **Scaling**: Sharding and load balancing strategies

These optimizations ensure the QR system can handle enterprise-scale loads while maintaining fast response times and efficient resource utilization.