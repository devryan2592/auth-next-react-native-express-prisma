import { TwoFactorType, User } from '@prisma/client';
import { prisma } from '@/utils/db';
import { generateRandomCode } from '@/utils/generators/generateRandomCode';
import { addMinutes } from 'date-fns';
import { sendTwoFactorCode } from '@/utils/email';
import { AppError } from '@/helpers/error';

export class TwoFactorService {
  static async generateAndSendCode(
    user: User,
    type: TwoFactorType,
    expiresInMinutes: number = 10
  ) {
    const code = generateRandomCode(6);
    const expiresAt = addMinutes(new Date(), expiresInMinutes);

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
    await sendTwoFactorCode(user.email, code);

    return twoFactorToken;
  }

  static async verifyCode(
    userId: string,
    code: string,
    type: TwoFactorType
  ) {
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
      throw new AppError('Invalid or expired 2FA code', 400);
    }

    // Mark token as used
    await prisma.twoFactorToken.update({
      where: { id: twoFactorToken.id },
      data: { used: true },
    });

    return true;
  }

  static async enable2FA(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.isTwoFactorEnabled) {
      throw new AppError('2FA is already enabled', 400);
    }

    // Generate and send verification code
    await this.generateAndSendCode(user, TwoFactorType.LOGIN);

    return true;
  }

  static async disable2FA(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isTwoFactorEnabled) {
      throw new AppError('2FA is not enabled', 400);
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

  static async confirmEnable2FA(userId: string, code: string) {
    const isValid = await this.verifyCode(userId, code, TwoFactorType.LOGIN);

    if (!isValid) {
      throw new AppError('Invalid 2FA code', 400);
    }

    // Enable 2FA for user
    await prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    return true;
  }
} 