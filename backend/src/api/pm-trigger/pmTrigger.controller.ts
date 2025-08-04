import { Request, Response } from 'express';
import { PMTriggerService } from './pmTrigger.service';

export class PMTriggerController {
  private pmTriggerService: PMTriggerService;

  constructor() {
    this.pmTriggerService = new PMTriggerService();
  }

  async getTriggersByPMSchedule(req: Request, res: Response) {
    try {
      const { scheduleId } = req.params;
      const triggers = await this.pmTriggerService.getTriggersByPMSchedule(parseInt(scheduleId));
      res.json(triggers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createTrigger(req: Request, res: Response) {
    try {
      const trigger = await this.pmTriggerService.createTrigger(req.body);
      res.status(201).json(trigger);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateTrigger(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const trigger = await this.pmTriggerService.updateTrigger(parseInt(id), req.body);
      res.json(trigger);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteTrigger(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.pmTriggerService.deleteTrigger(parseInt(id));
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async evaluateDueTriggers(req: Request, res: Response) {
    try {
      const dueTriggers = await this.pmTriggerService.evaluateTriggers();
      res.json({
        count: dueTriggers.length,
        triggers: dueTriggers
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async evaluateUsageBasedTriggers(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const triggeredList = await this.pmTriggerService.evaluateUsageBasedTriggers(parseInt(assetId));
      res.json({
        count: triggeredList.length,
        triggers: triggeredList
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async evaluateConditionBasedTriggers(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const { sensorData } = req.body;
      const triggeredList = await this.pmTriggerService.evaluateConditionBasedTriggers(
        parseInt(assetId),
        sensorData
      );
      res.json({
        count: triggeredList.length,
        triggers: triggeredList
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async markTriggerFired(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updatedTrigger = await this.pmTriggerService.markTriggerFired(parseInt(id));
      res.json(updatedTrigger);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getUpcomingTriggers(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : new Date();
      const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      
      const triggers = await this.pmTriggerService.getUpcomingTriggers(start, end);
      res.json(triggers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}