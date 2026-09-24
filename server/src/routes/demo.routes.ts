import { Router } from 'express';
import { simulateDemoScenario, resetDemoData } from '../controllers/demo.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/simulate', authenticate, simulateDemoScenario);
router.post('/reset', authenticate, resetDemoData);

export default router;
