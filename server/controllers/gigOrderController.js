import { query } from '../config/database.js';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '../middleware/errorHandler.js';

const ORDER_FIELDS = `
  o.id,
  o.gig_id,
  o.buyer_id,
  o.requirements,
  CAST(o.amount AS FLOAT) AS amount,
  o.status,
  o.created_at,
  o.updated_at,
  g.title AS gig_title,
  g.category AS gig_category,
  g.subcategory AS gig_subcategory,
  g.thumbnail_url AS gig_thumbnail_url,
  g.delivery_days,
  g.seller_id,
  seller.full_name AS seller_name,
  seller.avatar_url AS seller_avatar,
  seller.is_verified AS seller_verified,
  buyer.full_name AS buyer_name,
  buyer.avatar_url AS buyer_avatar,
  buyer.is_verified AS buyer_verified
`;

/**
 * POST /api/v1/gig-orders
 * Request a gig. Creates a pending order for the seller to review.
 */
export const createGigOrder = async (req, res) => {
  const { gig_id, requirements } = req.body;

  const gigResult = await query(
    `SELECT id, seller_id, title, amount, status
     FROM gigs
     WHERE id = $1`,
    [gig_id]
  );

  if (gigResult.rows.length === 0) {
    throw new NotFoundException('Gig not found');
  }

  const gig = gigResult.rows[0];

  if (gig.status !== 'active') {
    throw new BadRequestException('This gig is not currently accepting orders');
  }

  if (gig.seller_id === req.user.id) {
    throw new BadRequestException('You cannot order your own gig');
  }

  const existing = await query(
    `SELECT id FROM gig_orders
     WHERE gig_id = $1 AND buyer_id = $2 AND status = 'pending'`,
    [gig_id, req.user.id]
  );

  if (existing.rows.length > 0) {
    throw new BadRequestException('You already have a pending request for this gig');
  }

  const result = await query(
    `INSERT INTO gig_orders (gig_id, buyer_id, requirements, amount, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING id, gig_id, buyer_id, requirements, CAST(amount AS FLOAT) AS amount, status, created_at`,
    [gig_id, req.user.id, requirements || null, gig.amount]
  );

  res.status(201).json({
    success: true,
    data: {
      order: result.rows[0],
      message: 'Request sent to the seller',
    },
  });
};

/**
 * GET /api/v1/gig-orders/mine
 * Orders placed by the signed-in buyer.
 */
export const getMyGigOrders = async (req, res) => {
  const result = await query(
    `SELECT ${ORDER_FIELDS}
     FROM gig_orders o
     JOIN gigs g ON g.id = o.gig_id
     JOIN users seller ON seller.id = g.seller_id
     JOIN users buyer ON buyer.id = o.buyer_id
     WHERE o.buyer_id = $1
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );

  res.json({
    success: true,
    data: {
      orders: result.rows,
      count: result.rows.length,
    },
  });
};

/**
 * GET /api/v1/gig-orders/received
 * Orders received by the signed-in seller.
 */
export const getReceivedGigOrders = async (req, res) => {
  const result = await query(
    `SELECT ${ORDER_FIELDS}
     FROM gig_orders o
     JOIN gigs g ON g.id = o.gig_id
     JOIN users seller ON seller.id = g.seller_id
     JOIN users buyer ON buyer.id = o.buyer_id
     WHERE g.seller_id = $1
     ORDER BY o.created_at DESC`,
    [req.user.id]
  );

  res.json({
    success: true,
    data: {
      orders: result.rows,
      count: result.rows.length,
    },
  });
};

/**
 * PATCH /api/v1/gig-orders/:id/status
 * Sellers accept/decline/complete; buyers can cancel their own request.
 */
export const updateGigOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const orderResult = await query(
    `SELECT o.id, o.buyer_id, o.status AS current_status, g.seller_id
     FROM gig_orders o
     JOIN gigs g ON g.id = o.gig_id
     WHERE o.id = $1`,
    [id]
  );

  if (orderResult.rows.length === 0) {
    throw new NotFoundException('Order not found');
  }

  const order = orderResult.rows[0];
  const isSeller = order.seller_id === req.user.id;
  const isBuyer = order.buyer_id === req.user.id;

  if (!isSeller && !isBuyer) {
    throw new ForbiddenException('You do not have access to this order');
  }

  if (isBuyer && !isSeller) {
    if (status !== 'cancelled') {
      throw new ForbiddenException('Buyers can only cancel their own orders');
    }
    if (!['pending', 'accepted'].includes(order.current_status)) {
      throw new BadRequestException('This order can no longer be cancelled');
    }
  }

  if (isSeller) {
    const allowed = ['accepted', 'declined', 'completed'];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Status must be one of: ${allowed.join(', ')}`);
    }

    if (status === 'accepted' && order.current_status !== 'pending') {
      throw new BadRequestException('Only pending orders can be accepted');
    }
    if (status === 'declined' && order.current_status !== 'pending') {
      throw new BadRequestException('Only pending orders can be declined');
    }
    if (status === 'completed' && order.current_status !== 'accepted') {
      throw new BadRequestException('Only accepted orders can be completed');
    }
  }

  const result = await query(
    `UPDATE gig_orders
     SET status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, gig_id, buyer_id, requirements, CAST(amount AS FLOAT) AS amount, status, created_at, updated_at`,
    [status, id]
  );

  res.json({
    success: true,
    data: {
      order: result.rows[0],
      message: `Order ${status}`,
    },
  });
};
