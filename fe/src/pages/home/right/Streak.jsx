import React from "react";
import {
  Card,
  SmallIcon,
  StreakPill,
  PillIcon,
  PillText,
  StreakGrid,
  Day,
  DaySquare,
  DaySquareActive,
  DaySquareInactive,
  DayIcon,
  DayLabel,
} from "./styles";

const Streak = ({ days = 100, active = 0 }) => {
  const week = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  // Calculate which days should be active based on streak starting from today
  const getActiveDays = () => {
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const todayIndex = today === 0 ? 6 : today - 1; // Convert to 0 = Monday, 6 = Sunday

    const activeDays = new Set();

    // Mark days as active counting backwards from today
    for (let i = 0; i < Math.min(active, 7); i++) {
      const dayIndex = (todayIndex - i + 7) % 7;
      activeDays.add(dayIndex);
    }

    return activeDays;
  };

  const activeDays = getActiveDays();

  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SmallIcon src="/lightning.png" alt="lt" />
          <h4 style={{ margin: 0, fontSize: 18 }}>Hoạt động</h4>
        </div>
        <StreakPill>
          <PillIcon>
            <img src="/fire.png" alt="fire" style={{ width: 20, height: 20 }} />
          </PillIcon>
          <PillText>{days} ngày học liên tiếp!</PillText>
        </StreakPill>
      </div>

      <StreakGrid>
        {week.map((d, i) => {
          const isActive = activeDays.has(i);
          const Square = isActive ? DaySquareActive : DaySquareInactive;
          const LightningIcon = isActive
            ? "/lightning_active.png"
            : "/lightning_inactive.png";
          return (
            <Day key={d}>
              <Square>
                <DayIcon src={LightningIcon} alt="lt" />
              </Square>
              <DayLabel>{d}</DayLabel>
            </Day>
          );
        })}
      </StreakGrid>
    </Card>
  );
};

export default Streak;
