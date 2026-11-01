import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';
import { getFeaturedUsers, getPublicProfile } from '../controllers/userController.js';

const router = express.Router();

router.get('/featured', asyncHandler(getFeaturedUsers));

/**
 * @route   GET /api/v1/users/:id
 * @desc    Public seller/tasker profile
 * @access  Public
 */
router.get('/:id', validate(schemas.idParam), asyncHandler(getPublicProfile));

export default router;
