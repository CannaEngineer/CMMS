import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const settingsController = {
  // Clean slate - delete all operational data
  async cleanSlate(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;
      const { confirmationCode } = req.body;

      // Verify user is an admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { organization: true }
      });

      if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ 
          success: false, 
          error: 'Only administrators can perform this action' 
        });
      }

      // Verify confirmation code
      const expectedCode = `DELETE-${user.organization.name.toUpperCase().replace(/\s+/g, '-')}`;
      if (confirmationCode !== expectedCode) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid confirmation code',
          hint: 'The confirmation code should be: DELETE-[ORGANIZATION-NAME]'
        });
      }

      console.log(`CLEAN SLATE initiated by user ${user.email} for organization ${user.organization.name}`);

      // Start transaction to delete all data
      const result = await prisma.$transaction(async (tx) => {
        const deletedCounts = {
          workOrders: 0,
          pmSchedules: 0,
          pmTasks: 0,
          pmTriggers: 0,
          assets: 0,
          locations: 0,
          parts: 0,
          suppliers: 0,
          portals: 0,
          comments: 0,
          attachments: 0,
          maintenanceHistory: 0,
          importHistory: 0
        };

        // First, collect all entity IDs for this organization
        console.log('Collecting entity IDs for organization:', organizationId);
        
        const workOrderIds = await tx.workOrder.findMany({
          where: { organizationId },
          select: { id: true }
        }).then(results => results.map(wo => wo.id));

        const assetIds = await tx.asset.findMany({
          where: { organizationId },
          select: { id: true }
        }).then(results => results.map(a => a.id));

        const locationIds = await tx.location.findMany({
          where: { organizationId },
          select: { id: true }
        }).then(results => results.map(l => l.id));

        const partIds = await tx.part.findMany({
          where: { organizationId },
          select: { id: true }
        }).then(results => results.map(p => p.id));

        const pmScheduleIds = await tx.pMSchedule.findMany({
          where: { 
            asset: { organizationId }
          },
          select: { id: true }
        }).then(results => results.map(pm => pm.id));

        console.log(`Found entities: WO=${workOrderIds.length}, Assets=${assetIds.length}, Locations=${locationIds.length}, Parts=${partIds.length}, PM=${pmScheduleIds.length}`);

        // Delete in order of dependencies
        
        // 1. Delete all comments related to this organization's entities (using polymorphic relation)
        if (workOrderIds.length > 0 || assetIds.length > 0 || locationIds.length > 0 || partIds.length > 0 || pmScheduleIds.length > 0) {
          deletedCounts.comments = await tx.comment.deleteMany({
            where: { 
              OR: [
                ...(workOrderIds.length > 0 ? [{ entityType: 'workOrder', entityId: { in: workOrderIds } }] : []),
                ...(assetIds.length > 0 ? [{ entityType: 'asset', entityId: { in: assetIds } }] : []),
                ...(locationIds.length > 0 ? [{ entityType: 'location', entityId: { in: locationIds } }] : []),
                ...(partIds.length > 0 ? [{ entityType: 'part', entityId: { in: partIds } }] : []),
                ...(pmScheduleIds.length > 0 ? [{ entityType: 'pmSchedule', entityId: { in: pmScheduleIds } }] : [])
              ]
            }
          }).then(r => r.count);
        }

        // 2. Attachment model doesn't exist in current schema
        deletedCounts.attachments = 0;

        // 3. Delete work orders
        deletedCounts.workOrders = await tx.workOrder.deleteMany({
          where: { organizationId }
        }).then(r => r.count);

        // 4. Delete PM related data
        deletedCounts.maintenanceHistory = await tx.maintenanceHistory.deleteMany({
          where: { 
            pmSchedule: {
              asset: {
                organizationId
              }
            }
          }
        }).then(r => r.count);

        deletedCounts.pmTriggers = await tx.pMTrigger.deleteMany({
          where: { 
            pmSchedule: {
              asset: {
                organizationId
              }
            }
          }
        }).then(r => r.count);

        // Delete PM Schedule Tasks (junction table)
        await tx.pMScheduleTask.deleteMany({
          where: {
            pmSchedule: {
              asset: {
                organizationId
              }
            }
          }
        });

        deletedCounts.pmSchedules = await tx.pMSchedule.deleteMany({
          where: { 
            asset: {
              organizationId
            }
          }
        }).then(r => r.count);

        deletedCounts.pmTasks = await tx.pMTask.deleteMany({
          where: { organizationId }
        }).then(r => r.count);

        // 3. Delete portals
        deletedCounts.portals = await tx.portal.deleteMany({
          where: { organizationId }
        }).then(r => r.count);

        // 4. Delete inventory
        deletedCounts.parts = await tx.part.deleteMany({
          where: { organizationId }
        }).then(r => r.count);

        deletedCounts.suppliers = await tx.supplier.deleteMany({
          where: { organizationId }
        }).then(r => r.count);

        // 5. Delete assets
        deletedCounts.assets = await tx.asset.deleteMany({
          where: { organizationId }
        }).then(r => r.count);

        // 6. Delete locations
        deletedCounts.locations = await tx.location.deleteMany({
          where: { organizationId }
        }).then(r => r.count);

        // 7. Delete import history
        deletedCounts.importHistory = await tx.importHistory.deleteMany({
          where: { organizationId }
        }).then(r => r.count);

        return deletedCounts;
      }, {
        timeout: 30000 // 30 second timeout for large deletions
      });

      console.log(`CLEAN SLATE completed for organization ${user.organization.name}:`, result);

      res.json({
        success: true,
        message: 'All operational data has been deleted successfully',
        deletedCounts: result,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Clean slate error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to clean database',
        details: error.message 
      });
    }
  },

  // Get organization settings
  async getSettings(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;

      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          email: true,
          website: true,
          createdAt: true,
          _count: {
            select: {
              users: true,
              assets: true,
              workOrders: true,
              locations: true,
              parts: true
            }
          }
        }
      });

      res.json({
        success: true,
        organization,
        stats: organization?._count
      });

    } catch (error: any) {
      console.error('Get settings error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get settings' 
      });
    }
  }
};