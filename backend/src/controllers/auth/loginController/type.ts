// Response types

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    isVerified: boolean;
    isTwoFactorEnabled: boolean;
  };
  session: {
    id: string;
    ipAddress: string;
    deviceType: string | null;
    deviceName: string | null;
    browser: string | null;
    os: string | null;
    accessToken: string;
    refreshToken: string;
  };
}
