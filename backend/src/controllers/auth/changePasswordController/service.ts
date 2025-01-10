import { HTTP_STATUS } from '@/constants';
import { AppError } from '@/helpers/error';
import { sendTwoFactorEmail } from '@/services/email.service';
import { prisma } from '@/utils/db';
import { generateRandomCode } from '@/utils/generators/generateRandomCode';
import { TwoFactorType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { addMinutes } from 'date-fns';

/**
 * Change user's password
 * @throws {AppError} If old password is incorrect or 2FA code is invalid
 */
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
  twoFactorCode?: string,
  expiresInMinutes = 10,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
      isTwoFactorEnabled: true,
      email: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  // Verify old password
  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', HTTP_STATUS.UNAUTHORIZED);
  }

  // Handle 2FA if enabled
  if (user.isTwoFactorEnabled) {
    if (!twoFactorCode) {
      await prisma.twoFactorToken.deleteMany({
        where: {
          userId: user.id,
          type: TwoFactorType.LOGIN,
          used: false,
        },
      });
      // Generate and save new 2FA token
      const token = generateRandomCode(6);
      const expiresAt = addMinutes(new Date(), expiresInMinutes);

      await prisma.twoFactorToken.create({
        data: {
          userId,
          type: TwoFactorType.PASSWORD_CHANGE,
          code: token,
          expiresAt,
        },
      });

      // Send 2FA code via email
      await sendTwoFactorEmail({
        to: user.email,
        code: token,
      });

      throw new AppError('2FA code required', HTTP_STATUS.ACCEPTED);
    }

    // Verify 2FA token
    await verifyTwoFactorToken(userId, twoFactorCode, TwoFactorType.PASSWORD_CHANGE);
  }

  // Hash and update new password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}
