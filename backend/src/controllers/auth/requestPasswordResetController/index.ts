import { Request, Response } from 'express';
import { requestPasswordReset } from '@/services/auth.service';
import { requestPasswordResetSchema } from '@/utils/validators/auth.validator';
import { catchAsync } from '@/helpers/catchAsync';
import { HTTP_STATUS } from '@/constants';

/**
 * @swagger
 * /auth/request-password-reset:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the account to reset password
 *     responses:
 *       200:
 *         description: Reset email sent if account exists
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
 *       429:
 *         description: Too many reset attempts
 */
export const requestPasswordResetController = catchAsync(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = requestPasswordResetSchema.parse(req.body);
  
  await requestPasswordReset(validatedData.email);
  
  return res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'If an account exists with that email, you will receive password reset instructions.'
  });
}); 