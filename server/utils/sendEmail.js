import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

export const sendEmail = async ({ to, subject, html }) => {
  // Determine if we should attempt actual sending or mock it
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const hasCredentials = smtpUser && smtpPass;

  if (!hasCredentials) {
    logger.warn(`[Mock Email] No SMTP credentials in .env. Faking email to: ${to}`);
    logger.info(`[Mock Email] Subject: ${subject}`);
    logger.info(`[Mock Email] Content: ${html}`);
    return { success: true, mocked: true };
  }

  const smtpPort = parseInt(process.env.SMTP_PORT, 10) || 587;
  const isSecure = smtpPort === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: smtpPort,
    secure: isSecure, // true for 465, false for other ports
    requireTLS: !isSecure,
    family: 4, // Force IPv4 to bypass Render's broken IPv6 Dual-Stack (ENETUNREACH 2404)
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    // Use proper TLS validation (no rejectUnauthorized: false)
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  // Verify SMTP connection before attempting to send
  try {
    await transporter.verify();
    logger.info('SMTP connection verified successfully');
  } catch (verifyError) {
    logger.warn('SMTP connection verification failed. Email sending may fail.', {
      error: verifyError.message,
      code: verifyError.code,
    });
    // We don't throw here. We let sendMail try and fail, which we will handle gracefully.
  }

  const mailOptions = {
    from: `"Antigravity NLP" <${smtpUser}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (sendError) {
    logger.error('Email sending failed', {
      error: sendError.message,
      code: sendError.code,
      command: sendError.command,
      to,
    });
    throw new Error(`Email sending failed: ${sendError.message}`);
  }
};
