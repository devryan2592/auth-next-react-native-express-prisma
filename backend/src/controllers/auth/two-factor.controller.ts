import { Request, Response } from 'express';
import { TwoFactorService } from '@/services/two-factor.service';
import { catchAsync } from '@/helpers/catchAsync';
import { twoFactorSchema } from '@/utils/validators/auth.validator';

export const enable2FAController = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  await TwoFactorService.enable2FA(userId);
  
  return res.status(200).json({
    status: 'success',
    message: 'Verification code sent to your email',
  });
});

export const confirm2FAController = catchAsync(async (req: Request, res: Response) => {
  const validatedData = twoFactorSchema.parse(req);
  const userId = req.user!.id;
  const { code } = validatedData.body;

  await TwoFactorService.confirmEnable2FA(userId, code);
  
  return res.status(200).json({
    status: 'success',
    message: '2FA enabled successfully',
  });
});

export const disable2FAController = catchAsync(async (req: Request, res: Response) => {

    
  const userId = req.user!.id;
  await TwoFactorService.disable2FA(userId);
  
  return res.status(200).json({
    status: 'success',
    message: '2FA disabled successfully',
  });
});

export const verify2FAController = catchAsync(async (req: Request, res: Response) => {
  const validatedData = twoFactorSchema.parse(req);
  const userId = req.user!.id;
  const {  code } = validatedData.body;
  
  await TwoFactorService.verifyCode(userId, code, 'LOGIN');
  
  return res.status(200).json({
    status: 'success',
    message: '2FA code verified successfully',
  });
}); 