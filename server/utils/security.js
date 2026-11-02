/**
 * Security utilities for login attempt tracking and rate limiting
 */

// In-memory store for login attempts (email -> { attempts, lockedUntil })
const loginAttempts = new Map();

// Configuration
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CLEANUP_INTERVAL = 10 * 60 * 1000; // Clean up every 10 minutes

/**
 * Check if account is locked due to too many failed attempts
 * @param {string} email - User email
 * @returns {Object} { isLocked: boolean, remainingTime: number }
 */
export function checkLoginLock(email) {
  const record = loginAttempts.get(email.toLowerCase());
  
  if (!record) {
    return { isLocked: false, remainingTime: 0 };
  }
  
  const now = Date.now();
  
  // Check if lock has expired
  if (record.lockedUntil && now >= record.lockedUntil) {
    // Reset the record
    loginAttempts.delete(email.toLowerCase());
    return { isLocked: false, remainingTime: 0 };
  }
  
  // Still locked
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingMs = record.lockedUntil - now;
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    return { isLocked: true, remainingTime: remainingMinutes };
  }
  
  return { isLocked: false, remainingTime: 0 };
}

/**
 * Record a failed login attempt
 * @param {string} email - User email
 * @returns {Object} { isLocked: boolean, attempts: number, remainingAttempts: number }
 */
export function recordFailedAttempt(email) {
  const normalizedEmail = email.toLowerCase();
  const record = loginAttempts.get(normalizedEmail) || { attempts: 0, lockedUntil: null };
  
  record.attempts += 1;
  
  // Lock account if max attempts reached
  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCKOUT_DURATION;
    loginAttempts.set(normalizedEmail, record);
    
    return {
      isLocked: true,
      attempts: record.attempts,
      remainingAttempts: 0,
      lockoutMinutes: Math.ceil(LOCKOUT_DURATION / 60000)
    };
  }
  
  loginAttempts.set(normalizedEmail, record);
  
  return {
    isLocked: false,
    attempts: record.attempts,
    remainingAttempts: MAX_ATTEMPTS - record.attempts,
    lockoutMinutes: 0
  };
}

/**
 * Clear failed attempts for an email (called on successful login)
 * @param {string} email - User email
 */
export function clearFailedAttempts(email) {
  loginAttempts.delete(email.toLowerCase());
}

/**
 * Get current attempt count for an email
 * @param {string} email - User email
 * @returns {number} - Number of failed attempts
 */
export function getAttemptCount(email) {
  const record = loginAttempts.get(email.toLowerCase());
  return record ? record.attempts : 0;
}

/**
 * Periodic cleanup of expired records
 */
function cleanupExpiredRecords() {
  const now = Date.now();
  
  for (const [email, record] of loginAttempts.entries()) {
    // Remove records where lock has expired
    if (record.lockedUntil && now >= record.lockedUntil) {
      loginAttempts.delete(email);
    }
    // Remove old records with no lock (older than 15 minutes)
    else if (!record.lockedUntil && record.lastAttempt && now - record.lastAttempt > 15 * 60 * 1000) {
      loginAttempts.delete(email);
    }
  }
}

// Run cleanup every 10 minutes
setInterval(cleanupExpiredRecords, CLEANUP_INTERVAL);

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validatePasswordStrength(password) {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (password && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (password && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (password && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (password && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate a random token for password reset
 * @returns {string} - Random token
 */
export function generateResetToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Generate backup codes for 2FA
 * @returns {string[]} - Array of 10 backup codes
 */
export function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}
