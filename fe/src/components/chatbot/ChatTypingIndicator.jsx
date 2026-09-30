import React from "react";
import styled, { keyframes } from "styled-components";
import { Avatar } from "@mui/material";

const MessageContainer = styled.div`
  display: flex;
  margin-bottom: 16px;
`;

const bounce = keyframes`
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
`;

const TypingContainer = styled.div`
  background-color: #f2f2f2;
  border-radius: 12px;
  padding: 16px;
  margin-left: 12px;
  display: flex;
  align-items: center;
`;

const Dot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #3b82f6;
  margin: 0 2px;
  animation: ${bounce} 1.4s infinite ease-in-out;
  animation-delay: ${(props) => props.$delay}s;
`;

const ChatTypingIndicator = () => {
  return (
    <MessageContainer>
      <Avatar 
        src="/logo.png" 
        alt="AI"
        sx={{ width: 36, height: 36 }}
      />
      <TypingContainer>
        <Dot $delay={0} />
        <Dot $delay={0.2} />
        <Dot $delay={0.4} />
      </TypingContainer>
    </MessageContainer>
  );
};

export default ChatTypingIndicator;

