import { Router } from 'express';
import {
  getPortals,
  getPortalById,
  createPortal,
  updatePortal,
  deletePortal,
  updatePortalFields,
  getPublicPortal,
  submitPortal,
  getSubmissions,
  updateSubmissionStatus,
  createWorkOrderFromSubmission,
  getPortalAnalytics,
  checkRateLimit
} from './portal.controller';

const router = Router();

// Portal Management Routes (Admin - require authentication)
router.get('/', getPortals);
router.post('/', createPortal);
router.get('/:id', getPortalById);
router.put('/:id', updatePortal);
router.delete('/:id', deletePortal);

// Portal Fields Management
router.put('/:id/fields', updatePortalFields);

// Portal Analytics
router.get('/:id/analytics', getPortalAnalytics);

// Portal Submissions Management (Admin)
router.get('/admin/submissions', getSubmissions);
router.put('/submissions/:id/status', updateSubmissionStatus);
router.post('/submissions/:id/work-order', createWorkOrderFromSubmission);

export default router;