export interface TwoFactorResponse {
  twoFactorToken: string;
  userId: string;
  type: 'LOGIN' | 'PASSWORD_CHANGE';
}
