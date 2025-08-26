import { Router } from 'express';
import { PartController } from './part.controller';

const router = Router();
const partController = new PartController();

router.get('/', (req, res) => partController.getAllParts(req, res));
router.get('/low-stock', (req, res) => partController.getLowStockParts(req, res));
router.get('/activity', (req, res) => partController.getRecentActivity(req, res));
router.get('/:id', (req, res) => partController.getPartById(req, res));
router.post('/', (req, res) => partController.createPart(req, res));
router.post('/batch', (req, res) => partController.batchCreateOrMerge(req, res));
router.post('/cleanup-duplicates', (req, res) => partController.cleanupDuplicates(req, res));
router.put('/:id', (req, res) => partController.updatePart(req, res));
router.patch('/:id/stock', (req, res) => partController.updateStockLevel(req, res));
router.post('/checkout', (req, res) => partController.checkoutParts(req, res));
router.delete('/:id', (req, res) => partController.deletePart(req, res));

export default router;