from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from db import Base
from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)  # Changed from password to hashed_password
    # store only the SHA-256 hash of refresh tokens (do not store raw tokens)
    refresh_token_hash = Column(String(128), nullable=True)
    role = Column(String(50), nullable=True)
    status = Column(Boolean, default=True)
    daily_streaks = Column(Integer, default=0)
    last_activity = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    progress = relationship("Progress", back_populates="user")
    # quiz_results relationship removed because QuizResult no longer stores user_id
    # quizzes created by this user (owner)
    quizzes = relationship("Quiz", back_populates="user", cascade="all, delete-orphan")
    # roadmaps created by this user
    roadmaps = relationship("Roadmap", back_populates="user", cascade="all, delete-orphan")
    # lessons created by this user (owner)
    lessons = relationship("Lesson", back_populates="user", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=True, index=True)
    order = Column(Integer, default=0, nullable=False)
    name = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)       # short / summary content
    detail = Column(Text, nullable=True)         # detailed lesson content
    estimated_duration = Column(String(64), nullable=True)
    general_info = Column(Text, nullable=True)
    video_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    chapter = relationship("Chapter", back_populates="lessons")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    user = relationship("User", back_populates="lessons")
    progress = relationship("Progress", back_populates="lesson")
    quizzes = relationship("Quiz", back_populates="lesson", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=True, index=True)
    order = Column(Integer, default=0, nullable=False)
    name = Column(String(255), nullable=False)
    estimated_duration = Column(String(64), nullable=True)
    general_info = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    section = relationship("Section", back_populates="courses")
    chapters = relationship("Chapter", back_populates="course", cascade="all, delete-orphan")


class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    roadmap_id = Column(Integer, ForeignKey("roadmap.id"), nullable=True, index=True)
    order = Column(Integer, default=0, nullable=False)
    name = Column(String(255), nullable=False)
    estimated_duration = Column(String(64), nullable=True)
    general_info = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    roadmap = relationship("Roadmap", back_populates="sections")
    courses = relationship("Course", back_populates="section", cascade="all, delete-orphan")


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    order = Column(Integer, default=0, nullable=False)
    name = Column(String(255), nullable=False)
    estimated_duration = Column(String(64), nullable=True)
    general_info = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    course = relationship("Course", back_populates="chapters")
    lessons = relationship("Lesson", back_populates="chapter", cascade="all, delete-orphan")


class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    progress_percent = Column(Float, default=0.0)
    avg_score = Column(Float, default=0.0)
    streak_days = Column(Integer, default=0)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    score = Column(Integer, default=0)  # new score field

    user = relationship("User", back_populates="progress")
    lesson = relationship("Lesson", back_populates="progress")


class Leaderboard(Base):
    __tablename__ = "leaderboard"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_score = Column(Float, default=0.0)
    week = Column(Integer, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")

# -------------------------
# Quiz models (migrated)
# -------------------------

class Quiz(Base):
    __tablename__ = "quiz"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String(50), nullable=True)
    max_score = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=True)

    # relations
    questions = relationship(
        "QuizQuestion",
        back_populates="quiz",
        cascade="all, delete-orphan",
        order_by="QuizQuestion.order_index"
    )
    lesson = relationship("Lesson", back_populates="quizzes")
    user = relationship("User", back_populates="quizzes")
    results = relationship("QuizResult", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("quiz.id"), nullable=False, index=True)
    question = Column(Text, nullable=False)
    options = Column(Text, nullable=True)  # JSON/text of options
    answer = Column(Text, nullable=True)
    question_type = Column(Enum("choice", "essay", "code", name="question_type"), nullable=False)
    score = Column(Float, nullable=True)
    difficulty = Column(Enum("easy", "medium", "hard", name="difficulty_level"), nullable=True)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now(), nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=True)

    quiz = relationship("Quiz", back_populates="questions")


class QuizResult(Base):
    __tablename__ = "quiz_result"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    quiz_id = Column(Integer, ForeignKey("quiz.id"), nullable=False, index=True)
    submitted_answer = Column(Text, nullable=True)
    ai_feedback = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    score = Column(Float, nullable=True)
    reviewed_by = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=True)

    quiz = relationship("Quiz", back_populates="results")

class FlashcardGroup(Base):
    __tablename__ = "flashcard_groups"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_system_created = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    flashcards = relationship("Flashcard", back_populates="group", cascade="all, delete-orphan")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("flashcard_groups.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    example = Column(Text, nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    group = relationship("FlashcardGroup", back_populates="flashcards")

# -------------------------
# Chat Database Models
# -------------------------

class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(String(255), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="New Conversation")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(255), primary_key=True, index=True)
    conversation_id = Column(String(255), ForeignKey("chat_conversations.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    conversation = relationship("ChatConversation", back_populates="messages")


# -------------------------
# Chat Pydantic Models
# -------------------------

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's message")
    conversation_id: Optional[str] = Field(default=None, description="Conversation ID for context")
    use_rag: bool = Field(default=True, description="Whether to use RAG system for context")
    use_student_context: bool = Field(default=True, description="Include student data context for personalization")


class Source(BaseModel):
    title: str = Field(..., description="Source title")
    source: str = Field(..., description="Source identifier")
    content_preview: str = Field(..., description="Preview of content")
    similarity: float = Field(..., ge=0, le=1, description="Relevance score")


class ChatResponse(BaseModel):
    response: str = Field(..., description="AI response text")
    conversation_id: str = Field(..., description="Conversation ID")
    sources: List[Source] = Field(default=[], description="Context sources if using RAG")
    timestamp: datetime = Field(default_factory=datetime.now)


class ConversationSummary(BaseModel):
    id: str = Field(..., description="Conversation ID")
    title: str = Field(..., description="Conversation title")
    last_message: str = Field(..., description="Last message preview")
    updated_at: datetime = Field(..., description="Last update timestamp")
    message_count: int = Field(..., description="Number of messages in conversation")


class MessageData(BaseModel):
    id: str = Field(..., description="Message ID")
    role: str = Field(..., description="Message role (user/assistant/system)")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(..., description="Message timestamp")

class ConversationDetail(BaseModel):
    id: str = Field(..., description="Conversation ID")
    title: str = Field(..., description="Conversation title")
    messages: List[MessageData] = Field(..., description="List of messages")
    created_at: datetime = Field(..., description="Conversation creation time")
    updated_at: datetime = Field(..., description="Last update time")

class Roadmap(Base):
    __tablename__ = "roadmap"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    time_start = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sections = relationship("Section", back_populates="roadmap", cascade="all, delete-orphan")
    user = relationship("User", back_populates="roadmaps")



