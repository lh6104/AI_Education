import React, { useState } from "react";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EmailOutlineIcon from "@mui/icons-material/AlternateEmail";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useLogin, useRegister } from "../../hooks/useAuthHooks";
import LoadingSpinner from "../../components/ui/LoadingSpinner";

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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 4px;

  img {
    height: 48px;
  }
`;

const Title = styled.h1`
  text-align: center;
  color: white;
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 16px;
  margin-top: 4px;
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

const RegisterButton = styled.button`
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

const LoginHint = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
`;

const LoginLink = styled(Link)`
  color: #ffffff;
  font-weight: 700;
  margin-left: 8px;
  text-decoration: underline;
`;

const ErrorMessage = styled.div`
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
  position: absolute;
  bottom: -20px;
`;

const Register = () => {
  const navigate = useNavigate();
  const register = useRegister();
  const login = useLogin();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Vui lòng nhập tên người dùng";
    }

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

    if (!confirm) {
      newErrors.confirm = "Vui lòng nhập lại mật khẩu";
    } else if (password !== confirm) {
      newErrors.confirm = "Mật khẩu không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // First register the user
      await register.mutateAsync({
        email,
        full_name: name,
        password,
      });

      // Then login automatically
      await login.mutateAsync({
        username: email,
        password,
      });

      // Navigate to home on success
      navigate("/");
    } catch (error) {
      const newErrors = { ...errors };
      if (error.response?.status === 409) {
        newErrors.email = "Email đã được sử dụng";
      } else if (error.response?.status === 400) {
        // Handle validation errors from the server
        if (error.response.data?.errors?.email) {
          newErrors.email = error.response.data.errors.email;
        }
        if (error.response.data?.errors?.full_name) {
          newErrors.name = error.response.data.errors.full_name;
        }
        if (error.response.data?.errors?.password) {
          newErrors.password = error.response.data.errors.password;
        }
      } else {
        newErrors.email = "Có lỗi xảy ra, vui lòng thử lại sau";
      }
      setErrors(newErrors);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <img src="/logo2.png" alt="GIA SƯ AI logo" />
        </Logo>
        <Title>ĐĂNG KÝ TÀI KHOẢN</Title>

        <form onSubmit={handleRegister}>
          <InputWrapper>
            <InputIcon>
              <PersonOutlineIcon />
            </InputIcon>
            <Input
              type="text"
              placeholder="Tên người dùng"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
          </InputWrapper>

          <InputWrapper>
            <InputIcon>
              <EmailOutlineIcon />
            </InputIcon>
            <Input
              type="email"
              placeholder="Nhập email của bạn"
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
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <VisibilityToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </VisibilityToggle>
            {errors.password && <ErrorMessage>{errors.password}</ErrorMessage>}
          </InputWrapper>

          <InputWrapper>
            <InputIcon>
              <LockOutlinedIcon />
            </InputIcon>
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <VisibilityToggle
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
            >
              {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </VisibilityToggle>
            {errors.confirm && <ErrorMessage>{errors.confirm}</ErrorMessage>}
          </InputWrapper>

          <RegisterButton
            type="submit"
            disabled={register.isLoading || login.isLoading}
          >
            {(register.isLoading || login.isLoading) && (
              <LoadingSpinner size="20px" />
            )}
            {register.isLoading
              ? "Đang tạo tài khoản..."
              : login.isLoading
              ? "Đang đăng nhập..."
              : "Tạo tài khoản"}
          </RegisterButton>
        </form>

        <LoginHint>
          Bạn đã có tài khoản?
          <LoginLink to="/login">Đăng nhập</LoginLink>
        </LoginHint>
      </LoginCard>
    </LoginContainer>
  );
};

export default Register;
