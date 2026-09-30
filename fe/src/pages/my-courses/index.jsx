import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LessonApi } from "../../api/lessonApi";
import "../../styles/lesson.css"; 

const QUESTIONS = [
    {
        key: "knowledge_background.current_level",
        label: "Trình độ hiện tại / kiến thức nền tảng",
        type: "text",
        placeholder: "Ví dụ: Python cơ bản, Toán trung học, AI cơ bản",
    },
    {
        key: "knowledge_background.tools_used",
        label: "Công cụ / phần mềm đã sử dụng (phân cách bằng dấu phẩy)",
        type: "text",
        placeholder: "Ví dụ: Jupyter Notebook, VS Code",
    },

    { key: "learning_goal.field", label: "Lĩnh vực / môn học muốn học", type: "text", placeholder: "Ví dụ: Data Analysis" },
    {
        key: "learning_goal.specific_goal",
        label: "Mục tiêu cụ thể / kết quả mong muốn",
        type: "text",
        placeholder: "Ví dụ: Thành thạo Python để phân tích dữ liệu",
    },

    {
        key: "strengths_weaknesses.strengths",
        label: "Điểm mạnh (có lợi cho việc học)",
        type: "textarea",
        placeholder: "Ví dụ: Logic tốt, nắm nhanh cú pháp Python",
    },
    {
        key: "strengths_weaknesses.weaknesses",
        label: "Điểm yếu / khó khăn cần chú ý",
        type: "textarea",
        placeholder: "Ví dụ: Chưa quen với Pandas và visualization",
    },

    { key: "time_commitment.hours_per_week", label: "Số giờ học mỗi tuần", type: "number", placeholder: "Ví dụ: 6" },
    {
        key: "time_commitment.deadline",
        label: "Thời gian dự kiến hoàn thành mục tiêu",
        type: "text",
        placeholder: "Ví dụ: 3 tháng",
    },

    {
        key: "learning_style.speed",
        label: "Tốc độ học mong muốn",
        type: "radio",
        options: ["Nhanh", "Bình thường", "Chậm"],
    },
    {
        key: "learning_style.content_priority",
        label: "Ưu tiên nội dung",
        type: "multiselect",
        options: ["Lý thuyết", "Thực hành", "Câu hỏi", "Hướng dẫn giải"],
    },

    { key: "learning_style.text_only", label: "Ưu tiên chỉ văn bản (text-only)", type: "checkbox" },
    {
        key: "special_focus",
        label: "Chủ đề / kỹ năng đặc biệt (phân cách bằng dấu phẩy)",
        type: "text",
        placeholder: "Ví dụ: Machine Learning, Data Visualization, Python nâng cao",
    },
];

function getCurrentUser() {
    // Replace with real user retrieval
    return { name: "Nguyễn A", age: 25 };
}

function setDeep(obj, path, value) {
    const parts = path.split(".");
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        if (!(p in cur)) cur[p] = {};
        cur = cur[p];
    }
    cur[parts[parts.length - 1]] = value;
}

/* New: option card UI renderer + icons */
const optionIcon = (label) => {
    switch (label) {
        case "Nhanh":
            return "⚡";
        case "Bình thường":
            return "⏱️";
        case "Chậm":
            return "🐢";
        case "Lý thuyết":
            return "📘";
        case "Thực hành":
            return "🧪";
        case "Câu hỏi":
            return "❓";
        case "Hướng dẫn giải":
            return "🧭";
        case "text-only":
            return "📝";
        default:
            return "🔹";
    }
};

const Field = ({ q, value, onChange }) => {
    // textarea
    if (q.type === "textarea")
        return (
            <textarea
                placeholder={q.placeholder || ""}
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
            />
        );

    // number
    if (q.type === "number")
        return (
            <input
                type="number"
                placeholder={q.placeholder || ""}
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
            />
        );

    // radio -> render as icon/text cards
    if (q.type === "radio")
        return (
            <div className="option-cards">
                {q.options.map((o) => {
                    const selected = value === o;
                    return (
                        <div
                            key={o}
                            role="button"
                            tabIndex={0}
                            className={`option-card ${selected ? "selected" : ""}`}
                            onClick={() => onChange(o)}
                        >
                            <div className="card-icon">{optionIcon(o)}</div>
                            <div className="card-label">{o}</div>
                        </div>
                    );
                })}
            </div>
        );

    // multiselect -> cards (toggle)
    if (q.type === "multiselect")
        return (
            <div className="option-cards">
                {q.options.map((o) => {
                    const selSet = new Set(value || []);
                    const selected = selSet.has(o);
                    return (
                        <div
                            key={o}
                            role="button"
                            tabIndex={0}
                            className={`option-card ${selected ? "selected" : ""}`}
                            onClick={() => {
                                const next = new Set(value || []);
                                if (next.has(o)) next.delete(o);
                                else next.add(o);
                                onChange(Array.from(next));
                            }}
                        >
                            <div className="card-icon">{optionIcon(o)}</div>
                            <div className="card-label">{o}</div>
                        </div>
                    );
                })}
            </div>
        );

    // checkbox -> single card (text-only) — forced selected and disabled
    if (q.type === "checkbox")
        return (
            <div className="option-cards single">
                <div
                    className="option-card selected disabled"
                    aria-disabled="true"
                    title="Luôn bật: chỉ văn bản (text-only)"
                >
                    <div className="card-icon">{optionIcon("text-only")}</div>
                    <div className="card-label">{q.label}</div>
                </div>
            </div>
        );

    // csv or text -> plain input with placeholder
    return (
        <input
            type="text"
            placeholder={q.placeholder || ""}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
        />
    );
};

const MyCourses = () => {
    const navigate = useNavigate();
    const perPage = 2;
    const totalPages = Math.ceil(QUESTIONS.length / perPage);
    const [page, setPage] = useState(0);
    const [direction, setDirection] = useState("next"); // for animation
    const [submitting, setSubmitting] = useState(false);
    const user = useMemo(() => getCurrentUser(), []);
    // fixed roadmap name (doesn't change when navigating questions)
    const [roadmapName, setRoadmapName] = useState("");
    const [form, setForm] = useState({
        knowledge_background: { current_level: "", tools_used: [] },
        learning_goal: { field: "", specific_goal: "" },
        strengths_weaknesses: { strengths: "", weaknesses: "" },
        time_commitment: { hours_per_week: "", deadline: "" },
        // text_only is always true and disabled in the UI
        learning_style: { speed: "Bình thường", content_priority: [], text_only: true },
        special_focus: [],
    });

    const startIdx = page * perPage;
    const pageQuestions = QUESTIONS.slice(startIdx, startIdx + perPage);

    function handleChange(key, raw) {
        const next = JSON.parse(JSON.stringify(form));
        const q = QUESTIONS.find((x) => x.key === key);
        if (q?.type === "csv") {
            const arr = (raw || "").split(",").map((s) => s.trim()).filter(Boolean);
            setDeep(next, key, arr);
        } else if (q?.type === "number") {
            setDeep(next, key, Number(raw));
        } else if (q?.type === "checkbox") {
            // enforce text_only = true regardless of user interaction
            setDeep(next, key, true);
        } else {
            setDeep(next, key, raw);
        }
        setForm(next);
    }

    function go(nextPage) {
        setDirection(nextPage > page ? "next" : "prev");
        setPage(Math.max(0, Math.min(totalPages - 1, nextPage)));
    }

    async function handleSubmit() {
        setSubmitting(true);
        try {
            const payload = {
                personal_info: user,
                roadmap: { name: roadmapName },
                ...form,
            };
            console.debug("generateRoadmap payload:", payload, "roadmapName:", roadmapName);
            // pass roadmapName explicitly as second arg so backend body.roadmap_name is set
            const resp = await LessonApi.generateRoadmap(payload, roadmapName || null);
            console.debug("generateRoadmap response:", resp);
            // try to obtain roadmap id from common response shapes
            const roadmapId = resp?.id || resp?.roadmap_id || (typeof resp === "number" ? resp : null);
            if (roadmapId) {
                // go to roadmap detail page
                navigate(`/roadmaps/${roadmapId}`);
                return;
            }
            // fallback: go to roadmap list
            navigate("/roadmaps");
        } catch (err) {
            console.error(err);
            alert("Lỗi khi gửi: " + (err?.message || err));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="lp-page">
            <div className="lp-card">
                <div style={{ marginBottom: 12 }}>
                    <label className="lp-label">Tên lộ trình</label>
                    <input
                        type="text"
                        placeholder="Ví dụ: Lộ trình Data Analysis trong 3 tháng"
                        value={roadmapName}
                        onChange={(e) => setRoadmapName(e.target.value)}
                        style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ddd", boxSizing: "border-box" }}
                    />
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                        <button className="btn" onClick={() => navigate("/roadmaps")}>Roadmaps</button>
                        <div style={{ color: "#6b7280", fontSize: 13, alignSelf: "center" }}>or create a new one then you'll be redirected</div>
                    </div>
                </div>
                <h2>Hồ sơ học tập cá nhân</h2>
                <div className="lp-viewport">
                    <div className={`lp-strip ${direction}`} style={{ transform: `translateX(-${page * 100}%)` }}>
                        {Array.from({ length: totalPages }).map((_, pIdx) => {
                            const idx = pIdx * perPage;
                            const slice = QUESTIONS.slice(idx, idx + perPage);
                            return (
                                <div className="lp-page-panel" key={pIdx}>
                                    {slice.map((q) => {
                                        const parts = q.key.split(".");
                                        let val = form;
                                        for (const part of parts) val = val?.[part];
                                        return (
                                            <div className="lp-field" key={q.key}>
                                                <label className="lp-label">{q.label}</label>
                                                <Field q={q} value={val} onChange={(v) => handleChange(q.key, v)} />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="lp-controls">
                    <button onClick={() => go(page - 1)} disabled={page === 0} className="nav-btn">
                        ◀
                    </button>
                    <div className="lp-page-indicator">
                        {page + 1} / {totalPages}
                    </div>
                    <button onClick={() => go(page + 1)} disabled={page === totalPages - 1} className="nav-btn">
                        ▶
                    </button>
                </div>

                <div className="lp-actions">
                    <button onClick={handleSubmit} disabled={page !== totalPages - 1 || submitting} className="submit-btn">
                        {submitting ? "Đang gửi..." : "Gửi"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyCourses;
