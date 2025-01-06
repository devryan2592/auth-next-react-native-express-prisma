import jwt from 'jsonwebtoken';
import { AUTH } from '@/constants';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access and refresh tokens
 */
export function generateTokens(userId: string): TokenResponse {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_TOKEN_SECRET!,
    { expiresIn: AUTH.TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_TOKEN_SECRET!,
    { expiresIn: AUTH.REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
} 