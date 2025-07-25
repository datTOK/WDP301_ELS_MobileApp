import axios from "axios";
import SecureStorage from "../utils/secureStorage";
import { MOBILE_SERVER_URL } from "@env";
// Get server URL from environment or use fallback
const SERVER_URL = MOBILE_SERVER_URL;

// Create axios instance
const api = axios.create({
  baseURL: SERVER_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting token from secure storage:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Clear stored token
        await SecureStorage.removeToken();

        // You can add navigation logic here to redirect to login
        // For now, we'll just reject the request
        return Promise.reject(error);
      } catch (storageError) {
        console.error("Error clearing secure storage:", storageError);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Utility functions
export const apiUtils = {
  // Handle API errors
  handleError: (error) => {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || "Server error occurred";
      return { error: true, message, status: error.response.status };
    } else if (error.request) {
      // Network error
      return {
        error: true,
        message: "Network error. Please check your connection.",
      };
    } else {
      // Other error
      return {
        error: true,
        message: error.message || "An unexpected error occurred",
      };
    }
  },

  // Parse response data
  parseResponse: (response) => {
    // Ensure response.data is an object before trying to access its properties
    if (
      !response ||
      typeof response.data !== "object" ||
      response.data === null
    ) {
      return {
        data: response?.data || null,
        message: null,
        total: 0,
        totalPages: 1,
        currentPage: 1,
      };
    }

    return {
      data: response.data?.data || response.data,
      message: response.message,
      total: response.total,
      totalPages: response.totalPages,
      currentPage: response.currentPage,
    };
  },

  // Create query parameters
  createQueryParams: (params) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ""
      ) {
        queryParams.append(key, params[key]);
      }
    });
    return queryParams.toString();
  },
};

// Export the axios instance for custom requests
export default api;
