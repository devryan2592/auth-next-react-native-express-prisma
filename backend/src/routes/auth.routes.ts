import { Router } from 'express';
import {
  registerController,
  verifyEmailController,
  resendVerificationController,
  handleLogin,
  handleTwoFactorVerification,
  requestPasswordResetController,
  resetPasswordController,
  changePasswordController,
  // enable2FAController,
  // confirm2FAController,
  // disable2FAController,
  // verify2FAController,
  logout,
  logoutAll,
  logoutSession,
  getSessions,
} from '@/controllers/auth';
import { resendVerificationLimiter, loginRateLimiter } from '@/utils/limiters';
import { requireAuth } from '@/middlewares/requireAuth';

const router = Router();

// Registration and login routes
router.post('/register', registerController);
router.post('/verify-email/:userId/:token', verifyEmailController);
router.post('/resend-verification', resendVerificationLimiter, resendVerificationController);
router.post('/login', loginRateLimiter, handleLogin);
router.post('/2fa/verify', handleTwoFactorVerification);

// Password management routes
router.post('/request-password-reset', resendVerificationLimiter, requestPasswordResetController);
router.post('/reset-password', resetPasswordController);
router.post('/change-password', requireAuth, changePasswordController);

// Two-factor authentication routes
// router.post('/2fa/enable', requireAuth, enable2FAController);
// router.post('/2fa/confirm', requireAuth, confirm2FAController);
// router.post('/2fa/disable', requireAuth, disable2FAController);

// Session management routes
router.post('/logout', requireAuth, logout);
router.post('/logout-all', requireAuth, logoutAll);
router.post('/logout/:sessionId', requireAuth, logoutSession);
router.get('/sessions', requireAuth, getSessions);

export default router;
