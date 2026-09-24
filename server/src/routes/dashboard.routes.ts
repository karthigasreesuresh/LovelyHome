import { Router } from 'express';
import { getGuardianDashboard, getElderDashboard, getElderDashboardById } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/guardian', authenticate, getGuardianDashboard);
router.get('/elder', authenticate, getElderDashboard);
router.get('/:elderId', authenticate, getElderDashboardById);

export default router;
