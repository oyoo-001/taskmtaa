import NodeCache from 'node-cache';

/**
 * In-memory cache configuration
 * For production with multiple servers, consider Redis
 */

// Main cache instance
// stdTTL: Standard time-to-live in seconds
// checkperiod: Interval for automatic delete check
const cache = new NodeCache({
  stdTTL: 300,        // 5 minutes default TTL
  checkperiod: 60,    // Check for expired keys every 60 seconds
  useClones: false,   // Don't clone data (faster, but be careful with mutations)
  deleteOnExpire: true
});

/**
 * Cache keys with different TTLs for different data types
 */
export const CACHE_KEYS = {
  // User data (1 minute - changes infrequently)
  USER_PROFILE: (userId) => `user:${userId}`,
  
  // Tasks (30 seconds - changes moderately)
  TASK_DETAIL: (taskId) => `task:${taskId}`,
  NEARBY_TASKS: (lat, lng, radius) => `tasks:nearby:${lat}:${lng}:${radius}`,
  MY_POSTED_TASKS: (userId) => `tasks:posted:${userId}`,
  
  // Bids (15 seconds - changes frequently)
  TASK_BIDS: (taskId) => `bids:task:${taskId}`,
  MY_BIDS: (userId) => `bids:user:${userId}`,
  
  // Analytics (5 minutes - expensive queries)
  USER_ANALYTICS: (userId) => `analytics:${userId}`,
  
  // Counts (30 seconds)
  UNREAD_MESSAGES: (userId) => `messages:unread:${userId}`,
  NOTIFICATIONS_COUNT: (userId) => `notifications:count:${userId}`
};

/**
 * Cache TTLs in seconds
 */
export const CACHE_TTL = {
  USER_PROFILE: 60,        // 1 minute
  TASK_DETAIL: 30,         // 30 seconds
  NEARBY_TASKS: 10,        // 10 seconds (location-based, changes often)
  MY_POSTED_TASKS: 30,     // 30 seconds
  TASK_BIDS: 15,           // 15 seconds
  MY_BIDS: 30,             // 30 seconds
  USER_ANALYTICS: 300,     // 5 minutes
  UNREAD_MESSAGES: 30,     // 30 seconds
  NOTIFICATIONS_COUNT: 30  // 30 seconds
};

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {any} Cached value or undefined
 */
export const getCache = (key) => {
  return cache.get(key);
};

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 */
export const setCache = (key, value, ttl) => {
  return cache.set(key, value, ttl);
};

/**
 * Delete value from cache
 * @param {string} key - Cache key
 */
export const deleteCache = (key) => {
  return cache.del(key);
};

/**
 * Delete multiple keys from cache
 * @param {string[]} keys - Array of cache keys
 */
export const deleteCacheMultiple = (keys) => {
  return cache.del(keys);
};

/**
 * Invalidate cache by pattern
 * @param {string} pattern - Pattern to match (e.g., 'user:*')
 */
export const invalidateCachePattern = (pattern) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    return regex.test(key);
  });
  return cache.del(matchingKeys);
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return cache.getStats();
};

/**
 * Clear all cache
 */
export const clearCache = () => {
  return cache.flushAll();
};

/**
 * Cache wrapper for async functions
 * @param {string} key - Cache key
 * @param {Function} fn - Async function to execute if cache miss
 * @param {number} ttl - Time to live in seconds
 */
export const cacheWrapper = async (key, fn, ttl) => {
  // Try to get from cache
  const cached = getCache(key);
  if (cached !== undefined) {
    return cached;
  }
  
  // Cache miss - execute function
  const result = await fn();
  
  // Store in cache
  setCache(key, result, ttl);
  
  return result;
};

// Log cache statistics every 5 minutes in development
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const stats = getCacheStats();
    console.log('📊 Cache Stats:', {
      keys: stats.keys,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) * 100 || 0
    });
  }, 5 * 60 * 1000);
}

export default cache;
