import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { createFlashcard, updateFlashcard } from "../api/flashcardApi";

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
  margin-bottom: 10px;
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  margin-bottom: 10px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const Button = styled.button`
  background: ${(p) => (p.$danger ? "#ef4444" : "#4f83fc")};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
`;

export default function FlashcardModal({
  visible,
  onClose,
  onSuccess,
  groupId,
  flashcard,
}) {
  const isEditing = !!flashcard;
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [example, setExample] = useState("");
  const [note, setNote] = useState("");

  // 🧠 Reset dữ liệu mỗi khi mở modal hoặc đổi flashcard
  useEffect(() => {
    if (!visible) return; // chỉ chạy khi modal mở
    if (flashcard) {
      // đang sửa
      setTitle(flashcard.title || "");
      setContent(flashcard.content || "");
      setExample(flashcard.example || "");
      setNote(flashcard.note || "");
    } else {
      // đang tạo mới
      setTitle("");
      setContent("");
      setExample("");
      setNote("");
    }
  }, [flashcard, visible]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert("⚠️ Vui lòng nhập đầy đủ tiêu đề và nội dung!");
      return;
    }

    const payload = { title, content, example, note, group_id: groupId };

    try {
      if (isEditing) {
        await updateFlashcard(flashcard.id, payload);
      } else {
        await createFlashcard(groupId, payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("❌ Lỗi lưu flashcard:", err);
      alert("Không thể lưu flashcard!");
    }
  };

  if (!visible) return null;

  return (
    <Overlay>
      <Modal>
        <h3 style={{ fontWeight: "700", marginBottom: "12px" }}>
          {isEditing ? "Chỉnh sửa Flashcard" : "Thêm Flashcard mới"}
        </h3>

        <Input
          placeholder="Tiêu đề"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Nội dung"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Input
          placeholder="Ví dụ"
          value={example}
          onChange={(e) => setExample(e.target.value)}
        />
        <Input
          placeholder="Ghi chú"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <Actions>
          <Button $danger onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? "Cập nhật" : "Thêm"}
          </Button>
        </Actions>
      </Modal>
    </Overlay>
  );
}
