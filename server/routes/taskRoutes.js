import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { smartCache, invalidateCache } from '../middleware/cacheMiddleware.js';
import {
  createTask,
  getNearbyTasks,
  getTaskById,
  getMyPostedTasks,
  getMyBiddedTasks,
  updateTaskStatus,
  deleteTask
} from '../controllers/taskController.js';

const router = express.Router();

/**
 * @route   POST /api/v1/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post(
  '/', 
  authenticateToken, 
  validate(schemas.createTask), 
  invalidateCache(['tasks:*', 'route:/api/v1/tasks/*']),
  asyncHandler(createTask)
);

/**
 * @route   GET /api/v1/tasks/nearby
 * @desc    Get tasks near user location
 * @access  Public (optional auth for personalization)
 */
router.get(
  '/nearby', 
  optionalAuth, 
  validate(schemas.nearbyTasks),
  smartCache({ 
    ttl: 10, // 10 seconds for location-based data
    keyGenerator: (req) => {
      const { latitude, longitude, radius, category } = req.query;
      const lat = parseFloat(latitude).toFixed(3);
      const lng = parseFloat(longitude).toFixed(3);
      return `route:nearby:${lat}:${lng}:${radius || 'all'}:${category || 'all'}`;
    }
  }),
  asyncHandler(getNearbyTasks)
);

/**
 * @route   GET /api/v1/tasks/my-posted
 * @desc    Get tasks posted by current user
 * @access  Private
 */
router.get(
  '/my-posted', 
  authenticateToken,
  smartCache({
    ttl: 30,
    keyGenerator: (req) => `route:tasks:posted:${req.user.id}`
  }),
  asyncHandler(getMyPostedTasks)
);

/**
 * @route   GET /api/v1/tasks/my-bidded
 * @desc    Get tasks where user has placed bids
 * @access  Private
 */
router.get(
  '/my-bidded', 
  authenticateToken,
  smartCache({
    ttl: 30,
    keyGenerator: (req) => `route:tasks:bidded:${req.user.id}`
  }),
  asyncHandler(getMyBiddedTasks)
);

/**
 * @route   GET /api/v1/tasks/:id
 * @desc    Get task by ID
 * @access  Public
 */
router.get(
  '/:id', 
  validate(schemas.idParam),
  smartCache({
    ttl: 30,
    keyGenerator: (req) => `route:task:${req.params.id}`
  }),
  asyncHandler(getTaskById)
);

/**
 * @route   PATCH /api/v1/tasks/:id/status
 * @desc    Update task status
 * @access  Private (poster only)
 */
router.patch(
  '/:id/status',
  authenticateToken,
  validate({ ...schemas.idParam, ...schemas.updateTaskStatus }),
  invalidateCache(['tasks:*', 'route:/api/v1/tasks/*']),
  asyncHandler(updateTaskStatus)
);

/**
 * @route   DELETE /api/v1/tasks/:id
 * @desc    Delete a task
 * @access  Private (poster only)
 */
router.delete(
  '/:id', 
  authenticateToken, 
  validate(schemas.idParam),
  invalidateCache(['tasks:*', 'route:/api/v1/tasks/*']),
  asyncHandler(deleteTask)
);

export default router;
