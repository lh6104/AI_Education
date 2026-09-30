import React from "react";
import styled from "styled-components";
import { Card } from "./styles";
import { useWeeklyRanking } from "../../../hooks/useDashboardQueries";
import { RankingListSkeleton } from "../../../components/ui/Skeleton";

const RankingList = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const RankingItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed rgba(15, 23, 42, 0.04);
`;

const NameWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Avatar = styled.span`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background-size: cover;
  background-position: center;
  display: inline-block;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #eaf4ff;
  padding: 10px 12px;
  border-radius: 8px 8px 0 0;
  margin: -14px -14px 12px -14px; /* pull full-bleed inside Card padding */
`;
const Crown = styled.img`
  width: 24px;
  height: 26px;
`;

const LeftGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Medal = styled.img`
  width: 28px;
  height: 32px;
`;

const RankNumber = styled.span`
  width: 22px;
  text-align: center;
  color: #2563eb; /* blue */
  font-weight: 700;
`;

const XP = styled.span`
  font-weight: 700;
  color: #334155;
`;

const HighlightedItem = styled(RankingItem)`
  background: #eaf4ff;
  border-radius: 8px;
  padding: 12px 8px;
`;

// week number is provided by API via useWeeklyRanking; helper removed.

const Ranking = () => {
  // New API shape: { week: number, top: Array<...>, user: { position, total_score, ... } }
  // Backward-compat: if data is a number, treat it as "my position" only.
  const { data: rankingData, isLoading } = useWeeklyRanking();

  // Normalize "top" list
  const topList = Array.isArray(rankingData?.top)
    ? rankingData.top
    : [
        { id: 1, name: "Hoàng Ngọc Minh", xp: 60 },
        { id: 2, name: "Nguyễn Minh Anh", xp: 40 },
        { id: 3, name: "Đỗ Trà My", xp: 20 },
        { id: 4, name: "Đặng Nguyễn Tuệ Lâm", xp: 1 },
        { id: 5, name: "Lưu Dược Minh Phi", xp: 1 },
      ];

  // Derive my/user info
  const me = (() => {
    if (rankingData && typeof rankingData === "object" && rankingData.user) {
      const u = rankingData.user;
      const displayName = u.name || u.full_name || u.username || "Bạn";
      const score = u.total_score ?? u.score ?? u.xp ?? 0;
      const position = u.position ?? u.rank ?? "—";
      return { name: displayName, xp: score, rank: position };
    }
    if (typeof rankingData === "number") {
      return { name: "Bạn", xp: "--", rank: rankingData };
    }
    return { name: "Bạn", xp: "--", rank: "—" };
  })();

  return (
    <Card>
      <Header>
        <LeftGroup>
          <Crown src="/crown.png" alt="crown" />
          <strong>
            Bảng xếp hạng
            {typeof rankingData === "object" && rankingData?.week
              ? ` · Tuần ${rankingData.week}`
              : ""}
          </strong>
        </LeftGroup>
      </Header>

      <RankingList>
        {isLoading ? (
          <RankingListSkeleton />
        ) : (
          <>
            {topList.map((d, idx) => {
              const isTop = idx < 3;
              const medalSrc =
                idx === 0
                  ? "/gold.png"
                  : idx === 1
                  ? "/silver.png"
                  : "/bronze.png";
              const displayName =
                d.name ||
                d.full_name ||
                d.username ||
                d.email ||
                `Người dùng ${idx + 1}`;
              const score = d.total_score ?? d.score ?? d.xp ?? 0;
              return (
                <RankingItem key={d.id ?? `${displayName}-${idx}`}>
                  <NameWrap>
                    {isTop ? (
                      <Medal src={medalSrc} alt={`medal-${idx + 1}`} />
                    ) : (
                      <RankNumber>{idx + 1}</RankNumber>
                    )}
                    <Avatar
                      style={{
                        backgroundImage: `url(/avatar-${(idx % 6) + 1}.svg)`,
                      }}
                    />
                    {displayName}
                  </NameWrap>
                  <XP>{score} XP</XP>
                </RankingItem>
              );
            })}

            {/* some empty rows to mimic the screenshot separation */}
            <RankingItem style={{ borderBottom: "none", height: 20 }}>
              <span>-</span>
            </RankingItem>

            {/* Highlighted current user at bottom */}
            <HighlightedItem>
              <NameWrap>
                <RankNumber>{me.rank}</RankNumber>
                <Avatar style={{ backgroundImage: `url(/avatar-4.svg)` }} />
                {me.name}
              </NameWrap>
              <XP>{me.xp} XP</XP>
            </HighlightedItem>
          </>
        )}
      </RankingList>
    </Card>
  );
};

export default Ranking;
