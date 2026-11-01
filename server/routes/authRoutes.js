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
} from '../controllers/authController.js';

const router = express.Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', validate(schemas.register), asyncHandler(register));

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(schemas.login), asyncHandler(login));

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
