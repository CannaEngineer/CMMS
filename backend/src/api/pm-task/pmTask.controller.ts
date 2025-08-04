import { Request, Response } from 'express';
import { PMTaskService } from './pmTask.service';

export class PMTaskController {
  private pmTaskService: PMTaskService;

  constructor() {
    this.pmTaskService = new PMTaskService();
  }

  async getAllPMTasks(req: Request, res: Response) {
    try {
      const organizationId = (req as any).user.organizationId;
      const tasks = await this.pmTaskService.getAllPMTasks(organizationId);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPMTaskById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = (req as any).user.organizationId;
      const task = await this.pmTaskService.getPMTaskById(parseInt(id), organizationId);
      
      if (!task) {
        return res.status(404).json({ error: 'PM Task not found' });
      }
      
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async createPMTask(req: Request, res: Response) {
    try {
      const organizationId = (req as any).user.organizationId;
      const taskData = {
        ...req.body,
        organizationId
      };
      
      const task = await this.pmTaskService.createPMTask(taskData);
      res.status(201).json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async updatePMTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = (req as any).user.organizationId;
      const task = await this.pmTaskService.updatePMTask(parseInt(id), organizationId, req.body);
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deletePMTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = (req as any).user.organizationId;
      await this.pmTaskService.deletePMTask(parseInt(id), organizationId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getTasksByPMSchedule(req: Request, res: Response) {
    try {
      const { scheduleId } = req.params;
      const tasks = await this.pmTaskService.getTasksByPMSchedule(parseInt(scheduleId));
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async linkTaskToPMSchedule(req: Request, res: Response) {
    try {
      const { scheduleId } = req.params;
      const { pmTaskId, orderIndex, isRequired } = req.body;
      
      const link = await this.pmTaskService.linkTaskToPMSchedule({
        pmScheduleId: parseInt(scheduleId),
        pmTaskId,
        orderIndex,
        isRequired
      });
      
      res.status(201).json(link);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async unlinkTaskFromPMSchedule(req: Request, res: Response) {
    try {
      const { scheduleId, taskId } = req.params;
      await this.pmTaskService.unlinkTaskFromPMSchedule(
        parseInt(scheduleId),
        parseInt(taskId)
      );
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async reorderTasksInPMSchedule(req: Request, res: Response) {
    try {
      const { scheduleId } = req.params;
      const { taskOrders } = req.body;
      
      await this.pmTaskService.reorderTasksInPMSchedule(
        parseInt(scheduleId),
        taskOrders
      );
      
      res.json({ message: 'Tasks reordered successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getTaskTemplatesByType(req: Request, res: Response) {
    try {
      const { type } = req.params;
      const organizationId = (req as any).user.organizationId;
      const tasks = await this.pmTaskService.getTaskTemplatesByType(type as any, organizationId);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async cloneTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const organizationId = (req as any).user.organizationId;
      const clonedTask = await this.pmTaskService.cloneTask(parseInt(id), organizationId);
      res.status(201).json(clonedTask);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}