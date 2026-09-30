import React from "react";
import LessonCard from "./LessonCard";
import styled from "styled-components";
import { useDashboardLessons } from "../../../hooks/useDashboardQueries";
import { LessonCardSkeleton } from "../../../components/ui/Skeleton";

const Grid = styled.section`
  padding: 0 12px;
`;
const GridHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;
const MoreLink = styled.a`
  color: var(--accent);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  text-decoration: none;
`;
const GridWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
`;

const LessonsGrid = ({ items = 4, showInProgress = true }) => {
  const { data: lessons = [], isLoading } = useDashboardLessons();
  const displayLessons = lessons.slice(0, items);

  return (
    <Grid>
      <GridHeader>
        <h3 style={{ margin: "0 0px 16px 0px" }}>Khám phá Thư viện khóa học</h3>
        <MoreLink>
          {" "}
          Xem thêm <span style={{ opacity: 0.9 }}>›</span>
        </MoreLink>
      </GridHeader>
      <GridWrap>
        {isLoading
          ? // Show skeleton loaders while loading
            Array.from({ length: items }).map((_, i) => (
              <LessonCardSkeleton key={`skeleton-${i}`} />
            ))
          : displayLessons.map((d, i) => {
              const percent = d?.progress?.progress_percent ?? 0;
              const inProgress = showInProgress && percent > 0;
              return (
                <LessonCard
                  key={d.id}
                  title={d.title}
                  content={d.content}
                  lessons={d.lessons || 10}
                  duration={d.duration || "1h 30m"}
                  inProgress={inProgress}
                  progress={percent}
                />
              );
            })}
      </GridWrap>
    </Grid>
  );
};

export default LessonsGrid;
