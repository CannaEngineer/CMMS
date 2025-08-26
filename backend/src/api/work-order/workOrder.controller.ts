import { Request, Response } from 'express';
import { z } from 'zod';
import * as workOrderService from './workOrder.service';
import { TimeLogService } from './timeLog.service';
import { WorkOrderNotesService } from './workOrderNotes.service';
import { WorkOrderShareService } from './workOrderShare.service';
import { WorkOrderTaskService } from './workOrderTask.service';
import { MaintenanceHistoryService } from '../maintenance-history/maintenanceHistory.service';

const workOrderSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assetId: z.number().optional().nullable(),
  assignedToId: z.number().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
});

const timeLogSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  hours: z.number().min(0.1, 'Hours must be at least 0.1').max(24, 'Hours cannot exceed 24'),
  category: z.enum(['LABOR', 'TRAVEL', 'MATERIALS', 'OTHER']).optional(),
  billable: z.boolean().optional(),
  loggedAt: z.string().datetime().optional(),
});

const timeLogService = new TimeLogService();
const notesService = new WorkOrderNotesService();
const shareService = new WorkOrderShareService();
const taskService = new WorkOrderTaskService();
const historyService = new MaintenanceHistoryService();

export const getAllWorkOrders = async (req: Request, res: Response) => {
  const { organizationId } = req.user;
  const { assetId } = req.query;
  
  // If assetId is provided, filter work orders by asset
  if (assetId) {
    const workOrders = await workOrderService.getWorkOrdersByAssetId(Number(assetId), organizationId);
    res.status(200).json(workOrders);
  } else {
    const workOrders = await workOrderService.getAllWorkOrders(organizationId);
    res.status(200).json(workOrders);
  }
};

export const getWorkOrderById = async (req: Request, res: Response) => {
  const { organizationId } = req.user;
  const workOrder = await workOrderService.getWorkOrderById(Number(req.params.id), organizationId);
  if (workOrder) {
    res.status(200).json(workOrder);
  } else {
    res.status(404).json({ error: 'Work Order not found' });
  }
};

export const getWorkOrderProgress = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user;
    const workOrderId = Number(req.params.id);
    
    // Verify work order exists and belongs to user's organization
    const workOrder = await workOrderService.getWorkOrderById(workOrderId, organizationId);
    if (!workOrder) {
      return res.status(404).json({ error: 'Work Order not found' });
    }
    
    // Get task completion statistics
    const taskStats = await taskService.getTaskCompletionStats(workOrderId);
    
    // Return progress data in the format expected by frontend
    const progressData = {
      completionPercentage: Math.round(taskStats.completionRate),
      totalTasks: taskStats.total,
      completedTasks: taskStats.completed,
      inProgressTasks: taskStats.inProgress,
      notStartedTasks: taskStats.notStarted,
      skippedTasks: taskStats.skipped,
      failedTasks: taskStats.failed,
      estimatedTotalMinutes: taskStats.estimatedTotalMinutes,
      actualTotalMinutes: taskStats.actualTotalMinutes
    };
    
    res.status(200).json(progressData);
  } catch (error) {
    console.error('Error fetching work order progress:', error);
    res.status(500).json({ error: 'Failed to fetch work order progress' });
  }
};

export const createWorkOrder = async (req: Request, res: Response) => {
  try {
    const validatedData = workOrderSchema.parse(req.body);
    const organizationId = req.user?.organizationId;
    const userId = req.user?.id;
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }
    
    const workOrder = await workOrderService.createWorkOrder(validatedData, organizationId, userId);
    res.status(201).json(workOrder);
  } catch (error) {
    console.error('Error creating work order:', error);
    res.status(400).json({ error: error.message });
  }
};

export const updateWorkOrder = async (req: Request, res: Response) => {
  try {
    // Convert string IDs to numbers if needed, but handle null properly for unassignment
    const processedBody = {
      ...req.body,
      assetId: req.body.assetId ? Number(req.body.assetId) : undefined,
      assignedToId: req.body.hasOwnProperty('assignedToId') 
        ? (req.body.assignedToId === null || req.body.assignedToId === undefined || req.body.assignedToId === "" || req.body.assignedToId === 0) 
          ? null 
          : Number(req.body.assignedToId)
        : undefined,
      estimatedHours: req.body.estimatedHours ? Number(req.body.estimatedHours) : undefined,
    };
    
    const data = workOrderSchema.partial().parse(processedBody);
    const { organizationId, id: userId } = req.user;
    const workOrder = await workOrderService.updateWorkOrder(Number(req.params.id), data, organizationId, userId);
    
    if (!workOrder) {
      return res.status(404).json({ error: 'Work Order not found' });
    }
    
    res.status(200).json(workOrder);
  } catch (error) {
    console.error('Error updating work order:', error);
    res.status(400).json({ error: error.message });
  }
};

export const updateWorkOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Validate status is a valid enum value
    const statusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELED']);
    const validatedStatus = statusSchema.parse(status);
    
    const { organizationId, id: userId } = req.user;
    const workOrderId = Number(req.params.id);
    
    // Update work order with new status
    const data: any = { status: validatedStatus };
    
    // If notes are provided, we could store them separately
    // For now, we'll just update the status
    const workOrder = await workOrderService.updateWorkOrder(workOrderId, data, organizationId, userId);
    
    if (!workOrder) {
      return res.status(404).json({ error: 'Work Order not found' });
    }
    
    // If notes were provided, add them as a note
    if (notes && notes.trim()) {
      try {
        await notesService.addNote(workOrderId, userId, notes.trim(), false);
      } catch (noteError) {
        console.error('Error adding status note:', noteError);
        // Don't fail the status update if note fails
      }
    }
    
    res.status(200).json({
      ...workOrder,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Error updating work order status:', error);
    res.status(400).json({ error: error.message || 'Invalid request. Please check your input.' });
  }
};

export const deleteWorkOrder = async (req: Request, res: Response) => {
  const { organizationId } = req.user;
  await workOrderService.deleteWorkOrder(Number(req.params.id), organizationId);
  res.status(204).send();
};

export const getRecentWorkOrders = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user;
    const { limit } = req.query;
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }
    
    const limitValue = limit ? parseInt(limit as string) : 10;
    const workOrders = await workOrderService.getRecentWorkOrders(organizationId, limitValue);
    res.status(200).json(workOrders);
  } catch (error) {
    console.error('Error fetching recent work orders:', error);
    res.status(500).json({ error: 'Failed to fetch recent work orders' });
  }
};

// Time Logging Controllers
export const logTime = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const data = timeLogSchema.parse(req.body);

    const timeLog = await timeLogService.logTime({
      workOrderId: Number(id),
      userId,
      description: data.description,
      hours: data.hours,
      category: data.category,
      billable: data.billable,
      loggedAt: data.loggedAt ? new Date(data.loggedAt) : undefined,
    });

    res.status(201).json(timeLog);
  } catch (error) {
    console.error('Error logging time:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getTimeLogs = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const timeLogs = await timeLogService.getTimeLogsForWorkOrder(Number(id));
    res.json(timeLogs);
  } catch (error) {
    console.error('Error fetching time logs:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateTimeLog = async (req: Request, res: Response) => {
  try {
    const { timeLogId } = req.params;
    const userId = req.user.id;
    const data = timeLogSchema.partial().parse(req.body);

    const timeLog = await timeLogService.updateTimeLog(Number(timeLogId), userId, data);
    res.json(timeLog);
  } catch (error) {
    console.error('Error updating time log:', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteTimeLog = async (req: Request, res: Response) => {
  try {
    const { timeLogId } = req.params;
    const userId = req.user.id;

    const result = await timeLogService.deleteTimeLog(Number(timeLogId), userId);
    res.json(result);
  } catch (error) {
    console.error('Error deleting time log:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getTimeStats = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stats = await timeLogService.getWorkOrderTimeStats(Number(id));
    res.json(stats);
  } catch (error) {
    console.error('Error fetching time stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Note/Comment Controllers for Work Orders
export const addNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, isInternal } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const note = await notesService.addNote(
      Number(id),
      userId,
      content.trim(),
      isInternal || false
    );

    res.status(201).json(note);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getNotes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { includeInternal = 'true' } = req.query;
    
    const notes = await notesService.getNotes(
      Number(id),
      includeInternal === 'true'
    );

    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: error.message });
  }
};

// Work Order Sharing Controllers
export const createShare = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      expiresAt, 
      maxViews, 
      allowComments = true, 
      allowDownload = false,
      viewerCanSeeAssignee = false,
      sanitizationLevel = 'STANDARD'
    } = req.body;
    
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    const share = await shareService.createShare({
      workOrderId: Number(id),
      organizationId,
      createdById: userId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      maxViews,
      allowComments,
      allowDownload,
      viewerCanSeeAssignee,
      sanitizationLevel
    });

    // Generate URL based on request origin
    const origin = req.get('origin');
    const referer = req.get('referer');
    
    let shareUrl;
    
    // If we have an origin header (from browser), use that
    if (origin) {
      shareUrl = `${origin}/public/share/${share.shareToken}`;
    } 
    // If we have a referer header, parse the domain from it
    else if (referer) {
      const refererUrl = new URL(referer);
      shareUrl = `${refererUrl.protocol}//${refererUrl.host}/public/share/${share.shareToken}`;
    }
    // If we have a configured frontend URL, use that
    else if (process.env.FRONTEND_URL) {
      shareUrl = `${process.env.FRONTEND_URL}/public/share/${share.shareToken}`;
    }
    // Fallback to constructing from request
    else {
      const protocol = req.protocol;
      const host = req.get('host');
      
      // If request is coming to backend port, assume frontend is on 5173
      if (host?.includes(':5000')) {
        shareUrl = `http://localhost:5173/public/share/${share.shareToken}`;
      } else {
        // For production, use the same host
        shareUrl = `${protocol}://${host}/public/share/${share.shareToken}`;
      }
    }

    res.status(201).json({
      id: share.id,
      shareToken: share.shareToken,
      shareUrl,
      expiresAt: share.expiresAt,
      maxViews: share.maxViews,
      allowComments: share.allowComments,
      allowDownload: share.allowDownload,
      createdAt: share.createdAt
    });
  } catch (error) {
    console.error('Error creating share:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getShares = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const shares = await shareService.getSharesByWorkOrder(Number(id));
    
    const formattedShares = shares.map(share => ({
      id: share.id,
      shareToken: share.shareToken,
      shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/share/${share.shareToken}`,
      isActive: share.isActive,
      expiresAt: share.expiresAt,
      maxViews: share.maxViews,
      currentViews: share.currentViews,
      allowComments: share.allowComments,
      allowDownload: share.allowDownload,
      createdBy: share.createdBy,
      createdAt: share.createdAt
    }));

    res.json(formattedShares);
  } catch (error) {
    console.error('Error fetching shares:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deactivateShare = async (req: Request, res: Response) => {
  try {
    const { shareId } = req.params;
    
    await shareService.deactivateShare(shareId);
    
    res.json({ message: 'Share deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating share:', error);
    res.status(500).json({ error: error.message });
  }
};

export const unassignWorkOrder = async (req: Request, res: Response) => {
  try {
    const { organizationId, id: userId } = req.user;
    const workOrderId = Number(req.params.id);
    
    console.log('Unassigning work order:', { workOrderId, organizationId, userId });
    
    // Get the work order first to check current assignment
    const currentWorkOrder = await workOrderService.getWorkOrderById(workOrderId, organizationId);
    if (!currentWorkOrder) {
      return res.status(404).json({ error: 'Work Order not found' });
    }
    
    console.log('Current work order assignment:', { 
      assignedToId: currentWorkOrder.assignedToId, 
      assignedTo: currentWorkOrder.assignedTo 
    });
    
    // Check if work order is currently assigned
    if (!currentWorkOrder.assignedToId && !currentWorkOrder.assignedTo) {
      return res.status(200).json({ 
        ...currentWorkOrder, 
        message: 'Work order was already unassigned' 
      });
    }
    
    // Update work order to unassign
    const data = { assignedToId: null };
    const updatedWorkOrder = await workOrderService.updateWorkOrder(workOrderId, data, organizationId, userId);
    
    console.log('Work order unassigned successfully:', {
      id: updatedWorkOrder?.id,
      assignedToId: updatedWorkOrder?.assignedToId,
      assignedTo: updatedWorkOrder?.assignedTo
    });
    
    res.status(200).json({
      ...updatedWorkOrder,
      message: 'Work order unassigned successfully'
    });
  } catch (error) {
    console.error('Error unassigning work order:', error);
    res.status(500).json({ error: error.message || 'Failed to unassign work order' });
  }
};

export const sendNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId, id: userId } = req.user;
    const { message } = req.body;
    
    // Get the work order details
    const workOrder = await workOrderService.getWorkOrderById(Number(id), organizationId);
    if (!workOrder) {
      return res.status(404).json({ error: 'Work Order not found' });
    }
    
    // Check if work order has an assignee
    if (!workOrder.assignedTo || !workOrder.assignedTo.id) {
      return res.status(400).json({ error: 'Work order must have an assignee to send notification' });
    }
    
    try {
      // Try to use the notification service first
      const { NotificationService } = require('../notification/notification.service');
      const notificationService = new NotificationService();
      
      const notificationData = {
        userId: workOrder.assignedTo.id,
        organizationId: organizationId,
        title: `Work Order Update: ${workOrder.title}`,
        message: message || `You have been notified about work order #${workOrder.id}. Please review the details and take appropriate action.`,
        category: 'WORK_ORDER' as any,
        priority: workOrder.priority === 'URGENT' ? 'HIGH' as any : 'MEDIUM' as any,
        relatedEntityType: 'WorkOrder',
        relatedEntityId: workOrder.id,
        actionUrl: `/work-orders/${workOrder.id}`,
        actionLabel: 'View Work Order',
        createdById: userId,
      };
      
      await notificationService.createNotification(notificationData);
      
      // Also send email with work order link
      try {
        const { emailService } = require('../../services/email.service');
        
        if (workOrder.assignedTo.email) {
          // Create a public share link for the work order
          let workOrderUrl = '';
          try {
            const share = await shareService.createShare({
              workOrderId: workOrder.id,
              organizationId: organizationId,
              createdById: userId,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
              maxViews: 50,
              allowComments: false,
              allowDownload: false,
              viewerCanSeeAssignee: true,
              sanitizationLevel: 'STANDARD'
            });
            
            // Build the public share URL
            const frontendUrl = process.env.FRONTEND_URL || 'https://cmms-orpin.vercel.app';
            workOrderUrl = `${frontendUrl}/public/share/${share.shareToken}`;
          } catch (shareError) {
            console.log('Could not create public share, using login link:', shareError.message);
            const frontendUrl = process.env.FRONTEND_URL || 'https://cmms-orpin.vercel.app';
            workOrderUrl = `${frontendUrl}/work-orders/${workOrder.id}`;
          }
          
          const emailContent = {
            to: workOrder.assignedTo.email,
            subject: `Work Order Update: ${workOrder.title}`,
            html: `
              <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">Work Order Notification</h1>
                </div>
                
                <div style="padding: 30px 20px;">
                  <p style="font-size: 16px;">Hello ${workOrder.assignedTo.name},</p>
                  <p style="font-size: 16px;">${message || `You have been notified about work order #${workOrder.id}. Please review the details and take appropriate action.`}</p>
                  
                  <div style="margin: 25px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #1976d2; border-radius: 4px;">
                    <h3 style="margin-top: 0; color: #1976d2;">Work Order Details:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr><td style="padding: 8px 0; font-weight: bold; width: 120px;">ID:</td><td style="padding: 8px 0;">#${workOrder.id}</td></tr>
                      <tr><td style="padding: 8px 0; font-weight: bold;">Title:</td><td style="padding: 8px 0;">${workOrder.title}</td></tr>
                      <tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td style="padding: 8px 0;"><span style="background-color: #e3f2fd; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${workOrder.status}</span></td></tr>
                      <tr><td style="padding: 8px 0; font-weight: bold;">Priority:</td><td style="padding: 8px 0;"><span style="background-color: ${workOrder.priority === 'URGENT' ? '#ffebee' : workOrder.priority === 'HIGH' ? '#fff3e0' : '#e8f5e8'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: ${workOrder.priority === 'URGENT' ? '#c62828' : workOrder.priority === 'HIGH' ? '#ef6c00' : '#2e7d32'};">${workOrder.priority}</span></td></tr>
                      ${workOrder.description ? `<tr><td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Description:</td><td style="padding: 8px 0;">${workOrder.description}</td></tr>` : ''}
                    </table>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${workOrderUrl}" style="display: inline-block; background-color: #1976d2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Work Order</a>
                  </div>
                  
                  <p style="font-size: 14px; color: #666;">
                    Click the button above to view the full work order details. If you're not logged in, you'll be able to view a public version of this work order.
                  </p>
                </div>
                
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #ddd;">
                  <p style="margin: 0; font-size: 12px; color: #666;">
                    This email was sent from the <strong>Elevated Compliance CMMS</strong> system.<br>
                    If you have any questions, please contact your system administrator.
                  </p>
                </div>
              </div>
            `
          };
          
          await emailService.sendEmail(emailContent);
          console.log('Notification email sent successfully to:', workOrder.assignedTo.email);
        }
      } catch (emailError) {
        console.log('Email notification failed but database notification succeeded:', emailError.message);
        // Don't throw error here since database notification worked
      }
      
    } catch (notificationError) {
      console.log('Database notification failed, sending email directly:', notificationError.message);
      
      // Fallback: Send email directly without storing in database
      try {
        const { emailService } = require('../../services/email.service');
        
        if (workOrder.assignedTo.email) {
          // Create a public share link for the work order
          let workOrderUrl = '';
          try {
            const share = await shareService.createShare({
              workOrderId: workOrder.id,
              organizationId: organizationId,
              createdById: userId,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
              maxViews: 50,
              allowComments: false,
              allowDownload: false,
              viewerCanSeeAssignee: true,
              sanitizationLevel: 'STANDARD'
            });
            
            // Build the public share URL
            const frontendUrl = process.env.FRONTEND_URL || 'https://cmms-orpin.vercel.app';
            workOrderUrl = `${frontendUrl}/public/share/${share.shareToken}`;
          } catch (shareError) {
            console.log('Could not create public share, using login link:', shareError.message);
            const frontendUrl = process.env.FRONTEND_URL || 'https://cmms-orpin.vercel.app';
            workOrderUrl = `${frontendUrl}/work-orders/${workOrder.id}`;
          }
          
          const emailContent = {
            to: workOrder.assignedTo.email,
            subject: `Work Order Update: ${workOrder.title}`,
            html: `
              <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">Work Order Notification</h1>
                </div>
                
                <div style="padding: 30px 20px;">
                  <p style="font-size: 16px;">Hello ${workOrder.assignedTo.name},</p>
                  <p style="font-size: 16px;">${message || `You have been notified about work order #${workOrder.id}. Please review the details and take appropriate action.`}</p>
                  
                  <div style="margin: 25px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #1976d2; border-radius: 4px;">
                    <h3 style="margin-top: 0; color: #1976d2;">Work Order Details:</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr><td style="padding: 8px 0; font-weight: bold; width: 120px;">ID:</td><td style="padding: 8px 0;">#${workOrder.id}</td></tr>
                      <tr><td style="padding: 8px 0; font-weight: bold;">Title:</td><td style="padding: 8px 0;">${workOrder.title}</td></tr>
                      <tr><td style="padding: 8px 0; font-weight: bold;">Status:</td><td style="padding: 8px 0;"><span style="background-color: #e3f2fd; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${workOrder.status}</span></td></tr>
                      <tr><td style="padding: 8px 0; font-weight: bold;">Priority:</td><td style="padding: 8px 0;"><span style="background-color: ${workOrder.priority === 'URGENT' ? '#ffebee' : workOrder.priority === 'HIGH' ? '#fff3e0' : '#e8f5e8'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: ${workOrder.priority === 'URGENT' ? '#c62828' : workOrder.priority === 'HIGH' ? '#ef6c00' : '#2e7d32'};">${workOrder.priority}</span></td></tr>
                      ${workOrder.description ? `<tr><td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Description:</td><td style="padding: 8px 0;">${workOrder.description}</td></tr>` : ''}
                    </table>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${workOrderUrl}" style="display: inline-block; background-color: #1976d2; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View Work Order</a>
                  </div>
                  
                  <p style="font-size: 14px; color: #666;">
                    Click the button above to view the full work order details. If you're not logged in, you'll be able to view a public version of this work order.
                  </p>
                </div>
                
                <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #ddd;">
                  <p style="margin: 0; font-size: 12px; color: #666;">
                    This email was sent from the <strong>Elevated Compliance CMMS</strong> system.<br>
                    If you have any questions, please contact your system administrator.
                  </p>
                </div>
              </div>
            `
          };
          
          await emailService.sendEmail(emailContent);
          console.log('Fallback email sent successfully to:', workOrder.assignedTo.email);
        }
      } catch (emailError) {
        console.error('Fallback email also failed:', emailError);
        throw new Error('Failed to send notification via database or email');
      }
    }
    
    res.json({ 
      message: 'Notification sent successfully',
      recipient: workOrder.assignedTo.name,
      workOrderId: workOrder.id
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

// Work Order Tasks Controller
export const getWorkOrderTasks = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user;
    const workOrderId = Number(req.params.id);
    
    // Verify work order exists and belongs to user's organization
    const workOrder = await workOrderService.getWorkOrderById(workOrderId, organizationId);
    if (!workOrder) {
      return res.status(404).json({ error: 'Work Order not found' });
    }
    
    // Get tasks for this work order
    const tasks = await taskService.getTasksByWorkOrder(workOrderId);
    
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching work order tasks:', error);
    res.status(500).json({ error: 'Failed to fetch work order tasks' });
  }
};

// Work Order History Controller
export const getWorkOrderHistory = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user;
    const workOrderId = Number(req.params.id);
    
    // Verify work order exists and belongs to user's organization
    const workOrder = await workOrderService.getWorkOrderById(workOrderId, organizationId);
    if (!workOrder) {
      return res.status(404).json({ error: 'Work Order not found' });
    }
    
    // Get maintenance history for the work order's asset
    if (!workOrder.assetId) {
      return res.status(200).json([]); // Return empty array if no asset associated
    }
    
    const history = await historyService.getMaintenanceHistory(workOrder.assetId);
    
    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching work order history:', error);
    res.status(500).json({ error: 'Failed to fetch work order history' });
  }
};
