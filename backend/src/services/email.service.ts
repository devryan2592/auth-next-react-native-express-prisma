import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { AppError } from '@/helpers/error';
import { HTTP_STATUS } from '@/constants';
import { logger } from '@/utils/logger';

let transporter: nodemailer.Transporter;

// Initialize transporter based on environment
if (process.env.NODE_ENV === 'development') {
  transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
  });
} else {
  // TODO: Configure production email service (e.g., Mailgun, SendGrid, etc.)
  logger.warn('Production email service not configured');
  transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025,
  });
}

/**
 * Load and compile a Handlebars template
 */
const loadTemplate = async (templateName: string) => {
  const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.hbs`);
  const template = await fs.readFile(templatePath, 'utf-8');
  return handlebars.compile(template);
};

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
    const verificationLink = `${process.env.CLIENT_URL}/auth/verify/${payload.userId}/${payload.token}`;

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
export const sendTwoFactorEmail = async (payload: {
  to: string;
  code: string;
}) => {
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
export const sendPasswordResetEmail = async (payload: {
  to: string;
  token: string;
}) => {
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