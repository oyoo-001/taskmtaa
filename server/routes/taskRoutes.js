import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
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
router.post('/', authenticateToken, validate(schemas.createTask), asyncHandler(createTask));

/**
 * @route   GET /api/v1/tasks/nearby
 * @desc    Get tasks near user location
 * @access  Public (optional auth for personalization)
 */
router.get('/nearby', optionalAuth, validate(schemas.nearbyTasks), asyncHandler(getNearbyTasks));

/**
 * @route   GET /api/v1/tasks/my-posted
 * @desc    Get tasks posted by current user
 * @access  Private
 */
router.get('/my-posted', authenticateToken, asyncHandler(getMyPostedTasks));

/**
 * @route   GET /api/v1/tasks/my-bidded
 * @desc    Get tasks where user has placed bids
 * @access  Private
 */
router.get('/my-bidded', authenticateToken, asyncHandler(getMyBiddedTasks));

/**
 * @route   GET /api/v1/tasks/:id
 * @desc    Get task by ID
 * @access  Public
 */
router.get('/:id', validate(schemas.idParam), asyncHandler(getTaskById));

/**
 * @route   PATCH /api/v1/tasks/:id/status
 * @desc    Update task status
 * @access  Private (poster only)
 */
router.patch(
  '/:id/status',
  authenticateToken,
  validate({ ...schemas.idParam, ...schemas.updateTaskStatus }),
  asyncHandler(updateTaskStatus)
);

/**
 * @route   DELETE /api/v1/tasks/:id
 * @desc    Delete a task
 * @access  Private (poster only)
 */
router.delete('/:id', authenticateToken, validate(schemas.idParam), asyncHandler(deleteTask));

export default router;
