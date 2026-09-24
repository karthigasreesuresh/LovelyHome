import { Router } from 'express';
import { getAlerts, updateAlertStatus, createAlert, resolveAlert } from '../controllers/alerts.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getAlerts);
router.post('/', authenticate, createAlert);
router.post('/:id/resolve', authenticate, resolveAlert);
router.put('/:id/status', authenticate, updateAlertStatus);

export default router;
