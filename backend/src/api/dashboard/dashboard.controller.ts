import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

const dashboardService = new DashboardService();

export class DashboardController {
  async getStats(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const stats = await dashboardService.getStats(organizationId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  }

  async getWorkOrderTrends(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const { period } = req.query;
      const validPeriods = ['week', 'month', 'year'];
      const selectedPeriod = validPeriods.includes(period as string) ? (period as 'week' | 'month' | 'year') : 'month';

      const trends = await dashboardService.getWorkOrderTrends(organizationId, selectedPeriod);
      res.json(trends);
    } catch (error) {
      console.error('Error fetching work order trends:', error);
      res.status(500).json({ error: 'Failed to fetch work order trends' });
    }
  }

  async getAssetHealth(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const assetHealth = await dashboardService.getAssetHealth(organizationId);
      res.json(assetHealth);
    } catch (error) {
      console.error('Error fetching asset health:', error);
      res.status(500).json({ error: 'Failed to fetch asset health' });
    }
  }

  async getRecentWorkOrders(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const { limit } = req.query;
      const workOrders = await dashboardService.getRecentWorkOrders(
        organizationId, 
        limit ? parseInt(limit as string) : 10
      );
      res.json(workOrders);
    } catch (error) {
      console.error('Error fetching recent work orders:', error);
      res.status(500).json({ error: 'Failed to fetch recent work orders' });
    }
  }

  async getMaintenanceSchedule(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const schedule = await dashboardService.getMaintenanceSchedule(organizationId);
      res.json(schedule);
    } catch (error) {
      console.error('Error fetching maintenance schedule:', error);
      res.status(500).json({ error: 'Failed to fetch maintenance schedule' });
    }
  }
}