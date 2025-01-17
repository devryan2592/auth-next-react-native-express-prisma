import { Request, Response } from 'express';
import { catchAsync } from '@/helpers/catchAsync';
import { HTTP_STATUS } from '@/constants';
import { loginWithout2FA, initiate2FALogin, completeLoginWith2FA } from './service';
import { LoginInput, TwoFactorLoginInput } from './schema';
import uap, {UAParser} from 'ua-parser-js';


// Function to check if the user agent is mobile
const isMobile = (userAgent: string) => {
  const uaParser = new UAParser(userAgent);
  return uaParser.getDevice(). === 'mobile';
};

/**
 * Handle login request
 */
export const handleLogin = catchAsync(async (req: Request, res: Response) => {
  const data = req.body as LoginInput;
  const uaParser = UAParser(req.headers['user-agent']).
  const isMobile = req.headers['x-client-type'] === 'mobile';
  const existingRefreshToken = req.cookies?.refreshToken;

  try {
    const result = await loginWithout2FA(
      data,
      req.ip,
      uaParser.getResult(),
      existingRefreshToken
    );

    // For web clients, set refresh token in HTTP-only cookie
    if (!isMobile) {
      res.cookie('refreshToken', result.session.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Don't send refresh token in response for web
      const { refreshToken, ...sessionWithoutRefresh } = result.session;
      return res.status(HTTP_STATUS.OK).json({
        user: result.user,
        session: sessionWithoutRefresh,
      });
    }

    // For mobile, send both tokens in response body
    return res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    // If 2FA is required, initiate 2FA flow
    if (error.message === '2FA is required for this account') {
      const twoFactorResponse = await initiate2FALogin(data);
      return res.status(HTTP_STATUS.OK).json(twoFactorResponse);
    }
    throw error;
  }
});

/**
 * Handle 2FA verification
 */
export const handleTwoFactorVerification = catchAsync(async (req: Request, res: Response) => {
  const data = req.body as TwoFactorLoginInput;
  const uaParser = new UAParser(req.headers['user-agent']);
  const isMobile = req.headers['x-client-type'] === 'mobile';
  const existingRefreshToken = req.cookies?.refreshToken;

  const result = await completeLoginWith2FA(
    data,
    req.ip,
    uaParser.getResult(),
    existingRefreshToken
  );

  // For web clients, set refresh token in HTTP-only cookie
  if (!isMobile) {
    res.cookie('refreshToken', result.session.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Don't send refresh token in response for web
    const { refreshToken, ...sessionWithoutRefresh } = result.session;
    return res.status(HTTP_STATUS.OK).json({
      user: result.user,
      session: sessionWithoutRefresh,
    });
  }

  // For mobile, send both tokens in response body
  return res.status(HTTP_STATUS.OK).json(result);
});
