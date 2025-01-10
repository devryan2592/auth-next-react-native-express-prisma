import { z } from 'zod';
import { changePasswordSchemaBase } from '../changePasswordController/schema';
import { loginSchemaBase } from '../loginController/schema';

export const twoFactorSchema = z.object({
  body: z.object({
    userId: z.string({ required_error: 'User ID is required' }).uuid('Invalid user ID format'),
    code: z
      .string({ required_error: '2FA code is required' })
      .length(6, '2FA code must be 6 characters'),
    type: z.enum(['LOGIN', 'PASSWORD_CHANGE']).optional(),
  }),
});

// Two-factor login schema
export const twoFactorLoginSchema = z.object({
  body: loginSchemaBase.extend({
    twoFactorCode: z
      .string({ required_error: '2FA code is required' })
      .length(6, '2FA code must be 6 characters'),
  }),
});

// Two Factor Change Password Schema
export const twoFactorChangePasswordSchema = z
  .object({
    ...changePasswordSchemaBase.shape,
    twoFactorCode: z
      .string({ required_error: '2FA code is required' })
      .length(6, '2FA code must be 6 characters'),
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'New password must be different from old password',
    path: ['newPassword'],
  });
