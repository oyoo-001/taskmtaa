import { query, getClient } from '../config/database.js';
import { NotFoundException, ForbiddenException, BadRequestException } from '../middleware/errorHandler.js';

/**
 * Place a bid on a task
 */
export const placeBid = async (req, res) => {
  const { id: taskId } = req.params;
  const { bid_amount, pitch_note } = req.body;

  // Check if task exists and is open
  const taskResult = await query(
    'SELECT id, poster_id, status, budget FROM tasks WHERE id = $1',
    [taskId]
  );

  if (taskResult.rows.length === 0) {
    throw new NotFoundException('Task not found');
  }

  const task = taskResult.rows[0];

  if (task.status !== 'open') {
    throw new BadRequestException('Cannot bid on a task that is not open');
  }

  if (task.poster_id === req.user.id) {
    throw new BadRequestException('Cannot bid on your own task');
  }

  // Check if user already has a bid on this task
  const existingBid = await query(
    'SELECT id FROM task_bids WHERE task_id = $1 AND tasker_id = $2',
    [taskId, req.user.id]
  );

  if (existingBid.rows.length > 0) {
    throw new BadRequestException('You have already placed a bid on this task');
  }

  // Create bid
  const result = await query(
    `INSERT INTO task_bids (task_id, tasker_id, bid_amount, pitch_note)
     VALUES ($1, $2, $3, $4)
     RETURNING id, task_id, tasker_id, bid_amount, pitch_note, status, created_at`,
    [taskId, req.user.id, bid_amount, pitch_note]
  );

  // Get task title and bidder name for notification
  const taskInfo = await query(
    `SELECT t.title, u.full_name as bidder_name
     FROM tasks t, users u
     WHERE t.id = $1 AND u.id = $2`,
    [taskId, req.user.id]
  );

  // Emit bid notification to task poster via Socket.io
  const io = req.app.get('io');
  if (io && taskInfo.rows.length > 0) {
    const { title: taskTitle, bidder_name } = taskInfo.rows[0];
    io.to(`user_${task.poster_id}`).emit('bid_notification', {
      bidId: result.rows[0].id,
      taskId,
      taskTitle,
      bidderName: bidder_name,
      bidAmount: bid_amount,
      pitchNote: pitch_note
    });
  }

  res.status(201).json({
    success: true,
    data: {
      bid: result.rows[0]
    }
  });
};

/**
 * Get all bids for a task (poster only)
 */
export const getTaskBids = async (req, res) => {
  const { id: taskId } = req.params;

  // Check if task exists and user is the poster
  const taskResult = await query(
    'SELECT id, poster_id FROM tasks WHERE id = $1',
    [taskId]
  );

  if (taskResult.rows.length === 0) {
    throw new NotFoundException('Task not found');
  }

  const task = taskResult.rows[0];

  if (task.poster_id !== req.user.id) {
    throw new ForbiddenException('Only the task poster can view all bids');
  }

  // Get all bids with tasker details
  const result = await query(
    `SELECT 
      b.id, b.bid_amount, b.pitch_note, b.status, b.created_at,
      u.id as tasker_id,
      u.full_name as tasker_name,
      u.email as tasker_email,
      u.phone_number as tasker_phone,
      u.avatar_url as tasker_avatar,
      u.rating as tasker_rating,
      u.completed_tasks_count,
      u.is_verified as tasker_verified
    FROM task_bids b
    JOIN users u ON b.tasker_id = u.id
    WHERE b.task_id = $1
    ORDER BY b.created_at DESC`,
    [taskId]
  );

  res.json({
    success: true,
    data: {
      bids: result.rows,
      count: result.rows.length
    }
  });
};

/**
 * Accept a bid (assigns task to tasker)
 */
export const acceptBid = async (req, res) => {
  const { id: bidId } = req.params;
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Get bid and task details
    const bidResult = await client.query(
      `SELECT b.id, b.task_id, b.tasker_id, b.status,
              t.poster_id, t.status as task_status
       FROM task_bids b
       JOIN tasks t ON b.task_id = t.id
       WHERE b.id = $1`,
      [bidId]
    );

    if (bidResult.rows.length === 0) {
      throw new NotFoundException('Bid not found');
    }

    const bid = bidResult.rows[0];

    // Verify user is the task poster
    if (bid.poster_id !== req.user.id) {
      throw new ForbiddenException('Only the task poster can accept bids');
    }

    // Verify task is still open
    if (bid.task_status !== 'open') {
      throw new BadRequestException('Can only accept bids for open tasks');
    }

    // Verify bid is pending
    if (bid.status !== 'pending') {
      throw new BadRequestException('Can only accept pending bids');
    }

    // Accept the bid
    await client.query(
      `UPDATE task_bids
       SET status = 'accepted', updated_at = NOW()
       WHERE id = $1`,
      [bidId]
    );

    // Reject all other bids for this task
    await client.query(
      `UPDATE task_bids
       SET status = 'rejected', updated_at = NOW()
       WHERE task_id = $1 AND id != $2 AND status = 'pending'`,
      [bid.task_id, bidId]
    );

    // Update task status to assigned
    await client.query(
      `UPDATE tasks
       SET status = 'assigned', updated_at = NOW()
       WHERE id = $1`,
      [bid.task_id]
    );

    await client.query('COMMIT');

    // Get updated bid with tasker details
    const updatedBid = await query(
      `SELECT 
        b.id, b.task_id, b.bid_amount, b.pitch_note, b.status, b.created_at,
        u.id as tasker_id,
        u.full_name as tasker_name,
        u.email as tasker_email,
        u.phone_number as tasker_phone,
        u.avatar_url as tasker_avatar
      FROM task_bids b
      JOIN users u ON b.tasker_id = u.id
      WHERE b.id = $1`,
      [bidId]
    );

    res.json({
      success: true,
      data: {
        bid: updatedBid.rows[0]
      },
      message: 'Bid accepted successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Reject a bid
 */
export const rejectBid = async (req, res) => {
  const { id: bidId } = req.params;

  // Get bid and task details
  const bidResult = await query(
    `SELECT b.id, b.task_id, b.status,
            t.poster_id, t.status as task_status
     FROM task_bids b
     JOIN tasks t ON b.task_id = t.id
     WHERE b.id = $1`,
    [bidId]
  );

  if (bidResult.rows.length === 0) {
    throw new NotFoundException('Bid not found');
  }

  const bid = bidResult.rows[0];

  // Verify user is the task poster
  if (bid.poster_id !== req.user.id) {
    throw new ForbiddenException('Only the task poster can reject bids');
  }

  // Verify bid is pending
  if (bid.status !== 'pending') {
    throw new BadRequestException('Can only reject pending bids');
  }

  // Reject the bid
  const result = await query(
    `UPDATE task_bids
     SET status = 'rejected', updated_at = NOW()
     WHERE id = $1
     RETURNING id, status, updated_at`,
    [bidId]
  );

  res.json({
    success: true,
    data: {
      bid: result.rows[0]
    },
    message: 'Bid rejected successfully'
  });
};

/**
 * Get user's own bids
 */
export const getMyBids = async (req, res) => {
  const result = await query(
    `SELECT 
      b.id, b.task_id, b.bid_amount, b.pitch_note, b.status, b.created_at,
      t.title as task_title,
      t.description as task_description,
      t.category as task_category,
      t.budget as task_budget,
      t.status as task_status,
      t.location_name as task_location,
      u.full_name as poster_name
    FROM task_bids b
    JOIN tasks t ON b.task_id = t.id
    JOIN users u ON t.poster_id = u.id
    WHERE b.tasker_id = $1
    ORDER BY b.created_at DESC`,
    [req.user.id]
  );

  res.json({
    success: true,
    data: {
      bids: result.rows,
      count: result.rows.length
    }
  });
};
