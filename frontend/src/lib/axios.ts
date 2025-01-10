import axios from "axios";
import { useAuthStore } from "@/lib/stores/auth";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",

  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
});

// // Request interceptor
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const accessToken = useAuthStore.getState().accessToken;
//     const cookieAccessToken = Cookies.get('accessToken');

//     const token = accessToken || cookieAccessToken;

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Response interceptor
// axiosInstance.interceptors.response.use(
//   (response) => {
//     // Check for Set-Cookie header and manually set cookies if needed
//     const cookies = response.headers['set-cookie'];
//     if (cookies) {
//       cookies.forEach(cookie => {
//         const [name, value] = cookie.split('=');
//         Cookies.set(name, value, {
//           path: '/',
//           secure: process.env.NODE_ENV === 'production',
//           sameSite: 'lax'
//         });
//       });
//     }
//     return response;
//   },
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

// axiosInstance.interceptors.response.use(
//   (response) => {
//     console.log('Response headers:', response.headers);
//     console.log('Set-Cookie header:', response.headers['set-cookie']);
//     return response;
//   },
//   async (error) => {
//     const originalRequest = error.config;

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;

//       try {
//         const response = await axiosInstance.post("/auth/refresh-token");
//         const { accessToken } = response.data.data;

//         useAuthStore.getState().setAccessToken(accessToken);
//         originalRequest.headers.Authorization = `Bearer ${accessToken}`;
//         return axiosInstance(originalRequest);
//       } catch (refreshError) {
//         useAuthStore.getState().logout();
//         window.location.href = "/auth/login";
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );
