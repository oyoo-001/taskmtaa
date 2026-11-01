import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, schemas } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import {
  sendMessage,
  getTaskMessages,
  getUnreadCount,
  getConversations
} from '../controllers/chatController.js';

const router = express.Router();

/**
 * @route   POST /api/v1/chat/task/:id/message
 * @desc    Send a message in task chat
 * @access  Private
 */
router.post(
  '/task/:id/message',
  authenticateToken,
  validate({ ...schemas.idParam, ...schemas.sendMessage }),
  asyncHandler(sendMessage)
);

/**
 * @route   GET /api/v1/chat/task/:id/messages
 * @desc    Get messages for a task
 * @access  Private
 */
router.get('/task/:id/messages', authenticateToken, validate(schemas.idParam), asyncHandler(getTaskMessages));

/**
 * @route   GET /api/v1/chat/unread-count
 * @desc    Get unread message count
 * @access  Private
 */
router.get('/unread-count', authenticateToken, asyncHandler(getUnreadCount));

/**
 * @route   GET /api/v1/chat/conversations
 * @desc    Get all user conversations
 * @access  Private
 */
router.get('/conversations', authenticateToken, asyncHandler(getConversations));

export default router;
