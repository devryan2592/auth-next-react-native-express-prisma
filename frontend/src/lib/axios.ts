import axios from "axios";
import { useAuthStore } from "@/lib/stores/auth";
import Cookies from "js-cookie";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    const cookieAccessToken = Cookies.get('accessToken')
      ?.split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1] || null;

    const token = accessToken || cookieAccessToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     // If the error is 401 and we haven't retried yet
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         // Try to refresh the token
//         const response = await axiosInstance.post("/auth/refresh-token");
//         const { accessToken } = response.data.data;

//         // Update the token in the store
//         useAuthStore.getState().setAccessToken(accessToken);

//         // Update the original request with the new token
//         originalRequest.headers.Authorization = `Bearer ${accessToken}`;
//         return axiosInstance(originalRequest);
//       } catch (refreshError) {
//         // If refresh fails, log out the user
//         useAuthStore.getState().logout();
//         window.location.href = "/auth/login";
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// ); 