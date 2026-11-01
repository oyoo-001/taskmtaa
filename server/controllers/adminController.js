import { query } from '../config/database.js';
import {
  deleteCache,
  invalidateCachePattern,
  CACHE_KEYS
} from '../config/cache.js';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException
} from '../middleware/errorHandler.js';

/**
 * Record an admin action for accountability.
 * Never let audit logging break the actual operation.
 */
async function logAdminAction(adminId, action, entityType, entityId, details = null) {
  try {
    await query(
      `INSERT INTO admin_audit_logs (admin_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [
        adminId,
        action,
        entityType,
        entityId,
        details ? JSON.stringify(details) : null
      ]
    );
  } catch (error) {
    console.error('Failed to record admin audit log:', error.message);
  }
}

function getPagination(req, defaultLimit = 20) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(req.query.limit, 10) || defaultLimit)
  );
  return { page, limit, offset: (page - 1) * limit };
}

function buildPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit))
  };
}

function parseId(value) {
  const id = parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException('Invalid id');
  }
  return id;
}

/**
 * GET /api/v1/admin/stats
 * Dashboard overview numbers.
 */
export async function getAdminStats(req, res) {
  const result = await query(`
    SELECT
      (SELECT COUNT(*) FROM users)::int AS total_users,
      (SELECT COUNT(*) FROM users WHERE is_verified = true)::int AS verified_users,
      (SELECT COUNT(*) FROM users WHERE is_suspended = true)::int AS suspended_users,
      (SELECT COUNT(*) FROM users WHERE is_admin = true)::int AS admin_users,
      (SELECT COUNT(*) FROM tasks)::int AS total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE status = 'open')::int AS open_tasks,
      (SELECT COUNT(*) FROM tasks WHERE status = 'completed')::int AS completed_tasks,
      (SELECT COUNT(*) FROM gigs)::int AS total_gigs,
      (SELECT COUNT(*) FROM gigs WHERE status = 'active')::int AS active_gigs,
      (SELECT COUNT(*) FROM task_bids)::int AS total_bids,
      (SELECT COUNT(*) FROM task_reviews)::int AS total_reviews,
      (SELECT COUNT(*) FROM chat_messages)::int AS total_messages,
      COALESCE((SELECT AVG(rating) FROM users), 0)::float AS average_rating
  `);

  const recentUsers = await query(`
    SELECT id, full_name, email, avatar_url, is_verified, is_suspended, created_at
    FROM users
    ORDER BY created_at DESC
    LIMIT 5
  `);

  const recentTasks = await query(`
    SELECT t.id, t.title, t.status, t.budget, t.created_at,
           u.full_name AS poster_name
    FROM tasks t
    JOIN users u ON t.poster_id = u.id
    ORDER BY t.created_at DESC
    LIMIT 5
  `);

  const recentGigs = await query(`
    SELECT g.id, g.title, g.status, g.amount, g.created_at,
           u.full_name AS seller_name
    FROM gigs g
    JOIN users u ON g.seller_id = u.id
    ORDER BY g.created_at DESC
    LIMIT 5
  `);

  const recentActions = await query(`
    SELECT a.id, a.action, a.entity_type, a.entity_id, a.details, a.created_at,
           u.full_name AS admin_name
    FROM admin_audit_logs a
    LEFT JOIN users u ON a.admin_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 8
  `);

  res.json({
    success: true,
    data: {
      stats: result.rows[0],
      recentUsers: recentUsers.rows,
      recentTasks: recentTasks.rows,
      recentGigs: recentGigs.rows,
      recentActions: recentActions.rows
    }
  });
}

/**
 * GET /api/v1/admin/users
 * List every user with moderation metadata.
 */
export async function listUsers(req, res) {
  const { page, limit, offset } = getPagination(req);
  const { search, status } = req.query;

  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    conditions.push(
      `(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx} OR COALESCE(u.phone_number, '') ILIKE $${idx})`
    );
  }

  if (status === 'verified') conditions.push('u.is_verified = true');
  else if (status === 'unverified') conditions.push('u.is_verified = false');
  else if (status === 'suspended') conditions.push('u.is_suspended = true');
  else if (status === 'active') conditions.push('u.is_suspended = false');
  else if (status === 'admin') conditions.push('u.is_admin = true');
  else if (status === 'featured') conditions.push('u.is_featured = true');

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit, offset);

  const result = await query(
    `SELECT
       u.id, u.full_name, u.email, u.phone_number, u.avatar_url,
       CAST(u.rating AS FLOAT) AS rating,
       u.completed_tasks_count, u.is_verified, u.is_admin, u.is_suspended, u.is_featured,
       u.suspension_reason, u.created_at,
       (SELECT COUNT(*) FROM tasks t WHERE t.poster_id = u.id)::int AS posted_tasks,
       (SELECT COUNT(*) FROM task_bids b WHERE b.tasker_id = u.id)::int AS bids_placed,
       (SELECT COUNT(*) FROM task_reviews r WHERE r.reviewee_id = u.id)::int AS reviews_count,
       COUNT(*) OVER()::int AS total_count
     FROM users u
     ${where}
     ORDER BY u.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const total = result.rows[0]?.total_count ?? 0;
  const users = result.rows.map(({ total_count, ...user }) => user);

  res.json({
    success: true,
    data: {
      users,
      pagination: buildPagination(page, limit, total)
    }
  });
}

/**
 * GET /api/v1/admin/users/:id
 * Full profile, posted tasks and reviews for one user.
 */
export async function getUserDetail(req, res) {
  const id = parseId(req.params.id);

  const userResult = await query(
    `SELECT
       u.id, u.full_name, u.email, u.phone_number, u.avatar_url,
       CAST(u.rating AS FLOAT) AS rating,
       u.completed_tasks_count, u.is_verified, u.is_admin, u.is_suspended, u.is_featured,
       u.suspension_reason, u.suspended_at, u.verified_at, u.created_at,
       (SELECT COUNT(*) FROM tasks t WHERE t.poster_id = u.id)::int AS posted_tasks,
       (SELECT COUNT(*) FROM task_bids b WHERE b.tasker_id = u.id)::int AS bids_placed,
       (SELECT COUNT(*) FROM task_reviews r WHERE r.reviewee_id = u.id)::int AS reviews_count
     FROM users u
     WHERE u.id = $1`,
    [id]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundException('User not found');
  }

  const [tasksResult, reviewsResult] = await Promise.all([
    query(
      `SELECT id, title, status, category, budget, location_name, created_at
       FROM tasks
       WHERE poster_id = $1
       ORDER BY created_at DESC`,
      [id]
    ),
    query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              t.title AS task_title,
              reviewer.full_name AS reviewer_name,
              reviewer.avatar_url AS reviewer_avatar,
              reviewer.is_verified AS reviewer_verified
       FROM task_reviews r
       JOIN tasks t ON r.task_id = t.id
       JOIN users reviewer ON r.reviewer_id = reviewer.id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    )
  ]);

  res.json({
    success: true,
    data: {
      user: userResult.rows[0],
      tasks: tasksResult.rows,
      reviews: reviewsResult.rows
    }
  });
}

/**
 * PATCH /api/v1/admin/users/:id/verify
 * Grant or remove the verification badge.
 */
export async function verifyUser(req, res) {
  const id = parseId(req.params.id);
  const verified = req.body.is_verified !== false;

  const result = await query(
    `UPDATE users
     SET is_verified = $1,
         verified_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
         updated_at = NOW()
     WHERE id = $2
     RETURNING id, full_name, email, is_verified, verified_at`,
    [verified, id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundException('User not found');
  }

  await logAdminAction(req.user.id, verified ? 'verify_user' : 'unverify_user', 'user', id);

  res.json({
    success: true,
    message: verified ? 'User verified successfully' : 'User verification removed',
    data: { user: result.rows[0] }
  });
}

/**
 * PATCH /api/v1/admin/users/:id/suspend
 * Suspend or reinstate an account.
 */
export async function suspendUser(req, res) {
  const id = parseId(req.params.id);
  const suspend = Boolean(req.body.suspend);
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : null;

  if (id === req.user.id) {
    throw new BadRequestException('You cannot suspend your own account');
  }

  if (suspend && !reason) {
    throw new BadRequestException('A suspension reason is required');
  }

  const result = await query(
    `UPDATE users
     SET is_suspended = $1,
         suspension_reason = CASE WHEN $1 THEN $2 ELSE NULL END,
         suspended_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
         updated_at = NOW()
     WHERE id = $3
     RETURNING id, full_name, email, is_suspended, suspension_reason, suspended_at`,
    [suspend, reason, id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundException('User not found');
  }

  await logAdminAction(
    req.user.id,
    suspend ? 'suspend_user' : 'unsuspend_user',
    'user',
    id,
    suspend ? { reason } : null
  );

  res.json({
    success: true,
    message: suspend ? 'User suspended successfully' : 'User reinstated successfully',
    data: { user: result.rows[0] }
  });
}

/**
 * DELETE /api/v1/admin/users/:id
 * Permanently delete a non-admin account and its related records.
 */
export async function deleteUser(req, res) {
  const id = parseId(req.params.id);

  if (id === req.user.id) {
    throw new BadRequestException('You cannot delete your own account');
  }

  const targetResult = await query(
    'SELECT id, full_name, email, is_admin FROM users WHERE id = $1',
    [id]
  );

  if (targetResult.rows.length === 0) {
    throw new NotFoundException('User not found');
  }

  const target = targetResult.rows[0];

  if (target.is_admin) {
    throw new ForbiddenException('Admin accounts cannot be deleted');
  }

  await query('DELETE FROM users WHERE id = $1', [id]);
  invalidateCachePattern('tasks:nearby:*');
  deleteCache('featured_users');

  await logAdminAction(req.user.id, 'delete_user', 'user', id, {
    full_name: target.full_name,
    email: target.email
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}

/**
 * GET /api/v1/admin/tasks
 * Every posted job on the platform.
 */
export async function listTasks(req, res) {
  const { page, limit, offset } = getPagination(req);
  const { search, status, category } = req.query;

  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    conditions.push(
      `(t.title ILIKE $${idx} OR t.description ILIKE $${idx} OR t.location_name ILIKE $${idx} OR u.full_name ILIKE $${idx})`
    );
  }

  if (status) {
    params.push(status);
    conditions.push(`t.status = $${params.length}`);
  }

  if (category) {
    params.push(category);
    conditions.push(`t.category = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit, offset);

  const result = await query(
    `SELECT
       t.id, t.poster_id, t.title, t.description, t.category, t.budget, t.status,
       t.location_name, t.created_at, t.updated_at,
       u.full_name AS poster_name, u.email AS poster_email,
       u.avatar_url AS poster_avatar, u.is_verified AS poster_verified,
       (SELECT COUNT(*) FROM task_bids b WHERE b.task_id = t.id)::int AS bids_count,
       COUNT(*) OVER()::int AS total_count
     FROM tasks t
     JOIN users u ON t.poster_id = u.id
     ${where}
     ORDER BY t.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const total = result.rows[0]?.total_count ?? 0;
  const tasks = result.rows.map(({ total_count, ...task }) => task);

  res.json({
    success: true,
    data: {
      tasks,
      pagination: buildPagination(page, limit, total)
    }
  });
}

/**
 * GET /api/v1/admin/gigs
 * Every gig on the platform.
 */
export async function listGigs(req, res) {
  const { page, limit, offset } = getPagination(req);
  const { search, status, category } = req.query;

  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    conditions.push(
      `(g.title ILIKE $${idx} OR g.description ILIKE $${idx} OR g.category ILIKE $${idx} OR u.full_name ILIKE $${idx})`
    );
  }

  if (status) {
    params.push(status);
    conditions.push(`g.status = $${params.length}`);
  }

  if (category) {
    params.push(category);
    conditions.push(`g.category = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit, offset);

  const result = await query(
    `SELECT
       g.id, g.seller_id, g.title, g.description, g.category, g.subcategory, 
       g.amount, g.status, g.thumbnail_url, g.created_at, g.updated_at,
       u.full_name AS seller_name, u.email AS seller_email,
       u.avatar_url AS seller_avatar, u.is_verified AS seller_verified,
       (SELECT COUNT(*) FROM gig_orders o WHERE o.gig_id = g.id)::int AS orders_count,
       COUNT(*) OVER()::int AS total_count
     FROM gigs g
     JOIN users u ON g.seller_id = u.id
     ${where}
     ORDER BY g.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const total = result.rows[0]?.total_count ?? 0;
  const gigs = result.rows.map(({ total_count, ...gig }) => gig);

  res.json({
    success: true,
    data: {
      gigs,
      pagination: buildPagination(page, limit, total)
    }
  });
}

/**
 * DELETE /api/v1/admin/gigs/:id
 * Moderate/remove any gig.
 */
export async function deleteGig(req, res) {
  const id = parseId(req.params.id);

  const gigResult = await query(
    'SELECT id, title, seller_id FROM gigs WHERE id = $1',
    [id]
  );

  if (gigResult.rows.length === 0) {
    throw new NotFoundException('Gig not found');
  }

  const gig = gigResult.rows[0];

  await query('DELETE FROM gigs WHERE id = $1', [id]);

  await logAdminAction(req.user.id, 'delete_gig', 'gig', id, {
    title: gig.title
  });

  res.json({
    success: true,
    message: 'Gig deleted successfully'
  });
}

/**
 * PATCH /api/v1/admin/users/:id/featured
 * Mark or unmark a user as featured for home page display.
 */
export async function toggleFeaturedUser(req, res) {
  const id = parseId(req.params.id);
  const featured = req.body.is_featured !== false;

  const result = await query(
    `UPDATE users
     SET is_featured = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING id, full_name, email, is_featured`,
    [featured, id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundException('User not found');
  }

  await logAdminAction(req.user.id, featured ? 'feature_user' : 'unfeature_user', 'user', id);
  
  // Invalidate featured users cache
  deleteCache('featured_users');

  res.json({
    success: true,
    message: featured ? 'User marked as featured' : 'User removed from featured',
    data: { user: result.rows[0] }
  });
}

/**
 * DELETE /api/v1/admin/tasks/:id
 * Moderate/remove any job posting.
 */
export async function deleteTask(req, res) {
  const id = parseId(req.params.id);

  const taskResult = await query(
    'SELECT id, title, poster_id FROM tasks WHERE id = $1',
    [id]
  );

  if (taskResult.rows.length === 0) {
    throw new NotFoundException('Task not found');
  }

  const task = taskResult.rows[0];

  await query('DELETE FROM tasks WHERE id = $1', [id]);
  deleteCache(CACHE_KEYS.TASK_DETAIL(id));
  deleteCache(CACHE_KEYS.MY_POSTED_TASKS(task.poster_id));
  invalidateCachePattern('tasks:nearby:*');

  await logAdminAction(req.user.id, 'delete_task', 'task', id, {
    title: task.title
  });

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
}

/**
 * GET /api/v1/admin/feedback/reviews
 * Ratings and written feedback left by users.
 */
export async function listReviews(req, res) {
  const { page, limit, offset } = getPagination(req);
  const { search } = req.query;

  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    conditions.push(
      `(COALESCE(r.comment, '') ILIKE $${idx} OR reviewer.full_name ILIKE $${idx} OR reviewee.full_name ILIKE $${idx} OR t.title ILIKE $${idx})`
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit, offset);

  const result = await query(
    `SELECT
       r.id, r.task_id, r.rating, r.comment, r.created_at,
       t.title AS task_title,
       reviewer.id AS reviewer_id,
       reviewer.full_name AS reviewer_name,
       reviewer.avatar_url AS reviewer_avatar,
       reviewer.is_verified AS reviewer_verified,
       reviewee.id AS reviewee_id,
       reviewee.full_name AS reviewee_name,
       reviewee.avatar_url AS reviewee_avatar,
       reviewee.is_verified AS reviewee_verified,
       COUNT(*) OVER()::int AS total_count
     FROM task_reviews r
     JOIN tasks t ON r.task_id = t.id
     JOIN users reviewer ON r.reviewer_id = reviewer.id
     JOIN users reviewee ON r.reviewee_id = reviewee.id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const total = result.rows[0]?.total_count ?? 0;
  const reviews = result.rows.map(({ total_count, ...review }) => review);

  res.json({
    success: true,
    data: {
      reviews,
      pagination: buildPagination(page, limit, total)
    }
  });
}

/**
 * DELETE /api/v1/admin/feedback/reviews/:id
 */
export async function deleteReview(req, res) {
  const id = parseId(req.params.id);

  const result = await query(
    'DELETE FROM task_reviews WHERE id = $1 RETURNING id, task_id, rating',
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundException('Review not found');
  }

  await logAdminAction(req.user.id, 'delete_review', 'review', id, result.rows[0]);

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
}

/**
 * GET /api/v1/admin/feedback/messages
 * All chat messages exchanged on the platform.
 */
export async function listMessages(req, res) {
  const { page, limit, offset } = getPagination(req);
  const { search } = req.query;

  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    conditions.push(
      `(m.message_text ILIKE $${idx} OR sender.full_name ILIKE $${idx} OR receiver.full_name ILIKE $${idx} OR t.title ILIKE $${idx})`
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit, offset);

  const result = await query(
    `SELECT
       m.id, m.task_id, m.message_text, m.is_read, m.created_at,
       t.title AS task_title,
       sender.id AS sender_id,
       sender.full_name AS sender_name,
       sender.avatar_url AS sender_avatar,
       sender.is_verified AS sender_verified,
       receiver.id AS receiver_id,
       receiver.full_name AS receiver_name,
       receiver.avatar_url AS receiver_avatar,
       receiver.is_verified AS receiver_verified,
       COUNT(*) OVER()::int AS total_count
     FROM chat_messages m
     JOIN tasks t ON m.task_id = t.id
     JOIN users sender ON m.sender_id = sender.id
     JOIN users receiver ON m.receiver_id = receiver.id
     ${where}
     ORDER BY m.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const total = result.rows[0]?.total_count ?? 0;
  const messages = result.rows.map(({ total_count, ...message }) => message);

  res.json({
    success: true,
    data: {
      messages,
      pagination: buildPagination(page, limit, total)
    }
  });
}

/**
 * DELETE /api/v1/admin/feedback/messages/:id
 */
export async function deleteMessage(req, res) {
  const id = parseId(req.params.id);

  const result = await query(
    'DELETE FROM chat_messages WHERE id = $1 RETURNING id, task_id',
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundException('Message not found');
  }

  await logAdminAction(req.user.id, 'delete_message', 'message', id, result.rows[0]);

  res.json({
    success: true,
    message: 'Message deleted successfully'
  });
}

/**
 * GET /api/v1/admin/ratings
 * Rating summary for every user plus review distribution.
 */
export async function listRatings(req, res) {
  const { search } = req.query;
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(u.full_name ILIKE $1 OR u.email ILIKE $1)`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT
       u.id, u.full_name, u.email, u.avatar_url,
       CAST(u.rating AS FLOAT) AS rating,
       u.is_verified, u.is_suspended,
       COUNT(r.id)::int AS reviews_count,
       COALESCE(AVG(r.rating), 0)::float AS reviews_average,
       COUNT(*) FILTER (WHERE r.rating = 5)::int AS five_star,
       COUNT(*) FILTER (WHERE r.rating = 4)::int AS four_star,
       COUNT(*) FILTER (WHERE r.rating = 3)::int AS three_star,
       COUNT(*) FILTER (WHERE r.rating = 2)::int AS two_star,
       COUNT(*) FILTER (WHERE r.rating = 1)::int AS one_star
     FROM users u
     LEFT JOIN task_reviews r ON r.reviewee_id = u.id
     ${where}
     GROUP BY u.id
     ORDER BY u.rating DESC, reviews_count DESC`,
    params
  );

  res.json({
    success: true,
    data: { ratings: result.rows }
  });
}

/**
 * GET /api/v1/admin/audit-logs
 */
export async function listAuditLogs(req, res) {
  const { page, limit, offset } = getPagination(req);

  const result = await query(
    `SELECT
       a.id, a.action, a.entity_type, a.entity_id, a.details, a.created_at,
       u.full_name AS admin_name, u.email AS admin_email,
       COUNT(*) OVER()::int AS total_count
     FROM admin_audit_logs a
     LEFT JOIN users u ON a.admin_id = u.id
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const total = result.rows[0]?.total_count ?? 0;
  const logs = result.rows.map(({ total_count, ...log }) => log);

  res.json({
    success: true,
    data: {
      logs,
      pagination: buildPagination(page, limit, total)
    }
  });
}
