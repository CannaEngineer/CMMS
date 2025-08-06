import QRCode from 'qrcode';
import jsqr from 'jsqr';
import type { 
  QRCodeData, 
  QRCodeType, 
  QRCodeGenerationOptions, 
  QRLabel, 
  QRLabelTemplate, 
  PrintableSheet,
  QRScanResult,
  QRBatchOperation,
  QRGenerationRequest
} from '../types/qr';
import { QR_LABEL_TEMPLATES } from '../types/qr';

export class QRService {
  private static instance: QRService;
  private baseUrl: string;
  private organizationId: string;

  private constructor() {
    this.baseUrl = window.location.origin;
    this.organizationId = '1'; // TODO: Get from auth context
  }

  public static getInstance(): QRService {
    if (!QRService.instance) {
      QRService.instance = new QRService();
    }
    return QRService.instance;
  }

  // Initialize with configuration
  public configure(baseUrl: string, organizationId: string): void {
    this.baseUrl = baseUrl;
    this.organizationId = organizationId;
  }

  // Generate QR Code Data Structure
  public createQRCodeData(
    type: QRCodeType,
    id: string,
    metadata?: Record<string, any>
  ): QRCodeData {
    return {
      type,
      id,
      organizationId: this.organizationId,
      version: '1.0',
      metadata: metadata || {},
      timestamp: Date.now(),
      baseUrl: this.baseUrl,
    };
  }

  // Generate QR Code URL
  public generateQRCodeUrl(qrData: QRCodeData): string {
    const params = new URLSearchParams({
      org: qrData.organizationId,
      v: qrData.version,
      t: qrData.timestamp.toString(),
    });

    if (qrData.metadata && Object.keys(qrData.metadata).length > 0) {
      params.set('meta', btoa(JSON.stringify(qrData.metadata)));
    }

    return `${qrData.baseUrl}/qr/${qrData.type}/${qrData.id}?${params.toString()}`;
  }

  // Parse QR Code URL
  public parseQRCodeUrl(url: string): QRCodeData | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      if (pathParts.length < 4 || pathParts[1] !== 'qr') {
        return null;
      }

      const type = pathParts[2] as QRCodeType;
      const id = pathParts[3];
      const params = urlObj.searchParams;

      const qrData: QRCodeData = {
        type,
        id,
        organizationId: params.get('org') || this.organizationId,
        version: params.get('v') || '1.0',
        timestamp: parseInt(params.get('t') || '0', 10),
        baseUrl: urlObj.origin,
      };

      const metaParam = params.get('meta');
      if (metaParam) {
        try {
          qrData.metadata = JSON.parse(atob(metaParam));
        } catch (e) {
          console.warn('Failed to parse QR metadata:', e);
        }
      }

      return qrData;
    } catch (error) {
      console.error('Failed to parse QR code URL:', error);
      return null;
    }
  }

  // Generate QR Code Image
  public async generateQRCode(
    qrData: QRCodeData,
    options: QRCodeGenerationOptions = {}
  ): Promise<string> {
    const url = this.generateQRCodeUrl(qrData);
    
    const qrOptions = {
      width: options.size || 200,
      margin: options.margin || 2,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    };

    try {
      return await QRCode.toDataURL(url, qrOptions);
    } catch (error) {
      console.error('QR code generation failed:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Generate QR Label
  public async generateQRLabel(
    data: {
      type: QRCodeType;
      id: string;
      title: string;
      subtitle?: string;
      additionalInfo?: string[];
      metadata?: Record<string, any>;
    },
    template: QRLabelTemplate,
    options: QRCodeGenerationOptions = {}
  ): Promise<QRLabel> {
    const qrData = this.createQRCodeData(data.type, data.id, data.metadata);
    const qrCode = await this.generateQRCode(qrData, {
      ...options,
      size: template.qrSize * 10, // Convert mm to pixels (approx)
    });

    return {
      id: `${data.type}-${data.id}-${Date.now()}`,
      title: data.title,
      subtitle: data.subtitle,
      qrCode,
      additionalInfo: data.additionalInfo,
      template,
    };
  }

  // Generate Printable Sheet
  public generatePrintableSheet(
    labels: QRLabel[],
    template: QRLabelTemplate
  ): PrintableSheet {
    const labelsPerRow = Math.floor(210 / template.dimensions.width); // A4 width
    const labelsPerColumn = Math.floor(297 / template.dimensions.height); // A4 height

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

  // Generate CSS for labels
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

  // Generate HTML for labels
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

  // Batch QR Code Generation
  public async generateBatchQRCodes(request: QRGenerationRequest): Promise<QRBatchOperation> {
    const operation: QRBatchOperation = {
      id: `batch-${Date.now()}`,
      type: 'generate',
      status: 'processing',
      total: request.items.length,
      processed: 0,
      items: request.items.map(item => ({
        id: `${item.type}-${item.id}`,
        data: this.createQRCodeData(item.type, item.id, item.metadata),
        status: 'pending',
      })),
      createdAt: Date.now(),
    };

    try {
      for (const item of operation.items) {
        try {
          const label = await this.generateQRLabel(
            {
              type: item.data.type,
              id: item.data.id,
              title: request.items.find(i => i.id === item.data.id)?.title || '',
              subtitle: request.items.find(i => i.id === item.data.id)?.subtitle,
              additionalInfo: request.items.find(i => i.id === item.data.id)?.additionalInfo,
              metadata: item.data.metadata,
            },
            request.template,
            request.options
          );
          
          item.status = 'completed';
          item.result = label.qrCode;
        } catch (error) {
          item.status = 'failed';
          item.result = error instanceof Error ? error.message : 'Unknown error';
        }
        
        operation.processed++;
      }

      operation.status = 'completed';
      operation.completedAt = Date.now();
    } catch (error) {
      operation.status = 'failed';
      operation.error = error instanceof Error ? error.message : 'Batch operation failed';
    }

    return operation;
  }

  // Scan QR Code from Canvas
  public scanQRCodeFromCanvas(canvas: HTMLCanvasElement): QRScanResult {
    const context = canvas.getContext('2d');
    if (!context) {
      return {
        data: '',
        isValid: false,
        error: 'Canvas context not available',
        timestamp: Date.now(),
      };
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = jsqr(imageData.data, imageData.width, imageData.height);

    if (!qrCode) {
      return {
        data: '',
        isValid: false,
        error: 'No QR code found',
        timestamp: Date.now(),
      };
    }

    const qrCodeData = this.parseQRCodeUrl(qrCode.data);
    
    return {
      data: qrCode.data,
      isValid: !!qrCodeData,
      qrCodeData: qrCodeData || undefined,
      timestamp: Date.now(),
    };
  }

  // Scan QR Code from Image File
  public async scanQRCodeFromFile(file: File): Promise<QRScanResult> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        if (!context) {
          resolve({
            data: '',
            isValid: false,
            error: 'Canvas context not available',
            timestamp: Date.now(),
          });
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        const result = this.scanQRCodeFromCanvas(canvas);
        resolve(result);
      };

      img.onerror = () => {
        resolve({
          data: '',
          isValid: false,
          error: 'Failed to load image',
          timestamp: Date.now(),
        });
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Get Available Templates
  public getAvailableTemplates(): Record<string, QRLabelTemplate> {
    return QR_LABEL_TEMPLATES;
  }

  // Validate QR Code Data
  public validateQRCodeData(data: QRCodeData): boolean {
    return !!(
      data.type &&
      data.id &&
      data.organizationId &&
      data.version &&
      data.timestamp
    );
  }

  // Print Labels
  public printLabels(sheet: PrintableSheet): void {
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

  // Utility: Escape HTML
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Get Current Location (if available)
  public async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          resolve(null);
        },
        { timeout: 5000 }
      );
    });
  }
}

// Export singleton instance
export const qrService = QRService.getInstance();