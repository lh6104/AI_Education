import React from "react";
import styled from "styled-components";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const Card = styled.div`
  background: #fff;
  border: 0.5px solid #628ee6ff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  }
`;

const Title = styled.h4`
  font-weight: 600;
  font-size: 20px;
  margin-bottom: 6px;
`;

const Content = styled.p`
  color: #374151;
  font-size: 14px;
  margin-bottom: 6px;
`;

const Example = styled.p`
  color: #6b7280;
  font-size: 13px;
  margin-bottom: 8px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const IconButton = styled.button`
  border: none;
  background: transparent;
  cursor: pointer;
  color: ${(p) => (p.danger ? "#ef4444" : "#4f83fc")};
  transition: 0.2s;
  &:hover {
    opacity: 0.7;
  }
`;

export default function FlashcardDetailCard({ card, onEdit, onDelete }) {
  return (
    <Card>
      <Title>{card.title}</Title>
      <Content>Nội dung: {card.content}</Content>
      {card.example && <Example>Ví dụ: {card.example}</Example>}
      {card.note && <Example>Ghi chú: {card.note}</Example>}

      <Actions>
        <IconButton onClick={onEdit}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton danger onClick={onDelete}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Actions>
    </Card>
  );
}
