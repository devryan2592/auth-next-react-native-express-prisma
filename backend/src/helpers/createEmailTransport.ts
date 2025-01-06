import nodemailer from 'nodemailer';

/**
 * Creates an email transport using nodemailer
 * Uses Mailhog in development and TODO in production
 */
export function createEmailTransport() {
  if (process.env.NODE_ENV === 'production') {
    // TODO: Configure production email transport
    throw new Error('Production email transport not configured');
  }

  // Development transport using Mailhog
  return nodemailer.createTransport({
    host: 'localhost',
    port: 1025, // Default Mailhog SMTP port
    secure: false,
    
  });
}



