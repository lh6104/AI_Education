import React, { useEffect, useState } from "react";
import styled from "styled-components";
import AddIcon from "@mui/icons-material/Add";
import FlashcardCard from "../../components/FlashcardCard";
import FlashcardGroupModal from "../../components/FlashcardGroupModal";
import { getFlashcardGroupsByUser } from "../../api/flashcardApi";

const Wrapper = styled.div`
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #111827;
`;

const AddButton = styled.button`
  background: #4f83fc;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: 0.2s;
  &:hover {
    background: #3b6ce0;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
`;

const NewCard = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  padding: 48px 16px;
  text-align: center;
  color: #4f83fc;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  &:hover {
    background: #f9fafb;
    border-color: #4f83fc;
  }
`;

export default function FlashCard() {
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const userId = 1; // tạm hardcode user ID

  useEffect(() => {
    getFlashcardGroupsByUser(userId)
      .then((res) => {
        const sorted = res.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setGroups(sorted);
      })
      .catch((err) => console.error("❌ Lỗi load groups:", err));
  }, []);

  const handleCreated = (newGroup) => setGroups((prev) => [newGroup, ...prev]);

  const handleUpdated = (updatedGroup) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === updatedGroup.id ? { ...g, ...updatedGroup } : g))
    );
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingGroup(null);
    setIsModalOpen(false);
  };

  return (
    <Wrapper>
      <Header>
        <Title>Flashcard của tôi</Title>
        {/* <AddButton onClick={() => setIsModalOpen(true)}>
          <AddIcon /> Tạo bộ flashcard mới
        </AddButton> */}
      </Header>

      <Grid>
        <NewCard onClick={() => setIsModalOpen(true)}>
          <AddIcon style={{ fontSize: 36 }} />
          <div>Tạo bộ Flashcard mới</div>
        </NewCard>

        {groups.map((g) => (
          <FlashcardCard key={g.id} group={g} onEdit={() => openEditModal(g)} />
        ))}
      </Grid>

      {isModalOpen && (
        <FlashcardGroupModal
          onClose={closeModal}
          onCreated={handleCreated}
          onUpdated={handleUpdated}
          userId={userId}
          editingGroup={editingGroup}
        />
      )}
    </Wrapper>
  );
}
