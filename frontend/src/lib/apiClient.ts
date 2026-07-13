import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";



// Spring Boot Backend Base URL determined dynamically to support local Wi-Fi mobile testing and production deploys
const getApiBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== "") {
    return envUrl;
  }
  if (typeof window !== "undefined" && window.location) {
    const { hostname, origin } = window.location;
    // Check if the application is being accessed from a local IP (e.g. 192.168.x.x, 10.x.x.x, etc.)
    const isLocalIP =
      /^(127\.)|^(10\.)|^(172\.(1[6-9]|2[0-9]|3[0-1])\.)|^(192\.168\.)/.test(
        hostname,
      );
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

    if (isLocalhost) {
      return "http://localhost:8080/api/v1";
    } else if (isLocalIP) {
      // Accessed on local network (e.g., from a mobile device on the same Wi-Fi pointing to the laptop's backend)
      return `http://${hostname}:8080/api/v1`;
    } else {
      // Deployed/production fallback: Use current origin with context-path if served together
      return `${origin}/api/v1`;
    }
  }
  return "http://localhost:8080/api/v1";
};

const BASE_URL = getApiBaseUrl();

export interface ApiError {
  status: number | null;
  message: string;
  details: any;
  isNetworkError: boolean;
  originalError: AxiosError;
}

/**
 * Centrally configured Axios Client with request and response interceptors.
 * Tailored for modern Vite + React single page applications.
 */
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 seconds timeout
});

// Request Interceptor: Inject standard JWT bearer tokens retrieved from localStorage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn(
        '[apiClient] Unable to read localStorage "token" for auth header injection:',
        error,
      );
    }

    // Automatically remove default JSON Content-Type header if the request body is a FormData instance
    // to let the browser auto-generate the multipart boundary header.
    if (config.data instanceof FormData) {
      if (config.headers && typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type");
      } else if (config.headers) {
        delete (config.headers as any)["Content-Type"];
      }
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Centralized error classification and transformation
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<any>) => {
    const responseStatus = error.response ? error.response.status : null;
    const responseData = error.response ? error.response.data : null;

    // Standard client error classification for global logging/debugging
    if (responseStatus === 401) {
      console.error(
        "[apiClient] Unauthorized - JWT token is invalid or expired.",
      );
    } else if (responseStatus === 403) {
      console.error("[apiClient] Forbidden - Insufficient permissions.");
    } else if (responseStatus === 404) {
      console.error(
        "[apiClient] Resource Not Found:",
        responseData?.message || error.message,
      );
    } else if (responseStatus && responseStatus >= 500) {
      console.error(
        "[apiClient] Server Error:",
        responseData?.message || "Internal Server Error",
      );
    }

    // Build unified error payload structure to simplify use in React components / React Query hooks
    const normalizedError: ApiError = {
      status: responseStatus,
      message:
        responseData?.message ||
        error.message ||
        "An unexpected error occurred",
      details: responseData || null,
      isNetworkError: !error.response,
      originalError: error,
    };

    return Promise.reject(normalizedError);
  },
);

export default apiClient;
