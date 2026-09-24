import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getSosEvents = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.query;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const whereCondition: any = {};

    if (userRole === 'GUARDIAN') {
      const guardianships = await prisma.guardianElder.findMany({
        where: { guardianId: userId },
        select: { elderId: true },
      });
      const allowedElderIds = guardianships.map(g => g.elderId);
      if (elderId) {
        if (!allowedElderIds.includes(String(elderId))) {
          return res.status(403).json({ error: 'Access denied for requested elder SOS events.' });
        }
        whereCondition.elderId = String(elderId);
      } else {
        whereCondition.elderId = { in: allowedElderIds };
      }
    } else if (userRole === 'ELDER') {
      const elderProfile = await prisma.elderProfile.findUnique({ where: { userId } });
      if (!elderProfile) {
        return res.status(404).json({ error: 'Elder profile not found' });
      }
      whereCondition.elderId = elderProfile.id;
    }

    const sosEvents = await prisma.sOS.findMany({
      where: whereCondition,
      orderBy: { triggeredAt: 'desc' },
      take: 50,
      include: {
        elder: {
          select: { id: true, name: true, age: true }
        }
      }
    });

    return res.json({ sosEvents });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch SOS events' });
  }
};

export const triggerSos = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId, latitude, longitude, address, locationUnavailable } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!elderId) {
      return res.status(400).json({ error: 'elderId is required to trigger SOS.' });
    }

    // Verify elder authorization
    const elder = await prisma.elderProfile.findUnique({
      where: { id: elderId },
    });

    if (!elder) {
      return res.status(404).json({ error: 'Elder profile not found' });
    }

    if (userRole === 'ELDER' && elder.userId !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only trigger SOS for yourself.' });
    }

    // Coordinate validation if supplied
    let parsedLat: number | null = null;
    let parsedLng: number | null = null;
    let isLocUnavailable = Boolean(locationUnavailable);

    if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null) {
      const latNum = parseFloat(latitude);
      const lngNum = parseFloat(longitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        return res.status(400).json({ error: 'Invalid latitude. Must be between -90 and 90.' });
      }
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        return res.status(400).json({ error: 'Invalid longitude. Must be between -180 and 180.' });
      }
      parsedLat = latNum;
      parsedLng = lngNum;
      isLocUnavailable = false;
    } else {
      isLocUnavailable = true;
    }

    // SOS Duplicate Protection (Return recent SOS if triggered within 10 seconds)
    const recentSos = await prisma.sOS.findFirst({
      where: {
        elderId,
        triggeredAt: { gte: new Date(Date.now() - 10000) },
      },
      include: { elder: true }
    });

    if (recentSos) {
      return res.status(200).json({
        message: 'SOS emergency signal already received recently.',
        sos: recentSos,
      });
    }

    const finalAddress = isLocUnavailable
      ? 'Location unavailable (Living Home)'
      : (address || `GPS: ${parsedLat?.toFixed(4)}, ${parsedLng?.toFixed(4)}`);

    const sos = await prisma.sOS.create({
      data: {
        elderId,
        status: 'TRIGGERED',
        latitude: parsedLat,
        longitude: parsedLng,
        address: finalAddress,
        locationUnavailable: isLocUnavailable,
        triggeredAt: new Date(),
      },
      include: {
        elder: true,
      }
    });

    // Create Critical Alert with type SOS
    await prisma.alert.create({
      data: {
        elderId,
        type: 'SOS',
        severity: 'CRITICAL',
        title: '🚨 EMERGENCY SOS TRIGGERED',
        message: `Emergency signal sent by ${sos.elder.name}. ${isLocUnavailable ? 'Location could not be obtained (Location unavailable).' : `Location: ${sos.address}`}`,
        status: 'UNREAD',
      }
    });

    // Create Activity Log
    await prisma.activityLog.create({
      data: {
        elderId,
        userId,
        action: 'SOS_TRIGGERED',
        details: `Emergency alert raised by elder ${sos.elder.name} (${isLocUnavailable ? 'Location unavailable' : sos.address}).`,
      }
    });

    return res.status(201).json({ sos });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to trigger SOS' });
  }
};

export const updateSosStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validStatuses = ['TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Valid status (TRIGGERED, ACKNOWLEDGED, RESOLVED) is required.' });
    }

    const sos = await prisma.sOS.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
      }
    });

    return res.json({ sos });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update SOS status' });
  }
};
