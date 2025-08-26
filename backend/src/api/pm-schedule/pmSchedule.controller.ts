import { Request, Response } from 'express';
import { PMScheduleService } from './pmSchedule.service';
import { AuthenticatedRequest } from '../../types/auth';

const pmScheduleService = new PMScheduleService();

export class PMScheduleController {
  async getAllPMSchedules(req: AuthenticatedRequest, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      const schedules = await pmScheduleService.getAllPMSchedules(organizationId);
      res.json(schedules);
    } catch (error) {
      console.error('Error fetching PM schedules:', error);
      res.status(500).json({ error: 'Failed to fetch PM schedules' });
    }
  }

  async getPMScheduleById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const schedule = await pmScheduleService.getPMScheduleById(Number(id));
      if (schedule) {
        res.json(schedule);
      } else {
        res.status(404).json({ error: 'PM Schedule not found' });
      }
    } catch (error) {
      console.error('Error fetching PM schedule by ID:', error);
      res.status(500).json({ error: 'Failed to fetch PM schedule' });
    }
  }

  async createPMSchedule(req: AuthenticatedRequest, res: Response) {
    try {
      const organizationId = req.user?.organizationId;
      
      if (!organizationId) {
        return res.status(401).json({ error: 'User not authenticated or organization not found' });
      }
      
      // Add organizationId to the request data
      const pmData = {
        ...req.body,
        organizationId
      };
      
      console.log('Creating PM schedule with data:', pmData);
      
      const newSchedule = await pmScheduleService.createPMSchedule(pmData);
      res.status(201).json(newSchedule);
    } catch (error) {
      console.error('Error creating PM schedule:', error);
      res.status(500).json({ 
        error: 'Failed to create PM schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updatePMSchedule(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    try {
      console.log(`[PMController] Updating PM schedule ${id} with data:`, req.body);
      console.log(`[PMController] User org ID:`, req.user?.organizationId);
      
      const updatedSchedule = await pmScheduleService.updatePMSchedule(Number(id), req.body);
      console.log(`[PMController] PM schedule ${id} updated successfully`);
      res.json(updatedSchedule);
    } catch (error) {
      console.error(`[PMController] Error updating PM schedule ${id}:`, error);
      res.status(500).json({ 
        error: 'Failed to update PM schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deletePMSchedule(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await pmScheduleService.deletePMSchedule(Number(id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting PM schedule:', error);
      res.status(500).json({ error: 'Failed to delete PM schedule' });
    }
  }
}