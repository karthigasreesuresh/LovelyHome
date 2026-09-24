import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { analyzeConcern } from '../utils/concernAnalyzer';

export const analyzeCheckIn = async (req: AuthRequest, res: Response) => {
  try {
    const { text, answers } = req.body;

    if (!text && !answers) {
      return res.status(400).json({ error: 'Text or answers object is required for analysis.' });
    }

    const analysisInput = text || answers;
    const result = analyzeConcern(analysisInput);

    return res.json({
      concernLevel: result.concernLevel,
      keywords: result.keywords,
      summaryNotes: result.summaryNotes,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Analysis failed' });
  }
};

export const getCheckInsByElderId = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify elder exists & check authorization
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
        return res.status(403).json({ error: 'Access denied. You are not authorized to view this elder check-in history.' });
      }
    } else if (userRole === 'ELDER') {
      if (elder.userId !== userId) {
        return res.status(403).json({ error: 'Access denied. You can only view your own check-in records.' });
      }
    }

    const checkIns = await prisma.checkIn.findMany({
      where: { elderId },
      orderBy: { timestamp: 'desc' },
      take: 50,
      select: {
        id: true,
        elderId: true,
        status: true,
        concernLevel: true,
        mood: true,
        response: true,
        notes: true,
        extractedKeywords: true,
        timestamp: true,
        createdAt: true,
      },
    });

    return res.json({ checkIns });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch check-ins' });
  }
};

export const getCheckIns = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId } = req.query;
    const userId = req.user?.userId;

    const whereCondition = elderId ? { elderId: String(elderId) } : {};

    const checkIns = await prisma.checkIn.findMany({
      where: whereCondition,
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: {
        elder: {
          select: { id: true, name: true, age: true }
        }
      }
    });

    return res.json({ checkIns });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch check-ins' });
  }
};

export const createCheckIn = async (req: AuthRequest, res: Response) => {
  try {
    const { elderId, status, mood, notes, response: rawResponse, answers } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!elderId) {
      return res.status(400).json({ error: 'elderId is required.' });
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
    } else if (userRole === 'ELDER') {
      if (elder.userId !== userId) {
        return res.status(403).json({ error: 'Access denied. You can only record check-ins for yourself.' });
      }
    }

    // Duplicate Submission Protection (Prevent rapid repeat within 5 seconds)
    const recentCheckIn = await prisma.checkIn.findFirst({
      where: {
        elderId,
        timestamp: { gte: new Date(Date.now() - 5000) },
      },
    });

    if (recentCheckIn) {
      return res.status(200).json({
        message: 'Check-in already received recently.',
        checkIn: recentCheckIn,
      });
    }

    // Combine text for concern analyzer
    let combinedResponseText = rawResponse || '';
    if (answers && typeof answers === 'object') {
      combinedResponseText = Object.entries(answers)
        .map(([q, a]) => `${q}: ${a}`)
        .join(' | ');
    } else if (!combinedResponseText && notes) {
      combinedResponseText = notes;
    }

    // Run Local Rule-Based Concern Analyzer
    const analysis = analyzeConcern(combinedResponseText || status || 'Good');

    const finalConcernLevel = status && ['NORMAL', 'ATTENTION', 'URGENT'].includes(status)
      ? status
      : analysis.concernLevel;

    const keywordsString = analysis.keywords.join(', ');

    const checkIn = await prisma.checkIn.create({
      data: {
        elderId,
        status: finalConcernLevel,
        concernLevel: finalConcernLevel,
        response: combinedResponseText || 'Check-in completed.',
        extractedKeywords: keywordsString,
        mood: mood || 'Good',
        notes: notes || analysis.summaryNotes,
        timestamp: new Date(),
      }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        elderId,
        userId,
        action: 'DAILY_CHECKIN_COMPLETED',
        details: `Wellness check-in completed. Concern Level: ${finalConcernLevel} (Keywords: ${keywordsString || 'None'})`,
      }
    });

    // Non-Diagnostic Caregiver Alerts
    if (finalConcernLevel === 'ATTENTION') {
      await prisma.alert.create({
        data: {
          elderId,
          severity: 'MEDIUM',
          title: 'Wellness attention needed',
          message: `The elder reported symptoms or concerns during today's check-in. (Reported terms: ${keywordsString || 'fatigue'}). Please review the report and contact them if needed. (Non-diagnostic safety report)`,
          status: 'UNREAD',
        }
      });
    } else if (finalConcernLevel === 'URGENT') {
      await prisma.alert.create({
        data: {
          elderId,
          severity: 'HIGH',
          title: 'Urgent safety concern reported',
          message: `The elder reported a potentially urgent concern during the check-in (Detected signals: ${keywordsString || 'urgent terms'}). Please review the report and contact the elder or appropriate emergency/healthcare services. (Non-diagnostic safety report)`,
          status: 'UNREAD',
        }
      });
    }

    return res.status(201).json({
      message: 'Check-in completed.',
      checkIn,
      concernLevel: finalConcernLevel,
      keywords: analysis.keywords,
      summaryNotes: analysis.summaryNotes,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to submit check-in' });
  }
};
