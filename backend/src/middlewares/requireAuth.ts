import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@/utils/db';
import { AppError } from '@/helpers/error';
import { HTTP_STATUS } from '@/constants';
import { generateTokens } from '@/utils/generators/generateTokens';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      tokens?: {
        accessToken: string;
        refreshToken: string;
      };
    }
  }
}

interface TokenPayload {
  userId: string;
  type: 'access' | 'refresh';
  exp?: number;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

const getTokens = (req: Request) => {
    // Access Token: Try multiple sources
  const accessToken =
    // 1. Check HTTP Only cookies (Web Apps)
    req.cookies?.accessToken ||
    // 2. Check Authorization header with Bearer (Standard way - Mobile/Web APIs)
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null) ||
    // 3. Check custom header (Mobile Apps)
    req.headers['x-access-token'] as string ||
    // 4. Check query parameter (Special cases like WebSocket connections)
    req.query.access_token as string;

  // Refresh Token: Try multiple sources
  const refreshToken =
    // 1. Check HTTP Only cookies (Web Apps)
    req.cookies?.refreshToken ||
    // 2. Check custom header (Mobile Apps)
    req.headers['x-refresh-token'] as string ||
    // 3. Check Authorization-Refresh header (Alternative for mobile)
    (typeof req.headers['authorization-refresh'] === 'string' && req.headers['authorization-refresh'].startsWith('Bearer ')
      ? req.headers['authorization-refresh'].split(' ')[1]
      : null) ||
    // 4. Check body for refresh token (POST requests)
    (req.method === 'POST' ? req.body?.refresh_token : null);

  // Basic validation
  const validateToken = (token: string | null): string | null => {
    if (!token) return null;
    // Check if token is a valid JWT format
    const jwtRegex = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
    return jwtRegex.test(token) ? token : null;
  };

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Token sources:', {
      cookies: !!req.cookies?.accessToken,
      authHeader: !!req.headers.authorization,
      customHeader: !!req.headers['x-access-token'],
      query: !!req.query.access_token
    });
  }

  return {
    accessToken: validateToken(accessToken),
    refreshToken: validateToken(refreshToken)
  };
};



const verifyToken = (token: string, type: 'access' | 'refresh'): TokenPayload => {
  const secret = type === 'access' 
    ? process.env.JWT_ACCESS_SECRET! 
    : process.env.JWT_REFRESH_SECRET!;
  
  return jwt.verify(token, secret) as TokenPayload;
};

const removeAllUserSessions = async (userId: string) => {
  // First verify if any sessions exist
  const sessions = await prisma.session.findMany({
    where: { userId },
    select: { id: true }
  });

  if (sessions.length > 0) {
    await prisma.$transaction([
      // Remove all refresh tokens
      prisma.refreshToken.deleteMany({
        where: { 
          session: {
            userId
          }
        }
      }),
      // Remove all sessions
      prisma.session.deleteMany({
        where: { userId }
      })
    ]);
  }
};

const updateSessionTokens = async (
  userId: string, 
  oldRefreshToken: string, 
  newTokens: { accessToken: string; refreshToken: string }
) => {
  const currentSession = await prisma.session.findFirst({
    where: {
      userId,
      refreshToken: {
        token: oldRefreshToken
      }
    },
    include: {
      refreshToken: true
    }
  });

  if (!currentSession || !currentSession.refreshToken) {
    throw new AppError('Session not found', HTTP_STATUS.UNAUTHORIZED);
  }

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: currentSession.refreshToken.id },
      data: { token: newTokens.refreshToken }
    }),
    prisma.session.update({
      where: { id: currentSession.id },
      data: {
        lastUsed: new Date(),
      }
    })
  ]);
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accessToken, refreshToken } = getTokens(req);

    if (!accessToken || !refreshToken) {
      throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    // Verify refresh token first
    let refreshPayload: TokenPayload;
    try {
      refreshPayload = verifyToken(refreshToken, 'refresh');
    } catch (error) {
      throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    }

    // Verify access token
    let accessPayload: TokenPayload;
    let needsNewTokens = false;

    try {
      accessPayload = verifyToken(accessToken, 'access');
      
      // Check if access token needs renewal (expires in 5 minutes or less)
      const expiryTime = accessPayload.exp! * 1000;
      const fiveMinutes = 5 * 60 * 1000;
      
      if (expiryTime - Date.now() <= fiveMinutes) {
        needsNewTokens = true;
      }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        // Access token is expired but refresh token is valid
        needsNewTokens = true;
        accessPayload = jwt.decode(accessToken) as TokenPayload;
      } else {
        // Access token is invalid
        throw new AppError('Invalid access token', HTTP_STATUS.UNAUTHORIZED);
      }
    }

    // Verify tokens belong to same user
    if (accessPayload.userId !== refreshPayload.userId) {
      // Remove all sessions and tokens before throwing the error
      await removeAllUserSessions(refreshPayload.userId);
      // Also clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      
      throw new AppError(
        'Security violation detected. All sessions have been terminated.', 
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: refreshPayload.userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.UNAUTHORIZED);
    }

    if (needsNewTokens) {
      // Generate new tokens
      const newTokens = generateTokens(user.id);
      
      // Update session and refresh token in database
      await updateSessionTokens(user.id, refreshToken, newTokens);

      // Set new cookies for web clients
      res.cookie('accessToken', newTokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
      
      res.cookie('refreshToken', newTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Add tokens to request for potential use in routes
      req.tokens = newTokens;

      // Set header to notify client about token renewal
      res.setHeader('X-Token-Renewed', 'true');

      // Attach tokens to response locals for use in subsequent middleware or routes
      res.locals.tokens = {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        tokenType: 'Bearer',
        expiresIn: 15 * 60, // 15 minutes in seconds
      } as TokenResponse;
    }

    // Add user to request
    req.user = user;

    // Modify the response to include tokens if they were renewed
    const originalJson = res.json;
    res.json = function (body: any) {
      if (res.locals.tokens) {
        // If the response is already an object, add tokens to it
        if (typeof body === 'object' && body !== null) {
          return originalJson.call(this, {
            ...body,
            tokens: res.locals.tokens,
          });
        }
        // If the response is something else, wrap it
        return originalJson.call(this, {
          data: body,
          tokens: res.locals.tokens,
        });
      }
      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    // Clear cookies on any authorization error
    if (error instanceof AppError && error.statusCode === HTTP_STATUS.UNAUTHORIZED) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
    }
    next(error);
  }
}; 