import { Request, Response } from 'express';
import { AuthService } from '@/services/auth.service';
import { catchAsync } from '@/helpers/catchAsync';
import { registerSchema } from '@/utils/validators/auth.validator';
import { HTTP_STATUS } from '@/constants';

export const register = catchAsync(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = registerSchema.parse(req);
  
  // Register user
  const user = await AuthService.register(validatedData.body);

  // Send response
  res.status(HTTP_STATUS.CREATED).json({
    status: 'success',
    message: 'Registration successful',
    data: user,
  });
}); 