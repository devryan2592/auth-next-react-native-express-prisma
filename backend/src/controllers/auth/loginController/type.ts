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
    accessToken: string;
    refreshToken: string;
  };
}
