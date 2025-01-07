import { Request, Response } from 'express';
import { resetPassword } from '@/services/auth.service';
import { resetPasswordSchema } from '@/utils/validators/auth.validator';
import { catchAsync } from '@/helpers/catchAsync';
import { HTTP_STATUS } from '@/constants';

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset user password using reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token received via email
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password to set
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid or expired reset token
 */
export const resetPasswordController = catchAsync(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = resetPasswordSchema.parse(req.body);
  
  const { token, newPassword } = validatedData;
  await resetPassword(token, newPassword);
  
  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'Password has been reset successfully'
  });
}); 