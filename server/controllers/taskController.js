import { query, getClient } from '../config/database.js';
import { NotFoundException, ForbiddenException, BadRequestException } from '../middleware/errorHandler.js';
import { 
  cacheWrapper, 
  getCache, 
  setCache, 
  deleteCache, 
  invalidateCachePattern,
  CACHE_KEYS, 
  CACHE_TTL 
} from '../config/cache.js';

/**
 * Create a new task
 */
export const createTask = async (req, res) => {
  const { title, description, category, budget, latitude, longitude, location_name } = req.body;

  const result = await query(
    `INSERT INTO tasks (poster_id, title, description, category, budget, location, location_name)
     VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography, $8)
     RETURNING id, poster_id, title, description, category, budget, 
               ST_Y(location::geometry) as latitude, 
               ST_X(location::geometry) as longitude,
               location_name, status, created_at`,
    [req.user.id, title, description, category, budget, longitude, latitude, location_name]
  );

  // Invalidate nearby tasks cache (new task affects search results)
  invalidateCachePattern('tasks:nearby:*');
  deleteCache(CACHE_KEYS.MY_POSTED_TASKS(req.user.id));

  // Emit nearby task alert via Socket.io
  const io = req.app.get('io');
  if (io) {
    const task = result.rows[0];
    // Broadcast to all connected users
    io.sockets.sockets.forEach((socket) => {
      // Skip the task creator
      if (socket.userId === req.user.id) return;
      
      // If user registered location, check distance
      if (socket.userLocation) {
        const { latitude: userLat, longitude: userLng, radius } = socket.userLocation;
        const taskLat = task.latitude;
        const taskLng = task.longitude;
        
        // Calculate distance using Haversine formula
        const R = 6371000; // Earth's radius in meters
        const dLat = (taskLat - userLat) * Math.PI / 180;
        const dLon = (taskLng - userLng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(userLat * Math.PI / 180) * Math.cos(taskLat * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        if (distance <= radius) {
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
      } else {
        // No location registered, send to everyone
        socket.emit('nearby_task_alert', {
          task: {
            id: task.id,
            title: task.title,
            category: task.category,
            budget: task.budget,
            location_name: task.location_name
          }
        });
      }
    });
  }

  res.status(201).json({
    success: true,
    data: {
      task: result.rows[0]
    }
  });
};

/**
 * Get nearby tasks based on user location with distance calculation
 */
export const getNearbyTasks = async (req, res) => {
  const { latitude, longitude, radius, category, limit, offset } = req.query;
  const userId = req.user?.id; // Optional auth - may be undefined

  // radius omitted or 0 means show tasks everywhere, sorted by distance
  const radiusMeters = radius !== undefined ? Number(radius) : null;
  const limitByRadius = Number.isFinite(radiusMeters) && radiusMeters > 0;

  // Create cache key (round coordinates for better cache hits)
  const latRounded = parseFloat(latitude).toFixed(3);
  const lngRounded = parseFloat(longitude).toFixed(3);
  const radiusKey = limitByRadius ? radiusMeters : 'anywhere';
  const cacheKey = `${CACHE_KEYS.NEARBY_TASKS(latRounded, lngRounded, radiusKey)}:${category || 'all'}:${limit}:${offset}${userId ? `:user${userId}` : ''}`;
  
  // Try cache first
  const cached = getCache(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      data: cached,
      cached: true
    });
  }

  let queryText = `
    SELECT 
      t.id, t.poster_id, t.title, t.description, t.category, t.budget, t.status,
      ST_Y(t.location::geometry) as latitude,
      ST_X(t.location::geometry) as longitude,
      t.location_name,
      ST_Distance(
        t.location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      ) as distance_meters,
      t.created_at,
      u.full_name as poster_name,
      u.avatar_url as poster_avatar,
      u.is_verified as poster_verified,
      u.rating as poster_rating,
      (SELECT COUNT(*) FROM task_bids WHERE task_id = t.id) as bids_count
    FROM tasks t
    JOIN users u ON t.poster_id = u.id
    WHERE t.status = 'open'
  `;

  const params = [longitude, latitude];
  let paramIndex = 3;

  // Only restrict by distance when a positive radius was supplied
  if (limitByRadius) {
    queryText += `
    AND ST_DWithin(
      t.location,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      $${paramIndex}
    )`;
    params.push(radiusMeters);
    paramIndex++;
  }

  // Exclude user's own posts if authenticated
  if (userId) {
    queryText += ` AND t.poster_id != $${paramIndex}`;
    params.push(userId);
    paramIndex++;
  }

  // Add category filter if provided
  if (category) {
    queryText += ` AND t.category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  // Add ordering and pagination
  queryText += ` ORDER BY distance_meters ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await query(queryText, params);

  // Format distance for human readability
  const tasks = result.rows.map(task => ({
    ...task,
    distance_formatted: formatDistance(task.distance_meters)
  }));

  const responseData = {
    tasks,
    count: tasks.length,
    filters: {
      radius: limitByRadius ? radiusMeters : 'anywhere',
      category,
      limit,
      offset
    }
  };
  
  // Cache the result
  setCache(cacheKey, responseData, CACHE_TTL.NEARBY_TASKS);

  res.json({
    success: true,
    data: responseData
  });
};

/**
 * Get task by ID with full details
 */
export const getTaskById = async (req, res) => {
  const { id } = req.params;
  
  // Try cache first
  const cacheKey = CACHE_KEYS.TASK_DETAIL(id);
  const cached = getCache(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      data: cached,
      cached: true
    });
  }

  const result = await query(
    `SELECT 
      t.id, t.poster_id, t.title, t.description, t.category, t.budget, t.status,
      ST_Y(t.location::geometry) as latitude,
      ST_X(t.location::geometry) as longitude,
      t.location_name, t.created_at, t.updated_at,
      u.full_name as poster_name,
      u.email as poster_email,
      u.phone_number as poster_phone,
      u.avatar_url as poster_avatar,
      u.rating as poster_rating,
      u.is_verified as poster_verified
    FROM tasks t
    JOIN users u ON t.poster_id = u.id
    WHERE t.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundException('Task not found');
  }

  const task = result.rows[0];

  // Get bids for this task
  const bidsResult = await query(
    `SELECT 
      b.id, b.bid_amount, b.pitch_note, b.status, b.created_at,
      u.id as tasker_id,
      u.full_name as tasker_name,
      u.avatar_url as tasker_avatar,
      CAST(u.rating AS FLOAT) as tasker_rating,
      u.completed_tasks_count,
      u.is_verified as tasker_verified
    FROM task_bids b
    JOIN users u ON b.tasker_id = u.id
    WHERE b.task_id = $1
    ORDER BY b.created_at DESC`,
    [id]
  );

  task.bids = bidsResult.rows;
  task.bids_count = bidsResult.rows.length;
  task.poster_rating = parseFloat(task.poster_rating);

  const responseData = { task };
  
  // Cache the result
  setCache(cacheKey, responseData, CACHE_TTL.TASK_DETAIL);

  res.json({
    success: true,
    data: responseData
  });
};

/**
 * Get tasks posted by current user
 */
export const getMyPostedTasks = async (req, res) => {
  const result = await query(
    `SELECT 
      t.id, t.title, t.description, t.category, t.budget, t.status,
      ST_Y(t.location::geometry) as latitude,
      ST_X(t.location::geometry) as longitude,
      t.location_name, t.created_at, t.updated_at,
      u.full_name as poster_name,
      u.avatar_url as poster_avatar,
      u.is_verified as poster_verified,
      CAST(u.rating AS FLOAT) as poster_rating,
      (SELECT COUNT(*) FROM task_bids WHERE task_id = t.id) as bids_count
    FROM tasks t
    JOIN users u ON t.poster_id = u.id
    WHERE t.poster_id = $1
    ORDER BY t.created_at DESC`,
    [req.user.id]
  );

  res.json({
    success: true,
    data: {
      tasks: result.rows,
      count: result.rows.length
    }
  });
};

/**
 * Get tasks where current user has placed bids
 */
export const getMyBiddedTasks = async (req, res) => {
  const result = await query(
    `SELECT 
      t.id, t.title, t.description, t.category, t.budget, t.status,
      ST_Y(t.location::geometry) as latitude,
      ST_X(t.location::geometry) as longitude,
      t.location_name, t.created_at,
      b.id as bid_id,
      b.bid_amount,
      b.pitch_note,
      b.status as bid_status,
      b.created_at as bid_created_at,
      u.full_name as poster_name,
      u.is_verified as poster_verified
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
      tasks: result.rows,
      count: result.rows.length
    }
  });
};

/**
 * Update task status
 */
export const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Check if task exists and user is the poster
  const taskResult = await query(
    'SELECT id, poster_id, status FROM tasks WHERE id = $1',
    [id]
  );

  if (taskResult.rows.length === 0) {
    throw new NotFoundException('Task not found');
  }

  const task = taskResult.rows[0];

  if (task.poster_id !== req.user.id) {
    throw new ForbiddenException('Only the task poster can update task status');
  }

  // Validate status transitions
  const validTransitions = {
    'open': ['cancelled'],
    'assigned': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': []
  };

  if (!validTransitions[task.status].includes(status)) {
    throw new BadRequestException(`Cannot transition from ${task.status} to ${status}`);
  }

  const result = await query(
    `UPDATE tasks
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, title, status, updated_at`,
    [status, id]
  );

  // Invalidate caches
  deleteCache(CACHE_KEYS.TASK_DETAIL(id));
  deleteCache(CACHE_KEYS.MY_POSTED_TASKS(req.user.id));
  invalidateCachePattern('tasks:nearby:*');

  res.json({
    success: true,
    data: {
      task: result.rows[0]
    }
  });
};

/**
 * Delete task
 */
export const deleteTask = async (req, res) => {
  const { id } = req.params;

  // Check if task exists and user is the poster
  const taskResult = await query(
    'SELECT id, poster_id, status FROM tasks WHERE id = $1',
    [id]
  );

  if (taskResult.rows.length === 0) {
    throw new NotFoundException('Task not found');
  }

  const task = taskResult.rows[0];

  if (task.poster_id !== req.user.id) {
    throw new ForbiddenException('Only the task poster can delete this task');
  }

  if (task.status !== 'open') {
    throw new BadRequestException('Can only delete tasks with status "open"');
  }

  await query('DELETE FROM tasks WHERE id = $1', [id]);

  // Invalidate caches
  deleteCache(CACHE_KEYS.TASK_DETAIL(id));
  deleteCache(CACHE_KEYS.MY_POSTED_TASKS(req.user.id));
  invalidateCachePattern('tasks:nearby:*');

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
};

/**
 * Helper function to format distance
 */
function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
}
