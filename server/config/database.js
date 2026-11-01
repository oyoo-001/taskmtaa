import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Production-optimized connection pool configuration
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  
  // Pool sizing for high concurrency (adjust based on your database plan limits)
  max: parseInt(process.env.DB_POOL_MAX) || 50,           // Maximum connections in pool
  min: parseInt(process.env.DB_POOL_MIN) || 5,            // Minimum connections to keep alive
  
  // Timeout configurations (in milliseconds)
  idleTimeoutMillis: 30000,        // Close idle connections after 30s
  connectionTimeoutMillis: 10000,  // Wait up to 10s for available connection
  
  // Query and statement timeouts
  statement_timeout: 30000,        // Kill queries running longer than 30s
  query_timeout: 30000,            // Client-side query timeout
  
  // Connection management
  allowExitOnIdle: false,          // Keep pool alive even with no connections
  
  // Advanced settings for better performance
  application_name: 'TaskMtaa',    // Helps identify app in database logs
};

// For cloud databases with SSL, configure SSL properly
if (process.env.DATABASE_URL.includes('sslmode=require') || 
    process.env.DATABASE_URL.includes('aivencloud.com') ||
    process.env.DATABASE_URL.includes('neon.tech') ||
    process.env.DATABASE_URL.includes('railway.app')) {
  connectionConfig.ssl = {
    rejectUnauthorized: false // Accept self-signed certificates
  };
}

// Create PostgreSQL connection pool
const pool = new Pool(connectionConfig);

// Track if timezone has been set to avoid duplicate logs
let timezoneConfigured = false;

// Set timezone to East Africa Time (Kenya) for all connections
pool.on('connect', async (client) => {
  try {
    await client.query("SET timezone = 'Africa/Nairobi'");
    
    if (!timezoneConfigured) {
      console.log('✓ Database pool initialized (Timezone: Africa/Nairobi)');
      console.log(`✓ Pool config: ${connectionConfig.min}-${connectionConfig.max} connections`);
      timezoneConfigured = true;
    }
  } catch (error) {
    console.error('Error setting timezone:', error);
  }
});

pool.on('error', (err, client) => {
  console.error('Unexpected database pool error:', err);
  // Don't exit process - let pool recover
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Closing database pool...');
  await pool.end();
  console.log('Database pool closed');
});

/**
 * Execute a query with parameters using pool
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
export const query = async (text, params) => {
  const start = Date.now();
  
  try {
    // pool.query() automatically gets a client from pool and releases it
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Only log slow queries in production (> 1 second)
    if (process.env.NODE_ENV === 'development' || duration > 1000) {
      console.log('Query executed:', { 
        duration: `${duration}ms`, 
        rows: result.rowCount,
        slow: duration > 1000 ? '⚠️ SLOW' : ''
      });
      
      // Log full query only in development
      if (process.env.NODE_ENV === 'development' && duration < 500) {
        console.log('SQL:', text.substring(0, 100) + '...');
      }
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Query error:', { 
      duration: `${duration}ms`,
      error: error.message,
      query: text.substring(0, 100) + '...'
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * IMPORTANT: Must call client.release() when done!
 * @returns {Promise<Object>} Database client
 */
export const getClient = async () => {
  const client = await pool.connect();
  
  // Add helper method for transactions
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Set a timeout to ensure client is released
  const timeout = setTimeout(() => {
    console.error('Client checkout timeout - forcing release');
    release();
  }, 30000); // 30 second checkout limit
  
  // Override release to clear timeout
  client.release = () => {
    clearTimeout(timeout);
    release();
  };
  
  return client;
};

/**
 * Execute a transaction with automatic rollback on error
 * @param {Function} callback - Async function that receives client
 * @returns {Promise<any>} Result of callback
 */
export const transaction = async (callback) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get current pool statistics
 * @returns {Object} Pool stats
 */
export const getPoolStats = () => {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  };
};

export default pool;
