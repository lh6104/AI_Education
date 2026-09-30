import React, { useState } from "react";
import MarkdownWithMermaid from "./MarkdownWithMermaid";
import { API_URL } from "../../api/config";

const Video = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [videoId, setVideoId] = useState(null);

  // Hàm lấy videoId từ URL YouTube
  const getYouTubeVideoId = (inputUrl) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = inputUrl.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  // Xử lý hiển thị video
  const handleShowVideo = () => {
    const id = getYouTubeVideoId(url);
    if (id) {
      setVideoId(id);
    } else {
      setError("URL YouTube không hợp lệ.");
    }
  };

  // Xử lý tải nội dung bài giảng
  const handleLoadContent = async () => {
    if (!url) return;
    setLoading(true);
    setError("");
    setContent("");

    try {
      const res = await fetch(`${API_URL}/api/parse-youtube`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Unable to load video content.");
      }
      setContent(data.content);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 32,
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ color: "#003366" }}>Học video cùng AI</h2>

      {/* Input + Button */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <input
          type="text"
          placeholder="Nhập link YouTube..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #99c2ff",
            outline: "none",
            fontSize: 16,
          }}
        />
        <button
          onClick={handleShowVideo}
          style={{
            padding: "10px 16px",
            backgroundColor: "#28a745",
            color: "white",
            fontWeight: "bold",
            fontSize: 16,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#218838")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#28a745")}
        >
          Xem video
        </button>
        <button
          onClick={handleLoadContent}
          disabled={loading || !url}
          style={{
            padding: "10px 16px",
            backgroundColor: "#0066cc",
            color: "white",
            fontWeight: "bold",
            fontSize: 16,
            border: "none",
            borderRadius: 8,
            cursor: loading || !url ? "not-allowed" : "pointer",
            opacity: loading || !url ? 0.65 : 1,
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#0052a3")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#0066cc")}
        >
          {loading ? "Đang tải..." : "Tải nội dung"}
        </button>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ marginTop: 16, color: "#003366" }}>Đang tải...</div>
      )}
      {error && (
        <div style={{ marginTop: 16, color: "red", fontWeight: "bold" }}>
          {error}
        </div>
      )}

      {/* Video */}
      {videoId && (
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <iframe
            width="560"
            height="315"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: 12 }}
          ></iframe>
        </div>
      )}

      {/* Nội dung tóm tắt */}
      {content && (
        <div
          style={{
            marginTop: 24,
            backgroundColor: "white",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <MarkdownWithMermaid content={content} />
        </div>
      )}
    </div>
  );
};

export default Video;
