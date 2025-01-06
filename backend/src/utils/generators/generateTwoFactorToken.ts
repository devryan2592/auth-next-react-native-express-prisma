/**
 * Generate a 6-digit two-factor authentication token
 */
export function generateTwoFactorToken() {
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  return { token, expiresAt };
} 