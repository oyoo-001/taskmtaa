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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Register new user
 */
export const register = async (req, res) => {
  const { full_name, email, phone_number, password } = req.body;

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
    `INSERT INTO users (full_name, email, phone_number, password_hash)
     VALUES ($1, $2, $3, $4)
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
  const { email, password } = req.body;

  // Find user
  const result = await query(
    `SELECT id, full_name, email, phone_number, password_hash, avatar_url, 
            CAST(rating AS FLOAT) as rating, is_verified, is_admin, is_suspended,
            suspension_reason, created_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedException('Invalid email or password');
  }

  const user = result.rows[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw new UnauthorizedException('Invalid email or password');
  }

  // Block suspended accounts from signing in
  if (user.is_suspended) {
    throw new ForbiddenException(
      user.suspension_reason
        ? `Your account has been suspended: ${user.suspension_reason}`
        : 'Your account has been suspended'
    );
  }

  // Remove password hash from response
  delete user.password_hash;
  delete user.suspension_reason;

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
