import { Request, Response } from 'express';
import { PartService } from './part.service';

const partService = new PartService();

export class PartController {
  async getAllParts(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const parts = await partService.getAllParts(organizationId);
      res.json(parts);
    } catch (error) {
      console.error('Error fetching parts:', error);
      res.status(500).json({ error: 'Failed to fetch parts' });
    }
  }

  async getPartById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const part = await partService.getPartById(parseInt(id), organizationId);
      
      if (!part) {
        return res.status(404).json({ error: 'Part not found' });
      }

      res.json(part);
    } catch (error) {
      console.error('Error fetching part:', error);
      res.status(500).json({ error: 'Failed to fetch part' });
    }
  }

  async createPart(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const partData = {
        ...req.body,
        organizationId,
      };

      const part = await partService.createPart(partData);
      res.status(201).json(part);
    } catch (error) {
      console.error('Error creating part:', error);
      res.status(500).json({ error: 'Failed to create part' });
    }
  }

  async updatePart(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const part = await partService.updatePart(parseInt(id), organizationId, req.body);
      res.json(part);
    } catch (error) {
      console.error('Error updating part:', error);
      res.status(500).json({ error: 'Failed to update part' });
    }
  }

  async deletePart(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      await partService.deletePart(parseInt(id), organizationId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting part:', error);
      res.status(500).json({ error: 'Failed to delete part' });
    }
  }

  async getLowStockParts(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const parts = await partService.getLowStockParts(organizationId);
      res.json(parts);
    } catch (error) {
      console.error('Error fetching low stock parts:', error);
      res.status(500).json({ error: 'Failed to fetch low stock parts' });
    }
  }

  async updateStockLevel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const organizationId = req.user?.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const part = await partService.updateStockLevel(parseInt(id), organizationId, quantity);
      res.json(part);
    } catch (error) {
      console.error('Error updating stock level:', error);
      res.status(500).json({ error: 'Failed to update stock level' });
    }
  }
}