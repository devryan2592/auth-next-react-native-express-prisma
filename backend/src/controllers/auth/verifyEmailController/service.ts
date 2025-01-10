import { prisma } from '@/utils/db';
import { HTTP_STATUS } from '@/constants';
import { VerifyEmailInput } from './schema';
import { VerifyEmailResponse } from './type';
import { AppError } from '@/helpers/error';

/**
 * Verify user's email
 * @throws {AppError} If token is invalid or expired
 */
export async function verifyEmail(data: VerifyEmailInput): Promise<VerifyEmailResponse> {
  const verification = await prisma.emailVerification.findFirst({
    where: {
      AND: [{ userId: data.userId }, { token: data.token }],
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isVerified: true,
        },
      },
    },
  });

  if (!verification || !verification.user) {
    throw new AppError('Invalid verification credentials', HTTP_STATUS.BAD_REQUEST);
  }

  if (verification.user.isVerified) {
    throw new AppError('Email is already verified', HTTP_STATUS.BAD_REQUEST);
  }

  if (verification.expiresAt < new Date()) {
    throw new AppError('Verification token has expired', HTTP_STATUS.BAD_REQUEST);
  }

  // Update user verification status and delete verification record
  const [verifiedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.user.id },
      data: { isVerified: true },
      select: {
        email: true,
        isVerified: true,
      },
    }),
    prisma.emailVerification.delete({
      where: { userId: verification.user.id },
    }),
  ]);

  return verifiedUser;
}
