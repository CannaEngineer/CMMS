import '../runtime-config';
import { Router } from 'express';
import { getDbInfo } from './debug.controller';

const router = Router();

router.get('/db-info', getDbInfo);

export default router;