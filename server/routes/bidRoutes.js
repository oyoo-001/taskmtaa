import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  placeBid,
  getTaskBids,
  acceptBid,
  rejectBid,
  getMyBids,
  completeBid,
  rateBid
} from '../controllers/bidController.js';

const router = express.Router();

/**
 * @route   POST /api/v1/bids/task/:id
 * @desc    Place a bid on a task
 * @access  Private
 */
router.post(
  '/task/:id',
  authenticateToken,
  validate({ ...schemas.idParam, ...schemas.createBid }),
  asyncHandler(placeBid)
);

/**
 * @route   GET /api/v1/bids/task/:id
 * @desc    Get all bids for a task (poster only)
 * @access  Private
 */
router.get('/task/:id', authenticateToken, validate(schemas.idParam), asyncHandler(getTaskBids));

/**
 * @route   PATCH /api/v1/bids/:id/accept
 * @desc    Accept a bid
 * @access  Private (poster only)
 */
router.patch('/:id/accept', authenticateToken, validate(schemas.idParam), asyncHandler(acceptBid));

/**
 * @route   PATCH /api/v1/bids/:id/reject
 * @desc    Reject a bid
 * @access  Private (poster only)
 */
router.patch('/:id/reject', authenticateToken, validate(schemas.idParam), asyncHandler(rejectBid));

/**
 * @route   PATCH /api/v1/bids/:id/complete
 * @desc    Mark bid as completed
 * @access  Private (poster only)
 */
router.patch('/:id/complete', authenticateToken, validate(schemas.idParam), asyncHandler(completeBid));

/**
 * @route   POST /api/v1/bids/:id/rate
 * @desc    Rate a tasker after bid completion
 * @access  Private (poster only)
 */
router.post('/:id/rate', authenticateToken, validate(schemas.idParam), asyncHandler(rateBid));

/**
 * @route   GET /api/v1/bids/my-bids
 * @desc    Get current user's bids
 * @access  Private
 */
router.get('/my-bids', authenticateToken, asyncHandler(getMyBids));

export default router;
