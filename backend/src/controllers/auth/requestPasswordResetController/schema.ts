import { z } from 'zod';

// Password Reset Request Schema
export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
