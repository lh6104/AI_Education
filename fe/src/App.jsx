import React from "react";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import styled from "styled-components";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/chatbot.css";
import Home from "./pages/home/Home";
import Library from "./pages/library";
import Forum from "./pages/forum";
import MyCourses from "./pages/my-courses";
import RoadmapList from "./pages/my-courses/list";
import RoadmapDetail from "./pages/my-courses/detail";
import Tests from "./pages/tests";
import Video from "./pages/video";
import Flashcard from "./pages/flashcard/FlashCard";
import FlashcardDetail from "./pages/flashcard/FlashcardDetail";
import FlashcardPracticeFlip from "./pages/flashcard/FlashcardPracticeFlip";
import History from "./pages/history";
import Feature1 from "./pages/feature-1";
import Chatbot from "./pages/chatbot";
import Ranking from "./pages/ranking";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AuthSuccess from "./pages/auth/AuthSuccess";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Detail from "./pages/tests/detail";
import Attempt from "./pages/tests/attemp"; // add
import CourseDetail from "./pages/my-courses/course_detail";

const AppRoot = styled.div`
  display: flex;
  min-height: calc(100vh - 72px);
  margin-top: 64px;
`;

const MainArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-image: url("/background.png");
  background-size: cover;
`;

const Content = styled.div`
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

const App = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/success" element={<AuthSuccess />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div>
                <Topbar />
                <AppRoot>
                  <Sidebar />
                  <MainArea>
                    <Content>
                      <LeftCol>
                        <Routes>
                          <Route index element={<Home />} />
                          <Route path="/library" element={<Library />} />
                          <Route path="/forum" element={<Forum />} />
                          <Route path="/my-courses" element={<MyCourses />} />
                          <Route path="/my-courses/course" element={<CourseDetail />} />
                          <Route path="/roadmaps" element={<RoadmapList />} />
                          <Route path="/roadmaps/:id" element={<RoadmapDetail />} />
                          <Route path="/tests" element={<Tests />} />
                          <Route path="/tests/:id" element={<Detail />} />
                          <Route path="/tests/:id/attempt" element={<Attempt />} /> {/* add */}
                          <Route path="/flashcard" element={<Flashcard />} />
                          <Route path="/flashcards/:groupId" element={<FlashcardDetail />} />
                          <Route path="/flashcards/:groupId/practice" element={<FlashcardPracticeFlip />} />
                          {/* <Route path="/flashcards/:groupId/practice/fill" element={<FlashcardPracticeFill />} /> */}
                          <Route path="/history" element={<History />} />
                          <Route path="/feature-1" element={<Feature1 />} />
                          <Route path="/ranking" element={<Ranking />} />
                          <Route path="/chatbot" element={<Chatbot />} />
                          <Route path="/video" element={<Video />} />
                          <Route
                            path="*"
                            element={<Navigate to="/" replace />}
                          />
                        </Routes>
                      </LeftCol>
                      {/* Right column removed from global layout — pages that need a right panel (Home) render it locally */}
                    </Content>
                  </MainArea>
                </AppRoot>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
