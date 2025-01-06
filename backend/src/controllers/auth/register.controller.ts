import { Request, Response } from 'express';
import { register } from '@/services/auth.service';
import { catchAsync } from '@/helpers/catchAsync';
import { registerSchema } from '@/utils/validators/auth.validator';
import { HTTP_STATUS } from '@/constants';

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
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
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: User's password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Password confirmation
 *     responses:
 *       201:
 *         description: User successfully registered
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
 *                   example: Registration successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request (validation error or email already exists)
 *       500:
 *         description: Internal server error
 */
export const registerController = catchAsync(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = registerSchema.parse(req);
  
  // Register user
  const user = await register(validatedData.body);

  // Send response
  res.status(HTTP_STATUS.CREATED).json({
    status: 'success',
    message: 'Registration successful',
    data: user,
  });
}); 