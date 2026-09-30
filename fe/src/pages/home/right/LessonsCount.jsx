import React from "react";
import { CenterCard, BookImg, CountBig } from "./styles";

const LessonsCount = ({ completed = 0 }) => {
  return (
    <CenterCard>
      <BookImg src="/book.png" alt="book" />
      <CountBig>{completed} bài học</CountBig>
    </CenterCard>
  );
};

export default LessonsCount;
