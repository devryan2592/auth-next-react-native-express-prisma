import { Request, Response } from 'express';
import { login } from '@/services/auth.service';
import { catchAsync } from '@/helpers/catchAsync';
import { loginSchema, twoFactorLoginSchema } from '@/utils/validators/auth.validator';
import { HTTP_STATUS } from '@/constants';

// Helper function to detect API requests
function isApiRequest(req: Request): boolean {
  // Check for specific API client headers
  const isApiClient =
    req.headers['x-api-client'] === 'true' || // Custom header for API clients
    !req.headers['user-agent']; // No user agent usually means API client

  return isApiClient;
}

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     parameters:
 *       - in: header
 *         name: X-Refresh-Token
 *         schema:
 *           type: string
 *         description: Optional refresh token for mobile apps
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
 *               refreshToken:
 *                 type: string
 *                 description: Optional refresh token (alternative to cookie or header)
 *               twoFactorCode:
 *                 type: string
 *                 description: Required if 2FA is enabled for the account
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
 *       403:
 *         description: Invalid 2FA code
 *       429:
 *         description: Too many login attempts
 */
export const loginController = catchAsync(async (req: Request, res: Response) => {
  // Get IP address and user agent
  const ipAddress = req.ip || '0.0.0.0';
  const userAgent = req.get('user-agent') ?? 'unknown';

  // Get refresh token from multiple sources
  const refreshToken =
    req.cookies.refreshToken || // Web cookie
    req.headers['x-refresh-token'] || // Custom header for mobile apps
    req.body.refreshToken; // Request body

  // Try to validate with 2FA schema first
  try {
    const validatedData = twoFactorLoginSchema.parse(req);
    const result = await login(validatedData.body, ipAddress, userAgent, refreshToken);

    if ('twoFactorToken' in result) {
      return res.status(HTTP_STATUS.ACCEPTED).json({
        status: 'pending',
        message: 'Two-factor authentication code sent',
      });
    }

    // Set cookies for web clients
    if (req.headers['user-agent'] && !isApiRequest(req)) {
      res.cookie('refreshToken', result.session.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('accessToken', result.session.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 1 * 60 * 60 * 1000, // 1 hour
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      status: 'success',
      message: 'Login successful',
      data: result,
    });
  } catch {
    console.log('2FA validation failed');
    // If 2FA validation fails, try regular login
    const validatedData = loginSchema.parse(req);
    const result = await login(validatedData.body, ipAddress, userAgent, refreshToken);

    // If 2FA is required, return 202
    if ('twoFactorToken' in result) {
      return res.status(HTTP_STATUS.ACCEPTED).json({
        status: 'pending',
        message: 'Two-factor authentication code sent',
      });
    }

    // Set cookies for web clients
    if (req.headers['user-agent'] && !isApiRequest(req)) {
      res.cookie('refreshToken', result.session.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('accessToken', result.session.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1 * 60 * 60 * 1000, // 1 hour
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      status: 'success',
      message: 'Login successful',
      data: result,
    });
  }
});
