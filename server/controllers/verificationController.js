import { query } from '../config/database.js';
import { sendOTP, generateOTP } from '../config/sms.js';
import { sendEmailVerification, send2FASetupEmail } from '../config/email.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Send phone verification OTP
 */
export async function sendPhoneVerification(req, res) {
  try {
    const userId = req.user.id;
    const { phoneNumber } = req.body;
    
    // Validate phone number format (Kenya: +254XXXXXXXXX)
    if (!phoneNumber || !phoneNumber.match(/^\+254\d{9}$/)) {
      return res.status(400).json({ 
        message: 'Invalid phone number format. Use +254XXXXXXXXX' 
      });
    }
    
    // Update user's phone number
    await query(
      'UPDATE users SET phone_number = $1 WHERE id = $2',
      [phoneNumber, userId]
    );
    
    // Generate OTP
    const code = generateOTP();
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    // Store OTP
    await query(
      `INSERT INTO verification_tokens (user_id, token, type, code, expires_at)
       VALUES ($1, $2, 'phone', $3, $4)`,
      [userId, token, code, expiresAt]
    );
    
    // Send SMS
    await sendOTP(phoneNumber, code);
    
    res.json({ 
      message: 'Verification code sent to your phone',
      token // Return token for verification
    });
  } catch (error) {
    console.error('Send phone verification error:', error);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
}

/**
 * Verify phone OTP
 */
export async function verifyPhone(req, res) {
  try {
    const userId = req.user.id;
    const { token, code } = req.body;
    
    // Find token
    const tokenResult = await query(
      `SELECT * FROM verification_tokens 
       WHERE token = $1 AND user_id = $2 AND type = 'phone' AND used = false
       AND expires_at > NOW()`,
      [token, userId]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    
    const tokenData = tokenResult.rows[0];
    
    // Verify code
    if (tokenData.code !== code) {
      return res.status(400).json({ message: 'Incorrect verification code' });
    }
    
    // Mark phone as verified
    await query(
      'UPDATE users SET phone_verified = true WHERE id = $1',
      [userId]
    );
    
    // Mark token as used
    await query(
      'UPDATE verification_tokens SET used = true WHERE id = $1',
      [tokenData.id]
    );
    
    res.json({ message: 'Phone number verified successfully' });
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({ message: 'Phone verification failed' });
  }
}

/**
 * Send email verification
 */
export async function sendEmailVerificationLink(req, res) {
  try {
    const userId = req.user.id;
    
    // Get user info
    const userResult = await query(
      'SELECT email, full_name FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { email, full_name } = userResult.rows[0];
    
    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Store token
    await query(
      `INSERT INTO verification_tokens (user_id, token, type, expires_at)
       VALUES ($1, $2, 'email', $3)`,
      [userId, token, expiresAt]
    );
    
    // Send email
    await sendEmailVerification(email, full_name, token);
    
    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(500).json({ message: 'Failed to send verification email' });
  }
}

/**
 * Verify email token
 */
export async function verifyEmail(req, res) {
  try {
    const { token } = req.query;
    
    // Find token
    const tokenResult = await query(
      `SELECT * FROM verification_tokens 
       WHERE token = $1 AND type = 'email' AND used = false
       AND expires_at > NOW()`,
      [token]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }
    
    const tokenData = tokenResult.rows[0];
    
    // Mark email as verified
    await query(
      'UPDATE users SET email_verified = true WHERE id = $1',
      [tokenData.user_id]
    );
    
    // Mark token as used
    await query(
      'UPDATE verification_tokens SET used = true WHERE id = $1',
      [tokenData.id]
    );
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Email verification failed' });
  }
}

/**
 * Setup 2FA - Generate secret and QR code
 */
export async function setup2FA(req, res) {
  try {
    const userId = req.user.id;
    
    // Get user info
    const userResult = await query(
      'SELECT email, full_name, two_factor_enabled FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    if (user.two_factor_enabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `TaskMtaa (${user.email})`,
      issuer: 'TaskMtaa',
    });
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    // Temporarily store secret (not yet enabled)
    await query(
      'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
      [secret.base32, userId]
    );
    
    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      backupCodes.push(code);
      
      const token = crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      
      await query(
        `INSERT INTO verification_tokens (user_id, token, type, code, expires_at)
         VALUES ($1, $2, 'backup_code', $3, $4)`,
        [userId, token, code, expiresAt]
      );
    }
    
    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: backupCodes,
      message: 'Scan QR code with your authenticator app, then verify to enable 2FA',
    });
  } catch (error) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({ message: 'Failed to setup 2FA' });
  }
}

/**
 * Enable 2FA - Verify code and activate
 */
export async function enable2FA(req, res) {
  try {
    const userId = req.user.id;
    const { code } = req.body;
    
    // Get user's secret
    const userResult = await query(
      'SELECT two_factor_secret, email, full_name FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    if (!user.two_factor_secret) {
      return res.status(400).json({ message: 'Please setup 2FA first' });
    }
    
    // Verify code
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 2 time-step tolerance
    });
    
    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    // Enable 2FA
    await query(
      'UPDATE users SET two_factor_enabled = true WHERE id = $1',
      [userId]
    );
    
    // Send confirmation email
    await send2FASetupEmail(user.email, user.full_name);
    
    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ message: 'Failed to enable 2FA' });
  }
}

/**
 * Disable 2FA
 */
export async function disable2FA(req, res) {
  try {
    const userId = req.user.id;
    const { password } = req.body;
    
    // Verify password (security check)
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const bcrypt = (await import('bcryptjs')).default;
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ message: 'Incorrect password' });
    }
    
    // Disable 2FA
    await query(
      'UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1',
      [userId]
    );
    
    // Delete backup codes
    await query(
      `DELETE FROM verification_tokens 
       WHERE user_id = $1 AND type = 'backup_code'`,
      [userId]
    );
    
    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ message: 'Failed to disable 2FA' });
  }
}

/**
 * Verify 2FA code (used during login)
 */
export async function verify2FA(req, res) {
  try {
    const { userId, code } = req.body;
    
    // Get user's secret
    const userResult = await query(
      'SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    if (!user.two_factor_enabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }
    
    // Check if it's a backup code
    const backupResult = await query(
      `SELECT * FROM verification_tokens 
       WHERE user_id = $1 AND type = 'backup_code' AND code = $2 AND used = false`,
      [userId, code.toUpperCase()]
    );
    
    if (backupResult.rows.length > 0) {
      // Valid backup code
      await query(
        'UPDATE verification_tokens SET used = true WHERE id = $1',
        [backupResult.rows[0].id]
      );
      return res.json({ verified: true, usedBackupCode: true });
    }
    
    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });
    
    if (!verified) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    res.json({ verified: true });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ message: '2FA verification failed' });
  }
}
