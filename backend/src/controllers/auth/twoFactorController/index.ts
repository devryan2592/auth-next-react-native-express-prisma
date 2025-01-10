import { Request, Response } from 'express';
import { enable2FA, confirmEnable2FA, disable2FA, verifyCode } from '@/services/two-factor.service';
import { catchAsync } from '@/helpers/catchAsync';
import { twoFactorSchema } from '@/utils/validators/auth.validator';
import { generateTokens } from '@/utils/generators/generateTokens';
import { prisma } from '@/utils/db';
import { addDays } from 'date-fns';
import { TwoFactorType } from '@prisma/client';
import { AppError } from '@/helpers/error';

export const enable2FAController = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await enable2FA(userId);

  return res.status(200).json({
    status: 'success',
    message: 'Verification code sent to your email',
  });
});

export const confirm2FAController = catchAsync(async (req: Request, res: Response) => {
  const validatedData = twoFactorSchema.parse(req);
  const userId = req.user!.id;
  const { code } = validatedData.body;

  await confirmEnable2FA(userId, code);

  return res.status(200).json({
    status: 'success',
    message: '2FA enabled successfully',
  });
});

export const disable2FAController = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await disable2FA(userId);

  return res.status(200).json({
    status: 'success',
    message: '2FA disabled successfully',
  });
});

export const verify2FAController = catchAsync(async (req: Request, res: Response) => {
  const validatedData = twoFactorSchema.parse(req);
  const { userId, code, type = 'LOGIN' } = validatedData.body;

  // Verify the 2FA code
  await verifyCode(userId, code, type as TwoFactorType);

  // If this is a password change verification, return success
  if (type === 'PASSWORD_CHANGE') {
    return res.status(200).json({
      status: 'success',
      message: '2FA code verified successfully',
    });
  }

  // For login verification, handle session management
  const { accessToken, refreshToken } = generateTokens(userId);

  // Check for existing refresh token in header or body
  const existingRefreshToken =
    req.cookies.refreshToken || // Web cookie
    req.headers['x-refresh-token'] || // Custom header for mobile apps
    req.body.refreshToken; // Request body

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
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          refreshToken: {
            update: {
              token: refreshToken,
              expiresAt: addDays(new Date(), 30),
            },
          },
        },
        include: {
          refreshToken: true,
        },
      });
    }
  }

  // If no existing session found, create new one
  if (!session) {
    session = await prisma.session.create({
      data: {
        userId,
        expires: addDays(new Date(), 30),
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        refreshToken: {
          create: {
            token: refreshToken,
            expiresAt: addDays(new Date(), 30),
          },
        },
      },
      include: {
        refreshToken: true,
      },
    });
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isVerified: true,
      isTwoFactorEnabled: true,
    },
  });

  if (!session.refreshToken) {
    throw new AppError('Failed to create or update session', 500);
  }

  return res.status(200).json({
    status: 'success',
    message: '2FA verified and login successful',
    data: {
      user,
      session: {
        id: session.id,
        accessToken,
        refreshToken: session.refreshToken.token,
      },
    },
  });
});
