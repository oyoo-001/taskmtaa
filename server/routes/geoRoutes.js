import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getIpLocation } from '../controllers/geoController.js';

const router = express.Router();

/**
 * @route   GET /api/v1/geo/ip-location
 * @desc    Approximate location from the caller's IP address (GPS fallback)
 * @access  Public
 */
router.get('/ip-location', asyncHandler(getIpLocation));

export default router;
