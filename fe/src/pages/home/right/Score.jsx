import React from "react";
import { CenterCard, BookImg, CountBig } from "./styles";

const Score = ({ xp = 0 }) => {
  return (
    <CenterCard>
      <BookImg src="/medal.png" alt="medal" />
      <CountBig>{xp} XP</CountBig>
    </CenterCard>
  );
};

export default Score;
