import { query } from '../config/database.js';
import { deleteImages, getPublicIdFromUrl, buildThumbnailUrl } from '../config/cloudinary.js';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '../middleware/errorHandler.js';

const MAX_GIG_IMAGES = 5;

const GIG_FIELDS = `
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
`;

// Keep only valid, non-empty image URLs and enforce the gallery limit.
const normalizeImages = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, MAX_GIG_IMAGES);
};

// Public ids are derived from the stored URLs so the client never has to
// send them. This also lets older gigs clean up correctly.
const resolvePublicIds = (urls, provided) => {
  const normalized = normalizeImages(provided);
  if (normalized.length > 0) return normalized;
  return urls.map((url) => getPublicIdFromUrl(url)).filter(Boolean);
};

const SORT_OPTIONS = {
  newest: 'g.created_at DESC',
  price_low: 'g.amount ASC, g.created_at DESC',
  price_high: 'g.amount DESC, g.created_at DESC',
  rating: 'u.rating DESC, g.created_at DESC',
};

const MAX_LIMIT = 60;

/**
 * GET /api/v1/gigs
 * Public list of active gigs with optional search/filter.
 */
export const getGigs = async (req, res) => {
  const { q, category, subcategory, seller_id, sort } = req.query;
  const userId = req.user?.id ?? null;
  const limit = Math.min(Number(req.query.limit) || 24, MAX_LIMIT);
  const offset = Number(req.query.offset) || 0;

  const params = [];
  const conditions = [`g.status = 'active'`];

  // Never show sellers their own gigs in the public browse results.
  if (userId) {
    params.push(userId);
    conditions.push(`g.seller_id <> $${params.length}`);
  }

  if (q) {
    params.push(`%${q}%`);
    conditions.push(
      `(g.title ILIKE $${params.length} OR g.description ILIKE $${params.length} OR g.category ILIKE $${params.length} OR g.subcategory ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`
    );
  }

  if (category && category !== 'All') {
    params.push(category);
    conditions.push(`g.category = $${params.length}`);
  }

  if (subcategory && subcategory !== 'All') {
    params.push(subcategory);
    conditions.push(`g.subcategory = $${params.length}`);
  }

  if (seller_id) {
    params.push(Number(seller_id));
    conditions.push(`g.seller_id = $${params.length}`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const orderBy = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;

  const countResult = await query(
    `SELECT COUNT(*)::int AS total
     FROM gigs g
     JOIN users u ON u.id = g.seller_id
     ${whereClause}`,
    params
  );

  const listParams = [...params, limit, offset];
  const result = await query(
    `SELECT ${GIG_FIELDS}
     FROM gigs g
     JOIN users u ON u.id = g.seller_id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams
  );

  res.json({
    success: true,
    data: {
      gigs: result.rows,
      count: result.rows.length,
      total: countResult.rows[0].total,
      filters: { q: q || null, category: category || 'All', subcategory: subcategory || 'All', sort: sort || 'newest', limit, offset },
    },
  });
};

/**
 * GET /api/v1/gigs/mine
 * Gigs owned by the signed-in user, including order counts.
 */
export const getMyGigs = async (req, res) => {
  const result = await query(
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
       (SELECT COUNT(*)::int FROM gig_orders o WHERE o.gig_id = g.id) AS orders_count,
       (SELECT COUNT(*)::int FROM gig_orders o WHERE o.gig_id = g.id AND o.status = 'pending') AS pending_orders_count,
       (SELECT COUNT(*)::int FROM gig_orders o WHERE o.gig_id = g.id AND o.status = 'completed') AS completed_orders_count
     FROM gigs g
     WHERE g.seller_id = $1
     ORDER BY g.created_at DESC`,
    [req.user.id]
  );

  res.json({
    success: true,
    data: {
      gigs: result.rows,
      count: result.rows.length,
    },
  });
};

/**
 * GET /api/v1/gigs/:id
 * Gig detail plus the seller's public profile and recent reviews.
 */
export const getGigById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id ?? null;

  const params = [id];
  let ownerAccess = '';
  if (userId) {
    params.push(userId);
    ownerAccess = `OR g.seller_id = $2`;
  }

  const gigResult = await query(
    `SELECT ${GIG_FIELDS}
     FROM gigs g
     JOIN users u ON u.id = g.seller_id
     WHERE g.id = $1 AND (g.status = 'active' ${ownerAccess})`,
    params
  );

  if (gigResult.rows.length === 0) {
    throw new NotFoundException('Gig not found');
  }

  const gig = gigResult.rows[0];

  const sellerResult = await query(
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
          JOIN gigs g2 ON g2.id = o.gig_id
         WHERE g2.seller_id = u.id AND o.status = 'completed') AS completed_gigs_count,
       (SELECT COUNT(*)::int FROM task_reviews r WHERE r.reviewee_id = u.id) AS reviews_count
     FROM users u
     WHERE u.id = $1`,
    [gig.seller_id]
  );

  const reviewsResult = await query(
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
     LIMIT 5`,
    [gig.seller_id]
  );

  res.json({
    success: true,
    data: {
      gig,
      seller: sellerResult.rows[0] || null,
      reviews: reviewsResult.rows,
    },
  });
};

/**
 * POST /api/v1/gigs
 * Publish a new gig.
 */
export const createGig = async (req, res) => {
  const {
    title,
    description,
    notes,
    category,
    subcategory,
    amount,
    delivery_days,
    image_urls,
    image_thumbnails,
    image_public_ids,
    thumbnail_url,
  } = req.body;

  const urls = normalizeImages(image_urls);
  const thumbnails = image_thumbnails !== undefined
    ? normalizeImages(image_thumbnails)
    : urls.map((url) => buildThumbnailUrl(url)).filter(Boolean);
  const publicIds = resolvePublicIds(urls, image_public_ids);
  const coverImage = thumbnail_url || thumbnails[0] || urls[0] || null;

  const result = await query(
    `INSERT INTO gigs (
       seller_id, title, description, notes, category, subcategory, amount,
       delivery_days, status, thumbnail_url, image_urls, image_thumbnails,
       image_public_ids
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $11, $12)
     RETURNING id, seller_id, title, description, notes, category, subcategory,
               thumbnail_url, image_urls, image_thumbnails,
               CAST(amount AS FLOAT) AS amount, delivery_days, status,
               created_at, updated_at`,
    [
      req.user.id,
      title,
      description,
      notes || null,
      category,
      subcategory,
      amount,
      delivery_days ?? 3,
      coverImage,
      urls,
      thumbnails,
      publicIds,
    ]
  );

  res.status(201).json({
    success: true,
    data: {
      gig: result.rows[0],
      message: 'Gig published successfully',
    },
  });
};

/**
 * PATCH /api/v1/gigs/:id
 * Update or pause/activate a gig (owner only).
 */
export const updateGig = async (req, res) => {
  const { id } = req.params;

  const ownerResult = await query(
    `SELECT seller_id, image_urls, image_public_ids
       FROM gigs
      WHERE id = $1`,
    [id]
  );
  if (ownerResult.rows.length === 0) {
    throw new NotFoundException('Gig not found');
  }
  if (ownerResult.rows[0].seller_id !== req.user.id) {
    throw new ForbiddenException('You can only edit your own gigs');
  }

  const previous = ownerResult.rows[0];
  const previousUrls = previous.image_urls || [];
  const previousPublicIds = previous.image_public_ids || [];

  const updates = {};
  const simpleFields = [
    'title',
    'description',
    'notes',
    'category',
    'subcategory',
    'amount',
    'delivery_days',
    'status',
  ];

  for (const field of simpleFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const imagesChanged = req.body.image_urls !== undefined;

  if (imagesChanged) {
    const urls = normalizeImages(req.body.image_urls);
    const thumbnails = req.body.image_thumbnails !== undefined
      ? normalizeImages(req.body.image_thumbnails)
      : urls.map((url) => buildThumbnailUrl(url)).filter(Boolean);

    updates.image_urls = urls;
    updates.image_thumbnails = thumbnails;
    updates.image_public_ids = resolvePublicIds(urls, req.body.image_public_ids);
    updates.thumbnail_url = req.body.thumbnail_url !== undefined
      ? req.body.thumbnail_url || null
      : thumbnails[0] || urls[0] || null;
  } else {
    if (req.body.image_thumbnails !== undefined) {
      updates.image_thumbnails = normalizeImages(req.body.image_thumbnails);
    }
    if (req.body.image_public_ids !== undefined) {
      updates.image_public_ids = normalizeImages(req.body.image_public_ids);
    }
    if (req.body.thumbnail_url !== undefined) {
      updates.thumbnail_url = req.body.thumbnail_url || null;
    }
  }

  const fields = Object.keys(updates);
  if (fields.length === 0) {
    throw new BadRequestException('No fields to update');
  }

  const params = fields.map((field) => updates[field]);
  const setClauses = fields.map(
    (field, index) => `${field} = $${index + 1}`
  );
  params.push(id, req.user.id);

  const result = await query(
    `UPDATE gigs
     SET ${setClauses.join(', ')}, updated_at = NOW()
     WHERE id = $${params.length - 1} AND seller_id = $${params.length}
     RETURNING id, seller_id, title, description, notes, category, subcategory,
               thumbnail_url, image_urls, image_thumbnails,
               CAST(amount AS FLOAT) AS amount, delivery_days, status,
               created_at, updated_at`,
    params
  );

  // Delete images that were removed from the gallery. Cleanup is
  // best-effort and never blocks the response.
  if (imagesChanged && result.rows.length > 0) {
    const keptIds = new Set(updates.image_public_ids || []);
    const removed = [
      ...previousPublicIds,
      ...previousUrls.map((url) => getPublicIdFromUrl(url)).filter(Boolean),
    ].filter((publicId) => publicId && !keptIds.has(publicId));

    await deleteImages(removed);
  }

  res.json({
    success: true,
    data: {
      gig: result.rows[0],
      message: 'Gig updated successfully',
    },
  });
};

/**
 * DELETE /api/v1/gigs/:id
 * Remove a gig and its orders (owner only).
 */
export const deleteGig = async (req, res) => {
  const { id } = req.params;

  const result = await query(
    `DELETE FROM gigs
      WHERE id = $1 AND seller_id = $2
      RETURNING id, image_urls, image_public_ids`,
    [id, req.user.id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundException('Gig not found or you do not own it');
  }

  const { image_urls: imageUrls = [], image_public_ids: publicIds = [] } = result.rows[0];
  await deleteImages([
    ...publicIds,
    ...imageUrls.map((url) => getPublicIdFromUrl(url)).filter(Boolean),
  ]);

  res.json({
    success: true,
    data: {
      message: 'Gig deleted successfully',
      id: result.rows[0].id,
    },
  });
};
