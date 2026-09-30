# AI Education Platform — Project Resume

> Full-stack AI-powered learning management system serving students and educators with personalized roadmaps, AI-generated content, intelligent tutoring, and adaptive assessments.  
> **Live:** [https://aitutor.io.vn](https://aitutor.io.vn)

---

## 1. Project Overview

| Attribute | Detail |
|-----------|--------|
| **Role** | Full-Stack Developer (Solo / Team Lead) |
| **Duration** | 2025 – Present |
| **Team Size** | 1–3 |
| **Domain** | EdTech · AI · LLM Integration |
| **Users** | Students & educators at university level |

**AI Education Platform** is a production-grade LMS that combines traditional learning management with cutting-edge LLM capabilities. The system generates entire learning roadmaps, lesson content, quizzes, and flashcards on-demand via AI, while providing a conversational AI tutor that can search uploaded documents, browse the web, and personalize responses based on individual student progress.

---

## 2. Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Python 3.11+** | Core language |
| **FastAPI** | Async REST API framework with automatic OpenAPI docs |
| **SQLAlchemy 2.0** | ORM with relationship mapping for 12+ models |
| **Pydantic v2** | Request/response validation & serialization |
| **LangChain + Groq** | LLM orchestration with tool-calling (GPT-OSS 120B) |
| **Google Custom Search API** | Real-time web search tool for AI chatbot |
| **yt-dlp** | YouTube subtitle extraction & video processing |
| **python-jose + passlib** | JWT auth with SHA-256 hashed refresh tokens |
| **Authlib / httpx** | OAuth 2.0 (Google & Facebook) |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **Vite 7** | Build tool & dev server |
| **MUI (Material UI) 7** | Component library |
| **Styled Components** | CSS-in-JS styling |
| **Zustand** | Lightweight global state management |
| **React Router v6** | Client-side routing with protected routes |
| **React Query (TanStack)** | Server state, caching & data synchronization |
| **react-markdown + KaTeX + Mermaid** | Rich content rendering (Markdown, LaTeX math, diagrams) |
| **Axios** | HTTP client with interceptors |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Docker & Docker Compose** | Multi-service containerization (backend, frontend, tunnel) |
| **Cloudflare Tunnel** | Zero-trust HTTPS exposure without port forwarding |
| **Nginx** | Production static file serving & reverse proxy |

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Cloudflare Tunnel                         │
│                    (HTTPS / Zero-Trust)                       │
└──────────────┬──────────────────────────┬────────────────────┘
               │                          │
       ┌───────▼───────┐          ┌───────▼───────┐
       │   Frontend     │          │   Backend API  │
       │   React/Vite   │◄────────►│   FastAPI      │
       │   Port 5173    │  REST    │   Port 8000    │
       └───────────────┘          └───────┬───────┘
                                          │
                          ┌───────────────┼───────────────┐
                          │               │               │
                   ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
                   │  SQLAlchemy  │ │  Groq LLM   │ │  Google     │
                   │  (SQLite/    │ │  (GPT-OSS   │ │  Custom     │
                   │   Postgres)  │ │   120B)     │ │  Search API │
                   └─────────────┘ └─────────────┘ └─────────────┘
```

### Layered Backend Architecture (Clean Architecture)

```
Controllers (API Layer)
    └── Services (Business Logic)
        └── Repositories (Data Access)
            └── Models (SQLAlchemy ORM)
                └── Schemas (Pydantic Validation)
```

- **15 API Controllers** — auth, users, lessons, quizzes, flashcards, chat, roadmaps, chapters, files, health, progress, leaderboard, ranking, YouTube, student context
- **20 Service modules** — including AI prompt engineering, chat tools, OAuth, video processing, file search, student personalization
- **12 Repository classes** — enforcing single-responsibility data access

---

## 4. Key Features & Engineering Highlights

### 4.1 AI-Powered Learning Roadmap Generator

- Accepts student profile (goals, background, strengths, weaknesses, available time)
- Calls Groq LLM with structured prompts to generate a **hierarchical curriculum**: `Roadmap → Sections → Courses → Chapters → Lessons`
- Each level is persisted with proper foreign-key relationships and ordering
- **Lazy lesson content generation**: Lesson detail is generated on-demand when a student first opens it, reducing initial API latency
- Robust JSON parser with **auto-repair** for truncated/noisy LLM outputs (handles unclosed brackets, escaped newlines, fenced code blocks)

### 4.2 AI Chatbot with Tool-Calling (Agentic RAG)

- Conversational AI tutor powered by **LangChain + Groq (GPT-OSS 120B)**
- Implements **native tool-calling** with 3 tools:
  - `search_documents` — searches user-uploaded files using local file retrieval with TF-based chunk ranking
  - `get_my_context` — fetches personalized student progress, quiz history, and learning streaks
  - `search_web` — real-time Google Custom Search API integration
- **System prompt engineering**: Dynamic prompt composition with private context injection (`<PRIVATE_CONTEXT>` blocks) that instructs the model to reason over but never expose raw context
- **Follow-up question generation**: Every response includes 3–5 contextual follow-up suggestions
- **Conversation persistence**: Full chat history stored in DB with configurable sliding-window context (default: 10 messages)
- **File upload & RAG**: Users upload PDFs/documents per conversation → files stored locally → chunked with overlapping windows (1600 chars, 200 overlap) → ranked by term-frequency scoring

### 4.3 AI Quiz Generation & Auto-Grading

- Generates MCQ + essay questions from lesson content via structured AI prompts
- **MCQ auto-scoring** with answer normalization (handles "A", "A.", "A) Answer text" formats)
- **Essay AI grading** via LLM — supports bulk grading (single prompt for all essays) with per-question fallback
- Quiz attempt tracking with score history and leaderboard integration

### 4.4 Video-to-Lesson Pipeline

- Extracts YouTube subtitles via **yt-dlp** (supports auto-generated captions)
- VTT → plain text conversion with timestamp/tag stripping
- **Multi-pass summarization**: Chunks transcript → summarizes each chunk → combines summaries → generates full Markdown lesson with LaTeX formulas and Mermaid diagrams
- Results cached with `@lru_cache` to avoid redundant processing

### 4.5 Authentication & Security

- **JWT-based auth** with separate access tokens (30 min) and refresh tokens (30 days)
- Refresh tokens stored as **SHA-256 hashes only** — raw tokens never persisted
- **OAuth 2.0** integration with Google and Facebook providers
- Token rotation on refresh (old token invalidated)
- **Rate limiting middleware** with configurable RPM/RPH thresholds
- CORS configuration with environment-driven allowed origins

### 4.6 Flashcard System

- Grouped flashcards with spaced-repetition practice
- AI-generated flashcard sets from lesson content
- Flip-card practice interface

### 4.7 Student Progress & Gamification

- Per-lesson progress tracking (percentage, score, last accessed)
- Daily streak tracking with automatic reset logic
- Weekly leaderboard with aggregated scores
- Dashboard with in-progress lessons and completion statistics

---

## 5. Frontend Architecture

### State Management
- **Zustand** store for auth state (token management, user session)
- **React Query** for server state (lessons, quizzes, chat) with automatic refetch and cache invalidation

### Rich Content Rendering
- `react-markdown` with plugins: `remark-gfm` (tables, strikethrough), `remark-math` + `rehype-katex` (LaTeX), `rehype-raw` (HTML)
- **Mermaid 11** integration for rendering flowcharts, sequence diagrams, class diagrams, ER diagrams
- Code syntax highlighting in AI responses

### Page Structure (12+ pages)
| Page | Description |
|------|-------------|
| Home | Dashboard with progress overview and recent lessons |
| My Courses | Roadmap list & detail with section/course/chapter hierarchy |
| Library | Lesson browser |
| Tests | Quiz list, detail, attempt with timer |
| Flashcards | Group management, detail view, flip practice |
| Chatbot | AI tutor with file upload, conversation history |
| Video | YouTube URL input → AI-generated lesson viewer |
| Ranking | Weekly leaderboard |
| History | Learning activity log |

### Auth Flow
- Protected routes via `ProtectedRoute` wrapper component
- Login / Register pages with form validation
- OAuth success callback handler (`/auth/success`)

---

## 6. API Design

RESTful API with versioned endpoints (`/api/v1/`):

| Module | Key Endpoints | Methods |
|--------|---------------|---------|
| **Auth** | `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/google`, `/auth/facebook` | POST, GET |
| **Chat** | `/chat/message`, `/chat/conversations`, `/chat/conversations/{id}` | POST, GET, DELETE |
| **Files** | `/files/upload`, `/files/conversations/{id}/files` | POST, GET, DELETE |
| **Lessons** | `/lessons`, `/lessons/{id}`, `/lessons/dashboard` | GET, POST, PUT, DELETE |
| **Quizzes** | `/quizzes`, `/quizzes/generate`, `/quizzes/{id}/submit`, `/quizzes/{id}/attempts` | GET, POST |
| **Flashcards** | `/flashcards/groups/{user_id}`, `/flashcards/{id}` | GET, POST, PUT, DELETE |
| **Roadmaps** | `/roadmaps`, `/roadmaps/{id}`, `/roadmaps/generate` | GET, POST, DELETE |
| **Chapters** | `/chapters/{id}`, `/chapters/{id}/lessons` | GET, POST |
| **Ranking** | `/ranking` | GET |
| **Progress** | `/progress/{user_id}` | GET, PUT |
| **Health** | `/health`, `/health/detailed` | GET |

Auto-generated **Swagger/OpenAPI** docs at `/docs`.

---

## 7. Database Schema

12+ tables with proper relational modeling:

```
User ──┬── Progress ──── Lesson ──── Chapter ──── Course ──── Section ──── Roadmap
       ├── Quiz ──┬── QuizQuestion
       │          └── QuizResult
       ├── ChatConversation ──── ChatMessage
       ├── FlashcardGroup ──── Flashcard
       └── Leaderboard
```

Key design decisions:
- **Hierarchical curriculum**: `Roadmap → Section → Course → Chapter → Lesson` with cascading deletes
- **Quiz system**: Supports `choice`, `essay`, and `code` question types with difficulty levels (`easy`, `medium`, `hard`)
- **Chat persistence**: Conversation-level organization with ordered messages
- **File storage**: Local file system with metadata tracking per conversation

---

## 8. DevOps & Deployment

```yaml
# Docker Compose orchestration (4 services)
services:
  backend:     # FastAPI + Uvicorn
  frontend:    # Node.js dev server / Nginx production
  tunnel:      # Cloudflare Tunnel for HTTPS
  # quiz_service: # Standalone quiz microservice (optional)
```

- **Health checks** on backend with automatic restart policies
- **Volume mounting** for hot-reload development
- **Environment-driven configuration** via `.env` files (12+ environment variables)
- **Production deployment** with Nginx serving static React build + API proxy

---

## 9. Engineering Practices

| Practice | Implementation |
|----------|----------------|
| **Clean Architecture** | Controller → Service → Repository → Model layered design |
| **Dependency Injection** | FastAPI's `Depends()` for service composition |
| **Structured Logging** | Python `logging` with module-level loggers, emoji-tagged operations |
| **Error Handling** | Graceful degradation (e.g., essay grading failure doesn't block quiz submission) |
| **Concurrency Control** | Per-chapter generation locks prevent duplicate AI calls |
| **Singleton Pattern** | `AsyncFileUploadService` with `__new__` singleton for shared state |
| **Prompt Engineering** | Centralized prompt templates in `ai_prompts.py` with Mermaid compatibility rules |
| **Robust JSON Parsing** | Multi-strategy parser handling truncated outputs, fenced blocks, smart quotes, unescaped newlines |
| **Background Processing** | `asyncio.create_task` for non-blocking file uploads with progress tracking |
| **Security** | Hashed refresh tokens, OAuth 2.0, rate limiting, CORS, JWT rotation |

---

## 10. Impact & Metrics

| Metric | Value |
|--------|-------|
| Lines of Code (Backend) | ~5,000+ |
| Lines of Code (Frontend) | ~8,000+ |
| API Endpoints | 30+ |
| Database Models | 12+ |
| AI Service Integrations | 3 (Groq LLM, Google Search, YouTube) |
| Supported Auth Methods | 3 (Email/Password, Google OAuth, Facebook OAuth) |

---

## 11. Resume Bullet Points (Copy-Paste Ready)

### Short Version (2–3 bullets)
- Built a **full-stack AI tutoring platform** (FastAPI + React) serving university students with AI-generated roadmaps, lessons, quizzes, and a conversational chatbot powered by Groq LLM (GPT-OSS 120B)
- Engineered an **agentic RAG chatbot** with LangChain tool-calling — integrating document search, student context personalization, and Google web search to deliver context-aware educational responses
- Containerized with **Docker Compose** and deployed via **Cloudflare Tunnel** with JWT auth (SHA-256 hashed refresh tokens), OAuth 2.0 (Google/Facebook), and configurable rate limiting

### Detailed Version (5–7 bullets)
- Architected and developed a **full-stack AI-powered education platform** (FastAPI + React 19 + SQLAlchemy) with 30+ REST API endpoints, 12+ database models, and 15 controllers following clean architecture principles
- Designed an **AI roadmap generator** that creates personalized 5-level learning curricula (Roadmap → Section → Course → Chapter → Lesson) from student profiles, with on-demand AI lesson content generation and Mermaid diagram support
- Built an **agentic RAG chatbot** using LangChain + Groq (GPT-OSS 120B) with native tool-calling: document search (TF-based chunk ranking), student context retrieval, and Google Custom Search API — achieving personalized, context-aware tutoring
- Implemented an **AI quiz engine** supporting auto-generated MCQ/essay questions, MCQ auto-scoring with answer normalization, and LLM-based essay grading with bulk/per-question fallback strategies
- Developed a **video-to-lesson pipeline** using yt-dlp for YouTube subtitle extraction, multi-pass AI summarization, and Markdown + LaTeX + Mermaid lesson generation with LRU caching
- Engineered **secure auth** with JWT access/refresh tokens (SHA-256 hashed storage), OAuth 2.0 (Google & Facebook), and configurable rate-limiting middleware
- Deployed with **Docker Compose** (4 services) behind **Cloudflare Tunnel** for zero-trust HTTPS, with health checks, hot-reload dev mode, and environment-driven configuration

---

## 12. How to Run

```bash
# Clone and configure
git clone <repo-url>
cd AI_Education
cp .env.example .env
# Fill in GROQ_API_KEY, GOOGLE_SEARCH_API_KEY, etc.

# Start all services
docker-compose up -d

# Access
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```
