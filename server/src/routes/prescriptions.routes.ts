import { Router } from 'express';
import { getPrescriptions, createPrescription, analyzePrescriptionImage } from '../controllers/prescriptions.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getPrescriptions);
router.post('/', authenticate, createPrescription);
router.post('/analyze', authenticate, analyzePrescriptionImage);

export default router;
