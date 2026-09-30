import { create } from "zustand";
import { API_URL } from "../api/config";

const getToken = () => {
  try {
    const stored = localStorage.getItem("accessToken");
    const expiresAt = localStorage.getItem("expiresAt");

    if (stored && expiresAt && Number(expiresAt) > Date.now()) {
      return stored;
    }
    // Clear expired token
    localStorage.removeItem("accessToken");
    localStorage.removeItem("expiresAt");
    return null;
  } catch {
    return null;
  }
};

const useAuthStore = create((set, get) => ({
  getToken: () => getToken(),

  isAuthenticated: () => !!getToken(),

  setToken: (accessToken, expiresInSeconds) => {
    if (accessToken) {
      const expiresAt = Date.now() + expiresInSeconds * 1000;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("expiresAt", expiresAt.toString());
      set({ lastUpdate: Date.now() }); // Force component updates
    }
  },

  refresh: async () => {
    try {
      const token = getToken();
      if (!token) return null;

      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        get().clearToken();
        return null;
      }

      const data = await res.json();
      if (data?.access_token) {
        get().setToken(data.access_token, data.expires_in || 0);
      }
      return data;
    } catch (e) {
      console.error("Refresh error:", e);
      get().clearToken();
      return null;
    }
  },

  clearToken: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("expiresAt");
    set({ lastUpdate: Date.now() }); // Force component updates
  },
}));

// Small helper object for non-hook usages (imperative code or utilities)
export const auth = {
  // return current token (nullable)
  get: () => useAuthStore.getState().getToken(),
  // boolean
  isAuthenticated: () => useAuthStore.getState().isAuthenticated(),
  // set token (accessToken, expiresInSeconds)
  set: (token, expiresInSeconds) =>
    useAuthStore.getState().setToken(token, expiresInSeconds),
  // clear token
  clear: () => useAuthStore.getState().clearToken(),
  // trigger refresh
  refresh: () => useAuthStore.getState().refresh(),
  // expose subscribe for reactive listeners (selector + listener)
  subscribe: (selector, listener) => useAuthStore.subscribe(selector, listener),
};

export default useAuthStore;
