import React from "react";
import Score from "./right/Score";
import LessonsCount from "./right/LessonsCount";
import Streak from "./right/Streak";
import Ranking from "./right/Ranking";
import { RightPanelWrap, RowCards, Col40, Col60 } from "./right/styles";

const RightPanel = () => {
  return (
    <RightPanelWrap>
      <RowCards>
        <Col40>
          <Score xp={50} />
        </Col40>
        <Col60>
          <LessonsCount completed={427} />
        </Col60>
      </RowCards>
      <Streak days={100} />
      <Ranking />
    </RightPanelWrap>
  );
};

export default RightPanel;
