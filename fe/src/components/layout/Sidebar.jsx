import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import ForumIcon from "@mui/icons-material/Forum";
import SchoolIcon from "@mui/icons-material/School";
import QuizIcon from "@mui/icons-material/Quiz";
import HistoryIcon from "@mui/icons-material/History";
import ExtensionIcon from "@mui/icons-material/Extension";

const SidebarWrap = styled.aside`
  width: var(--sidebar-width);
  background: #fff;
  padding: 22px 14px;
  border-right: 1px solid rgba(15, 23, 42, 0.04);
  overflow: auto;
`;

const Nav = styled.nav`
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
`;

const Section = styled.div`
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgba(15, 23, 42, 0.04);
`;

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-radius: 8px;
  color: var(--muted);
  text-decoration: none;
  margin-bottom: 6px;
  font-weight: 600;
  &.active {
    background: rgba(59, 130, 246, 0.12);
    color: var(--accent);
  }
`;

const IconWrap = styled.span`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
`;

const Soon = styled.span`
  background: #ffdce3;
  color: #ef476f;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 11px;
  margin-left: 8px;
  font-weight: 700;
`;

const Sidebar = () => {
  return (
    <SidebarWrap>
      <Nav>
        <ul>
          <li>
            <NavItem to="/" end>
              <IconWrap>
                <HomeIcon fontSize="small" />
              </IconWrap>
              Trang chủ
            </NavItem>
          </li>
          <li>
            <NavItem to="/library">
            
            </NavItem>
          </li>

          <Section>
            <div
              style={{
                color: "#4F83FC",
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              TỰ HỌC
            </div>
            <NavItem to="/forum">
              
            </NavItem>
            <NavItem to="/my-courses">
              <IconWrap>
                <SchoolIcon fontSize="small" />
              </IconWrap>
              Lộ trình học tập
            </NavItem>
            <NavItem to="/tests">
              <IconWrap>
                <QuizIcon fontSize="small" />
              </IconWrap>
              Kiểm tra 
            </NavItem>
            <NavItem to="/video">
              <IconWrap>
                <QuizIcon fontSize="small" />
              </IconWrap>
              Học video cùng AI 
            </NavItem>
            <NavItem to="/chatbot">
              <IconWrap>
                <ExtensionIcon fontSize="small" />
              </IconWrap>
              Trợ giảng AI 
            </NavItem>
            <NavItem to="/flashcard">
              <IconWrap>
                <ExtensionIcon fontSize="small" />
              </IconWrap>
              Flashcard 
            </NavItem>
            <NavItem to="/ranking">
              <IconWrap>
                <ExtensionIcon fontSize="small" />
              </IconWrap>
              Bảng xếp hạng
            </NavItem>
          </Section>

          <Section>
            <div
              style={{
                color: "#4F83FC",
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
            </div>
            <NavItem to="/history">
              <IconWrap>
              </IconWrap>
            </NavItem>
            <NavItem to="/feature-1">
              <IconWrap>
              </IconWrap>
            </NavItem>
          </Section>
        </ul>
      </Nav>
    </SidebarWrap>
  );
};

export default Sidebar;
