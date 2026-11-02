import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js';
import { BadRequestException, UnauthorizedException, ConflictException, NotFoundException, ForbiddenException } from '../middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import {
  CLOUDINARY_FOLDERS,
  deleteImage,
  getPublicIdFromUrl,
  uploadBuffer,
} from '../config/cloudinary.js';
import {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  send2FASetupEmail,
} from '../config/email.js';
import {
  checkLoginLock,
  recordFailedAttempt,
  clearFailedAttempts,
  validatePasswordStrength,
  generateResetToken,
  generateBackupCodes,
} from '../utils/security.js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Register new user
 */
export const register = async (req, res) => {
  const { full_name, email, phone_number, password } = req.body;

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    throw new BadRequestException(passwordValidation.errors.join('. '));
  }

  // Check if user already exists
  const existingUser = await query(
    'SELECT id FROM users WHERE email = $1 OR phone_number = $2',
    [email, phone_number]
  );

  if (existingUser.rows.length > 0) {
    throw new ConflictException('User with this email or phone number already exists');
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10);

  // Create user
  const result = await query(
    `INSERT INTO users (full_name, email, phone_number, password_hash, password_changed_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, full_name, email, phone_number, avatar_url, 
               CAST(rating AS FLOAT) as rating, is_verified, is_admin, created_at`,
    [full_name, email, phone_number, password_hash]
  );

  const user = result.rows[0];

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id, user.email);

  // Set tokens in httpOnly cookies
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  res.status(201).json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken
    }
  });
};

/**
 * Login user
 */
export const login = async (req, res) => {
  const { email, password, twoFactorCode } = req.body;

  // Check if account is locked due to failed attempts
  const lockStatus = checkLoginLock(email);
  if (lockStatus.isLocked) {
    throw new ForbiddenException(
      `Too many failed login attempts. Please try again in ${lockStatus.remainingTime} minute(s).`
    );
  }

  // Find user
  const result = await query(
    `SELECT id, full_name, email, phone_number, password_hash, avatar_url, 
            CAST(rating AS FLOAT) as rating, is_verified, is_admin, is_suspended,
            suspension_reason, is_deleted, two_factor_enabled, two_factor_secret, created_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    recordFailedAttempt(email);
    throw new UnauthorizedException('Invalid email or password');
  }

  const user = result.rows[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    const attemptResult = recordFailedAttempt(email);
    if (attemptResult.isLocked) {
      throw new ForbiddenException(
        `Too many failed login attempts. Account locked for ${attemptResult.lockoutMinutes} minutes.`
      );
    }
    throw new UnauthorizedException(
      `Invalid email or password. ${attemptResult.remainingAttempts} attempt(s) remaining.`
    );
  }

  // Block deleted accounts
  if (user.is_deleted) {
    throw new ForbiddenException('Account not found');
  }

  // Block suspended accounts
  if (user.is_suspended) {
    throw new ForbiddenException(
      user.suspension_reason
        ? `Your account has been suspended: ${user.suspension_reason}`
        : 'Your account has been suspended'
    );
  }

  // Check 2FA if enabled
  if (user.two_factor_enabled) {
    if (!twoFactorCode) {
      // Return flag indicating 2FA required
      return res.json({
        success: true,
        data: {
          requiresTwoFactor: true,
          userId: user.id,
          message: 'Please provide your 2FA code'
        }
      });
    }

    // Verify 2FA code
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 2 // Allow 2 time steps before/after
    });

    if (!verified) {
      // Check if it's a backup code
      const backupCodeResult = await query(
        `SELECT id, code_hash FROM two_factor_backup_codes 
         WHERE user_id = $1 AND used = false`,
        [user.id]
      );

      let backupCodeValid = false;
      for (const row of backupCodeResult.rows) {
        const isMatch = await bcrypt.compare(twoFactorCode, row.code_hash);
        if (isMatch) {
          // Mark backup code as used
          await query(
            `UPDATE two_factor_backup_codes 
             SET used = true, used_at = NOW() 
             WHERE id = $1`,
            [row.id]
          );
          backupCodeValid = true;
          break;
        }
      }

      if (!backupCodeValid) {
        const attemptResult = recordFailedAttempt(email);
        throw new UnauthorizedException(
          `Invalid 2FA code. ${attemptResult.remainingAttempts} attempt(s) remaining.`
        );
      }
    }
  }

  // Clear failed login attempts on successful login
  clearFailedAttempts(email);

  // Update last login timestamp
  await query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [user.id]
  );

  // Remove sensitive data from response
  delete user.password_hash;
  delete user.suspension_reason;
  delete user.two_factor_secret;
  delete user.is_deleted;

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id, user.email);

  // Set tokens in httpOnly cookies
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
  });

  res.json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken
    }
  });
};

/**
 * Logout user
 */
export const logout = async (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

/**
 * Refresh access token
 */
export const refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refresh_token || req.body.refresh_token;

  if (!refreshToken) {
    throw new UnauthorizedException('Refresh token required');
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Generate new access token
  const newAccessToken = generateAccessToken(decoded.userId, decoded.email);

  // Set new access token in cookie
  res.cookie('access_token', newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  });

  res.json({
    success: true,
    data: {
      accessToken: newAccessToken
    }
  });
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  const result = await query(
    `SELECT id, full_name, email, phone_number, avatar_url, 
            CAST(rating AS FLOAT) as rating, 
            completed_tasks_count, is_verified, is_admin, is_suspended,
            verified_at, created_at,
            headline, experience, skills, languages, availability
     FROM users
     WHERE id = $1`,
    [req.user.id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundException('User not found');
  }

  res.json({
    success: true,
    data: {
      user: result.rows[0]
    }
  });
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  const {
    full_name,
    phone_number,
    avatar_url,
    headline,
    experience,
    skills,
    languages,
    availability,
  } = req.body;

  const normalizeList = (value) => {
    if (value === undefined) return null;
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 30);
    }
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 30);
    }
    return null;
  };

  const result = await query(
    `UPDATE users
     SET full_name = COALESCE($1, full_name),
         phone_number = COALESCE($2, phone_number),
         avatar_url = COALESCE($3, avatar_url),
         headline = COALESCE($4, headline),
         experience = COALESCE($5, experience),
         skills = COALESCE($6, skills),
         languages = COALESCE($7, languages),
         availability = COALESCE($8, availability),
         updated_at = NOW()
     WHERE id = $9
     RETURNING id, full_name, email, phone_number, avatar_url, rating, is_verified, is_admin,
               completed_tasks_count, headline, experience, skills, languages, availability, created_at`,
    [
      full_name,
      phone_number,
      avatar_url,
      headline,
      experience,
      normalizeList(skills),
      normalizeList(languages),
      availability,
      req.user.id,
    ]
  );

  res.json({
    success: true,
    data: {
      user: result.rows[0]
    }
  });
};

/**
 * Upload avatar
 */
export const uploadAvatar = async (req, res) => {
  if (!req.file) {
    throw new BadRequestException('No file uploaded');
  }

  // Get the old avatar so it can be cleaned up after a successful upload.
  const oldUserResult = await query(
    'SELECT avatar_url FROM users WHERE id = $1',
    [req.user.id]
  );

  const oldAvatarUrl = oldUserResult.rows[0]?.avatar_url;

  // Store the new avatar on Cloudinary. The face-gravity crop keeps
  // portraits centred in the square avatar box.
  const uploaded = await uploadBuffer(req.file.buffer, {
    folder: CLOUDINARY_FOLDERS.avatars,
    public_id: `avatar-${req.user.id}-${Date.now()}`,
    overwrite: true,
    invalidate: true,
    transformation: [
      { width: 512, height: 512, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  const avatarUrl = uploaded.secure_url;

  // Update user's avatar_url in database
  const result = await query(
    `UPDATE users
     SET avatar_url = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING id, full_name, email, phone_number, avatar_url, 
               CAST(rating AS FLOAT) as rating, is_verified, is_admin`,
    [avatarUrl, req.user.id]
  );

  // Remove the previous image only after the new one is safely stored.
  if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
    if (oldAvatarUrl.startsWith('/uploads/')) {
      try {
        const oldFilePath = path.join(__dirname, '../..', oldAvatarUrl);
        await fs.unlink(oldFilePath);
      } catch (error) {
        // Ignore legacy or already-removed files.
        console.log('Could not delete old avatar:', error.message);
      }
    } else {
      await deleteImage(getPublicIdFromUrl(oldAvatarUrl));
    }
  }

  res.json({
    success: true,
    data: {
      user: result.rows[0],
      avatar_url: avatarUrl,
      message: 'Avatar uploaded successfully'
    }
  });
};

/**
 * Forgot password - Request password reset
 */
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  // Find user
  const result = await query(
    'SELECT id, full_name, email, is_deleted FROM users WHERE email = $1',
    [email]
  );

  // Always return success even if user doesn't exist (security best practice)
  if (result.rows.length === 0 || result.rows[0].is_deleted) {
    return res.json({
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.'
    });
  }

  const user = result.rows[0];
  const resetToken = generateResetToken();

  // Store reset token (expires in 1 hour)
  await query(
    `INSERT INTO verification_tokens (user_id, token, type, expires_at)
     VALUES ($1, $2, 'password_reset', NOW() + INTERVAL '1 hour')`,
    [user.id, resetToken]
  );

  // Send reset email
  try {
    await sendPasswordResetEmail(user.email, user.full_name, resetToken);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    // Don't throw error to avoid revealing email existence
  }

  res.json({
    success: true,
    message: 'If an account exists with this email, you will receive a password reset link.'
  });
};

/**
 * Reset password with token
 */
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  // Validate password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    throw new BadRequestException(passwordValidation.errors.join('. '));
  }

  // Find valid token
  const tokenResult = await query(
    `SELECT vt.user_id, vt.id as token_id, u.full_name, u.email
     FROM verification_tokens vt
     JOIN users u ON u.id = vt.user_id
     WHERE vt.token = $1 
       AND vt.type = 'password_reset'
       AND vt.used = false 
       AND vt.expires_at > NOW()
       AND u.is_deleted = false`,
    [token]
  );

  if (tokenResult.rows.length === 0) {
    throw new BadRequestException('Invalid or expired reset token');
  }

  const { user_id, token_id, full_name, email } = tokenResult.rows[0];

  // Hash new password
  const password_hash = await bcrypt.hash(newPassword, 10);

  // Update password
  await query(
    `UPDATE users 
     SET password_hash = $1, password_changed_at = NOW(), updated_at = NOW()
     WHERE id = $2`,
    [password_hash, user_id]
  );

  // Mark token as used
  await query(
    'UPDATE verification_tokens SET used = true WHERE id = $1',
    [token_id]
  );

  // Clear any failed login attempts
  clearFailedAttempts(email);

  // Send notification email
  try {
    await sendPasswordChangedEmail(email, full_name);
  } catch (error) {
    console.error('Failed to send password changed email:', error);
  }

  res.json({
    success: true,
    message: 'Password reset successfully. You can now login with your new password.'
  });
};

/**
 * Change password (authenticated user)
 */
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new BadRequestException('Current password and new password are required');
  }

  // Validate new password strength
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    throw new BadRequestException(passwordValidation.errors.join('. '));
  }

  // Get user with current password
  const result = await query(
    'SELECT id, email, full_name, password_hash FROM users WHERE id = $1',
    [req.user.id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundException('User not found');
  }

  const user = result.rows[0];

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedException('Current password is incorrect');
  }

  // Check if new password is same as current
  const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
  if (isSamePassword) {
    throw new BadRequestException('New password must be different from current password');
  }

  // Hash new password
  const password_hash = await bcrypt.hash(newPassword, 10);

  // Update password
  await query(
    `UPDATE users 
     SET password_hash = $1, password_changed_at = NOW(), updated_at = NOW()
     WHERE id = $2`,
    [password_hash, user.id]
  );

  // Send notification email
  try {
    await sendPasswordChangedEmail(user.email, user.full_name);
  } catch (error) {
    console.error('Failed to send password changed email:', error);
  }

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
};

/**
 * Setup 2FA - Generate QR code
 */
export const setup2FA = async (req, res) => {
  const userId = req.user.id;

  // Get user info
  const result = await query(
    'SELECT email, full_name, two_factor_enabled FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundException('User not found');
  }

  const user = result.rows[0];

  if (user.two_factor_enabled) {
    throw new BadRequestException('Two-factor authentication is already enabled');
  }

  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `TaskMtaa (${user.email})`,
    issuer: 'TaskMtaa'
  });

  // Store secret temporarily (will be confirmed on verification)
  await query(
    'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
    [secret.base32, userId]
  );

  // Generate QR code
  const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

  res.json({
    success: true,
    data: {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntry: secret.otpauth_url
    }
  });
};

/**
 * Verify and enable 2FA
 */
export const verify2FA = async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;

  if (!code) {
    throw new BadRequestException('Verification code is required');
  }

  // Get user secret
  const result = await query(
    'SELECT email, full_name, two_factor_secret, two_factor_enabled FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundException('User not found');
  }

  const user = result.rows[0];

  if (user.two_factor_enabled) {
    throw new BadRequestException('Two-factor authentication is already enabled');
  }

  if (!user.two_factor_secret) {
    throw new BadRequestException('Please setup 2FA first');
  }

  // Verify code
  const verified = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: code,
    window: 2
  });

  if (!verified) {
    throw new UnauthorizedException('Invalid verification code');
  }

  // Generate backup codes
  const backupCodes = generateBackupCodes();
  const hashedCodes = await Promise.all(
    backupCodes.map(code => bcrypt.hash(code, 10))
  );

  // Store backup codes
  for (const hashedCode of hashedCodes) {
    await query(
      'INSERT INTO two_factor_backup_codes (user_id, code_hash) VALUES ($1, $2)',
      [userId, hashedCode]
    );
  }

  // Enable 2FA
  await query(
    'UPDATE users SET two_factor_enabled = true WHERE id = $1',
    [userId]
  );

  // Send confirmation email
  try {
    await send2FASetupEmail(user.email, user.full_name);
  } catch (error) {
    console.error('Failed to send 2FA setup email:', error);
  }

  res.json({
    success: true,
    message: '2FA enabled successfully',
    data: {
      backupCodes
    }
  });
};

/**
 * Disable 2FA
 */
export const disable2FA = async (req, res) => {
  const { password } = req.body;
  const userId = req.user.id;

  if (!password) {
    throw new BadRequestException('Password is required to disable 2FA');
  }

  // Get user
  const result = await query(
    'SELECT password_hash, two_factor_enabled FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundException('User not found');
  }

  const user = result.rows[0];

  if (!user.two_factor_enabled) {
    throw new BadRequestException('Two-factor authentication is not enabled');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedException('Invalid password');
  }

  // Disable 2FA and clear secret
  await query(
    `UPDATE users 
     SET two_factor_enabled = false, two_factor_secret = NULL 
     WHERE id = $1`,
    [userId]
  );

  // Delete backup codes
  await query(
    'DELETE FROM two_factor_backup_codes WHERE user_id = $1',
    [userId]
  );

  res.json({
    success: true,
    message: '2FA disabled successfully'
  });
};

/**
 * Get 2FA status
 */
export const get2FAStatus = async (req, res) => {
  const userId = req.user.id;

  const result = await query(
    `SELECT two_factor_enabled, 
            (SELECT COUNT(*) FROM two_factor_backup_codes WHERE user_id = $1 AND used = false) as unused_backup_codes
     FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundException('User not found');
  }

  res.json({
    success: true,
    data: {
      enabled: result.rows[0].two_factor_enabled,
      unusedBackupCodes: parseInt(result.rows[0].unused_backup_codes)
    }
  });
};
