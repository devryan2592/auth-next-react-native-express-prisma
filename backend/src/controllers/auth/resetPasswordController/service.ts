import { HTTP_STATUS } from '@/constants';
import { AppError } from '@/helpers/error';
import { prisma } from '@/utils/db';
import bcrypt from 'bcryptjs';

/**
 * Reset password with token
 * @throws {AppError} If token is invalid or expired
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const reset = await prisma.passwordReset.findFirst({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          password: true,
        },
      },
    },
  });

  if (!reset || !reset.user) {
    throw new AppError('Invalid reset token', HTTP_STATUS.BAD_REQUEST);
  }

  if (reset.expiresAt < new Date()) {
    throw new AppError('Reset token has expired', HTTP_STATUS.BAD_REQUEST);
  }

  // Check if new password is same as old password
  const isSamePassword = await bcrypt.compare(newPassword, reset.user.password);
  if (isSamePassword) {
    throw new AppError('New password must be different from old password', HTTP_STATUS.BAD_REQUEST);
  }

  // Hash new password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password and delete reset token
  await prisma.$transaction([
    prisma.user.update({
      where: { id: reset.user.id },
      data: { password: hashedPassword },
    }),
    prisma.passwordReset.delete({
      where: { userId: reset.user.id },
    }),
  ]);
}
