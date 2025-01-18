import { Request, Response } from 'express';
import { catchAsync } from '@/helpers/catchAsync';
import { HTTP_STATUS } from '@/constants';
import { loginWithout2FA, initiate2FALogin, completeLoginWith2FA } from './service';
import { LoginInput, TwoFactorLoginInput } from './schema';
import {UAParser} from 'ua-parser-js';
import ip from 'ip';

// Function to check if the user agent is mobile
const isDevice = async (userAgent: string) => {
  const uaParser = new UAParser(userAgent);

  const device = await uaParser.getDevice().withFeatureCheck()
  const isDevice = device.type === 'mobile' || device.type === 'tablet' || device.type === 'smarttv' || device.type === 'wearable' || device.type === 'console' || device.type === 'embedded' || device.type === 'xr'

  return isDevice;
};

/**
 * Handle login request
 */
export const handleLogin = catchAsync(async (req: Request, res: Response) => {
  const data = req.body as LoginInput;

const ipAddress = ip.address();

  const uaParser = UAParser(req.headers['user-agent'])
  const isMobile = await isDevice(req.headers['user-agent'] || '');
  const existingRefreshToken = req.cookies?.refreshToken;

  try {
    const result = await loginWithout2FA(
      data,
      ipAddress,
      uaParser,
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

      res.cookie("accessToken", result.session.accessToken, {
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
      return res.status(HTTP_STATUS.OK).json({
        status: "pending",
        ...twoFactorResponse,
      });
    }
    throw error;
  }
});

/**
 * Handle 2FA verification
 */
export const handleTwoFactorVerification = catchAsync(async (req: Request, res: Response) => {
  const data = req.body as TwoFactorLoginInput;


  const ipAddress = ip.address();


  const uaParser = UAParser(req.headers['user-agent']);
  const isMobile = await isDevice(req.headers['user-agent'] || '');
  const existingRefreshToken = req.cookies?.refreshToken;

  const result = await completeLoginWith2FA(
    data,
    ipAddress,
    uaParser,
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

    res.cookie("accessToken", result.session.accessToken, {
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
