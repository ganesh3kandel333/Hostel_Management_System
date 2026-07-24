import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

// Transporter setup with fallback logging behavior
const getTransporter = async () => {
  const isMock =
    !process.env.SMTP_HOST ||
    process.env.SMTP_HOST === 'smtp.ethereal.email' ||
    process.env.SMTP_USER === 'mockuser@ethereal.email';

  if (isMock) {
    logger.info('Using Ethereal Mail mock transporter. Creating test account...');
    // Create ethereal mock account automatically
    try {
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      logger.warn(`Could not create Ethereal test account: ${err.message}. Email links will be printed to standard logs.`);
      return null;
    }
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Sends a password reset email
 */
export const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  logger.info(`--------------------------------------------------`);
  logger.info(`[EMAIL SIMULATOR] Password Reset Email for ${name} (${email}):`);
  logger.info(`Link: ${resetUrl}`);
  logger.info(`--------------------------------------------------`);

  const transporter = await getTransporter();
  if (!transporter) return;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Hostel Management System" <no-reply@hostel.com>',
    to: email,
    subject: 'Reset your Hostel Account Password',
    html: `
      <h2>Hello, ${name}!</h2>
      <p>We received a request to reset your password. If you didn't request this, you can ignore this email.</p>
      <p>Otherwise, click the button below to reset your password:</p>
      <a href="${resetUrl}" target="_blank" style="padding: 10px 20px; background-color: #e53e3e; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${resetUrl}</p>
      <br/>
      <p>This link will expire in 1 hour.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`[PREVIEW] View email preview: ${previewUrl}`);
    }
  } catch (error) {
    logger.error(`Error sending password reset email: ${error.message}`);
  }
};

/**
 * Sends login credentials to a newly created Hostel Admin (created directly by Super Admin)
 */
export const sendHostelAdminCredentialsEmail = async (email, name, tempPassword) => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

  logger.info(`--------------------------------------------------`);
  logger.info(`[EMAIL SIMULATOR] Hostel Admin Credentials for ${name} (${email}):`);
  logger.info(`Temporary Password: ${tempPassword}`);
  logger.info(`--------------------------------------------------`);

  const transporter = await getTransporter();
  if (!transporter) return;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Hostel Management System" <no-reply@hostel.com>',
    to: email,
    subject: 'Your Hostel Admin Account Has Been Created',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>A Super Admin has created a Hostel Admin account for you. You can log in immediately with the credentials below:</p>
      <p><strong>Email:</strong> ${email}<br/><strong>Temporary Password:</strong> ${tempPassword}</p>
      <a href="${loginUrl}" target="_blank" style="padding: 10px 20px; background-color: #00288e; color: white; text-decoration: none; border-radius: 5px; display: inline-block;">Log In</a>
      <p>For security, please change your password after logging in.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Hostel admin credentials email sent: ${info.messageId}`);
  } catch (error) {
    logger.error(`Error sending hostel admin credentials email: ${error.message}`);
  }
};

/**
 * Sends an email notification for Booking updates
 */
export const sendBookingNotificationEmail = async (email, name, status, hostelName, details = '') => {
  const transporter = await getTransporter();
  if (!transporter) return;

  const subject = `Hostel Booking Update: ${status.toUpperCase()}`;
  const htmlContent = `
    <h2>Booking Status Notification</h2>
    <p>Dear ${name},</p>
    <p>Your booking request for hostel <strong>${hostelName}</strong> has been updated to: <strong>${status.toUpperCase()}</strong>.</p>
    ${details ? `<p>Details/Remarks: ${details}</p>` : ''}
    <p>Please log in to your dashboard to view more details.</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Hostel Management System" <no-reply@hostel.com>',
    to: email,
    subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Booking notification email sent: ${info.messageId}`);
  } catch (error) {
    logger.error(`Error sending booking notification email: ${error.message}`);
  }
};
