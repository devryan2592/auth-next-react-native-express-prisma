import { Router } from 'express';
import { register, verifyEmail, resendVerificationEmail, login } from '@/controllers/auth';
import { resendVerificationLimiter, loginRateLimiter } from '@/utils/limiters';


const router = Router();

router.post('/register', register);
router.post('/verify-email/:userId/:token', verifyEmail);
router.post('/resend-verification', resendVerificationLimiter, resendVerificationEmail);
router.post('/login', loginRateLimiter, login);

export default router;
