import React from "react";
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const SkeletonBase = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  border-radius: ${(props) => props.$radius || "4px"};
`;

export const SkeletonText = styled(SkeletonBase)`
  height: ${(props) => props.$height || "16px"};
  width: ${(props) => props.$width || "100%"};
  margin: ${(props) => props.$margin || "0"};
`;

export const SkeletonCard = styled(SkeletonBase)`
  height: ${(props) => props.$height || "200px"};
  width: ${(props) => props.$width || "100%"};
  border-radius: ${(props) => props.$radius || "12px"};
`;

export const SkeletonCircle = styled(SkeletonBase)`
  height: ${(props) => props.$size || "36px"};
  width: ${(props) => props.$size || "36px"};
  border-radius: 50%;
`;

const LessonCardSkeletonWrap = styled.article`
  background: var(--card);
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid #e5e7eb;
  box-shadow: 0 6px 18px rgba(2, 6, 23, 0.03);
  display: flex;
  flex-direction: column;
`;

const ThumbSkeleton = styled(SkeletonBase)`
  height: 180px;
  width: 100%;
  border-radius: 0;
`;

const InfoSkeleton = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const LessonCardSkeleton = () => (
  <LessonCardSkeletonWrap>
    <ThumbSkeleton />
    <InfoSkeleton>
      <SkeletonText $height="18px" $width="70%" />
      <SkeletonText $height="14px" $width="100%" />
      <SkeletonText $height="14px" $width="90%" />
      <SkeletonText $height="10px" $width="100%" $margin="12px 0 0 0" />
    </InfoSkeleton>
  </LessonCardSkeletonWrap>
);

const RankingItemSkeleton = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed rgba(15, 23, 42, 0.04);
`;

const NameWrapSkeleton = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const RankingListSkeleton = () => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <RankingItemSkeleton key={i}>
        <NameWrapSkeleton>
          <SkeletonCircle $size="36px" />
          <SkeletonText $height="16px" $width="120px" />
        </NameWrapSkeleton>
        <SkeletonText $height="16px" $width="50px" />
      </RankingItemSkeleton>
    ))}
  </>
);
