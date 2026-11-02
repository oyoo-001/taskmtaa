import { query as dbQuery } from '../config/database.js';
import { cacheWrapper, CACHE_TTL } from '../config/cache.js';

/**
 * Query Optimizer
 * Provides helper functions to optimize database queries
 */

/**
 * Execute query with automatic caching
 * @param {string} cacheKey - Cache key
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @param {number} ttl - Cache TTL in seconds
 * @returns {Promise<Object>} Query result
 */
export const cachedQuery = async (cacheKey, sql, params = [], ttl = CACHE_TTL.TASK_DETAIL) => {
  return cacheWrapper(cacheKey, async () => {
    const result = await dbQuery(sql, params);
    return result.rows;
  }, ttl);
};

/**
 * Batch query executor to reduce round trips
 * @param {Array} queries - Array of {sql, params} objects
 * @returns {Promise<Array>} Array of results
 */
export const batchQuery = async (queries) => {
  const promises = queries.map(({ sql, params }) => dbQuery(sql, params));
  const results = await Promise.all(promises);
  return results.map(r => r.rows);
};

/**
 * Common query optimizations
 */
export const OPTIMIZED_QUERIES = {
  /**
   * Get user with minimal fields (for lookups)
   */
  getUserMinimal: `
    SELECT id, full_name, avatar_url, is_verified, rating
    FROM users
    WHERE id = $1 AND is_deleted = false
  `,

  /**
   * Get task with poster info (single query)
   */
  getTaskWithPoster: `
    SELECT 
      t.id, t.poster_id, t.title, t.description, t.category, t.budget, t.status,
      ST_Y(t.location::geometry) as latitude,
      ST_X(t.location::geometry) as longitude,
      t.location_name, t.created_at, t.updated_at,
      u.full_name as poster_name,
      u.avatar_url as poster_avatar,
      u.is_verified as poster_verified,
      u.rating as poster_rating,
      (SELECT COUNT(*) FROM task_bids WHERE task_id = t.id) as bids_count
    FROM tasks t
    LEFT JOIN users u ON t.poster_id = u.id
    WHERE t.id = $1
  `,

  /**
   * Get active gigs with seller info (optimized)
   */
  getActiveGigsWithSeller: `
    SELECT 
      g.id, g.seller_id, g.title, g.description, g.category, g.subcategory,
      g.thumbnail_url, g.amount, g.delivery_days, g.created_at,
      u.full_name as seller_name,
      u.avatar_url as seller_avatar,
      u.is_verified as seller_verified,
      u.rating as seller_rating,
      (SELECT COUNT(*) FROM gig_orders WHERE gig_id = g.id) as orders_count
    FROM gigs g
    LEFT JOIN users u ON g.seller_id = u.id
    WHERE g.status = 'active'
    ORDER BY g.created_at DESC
    LIMIT $1 OFFSET $2
  `,

  /**
   * Get messages with sender info (single query)
   */
  getMessagesWithUsers: `
    SELECT 
      m.id, m.task_id, m.sender_id, m.receiver_id, m.message_text, 
      m.is_read, m.created_at,
      s.full_name as sender_name,
      s.avatar_url as sender_avatar,
      r.full_name as receiver_name,
      r.avatar_url as receiver_avatar
    FROM chat_messages m
    LEFT JOIN users s ON m.sender_id = s.id
    LEFT JOIN users r ON m.receiver_id = r.id
    WHERE m.task_id = $1
    ORDER BY m.created_at DESC
    LIMIT $2 OFFSET $3
  `
};

/**
 * Pagination helper
 * @param {string} baseQuery - Base SQL query
 * @param {Array} params - Query parameters
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result
 */
export const paginate = async (baseQuery, params, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  // Add pagination to query
  const paginatedQuery = `${baseQuery} LIMIT ${limit} OFFSET ${offset}`;
  
  // Execute both count and data queries in parallel
  const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`;
  
  const [dataResult, countResult] = await Promise.all([
    dbQuery(paginatedQuery, params),
    dbQuery(countQuery, params)
  ]);
  
  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);
  
  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages
    }
  };
};

/**
 * Query builder helpers
 */
export class QueryBuilder {
  constructor(baseQuery) {
    this.query = baseQuery;
    this.params = [];
    this.paramIndex = 1;
    this.conditions = [];
  }

  addCondition(condition, param) {
    if (param !== undefined && param !== null) {
      this.conditions.push(condition.replace('?', `$${this.paramIndex}`));
      this.params.push(param);
      this.paramIndex++;
    }
    return this;
  }

  addInCondition(field, values) {
    if (values && values.length > 0) {
      const placeholders = values.map((_, i) => `$${this.paramIndex + i}`).join(', ');
      this.conditions.push(`${field} IN (${placeholders})`);
      this.params.push(...values);
      this.paramIndex += values.length;
    }
    return this;
  }

  orderBy(field, direction = 'ASC') {
    this.orderByClause = `ORDER BY ${field} ${direction}`;
    return this;
  }

  limit(limit, offset = 0) {
    this.limitClause = `LIMIT ${limit} OFFSET ${offset}`;
    return this;
  }

  build() {
    let finalQuery = this.query;
    
    if (this.conditions.length > 0) {
      finalQuery += ` WHERE ${this.conditions.join(' AND ')}`;
    }
    
    if (this.orderByClause) {
      finalQuery += ` ${this.orderByClause}`;
    }
    
    if (this.limitClause) {
      finalQuery += ` ${this.limitClause}`;
    }
    
    return {
      query: finalQuery,
      params: this.params
    };
  }

  async execute() {
    const { query: sql, params } = this.build();
    const result = await dbQuery(sql, params);
    return result.rows;
  }
}

/**
 * Common query patterns with caching
 */
export const queryPatterns = {
  /**
   * Get single record by ID with caching
   */
  getById: async (table, id, cacheKey, ttl = 60) => {
    return cachedQuery(
      cacheKey,
      `SELECT * FROM ${table} WHERE id = $1`,
      [id],
      ttl
    );
  },

  /**
   * Get user tasks with caching
   */
  getUserTasks: async (userId, status, cacheKey, ttl = 30) => {
    const sql = status
      ? 'SELECT * FROM tasks WHERE poster_id = $1 AND status = $2 ORDER BY created_at DESC'
      : 'SELECT * FROM tasks WHERE poster_id = $1 ORDER BY created_at DESC';
    
    const params = status ? [userId, status] : [userId];
    
    return cachedQuery(cacheKey, sql, params, ttl);
  },

  /**
   * Count with caching
   */
  count: async (table, condition, params, cacheKey, ttl = 60) => {
    const sql = condition
      ? `SELECT COUNT(*) as count FROM ${table} WHERE ${condition}`
      : `SELECT COUNT(*) as count FROM ${table}`;
    
    const result = await cachedQuery(cacheKey, sql, params, ttl);
    return parseInt(result[0].count);
  }
};

/**
 * Database performance monitoring
 */
export const analyzeQuery = async (sql, params) => {
  const explainSql = `EXPLAIN ANALYZE ${sql}`;
  const result = await dbQuery(explainSql, params);
  console.log('Query Analysis:', result.rows);
  return result.rows;
};

/**
 * Index usage checker
 */
export const checkIndexUsage = async (tableName) => {
  const result = await dbQuery(`
    SELECT 
      schemaname, tablename, indexname, 
      idx_scan as index_scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes
    WHERE tablename = $1
    ORDER BY idx_scan DESC
  `, [tableName]);
  
  console.log(`Index usage for table '${tableName}':`, result.rows);
  return result.rows;
};

/**
 * Slow query logger
 */
export const logSlowQuery = (sql, duration, threshold = 1000) => {
  if (duration > threshold) {
    console.warn(`⚠️ SLOW QUERY (${duration}ms):`, sql.substring(0, 200));
    // In production, send to monitoring service
  }
};
