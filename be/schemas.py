from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# -------------------------
# Quiz Enums
# -------------------------

class QuestionType(str, Enum):
    choice = "choice"
    essay = "essay"
    code = "code"


class DifficultyLevel(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


########################################
# Progress schemas
########################################


class ProgressBase(BaseModel):
    user_id: int
    lesson_id: int
    progress_percent: Optional[float] = 0.0
    avg_score: Optional[float] = 0.0
    streak_days: Optional[int] = 0
    last_accessed: Optional[datetime] = None
    score: Optional[float] = 0.0


class ProgressCreate(ProgressBase):
    pass


class ProgressUpdate(BaseModel):
    progress_percent: Optional[float] = None
    avg_score: Optional[float] = None
    streak_days: Optional[int] = None
    last_accessed: Optional[datetime] = None
    score: Optional[float] = None


class ProgressInDBBase(ProgressBase):
    id: int

    class Config:
        orm_mode = True


class Progress(ProgressInDBBase):
    pass


########################################
# User schemas
########################################


class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    role: Optional[str] = None
    status: Optional[bool] = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    status: Optional[bool] = None


class UserInDBBase(UserBase):
    id: int
    daily_streaks: int
    last_activity: datetime
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class User(UserInDBBase):
    pass


########################################
# Lesson schemas
########################################


class LessonBase(BaseModel):
    chapter_id: Optional[int] = None
    order: Optional[int] = 0
    name: str
    content: Optional[str] = None
    detail: Optional[str] = None         # detailed lesson content
    estimated_duration: Optional[str] = None
    general_info: Optional[str] = None
    video_url: Optional[str] = None
    user_id: Optional[int] = None


class LessonCreate(LessonBase):
    pass


class LessonUpdate(BaseModel):
    chapter_id: Optional[int] = None
    order: Optional[int] = None
    name: Optional[str] = None
    content: Optional[str] = None
    detail: Optional[str] = None
    estimated_duration: Optional[str] = None
    general_info: Optional[str] = None
    video_url: Optional[str] = None


class LessonInDBBase(LessonBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class Lesson(LessonInDBBase):
    pass

# new: combined lesson + progress view used by APIs
class LessonWithProgress(BaseModel):
    lesson: Lesson
    progress: Optional[Progress] = None

    class Config:
        orm_mode = True

# -------------------------
# Section / Course / Chapter schemas
# -------------------------

class SectionBase(BaseModel):
    roadmap_id: Optional[int] = None
    order: Optional[int] = 0
    name: str
    estimated_duration: Optional[str] = None
    general_info: Optional[str] = None


class SectionCreate(SectionBase):
    pass


class SectionUpdate(BaseModel):
    roadmap_id: Optional[int] = None
    order: Optional[int] = None
    name: Optional[str] = None
    estimated_duration: Optional[str] = None
    general_info: Optional[str] = None


class SectionInDBBase(SectionBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class Section(SectionInDBBase):
    courses: Optional[List["Course"]] = []


class CourseBase(BaseModel):
    section_id: Optional[int] = None
    order: Optional[int] = 0
    name: str
    estimated_duration: Optional[str] = None
    general_info: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    section_id: Optional[int] = None
    order: Optional[int] = None
    name: Optional[str] = None
    estimated_duration: Optional[str] = None
    general_info: Optional[str] = None


class CourseInDBBase(CourseBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class Course(CourseInDBBase):
    chapters: Optional[List["Chapter"]] = []


class ChapterBase(BaseModel):
    course_id: int
    order: Optional[int] = 0
    name: str
    estimated_duration: Optional[str] = None
    general_info: Optional[str] = None


class ChapterCreate(ChapterBase):
    pass


class ChapterUpdate(BaseModel):
    course_id: Optional[int] = None
    order: Optional[int] = None
    name: Optional[str] = None
    estimated_duration: Optional[str] = None
    general_info: Optional[str] = None


class ChapterInDBBase(ChapterBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class Chapter(ChapterInDBBase):
    lessons: Optional[List["Lesson"]] = []

# ensure forward refs are updated (already present later in file)
Section.update_forward_refs()
Course.update_forward_refs()
Chapter.update_forward_refs()

########################################
# Auth schemas
########################################


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int


class TokenData(BaseModel):
    user_id: int
    email: str
    role: Optional[str] = None
    exp: datetime


class TokenPayload(BaseModel):
    sub: str  # user_id
    email: str
    role: Optional[str] = None
    exp: datetime


class RefreshToken(BaseModel):
    refresh_token: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# -------------------------
# QuizQuestion Schemas
# -------------------------

class QuizQuestionBase(BaseModel):
    question: str
    options: Optional[str] = None
    answer: Optional[str] = None
    question_type: QuestionType
    score: Optional[float] = None
    difficulty: Optional[DifficultyLevel] = None
    order_index: int = 0


class QuizQuestionCreate(QuizQuestionBase):
    quiz_id: int


class QuizQuestionUpdate(BaseModel):
    question: Optional[str] = None
    options: Optional[str] = None
    answer: Optional[str] = None
    question_type: Optional[QuestionType] = None
    score: Optional[float] = None
    difficulty: Optional[DifficultyLevel] = None
    order_index: Optional[int] = None


class QuizQuestionResponse(BaseModel):
    id: int
    quiz_id: int
    question: str
    options: Optional[str] = None
    answer: Optional[str] = None
    question_type: str = "choice"
    score: Optional[float] = 1.0
    difficulty: Optional[str] = "medium"
    order_index: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        orm_mode = True


# Minimal attempt summary for quiz list
class AttemptSummary(BaseModel):
    id: int
    score: Optional[float] = None
    created_at: Optional[datetime] = None


class QuizResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    max_score: Optional[float] = 0.0
    lesson_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    questions: List[QuizQuestionResponse] = []
    attempts: Optional[List[AttemptSummary]] = None  # Add this field

    class Config:
        from_attributes = True
        orm_mode = True


# -------------------------
# Quiz Schemas
# -------------------------

class QuizBase(BaseModel):
    name: Optional[str] = None
    max_score: Optional[float] = None
    lesson_id: Optional[int] = None
    user_id: Optional[int] = None


class QuizCreate(QuizBase):
    pass


class QuizUpdate(BaseModel):
    name: Optional[str] = None
    max_score: Optional[float] = None
    lesson_id: Optional[int] = None


# -------------------------
# QuizResult Schemas
# -------------------------

class QuizResultBase(BaseModel):
    submitted_answer: Optional[str] = None
    ai_feedback: Optional[str] = None
    is_correct: Optional[bool] = None
    score: Optional[float] = None
    reviewed_by: Optional[int] = None


class QuizResultCreate(BaseModel):
    quiz_id: int
    submitted_answer: Optional[str] = None  # Changed from 'answers'
    ai_feedback: Optional[str] = None
    is_correct: Optional[bool] = None
    score: Optional[float] = 0.0
    reviewed_by: Optional[int] = None


class QuizResultUpdate(BaseModel):
    submitted_answer: Optional[str] = None  # Changed from 'answers'
    ai_feedback: Optional[str] = None
    is_correct: Optional[bool] = None
    score: Optional[float] = None
    reviewed_by: Optional[int] = None


class QuizResultResponse(BaseModel):
    id: int
    quiz_id: int
    submitted_answer: Optional[str] = None  # Changed from 'answers'
    ai_feedback: Optional[str] = None
    is_correct: Optional[bool] = None
    score: Optional[float] = None
    reviewed_by: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        orm_mode = True


class GenerateQuizRequest(BaseModel):
    lesson: str
    level: str
    numMCQ: int
    numEssay: int
    lesson_id: Optional[int] = None
    quiz_name: Optional[str] = None


class SubmitAttemptRequest(BaseModel):
    answers: Dict[str, Any]
    duration_seconds: Optional[int] = None
    user_id: Optional[int] = None

# ---------------- FLASHCARD ----------------
class FlashcardBase(BaseModel):
    title: str
    content: str
    example: Optional[str] = None
    note: Optional[str] = None

class FlashcardCreate(FlashcardBase):
    group_id: int

class FlashcardUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    example: Optional[str] = None
    note: Optional[str] = None

class FlashcardResponse(FlashcardBase):
    id: int
    group_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# ---------------- FLASHCARD GROUP ----------------
class FlashcardGroupBase(BaseModel):
    title: str
    description: Optional[str] = None
    lesson_id: Optional[int] = None

class FlashcardGroupCreate(FlashcardGroupBase):
    user_id: int

class FlashcardGroupUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class FlashcardGroupResponse(FlashcardGroupBase):
    id: int
    user_id: int
    is_system_created: bool
    created_at: datetime
    updated_at: datetime
    flashcards: Optional[List[FlashcardResponse]] = []

    class Config:
        orm_mode = True

# --- Roadmap schemas ---
class RoadmapBase(BaseModel):
    name: str
    time_start: Optional[datetime] = None
    user_id: Optional[int] = None


class RoadmapCreate(RoadmapBase):
    pass


class RoadmapUpdate(BaseModel):
    name: Optional[str] = None
    time_start: Optional[datetime] = None
    user_id: Optional[int] = None


class RoadmapInDBBase(RoadmapBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class Roadmap(RoadmapInDBBase):
    sections: Optional[List["Section"]] = []
    user: Optional[User] = None