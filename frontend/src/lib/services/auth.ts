import { axiosInstance } from "@/lib/axios";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  isVerified: boolean;
  isTwoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RegisterResponse {
  success: string;
  message: string;
  data: {
    id: string;
    email: string;
    createdAt: Date;
  };
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

interface VerifyEmailResponse {
  success: boolean;
  message: string;
  data: {
    email: string;
    isVerified: boolean;
  };
}

interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export const authService = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>("/auth/login", data, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    return response.data;
  },

  register: async (data: RegisterInput): Promise<RegisterResponse> => {
    const response = await axiosInstance.post<RegisterResponse>("/auth/register", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post("/auth/logout");
  },

  refreshToken: async (): Promise<{ accessToken: string }> => {
    const response = await axiosInstance.post("/auth/refresh-token");
    return response.data.data;
  },

  logoutAll: async (): Promise<void> => {
    await axiosInstance.post("/auth/logout-all");
  },

  verifyEmail: async (userId: string, token: string): Promise<VerifyEmailResponse> => {
    const response = await axiosInstance.post<VerifyEmailResponse>(`/auth/verify-email/${userId}/${token}`);
    return response.data;
  },

  resendVerification: async (email: string): Promise<ResendVerificationResponse> => {
    const response = await axiosInstance.post<ResendVerificationResponse>('/auth/resend-verification', { email });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<ForgotPasswordResponse> => {
    const response = await axiosInstance.post<ForgotPasswordResponse>('/auth/request-password-reset', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<ResetPasswordResponse> => {
    const response = await axiosInstance.post<ResetPasswordResponse>('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
}; 