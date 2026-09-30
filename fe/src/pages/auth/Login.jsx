import React, { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmailOutlineIcon from "@mui/icons-material/AlternateEmail";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useLogin } from "../../hooks/useAuthHooks";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { API_URL } from "../../api/config";

const LoginContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-height: 100vh;
  background-image: url("/background.svg");
  background-size: cover;
  background-position: center;
  padding: 40px;
`;

const LoginCard = styled.div`
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 48px 40px;
  width: 100%;
  max-width: 440px;
  margin-right: 80px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const SignupRow = styled.div`
  text-align: center;
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
`;

const SignupLink = styled.a`
  color: #ffffff;
  font-weight: 700;
  margin-left: 8px;
  text-decoration: underline;
  cursor: pointer;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 24px 0;

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.3);
  }

  span {
    padding: 0 16px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
  }
`;

const SocialButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #333;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  img {
    width: 20px;
    height: 20px;
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 24px;

  img {
    height: 48px;
  }
`;

const Title = styled.h1`
  text-align: center;
  color: white;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-bottom: 48px;
`;

const InputWrapper = styled.div`
  position: relative;
  margin-bottom: 24px;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  pointer-events: none;

  svg {
    font-size: 20px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 16px;
  padding-right: ${(props) => (props.type === "password" ? "48px" : "16px")};
  padding-left: 48px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;

  &:focus {
    background: white;
    border-color: white;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
  }

  &::placeholder {
    color: rgba(0, 0, 0, 0.5);
  }
`;

const VisibilityToggle = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  color: rgba(0, 0, 0, 0.5);
  z-index: 2;

  &:hover {
    color: rgba(0, 0, 0, 0.8);
  }

  svg {
    font-size: 20px;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
  position: absolute;
  bottom: -20px;
`;

const LoginButton = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(90deg, #185dfc 0%, #4f3bf6 100%);
  color: #ffffff;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 24px;
  box-shadow: 0 6px 18px rgba(79, 59, 246, 0.18);
  transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(79, 59, 246, 0.22);
    opacity: 0.98;
  }
`;

const Login = () => {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Vui lòng nhập email";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (!password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await login.mutateAsync({
        username: email,
        password,
      });
      // On successful login, navigate to home
      navigate("/");
    } catch (error) {
      const newErrors = { ...errors };
      if (error.response?.status === 401) {
        newErrors.password = "Email hoặc mật khẩu không đúng";
      } else {
        newErrors.password = "Có lỗi xảy ra, vui lòng thử lại sau";
      }
      setErrors(newErrors);
    }
  };

  const handleGoogleLogin = () => {
    // Just redirect to the OAuth endpoint
    window.location.href = `${API_URL}/api/v1/auth/google`;
  };

  const handleFacebookLogin = () => {
    // Just redirect to the OAuth endpoint
    window.location.href = `${API_URL}/api/v1/auth/facebook`;
  };
  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <img src="/logo2.png" alt="GIA SƯ AI logo" />
        </Logo>
        <Title>GIA SƯ AI</Title>
        <Subtitle>Trải nghiệm học tập thông minh với AI</Subtitle>

        <form onSubmit={handleLogin}>
          <InputWrapper>
            <InputIcon>
              <EmailOutlineIcon />
            </InputIcon>
            <Input
              type="email"
              placeholder="Nhập địa chỉ email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
          </InputWrapper>
          <InputWrapper>
            <InputIcon>
              <LockOutlinedIcon />
            </InputIcon>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
            <VisibilityToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </VisibilityToggle>
          </InputWrapper>

          <LoginButton type="submit" disabled={login.isLoading}>
            {login.isLoading && <LoadingSpinner size="20px" />}
            {login.isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </LoginButton>
        </form>

        <Divider>
          <span>hoặc</span>
        </Divider>

        <SocialButton type="button" onClick={handleGoogleLogin}>
          <img
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google"
          />
          Đăng nhập với Google
        </SocialButton>

        <SocialButton type="button" onClick={handleFacebookLogin}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
            alt="Facebook"
          />
          Đăng nhập với Facebook
        </SocialButton>

        <SignupRow>
          Chưa có tài khoản?
          <SignupLink href="/register">Đăng ký</SignupLink>
        </SignupRow>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
