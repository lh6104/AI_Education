import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { createFlashcardGroup, updateFlashcardGroup } from "../api/flashcardApi";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 420px;
  max-width: 90%;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  margin-bottom: 12px;
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 100px;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
`;

const CancelButton = styled.button`
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 600;
`;

const ConfirmButton = styled.button`
  background: #4f83fc;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 600;
`;

export default function FlashcardGroupModal({
  onClose,
  onCreated,
  onUpdated,
  userId,
  editingGroup,
}) {
  const isEditing = !!editingGroup;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (editingGroup) {
      setTitle(editingGroup.title || "");
      setDescription(editingGroup.description || "");
    }
  }, [editingGroup]);

  const handleSubmit = async () => {
    if (!title.trim()) return alert("Vui lòng nhập tiêu đề!");
    const payload = {
      title,
      description: description || "Không có mô tả",
      user_id: userId,
    };

    try {
      if (isEditing) {
        const updated = await updateFlashcardGroup(editingGroup.id, payload);
        onUpdated(updated);
      } else {
        const created = await createFlashcardGroup(payload);
        onCreated(created);
      }
      onClose();
    } catch (err) {
      console.error("❌ Lỗi khi lưu:", err);
      alert("Không thể lưu bộ flashcard!");
    }
  };

  return (
    <Overlay>
      <Modal>
        <h3 style={{ fontWeight: "700", marginBottom: "12px" }}>
          {isEditing ? "Chỉnh sửa bộ Flashcard" : "Tạo bộ Flashcard mới"}
        </h3>
        <Input
          placeholder="Tiêu đề *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Mô tả"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Actions>
          <CancelButton onClick={onClose}>Huỷ</CancelButton>
          <ConfirmButton onClick={handleSubmit}>
            {isEditing ? "Cập nhật" : "Thêm"}
          </ConfirmButton>
        </Actions>
      </Modal>
    </Overlay>
  );
}
