import '../runtime-config';
import { Router } from 'express';
import { getDbInfo, getEnvInfo } from './debug.controller';

const router = Router();

router.get('/db-info', getDbInfo);
router.get('/env-info', getEnvInfo);

export default router;