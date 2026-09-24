import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../utils/prisma';

export const simulateDemoScenario = async (req: AuthRequest, res: Response) => {
  try {
    const { scenario } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user context.' });
    }

    // 1. Identify monitored elder profile associated with user
    let elderProfile = await prisma.elderProfile.findFirst({
      where: {
        OR: [
          { userId },
          { primaryGuardianId: userId },
          { guardians: { some: { guardianId: userId } } }
        ]
      }
    });

    if (!elderProfile) {
      // Fallback: fetch default seeded elder Lakshmi
      elderProfile = await prisma.elderProfile.findFirst();
    }

    if (!elderProfile) {
      return res.status(404).json({ error: 'No active elder profile found for simulation.' });
    }

    const elderId = elderProfile.id;
    let resultMessage = '';
    let createdDetails: any = {};

    switch (scenario) {
      case 'NORMAL_CHECKIN': {
        const checkIn = await prisma.checkIn.create({
          data: {
            elderId,
            status: 'NORMAL',
            concernLevel: 'NORMAL',
            mood: 'Good',
            response: '[DEMO SIMULATION] I am feeling good and well rested today.',
            extractedKeywords: 'good, active',
            notes: '[DEMO SIMULATION] Scheduled normal daily check-in.',
          }
        });
        resultMessage = 'Created normal check-in record in database.';
        createdDetails = { checkInId: checkIn.id, status: checkIn.status };
        break;
      }

      case 'ATTENTION_CHECKIN': {
        const checkIn = await prisma.checkIn.create({
          data: {
            elderId,
            status: 'ATTENTION',
            concernLevel: 'ATTENTION',
            mood: 'Tired',
            response: '[DEMO SIMULATION] I feel slightly dizzy and tired after waking up.',
            extractedKeywords: 'dizzy, tired',
            notes: '[DEMO SIMULATION] Check-in flagged with ATTENTION status.',
          }
        });

        const alert = await prisma.alert.create({
          data: {
            elderId,
            type: 'HEALTH_CONCERN',
            severity: 'MEDIUM',
            title: '[DEMO SIMULATION] Health Concern Reported',
            message: '[DEMO SIMULATION] Elder reported dizziness during demo check-in.',
            status: 'UNREAD',
          }
        });

        resultMessage = 'Created attention-needed check-in and generated HEALTH_CONCERN alert.';
        createdDetails = { checkInId: checkIn.id, alertId: alert.id };
        break;
      }

      case 'MISSED_MEDICINE': {
        const alert = await prisma.alert.create({
          data: {
            elderId,
            type: 'MEDICINE_MISSED',
            severity: 'MEDIUM',
            title: '[DEMO SIMULATION] Evening Medicine Reminder Unacknowledged',
            message: '[DEMO SIMULATION] Evening medicine reminder has not been acknowledged.',
            status: 'UNREAD',
          }
        });

        resultMessage = 'Generated MEDICINE_MISSED alert in database.';
        createdDetails = { alertId: alert.id, type: alert.type };
        break;
      }

      case 'MISSED_CHECKIN': {
        const alert = await prisma.alert.create({
          data: {
            elderId,
            type: 'CHECKIN_MISSED',
            severity: 'HIGH',
            title: '[DEMO SIMULATION] Scheduled Daily Check-In Missed',
            message: '[DEMO SIMULATION] Expected daily check-in window passed without response.',
            status: 'UNREAD',
          }
        });

        resultMessage = 'Generated CHECKIN_MISSED alert in database.';
        createdDetails = { alertId: alert.id, type: alert.type };
        break;
      }

      case 'DEMO_SOS': {
        // Critical safety rule: clearly labeled demo location, no fake GPS coordinates presented as real user location
        const sos = await prisma.sOS.create({
          data: {
            elderId,
            status: 'TRIGGERED',
            address: '[DEMO SIMULATION] Demo location — not a real emergency location',
            locationUnavailable: true,
          }
        });

        const alert = await prisma.alert.create({
          data: {
            elderId,
            type: 'SOS',
            severity: 'CRITICAL',
            title: '[DEMO SIMULATION] Demo Emergency SOS Triggered',
            message: '[DEMO SIMULATION] Demo emergency signal received. Demo location — not a real emergency location.',
            status: 'UNREAD',
          }
        });

        resultMessage = 'Created demo SOS record and CRITICAL SOS alert in database.';
        createdDetails = { sosId: sos.id, alertId: alert.id };
        break;
      }

      default:
        return res.status(400).json({ error: 'Unknown demo scenario specified.' });
    }

    return res.status(200).json({
      success: true,
      scenario,
      message: resultMessage,
      details: createdDetails,
      elderName: elderProfile.name,
    });
  } catch (error: any) {
    console.error('Error executing demo scenario:', error);
    return res.status(500).json({ error: 'Failed to simulate demo scenario in database.' });
  }
};

export const resetDemoData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user context.' });
    }

    let elderProfile = await prisma.elderProfile.findFirst({
      where: {
        OR: [
          { userId },
          { primaryGuardianId: userId },
          { guardians: { some: { guardianId: userId } } }
        ]
      }
    });

    if (!elderProfile) {
      elderProfile = await prisma.elderProfile.findFirst();
    }

    if (!elderProfile) {
      return res.status(404).json({ error: 'No active elder profile found.' });
    }

    const elderId = elderProfile.id;

    // Delete ONLY records containing [DEMO SIMULATION] tag to preserve real data safely
    const deletedAlerts = await prisma.alert.deleteMany({
      where: {
        elderId,
        OR: [
          { title: { contains: '[DEMO SIMULATION]' } },
          { message: { contains: '[DEMO SIMULATION]' } }
        ]
      }
    });

    const deletedCheckIns = await prisma.checkIn.deleteMany({
      where: {
        elderId,
        OR: [
          { response: { contains: '[DEMO SIMULATION]' } },
          { notes: { contains: '[DEMO SIMULATION]' } }
        ]
      }
    });

    const deletedSOS = await prisma.sOS.deleteMany({
      where: {
        elderId,
        address: { contains: '[DEMO SIMULATION]' }
      }
    });

    return res.status(200).json({
      success: true,
      message: `Reset complete. Deleted ${deletedAlerts.count} demo alerts, ${deletedCheckIns.count} demo check-ins, and ${deletedSOS.count} demo SOS events. Real data remained untouched.`,
    });
  } catch (error: any) {
    console.error('Error resetting demo data:', error);
    return res.status(500).json({ error: 'Failed to reset demo records.' });
  }
};
