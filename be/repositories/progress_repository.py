from typing import List, Optional

from sqlalchemy import func
from models import Progress
import schemas
from fastapi import Depends
from db import get_db


class ProgressRepository:
    def __init__(self, db = Depends(get_db)):
        self.db = db

    def get(self, progress_id: int) -> Optional[Progress]:
        return self.db.query(Progress).filter(Progress.id == progress_id).first()

    def list_by_user(self, user_id: int) -> List[Progress]:
        return self.db.query(Progress).filter(Progress.user_id == user_id).all()

    def list_in_progress_by_user(self, user_id: int, limit: Optional[int] = None) -> List[Progress]:
        """Return Progress rows for a user where progress_percent < 100 ordered by last_accessed desc.
        If limit is provided, apply it.
        """
        q = self.db.query(Progress).filter(Progress.user_id == user_id, Progress.progress_percent < 100.0).order_by(Progress.last_accessed.desc())
        if limit:
            q = q.limit(limit)
        return q.all()

    def list_by_lesson(self, lesson_id: int) -> List[Progress]:
        return self.db.query(Progress).filter(Progress.lesson_id == lesson_id).all()

    def create(self, progress_in: schemas.ProgressCreate) -> Progress:
        db_obj = Progress(**progress_in.dict())
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, progress_id: int, progress_in: schemas.ProgressUpdate) -> Optional[Progress]:
        obj = self.get(progress_id)
        if not obj:
            return None
        for field, value in progress_in.dict(exclude_unset=True).items():
            setattr(obj, field, value)
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def delete(self, progress_id: int) -> bool:
        obj = self.get(progress_id)
        if not obj:
            return False
        self.db.delete(obj)
        self.db.commit()
        return True
    
    def sum_total_score_by_user(self, user_id: int) -> int:
        print("Calculating total score for user_id:", user_id)
        total = self.db.query(Progress).filter(Progress.user_id == user_id, Progress.progress_percent == 100).with_entities(func.sum(Progress.score)).scalar()
        return total if total is not None else 0

    def count_completed_by_user(self, user_id: int) -> int:
        print("Counting completed lessons for user_id:", user_id)
        return self.db.query(Progress).filter(Progress.user_id == user_id, Progress.progress_percent == 100.0).count()

