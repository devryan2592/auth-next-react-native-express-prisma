import { z } from 'zod';
import { twoFactorLoginSchema } from '../twoFactorController/schema';
import { twoFactorChangePasswordSchema } from '../twoFactorController/schema';

// Base login schema
export const loginSchemaBase = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .trim()
    .toLowerCase(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
  refreshToken: z.string().optional(),
});

// Regular login schema
export const loginSchema = z.object({
  body: loginSchemaBase,
});

export type TwoFactorChangePasswordInput = z.infer<typeof twoFactorChangePasswordSchema>;

export type LoginInput = z.infer<typeof loginSchema>['body'];
export type TwoFactorLoginInput = z.infer<typeof twoFactorLoginSchema>
