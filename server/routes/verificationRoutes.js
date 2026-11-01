import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  sendPhoneVerification,
  verifyPhone,
  sendEmailVerificationLink,
  verifyEmail,
  setup2FA,
  enable2FA,
  disable2FA,
  verify2FA,
} from '../controllers/verificationController.js';

const router = express.Router();

// Phone verification
router.post('/phone/send', authenticateToken, sendPhoneVerification);
router.post('/phone/verify', authenticateToken, verifyPhone);

// Email verification
router.post('/email/send', authenticateToken, sendEmailVerificationLink);
router.get('/email/verify', verifyEmail); // Query param: ?token=xxx

// 2FA
router.post('/2fa/setup', authenticateToken, setup2FA);
router.post('/2fa/enable', authenticateToken, enable2FA);
router.post('/2fa/disable', authenticateToken, disable2FA);
router.post('/2fa/verify', verify2FA); // Used during login

export default router;
