import { Router } from 'express';
import { getElders, getElderById, createElder } from '../controllers/elders.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getElders);
router.get('/:id', authenticate, getElderById);
router.post('/', authenticate, createElder);

export default router;
