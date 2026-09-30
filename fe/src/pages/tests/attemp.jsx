import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QuizzApi } from "../../api/quizzApi";
import "../../styles/buttons.css"; // Import global button styles
import "../../styles/loading.css"; // <-- new import

const Attempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: value }
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startedAt, setStartedAt] = useState(Date.now());

  // new state for progress/evaluation
  const [progress, setProgress] = useState(0);
  const [evalDone, setEvalDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await QuizzApi.get(id);
        if (!mounted) return;
        setQuiz(data || null);

        const qs = Array.isArray(data?.questions) ? data.questions : [];
        const parsed = qs.map((q, i) => {
          let opts = q.options;
          if (typeof opts === "string") {
            try { opts = JSON.parse(opts); } catch { opts = []; }
          }
          return { ...q, options: Array.isArray(opts) ? opts : [], idx: i + 1 };
        });
        setQuestions(parsed);
        setStartedAt(Date.now());
      } catch (e) {
        if (!mounted) return;
        setErr(e.message || "Failed to load quiz");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [id]);

  // progress effect: while submitting, advance progress up to 95%
  useEffect(() => {
    let timer;
    if (submitting && !evalDone) {
      setProgress(0);
      timer = setInterval(() => {
        setProgress((p) => {
          // increment with some randomness until 95%
          const next = Math.min(95, p + Math.random() * 8 + 2);
          return next;
        });
      }, 400);
    } else if (!submitting && evalDone) {
      // ensure 100% visible for a short time
      setProgress(100);
    }
    return () => clearInterval(timer);
  }, [submitting, evalDone]);

  const currentQ = useMemo(() => questions[currentIdx], [questions, currentIdx]);
  const total = questions.length;

  const setAnswer = (qid, value) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const goPrev = () => setCurrentIdx((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentIdx((i) => Math.min(total - 1, i + 1));
  const jumpTo = (i) => setCurrentIdx(i);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const doSubmit = async () => {
    try {
      setSubmitting(true);
      setEvalDone(false);
      setProgress(0);
      const duration_seconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      await QuizzApi.submitAttempt(id, {
        answers,
        duration_seconds,
      });

      // server returned — mark done and show 100% briefly
      setEvalDone(true);
      setSubmitting(false);
      setProgress(100);

      // show Done! for a short moment then close modal and navigate
      setTimeout(() => {
        setShowConfirm(false);
        navigate(`/tests/${id}`); // back to detail after submit
        // reset progress states
        setProgress(0);
        setEvalDone(false);
      }, 800);
    } catch (e) {
      alert(e.message || "Submit failed");
      setSubmitting(false);
      setShowConfirm(false);
      setProgress(0);
      setEvalDone(false);
    }
  };

  if (loading) return <div style={styles.page}>Loading...</div>;
  if (err) return <div style={styles.page}><div style={styles.error}>{err}</div></div>;
  if (!quiz) return <div style={styles.page}>Quiz not found</div>;
  if (!currentQ) return <div style={styles.page}>No questions</div>;

  const userAns = answers[currentQ.id];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>{quiz.name || `Quiz #${quiz.id}`}</h2>
          <div style={styles.subtle}>
            Question {currentIdx + 1} of {total} • Answered {answeredCount}/{total}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => navigate(`/tests/${id}`)}>
            Back
          </button>
          <button className="btn btn-primary" onClick={() => setShowConfirm(true)} disabled={submitting}>
            Submit
          </button>
        </div>
      </div>

      <div style={styles.layout}>
        {/* Side navigation */}
        <div style={styles.sideNav}>
          <div style={styles.sideTitle}>Questions</div>
          <div style={styles.sideGrid}>
            {questions.map((q, i) => {
              const answered = answers[q.id] !== undefined && answers[q.id] !== null && String(answers[q.id]).trim() !== "";
              const isActive = i === currentIdx;
              return (
                <button
                  key={q.id}
                  style={{
                    ...styles.sideItem,
                    ...(isActive ? styles.sideItemActive : {}),
                    ...(answered ? styles.sideItemAnswered : {}),
                  }}
                  onClick={() => jumpTo(i)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question panel */}
        <div style={styles.qPanel}>
          <div style={styles.qCard}>
            <div style={styles.qHeader}>
              <div style={styles.qIndex}>Q{currentQ.idx}</div>
              <div style={styles.qTitle}>{currentQ.question}</div>
            </div>

            {/* Options for MCQ */}
            {Array.isArray(currentQ.options) && currentQ.options.length > 0 ? (
              <div style={{ display: "grid", gap: 10 }}>
                {currentQ.options.map((opt, i) => {
                  const raw = String(opt ?? "");
                  // try parse option in form "A. answer" or "A) answer"
                  const m = raw.match(/^\s*([A-Za-z])[\.\)]\s*(.*)$/);
                  const key = m ? m[1].toUpperCase() : String.fromCharCode(65 + i);
                  const text = m ? m[2] : raw;
                  const checked = String(userAns || "") === key;
                  return (
                    <label key={i} style={styles.optionRow}>
                      <input
                        type="radio"
                        name={`q_${currentQ.id}`}
                        checked={checked}
                        onChange={() => setAnswer(currentQ.id, key)}
                      />
                      <span style={styles.optionTag}>{key}</span>
                      <span>{text}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              // Essay / free text
              <div>
                <textarea
                  rows={5}
                  placeholder="Type your answer..."
                  style={styles.textarea}
                  value={String(userAns || "")}
                  onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                />
              </div>
            )}

            <div style={styles.navRow}>
              <button className="btn btn-secondary" onClick={goPrev} disabled={currentIdx === 0}>
                Previous
              </button>
              <button className="btn btn-secondary" onClick={goNext} disabled={currentIdx === total - 1}>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm submit modal */}
      {showConfirm && (
        <div style={styles.backdrop} onClick={() => !submitting && setShowConfirm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalContent}>
              {/* When submitting or showing evaluation result, replace modal content */}
              {(submitting || evalDone) ? (
                <>
                  <img
                    src="/search imm.gif"
                    alt="Evaluating..."
                    className="loading-gif"  // <-- use class
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  <div className="progress-wrap">
                    <div className="progress-bar-outer">
                      <div className="progress-bar-inner" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="progress-label">
                      {evalDone ? "Done!" : "Evaluating..."}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <img 
                    src="/online-exam.png" 
                    alt="Submit confirmation" 
                    style={styles.modalImage}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div style={{ ...styles.modalImageFallback, display: 'none' }}>
                    ✅
                  </div>
                  <h3 style={styles.modalTitle}>Submit answers?</h3>
                  <p style={styles.modalText}>
                    You have answered <strong>{answeredCount}</strong> of <strong>{total}</strong> questions.
                  </p>
                  <div style={styles.modalActions}>
                    <button className="btn btn-secondary" onClick={() => setShowConfirm(false)} disabled={submitting}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" onClick={doSubmit} disabled={submitting}>
                      {submitting ? "Submitting..." : "Confirm submit"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { margin: "0 auto", padding: 16 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  subtle: { color: "#6b7280", fontSize: 13 },
  layout: { display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 },
  sideNav: {
    borderWidth: "1px", borderStyle: "solid", borderColor: "#e5e7eb",
    borderRadius: 10, padding: 12, background: "#fff",
  },
  sideTitle: { fontWeight: 600, marginBottom: 8 },
  sideGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 },
  sideItem: {
    height: 36, borderRadius: 8, borderWidth: "1px", borderStyle: "solid",
    borderColor: "#e5e7eb", background: "#f9fafb", cursor: "pointer",
  },
  sideItemActive: { borderColor: "#2563eb", boxShadow: "0 0 0 2px rgba(37,99,235,0.2)" },
  sideItemAnswered: { background: "#dcfce7", borderColor: "#86efac" },
  qPanel: {},
  qCard: {
    borderWidth: "1px", borderStyle: "solid", borderColor: "#e5e7eb",
    borderRadius: 12, background: "#fff", padding: 16,
  },
  qHeader: { display: "grid", gridTemplateColumns: "48px 1fr", gap: 10, alignItems: "center", marginBottom: 12 },
  qIndex: {
    width: 36, height: 36, borderRadius: 8, background: "#eff6ff", color: "#1d4ed8",
    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
  },
  qTitle: { fontWeight: 600, color: "#111827" },
  optionRow: { display: "flex", gap: 8, alignItems: "center", borderRadius: 8, padding: 8, background: "#f9fafb" },
  optionTag: {
    minWidth: 22, height: 22, borderRadius: 6, background: "#eef2ff",
    color: "#3730a3", display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 700,
  },
  textarea: { width: "100%", borderWidth: "1px", borderStyle: "solid", borderColor: "#e5e7eb", borderRadius: 8, padding: 10 },
  navRow: { marginTop: 16, display: "flex", justifyContent: "space-between" },
  error: { color: "#b91c1c", background: "#fee2e2", padding: 10, borderRadius: 8 },
  backdrop: { 
    position: "fixed", 
    inset: 0, 
    background: "rgba(0,0,0,0.45)", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    zIndex: 1000 
  },
  modal: { 
    width: 420, 
    background: "#fff", 
    borderRadius: 12, 
    padding: 24, 
    boxShadow: "0 16px 48px rgba(0,0,0,0.2)" 
  },
  modalContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  modalImage: {
    width: 120,
    height: 120,
    objectFit: "contain",
    marginBottom: 16,
  },
  processingImage: {
    width: 140,
    height: 140,
    objectFit: "contain",
    marginBottom: 12,
  },
  modalImageFallback: {
    width: 120,
    height: 120,
    fontSize: 60,
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    margin: "0 0 8px 0",
    fontSize: 20,
    fontWeight: 600,
    color: "#111827",
  },
  modalText: {
    margin: "0 0 20px 0",
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1.5,
  },
  modalActions: {
    display: "flex",
    gap: 8,
    width: "100%",
    justifyContent: "center",
  },

  // progress styles
  progressWrap: { width: "100%", marginTop: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  progressBarOuter: { width: "100%", height: 10, background: "#f3f4f6", borderRadius: 999, overflow: "hidden" },
  progressBarInner: { height: "100%", background: "linear-gradient(90deg,#f59e0b,#f97316)", width: "0%", transition: "width 300ms ease" },
  progressLabel: { fontSize: 14, color: "#374151", fontWeight: 600 },

};

export default Attempt;