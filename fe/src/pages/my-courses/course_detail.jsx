import React, { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LessonApi } from "../../api/lessonApi";
import "../../styles/buttons.css";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import MarkdownWithMermaid from "./MarkdownWithMermaid";


/**
 * Course detail page with a different sidebar:
 * - left sidebar lists chapters for the selected course (accordion)
 * - right main area shows course header and chapter detail when selected
 *
 * Expects course_id in query string: ?course_id=123
 */

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const CourseDetail = () => {
  const q = useQuery();
  const navigate = useNavigate();
  const courseId = q.get("course_id");
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [openChapterId, setOpenChapterId] = useState(null);
  const [courseInfo, setCourseInfo] = useState({});
  const [lessonsMap, setLessonsMap] = useState({}); // { [chapterId]: [lessons] }
  const [loadingLessons, setLoadingLessons] = useState({}); // { [chapterId]: true/false }
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loadingSelectedLesson, setLoadingSelectedLesson] = useState(false);
  const [selectedLessonErr, setSelectedLessonErr] = useState("");

  const fetchChapters = useCallback(async (cid) => {
    if (!cid) return;
    setLoading(true);
    setErr("");
    try {
      const data = await LessonApi.listChapters(cid);
      setChapters(Array.isArray(data) ? data : []);
      if (data && data.course_name) {
        setCourseInfo({ name: data.course_name, estimated_duration: data.estimated_duration });
      } else {
        if (Array.isArray(data) && data.length > 0 && data[0].course_id) {
          setCourseInfo((c) => ({ ...c, id: data[0].course_id }));
        }
      }
    } catch (e) {
      setErr(e?.message || "Failed to load chapters");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLessonsForChapter = useCallback(
    async (chapterId) => {
      if (!chapterId) return;
      // avoid double fetch
      if (lessonsMap[chapterId]) return;
      setLoadingLessons((s) => ({ ...s, [chapterId]: true }));
      try {
        const data = await LessonApi.generateLessonsForChapter(chapterId);
        setLessonsMap((m) => ({ ...m, [chapterId]: Array.isArray(data) ? data : [] }));
      } catch (e) {
        setErr(e?.message || "Failed to load lessons");
      } finally {
        setLoadingLessons((s) => ({ ...s, [chapterId]: false }));
      }
    },
    [lessonsMap]
  );

  // init: ensure a single request per courseId (handles React StrictMode)
  useEffect(() => {
    if (!courseId) return;

    // per-course promise cache to avoid duplicate network calls
    if (!window.__courseChaptersPromise) window.__courseChaptersPromise = {};

    let mounted = true;
    setLoading(true);
    setErr("");

    // get or create promise for this course
    let p = window.__courseChaptersPromise[courseId];
    if (!p) {
      p = LessonApi.generateChapters(courseId)
        .then((data) => {
          // keep resolved value so future mounts get resolved immediately
          window.__courseChaptersPromise[courseId] = Promise.resolve(data);
          return data;
        })
        .catch((err) => {
          // clear cache on error so future attempts can retry
          window.__courseChaptersPromise[courseId] = null;
          throw err;
        });
      window.__courseChaptersPromise[courseId] = p;
    }

    p.then((data) => {
      if (!mounted) return;
      setChapters(Array.isArray(data) ? data : []);
      if (data && data.course_name) {
        setCourseInfo({ name: data.course_name, estimated_duration: data.estimated_duration });
      } else if (Array.isArray(data) && data.length > 0 && data[0].course_id) {
        setCourseInfo((c) => ({ ...c, id: data[0].course_id }));
      }
    })
      .catch((e) => {
        if (!mounted) return;
        setErr(e?.message || "Failed to generate chapters");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [courseId]);

  const fetchLessonContent = useCallback(
    async (lessonId) => {
      if (!lessonId) return;
      setSelectedLessonErr("");
      setLoadingSelectedLesson(true);
      try {
        const lesson = await LessonApi.updateLessonContent(lessonId);
        setSelectedLesson(lesson);
      } catch (e) {
        setSelectedLessonErr(e?.message || "Failed to load lesson content");
      } finally {
        setLoadingSelectedLesson(false);
      }
    },
    []
  );

  const handleToggle = (id) => {
    const willOpen = openChapterId !== id;
    setOpenChapterId((prev) => (prev === id ? null : id));
    if (willOpen) {
      fetchLessonsForChapter(id);
    }
  };

  const handleUseChapter = (chapter) => {
    // navigate to my-courses page and preselect course/chapter
    navigate(`/my-courses?course_id=${courseId}&chapter_id=${chapter.id}`);
  };

  // when clicking a lesson in the list, open & fetch its content
  const onLessonClick = (lesson) => {
    // keep chapter open
    setOpenChapterId((prev) => prev === lesson.chapter_id ? prev : openChapterId);
    setSelectedLesson(null);
    fetchLessonContent(lesson.id);
    // also focus main area if needed
  };

  return (
    <div className="main-page-handler" style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 320,
          maxHeight: "calc(100vh - 160px)", // limit height and allow scrolling if too tall
          overflowY: "auto",
          borderRadius: 8,
          padding: 12,
          background: "#f8fafc",
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Chapters</h3>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 20 }}>
            {/* replace the path with your actual gif asset path */}
            <img
              src="/AI loading.gif"
              alt="Loading chapters"
              style={{ width: 60, height: 60, objectFit: "contain" }}
            />
            <div className="loading-title" style={{ marginTop: 12, fontSize: 16, color: "#374151", fontWeight: 600 }}>
              Your chapters are now loading...
            </div>
            <style>{`
              .loading-title {
                display: inline-block;
                animation: floatY 2.4s ease-in-out infinite;
                will-change: transform;
              }
              @keyframes floatY {
                0% { transform: translateY(0); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0); }
              }
            `}</style>
          </div>
        ) : err ? (
          <div style={{ color: "red" }}>{err}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {chapters.length === 0 && !loading && (
              <div style={{ padding: 12, color: "#6b7280" }}>No chapters found.</div>
            )}

            {chapters.map((ch) => {
              const open = openChapterId === ch.id;
              return (
                <div
                  key={ch.id}
                  style={{
                    borderRadius: 8,
                    overflow: "hidden",
                    border: open ? "1px solid #93c5fd" : "1px solid rgba(15, 23, 42, 0.06)",
                    transition: "all 180ms ease",
                  }}
                >
                  <button
                    onClick={() => handleToggle(ch.id)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      padding: "10px 12px",
                      background: open ? "#eef8ff" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>
                        {ch.order ? `${ch.order}. ` : ""}{ch.name}
                      </div>
                      {ch.estimated_duration && <div style={{ fontSize: 12, color: "#6b7280" }}>{ch.estimated_duration}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: "#3b82f6" }}>{open ? "▾" : "▸"}</div>
                  </button>

                  <div
                    style={{
                      maxHeight: open ? 1000 : 0,
                      transition: "max-height 220ms ease, padding 180ms ease",
                      padding: open ? "12px" : "0 12px",
                      background: "#fff",
                    }}
                  >
                    {open && (
                      <>
                        {loadingLessons[ch.id] ? (
                          <div style={{ padding: 8, color: "#6b7280" }}>Loading lessons...</div>
                        ) : (
                          <>
                            {(lessonsMap[ch.id] || []).length === 0 ? (
                              <div style={{ padding: 8, color: "#6b7280" }}>No lessons found.</div>
                            ) : (
                              // scrollable lesson list when too tall
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 8,
                                  paddingRight: 8, // give space for scrollbar
                                }}
                              >
                                {lessonsMap[ch.id].map((lesson) => {
                                  const isSelected = selectedLesson && (selectedLesson.id === lesson.id || selectedLesson.lesson_id === lesson.id);
                                  return (
                                    <div
                                      key={lesson.id}
                                      role="button"
                                      tabIndex={0}
                                      onClick={() => onLessonClick(lesson)}
                                      style={{
                                        padding: 8,
                                        borderRadius: 6,
                                        background: isSelected ? "#eef8ff" : "#f8fafc",
                                        border: isSelected ? "1px solid #3b82f6" : "1px solid transparent",
                                        boxShadow: isSelected ? "0 1px 6px rgba(59,130,246,0.08)" : "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                      }}
                                    >
                                      <div>
                                        <div style={{ fontWeight: 600, color: isSelected ? "#0b54b2" : "#0f172a" }}>
                                          {lesson.order ? `${lesson.order}. ` : ""}{lesson.name || lesson.lesson_name}
                                        </div>
                                        {lesson.estimated_duration && (
                                          <div style={{ fontSize: 12, color: "#6b7280" }}>{lesson.estimated_duration}</div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>{courseInfo.name || "Course detail"}</h2>
            {courseInfo.estimated_duration && (
              <div style={{ color: "#6b7280", fontSize: 13 }}>Estimated: {courseInfo.estimated_duration}</div>
            )}
          </div>
          <div>
            <button className="btn" onClick={() => navigate(-1)}>Back</button>
          </div>
        </div>

        <div style={{ borderRadius: 8, padding: 16, background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
          <h4 style={{ marginTop: 0 }}>
            {selectedLesson ? selectedLesson.name || selectedLesson.lesson_name : "Selected chapter"}
          </h4>

          {/* selected lesson view */}
          {loadingSelectedLesson ? (
            <div style={{ color: "#6b7280" }}>Loading lesson content...</div>
          ) : selectedLesson ? (
            (() => {
              // parse detail (may be JSON string)
              let detailObj = null;
              try {
                detailObj =
                  typeof selectedLesson.detail === "string"
                    ? JSON.parse(selectedLesson.detail)
                    : selectedLesson.detail || null;
              } catch (err) {
                detailObj = null;
              }

              return (
                <div>
                  {/* Estimated duration */}
                  {selectedLesson.estimated_duration && (
                    <div style={{ color: "#6b7280", marginTop: 6 }}>{selectedLesson.estimated_duration}</div>
                  )}

                  {/* Content: render Markdown + LaTeX */}
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Lesson content</div>
                    <div
                      style={{
                        borderRadius: 6,
                        padding: 12,
                        background: "#f8fafc",
                      }}
                    >
                      {/* <ReactMarkdown
                        children={selectedLesson.content || "(No content)"}
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex, rehypeRaw]}
                      /> */}

                      <MarkdownWithMermaid content={selectedLesson.content || "(No content)"} />

                    </div>
                  </div>

                  {/* Details: practice questions, guidance, references */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Practice questions</div>
                    {detailObj && Array.isArray(detailObj.practice_questions) ? (
                      <ol>
                        {detailObj.practice_questions.map((q, i) => (
                          <li key={i} style={{ marginBottom: 8 }}>
                            <div style={{ whiteSpace: "pre-wrap" }}>{q}</div>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div style={{ color: "#6b7280" }}>No practice questions.</div>
                    )}

                    <div style={{ fontWeight: 700, marginTop: 12, marginBottom: 8 }}>Guidance / Answers</div>
                    {detailObj && Array.isArray(detailObj.guidance) ? (
                      <ol>
                        {detailObj.guidance.map((g, i) => (
                          <li key={i} style={{ marginBottom: 8 }}>
                            <div style={{ whiteSpace: "pre-wrap" }}>{g}</div>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div style={{ color: "#6b7280" }}>No guidance available.</div>
                    )}

                    <div style={{ fontWeight: 700, marginTop: 12, marginBottom: 8 }}>Reference materials</div>
                    {detailObj && Array.isArray(detailObj.reference_materials) ? (
                      <ul>
                        {detailObj.reference_materials.map((r, i) => (
                          <li key={i} style={{ marginBottom: 6 }}>
                            {typeof r === "string" && r.startsWith("http") ? (
                              <a href={r} target="_blank" rel="noreferrer">{r}</a>
                            ) : (
                              <span style={{ whiteSpace: "pre-wrap" }}>{r}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ color: "#6b7280" }}>No references.</div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : openChapterId ? (
            (() => {
              const ch = chapters.find((c) => c.id === openChapterId);
              if (!ch) return <div>Chapter not found.</div>;
              return (
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{ch.name}</div>
                  {ch.estimated_duration && <div style={{ color: "#6b7280", marginTop: 6 }}>{ch.estimated_duration}</div>}
                  {ch.general_info && <div style={{ marginTop: 12 }}>{ch.general_info}</div>}
                </div>
              );
            })()
          ) : (
            <div style={{ color: "#6b7280" }}>Select a chapter or lesson from the left to see details.</div>
          )}
          {selectedLessonErr && <div style={{ color: "red", marginTop: 12 }}>{selectedLessonErr}</div>}
        </div>
      </main>
    </div>
  );
};

export default CourseDetail;