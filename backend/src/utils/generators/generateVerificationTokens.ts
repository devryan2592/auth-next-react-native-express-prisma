import crypto from 'crypto';

/**
 * Generate verification token and expiry
 */
export function generateVerificationToken() {
    return {
      token: crypto.randomBytes(32).toString('hex'),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }