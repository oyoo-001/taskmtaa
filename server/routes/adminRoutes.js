import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  getAdminStats,
  listUsers,
  getUserDetail,
  verifyUser,
  suspendUser,
  deleteUser,
  toggleFeaturedUser,
  listTasks,
  deleteTask,
  listGigs,
  deleteGig,
  listReviews,
  deleteReview,
  listMessages,
  deleteMessage,
  listRatings,
  listAuditLogs
} from '../controllers/adminController.js';

const router = express.Router();

// Every admin endpoint requires a valid, non-suspended account with admin rights.
router.use(authenticateToken, requireAdmin);

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Platform-wide counts for the admin dashboard
 * @access  Admin
 */
router.get('/stats', asyncHandler(getAdminStats));

/**
 * @route   GET /api/v1/admin/users
 * @desc    List all users with ratings and moderation state
 * @access  Admin
 */
router.get('/users', asyncHandler(listUsers));

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Get one user with their tasks and reviews
 * @access  Admin
 */
router.get('/users/:id', asyncHandler(getUserDetail));

/**
 * @route   PATCH /api/v1/admin/users/:id/verify
 * @desc    Grant or remove a user's verification badge
 * @access  Admin
 */
router.patch('/users/:id/verify', asyncHandler(verifyUser));

/**
 * @route   PATCH /api/v1/admin/users/:id/suspend
 * @desc    Suspend or reinstate a user
 * @access  Admin
 */
router.patch('/users/:id/suspend', asyncHandler(suspendUser));

/**
 * @route   PATCH /api/v1/admin/users/:id/featured
 * @desc    Mark or unmark a user as featured
 * @access  Admin
 */
router.patch('/users/:id/featured', asyncHandler(toggleFeaturedUser));

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Permanently delete a user (admins excluded)
 * @access  Admin
 */
router.delete('/users/:id', asyncHandler(deleteUser));

/**
 * @route   GET /api/v1/admin/tasks
 * @desc    List every posted job
 * @access  Admin
 */
router.get('/tasks', asyncHandler(listTasks));

/**
 * @route   DELETE /api/v1/admin/tasks/:id
 * @desc    Delete any job posting
 * @access  Admin
 */
router.delete('/tasks/:id', asyncHandler(deleteTask));

/**
 * @route   GET /api/v1/admin/gigs
 * @desc    List every gig
 * @access  Admin
 */
router.get('/gigs', asyncHandler(listGigs));

/**
 * @route   DELETE /api/v1/admin/gigs/:id
 * @desc    Delete any gig
 * @access  Admin
 */
router.delete('/gigs/:id', asyncHandler(deleteGig));

/**
 * @route   GET /api/v1/admin/feedback/reviews
 * @desc    List ratings and written feedback
 * @access  Admin
 */
router.get('/feedback/reviews', asyncHandler(listReviews));

/**
 * @route   DELETE /api/v1/admin/feedback/reviews/:id
 * @desc    Remove a review
 * @access  Admin
 */
router.delete('/feedback/reviews/:id', asyncHandler(deleteReview));

/**
 * @route   GET /api/v1/admin/feedback/messages
 * @desc    List chat messages across the platform
 * @access  Admin
 */
router.get('/feedback/messages', asyncHandler(listMessages));

/**
 * @route   DELETE /api/v1/admin/feedback/messages/:id
 * @desc    Remove a chat message
 * @access  Admin
 */
router.delete('/feedback/messages/:id', asyncHandler(deleteMessage));

/**
 * @route   GET /api/v1/admin/ratings
 * @desc    Rating summary and distribution per user
 * @access  Admin
 */
router.get('/ratings', asyncHandler(listRatings));

/**
 * @route   GET /api/v1/admin/audit-logs
 * @desc    Admin action history
 * @access  Admin
 */
router.get('/audit-logs', asyncHandler(listAuditLogs));

export default router;
