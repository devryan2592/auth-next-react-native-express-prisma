import 'dotenv/config';

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  MESSAGE: 'Too many requests from this IP, please try again later',
} as const;

export const AUTH = {
  TOKEN_EXPIRY: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  COOKIE_EXPIRY: Number(process.env.COOKIE_EXPIRY) || 7 * 24 * 60 * 60 * 1000,
} as const;

export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  CURRENT: process.env.NODE_ENV || 'development',
} as const;

export const CLIENT_URLS = {
  DEVELOPMENT: {
    NEXT: process.env.CLIENT_URL || 'http://localhost:3000',
    EXPO: process.env.EXPO_URL || 'http://localhost:19006',
    EXPO_ALTERNATIVE: 'exp://localhost:19006',
    VITE: process.env.VITE_URL || 'http://localhost:5173',
  },
  PRODUCTION: {
    CLIENT: process.env.PRODUCTION_CLIENT_URL,
    API: process.env.PRODUCTION_API_URL,
  },
} as const; 