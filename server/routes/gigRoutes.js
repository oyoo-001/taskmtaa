import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import {
  getGigs,
  getMyGigs,
  getGigById,
  createGig,
  updateGig,
  deleteGig,
} from '../controllers/gigController.js';

const router = express.Router();

/**
 * @route   GET /api/v1/gigs
 * @desc    Browse active gigs
 * @access  Public
 */
router.get('/', optionalAuth, validate(schemas.listGigs), asyncHandler(getGigs));

/**
 * @route   GET /api/v1/gigs/mine
 * @desc    Gigs owned by the signed-in user
 * @access  Private
 */
router.get('/mine', authenticateToken, asyncHandler(getMyGigs));

/**
 * @route   POST /api/v1/gigs
 * @desc    Publish a gig
 * @access  Private
 */
router.post('/', authenticateToken, validate(schemas.createGig), asyncHandler(createGig));

/**
 * @route   GET /api/v1/gigs/:id
 * @desc    Gig detail with seller profile and reviews
 * @access  Public (owners can view paused gigs)
 */
router.get('/:id', optionalAuth, validate(schemas.idParam), asyncHandler(getGigById));

/**
 * @route   PATCH /api/v1/gigs/:id
 * @desc    Update or pause/activate a gig
 * @access  Private (owner)
 */
router.patch(
  '/:id',
  authenticateToken,
  validate({ ...schemas.idParam, ...schemas.updateGig }),
  asyncHandler(updateGig)
);

/**
 * @route   DELETE /api/v1/gigs/:id
 * @desc    Delete a gig
 * @access  Private (owner)
 */
router.delete('/:id', authenticateToken, validate(schemas.idParam), asyncHandler(deleteGig));

export default router;
