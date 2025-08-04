
import { Request, Response } from 'express';
import { z } from 'zod';
import * as assetService from './asset.service';

const assetSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  modelNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  year: z.number().optional(),
  status: z.enum(['ONLINE', 'OFFLINE']).optional(),
  criticality: z.enum(['LOW', 'MEDIUM', 'HIGH', 'IMPORTANT']).optional(),
  barcode: z.string().optional(),
  imageUrl: z.string().optional(),
  attachments: z.any().optional(),
  locationId: z.number(),
  organizationId: z.number(),
  parentId: z.number().optional(),
});

export const getAllAssets = async (req: Request, res: Response) => {
  const assets = await assetService.getAllAssets();
  res.status(200).json(assets);
};

export const getAssetById = async (req: Request, res: Response) => {
  const asset = await assetService.getAssetById(Number(req.params.id));
  if (asset) {
    res.status(200).json(asset);
  } else {
    res.status(404).json({ error: 'Asset not found' });
  }
};

export const createAsset = async (req: Request, res: Response) => {
  try {
    const data = assetSchema.parse(req.body);
    const asset = await assetService.createAsset(data);
    res.status(201).json(asset);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateAsset = async (req: Request, res: Response) => {
  try {
    const data = assetSchema.partial().parse(req.body);
    const asset = await assetService.updateAsset(Number(req.params.id), data);
    res.status(200).json(asset);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteAsset = async (req: Request, res: Response) => {
  await assetService.deleteAsset(Number(req.params.id));
  res.status(204).send();
};
