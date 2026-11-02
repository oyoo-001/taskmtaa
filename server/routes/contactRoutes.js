import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { submitContactForm } from '../controllers/contactController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiter for contact form (prevent spam)
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 submissions per hour per IP
  message: 'Too many contact form submissions. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/v1/contact/submit
 * @desc    Submit contact form
 * @access  Public
 */
router.post('/submit', contactLimiter, asyncHandler(submitContactForm));

export default router;
