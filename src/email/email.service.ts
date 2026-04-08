import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface WelcomeEmailData {
  to: string;
  name: string;
  password: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly plunkApiKey: string;
  private readonly fromEmail = 'noreply@chipperhr.com';

  constructor(private configService: ConfigService) {
    this.plunkApiKey = this.configService.get<string>('PLUNK_API_KEY') || '';
  }

  /**
   * Generic handler for sending emails via Plunk API
   */
  private async sendEmail(to: string, subject: string, bodyContent: string): Promise<boolean> {
    if (!this.plunkApiKey) {
      this.logger.warn(`Plunk API key not configured. Skipping email to ${to}`);
      this.logger.log(`[DEV ONLY] Subject: ${subject}`);
      return true; // Return success in dev mode to prevent blocking flows
    }

    try {
      const response = await fetch('https://api.useplunk.com/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.plunkApiKey}`,
        },
        body: JSON.stringify({
          to,
          subject,
          body: bodyContent, // Plunk specifically requires 'body' field
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Plunk API Error for ${subject} to ${to}: ${error}`);
        return false;
      }

      this.logger.log(`Successfully sent email: ${subject} to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`System Error sending email ${subject} to ${to}: ${error.message}`);
      return false;
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const { to, name, password } = data;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h1 style="color: #4F46E5; margin-bottom: 24px;">Welcome to ChipperHR!</h1>
        <p style="font-size: 16px; color: #374151;">Hi <strong>${name}</strong>,</p>
        <p style="font-size: 16px; color: #374151;">Your account has been created. Here are your login credentials:</p>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #f3f4f6;">
          <p style="margin: 0; font-size: 15px; color: #4b5563;"><strong>Email:</strong> ${to}</p>
          <p style="margin: 12px 0 0; font-size: 15px; color: #4b5563;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px; border: 1px solid #e5e7eb;">${password}</code></p>
        </div>
        <p style="font-size: 14px; color: #6b7280;"><strong>Important:</strong> You'll be required to change your password when you first log in for security reasons.</p>
        <div style="margin-top: 32px;">
          <a href="${process.env.APP_URL || 'http://localhost:3000'}" 
             style="display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Log In to ChipperHR
          </a>
        </div>
        <hr style="margin-top: 40px; border: 0; border-top: 1px solid #f3f4f6;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">
          If you didn't expect this email, please ignore it or contact your HR administrator.
        </p>
      </div>
    `;

    return this.sendEmail(to, 'Welcome to ChipperHR - Your Account Details', html);
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h1 style="color: #4F46E5; margin-bottom: 24px;">Password Reset</h1>
        <p style="font-size: 16px; color: #374151;">You requested a password reset for your ChipperHR account. Click the button below to set a new password:</p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${resetUrl}" 
             style="display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Reset My Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center; background: #fef3c7; padding: 8px; border-radius: 6px;">
          This link expires in <strong>1 hour</strong>.
        </p>
        <p style="font-size: 14px; color: #9ca3af; margin-top: 32px;">
          If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
    `;

    return this.sendEmail(to, 'ChipperHR - Password Reset Request', html);
  }
}
