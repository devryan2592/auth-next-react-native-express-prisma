import { z } from 'zod';

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .trim()
      .toLowerCase(),
  }),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>['body'];
