import api from "./axiosClient";

export const register = async ({ email, full_name, password }) => {
  const res = await api.post("/api/v1/auth/register", {
    email,
    full_name,
    password,
  });
  return res.data;
};

export const login = async ({ username, password }) => {
  // Send as multipart/form-data
  const form = new FormData();
  form.append("username", username);
  form.append("password", password);

  // Do NOT set Content-Type manually; let the browser set the boundary
  const res = await api.post("/api/v1/auth/login", form);
  return res.data;
};

export const logout = async () => {
  const res = await api.post("/api/v1/auth/logout");
  return res.data;
};

// Expose a minimal refresh function if you want to call it directly.
export const refresh = async () => {
  const res = await api.post("/api/v1/auth/refresh");
  return res.data;
};

// Add: Get current authenticated user
export const getCurrentUser = async () => {
  const res = await api.get("/api/v1/auth/me");
  console.log(res.data)
  return res.data;
};
