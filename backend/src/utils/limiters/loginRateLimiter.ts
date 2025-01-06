import rateLimit from "express-rate-limit";

// Rate limit: 5 attempts per 15 minutes
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
      status: 'error',
      message: 'Too many login attempts. Please try again in 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });