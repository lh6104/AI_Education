import os
import yt_dlp
import glob
import re
import tempfile
from functools import lru_cache
from typing import List
from .groq_client import generate_text

def vtt_to_text(vtt_content: str) -> str:
    """Chuyển file .vtt thành text sạch (không timestamp, không thẻ)."""
    lines = vtt_content.splitlines()
    text_lines = []

    for line in lines:
        if line.strip().startswith("WEBVTT"):
            continue

        # timestamp
        if re.match(r"\d{2}:\d{2}:\d{2}\.\d{3}", line.strip()):
            continue

        # cue id
        if re.match(r"^\d+$", line.strip()):
            continue

        if line.strip():
            text_lines.append(line.strip())

    return " ".join(text_lines)


def chunk_text(text: str, max_chars: int = 3000) -> List[str]:
    """
    Chia text thành nhiều phần không quá max_chars để gửi vào AI.
    3000 chars ≈ 1500–2000 tokens (tuỳ nội dung).
    """
    chunks = []
    words = text.split()

    current = []
    current_len = 0

    for w in words:
        if current_len + len(w) + 1 > max_chars:
            chunks.append(" ".join(current))
            current = []
            current_len = 0

        current.append(w)
        current_len += len(w) + 1

    if current:
        chunks.append(" ".join(current))

    return chunks


def get_youtube_transcript(url: str, lang: str = "en", max_chars_per_chunk: int = 3000):
    """
    - Input: YouTube URL
    - Output:
        {
            "full_text": <toàn bộ transcript>,
            "chunks": [chunk1, chunk2, ...] (để đưa vào AI)
        }
    """
    print(">> Đang dùng yt-dlp để tải subtitle...")

    # Isolate each extraction so concurrent requests cannot overwrite or remove
    # another request's subtitle file.
    with tempfile.TemporaryDirectory(prefix="ai-tutor-youtube-") as temp_dir:
        ydl_opts = {
            "writesubtitles": True,
            "writeautomaticsub": True,
            "subtitleslangs": [lang],
            "skip_download": True,
            "quiet": True,
            "outtmpl": os.path.join(temp_dir, "%(id)s.%(ext)s"),
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        files = glob.glob(os.path.join(temp_dir, "*.vtt"))
        if not files:
            raise Exception("Không tìm thấy phụ đề — video không có subtitle hoặc YouTube chặn.")

        with open(files[0], "r", encoding="utf-8") as f:
            vtt_text = f.read()

    # Convert thành text sạch
    full_text = vtt_to_text(vtt_text)

    # Chia đoạn
    chunks = chunk_text(full_text, max_chars=max_chars_per_chunk)

    return {
        "full_text": full_text,
        "chunks": chunks
    }

def key_point(chunks: List[str]) -> str:
    """Summarize transcript chunks through the configured Groq model."""
    summarized_chunks = []

    # 1️⃣ Tóm tắt từng chunk
    for i in range(len(chunks)):
        prompt = f"""
        Bạn là trợ lý học tập.
        Hãy tóm tắt nội dung sau thành các gạch đầu dòng ngắn gọn, dễ học, giữ ý chính.
        Chunk {i+1}:
        {chunks[i]}
        """
        summary = generate_text(prompt)
        summarized_chunks.append(summary)
    # 2️⃣ Ghép các summary chunk thành 1 prompt tổng hợp
    combined_text = "\n".join(summarized_chunks)
    
    return combined_text

def gen_prompt(summarized_text: str, lesson_title: str = "Bài giảng") -> str:
    """
    Tạo prompt cho AI: nhận một string tóm tắt (summary) và xuất ra bài giảng dạng Markdown + LaTeX + Mermaid nếu có.
    """
    prompt = (
        "Bạn là chuyên gia thiết kế bài giảng, tạo nội dung học tập rõ ràng và logic.\n\n"
        f"Tiêu đề bài học: {lesson_title}\n\n"
        "Nội dung sau là các ý tóm tắt từ video hoặc tài liệu:\n"
        f"{summarized_text}\n\n"

        "Hướng dẫn AI:\n"
        "1. Tổng hợp các ý trên, **tự diễn đạt, không copy nguyên văn**.\n"
        "2. Tạo bài giảng có cấu trúc:\n"
        "   - Mở đầu: giới thiệu chủ đề, tạo bối cảnh học tập.\n"
        "   - Nội dung chính: giải thích các ý theo logic, dùng danh sách gạch đầu dòng khi phù hợp.\n"
        "   - Kết luận: tóm tắt ý chính, nhấn mạnh điểm quan trọng.\n"
        "3. Xuất toàn bộ dưới dạng **Markdown**:\n"
        "   - Giữ LaTeX trong dấu `$...$` hoặc `$$...$$` cho công thức.\n"
        "   - Dùng danh sách Markdown (`-`, `*`) cho bullet points.\n"
        "   - Nếu có sơ đồ, dùng **Mermaid code block**: ```mermaid ... ```.\n"
        "4. Giữ xuống dòng `\\n` nguyên bản, không gộp dòng.\n"
        "5. Trả về **chỉ Markdown + LaTeX + Mermaid nếu có**, không JSON, không giải thích thêm.\n"
        "6. Nội dung phải mạch lạc, liên kết các ý, dễ đọc, dễ học."
    )

    return prompt.strip()

def generate_with_groq(prompt: str) -> str:
    return generate_text(prompt)


    

@lru_cache(maxsize=32)
def final(url: str) -> str:
    """Create and cache a lesson for a video after a successful extraction."""
    result = get_youtube_transcript(url)
    key = key_point(result['chunks'])
    prompt = gen_prompt(key)
    return generate_with_groq(prompt)
