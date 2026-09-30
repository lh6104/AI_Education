import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "react-hot-toast";

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (error) => {
        // Default error handler
        toast.error(
          error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại sau"
        );
      },
    },
  },
});

export const Providers = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            style: {
              background: "#22c55e",
            },
          },
          error: {
            duration: 5000,
            style: {
              background: "#ef4444",
            },
          },
        }}
      />
    </QueryClientProvider>
  );
};
