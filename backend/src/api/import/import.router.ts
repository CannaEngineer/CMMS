import { Router } from 'express';
import multer from 'multer';
import { ImportController } from './import.controller';
import { requireAdmin } from '../../middleware/auth.middleware';

const router = Router();

// Configure multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// All import routes require admin access
router.use(requireAdmin);

// Routes
router.get('/entity-configs', ImportController.getEntityConfigs);
router.get('/template/:entityType', ImportController.getImportTemplate);
router.get('/history', ImportController.getImportHistory);

router.post('/analyze', upload.single('csvFile'), ImportController.analyzeCSV);
router.post('/validate', ImportController.validateImport);
router.post('/execute', ImportController.executeImport);
router.post('/rollback/:importId', ImportController.rollbackImport);

export default router;