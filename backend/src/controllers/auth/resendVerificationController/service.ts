import { ResendVerificationInput } from './schema';
import { prisma } from '@/utils/db';
import { AppError } from '@/helpers/error';
import { HTTP_STATUS } from '@/constants';
import { generateVerificationToken } from '@/utils/generators/generateVerificationTokens';
import { sendVerificationEmail } from '@/services/email.service';

/**
 * Resend verification email
 * @throws {AppError} If email doesn't exist or is already verified
 */
export async function resendVerification(data: ResendVerificationInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      email: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new AppError(
      'Token is invalid or expired. Please request a new verification email',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  if (user.isVerified) {
    throw new AppError('Email is already verified', HTTP_STATUS.BAD_REQUEST);
  }

  // Generate new verification token
  const { token, expiresAt } = generateVerificationToken();

  // Update or create verification record
  await prisma.emailVerification.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      token,
      expiresAt,
    },
    update: {
      token,
      expiresAt,
    },
  });

  // Send new verification email
  await sendVerificationEmail({
    to: user.email,
    userId: user.id,
    token: token,
  });
}
