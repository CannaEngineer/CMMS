import { Request, Response } from 'express';
import { z } from 'zod';
import * as locationService from './location.service';

const locationSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  address: z.string().optional(),
  organizationId: z.number(),
  parentId: z.number().optional(),
});

export const getAllLocations = async (req: Request, res: Response) => {
  const locations = await locationService.getAllLocations();
  res.status(200).json(locations);
};

export const getLocationById = async (req: Request, res: Response) => {
  const location = await locationService.getLocationById(Number(req.params.id));
  if (location) {
    res.status(200).json(location);
  } else {
    res.status(404).json({ error: 'Location not found' });
  }
};

export const createLocation = async (req: Request, res: Response) => {
  try {
    const data = locationSchema.parse(req.body);
    const location = await locationService.createLocation(data);
    res.status(201).json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const data = locationSchema.partial().parse(req.body);
    const location = await locationService.updateLocation(Number(req.params.id), data);
    res.status(200).json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteLocation = async (req: Request, res: Response) => {
  await locationService.deleteLocation(Number(req.params.id));
  res.status(204).send();
};
