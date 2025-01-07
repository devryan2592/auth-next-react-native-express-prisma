import { createTransport } from 'nodemailer';
import { config } from '@/config';

const transporter = createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

export async function sendTwoFactorCode(email: string, code: string) {
  const mailOptions = {
    from: config.email.from,
    to: email,
    subject: '2FA Verification Code',
    html: `
      <h1>Two-Factor Authentication Code</h1>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// ... existing email functions ... 