import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getBuyerAnalytics,
  getTaskerAnalytics,
  getPlatformAnalytics,
} from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/buyer', authenticateToken, getBuyerAnalytics);
router.get('/tasker', authenticateToken, getTaskerAnalytics);
router.get('/platform', getPlatformAnalytics); // Could add admin auth later

export default router;
