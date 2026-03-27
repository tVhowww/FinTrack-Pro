import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // SECURITY: withCredentials=true makes the browser automatically attach the
  // HttpOnly 'access_token' cookie on every request. We never read or write
  // this cookie from JavaScript — the browser handles it entirely.
  withCredentials: true,
});

// --- TOKEN REFRESH WITH QUEUING ---
// Prevents multiple parallel 401 errors from each triggering a separate refresh.
let isRefreshing = false;
let failedQueue: { resolve: (token: null) => void; reject: (err: unknown) => void }[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(null);
    }
  });
  failedQueue = [];
};

// Response interceptor: silently refresh the HttpOnly cookie on 401
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Avoid infinite retry loops
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Queue subsequent 401s while a refresh is already in flight
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => http(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // POST with empty body — the backend reads the token from the HttpOnly cookie
      // and sets a new rotated cookie in the response.
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/identity/auth/refresh`,
        {},
        { withCredentials: true }
      );

      processQueue(null);
      return http(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      // Redirect to login on refresh failure
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default http;