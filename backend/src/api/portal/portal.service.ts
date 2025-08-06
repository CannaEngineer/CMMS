import { PrismaClient } from '@prisma/client';
import type {
  Portal,
  PortalSubmission,
  PortalField,
  PortalAnalytics,
  CreatePortalRequest,
  UpdatePortalRequest,
  SubmitPortalRequest
} from './portal.types';

const prisma = new PrismaClient();

export class PortalService {
  // Portal Management
  async getAllPortals(organizationId: number, filters?: any): Promise<Portal[]> {
    const where: any = { organizationId };
    
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.searchTerm) {
      where.OR = [
        { name: { contains: filters.searchTerm } },
        { description: { contains: filters.searchTerm } }
      ];
    }
    
    return prisma.portal.findMany({
      where,
      include: {
        fields: {
          orderBy: { orderIndex: 'asc' }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }) as any;
  }

  async getPortalById(id: number, organizationId: number): Promise<Portal | null> {
    return prisma.portal.findFirst({
      where: { id, organizationId },
      include: {
        fields: {
          orderBy: { orderIndex: 'asc' }
        },
        _count: {
          select: { submissions: true }
        }
      }
    }) as any;
  }

  async getPortalBySlug(slug: string): Promise<Portal | null> {
    return prisma.portal.findUnique({
      where: { slug },
      include: {
        fields: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    }) as any;
  }

  async createPortal(data: CreatePortalRequest, organizationId: number): Promise<Portal> {
    const { fields, ...portalData } = data;
    
    // Generate unique slug
    const baseSlug = this.generateSlug(data.name);
    let slug = baseSlug;
    let counter = 1;
    
    while (await prisma.portal.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const portal = await prisma.portal.create({
      data: {
        ...portalData,
        slug,
        organizationId,
        publicUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/portal/${slug}`,
        fields: fields ? {
          create: fields.map((field, index) => ({
            ...field,
            orderIndex: index
          }))
        } : undefined
      },
      include: {
        fields: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    // Generate QR code URL for the portal
    try {
      const qrCodeUrl = await this.generatePortalQRCode(portal.id, slug, portal.name);
      if (qrCodeUrl) {
        await prisma.portal.update({
          where: { id: portal.id },
          data: { qrCodeUrl }
        });
        (portal as any).qrCodeUrl = qrCodeUrl;
      }
    } catch (error) {
      console.error('Failed to generate QR code for portal:', error);
      // Don't fail portal creation if QR code generation fails
    }

    return portal as any;
  }

  async updatePortal(id: number, data: UpdatePortalRequest, organizationId: number): Promise<Portal | null> {
    const { fields, ...portalData } = data;
    
    const portal = await prisma.portal.findFirst({
      where: { id, organizationId }
    });
    
    if (!portal) return null;

    const updated = await prisma.portal.update({
      where: { id },
      data: portalData,
      include: {
        fields: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    return updated as any;
  }

  async deletePortal(id: number, organizationId: number): Promise<boolean> {
    const result = await prisma.portal.deleteMany({
      where: { id, organizationId }
    });
    
    return result.count > 0;
  }

  // Portal Fields Management
  async updatePortalFields(portalId: number, fields: Partial<PortalField>[], organizationId: number): Promise<PortalField[]> {
    // Verify portal ownership
    const portal = await prisma.portal.findFirst({
      where: { id: portalId, organizationId }
    });
    
    if (!portal) throw new Error('Portal not found');

    // Delete existing fields
    await prisma.portalField.deleteMany({
      where: { portalId }
    });

    // Create new fields
    const created = await prisma.portalField.createMany({
      data: fields.map((field, index) => ({
        ...field,
        portalId,
        orderIndex: index
      }))
    });

    return prisma.portalField.findMany({
      where: { portalId },
      orderBy: { orderIndex: 'asc' }
    }) as any;
  }

  // Portal Submissions
  async getSubmissions(filters?: {
    portalId?: number;
    status?: string;
    organizationId: number;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (filters?.portalId) {
      where.portalId = filters.portalId;
    } else if (filters?.organizationId) {
      where.portal = { organizationId: filters.organizationId };
    }
    
    if (filters?.status) where.status = filters.status;

    const [submissions, totalCount] = await Promise.all([
      prisma.portalSubmission.findMany({
        where,
        include: {
          portal: { select: { name: true, type: true } },
          assignedTo: { select: { name: true, email: true } },
          workOrder: { select: { id: true, title: true, status: true } },
          asset: { select: { name: true } },
          location: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.portalSubmission.count({ where })
    ]);

    return {
      submissions,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    };
  }

  async submitPortal(data: SubmitPortalRequest): Promise<{
    submissionId: string;
    trackingCode: string;
    message: string;
  }> {
    const portal = await this.getPortalBySlug(data.portalSlug);
    if (!portal || !portal.isActive) {
      throw new Error('Portal not found or inactive');
    }

    // Generate tracking code
    const trackingCode = this.generateTrackingCode();

    const submission = await prisma.portalSubmission.create({
      data: {
        portalId: portal.id,
        trackingCode,
        submissionData: data.submissionData,
        attachments: data.attachments,
        submitterName: data.contactInfo.name,
        submitterEmail: data.contactInfo.email,
        submitterPhone: data.contactInfo.phone,
        submitterIp: data.clientInfo?.ipAddress,
        userAgent: data.clientInfo?.userAgent,
        priority: this.determinePriority(data.submissionData, portal.fields || [])
      }
    });

    // Auto-create work order if enabled
    if (portal.autoCreateWorkOrders) {
      await this.createWorkOrderFromSubmission(submission.id);
    }

    return {
      submissionId: submission.id.toString(),
      trackingCode,
      message: 'Your submission has been received successfully!'
    };
  }

  async updateSubmissionStatus(
    id: number,
    status: string,
    reviewNotes?: string,
    organizationId?: number
  ): Promise<PortalSubmission | null> {
    const where: any = { id };
    if (organizationId) {
      where.portal = { organizationId };
    }

    return prisma.portalSubmission.update({
      where: { id },
      data: {
        status: status as any,
        reviewNotes,
        reviewedAt: new Date()
      },
      include: {
        portal: true,
        assignedTo: true
      }
    }) as any;
  }

  async createWorkOrderFromSubmission(submissionId: number): Promise<{ workOrderId: string }> {
    const submission = await prisma.portalSubmission.findUnique({
      where: { id: submissionId },
      include: { portal: true }
    });

    if (!submission) throw new Error('Submission not found');

    const workOrder = await prisma.workOrder.create({
      data: {
        title: submission.submissionData.title || `Portal Request - ${submission.portal.name}`,
        description: submission.submissionData.description || JSON.stringify(submission.submissionData),
        priority: submission.priority,
        organizationId: submission.portal.organizationId,
        assetId: submission.assetId,
      }
    });

    // Update submission with work order link
    await prisma.portalSubmission.update({
      where: { id: submissionId },
      data: { workOrderId: workOrder.id }
    });

    return { workOrderId: workOrder.id.toString() };
  }

  // Analytics
  async getPortalAnalytics(portalId: number, timeframe: string = '30d'): Promise<any> {
    const daysBack = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : timeframe === '1y' ? 365 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const [submissions, analytics, allSubmissions] = await Promise.all([
      // Get submissions for the timeframe
      prisma.portalSubmission.findMany({
        where: {
          portalId,
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          createdAt: true,
          status: true,
          priority: true,
          reviewedAt: true,
          completedAt: true,
          submissionData: true
        },
        orderBy: { createdAt: 'asc' }
      }),
      // Get analytics data for the timeframe
      prisma.portalAnalytics.findMany({
        where: {
          portalId,
          date: { gte: startDate }
        },
        orderBy: { date: 'asc' }
      }),
      // Get all submissions for total count
      prisma.portalSubmission.findMany({
        where: { portalId },
        select: {
          id: true,
          createdAt: true,
          status: true
        }
      })
    ]);

    // Calculate real response time (time from submission to first review)
    const reviewedSubmissions = submissions.filter(s => s.reviewedAt);
    const avgResponseTime = reviewedSubmissions.length > 0 
      ? reviewedSubmissions.reduce((acc, s) => {
          const responseTime = (new Date(s.reviewedAt!).getTime() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60); // hours
          return acc + responseTime;
        }, 0) / reviewedSubmissions.length
      : 0;

    // Calculate real completion rate
    const completedSubmissions = submissions.filter(s => s.status === 'COMPLETED').length;
    const completionRate = submissions.length > 0 ? (completedSubmissions / submissions.length) * 100 : 0;

    // Calculate device breakdown from analytics
    const deviceBreakdown = analytics.reduce((acc, curr) => ({
      Mobile: acc.Mobile + curr.mobileViews,
      Desktop: acc.Desktop + curr.desktopViews,
      Tablet: acc.Tablet + curr.tabletViews
    }), { Mobile: 0, Desktop: 0, Tablet: 0 });

    // Calculate total views
    const totalViews = analytics.reduce((acc, curr) => acc + curr.views, 0);

    // Calculate conversion rate (submissions / views)
    const conversionRate = totalViews > 0 ? (submissions.length / totalViews) * 100 : 0;

    // Calculate bounce rate
    const avgBounceRate = analytics.length > 0 
      ? analytics.reduce((acc, curr) => acc + (curr.bounceRate || 0), 0) / analytics.length
      : 0;

    // Extract categories from submission data
    const categoryBreakdown = this.calculateCategoryBreakdown(submissions);

    return {
      totalSubmissions: allSubmissions.length,
      submissionsInPeriod: submissions.length,
      submissionTrend: this.calculateSubmissionTrend(submissions),
      statusBreakdown: this.calculateStatusBreakdown(submissions),
      avgResponseTime: Math.round(avgResponseTime * 10) / 10, // Round to 1 decimal
      completionRate: Math.round(completionRate * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      bounceRate: Math.round(avgBounceRate * 10) / 10,
      deviceBreakdown,
      totalViews,
      categoryBreakdown,
      trafficSources: {
        qrCodeScans: analytics.reduce((acc, curr) => acc + curr.qrCodeScans, 0),
        directAccess: analytics.reduce((acc, curr) => acc + curr.directAccess, 0),
        referralAccess: analytics.reduce((acc, curr) => acc + curr.referralAccess, 0)
      }
    };
  }

  // Utility methods
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
      .replace(/^-|-$/g, '');
  }

  private async generatePortalQRCode(portalId: number, slug: string, name: string): Promise<string | null> {
    try {
      // Import QRCode only when needed
      const QRCode = require('qrcode');
      
      // Create the portal URL that the QR code will link to
      const portalUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/portal/${slug}`;
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(portalUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });
      
      return qrCodeDataUrl;
    } catch (error) {
      console.error('QR code generation failed:', error);
      return null;
    }
  }

  private generateTrackingCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  private determinePriority(submissionData: any, fields: any[]): any {
    const priorityField = fields.find(f => f.type === 'PRIORITY' || f.name === 'priority');
    if (priorityField && submissionData[priorityField.name]) {
      return submissionData[priorityField.name];
    }
    return 'MEDIUM';
  }

  private calculateSubmissionTrend(submissions: any[]): Array<{ date: string; count: number }> {
    const trend: { [key: string]: number } = {};
    
    submissions.forEach(sub => {
      const date = sub.createdAt.toISOString().split('T')[0];
      trend[date] = (trend[date] || 0) + 1;
    });

    return Object.entries(trend).map(([date, count]) => ({ date, count }));
  }

  private calculateStatusBreakdown(submissions: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    
    submissions.forEach(sub => {
      breakdown[sub.status] = (breakdown[sub.status] || 0) + 1;
    });

    return breakdown;
  }

  private calculateCategoryBreakdown(submissions: any[]): Array<{ category: string; count: number; percentage: number }> {
    const categoryCount: Record<string, number> = {};
    
    submissions.forEach(sub => {
      // Extract category from submission data
      let category = 'Other';
      
      if (sub.submissionData) {
        // Try to extract category from various possible fields
        const data = typeof sub.submissionData === 'string' 
          ? JSON.parse(sub.submissionData) 
          : sub.submissionData;
        
        category = data.category || data.type || data.issueType || data.priority || 'Other';
      }
      
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const total = submissions.length;
    
    return Object.entries(categoryCount)
      .map(([category, count]) => ({
        category,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 categories
  }
}