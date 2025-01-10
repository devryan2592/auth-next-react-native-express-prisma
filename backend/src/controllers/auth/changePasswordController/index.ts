import { Request, Response } from 'express';
import { changePassword } from './service';
import { twoFactorChangePasswordSchema } from '../twoFactorController/schema';
import { catchAsync } from '@/helpers/catchAsync';
import { HTTP_STATUS } from '@/constants';

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *               twoFactorCode:
 *                 type: string
 *                 description: Optional 2FA code if enabled
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input or incorrect old password
 *       401:
 *         description: Unauthorized - not logged in
 *       403:
 *         description: Invalid 2FA code if required
 */
export const changePasswordController = catchAsync(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = twoFactorChangePasswordSchema.parse(req.body);

  const { oldPassword, newPassword, twoFactorCode } = validatedData;
  const userId = req.user!.id;

  await changePassword(userId, oldPassword, newPassword, twoFactorCode);

  return res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'Password has been changed successfully',
  });
});
