import React, { useEffect, useState, useCallback } from "react";
import { LessonApi } from "../../api/lessonApi";
import "../../styles/buttons.css";

const RoadmapList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [hovered, setHovered] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const fetchRoadmaps = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await LessonApi.listRoadmaps(0, 100);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load roadmaps");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmaps();
  }, [fetchRoadmaps]);

  const handleCardClick = (r) => {
    // go to roadmap detail page (single click on card)
    window.location.href = `/roadmaps/${r.id}`;
  };

  const handleToggleMenu = (e, id) => {
    e.stopPropagation();
    setMenuOpenId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async (e, r) => {
    e.stopPropagation();
    const ok = window.confirm(`Delete roadmap "${r.name}"? This cannot be undone.`);
    if (!ok) {
      setMenuOpenId(null);
      return;
    }
    try {
      await LessonApi.deleteRoadmap(r.id);
      setMenuOpenId(null);
      fetchRoadmaps();
    } catch (err) {
      alert(err?.message || "Failed to delete roadmap");
    }
  };

  const cardBaseStyle = {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    transition: "transform 200ms ease, box-shadow 200ms ease, background-color 200ms ease",
    cursor: "pointer",
    userSelect: "none",
  };

  const cardHoverStyle = {
    transform: "scale(1.03)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
    backgroundColor: "#f0f9ff",
  };

  return (
    <div className="main-page-handler">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Lộ trình học tập</h2>
        <button className="btn btn-primary" onClick={() => (window.location.href = "/my-courses")}>
          Tạo mới lộ trình
        </button>
      </div>

      {loading && <div>Loading...</div>}
      {err && <div style={{ color: "red" }}>{err}</div>}

      {!loading && !err && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {items.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>No roadmaps found.</div>
          ) : (
            items.map((r) => {
              const isHovered = hovered === r.id;
              const menuOpen = menuOpenId === r.id;
              return (
                <div
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCardClick(r)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleCardClick(r);
                  }}
                  onMouseEnter={() => setHovered(r.id)}
                  onMouseLeave={() => {
                    setHovered(null);
                    // close menu when leaving card
                    setMenuOpenId((prev) => (prev === r.id ? null : prev));
                  }}
                  style={{ ...cardBaseStyle, ...(isHovered ? cardHoverStyle : {}) }}
                >
                  {/* ellipsis / actions */}
                  <button
                    className="ellipsis-btn"
                    aria-label="More actions"
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      width: 32,
                      height: 32,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: 18,
                    }}
                    onClick={(e) => handleToggleMenu(e, r.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleToggleMenu(e, r.id);
                    }}
                  >
                    ⋮
                  </button>

                  {menuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute",
                        top: 44,
                        right: 12,
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        padding: 6,
                        zIndex: 40,
                        minWidth: 140,
                      }}
                    >
                      <button
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          background: "transparent",
                          border: "none",
                          padding: "8px 10px",
                          cursor: "pointer",
                          borderRadius: 6,
                          color: "#c0392b",
                        }}
                        onClick={(e) => handleDelete(e, r)}
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  <h3 style={{ margin: "0 0 8px 0" }}>{r.name}</h3>
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
                    {r.time_start ? `Start: ${new Date(r.time_start).toLocaleDateString()} • ` : ""}
                    Created: {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                  </div>
                  <div style={{ marginBottom: 12, color: "#374151" }}>{r.sections?.length ?? 0} sections</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>Click card to view roadmap details</div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default RoadmapList;