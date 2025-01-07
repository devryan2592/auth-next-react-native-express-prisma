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

// Base login schema
const loginSchemaBase = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
  refreshToken: z.string().optional(),
});

// Regular login schema
export const loginSchema = z.object({
  body: loginSchemaBase,
});

// Two-factor login schema
export const twoFactorLoginSchema = z.object({
  body: loginSchemaBase.extend({
    twoFactorCode: z
      .string({ required_error: '2FA code is required' })
      .length(6, '2FA code must be 6 characters'),
  }),
});

// Password Reset Request Schema
export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

// Reset Password Schema
export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8).max(100),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Change Password Schema Base
const changePasswordSchemaBase = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8).max(100),
});

// Change Password Schema with refinement
export const changePasswordSchema = changePasswordSchemaBase.refine(
  (data) => data.oldPassword !== data.newPassword,
  {
    message: "New password must be different from old password",
    path: ["newPassword"],
  }
);

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Two Factor Change Password Schema
export const twoFactorChangePasswordSchema = z.object({
  ...changePasswordSchemaBase.shape,
  twoFactorCode: z
    .string({ required_error: '2FA code is required' })
    .length(6, '2FA code must be 6 characters'),
}).refine(
  (data) => data.oldPassword !== data.newPassword,
  {
    message: "New password must be different from old password",
    path: ["newPassword"],
  }
);

export type TwoFactorChangePasswordInput = z.infer<typeof twoFactorChangePasswordSchema>;

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['params'];
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type TwoFactorLoginInput = z.infer<typeof twoFactorLoginSchema>['body'];

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

export const twoFactorSchema = z.object({
  body: z.object({
    code: z.string().length(6).regex(/^\d+$/, 'Code must be numeric'),
  }),
});
