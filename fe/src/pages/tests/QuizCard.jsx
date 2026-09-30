import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const QuizCard = ({ quiz, menuOpen, onToggleMenu, onEdit, onDelete }) => {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString();
  };

  // Get highest score from attempts
  const getHighestScore = () => {
    if (!quiz.attempts || quiz.attempts.length === 0) return "-";
    const scores = quiz.attempts.map((a) => a.score || 0);
    return Math.max(...scores);
  };

  return (
    <div
      className="quiz-card"
      style={{ ...styles.card, ...(hovered ? styles.cardHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/tests/${quiz.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") navigate(`/tests/${quiz.id}`);
      }}
    >
      <button
        className="ellipsis-btn"
        style={styles.ellipsis}
        onClick={(e) => {
          e.stopPropagation();
          onToggleMenu();
        }}
        title="More actions"
        aria-label="More actions"
      >
        ⋮
      </button>

      {menuOpen && (
        <div style={styles.menu} onClick={(e) => e.stopPropagation()}>
          <button
            style={{ ...styles.menuItem, color: "#c0392b" }}
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      )}

      <div style={{ padding: "12px 12px 16px 12px" }}>
        <div style={styles.titleRow}>
          <h3
            style={{
              ...styles.title,
              ...(hovered ? styles.titleHover : {}),
            }}
          >
            {quiz.name || `Quiz #${quiz.id}`}
          </h3>
        </div>

        <p style={styles.desc}>{quiz.description || "No description"}</p>

        <div style={styles.statsGrid}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Max Score</span>
            <span style={styles.statValue}>{quiz.max_score ?? 0}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Attempts</span>
            <span style={styles.statValue}>
              {quiz.attempts?.length || 0}
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Highest</span>
            <span style={styles.statValue}>{getHighestScore()}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Created</span>
            <span style={styles.statValue}>
              {formatDate(quiz.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    position: "relative",
    borderRadius: 12,
    borderWidth: "1.5px",
    borderStyle: "solid",
    borderColor: "#93c5fd",
    background: "#ffffff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
    overflow: "hidden",
    minHeight: 180,
    transition:
      "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease, background-color 120ms ease",
    cursor: "pointer",
  },
  cardHover: {
    transform: "translateY(-2px) scale(1.02)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    borderColor: "#2563eb",
    background: "#ffffff",
  },
  ellipsis: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#111827",
    fontWeight: 700,
    fontSize: 20,
    lineHeight: "26px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  menu: {
    position: "absolute",
    top: 45,
    right: 8,
    background: "#ffffff",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderRadius: 8,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    padding: 6,
    zIndex: 10,
    minWidth: 140,
  },
  menuItem: {
    display: "block",
    width: "100%",
    textAlign: "left",
    background: "transparent",
    border: "none",
    padding: "8px 10px",
    cursor: "pointer",
    borderRadius: 6,
  },
  titleRow: { display: "flex", alignItems: "center", gap: 8 },
  title: {
    margin: "10px 0 4px 0",
    fontSize: 18,
    color: "#111827",
    transition: "color 120ms ease",
  },
  titleHover: { color: "#2563eb" },
  desc: {
    margin: "6px 0 12px 0",
    color: "#6b7280",
    fontSize: 13,
    minHeight: 20,
    lineHeight: 1.4,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 8,
    marginTop: 12,
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    padding: "6px 8px",
    background: "#f9fafb",
    borderRadius: 6,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: 600,
  },
};

export default QuizCard;