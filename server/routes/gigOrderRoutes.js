import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  createGigOrder,
  getMyGigOrders,
  getReceivedGigOrders,
  updateGigOrderStatus,
} from '../controllers/gigOrderController.js';

const router = express.Router();

/**
 * @route   POST /api/v1/gig-orders
 * @desc    Request a gig
 * @access  Private
 */
router.post('/', authenticateToken, validate(schemas.createGigOrder), asyncHandler(createGigOrder));

/**
 * @route   GET /api/v1/gig-orders/mine
 * @desc    Orders placed by the signed-in buyer
 * @access  Private
 */
router.get('/mine', authenticateToken, asyncHandler(getMyGigOrders));

/**
 * @route   GET /api/v1/gig-orders/received
 * @desc    Orders received by the signed-in seller
 * @access  Private
 */
router.get('/received', authenticateToken, asyncHandler(getReceivedGigOrders));

/**
 * @route   PATCH /api/v1/gig-orders/:id/status
 * @desc    Accept, decline, complete, or cancel an order
 * @access  Private (seller or buyer)
 */
router.patch(
  '/:id/status',
  authenticateToken,
  validate({ ...schemas.idParam, ...schemas.updateGigOrderStatus }),
  asyncHandler(updateGigOrderStatus)
);

export default router;
