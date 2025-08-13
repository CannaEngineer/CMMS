import { Router } from 'express';
import * as organizationController from './organization.controller';

const router = Router();

// Organization management routes
router.get('/', organizationController.getOrganization);
router.put('/', organizationController.updateOrganization);

// User management routes
router.get('/users', organizationController.getOrganizationUsers);
router.post('/users/invite', organizationController.inviteUser);
router.delete('/users/:userId', organizationController.removeUser);
router.put('/users/:userId/role', organizationController.updateUserRole);

export default router;