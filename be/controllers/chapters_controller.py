from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db import get_db
from services.chapters_service import create_or_get_chapters
from repositories.chapters_repository import get_chapter, list_chapters as repo_list_chapters
from schemas import Chapter

router = APIRouter(prefix="/api/v1/chapters", tags=["chapters"])


class GenerateChaptersRequest(BaseModel):
    course_id: int


@router.post("/generate", response_model=List[Chapter])
def generate_chapters(body: GenerateChaptersRequest, db: Session = Depends(get_db)):
    """
    Create chapters for a course via AI if none exist, otherwise return existing chapters.
    """
    try:
        chapters = create_or_get_chapters(db, body.course_id)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(re))
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate chapters")
    return chapters


@router.get("", response_model=List[Chapter])  # Changed from "/" to ""
def list_all_chapters(
    course_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return repo_list_chapters(db, course_id=course_id, skip=skip, limit=limit)


@router.get("/{chapter_id}", response_model=Chapter)
def get_chapter_detail(chapter_id: int, db: Session = Depends(get_db)):
    obj = get_chapter(db, chapter_id)
    if not obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")
    return obj
