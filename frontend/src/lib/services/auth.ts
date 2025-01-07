import { axiosInstance } from "@/lib/axios";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
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

export const authService = {
  login: async (data: LoginInput): Promise<AuthResponse["data"]> => {
    const response = await axiosInstance.post<AuthResponse>("/auth/login", data);
    return response.data.data;
  },

  register: async (data: RegisterInput): Promise<AuthResponse["data"]> => {
    const response = await axiosInstance.post<AuthResponse>("/auth/register", data);
    return response.data.data;
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
}; 