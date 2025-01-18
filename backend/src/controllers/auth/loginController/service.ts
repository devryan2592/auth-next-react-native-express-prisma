import { prisma } from '@/utils/db';
import bcrypt from 'bcryptjs';
import { TwoFactorLoginInput, LoginInput } from './schema';
import { LoginResponse } from './type';
import { HTTP_STATUS } from '@/constants';
import { TwoFactorType } from '@prisma/client';
import { TwoFactorResponse } from '../twoFactorController/type';
import { AppError } from '@/helpers/error';
import { generateRandomCode } from '@/utils/generators/generateRandomCode';
import { addMinutes } from 'date-fns';
import { sendTwoFactorEmail } from '@/services/email.service';
import { generateTokens } from '@/utils/generators/generateTokens';

/**
 * Validate user credentials and handle initial login
 */
export async function validateCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      isVerified: true,
      isTwoFactorEnabled: true,
    },
  });

  if (!user) {
    throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.isVerified) {
    throw new AppError('Please verify your email first', HTTP_STATUS.UNAUTHORIZED);
  }

  return user;
}

/**
 * Handle login without 2FA
 */
export async function loginWithout2FA(
  data: LoginInput,
  ipAddress: string,
  userAgent: UAParser.IResult,
  existingRefreshToken?: string,
): Promise<LoginResponse> {
  const user = await validateCredentials(data.email, data.password);

  if (user.isTwoFactorEnabled) {
    throw new AppError('2FA is required for this account', HTTP_STATUS.UNAUTHORIZED);
  }

  return await createAndSendTokens(user.id, ipAddress, userAgent, existingRefreshToken);
}

/**
 * Handle initial 2FA login step
 */
export async function initiate2FALogin(
  data: LoginInput
): Promise<TwoFactorResponse> {
  const user = await validateCredentials(data.email, data.password);

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  if (!user.isTwoFactorEnabled) {
    throw new AppError('2FA is not enabled for this account', HTTP_STATUS.BAD_REQUEST);
  }

  // Delete any existing unused tokens
  await prisma.twoFactorToken.deleteMany({
    where: {
      userId: user.id,
      type: TwoFactorType.LOGIN,
      used: false,
    },
  });

  // Generate and save new 2FA token
  const code = generateRandomCode(6);
  const expiresAt = addMinutes(new Date(), 10);

  await prisma.twoFactorToken.create({
    data: {
      userId: user.id,
      type: TwoFactorType.LOGIN,
      code,
      expiresAt,
    },
  });

  // Send 2FA code via email
  await sendTwoFactorEmail({
    to: user.email,
    code,
  });

  return {
    twoFactorToken: code,
    userId: user.id,
    type: TwoFactorType.LOGIN,
  } as const;
}

/**
 * Complete login with 2FA verification
 */
export async function completeLoginWith2FA(
  data: TwoFactorLoginInput,
  ipAddress: string,
  userAgent: UAParser.IResult,
  existingRefreshToken?: string,
): Promise<LoginResponse> {

  // Since we already validated the credentials, we can use the user object
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  // Verify 2FA code
  const twoFactorToken = await prisma.twoFactorToken.findFirst({
    where: {
      userId: user.id,
      code: data.twoFactorCode,
      type: data.type || TwoFactorType.LOGIN,
      used: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!twoFactorToken) {
    throw new AppError('Invalid or expired 2FA code', HTTP_STATUS.UNAUTHORIZED);
  }

  // Mark token as used
  await prisma.twoFactorToken.delete({
    where: { id: twoFactorToken.id },
  });

  return await createAndSendTokens(user.id, ipAddress, userAgent, existingRefreshToken);
}

/**
 * Create and manage session tokens
 */
export async function createAndSendTokens(
  userId: string,
  ipAddress: string,
  userAgent: UAParser.IResult,
  existingRefreshToken?: string,
): Promise<LoginResponse> {
  const { accessToken, refreshToken } = generateTokens(userId);

  let session;

  if (existingRefreshToken) {
    // Find existing session with refresh token
    const existingSession = await prisma.session.findFirst({
      where: {
        userId,
        refreshToken: {
          token: existingRefreshToken,
        },
      },
    });

    if (existingSession) {
      // Update existing session
      session = await prisma.session.update({
        where: { id: existingSession.id },
        data: {
          lastUsed: new Date(),
          refreshToken: {
            update: {
              token: refreshToken,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
          },
        },
        include: {
          refreshToken: true,
        },
      });
    }
  } else {
    // If no refresh token, check for existing session with same IP and device info
    const existingSession = await prisma.session.findFirst({
      where: {
        userId,
        ipAddress,
        userAgent: userAgent.ua,
        deviceType: userAgent.device.type || null,
        browser: userAgent.browser.name || null,
        os: userAgent.os.name || null,
        expires: {
          gt: new Date(), // Only consider non-expired sessions
        },
      },
      orderBy: {
        lastUsed: 'desc', // Get the most recently used session
      },
    });

    if (existingSession) {
      // Update existing session
      session = await prisma.session.update({
        where: { id: existingSession.id },
        data: {
          lastUsed: new Date(),
          refreshToken: {
            update: {
              token: refreshToken,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
          },
        },
        include: {
          refreshToken: true,
        },
      });
    }
  }

  if (!session) {
    // Create new session with refresh token
    session = await prisma.session.create({
      data: {
        userId,
        ipAddress,
        userAgent: userAgent.ua,
        deviceType: userAgent.device.type || null,
        deviceName: userAgent.device.model || null,
        browser: userAgent.browser.name || null,
        os: userAgent.os.name || null,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        refreshToken: {
          create: {
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        },
      },
      include: {
        refreshToken: true,
      },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isVerified: true,
      isTwoFactorEnabled: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  return {
    user,
    session: {
      id: session.id,
      ipAddress: session.ipAddress,
      deviceType: session.deviceType,
      deviceName: session.deviceName,
      browser: session.browser,
      os: session.os,
      accessToken,
      refreshToken: session.refreshToken!.token,
    },
  };
}
