import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { getFlashcardsByGroup } from "../../api/flashcardApi";

// 🎨 --- Styled Components ---
const Container = styled.div`
  background: #f9fafb;
  color: #111827;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 20px;
`;

const Stats = styled.div`
  display: flex;
  gap: 40px;
  font-size: 18px;
  margin-bottom: 20px;
`;

const StatBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 18px;
`;

const StatNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid ${(p) => p.color};
  color: ${(p) => p.color};
  font-weight: 700;
  font-size: 15px;
`;

const StatLabel = styled.span`
  color: ${(p) => p.color};
  font-size: 16px;
  font-weight: 600;
`;


const ProgressBar = styled.div`
  width: 400px;
  height: 10px;
  background: #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 30px;
`;

const ProgressFill = styled.div`
  height: 100%;
  width: ${(p) => p.percent}%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  transition: width 0.4s ease;
`;

const CardWrapper = styled.div`
  perspective: 1000px;
  width: 480px;
  height: 300px;
`;

const Card = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
  transform: ${(p) => (p.$flipped ? "rotateY(180deg)" : "none")};
  cursor: pointer;
`;

const Face = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: white;
  color: #111827;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
  backface-visibility: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const Back = styled(Face)`
  transform: rotateY(180deg);
  background: #f3f4f6;
`;

const Controls = styled.div`
  display: flex;
  gap: 40px;
  margin-top: 40px;
  align-items: center;
`;

const Btn = styled.button`
  background: ${(p) =>
    p.color === "green"
      ? "#22c55e"
      : p.color === "red"
      ? "#ef4444"
      : "#3b82f6"};
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
  &:hover {
    opacity: 0.9;
  }
`;

// 🌟 Popup hoàn thành
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
`;

const Popup = styled.div`
  background: white;
  padding: 40px 50px;
  border-radius: 16px;
  text-align: center;
  color: #111827;
  width: 420px;
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.3s ease;
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const PopupTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 20px;
`;

const PopupActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 10px;
`;

const PopupBtn = styled.button`
  background: ${(p) => (p.color === "blue" ? "#3b82f6" : "#22c55e")};
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
  &:hover {
    opacity: 0.9;
  }
`;

// 🧠 Component chính
export default function FlashcardPracticeFlip() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [flipped, setFlipped] = useState(false);
  const [current, setCurrent] = useState(0);
  const [knowing, setKnowing] = useState(0);
  const [learning, setLearning] = useState(0);
  const [knownCards, setKnownCards] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  // Load tiến độ
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`practice_${groupId}`));
    if (saved) {
      setKnowing(saved.knowing || 0);
      setLearning(saved.learning || 0);
      setKnownCards(saved.knownCards || []);
    }
  }, [groupId]);

  useEffect(() => {
    localStorage.setItem(
      `practice_${groupId}`,
      JSON.stringify({ knowing, learning, knownCards })
    );
  }, [knowing, learning, knownCards, groupId]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getFlashcardsByGroup(groupId);
      setFlashcards(data || []);
    };
    fetchData();
  }, [groupId]);

  const currentCard = flashcards[current];
  const total = flashcards.length;
  const progressPercent = total > 0 ? ((knowing + learning) / total) * 100 : 0;

  const handleNext = (type) => {
    if (type === "known") {
      setKnowing((prev) => prev + 1);
      setKnownCards([...knownCards, currentCard.id]);
    } else {
      setLearning((prev) => prev + 1);
    }
    setFlipped(false);

    let nextIndex = current + 1;
    while (nextIndex < flashcards.length && knownCards.includes(flashcards[nextIndex].id)) {
      nextIndex++;
    }

    if (nextIndex >= flashcards.length) {
      setShowPopup(true);
    } else {
      setCurrent(nextIndex);
    }
  };

  const handleShuffle = () => {
    const remaining = flashcards.filter((f) => !knownCards.includes(f.id));
    setFlashcards([...remaining.sort(() => Math.random() - 0.5)]);
    setCurrent(0);
    setFlipped(false);
    setShowPopup(false);
  };

  if (flashcards.length === 0) {
    return (
      <Container>
        <p>Không có flashcard nào trong nhóm này.</p>
      </Container>
    );
  }

  return (
    <Container>
      <Stats>
        <StatBadge>
          <StatNumber color="#f97316">{learning}</StatNumber>
          <StatLabel color="#f97316">Still learning</StatLabel>
        </StatBadge>

        <StatBadge>
          <StatLabel color="#10b981">Know</StatLabel>
          <StatNumber color="#10b981">{knowing}</StatNumber>
        </StatBadge>
      </Stats>


      <ProgressBar>
        <ProgressFill percent={progressPercent} />
      </ProgressBar>

      <CardWrapper>
        <Card $flipped={flipped} onClick={() => setFlipped(!flipped)}>
          <Face>{currentCard?.title}</Face>
          <Back>{currentCard?.content}</Back>
        </Card>
      </CardWrapper>

      <Controls>
        <Btn onClick={() => navigate(`/flashcards/${groupId}`)}>↩ Quay lại</Btn>
        <Btn color="red" onClick={() => handleNext("learning")}>✗</Btn>
        <Btn color="green" onClick={() => handleNext("known")}>✓</Btn>
        <Btn color="blue" onClick={handleShuffle}> Xáo lại</Btn>
      </Controls>

      <p style={{ marginTop: "20px" }}>
        Thẻ {current + 1}/{flashcards.length}
      </p>

      {showPopup && (
        <Overlay>
          <Popup>
            <PopupTitle>🎉 Bạn đã hoàn thành lượt ôn!</PopupTitle>
            <p style={{ color: "#6b7280", fontSize: "16px" }}>
              Bạn đã học {knowing} từ, còn {flashcards.length - knowing} từ cần ôn lại.
            </p>
            <PopupActions>
              <PopupBtn color="blue" onClick={handleShuffle}> Ôn lại</PopupBtn>
              <PopupBtn onClick={() => navigate(`/flashcards/${groupId}`)}>↩ Quay lại</PopupBtn>
            </PopupActions>
          </Popup>
        </Overlay>
      )}
    </Container>
  );
}
