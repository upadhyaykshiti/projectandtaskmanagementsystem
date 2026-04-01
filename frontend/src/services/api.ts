


import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosHeaders,
} from "axios";
import { RefreshResponse } from "../types/api";

const BASE_URL = "http://localhost:4000";

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// ─── Token storage ─────────────────────────────────────────

export const tokenStore = {
  getAccess: () => localStorage.getItem("access_token"),
  getRefresh: () => localStorage.getItem("refresh_token"),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
  },
  clear: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  },
};

// ─── GLOBAL REFRESH LOCK ───────────────────────────────────

let refreshPromise: Promise<string> | null = null;

// ─── REQUEST INTERCEPTOR ───────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess();

  if (token) {
    if (!config.headers) config.headers = new AxiosHeaders();

    (config.headers as AxiosHeaders).set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  return config;
});

// ─── RESPONSE INTERCEPTOR ──────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    console.log("❌ 401 detected for:", originalRequest.url);

    // prevent infinite loop
    if (originalRequest.url?.includes("/auth/refresh")) {
      tokenStore.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = tokenStore.getRefresh();

    if (!refreshToken) {
      tokenStore.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    try {
      // ─── GLOBAL LOCK ─────────────────────────────────────

      if (!refreshPromise) {
        console.log("🔄 Starting SINGLE refresh call");

        refreshPromise = axios
          .post<{
            success: boolean;
            data: RefreshResponse;
          }>(`${BASE_URL}/api/auth/refresh`, { refreshToken })
          .then((res) => {
            const { accessToken, refreshToken: newRefresh } = res.data.data;

            console.log("✅ GLOBAL REFRESH SUCCESS");

            tokenStore.setTokens(accessToken, newRefresh);

            api.defaults.headers.common[
              "Authorization"
            ] = `Bearer ${accessToken}`;

            return accessToken;
          })
          .catch((err) => {
            console.log("❌ GLOBAL REFRESH FAILED");

            tokenStore.clear();
            window.location.href = "/login";
            throw err;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      // ⏳ All requests wait here
      const newToken = await refreshPromise;

      console.log("🟢 Retrying request:", originalRequest.url);

      if (!originalRequest.headers) {
        originalRequest.headers = new AxiosHeaders();
      }

      (originalRequest.headers as AxiosHeaders).set(
        "Authorization",
        `Bearer ${newToken}`
      );

      return api.request(originalRequest);
    } catch (err) {
      return Promise.reject(err);
    }
  }
);