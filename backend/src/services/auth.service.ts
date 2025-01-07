import bcrypt from 'bcryptjs';
import { prisma } from '@/utils/db';
import { AppError } from '@/helpers/error';
import { HTTP_STATUS } from '@/constants';
import { sendVerificationEmail, sendTwoFactorEmail, sendPasswordResetEmail } from '@/services/email.service';
import type { 
  RegisterInput, 
  RegisterResponse,
  VerifyEmailInput,
  VerifyEmailResponse,
  ResendVerificationInput,
  LoginInput,
  LoginResponse,
  TwoFactorLoginInput
} from '@/utils/validators/auth.validator';
import { generateVerificationToken } from '@/utils/generators/generateVerificationTokens';
import { generateTokens } from '@/utils/generators/generateTokens';
import { generateTwoFactorToken } from '@/utils/generators/generateTwoFactorToken';
import { TwoFactorType } from '@prisma/client';



/**
 * Register a new user
 * @throws {AppError} If email already exists
 */
export async function register(data: RegisterInput): Promise<RegisterResponse> {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new AppError('Email already exists', HTTP_STATUS.BAD_REQUEST);
  }

  // Generate verification token
  const { token, expiresAt } = generateVerificationToken();

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  // Create user with verification token
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      emailVerification: {
        create: {
          token,
          expiresAt,
        },
      },
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  // Send verification email
  await sendVerificationEmail({
    to: user.email,
    userId: user.id,
    token: token,
  });

  return user;
}

/**
 * Verify user's email
 * @throws {AppError} If token is invalid or expired
 */
export async function verifyEmail(data: VerifyEmailInput): Promise<VerifyEmailResponse> {
  const verification = await prisma.emailVerification.findFirst({
    where: { 
      AND: [
        { userId: data.userId },
        { token: data.token }
      ]
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
    throw new AppError('Email not found', HTTP_STATUS.BAD_REQUEST);
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

/**
 * Verify a 2FA token for a specific user and type
 * @throws {AppError} If token is invalid, expired, or already used
 */
async function verifyTwoFactorToken(
  userId: string,
  code: string,
  type: TwoFactorType
): Promise<void> {
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
    throw new AppError('Invalid or expired 2FA code', HTTP_STATUS.UNAUTHORIZED);
  }

  // Mark token as used
  await prisma.twoFactorToken.update({
    where: { id: twoFactorToken.id },
    data: { used: true },
  });
}

/**
 * Login user
 * @throws {AppError} If credentials are invalid or email is not verified
 */
export async function login(
  data: LoginInput | TwoFactorLoginInput,
  ipAddress: string,
  userAgent: string,
  existingRefreshToken?: string
): Promise<LoginResponse | { twoFactorToken: string }> {

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
      await verifyTwoFactorToken(user.id, data.twoFactorCode, TwoFactorType.LOGIN);
    } else {
      // Generate and save new 2FA token
      const { token, expiresAt } = generateTwoFactorToken();

      await prisma.twoFactorToken.create({
        data: {
          userId: user.id,
          type: TwoFactorType.LOGIN,
          code: token,
          expiresAt,
        },
      });

      // Send 2FA code via email
      await sendTwoFactorEmail({
        to: user.email,
        code: token,
      });

      return { twoFactorToken: token } as const;
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
          token: existingRefreshToken
        }
      }
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
    .map(b => b.toString(16).padStart(2, '0'))
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

/**
 * Change user's password
 * @throws {AppError} If old password is incorrect or 2FA code is invalid
 */
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
  twoFactorCode?: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      password: true,
      isTwoFactorEnabled: true,
      email: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  // Verify old password
  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', HTTP_STATUS.UNAUTHORIZED);
  }

  // Handle 2FA if enabled
  if (user.isTwoFactorEnabled) {
    if (!twoFactorCode) {
      // Generate and save new 2FA token
      const { token, expiresAt } = generateTwoFactorToken();

      await prisma.twoFactorToken.create({
        data: {
          userId,
          type: TwoFactorType.PASSWORD_CHANGE,
          code: token,
          expiresAt,
        },
      });

      // Send 2FA code via email
      await sendTwoFactorEmail({
        to: user.email,
        code: token,
      });

      throw new AppError('2FA code required', HTTP_STATUS.ACCEPTED);
    }

    // Verify 2FA token
    await verifyTwoFactorToken(userId, twoFactorCode, TwoFactorType.PASSWORD_CHANGE);
  }

  // Hash and update new password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}
