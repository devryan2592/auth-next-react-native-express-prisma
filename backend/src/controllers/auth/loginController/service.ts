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
import { verifyCode } from '../twoFactorController/service';

/**
 * Login user
 * @throws {AppError} If credentials are invalid or email is not verified
 */
export async function login(
  data: LoginInput | TwoFactorLoginInput,
  ipAddress: string,
  userAgent: string,
  existingRefreshToken?: string,
): Promise<LoginResponse | TwoFactorResponse> {
  console.log('Login service called', existingRefreshToken);
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: data.email },
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

  // Verify password
  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED);
  }

  // Check if email is verified
  if (!user.isVerified) {
    throw new AppError('Please verify your email first', HTTP_STATUS.UNAUTHORIZED);
  }

  // Handle 2FA
  if (user.isTwoFactorEnabled) {
    // If 2FA code is provided, verify it
    if ('twoFactorCode' in data) {
      await verifyCode(user.id, data.twoFactorCode, TwoFactorType.LOGIN);
    } else {
      // Delete any existing unused tokens of the same type
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
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id);

  let session;

  if (existingRefreshToken) {
    console.log('existingRefreshToken', existingRefreshToken);
    console.log('user.id', user.id);
    // Find existing session with refresh token
    const existingSession = await prisma.session.findFirst({
      where: {
        userId: user.id,
        refreshToken: {
          token: existingRefreshToken,
        },
      },
    });

    console.log('existingSession', existingSession);

    if (existingSession) {
      // Update existing session
      session = await prisma.session.update({
        where: { id: existingSession.id },
        data: {
          lastUsed: new Date(),
          ipAddress,
          userAgent,
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
        userId: user.id,
        ipAddress,
        userAgent,
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

  return {
    user: {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    },
    session: {
      id: session.id,
      accessToken,
      refreshToken: session.refreshToken!.token,
    },
  };
}
