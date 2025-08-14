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

  async getPMScheduleById(req: Request, res: Response) {
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

  async createPMSchedule(req: Request, res: Response) {
    try {
      const newSchedule = await pmScheduleService.createPMSchedule(req.body);
      res.status(201).json(newSchedule);
    } catch (error) {
      console.error('Error creating PM schedule:', error);
      res.status(500).json({ error: 'Failed to create PM schedule' });
    }
  }

  async updatePMSchedule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updatedSchedule = await pmScheduleService.updatePMSchedule(Number(id), req.body);
      res.json(updatedSchedule);
    } catch (error) {
      console.error('Error updating PM schedule:', error);
      res.status(500).json({ error: 'Failed to update PM schedule' });
    }
  }

  async deletePMSchedule(req: Request, res: Response) {
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