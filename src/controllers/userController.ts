import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

function validateEmail(email?: string) {
  return typeof email === 'string' && email.includes('@');
}

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'email and password are required' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'invalid email' });
    }

    const user = await prisma.user.create({
      data: { email, name: name ?? null, password }
    });
    
    const { password: _, ...userNoPass } = user as any;
    res.status(201).json({ success: true, data: userNoPass });
  } catch (err: any) {
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      return res.status(409).json({ success: false, message: 'email already in use' });
    }
    next(err);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true }
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ success: false, message: 'invalid id' });

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true }
    });
    if (!user) return res.status(404).json({ success: false, message: 'user not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { email, name, password } = req.body;
    if (Number.isNaN(id)) return res.status(400).json({ success: false, message: 'invalid id' });
    if (email && !validateEmail(email)) return res.status(400).json({ success: false, message: 'invalid email' });

    const updated = await prisma.user.update({
      where: { id },
      data: { email, name, password }
    });
    const { password: _, ...userNoPass } = updated as any;
    res.json({ success: true, data: userNoPass });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'user not found' });
    }
    if (err.code === 'P2002' && err.meta?.target?.includes('email')) {
      return res.status(409).json({ success: false, message: 'email already in use' });
    }
    next(err);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ success: false, message: 'invalid id' });

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'deleted' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'user not found' });
    }
    next(err);
  }
};
