import nodemailer from 'nodemailer';
import { config } from '../config/env';

// Check if email is configured
const isEmailConfigured = () => {
  return process.env.EMAIL_HOST && 
         process.env.EMAIL_USER && 
         process.env.EMAIL_PASS && 
         process.env.EMAIL_USER !== 'your-email@gmail.com';
};

// Create transporter only if email is configured
let transporter: nodemailer.Transporter | null = null;

if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}
// Verify connection on startup
if (transporter) {
  transporter.verify((error) => {
    if (error) {
      console.error('❌ Email service error:', error.message);
      console.log('💡 Check EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env');
    } else {
      console.log('✅ Email service ready — using', process.env.EMAIL_USER);
    }
  });
}

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  // Always log to console for development/demo
  console.log('\n' + '='.repeat(70));
  console.log('🔐 PASSWORD RESET REQUEST');
  console.log('='.repeat(70));
  console.log(`📧 To: ${email}`);
  console.log(`🔗 Reset Link: ${resetUrl}`);
  console.log(`⏰ Expires: 1 hour`);
  console.log('='.repeat(70) + '\n');
  
  // Try to send real email if configured
  if (transporter && isEmailConfigured()) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@tabletennis.com',
        to: email,
        subject: 'Password Reset Request - Table Tennis Tournament System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0284c7;">Password Reset Request</h2>
            <p>You requested to reset your password for your Table Tennis Tournament System account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Reset Password
            </a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr />
            <p style="font-size: 12px; color: #666;">Table Tennis Tournament Management System</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      console.log('📝 Reset link is still available in the console above');
    }
  } else {
    console.log('📧 Email service not configured. Using console log only.');
    console.log('💡 To enable real email, configure EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env');
  }
  
  return { message: 'Password reset link generated (check console for link)' };
};
export const sendVerificationEmail = async (email: string, token: string, firstName: string) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  // Always log for development
  console.log('\n' + '='.repeat(70));
  console.log('📧 EMAIL VERIFICATION');
  console.log('='.repeat(70));
  console.log(`To: ${email}`);
  console.log(`Verify Link: ${verifyUrl}`);
  console.log('='.repeat(70) + '\n');

  if (transporter && isEmailConfigured()) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@tabletennis.com',
        to: email,
        subject: 'Verify your email — Table Tennis Tournament',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="text-align:center;margin-bottom:24px;">
              <h1 style="color:#0f172a;font-size:28px;margin:0;">🏓 Table Tennis Tournament</h1>
            </div>
            <div style="background:#f8fafc;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
              <h2 style="color:#0f172a;margin:0 0 12px;">Hi ${firstName}! Verify your email</h2>
              <p style="color:#475569;font-size:15px;line-height:1.6;">
                Thanks for registering. Please verify your email address to activate your account.
              </p>
              <div style="text-align:center;margin:28px 0;">
                <a href="${verifyUrl}"
                   style="background:#0f172a;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
                  ✅ Verify Email Address
                </a>
              </div>
              <p style="color:#94a3b8;font-size:13px;text-align:center;">
                This link expires in 24 hours. If you didn't register, ignore this email.
              </p>
            </div>
          </div>
        `,
      });
      console.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
    }
  }
};

export const sendWelcomeEmail = async (email: string, firstName: string) => {
  console.log('\n' + '='.repeat(70));
  console.log('📧 WELCOME EMAIL');
  console.log('='.repeat(70));
  console.log(`To: ${email}`);
  console.log('='.repeat(70) + '\n');

  if (transporter && isEmailConfigured()) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@tabletennis.com',
        to: email,
        subject: 'Welcome to Table Tennis Tournament System! 🏓',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #061D23; color: #ffffff; padding: 20px; border-radius: 10px;">
            <h2 style="color: #4AEEFF; text-align: center;">Welcome ${firstName}! 🏓</h2>
            <p style="color: #D8FBFF; font-size: 16px;">We are thrilled to have you join our Table Tennis Tournament Platform.</p>
            <p style="color: #D8FBFF; font-size: 16px;">You can now browse tournaments, view live scores, and track your global rank!</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #12679E; color: white; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
            </div>
          </div>
        `,
      });
      console.log(`✅ Welcome email sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
    }
  }
};