import { Request, Response } from 'express';
import { z } from 'zod';
import * as locationService from './location.service';

const locationSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  organizationId: z.number(),
  parentId: z.number().optional(),
});

export const getAllLocations = async (req: any, res: Response) => {
  try {
    console.log('[LocationController] getAllLocations called');
    console.log('[LocationController] User info:', req.user);
    
    const organizationId = req.user?.organizationId || 1;
    console.log('[LocationController] Using organizationId:', organizationId);
    
    const locations = await locationService.getAllLocations(organizationId);
    console.log('[LocationController] Found locations:', locations.length);
    
    res.status(200).json(locations);
  } catch (error) {
    console.error('[LocationController] Error in getAllLocations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
};

export const getLocationById = async (req: Request, res: Response) => {
  const { organizationId } = (req as any).user;
  const location = await locationService.getLocationById(Number(req.params.id), organizationId);
  if (location) {
    res.status(200).json(location);
  } else {
    res.status(404).json({ error: 'Location not found' });
  }
};

export const createLocation = async (req: any, res: Response) => {
  try {
    const organizationId = req.user?.organizationId || 1;
    const data = {
      ...req.body,
      organizationId
    };
    const location = await locationService.createLocation(req.body, organizationId);
    res.status(201).json(location);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { organizationId } = (req as any).user;
    const data = locationSchema.partial().parse(req.body);
    const location = await locationService.updateLocation(Number(req.params.id), data, organizationId);
    res.status(200).json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteLocation = async (req: Request, res: Response) => {
  const { organizationId } = (req as any).user;
  await locationService.deleteLocation(Number(req.params.id), organizationId);
  res.status(204).send();
};
