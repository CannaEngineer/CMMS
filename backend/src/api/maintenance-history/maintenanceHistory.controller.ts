import { Request, Response } from 'express';
import { MaintenanceHistoryService } from './maintenanceHistory.service';

export class MaintenanceHistoryController {
  private maintenanceHistoryService: MaintenanceHistoryService;

  constructor() {
    this.maintenanceHistoryService = new MaintenanceHistoryService();
  }

  async getMaintenanceHistory(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const { limit } = req.query;
      
      const history = await this.maintenanceHistoryService.getMaintenanceHistory(
        parseInt(assetId),
        limit ? parseInt(limit as string) : undefined
      );
      
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createMaintenanceRecord(req: Request, res: Response) {
    try {
      const record = await this.maintenanceHistoryService.createMaintenanceRecord(req.body);
      res.status(201).json(record);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateMaintenanceRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const record = await this.maintenanceHistoryService.updateMaintenanceRecord(parseInt(id), req.body);
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async completeMaintenanceRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      
      const record = await this.maintenanceHistoryService.completeMaintenanceRecord(
        parseInt(id),
        {
          ...req.body,
          performedById: userId
        }
      );
      
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async signOffMaintenanceRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const supervisorId = (req as any).user.id;
      const { complianceNotes } = req.body;
      
      const record = await this.maintenanceHistoryService.signOffMaintenanceRecord(
        parseInt(id),
        supervisorId,
        complianceNotes
      );
      
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMaintenanceStats(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const { days } = req.query;
      
      const stats = await this.maintenanceHistoryService.getMaintenanceStats(
        parseInt(assetId),
        days ? parseInt(days as string) : undefined
      );
      
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMaintenanceTrends(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const { days } = req.query;
      
      const trends = await this.maintenanceHistoryService.getMaintenanceTrends(
        parseInt(assetId),
        days ? parseInt(days as string) : undefined
      );
      
      res.json(trends);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getComplianceReport(req: Request, res: Response) {
    try {
      const organizationId = (req as any).user.organizationId;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }
      
      const report = await this.maintenanceHistoryService.getComplianceReport(
        organizationId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.json(report);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteMaintenanceRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.maintenanceHistoryService.deleteMaintenanceRecord(parseInt(id));
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}