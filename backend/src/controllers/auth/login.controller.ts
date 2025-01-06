import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { login } from '@/services/auth.service';
import { catchAsync } from '@/helpers/catchAsync';
import { loginSchema } from '@/utils/validators/auth.validator';
import { HTTP_STATUS } from '@/constants';



/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *                         isVerified:
 *                           type: boolean
 *                         isTwoFactorEnabled:
 *                           type: boolean
 *                     session:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *       202:
 *         description: Two-factor authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: pending
 *                 message:
 *                   type: string
 *                   example: Two-factor authentication code sent
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid credentials or unverified email
 *       429:
 *         description: Too many login attempts
 */
export const loginController = catchAsync(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = loginSchema.parse(req);
  
  // Get IP address and user agent
  const ipAddress = req.ip || '0.0.0.0';
  const userAgent = req.get('user-agent') ?? 'unknown';

  // Login user
  const result = await login(validatedData.body, ipAddress, userAgent);

  // Handle 2FA response
  if ('twoFactorToken' in result) {
    return res.status(HTTP_STATUS.ACCEPTED).json({
      status: 'pending',
      message: 'Two-factor authentication code sent',
    });
  }

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', result.session.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // Set access token in HTTP-only cookie
  res.cookie('accessToken', result.session.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1 * 60 * 60 * 1000, // 1 hour
  });

  // Send response
  return res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'Login successful',
    data: result,
  });
});
