import { z } from 'zod';

// Reset Password Schema
export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8).max(100),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
