import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// Helper to check user authorization over an elder profile
async function isAuthorizedForElder(userId: string, userRole: string, elderId: string): Promise<boolean> {
  const elder = await prisma.elderProfile.findUnique({
    where: { id: elderId },
    include: { guardians: true },
  });
  if (!elder) return false;

  if (userRole === 'GUARDIAN') {
    return elder.primaryGuardianId === userId || elder.guardians.some(g => g.guardianId === userId);
  } else if (userRole === 'ELDER') {
    return elder.userId === userId;
  }
  return false;
}

export const getAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId, type, severity, status } = req.query;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const where: any = {};

    if (userRole === 'GUARDIAN') {
      const guardianships = await prisma.guardianElder.findMany({
        where: { guardianId: userId },
        select: { elderId: true },
      });
      const allowedElderIds = guardianships.map(g => g.elderId);

      if (elderId) {
        if (!allowedElderIds.includes(String(elderId))) {
          return res.status(403).json({ error: 'Access denied for requested elder alerts.' });
        }
        where.elderId = String(elderId);
      } else {
        where.elderId = { in: allowedElderIds };
      }
    } else if (userRole === 'ELDER') {
      const elderProfile = await prisma.elderProfile.findUnique({
        where: { userId },
      });
      if (!elderProfile) {
        return res.status(404).json({ error: 'Elder profile not found' });
      }
      if (elderId && String(elderId) !== elderProfile.id) {
        return res.status(403).json({ error: 'Access denied. You can only view your own alerts.' });
      }
      where.elderId = elderProfile.id;
    }

    if (type && ['HEALTH_CONCERN', 'CHECKIN_MISSED', 'MEDICINE_MISSED', 'SOS'].includes(type as string)) {
      where.type = type as string;
    }

    if (severity && ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severity as string)) {
      where.severity = severity as string;
    }

    if (status && ['UNREAD', 'READ', 'RESOLVED'].includes(status as string)) {
      where.status = status as string;
    }

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        elder: {
          select: { id: true, name: true, age: true }
        }
      }
    });

    return res.json({ alerts });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch alerts' });
  }
};

export const resolveAlert = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const alert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const hasAccess = await isAuthorizedForElder(userId, userRole || 'GUARDIAN', alert.elderId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied for this alert.' });
    }

    // Idempotent resolution check
    if (alert.status === 'RESOLVED') {
      return res.json({ message: 'Alert is already resolved.', alert });
    }

    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      }
    });

    // If this is an SOS alert, also update any associated active SOS events for this elder to RESOLVED
    if (alert.type === 'SOS') {
      await prisma.sOS.updateMany({
        where: {
          elderId: alert.elderId,
          status: { in: ['TRIGGERED', 'ACKNOWLEDGED'] },
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        }
      });
    }

    // Activity Log
    await prisma.activityLog.create({
      data: {
        elderId: alert.elderId,
        userId,
        action: 'ALERT_RESOLVED',
        details: `Alert "${alert.title}" resolved by ${userRole}.`,
      }
    });

    return res.json({ message: 'Alert resolved successfully.', alert: updatedAlert });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to resolve alert' });
  }
};

export const updateAlertStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!status || !['UNREAD', 'READ', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (UNREAD, READ, RESOLVED) is required.' });
    }

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const hasAccess = await isAuthorizedForElder(userId, userRole || 'GUARDIAN', alert.elderId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied for this alert.' });
    }

    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' ? (alert.resolvedAt || new Date()) : null,
      }
    });

    if (status === 'RESOLVED') {
      if (alert.type === 'SOS') {
        await prisma.sOS.updateMany({
          where: {
            elderId: alert.elderId,
            status: { in: ['TRIGGERED', 'ACKNOWLEDGED'] },
          },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
          }
        });
      }

      await prisma.activityLog.create({
        data: {
          elderId: alert.elderId,
          userId,
          action: 'ALERT_RESOLVED',
          details: `Alert "${alert.title}" updated to RESOLVED.`,
        }
      });
    }

    return res.json({ alert: updatedAlert });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update alert' });
  }
};

export const createAlert = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId, title, message, severity, type } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!elderId || !title || !message) {
      return res.status(400).json({ error: 'elderId, title, and message are required.' });
    }

    const hasAccess = await isAuthorizedForElder(userId, userRole || 'GUARDIAN', elderId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied for this elder profile.' });
    }

    const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const validSeverity = (severity && validSeverities.includes(severity)) ? severity : 'LOW';

    const validTypes = ['HEALTH_CONCERN', 'CHECKIN_MISSED', 'MEDICINE_MISSED', 'SOS'];
    const validType = (type && validTypes.includes(type)) ? type : 'HEALTH_CONCERN';

    const alert = await prisma.alert.create({
      data: {
        elderId,
        type: validType,
        title,
        message,
        severity: validSeverity,
        status: 'UNREAD',
      }
    });

    return res.status(201).json({ alert });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create alert' });
  }
};
