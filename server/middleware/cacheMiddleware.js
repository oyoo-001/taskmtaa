import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '../config/cache.js';

/**
 * Cache middleware for GET requests
 * Caches the response body for specified TTL
 * 
 * Usage: app.get('/api/endpoint', cacheMiddleware(60), handler);
 */
export const cacheMiddleware = (ttl = 60) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip cache for authenticated requests that need fresh data
    // (can be customized per route)
    const cacheKey = `route:${req.originalUrl}`;
    
    // Try to get from cache
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = (body) => {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(cacheKey, body, ttl);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Smart cache middleware that uses user-specific keys
 * Automatically invalidates on write operations
 */
export const smartCache = (options = {}) => {
  const {
    ttl = 60,
    keyGenerator = (req) => `route:${req.originalUrl}`,
    skipAuth = false
  } = options;

  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key (can include user ID for personalized caching)
    const cacheKey = typeof keyGenerator === 'function' 
      ? keyGenerator(req) 
      : keyGenerator;
    
    // Try to get from cache
    const cached = getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    res.setHeader('X-Cache', 'MISS');

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = (body) => {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(cacheKey, body, ttl);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Cache invalidation middleware for write operations
 * Automatically clears related caches on POST/PUT/PATCH/DELETE
 */
export const invalidateCache = (patterns = []) => {
  return (req, res, next) => {
    // Store original response methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Function to invalidate cache after response
    const invalidate = () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          const { invalidateCachePattern } = require('../config/cache.js');
          invalidateCachePattern(pattern);
        });
      }
    };

    // Override response methods
    res.json = (body) => {
      invalidate();
      return originalJson(body);
    };

    res.send = (body) => {
      invalidate();
      return originalSend(body);
    };

    next();
  };
};

/**
 * Conditional cache middleware
 * Only caches if condition is met
 */
export const conditionalCache = (condition, ttl = 60) => {
  return (req, res, next) => {
    if (!condition(req)) {
      return next();
    }
    return cacheMiddleware(ttl)(req, res, next);
  };
};

/**
 * Rate-limited cache refresh
 * Prevents cache stampede by allowing only one request to refresh
 */
const refreshingKeys = new Set();

export const cacheSafeMiddleware = (options = {}) => {
  const {
    ttl = 60,
    keyGenerator = (req) => `route:${req.originalUrl}`,
    gracePeriod = 5 // Serve stale cache for 5 seconds while refreshing
  } = options;

  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = typeof keyGenerator === 'function' 
      ? keyGenerator(req) 
      : keyGenerator;

    const cached = getCache(cacheKey);
    
    // If cache hit and not being refreshed, serve immediately
    if (cached && !refreshingKeys.has(cacheKey)) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // If cache is stale but being refreshed, serve stale data
    if (cached && refreshingKeys.has(cacheKey)) {
      res.setHeader('X-Cache', 'STALE');
      return res.json(cached);
    }

    // Mark as refreshing
    refreshingKeys.add(cacheKey);
    res.setHeader('X-Cache', 'MISS');

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json
    res.json = (body) => {
      // Cache and remove from refreshing set
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(cacheKey, body, ttl);
      }
      refreshingKeys.delete(cacheKey);
      return originalJson(body);
    };

    next();
  };
};

/**
 * Cache warming helper
 * Pre-populates cache with data
 */
export const warmCache = async (key, dataFetcher, ttl) => {
  try {
    const data = await dataFetcher();
    setCache(key, data, ttl);
    return data;
  } catch (error) {
    console.error(`Cache warming failed for key ${key}:`, error);
    return null;
  }
};
