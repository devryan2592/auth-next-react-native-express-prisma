import { axiosInstance } from "@/lib/axios";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
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
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
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

export const authService = {
  login: async (data: LoginInput): Promise<AuthResponse["data"]> => {
    const response = await axiosInstance.post<AuthResponse>("/auth/login", data);
    return response.data.data;
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
    const response = await axiosInstance.post<ForgotPasswordResponse>('/auth/forgot-password', { email });
    return response.data;
  },
}; 