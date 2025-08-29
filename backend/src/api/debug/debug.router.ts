import '../runtime-config';
import { Router } from 'express';
import { getDbInfo, getEnvInfo, testTurso } from './debug.controller';

const router = Router();

router.get('/db-info', getDbInfo);
router.get('/env-info', getEnvInfo);
router.get('/test-turso', testTurso);

export default router;