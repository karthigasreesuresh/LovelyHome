import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Prompt 2...');

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.sOS.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medicineLog.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.guardianElder.deleteMany();
  await prisma.elderProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create Guardian User
  const guardianPasswordHash = await bcrypt.hash('Demo@123', 10);
  const guardianUser = await prisma.user.create({
    data: {
      name: 'Demo Guardian',
      email: 'guardian@lovelyhome.demo',
      passwordHash: guardianPasswordHash,
      role: 'GUARDIAN',
    },
  });

  // Create Elder User (password Demo@123 per prompt instructions)
  const elderPasswordHash = await bcrypt.hash('Demo@123', 10);
  const elderUser = await prisma.user.create({
    data: {
      name: 'Lakshmi',
      email: 'lakshmi@lovelyhome.demo',
      passwordHash: elderPasswordHash,
      role: 'ELDER',
    },
  });

  // Create Elder Profile
  const elderProfile = await prisma.elderProfile.create({
    data: {
      userId: elderUser.id,
      name: 'Lakshmi',
      age: 72,
      gender: 'Female',
      medicalHistory: 'Hypertension, Type 2 Diabetes (Demo data)',
      preferredLanguage: 'English',
      primaryGuardianId: guardianUser.id,
    },
  });

  // Link Guardian and Elder
  await prisma.guardianElder.create({
    data: {
      guardianId: guardianUser.id,
      elderId: elderProfile.id,
      relationship: 'Son / Primary Caregiver',
    },
  });

  // Create Check-ins
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  await prisma.checkIn.createMany({
    data: [
      {
        elderId: elderProfile.id,
        status: 'NORMAL',
        mood: 'Cheerful',
        notes: 'DEMO DATA: Morning walk completed, ate breakfast well.',
        timestamp: now,
      },
      {
        elderId: elderProfile.id,
        status: 'ATTENTION',
        mood: 'Slightly Tired',
        notes: 'DEMO DATA: Reported mild headache after afternoon rest.',
        timestamp: yesterday,
      },
      {
        elderId: elderProfile.id,
        status: 'NORMAL',
        mood: 'Good',
        notes: 'DEMO DATA: Peaceful day, talked to grandchildren on video call.',
        timestamp: twoDaysAgo,
      },
    ],
  });

  // Create Medicines
  const med1 = await prisma.medicine.create({
    data: {
      elderId: elderProfile.id,
      name: 'Metformin',
      dosage: '500 mg',
      scheduleTime: '08:00 AM',
      frequency: 'Daily after breakfast',
      instructions: 'Take with full glass of water',
      active: true,
    },
  });

  const med2 = await prisma.medicine.create({
    data: {
      elderId: elderProfile.id,
      name: 'Amlodipine',
      dosage: '5 mg',
      scheduleTime: '09:00 PM',
      frequency: 'Daily after dinner',
      instructions: 'Do not skip',
      active: true,
    },
  });

  const med3 = await prisma.medicine.create({
    data: {
      elderId: elderProfile.id,
      name: 'Multivitamin Supplement',
      dosage: '1 Tablet',
      scheduleTime: '01:00 PM',
      frequency: 'Daily',
      instructions: 'Take after lunch',
      active: true,
    },
  });

  // Create Medicine Logs for today
  await prisma.medicineLog.createMany({
    data: [
      {
        medicineId: med1.id,
        scheduledFor: new Date(now.setHours(8, 0, 0, 0)),
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(now.setHours(8, 15, 0, 0)),
        notes: 'DEMO DATA: Confirmed by elder at 8:15 AM',
      },
      {
        medicineId: med2.id,
        scheduledFor: new Date(yesterday.setHours(21, 0, 0, 0)),
        status: 'MISSED',
        notes: 'DEMO DATA: No response acknowledged within timeframe',
      },
      {
        medicineId: med3.id,
        scheduledFor: new Date(now.setHours(13, 0, 0, 0)),
        status: 'PENDING',
        notes: 'DEMO DATA: Reminder active for 1:00 PM',
      },
    ],
  });

  // Create Prescriptions
  await prisma.prescription.createMany({
    data: [
      {
        elderId: elderProfile.id,
        doctorName: 'Dr. R. K. Sharma (Cardiologist)',
        notes: 'DEMO DATA: Regular quarterly review. Maintain low sodium diet.',
        documentUrl: 'https://example.com/demo-prescription-1.pdf',
        validUntil: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
      },
      {
        elderId: elderProfile.id,
        doctorName: 'Dr. Priya Mehta (General Physician)',
        notes: 'DEMO DATA: Daily Metformin 500mg after breakfast.',
        documentUrl: 'https://example.com/demo-prescription-2.pdf',
        validUntil: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Create Sample Alerts
  await prisma.alert.createMany({
    data: [
      {
        elderId: elderProfile.id,
        severity: 'HIGH',
        title: 'Medication Reminder Missed',
        message: 'DEMO ALERT: Amlodipine 5mg (09:00 PM) was not acknowledged yesterday.',
        status: 'UNREAD',
      },
      {
        elderId: elderProfile.id,
        severity: 'MEDIUM',
        title: 'Check-in Attention Flag',
        message: 'DEMO ALERT: Lakshmi logged feeling slightly tired yesterday afternoon.',
        status: 'READ',
      },
    ],
  });

  // Create Sample SOS Event
  await prisma.sOS.create({
    data: {
      elderId: elderProfile.id,
      status: 'RESOLVED',
      latitude: 13.0827,
      longitude: 80.2707,
      address: '123 Green Park, Sector 4, Chennai (Demo Location)',
      triggeredAt: twoDaysAgo,
      resolvedAt: new Date(twoDaysAgo.getTime() + 15 * 60 * 1000),
    },
  });

  // Create Sample Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        elderId: elderProfile.id,
        userId: elderUser.id,
        action: 'CHECK_IN_COMPLETED',
        details: 'DEMO ACTIVITY: Elder completed daily wellness check-in (Status: NORMAL)',
        timestamp: now,
      },
      {
        elderId: elderProfile.id,
        userId: elderUser.id,
        action: 'MEDICINE_ACKNOWLEDGED',
        details: 'DEMO ACTIVITY: Metformin 500mg reminder acknowledged by Lakshmi',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        elderId: elderProfile.id,
        userId: guardianUser.id,
        action: 'GUARDIAN_DASHBOARD_VIEWED',
        details: 'DEMO ACTIVITY: Demo Guardian logged in and checked dashboard',
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Seed data successfully updated!');
  console.log('👤 Guardian Demo: guardian@lovelyhome.demo / Demo@123');
  console.log('👵 Elder Demo: lakshmi@lovelyhome.demo / Demo@123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
