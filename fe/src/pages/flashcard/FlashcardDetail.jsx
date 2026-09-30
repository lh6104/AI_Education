import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  getFlashcardsByGroup,
  deleteFlashcard,
  deleteFlashcardGroup,
} from "../../api/flashcardApi";
import FlashcardDetailCard from "../../components/FlashcardDetailCard";
import FlashcardModal from "../../components/FlashcardModal";
import { FaBrain, FaTrashAlt, FaArrowLeft } from "react-icons/fa";
import { FaExclamationTriangle } from "react-icons/fa";

// ---------- Styled Components ----------

const Wrapper = styled.div`
  padding: 28px;
  color: #111827;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 22px;
  font-weight: 700;
`;

const Button = styled.button`
  background: ${(p) =>
    p.danger
      ? "#ef4444"
      : p.secondary
      ? "white"
      : "#4f83fc"};
  color: ${(p) =>
    p.secondary
      ? "#2563eb"
      : "white"};
  border: ${(p) => (p.secondary ? "2px solid #3b82f6" : "none")};
  border-radius: 8px;
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: 0.25s;
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

const FlashcardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Empty = styled.div`
  text-align: center;
  color: #6b7280;
  margin-top: 40px;
  font-size: 15px;
`;

// ---------- Popup Confirm Styles ----------

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
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Icon = styled(FaExclamationTriangle)`
  color: #f59e0b;
  font-size: 36px;
  margin-bottom: 12px;
`;

const PopupTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const PopupMessage = styled.p`
  font-size: 15px;
  color: #4b5563;
  margin-bottom: 24px;
`;

const PopupActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
`;

const PopupButton = styled.button`
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
    transform: scale(1.03);
  }
`;

// ---------- Component chính ----------

export default function FlashcardDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editFlashcard, setEditFlashcard] = useState(null);

  const [confirmData, setConfirmData] = useState({
    visible: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  // 🧠 Load dữ liệu nhóm
  const load = async () => {
    try {
      const data = await getFlashcardsByGroup(groupId);
      if (data && data.flashcards) {
        setGroup({ id: data.id, title: data.title });
        setFlashcards(data.flashcards);
      } else if (Array.isArray(data)) {
        setFlashcards(data);
        setGroup({ id: groupId, title: `Nhóm ${groupId}` });
      }
    } catch (err) {
      console.error("❌ Lỗi tải flashcards:", err);
    }
  };

  useEffect(() => {
    load();
  }, [groupId]);

  // 🗑 Xóa thẻ flashcard
  const handleDeleteCard = (id) => {
    setConfirmData({
      visible: true,
      title: "Xóa Flashcard",
      message: "Bạn có chắc muốn xóa flashcard này không?",
      onConfirm: async () => {
        try {
          await deleteFlashcard(id);
          await load();
        } catch (err) {
          alert("❌ Lỗi khi xóa flashcard!");
        } finally {
          setConfirmData({ visible: false });
        }
      },
    });
  };

  // 🗑 Xóa nhóm flashcard
  const handleDeleteGroup = () => {
    setConfirmData({
      visible: true,
      title: "Xóa Bộ Flashcard",
      message: "Xóa toàn bộ nhóm này và các flashcard trong đó?",
      onConfirm: async () => {
        try {
          await deleteFlashcardGroup(groupId);
          navigate("/flashcard");
        } catch (err) {
          alert("❌ Lỗi khi xóa nhóm!");
        } finally {
          setConfirmData({ visible: false });
        }
      },
    });
  };

  const handlePractice = () => {
    navigate(`/flashcards/${groupId}/practice`);
  };

  return (
    <Wrapper>
      <Header>
        <div>
          <Title>{group?.title || "Bộ Flashcard"}</Title>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            Tổng số: {flashcards.length} flashcard
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Button secondary onClick={() => navigate("/flashcard")}>
            <FaArrowLeft /> Quay lại
          </Button>
          <Button onClick={handlePractice}>
            <FaBrain /> Luyện tập
          </Button>
          <Button
            onClick={() => {
              setEditFlashcard(null);
              setShowModal(true);
            }}
          >
            + Thêm thẻ mới
          </Button>
          <Button danger onClick={handleDeleteGroup}>
            <FaTrashAlt /> Xóa bộ flashcard
          </Button>
        </div>
      </Header>

      {flashcards.length === 0 ? (
        <Empty>Chưa có flashcard nào trong nhóm này.</Empty>
      ) : (
        <FlashcardList>
          {flashcards.map((card) => (
            <FlashcardDetailCard
              key={card.id}
              card={card}
              onEdit={() => {
                setEditFlashcard(card);
                setShowModal(true);
              }}
              onDelete={() => handleDeleteCard(card.id)}
            />
          ))}
        </FlashcardList>
      )}

      <FlashcardModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={load}
        groupId={groupId}
        flashcard={editFlashcard}
      />

      {confirmData.visible && (
        <Overlay>
          <Popup>
            <Icon />
            <PopupTitle>{confirmData.title}</PopupTitle>
            <PopupMessage>{confirmData.message}</PopupMessage>
            <PopupActions>
              <PopupButton onClick={() => setConfirmData({ visible: false })}>
                Hủy
              </PopupButton>
              <PopupButton danger onClick={confirmData.onConfirm}>
                Xác nhận
              </PopupButton>
            </PopupActions>
          </Popup>
        </Overlay>
      )}
    </Wrapper>
  );
}
