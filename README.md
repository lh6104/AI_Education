# 🎓 AI Education Platform

Nền tảng học tập thông minh sử dụng AI để hỗ trợ học sinh/sinh viên.

## 🚀 Tính năng chính

### 📚 Quản lý bài học
- Xem danh sách bài học
- Theo dõi tiến độ học tập
- Dashboard thống kê học tập

### 🤖 AI Chatbot
- Hỗ trợ giải đáp thắc mắc
- Tìm kiếm tài liệu thông minh
- Gợi ý câu hỏi tiếp theo (Follow-up Questions)

### 📝 Quiz & Kiểm tra
- Tạo quiz tự động bằng AI
- Đánh giá kết quả tức thì
- Xem lịch sử làm bài

### 🎴 Flashcards
- Tạo bộ flashcard theo nhóm
- Học và ôn tập theo spaced repetition

### 🎥 Video Learning
- Nhập URL YouTube để tạo bài giảng
- Tự động trích xuất subtitle
- AI tóm tắt và tạo nội dung học tập

### 🏆 Leaderboard
- Bảng xếp hạng theo tuần
- Theo dõi streak học tập

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database
- **Groq (GPT-OSS 120B)** - LLM
- **yt-dlp** - YouTube subtitle extraction

### Frontend
- **React + Vite** - UI Framework
- **Styled Components** - CSS-in-JS
- **Zustand** - State management
- **Axios** - HTTP client

### Infrastructure
- **Docker** - Containerization
- **Cloudflare Tunnel** - HTTPS proxy

## 📁 Cấu trúc project

```
AI_Education/
├── be/                      # Backend FastAPI
│   ├── controllers/         # API endpoints
│   ├── services/           # Business logic
│   ├── models/             # SQLAlchemy models
│   ├── schemas/            # Pydantic schemas
│   ├── repositories/       # Data access layer
│   └── main.py             # App entry point
│
├── fe/                      # Frontend React
│   ├── src/
│   │   ├── api/            # API clients
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand stores
│   │   └── hooks/          # Custom hooks
│   └── index.html
│
├── docker-compose.yaml      # Docker orchestration
└── README.md
```

## 🚀 Chạy project

### Yêu cầu
- Docker & Docker Compose
- Node.js 20+ (nếu chạy local)
- Python 3.11+ (nếu chạy local)

### Với Docker (Recommended)

```bash
# Clone project
git clone <repo-url>
cd AI_Education

# Tạo file .env từ template
cp .env.example .env
# Điền các API keys vào .env

# Chạy tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f
```

### Truy cập
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔧 Cấu hình

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@db:5432/ai_education

# Groq AI
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b

# JWT
SECRET_KEY=your_secret_key
ALGORITHM=HS256

# CORS
CORS_ORIGINS=http://localhost:5173,https://aitutor.io.vn
```

## 📝 API Endpoints chính

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/v1/auth/login` | POST | Đăng nhập |
| `/api/v1/lessons` | GET | Danh sách bài học |
| `/api/v1/quizzes` | GET | Danh sách quiz |
| `/api/v1/flashcards/groups/{user_id}` | GET | Flashcard groups |
| `/api/v1/ranking` | GET | Bảng xếp hạng |
| `/api/v1/chat/message` | POST | Chat với AI |
