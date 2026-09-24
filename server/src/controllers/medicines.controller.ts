import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getMedicinesByElderId = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const elder = await prisma.elderProfile.findUnique({
      where: { id: elderId },
      include: { guardians: true },
    });

    if (!elder) {
      return res.status(404).json({ error: 'Elder profile not found' });
    }

    if (userRole === 'GUARDIAN') {
      const isLinked = elder.primaryGuardianId === userId || elder.guardians.some(g => g.guardianId === userId);
      if (!isLinked) {
        return res.status(403).json({ error: 'Access denied. You are not authorized for this elder.' });
      }
    } else if (userRole === 'ELDER') {
      if (elder.userId !== userId) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    const medicines = await prisma.medicine.findMany({
      where: { elderId, active: true },
      include: {
        logs: {
          orderBy: { scheduledFor: 'desc' },
          take: 10,
        },
      },
    });

    return res.json({ medicines });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch medicines' });
  }
};

export const getMedicines = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.query;
    const whereCondition = elderId ? { elderId: String(elderId) } : {};

    const medicines = await prisma.medicine.findMany({
      where: whereCondition,
      include: {
        logs: {
          orderBy: { scheduledFor: 'desc' },
          take: 10,
        },
        elder: {
          select: { id: true, name: true }
        }
      }
    });

    return res.json({ medicines });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch medicines' });
  }
};

export const createMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId, name, dosage, scheduleTime, frequency, instructions, source } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!elderId || !name || !dosage || !scheduleTime) {
      return res.status(400).json({ error: 'elderId, name, dosage, and scheduleTime are required.' });
    }

    // Authorization Check
    const elder = await prisma.elderProfile.findUnique({
      where: { id: elderId },
      include: { guardians: true },
    });

    if (!elder) {
      return res.status(404).json({ error: 'Elder profile not found' });
    }

    if (userRole === 'GUARDIAN') {
      const isLinked = elder.primaryGuardianId === userId || elder.guardians.some(g => g.guardianId === userId);
      if (!isLinked) {
        return res.status(403).json({ error: 'Access denied. You are not authorized for this elder.' });
      }
    }

    const validSource = source === 'OCR' ? 'OCR' : 'MANUAL';

    const medicine = await prisma.medicine.create({
      data: {
        elderId,
        name,
        dosage,
        scheduleTime,
        frequency: frequency || 'Daily',
        instructions: instructions || 'Take as prescribed',
        active: true,
        source: validSource,
      }
    });

    // Create an initial pending medicine log for today
    const todayStart = new Date();
    todayStart.setHours(8, 0, 0, 0);

    await prisma.medicineLog.create({
      data: {
        medicineId: medicine.id,
        scheduledFor: todayStart,
        status: 'PENDING',
      }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        elderId,
        userId,
        action: 'MEDICINE_SCHEDULE_CREATED',
        details: `Created medicine schedule '${name} ${dosage}' (Source: ${validSource})`,
      }
    });

    return res.status(201).json({ medicine });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to add medicine' });
  }
};

export const updateMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, dosage, scheduleTime, frequency, instructions, active } = req.body;

    const existingMedicine = await prisma.medicine.findUnique({
      where: { id },
    });

    if (!existingMedicine) {
      return res.status(404).json({ error: 'Medicine record not found' });
    }

    const medicine = await prisma.medicine.update({
      where: { id },
      data: {
        name: name || undefined,
        dosage: dosage || undefined,
        scheduleTime: scheduleTime || undefined,
        frequency: frequency || undefined,
        instructions: instructions || undefined,
        active: typeof active === 'boolean' ? active : undefined,
      }
    });

    return res.json({ medicine });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update medicine' });
  }
};

export const acknowledgeMedicineReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params; // medicineId or logId
    const { logId, notes } = req.body;
    const userId = req.user?.userId;

    let targetLogId = logId;

    if (!targetLogId) {
      // Find today's log or create one for this medicineId (id)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const existingLog = await prisma.medicineLog.findFirst({
        where: {
          medicineId: id,
          scheduledFor: { gte: todayStart },
        },
        orderBy: { scheduledFor: 'desc' },
      });

      if (existingLog) {
        targetLogId = existingLog.id;
      } else {
        const newLog = await prisma.medicineLog.create({
          data: {
            medicineId: id,
            scheduledFor: new Date(),
            status: 'PENDING',
          }
        });
        targetLogId = newLog.id;
      }
    }

    const updatedLog = await prisma.medicineLog.update({
      where: { id: targetLogId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        notes: notes || 'Reminder acknowledged by user',
      },
      include: {
        medicine: true,
      }
    });

    // Create Activity Log
    await prisma.activityLog.create({
      data: {
        elderId: updatedLog.medicine.elderId,
        userId,
        action: 'MEDICINE_REMINDER_ACKNOWLEDGED',
        details: `Reminder acknowledged for '${updatedLog.medicine.name}' (${updatedLog.medicine.dosage})`,
      }
    });

    return res.json({
      message: 'Reminder acknowledged',
      log: updatedLog,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to acknowledge medicine reminder' });
  }
};

export const getMedicineLogsByElderId = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;

    const logs = await prisma.medicineLog.findMany({
      where: {
        medicine: { elderId }
      },
      orderBy: { scheduledFor: 'desc' },
      take: 50,
      include: {
        medicine: { select: { id: true, name: true, dosage: true, scheduleTime: true } }
      }
    });

    return res.json({ logs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch medicine logs' });
  }
};
