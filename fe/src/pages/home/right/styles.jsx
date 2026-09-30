import styled from "styled-components";

export const RightPanelWrap = styled.aside`
  flex: 2;
  max-width: 420px;
  padding: 0 16px;
`;
export const RowCards = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
`;

export const Col40 = styled.div`
  flex: 0 0 40%;
  display: flex;
  flex-direction: column;
`;
export const Col60 = styled.div`
  flex: 0 0 60%;
  display: flex;
  flex-direction: column;
`;

export const Card = styled.div`
  background: var(--card);
  padding: 14px;
  border-radius: 10px;
  margin-bottom: 12px;
  border: 1px solid rgba(15, 23, 42, 0.04);
  box-shadow: 0 6px 18px rgba(2, 6, 23, 0.03);
  border: 1.5px solid #4f83fc;
`;

export const CenterCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 18px;
  width: 100%;
  gap: 8px;
`;
export const BookImg = styled.img`
  width: 64px;
  height: 64px;
`;
export const CountBig = styled.div`
  font-size: 20px;
  color: #4f83fc;
  font-weight: 800;
`;
export const CountLabel = styled.div`
  font-size: 14px;
  color: #475569;
  margin-top: 6px;
  font-weight: 600;
`;

export const StreakHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;
export const StreakTitleLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
export const SmallIcon = styled.img`
  width: 20px;
  height: 28px;
`;
export const StreakTitle = styled.h4`
  font-size: 22px;
  margin: 0;
`;
export const StreakPill = styled.div`
  background: #dbeafe;
  border-radius: 999px;
  padding-right: 8px;
  color: #64b5f6;
  display: flex;
  align-items: center;
  gap: 4px;
`;
export const PillIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: #60a5fa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
`;
export const PillText = styled.span`
  font-weight: 700;
  font-size: 14px;
  color: #07418b;
`;

export const StreakGrid = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 18px;
  padding: 8px 4px;
`;
export const Day = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;
export const DaySquare = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
export const DayIcon = styled.img`
  height: 20px;
  width: 10px;
`;
export const DayLabel = styled.div`
  margin-top: 6px;
  color: #374151;
  font-weight: 700;
`;

export const DaySquareActive = styled(DaySquare)`
  background: #f97316;
`;
export const DaySquareInactive = styled(DaySquare)`
  background: #fde8c4;
`;

export const RankingList = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
`;
export const RankingItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed rgba(15, 23, 42, 0.04);
`;
export const NameWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;
export const Avatar = styled.span`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background-size: cover;
  background-position: center;
  display: inline-block;
`;

export default {};
