import rateLimit from 'express-rate-limit';
import { RATE_LIMIT, HTTP_STATUS } from '@/constants';

export const rateLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: {
    status: 'error',
    message: RATE_LIMIT.MESSAGE,
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
}); 