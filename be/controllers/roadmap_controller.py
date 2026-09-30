from typing import Any, Dict, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
import logging
from db import get_db
from services.roadmap_service import RoadmapService
from dependencies.auth import AuthDependencies
from models import User

# match import style used by other controllers
from schemas import Roadmap

router = APIRouter(prefix="/api/v1/roadmaps", tags=["roadmaps"])
logger = logging.getLogger(__name__)


class RoadmapGenerateRequest(BaseModel):
    student_json: Dict[str, Any]
    roadmap_name: Optional[str] = None


@router.post("/generate", response_model=Roadmap)
def generate_roadmap(
    body: RoadmapGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthDependencies.get_current_active_user),
):
    service = RoadmapService(db)
    # print(current_user.id)
    try:
        roadmap = service.generate_and_save_roadmap(
            student_json=body.student_json,
            roadmap_name=body.roadmap_name,
            user_id=current_user.id,
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(re))
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to generate roadmap")

    return roadmap


@router.get("", response_model=List[Roadmap])  # Changed from "/" to ""
def list_roadmaps(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """
    Return paginated list of roadmaps.
    """
    service = RoadmapService(db)
    return service.list_roadmaps(skip=skip, limit=limit)


@router.get("/{roadmap_id}", response_model=Roadmap)
def get_roadmap_detail(
    roadmap_id: int,
    db: Session = Depends(get_db),
):
    """
    Return a roadmap with its sections and courses.
    """
    service = RoadmapService(db)
    roadmap = service.get_roadmap(roadmap_id)
    if not roadmap:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap not found")
    return roadmap


@router.delete("/{roadmap_id}", status_code=status.HTTP_200_OK)
def delete_roadmap(roadmap_id: int, db: Session = Depends(get_db)):
    """
    Delete a roadmap and all related content (sections, courses, chapters, lessons, progress).
    """
    svc = RoadmapService(db)  # RoadmapService expected to accept db in constructor
    try:
        svc.delete_roadmap(roadmap_id)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        logger.exception("Failed to delete roadmap %s: %s", roadmap_id, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete roadmap")
    return {"detail": "Roadmap deleted"}
