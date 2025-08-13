# QR System Integration Patterns

## **Overview**
This document outlines how the QR system integrates with the existing CMMS architecture, including service patterns, WebSocket integration, and entity relationships.

---

## **1. Service Architecture Integration**

### **QR Service Layer Structure**
```typescript
// Core QR Services
/src/api/qr-code/
├── qr-code.controller.ts     // HTTP request handlers
├── qr-code.router.ts         // Express route definitions
├── qr-code.service.ts        // Business logic layer
├── qr-generator.service.ts   // QR code generation logic
├── qr-scanner.service.ts     // QR code scanning logic
└── qr-analytics.service.ts   // Analytics and reporting

/src/api/qr-batch/
├── qr-batch.controller.ts    // Batch operation controllers
├── qr-batch.router.ts        // Batch operation routes
├── qr-batch.service.ts       // Batch processing logic
└── qr-batch-processor.service.ts // Background job processor

/src/api/qr-template/
├── qr-template.controller.ts // Template management
├── qr-template.router.ts     // Template routes
└── qr-template.service.ts    // Template business logic

/src/services/qr/
├── qr-websocket.service.ts   // Real-time updates
├── qr-file.service.ts        // File generation and storage
├── qr-security.service.ts    // Access control and validation
└── qr-notification.service.ts // QR-related notifications
```

### **Service Dependencies and Integration**
```typescript
// QR Code Service Integration
export class QRCodeService {
  constructor(
    private prisma: PrismaClient,
    private websocketService: WebSocketService,
    private notificationService: NotificationService,
    private fileService: FileService,
    private securityService: QRSecurityService
  ) {}

  // Integration with existing entity services
  async createQRCodeForEntity(
    entityType: QREntityType,
    entityId: number,
    organizationId: number,
    config: CreateQRCodeRequest
  ): Promise<QRCode> {
    // Validate entity exists using existing services
    const entity = await this.validateEntityExists(entityType, entityId, organizationId);
    
    // Generate QR code
    const qrCode = await this.generateQRCode(entityType, entityId, config);
    
    // Notify via WebSocket
    this.websocketService.emitToOrganization(organizationId, 'qr-code-created', {
      qrCodeId: qrCode.id,
      entityType,
      entityId
    });
    
    // Send notification if configured
    await this.notificationService.sendQRCodeCreatedNotification(qrCode);
    
    return qrCode;
  }

  private async validateEntityExists(
    entityType: QREntityType,
    entityId: number,
    organizationId: number
  ): Promise<any> {
    switch (entityType) {
      case QREntityType.ASSET:
        return await assetService.getAssetById(entityId, organizationId);
      case QREntityType.LOCATION:
        return await locationService.getLocationById(entityId, organizationId);
      case QREntityType.WORK_ORDER:
        return await workOrderService.getWorkOrderById(entityId, organizationId);
      // ... other entity types
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }
}
```

---

## **2. WebSocket Integration Patterns**

### **Real-time QR Events**
```typescript
// Extend existing WebSocket service
export class QRWebSocketService {
  constructor(private websocketService: WebSocketService) {}

  // Batch operation progress updates
  emitBatchProgress(batchId: string, progress: QRBatchProgressEvent): void {
    this.websocketService.emitToOrganization(
      progress.organizationId,
      'qr-batch-progress',
      progress
    );
  }

  // Real-time scan notifications
  emitScanEvent(scanEvent: QRScanRealtimeEvent): void {
    // Emit to organization for admin dashboard
    this.websocketService.emitToOrganization(
      scanEvent.organizationId,
      'qr-scan-realtime',
      scanEvent
    );

    // Emit to specific entity watchers
    this.websocketService.emitToRoom(
      `${scanEvent.entityType}-${scanEvent.entityId}`,
      'entity-qr-scanned',
      scanEvent
    );
  }

  // QR code status changes
  emitStatusChange(qrCodeId: number, event: QRCodeStatusChangeEvent): void {
    this.websocketService.emitToOrganization(
      event.organizationId,
      'qr-code-status-changed',
      event
    );
  }

  // Subscribe to entity-specific QR events
  subscribeToEntityQR(socket: AuthenticatedSocket, entityType: QREntityType, entityId: number): void {
    const roomName = `${entityType}-${entityId}`;
    socket.join(roomName);
  }
}
```

### **WebSocket Event Handlers**
```typescript
// Add to existing WebSocket service initialization
this.io.on('connection', (socket: AuthenticatedSocket) => {
  // Subscribe to QR batch updates
  socket.on('subscribe-qr-batch', (batchId: string) => {
    socket.join(`qr-batch-${batchId}`);
  });

  // Subscribe to entity QR events
  socket.on('subscribe-entity-qr', (data: { entityType: QREntityType; entityId: number }) => {
    this.qrWebSocketService.subscribeToEntityQR(socket, data.entityType, data.entityId);
  });

  // Unsubscribe from QR events
  socket.on('unsubscribe-qr-batch', (batchId: string) => {
    socket.leave(`qr-batch-${batchId}`);
  });

  socket.on('disconnect', () => {
    // Clean up QR-related subscriptions
    // Socket.io handles room cleanup automatically
  });
});
```

---

## **3. Entity Integration Patterns**

### **Polymorphic Entity Resolution**
```typescript
export class QREntityService {
  async getEntityByQR(qrCode: QRCode): Promise<any> {
    const { entityType, entityId, organizationId } = qrCode;

    switch (entityType) {
      case QREntityType.ASSET:
        return await this.prisma.asset.findFirst({
          where: { id: entityId, organizationId },
          include: {
            location: true,
            workOrders: { take: 5, orderBy: { createdAt: 'desc' } },
            pmSchedules: { take: 3, orderBy: { nextDue: 'asc' } }
          }
        });

      case QREntityType.LOCATION:
        return await this.prisma.location.findFirst({
          where: { id: entityId, organizationId },
          include: {
            assets: { take: 10 },
            children: true,
            parent: true
          }
        });

      case QREntityType.WORK_ORDER:
        return await this.prisma.workOrder.findFirst({
          where: { id: entityId, organizationId },
          include: {
            asset: { include: { location: true } },
            assignedTo: true,
            tasks: true,
            timeLogs: true
          }
        });

      case QREntityType.PM_SCHEDULE:
        return await this.prisma.pMSchedule.findFirst({
          where: { id: entityId },
          include: {
            asset: { include: { location: true } },
            tasks: true,
            triggers: true,
            workOrders: { take: 5, orderBy: { createdAt: 'desc' } }
          }
        });

      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }

  async getEntityPermissions(
    entityType: QREntityType,
    entityId: number,
    userId: number,
    organizationId: number
  ): Promise<string[]> {
    // Implement role-based permissions for each entity type
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    const basePermissions: string[] = [];

    switch (entityType) {
      case QREntityType.ASSET:
        basePermissions.push('view', 'create_work_order');
        if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
          basePermissions.push('edit', 'update_status');
        }
        if (user?.role === 'TECHNICIAN') {
          basePermissions.push('log_meter', 'inspect');
        }
        break;

      case QREntityType.WORK_ORDER:
        basePermissions.push('view');
        if (user?.role !== 'TECHNICIAN') {
          basePermissions.push('edit', 'assign');
        }
        break;

      // Add other entity types...
    }

    return basePermissions;
  }
}
```

### **QR-Enhanced Entity Services**
```typescript
// Extend existing Asset Service
export class AssetServiceWithQR extends AssetService {
  constructor(
    private qrCodeService: QRCodeService,
    private qrEntityService: QREntityService
  ) {
    super();
  }

  async createAsset(assetData: CreateAssetRequest, options?: { generateQR?: boolean }): Promise<Asset> {
    const asset = await super.createAsset(assetData);

    // Auto-generate QR code if requested
    if (options?.generateQR) {
      await this.qrCodeService.createQRCodeForEntity(
        QREntityType.ASSET,
        asset.id,
        asset.organizationId,
        {
          entityType: QREntityType.ASSET,
          entityId: asset.id,
          title: `QR Code for ${asset.name}`,
          config: {
            format: 'PNG',
            size: 200
          }
        }
      );
    }

    return asset;
  }

  async getAssetWithQR(id: number, organizationId: number): Promise<AssetWithQR> {
    const asset = await super.getAssetById(id, organizationId);
    const qrCodes = await this.qrCodeService.getQRCodesForEntity(
      QREntityType.ASSET,
      id,
      organizationId
    );

    return {
      ...asset,
      qrCodes,
      hasActiveQR: qrCodes.some(qr => qr.status === QRStatus.ACTIVE)
    };
  }
}
```

---

## **4. File Storage Integration**

### **QR File Management Service**
```typescript
export class QRFileService {
  constructor(
    private storageProvider: 'local' | 's3' | 'azure' = 'local'
  ) {}

  async generateQRImage(qrData: string, config: QRCodeConfig): Promise<string> {
    const qr = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: config.errorCorrectionLevel || 'M',
      type: 'image/png',
      quality: 0.92,
      margin: config.margin || 4,
      color: {
        dark: config.color || '#000000',
        light: config.backgroundColor || '#FFFFFF'
      },
      width: config.size || 200
    });

    // Save to storage and return URL
    const fileName = `qr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
    const filePath = await this.saveToStorage(fileName, qr);
    
    return filePath;
  }

  async generateBatchPDF(qrCodes: QRCode[], labelConfig: QRLabelConfig): Promise<string> {
    // Generate PDF with multiple QR codes
    // Implementation would use libraries like PDFKit or jsPDF
    const pdfBuffer = await this.createQRPDF(qrCodes, labelConfig);
    
    const fileName = `qr-batch-${Date.now()}.pdf`;
    return await this.saveToStorage(fileName, pdfBuffer);
  }

  async generateExportZip(qrCodes: QRCode[]): Promise<string> {
    // Create ZIP file with all QR code images
    const zip = new JSZip();
    
    for (const qrCode of qrCodes) {
      const imageBuffer = await this.getQRImageBuffer(qrCode.qrImageUrl);
      zip.file(`${qrCode.title || qrCode.uniqueId}.png`, imageBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const fileName = `qr-export-${Date.now()}.zip`;
    
    return await this.saveToStorage(fileName, zipBuffer);
  }

  private async saveToStorage(fileName: string, data: string | Buffer): Promise<string> {
    switch (this.storageProvider) {
      case 'local':
        return await this.saveToLocal(fileName, data);
      case 's3':
        return await this.saveToS3(fileName, data);
      case 'azure':
        return await this.saveToAzure(fileName, data);
      default:
        throw new Error('Unsupported storage provider');
    }
  }
}
```

---

## **5. Notification Integration**

### **QR-Specific Notifications**
```typescript
// Extend existing notification service
export class QRNotificationService {
  constructor(private notificationService: NotificationService) {}

  async sendQRCodeCreatedNotification(qrCode: QRCode): Promise<void> {
    await this.notificationService.createNotification({
      title: 'QR Code Generated',
      message: `QR code created for ${qrCode.entityType} #${qrCode.entityId}`,
      type: NotificationType.INFO,
      category: NotificationCategory.SYSTEM,
      userId: qrCode.createdBy!,
      organizationId: qrCode.organizationId,
      relatedEntityType: 'qrCode',
      relatedEntityId: qrCode.id,
      actionUrl: `/qr-codes/${qrCode.id}`,
      actionLabel: 'View QR Code'
    });
  }

  async sendQRScanAlert(scanLog: QRScanLog): Promise<void> {
    // Send notification for suspicious scan activity
    if (this.isSuspiciousActivity(scanLog)) {
      await this.notificationService.createNotification({
        title: 'Suspicious QR Scan Activity',
        message: `Multiple failed scan attempts from IP ${scanLog.ipAddress}`,
        type: NotificationType.ALERT,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.HIGH,
        organizationId: scanLog.organizationId,
        relatedEntityType: 'qrScanLog',
        relatedEntityId: scanLog.id
      });
    }
  }

  async sendBatchCompletedNotification(batch: QRBatchOperation): Promise<void> {
    await this.notificationService.createNotification({
      title: 'Batch Operation Completed',
      message: `${batch.operationType} operation "${batch.batchName}" completed with ${batch.successfulItems}/${batch.totalItems} successful items`,
      type: batch.failedItems > 0 ? NotificationType.WARNING : NotificationType.SUCCESS,
      category: NotificationCategory.SYSTEM,
      userId: batch.createdBy,
      organizationId: batch.organizationId,
      relatedEntityType: 'qrBatchOperation',
      relatedEntityId: batch.id,
      actionUrl: `/qr-batch/${batch.batchId}`,
      actionLabel: 'View Results'
    });
  }

  private isSuspiciousActivity(scanLog: QRScanLog): boolean {
    // Implement suspicious activity detection logic
    return scanLog.scanResult === 'ERROR' || scanLog.scanResult === 'BLOCKED';
  }
}
```

---

## **6. Background Job Integration**

### **QR Batch Processor Service**
```typescript
export class QRBatchProcessorService {
  private processingJobs = new Map<string, QRBatchOperation>();

  constructor(
    private qrCodeService: QRCodeService,
    private qrFileService: QRFileService,
    private websocketService: QRWebSocketService
  ) {}

  async processBatchGeneration(batchId: string): Promise<void> {
    const batch = await this.getBatchOperation(batchId);
    if (!batch) return;

    try {
      await this.updateBatchStatus(batchId, QRBatchStatus.IN_PROGRESS);
      this.processingJobs.set(batchId, batch);

      const entities = await this.getEntitiesForBatch(batch);
      const totalItems = entities.length;

      await this.updateBatchProgress(batchId, { totalItems });

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        
        try {
          // Generate QR code for entity
          const qrCode = await this.qrCodeService.createQRCodeForEntity(
            batch.entityType,
            entity.id,
            batch.organizationId,
            this.buildQRConfigFromTemplate(batch.templateConfig)
          );

          // Update progress
          await this.updateBatchProgress(batchId, {
            processedItems: i + 1,
            successfulItems: batch.successfulItems + 1,
            currentItem: `${batch.entityType} #${entity.id}`
          });

          // Emit real-time progress
          this.websocketService.emitBatchProgress(batchId, {
            batchId,
            progress: ((i + 1) / totalItems) * 100,
            currentItem: `Processing ${batch.entityType} #${entity.id}`,
            itemsCompleted: i + 1,
            totalItems,
            errors: []
          });

        } catch (error) {
          await this.handleBatchItemError(batchId, entity, error);
        }
      }

      // Generate output files
      await this.generateBatchOutputFiles(batchId);
      await this.updateBatchStatus(batchId, QRBatchStatus.COMPLETED);

    } catch (error) {
      await this.updateBatchStatus(batchId, QRBatchStatus.FAILED);
      throw error;
    } finally {
      this.processingJobs.delete(batchId);
    }
  }

  async cancelBatchOperation(batchId: string): Promise<void> {
    const batch = this.processingJobs.get(batchId);
    if (batch) {
      await this.updateBatchStatus(batchId, QRBatchStatus.CANCELLED);
      this.processingJobs.delete(batchId);
    }
  }

  private async generateBatchOutputFiles(batchId: string): Promise<void> {
    const batch = await this.getBatchOperation(batchId);
    if (!batch) return;

    const qrCodes = await this.getQRCodesForBatch(batchId);
    const outputFiles: string[] = [];

    // Generate based on requested output format
    switch (batch.templateConfig.outputFormat) {
      case 'ZIP':
        const zipFile = await this.qrFileService.generateExportZip(qrCodes);
        outputFiles.push(zipFile);
        break;

      case 'PDF':
        const pdfFile = await this.qrFileService.generateBatchPDF(
          qrCodes,
          batch.templateConfig.labelConfig
        );
        outputFiles.push(pdfFile);
        break;

      case 'EXCEL':
        const excelFile = await this.generateBatchExcel(qrCodes);
        outputFiles.push(excelFile);
        break;
    }

    await this.updateBatchOutputFiles(batchId, outputFiles);
  }
}
```

---

## **7. Security Integration**

### **QR Security Service**
```typescript
export class QRSecurityService {
  constructor(private authService: AuthService) {}

  async validateQRAccess(
    qrCode: QRCode,
    user?: User,
    request?: Request
  ): Promise<{ allowed: boolean; reason?: string }> {
    // Check if QR code is active
    if (qrCode.status !== QRStatus.ACTIVE) {
      return { allowed: false, reason: 'QR code is not active' };
    }

    // Check expiration
    if (qrCode.expiresAt && new Date() > qrCode.expiresAt) {
      return { allowed: false, reason: 'QR code has expired' };
    }

    // Check scan limit
    if (qrCode.maxScans && qrCode.currentScans >= qrCode.maxScans) {
      return { allowed: false, reason: 'QR code scan limit exceeded' };
    }

    // Check authentication requirement
    if (qrCode.requiresAuth && !user) {
      return { allowed: false, reason: 'Authentication required' };
    }

    // Check role permissions
    if (user && qrCode.allowedRoles.length > 0) {
      if (!qrCode.allowedRoles.includes(user.role)) {
        return { allowed: false, reason: 'Insufficient role permissions' };
      }
    }

    // Check IP whitelist
    if (qrCode.security?.ipWhitelist?.length > 0 && request) {
      const clientIP = this.getClientIP(request);
      if (!qrCode.security.ipWhitelist.includes(clientIP)) {
        return { allowed: false, reason: 'IP address not whitelisted' };
      }
    }

    // Check time restrictions
    if (qrCode.security?.timeRestrictions) {
      const isWithinTimeWindow = this.checkTimeRestrictions(
        qrCode.security.timeRestrictions
      );
      if (!isWithinTimeWindow) {
        return { allowed: false, reason: 'Access outside allowed time window' };
      }
    }

    return { allowed: true };
  }

  private getClientIP(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      '127.0.0.1'
    ).split(',')[0].trim();
  }

  private checkTimeRestrictions(restrictions: any): boolean {
    // Implement time window checking logic
    const now = new Date();
    // Convert to specified timezone and check against start/end times
    return true; // Placeholder
  }
}
```

This comprehensive integration pattern ensures that the QR system seamlessly works with your existing CMMS architecture while maintaining scalability, security, and real-time capabilities.