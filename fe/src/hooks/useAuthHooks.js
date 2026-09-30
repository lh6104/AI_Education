import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import * as authApi from "../api/authApi";
import useAuthStore, { auth } from "../stores/useAuthStore";

// Lightweight replacements for react-query mutations to avoid runtime version conflicts.
// These hooks provide a minimal compatible API: { mutateAsync, isLoading, isError }

export const useRegister = () => {
  const [isLoading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const mutateAsync = useCallback(async ({ email, full_name, password }) => {
    setLoading(true);
    setIsError(false);
    try {
      const data = await authApi.register({ email, full_name, password });
      toast.success("Đăng ký tài khoản thành công!");
      return data;
    } catch (e) {
      setIsError(true);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutateAsync, isLoading, isError };
};

export const useLogin = () => {
  const [isLoading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);

  const mutateAsync = useCallback(
    async ({ username, password }) => {
      setLoading(true);
      setIsError(false);
      try {
        const data = await authApi.login({ username, password });
        if (data && data.access_token) {
          setToken(data.access_token, data.expires_in || 0);
          toast.success("Đăng nhập thành công!");
        }
        return data;
      } catch (e) {
        setIsError(true);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [setToken]
  );

  return { mutateAsync, isLoading, isError };
};

export const useLogout = () => {
  const [isLoading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const clearToken = useAuthStore((s) => s.clearToken);

  const mutateAsync = useCallback(async () => {
    setLoading(true);
    setIsError(false);
    try {
      const data = await authApi.logout();
      clearToken();
      toast.success("Đăng xuất thành công!");
      return data;
    } catch (e) {
      // Even on error, clear local token
      clearToken();
      setIsError(true);
      toast.error("Đã xảy ra lỗi khi đăng xuất!");
      throw e;
    } finally {
      setLoading(false);
    }
  }, [clearToken]);

  return { mutateAsync, isLoading, isError };
};

export const useRefresh = () => {
  // a small hook to trigger manual refresh if needed
  const refresh = useAuthStore((s) => s.refresh);
  return refresh;
};
