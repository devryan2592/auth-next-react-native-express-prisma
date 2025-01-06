import bcrypt from 'bcryptjs';
import { prisma } from '@/utils/db';
import { AppError } from '@/helpers/error';
import { HTTP_STATUS } from '@/constants';
import type { RegisterInput, RegisterResponse } from '@/utils/validators/auth.validator';

export class AuthService {
  /**
   * Register a new user
   * @throws {AppError} If email already exists
   */
  static async register(data: RegisterInput): Promise<RegisterResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new AppError('Email already exists', HTTP_STATUS.BAD_REQUEST);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return user;
  }
}
