import { query, getClient } from '../config/database.js';

/**
 * Run database migrations
 * Creates tables with PostGIS spatial support
 */
async function migrate() {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    console.log('Starting database migration...');
    
    // Enable PostGIS extension
    console.log('→ Enabling PostGIS extension...');
    await client.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    
    // Create users table
    console.log('→ Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone_number VARCHAR(20) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        rating NUMERIC(3,2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
        completed_tasks_count INTEGER DEFAULT 0,
        is_verified BOOLEAN DEFAULT false,
        email_verified BOOLEAN DEFAULT false,
        phone_verified BOOLEAN DEFAULT false,
        two_factor_enabled BOOLEAN DEFAULT false,
        two_factor_secret TEXT,
        identity_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Add security columns if they don't exist (for existing databases)
    console.log('→ Adding security columns to users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
      ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT false;
    `);

    // Add admin / moderation columns if they don't exist (for existing databases)
    console.log('→ Adding admin and moderation columns to users table...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
      ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
    `);

    // Add security-related columns for password management and account deletion
    console.log('→ Adding security columns to users table...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;
    `);

    // Public seller profile fields used by the Gigs marketplace
    console.log('→ Adding seller profile columns to users table...');
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS headline VARCHAR(255),
      ADD COLUMN IF NOT EXISTS experience TEXT,
      ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS availability VARCHAR(50) DEFAULT 'Available now';
    `);

    // Create indices for users
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
      CREATE INDEX IF NOT EXISTS idx_users_admin ON users(is_admin);
      CREATE INDEX IF NOT EXISTS idx_users_suspended ON users(is_suspended);
      CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified);
      CREATE INDEX IF NOT EXISTS idx_users_featured ON users(is_featured);
    `);

    // Create admin audit log table
    console.log('→ Creating admin_audit_logs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INTEGER,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_logs(admin_id);
      CREATE INDEX IF NOT EXISTS idx_audit_entity ON admin_audit_logs(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs(created_at DESC);
    `);
    
    // Create tasks table with spatial column
    console.log('→ Creating tasks table with PostGIS spatial support...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        poster_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        budget DECIMAL(10,2) NOT NULL CHECK (budget > 0),
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
        location GEOGRAPHY(Point, 4326) NOT NULL,
        location_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create spatial index on tasks location (critical for performance)
    console.log('→ Creating spatial index on tasks...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_spatial ON tasks USING GIST(location);
    `);
    
    // Create standard indices for tasks
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tasks_poster ON tasks(poster_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
      CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_tasks_status_created ON tasks(status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_tasks_poster_status ON tasks(poster_id, status);
    `);

    // Create gigs table (Fiverr-style service listings)
    console.log('→ Creating gigs table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS gigs (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        notes TEXT,
        category VARCHAR(100) NOT NULL,
        subcategory VARCHAR(100) NOT NULL DEFAULT 'General',
        thumbnail_url TEXT,
        image_urls TEXT[] NOT NULL DEFAULT '{}',
        image_thumbnails TEXT[] NOT NULL DEFAULT '{}',
        image_public_ids TEXT[] NOT NULL DEFAULT '{}',
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        delivery_days INTEGER NOT NULL DEFAULT 3 CHECK (delivery_days BETWEEN 1 AND 90),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_gigs_seller ON gigs(seller_id);
      CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
      CREATE INDEX IF NOT EXISTS idx_gigs_category ON gigs(category);
      CREATE INDEX IF NOT EXISTS idx_gigs_created ON gigs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_gigs_status_created ON gigs(status, created_at DESC);
    `);

    // Existing databases need the subcategory column added and old,
    // broad categories migrated onto the richer taxonomy.
    console.log('→ Adding gig subcategories...');
    await client.query(`
      ALTER TABLE gigs
      ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100) DEFAULT 'General';
    `);
    await client.query(`
      UPDATE gigs SET subcategory = 'General'
      WHERE subcategory IS NULL OR subcategory = '';
    `);
    await client.query(`
      UPDATE gigs
      SET category = CASE category
        WHEN 'Housekeeping' THEN 'Home & Cleaning'
        WHEN 'Bush & Yard Clearing' THEN 'Outdoors & Garden'
        WHEN 'Farming & Agriculture' THEN 'Farming & Agriculture'
        WHEN 'Tutoring & Training' THEN 'Education & Tutoring'
        WHEN 'Errands & Delivery' THEN 'Transport & Logistics'
        WHEN 'Other' THEN 'Other Services'
        ELSE category
      END
      WHERE category IN (
        'Housekeeping', 'Bush & Yard Clearing', 'Farming & Agriculture',
        'Tutoring & Training', 'Errands & Delivery', 'Other'
      );
    `);
    await client.query(`
      UPDATE gigs
      SET subcategory = CASE category
        WHEN 'Home & Cleaning' THEN 'House cleaning'
        WHEN 'Outdoors & Garden' THEN 'Bush clearing'
        WHEN 'Farming & Agriculture' THEN 'Crop farming'
        WHEN 'Education & Tutoring' THEN 'General tutoring'
        WHEN 'Transport & Logistics' THEN 'Delivery services'
        WHEN 'Other Services' THEN 'Other'
        ELSE 'General'
      END
      WHERE subcategory IS NULL OR subcategory = '' OR subcategory = 'General';
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_gigs_subcategory ON gigs(subcategory);
      CREATE INDEX IF NOT EXISTS idx_gigs_category_subcategory ON gigs(category, subcategory);
    `);

    // Cloudinary image storage for gig galleries. Full images and their
    // derived thumbnails are stored separately; public ids allow cleanup.
    console.log('→ Adding gig image columns...');
    await client.query(`
      ALTER TABLE gigs
        ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
        ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS image_thumbnails TEXT[] NOT NULL DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS image_public_ids TEXT[] NOT NULL DEFAULT '{}';
    `);

    // Create gig_orders table (buyer requests against a gig)
    console.log('→ Creating gig_orders table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS gig_orders (
        id SERIAL PRIMARY KEY,
        gig_id INTEGER NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
        buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        requirements TEXT,
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_gig_orders_gig ON gig_orders(gig_id);
      CREATE INDEX IF NOT EXISTS idx_gig_orders_buyer ON gig_orders(buyer_id);
      CREATE INDEX IF NOT EXISTS idx_gig_orders_status ON gig_orders(status);
      CREATE INDEX IF NOT EXISTS idx_gig_orders_created ON gig_orders(created_at DESC);
    `);
    
    // Create task_bids table
    console.log('→ Creating task_bids table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_bids (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        tasker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        bid_amount DECIMAL(10,2) NOT NULL CHECK (bid_amount > 0),
        pitch_note TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(task_id, tasker_id)
      );
    `);
    
    // Create indices for task_bids
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bids_task ON task_bids(task_id);
      CREATE INDEX IF NOT EXISTS idx_bids_tasker ON task_bids(tasker_id);
      CREATE INDEX IF NOT EXISTS idx_bids_status ON task_bids(status);
      CREATE INDEX IF NOT EXISTS idx_bids_tasker_status ON task_bids(tasker_id, status);
      CREATE INDEX IF NOT EXISTS idx_bids_task_status ON task_bids(task_id, status);
      CREATE INDEX IF NOT EXISTS idx_bids_created ON task_bids(created_at DESC);
    `);
    
    // Create chat_messages table
    console.log('→ Creating chat_messages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message_text TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create indices for chat_messages
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_task ON chat_messages(task_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON chat_messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_receiver ON chat_messages(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created ON chat_messages(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON chat_messages(receiver_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_messages_task_created ON chat_messages(task_id, created_at DESC);
    `);
    
    // Create task_reviews table
    console.log('→ Creating task_reviews table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS task_reviews (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reviewee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(task_id, reviewer_id)
      );
    `);
    
    // Create indices for task_reviews
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON task_reviews(reviewee_id);
    `);
    
    // Create notifications table
    console.log('→ Creating notifications table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        related_task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create indices for notifications
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
    `);
    
    // Create verification_tokens table
    console.log('→ Creating verification_tokens table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'phone', 'backup_code')),
        code VARCHAR(10),
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Create indices for verification_tokens
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tokens_user ON verification_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_tokens_token ON verification_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_tokens_type ON verification_tokens(type);
      CREATE INDEX IF NOT EXISTS idx_tokens_expires ON verification_tokens(expires_at);
    `);
    
    // Create push_subscriptions table
    console.log('→ Creating push_subscriptions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subscription_json TEXT NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, subscription_json)
      );
    `);
    
    // Create indices for push_subscriptions
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
    `);

    // Create two_factor_backup_codes table
    console.log('→ Creating two_factor_backup_codes table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS two_factor_backup_codes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code_hash VARCHAR(255) NOT NULL,
        used BOOLEAN DEFAULT false,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_backup_codes_user ON two_factor_backup_codes(user_id);
      CREATE INDEX IF NOT EXISTS idx_backup_codes_used ON two_factor_backup_codes(user_id, used);
    `);
    
    await client.query('COMMIT');
    
    console.log('✓ Migration completed successfully!');
    console.log('✓ PostGIS spatial extension enabled');
    console.log('✓ All tables and indices created');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

// Run migration
migrate().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
