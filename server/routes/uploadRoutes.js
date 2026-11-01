import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadGigImages as uploadGigImagesMiddleware } from '../middleware/upload.js';
import { uploadGigImages } from '../controllers/uploadController.js';

const router = express.Router();

/**
 * @route   POST /api/v1/uploads/gig-images
 * @desc    Upload gig gallery images to Cloudinary
 * @access  Private
 */
router.post(
  '/gig-images',
  authenticateToken,
  uploadGigImagesMiddleware,
  asyncHandler(uploadGigImages)
);

export default router;
