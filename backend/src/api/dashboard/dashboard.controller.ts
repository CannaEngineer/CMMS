import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';

const dashboardService = new DashboardService();

export class DashboardController {
  async getStats(req: Request, res: Response) {
    try {
      console.log('[DashboardController] getStats called');
      console.log('[DashboardController] User info:', req.user);
      
      const organizationId = req.user?.organizationId;
      console.log('[DashboardController] Organization ID:', organizationId);
      
      if (!organizationId) {
        console.error('[DashboardController] No organization ID found');
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const stats = await dashboardService.getStats(organizationId);
      console.log('[DashboardController] Stats retrieved:', stats);
      res.json(stats);
    } catch (error) {
      console.error('[DashboardController] Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  }

  async getWorkOrderTrends(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const { period, days } = req.query;
      let selectedPeriod: 'week' | 'month' | 'year' = 'month';

      // Handle 'days' parameter by mapping to appropriate period
      if (days) {
        const numDays = parseInt(days as string);
        if (numDays <= 7) {
          selectedPeriod = 'week';
        } else if (numDays <= 365) {
          selectedPeriod = 'month';
        } else {
          selectedPeriod = 'year';
        }
      } else if (period) {
        const validPeriods = ['week', 'month', 'year'];
        selectedPeriod = validPeriods.includes(period as string) ? (period as 'week' | 'month' | 'year') : 'month';
      }

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