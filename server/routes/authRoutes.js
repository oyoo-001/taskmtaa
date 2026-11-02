import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadAvatar as uploadAvatarMiddleware } from '../middleware/upload.js';
import {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  uploadAvatar,
  forgotPassword,
  resetPassword,
  changePassword,
  setup2FA,
  verify2FA,
  disable2FA,
  get2FAStatus,
} from '../controllers/authController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiters for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per window
  message: 'Too many password reset requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', authLimiter, validate(schemas.register), asyncHandler(register));

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, validate(schemas.login), asyncHandler(login));

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (clear cookies)
 * @access  Private
 */
router.post('/logout', authenticateToken, asyncHandler(logout));

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', asyncHandler(refreshToken));

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password', passwordResetLimiter, asyncHandler(forgotPassword));

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', authLimiter, asyncHandler(resetPassword));

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password (authenticated user)
 * @access  Private
 */
router.post('/change-password', authenticateToken, asyncHandler(changePassword));

/**
 * @route   POST /api/v1/auth/2fa/setup
 * @desc    Setup 2FA - Generate QR code
 * @access  Private
 */
router.post('/2fa/setup', authenticateToken, asyncHandler(setup2FA));

/**
 * @route   POST /api/v1/auth/2fa/verify
 * @desc    Verify and enable 2FA
 * @access  Private
 */
router.post('/2fa/verify', authenticateToken, asyncHandler(verify2FA));

/**
 * @route   POST /api/v1/auth/2fa/disable
 * @desc    Disable 2FA
 * @access  Private
 */
router.post('/2fa/disable', authenticateToken, asyncHandler(disable2FA));

/**
 * @route   GET /api/v1/auth/2fa/status
 * @desc    Get 2FA status
 * @access  Private
 */
router.get('/2fa/status', authenticateToken, asyncHandler(get2FAStatus));

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticateToken, asyncHandler(getProfile));

/**
 * @route   PATCH /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/profile', authenticateToken, asyncHandler(updateProfile));

/**
 * @route   POST /api/v1/auth/upload-avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post('/upload-avatar', authenticateToken, uploadAvatarMiddleware, asyncHandler(uploadAvatar));

export default router;
