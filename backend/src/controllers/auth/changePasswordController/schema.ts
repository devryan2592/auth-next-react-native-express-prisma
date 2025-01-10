import { z } from 'zod';

// Change Password Schema Base
export const changePasswordSchemaBase = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8).max(100),
});

// Change Password Schema with refinement
export const changePasswordSchema = changePasswordSchemaBase.refine(
  (data) => data.oldPassword !== data.newPassword,
  {
    message: 'New password must be different from old password',
    path: ['newPassword'],
  },
);

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
