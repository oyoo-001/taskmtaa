import { query } from '../config/database.js';
import { getCache, setCache } from '../config/cache.js';
import { NotFoundException } from '../middleware/errorHandler.js';

/**
 * Get featured/top-rated users
 */
export async function getFeaturedUsers(req, res) {
  try {
    const cacheKey = 'featured_users';
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json({ users: cached });
    }
    
    // Get featured users first, then top-rated users with completed tasks
    const result = await query(
      `SELECT 
        id,
        full_name,
        avatar_url,
        CAST(rating AS FLOAT) AS rating,
        completed_tasks_count,
        is_verified,
        is_featured,
        created_at
       FROM users
       WHERE (is_featured = true OR (completed_tasks_count > 0 AND rating >= 4.5))
       AND is_suspended = false
       ORDER BY is_featured DESC, rating DESC, completed_tasks_count DESC
       LIMIT 12`,
      []
    );
    
    const users = result.rows;
    
    // Cache for 10 minutes
    setCache(cacheKey, users, 600);
    
    res.json({ users });
  } catch (error) {
    console.error('Get featured users error:', error);
    res.status(500).json({ message: 'Failed to fetch featured users' });
  }
}

/**
 * Get a public seller profile with experience, skills, gigs and reviews.
 */
export async function getPublicProfile(req, res) {
  const { id } = req.params;

  const userResult = await query(
    `SELECT
       u.id,
       u.full_name,
       u.avatar_url,
       u.is_verified,
       CAST(u.rating AS FLOAT) AS rating,
       u.completed_tasks_count,
       u.headline,
       u.experience,
       u.skills,
       u.languages,
       u.availability,
       u.created_at,
       (SELECT COUNT(*)::int FROM gigs g WHERE g.seller_id = u.id AND g.status = 'active') AS active_gigs_count,
       (SELECT COUNT(*)::int
          FROM gig_orders o
          JOIN gigs g ON g.id = o.gig_id
         WHERE g.seller_id = u.id AND o.status = 'completed') AS completed_gigs_count,
       (SELECT COUNT(*)::int FROM tasks t WHERE t.poster_id = u.id) AS posted_tasks_count,
       (SELECT COUNT(*)::int FROM task_reviews r WHERE r.reviewee_id = u.id) AS reviews_count
     FROM users u
     WHERE u.id = $1 AND u.is_suspended = false`,
    [id]
  );

  if (userResult.rows.length === 0) {
    throw new NotFoundException('User not found');
  }

  const profile = userResult.rows[0];

  const [gigsResult, reviewsResult] = await Promise.all([
    query(
      `SELECT
         g.id,
         g.seller_id,
         g.title,
         g.description,
         g.notes,
         g.category,
         g.subcategory,
         g.thumbnail_url,
         g.image_urls,
         g.image_thumbnails,
         CAST(g.amount AS FLOAT) AS amount,
         g.delivery_days,
         g.status,
         g.created_at,
         g.updated_at,
         u.full_name AS seller_name,
         u.avatar_url AS seller_avatar,
         u.is_verified AS seller_verified,
         CAST(u.rating AS FLOAT) AS seller_rating,
         u.headline AS seller_headline,
         (SELECT COUNT(*)::int FROM gig_orders o WHERE o.gig_id = g.id AND o.status = 'completed') AS completed_orders_count
       FROM gigs g
       JOIN users u ON u.id = g.seller_id
       WHERE g.seller_id = $1 AND g.status = 'active'
       ORDER BY g.created_at DESC
       LIMIT 12`,
      [id]
    ),
    query(
      `SELECT
         r.id,
         r.rating,
         r.comment,
         r.created_at,
         t.title AS task_title,
         rv.full_name AS reviewer_name,
         rv.avatar_url AS reviewer_avatar,
         rv.is_verified AS reviewer_verified
       FROM task_reviews r
       JOIN users rv ON rv.id = r.reviewer_id
       LEFT JOIN tasks t ON t.id = r.task_id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id]
    ),
  ]);

  res.json({
    success: true,
    data: {
      user: profile,
      gigs: gigsResult.rows,
      reviews: reviewsResult.rows,
    },
  });
}
