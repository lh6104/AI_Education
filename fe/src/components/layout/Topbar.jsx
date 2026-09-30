import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useLogout } from "../../hooks/useAuthHooks";

const TopbarWrap = styled.header`
  padding: 10px 18px;
  height: 64px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 40;
`;

const Brand = styled.div`
  font-weight: 700;
  color: var(--accent);
  font-size: 24px;
  margin: 0;
  line-height: 1;
  letter-spacing: 0.6px;
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
const LogoImg = styled.img`
  width: 36px;
  height: 36px;
  object-fit: contain;
  display: block;
`;

const Spacer = styled.div`
  flex: 1;
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SearchWrap = styled.div`
  position: relative;
`;
const SearchInput = styled.input`
  width: 260px;
  padding: 8px 12px 8px 36px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: #fff;
`;
const SearchIcon = styled.span`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 14px;
`;

const IconBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
`;

const Avatar = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(2, 6, 23, 0.08);
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05);
  min-width: 200px;
  opacity: ${(props) => (props.$isOpen ? 1 : 0)};
  visibility: ${(props) => (props.$isOpen ? "visible" : "hidden")};
  transform: ${(props) =>
    props.$isOpen ? "translateY(0)" : "translateY(-10px)"};
  transition: all 0.2s ease;
  z-index: 50;
`;

const DropdownHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
`;

const UserName = styled.div`
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
`;

const UserEmail = styled.div`
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
`;

const DropdownMenu = styled.div`
  padding: 8px;
`;

const MenuItem = styled.button`
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.15s;

  &:hover {
    background: #f3f4f6;
  }

  &.danger {
    color: #ef4444;

    &:hover {
      background: #fee2e2;
    }
  }
`;

const Topbar = ({ userName = "Thu Hiếu", userEmail = "user@example.com" }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const logout = useLogout();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      setIsDropdownOpen(false);
      navigate("/login");
    } catch (error) {
      // Error already handled by the hook (toast shown)
      console.error("Logout failed:", error);
    }
  };
  return (
    <TopbarWrap>
      <Left>
        <LogoImg src="/logo.png" alt="logo" />
        <Brand>GIA SƯ AI</Brand>
      </Left>

      <Spacer />

      <Right>
        <SearchWrap>
          <SearchIcon>
            <img src="/search.png" alt="search" width="16" height="16" />
          </SearchIcon>
          <SearchInput placeholder="Tìm kiếm khóa học" />
        </SearchWrap>
        <IconBtn aria-label="notifications">
          <img src="/bell.png" alt="notifications" width="32" height="32" />
        </IconBtn>
        <IconBtn aria-label="help">
          <img src="/question.png" alt="help" width="32" height="32" />
        </IconBtn>
        <AvatarWrapper ref={dropdownRef}>
          <Avatar
            src="/mock-avatar-32.svg"
            alt={userName}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          />
          <Dropdown $isOpen={isDropdownOpen}>
            <DropdownHeader>
              <UserName>{userName}</UserName>
              <UserEmail>{userEmail}</UserEmail>
            </DropdownHeader>
            <DropdownMenu>
              <MenuItem
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate("/profile");
                }}
              >
                <span>👤</span>
                <span>Tài khoản</span>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate("/settings");
                }}
              >
                <span>⚙️</span>
                <span>Cài đặt</span>
              </MenuItem>
              <MenuItem
                className="danger"
                onClick={handleLogout}
                disabled={logout.isLoading}
              >
                <span>🚪</span>
                <span>
                  {logout.isLoading ? "Đang đăng xuất..." : "Đăng xuất"}
                </span>
              </MenuItem>
            </DropdownMenu>
          </Dropdown>
        </AvatarWrapper>
      </Right>
    </TopbarWrap>
  );
};

export default Topbar;
