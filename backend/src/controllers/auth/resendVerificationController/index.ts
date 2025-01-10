import { Request, Response } from 'express';
import { resendVerification } from './service';
import { catchAsync } from '@/helpers/catchAsync';
import { resendVerificationSchema } from './schema';
import { HTTP_STATUS } from '@/constants';

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification email
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
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Verification email sent successfully
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
 *                   example: Verification email sent successfully
 *       400:
 *         description: Invalid email or already verified
 *       429:
 *         description: Too many requests
 *       500:
 *         description: Internal server error
 */
export const resendVerificationController = catchAsync(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = resendVerificationSchema.parse(req);

  // Resend verification email
  await resendVerification(validatedData.body);

  // Send response
  return res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'Verification email sent successfully',
  });
});
