import bcrypt from 'bcryptjs';
import { prisma } from '@/utils/db';
import { AppError } from '@/helpers/error';
import { HTTP_STATUS } from '@/constants';
import { sendVerificationEmail } from '@/services/email.service';
import type { 
  RegisterInput, 
  RegisterResponse,
  VerifyEmailInput,
  VerifyEmailResponse,
  ResendVerificationInput,
  LoginInput,
  LoginResponse
} from '@/utils/validators/auth.validator';
import { generateVerificationToken } from '@/utils/generators/generateVerificationTokens';
import { generateTokens } from '@/utils/generators/generateTokens';
import { generateTwoFactorToken } from '@/utils/generators/generateTwoFactorToken';
import { sendTwoFactorEmail } from '@/services/email.service';



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
 * Login user
 * @throws {AppError} If credentials are invalid or email is not verified
 */
export async function login(
  data: LoginInput,
  ipAddress: string,
  userAgent: string
): Promise<LoginResponse | { twoFactorToken: string }> {
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

  // Handle 2FA if enabled
  if (user.isTwoFactorEnabled) {
    const { token, expiresAt } = generateTwoFactorToken();

    // Save 2FA token
    await prisma.twoFactorToken.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        code: token,
        expiresAt,
      },
      update: {
        code: token,
        expiresAt,
        used: false,
      },
    });

    // Send 2FA code via email
    await sendTwoFactorEmail({
      to: user.email,
      code: token,
    });

    return { twoFactorToken: token } as const;
  }

  // Generate tokens and create session
  const { accessToken, refreshToken } = generateTokens(user.id);

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: {
        create: {
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
      },
      ipAddress,
      userAgent,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

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
      refreshToken,
    },
  } as LoginResponse;
}
