import { Router } from 'express';
import { MeterReadingController } from './meterReading.controller';

const router = Router();
const meterReadingController = new MeterReadingController();

// Get meter readings for an asset
router.get('/asset/:assetId', (req, res) => meterReadingController.getMeterReadings(req, res));
router.get('/asset/:assetId/latest', (req, res) => meterReadingController.getLatestReadings(req, res));
router.get('/asset/:assetId/trends', (req, res) => meterReadingController.getMeterReadingTrends(req, res));
router.get('/asset/:assetId/meter-types', (req, res) => meterReadingController.getAssetMeterTypes(req, res));

// Create meter reading
router.post('/asset/:assetId', (req, res) => meterReadingController.createMeterReading(req, res));

// Bulk create
router.post('/bulk', (req, res) => meterReadingController.bulkCreateMeterReadings(req, res));

// Update/Delete meter reading
router.put('/:id', (req, res) => meterReadingController.updateMeterReading(req, res));
router.delete('/:id', (req, res) => meterReadingController.deleteMeterReading(req, res));

export default router;