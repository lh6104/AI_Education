import React from "react";
import styled from "styled-components";
import LessonsGrid from "./lessons/LessonsGrid";
import Ranking from "./right/Ranking";
import Streak from "./right/Streak";
import {
  useCompletedLessonsCount,
  useDailyStreak,
  useTotalScore,
} from "../../hooks/useDashboardQueries";
import { SkeletonText } from "../../components/ui/Skeleton";
import {
  RightPanelWrap,
  RowCards,
  Col40,
  Col60,
  CenterCard,
  BookImg,
  CountBig,
} from "./right/styles";

const PageWrap = styled.div``;

const WelcomeBannerWrap = styled.div`
  position: relative;
  background: linear-gradient(90deg, #4f9cf8 0%, #7dc7ff 60%);
  color: #fff;
  padding: 14px 20px;
  border-radius: 8px;
  margin: 18px 28px 8px 28px;
  overflow: hidden;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }
  p {
    margin: 4px 0 0 0;
    color: rgba(255, 255, 255, 0.9);
    font-size: 13px;
  }

  &::after {
    content: "";
    position: absolute;
    right: 0;
    top: 0;
    width: 220px;
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0) 0%,
      rgba(255, 255, 255, 0.12) 100%
    );
    pointer-events: none;
  }
`;

const HomeInner = styled.div`
  display: flex;
  gap: var(--gap);
  padding: 20px 28px;
`;

const LeftCol = styled.main`
  flex: 3;
`;
const RightCol = styled.aside`
  flex: 2;
  max-width: 420px;
`;

const WelcomeBanner = ({ userName = "Thu Hiếu" }) => (
  <WelcomeBannerWrap>
    <div className="welcome-text">
      <h2>Xin chào, {userName}!</h2>
      <p>Hãy bắt đầu những bước đầu tiên ......</p>
    </div>
  </WelcomeBannerWrap>
);

const RightPanel = () => {
  const { data: xp, isLoading: xpLoading } = useTotalScore();
  const { data: completedLessons, isLoading: lessonsLoading } =
    useCompletedLessonsCount();
  const { data: streakDays, isLoading: streakLoading } = useDailyStreak();

  return (
    <RightPanelWrap>
      <RowCards>
        <Col40>
          <CenterCard>
            <BookImg src="/medal.png" alt="medal" />
            {xpLoading ? (
              <SkeletonText $height="24px" $width="80px" />
            ) : (
              <CountBig>{typeof xp === "number" ? `${xp} XP` : "—"}</CountBig>
            )}
          </CenterCard>
        </Col40>
        <Col60>
          <CenterCard>
            <BookImg src="/book.png" alt="book" />
            {lessonsLoading ? (
              <SkeletonText $height="24px" $width="100px" />
            ) : (
              <CountBig>
                {typeof completedLessons === "number"
                  ? `${completedLessons} bài học`
                  : "—"}
              </CountBig>
            )}
          </CenterCard>
        </Col60>
      </RowCards>

      <Streak
        days={typeof streakDays === "number" ? streakDays : 0}
        active={typeof streakDays === "number" ? streakDays : 0}
      />

      <Ranking />
    </RightPanelWrap>
  );
};

const Home = () => {
  return (
    <PageWrap>
      <WelcomeBanner />
      <HomeInner>
        <LeftCol>
          <LessonsGrid />
        </LeftCol>
        <RightCol>
          <RightPanel />
        </RightCol>
      </HomeInner>
    </PageWrap>
  );
};

export default Home;
