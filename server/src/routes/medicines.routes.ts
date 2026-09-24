import { Router } from 'express';
import {
  getMedicines,
  getMedicinesByElderId,
  createMedicine,
  updateMedicine,
  acknowledgeMedicineReminder,
  getMedicineLogsByElderId
} from '../controllers/medicines.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getMedicines);
router.get('/:elderId', authenticate, getMedicinesByElderId);
router.post('/', authenticate, createMedicine);
router.put('/:id', authenticate, updateMedicine);
router.post('/:id/acknowledge', authenticate, acknowledgeMedicineReminder);
router.put('/logs/:logId/acknowledge', authenticate, acknowledgeMedicineReminder);

export default router;
