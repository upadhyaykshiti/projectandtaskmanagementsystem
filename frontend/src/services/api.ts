// import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
// import { RefreshResponse } from "../types/api";

// // const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// const BASE_URL = "http://localhost:4000";


// export const api = axios.create({
//   baseURL: `${BASE_URL}/api`,
//   headers: { "Content-Type": "application/json" },
// });

// // ─── Token storage ────────────────────────────────────────────────────────────

// export const tokenStore = {
//   getAccess: () => localStorage.getItem("access_token"),
//   getRefresh: () => localStorage.getItem("refresh_token"),
//   setTokens: (access: string, refresh: string) => {
//     localStorage.setItem("access_token", access);
//     localStorage.setItem("refresh_token", refresh);
//   },
//   clear: () => {
//     localStorage.removeItem("access_token");
//     localStorage.removeItem("refresh_token");
//     localStorage.removeItem("user");
//   },
// };

// // ─── Request interceptor — attach access token ────────────────────────────────

// api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
//   const token = tokenStore.getAccess();
//   if (token && config.headers) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// // ─── Response interceptor — refresh on 401 ───────────────────────────────────

// let isRefreshing = false;
// let pendingQueue: Array<{
//   resolve: (token: string) => void;
//   reject: (err: unknown) => void;
// }> = [];

// function processPendingQueue(err: unknown, token: string | null) {
//   pendingQueue.forEach(({ resolve, reject }) => {
//     if (err) reject(err);
//     else resolve(token as string);
//   });
//   pendingQueue = [];
// }

// api.interceptors.response.use(
//   (response) => response,
//   async (error: AxiosError) => {
//     const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

//     if (error.response?.status !== 401 || originalRequest._retry) {
//       return Promise.reject(error);
//     }

//     // Don't try to refresh if the failing request IS the refresh endpoint
//     if (originalRequest.url?.includes("/auth/refresh")) {
//       tokenStore.clear();
//       window.location.href = "/login";
//       return Promise.reject(error);
//     }

//     if (isRefreshing) {
//       // return new Promise((resolve, reject) => {
//       //   pendingQueue.push({
//       //     resolve: (token) => {
//       //       if (originalRequest.headers) {
//       //         originalRequest.headers.Authorization = `Bearer ${token}`;
//       //       }
//       //       resolve(api(originalRequest));
//       //     },
//       //     reject,
//       //   });
//       // });
     
      
//     }

//     originalRequest._retry = true;
//     isRefreshing = true;

//     const refreshToken = tokenStore.getRefresh();
//     console.log("FRONTEND REFRESH TOKEN:", refreshToken);
//     if (!refreshToken) {
//       tokenStore.clear();
//       window.location.href = "/login";
//       return Promise.reject(error);
//     }

//     try {
//       const { data } = await axios.post<{ success: boolean; data: RefreshResponse }>(
//         `${BASE_URL}/api/auth/refresh`,
//         { refreshToken }
//       );

//       const { accessToken, refreshToken: newRefresh } = data.data;
//       tokenStore.setTokens(accessToken, newRefresh);

//       processPendingQueue(null, accessToken);
//       if (originalRequest.headers) {
//         originalRequest.headers.Authorization = `Bearer ${accessToken}`;
//       }
//       return api(originalRequest);
//     } catch (refreshError) {
//       processPendingQueue(refreshError, null);
//       tokenStore.clear();
//       window.location.href = "/login";
//       return Promise.reject(refreshError);
//     } finally {
//       isRefreshing = false;
//     }
//   }
// );







import axios, { AxiosError, InternalAxiosRequestConfig, AxiosHeaders } from "axios";
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

// ─── Request interceptor ───────────────────────────────────

// api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
//   const token = tokenStore.getAccess();

//   // if (!config.headers) config.headers = {};
//   if (!config.headers) {
//   config.headers = new AxiosHeaders();
// }

// (config.headers as AxiosHeaders).set(
//   "Authorization",
//   `Bearer ${token}`
// );

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;

//     console.log("📤 TOKEN USED:", token.slice(0, 25));
//     console.log("📤 URL:", config.url);
//   }

//   return config;
// });

api.interceptors.request.use(async (config) => {
  const token = tokenStore.getAccess();

  if (isRefreshing) {
    console.log("⏳ Waiting for refresh before sending:", config.url);

    return new Promise((resolve) => {
      pendingQueue.push({
        resolve: (newToken: string) => {
          if (!config.headers) config.headers = {} as any;

          config.headers.Authorization = `Bearer ${newToken}`;
          resolve(config);
        },
        reject: () => {},
      });
    });
  }

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ─── Response interceptor ──────────────────────────────────

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processPendingQueue(err: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (err) reject(err);
    else resolve(token as string);
  });
  pendingQueue = [];
}

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

    // ─── QUEUE LOGIC ───────────────────────────────────────

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        console.log("⏳ Request added to queue:", originalRequest.url);

        pendingQueue.push({
          resolve: (token: string) => {
            console.log("🟢 Queue resolved:", originalRequest.url);

            // if (!originalRequest.headers) originalRequest.headers = {};
            // originalRequest.headers.Authorization = `Bearer ${token}`;
            if (!originalRequest.headers) {
  originalRequest.headers = new AxiosHeaders();
}

(originalRequest.headers as AxiosHeaders).set(
  "Authorization",
  `Bearer ${token}`
);

            resolve(api.request(originalRequest));
          },
          reject,
        });
      });
    }

    // ─── START REFRESH ─────────────────────────────────────

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = tokenStore.getRefresh();
    console.log("🔄 Refreshing token...");

    if (!refreshToken) {
      tokenStore.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post<{
        success: boolean;
        data: RefreshResponse;
      }>(`${BASE_URL}/api/auth/refresh`, { refreshToken });

      const { accessToken, refreshToken: newRefresh } = data.data;

      console.log("✅ NEW TOKEN:", accessToken.slice(0, 25));
      console.log("✅ New access token received");

      // store new tokens
      tokenStore.setTokens(accessToken, newRefresh);

      // 🔥 IMPORTANT: update default header
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      // resolve queued requests
      processPendingQueue(null, accessToken);

      // retry original request
      // if (!originalRequest.headers) originalRequest.headers = {};
      // originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      if (!originalRequest.headers) {
  originalRequest.headers = new AxiosHeaders();
}

(originalRequest.headers as AxiosHeaders).set(
  "Authorization",
  `Bearer ${accessToken}`
);

      return api.request(originalRequest);
    } catch (refreshError) {
      console.log("🔴 Refresh failed");

      processPendingQueue(refreshError, null);
      tokenStore.clear();
      window.location.href = "/login";

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);