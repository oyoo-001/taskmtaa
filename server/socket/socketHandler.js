import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

// Track online users
const onlineUsers = new Map(); // userId -> Set of socketIds
const userSockets = new Map(); // socketId -> userId
const typingUsers = new Map(); // `${taskId}:${userId}` -> timestamp

/**
 * Socket.io authentication middleware
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('access_token=')[1]?.split(';')[0];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await query(
      'SELECT is_suspended FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return next(new Error('Account not found'));
    }

    if (result.rows[0].is_suspended) {
      return next(new Error('Account suspended'));
    }

    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    
    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
};

/**
 * Initialize Socket.io handlers
 */
export const initializeSocketHandlers = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`✓ User connected: ${socket.userId}`);

    // Track online status
    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, new Set());
    }
    onlineUsers.get(socket.userId).add(socket.id);
    userSockets.set(socket.id, socket.userId);

    // User joins their personal room for notifications
    socket.join(`user_${socket.userId}`);
    
    // Broadcast user online status
    io.emit('user_online', { userId: socket.userId });

    /**
     * Get online users
     */
    socket.on('get_online_users', () => {
      const onlineUserIds = Array.from(onlineUsers.keys());
      socket.emit('online_users', { userIds: onlineUserIds });
    });

    /**
     * Check if specific user is online
     */
    socket.on('check_user_online', ({ userId }) => {
      const isOnline = onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
      socket.emit('user_online_status', { userId, isOnline });
    });

    /**
     * Join a direct message conversation
     */
    socket.on('join_direct_chat', async ({ otherUserId }) => {
      try {
        // Create a unique room for the two users (sorted IDs for consistency)
        const roomId = [socket.userId, otherUserId].sort((a, b) => a - b).join('_');
        socket.join(`dm_${roomId}`);
        socket.emit('joined_direct_chat', { otherUserId, roomId });
        console.log(`User ${socket.userId} joined DM room: ${roomId}`);
      } catch (error) {
        console.error('Error joining direct chat:', error);
        socket.emit('error', { message: 'Failed to join direct chat' });
      }
    });

    /**
     * Leave direct message conversation
     */
    socket.on('leave_direct_chat', ({ otherUserId }) => {
      const roomId = [socket.userId, otherUserId].sort((a, b) => a - b).join('_');
      socket.leave(`dm_${roomId}`);
      socket.emit('left_direct_chat', { otherUserId, roomId });
    });
    socket.on('join_task_room', async ({ taskId }) => {
      try {
        // Verify user has access to this task (poster or bidder)
        const taskCheck = await query(
          `SELECT t.id, t.poster_id
           FROM tasks t
           WHERE t.id = $1 AND (
             t.poster_id = $2 
             OR EXISTS (
               SELECT 1 FROM task_bids WHERE task_id = $1 AND tasker_id = $2
             )
           )`,
          [taskId, socket.userId]
        );

        if (taskCheck.rows.length === 0) {
          socket.emit('error', { message: 'Not authorized to join this task room' });
          return;
        }

        const roomName = `task_${taskId}`;
        socket.join(roomName);
        socket.emit('joined_room', { taskId, room: roomName });
        
        console.log(`User ${socket.userId} joined room: ${roomName}`);
      } catch (error) {
        console.error('Error joining task room:', error);
        socket.emit('error', { message: 'Failed to join task room' });
      }
    });

    /**
     * Leave a task room
     */
    socket.on('leave_task_room', ({ taskId }) => {
      const roomName = `task_${taskId}`;
      socket.leave(roomName);
      socket.emit('left_room', { taskId, room: roomName });
      console.log(`User ${socket.userId} left room: ${roomName}`);
    });

    /**
     * Send a message in task chat
     */
    socket.on('send_message', async ({ taskId, receiverId, messageText }) => {
      try {
        // Insert message into database
        const result = await query(
          `INSERT INTO chat_messages (task_id, sender_id, receiver_id, message_text)
           VALUES ($1, $2, $3, $4)
           RETURNING id, task_id, sender_id, receiver_id, message_text, is_read, created_at`,
          [taskId, socket.userId, receiverId, messageText]
        );

        const message = result.rows[0];

        // Get sender info
        const senderInfo = await query(
          'SELECT id, full_name, avatar_url, is_verified FROM users WHERE id = $1',
          [socket.userId]
        );

        const messageWithSender = {
          ...message,
          sender_name: senderInfo.rows[0].full_name,
          sender_avatar: senderInfo.rows[0].avatar_url,
          sender_verified: senderInfo.rows[0].is_verified
        };

        // Emit to task room
        io.to(`task_${taskId}`).emit('new_message', messageWithSender);

        // Notify receiver directly
        io.to(`user_${receiverId}`).emit('message_notification', {
          taskId,
          senderId: socket.userId,
          senderName: senderInfo.rows[0].full_name,
          messagePreview: messageText.substring(0, 50)
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Typing indicator
     */
    socket.on('typing_start', ({ taskId, receiverId }) => {
      const key = `${taskId}:${socket.userId}`;
      typingUsers.set(key, Date.now());
      
      // Emit to task room
      if (taskId) {
        socket.to(`task_${taskId}`).emit('user_typing', {
          taskId,
          userId: socket.userId,
          timestamp: Date.now()
        });
      }
      
      // Emit to direct receiver
      if (receiverId) {
        io.to(`user_${receiverId}`).emit('user_typing', {
          taskId,
          userId: socket.userId,
          timestamp: Date.now()
        });
      }
    });

    socket.on('typing_stop', ({ taskId, receiverId }) => {
      const key = `${taskId}:${socket.userId}`;
      typingUsers.delete(key);
      
      // Emit to task room
      if (taskId) {
        socket.to(`task_${taskId}`).emit('user_stopped_typing', {
          taskId,
          userId: socket.userId
        });
      }
      
      // Emit to direct receiver
      if (receiverId) {
        io.to(`user_${receiverId}`).emit('user_stopped_typing', {
          taskId,
          userId: socket.userId
        });
      }
    });
    
    /**
     * Auto-cleanup stale typing indicators (after 5 seconds)
     */
    const cleanupTyping = setInterval(() => {
      const now = Date.now();
      for (const [key, timestamp] of typingUsers.entries()) {
        if (now - timestamp > 5000) {
          typingUsers.delete(key);
          const [taskId, userId] = key.split(':');
          socket.to(`task_${taskId}`).emit('user_stopped_typing', {
            taskId: parseInt(taskId),
            userId: parseInt(userId)
          });
        }
      }
    }, 2000);

    /**
     * Mark messages as read
     */
    socket.on('mark_messages_read', async ({ taskId, senderId }) => {
      try {
        await query(
          `UPDATE chat_messages
           SET is_read = true
           WHERE task_id = $1 AND sender_id = $2 AND receiver_id = $3 AND is_read = false`,
          [taskId, senderId, socket.userId]
        );

        // Notify sender that their messages were read
        io.to(`user_${senderId}`).emit('messages_read', {
          taskId,
          readerId: socket.userId
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    /**
     * Register for nearby task alerts based on location
     */
    socket.on('register_location', ({ latitude, longitude, radius = 10000 }) => {
      socket.userLocation = { latitude, longitude, radius };
      socket.emit('location_registered', { latitude, longitude, radius });
      console.log(`User ${socket.userId} registered location: ${latitude}, ${longitude}`);
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      console.log(`✗ User disconnected: ${socket.userId}`);
      
      // Update online status
      const userId = userSockets.get(socket.id);
      if (userId && onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socket.id);
        
        // If user has no more connections, mark as offline
        if (onlineUsers.get(userId).size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_offline', { userId });
        }
      }
      userSockets.delete(socket.id);
      
      // Clean up typing indicators
      for (const [key] of typingUsers.entries()) {
        if (key.includes(`:${userId}`)) {
          typingUsers.delete(key);
        }
      }
    });
  });
  
  /**
   * Get online user count
   */
  setInterval(() => {
    const onlineCount = onlineUsers.size;
    io.emit('online_count', { count: onlineCount });
  }, 30000); // Update every 30 seconds
};

/**
 * Broadcast new task alert to nearby users
 * Called from task creation endpoint
 */
export const broadcastNearbyTaskAlert = (io, task) => {
  // Get all connected sockets
  io.sockets.sockets.forEach((socket) => {
    if (socket.userLocation) {
      const { latitude, longitude, radius } = socket.userLocation;
      
      // Calculate if task is within user's radius
      // This is a simplified check - actual distance calculation should use PostGIS
      const taskLat = task.latitude;
      const taskLng = task.longitude;
      
      // Rough distance calculation (in meters)
      const R = 6371000; // Earth's radius in meters
      const dLat = (taskLat - latitude) * Math.PI / 180;
      const dLon = (taskLng - longitude) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(latitude * Math.PI / 180) * Math.cos(taskLat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      if (distance <= radius && socket.userId !== task.poster_id) {
        socket.emit('nearby_task_alert', {
          task: {
            id: task.id,
            title: task.title,
            category: task.category,
            budget: task.budget,
            distance: `${(distance / 1000).toFixed(1)} km`,
            location_name: task.location_name
          }
        });
      }
    }
  });
};
