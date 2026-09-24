import { Router } from 'express';
import { getCheckIns, getCheckInsByElderId, createCheckIn, analyzeCheckIn } from '../controllers/checkins.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getCheckIns);
router.get('/:elderId', authenticate, getCheckInsByElderId);
router.post('/analyze', authenticate, analyzeCheckIn);
router.post('/', authenticate, createCheckIn);

export default router;
