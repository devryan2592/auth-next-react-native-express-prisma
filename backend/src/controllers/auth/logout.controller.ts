import { Request, Response } from 'express';
import { prisma } from '@/utils/db';
import { catchAsync } from '@/helpers/catchAsync';
import { AppError } from '@/helpers/error';
import { HTTP_STATUS } from '@/constants';
import jwt from 'jsonwebtoken';

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout from current session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out from current session
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
 *                   example: Logged out successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
export const logout = catchAsync(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
  }

  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
    sessionId: string;
  };

  // Delete the session and its refresh token
  await prisma.session.delete({
    where: { id: decoded.sessionId },
  });

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout from all sessions
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out from all sessions
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
 *                   example: Logged out from all sessions successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
export const logoutAll = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not found', HTTP_STATUS.UNAUTHORIZED);
  }

  // Delete all sessions for the user
  await prisma.session.deleteMany({
    where: { userId },
  });

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'Logged out from all sessions successfully',
  });
});

/**
 * @swagger
 * /auth/sessions:
 *   get:
 *     summary: Get all active sessions for the user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all active sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           ipAddress:
 *                             type: string
 *                           userAgent:
 *                             type: string
 *                           deviceType:
 *                             type: string
 *                           deviceName:
 *                             type: string
 *                           browser:
 *                             type: string
 *                           os:
 *                             type: string
 *                           lastUsed:
 *                             type: string
 *                             format: date-time
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
export const getSessions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not found', HTTP_STATUS.UNAUTHORIZED);
  }

  const sessions = await prisma.session.findMany({
    where: { userId },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      deviceType: true,
      deviceName: true,
      browser: true,
      os: true,
      lastUsed: true,
      createdAt: true,
    },
  });

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    data: { sessions },
  });
});

/**
 * @swagger
 * /auth/logout/{sessionId}:
 *   post:
 *     summary: Logout from a specific session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the session to logout from
 *     responses:
 *       200:
 *         description: Successfully logged out from the specified session
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
 *                   example: Session terminated successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Session not found or unauthorized to access this session
 */
export const logoutSession = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { sessionId } = req.params;

  if (!userId) {
    throw new AppError('User not found', HTTP_STATUS.UNAUTHORIZED);
  }

  // Verify the session belongs to the user
  const session = await prisma.session.findFirst({
    where: { 
      id: sessionId,
      userId,
    },
  });

  if (!session) {
    throw new AppError('Session not found or unauthorized', HTTP_STATUS.NOT_FOUND);
  }

  // Delete the specific session
  await prisma.session.delete({
    where: { id: sessionId },
  });

  res.status(HTTP_STATUS.OK).json({
    status: 'success',
    message: 'Session terminated successfully',
  });
}); 