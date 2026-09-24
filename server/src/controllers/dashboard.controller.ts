import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getElderDashboardById = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // 1. Fetch elder profile
    const elder = await prisma.elderProfile.findUnique({
      where: { id: elderId },
      include: {
        guardians: true,
      },
    });

    if (!elder) {
      return res.status(404).json({ error: 'Elder profile not found' });
    }

    // 2. Strict Authorization Check
    if (userRole === 'GUARDIAN') {
      const isLinked = elder.primaryGuardianId === userId || 
        elder.guardians.some(g => g.guardianId === userId);
      
      if (!isLinked) {
        return res.status(403).json({ error: 'Access denied. You are not authorized to view this elder profile.' });
      }
    } else if (userRole === 'ELDER') {
      if (elder.userId !== userId) {
        return res.status(403).json({ error: 'Access denied. You can only view your own elder dashboard.' });
      }
    }

    // 3. Gather real DB statistics for this elder
    const latestCheckIn = await prisma.checkIn.findFirst({
      where: { elderId },
      orderBy: { timestamp: 'desc' },
    });

    const activeMedicines = await prisma.medicine.findMany({
      where: { elderId, active: true },
      include: {
        logs: {
          take: 5,
          orderBy: { scheduledFor: 'desc' },
        },
      },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayMedicineLogs = await prisma.medicineLog.findMany({
      where: {
        medicine: { elderId },
        scheduledFor: { gte: todayStart },
      },
    });

    const pendingMedicineCount = todayMedicineLogs.filter(l => l.status === 'PENDING').length;
    const acknowledgedMedicineCount = todayMedicineLogs.filter(l => l.status === 'ACKNOWLEDGED').length;
    const missedMedicineCount = todayMedicineLogs.filter(l => l.status === 'MISSED').length;

    const unresolvedAlerts = await prisma.alert.findMany({
      where: { elderId, status: { in: ['UNREAD', 'READ'] } },
      orderBy: { createdAt: 'desc' },
    });

    const recentActivities = await prisma.activityLog.findMany({
      where: elderId ? { elderId } : undefined,
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    const lastActivity = recentActivities[0];
    const lastInteractionTimestamp = latestCheckIn?.timestamp && lastActivity?.timestamp
      ? (new Date(latestCheckIn.timestamp) > new Date(lastActivity.timestamp) ? latestCheckIn.timestamp : lastActivity.timestamp)
      : (latestCheckIn?.timestamp || lastActivity?.timestamp || null);

    // Active SOS count for elder
    const activeElderSosCount = await prisma.sOS.count({
      where: { elderId, status: { in: ['TRIGGERED', 'ACKNOWLEDGED'] } },
    });

    // Check if today's check-in was completed
    const todayCheckIn = await prisma.checkIn.findFirst({
      where: {
        elderId,
        timestamp: { gte: todayStart },
      },
      orderBy: { timestamp: 'desc' },
    });
    const todayCheckInStatus = todayCheckIn ? 'COMPLETED' : 'PENDING';

    // System Calculated Status (URGENT | ATTENTION | NORMAL)
    // - URGENT if active unresolved SOS or recent urgent check-in
    // - ATTENTION if unresolved alerts (HEALTH_CONCERN/MISSED) or check-in marked ATTENTION
    // - NORMAL otherwise
    let calculatedStatus = 'NORMAL';
    if (activeElderSosCount > 0 || latestCheckIn?.status === 'URGENT') {
      calculatedStatus = 'URGENT';
    } else if (unresolvedAlerts.length > 0 || latestCheckIn?.status === 'ATTENTION') {
      calculatedStatus = 'ATTENTION';
    }

    // Latest active SOS event if any
    const latestSosEvent = await prisma.sOS.findFirst({
      where: { elderId },
      orderBy: { triggeredAt: 'desc' },
    });

    return res.json({
      elder: {
        id: elder.id,
        name: elder.name,
        age: elder.age,
        gender: elder.gender || 'Not specified',
        medicalHistory: elder.medicalHistory || 'None listed',
        preferredLanguage: elder.preferredLanguage || 'English',
      },
      latestCheckIn: latestCheckIn ? {
        id: latestCheckIn.id,
        status: latestCheckIn.status,
        mood: latestCheckIn.mood,
        notes: latestCheckIn.notes,
        timestamp: latestCheckIn.timestamp,
      } : null,
      todayCheckInStatus,
      wellnessStatus: calculatedStatus,
      lastInteractionTimestamp,
      medicineStats: {
        activeCount: activeMedicines.length,
        pendingCount: pendingMedicineCount,
        acknowledgedCount: acknowledgedMedicineCount,
        missedCount: missedMedicineCount,
        todayTotal: activeMedicines.length,
        medicines: activeMedicines,
      },
      unresolvedAlertsCount: unresolvedAlerts.length,
      unresolvedAlerts,
      recentActivities,
      recentSos: latestSosEvent,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch elder dashboard' });
  }
};

export const getGuardianDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const guardianships = await prisma.guardianElder.findMany({
      where: { guardianId: userId },
      select: { elderId: true },
    });

    const elderIds = guardianships.map(g => g.elderId);

    const elders = await prisma.elderProfile.findMany({
      where: elderIds.length > 0 ? { id: { in: elderIds } } : { primaryGuardianId: userId },
      include: {
        checkIns: { take: 1, orderBy: { timestamp: 'desc' } },
        alerts: { where: { status: { in: ['UNREAD', 'READ'] } } },
      },
    });

    const totalElders = elders.length;
    const activeMedicinesCount = await prisma.medicine.count({
      where: elderIds.length > 0 ? { elderId: { in: elderIds }, active: true } : { active: true },
    });
    
    const unreadAlertsCount = await prisma.alert.count({
      where: elderIds.length > 0 ? { elderId: { in: elderIds }, status: 'UNREAD' } : { status: 'UNREAD' },
    });

    const activeSosEvents = await prisma.sOS.findMany({
      where: elderIds.length > 0 ? { elderId: { in: elderIds }, status: { in: ['TRIGGERED', 'ACKNOWLEDGED'] } } : { status: { in: ['TRIGGERED', 'ACKNOWLEDGED'] } },
      orderBy: { triggeredAt: 'desc' },
      include: { elder: { select: { id: true, name: true, age: true } } }
    });

    const activeSosCount = activeSosEvents.length;

    const recentCheckIns = await prisma.checkIn.findMany({
      where: elderIds.length > 0 ? { elderId: { in: elderIds } } : undefined,
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        elder: { select: { id: true, name: true, age: true } },
      },
    });

    const recentAlerts = await prisma.alert.findMany({
      where: elderIds.length > 0 ? { elderId: { in: elderIds } } : undefined,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        elder: { select: { id: true, name: true } },
      },
    });

    const recentActivities = await prisma.activityLog.findMany({
      where: elderIds.length > 0 ? { elderId: { in: elderIds } } : undefined,
      take: 6,
      orderBy: { timestamp: 'desc' },
      include: {
        elder: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, role: true } },
      },
    });

    return res.json({
      summary: {
        totalElders,
        activeMedicinesCount,
        unreadAlertsCount,
        activeSosCount,
      },
      elders,
      activeSosEvents,
      recentCheckIns,
      recentAlerts,
      recentActivities,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch guardian dashboard data' });
  }
};

export const getElderDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.query;

    let elder = null;
    if (elderId) {
      elder = await prisma.elderProfile.findUnique({
        where: { id: String(elderId) },
        include: {
          medicines: { where: { active: true }, include: { logs: { take: 5, orderBy: { scheduledFor: 'desc' } } } },
          checkIns: { take: 1, orderBy: { timestamp: 'desc' } },
          sosEvents: { take: 1, orderBy: { triggeredAt: 'desc' } },
        },
      });
    }

    if (!elder) {
      elder = await prisma.elderProfile.findFirst({
        include: {
          medicines: { where: { active: true }, include: { logs: { take: 5, orderBy: { scheduledFor: 'desc' } } } },
          checkIns: { take: 1, orderBy: { timestamp: 'desc' } },
          sosEvents: { take: 1, orderBy: { triggeredAt: 'desc' } },
        },
      });
    }

    if (!elder) {
      return res.status(404).json({ error: 'No elder profile found' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCheckIn = await prisma.checkIn.findFirst({
      where: {
        elderId: elder.id,
        timestamp: { gte: todayStart },
      },
      orderBy: { timestamp: 'desc' },
    });

    const recentActivity = await prisma.activityLog.findFirst({
      where: { elderId: elder.id },
      orderBy: { timestamp: 'desc' },
    });

    return res.json({
      elder,
      todayCheckIn,
      medicinesCount: elder.medicines.length,
      lastCheckIn: elder.checkIns[0] || null,
      lastActivity: recentActivity || null,
      activeSos: elder.sosEvents[0]?.status === 'TRIGGERED' ? elder.sosEvents[0] : null,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch elder dashboard' });
  }
};
