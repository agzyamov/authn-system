import nodemailer, { type Transporter } from 'nodemailer';
import type { EmailService } from './EmailService.js';
import type { User } from '../models/User.js';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Nodemailer-based email service implementation.
 * Sends transactional emails via SMTP.
 */
export class NodemailerEmailService implements EmailService {
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  /**
   * Sends a welcome email to a newly registered user.
   */
  async sendWelcome(user: User): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: config.smtp.from,
        to: user.email,
        subject: 'Welcome to AuthN System',
        text: `Hello!\n\nYour account has been created successfully.\n\nYou can now log in at ${config.appUrl}.\n\nBest regards,\nAuthN System`,
        html: `
          <h2>Welcome to AuthN System!</h2>
          <p>Your account has been created successfully.</p>
          <p>You can now <a href="${config.appUrl}/login">log in here</a>.</p>
          <br>
          <p>Best regards,<br>AuthN System</p>
        `,
      });
      logger.debug({ userId: user.id }, 'Welcome email sent');
    } catch (err) {
      logger.error({ err, userId: user.id }, 'Failed to send welcome email');
      // Don't throw — email failure shouldn't block registration
    }
  }

  /**
   * Sends a password reset email with a time-limited link.
   * The reset link is valid for the specified number of hours.
   */
  async sendPasswordReset(user: User, resetToken: string, expiryHours: number): Promise<void> {
    const resetUrl = `${config.appUrl}/reset-password?token=${resetToken}`;

    try {
      await this.transporter.sendMail({
        from: config.smtp.from,
        to: user.email,
        subject: 'Password Reset Request',
        text: `
You requested a password reset.

Click the link below to reset your password (valid for ${expiryHours} hour(s)):
${resetUrl}

If you did not request a password reset, please ignore this email.
Your password will not be changed until you access the link above.
        `,
        html: `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset.</p>
          <p>Click the button below to reset your password (valid for <strong>${expiryHours} hour(s)</strong>):</p>
          <p><a href="${resetUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;">Reset Password</a></p>
          <p>Or copy this URL: <code>${resetUrl}</code></p>
          <hr>
          <p><small>If you did not request a password reset, you can safely ignore this email.</small></p>
        `,
      });
      logger.debug({ userId: user.id }, 'Password reset email sent');
    } catch (err) {
      logger.error({ err, userId: user.id }, 'Failed to send password reset email');
      throw new Error('Failed to send password reset email');
    }
  }
}
