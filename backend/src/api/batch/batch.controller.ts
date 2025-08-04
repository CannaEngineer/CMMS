import { Request, Response } from 'express';
import { BatchService } from './batch.service';

const batchService = new BatchService();

export class BatchController {
  // Batch multiple API calls into a single request
  async batchRequest(req: Request, res: Response) {
    try {
      const { requests } = req.body;
      const organizationId = req.user?.organizationId;

      if (!requests || !Array.isArray(requests)) {
        return res.status(400).json({ error: 'Invalid batch request format' });
      }

      const results = await batchService.processBatchRequests(requests, organizationId);
      
      res.json({
        success: true,
        results,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Batch request error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Dashboard-specific batch endpoint for optimal loading
  async dashboardBatch(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      const result = await batchService.getDashboardData(organizationId);
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Dashboard batch error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Sync offline changes in batch
  async syncBatch(req: Request, res: Response) {
    try {
      const { changes } = req.body;
      const organizationId = req.user?.organizationId;

      if (!changes || !Array.isArray(changes)) {
        return res.status(400).json({ error: 'Invalid sync request format' });
      }

      const results = await batchService.processSyncChanges(changes, organizationId);
      
      res.json({
        success: true,
        results,
        synced: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Sync batch error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Work order actions batch (for swipe actions)
  async workOrderActionsBatch(req: Request, res: Response) {
    try {
      const { actions } = req.body;
      const organizationId = req.user?.organizationId;

      const results = await batchService.processWorkOrderActions(actions, organizationId);
      
      res.json({
        success: true,
        results,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Work order actions batch error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}