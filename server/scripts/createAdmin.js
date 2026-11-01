import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';

/**
 * Create or promote an admin account.
 *
 * Usage:
 *   npm run create-admin -- admin@taskmtaa.com "StrongPassword123!"
 *
 * Or with environment variables:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME="..." npm run create-admin
 */
async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const password = process.env.ADMIN_PASSWORD || process.argv[3];
  const fullName = process.env.ADMIN_NAME || process.argv[4] || 'Platform Admin';
  const phoneNumber = process.env.ADMIN_PHONE || null;

  if (!email || !password) {
    console.error('Usage: npm run create-admin -- <email> <password> [full name]');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters long');
    process.exit(1);
  }

  try {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);

    if (existing.rows.length > 0) {
      const passwordHash = await bcrypt.hash(password, 10);
      await query(
        `UPDATE users
         SET is_admin = true,
             is_suspended = false,
             suspension_reason = NULL,
             suspended_at = NULL,
             password_hash = $2,
             updated_at = NOW()
         WHERE email = $1`,
        [email, passwordHash]
      );
      console.log(`✓ Existing account ${email} promoted to admin (password updated)`);
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      await query(
        `INSERT INTO users (full_name, email, phone_number, password_hash, is_admin, is_verified)
         VALUES ($1, $2, $3, $4, true, true)`,
        [fullName, email, phoneNumber, passwordHash]
      );
      console.log(`✓ Admin account created: ${email}`);
    }
  } catch (error) {
    console.error('✗ Failed to create admin:', error.message);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
}

createAdmin();
