import { Request, Response } from 'express';
import { DashboardService } from '../dashboard/dashboard.service';

const dashboardService = new DashboardService();

export class MaintenanceController {
  async getStats(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      // Delegate to dashboard service for maintenance stats
      const stats = await dashboardService.getStats(organizationId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching maintenance stats:', error);
      res.status(500).json({ error: 'Failed to fetch maintenance stats' });
    }
  }
}