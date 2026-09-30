import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LessonApi } from "../../api/lessonApi";
import "../../styles/buttons.css";

const RoadmapDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchRoadmap = useCallback(async (rid) => {
    try {
      setLoading(true);
      setErr("");
      const data = await LessonApi.getRoadmap(rid);
      setRoadmap(data);
    } catch (e) {
      setErr(e.message || "Failed to load roadmap");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) fetchRoadmap(id);
  }, [id, fetchRoadmap]);

  const handleUseRoadmap = () => {
    // redirect to my-courses with roadmap_id param
    navigate(`/my-courses?roadmap_id=${id}`);
  };

  if (loading) return <div className="main-page-handler">Loading roadmap...</div>;
  if (err) return <div className="main-page-handler" style={{ color: "red" }}>{err}</div>;
  if (!roadmap) return <div className="main-page-handler">Roadmap not found.</div>;

  return (
    <div className="main-page-handler">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>{roadmap.name}</h2>
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            {roadmap.time_start ? `Start: ${new Date(roadmap.time_start).toLocaleDateString()} • ` : ""}
            Created: {roadmap.created_at ? new Date(roadmap.created_at).toLocaleString() : "—"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => navigate("/roadmaps")}>Back</button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {(!roadmap.sections || roadmap.sections.length === 0) && (
          <div style={{ color: "#6b7280" }}>No sections in this roadmap.</div>
        )}

        {roadmap.sections?.map((sec) => (
          <div
            key={sec.id}
            style={{
              borderRadius: 8,
              padding: 12,
              background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              border: "1px solid #3b82f6",         // light blue border
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 14, color: "#374151", fontWeight: 600 }}>
                  {sec.order ? `${sec.order}. ` : ""}{sec.name}
                </div>
                {sec.estimated_duration && (
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Estimated: {sec.estimated_duration}</div>
                )}
                {sec.general_info && <div style={{ marginTop: 8, color: "#374151" }}>{sec.general_info}</div>}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>{(sec.courses?.length ?? 0) + " courses"}</div>
              <div style={{ display: "grid", gap: 8 }}>
                {sec.courses?.map((c) => (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/my-courses/course?course_id=${c.id}&section_id=${sec.id}&roadmap_id=${roadmap.id}`)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 10,
                      borderRadius: 6,
                      background: "#f8fafc",
                      cursor: "pointer",
                      transition: "transform 120ms ease, box-shadow 120ms ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                  >
                    <div>
                      <div style={{ fontSize: 14, color: "#111827", fontWeight: 600 }}>
                        {c.order ? `${c.order}. ` : ""}{c.name}
                      </div>
                      {c.estimated_duration && <div style={{ fontSize: 12, color: "#6b7280" }}>{c.estimated_duration}</div>}
                      {c.general_info && <div style={{ fontSize: 13, color: "#374151", marginTop: 6 }}>{c.general_info}</div>}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>Open</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadmapDetail;
