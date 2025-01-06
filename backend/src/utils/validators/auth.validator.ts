import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .min(5, 'Email must be at least 5 characters')
      .max(255, 'Email must be less than 255 characters')
      .trim()
      .toLowerCase(),
    
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be less than 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    
    confirmPassword: z
      .string({ required_error: 'Password confirmation is required' }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }),
});

export const verifyEmailSchema = z.object({
  params: z.object({
    userId: z
      .string({ required_error: 'User ID is required' })
      .uuid('Invalid user ID format'),
    token: z
      .string({ required_error: 'Verification token is required' })
      .min(1, 'Verification token cannot be empty'),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .trim()
      .toLowerCase(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .trim()
      .toLowerCase(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['params'];
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];

// Response types
export interface RegisterResponse {
  id: string;
  email: string;
  createdAt: Date;
}

export interface VerifyEmailResponse {
  email: string;
  isVerified: boolean;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    isVerified: boolean;
    isTwoFactorEnabled: boolean;
  };
  session: {
    id: string;
    accessToken: string;
    refreshToken: string;
  };
}
