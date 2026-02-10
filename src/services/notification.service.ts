import log from '@/lib/log';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

export class NotificationService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  private static twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

  static async sendEmail(to: string, subject: string, html: string) {
    try {
      if (!process.env.SMTP_USER) {
        log('⚠️ NotificationService: SMTP_USER not configured, skipping email.');
        return false;
      }

      await this.transporter.sendMail({
        from: `"FleetManager" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });

      log(`✅ Email sent to ${to}`);
      return true;
    } catch (error) {
      log(`❌ Error sending email to ${to}:`, error);
      return false;
    }
  }

  static async sendSMS(to: string, body: string) {
    try {
      if (!this.twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
        log('⚠️ NotificationService: Twilio not configured, skipping SMS.');
        return false;
      }

      await this.twilioClient.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });

      log(`✅ SMS sent to ${to}`);
      return true;
    } catch (error) {
      log(`❌ Error sending SMS to ${to}:`, error);
      return false;
    }
  }
}
