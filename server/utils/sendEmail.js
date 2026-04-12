import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

export const sendEmail = async ({ to, subject, html }) => {
  try {
    // Determine if we should attempt actual sending or mock it
    const hasCredentials = process.env.SMTP_USER && process.env.SMTP_PASS;
    
    if (!hasCredentials) {
      logger.warn(`[Mock Email] No SMTP credentials in .env. Faking email to: ${to}`);
      logger.info(`[Mock Email] Subject: ${subject}`);
      logger.info(`[Mock Email] Content: ${html}`);
      return { success: true, mocked: true };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // Forces connection over port 587 to bypass Render's port 465 blocks
      requireTLS: true,
      family: 4, // Force IPv4 to bypass Render's broken IPv6 Dual-Stack (ENETUNREACH 2404)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"Antigravity NLP" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email sending failed', { error: error.message });
    throw error;
  }
};
