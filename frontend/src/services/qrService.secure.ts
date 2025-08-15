import { api } from './api';
import type { 
  QRCodeData, 
  QRCodeType, 
  QRCodeGenerationOptions, 
  QRLabel, 
  QRLabelTemplate, 
  PrintableSheet,
  QRScanResult,
  QRBatchOperation
} from '../types/qr';

export interface CreateQRCodeRequest {
  entityType: QRCodeType;
  entityId: string;
  entityName?: string;
  metadata?: Record<string, any>;
  isPublic?: boolean;
  allowedUserRoles?: string[];
  maxScans?: number;
  expiresAt?: string; // ISO date string
}

export interface QRScanRequest {
  actionType?: string;
  actionData?: Record<string, any>;
  location?: { latitude: number; longitude: number };
  deviceType?: string;
}

export interface BatchQRRequest {
  items: CreateQRCodeRequest[];
  options?: QRCodeGenerationOptions;
}

export class SecureQRService {
  private static instance: SecureQRService;

  private constructor() {
    // Initialize service
  }

  public static getInstance(): SecureQRService {
    if (!SecureQRService.instance) {
      SecureQRService.instance = new SecureQRService();
    }
    return SecureQRService.instance;
  }

  // Generate single QR code using backend API
  async generateQRCode(request: CreateQRCodeRequest): Promise<any> {
    try {
      const response = await api.post('/qr/generate', request);
      return response.data;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Get QR codes with filtering
  async getQRCodes(filters: {
    entityType?: QRCodeType;
    entityId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<any> {
    try {
      const response = await api.get('/qr/codes', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch QR codes:', error);
      throw new Error('Failed to fetch QR codes');
    }
  }

  // Get QR code by ID
  async getQRCodeById(id: string): Promise<any> {
    try {
      const response = await api.get(`/qr/codes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
      throw new Error('Failed to fetch QR code');
    }
  }

  // Update QR code
  async updateQRCode(id: string, updates: {
    status?: string;
    maxScans?: number;
    expiresAt?: string;
  }): Promise<void> {
    try {
      await api.put(`/qr/codes/${id}`, updates);
    } catch (error) {
      console.error('Failed to update QR code:', error);
      throw new Error('Failed to update QR code');
    }
  }

  // Revoke QR code
  async revokeQRCode(id: string): Promise<void> {
    try {
      await api.delete(`/qr/codes/${id}`);
    } catch (error) {
      console.error('Failed to revoke QR code:', error);
      throw new Error('Failed to revoke QR code');
    }
  }

  // Scan QR code
  async scanQRCode(token: string, request: QRScanRequest = {}): Promise<QRScanResult> {
    try {
      const response = await api.post(`/qr/scan/${token}`, request);
      
      return {
        data: response.data.data.qrCode,
        isValid: true,
        qrCodeData: {
          type: response.data.data.qrCode.entityType,
          id: response.data.data.qrCode.entityId,
          organizationId: response.data.data.qrCode.organizationId,
          version: '2.0',
          metadata: response.data.data.qrCode.metadata,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to scan QR code:', error);
      return {
        data: '',
        isValid: false,
        error: error instanceof Error ? error.message : 'Scan failed',
        timestamp: Date.now(),
      };
    }
  }

  // Get QR code info without logging scan
  async getQRCodeInfo(token: string): Promise<any> {
    try {
      const response = await api.get(`/qr/scan/${token}/info`);
      return response.data;
    } catch (error) {
      console.error('Failed to get QR code info:', error);
      throw new Error('Failed to get QR code info');
    }
  }

  // Batch generate QR codes
  async batchGenerateQRCodes(request: BatchQRRequest): Promise<QRBatchOperation> {
    try {
      const response = await api.post('/qr/batch/generate', request);
      return response.data.data;
    } catch (error) {
      console.error('Failed to generate batch QR codes:', error);
      throw new Error('Failed to generate batch QR codes');
    }
  }

  // Get batch operation status
  async getBatchOperation(id: string): Promise<any> {
    try {
      const response = await api.get(`/qr/batch/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get batch operation:', error);
      throw new Error('Failed to get batch operation');
    }
  }

  // Get batch operations
  async getBatchOperations(page = 1, limit = 20): Promise<any> {
    try {
      const response = await api.get('/qr/batch', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get batch operations:', error);
      throw new Error('Failed to get batch operations');
    }
  }

  // Get QR codes for specific entity
  async getQRCodesForEntity(entityType: QRCodeType, entityId: string): Promise<any[]> {
    try {
      const response = await api.get(`/qr/entity/${entityType}/${entityId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to get QR codes for entity:', error);
      throw new Error('Failed to get QR codes for entity');
    }
  }

  // Generate QR code for specific entity
  async generateQRCodeForEntity(
    entityType: QRCodeType, 
    entityId: string, 
    entityName?: string,
    metadata?: Record<string, any>
  ): Promise<any> {
    try {
      const response = await api.post(`/qr/entity/${entityType}/${entityId}/generate`, {
        entityName,
        metadata
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to generate QR code for entity:', error);
      throw new Error('Failed to generate QR code for entity');
    }
  }

  // Get analytics
  async getAnalytics(days = 30): Promise<any> {
    try {
      const response = await api.get('/qr/analytics', {
        params: { days }
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to get QR analytics:', error);
      throw new Error('Failed to get QR analytics');
    }
  }

  // Get scan analytics
  async getScanAnalytics(filters: {
    entityType?: QRCodeType;
    entityId?: string;
    days?: number;
  } = {}): Promise<any> {
    try {
      const response = await api.get('/qr/analytics/scans', {
        params: filters
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to get scan analytics:', error);
      throw new Error('Failed to get scan analytics');
    }
  }

  // Get QR templates
  async getQRTemplates(): Promise<any[]> {
    try {
      const response = await api.get('/qr/templates');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get QR templates:', error);
      throw new Error('Failed to get QR templates');
    }
  }

  // Create QR template
  async createQRTemplate(template: {
    name: string;
    description?: string;
    category: string;
    dimensions: Record<string, any>;
    layout: 'horizontal' | 'vertical';
    qrSize: number;
    fontSize?: Record<string, any>;
    includeQRBorder?: boolean;
    customCSS?: string;
  }): Promise<any> {
    try {
      const response = await api.post('/qr/templates', template);
      return response.data.data;
    } catch (error) {
      console.error('Failed to create QR template:', error);
      throw new Error('Failed to create QR template');
    }
  }

  // Cleanup expired QR codes (admin only)
  async cleanupExpiredQRCodes(): Promise<any> {
    try {
      const response = await api.post('/qr/maintenance/cleanup-expired');
      return response.data.data;
    } catch (error) {
      console.error('Failed to cleanup expired QR codes:', error);
      throw new Error('Failed to cleanup expired QR codes');
    }
  }

  // Legacy compatibility methods for existing components
  async generateQRLabel(
    data: {
      type: QRCodeType;
      id: string;
      title: string;
      subtitle?: string;
      additionalInfo?: string[];
      metadata?: Record<string, any>;
    },
    template: QRLabelTemplate
  ): Promise<QRLabel> {
    // Generate QR code using secure backend
    const qrCode = await this.generateQRCode({
      entityType: data.type,
      entityId: data.id,
      entityName: data.title,
      metadata: data.metadata
    });

    return {
      id: qrCode.id,
      title: data.title,
      subtitle: data.subtitle,
      qrCode: qrCode.qrCodeDataUrl,
      additionalInfo: data.additionalInfo,
      template,
    };
  }

  generatePrintableSheet(labels: QRLabel[], template: QRLabelTemplate): PrintableSheet {
    // Use the original implementation for print functionality
    const labelsPerRow = Math.floor(210 / template.dimensions.width);
    const labelsPerColumn = Math.floor(297 / template.dimensions.height);

    const cssStyles = this.generateLabelCSS(template, labelsPerRow);
    const htmlContent = this.generateLabelHTML(labels);

    return {
      labels,
      template,
      htmlContent,
      cssStyles,
      pageSettings: {
        orientation: 'portrait',
        paperSize: 'A4',
        labelsPerRow,
        labelsPerColumn,
      },
    };
  }

  printLabels(sheet: PrintableSheet): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Failed to open print window');
    }

    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Labels</title>
          <style>
            ${sheet.cssStyles}
          </style>
        </head>
        <body>
          ${sheet.htmlContent}
        </body>
      </html>
    `;

    printWindow.document.write(printDocument);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }

  // Helper methods for print functionality
  private generateLabelCSS(template: QRLabelTemplate, labelsPerRow: number): string {
    const { dimensions, fontSize, qrSize, layout } = template;
    
    return `
      @page {
        size: A4;
        margin: 10mm;
      }
      
      .label-sheet {
        display: grid;
        grid-template-columns: repeat(${labelsPerRow}, 1fr);
        gap: 2mm;
        width: 100%;
        height: 100%;
      }
      
      .label {
        width: ${dimensions.width}mm;
        height: ${dimensions.height}mm;
        border: ${template.includeQRBorder ? '1px solid #ccc' : 'none'};
        padding: 1mm;
        display: flex;
        flex-direction: ${layout === 'horizontal' ? 'row' : 'column'};
        align-items: center;
        justify-content: ${layout === 'horizontal' ? 'space-between' : 'center'};
        page-break-inside: avoid;
        box-sizing: border-box;
      }
      
      .label-qr {
        width: ${qrSize}mm;
        height: ${qrSize}mm;
        flex-shrink: 0;
      }
      
      .label-content {
        flex: 1;
        ${layout === 'horizontal' ? 'margin-left: 1mm;' : 'margin-top: 1mm;'}
        text-align: center;
        overflow: hidden;
      }
      
      .label-title {
        font-size: ${fontSize.title}pt;
        font-weight: bold;
        line-height: 1.1;
        margin-bottom: 0.5mm;
      }
      
      .label-subtitle {
        font-size: ${fontSize.subtitle}pt;
        color: #666;
        line-height: 1.1;
        margin-bottom: 0.5mm;
      }
      
      .label-info {
        font-size: ${fontSize.info}pt;
        color: #888;
        line-height: 1.1;
      }
      
      .label-info-item {
        margin-bottom: 0.2mm;
      }
      
      ${template.customCSS || ''}
    `;
  }

  private generateLabelHTML(labels: QRLabel[]): string {
    const labelHTML = labels.map(label => `
      <div class="label">
        <img src="${label.qrCode}" alt="QR Code" class="label-qr" />
        <div class="label-content">
          <div class="label-title">${this.escapeHtml(label.title)}</div>
          ${label.subtitle ? `<div class="label-subtitle">${this.escapeHtml(label.subtitle)}</div>` : ''}
          ${label.additionalInfo ? label.additionalInfo.map(info => 
            `<div class="label-info-item">${this.escapeHtml(info)}</div>`
          ).join('') : ''}
        </div>
      </div>
    `).join('');

    return `
      <div class="label-sheet">
        ${labelHTML}
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export singleton instance for backward compatibility
export const secureQrService = SecureQRService.getInstance();