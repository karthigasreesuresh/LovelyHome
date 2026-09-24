import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const userRole = role === 'ELDER' ? 'ELDER' : 'GUARDIAN';

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: userRole,
      },
    });

    if (userRole === 'ELDER') {
      await prisma.elderProfile.create({
        data: {
          userId: user.id,
          name: user.name,
          age: 70,
        },
      });
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role as any });

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        elderProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({ userId: user.id, email: user.email, role: user.role as any });

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        elderProfileId: user.elderProfile?.id || null,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Login failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        elderProfile: true,
        guardianships: {
          include: {
            elder: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
};
