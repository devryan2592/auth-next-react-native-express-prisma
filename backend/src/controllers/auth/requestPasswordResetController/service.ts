import { AppError } from '@/helpers/error';
import { HTTP_STATUS } from '@/constants';
import { prisma } from '@/utils/db';
import { sendPasswordResetEmail } from '@/services/email.service';

/**
 * Request password reset
 * @throws {AppError} If email doesn't exist
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
    },
  });

  if (!user) {
    throw new AppError('Email not found', HTTP_STATUS.BAD_REQUEST);
  }

  // Generate reset token using Node's webcrypto
  const tokenBuffer = new Uint8Array(32);
  crypto.getRandomValues(tokenBuffer);
  const token = Array.from(tokenBuffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Save reset token
  await prisma.passwordReset.upsert({
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

  // Send reset email
  await sendPasswordResetEmail({
    to: user.email,
    token,
  });
}
