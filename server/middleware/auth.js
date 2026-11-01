import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { UnauthorizedException, ForbiddenException } from './errorHandler.js';

/**
 * JWT Authentication middleware
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    let token = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Check cookies as fallback
    if (!token && req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      throw new UnauthorizedException('Access token required');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load the current account state so suspensions and admin rights
    // take effect immediately instead of waiting for the token to expire.
    const result = await query(
      `SELECT id, email, is_admin, is_suspended, suspension_reason
       FROM users
       WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('User account no longer exists');
    }

    const dbUser = result.rows[0];

    if (dbUser.is_suspended) {
      throw new ForbiddenException(
        dbUser.suspension_reason
          ? `Your account has been suspended: ${dbUser.suspension_reason}`
          : 'Your account has been suspended'
      );
    }

    // Attach user info to request
    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      isAdmin: dbUser.is_admin === true
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedException('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedException('Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Admin-only middleware
 * Must be used after authenticateToken
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return next(new ForbiddenException('Admin access required'));
  }
  next();
};


/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if missing
 */
export const optionalAuth = (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    if (!token && req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.userId,
        email: decoded.email
      };
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

/**
 * Generate access token
 */
export const generateAccessToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }  // Changed from 15m to 24h
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }  // Changed from 7d to 30d
  );
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};
