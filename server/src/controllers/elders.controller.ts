import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getElders = async (req: AuthRequest, res: Response) => {
  try {
    const elders = await prisma.elderProfile.findMany({
      include: {
        guardians: {
          include: {
            guardian: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            checkIns: true,
            medicines: true,
            alerts: true,
          }
        }
      }
    });

    return res.json({ elders });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch elders' });
  }
};

export const getElderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const elder = await prisma.elderProfile.findUnique({
      where: { id },
      include: {
        checkIns: { take: 5, orderBy: { timestamp: 'desc' } },
        medicines: { include: { logs: { take: 5, orderBy: { scheduledFor: 'desc' } } } },
        alerts: { take: 5, orderBy: { createdAt: 'desc' } },
        sosEvents: { take: 5, orderBy: { triggeredAt: 'desc' } },
        prescriptions: true,
      }
    });

    if (!elder) {
      return res.status(404).json({ error: 'Elder profile not found' });
    }

    return res.json({ elder });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch elder profile' });
  }
};

export const createElder = async (req: AuthRequest, res: Response) => {
  try {
    const { name, age, gender, medicalHistory, preferredLanguage } = req.body;
    
    if (!name || !age) {
      return res.status(400).json({ error: 'Name and age are required.' });
    }

    const elder = await prisma.elderProfile.create({
      data: {
        name,
        age: parseInt(age, 10),
        gender,
        medicalHistory,
        preferredLanguage: preferredLanguage || 'English',
        primaryGuardianId: req.user?.userId,
      }
    });

    if (req.user?.userId) {
      await prisma.guardianElder.create({
        data: {
          guardianId: req.user.userId,
          elderId: elder.id,
          relationship: 'Primary Guardian',
        }
      });
    }

    return res.status(201).json({ elder });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create elder profile' });
  }
};
