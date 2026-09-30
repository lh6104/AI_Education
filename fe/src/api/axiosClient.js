import axios from "axios";
import { auth } from "../stores/useAuthStore";
import { API_URL } from "./config";

// Don't set a global Content-Type so FormData requests can set their own boundaries
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Attach Authorization header from zustand store
api.interceptors.request.use((config) => {
  try {
    const token = auth.get();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }
  return config;
});

// On 401, try to refresh once and retry the original request
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // Prevent infinite loop
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        // Use the helper's refresh which performs a fetch and updates the stored token
        await auth.refresh();
        // After refresh, read the latest token from the helper/localStorage
        const newToken = auth.get();
        if (newToken) {
          // update header and retry
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        // fallthrough to reject
      }
    }

    return Promise.reject(error);
  }
);

export default api;
