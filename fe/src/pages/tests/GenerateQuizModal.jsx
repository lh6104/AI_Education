import React, { useState, useEffect } from "react";
import { QuizzApi } from "../../api/quizzApi";
import axiosClient from "../../api/axiosClient";
import "../../styles/buttons.css"; // Import global button styles

const defaultForm = { 
  quizName: "", 
  lesson: "", 
  level: "beginner", 
  numMCQ: 5, 
  numEssay: 1 
};

const GenerateQuizModal = ({ open, onClose, onGenerated }) => {
  const [form, setForm] = useState(defaultForm);
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(""); // "generating" | "saving"
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);
  const [autoCloseOnFull, setAutoCloseOnFull] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingLessons(true);
        // fetch current user's lessons that have non-empty content
        const res = await axiosClient.get("/api/v1/lessons/mine_with_content");
        if (!mounted) return;
        const list = Array.isArray(res.data) ? res.data : [];
        // ensure content exists and not empty
        setLessons(list.filter((l) => l && l.content && String(l.content).trim().length > 0));
      } catch (e) {
        console.error("Failed to load lessons for quiz dropdown", e);
        setLessons([]);
      } finally {
        if (mounted) setLoadingLessons(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open]);

  // Gradual progress by step
  useEffect(() => {
    if (!loading) return;
    let interval;
    if (loadingStep === "generating") {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 50) {
            clearInterval(interval);
            return 50;
          }
          return prev + 2; // ~2.5s to reach 50%
        });
      }, 100);
    } else if (loadingStep === "saving") {
      setProgress((p) => (p < 50 ? 50 : p));
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2; // ~2.5s to reach 100%
        });
      }, 100);
    }
    return () => interval && clearInterval(interval);
  }, [loadingStep, loading]);

  // Auto-close only after progress fully reaches 100%
  useEffect(() => {
    if (autoCloseOnFull && progress >= 100 && result) {
      // Give a tiny visual pause at 100%
      const t = setTimeout(() => {
        onGenerated && onGenerated(result);
        onClose();
        // Reset states after closing
        setForm(defaultForm);
        setResult(null);
        setLoading(false);
        setLoadingStep("");
        setProgress(0);
        setErr("");
        setAutoCloseOnFull(false);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [autoCloseOnFull, progress, result, onClose, onGenerated]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({
      ...s,
      [name]: name === "numMCQ" || name === "numEssay" ? Number(value) :
              name === "lesson_id" ? (value ? Number(value) : "") :
              value,
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setErr("");
    setResult(null);
    setProgress(0);
    try {
      setLoading(true);
      setLoadingStep("generating");

      // Call BE to generate and save
      const data = await QuizzApi.generateQuizWithAI({
        // pass lesson_id so backend uses lesson.content for prompt
        lesson_id: form.lesson_id || null,
        // keep lesson name as optional fallback/display only
        lesson: lessons.find((l) => l.id === form.lesson_id)?.name || form.lesson,
        level: form.level,
        numMCQ: form.numMCQ,
        numEssay: form.numEssay,
        quiz_name: form.quizName || null,
      });

      // Switch to "saving" step and wait for bar to fill to 100% before closing
      setResult(data);
      setLoadingStep("saving");
      setAutoCloseOnFull(true);
    } catch (ex) {
      setErr(ex.message || "Failed to generate quiz");
      setLoading(false);
      setLoadingStep("");
      setProgress(0);
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Generate Quiz with AI</h3>
          <button style={styles.iconBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleGenerate} style={styles.form}>
          {/* Hide inputs while loading/generating */}
          {!loading && (
            <>
              <label style={styles.label}>
                Quiz Name
                <input
                  name="quizName"
                  value={form.quizName}
                  onChange={handleChange}
                  placeholder="e.g., Python Loops Quiz (optional)"
                  style={styles.input}
                  disabled={loading}
                />
              </label>

              <label style={styles.label}>
                Lesson (choose one with content)
                {loadingLessons ? (
                  <div style={{ color: "#6b7280" }}>Loading lessons…</div>
                ) : (
                  <select
                    name="lesson_id"
                    value={form.lesson_id || ""}
                    onChange={handleChange}
                    style={styles.input}
                    required
                    disabled={loading}
                  >
                    <option value=""></option>
                    {lessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.order ? `${l.order}. ` : ""}{l.name || l.lesson_name || `Lesson ${l.id}`}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              <label style={styles.label}>
                Level
                <select 
                  name="level" 
                  value={form.level} 
                  onChange={handleChange} 
                  style={styles.input}
                  disabled={loading}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>

              <div style={styles.inline}>
                <label style={{ ...styles.label, flex: 1 }}>
                  # MCQ
                  <input
                    type="number"
                    min={0}
                    name="numMCQ"
                    value={form.numMCQ}
                    onChange={handleChange}
                    style={styles.input}
                    disabled={loading}
                  />
                </label>
                <label style={{ ...styles.label, flex: 1 }}>
                  # Essay
                  <input
                    type="number"
                    min={0}
                    name="numEssay"
                    value={form.numEssay}
                    onChange={handleChange}
                    style={styles.input}
                    disabled={loading}
                  />
                </label>
              </div>
            </>
          )}

          {err && <div style={styles.error}>{err}</div>}

          {loading ? (
            <div style={styles.loadingContainer}>
              <img 
                src="/AI loading.gif" 
                alt="Loading..." 
                style={styles.loadingGif}
              />
              <div style={styles.loadingText}>
                {loadingStep === "generating" && "Generating questions..."}
                {loadingStep === "saving" && "Saving to database..."}
              </div>
              <div style={styles.progressBar}>
                <div 
                  style={{
                    ...styles.progressFill,
                    width: `${progress}%`
                  }}
                ></div>
              </div>
              <div style={styles.progressText}>{progress}%</div>
            </div>
          ) : (
            <div style={{ overflow: "hidden", borderRadius: 8, display: "inline-block", width: "100%", maxWidth: "100%" }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ display: "inline-block", width: "100%", boxSizing: "border-box", transformOrigin: "center" }}
              >
                Generate
              </button>
            </div>
          )}
        </form>

        {result && (
          <div style={styles.preview}>
            <div style={styles.successMessage}>
              ✓ Quiz generated successfully!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 1000,
  },
  modal: {
    width: "min(720px, 92vw)",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
    padding: 16,
    maxHeight: "88vh",
    overflow: "auto",
  },
  header: { 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginBottom: 16 
  },
  iconBtn: {
    border: "none", 
    background: "transparent", 
    fontSize: 20, 
    cursor: "pointer", 
    lineHeight: 1,
  },
  form: { 
    display: "flex", 
    flexDirection: "column", 
    gap: 12, 
    marginBottom: 8 
  },
  label: { 
    display: "flex", 
    flexDirection: "column", 
    gap: 6, 
    fontSize: 14 
  },
  input: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: 8, 
    padding: "10px 12px", 
    fontSize: 14, 
    outline: "none",
  },
  inline: { 
    display: "flex", 
    gap: 12 
  },
  error: { 
    color: "#b91c1c", 
    background: "#fee2e2", 
    padding: 8, 
    borderRadius: 6 
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    padding: "24px 0",
  },
  loadingGif: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: 500,
  },
  progressBar: {
    width: "100%",
    height: 8,
    background: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)",
    transition: "width 0.3s ease-out",
  },
  progressText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 500,
  },
  preview: {
    marginTop: 12,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    paddingTop: 12,
  },
  successMessage: {
    color: "#047857",
    background: "#d1fae5",
    padding: 12,
    borderRadius: 8,
    textAlign: "center",
    fontWeight: 500,
  },
};

export default GenerateQuizModal;