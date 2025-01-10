import bcrypt from 'bcryptjs';
import { prisma } from '@/utils/db';
import { HTTP_STATUS } from '@/constants';
import { AppError } from '@/helpers/error';
import { generateVerificationToken } from '@/utils/generators/generateVerificationTokens';
import { RegisterResponse } from './type';
import { RegisterInput } from './schema';
import { sendVerificationEmail } from '@/services/email.service';

/**
 * Register a new user
 * @throws {AppError} If email already exists
 */
export async function register(data: RegisterInput): Promise<RegisterResponse> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError('Email already exists', HTTP_STATUS.BAD_REQUEST);
  }

  // Generate verification token
  const { token, expiresAt } = generateVerificationToken();

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  // Create user with verification token
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      emailVerification: {
        create: {
          token,
          expiresAt,
        },
      },
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  // Send verification email
  await sendVerificationEmail({
    to: user.email,
    userId: user.id,
    token: token,
  });

  return user;
}
