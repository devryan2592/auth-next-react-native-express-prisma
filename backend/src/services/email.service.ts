import { AppError } from '@/helpers/error';
import { HTTP_STATUS } from '@/constants';
import { logger } from '@/utils/logger';
import { createEmailTransport } from '@/helpers/createEmailTransport';
import loadTemplate from '@/helpers/loadTemplates';

const transporter = createEmailTransport();

/**
 * Send verification email
 */
export const sendVerificationEmail = async (payload: {
  to: string;
  userId: string;
  token: string;
}) => {
  try {
    const template = await loadTemplate('verify-email');
    const verificationLink = `${process.env.CLIENT_URL}/auth/verify-email/${payload.userId}/${payload.token}`;

    const html = template({
      verificationLink,
      expiresIn: '24 hours',
      email: payload.to,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: payload.to,
      subject: 'Verify your email address',
      html,
    });

    logger.info(`Verification email sent to ${payload.to}`);
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw new AppError('Failed to send verification email', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Send two-factor authentication code
 */
export const sendTwoFactorEmail = async (payload: { to: string; code: string }) => {
  try {
    const template = await loadTemplate('two-factor');
    const html = template({
      code: payload.code,
      email: payload.to,
      expiresIn: '5 minutes',
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: payload.to,
      subject: 'Your Two-Factor Authentication Code',
      html,
    });

    logger.info(`2FA code sent to ${payload.to}`);
  } catch (error) {
    logger.error('Error sending 2FA code:', error);
    throw new AppError('Failed to send 2FA code', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (payload: { to: string; token: string }) => {
  try {
    const template = await loadTemplate('reset-password');
    const resetLink = `${process.env.CLIENT_URL}/auth/reset-password/${payload.token}`;

    const html = template({
      resetLink,
      expiresIn: '1 hour',
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: payload.to,
      subject: 'Reset your password',
      html,
    });

    logger.info(`Password reset email sent to ${payload.to}`);
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    throw new AppError('Failed to send password reset email', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};
