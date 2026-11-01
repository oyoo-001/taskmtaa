import { query } from '../config/database.js';
import { NotFoundException, ForbiddenException } from '../middleware/errorHandler.js';

/**
 * Send a message in a task chat
 */
export const sendMessage = async (req, res) => {
  const { id: taskId } = req.params;
  const { message_text, receiver_id } = req.body;

  // Verify task exists
  const taskResult = await query(
    'SELECT id, poster_id, status FROM tasks WHERE id = $1',
    [taskId]
  );

  if (taskResult.rows.length === 0) {
    throw new NotFoundException('Task not found');
  }

  const task = taskResult.rows[0];

  // Verify user is either poster or has a bid on the task
  const bidResult = await query(
    'SELECT id FROM task_bids WHERE task_id = $1 AND tasker_id = $2',
    [taskId, req.user.id]
  );

  const isAuthorized = task.poster_id === req.user.id || bidResult.rows.length > 0;

  if (!isAuthorized) {
    throw new ForbiddenException('You must be the task poster or have placed a bid to send messages');
  }

  // Verify receiver is also authorized
  const receiverBidResult = await query(
    'SELECT id FROM task_bids WHERE task_id = $1 AND tasker_id = $2',
    [taskId, receiver_id]
  );

  const isReceiverAuthorized = task.poster_id === receiver_id || receiverBidResult.rows.length > 0;

  if (!isReceiverAuthorized) {
    throw new ForbiddenException('Invalid receiver');
  }

  // Create message
  const result = await query(
    `INSERT INTO chat_messages (task_id, sender_id, receiver_id, message_text)
     VALUES ($1, $2, $3, $4)
     RETURNING id, task_id, sender_id, receiver_id, message_text, is_read, created_at`,
    [taskId, req.user.id, receiver_id, message_text]
  );

  res.status(201).json({
    success: true,
    data: {
      message: result.rows[0]
    }
  });
};

/**
 * Get messages for a task
 */
export const getTaskMessages = async (req, res) => {
  const { id: taskId } = req.params;
  const { other_user_id } = req.query;

  // Verify task exists
  const taskResult = await query(
    'SELECT id, poster_id FROM tasks WHERE id = $1',
    [taskId]
  );

  if (taskResult.rows.length === 0) {
    throw new NotFoundException('Task not found');
  }

  const task = taskResult.rows[0];

  // Verify user is authorized
  const bidResult = await query(
    'SELECT id FROM task_bids WHERE task_id = $1 AND tasker_id = $2',
    [taskId, req.user.id]
  );

  const isAuthorized = task.poster_id === req.user.id || bidResult.rows.length > 0;

  if (!isAuthorized) {
    throw new ForbiddenException('You must be the task poster or have placed a bid to view messages');
  }

  let queryText = `
    SELECT 
      m.id, m.task_id, m.sender_id, m.receiver_id, m.message_text, m.is_read, m.created_at,
      sender.full_name as sender_name,
      sender.avatar_url as sender_avatar,
      sender.is_verified as sender_verified,
      receiver.full_name as receiver_name,
      receiver.avatar_url as receiver_avatar,
      receiver.is_verified as receiver_verified
    FROM chat_messages m
    JOIN users sender ON m.sender_id = sender.id
    JOIN users receiver ON m.receiver_id = receiver.id
    WHERE m.task_id = $1
  `;

  const params = [taskId];

  // Filter by conversation with specific user if provided
  if (other_user_id) {
    queryText += `
      AND (
        (m.sender_id = $2 AND m.receiver_id = $3)
        OR
        (m.sender_id = $3 AND m.receiver_id = $2)
      )
    `;
    params.push(req.user.id, other_user_id);
  } else {
    // Otherwise, get all messages involving current user
    queryText += `
      AND (m.sender_id = $2 OR m.receiver_id = $2)
    `;
    params.push(req.user.id);
  }

  queryText += ` ORDER BY m.created_at ASC`;

  const result = await query(queryText, params);

  // Mark messages as read
  if (result.rows.length > 0) {
    await query(
      `UPDATE chat_messages
       SET is_read = true
       WHERE task_id = $1 AND receiver_id = $2 AND is_read = false`,
      [taskId, req.user.id]
    );
  }

  res.json({
    success: true,
    data: {
      messages: result.rows,
      count: result.rows.length
    }
  });
};

/**
 * Get unread message count for user
 */
export const getUnreadCount = async (req, res) => {
  const result = await query(
    `SELECT COUNT(*) as unread_count
     FROM chat_messages
     WHERE receiver_id = $1 AND is_read = false`,
    [req.user.id]
  );

  res.json({
    success: true,
    data: {
      unread_count: parseInt(result.rows[0].unread_count)
    }
  });
};

/**
 * Get user's chat conversations
 */
export const getConversations = async (req, res) => {
  // Get conversations from messages
  const messageConversations = await query(
    `SELECT DISTINCT ON (task_id, other_user_id)
      m.task_id,
      t.title as task_title,
      CASE 
        WHEN m.sender_id = $1 THEN m.receiver_id
        ELSE m.sender_id
      END as other_user_id,
      CASE 
        WHEN m.sender_id = $1 THEN receiver.full_name
        ELSE sender.full_name
      END as other_user_name,
      CASE 
        WHEN m.sender_id = $1 THEN receiver.avatar_url
        ELSE sender.avatar_url
      END as other_user_avatar,
      CASE 
        WHEN m.sender_id = $1 THEN receiver.is_verified
        ELSE sender.is_verified
      END as other_user_verified,
      m.message_text as last_message,
      m.created_at as last_message_at,
      (SELECT COUNT(*) 
       FROM chat_messages 
       WHERE task_id = m.task_id 
       AND receiver_id = $1 
       AND is_read = false
       AND (sender_id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END)
      ) as unread_count
    FROM chat_messages m
    JOIN tasks t ON m.task_id = t.id
    JOIN users sender ON m.sender_id = sender.id
    JOIN users receiver ON m.receiver_id = receiver.id
    WHERE m.sender_id = $1 OR m.receiver_id = $1
    ORDER BY task_id, other_user_id, m.created_at DESC`,
    [req.user.id]
  );

  // For task posters: Always show ALL bidders (even without messages)
  // For taskers: Only show tasks they've bid on (even without messages)
  const bidConversations = await query(
    `SELECT DISTINCT
      t.id as task_id,
      t.title as task_title,
      t.poster_id,
      CASE 
        WHEN t.poster_id = $1 THEN b.tasker_id
        ELSE t.poster_id
      END as other_user_id,
      CASE 
        WHEN t.poster_id = $1 THEN u_tasker.full_name
        ELSE u_poster.full_name
      END as other_user_name,
      CASE 
        WHEN t.poster_id = $1 THEN u_tasker.avatar_url
        ELSE u_poster.avatar_url
      END as other_user_avatar,
      CASE 
        WHEN t.poster_id = $1 THEN u_tasker.is_verified
        ELSE u_poster.is_verified
      END as other_user_verified,
      CASE 
        WHEN t.poster_id = $1 THEN 'Start conversation with bidder'
        ELSE 'Message the poster about your bid'
      END as last_message,
      b.created_at as last_message_at,
      0 as unread_count
    FROM task_bids b
    JOIN tasks t ON b.task_id = t.id
    JOIN users u_poster ON t.poster_id = u_poster.id
    JOIN users u_tasker ON b.tasker_id = u_tasker.id
    WHERE (t.poster_id = $1 OR b.tasker_id = $1)
    AND NOT EXISTS (
      SELECT 1 FROM chat_messages m
      WHERE m.task_id = t.id
      AND (
        (m.sender_id = $1 AND m.receiver_id = CASE WHEN t.poster_id = $1 THEN b.tasker_id ELSE t.poster_id END)
        OR
        (m.receiver_id = $1 AND m.sender_id = CASE WHEN t.poster_id = $1 THEN b.tasker_id ELSE t.poster_id END)
      )
    )
    ORDER BY b.created_at DESC`,
    [req.user.id]
  );

  // Merge conversations, keeping message-based ones and adding bid-based ones
  const allConversations = [...messageConversations.rows, ...bidConversations.rows];
  
  // Sort: conversations with real messages first (by time), then bid-only conversations (by bid time)
  allConversations.sort((a, b) => {
    // If both have real messages, sort by message time
    if (a.last_message && b.last_message && 
        !a.last_message.includes('Start conversation') && 
        !b.last_message.includes('Start conversation') &&
        !a.last_message.includes('Message the poster') && 
        !b.last_message.includes('Message the poster')) {
      return new Date(b.last_message_at) - new Date(a.last_message_at);
    }
    
    // Real messages come before placeholder messages
    const aIsReal = a.last_message && 
                    !a.last_message.includes('Start conversation') && 
                    !a.last_message.includes('Message the poster');
    const bIsReal = b.last_message && 
                    !b.last_message.includes('Start conversation') && 
                    !b.last_message.includes('Message the poster');
    
    if (aIsReal && !bIsReal) return -1;
    if (!aIsReal && bIsReal) return 1;
    
    // Both are placeholders, sort by bid time
    return new Date(b.last_message_at) - new Date(a.last_message_at);
  });

  res.json({
    success: true,
    data: {
      conversations: allConversations,
      count: allConversations.length
    }
  });
};
