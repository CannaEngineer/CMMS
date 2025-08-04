import { Request, Response } from 'express';
import { MeterReadingService } from './meterReading.service';

export class MeterReadingController {
  private meterReadingService: MeterReadingService;

  constructor() {
    this.meterReadingService = new MeterReadingService();
  }

  async getMeterReadings(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const { meterType, limit } = req.query;
      
      const readings = await this.meterReadingService.getMeterReadings(
        parseInt(assetId),
        meterType as any,
        limit ? parseInt(limit as string) : undefined
      );
      
      res.json(readings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getLatestReadings(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const readings = await this.meterReadingService.getLatestReadings(parseInt(assetId));
      res.json(readings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createMeterReading(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const recordedById = (req as any).user.id;
      
      const reading = await this.meterReadingService.createMeterReading({
        ...req.body,
        assetId: parseInt(assetId),
        recordedById
      });
      
      res.status(201).json(reading);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateMeterReading(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const reading = await this.meterReadingService.updateMeterReading(parseInt(id), req.body);
      res.json(reading);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteMeterReading(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.meterReadingService.deleteMeterReading(parseInt(id));
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getMeterReadingTrends(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const { meterType, days } = req.query;
      
      if (!meterType) {
        return res.status(400).json({ error: 'meterType is required' });
      }
      
      const trends = await this.meterReadingService.getMeterReadingTrends(
        parseInt(assetId),
        meterType as any,
        days ? parseInt(days as string) : undefined
      );
      
      res.json(trends);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async bulkCreateMeterReadings(req: Request, res: Response) {
    try {
      const recordedById = (req as any).user.id;
      const readings = req.body.readings.map((reading: any) => ({
        ...reading,
        recordedById
      }));
      
      const created = await this.meterReadingService.bulkCreateMeterReadings(readings);
      res.status(201).json({
        count: created.length,
        readings: created
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAssetMeterTypes(req: Request, res: Response) {
    try {
      const { assetId } = req.params;
      const meterTypes = await this.meterReadingService.getAssetMeterTypes(parseInt(assetId));
      res.json(meterTypes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}