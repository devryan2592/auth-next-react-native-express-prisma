import { TwoFactorType, User } from '@prisma/client';
import { prisma } from '@/utils/db';
import { generateRandomCode } from '@/utils/generators/generateRandomCode';
import { addMinutes } from 'date-fns';
import { sendTwoFactorEmail } from '@/services/email.service';
import { AppError } from '@/helpers/error';
import { HTTP_STATUS } from '@/constants';

/**
 * Generate and send a 2FA code to a user
 * @param user - The user to send the code to
 * @param type - The type of 2FA code to generate
 * @param expiresInMinutes - The number of minutes the code will expire
 * @returns The generated 2FA token
 */
export async function generateAndSendCode(
  user: User,
  type: TwoFactorType,
  expiresInMinutes: number = 10,
) {
  const code = generateRandomCode(6);
  const expiresAt = addMinutes(new Date(), expiresInMinutes);

  // Delete any existing unused tokens of the same type
  await prisma.twoFactorToken.deleteMany({
    where: {
      userId: user.id,
      type,
      used: false,
    },
  });

  // Create new 2FA token
  const twoFactorToken = await prisma.twoFactorToken.create({
    data: {
      userId: user.id,
      type,
      code,
      expiresAt,
    },
  });

  // Send code via email
  await sendTwoFactorEmail({ to: user.email, code });

  return twoFactorToken;
}

/**
 * Verify a 2FA token for a specific user and type
 * @throws {AppError} If token is invalid, expired, or already used
 */
export async function verifyCode(userId: string, code: string, type: TwoFactorType) {
  const twoFactorToken = await prisma.twoFactorToken.findFirst({
    where: {
      userId,
      code,
      type,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!twoFactorToken) {
    throw new AppError('Invalid or expired 2FA code', HTTP_STATUS.UNAUTHORIZED);
  }

  // Delete the used token
  await prisma.twoFactorToken.delete({
    where: { id: twoFactorToken.id },
  });

  return true;
}

/**
 * Enable 2FA for a user
 * @throws {AppError} If user is not found or 2FA is already enabled
 */
export async function enable2FA(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  if (user.isTwoFactorEnabled) {
    throw new AppError('2FA is already enabled', HTTP_STATUS.BAD_REQUEST);
  }

  // Generate and send verification code
  await generateAndSendCode(user, TwoFactorType.LOGIN);

  return true;
}

/**
 * Disable 2FA for a user
 * @throws {AppError} If user is not found or 2FA is not enabled
 */
export async function disable2FA(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  if (!user.isTwoFactorEnabled) {
    throw new AppError('2FA is not enabled', HTTP_STATUS.BAD_REQUEST);
  }

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: { isTwoFactorEnabled: false },
  });

  // Delete all 2FA tokens
  await prisma.twoFactorToken.deleteMany({
    where: { userId },
  });

  return true;
}

/**
 * Confirm enabling 2FA for a user
 * @throws {AppError} If the code is invalid
 */
export async function confirmEnable2FA(userId: string, code: string) {
  const isValid = await verifyCode(userId, code, TwoFactorType.LOGIN);

  if (!isValid) {
    throw new AppError('Invalid 2FA code', HTTP_STATUS.BAD_REQUEST);
  }

  // Enable 2FA for user
  await prisma.user.update({
    where: { id: userId },
    data: { isTwoFactorEnabled: true },
  });

  return true;
}
