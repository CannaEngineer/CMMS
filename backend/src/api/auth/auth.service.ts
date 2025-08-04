
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const register = async (data: any) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  });
  return user;
};

export const login = async (data: any) => {
  console.log("Login attempt for email:", data.email);
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    console.log("User not found for email:", data.email);
    throw new Error('User not found');
  }

  console.log("User found. Comparing passwords...");
  console.log("Provided password (DEBUG ONLY):", data.password);
  console.log("Stored hashed password (DEBUG ONLY):", user.password);

  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  console.log("Password comparison result:", isPasswordValid);

  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '1h',
  });

  return { user, token };
};
