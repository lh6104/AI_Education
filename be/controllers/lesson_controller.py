from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from db import get_db
from services.lesson_service import create_or_get_lessons, update_lesson_content_with_ai
import models  # added
import schemas
from services.lesson_service import LessonService
from models import User
from dependencies import AuthDependencies

router = APIRouter(prefix="/api/v1/lessons", tags=["lessons"])


@router.post("/", response_model=schemas.Lesson, status_code=status.HTTP_201_CREATED)
def create_lesson(
    lesson_in: schemas.LessonCreate,
    current_user: User = Depends(AuthDependencies.get_current_user),
    service: LessonService = Depends(),
):
    # ensure lesson is attributed to the creator if not provided
    if not getattr(lesson_in, "user_id", None):
        lesson_in.user_id = int(getattr(current_user, "id", 0) or 0)
    obj = service.create_lesson(lesson_in)
    return obj


@router.get("/get/{lesson_id}", response_model=schemas.Lesson)
def read_lesson(lesson_id: int, service: LessonService = Depends()):
    obj = service.get_lesson(lesson_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return obj


@router.get("", response_model=List[schemas.Lesson])  # Changed from "/" to ""
def list_lessons(service: LessonService = Depends()):
    return service.list_lessons()


@router.put("/update/{lesson_id}", response_model=schemas.Lesson)
def update_lesson(lesson_id: int, lesson_in: schemas.LessonUpdate, service: LessonService = Depends()):
    obj = service.update_lesson(lesson_id, lesson_in)
    if not obj:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return obj


@router.delete("/delete/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(lesson_id: int, service: LessonService = Depends()):
    ok = service.delete_lesson(lesson_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return None


@router.get("/completed_lessons", response_model=int)
def get_completed_lessons(
    current_user: User = Depends(AuthDependencies.get_current_user),
    service: LessonService = Depends(),
):
    user_id = int(getattr(current_user, "id", 0))
    print("Getting completed lessons for user_id:", user_id)
    completed_count = service.get_completed_lessons(user_id)
    return completed_count


@router.get("/dashboard_lessons", response_model=List[schemas.LessonWithProgress])
def get_dashboard_lessons(
    current_user: User = Depends(AuthDependencies.get_current_user),
    service: LessonService = Depends(),
):
    user_id = int(getattr(current_user, "id", 0))
    print("Getting dashboard lessons for user_id:", user_id)
    lessons = service.get_dashboard_lessons(user_id)
    return lessons


@router.post("/chapter/{chapter_id}/generate", response_model=List[schemas.Lesson])
def generate_or_get_lessons_for_chapter(
    chapter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthDependencies.get_current_user),
):
    """
    Generate lessons for a chapter via AI if none exist, otherwise return existing lessons.
    """
    try:
        user_id = int(getattr(current_user, "id", 0) or 0)
        lessons = create_or_get_lessons(db, chapter_id, user_id=user_id)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(re))
    except Exception as e:
        print(e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate lessons")
    return lessons


@router.post("/update_content/{lesson_id}", response_model=schemas.Lesson)
def update_lesson_content(lesson_id: int, db: Session = Depends(get_db)):
    """
    Generate detailed lesson content via AI for the given lesson_id and update the record.
    """
    try:
        lesson = update_lesson_content_with_ai(db, lesson_id)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update lesson content")
    return lesson


@router.get("/mine_with_content", response_model=List[schemas.Lesson])
def list_my_lessons_with_content(
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthDependencies.get_current_user),
):
    """
    Return lessons owned by the current user that have non-empty content.
    """
    user_id = int(getattr(current_user, "id", 0))
    q = (
        db.query(models.Lesson)
        .filter(models.Lesson.user_id == user_id)
        .filter(models.Lesson.content.isnot(None))
        .filter(models.Lesson.content != "")
        .order_by(models.Lesson.created_at.desc())
    )
    return q.all()
