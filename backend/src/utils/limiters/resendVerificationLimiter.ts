import rateLimit from "express-rate-limit";

// Rate limit: 5 requests per hour
export const resendVerificationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: {
      status: 'error',
      message: 'Too many verification requests. Please try again in an hour.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });