import React, { useEffect, useState, useCallback } from "react";
import { QuizzApi } from "../../api/quizzApi.js";
import QuizCard from "./QuizCard";
import GenerateQuizModal from "./GenerateQuizModal";
import "../../styles/buttons.css"; // Import global button styles

const Tests = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await QuizzApi.list(0, 100);
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
    const onClick = (e) => {
      if (!e.target.closest(".quiz-card") && !e.target.closest(".ellipsis-btn")) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [fetchQuizzes]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this quiz?")) return;
    try {
      await QuizzApi.remove(id);
      await fetchQuizzes();
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  };

  const handleEdit = (id) => {
    window.location.href = `/tests/${id}/edit`;
  };

  const handleGenerate = () => {
    setShowGenerate(true);
  };

  const handleQuizGenerated = async (quiz) => {
    // Reload the quiz list to show the new quiz
    await fetchQuizzes();
  };

  return (
    <div className="main-page-handler">
      <div style={styles.header}>
        <h2 style={{ margin: 0 }}>Kiểm tra</h2>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
        >
          Generate Quiz
        </button>
      </div>

      {loading && <div>Loading...</div>}
      {err && <div style={{ color: "red" }}>{err}</div>}

      {!loading && !err && (
        <>
          {quizzes.length === 0 ? (
            <div style={styles.emptyState}>
              <img
                src="/studying.png"
                alt="No quizzes"
                style={styles.emptyImage}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <div style={{ ...styles.emptyIcon, display: "none" }}>📝</div>
              <h3 style={styles.emptyTitle}>No quizzes found.</h3>
              <p style={styles.emptyText}>
                Create your first quiz by clicking "Generate Quiz" button above.
              </p>
            </div>
          ) : (
            <div style={styles.grid}>
              {quizzes.map((q) => (
                <QuizCard
                  key={q.id}
                  quiz={q}
                  menuOpen={menuOpenId === q.id}
                  onToggleMenu={() =>
                    setMenuOpenId(menuOpenId === q.id ? null : q.id)
                  }
                  onEdit={() => handleEdit(q.id)}
                  onDelete={() => handleDelete(q.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <GenerateQuizModal
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        onGenerated={handleQuizGenerated}
      />
    </div>
  );
};

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    textAlign: "center",
  },
  emptyImage: {
    width: "200px",
    height: "200px",
    objectFit: "contain",
    marginBottom: "20px",
    opacity: 0.8,
  },
  emptyIcon: {
    fontSize: "80px",
    marginBottom: "20px",
    opacity: 0.5,
  },
  emptyTitle: {
    margin: "0 0 8px 0",
    color: "#374151",
    fontSize: "20px",
    fontWeight: 600,
  },
  emptyText: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
    maxWidth: "400px",
  },
};

export default Tests;
