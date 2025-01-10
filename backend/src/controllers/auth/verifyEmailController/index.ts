import { Request, Response } from 'express';
import { verifyEmail } from './service';
import { catchAsync } from '@/helpers/catchAsync';
import { verifyEmailSchema } from './schema';
import { HTTP_STATUS } from '@/constants';

/**
 * @swagger
 * /auth/verify-email/{userId}/{token}:
 *   get:
 *     summary: Verify user's email address
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The user's ID
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email successfully verified
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
 *                   example: Email verified successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Invalid credentials, already verified, or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Invalid verification credentials
 *       500:
 *         description: Internal server error
 */
export const verifyEmailController = catchAsync(async (req: Request, res: Response) => {
  // Validate params
  const validatedData = verifyEmailSchema.parse(req);

  // Verify email
  const user = await verifyEmail(validatedData.params);

  // Send response
  return res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'Email verified successfully',
    data: user,
  });
});
