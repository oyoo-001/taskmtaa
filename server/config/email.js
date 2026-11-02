import { createTransport } from 'nodemailer';

const isProduction = process.env.NODE_ENV === 'production';

// Create transporter
const transporter = createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send email verification link
 * @param {string} email - Recipient email
 * @param {string} fullName - User's full name
 * @param {string} token - Verification token
 */
export async function sendEmailVerification(email, fullName, token) {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to TaskMtaa!</h2>
      <p>Hi ${fullName},</p>
      <p>Thank you for registering with TaskMtaa. Please verify your email address to activate your account.</p>
      <p style="margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email Address
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link into your browser:<br>
        <a href="${verificationUrl}">${verificationUrl}</a>
      </p>
      <p style="color: #666; font-size: 14px;">
        This link will expire in 24 hours. If you didn't create an account with TaskMtaa, please ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        TaskMtaa - Hyperlocal Micro-Task Marketplace<br>
        Connecting local task posters with nearby taskers
      </p>
    </div>
  `;
  
  if (!isProduction) {
    // Development mode: log to console
    console.log('📧 [EMAIL - DEV MODE]');
    console.log(`   To: ${email}`);
    console.log(`   Subject: Verify your TaskMtaa email`);
    console.log(`   Verification URL: ${verificationUrl}`);
    return { success: true, messageId: 'dev-mode-' + Date.now() };
  }
  
  try {
    const info = await transporter.sendMail({
      from: `"TaskMtaa" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify your TaskMtaa email',
      html: html,
    });
    
    console.log('📧 Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('📧 Email sending failed:', error);
    throw error;
  }
}

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} fullName - User's full name
 * @param {string} token - Reset token
 */
export async function sendPasswordResetEmail(email, fullName, token) {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Password Reset Request</h2>
      <p>Hi ${fullName},</p>
      <p>We received a request to reset your TaskMtaa password.</p>
      <p style="margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        Or copy and paste this link into your browser:<br>
        <a href="${resetUrl}">${resetUrl}</a>
      </p>
      <p style="color: #666; font-size: 14px;">
        This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        TaskMtaa Security Team
      </p>
    </div>
  `;
  
  if (!isProduction) {
    console.log('📧 [EMAIL - DEV MODE]');
    console.log(`   To: ${email}`);
    console.log(`   Subject: Reset your TaskMtaa password`);
    console.log(`   Reset URL: ${resetUrl}`);
    return { success: true, messageId: 'dev-mode-' + Date.now() };
  }
  
  try {
    const info = await transporter.sendMail({
      from: `"TaskMtaa Security" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset your TaskMtaa password',
      html: html,
    });
    
    console.log('📧 Password reset email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('📧 Password reset email failed:', error);
    throw error;
  }
}

/**
 * Send password changed notification
 */
export async function sendPasswordChangedEmail(email, fullName) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Password Changed</h2>
      <p>Hi ${fullName},</p>
      <p>Your TaskMtaa password was successfully changed.</p>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        If you didn't make this change, please contact support immediately.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">TaskMtaa Security Team</p>
    </div>
  `;
  
  if (!isProduction) {
    console.log('📧 [EMAIL - DEV MODE] Password changed notification sent to:', email);
    return { success: true };
  }
  
  try {
    const info = await transporter.sendMail({
      from: `"TaskMtaa Security" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your TaskMtaa password was changed',
      html: html,
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('📧 Password changed email failed:', error);
    throw error;
  }
}

/**
 * Send 2FA setup email
 */
export async function send2FASetupEmail(email, fullName) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Two-Factor Authentication Enabled</h2>
      <p>Hi ${fullName},</p>
      <p>Two-factor authentication has been successfully enabled on your TaskMtaa account.</p>
      <p>Your account is now more secure! You'll need your authenticator app to login from now on.</p>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        If you didn't enable 2FA, please contact support immediately.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">TaskMtaa Security Team</p>
    </div>
  `;
  
  if (!isProduction) {
    console.log('📧 [EMAIL - DEV MODE] 2FA Setup notification sent to:', email);
    return { success: true };
  }
  
  try {
    const info = await transporter.sendMail({
      from: `"TaskMtaa Security" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Two-Factor Authentication Enabled',
      html: html,
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('📧 2FA email failed:', error);
    throw error;
  }
}
