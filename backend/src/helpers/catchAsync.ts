import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an async route handler with express-async-handler for consistent error handling
 * @param fn Async route handler function
 * @returns Express middleware function with error handling
 */
export const catchAsync = (fn: AsyncRequestHandler) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    return await fn(req, res, next);
  });
};

/**
 * Usage Example:
 * 
 * const handler = catchAsync(async (req: Request, res: Response) => {
 *   const data = await someAsyncOperation();
 *   res.json(data);
 * });
 * 
 * router.get('/path', handler);
 */
