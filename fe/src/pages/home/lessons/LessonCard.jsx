import React from "react";
import styled from "styled-components";
// MUI components (used for the compact meta row)
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import BookIcon from "@mui/icons-material/MenuBook";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const LessonCardWrap = styled.article`
  background: var(--card);
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid #4f83fc;
  box-shadow: 0 6px 18px rgba(2, 6, 23, 0.03);
  display: flex;
  flex-direction: column;
`;
const Thumb = styled.div`
  height: 180px;
  background-image: url("/public/code.png");
  background-size: cover;
  background-position: center;
`;
const Info = styled.div`
  padding: 12px;
`;
const Subtitle = styled.p`
  margin: 12px 0 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.4;
`;

const ProgressWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
`;
const ProgressBar = styled.div`
  flex: 1;
  height: 10px;
  background: #e6f4ea;
  border-radius: 999px;
  overflow: hidden;
`;
const ProgressInner = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #34d399, #10b981);
  width: ${(props) => props.percent || 0}%;
`;
const ProgressText = styled.div`
  min-width: 80px;
  text-align: right;
  color: #475569;
  font-weight: 600;
  font-size: 14px;
`;

const LessonCard = ({
  title = "Business Analysis",
  lessons = 10,
  content = "Khóa học bổ trợ Khóa học bổ trợ Khóa học bổ trợ Khóa học bổ trợ Khóa học bổ trợ Khóa học bổ trợ",
  duration = "1h 30m",
  inProgress = false,
  progress = 0,
}) => {
  return (
    <LessonCardWrap>
      <Thumb />
      <Info>
        <p style={{ fontWeight: "600", margin: 0 }}>{title}</p>
        <Subtitle>
          {content}
        </Subtitle>
        {inProgress ? (
          <>
            <ProgressWrap>
              <ProgressBar>
                <ProgressInner percent={progress} />
              </ProgressBar>
              <ProgressText>Hoàn thành {progress}%</ProgressText>
            </ProgressWrap>
          </>
        ) : (
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            sx={{
              marginTop: 1,
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                background: "#fff",
                borderRadius: 1.5,
                padding: "6px 0px",
              }}
            >
              <BookIcon fontSize="small" sx={{ color: "#6b7280" }} />
              <Typography
                color="#6b7280"
                variant="body2"
                sx={{ fontWeight: 600 }}
              >
                {" "}
                {lessons} Bài Học
              </Typography>
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                background: "#fff",
                borderRadius: 1.5,
                padding: "6px 0px",
              }}
            >
              <AccessTimeIcon fontSize="small" sx={{ color: "#6b7280" }} />
              <Typography
                color="#6b7280"
                variant="body2"
                sx={{ fontWeight: 600 }}
              >
                {duration}
              </Typography>
            </Stack>
          </Stack>
        )}
      </Info>
    </LessonCardWrap>
  );
};

export default LessonCard;
