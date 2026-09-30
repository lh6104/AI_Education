from typing import List, Optional

from sqlalchemy.orm import Session

import models, schemas


def get_roadmap(db: Session, roadmap_id: int) -> Optional[models.Roadmap]:
    return db.query(models.Roadmap).filter(models.Roadmap.id == roadmap_id).first()

def list_roadmaps(db: Session, skip: int = 0, limit: int = 100) -> List[models.Roadmap]:
    return db.query(models.Roadmap).order_by(models.Roadmap.created_at.desc(), models.Roadmap.id.asc()).offset(skip).limit(limit).all()


def create_roadmap(db: Session, roadmap_in: schemas.RoadmapCreate) -> models.Roadmap:
    obj = models.Roadmap(
        name=roadmap_in.name,
        time_start=roadmap_in.time_start,
        user_id=getattr(roadmap_in, "user_id", None),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_roadmap(db: Session, roadmap_id: int, roadmap_in: schemas.RoadmapUpdate) -> Optional[models.Roadmap]:
    obj = get_roadmap(db, roadmap_id)
    if not obj:
        return None
    data = roadmap_in.dict(exclude_unset=True)
    for field, value in data.items():
        setattr(obj, field, value)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def delete_roadmap(db: Session, roadmap_id: int) -> bool:
    obj = get_roadmap(db, roadmap_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True