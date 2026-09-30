import React from "react";
import styled from "styled-components";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";

// const Card = styled.div`
//   position: relative;
//   background: #fff;
//   border: 1px solid #4179e8ff;
//   border-radius: 10px;
//   padding: 16px;
//   box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
//   cursor: pointer;
//   transition: 0.2s;
//   &:hover {
//     transform: translateY(-3px);
//     box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
//   }
// `;

const Card = styled.div`
  position: relative;
  background: #fff;
  border: 0.5px solid #698bceff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: 0.2s;

  /* ✅ Làm khớp hoàn toàn với ô "Tạo Flashcard mới" */
  width: 280px;      /* thử 270 nếu ô bên kia 260 vì có border và padding */
  height: 180px;
  box-sizing: border-box;  /* quan trọng để border + padding không làm lệch kích thước */

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  }
`;


const EditButton = styled.button`
  position: absolute;
  top: auto;
  right: 6px;
  bottom: 6px;
  background: transparent;
  border: none;
  color: #144dbeff;
  cursor: pointer;
  &:hover {
    color: #111827;
  }
`;

const Title = styled.h4`
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
`;

const Info = styled.div`
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #6b7280;
  gap: 4px;
  margin-bottom: 10px;
`;

const Owner = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4f83fc;
  font-weight: 500;
`;

export default function FlashcardCard({ group, onEdit }) {
  const navigate = useNavigate();
  const wordCount = group.flashcards?.length || 0;

  return (
    <Card onClick={() => navigate(`/flashcards/${group.id}`)}>
      <EditButton
        onClick={(e) => {
          e.stopPropagation();
          onEdit(group);
        }}
      >
        <EditIcon fontSize="small" />
      </EditButton>

      <Title>{group.title}</Title>
      <Info>
        <DescriptionOutlinedIcon fontSize="small" /> {wordCount} từ
      </Info>
      <Owner>
        <PersonIcon fontSize="small" /> User {group.user_id || 1}
      </Owner>
    </Card>
  );
}
