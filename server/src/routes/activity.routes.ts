import { Router } from 'express';
import { getActivityLogs, createActivityLog } from '../controllers/activity.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getActivityLogs);
router.post('/', authenticate, createActivityLog);

export default router;
