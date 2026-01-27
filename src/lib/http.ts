import axios from "axios";
import { signOut } from "next-auth/react";
export const isTokenExpired = (token: string): boolean => {
  if (!token) return true;
  const decodedToken = JSON.parse(atob(token.split(".")[1]));
  return decodedToken.exp * 1000 < Date.now();
};

export const refreshAccessToken = async (refreshToken: string) => {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/token`,
      new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "",
        client_secret: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET || "",
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    );
    return response.data;
  } catch (error) {
    console.error("Error refreshing token", error);
    throw error;
  }
};

const request = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PROJECTS_API,
});

request.interceptors.request.use(
  async (config) => {
    config.headers["Authorization"] = "";
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsedData = JSON.parse(userData);
      const token = parsedData.access_token;
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.setItem("userData", JSON.stringify({}));
      signOut();
    }
    return Promise.reject(error);
  },
);

export const http = {
  get: <T>(endpoint: string, params?: Record<string, unknown>) =>
    request.get<T>(endpoint, { params }),

  post: <T>(
    endpoint: string,
    data?: Record<string, unknown> | FormData | any,
    timeout?: number,
    config?: any,
  ) => request.post<T>(endpoint, data, { timeout, ...config }),

  put: <T>(endpoint: string, data?: Record<string, unknown> | FormData | any) =>
    request.put<T>(endpoint, data),

  delete: <T>(endpoint: string, data?: Record<string, unknown> | any) =>
    request.delete<T>(endpoint, { data }),

  patch: <T>(endpoint: string, data?: Record<string, unknown>) =>
    request.patch<T>(endpoint, data),
};

export default request;
