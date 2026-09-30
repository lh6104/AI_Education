import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
`;

const AuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      // Handle OAuth error
      console.error("OAuth error:", error);
      navigate("/login?error=oauth_failed");
      return;
    }

    if (token) {
      // Set the token in the auth store
      // Default to 30 minutes (1800 seconds) since we don't get expires_in from URL
      setToken(token, 1800);
      navigate("/");
    } else {
      // No token received, redirect to login
      navigate("/login?error=no_token");
    }
  }, [searchParams, setToken, navigate]);

  return (
    <Container>
      <LoadingSpinner />
      <p>Completing authentication...</p>
    </Container>
  );
};

export default AuthSuccess;
