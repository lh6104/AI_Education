from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from db import get_db
from services.quizz_service import QuizService
from dependencies.auth import AuthDependencies
from models import User  # added
from repositories.lesson_repository import LessonRepository
from schemas import QuizResponse, QuizResultResponse, GenerateQuizRequest, SubmitAttemptRequest

router = APIRouter(prefix="/api/v1/quizzes", tags=["Quizzes"])


# -------------------------
# Quiz Endpoints
# -------------------------


@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    """Get quiz by ID with all questions (without attempts)"""
    service = QuizService(db)
    return service.get_quiz(quiz_id)


@router.get("/{quiz_id}/attempts", response_model=List[QuizResultResponse])
def get_quiz_attempts(quiz_id: int, db: Session = Depends(get_db)):
    """Get all attempts/results for a specific quiz"""
    service = QuizService(db)
    return service.get_quiz_attempts(quiz_id)


@router.get("", response_model=List[QuizResponse])  # Changed from "/" to "" to avoid 307 redirect
def get_all_quizzes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    include_attempts: bool = Query(True, description="Include attempt summaries"),
    db: Session = Depends(get_db),
):
    """Get all quizzes with pagination and optional attempt summaries"""
    service = QuizService(db)
    return service.get_all_quizzes(skip, limit, include_attempts)


@router.delete("/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db)):
    """Delete quiz"""
    service = QuizService(db)
    return service.delete_quiz(quiz_id)


@router.post("/generate", response_model=QuizResponse, status_code=201)
def generate_quiz(
    payload: GenerateQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthDependencies.get_current_active_user),  # added dependency
):
    """
    Generate quiz using AI and persist to DB.
    The created quiz will be associated with the authenticated user.
    """
    service = QuizService(db)
    # If a lesson_id is provided, fetch lesson and use its `content` as prompt reference.
    lesson_text = payload.lesson
    if payload.lesson_id:
        lr = LessonRepository(db)
        lesson_obj = lr.get(payload.lesson_id)
        if not lesson_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Selected lesson not found")
        if not getattr(lesson_obj, "content", None) or not str(lesson_obj.content).strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selected lesson has no content")
        lesson_text = lesson_obj.content

    return service.generate_quiz_with_ai(
        lesson=lesson_text,
        level=payload.level,
        numMCQ=payload.numMCQ,
        numEssay=payload.numEssay,
        lesson_id=payload.lesson_id,
        quiz_name=payload.quiz_name,
        user_id=current_user.id,
    )


@router.post("/{quiz_id}/attempts", response_model=QuizResultResponse, status_code=201)
def submit_attempt(
    quiz_id: int,
    request: SubmitAttemptRequest,
    db: Session = Depends(get_db),
):
    """Submit answers for a quiz, auto-score MCQs, save result"""
    service = QuizService(db)
    return service.submit_attempt(
        quiz_id=quiz_id,
        answers=request.answers,
        duration_seconds=request.duration_seconds,
    )
