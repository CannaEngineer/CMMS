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

      // Convert numeric fields from strings to numbers
      const partData = {
        ...req.body,
        organizationId,
        stockLevel: req.body.stockLevel ? parseInt(req.body.stockLevel) : 0,
        reorderPoint: req.body.reorderPoint ? parseInt(req.body.reorderPoint) : 0,
        unitCost: req.body.unitCost || req.body.unitPrice ? parseFloat(req.body.unitCost || req.body.unitPrice) : null,
        totalCost: req.body.totalCost ? parseFloat(req.body.totalCost) : null,
        supplierId: req.body.supplierId ? parseInt(req.body.supplierId) : null,
        legacyId: req.body.legacyId ? parseInt(req.body.legacyId) : null,
      };
      
      // Remove undefined values and fields not in schema
      Object.keys(partData).forEach(key => {
        if (partData[key] === undefined || partData[key] === null) {
          delete partData[key];
        }
      });
      
      // Remove fields that don't exist in the Part model
      delete partData.unitPrice;
      delete partData.categoryId;

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

      // Convert numeric fields from strings to numbers
      const updateData = {
        ...req.body,
        stockLevel: req.body.stockLevel !== undefined ? parseInt(req.body.stockLevel) : undefined,
        reorderPoint: req.body.reorderPoint !== undefined ? parseInt(req.body.reorderPoint) : undefined,
        unitCost: req.body.unitCost !== undefined || req.body.unitPrice !== undefined ? 
          parseFloat(req.body.unitCost || req.body.unitPrice) : undefined,
        totalCost: req.body.totalCost !== undefined ? parseFloat(req.body.totalCost) : undefined,
        supplierId: req.body.supplierId ? parseInt(req.body.supplierId) : undefined,
        legacyId: req.body.legacyId ? parseInt(req.body.legacyId) : undefined,
      };
      
      // Remove undefined values and fields not in schema
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      // Remove fields that don't exist in the Part model
      delete updateData.unitPrice;
      delete updateData.categoryId;

      const part = await partService.updatePart(parseInt(id), organizationId, updateData);
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

  async batchCreateOrMerge(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const partsData = req.body.parts;
      if (!Array.isArray(partsData) || partsData.length === 0) {
        return res.status(400).json({ error: 'Parts array is required' });
      }

      // Add organization ID to each part
      const partsWithOrgId = partsData.map(part => ({
        ...part,
        organizationId,
      }));

      const results = await partService.batchCreateOrMergeParts(partsWithOrgId);
      
      res.json({
        success: true,
        message: `Processed ${results.total} parts: ${results.created} created, ${results.merged} merged`,
        results,
      });
    } catch (error) {
      console.error('Error in batch create/merge:', error);
      res.status(500).json({ error: 'Failed to process parts batch' });
    }
  }

  async cleanupDuplicates(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const results = await partService.cleanupDuplicates(organizationId);
      
      res.json({
        success: true,
        message: `Cleanup complete: ${results.partsMerged} duplicates merged into ${results.groupsProcessed} primary parts`,
        results,
      });
    } catch (error) {
      console.error('Error in cleanup duplicates:', error);
      res.status(500).json({ error: 'Failed to cleanup duplicates' });
    }
  }

  async getRecentActivity(req: Request, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!organizationId) {
        return res.status(400).json({ error: 'Organization ID required' });
      }

      const activity = await partService.getRecentActivity(organizationId, limit);
      res.json(activity);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      res.status(500).json({ error: 'Failed to fetch recent activity' });
    }
  }
}