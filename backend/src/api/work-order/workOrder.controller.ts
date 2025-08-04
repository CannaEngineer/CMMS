import { Request, Response } from 'express';
import { z } from 'zod';
import * as workOrderService from './workOrder.service';

const workOrderSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assetId: z.number().optional(),
  assignedToId: z.number().optional(),
  organizationId: z.number(),
});

export const getAllWorkOrders = async (req: Request, res: Response) => {
  const workOrders = await workOrderService.getAllWorkOrders();
  res.status(200).json(workOrders);
};

export const getWorkOrderById = async (req: Request, res: Response) => {
  const workOrder = await workOrderService.getWorkOrderById(Number(req.params.id));
  if (workOrder) {
    res.status(200).json(workOrder);
  } else {
    res.status(404).json({ error: 'Work Order not found' });
  }
};

export const createWorkOrder = async (req: Request, res: Response) => {
  try {
    const data = workOrderSchema.parse(req.body);
    const workOrder = await workOrderService.createWorkOrder(data);
    res.status(201).json(workOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateWorkOrder = async (req: Request, res: Response) => {
  try {
    const data = workOrderSchema.partial().parse(req.body);
    const workOrder = await workOrderService.updateWorkOrder(Number(req.params.id), data);
    res.status(200).json(workOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteWorkOrder = async (req: Request, res: Response) => {
  await workOrderService.deleteWorkOrder(Number(req.params.id));
  res.status(204).send();
};
