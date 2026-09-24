import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getActivityLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId, limit } = req.query;
    const take = limit ? parseInt(String(limit), 10) : 20;
    const whereCondition = elderId ? { elderId: String(elderId) } : {};

    const activityLogs = await prisma.activityLog.findMany({
      where: whereCondition,
      take,
      orderBy: { timestamp: 'desc' },
      include: {
        elder: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, role: true } }
      }
    });

    return res.json({ activityLogs });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch activity logs' });
  }
};

export const createActivityLog = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId, action, details } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'action is required.' });
    }

    const activity = await prisma.activityLog.create({
      data: {
        elderId: elderId || undefined,
        userId: req.user?.userId,
        action,
        details,
        timestamp: new Date(),
      }
    });

    return res.status(201).json({ activity });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to record activity log' });
  }
};
