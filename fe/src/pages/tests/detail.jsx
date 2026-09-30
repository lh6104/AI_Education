import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QuizzApi } from "../../api/quizzApi";
import "../../styles/buttons.css"; // Import global button styles

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [showPreview, setShowPreview] = useState(true); // default expanded, preview latest
  const [previewAttempt, setPreviewAttempt] = useState(null); // attempt being previewed

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        
        // Call two APIs in parallel
        const [quizData, attemptsData] = await Promise.all([
          QuizzApi.get(id),
          QuizzApi.getAttempts(id)
        ]);
        
        if (!mounted) return;
        setQuiz(quizData || null);
        setResults(Array.isArray(attemptsData) ? attemptsData : []);
      } catch (e) {
        if (!mounted) return;
        setErr(e.message || "Failed to load quiz");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [id]);

  const questions = useMemo(() => {
    const list = Array.isArray(quiz?.questions) ? quiz.questions : [];
    return list.map((q, idx) => {
      let options = q.options;
      if (typeof options === "string") {
        try { options = JSON.parse(options); } catch { options = []; }
      }
      return { ...q, idx: idx + 1, options: Array.isArray(options) ? options : [] };
    });
  }, [quiz]);

  const latestResult = useMemo(() => {
    if (!results.length) return null;
    // Sort by created_at desc (most recent first)
    const sorted = [...results].sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return tb - ta;
    });
    return sorted[0];
  }, [results]);

  // default previewAttempt -> latestResult
  useEffect(() => {
    if (!previewAttempt && latestResult) {
      setPreviewAttempt(latestResult);
    }
    // if results changed and previewAttempt was removed, reset to latest
    if (previewAttempt && !results.find(r => r.id === previewAttempt.id)) {
      setPreviewAttempt(latestResult);
    }
  }, [latestResult, results, previewAttempt]);

  const parseAnswers = (attempt) => {
    if (!attempt) return {};
    const a = attempt.submitted_answer;
    if (!a) return {};
    if (typeof a === "string") {
      try { return JSON.parse(a) || {}; } catch { return {}; }
    }
    return a;
  };

  const parseFeedback = (attempt) => {
    if (!attempt) return {};
    const f = attempt.ai_feedback;
    if (!f) return {};
    if (typeof f === "string") {
      try { return JSON.parse(f) || {}; } catch { return {}; }
    }
    return f;
  };

  const computeCorrectCount = (attempt) => {
    if (!attempt) return 0;
    const ans = parseAnswers(attempt);
    return questions.reduce((acc, q) => {
      const q_type = (q.question_type || "choice");
      if (q_type !== "choice") return acc;
      const ua = ans[q.id] ?? ans[String(q.id)];
      const userRaw = ua == null ? "" : String(ua).trim();
      const mUser = userRaw.match(/^\s*([A-Za-z])[\.\)]\s*(.*)$/);
      const userKey = mUser ? mUser[1].toUpperCase() : (userRaw ? userRaw[0].toUpperCase() : "");
      const ansRaw = String(q.answer ?? "").trim();
      const mAns = ansRaw.match(/([A-Za-z])/);
      const ansKey = mAns ? mAns[1].toUpperCase() : ansRaw.toUpperCase();
      return acc + ((ansKey && userKey && ansKey === userKey) ? 1 : 0);
    }, 0);
  };

  const latestAnswers = useMemo(() => parseAnswers(latestResult), [latestResult]);
  const latestFeedback = useMemo(() => parseFeedback(latestResult), [latestResult]);

  if (loading) return <div style={styles.page}><div>Loading...</div></div>;
  if (err) return <div style={styles.page}><div style={styles.error}>{err}</div></div>;
  if (!quiz) return <div style={styles.page}><div>No quiz found.</div></div>;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>{quiz.name || `Quiz #${quiz.id}`}</h2>
          <div style={styles.subtle}>
            Lesson: {quiz.lesson_id ?? "N/A"} • Max score: {quiz.max_score ?? 0} • ID: {quiz.id}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate("/tests")}
          >
            ← Back to quiz list
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/tests/${id}/attempt`)}>
            Attempt quiz
          </button>
        </div>
      </div>

      {/* Quiz info */}
      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>Quiz info</h3>
        <div style={styles.infoGrid}>
          <InfoRow label="Description" value={quiz.description || "-"} />
          <InfoRow label="Lesson ID" value={quiz.lesson_id ?? "-"} />
          <InfoRow label="Max score" value={quiz.max_score ?? "-"} />
          <InfoRow label="Questions" value={questions.length} />
          <InfoRow label="Created" value={fmtDate(quiz.created_at)} />
        </div>
      </section>

      {/* Attempts table */}
      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>Attempts ({results.length})</h3>
        {results.length === 0 ? (
          <div style={styles.subtle}>No attempts yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>User ID</th>
                  <th style={styles.th}>Score</th>
                  <th style={styles.th}>Correct</th>
                  <th style={styles.th}>Submitted</th>
                  <th style={styles.th}>Preview</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const correct = computeCorrectCount(r);
                  const isActive = previewAttempt && previewAttempt.id === r.id;
                  return (
                    <tr key={r.id ?? i}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}>{r.user_id || "-"}</td>
                      <td style={styles.td}>{r.score ?? "-"}</td>
                      <td style={styles.td}>{correct}/{questions.length}</td>
                      <td style={styles.td}>{fmtDate(r.created_at)}</td>
                      <td style={styles.td}>
                        <button
                          onClick={() => { setPreviewAttempt(r); setShowPreview(true); }}
                          aria-label="Preview attempt"
                          title="Preview"
                          className={`btn-eye ${isActive ? 'active' : ''}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Attempt preview */}
      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Attempt preview</h3>
          {previewAttempt && (
            <button 
              style={styles.toggleBtn} 
              onClick={() => setShowPreview(!showPreview)}
              aria-label={showPreview ? "Hide preview" : "Show preview"}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{
                  transform: showPreview ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease"
                }}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          )}
        </div>

        {!previewAttempt ? (
          <div style={styles.subtle}>No attempt selected for preview.</div>
        ) : showPreview ? (
          <>
            <div style={styles.latestSummary}>
              <div>Score: <b>{previewAttempt.score ?? "-"}</b></div>
              <div>Correct: <b>{computeCorrectCount(previewAttempt)}/{questions.length}</b></div>
              <div>Submitted: {fmtDate(previewAttempt.created_at)}</div>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {questions.map((q) => {
                const q_type = (q.question_type || "choice");
                const answersObj = parseAnswers(previewAttempt);
                const feedbackObj = parseFeedback(previewAttempt);
                const userAns = answersObj[q.id] ?? answersObj[String(q.id)];
                const userRaw = userAns == null ? "" : String(userAns).trim();

                if (q_type === "essay") {
                  const feedback = feedbackObj[q.id] ?? feedbackObj[String(q.id)] ?? null;
                  return (
                    <div key={q.id} style={{ ...styles.questionItem, borderColor: "#f59e0b" }}>
                      <div style={styles.qHeader}>
                        <div style={styles.qIndex}>Q{q.idx}</div>
                        <div style={styles.qTitle}>{q.question}</div>
                        <div style={{ ...styles.badge, background: "#fffbeb", color: "#92400e" }}>
                          Valued
                        </div>
                      </div>

                      <div style={styles.freeText}>
                        <div>Your answer: <b>{userAns ?? "-"}</b></div>
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>AI feedback:</div>
                          <div style={{ background: "#fff", borderRadius: 8, padding: 10, border: "1px solid #f3f4f6", color: "#111827" }}>
                            {feedback ? (typeof feedback === "string" ? feedback : JSON.stringify(feedback)) : <span style={{ color: "#9ca3af" }}>No feedback</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // choice question rendering
                const mUser = userRaw.match(/^\s*([A-Za-z])[\.\)]\s*(.*)$/);
                const userKey = mUser ? mUser[1].toUpperCase() : (userRaw ? userRaw[0].toUpperCase() : "");
                const ansRaw = String(q.answer ?? "").trim();
                const mAns = ansRaw.match(/([A-Za-z])/);
                const ansKey = mAns ? mAns[1].toUpperCase() : ansRaw.toUpperCase();
                const isCorrect = ansKey && userKey && (ansKey === userKey);

                return (
                  <div key={q.id} style={{ ...styles.questionItem, borderColor: isCorrect ? "#10b981" : "#ef4444" }}>
                    <div style={styles.qHeader}>
                      <div style={styles.qIndex}>Q{q.idx}</div>
                      <div style={styles.qTitle}>{q.question}</div>
                      <div style={{ ...styles.badge, background: isCorrect ? "#d1fae5" : "#fee2e2", color: isCorrect ? "#065f46" : "#7f1d1d" }}>
                        {isCorrect ? "✓ Correct" : "✗ Wrong"}
                      </div>
                    </div>
                    {q.options?.length > 0 && (
                      <ul style={styles.options}>
                        {q.options.map((opt, oi) => {
                          const rawOpt = String(opt ?? "");
                          const mOpt = rawOpt.match(/^\s*([A-Za-z])[\.\)]\s*(.*)$/);
                          const optKey = mOpt ? mOpt[1].toUpperCase() : String.fromCharCode(65 + oi);
                          const optText = mOpt ? mOpt[2] : rawOpt;
                          const isUser = optKey === userKey;
                          const isAnswer = optKey === ansKey;
                          return (
                            <li key={oi} style={styles.optionRow}>
                              <span style={{ ...styles.optionTag, ...(isAnswer ? styles.answerTag : {}), ...(isUser ? styles.userTag : {}) }}>
                                {optKey}
                              </span>
                              <span>{optText}</span>
                              {isAnswer && <span style={styles.correctLabel}>✓ Correct</span>}
                              {isUser && !isAnswer && <span style={styles.wrongLabel}>Your answer</span>}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {(!q.options || q.options.length === 0) && (
                      <div style={styles.freeText}>
                        <div>Your answer: <b>{userAns ?? "-"}</b></div>
                        {q.answer && <div style={styles.correctAnswer}>Correct answer: <b>{q.answer}</b></div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={styles.subtle}>Click the chevron to view results.</div>
        )}
      </section>
    </div>
  );
};

function InfoRow({ label, value }) {
  return (
    <div style={styles.infoRow}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value}</div>
    </div>
  );
}

function fmtDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return dt.toLocaleString();
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}

const styles = {
  page: { margin: "0 auto", padding: 0 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  subtle: { color: "#6b7280", fontSize: 13 },
  card: {
    background: "#fff",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#2563eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: { margin: 0, fontSize: 18 },
  toggleBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#2563eb",
    borderRadius: 4,
    transition: "background 0.2s ease",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  infoRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: 8,
    alignItems: "center",
  },
  infoLabel: { color: "#6b7280", fontSize: 13 },
  infoValue: { color: "#111827" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "10px 8px",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "#e5e7eb",
    color: "#6b7280",
    fontWeight: 600,
  },
  td: {
    padding: "10px 8px",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "#f3f4f6",
  },
  previewBtn: {
    border: "1px solid #e5e7eb",
    background: "transparent",
    padding: 6,
    borderRadius: 6,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#374151"
  },
  previewBtnActive: {
    background: "#2563eb",
    color: "#fff",
    borderColor: "#2563eb"
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    display: "inline-block",
  },
  latestSummary: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 12,
    marginTop: 12,
    color: "#374151",
  },
  questionItem: {
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    background: "#fafafa",
  },
  qHeader: {
    display: "grid",
    gridTemplateColumns: "48px 1fr auto",
    gap: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  qIndex: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "#eff6ff",
    color: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
  qTitle: { fontWeight: 600, color: "#111827" },
  badge: {
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  },
  options: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 },
  optionRow: { display: "flex", gap: 8, alignItems: "center" },
  optionTag: {
    minWidth: 22,
    height: 22,
    borderRadius: 6,
    background: "#f3f4f6",
    color: "#374151",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
  },
  answerTag: { background: "#dcfce7", color: "#065f46" },
  userTag: { outline: "2px solid #3b82f6" },
  correctLabel: { color: "#065f46", fontSize: 12, fontWeight: 600, marginLeft: "auto" },
  wrongLabel: { color: "#7f1d1d", fontSize: 12, fontWeight: 600, marginLeft: "auto" },
  freeText: { display: "grid", gap: 6 },
  correctAnswer: { color: "#065f46", fontSize: 13 },
  error: { color: "#b91c1c", background: "#fee2e2", padding: 10, borderRadius: 8 },
};

export default Detail;