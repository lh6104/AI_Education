import React from "react";
import styled from "styled-components";
import { FaExclamationTriangle } from "react-icons/fa";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Popup = styled.div`
  background: white;
  border-radius: 12px;
  width: 420px;
  padding: 30px 35px;
  text-align: center;
  color: #111827;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.25s ease;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Icon = styled(FaExclamationTriangle)`
  color: #f59e0b;
  font-size: 36px;
  margin-bottom: 12px;
`;

const Title = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const Message = styled.p`
  font-size: 15px;
  color: #4b5563;
  margin-bottom: 24px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  color: white;
  transition: 0.2s;
  background: ${(p) => (p.danger ? "#ef4444" : "#6b7280")};

  &:hover {
    opacity: 0.9;
  }
`;

export default function ConfirmPopup({ visible, title, message, onConfirm, onCancel }) {
  if (!visible) return null;

  return (
    <Overlay>
      <Popup>
        <Icon />
        <Title>{title}</Title>
        <Message>{message}</Message>
        <Actions>
          <Button onClick={onCancel}>Hủy</Button>
          <Button danger onClick={onConfirm}>Xác nhận</Button>
        </Actions>
      </Popup>
    </Overlay>
  );
}
