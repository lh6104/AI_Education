from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session

import schemas
from services.progress_service import ProgressService
from models import User
from dependencies import AuthDependencies

router = APIRouter(prefix="/api/v1/progress", tags=["progress"])

@router.post("/", response_model=schemas.Progress, status_code=status.HTTP_201_CREATED)
def create_progress(progress_in: schemas.ProgressCreate, service: ProgressService = Depends()):
    obj = service.create_progress(progress_in)
    return obj


@router.get("/{progress_id}", response_model=schemas.Progress)
def read_progress(progress_id: int, service: ProgressService = Depends()):
    obj = service.get_progress(progress_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Progress not found")
    return obj


@router.get("/user", response_model=List[schemas.Progress])
def list_by_user(
    current_user: User = Depends(AuthDependencies.get_current_user),
    service: ProgressService = Depends(),
):
    return service.list_by_user(int(getattr(current_user, "id", 0)))


@router.get("/lesson/{lesson_id}", response_model=List[schemas.Progress])
def list_by_lesson(lesson_id: int, service: ProgressService = Depends()):
    return service.list_by_lesson(lesson_id)


@router.put("/{progress_id}", response_model=schemas.Progress)
def update_progress(progress_id: int, progress_in: schemas.ProgressUpdate, service: ProgressService = Depends()):
    obj = service.update_progress(progress_id, progress_in)
    if not obj:
        raise HTTPException(status_code=404, detail="Progress not found")
    return obj

@router.get("/user/total_score", response_model=int)
def get_total_score_by_user(
    current_user: User = Depends(AuthDependencies.get_current_user),
    service: ProgressService = Depends(),
):
    user_id = int(getattr(current_user, "id", 0))
    print("Fetching total score for user_id:", user_id)
    total_score = service.sum_total_score_by_user(user_id)
    return total_score


