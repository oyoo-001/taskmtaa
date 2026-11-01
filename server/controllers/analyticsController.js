import { query } from '../config/database.js';
import { getCache, setCache } from '../config/cache.js';

/**
 * Get buyer analytics
 */
export async function getBuyerAnalytics(req, res) {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query; // Default: last 30 days
    
    const cacheKey = `buyer_analytics_${userId}_${days}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Total tasks posted
    const totalTasksResult = await query(
      'SELECT COUNT(*) as count FROM tasks WHERE poster_id = $1',
      [userId]
    );
    
    // Tasks by status
    const tasksByStatusResult = await query(
      `SELECT status, COUNT(*) as count 
       FROM tasks 
       WHERE poster_id = $1 
       GROUP BY status`,
      [userId]
    );
    
    // Total spent (completed tasks)
    const totalSpentResult = await query(
      `SELECT COALESCE(SUM(tb.bid_amount), 0) as total
       FROM tasks t
       JOIN task_bids tb ON t.id = tb.task_id
       WHERE t.poster_id = $1 
       AND t.status = 'completed'
       AND tb.status = 'accepted'`,
      [userId]
    );
    
    // Average bids per task
    const avgBidsResult = await query(
      `SELECT AVG(bid_count) as average
       FROM (
         SELECT COUNT(*) as bid_count
         FROM task_bids tb
         JOIN tasks t ON tb.task_id = t.id
         WHERE t.poster_id = $1
         GROUP BY tb.task_id
       ) subquery`,
      [userId]
    );
    
    // Tasks over time (last N days)
    const tasksOverTimeResult = await query(
      `SELECT 
         DATE(created_at) as date,
         COUNT(*) as count,
         status
       FROM tasks
       WHERE poster_id = $1 
       AND created_at >= NOW() - INTERVAL '${parseInt(days)} days'
       GROUP BY DATE(created_at), status
       ORDER BY date ASC`,
      [userId]
    );
    
    // Spending over time
    const spendingOverTimeResult = await query(
      `SELECT 
         DATE(t.updated_at) as date,
         SUM(tb.bid_amount) as amount
       FROM tasks t
       JOIN task_bids tb ON t.id = tb.task_id
       WHERE t.poster_id = $1 
       AND t.status = 'completed'
       AND tb.status = 'accepted'
       AND t.updated_at >= NOW() - INTERVAL '${parseInt(days)} days'
       GROUP BY DATE(t.updated_at)
       ORDER BY date ASC`,
      [userId]
    );
    
    // Average time to completion (in hours)
    const avgCompletionTimeResult = await query(
      `SELECT AVG(EXTRACT(EPOCH FROM (t.updated_at - t.created_at))/3600) as hours
       FROM tasks t
       WHERE t.poster_id = $1 
       AND t.status = 'completed'`,
      [userId]
    );
    
    // Average time to first bid (in minutes)
    const avgFirstBidTimeResult = await query(
      `SELECT AVG(EXTRACT(EPOCH FROM (first_bid_time - t.created_at))/60) as minutes
       FROM tasks t
       JOIN (
         SELECT task_id, MIN(created_at) as first_bid_time
         FROM task_bids
         GROUP BY task_id
       ) fb ON t.id = fb.task_id
       WHERE t.poster_id = $1`,
      [userId]
    );
    
    // Bid acceptance rate
    const acceptanceRateResult = await query(
      `SELECT 
         COUNT(CASE WHEN tb.status = 'accepted' THEN 1 END)::float / 
         NULLIF(COUNT(*), 0) * 100 as rate
       FROM task_bids tb
       JOIN tasks t ON tb.task_id = t.id
       WHERE t.poster_id = $1`,
      [userId]
    );
    
    const analytics = {
      totalTasks: parseInt(totalTasksResult.rows[0].count),
      tasksByStatus: tasksByStatusResult.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
      totalSpent: parseFloat(totalSpentResult.rows[0].total),
      avgBidsPerTask: parseFloat(avgBidsResult.rows[0].average) || 0,
      tasksOverTime: tasksOverTimeResult.rows,
      spendingOverTime: spendingOverTimeResult.rows.map(row => ({
        date: row.date,
        amount: parseFloat(row.amount),
      })),
      avgCompletionTimeHours: parseFloat(avgCompletionTimeResult.rows[0].hours) || 0,
      avgFirstBidTimeMinutes: parseFloat(avgFirstBidTimeResult.rows[0].minutes) || 0,
      bidAcceptanceRate: parseFloat(acceptanceRateResult.rows[0].rate) || 0,
    };
    
    setCache(cacheKey, analytics, 300); // Cache for 5 minutes
    res.json(analytics);
  } catch (error) {
    console.error('Get buyer analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
}

/**
 * Get tasker analytics
 */
export async function getTaskerAnalytics(req, res) {
  try {
    const userId = req.user.id;
    const { days = 30 } = req.query;
    
    const cacheKey = `tasker_analytics_${userId}_${days}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Total bids placed
    const totalBidsResult = await query(
      'SELECT COUNT(*) as count FROM task_bids WHERE tasker_id = $1',
      [userId]
    );
    
    // Bids by status
    const bidsByStatusResult = await query(
      `SELECT status, COUNT(*) as count 
       FROM task_bids 
       WHERE tasker_id = $1 
       GROUP BY status`,
      [userId]
    );
    
    // Total earnings (accepted bids on completed tasks)
    const totalEarningsResult = await query(
      `SELECT COALESCE(SUM(tb.bid_amount), 0) as total
       FROM task_bids tb
       JOIN tasks t ON tb.task_id = t.id
       WHERE tb.tasker_id = $1 
       AND tb.status = 'accepted'
       AND t.status = 'completed'`,
      [userId]
    );
    
    // Earnings over time
    const earningsOverTimeResult = await query(
      `SELECT 
         DATE(t.updated_at) as date,
         SUM(tb.bid_amount) as amount
       FROM task_bids tb
       JOIN tasks t ON tb.task_id = t.id
       WHERE tb.tasker_id = $1 
       AND tb.status = 'accepted'
       AND t.status = 'completed'
       AND t.updated_at >= NOW() - INTERVAL '${parseInt(days)} days'
       GROUP BY DATE(t.updated_at)
       ORDER BY date ASC`,
      [userId]
    );
    
    // Bid success rate (accepted / total)
    const successRateResult = await query(
      `SELECT 
         COUNT(CASE WHEN status = 'accepted' THEN 1 END)::float / 
         NULLIF(COUNT(*), 0) * 100 as rate
       FROM task_bids
       WHERE tasker_id = $1`,
      [userId]
    );
    
    // Average rating
    const avgRatingResult = await query(
      `SELECT rating FROM users WHERE id = $1`,
      [userId]
    );
    
    // Completed tasks count
    const completedTasksResult = await query(
      `SELECT COUNT(*) as count
       FROM task_bids tb
       JOIN tasks t ON tb.task_id = t.id
       WHERE tb.tasker_id = $1 
       AND tb.status = 'accepted'
       AND t.status = 'completed'`,
      [userId]
    );
    
    // Tasks by category
    const tasksByCategoryResult = await query(
      `SELECT 
         t.category,
         COUNT(*) as count
       FROM task_bids tb
       JOIN tasks t ON tb.task_id = t.id
       WHERE tb.tasker_id = $1
       AND tb.status = 'accepted'
       GROUP BY t.category
       ORDER BY count DESC
       LIMIT 10`,
      [userId]
    );
    
    // Average response time (time from task creation to first bid, in minutes)
    const avgResponseTimeResult = await query(
      `SELECT AVG(EXTRACT(EPOCH FROM (tb.created_at - t.created_at))/60) as minutes
       FROM task_bids tb
       JOIN tasks t ON tb.task_id = t.id
       WHERE tb.tasker_id = $1`,
      [userId]
    );
    
    const analytics = {
      totalBids: parseInt(totalBidsResult.rows[0].count),
      bidsByStatus: bidsByStatusResult.rows.reduce((acc, row) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {}),
      totalEarnings: parseFloat(totalEarningsResult.rows[0].total),
      earningsOverTime: earningsOverTimeResult.rows.map(row => ({
        date: row.date,
        amount: parseFloat(row.amount),
      })),
      bidSuccessRate: parseFloat(successRateResult.rows[0].rate) || 0,
      averageRating: parseFloat(avgRatingResult.rows[0]?.rating) || 5.0,
      completedTasks: parseInt(completedTasksResult.rows[0].count),
      tasksByCategory: tasksByCategoryResult.rows.map(row => ({
        category: row.category,
        count: parseInt(row.count),
      })),
      avgResponseTimeMinutes: parseFloat(avgResponseTimeResult.rows[0].minutes) || 0,
    };
    
    setCache(cacheKey, analytics, 300); // Cache for 5 minutes
    res.json(analytics);
  } catch (error) {
    console.error('Get tasker analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
}

/**
 * Get platform analytics (admin only - simplified version)
 */
export async function getPlatformAnalytics(req, res) {
  try {
    const cacheKey = 'platform_analytics';
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Total users
    const totalUsersResult = await query('SELECT COUNT(*) as count FROM users');
    
    // Total tasks
    const totalTasksResult = await query('SELECT COUNT(*) as count FROM tasks');
    
    // Total completed tasks
    const completedTasksResult = await query(
      `SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'`
    );
    
    // Total GMV (Gross Merchandise Value)
    const gmvResult = await query(
      `SELECT COALESCE(SUM(tb.bid_amount), 0) as total
       FROM task_bids tb
       JOIN tasks t ON tb.task_id = t.id
       WHERE tb.status = 'accepted' AND t.status = 'completed'`
    );
    
    // Task completion rate
    const completionRate = totalTasksResult.rows[0].count > 0
      ? (completedTasksResult.rows[0].count / totalTasksResult.rows[0].count) * 100
      : 0;
    
    const analytics = {
      totalUsers: parseInt(totalUsersResult.rows[0].count),
      totalTasks: parseInt(totalTasksResult.rows[0].count),
      completedTasks: parseInt(completedTasksResult.rows[0].count),
      completionRate: parseFloat(completionRate),
      totalGMV: parseFloat(gmvResult.rows[0].total),
    };
    
    setCache(cacheKey, analytics, 300); // Cache for 5 minutes
    res.json(analytics);
  } catch (error) {
    console.error('Get platform analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch platform analytics' });
  }
}
