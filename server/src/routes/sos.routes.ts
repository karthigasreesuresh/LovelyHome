import { Router } from 'express';
import { getSosEvents, triggerSos, updateSosStatus } from '../controllers/sos.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getSosEvents);
router.post('/trigger', authenticate, triggerSos);
router.put('/:id/status', authenticate, updateSosStatus);

export default router;
